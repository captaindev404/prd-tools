import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutosaveOptions<T> {
  /**
   * The data to save
   */
  data: T;

  /**
   * Function to save the data (should return a promise)
   */
  onSave: (data: T) => Promise<void>;

  /**
   * Debounce delay in milliseconds (time to wait after last change before saving)
   * Default: 30000 (30 seconds)
   */
  debounceDelay?: number;

  /**
   * Whether autosave is enabled
   * Default: true
   */
  enabled?: boolean;

  /**
   * Retry configuration
   */
  retryConfig?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  };
}

export interface AutosaveState {
  /**
   * Whether a save operation is in progress
   */
  isSaving: boolean;

  /**
   * Whether there are unsaved changes
   */
  hasUnsavedChanges: boolean;

  /**
   * Timestamp of last successful save
   */
  lastSaved: Date | null;

  /**
   * Last error that occurred during save
   */
  error: Error | null;

  /**
   * Number of retry attempts for current save
   */
  retryCount: number;
}

export interface AutosaveActions {
  /**
   * Manually trigger a save
   */
  saveNow: () => Promise<void>;

  /**
   * Mark data as changed (triggers autosave after debounce)
   */
  markAsChanged: () => void;

  /**
   * Clear unsaved changes flag (useful after manual save)
   */
  clearUnsavedChanges: () => void;

  /**
   * Reset error state
   */
  clearError: () => void;
}

/**
 * Custom hook for autosaving data with debouncing and network resilience
 *
 * Features:
 * - Automatic saving after debounce delay
 * - Tracks unsaved changes
 * - Shows last saved timestamp
 * - Handles network failures with exponential backoff
 * - Doesn't interrupt user workflow
 *
 * @example
 * ```tsx
 * const { state, actions } = useAutosave({
 *   data: formData,
 *   onSave: async (data) => {
 *     await fetch('/api/save', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     });
 *   },
 *   debounceDelay: 30000 // 30 seconds
 * });
 * ```
 */
export function useAutosave<T>({
  data,
  onSave,
  debounceDelay = 30000,
  enabled = true,
  retryConfig = {},
}: AutosaveOptions<T>): { state: AutosaveState; actions: AutosaveActions } {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
  } = retryConfig;

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs to track state without triggering re-renders
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T>(data);
  const isSavingRef = useRef(false);
  const isOnlineRef = useRef(navigator.onLine);

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  /**
   * Calculate exponential backoff delay
   */
  const getRetryDelay = useCallback((attemptNumber: number): number => {
    const delay = initialDelay * Math.pow(2, attemptNumber);
    return Math.min(delay, maxDelay);
  }, [initialDelay, maxDelay]);

  /**
   * Perform the actual save operation with retry logic
   */
  const performSave = useCallback(async (attemptNumber = 0): Promise<void> => {
    if (!isOnlineRef.current) {
      throw new Error('No network connection. Changes will be saved when connection is restored.');
    }

    try {
      await onSave(dataRef.current);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Save failed');

      // If we haven't exceeded max retries, try again with exponential backoff
      if (attemptNumber < maxRetries) {
        const delay = getRetryDelay(attemptNumber);
        setRetryCount(attemptNumber + 1);

        console.warn(`Autosave failed (attempt ${attemptNumber + 1}/${maxRetries}), retrying in ${delay}ms...`, error);

        await new Promise(resolve => setTimeout(resolve, delay));
        return performSave(attemptNumber + 1);
      } else {
        // Max retries exceeded
        console.error('Autosave failed after max retries:', error);
        setError(error);
        throw error;
      }
    }
  }, [onSave, maxRetries, getRetryDelay]);

  /**
   * Save data immediately
   */
  const saveNow = useCallback(async (): Promise<void> => {
    // Clear any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Prevent concurrent saves
    if (isSavingRef.current) {
      console.warn('Save already in progress, skipping...');
      return;
    }

    setIsSaving(true);
    isSavingRef.current = true;

    try {
      await performSave();
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [performSave]);

  /**
   * Mark data as changed and schedule autosave
   */
  const markAsChanged = useCallback(() => {
    if (!enabled) return;

    setHasUnsavedChanges(true);
    setError(null);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule new save
    debounceTimerRef.current = setTimeout(() => {
      if (hasUnsavedChanges && !isSavingRef.current) {
        saveNow();
      }
    }, debounceDelay);
  }, [enabled, debounceDelay, saveNow, hasUnsavedChanges]);

  /**
   * Clear unsaved changes flag
   */
  const clearUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  /**
   * Autosave when data changes (debounced)
   */
  useEffect(() => {
    if (!enabled) return;

    markAsChanged();

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, enabled, markAsChanged]);

  /**
   * Monitor online/offline status
   */
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      console.log('Connection restored, attempting to save...');

      // If there are unsaved changes, try to save now
      if (hasUnsavedChanges && !isSavingRef.current) {
        saveNow();
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      console.warn('Connection lost. Changes will be saved when connection is restored.');
      setError(new Error('No network connection'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasUnsavedChanges, saveNow]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    state: {
      isSaving,
      hasUnsavedChanges,
      lastSaved,
      error,
      retryCount,
    },
    actions: {
      saveNow,
      markAsChanged,
      clearUnsavedChanges,
      clearError,
    },
  };
}
