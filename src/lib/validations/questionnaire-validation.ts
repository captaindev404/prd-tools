/**
 * Zod Validation Schemas for Questionnaires
 *
 * Comprehensive validation using Zod for type-safe form validation.
 * This module provides Zod schemas that can be used with React Hook Form
 * via @hookform/resolvers/zod for automatic form validation.
 *
 * Based on DSL spec in docs/dsl/global.yaml (lines 174-202)
 *
 * @version 0.6.0 - English-only questionnaires (bilingual support removed)
 */

import { z } from 'zod';

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 200;
export const QUESTION_TEXT_MIN_LENGTH = 5;
export const QUESTION_TEXT_MAX_LENGTH = 500;
export const MCQ_MIN_OPTIONS = 2;
export const MCQ_OPTION_MIN_LENGTH = 1;
export const MCQ_OPTION_MAX_LENGTH = 200;

/**
 * ============================================================
 * ENUMS
 * ============================================================
 */

export const QuestionTypeEnum = z.enum([
  'likert',
  'nps',
  'mcq_single',
  'mcq_multiple',
  'text',
  'number',
  'rating',
]);

export const TargetingTypeEnum = z.enum([
  'all_users',
  'specific_villages',
  'specific_panels',
  'by_role',
]);

export type QuestionType = z.infer<typeof QuestionTypeEnum>;
export type TargetingType = z.infer<typeof TargetingTypeEnum>;

/**
 * ============================================================
 * QUESTION CONFIG SCHEMAS
 * ============================================================
 */

/**
 * Configuration schema for Likert questions (5 or 7 point scale)
 */
export const likertConfigSchema = z.object({
  scale: z.union([z.literal(5), z.literal(7)]).optional(),
  labels: z.object({
    lowest: z.string().optional(),
    highest: z.string().optional(),
  }).optional(),
});

/**
 * Configuration schema for NPS questions (0-10 scale)
 * No additional config needed beyond base question
 */
export const npsConfigSchema = z.object({}).optional();

/**
 * Configuration schema for MCQ questions (single or multiple choice)
 */
export const mcqConfigSchema = z.object({
  options: z
    .array(
      z.string()
        .min(MCQ_OPTION_MIN_LENGTH, 'Option cannot be empty')
        .max(MCQ_OPTION_MAX_LENGTH, `Option must not exceed ${MCQ_OPTION_MAX_LENGTH} characters`)
    )
    .min(MCQ_MIN_OPTIONS, `Multiple choice questions must have at least ${MCQ_MIN_OPTIONS} options`)
    .refine(
      (options) => {
        // Check for duplicate options
        const uniqueOptions = new Set(options.map(opt => opt.trim().toLowerCase()));
        return uniqueOptions.size === options.length;
      },
      { message: 'Options must be unique (case-insensitive)' }
    ),
});

/**
 * Configuration schema for text questions
 */
export const textConfigSchema = z.object({
  maxLength: z.number().int().positive().max(10000).optional(),
  multiline: z.boolean().optional(),
});

/**
 * Configuration schema for number questions
 */
export const numberConfigSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
}).refine(
  (config) => {
    if (config.min !== undefined && config.max !== undefined) {
      return config.max > config.min;
    }
    return true;
  },
  { message: 'Maximum must be greater than minimum' }
);

/**
 * Configuration schema for rating questions (star rating)
 */
export const ratingConfigSchema = z.object({
  maxRating: z.number().int().min(3).max(10).optional().default(5),
});

/**
 * Union config schema for all question types
 */
export const questionConfigSchema = z.union([
  likertConfigSchema,
  npsConfigSchema,
  mcqConfigSchema,
  textConfigSchema,
  numberConfigSchema,
  ratingConfigSchema,
]).optional();

/**
 * ============================================================
 * QUESTION SCHEMA
 * ============================================================
 */

/**
 * Base question schema (English-only, v0.6.0+)
 * Note: MCQ validation is complex, so we use superRefine for detailed error messages
 */
