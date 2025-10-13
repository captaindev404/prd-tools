/**
 * FormErrorAlert Component
 *
 * Displays form submission errors with retry functionality.
 * Handles different error types (network, validation, authentication, server).
 */

'use client';

import { useEffect, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, WifiOff, Lock, Shield, ServerCrash, RefreshCcw } from 'lucide-react';
import type { ApiError } from '@/lib/api/error-handler';

interface FormErrorAlertProps {
  error: ApiError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function FormErrorAlert({
  error,
  onRetry,
  onDismiss,
  className,
}: FormErrorAlertProps) {
  const errorRef = useRef<HTMLDivElement>(null);

  // Scroll to error and focus on mount
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      errorRef.current.focus();
    }
  }, [error]);

  if (!error) return null;

  // Determine icon based on error type
  const getIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="h-4 w-4" aria-hidden="true" />;
      case 'authentication':
        return <Lock className="h-4 w-4" aria-hidden="true" />;
      case 'authorization':
        return <Shield className="h-4 w-4" aria-hidden="true" />;
      case 'server':
        return <ServerCrash className="h-4 w-4" aria-hidden="true" />;
      default:
        return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
    }
  };

  // Determine title based on error type
  const getTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Connection Error';
      case 'authentication':
        return 'Session Expired';
      case 'authorization':
        return 'Permission Denied';
      case 'validation':
        return 'Validation Error';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  return (
    <Alert
      variant="destructive"
      role="alert"
      aria-live="assertive"
      ref={errorRef}
      tabIndex={-1}
      className={className}
    >
      {getIcon()}
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p>{error.message}</p>

          {/* Validation field errors */}
          {error.type === 'validation' && error.details && error.details.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-sm font-semibold">Please fix the following issues:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {error.details.map((detail, index) => (
                  <li key={index}>
                    <span className="font-medium">{detail.field}:</span> {detail.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Show status code for debugging (non-production) */}
          {error.statusCode && process.env.NODE_ENV !== 'production' && (
            <p className="text-xs opacity-75">Error Code: {error.statusCode}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {error.retryable && onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="bg-background"
              >
                <RefreshCcw className="mr-2 h-3 w-3" />
                Try Again
              </Button>
            )}

            {onDismiss && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-destructive-foreground hover:text-destructive-foreground"
              >
                Dismiss
              </Button>
            )}
          </div>

          {/* Network error help text */}
          {error.type === 'network' && (
            <p className="text-xs mt-2 opacity-90">
              If the problem persists, please check your internet connection or try again later.
            </p>
          )}

          {/* Authentication error help text */}
          {error.type === 'authentication' && (
            <p className="text-xs mt-2 opacity-90">
              You will be redirected to the login page. Your form data will be preserved.
            </p>
          )}

          {/* Authorization error help text */}
          {error.type === 'authorization' && (
            <p className="text-xs mt-2 opacity-90">
              Contact your administrator at{' '}
              <a href="mailto:support@clubmed.com" className="underline">
                support@clubmed.com
              </a>{' '}
              if you need access.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Field-level validation error display
 */
interface FieldErrorProps {
  error?: string;
  fieldId: string;
}

export function FieldError({ error, fieldId }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p
      id={`${fieldId}-error`}
      className="text-sm text-destructive mt-1"
      role="alert"
      aria-live="polite"
    >
      {error}
    </p>
  );
}
