'use client';

import { useCallback, useMemo } from 'react';
import { useAutosave } from '@/hooks/use-autosave';
import { AutosaveIndicator } from './AutosaveIndicator';
import type { Question } from './question-builder';

interface QuestionnaireAutosaveWrapperProps {
  /** Draft ID - if null, will create new draft on first save */
  draftId: string | null;

  /** Callback to set draft ID after first save */
  onDraftIdChange: (id: string) => void;

  /** Form data to save */
  formData: {
    title: string;
    questions: Question[];
    targetingType: string;
    selectedPanels: string[];
    anonymous: boolean;
    responseLimit: string;
    startAt: string;
    endAt: string;
    maxResponses: string | number;
  };

  /** Children to render */
  children: React.ReactNode;

  /** Whether autosave is enabled */
  enabled?: boolean;
}

/**
 * Wrapper component that adds autosave functionality to questionnaire forms
 *
 * Features:
 * - Automatically saves draft every 30 seconds after changes
 * - Shows visual feedback of save status
 * - Handles network failures with retry logic
 * - Creates draft on first save, then updates existing draft
 *
 * Usage:
 * ```tsx
 * <QuestionnaireAutosaveWrapper
 *   draftId={draftId}
 *   onDraftIdChange={setDraftId}
 *   formData={{ title, questions, ... }}
 * >
 *   <YourFormComponents />
 * </QuestionnaireAutosaveWrapper>
 * ```
 */
export function QuestionnaireAutosaveWrapper({
  draftId,
  onDraftIdChange,
  formData,
  children,
  enabled = true,
}: QuestionnaireAutosaveWrapperProps) {
  /**
   * Autosave function - saves draft to server
   * Called automatically every 30 seconds if there are changes
   */
  const performAutosave = useCallback(async () => {
    const { title, questions, targetingType, selectedPanels, anonymous, responseLimit, startAt, endAt, maxResponses } = formData;

    // Don't autosave if form is empty or invalid for basic fields
    if (!title.trim() || title.length < 3) {
      console.log('Skipping autosave: title too short');
      return;
    }

    if (questions.length === 0) {
      console.log('Skipping autosave: no questions');
      return;
    }

    // Transform questions to match API format
    const transformedQuestions = questions.map((q, index) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      required: q.required,
      order: index,
      config: q.config,
    }));

    const draftData = {
      title: title.trim(),
      questions: transformedQuestions,
      targeting: {
        type: targetingType,
        panelIds: targetingType === 'specific_panels' ? selectedPanels : [],
        villageIds: [],
        roles: [],
      },
      anonymous,
      responseLimit: responseLimit === 'unlimited' ? 0 : parseInt(responseLimit, 10),
      startAt: startAt ? new Date(startAt).toISOString() : null,
      endAt: endAt ? new Date(endAt).toISOString() : null,
      maxResponses: maxResponses ? Number(maxResponses) : null,
    };

    if (draftId) {
      // Update existing draft
      const response = await fetch(`/api/questionnaires/${draftId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update draft');
      }
    } else {
      // Create new draft
      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create draft');
      }

      const data = await response.json();
      // Set the draft ID for future updates
      onDraftIdChange(data.data.id);
    }
  }, [draftId, formData, onDraftIdChange]);

  /**
   * Memoize form data to prevent unnecessary re-renders
   */
  const memoizedFormData = useMemo(() => formData, [
    formData,
  ]);

  /**
   * Autosave hook - handles automatic saving with debouncing and network resilience
   */
  const autosave = useAutosave({
    data: memoizedFormData,
    onSave: performAutosave,
    debounceDelay: 30000, // 30 seconds
    enabled,
  });

  return (
    <div className="space-y-4">
      {/* Autosave indicator - shows save status */}
      <div className="flex justify-end">
        <AutosaveIndicator state={autosave.state} />
      </div>

      {/* Form content */}
      {children}
    </div>
  );
}