export const questionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  type: QuestionTypeEnum,
  text: z
    .string()
    .min(QUESTION_TEXT_MIN_LENGTH, `Question text must be at least ${QUESTION_TEXT_MIN_LENGTH} characters`)
    .max(QUESTION_TEXT_MAX_LENGTH, `Question text must not exceed ${QUESTION_TEXT_MAX_LENGTH} characters`),
  required: z.boolean().default(false),
  order: z.number().int().nonnegative().optional(),
  config: z.any().optional(), // Use any here and refine in superRefine
}).superRefine((question, ctx) => {
  // MCQ questions must have options in config
  if (question.type === 'mcq_single' || question.type === 'mcq_multiple') {
    if (!question.config || !('options' in question.config)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Multiple choice questions must have a config with options`,
        path: ['config'],
      });
      return;
    }

    const options = question.config.options;

    if (!Array.isArray(options)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Options must be an array`,
        path: ['config', 'options'],
      });
      return;
    }

    if (options.length < MCQ_MIN_OPTIONS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Multiple choice questions must have at least ${MCQ_MIN_OPTIONS} options`,
        path: ['config', 'options'],
      });
      return;
    }

    // Check for unique options (case-insensitive)
    const uniqueOptions = new Set(options.map((opt: string) => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Options must be unique (case-insensitive)',
        path: ['config', 'options'],
      });
      return;
    }

    // Validate each option length
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (typeof opt !== 'string' || opt.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Option cannot be empty',
          path: ['config', 'options', i],
        });
      } else if (opt.length > MCQ_OPTION_MAX_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Option must not exceed ${MCQ_OPTION_MAX_LENGTH} characters`,
          path: ['config', 'options', i],
        });
      }
    }
  }
});

export type QuestionInput = z.infer<typeof questionSchema>;

/**
 * ============================================================
 * TARGETING SCHEMA
 * ============================================================
 */

/**
 * Targeting configuration schema
 */
export const targetingSchema = z.object({
  type: TargetingTypeEnum,
  villageIds: z.array(z.string().min(1)).optional(),
  panelIds: z.array(z.string().min(1)).optional(),
  roles: z.array(z.string().min(1)).optional(),
}).refine(
  (targeting) => {
    // If targeting specific_panels, panelIds must be provided
    if (targeting.type === 'specific_panels') {
      return targeting.panelIds && targeting.panelIds.length > 0;
    }
    return true;
  },
  {
    message: 'At least one panel must be selected when targeting specific panels',
    path: ['panelIds'],
  }
).refine(
  (targeting) => {
    // If targeting specific_villages, villageIds must be provided
    if (targeting.type === 'specific_villages') {
      return targeting.villageIds && targeting.villageIds.length > 0;
    }
    return true;
  },
  {
    message: 'At least one village must be selected when targeting specific villages',
    path: ['villageIds'],
  }
).refine(
  (targeting) => {
    // If targeting by_role, roles must be provided
    if (targeting.type === 'by_role') {
      return targeting.roles && targeting.roles.length > 0;
    }
    return true;
  },
  {
    message: 'At least one role must be selected when targeting by role',
    path: ['roles'],
  }
);

export type TargetingInput = z.infer<typeof targetingSchema>;

/**
 * ============================================================
 * QUESTIONNAIRE CREATION/UPDATE SCHEMAS
 * ============================================================
 */

/**
 * Questionnaire creation schema
 */
