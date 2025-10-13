/**
 * Question Template Library
 *
 * Provides preset templates for common question types that researchers
 * frequently use. Templates can be inserted with one click and are fully editable.
 *
 * @version 0.6.0 - English-only (simplified from bilingual)
 */

import { Question } from '@/components/questionnaires/question-builder';
import { ulid } from 'ulid';

export type TemplateCategory = 'nps' | 'satisfaction' | 'csat' | 'ces' | 'demographic';

export interface QuestionTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  icon?: string; // Lucide icon name
  question: Omit<Question, 'id'>; // Template without ID (generated on insertion)
}

/**
 * NPS (Net Promoter Score) Templates
 */
const npsTemplates: QuestionTemplate[] = [
  {
    id: 'nps-standard',
    name: 'Standard NPS',
    category: 'nps',
    description: 'Classic Net Promoter Score question (0-10 scale)',
    icon: 'TrendingUp',
    question: {
      type: 'nps',
      text: 'How likely are you to recommend Club Med to a colleague?',
      required: true,
      config: {},
    },
  },
  {
    id: 'nps-product',
    name: 'Product NPS',
    category: 'nps',
    description: 'NPS focused on a specific product or feature',
    icon: 'Package',
    question: {
      type: 'nps',
      text: 'How likely are you to recommend this product to a colleague?',
      required: true,
      config: {},
    },
  },
  {
    id: 'nps-service',
    name: 'Service NPS',
    category: 'nps',
    description: 'NPS focused on service quality',
    icon: 'Smile',
    question: {
      type: 'nps',
      text: 'How likely are you to recommend our service to others?',
      required: true,
      config: {},
    },
  },
];

/**
 * Satisfaction (Likert Scale) Templates
 */
const satisfactionTemplates: QuestionTemplate[] = [
  {
    id: 'satisfaction-overall',
    name: 'Overall Satisfaction',
    category: 'satisfaction',
    description: 'General satisfaction question with 5-point scale',
    icon: 'Heart',
    question: {
      type: 'likert',
      text: 'How satisfied are you with your overall experience?',
      required: true,
      config: { scale: 5 },
    },
  },
  {
    id: 'satisfaction-feature',
    name: 'Feature Satisfaction',
    category: 'satisfaction',
    description: 'Satisfaction with a specific feature',
    icon: 'Star',
    question: {
      type: 'likert',
      text: 'How satisfied are you with this feature?',
      required: true,
      config: { scale: 5 },
    },
  },
  {
    id: 'satisfaction-7point',
    name: 'Detailed Satisfaction (7-point)',
    category: 'satisfaction',
    description: 'More granular satisfaction scale',
    icon: 'BarChart3',
    question: {
      type: 'likert',
      text: 'Please rate your satisfaction with this experience',
      required: true,
      config: { scale: 7 },
    },
  },
];

/**
 * CSAT (Customer Satisfaction Score) Templates
 */
const csatTemplates: QuestionTemplate[] = [
  {
    id: 'csat-experience',
    name: 'Experience Rating',
    category: 'csat',
    description: 'Rate overall experience quality',
    icon: 'ThumbsUp',
    question: {
      type: 'rating',
      text: 'How would you rate your overall experience?',
      required: true,
      config: { scale: 5 },
    },
  },
  {
    id: 'csat-support',
    name: 'Support Quality',
    category: 'csat',
    description: 'Rate support team performance',
    icon: 'MessageCircle',
    question: {
      type: 'rating',
      text: 'How would you rate the quality of support you received?',
      required: true,
      config: { scale: 5 },
    },
  },
];

/**
 * CES (Customer Effort Score) Templates
 */
const cesTemplates: QuestionTemplate[] = [
  {
    id: 'ces-task',
    name: 'Task Ease',
    category: 'ces',
    description: 'Measure how easy a task was to complete',
    icon: 'Zap',
    question: {
      type: 'likert',
      text: 'How easy was it to complete this task?',
      required: true,
      config: { scale: 5 },
    },
  },
  {
    id: 'ces-issue-resolution',
    name: 'Issue Resolution Effort',
    category: 'ces',
    description: 'Measure effort required to resolve an issue',
    icon: 'CircleHelp',
    question: {
      type: 'likert',
      text: 'How easy was it to get your issue resolved?',
      required: true,
      config: { scale: 5 },
    },
  },
];

