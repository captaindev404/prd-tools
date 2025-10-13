/**
 * SendGrid client wrapper with enhanced logging and error handling
 */

import * as sgMail from '@sendgrid/mail';
import { prisma } from '@/lib/prisma';
import type { EmailTemplateType } from './email-templates';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@gentil-feedback.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Gentil Feedback';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (SENDGRID_API_KEY && !IS_DEVELOPMENT) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  userId?: string;
  templateType: EmailTemplateType;
  metadata?: Record<string, unknown>;
  unsubscribeToken?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  emailLogId: string;
}

/**
 * Send a single email via SendGrid with database logging
 */
export async function sendEmailWithLogging(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text, userId, templateType, metadata = {}, unsubscribeToken } = options;

  // Create email log entry
  const emailLog = await prisma.emailLog.create({
    data: {
      userId,
      to,
      subject,
      templateType,
      status: 'pending',
      metadata: JSON.stringify(metadata),
    },
  });

  try {
    // Development mode: log instead of sending
    if (IS_DEVELOPMENT || !SENDGRID_API_KEY) {
      console.log('📧 [DEV MODE] Email would be sent:');
      console.log('  To:', to);
      console.log('  Subject:', subject);
      console.log('  Template:', templateType);
      console.log('  Text Preview:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

      // Update log as sent
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'sent',
          messageId: `dev-mode-${Date.now()}`,
          sentAt: new Date(),
        },
      });

      return {
        success: true,
        messageId: `dev-mode-${Date.now()}`,
        emailLogId: emailLog.id,
      };
    }

    // Add unsubscribe link to HTML and text if token provided
    let finalHtml = html;
    let finalText = text;

    if (unsubscribeToken) {
      const unsubscribeLink = `${APP_URL}/unsubscribe?token=${unsubscribeToken}`;
      finalHtml = html.replace(
        '</body>',
        `<div style="text-align: center; padding: 20px; font-size: 12px; color: #999999;">
          <a href="${unsubscribeLink}" style="color: #999999; text-decoration: underline;">Unsubscribe from these emails</a>
        </div></body>`
      );
      finalText = `${text}\n\nUnsubscribe: ${unsubscribeLink}`;
    }

    // Send email via SendGrid
    const msg = {
      to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject,
      text: finalText,
      html: finalHtml,
    };

    const [response] = await sgMail.send(msg);
    const messageId = response.headers['x-message-id'] as string;

    // Update log as sent
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'sent',
        messageId,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      messageId,
      emailLogId: emailLog.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }

    // Update log as failed
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'failed',
        error: errorMessage,
      },
    });

    return {
      success: false,
      error: errorMessage,
      emailLogId: emailLog.id,
    };
  }
}

/**
 * Send bulk emails with rate limiting and error handling
 */
export async function sendBulkEmails(
  emails: Array<Omit<SendEmailOptions, 'templateType'> & { templateType: EmailTemplateType }>
): Promise<{
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: Array<{ email: string; error: string }>;
}> {
  const results = {
    success: true,
    successCount: 0,
    failureCount: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  // Send emails in batches to avoid rate limits (100 per batch)
  const BATCH_SIZE = 100;
  const batches = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    batches.push(emails.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    const promises = batch.map(async (emailOptions) => {
      try {
        const result = await sendEmailWithLogging(emailOptions);
        if (result.success) {
          results.successCount++;
        } else {
          results.failureCount++;
          results.success = false;
          results.errors.push({
            email: emailOptions.to,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        results.failureCount++;
        results.success = false;

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        results.errors.push({
          email: emailOptions.to,
          error: errorMessage,
        });
      }
    });

    // Process batch concurrently
    await Promise.all(promises);

    // Add a small delay between batches to respect rate limits (100ms)
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Get email sending statistics
 */
export async function getEmailStats(options?: { userId?: string; templateType?: EmailTemplateType; days?: number }) {
  const where: Record<string, unknown> = {};

  if (options?.userId) {
    where.userId = options.userId;
  }

  if (options?.templateType) {
    where.templateType = options.templateType;
  }

  if (options?.days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - options.days);
    where.createdAt = {
      gte: startDate,
    };
  }

  const [total, sent, failed, pending] = await Promise.all([
    prisma.emailLog.count({ where }),
    prisma.emailLog.count({ where: { ...where, status: 'sent' } }),
    prisma.emailLog.count({ where: { ...where, status: 'failed' } }),
    prisma.emailLog.count({ where: { ...where, status: 'pending' } }),
  ]);

  return {
    total,
    sent,
    failed,
    pending,
    successRate: total > 0 ? (sent / total) * 100 : 0,
  };
}

/**
 * Retry failed emails
 */
export async function retryFailedEmails(limit = 10): Promise<number> {
  const failedEmails = await prisma.emailLog.findMany({
    where: {
      status: 'failed',
    },
    take: limit,
    orderBy: {
      createdAt: 'asc',
    },
  });

  let retriedCount = 0;

  for (const emailLog of failedEmails) {
    try {
      const metadata = JSON.parse(emailLog.metadata);

      // Reconstruct email options (this is simplified - in production you'd store more data)
      const emailOptions: SendEmailOptions = {
        to: emailLog.to,
        subject: emailLog.subject,
        html: metadata.html || '',
        text: metadata.text || '',
        userId: emailLog.userId || undefined,
        templateType: emailLog.templateType as EmailTemplateType,
        metadata,
      };

      // Mark as pending before retry
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'pending' },
      });

      const result = await sendEmailWithLogging(emailOptions);
      if (result.success) {
        retriedCount++;
      }
    } catch (error) {
      console.error(`Failed to retry email ${emailLog.id}:`, error);
    }
  }

  return retriedCount;
}