export const createQuestionnaireSchema = z.object({
  title: z
    .string()
    .min(TITLE_MIN_LENGTH, `Title must be at least ${TITLE_MIN_LENGTH} characters`)
    .max(TITLE_MAX_LENGTH, `Title must not exceed ${TITLE_MAX_LENGTH} characters`)
    .transform(val => val.trim()),

  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required')
    .refine(
      (questions) => {
        // Validate unique question IDs
        const ids = questions.map(q => q.id);
        const uniqueIds = new Set(ids);
        return uniqueIds.size === ids.length;
      },
      { message: 'Question IDs must be unique' }
    ),

  targeting: targetingSchema,

  anonymous: z.boolean().optional().default(false),

  responseLimit: z
    .number()
    .int('Response limit must be a whole number')
    .nonnegative('Response limit must be non-negative')
    .optional()
    .default(1),

  startAt: z
    .string()
    .datetime({ message: 'Start date must be a valid ISO datetime' })
    .nullable()
    .optional(),

  endAt: z
    .string()
    .datetime({ message: 'End date must be a valid ISO datetime' })
    .nullable()
    .optional(),

  maxResponses: z
    .number()
    .int('Maximum responses must be a whole number')
    .positive('Maximum responses must be a positive number')
    .nullable()
    .optional(),
}).refine(
  (data) => {
    // Validate date range: end date must be after start date
    if (data.startAt && data.endAt) {
      const startDate = new Date(data.startAt);
      const endDate = new Date(data.endAt);
      return endDate > startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endAt'],
  }
);

export type CreateQuestionnaireInput = z.infer<typeof createQuestionnaireSchema>;

/**
 * Questionnaire update schema (all fields optional except ID)
 */
export const updateQuestionnaireSchema = z.object({
  title: z
    .string()
    .min(TITLE_MIN_LENGTH, `Title must be at least ${TITLE_MIN_LENGTH} characters`)
    .max(TITLE_MAX_LENGTH, `Title must not exceed ${TITLE_MAX_LENGTH} characters`)
    .transform(val => val.trim())
    .optional(),

  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required')
    .optional(),

  targeting: targetingSchema.optional(),

  anonymous: z.boolean().optional(),

  responseLimit: z
    .number()
    .int('Response limit must be a whole number')
    .nonnegative('Response limit must be non-negative')
    .optional(),

  endAt: z
    .string()
    .datetime({ message: 'End date must be a valid ISO datetime' })
    .nullable()
    .optional(),

  maxResponses: z
    .number()
    .int('Maximum responses must be a whole number')
    .positive('Maximum responses must be a positive number')
    .nullable()
    .optional(),
});

export type UpdateQuestionnaireInput = z.infer<typeof updateQuestionnaireSchema>;

/**
 * ============================================================
 * FORM-SPECIFIC SCHEMAS (for React Hook Form integration)
 * ============================================================
 */

/**
 * Simplified form schema for the questionnaire creation form
 * This schema is designed to work with the UI state before API submission
 */
export const questionnaireFormSchema = z.object({
  title: z
    .string()
    .min(TITLE_MIN_LENGTH, `Title must be at least ${TITLE_MIN_LENGTH} characters`)
    .max(TITLE_MAX_LENGTH, `Title must not exceed ${TITLE_MAX_LENGTH} characters`),

  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required'),

  targetingType: TargetingTypeEnum,

  selectedPanels: z.array(z.string()).optional().default([]),

  selectedVillages: z.array(z.string()).optional().default([]),

  selectedRoles: z.array(z.string()).optional().default([]),

  anonymous: z.boolean().optional().default(false),

  responseLimit: z
    .number()
    .int('Response limit must be a whole number')
    .nonnegative('Response limit must be non-negative')
    .optional()
    .default(1),

  startAt: z.string().optional().nullable(),

  endAt: z.string().optional().nullable(),

  maxResponses: z.coerce
    .number()
    .int('Maximum responses must be a whole number')
    .positive('Maximum responses must be a positive number')
    .nullable()
    .optional(),
}).refine(
  (data) => {
    // Validate targeting: specific_panels requires panel selection
    if (data.targetingType === 'specific_panels') {
      return data.selectedPanels && data.selectedPanels.length > 0;
    }
    return true;
  },
  {
    message: 'At least one panel must be selected when targeting specific panels',
    path: ['selectedPanels'],
  }
).refine(
  (data) => {
    // Validate targeting: specific_villages requires village selection
    if (data.targetingType === 'specific_villages') {
      return data.selectedVillages && data.selectedVillages.length > 0;
    }
    return true;
  },
  {
    message: 'At least one village must be selected when targeting specific villages',
    path: ['selectedVillages'],
  }
).refine(
  (data) => {
    // Validate targeting: by_role requires role selection
    if (data.targetingType === 'by_role') {
      return data.selectedRoles && data.selectedRoles.length > 0;
    }
    return true;
  },
  {
    message: 'At least one role must be selected when targeting by role',
    path: ['selectedRoles'],
  }
).refine(
  (data) => {
    // Validate date range
    if (data.startAt && data.endAt) {
      const startDate = new Date(data.startAt);
      const endDate = new Date(data.endAt);
      return endDate > startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endAt'],
  }
);

export type QuestionnaireFormInput = z.infer<typeof questionnaireFormSchema>;

/**
 * ============================================================
 * VALIDATION HELPER FUNCTIONS
 * ============================================================
 */

/**
 * Validate questionnaire data and return detailed errors
 *
 * @param data - The questionnaire data to validate
 * @returns Object with success status, validated data, or formatted errors
 */
export function validateQuestionnaire(data: unknown): {
  success: boolean;
  data?: CreateQuestionnaireInput;
  errors?: string[];
  fieldErrors?: Record<string, string[]>;
} {
  const result = createQuestionnaireSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format errors for display
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    const message = issue.message;

    errors.push(`${path ? `${path}: ` : ''}${message}`);

    if (path) {
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(message);
    }
  });

  return { success: false, errors, fieldErrors };
}

