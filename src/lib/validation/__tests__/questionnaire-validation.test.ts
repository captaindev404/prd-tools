/**
 * Unit Tests for Questionnaire Validation
 *
 * This test suite covers all validation rules for questionnaire forms including:
 * - Title validation (required, min/max length)
 * - Questions validation (at least 1, text required)
 * - MCQ validation (2+ options)
 * - Targeting validation (panels selected)
 * - Date validation (end after start)
 * - Max responses validation (positive number)
 */

import {
  validateTitle,
  validateQuestionsExist,
  validateQuestionText,
  validateAllQuestionsHaveText,
  validateMcqOptions,
  validateAllMcqOptions,
  validateTargeting,
  validateDateRange,
  validateMaxResponses,
  validateQuestionnaireForm,
  calculateValidationStatus,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  MCQ_MIN_OPTIONS,
  QUESTION_TEXT_MIN_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
  Question,
} from '../questionnaire-validation';

/**
 * Helper function to create a test question (English-only format, v0.6.0+)
 */
const createQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'test-id',
  type: 'text',
  text: 'Test question', // English only (v0.6.0+)
  required: false,
  config: {},
  ...overrides,
});

describe('Questionnaire Validation', () => {
  describe('validateTitle', () => {
    it('should fail when title is empty', () => {
      const result = validateTitle('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should fail when title is only whitespace', () => {
      const result = validateTitle('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should fail when title is too short', () => {
      const result = validateTitle('AB');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`Title must be at least ${TITLE_MIN_LENGTH} characters`);
    });

    it('should fail when title exceeds maximum length', () => {
      const longTitle = 'A'.repeat(TITLE_MAX_LENGTH + 1);
      const result = validateTitle(longTitle);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`Title must not exceed ${TITLE_MAX_LENGTH} characters`);
    });

    it('should pass with minimum valid length', () => {
      const result = validateTitle('ABC');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass with maximum valid length', () => {
      const maxTitle = 'A'.repeat(TITLE_MAX_LENGTH);
      const result = validateTitle(maxTitle);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass with valid title', () => {
      const result = validateTitle('Q4 2024 Guest Experience Survey');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should trim whitespace when validating length', () => {
      const result = validateTitle('  Valid Title  ');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });
  });

  describe('validateQuestionsExist', () => {
    it('should fail when no questions are provided', () => {
      const result = validateQuestionsExist([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('At least one question is required');
    });

    it('should pass when at least one question exists', () => {
      const questions = [createQuestion()];
      const result = validateQuestionsExist(questions);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass with multiple questions', () => {
      const questions = [createQuestion(), createQuestion({ id: 'test-id-2' })];
      const result = validateQuestionsExist(questions);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });
  });

  describe('validateQuestionText', () => {
    it('should fail when text is empty', () => {
      const question = createQuestion({ text: '' });
      const result = validateQuestionText(question);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Question text is required');
    });

    it('should fail when text is only whitespace', () => {
      const question = createQuestion({ text: '   ' });
      const result = validateQuestionText(question);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Question text is required');
    });

    it('should fail when text is too short', () => {
      const question = createQuestion({ text: 'Test' }); // 4 characters, min is 5
      const result = validateQuestionText(question);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`Question text must be at least ${QUESTION_TEXT_MIN_LENGTH} characters`);
    });

    it('should fail when text exceeds maximum length', () => {
      const longText = 'A'.repeat(QUESTION_TEXT_MAX_LENGTH + 1);
      const question = createQuestion({ text: longText });
      const result = validateQuestionText(question);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`Question text must not exceed ${QUESTION_TEXT_MAX_LENGTH} characters`);
    });

    it('should pass with minimum valid length', () => {
      const question = createQuestion({ text: 'Hello' }); // 5 characters
      const result = validateQuestionText(question);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass with maximum valid length', () => {
      const maxText = 'A'.repeat(QUESTION_TEXT_MAX_LENGTH);
      const question = createQuestion({ text: maxText });
      const result = validateQuestionText(question);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass with valid text', () => {
      const question = createQuestion({ text: 'How satisfied are you with our service?' });
      const result = validateQuestionText(question);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass with multiline text', () => {
      const question = createQuestion({
        text: 'Please describe your experience.\nBe as detailed as possible.',
      });
      const result = validateQuestionText(question);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });
  });

  describe('validateAllQuestionsHaveText', () => {
    it('should pass when all questions have text', () => {
      const questions = [
        createQuestion({ id: '1', text: 'Question 1' }),
        createQuestion({ id: '2', text: 'Question 2' }),
        createQuestion({ id: '3', text: 'Question 3' }),
      ];
      const result = validateAllQuestionsHaveText(questions);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail when one question has no text', () => {
      const questions = [
        createQuestion({ id: '1', text: 'Question 1' }),
        createQuestion({ id: '2', text: '' }), // Invalid
        createQuestion({ id: '3', text: 'Question 3' }),
      ];
      const result = validateAllQuestionsHaveText(questions);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Question 2');
    });

    it('should include correct question number in error message', () => {
      const questions = [
        createQuestion({ id: '1', text: 'Question 1' }),
        createQuestion({ id: '2', text: 'Question 2' }),
        createQuestion({ id: '3', text: 'Question 3' }),
        createQuestion({ id: '4', text: '' }), // Invalid - 4th question
      ];
      const result = validateAllQuestionsHaveText(questions);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Question 4');
    });
  });

  describe('validateMcqOptions', () => {
    it('should pass for non-MCQ question types', () => {
      const question = createQuestion({ type: 'text' });
      const result = validateMcqOptions(question);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail when MCQ single has no options', () => {
      const question = createQuestion({
        type: 'mcq_single',
        config: { options: [] },
      });
      const result = validateMcqOptions(question);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`Multiple Choice question must have at least ${MCQ_MIN_OPTIONS} options`);
    });

    it('should fail when MCQ single has only 1 option', () => {
      const question = createQuestion({
        type: 'mcq_single',
        config: { options: ['Option 1'] },
      });
      const result = validateMcqOptions(question);
      expect(result.isValid).toBe(false);
    });

    it('should pass when MCQ single has 2 options', () => {
      const question = createQuestion({
        type: 'mcq_single',
        config: { options: ['Option 1', 'Option 2'] },
      });
      const result = validateMcqOptions(question);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when MCQ single has more than 2 options', () => {
      const question = createQuestion({
        type: 'mcq_single',
        config: { options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'] },
      });
      const result = validateMcqOptions(question);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail when MCQ multiple has no options', () => {
      const question = createQuestion({
        type: 'mcq_multiple',
        config: { options: [] },
      });
      const result = validateMcqOptions(question);
      expect(result.isValid).toBe(false);
    });

    it('should pass when MCQ multiple has 2+ options', () => {
      const question = createQuestion({
        type: 'mcq_multiple',
        config: { options: ['Option 1', 'Option 2'] },
      });
      const result = validateMcqOptions(question);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail when MCQ has undefined config', () => {
      const question = createQuestion({
        type: 'mcq_single',
        config: undefined,
      });
      const result = validateMcqOptions(question);
      expect(result.isValid).toBe(false);
    });

    it('should fail when MCQ has config without options', () => {
      const question = createQuestion({
        type: 'mcq_single',
        config: {},
      });
      const result = validateMcqOptions(question);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAllMcqOptions', () => {
    it('should pass when no MCQ questions exist', () => {
      const questions = [
        createQuestion({ type: 'text' }),
        createQuestion({ type: 'likert', config: { scale: 5 } }),
      ];
      const result = validateAllMcqOptions(questions);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when all MCQ questions have sufficient options', () => {
      const questions = [
        createQuestion({ type: 'text' }),
        createQuestion({
          type: 'mcq_single',
          config: { options: ['Yes', 'No'] },
        }),
        createQuestion({
          type: 'mcq_multiple',
          config: { options: ['Option 1', 'Option 2', 'Option 3'] },
        }),
      ];
      const result = validateAllMcqOptions(questions);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail when one MCQ question has insufficient options', () => {
      const questions = [
        createQuestion({
          id: '1',
          type: 'mcq_single',
          config: { options: ['Yes', 'No'] },
        }),
        createQuestion({
          id: '2',
          type: 'mcq_multiple',
          config: { options: ['Only one'] }, // Invalid
        }),
      ];
      const result = validateAllMcqOptions(questions);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`Question 2 (Multiple Choice) must have at least ${MCQ_MIN_OPTIONS} options`);
    });

    it('should include correct question number in error message', () => {
      const questions = [
        createQuestion({ id: '1', type: 'text' }),
        createQuestion({
          id: '2',
          type: 'mcq_single',
          config: { options: ['Yes', 'No'] },
        }),
        createQuestion({ id: '3', type: 'likert' }),
        createQuestion({
          id: '4',
          type: 'mcq_single',
          config: { options: ['Only one'] }, // Invalid - 4th question
        }),
      ];
      const result = validateAllMcqOptions(questions);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Question 4');
    });
  });

  describe('validateTargeting', () => {
    it('should pass when targeting all users', () => {
      const result = validateTargeting('all_users', []);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when targeting specific villages', () => {
      const result = validateTargeting('specific_villages', []);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when targeting by role', () => {
      const result = validateTargeting('by_role', []);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail when targeting specific panels but none selected', () => {
      const result = validateTargeting('specific_panels', []);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('At least one panel must be selected when targeting specific panels');
    });

    it('should pass when targeting specific panels with at least one selected', () => {
      const result = validateTargeting('specific_panels', ['panel-1']);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when targeting specific panels with multiple selected', () => {
      const result = validateTargeting('specific_panels', ['panel-1', 'panel-2', 'panel-3']);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });
  });

  describe('validateDateRange', () => {
    it('should pass when both dates are empty', () => {
      const result = validateDateRange('', '');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when start date is empty', () => {
      const result = validateDateRange('', '2024-12-31T23:59');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when end date is empty', () => {
      const result = validateDateRange('2024-01-01T00:00', '');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail when start date is after end date', () => {
      const result = validateDateRange('2024-12-31T23:59', '2024-01-01T00:00');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('End date must be after start date');
    });

    it('should fail when start date equals end date', () => {
      const result = validateDateRange('2024-06-15T12:00', '2024-06-15T12:00');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('End date must be after start date');
    });

    it('should pass when end date is after start date', () => {
      const result = validateDateRange('2024-01-01T00:00', '2024-12-31T23:59');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass with dates 1 second apart', () => {
      const result = validateDateRange('2024-06-15T12:00:00', '2024-06-15T12:00:01');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });
  });

  describe('validateMaxResponses', () => {
    it('should pass when maxResponses is null', () => {
      const result = validateMaxResponses(null);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when maxResponses is undefined', () => {
      const result = validateMaxResponses(undefined);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when maxResponses is empty string', () => {
      const result = validateMaxResponses('');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail when maxResponses is zero', () => {
      const result = validateMaxResponses(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Maximum responses must be a positive number');
    });

    it('should fail when maxResponses is negative', () => {
      const result = validateMaxResponses(-1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Maximum responses must be a positive number');
    });

    it('should pass when maxResponses is positive number', () => {
      const result = validateMaxResponses(100);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when maxResponses is 1', () => {
      const result = validateMaxResponses(1);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should pass when maxResponses is positive string number', () => {
      const result = validateMaxResponses('100');
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail when maxResponses is negative string number', () => {
      const result = validateMaxResponses('-10');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Maximum responses must be a positive number');
    });

    it('should fail when maxResponses is invalid string', () => {
      const result = validateMaxResponses('not-a-number');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Maximum responses must be a valid number');
    });
  });

  describe('validateQuestionnaireForm', () => {
    const validFormData = {
      title: 'Valid Questionnaire Title',
      questions: [
        createQuestion({
          id: '1',
          text: 'Question 1',
        }),
      ],
      targetingType: 'all_users',
      selectedPanels: [],
    };

    it('should pass with all valid data', () => {
      const result = validateQuestionnaireForm(validFormData);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should fail with invalid title and return title error first', () => {
      const result = validateQuestionnaireForm({
        ...validFormData,
        title: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('should fail with no questions and return questions error', () => {
      const result = validateQuestionnaireForm({
        ...validFormData,
        questions: [],
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('At least one question is required');
    });

    it('should fail with question without text', () => {
      const result = validateQuestionnaireForm({
        ...validFormData,
        questions: [createQuestion({ text: '' })],
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Question text is required');
    });

    it('should fail with MCQ question without sufficient options', () => {
      const result = validateQuestionnaireForm({
        ...validFormData,
        questions: [
          createQuestion({
            type: 'mcq_single',
            text: 'Choose one',
            config: { options: ['Only one option'] },
          }),
        ],
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must have at least 2 options');
    });

    it('should fail with specific_panels targeting but no panels selected', () => {
      const result = validateQuestionnaireForm({
        ...validFormData,
        targetingType: 'specific_panels',
        selectedPanels: [],
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('At least one panel must be selected when targeting specific panels');
    });

    it('should fail with invalid date range', () => {
      const result = validateQuestionnaireForm({
        ...validFormData,
        startAt: '2024-12-31T23:59',
        endAt: '2024-01-01T00:00',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('End date must be after start date');
    });

    it('should fail with invalid maxResponses', () => {
      const result = validateQuestionnaireForm({
        ...validFormData,
        maxResponses: -5,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Maximum responses must be a positive number');
    });

    it('should pass with all optional fields provided and valid', () => {
      const result = validateQuestionnaireForm({
        title: 'Complete Questionnaire',
        questions: [
          createQuestion({
            id: '1',
            type: 'text',
            text: 'Question 1',
          }),
          createQuestion({
            id: '2',
            type: 'mcq_single',
            text: 'Question 2',
            config: { options: ['Yes', 'No', 'Maybe'] },
          }),
        ],
        targetingType: 'specific_panels',
        selectedPanels: ['panel-1', 'panel-2'],
        startAt: '2024-01-01T00:00',
        endAt: '2024-12-31T23:59',
        maxResponses: 100,
      });
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });
  });

  describe('calculateValidationStatus', () => {
    const validQuestion = createQuestion({
      text: 'Valid question',
    });

    it('should return all checks as false for empty form', () => {
      const status = calculateValidationStatus('', [], 'all_users');
      expect(status.hasTitle).toBe(false);
      expect(status.hasQuestions).toBe(false);
      expect(status.questionsHaveText).toBe(true); // No questions to validate
      expect(status.mcqHaveOptions).toBe(true); // No MCQ questions
      expect(status.hasTargeting).toBe(true); // all_users is valid
      expect(status.validDates).toBe(true); // No dates provided
      expect(status.validMaxResponses).toBe(true); // No maxResponses
      expect(status.isValid).toBe(false);
    });

    it('should return all checks as true for valid form', () => {
      const status = calculateValidationStatus(
        'Valid Title',
        [validQuestion],
        'all_users',
        [],
        '',
        '',
        undefined
      );
      expect(status.hasTitle).toBe(true);
      expect(status.hasQuestions).toBe(true);
      expect(status.questionsHaveText).toBe(true);
      expect(status.mcqHaveOptions).toBe(true);
      expect(status.hasTargeting).toBe(true);
      expect(status.validDates).toBe(true);
      expect(status.validMaxResponses).toBe(true);
      expect(status.isValid).toBe(true);
    });

    it('should identify invalid title', () => {
      const status = calculateValidationStatus('AB', [validQuestion], 'all_users');
      expect(status.hasTitle).toBe(false);
      expect(status.isValid).toBe(false);
    });

    it('should identify missing questions', () => {
      const status = calculateValidationStatus('Valid Title', [], 'all_users');
      expect(status.hasQuestions).toBe(false);
      expect(status.isValid).toBe(false);
    });

    it('should identify questions without text', () => {
      const invalidQuestion = createQuestion({ text: '' });
      const status = calculateValidationStatus('Valid Title', [invalidQuestion], 'all_users');
      expect(status.questionsHaveText).toBe(false);
      expect(status.isValid).toBe(false);
    });

    it('should identify MCQ without sufficient options', () => {
      const mcqQuestion = createQuestion({
        type: 'mcq_single',
        text: 'Choose',
        config: { options: ['Only one'] },
      });
      const status = calculateValidationStatus('Valid Title', [mcqQuestion], 'all_users');
      expect(status.mcqHaveOptions).toBe(false);
      expect(status.isValid).toBe(false);
    });

    it('should identify invalid targeting', () => {
      const status = calculateValidationStatus('Valid Title', [validQuestion], 'specific_panels', []);
      expect(status.hasTargeting).toBe(false);
      expect(status.isValid).toBe(false);
    });

    it('should identify invalid date range', () => {
      const status = calculateValidationStatus(
        'Valid Title',
        [validQuestion],
        'all_users',
        [],
        '2024-12-31',
        '2024-01-01'
      );
      expect(status.validDates).toBe(false);
      expect(status.isValid).toBe(false);
    });

    it('should identify invalid maxResponses', () => {
      const status = calculateValidationStatus(
        'Valid Title',
        [validQuestion],
        'all_users',
        [],
        '',
        '',
        -10
      );
      expect(status.validMaxResponses).toBe(false);
      expect(status.isValid).toBe(false);
    });

    it('should handle multiple validation failures', () => {
      const invalidQuestion = createQuestion({ text: '' });
      const status = calculateValidationStatus(
        'AB', // Invalid title
        [invalidQuestion], // Invalid question text
        'specific_panels', // Invalid targeting (no panels)
        [],
        '2024-12-31', // Invalid date range
        '2024-01-01',
        -5 // Invalid maxResponses
      );
      expect(status.hasTitle).toBe(false);
      expect(status.questionsHaveText).toBe(false);
      expect(status.hasTargeting).toBe(false);
      expect(status.validDates).toBe(false);
      expect(status.validMaxResponses).toBe(false);
      expect(status.isValid).toBe(false);
    });

    it('should validate complex valid form', () => {
      const questions = [
        createQuestion({
          id: '1',
          type: 'text',
          text: 'Text question',
        }),
        createQuestion({
          id: '2',
          type: 'mcq_single',
          text: 'MCQ question',
          config: { options: ['Option 1', 'Option 2', 'Option 3'] },
        }),
        createQuestion({
          id: '3',
          type: 'likert',
          text: 'Likert question',
          config: { scale: 5 },
        }),
      ];

      const status = calculateValidationStatus(
        'Comprehensive Survey 2024',
        questions,
        'specific_panels',
        ['panel-1', 'panel-2'],
        '2024-01-01T00:00',
        '2024-12-31T23:59',
        500
      );

      expect(status.hasTitle).toBe(true);
      expect(status.hasQuestions).toBe(true);
      expect(status.questionsHaveText).toBe(true);
      expect(status.mcqHaveOptions).toBe(true);
      expect(status.hasTargeting).toBe(true);
      expect(status.validDates).toBe(true);
      expect(status.validMaxResponses).toBe(true);
      expect(status.isValid).toBe(true);
    });
  });
});
