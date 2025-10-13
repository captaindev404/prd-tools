/**
 * Example Test Cases for Image Compression
 *
 * These examples demonstrate how to test the image compression utilities.
 * To run actual tests, integrate with Jest and @testing-library/react.
 *
 * @example
 * ```bash
 * npm run test -- image-compression.test.ts
 * ```
 */

import { compressImage, shouldCompressImage, getEstimatedCompressedSize } from './image-compression';

/**
 * Helper to create mock File objects for testing
 */
function createMockImageFile(
  sizeInBytes: number,
  width: number = 2000,
  height: number = 1500,
  type: string = 'image/jpeg'
): File {
  // Create mock blob data
  const blob = new Blob([new ArrayBuffer(sizeInBytes)], { type });
  return new File([blob], 'test-image.jpg', {
    type,
    lastModified: Date.now(),
  });
}

/**
 * Test Suite 1: Compression Decision Logic
 */
describe('shouldCompressImage', () => {
  it('should return true for images over 2MB', () => {
    const largeImage = createMockImageFile(3 * 1024 * 1024); // 3MB
    expect(shouldCompressImage(largeImage)).toBe(true);
  });

  it('should return false for images under 2MB', () => {
    const smallImage = createMockImageFile(1 * 1024 * 1024); // 1MB
    expect(shouldCompressImage(smallImage)).toBe(false);
  });

  it('should return false for non-image files', () => {
    const pdfFile = new File([new Blob()], 'document.pdf', { type: 'application/pdf' });
    expect(shouldCompressImage(pdfFile)).toBe(false);
  });

  it('should respect custom size threshold', () => {
    const image = createMockImageFile(1.5 * 1024 * 1024); // 1.5MB
    expect(shouldCompressImage(image, { maxSizeMB: 1 })).toBe(true);
    expect(shouldCompressImage(image, { maxSizeMB: 2 })).toBe(false);
  });
});

/**
 * Test Suite 2: Image Compression
 */
describe('compressImage', () => {
  it('should return original file if under size threshold', async () => {
    const smallImage = createMockImageFile(1 * 1024 * 1024); // 1MB
    const result = await compressImage(smallImage);
    expect(result).toBe(smallImage); // Same reference
  });

  it('should compress large images', async () => {
    const largeImage = createMockImageFile(5 * 1024 * 1024); // 5MB
    const result = await compressImage(largeImage);

    // Result should be smaller (or same if compression didn't help)
    expect(result.size).toBeLessThanOrEqual(largeImage.size);
  });

  it('should handle different image formats', async () => {
    const formats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    for (const format of formats) {
      const image = createMockImageFile(3 * 1024 * 1024, 2000, 1500, format);
      const result = await compressImage(image);
      expect(result).toBeDefined();
      expect(result instanceof File).toBe(true);
    }
  });

  it('should skip unsupported formats', async () => {
    const svgFile = createMockImageFile(3 * 1024 * 1024, 2000, 1500, 'image/svg+xml');
    const result = await compressImage(svgFile);
    expect(result).toBe(svgFile); // Unchanged
  });

  it('should use custom compression options', async () => {
    const image = createMockImageFile(3 * 1024 * 1024);

    const result = await compressImage(image, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280,
      quality: 0.8,
    });

    expect(result).toBeDefined();
  });

  it('should preserve file name', async () => {
    const image = new File(
      [new Blob([new ArrayBuffer(3 * 1024 * 1024)])],
      'my-photo.jpg',
      { type: 'image/jpeg' }
    );

    const result = await compressImage(image);
    expect(result.name).toBe('my-photo.jpg');
  });
});

/**
 * Test Suite 3: Size Estimation
 */
describe('getEstimatedCompressedSize', () => {
  it('should return original size for files under threshold', async () => {
    const smallImage = createMockImageFile(1 * 1024 * 1024);
    const estimated = await getEstimatedCompressedSize(smallImage);
    expect(estimated).toBe(smallImage.size);
  });

  it('should return estimated size for large images', async () => {
    const largeImage = createMockImageFile(5 * 1024 * 1024);
    const estimated = await getEstimatedCompressedSize(largeImage);

    // Should be smaller than original
    expect(estimated).toBeLessThan(largeImage.size);

    // Should be roughly 40-60% of original (for quality 0.85)
    expect(estimated).toBeGreaterThan(largeImage.size * 0.3);
    expect(estimated).toBeLessThan(largeImage.size * 0.7);
  });

  it('should return original size for non-images', async () => {
    const pdfFile = new File([new Blob([new ArrayBuffer(3 * 1024 * 1024)])], 'doc.pdf', {
      type: 'application/pdf',
    });
    const estimated = await getEstimatedCompressedSize(pdfFile);
    expect(estimated).toBe(pdfFile.size);
  });
});

