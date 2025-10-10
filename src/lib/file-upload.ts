/**
 * File Upload Utility
 *
 * Provides comprehensive file validation, storage, and management utilities
 * for user-uploaded files (images, documents) in the feedback system.
 *
 * Security Features:
 * - MIME type validation
 * - Magic byte signature verification (prevents .jpg.exe exploits)
 * - Filename sanitization (prevents directory traversal)
 * - File size limits (10MB per file, 50MB total)
 * - ULID-based unique filenames
 *
 * Supported File Types:
 * - Images: .jpg, .jpeg, .png, .gif, .webp
 * - Documents: .pdf, .docx, .xlsx, .txt
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { ulid } from 'ulid';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Maximum file size per file (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Maximum total size for all files in a single upload (50MB)
 */
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Storage paths
 */
export const UPLOAD_BASE_PATH = path.join(process.cwd(), 'public', 'uploads', 'feedback');
export const TEMP_UPLOAD_PATH = path.join(UPLOAD_BASE_PATH, 'temp');

/**
 * File type configurations with MIME types and magic byte signatures
 */
export const FILE_TYPE_CONFIG = {
  // Images
  jpg: {
    mimeTypes: ['image/jpeg', 'image/jpg'],
    extensions: ['.jpg', '.jpeg'],
    signature: [0xff, 0xd8, 0xff],
    category: 'image',
  },
  png: {
    mimeTypes: ['image/png'],
    extensions: ['.png'],
    signature: [0x89, 0x50, 0x4e, 0x47],
    category: 'image',
  },
  gif: {
    mimeTypes: ['image/gif'],
    extensions: ['.gif'],
    signature: [0x47, 0x49, 0x46],
    category: 'image',
  },
  webp: {
    mimeTypes: ['image/webp'],
    extensions: ['.webp'],
    // WebP signature: RIFF....WEBP (bytes 0-3 and 8-11)
    signature: [0x52, 0x49, 0x46, 0x46],
    category: 'image',
  },
  // Documents
  pdf: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
    category: 'document',
  },
  docx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.docx'],
    // DOCX is a ZIP file, starts with PK (ZIP signature)
    signature: [0x50, 0x4b, 0x03, 0x04],
    category: 'document',
  },
  xlsx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    extensions: ['.xlsx'],
    // XLSX is a ZIP file, starts with PK (ZIP signature)
    signature: [0x50, 0x4b, 0x03, 0x04],
    category: 'document',
  },
  txt: {
    mimeTypes: ['text/plain'],
    extensions: ['.txt'],
    signature: null, // Text files don't have a specific signature
    category: 'document',
  },
} as const;

// =============================================================================
// TYPES
// =============================================================================

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: FileValidationError;
  sanitizedFilename?: string;
  fileType?: string;
  category?: 'image' | 'document';
}

/**
 * File validation error codes
 */
export enum FileValidationError {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  TOTAL_SIZE_EXCEEDED = 'TOTAL_SIZE_EXCEEDED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  INVALID_MIME_TYPE = 'INVALID_MIME_TYPE',
  SIGNATURE_MISMATCH = 'SIGNATURE_MISMATCH',
  INVALID_FILENAME = 'INVALID_FILENAME',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  FILE_DELETE_ERROR = 'FILE_DELETE_ERROR',
}

/**
 * Upload file metadata
 */
export interface UploadedFile {
  id: string; // ULID
  originalFilename: string;
  sanitizedFilename: string;
  storedFilename: string; // ULID-based filename
  filePath: string; // Relative path from /public
  absolutePath: string; // Absolute file system path
  mimeType: string;
  size: number;
  fileType: string; // jpg, png, pdf, etc.
  category: 'image' | 'document';
  uploadedAt: Date;
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  maxSize?: number; // Override default max size
  allowedTypes?: string[]; // Override allowed types (e.g., ['jpg', 'png'])
  checkSignature?: boolean; // Default: true
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Sanitize filename to prevent directory traversal and remove special characters
 *
 * @param filename - Original filename
 * @returns Sanitized filename
 *
 * @example
 * sanitizeFilename('../../etc/passwd') // returns 'etcpasswd'
 * sanitizeFilename('my file (1).jpg') // returns 'my-file-1.jpg'
 * sanitizeFilename('<script>alert("xss")</script>.jpg') // returns 'scriptalertxssscript.jpg'
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and parent directory references
  let sanitized = filename.replace(/[/\\]/g, '');
  sanitized = sanitized.replace(/\.\./g, '');

  // Extract extension
  const lastDotIndex = sanitized.lastIndexOf('.');
  const extension = lastDotIndex > 0 ? sanitized.substring(lastDotIndex) : '';
  let basename = lastDotIndex > 0 ? sanitized.substring(0, lastDotIndex) : sanitized;

