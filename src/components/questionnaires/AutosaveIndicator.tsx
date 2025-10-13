'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Loader2, AlertCircle, CloudOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutosaveState } from '@/hooks/use-autosave';

interface AutosaveIndicatorProps {
  /**
   * Autosave state from useAutosave hook
   */
  state: AutosaveState;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show detailed status (includes retry count)
   * Default: false
   */
  showDetails?: boolean;
}

/**
 * Visual indicator for autosave status
 *
 * Shows:
 * - "Saving..." when save is in progress
 * - "All changes saved" when save completes
 * - "Last saved: X minutes ago" timestamp
 * - Error messages when save fails
 * - Network offline status
 *
 * @example
 * ```tsx
 * const { state } = useAutosave({ ... });
 *
 * <AutosaveIndicator state={state} />
 * ```
 */
export function AutosaveIndicator({
  state,
  className,
  showDetails = false,
}: AutosaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update "time ago" every 10 seconds
  useEffect(() => {
    if (!state.lastSaved) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      try {
        setTimeAgo(formatDistanceToNow(state.lastSaved!, { addSuffix: true }));
      } catch (error) {
        console.error('Error formatting time:', error);
        setTimeAgo('recently');
      }
    };

    // Update immediately
    updateTimeAgo();

    // Update every 10 seconds
    const interval = setInterval(updateTimeAgo, 10000);

    return () => clearInterval(interval);
  }, [state.lastSaved]);

  // Determine status message and icon
  const getStatusContent = () => {
    // Error state (including offline)
    if (state.error) {
      const isOffline = state.error.message.includes('network') || state.error.message.includes('connection');

      return {
        icon: isOffline ? CloudOff : AlertCircle,
        message: state.error.message,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
      };
    }

    // Saving state
    if (state.isSaving) {
      return {
        icon: Loader2,
        message: state.retryCount > 0 ? `Retrying save (${state.retryCount})...` : 'Saving...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        animate: true,
      };
    }

    // Unsaved changes
    if (state.hasUnsavedChanges) {
      return {
        icon: Clock,
        message: 'Unsaved changes',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      };
    }

    // Saved state
    if (state.lastSaved) {
      return {
        icon: CheckCircle2,
        message: `Last saved ${timeAgo}`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    }

    // No save yet
    return {
      icon: Clock,
      message: 'No changes to save',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
    };
  };

  const status = getStatusContent();
  const Icon = status.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300',
        status.bgColor,
        status.color,
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon
        className={cn(
          'h-3.5 w-3.5',
          status.animate && 'animate-spin'
        )}
        aria-hidden="true"
      />
      <span>{status.message}</span>

      {/* Show details if enabled */}
      {showDetails && (
        <>
          {state.retryCount > 0 && (
            <span className="text-xs opacity-75">
              (attempt {state.retryCount + 1})
            </span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Compact version of autosave indicator (icon only)
 */
export function AutosaveIndicatorCompact({
  state,
  className,
}: Omit<AutosaveIndicatorProps, 'showDetails'>) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update "time ago" every 10 seconds
  useEffect(() => {
    if (!state.lastSaved) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      try {
        setTimeAgo(formatDistanceToNow(state.lastSaved!, { addSuffix: true }));
      } catch (error) {
        console.error('Error formatting time:', error);
        setTimeAgo('recently');
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);

    return () => clearInterval(interval);
  }, [state.lastSaved]);

  // Determine status
  const getStatus = () => {
    if (state.error) {
      const isOffline = state.error.message.includes('network') || state.error.message.includes('connection');
      return {
        icon: isOffline ? CloudOff : AlertCircle,
        color: 'text-destructive',
        tooltip: state.error.message,
      };
    }

    if (state.isSaving) {
      return {
        icon: Loader2,
        color: 'text-blue-600',
        tooltip: 'Saving...',
        animate: true,
      };
    }

    if (state.hasUnsavedChanges) {
      return {
        icon: Clock,
        color: 'text-amber-600',
        tooltip: 'Unsaved changes',
      };
    }

    if (state.lastSaved) {
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        tooltip: `Last saved ${timeAgo}`,
      };
    }

    return {
      icon: Clock,
      color: 'text-muted-foreground',
      tooltip: 'No changes to save',
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div
      className={cn('inline-flex items-center', className)}
      title={status.tooltip}
      role="status"
      aria-label={status.tooltip}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          status.color,
          status.animate && 'animate-spin'
        )}
        aria-hidden="true"
      />
    </div>
  );
}
