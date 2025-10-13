/**
 * Unit Tests for Zod-based Questionnaire Validation
 *
 * This test suite validates the Zod schemas for questionnaire forms.
 * It ensures comprehensive validation of:
 * - Title (min/max length)
 * - Questions (types, text, config)
 * - MCQ options (min count, uniqueness)
 * - Targeting (panel/village/role selection)
 * - Date ranges (end after start)
 * - Max responses (positive integer)
 */

import {
  questionSchema,
  targetingSchema,
  createQuestionnaireSchema,
  questionnaireFormSchema,
  validateQuestionnaire,
  validateQuestionnaireForm,
  validateQuestion,
  transformFormToApiPayload,
  isMcqQuestion,
  hasMcqOptions,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  QUESTION_TEXT_MIN_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
  MCQ_MIN_OPTIONS,
  type QuestionInput,
  type QuestionnaireFormInput,
} from '../questionnaire-validation';

describe('Zod Questionnaire Validation', () => {
  describe('questionSchema', () => {
    it('should validate a basic text question', () => {
      const question = {
        id: 'q1',
        type: 'text' as const,
        text: 'What is your feedback?',
        required: false,
      };

      const result = questionSchema.safeParse(question);
      expect(result.success).toBe(true);
    });

    it('should fail when question text is too short', () => {
      const question = {
        id: 'q1',
        type: 'text' as const,
        text: 'Hi', // Only 2 characters, min is 5
        required: false,
      };

      const result = questionSchema.safeParse(question);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          `at least ${QUESTION_TEXT_MIN_LENGTH} characters`
        );
      }
    });

    it('should fail when question text exceeds maximum length', () => {
      const question = {
        id: 'q1',
        type: 'text' as const,
        text: 'A'.repeat(QUESTION_TEXT_MAX_LENGTH + 1),
        required: false,
      };

      const result = questionSchema.safeParse(question);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must not exceed');
      }
    });

    it('should validate MCQ question with valid options', () => {
      const question = {
        id: 'q1',
        type: 'mcq_single' as const,
        text: 'Choose your preference',
        required: true,
        config: {
          options: ['Option A', 'Option B', 'Option C'],
        },
      };

      const result = questionSchema.safeParse(question);
      expect(result.success).toBe(true);
    });

    it('should fail MCQ question with insufficient options', () => {
      const question = {
        id: 'q1',
        type: 'mcq_single' as const,
        text: 'Choose one',
        required: true,
        config: {
          options: ['Only one option'],
        },
      };

      const result = questionSchema.safeParse(question);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(`at least ${MCQ_MIN_OPTIONS} options`);
      }
    });

    it('should fail MCQ question with duplicate options', () => {
      const question = {
        id: 'q1',
        type: 'mcq_single' as const,
        text: 'Choose one',
        required: true,
        config: {
          options: ['Option A', 'option a', 'Option B'], // Duplicate (case-insensitive)
        },
      };

      const result = questionSchema.safeParse(question);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('unique');
      }
    });

    it('should validate Likert question with scale config', () => {
      const question = {
        id: 'q1',
        type: 'likert' as const,
        text: 'How satisfied are you?',
        required: true,
        config: {
          scale: 5 as const,
          labels: {
            lowest: 'Very Dissatisfied',
            highest: 'Very Satisfied',
          },
        },
      };

      const result = questionSchema.safeParse(question);
      expect(result.success).toBe(true);
    });

    it('should validate NPS question', () => {
      const question = {
        id: 'q1',
        type: 'nps' as const,
        text: 'How likely are you to recommend us?',
        required: true,
      };

      const result = questionSchema.safeParse(question);
      expect(result.success).toBe(true);
    });

    it('should validate rating question', () => {
      const question = {
        id: 'q1',
        type: 'rating' as const,
        text: 'Rate your experience',
        required: true,
        config: {
          maxRating: 5,
        },
      };

      const result = questionSchema.safeParse(question);
      expect(result.success).toBe(true);
    });
  });

  describe('targetingSchema', () => {
    it('should validate all_users targeting', () => {
      const targeting = {
        type: 'all_users' as const,
      };

      const result = targetingSchema.safeParse(targeting);
      expect(result.success).toBe(true);
    });

    it('should validate specific_panels targeting with panels', () => {
      const targeting = {
        type: 'specific_panels' as const,
        panelIds: ['pan_123', 'pan_456'],
      };

      const result = targetingSchema.safeParse(targeting);
      expect(result.success).toBe(true);
    });

    it('should fail specific_panels targeting without panels', () => {
      const targeting = {
        type: 'specific_panels' as const,
        panelIds: [],
      };

      const result = targetingSchema.safeParse(targeting);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one panel');
      }
    });

    it('should validate specific_villages targeting with villages', () => {
      const targeting = {
        type: 'specific_villages' as const,
        villageIds: ['vlg-001', 'vlg-002'],
      };

      const result = targetingSchema.safeParse(targeting);
      expect(result.success).toBe(true);
    });

    it('should fail specific_villages targeting without villages', () => {
      const targeting = {
        type: 'specific_villages' as const,
        villageIds: [],
      };

      const result = targetingSchema.safeParse(targeting);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one village');
      }
    });

    it('should validate by_role targeting with roles', () => {
      const targeting = {
        type: 'by_role' as const,
        roles: ['USER', 'PM'],
      };

      const result = targetingSchema.safeParse(targeting);
      expect(result.success).toBe(true);
    });

    it('should fail by_role targeting without roles', () => {
      const targeting = {
        type: 'by_role' as const,
        roles: [],
      };

      const result = targetingSchema.safeParse(targeting);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one role');
      }
    });
  });

  describe('createQuestionnaireSchema', () => {
    const validQuestionnaire = {
      title: 'Customer Satisfaction Survey',
      questions: [
        {
          id: 'q1',
          type: 'nps' as const,
          text: 'How likely are you to recommend us?',
          required: true,
        },
        {
          id: 'q2',
          type: 'text' as const,
          text: 'Any additional feedback?',
          required: false,
        },
      ],
      targeting: {
        type: 'all_users' as const,
      },
      anonymous: false,
      responseLimit: 1,
    };

    it('should validate a complete questionnaire', () => {
      const result = createQuestionnaireSchema.safeParse(validQuestionnaire);
      expect(result.success).toBe(true);
    });

    it('should fail with title too short', () => {
      const data = {
        ...validQuestionnaire,
        title: 'AB', // Too short
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(`at least ${TITLE_MIN_LENGTH}`);
      }
    });

    it('should fail with title too long', () => {
      const data = {
        ...validQuestionnaire,
        title: 'A'.repeat(TITLE_MAX_LENGTH + 1),
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must not exceed');
      }
    });

    it('should trim whitespace from title', () => {
      const data = {
        ...validQuestionnaire,
        title: '  Valid Title  ',
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Valid Title');
      }
    });

    it('should fail with no questions', () => {
      const data = {
        ...validQuestionnaire,
        questions: [],
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one question is required');
      }
    });

    it('should fail with duplicate question IDs', () => {
      const data = {
        ...validQuestionnaire,
        questions: [
          {
            id: 'q1',
            type: 'text' as const,
            text: 'Question 1',
            required: false,
          },
          {
            id: 'q1', // Duplicate ID
            type: 'text' as const,
            text: 'Question 2',
            required: false,
          },
        ],
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('unique');
      }
    });

    it('should validate with date range', () => {
      const data = {
        ...validQuestionnaire,
        startAt: '2024-01-01T00:00:00Z',
        endAt: '2024-12-31T23:59:59Z',
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail when end date is before start date', () => {
      const data = {
        ...validQuestionnaire,
        startAt: '2024-12-31T23:59:59Z',
        endAt: '2024-01-01T00:00:00Z',
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('End date must be after start date');
      }
    });

    it('should validate with maxResponses', () => {
      const data = {
        ...validQuestionnaire,
        maxResponses: 100,
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with negative maxResponses', () => {
      const data = {
        ...validQuestionnaire,
        maxResponses: -10,
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should fail with zero maxResponses', () => {
      const data = {
        ...validQuestionnaire,
        maxResponses: 0,
      };

      const result = createQuestionnaireSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('questionnaireFormSchema', () => {
    const validFormData: QuestionnaireFormInput = {
      title: 'Survey Form',
      questions: [
        {
          id: 'q1',
          type: 'text',
          text: 'What is your feedback?',
          required: false,
        },
      ],
      targetingType: 'all_users',
      selectedPanels: [],
      selectedVillages: [],
      selectedRoles: [],
      anonymous: false,
      responseLimit: 1,
      startAt: null,
      endAt: null,
      maxResponses: null,
    };

    it('should validate a complete form', () => {
      const result = questionnaireFormSchema.safeParse(validFormData);
      expect(result.success).toBe(true);
    });

    it('should fail when specific_panels selected but no panels provided', () => {
      const data = {
        ...validFormData,
        targetingType: 'specific_panels' as const,
        selectedPanels: [],
      };

      const result = questionnaireFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one panel');
      }
    });

    it('should validate when specific_panels with panels', () => {
      const data = {
        ...validFormData,
        targetingType: 'specific_panels' as const,
        selectedPanels: ['pan_123'],
      };

      const result = questionnaireFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail when specific_villages selected but no villages provided', () => {
      const data = {
        ...validFormData,
        targetingType: 'specific_villages' as const,
        selectedVillages: [],
      };

      const result = questionnaireFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one village');
      }
    });

    it('should fail when by_role selected but no roles provided', () => {
      const data = {
        ...validFormData,
        targetingType: 'by_role' as const,
        selectedRoles: [],
      };

      const result = questionnaireFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one role');
      }
    });

    it('should coerce string maxResponses to number', () => {
      const data = {
        ...validFormData,
        maxResponses: '50' as any, // String that should be coerced
      };

      const result = questionnaireFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxResponses).toBe(50);
        expect(typeof result.data.maxResponses).toBe('number');
      }
    });
  });

  describe('validateQuestionnaire', () => {
    it('should return success with valid data', () => {
      const data = {
        title: 'Valid Survey',
        questions: [
          {
            id: 'q1',
            type: 'text',
            text: 'What is your feedback?',
            required: false,
          },
        ],
        targeting: {
          type: 'all_users',
        },
      };

      const result = validateQuestionnaire(data);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should return formatted errors for invalid data', () => {
      const data = {
        title: 'AB', // Too short
        questions: [],
        targeting: {
          type: 'specific_panels',
          panelIds: [],
        },
      };

      const result = validateQuestionnaire(data);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.fieldErrors).toBeDefined();
    });

    it('should include field paths in errors', () => {
      const data = {
        title: 'Valid Title',
        questions: [
          {
            id: 'q1',
            type: 'mcq_single',
            text: 'Choose one',
            required: true,
            config: {
              options: ['Only one'], // Invalid
            },
          },
        ],
        targeting: {
          type: 'all_users',
        },
      };

      const result = validateQuestionnaire(data);
      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors!['questions.0.config.options']).toBeDefined();
    });
  });

  describe('validateQuestionnaireForm', () => {
    it('should validate form data successfully', () => {
      const formData = {
        title: 'Form Survey',
        questions: [
          {
            id: 'q1',
            type: 'text',
            text: 'Feedback?',
            required: false,
          },
        ],
        targetingType: 'all_users',
        selectedPanels: [],
        anonymous: false,
        responseLimit: 1,
      };

      const result = validateQuestionnaireForm(formData);
      expect(result.success).toBe(true);
    });

    it('should return errors for invalid form data', () => {
      const formData = {
        title: 'A', // Too short
        questions: [],
        targetingType: 'specific_panels',
        selectedPanels: [], // Missing
      };

      const result = validateQuestionnaireForm(formData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('validateQuestion', () => {
    it('should validate a single question', () => {
      const question = {
        id: 'q1',
        type: 'text',
        text: 'What do you think?',
        required: false,
      };

      const result = validateQuestion(question);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return errors for invalid question', () => {
      const question = {
        id: '',
        type: 'text',
        text: 'Hi', // Too short
        required: false,
      };

      const result = validateQuestion(question);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('transformFormToApiPayload', () => {
    it('should transform form data with all_users targeting', () => {
      const formData: QuestionnaireFormInput = {
        title: 'Survey',
        questions: [
          {
            id: 'q1',
            type: 'text',
            text: 'Feedback?',
            required: false,
          },
        ],
        targetingType: 'all_users',
        selectedPanels: [],
        selectedVillages: [],
        selectedRoles: [],
        anonymous: false,
        responseLimit: 1,
        startAt: null,
        endAt: null,
        maxResponses: null,
      };

      const payload = transformFormToApiPayload(formData);
      expect(payload.targeting.type).toBe('all_users');
      expect(payload.targeting.panelIds).toBeUndefined();
    });

    it('should transform form data with specific_panels targeting', () => {
      const formData: QuestionnaireFormInput = {
        title: 'Survey',
        questions: [
          {
            id: 'q1',
            type: 'text',
            text: 'Feedback?',
            required: false,
          },
        ],
        targetingType: 'specific_panels',
        selectedPanels: ['pan_123', 'pan_456'],
        selectedVillages: [],
        selectedRoles: [],
        anonymous: false,
        responseLimit: 1,
        startAt: null,
        endAt: null,
        maxResponses: null,
      };

      const payload = transformFormToApiPayload(formData);
      expect(payload.targeting.type).toBe('specific_panels');
      expect(payload.targeting.panelIds).toEqual(['pan_123', 'pan_456']);
    });

    it('should handle date strings correctly', () => {
      const formData: QuestionnaireFormInput = {
        title: 'Survey',
        questions: [
          {
            id: 'q1',
            type: 'text',
            text: 'Feedback?',
            required: false,
          },
        ],
        targetingType: 'all_users',
        selectedPanels: [],
        selectedVillages: [],
        selectedRoles: [],
        anonymous: false,
        responseLimit: 1,
        startAt: '2024-01-01T00:00:00Z',
        endAt: '2024-12-31T23:59:59Z',
        maxResponses: 100,
      };

      const payload = transformFormToApiPayload(formData);
      expect(payload.startAt).toBe('2024-01-01T00:00:00Z');
      expect(payload.endAt).toBe('2024-12-31T23:59:59Z');
      expect(payload.maxResponses).toBe(100);
    });
  });

  describe('Type Guards', () => {
    describe('isMcqQuestion', () => {
      it('should return true for mcq_single questions', () => {
        const question: QuestionInput = {
          id: 'q1',
          type: 'mcq_single',
          text: 'Choose',
          required: false,
          config: { options: ['A', 'B'] },
        };

        expect(isMcqQuestion(question)).toBe(true);
      });

      it('should return true for mcq_multiple questions', () => {
        const question: QuestionInput = {
          id: 'q1',
          type: 'mcq_multiple',
          text: 'Choose',
          required: false,
          config: { options: ['A', 'B'] },
        };

        expect(isMcqQuestion(question)).toBe(true);
      });

      it('should return false for non-MCQ questions', () => {
        const question: QuestionInput = {
          id: 'q1',
          type: 'text',
          text: 'Feedback?',
          required: false,
        };

        expect(isMcqQuestion(question)).toBe(false);
      });
    });

    describe('hasMcqOptions', () => {
      it('should return true for config with options array', () => {
        const config = { options: ['A', 'B', 'C'] };
        expect(hasMcqOptions(config)).toBe(true);
      });

      it('should return false for config without options', () => {
        const config = { scale: 5 };
        expect(hasMcqOptions(config)).toBe(false);
      });

      it('should return false for null or undefined', () => {
        expect(hasMcqOptions(null)).toBe(false);
        expect(hasMcqOptions(undefined)).toBe(false);
      });
    });
  });
});
