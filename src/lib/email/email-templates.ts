/**
 * Centralized email template registry
 * Exports all email templates with type-safe parameters
 */

import { generateWelcomeHTML, generateWelcomeText } from '../email-templates/welcome';
import { generateFeedbackUpdateHTML, generateFeedbackUpdateText } from '../email-templates/feedback-update';
import { generateRoadmapUpdateHTML, generateRoadmapUpdateText } from '../email-templates/roadmap-update';
import { generateQuestionnaireInviteHTML, generateQuestionnaireInviteText } from '../email-templates/questionnaire-invite';
import { generateWeeklyDigestHTML, generateWeeklyDigestText } from '../email-templates/weekly-digest';

/**
 * Email template types
 */
export type EmailTemplateType =
  | 'welcome'
  | 'feedback_update'
  | 'roadmap_update'
  | 'questionnaire_invite'
  | 'weekly_digest';

/**
 * Template parameters by type
 */
export interface TemplateParams {
  welcome: {
    displayName: string;
    dashboardLink: string;
    language: 'en' | 'fr';
  };
  feedback_update: {
    feedbackTitle: string;
    feedbackId: string;
    updateType: 'status_change' | 'comment' | 'merged' | 'in_roadmap';
    oldStatus?: string;
    newStatus?: string;
    comment?: string;
    commenterName?: string;
    link: string;
    language: 'en' | 'fr';
  };
  roadmap_update: {
    title: string;
    stage: 'now' | 'next' | 'later' | 'under_consideration';
    summary: string;
    link: string;
    language: 'en' | 'fr';
  };
  questionnaire_invite: {
    questionnaireTitle: string;
    deadline: string | null;
    link: string;
    language: 'en' | 'fr';
  };
  weekly_digest: {
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
    link: string;
    language: 'en' | 'fr';
  };
}

/**
 * Email subject lines by template type and language
 */
export const EMAIL_SUBJECTS: Record<EmailTemplateType, Record<'en' | 'fr', string>> = {
  welcome: {
    en: 'Welcome to Gentil Feedback',
    fr: 'Bienvenue sur Gentil Feedback',
  },
  feedback_update: {
    en: 'Update on Your Feedback',
    fr: 'Mise à jour de votre retour',
  },
  roadmap_update: {
    en: 'Product Roadmap Update',
    fr: 'Mise à jour de la feuille de route produit',
  },
  questionnaire_invite: {
    en: 'You\'re Invited to Complete a Questionnaire',
    fr: 'Vous êtes invité(e) à compléter un questionnaire',
  },
  weekly_digest: {
    en: 'Your Weekly Feedback Digest',
    fr: 'Votre résumé hebdomadaire',
  },
};

/**
 * Template generator function type
 */
type TemplateGenerator<T extends EmailTemplateType> = (params: TemplateParams[T]) => {
  html: string;
  text: string;
  subject: string;
};

/**
 * Template generators by type
 */
const templateGenerators: { [K in EmailTemplateType]: TemplateGenerator<K> } = {
  welcome: (params) => ({
    html: generateWelcomeHTML(params),
    text: generateWelcomeText(params),
    subject: EMAIL_SUBJECTS.welcome[params.language],
  }),
  feedback_update: (params) => ({
    html: generateFeedbackUpdateHTML(params),
    text: generateFeedbackUpdateText(params),
    subject: EMAIL_SUBJECTS.feedback_update[params.language],
  }),
  roadmap_update: (params) => ({
    html: generateRoadmapUpdateHTML(params),
    text: generateRoadmapUpdateText(params),
    subject: EMAIL_SUBJECTS.roadmap_update[params.language],
  }),
  questionnaire_invite: (params) => ({
    html: generateQuestionnaireInviteHTML(params),
    text: generateQuestionnaireInviteText(params),
    subject: EMAIL_SUBJECTS.questionnaire_invite[params.language],
  }),
  weekly_digest: (params) => ({
    html: generateWeeklyDigestHTML(params),
    text: generateWeeklyDigestText(params),
    subject: EMAIL_SUBJECTS.weekly_digest[params.language],
  }),
};

/**
 * Generate email content from template
 */
export function generateEmailFromTemplate<T extends EmailTemplateType>(
  templateType: T,
  params: TemplateParams[T]
): { html: string; text: string; subject: string } {
  const generator = templateGenerators[templateType] as TemplateGenerator<T>;
  return generator(params);
}

/**
 * Get all available template types
 */
export function getAvailableTemplates(): EmailTemplateType[] {
  return Object.keys(templateGenerators) as EmailTemplateType[];
}

/**
 * Validate template parameters (basic validation)
 */
export function validateTemplateParams<T extends EmailTemplateType>(
  templateType: T,
  params: unknown
): params is TemplateParams[T] {
  if (!params || typeof params !== 'object') {
    return false;
  }

  const p = params as Record<string, unknown>;

  // Check for required language field
  if (!p.language || (p.language !== 'en' && p.language !== 'fr')) {
    return false;
  }

  // Template-specific validations
  switch (templateType) {
    case 'welcome':
      return typeof p.displayName === 'string' && typeof p.dashboardLink === 'string';
    case 'feedback_update':
      return (
        typeof p.feedbackTitle === 'string' &&
        typeof p.feedbackId === 'string' &&
        typeof p.updateType === 'string' &&
        typeof p.link === 'string'
      );
    case 'roadmap_update':
      return (
        typeof p.title === 'string' &&
        typeof p.stage === 'string' &&
        typeof p.summary === 'string' &&
        typeof p.link === 'string'
      );
    case 'questionnaire_invite':
      return typeof p.questionnaireTitle === 'string' && typeof p.link === 'string';
    case 'weekly_digest':
      return (
        typeof p.weekStart === 'string' &&
        typeof p.weekEnd === 'string' &&
        Array.isArray(p.topFeedback) &&
        typeof p.link === 'string'
      );
    default:
      return false;
  }
}