  // Remove special characters, keep only alphanumeric, hyphens, and underscores
  basename = basename.replace(/[^a-zA-Z0-9_-]/g, '-');

  // Remove multiple consecutive hyphens
  basename = basename.replace(/-+/g, '-');

  // Remove leading/trailing hyphens
  basename = basename.replace(/^-+|-+$/g, '');

  // Limit length to 100 characters
  if (basename.length > 100) {
    basename = basename.substring(0, 100);
  }

  // If basename is empty after sanitization, use a default
  if (!basename) {
    basename = 'file';
  }

  return basename + extension.toLowerCase();
}

/**
 * Check if file signature matches the expected magic bytes
 *
 * @param buffer - File buffer
 * @param signature - Expected signature bytes
 * @returns True if signature matches
 */
function checkFileSignature(buffer: Buffer, signature: number[]): boolean {
  if (!signature || signature.length === 0) {
    return true; // No signature to check
  }

  if (buffer.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Get file type configuration from extension
 *
 * @param extension - File extension (with or without dot)
 * @returns File type config or null
 */
function getFileTypeConfig(extension: string): (typeof FILE_TYPE_CONFIG)[keyof typeof FILE_TYPE_CONFIG] | null {
  const ext = extension.toLowerCase().startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

  for (const [key, config] of Object.entries(FILE_TYPE_CONFIG)) {
    // Type cast needed for readonly arrays in const objects
    const extensions = config.extensions as readonly string[];
    if ((extensions as string[]).includes(ext)) {
      return config;
    }
  }

  return null;
}

/**
 * Get file type configuration from MIME type
 *
 * @param mimeType - MIME type
 * @returns File type config or null
 */
function getFileTypeConfigFromMime(mimeType: string): (typeof FILE_TYPE_CONFIG)[keyof typeof FILE_TYPE_CONFIG] | null {
  const mime = mimeType.toLowerCase();

  for (const [key, config] of Object.entries(FILE_TYPE_CONFIG)) {
    // Type cast needed for readonly arrays in const objects
    const mimeTypes = config.mimeTypes as readonly string[];
    if ((mimeTypes as string[]).some(m => m.toLowerCase() === mime)) {
      return config;
    }
  }

  return null;
}

/**
 * Validate a file based on size, type, MIME, and signature
 *
 * @param file - File buffer
 * @param filename - Original filename
 * @param mimeType - MIME type from upload
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * const result = await validateFile(buffer, 'photo.jpg', 'image/jpeg');
 * if (!result.valid) {
 *   console.error('Validation failed:', result.error);
 * }
 */
export async function validateFile(
  file: Buffer,
  filename: string,
  mimeType: string,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    maxSize = MAX_FILE_SIZE,
    allowedTypes = Object.keys(FILE_TYPE_CONFIG),
    checkSignature = true,
  } = options;

  // 1. Check file size
  if (file.length > maxSize) {
    return {
      valid: false,
      error: FileValidationError.FILE_TOO_LARGE,
    };
  }

  // 2. Sanitize filename
  const sanitizedFilename = sanitizeFilename(filename);
  if (!sanitizedFilename || sanitizedFilename === 'file') {
    return {
      valid: false,
      error: FileValidationError.INVALID_FILENAME,
    };
  }

  // 3. Get file extension
  const extension = path.extname(sanitizedFilename).toLowerCase();
  if (!extension) {
    return {
      valid: false,
      error: FileValidationError.INVALID_FILE_TYPE,
    };
  }

  // 4. Check if file type is allowed
  const fileTypeConfig = getFileTypeConfig(extension);
  if (!fileTypeConfig) {
    return {
      valid: false,
      error: FileValidationError.INVALID_FILE_TYPE,
    };
  }

  // Get the key for this file type
  const fileType = Object.keys(FILE_TYPE_CONFIG).find(
    key => FILE_TYPE_CONFIG[key as keyof typeof FILE_TYPE_CONFIG] === fileTypeConfig
  );

  if (!fileType || !allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: FileValidationError.INVALID_FILE_TYPE,
    };
  }

  // 5. Validate MIME type
  // Type cast needed for readonly arrays in const objects
  const mimeTypes = fileTypeConfig.mimeTypes as readonly string[];
  if (!(mimeTypes as string[]).includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: FileValidationError.INVALID_MIME_TYPE,
    };
  }

  // 6. Check file signature (magic bytes)
  if (checkSignature && fileTypeConfig.signature) {
    // Convert readonly array to mutable array for function call
    const signature = Array.from(fileTypeConfig.signature);
    const signatureMatches = checkFileSignature(file, signature);
    if (!signatureMatches) {
      return {
        valid: false,
        error: FileValidationError.SIGNATURE_MISMATCH,
      };
    }
  }

  // All validations passed
  return {
    valid: true,
    sanitizedFilename,
    fileType,
    category: fileTypeConfig.category,
  };
}

