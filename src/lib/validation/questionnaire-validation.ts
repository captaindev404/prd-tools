/**
 * Questionnaire Validation Utilities
 *
 * This module provides comprehensive validation for questionnaire forms.
 * It includes validation for title, questions, targeting, dates, and response limits.
 *
 * @version 0.6.0 - Simplified to English-only (bilingual support removed)
 */

export interface QuestionConfig {
  scale?: number;
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
}

export interface Question {
  id: string;
  type: 'likert' | 'nps' | 'mcq_single' | 'mcq_multiple' | 'text' | 'number' | 'rating';
  text: string; // English only (v0.6.0+)
  required: boolean;
  config?: QuestionConfig;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface ValidationStatus {
  hasTitle: boolean;
  hasQuestions: boolean;
  questionsHaveText: boolean;
  mcqHaveOptions: boolean;
  hasTargeting: boolean;
  validDates: boolean;
  validMaxResponses: boolean;
  isValid: boolean;
}

/**
 * Title Validation Constants
 */
export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 200;

/**
 * MCQ Validation Constants
 */
export const MCQ_MIN_OPTIONS = 2;

/**
 * Question Text Validation Constants
 */
export const QUESTION_TEXT_MIN_LENGTH = 5;
export const QUESTION_TEXT_MAX_LENGTH = 500;

/**
 * Validates the questionnaire title
 */
export function validateTitle(title: string): ValidationResult {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return {
      isValid: false,
      error: 'Title is required',
    };
  }

  if (trimmedTitle.length < TITLE_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Title must be at least ${TITLE_MIN_LENGTH} characters`,
    };
  }

  if (title.length > TITLE_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Title must not exceed ${TITLE_MAX_LENGTH} characters`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validates that at least one question exists
 */
export function validateQuestionsExist(questions: Question[]): ValidationResult {
  if (questions.length === 0) {
    return {
      isValid: false,
      error: 'At least one question is required',
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validates that a question has text (English-only)
 */
export function validateQuestionText(question: Question): ValidationResult {
  const trimmedText = question.text.trim();

  if (!trimmedText) {
    return {
      isValid: false,
      error: 'Question text is required',
    };
  }

  if (trimmedText.length < QUESTION_TEXT_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Question text must be at least ${QUESTION_TEXT_MIN_LENGTH} characters`,
    };
  }

  if (question.text.length > QUESTION_TEXT_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Question text must not exceed ${QUESTION_TEXT_MAX_LENGTH} characters`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validates that all questions have text
 */
export function validateAllQuestionsHaveText(questions: Question[]): ValidationResult {
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question) continue;

    const result = validateQuestionText(question);
    if (!result.isValid) {
      return {
        isValid: false,
        error: `Question ${i + 1}: ${result.error}`,
      };
    }
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validates MCQ question options
 */
export function validateMcqOptions(question: Question): ValidationResult {
  if (question.type !== 'mcq_single' && question.type !== 'mcq_multiple') {
    return { isValid: true, error: null };
  }

  if (!question.config?.options || question.config.options.length < MCQ_MIN_OPTIONS) {
    return {
      isValid: false,
      error: `Multiple Choice question must have at least ${MCQ_MIN_OPTIONS} options`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validates all MCQ questions have sufficient options
 */
export function validateAllMcqOptions(questions: Question[]): ValidationResult {
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question) continue;

    const result = validateMcqOptions(question);
    if (!result.isValid) {
      return {
        isValid: false,
        error: `Question ${i + 1} (Multiple Choice) must have at least ${MCQ_MIN_OPTIONS} options`,
      };
    }
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validates targeting configuration
 */
export function validateTargeting(
  targetingType: string,
  selectedPanels: string[]
): ValidationResult {
  if (targetingType === 'specific_panels' && selectedPanels.length === 0) {
    return {
      isValid: false,
      error: 'At least one panel must be selected when targeting specific panels',
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validates date range (end date must be after start date)
 */
export function validateDateRange(startAt: string, endAt: string): ValidationResult {
  if (!startAt || !endAt) {
    return { isValid: true, error: null };
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (startDate >= endDate) {
    return {
      isValid: false,
      error: 'End date must be after start date',
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validates maximum responses setting
 */
export function validateMaxResponses(maxResponses: string | number | null | undefined): ValidationResult {
  // Allow null, undefined, or empty string (optional field)
  if (maxResponses === null || maxResponses === undefined || maxResponses === '') {
    return { isValid: true, error: null };
  }

  const numericValue = typeof maxResponses === 'string' ? Number(maxResponses) : maxResponses;

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      error: 'Maximum responses must be a valid number',
    };
  }

  if (numericValue <= 0) {
    return {
      isValid: false,
      error: 'Maximum responses must be a positive number',
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Comprehensive form validation
 * Returns the first validation error encountered, or null if valid
 */
export function validateQuestionnaireForm(params: {
  title: string;
  questions: Question[];
  targetingType: string;
  selectedPanels: string[];
  startAt?: string;
  endAt?: string;
  maxResponses?: string | number;
}): ValidationResult {
  const {
    title,
    questions,
    targetingType,
    selectedPanels,
    startAt = '',
    endAt = '',
    maxResponses,
  } = params;

  // Title validation
  const titleResult = validateTitle(title);
  if (!titleResult.isValid) {
    return titleResult;
  }

  // Questions existence validation
  const questionsExistResult = validateQuestionsExist(questions);
  if (!questionsExistResult.isValid) {
    return questionsExistResult;
  }

  // Question text validation
  const questionsTextResult = validateAllQuestionsHaveText(questions);
  if (!questionsTextResult.isValid) {
    return questionsTextResult;
  }

  // MCQ options validation
  const mcqOptionsResult = validateAllMcqOptions(questions);
  if (!mcqOptionsResult.isValid) {
    return mcqOptionsResult;
  }

  // Targeting validation
  const targetingResult = validateTargeting(targetingType, selectedPanels);
  if (!targetingResult.isValid) {
    return targetingResult;
  }

  // Date range validation
  const dateRangeResult = validateDateRange(startAt, endAt);
  if (!dateRangeResult.isValid) {
    return dateRangeResult;
  }

  // Max responses validation
  const maxResponsesResult = validateMaxResponses(maxResponses);
  if (!maxResponsesResult.isValid) {
    return maxResponsesResult;
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Calculate detailed validation status for display purposes
 * This is useful for showing individual validation checks in the UI
 */
export function calculateValidationStatus(
  title: string,
  questions: Question[],
  targetingType: string,
  selectedPanels: string[] = [],
  startAt: string = '',
  endAt: string = '',
  maxResponses?: string | number
): ValidationStatus {
  const titleResult = validateTitle(title);
  const questionsExistResult = validateQuestionsExist(questions);
  const questionsTextResult = validateAllQuestionsHaveText(questions);
  const mcqOptionsResult = validateAllMcqOptions(questions);
  const targetingResult = validateTargeting(targetingType, selectedPanels);
  const dateRangeResult = validateDateRange(startAt, endAt);
  const maxResponsesResult = validateMaxResponses(maxResponses);

  const status: ValidationStatus = {
    hasTitle: titleResult.isValid,
    hasQuestions: questionsExistResult.isValid,
    questionsHaveText: questionsTextResult.isValid,
    mcqHaveOptions: mcqOptionsResult.isValid,
    hasTargeting: targetingResult.isValid,
    validDates: dateRangeResult.isValid,
    validMaxResponses: maxResponsesResult.isValid,
    isValid: false,
  };

  status.isValid = Object.entries(status)
    .filter(([key]) => key !== 'isValid')
    .every(([, value]) => value === true);

  return status;
}
