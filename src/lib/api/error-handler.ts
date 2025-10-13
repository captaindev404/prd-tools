/**
 * API Error Handler Utility
 *
 * Provides comprehensive error handling for API requests including:
 * - Network failures (timeout, no connection, unreachable)
 * - HTTP errors (401, 403, 400, 500)
 * - Field-level validation errors
 * - Error logging and retry strategies
 */

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  type: 'network' | 'authentication' | 'authorization' | 'validation' | 'server' | 'unknown';
  message: string;
  statusCode?: number;
  details?: ApiErrorDetail[];
  originalError?: Error;
  retryable: boolean;
}

export interface ApiErrorHandlerOptions {
  enableLogging?: boolean;
  onAuthError?: (returnUrl: string) => void;
  onNetworkError?: () => void;
}

/**
 * Parse and categorize API errors from fetch responses
 */
export async function parseApiError(
  response: Response,
  originalError?: Error
): Promise<ApiError> {
  const statusCode = response.status;

  // Try to parse JSON error response
  let errorData: any = null;
  try {
    const text = await response.text();
    if (text) {
      errorData = JSON.parse(text);
    }
  } catch (e) {
    // Response is not JSON or empty
  }

  // Determine error type based on status code
  switch (statusCode) {
    case 401:
      return {
        type: 'authentication',
        message: errorData?.message || 'Your session has expired. Please log in again.',
        statusCode,
        retryable: false,
      };

    case 403:
      return {
        type: 'authorization',
        message:
          errorData?.message ||
          'You do not have permission to perform this action. Please contact an administrator if you believe this is an error.',
        statusCode,
        retryable: false,
      };

    case 400:
      return {
        type: 'validation',
        message: errorData?.message || 'Please check your input and try again.',
        statusCode,
        details: errorData?.details || [],
        retryable: true,
      };

    case 429:
      return {
        type: 'server',
        message: 'Too many requests. Please wait a moment and try again.',
        statusCode,
        retryable: true,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: 'server',
        message:
          errorData?.message ||
          'A server error occurred. Please try again in a moment.',
        statusCode,
        retryable: true,
      };

    default:
      return {
        type: 'unknown',
        message: errorData?.message || `An unexpected error occurred (${statusCode})`,
        statusCode,
        retryable: false,
      };
  }
}

/**
 * Handle network errors (timeout, connection issues, etc.)
 */
export function parseNetworkError(error: Error): ApiError {
  // Check for specific network error types
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      type: 'network',
      message:
        'The request timed out. Please check your internet connection and try again.',
      originalError: error,
      retryable: true,
    };
  }

  if (
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('network')
  ) {
    return {
      type: 'network',
      message:
        'Unable to connect to the server. Please check your internet connection and try again.',
      originalError: error,
      retryable: true,
    };
  }

  return {
    type: 'network',
    message: 'A network error occurred. Please try again.',
    originalError: error,
    retryable: true,
  };
}

/**
 * Make an API request with comprehensive error handling
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  handlers?: ApiErrorHandlerOptions
): Promise<{ data: T; error: null } | { data: null; error: ApiError }> {
  const { enableLogging = true, onAuthError, onNetworkError } = handlers || {};

  try {
    // Add timeout to request (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Success response
    if (response.ok) {
      const data = await response.json();
      return { data: data.data || data, error: null };
    }

    // Error response
    const error = await parseApiError(response);

    // Log error if enabled
    if (enableLogging) {
      console.error('API Error:', {
        url,
        method: options.method || 'GET',
        statusCode: error.statusCode,
        type: error.type,
        message: error.message,
        details: error.details,
      });
    }

    // Handle authentication errors
    if (error.type === 'authentication' && onAuthError) {
      const returnUrl = window.location.pathname;
      onAuthError(returnUrl);
    }

    // Handle network errors
    if (error.type === 'network' && onNetworkError) {
      onNetworkError();
    }

    return { data: null, error };
  } catch (err) {
    // Network errors, timeouts, etc.
    const error = parseNetworkError(err as Error);

    if (enableLogging) {
      console.error('Network Error:', {
        url,
        method: options.method || 'GET',
        message: error.message,
        originalError: error.originalError,
      });
    }

    if (onNetworkError) {
      onNetworkError();
    }

    return { data: null, error };
  }
}

/**
 * Map API validation errors to form field errors
 */
export function mapApiErrorsToFields(
  details: ApiErrorDetail[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const detail of details) {
    // Handle both simple field names and array notation (e.g., "questions[0].text")
    const fieldName = detail.field;
    fieldErrors[fieldName] = detail.message;
  }

  return fieldErrors;
}

/**
 * Extract user-friendly error message from ApiError
 */
export function getErrorMessage(error: ApiError): string {
  return error.message;
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: ApiError): boolean {
  return error.retryable;
}

/**
 * Retry an API request with exponential backoff
 */
export async function retryApiRequest<T = any>(
  requestFn: () => Promise<{ data: T; error: null } | { data: null; error: ApiError }>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<{ data: T; error: null } | { data: null; error: ApiError }> {
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await requestFn();

    if (result.error === null) {
      return result;
    }

    lastError = result.error;

    // Don't retry if error is not retryable
    if (!result.error.retryable) {
      return result;
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = initialDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { data: null, error: lastError! };
}
