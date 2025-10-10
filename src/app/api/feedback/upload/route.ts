/**
 * File Upload API Endpoint for Feedback Attachments
 *
 * POST /api/feedback/upload
 *
 * Handles file uploads for feedback attachments following PRD-005 specifications.
 * Supports multiple files (up to 5), validates size/type, and stores securely in temp directory.
 *
 * Features:
 * - Authentication required (logged-in users only)
 * - Rate limiting: 10 requests per minute per user
 * - Multi-file upload (up to 5 files)
 * - File validation: type, size, signature
 * - Temporary storage in /public/uploads/feedback/temp/
 * - ULID-based unique file IDs
 *
 * Request: multipart/form-data with 'files' field (single or multiple files)
 * Response: { success: true, files: FileMetadata[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import {
  saveUploadedFile,
  validateFile,
  validateFileCount,
  TEMP_UPLOAD_PATH,
  FILE_UPLOAD_LIMITS,
  FILE_ERROR_CODES,
  getErrorMessage,
  FileValidationError,
  type FileMetadata,
} from '@/lib/file-upload';

/**
 * Rate limiting store for upload endpoint (10 requests per minute per user)
 */
const uploadRateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check upload-specific rate limit (10 uploads per minute per user)
 */
function checkUploadRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
} {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  let entry = uploadRateLimitStore.get(userId);

  // Create new entry or reset if window expired
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    uploadRateLimitStore.set(userId, entry);
  }

  // Check if limit exceeded
  const allowed = entry.count < maxRequests;

  if (allowed) {
    entry.count++;
  }

  return {
    allowed,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * POST /api/feedback/upload
 * Upload one or more files (up to 5)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Apply general API rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    // 2. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'You must be logged in to upload files',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Check upload-specific rate limit (10 per minute)
    const uploadRateLimit = checkUploadRateLimit(user.id);
    if (!uploadRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Upload rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          resetAt: uploadRateLimit.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': uploadRateLimit.remaining.toString(),
            'X-RateLimit-Reset': uploadRateLimit.resetAt.toISOString(),
            'Retry-After': Math.ceil(
              (uploadRateLimit.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // 4. Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data. Please ensure you are sending multipart/form-data.',
          code: 'INVALID_FORM_DATA',
        },
        { status: 400 }
      );
    }

    // 5. Extract files from form data (supports both 'files' and 'file' fields)
    const files: File[] = [];
    const filesField = formData.getAll('files');
    const fileField = formData.getAll('file');

    // Combine both fields
    const allFileEntries = [...filesField, ...fileField];

    for (const entry of allFileEntries) {
      if (entry instanceof File) {
        files.push(entry);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No files provided. Please upload at least one file.',
          code: 'NO_FILES',
        },
        { status: 400 }
      );
    }

    // 6. Validate file count
    const countValidation = validateFileCount(files.length);
    if (!countValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: countValidation.error,
          code: countValidation.code,
        },
        { status: 400 }
      );
    }

    // 7. Validate and upload each file
    const uploadedFiles: FileMetadata[] = [];
    const errors: Array<{ filename: string; error: string; code: string }> = [];

    for (const file of files) {
      try {
        // Convert File to Buffer for server-side validation and processing
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate file (size, type, signature)
        const validation = await validateFile(buffer, file.name, file.type);
        if (!validation.valid) {
          const errorMsg = validation.error
            ? getErrorMessage(validation.error)
            : 'File validation failed';

          errors.push({
            filename: file.name,
            error: errorMsg,
            code: validation.error || 'VALIDATION_ERROR',
          });
          continue;
        }

        // Save file to temp directory using file-upload utility
        const uploadedFile = await saveUploadedFile(buffer, file.name, file.type);

        // Convert to FileMetadata format expected by PRD-005
        const fileMetadata: FileMetadata = {
          id: uploadedFile.id,
          originalName: uploadedFile.originalFilename,
          storedName: uploadedFile.storedFilename,
          url: uploadedFile.filePath,
          size: uploadedFile.size,
          mimeType: uploadedFile.mimeType,
          uploadedAt: uploadedFile.uploadedAt.toISOString(),
        };

        uploadedFiles.push(fileMetadata);
      } catch (error) {
        // Handle file upload errors
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        // Extract error code if present
        let errorCode: string = FILE_ERROR_CODES.UPLOAD_FAILED;
        if (errorMessage.includes(FileValidationError.FILE_TOO_LARGE)) {
          errorCode = FILE_ERROR_CODES.FILE_TOO_LARGE;
        } else if (
          errorMessage.includes(FileValidationError.INVALID_FILE_TYPE)
        ) {
          errorCode = FILE_ERROR_CODES.INVALID_FILE_TYPE;
        } else if (
          errorMessage.includes(FileValidationError.SIGNATURE_MISMATCH)
        ) {
          errorCode = FILE_ERROR_CODES.INVALID_FILE_SIGNATURE;
        }

        errors.push({
          filename: file.name,
          error: errorMessage,
          code: errorCode,
        });
      }
    }

    // 8. Return results
    if (uploadedFiles.length === 0 && errors.length > 0) {
      // All files failed
      return NextResponse.json(
        {
          success: false,
          error: 'All files failed to upload',
          code: FILE_ERROR_CODES.UPLOAD_FAILED,
          details: errors,
        },
        { status: 400 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        files: uploadedFiles,
        ...(errors.length > 0 && {
          warnings: errors,
          message: `${uploadedFiles.length} of ${files.length} files uploaded successfully`,
        }),
      },
      { status: 201 }
    );

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during file upload',
        code: FILE_ERROR_CODES.UPLOAD_FAILED,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/feedback/upload
 * CORS preflight handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
