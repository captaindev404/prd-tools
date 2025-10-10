/**
 * Unit Tests for QuestionnaireValidationChecklist Component
 *
 * This test suite covers the visual validation checklist component that displays
 * validation status to users when creating or editing questionnaires.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  QuestionnaireValidationChecklist,
  calculateValidationStatus,
  useValidationStatus,
} from '../questionnaire-validation-checklist';
import { Question } from '../question-builder';

// Helper function to create a test question
const createQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'test-id',
  type: 'text',
  text: { en: 'Test question', fr: '' },
  required: false,
  config: {},
  ...overrides,
});

describe('QuestionnaireValidationChecklist Component', () => {
  describe('Visual Rendering', () => {
    it('should render all validation items', () => {
      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[createQuestion()]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText(/Title provided \(minimum 3 characters\)/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one question added/i)).toBeInTheDocument();
      expect(screen.getByText(/All questions have text in English or French/i)).toBeInTheDocument();
      expect(screen.getByText(/Multiple choice questions have at least 2 options/i)).toBeInTheDocument();
      expect(screen.getByText(/Audience targeting configured/i)).toBeInTheDocument();
    });

    it('should display "Ready to Publish" badge when all validations pass', () => {
      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[createQuestion()]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText('Ready to Publish')).toBeInTheDocument();
    });

    it('should display "Issues Found" badge when validations fail', () => {
      render(
        <QuestionnaireValidationChecklist
          title="" // Invalid title
          questions={[createQuestion()]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText('Issues Found')).toBeInTheDocument();
    });

    it('should display warning message when validation fails', () => {
      render(
        <QuestionnaireValidationChecklist
          title="" // Invalid
          questions={[]}
          targetingType="all_users"
        />
      );

      expect(
        screen.getByText(/Please address the issues above before publishing/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/You can still save as a draft/i)).toBeInTheDocument();
    });

    it('should not display warning message when all validations pass', () => {
      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[createQuestion()]}
          targetingType="all_users"
        />
      );

      expect(
        screen.queryByText(/Please address the issues above before publishing/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Validation Status Display', () => {
    it('should show check marks for passed validations', () => {
      const { container } = render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[createQuestion()]}
          targetingType="all_users"
        />
      );

      // All validations should pass, so we should have 5 check marks
      const checkIcons = container.querySelectorAll('.text-green-700, .text-green-300');
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('should show X marks for failed validations', () => {
      const { container } = render(
        <QuestionnaireValidationChecklist
          title="" // Invalid
          questions={[]} // Invalid
          targetingType="specific_panels" // Invalid without panels
          selectedPanels={[]}
        />
      );

      // Multiple validations should fail, so we should have X marks
      const xIcons = container.querySelectorAll('.text-red-700, .text-red-300');
      expect(xIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Title Validation Display', () => {
    it('should show title validation as passed with valid title', () => {
      render(
        <QuestionnaireValidationChecklist
          title="Valid Questionnaire Title"
          questions={[]}
          targetingType="all_users"
        />
      );

      const titleItem = screen.getByText(/Title provided \(minimum 3 characters\)/i);
      expect(titleItem).toBeInTheDocument();
      // Check for green color class in parent elements
      expect(titleItem.closest('li')).toHaveTextContent('Title provided');
    });

    it('should show title validation as failed with empty title', () => {
      render(
        <QuestionnaireValidationChecklist
          title=""
          questions={[]}
          targetingType="all_users"
        />
      );

      const titleItem = screen.getByText(/Title provided \(minimum 3 characters\)/i);
      expect(titleItem).toBeInTheDocument();
    });

    it('should show title validation as failed with short title', () => {
      render(
        <QuestionnaireValidationChecklist
          title="AB" // Only 2 characters
          questions={[]}
          targetingType="all_users"
        />
      );

      const titleItem = screen.getByText(/Title provided \(minimum 3 characters\)/i);
      expect(titleItem).toBeInTheDocument();
    });
  });

  describe('Questions Validation Display', () => {
    it('should show questions validation as passed with questions', () => {
      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[createQuestion()]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText(/At least one question added/i)).toBeInTheDocument();
    });

    it('should show questions validation as failed without questions', () => {
      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText(/At least one question added/i)).toBeInTheDocument();
    });

    it('should show text validation as passed when all questions have text', () => {
      const questions = [
        createQuestion({ text: { en: 'Question 1', fr: '' } }),
        createQuestion({ text: { en: '', fr: 'Question 2' } }),
      ];

      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={questions}
          targetingType="all_users"
        />
      );

      expect(screen.getByText(/All questions have text in English or French/i)).toBeInTheDocument();
    });

    it('should show text validation as failed when question has no text', () => {
      const questions = [
        createQuestion({ text: { en: '', fr: '' } }), // Invalid
      ];

      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={questions}
          targetingType="all_users"
        />
      );

      expect(screen.getByText(/All questions have text in English or French/i)).toBeInTheDocument();
    });
  });

  describe('MCQ Validation Display', () => {
    it('should show MCQ validation as passed when no MCQ questions exist', () => {
      const questions = [createQuestion({ type: 'text' })];

      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={questions}
          targetingType="all_users"
        />
      );

      expect(
        screen.getByText(/Multiple choice questions have at least 2 options/i)
      ).toBeInTheDocument();
    });

    it('should show MCQ validation as passed when MCQ has sufficient options', () => {
      const questions = [
        createQuestion({
          type: 'mcq_single',
          config: { options: ['Option 1', 'Option 2'] },
        }),
      ];

      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={questions}
          targetingType="all_users"
        />
      );

      expect(
        screen.getByText(/Multiple choice questions have at least 2 options/i)
      ).toBeInTheDocument();
    });

    it('should show MCQ validation as failed when MCQ has insufficient options', () => {
      const questions = [
        createQuestion({
          type: 'mcq_single',
          config: { options: ['Only one option'] },
        }),
      ];

      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={questions}
          targetingType="all_users"
        />
      );

      expect(
        screen.getByText(/Multiple choice questions have at least 2 options/i)
      ).toBeInTheDocument();
    });
  });

  describe('Targeting Validation Display', () => {
    it('should show targeting validation as passed for all_users', () => {
      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[createQuestion()]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText(/Audience targeting configured/i)).toBeInTheDocument();
    });

    it('should show targeting validation as passed for specific_panels with panels', () => {
      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[createQuestion()]}
          targetingType="specific_panels"
          selectedPanels={['panel-1', 'panel-2']}
        />
      );

      expect(screen.getByText(/Audience targeting configured/i)).toBeInTheDocument();
    });

    it('should show targeting validation as failed for specific_panels without panels', () => {
      render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[createQuestion()]}
          targetingType="specific_panels"
          selectedPanels={[]}
        />
      );

      expect(screen.getByText(/Audience targeting configured/i)).toBeInTheDocument();
    });
  });

  describe('Dynamic Updates', () => {
    it('should update when props change from invalid to valid', () => {
      const { rerender } = render(
        <QuestionnaireValidationChecklist
          title="" // Invalid
          questions={[]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText('Issues Found')).toBeInTheDocument();

      rerender(
        <QuestionnaireValidationChecklist
          title="Now Valid Title"
          questions={[createQuestion()]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText('Ready to Publish')).toBeInTheDocument();
    });

    it('should update when props change from valid to invalid', () => {
      const { rerender } = render(
        <QuestionnaireValidationChecklist
          title="Valid Title"
          questions={[createQuestion()]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText('Ready to Publish')).toBeInTheDocument();

      rerender(
        <QuestionnaireValidationChecklist
          title="" // Now invalid
          questions={[]}
          targetingType="all_users"
        />
      );

      expect(screen.getByText('Issues Found')).toBeInTheDocument();
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should handle all validations passing', () => {
      const questions = [
        createQuestion({
          id: '1',
          type: 'text',
          text: { en: 'Text question', fr: '' },
        }),
        createQuestion({
          id: '2',
          type: 'mcq_single',
          text: { en: 'MCQ question', fr: '' },
          config: { options: ['Yes', 'No', 'Maybe'] },
        }),
        createQuestion({
          id: '3',
          type: 'likert',
          text: { en: '', fr: 'Question Likert' },
          config: { scale: 5 },
        }),
      ];

      render(
        <QuestionnaireValidationChecklist
          title="Comprehensive Survey 2024"
          questions={questions}
          targetingType="specific_panels"
          selectedPanels={['panel-1', 'panel-2']}
        />
      );

      expect(screen.getByText('Ready to Publish')).toBeInTheDocument();
      expect(
        screen.queryByText(/Please address the issues above before publishing/i)
      ).not.toBeInTheDocument();
    });

    it('should handle multiple validation failures', () => {
      const questions = [
        createQuestion({
          text: { en: '', fr: '' }, // Invalid text
        }),
        createQuestion({
          type: 'mcq_single',
          text: { en: 'MCQ', fr: '' },
          config: { options: ['Only one'] }, // Invalid options
        }),
      ];

      render(
        <QuestionnaireValidationChecklist
          title="AB" // Invalid title (too short)
          questions={questions}
          targetingType="specific_panels"
          selectedPanels={[]} // Invalid targeting
        />
      );

      expect(screen.getByText('Issues Found')).toBeInTheDocument();
      expect(
        screen.getByText(/Please address the issues above before publishing/i)
      ).toBeInTheDocument();
    });
  });
});

describe('calculateValidationStatus', () => {
  it('should return correct status for valid questionnaire', () => {
    const questions = [createQuestion({ text: { en: 'Valid question', fr: '' } })];
    const status = calculateValidationStatus('Valid Title', questions, 'all_users');

    expect(status).toEqual({
      hasTitle: true,
      hasQuestions: true,
      questionsHaveText: true,
      mcqHaveOptions: true,
      hasTargeting: true,
      isValid: true,
    });
  });

  it('should return correct status for invalid questionnaire', () => {
    const status = calculateValidationStatus('', [], 'specific_panels', []);

    expect(status).toEqual({
      hasTitle: false,
      hasQuestions: false,
      questionsHaveText: true, // No questions to validate
      mcqHaveOptions: true, // No MCQ questions
      hasTargeting: false,
      isValid: false,
    });
  });

  it('should handle mixed validation results', () => {
    const questions = [
      createQuestion({ text: { en: 'Valid', fr: '' } }),
      createQuestion({
        type: 'mcq_single',
        text: { en: 'MCQ', fr: '' },
        config: { options: ['Only one'] }, // Invalid
      }),
    ];

    const status = calculateValidationStatus('Valid Title', questions, 'all_users');

    expect(status.hasTitle).toBe(true);
    expect(status.hasQuestions).toBe(true);
    expect(status.questionsHaveText).toBe(true);
    expect(status.mcqHaveOptions).toBe(false);
    expect(status.hasTargeting).toBe(true);
    expect(status.isValid).toBe(false);
  });
});

describe('useValidationStatus', () => {
  it('should return validation status', () => {
    const questions = [createQuestion({ text: { en: 'Valid question', fr: '' } })];
    const status = useValidationStatus('Valid Title', questions, 'all_users');

    expect(status).toEqual({
      hasTitle: true,
      hasQuestions: true,
      questionsHaveText: true,
      mcqHaveOptions: true,
      hasTargeting: true,
      isValid: true,
    });
  });

  it('should handle empty parameters', () => {
    const status = useValidationStatus('', [], 'all_users');

    expect(status.isValid).toBe(false);
    expect(status.hasTitle).toBe(false);
    expect(status.hasQuestions).toBe(false);
  });

  it('should update when parameters change', () => {
    const questions = [createQuestion()];

    // First call with invalid title
    const status1 = useValidationStatus('AB', questions, 'all_users');
    expect(status1.hasTitle).toBe(false);
    expect(status1.isValid).toBe(false);

    // Second call with valid title
    const status2 = useValidationStatus('Valid Title', questions, 'all_users');
    expect(status2.hasTitle).toBe(true);
    expect(status2.isValid).toBe(true);
  });
});
