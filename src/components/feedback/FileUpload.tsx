'use client';

import * as React from 'react';
import { Upload, File, X, Image as ImageIcon, FileText, AlertCircle, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { compressImage, shouldCompressImage } from '@/lib/image-compression';

/**
 * File metadata returned after successful upload
 */
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

/**
 * File with upload progress tracking
 */
interface FileWithProgress extends File {
  id: string;
  progress: number;
  error?: string;
  uploadedData?: UploadedFile;
}

/**
 * FileUpload component props
 */
export interface FileUploadProps {
  /**
   * Callback when files are successfully uploaded
   */
  onChange?: (files: UploadedFile[]) => void;

  /**
   * Maximum number of files allowed (default: 5)
   */
  maxFiles?: number;

  /**
   * Maximum file size in bytes (default: 10MB)
   */
  maxSize?: number;

  /**
   * Allowed file types (MIME types or extensions)
   */
  allowedTypes?: string[];

  /**
   * Whether the component is disabled
   */
  disabled?: boolean;

  /**
   * Custom class name for the container
   */
  className?: string;
}

// Constants for file validation
const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
];

// File type extensions for display
const FILE_TYPE_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
};

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate unique ID for files
 */
function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if file is an image
 */
function isImageFile(type: string): boolean {
  return type.startsWith('image/');
}

/**
 * FileUpload - Drag & drop file upload component with progress tracking
 *
 * Features:
 * - Drag and drop zone with visual feedback
 * - Click to browse fallback
 * - Multi-file selection (configurable limit)
 * - Upload progress indicators
 * - File preview thumbnails (images) and icons (documents)
 * - Individual file removal
 * - Client-side validation with clear error messages
 * - Fully accessible with keyboard navigation and ARIA labels
 * - Responsive design for mobile, tablet, and desktop
 */
