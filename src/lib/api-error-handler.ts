/**
 * API Error Handler Utility
 *
 * Provides centralized error handling for panel API calls with:
 * - HTTP status code specific messages
 * - Network error detection
 * - Toast notification integration
 * - Console error logging
 * - Retry capability for transient errors
 */

export interface ApiErrorOptions {
  /** Custom error message to show instead of default */
  customMessage?: string;
  /** Whether to show a toast notification (default: true) */
  showToast?: boolean;
  /** Whether to log to console (default: true) */
  logError?: boolean;
  /** Additional context for error logging */
  context?: string;
}

export interface ApiErrorResult {
  /** User-friendly error message */
  message: string;
  /** HTTP status code (if available) */
  statusCode?: number;
  /** Whether this error is retryable */
  isRetryable: boolean;
  /** Original error object */
  originalError: Error;
}

/**
 * Get user-friendly error message based on HTTP status code
 */
function getErrorMessage(statusCode: number, responseMessage?: string): string {
  switch (statusCode) {
    case 400:
      return responseMessage || 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Please sign in again to continue.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return 'Panel not found. It may have been deleted or archived.';
    case 409:
      return responseMessage || 'This action conflicts with existing data.';
    case 422:
      return responseMessage || 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again in a moment.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again.';
    default:
      return responseMessage || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Check if an error is retryable (transient)
 */
function isRetryableError(statusCode?: number): boolean {
  if (!statusCode) return true; // Network errors are retryable
  return statusCode >= 500 || statusCode === 429 || statusCode === 408;
}

/**
 * Parse error from fetch response
 */
async function parseErrorResponse(response: Response): Promise<{ message: string; statusCode: number }> {
  let message = '';

  try {
    const data = await response.json();
    message = data.message || data.error || '';
  } catch {
    // Response body is not JSON, use status text
    message = response.statusText;
  }

  return {
    message: getErrorMessage(response.status, message),
    statusCode: response.status,
  };
}

/**
 * Handle API errors with user-friendly messages and logging
 *
 * @example
 * ```ts
 * try {
 *   const response = await fetch('/api/panels/123');
 *   if (!response.ok) {
 *     throw response;
 *   }
 *   const data = await response.json();
 * } catch (error) {
 *   const errorResult = await handleApiError(error, {
 *     context: 'Fetching panel details',
 *     showToast: true
 *   });
 *
 *   if (errorResult.isRetryable) {
 *     // Show retry button
 *   }
 * }
 * ```
 */
export async function handleApiError(
  error: unknown,
  options: ApiErrorOptions = {}
): Promise<ApiErrorResult> {
  const {
    customMessage,
    showToast = false, // Disabled by default - caller should handle toast
    logError = true,
    context = 'API call',
  } = options;

  let message = customMessage || 'An unexpected error occurred';
  let statusCode: number | undefined;
  let isRetryable = false;
  let originalError: Error;

  // Handle Response object (thrown by fetch)
  if (error instanceof Response) {
    const parsed = await parseErrorResponse(error);
    message = customMessage || parsed.message;
    statusCode = parsed.statusCode;
    isRetryable = isRetryableError(statusCode);
    originalError = new Error(`HTTP ${statusCode}: ${message}`);
  }
  // Handle TypeError (network errors)
  else if (error instanceof TypeError) {
    message = customMessage || 'Network error. Please check your connection and try again.';
    isRetryable = true;
    originalError = error;
  }
  // Handle Error objects
  else if (error instanceof Error) {
    message = customMessage || error.message || message;
    originalError = error;
    isRetryable = true; // Unknown errors are considered retryable
  }
  // Handle unknown error types
  else {
    originalError = new Error(String(error));
    isRetryable = true;
  }

  // Log error to console
  if (logError) {
    console.error(`[${context}] Error:`, {
      message,
      statusCode,
      isRetryable,
      originalError,
    });
  }

  // Note: Toast notifications are handled by the caller
  // This allows more flexibility in error presentation

  return {
    message,
    statusCode,
    isRetryable,
    originalError,
  };
}

/**
 * Wrapper for fetch that automatically handles errors
 *
 * @example
 * ```ts
 * const { data, error } = await safeFetch('/api/panels/123', {
 *   errorContext: 'Fetching panel details'
 * });
 *
 * if (error) {
 *   toast({
 *     title: 'Error',
 *     description: error.message,
 *     variant: 'destructive'
 *   });
 *   return;
 * }
 *
 * // Use data
 * ```
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit & { errorContext?: string }
): Promise<{ data?: T; error?: ApiErrorResult }> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await handleApiError(response, {
        context: options?.errorContext || `Fetch ${url}`,
      });
      return { error };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    const errorResult = await handleApiError(error, {
      context: options?.errorContext || `Fetch ${url}`,
    });
    return { error: errorResult };
  }
}

/**
 * Create a retry handler for transient errors
 *
 * @example
 * ```ts
 * const handleRetry = createRetryHandler(async () => {
 *   const response = await fetch('/api/panels');
 *   if (!response.ok) throw response;
 *   return response.json();
 * });
 *
 * // In component
 * <Button onClick={handleRetry}>Retry</Button>
 * ```
 */
export function createRetryHandler<T>(
  fetchFn: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiErrorResult) => void;
    maxRetries?: number;
  }
) {
  const { onSuccess, onError, maxRetries = 3 } = options || {};
  let retryCount = 0;

  const retryableFetch = async (): Promise<T> => {
    try {
      const data = await fetchFn();
      retryCount = 0; // Reset on success
      onSuccess?.(data);
      return data;
    } catch (error) {
      const errorResult = await handleApiError(error);

      if (retryCount < maxRetries && errorResult.isRetryable) {
        retryCount++;
        console.log(`Retrying... (${retryCount}/${maxRetries})`);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return retryableFetch(); // Retry
      }

      onError?.(errorResult);
      throw errorResult;
    }
  };

  return retryableFetch;
}
