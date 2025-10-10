'use client';

import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Question } from './question-builder';

export interface ValidationStatus {
  hasTitle: boolean;
  hasQuestions: boolean;
  questionsHaveText: boolean;
  mcqHaveOptions: boolean;
  hasTargeting: boolean;
  isValid: boolean; // All above are true
}

interface QuestionnaireValidationChecklistProps {
  title: string;
  questions: Question[];
  targetingType: string;
  selectedPanels?: string[];
}

/**
 * Validation Checklist Component
 *
 * Displays a visual checklist of validation requirements for publishing a questionnaire.
 * Shows check marks for passed validations and X marks for failed validations.
 *
 * @param title - Questionnaire title
 * @param questions - Array of questions
 * @param targetingType - Targeting type (all_users, specific_panels, etc.)
 * @param selectedPanels - Array of selected panel IDs (for specific_panels targeting)
 */
export function QuestionnaireValidationChecklist({
  title,
  questions,
  targetingType,
  selectedPanels = [],
}: QuestionnaireValidationChecklistProps) {
  const status = calculateValidationStatus(
    title,
    questions,
    targetingType,
    selectedPanels
  );

  const items = [
    {
      key: 'title',
      label: 'Title provided (minimum 3 characters)',
      passed: status.hasTitle,
    },
    {
      key: 'questions',
      label: 'At least one question added',
      passed: status.hasQuestions,
    },
    {
      key: 'translations',
      label: 'All questions have text',
      passed: status.questionsHaveText,
    },
    {
      key: 'mcq',
      label: 'Multiple choice questions have at least 2 options',
      passed: status.mcqHaveOptions,
    },
    {
      key: 'targeting',
      label: 'Audience targeting configured',
      passed: status.hasTargeting,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold">Validation Checklist</h4>
        <Badge variant={status.isValid ? 'default' : 'destructive'}>
          {status.isValid ? 'Ready to Publish' : 'Issues Found'}
        </Badge>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-2">
            <div className="mt-0.5 flex-shrink-0">
              {item.passed ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-3.5 w-3.5 text-green-700 dark:text-green-300" />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                  <X className="h-3.5 w-3.5 text-red-700 dark:text-red-300" />
                </div>
              )}
            </div>
            <span
              className={`text-sm ${
                item.passed
                  ? 'text-foreground'
                  : 'text-muted-foreground font-medium'
              }`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {!status.isValid && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Please address the issues above before publishing. You can still save as a draft.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Calculate validation status for a questionnaire
 *
 * @param title - Questionnaire title
 * @param questions - Array of questions
 * @param targetingType - Targeting type
 * @param selectedPanels - Selected panel IDs
 * @returns ValidationStatus object with individual checks and overall validity
 */
export function calculateValidationStatus(
  title: string,
  questions: Question[],
  targetingType: string,
  selectedPanels: string[] = []
): ValidationStatus {
  // 1. Title validation (minimum 3 characters)
  const hasTitle = title.trim().length >= 3;

  // 2. Questions validation (at least one question)
  const hasQuestions = questions.length > 0;

  // 3. Questions have text
  const questionsHaveText = questions.every(
    (q) => q && q.text.trim() !== ''
  );

  // 4. MCQ questions have at least 2 options
  const mcqQuestions = questions.filter(
    (q) => q.type === 'mcq_single' || q.type === 'mcq_multiple'
  );
  const mcqHaveOptions =
    mcqQuestions.length === 0 || // No MCQ questions, so this check passes
    mcqQuestions.every(
      (q) => q.config?.options && q.config.options.length >= 2
    );

  // 5. Targeting configured
  let hasTargeting = true;
  if (targetingType === 'specific_panels') {
    hasTargeting = selectedPanels.length > 0;
  }
  // Other targeting types (all_users, specific_villages, by_role) are valid by default
  // Can be extended later for specific_villages and by_role validation

  // Overall validation status
  const isValid =
    hasTitle &&
    hasQuestions &&
    questionsHaveText &&
    mcqHaveOptions &&
    hasTargeting;

  return {
    hasTitle,
    hasQuestions,
    questionsHaveText,
    mcqHaveOptions,
    hasTargeting,
    isValid,
  };
}

/**
 * Hook to get validation status
 * Useful for external components that need to check validation state
 */
export function useValidationStatus(
  title: string,
  questions: Question[],
  targetingType: string,
  selectedPanels: string[] = []
): ValidationStatus {
  return calculateValidationStatus(
    title,
    questions,
    targetingType,
    selectedPanels
  );
}
