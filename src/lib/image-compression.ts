/**
 * Image Compression Utility
 *
 * Client-side image compression using Canvas API to reduce file sizes
 * before upload. This improves upload speed on slow networks and reduces
 * server storage costs.
 *
 * Features:
 * - Auto-detects images that need compression (>2MB)
 * - Resizes images to max 1920px width/height (maintains aspect ratio)
 * - Converts to JPEG with 85% quality
 * - Preserves original filename
 * - Graceful fallback on errors
 *
 * Usage:
 * ```typescript
 * import { compressImage } from '@/lib/image-compression';
 *
 * const file = event.target.files[0];
 * const compressedFile = await compressImage(file);
 * ```
 *
 * @module image-compression
 */

/**
 * Compression options
 */
export interface CompressionOptions {
  /**
   * Maximum file size in MB (default: 2)
   * Files under this size are not compressed
   */
  maxSizeMB?: number;

  /**
   * Maximum width or height in pixels (default: 1920)
   * Image will be resized to fit within these dimensions while maintaining aspect ratio
   */
  maxWidthOrHeight?: number;

  /**
   * JPEG compression quality (0-1, default: 0.85)
   * Higher values = better quality but larger file size
   */
  quality?: number;

  /**
   * Output format (default: 'image/jpeg')
   * Options: 'image/jpeg', 'image/png', 'image/webp'
   */
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';

  /**
   * Whether to preserve original format (default: false)
   * If true, outputFormat is ignored and original format is used
   */
  preserveFormat?: boolean;
}

/**
 * Default compression options
 */
const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  quality: 0.85,
  outputFormat: 'image/jpeg',
  preserveFormat: false,
};

/**
 * Compress an image file using Canvas API
 *
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - The compressed file (or original if compression fails/not needed)
 *
 * @example
 * ```typescript
 * // Basic usage
 * const compressed = await compressImage(file);
 *
 * // Custom options
 * const compressed = await compressImage(file, {
 *   maxSizeMB: 1,
 *   maxWidthOrHeight: 1280,
 *   quality: 0.8
 * });
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip if file is already under size limit
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= opts.maxSizeMB) {
    return file;
  }

  // Skip if not an image
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip if unsupported image format (SVG, etc.)
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return file;
  }

  try {
    return await compressImageInternal(file, opts);
  } catch (error) {
    console.warn('Image compression failed, using original file:', error);
    return file;
  }
}

/**
 * Internal compression logic
 * Separated for better error handling
 */
async function compressImageInternal(
  file: File,
  options: Required<CompressionOptions>
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = calculateDimensions(
            img.width,
            img.height,
            options.maxWidthOrHeight
          );

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          // Draw resized image
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          const outputFormat = options.preserveFormat ? file.type : options.outputFormat;
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed'));
                return;
              }

              // Check if compressed size is actually smaller
              if (blob.size >= file.size) {
                console.info('Compressed image is larger than original, using original');
                resolve(file);
                return;
              }

              // Create new File with compressed data
              const compressedFile = new File([blob], file.name, {
                type: outputFormat,
                lastModified: Date.now(),
              });

              console.info(
                `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB (${Math.round((1 - blob.size / file.size) * 100)}% reduction)`
              );

              resolve(compressedFile);
            },
            outputFormat,
            options.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 *
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @param maxSize - Maximum width or height
 * @returns Object with new width and height
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxSize: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Check if resizing is needed
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }

  // Calculate aspect ratio
  const aspectRatio = width / height;

  if (width > height) {
    // Landscape
    width = maxSize;
    height = Math.round(width / aspectRatio);
  } else {
    // Portrait or square
    height = maxSize;
    width = Math.round(height * aspectRatio);
  }

  return { width, height };
}

/**
 * Compress multiple images in parallel
 *
 * @param files - Array of image files to compress
 * @param options - Compression options
 * @returns Promise<File[]> - Array of compressed files
 *
 * @example
 * ```typescript
 * const files = Array.from(fileInput.files);
 * const compressed = await compressImages(files);
 * ```
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Get estimated compressed size without actually compressing
 * Useful for showing users the expected reduction
 *
 * @param file - The image file
 * @param options - Compression options
 * @returns Promise<number> - Estimated compressed size in bytes
 *
 * @example
 * ```typescript
 * const estimatedSize = await getEstimatedCompressedSize(file);
 * console.log(`Estimated: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`);
 * ```
 */
export async function getEstimatedCompressedSize(
  file: File,
  options: CompressionOptions = {}
): Promise<number> {
  // This is a rough estimate based on typical compression ratios
  // Actual size will vary based on image content and quality

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip if not an image
  if (!file.type.startsWith('image/')) {
    return file.size;
  }

  // Skip if already under size limit
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= opts.maxSizeMB) {
    return file.size;
  }

  // Estimate based on quality setting
  // JPEG quality of 0.85 typically reduces size by 40-60%
  const estimatedReduction = opts.quality === 0.85 ? 0.5 : 1 - opts.quality * 0.6;
  return Math.round(file.size * estimatedReduction);
}

/**
 * Check if a file should be compressed
 *
 * @param file - The file to check
 * @param options - Compression options
 * @returns boolean - True if compression is recommended
 *
 * @example
 * ```typescript
 * if (shouldCompressImage(file)) {
 *   const compressed = await compressImage(file);
 * }
 * ```
 */
export function shouldCompressImage(
  file: File,
  options: CompressionOptions = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Must be an image
  if (!file.type.startsWith('image/')) {
    return false;
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB > opts.maxSizeMB;
}