/**
 * Demographic Templates
 */
const demographicTemplates: QuestionTemplate[] = [
  {
    id: 'demo-role',
    name: 'Job Role',
    category: 'demographic',
    description: 'Ask about respondent job role',
    icon: 'Briefcase',
    question: {
      type: 'mcq_single',
      text: 'What is your primary role?',
      required: false,
      config: {
        options: [
          'Product Manager',
          'Product Owner',
          'Developer/Engineer',
          'Designer',
          'Researcher',
          'Moderator',
          'Other',
        ],
      },
    },
  },
  {
    id: 'demo-village',
    name: 'Village',
    category: 'demographic',
    description: 'Ask about village location',
    icon: 'MapPin',
    question: {
      type: 'mcq_single',
      text: 'Which village do you work at?',
      required: false,
      config: {
        options: [
          'VLG-001 (France)',
          'VLG-002 (Spain)',
          'VLG-003 (Italy)',
          'VLG-004 (Switzerland)',
          'Other',
        ],
      },
    },
  },
  {
    id: 'demo-experience',
    name: 'Years of Experience',
    category: 'demographic',
    description: 'Ask about tenure with Club Med',
    icon: 'Calendar',
    question: {
      type: 'number',
      text: 'How many years have you been with Club Med?',
      required: false,
      config: {
        min: 0,
        max: 50,
      },
    },
  },
  {
    id: 'demo-frequency',
    name: 'Usage Frequency',
    category: 'demographic',
    description: 'Ask about product usage frequency',
    icon: 'Clock',
    question: {
      type: 'mcq_single',
      text: 'How often do you use this product?',
      required: false,
      config: {
        options: [
          'Daily',
          'Several times a week',
          'Weekly',
          'Monthly',
          'Rarely',
          'Never',
        ],
      },
    },
  },
  {
    id: 'demo-department',
    name: 'Department',
    category: 'demographic',
    description: 'Ask about department or team',
    icon: 'Building',
    question: {
      type: 'mcq_single',
      text: 'Which department or team are you part of?',
      required: false,
      config: {
        options: [
          'Product',
          'Engineering',
          'Design',
          'Research',
          'Operations',
          'Support',
          'Management',
          'Other',
        ],
      },
    },
  },
];

/**
 * All templates organized by category
 */
export const questionTemplates: QuestionTemplate[] = [
  ...npsTemplates,
  ...satisfactionTemplates,
  ...csatTemplates,
  ...cesTemplates,
  ...demographicTemplates,
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): QuestionTemplate[] {
  return questionTemplates.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): QuestionTemplate | undefined {
  return questionTemplates.find(t => t.id === id);
}

/**
 * Convert template to Question (with unique ID)
 */
export function templateToQuestion(template: QuestionTemplate): Question {
  return {
    id: ulid(),
    ...template.question,
  };
}

/**
 * Category metadata for UI display
 */
export const categoryMetadata: Record<TemplateCategory, { label: string; description: string; icon: string }> = {
  nps: {
    label: 'NPS',
    description: 'Net Promoter Score questions (0-10 scale)',
    icon: 'TrendingUp',
  },
  satisfaction: {
    label: 'Satisfaction',
    description: 'Likert scale satisfaction questions (5 or 7 points)',
    icon: 'Heart',
  },
  csat: {
    label: 'CSAT',
    description: 'Customer Satisfaction Score (star ratings)',
    icon: 'ThumbsUp',
  },
  ces: {
    label: 'CES',
    description: 'Customer Effort Score (ease of task completion)',
    icon: 'Zap',
  },
  demographic: {
    label: 'Demographic',
    description: 'Background and profile questions',
    icon: 'Users',
  },
};