/**
 * Validate multiple files and check total size
 *
 * @param files - Array of files to validate
 * @param options - Validation options
 * @returns Array of validation results
 */
export async function validateFiles(
  files: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
  options: FileValidationOptions = {}
): Promise<FileValidationResult[]> {
  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.buffer.length, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return files.map(() => ({
      valid: false,
      error: FileValidationError.TOTAL_SIZE_EXCEEDED,
    }));
  }

  // Validate each file
  const results = await Promise.all(
    files.map(file => validateFile(file.buffer, file.filename, file.mimeType, options))
  );

  return results;
}

// =============================================================================
// STORAGE FUNCTIONS
// =============================================================================

/**
 * Ensure directory exists, create if it doesn't
 *
 * @param dirPath - Directory path
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Save an uploaded file to temporary storage
 *
 * @param file - File buffer
 * @param filename - Original filename
 * @param mimeType - MIME type
 * @returns Upload metadata
 *
 * @example
 * const uploadedFile = await saveUploadedFile(buffer, 'photo.jpg', 'image/jpeg');
 * console.log('File saved to:', uploadedFile.filePath);
 */
export async function saveUploadedFile(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadedFile> {
  // Validate file
  const validation = await validateFile(file, filename, mimeType);
  if (!validation.valid) {
    throw new Error(`File validation failed: ${validation.error}`);
  }

  // Ensure temp directory exists
  await ensureDirectoryExists(TEMP_UPLOAD_PATH);

  // Generate unique filename with ULID
  const id = ulid();
  const extension = path.extname(validation.sanitizedFilename!);
  const storedFilename = `${id}${extension}`;
  const absolutePath = path.join(TEMP_UPLOAD_PATH, storedFilename);
  const filePath = `/uploads/feedback/temp/${storedFilename}`;

  // Write file to disk
  try {
    await fs.writeFile(absolutePath, file);
  } catch (error) {
    throw new Error(`${FileValidationError.FILE_WRITE_ERROR}: ${error}`);
  }

  return {
    id,
    originalFilename: filename,
    sanitizedFilename: validation.sanitizedFilename!,
    storedFilename,
    filePath,
    absolutePath,
    mimeType,
    size: file.length,
    fileType: validation.fileType!,
    category: validation.category!,
    uploadedAt: new Date(),
  };
}

/**
 * Move file from temporary storage to final location
 *
 * @param tempFilePath - Absolute path to temp file
 * @param feedbackId - Feedback ID (used for organizing files)
 * @returns New file metadata
 *
 * @example
 * const finalFile = await moveFile(uploadedFile.absolutePath, 'fb_01HQWERASDF');
 * console.log('File moved to:', finalFile.filePath);
 */
export async function moveFile(
  tempFilePath: string,
  feedbackId: string
): Promise<UploadedFile> {
  // Verify temp file exists
  try {
    await fs.access(tempFilePath);
  } catch {
    throw new Error(`${FileValidationError.FILE_READ_ERROR}: Temp file not found`);
  }

  // Get file stats
  const stats = await fs.stat(tempFilePath);
  const filename = path.basename(tempFilePath);

  // Create feedback-specific directory
  const feedbackDir = path.join(UPLOAD_BASE_PATH, feedbackId);
  await ensureDirectoryExists(feedbackDir);

  // Move file
  const absolutePath = path.join(feedbackDir, filename);
  const filePath = `/uploads/feedback/${feedbackId}/${filename}`;

  try {
    await fs.rename(tempFilePath, absolutePath);
  } catch (error) {
    throw new Error(`${FileValidationError.FILE_WRITE_ERROR}: ${error}`);
  }

  // Extract metadata from filename (assumes ULID-based naming)
  const id = filename.split('.')[0] || ulid();
  const extension = path.extname(filename);
  const fileTypeConfig = getFileTypeConfig(extension);

  return {
    id,
    originalFilename: filename,
    sanitizedFilename: filename,
    storedFilename: filename,
    filePath,
    absolutePath,
    mimeType: fileTypeConfig?.mimeTypes[0] || 'application/octet-stream',
    size: stats.size,
    fileType: Object.keys(FILE_TYPE_CONFIG).find(
      key => FILE_TYPE_CONFIG[key as keyof typeof FILE_TYPE_CONFIG] === fileTypeConfig
    ) || 'unknown',
    category: fileTypeConfig?.category || 'document',
    uploadedAt: new Date(),
  };
}

/**
 * Delete a file from storage
 *
 * @param filePath - Absolute path to file
 * @returns True if deleted successfully
 *
 * @example
 * await deleteFile(uploadedFile.absolutePath);
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    return false;
  }
}

/**
 * Delete multiple files from storage
 *
 * @param filePaths - Array of absolute file paths
 * @returns Number of files successfully deleted
 */
export async function deleteFiles(filePaths: string[]): Promise<number> {
  const results = await Promise.all(filePaths.map(fp => deleteFile(fp)));
  return results.filter(Boolean).length;
}

/**
 * Clean up temporary files older than specified age
 *
 * @param maxAgeHours - Maximum age in hours (default: 24)
 * @returns Number of files deleted
 *
 * @example
 * // Clean up temp files older than 1 hour
 * const cleaned = await cleanupTempFiles(1);
 * console.log(`Cleaned up ${cleaned} temp files`);
 */
export async function cleanupTempFiles(maxAgeHours: number = 24): Promise<number> {
  try {
    await ensureDirectoryExists(TEMP_UPLOAD_PATH);
    const files = await fs.readdir(TEMP_UPLOAD_PATH);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(TEMP_UPLOAD_PATH, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAgeMs) {
        const deleted = await deleteFile(filePath);
        if (deleted) deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    return 0;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get human-readable file size
 *
 * @param bytes - File size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get user-friendly error message
 *
 * @param error - Validation error code
 * @returns User-friendly error message
 */
export function getErrorMessage(error: FileValidationError): string {
  switch (error) {
    case FileValidationError.FILE_TOO_LARGE:
      return `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`;
    case FileValidationError.TOTAL_SIZE_EXCEEDED:
      return `Total file size exceeds ${formatFileSize(MAX_TOTAL_SIZE)}.`;
    case FileValidationError.INVALID_FILE_TYPE:
      return 'File type is not supported. Allowed types: images (jpg, png, gif, webp) and documents (pdf, docx, xlsx, txt).';
    case FileValidationError.INVALID_MIME_TYPE:
      return 'File MIME type does not match the file extension.';
    case FileValidationError.SIGNATURE_MISMATCH:
      return 'File signature does not match the expected file type. This could be a security risk.';
    case FileValidationError.INVALID_FILENAME:
      return 'Invalid filename. Please use a valid filename with proper extension.';
    case FileValidationError.FILE_READ_ERROR:
      return 'Failed to read file.';
    case FileValidationError.FILE_WRITE_ERROR:
      return 'Failed to write file.';
    case FileValidationError.FILE_DELETE_ERROR:
      return 'Failed to delete file.';
    default:
      return 'An unknown error occurred.';
  }
}

/**
 * Get all allowed file extensions
 *
 * @returns Array of allowed extensions
 */
export function getAllowedExtensions(): string[] {
  return Object.values(FILE_TYPE_CONFIG).flatMap(config => config.extensions);
}

/**
 * Get allowed extensions by category
 *
 * @param category - File category ('image' or 'document')
 * @returns Array of allowed extensions for the category
 */
export function getAllowedExtensionsByCategory(category: 'image' | 'document'): string[] {
  return Object.values(FILE_TYPE_CONFIG)
    .filter(config => config.category === category)
    .flatMap(config => config.extensions);
}

// =============================================================================
// ADDITIONAL EXPORTS FOR API ROUTES
// =============================================================================

/**
 * File metadata returned to client (PRD-005 format)
 */
export interface FileMetadata {
  id: string;          // ULID
  originalName: string;  // Original filename from user
  storedName: string;    // ULID-based stored filename
  url: string;           // Public URL to access file
  size: number;          // File size in bytes
  mimeType: string;      // MIME type
  uploadedAt: string;    // ISO 8601 timestamp
}

/**
 * File upload limits
 */
export const FILE_UPLOAD_LIMITS = {
  MAX_FILES: 5,              // Maximum number of files per upload
  MAX_FILE_SIZE: MAX_FILE_SIZE,  // 10MB per file
  MAX_TOTAL_SIZE: MAX_TOTAL_SIZE, // 50MB total
} as const;

/**
 * File error codes for API responses
 */
export const FILE_ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  TOTAL_SIZE_EXCEEDED: 'TOTAL_SIZE_EXCEEDED',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  INVALID_FILE_SIGNATURE: 'INVALID_FILE_SIGNATURE',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

/**
 * Validate file count
 *
 * @param count - Number of files to upload
 * @returns Validation result with error message if invalid
 */
export function validateFileCount(count: number): {
  valid: boolean;
  error?: string;
  code?: string;
} {
  if (count > FILE_UPLOAD_LIMITS.MAX_FILES) {
    return {
      valid: false,
      error: `Maximum ${FILE_UPLOAD_LIMITS.MAX_FILES} files allowed`,
      code: FILE_ERROR_CODES.TOO_MANY_FILES,
    };
  }

  return { valid: true };
}