/**
 * Validate questionnaire form data
 *
 * @param data - The form data to validate
 * @returns Object with success status, validated data, or formatted errors
 */
export function validateQuestionnaireForm(data: unknown): {
  success: boolean;
  data?: QuestionnaireFormInput;
  errors?: string[];
  fieldErrors?: Record<string, string[]>;
} {
  const result = questionnaireFormSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format errors for display
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    const message = issue.message;

    errors.push(`${path ? `${path}: ` : ''}${message}`);

    if (path) {
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(message);
    }
  });

  return { success: false, errors, fieldErrors };
}

/**
 * Validate individual question
 *
 * @param data - The question data to validate
 * @returns Object with success status, validated data, or formatted errors
 */
export function validateQuestion(data: unknown): {
  success: boolean;
  data?: QuestionInput;
  errors?: string[];
} {
  const result = questionSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(issue => issue.message);
  return { success: false, errors };
}

/**
 * Transform form data to API payload
 * Converts the form state to the format expected by the API
 *
 * @param formData - The form data from React Hook Form
 * @returns API-ready payload
 */
export function transformFormToApiPayload(
  formData: QuestionnaireFormInput
): CreateQuestionnaireInput {
  const targeting: TargetingInput = {
    type: formData.targetingType,
    ...(formData.targetingType === 'specific_panels' && {
      panelIds: formData.selectedPanels,
    }),
    ...(formData.targetingType === 'specific_villages' && {
      villageIds: formData.selectedVillages,
    }),
    ...(formData.targetingType === 'by_role' && {
      roles: formData.selectedRoles,
    }),
  };

  return {
    title: formData.title,
    questions: formData.questions,
    targeting,
    anonymous: formData.anonymous,
    responseLimit: formData.responseLimit,
    startAt: formData.startAt || null,
    endAt: formData.endAt || null,
    maxResponses: formData.maxResponses || null,
  };
}

/**
 * ============================================================
 * TYPE GUARDS
 * ============================================================
 */

/**
 * Type guard to check if a question is an MCQ question
 */
export function isMcqQuestion(question: QuestionInput): boolean {
  return question.type === 'mcq_single' || question.type === 'mcq_multiple';
}

/**
 * Type guard to check if config contains MCQ options
 */
export function hasMcqOptions(config: unknown): config is { options: string[] } {
  return (
    typeof config === 'object' &&
    config !== null &&
    'options' in config &&
    Array.isArray((config as any).options)
  );
}
