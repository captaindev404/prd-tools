/**
 * Email queue management system
 * Handles batching, scheduling, and user preference filtering
 */

import { prisma } from '@/lib/prisma';
import { generateEmailFromTemplate, type EmailTemplateType, type TemplateParams } from './email-templates';
import { sendEmailWithLogging, sendBulkEmails } from './sendgrid-client';
import { ulid } from 'ulid';

export interface QueuedEmail<T extends EmailTemplateType = EmailTemplateType> {
  userId: string;
  email: string;
  templateType: T;
  templateParams: TemplateParams[T];
  scheduledFor?: Date;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Generate unsubscribe token for a user
 */
function generateUnsubscribeToken(): string {
  return ulid();
}

/**
 * Get or create notification preferences for a user
 */
export async function getOrCreateNotificationPreferences(userId: string) {
  let prefs = await prisma.notificationPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) {
    prefs = await prisma.notificationPreferences.create({
      data: {
        userId,
        unsubscribeToken: generateUnsubscribeToken(),
      },
    });
  }

  return prefs;
}

/**
 * Check if user wants to receive a specific type of email
 */
export async function shouldSendEmail(userId: string, templateType: EmailTemplateType): Promise<boolean> {
  const prefs = await getOrCreateNotificationPreferences(userId);

  // Map template types to preference fields
  const preferenceMap: Record<EmailTemplateType, string | null> = {
    welcome: null, // Always send welcome emails
    feedback_update: 'feedbackUpdates',
    roadmap_update: 'roadmapUpdates',
    questionnaire_invite: 'researchInvites',
    weekly_digest: 'weeklyDigest',
  };

  const prefField = preferenceMap[templateType];

  // If no preference field, always send (e.g., welcome email)
  if (!prefField) {
    return true;
  }

  // Check weekly digest boolean preference
  if (prefField === 'weeklyDigest') {
    return prefs.weeklyDigest;
  }

  // Check frequency preferences (real_time, daily, weekly, never)
  const prefValue = prefs[prefField as keyof typeof prefs];
  if (typeof prefValue === 'string') {
    return prefValue !== 'never';
  }

  return true;
}

/**
 * Queue a single email for sending
 * Respects user notification preferences
 */
export async function queueEmail<T extends EmailTemplateType>(options: QueuedEmail<T>): Promise<{
  success: boolean;
  emailLogId?: string;
  skipped?: boolean;
  reason?: string;
}> {
  const { userId, email, templateType, templateParams, priority = 'normal' } = options;

  // Check if user wants to receive this type of email
  const shouldSend = await shouldSendEmail(userId, templateType);
  if (!shouldSend) {
    return {
      success: false,
      skipped: true,
      reason: 'User has disabled this notification type',
    };
  }

  // Get user preferences for unsubscribe token
  const prefs = await getOrCreateNotificationPreferences(userId);

  // Generate email content from template
  const { html, text, subject } = generateEmailFromTemplate(templateType, templateParams);

  // Send email immediately (for now - could be enhanced with actual queuing)
  const result = await sendEmailWithLogging({
    to: email,
    subject,
    html,
    text,
    userId,
    templateType,
    metadata: {
      templateParams,
      priority,
    },
    unsubscribeToken: prefs.unsubscribeToken,
  });

  return {
    success: result.success,
    emailLogId: result.emailLogId,
  };
}

/**
 * Queue multiple emails for batch sending
 * Automatically filters based on user preferences
 */
