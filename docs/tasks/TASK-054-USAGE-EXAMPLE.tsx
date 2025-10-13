/**
 * Example: How to integrate autosave into QuestionnaireCreateForm
 *
 * This file shows the minimal changes needed to add autosave functionality
 * to the questionnaire creation form.
 */

'use client';

import { useState } from 'react';
import { QuestionnaireAutosaveWrapper } from '@/components/questionnaires/questionnaire-autosave-wrapper';
import type { Question } from '@/components/questionnaires/question-builder';

// Your existing form component
function QuestionnaireCreateFormExample() {
  // Add draft ID state
  const [draftId, setDraftId] = useState<string | null>(null);

  // Your existing form state
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [targetingType, setTargetingType] = useState('all_users');
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [responseLimit, setResponseLimit] = useState('unlimited');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [maxResponses, setMaxResponses] = useState<string | number>('');

  return (
    // Wrap your form with the autosave wrapper
    <QuestionnaireAutosaveWrapper
      draftId={draftId}
      onDraftIdChange={setDraftId}
      formData={{
        title,
        questions,
        targetingType,
        selectedPanels,
        anonymous,
        responseLimit,
        startAt,
        endAt,
        maxResponses,
      }}
    >
      {/* Your existing form JSX */}
      <form>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Questionnaire Title"
        />

        {/* Rest of your form... */}
      </form>
    </QuestionnaireAutosaveWrapper>
  );
}

/**
 * Alternative: Direct hook usage (if you want more control)
 */
function QuestionnaireFormWithDirectHook() {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  // ... other state

  // Use the hook directly
  const autosave = useAutosave({
    data: {
      title,
      questions,
      // ... other form data
    },
    onSave: async (data) => {
      // Don't autosave if form is incomplete
      if (!data.title.trim() || data.title.length < 3) {
        return;
      }
      if (data.questions.length === 0) {
        return;
      }

      // Transform data
      const payload = {
        title: data.title.trim(),
        questions: data.questions.map((q, i) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          required: q.required,
          order: i,
          config: q.config,
        })),
        // ... other fields
      };

      // Save to API
      if (draftId) {
        // Update existing draft
        const response = await fetch(`/api/questionnaires/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to update draft');
        }
      } else {
        // Create new draft
        const response = await fetch('/api/questionnaires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to create draft');
        }

        const result = await response.json();
        setDraftId(result.data.id);
      }
    },
    debounceDelay: 30000, // 30 seconds
    enabled: true,
  });

  return (
    <div>
      {/* Show autosave indicator */}
      <AutosaveIndicator state={autosave.state} />

      {/* Your form */}
      <form>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {/* ... */}
      </form>

      {/* Manual save button (optional) */}
      <button
        onClick={() => autosave.actions.saveNow()}
        disabled={autosave.state.isSaving}
      >
        {autosave.state.isSaving ? 'Saving...' : 'Save Now'}
      </button>
    </div>
  );
}

/**
 * Testing autosave behavior
 */
function AutosaveTestScenarios() {
  /*
   * Scenario 1: Normal operation
   * 1. User types title "My Questionnaire"
   * 2. User adds a question
   * 3. After 30 seconds of inactivity -> autosave triggers
   * 4. Shows "Saving..." then "Last saved: just now"
   * 5. Timestamp updates: "1 minute ago", "2 minutes ago", etc.
   */

  /*
   * Scenario 2: Network failure
   * 1. User types and waits 30 seconds
   * 2. Network request fails (simulated with Network tab throttling)
   * 3. Retries after 1s, 2s, 4s (exponential backoff)
   * 4. After 3 retries, shows error: "Failed to save"
   * 5. User reconnects network
   * 6. Autosave automatically retries and succeeds
   */

  /*
   * Scenario 3: Incomplete form
   * 1. User types title "ab" (too short)
   * 2. After 30 seconds -> autosave skips (logs "title too short")
   * 3. User types more: "abc" (valid)
   * 4. User adds question
   * 5. After 30 seconds -> autosave succeeds
   */

  /*
   * Scenario 4: Rapid changes
   * 1. User types in title field
   * 2. Before 30 seconds, user adds question
   * 3. Before 30 seconds, user changes targeting
   * 4. Only one autosave fires 30 seconds after last change
   * 5. All changes are saved together
   */

  /*
   * Scenario 5: Manual save during autosave
   * 1. User makes changes
   * 2. After 29 seconds, user clicks "Save as Draft"
   * 3. Manual save completes
   * 4. Autosave timer is cleared (no duplicate save)
   * 5. Next autosave fires 30 seconds after next change
   */
}

/**
 * Keyboard shortcuts still work
 */
function KeyboardShortcutExample() {
  /*
   * Ctrl+Enter (or Cmd+Enter on Mac):
   * - Still saves draft immediately
   * - Separate from autosave
   * - Clears autosave timer
   *
   * Escape:
   * - Navigates back
   * - Any unsaved changes preserved in autosaved draft
   */
}

export {
  QuestionnaireCreateFormExample,
  QuestionnaireFormWithDirectHook,
  AutosaveTestScenarios,
  KeyboardShortcutExample,
};
