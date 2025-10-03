import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * Standardized API Error Response Format
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

/**
 * Error types with corresponding HTTP status codes
 */
export enum ApiErrorType {
  // 4xx Client Errors
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Pre-defined error factories for common scenarios
 */
export const ApiErrors = {
  // Authentication Errors (401)
  unauthorized: (message = 'You must be logged in to access this resource') =>
    new ApiError(message, 401, ApiErrorType.UNAUTHORIZED),

  // Authorization Errors (403)
  forbidden: (message = 'You do not have permission to access this resource') =>
    new ApiError(message, 403, ApiErrorType.FORBIDDEN),

  // Not Found Errors (404)
  notFound: (resource = 'Resource', message?: string) =>
    new ApiError(
      message || `${resource} not found`,
      404,
      ApiErrorType.NOT_FOUND
    ),

  // Validation Errors (400)
  validationError: (details: any, message = 'Validation failed') =>
    new ApiError(message, 400, ApiErrorType.VALIDATION_ERROR, details),

  badRequest: (message = 'Invalid request') =>
    new ApiError(message, 400, ApiErrorType.BAD_REQUEST),

  // Conflict Errors (409)
  conflict: (message = 'Resource conflict') =>
    new ApiError(message, 409, ApiErrorType.CONFLICT),

  // Rate Limiting (429)
  rateLimitExceeded: (resetAt?: Date, message = 'Rate limit exceeded') =>
    new ApiError(
      message,
      429,
      ApiErrorType.RATE_LIMIT_EXCEEDED,
      resetAt ? { resetAt: resetAt.toISOString() } : undefined
    ),

  // Payload Too Large (413)
  payloadTooLarge: (message = 'Request payload too large') =>
    new ApiError(message, 413, ApiErrorType.PAYLOAD_TOO_LARGE),

  // Server Errors (500)
  internal: (message = 'Internal server error') =>
    new ApiError(message, 500, ApiErrorType.INTERNAL_SERVER_ERROR),

  databaseError: (message = 'Database operation failed') =>
    new ApiError(message, 500, ApiErrorType.DATABASE_ERROR),

  networkError: (message = 'Network operation failed') =>
    new ApiError(message, 500, ApiErrorType.NETWORK_ERROR),

  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    new ApiError(message, 503, ApiErrorType.SERVICE_UNAVAILABLE),
};

/**
 * Format error response with standardized structure
 */
export function formatErrorResponse(
  error: string,
  message: string,
  statusCode: number,
  code?: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle Prisma database errors
 */
export function handlePrismaError(error: any): ApiError {
  // Prisma Client Known Request Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (error.meta?.target as string[])?.join(', ') || 'field';
        return ApiErrors.conflict(
          `A record with this ${field} already exists`
        );

      case 'P2025':
        // Record not found
        return ApiErrors.notFound('Record', 'The requested record was not found');

      case 'P2003':
        // Foreign key constraint violation
        return ApiErrors.badRequest('Invalid reference to related record');

      case 'P2014':
        // Required relation violation
        return ApiErrors.badRequest('Required relation missing');

      case 'P2000':
        // Value too long for column
        return ApiErrors.validationError(
          { field: error.meta?.column_name },
          'Input value is too long'
        );

      default:
        console.error('Unhandled Prisma error code:', error.code, error);
        return ApiErrors.databaseError('Database operation failed');
    }
  }

  // Prisma Validation Errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return ApiErrors.validationError(
      null,
      'Invalid data provided to database operation'
    );
  }

  // Prisma Initialization Errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error('Prisma initialization error:', error);
    return ApiErrors.serviceUnavailable('Database connection failed');
  }

  // Prisma Rust Panic Errors
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    console.error('Prisma panic error:', error);
    return ApiErrors.internal('Database engine error');
  }

  // Generic Prisma errors
  console.error('Unknown Prisma error:', error);
  return ApiErrors.databaseError();
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError<any>): ApiError {
  const details = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return ApiErrors.validationError(
    details,
    'Validation failed. Please check your input.'
  );
}

/**
 * Handle JSON parsing errors
 */
export function handleJsonError(error: SyntaxError): ApiError {
  return ApiErrors.badRequest('Invalid JSON in request body');
}

/**
 * Handle network/fetch errors
 */
export function handleNetworkError(error: any): ApiError {
  if (error.name === 'AbortError') {
    return ApiErrors.networkError('Request timeout');
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return ApiErrors.networkError('Network request failed');
  }

  return ApiErrors.networkError();
}

/**
 * Main error handler - detects error type and returns appropriate response
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Log error for debugging (in production, use proper logging service)
  console.error('API Error:', error);

  // Handle custom ApiError instances
  if (error instanceof ApiError) {
    return formatErrorResponse(
      error.name,
      error.message,
      error.statusCode,
      error.code,
      error.details
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const apiError = handleZodError(error);
    return formatErrorResponse(
      apiError.name,
      apiError.message,
      apiError.statusCode,
      apiError.code,
      apiError.details
    );
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    const apiError = handleJsonError(error);
    return formatErrorResponse(
      apiError.name,
      apiError.message,
      apiError.statusCode,
      apiError.code
    );
  }

  // Handle Prisma errors
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    const apiError = handlePrismaError(error);
    return formatErrorResponse(
      apiError.name,
      apiError.message,
      apiError.statusCode,
      apiError.code,
      apiError.details
    );
  }

  // Handle network/fetch errors
  if (error instanceof Error &&
      (error.name === 'AbortError' ||
       error.name === 'TypeError' && error.message.includes('fetch'))) {
    const apiError = handleNetworkError(error);
    return formatErrorResponse(
      apiError.name,
      apiError.message,
      apiError.statusCode,
      apiError.code
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'development'
      ? error.message
      : 'An unexpected error occurred';

    return formatErrorResponse(
      'Internal Server Error',
      message,
      500,
      ApiErrorType.INTERNAL_SERVER_ERROR
    );
  }

  // Handle unknown error types
  return formatErrorResponse(
    'Internal Server Error',
    'An unexpected error occurred',
    500,
    ApiErrorType.INTERNAL_SERVER_ERROR
  );
}

/**
 * Async wrapper for API route handlers with automatic error handling
 *
 * Usage:
 * export const GET = withErrorHandling(async (request: NextRequest) => {
 *   // Your route logic here
 *   return NextResponse.json({ data: ... });
 * });
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Validation helper that throws ApiError on validation failure
 */
export function validateOrThrow<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw handleZodError(error);
    }
    throw error;
  }
}