export async function queueBulkEmails<T extends EmailTemplateType>(
  emails: QueuedEmail<T>[]
): Promise<{
  success: boolean;
  sent: number;
  skipped: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> {
  const results = {
    success: true,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  // Filter emails based on user preferences
  const emailsToSend = [];

  for (const emailOptions of emails) {
    const shouldSend = await shouldSendEmail(emailOptions.userId, emailOptions.templateType);
    if (!shouldSend) {
      results.skipped++;
      continue;
    }

    // Get user preferences for unsubscribe token
    const prefs = await getOrCreateNotificationPreferences(emailOptions.userId);

    // Generate email content
    const { html, text, subject } = generateEmailFromTemplate(emailOptions.templateType, emailOptions.templateParams);

    emailsToSend.push({
      to: emailOptions.email,
      subject,
      html,
      text,
      userId: emailOptions.userId,
      templateType: emailOptions.templateType,
      metadata: {
        templateParams: emailOptions.templateParams,
        priority: emailOptions.priority || 'normal',
      },
      unsubscribeToken: prefs.unsubscribeToken,
    });
  }

  // Send emails in bulk
  if (emailsToSend.length > 0) {
    const sendResult = await sendBulkEmails(emailsToSend);
    results.sent = sendResult.successCount;
    results.failed = sendResult.failureCount;
    results.errors = sendResult.errors;
    results.success = sendResult.success;
  }

  return results;
}

/**
 * Send welcome email to a new user
 */
export async function sendWelcomeEmail(userId: string, email: string, displayName: string, language: 'en' | 'fr' = 'en') {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return queueEmail({
    userId,
    email,
    templateType: 'welcome',
    templateParams: {
      displayName,
      dashboardLink: `${APP_URL}/dashboard`,
      language,
    },
    priority: 'high',
  });
}

/**
 * Send feedback update notification
 */
export async function sendFeedbackUpdateEmail(
  userId: string,
  email: string,
  feedbackTitle: string,
  feedbackId: string,
  updateType: 'status_change' | 'comment' | 'merged' | 'in_roadmap',
  language: 'en' | 'fr' = 'en',
  additionalParams?: {
    oldStatus?: string;
    newStatus?: string;
    comment?: string;
    commenterName?: string;
  }
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return queueEmail({
    userId,
    email,
    templateType: 'feedback_update',
    templateParams: {
      feedbackTitle,
      feedbackId,
      updateType,
      link: `${APP_URL}/feedback/${feedbackId}`,
      language,
      ...additionalParams,
    },
  });
}

/**
 * Send roadmap update notification
 */
export async function sendRoadmapUpdateEmail(
  userId: string,
  email: string,
  title: string,
  stage: 'now' | 'next' | 'later' | 'under_consideration',
  summary: string,
  roadmapId: string,
  language: 'en' | 'fr' = 'en'
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return queueEmail({
    userId,
    email,
    templateType: 'roadmap_update',
    templateParams: {
      title,
      stage,
      summary,
      link: `${APP_URL}/roadmap/${roadmapId}`,
      language,
    },
  });
}

/**
 * Send questionnaire invitation
 */
export async function sendQuestionnaireInviteEmail(
  userId: string,
  email: string,
  questionnaireTitle: string,
  questionnaireId: string,
  deadline: string | null,
  language: 'en' | 'fr' = 'en'
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return queueEmail({
    userId,
    email,
    templateType: 'questionnaire_invite',
    templateParams: {
      questionnaireTitle,
      deadline,
      link: `${APP_URL}/research/questionnaires/${questionnaireId}`,
      language,
    },
    priority: 'high',
  });
}

/**
 * Send weekly digest to users (batch operation)
 */
export async function sendWeeklyDigests(
  digests: Array<{
    userId: string;
    email: string;
    language: 'en' | 'fr';
    weekStart: string;
    weekEnd: string;
    topFeedback: Array<{ title: string; id: string; link: string; metadata?: string }>;
    newRoadmapItems: Array<{ title: string; id: string; link: string; metadata?: string }>;
    completedItems: Array<{ title: string; id: string; link: string; metadata?: string }>;
    userStats: {
      feedbackSubmitted: number;
      votesGiven: number;
      commentsPosted: number;
    };
  }>
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const emails = digests.map((digest) => ({
    userId: digest.userId,
    email: digest.email,
    templateType: 'weekly_digest' as const,
    templateParams: {
      ...digest,
      link: `${APP_URL}/dashboard`,
    },
    priority: 'low' as const,
  }));

  return queueBulkEmails(emails);
}
