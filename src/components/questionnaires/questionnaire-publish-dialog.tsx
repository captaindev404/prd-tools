'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QuestionnaireValidationChecklist, calculateValidationStatus } from './questionnaire-validation-checklist';
import { Question } from './question-builder';
import { Loader2 } from 'lucide-react';

interface QuestionnairePublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  questions: Question[];
  targetingType: string;
  selectedPanels: string[];
  isSubmitting: boolean;
  estimatedReach?: number | null;
}

/**
 * Publish Confirmation Dialog
 *
 * Displays a confirmation dialog with validation checklist before publishing.
 * Prevents publishing if validation fails.
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param onConfirm - Callback when publish is confirmed
 * @param title - Questionnaire title
 * @param questions - Array of questions
 * @param targetingType - Targeting type
 * @param selectedPanels - Selected panel IDs
 * @param isSubmitting - Whether the form is currently submitting
 * @param estimatedReach - Estimated number of users who will see the questionnaire
 */
export function QuestionnairePublishDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  questions,
  targetingType,
  selectedPanels,
  isSubmitting,
  estimatedReach,
}: QuestionnairePublishDialogProps) {
  const validationStatus = calculateValidationStatus(
    title,
    questions,
    targetingType,
    selectedPanels
  );

  const handleConfirm = () => {
    if (!validationStatus.isValid) {
      return;
    }
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Questionnaire?</AlertDialogTitle>
          <AlertDialogDescription>
            This questionnaire will become immediately available to your target audience.
            {estimatedReach !== null && estimatedReach !== undefined && (
              <span className="block mt-2 font-medium text-foreground">
                Estimated reach: {estimatedReach.toLocaleString()}{' '}
                {estimatedReach === 1 ? 'user' : 'users'}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <QuestionnaireValidationChecklist
            title={title}
            questions={questions}
            targetingType={targetingType}
            selectedPanels={selectedPanels}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!validationStatus.isValid || isSubmitting}
            className={!validationStatus.isValid ? 'cursor-not-allowed opacity-50' : ''}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Now'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