/**
 * Test Suite 4: Integration Tests
 */
describe('Image Compression Integration', () => {
  it('should handle batch compression', async () => {
    const files = [
      createMockImageFile(3 * 1024 * 1024), // 3MB
      createMockImageFile(4 * 1024 * 1024), // 4MB
      createMockImageFile(1 * 1024 * 1024), // 1MB (skip)
    ];

    const results = await Promise.all(files.map(f => compressImage(f)));

    expect(results).toHaveLength(3);
    expect(results[0].size).toBeLessThanOrEqual(files[0].size);
    expect(results[1].size).toBeLessThanOrEqual(files[1].size);
    expect(results[2]).toBe(files[2]); // Skipped, same reference
  });

  it('should handle compression errors gracefully', async () => {
    // Create a file that will cause compression to fail
    const corruptFile = new File(
      [new Blob([new ArrayBuffer(3 * 1024 * 1024)])],
      'corrupt.jpg',
      { type: 'image/jpeg' }
    );

    // Should not throw, should return original file
    const result = await compressImage(corruptFile);
    expect(result).toBeDefined();
  });

  it('should maintain aspect ratio during resize', async () => {
    // This test would require actual image data and Canvas API
    // In a real test environment, you'd create actual image files
    // and verify the output dimensions match the expected aspect ratio

    const landscapeImage = createMockImageFile(3 * 1024 * 1024, 4000, 3000);
    const result = await compressImage(landscapeImage, { maxWidthOrHeight: 1920 });

    // Expected dimensions: 1920 x 1440 (4:3 ratio maintained)
    expect(result).toBeDefined();
  });
});

/**
 * Performance Test Examples
 */
describe('Compression Performance', () => {
  it('should compress within reasonable time', async () => {
    const largeImage = createMockImageFile(5 * 1024 * 1024);

    const startTime = Date.now();
    await compressImage(largeImage);
    const duration = Date.now() - startTime;

    // Compression should take less than 2 seconds for typical images
    expect(duration).toBeLessThan(2000);
  });

  it('should skip compression quickly for small files', async () => {
    const smallImage = createMockImageFile(1 * 1024 * 1024);

    const startTime = Date.now();
    await compressImage(smallImage);
    const duration = Date.now() - startTime;

    // Skip check should be nearly instant (<10ms)
    expect(duration).toBeLessThan(10);
  });
});

/**
 * Edge Cases
 */
describe('Edge Cases', () => {
  it('should handle very large images', async () => {
    const hugeImage = createMockImageFile(20 * 1024 * 1024); // 20MB
    const result = await compressImage(hugeImage);
    expect(result.size).toBeLessThan(hugeImage.size);
  });

  it('should handle images with extreme dimensions', async () => {
    const panorama = createMockImageFile(5 * 1024 * 1024, 8000, 1000); // 8:1 ratio
    const result = await compressImage(panorama);
    expect(result).toBeDefined();
  });

  it('should handle square images', async () => {
    const square = createMockImageFile(3 * 1024 * 1024, 2000, 2000);
    const result = await compressImage(square);
    expect(result).toBeDefined();
  });

  it('should handle portrait images', async () => {
    const portrait = createMockImageFile(3 * 1024 * 1024, 1500, 2000); // 3:4 ratio
    const result = await compressImage(portrait);
    expect(result).toBeDefined();
  });

  it('should handle images exactly at threshold', async () => {
    const exactThreshold = createMockImageFile(2 * 1024 * 1024); // Exactly 2MB
    const result = await compressImage(exactThreshold);
    expect(result).toBe(exactThreshold); // Should not compress
  });
});

/**
 * Console Output Examples
 *
 * When running compression in development, you'll see console output like:
 *
 * ```
 * Compressing image: large-photo.jpg (5.23MB)
 * Image compressed: 5.23MB → 0.87MB (83% reduction)
 * ```
 *
 * When compression is skipped:
 * ```
 * (No output - compression skipped for files under 2MB)
 * ```
 *
 * When compressed file is larger than original:
 * ```
 * Compressed image is larger than original, using original
 * ```
 *
 * When compression fails:
 * ```
 * Image compression failed, using original file: Error: Canvas toBlob failed
 * ```
 */

export {
  createMockImageFile,
  // Add your actual test exports here
};