export function FileUpload({
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  disabled = false,
  className,
}: FileUploadProps) {
  // State management
  const [files, setFiles] = React.useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  // Detect mobile device for camera integration
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // Detect mobile device
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const mobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    setIsMobile(mobile);
  }, []);

  /**
   * Validate a single file against size and type constraints
   */
  const validateFile = React.useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize) {
        return `File exceeds ${formatFileSize(maxSize)} limit`;
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        const allowedExtensions = allowedTypes
          .flatMap((type) => FILE_TYPE_EXTENSIONS[type] || [])
          .join(', ');
        return `File type not allowed. Allowed types: ${allowedExtensions}`;
      }

      return null;
    },
    [maxSize, allowedTypes]
  );

  /**
   * Upload a single file to the server
   */
  const uploadFile = React.useCallback(async (fileWithProgress: FileWithProgress) => {
    const formData = new FormData();
    formData.append('file', fileWithProgress);

    try {
      // Simulate upload progress (in real implementation, use XMLHttpRequest for progress tracking)
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithProgress.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      // Upload to server
      const response = await fetch('/api/feedback/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();

      // API returns { success: true, files: FileMetadata[] }
      // Since we upload one file at a time, take the first file from the array
      const uploadedFile = data.files && data.files.length > 0 ? data.files[0] : null;

      if (!uploadedFile) {
        throw new Error('No file data returned from server');
      }

      // Convert FileMetadata to UploadedFile format
      const uploadedFileData: UploadedFile = {
        id: uploadedFile.id,
        name: uploadedFile.originalName,
        size: uploadedFile.size,
        type: uploadedFile.mimeType,
        url: uploadedFile.url,
      };

      // Update file with upload completion
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, progress: 100, uploadedData: uploadedFileData }
            : f
        )
      );

      return uploadedFileData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // Update file with error
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, error: errorMessage, progress: 0 }
            : f
        )
      );

      throw error;
    }
  }, []);

  /**
   * Process and upload selected files
   */
  const processFiles = React.useCallback(
    async (newFiles: File[]) => {
      setGlobalError(null);

      // Check maximum files limit
      if (files.length + newFiles.length > maxFiles) {
        setGlobalError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Compress images if needed (auto-compression for files >2MB)
      const processedFiles = await Promise.all(
        newFiles.map(async (file) => {
          // Check if compression is needed
          if (shouldCompressImage(file, { maxSizeMB: 2, maxWidthOrHeight: 1920 })) {
            try {
              console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
              const compressed = await compressImage(file, {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
                quality: 0.85,
              });
              console.log(`Compression complete: ${compressed.name} (${(compressed.size / 1024 / 1024).toFixed(2)}MB)`);
              return compressed;
            } catch (error) {
              console.warn('Image compression failed, using original:', error);
              return file;
            }
          }
          return file;
        })
      );

      // Validate and add files
      const validatedFiles: FileWithProgress[] = [];
      const errors: string[] = [];

      for (const file of processedFiles) {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          const fileWithProgress: FileWithProgress = Object.assign(file, {
            id: generateFileId(),
            progress: 0,
          });
          validatedFiles.push(fileWithProgress);
        }
      }

      // Show validation errors
      if (errors.length > 0) {
        setGlobalError(errors.join('; '));
      }

      // Add valid files to state
      if (validatedFiles.length > 0) {
        setFiles((prev) => [...prev, ...validatedFiles]);

        // Upload files
        const uploadPromises = validatedFiles.map((file) => uploadFile(file));

        try {
          const uploadedFiles = await Promise.all(uploadPromises);

          // Notify parent component
          if (onChange) {
            const allUploadedFiles = files
              .filter((f) => f.uploadedData)
              .map((f) => f.uploadedData!)
              .concat(uploadedFiles);
            onChange(allUploadedFiles);
          }
        } catch (error) {
          console.error('Upload error:', error);
        }
      }
    },
    [files, maxFiles, validateFile, uploadFile, onChange]
  );

  /**
   * Handle file input change (click to browse)
   */
  const handleFileInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      if (selectedFiles.length > 0) {
        processFiles(selectedFiles);
      }
      // Reset input value to allow re-selecting the same file
      event.target.value = '';
    },
    [processFiles]
  );

  /**
   * Handle drag enter event
   */
  const handleDragEnter = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  /**
   * Handle drag over event
   */
  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Only set dragging to false if leaving the dropzone entirely
    if (event.currentTarget === event.target) {
      setIsDragging(false);
    }
  }, []);

  /**
   * Handle file drop event
   */
  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const droppedFiles = Array.from(event.dataTransfer.files);
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles);
      }
    },
    [disabled, processFiles]
  );

  /**
   * Remove a file from the list
   */
  const removeFile = React.useCallback(
    (fileId: string) => {
      setFiles((prev) => {
        const updated = prev.filter((f) => f.id !== fileId);

        // Notify parent component
        if (onChange) {
          const uploadedFiles = updated
            .filter((f) => f.uploadedData)
            .map((f) => f.uploadedData!);
          onChange(uploadedFiles);
        }

        return updated;
      });
      setGlobalError(null);
    },
    [onChange]
  );

  /**
   * Open file browser dialog
   */
  const openFileBrowser = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Open camera on mobile devices
   */
  const openCamera = React.useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  /**
   * Handle keyboard interaction for dropzone
   */
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openFileBrowser();
      }
    },
    [openFileBrowser]
  );

  // Generate accepted file types string for input element
  const acceptedFileTypes = React.useMemo(() => {
    return allowedTypes
      .flatMap((type) => FILE_TYPE_EXTENSIONS[type] || [type])
      .join(',');
  }, [allowedTypes]);

  return (
    <div className={cn('w-full', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes}
        onChange={handleFileInputChange}
        disabled={disabled}
        className="sr-only"
        aria-label="File upload input"
      />

      {/* Hidden camera input (mobile only) */}
      {isMobile && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="sr-only"
          aria-label="Camera capture input"
        />
      )}

      {/* Drag and drop zone */}
      <Card
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Drag and drop files here or click to browse"
        aria-disabled={disabled}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={disabled ? undefined : openFileBrowser}
        onKeyDown={disabled ? undefined : handleKeyDown}
        className={cn(
          'relative cursor-pointer border-2 border-dashed transition-all duration-200',
          'hover:border-primary hover:bg-primary/5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragging && 'border-primary bg-primary/10 scale-[1.02]',
          disabled && 'cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent'
        )}
      >
        <div className="flex flex-col items-center justify-center gap-4 p-8 sm:p-12">
          {/* Upload icon */}
          <div
            className={cn(
              'rounded-full bg-primary/10 p-4 transition-transform duration-200',
              isDragging && 'scale-110'
            )}
          >
            <Upload
              className={cn('h-8 w-8 text-primary', isDragging && 'animate-pulse')}
              aria-hidden="true"
            />
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-base font-medium text-foreground sm:text-lg">
              Drag and drop files here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse from your device
            </p>
          </div>

          {/* File type and size info */}
          <div className="flex flex-col gap-1 text-center text-xs text-muted-foreground">
            <p>
              Supported formats:{' '}
              {allowedTypes
                .flatMap((type) => FILE_TYPE_EXTENSIONS[type] || [])
                .join(', ')}
            </p>
            <p>
              Maximum {maxFiles} files, {formatFileSize(maxSize)} per file
            </p>
          </div>

          {/* Mobile action buttons */}
          {isMobile && (
            <div className="flex flex-col gap-2 w-full sm:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  openCamera();
                }}
                className="w-full"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  openFileBrowser();
                }}
                className="w-full"
              >
                Browse Files
              </Button>
            </div>
          )}

          {/* Desktop browse button */}
          {!isMobile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                openFileBrowser();
              }}
              className="sm:hidden"
            >
              Browse Files
            </Button>
          )}
        </div>
      </Card>

      {/* Global error alert */}
      {globalError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3" role="list" aria-label="Uploaded files">
          {files.map((file) => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={() => removeFile(file.id)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * FilePreview - Individual file preview component
 */
interface FilePreviewProps {
  file: FileWithProgress;
  onRemove: () => void;
  disabled: boolean;
}

function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  // Generate image preview for image files
  React.useEffect(() => {
    if (isImageFile(file.type)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Cleanup function (data URLs don't need to be revoked)
    return () => {
      // FileReader data URLs are automatically cleaned up by garbage collection
      // No manual cleanup needed
    };
  }, [file.type]);

  const isUploading = file.progress > 0 && file.progress < 100;
  const isComplete = file.progress === 100;
  const hasError = !!file.error;

  return (
    <Card
      role="listitem"
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        hasError && 'border-destructive bg-destructive/5'
      )}
    >
      <div className="flex items-center gap-3 p-4">
        {/* File thumbnail/icon */}
        <div
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border',
            isImageFile(file.type) ? 'overflow-hidden p-0' : 'bg-muted'
          )}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt={file.name}
              className="h-full w-full object-cover"
            />
          ) : isImageFile(file.type) ? (
            <ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          ) : (
            <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground" title={file.name}>
            {file.name}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
            {isComplete && (
              <span className="text-xs font-medium text-green-600" role="status">
                Complete
              </span>
            )}
            {hasError && (
              <span className="text-xs font-medium text-destructive" role="alert">
                {file.error}
              </span>
            )}
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-2">
              <Progress value={file.progress} className="h-1" />
              <p className="mt-1 text-xs text-muted-foreground" role="status">
                Uploading... {file.progress}%
              </p>
            </div>
          )}
        </div>

        {/* Remove button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled || isUploading}
          aria-label={`Remove ${file.name}`}
          className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}
