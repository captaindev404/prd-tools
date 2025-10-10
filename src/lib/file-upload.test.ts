/**
 * File Upload Utility - Test Suite
 *
 * Demonstrates usage of the file-upload utility with various scenarios
 */

import {
  sanitizeFilename,
  validateFile,
  validateFiles,
  saveUploadedFile,
  moveFile,
  deleteFile,
  formatFileSize,
  getErrorMessage,
  getAllowedExtensions,
  getAllowedExtensionsByCategory,
  FileValidationError,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
} from './file-upload';

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Create a mock JPEG file buffer
 */
function createMockJpegBuffer(size: number = 1024): Buffer {
  const buffer = Buffer.alloc(size);
  // JPEG signature: 0xFF 0xD8 0xFF
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  return buffer;
}

/**
 * Create a mock PNG file buffer
 */
function createMockPngBuffer(size: number = 1024): Buffer {
  const buffer = Buffer.alloc(size);
  // PNG signature: 0x89 0x50 0x4E 0x47
  buffer[0] = 0x89;
  buffer[1] = 0x50;
  buffer[2] = 0x4e;
  buffer[3] = 0x47;
  return buffer;
}

/**
 * Create a mock PDF file buffer
 */
function createMockPdfBuffer(size: number = 1024): Buffer {
  const buffer = Buffer.alloc(size);
  // PDF signature: %PDF (0x25 0x50 0x44 0x46)
  buffer[0] = 0x25;
  buffer[1] = 0x50;
  buffer[2] = 0x44;
  buffer[3] = 0x46;
  return buffer;
}

/**
 * Create a mock file with wrong signature (security test)
 */
function createMockMaliciousFile(size: number = 1024): Buffer {
  const buffer = Buffer.alloc(size);
  // Executable signature: MZ (0x4D 0x5A) - Windows PE
  buffer[0] = 0x4d;
  buffer[1] = 0x5a;
  return buffer;
}

// =============================================================================
// TEST CASES
// =============================================================================

describe('File Upload Utility', () => {
  describe('sanitizeFilename', () => {
    it('should remove directory traversal attempts', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFilename('../../../secret.txt')).toBe('secret.txt');
    });

    it('should remove special characters', () => {
      expect(sanitizeFilename('my file (1).jpg')).toBe('my-file-1.jpg');
      expect(sanitizeFilename('file@#$%^&*.png')).toBe('file.png');
      expect(sanitizeFilename('<script>alert("xss")</script>.jpg')).toBe('scriptalertxssscript.jpg');
    });

    it('should handle multiple consecutive hyphens', () => {
      expect(sanitizeFilename('file---name.jpg')).toBe('file-name.jpg');
    });

    it('should limit length to 100 characters', () => {
      const longName = 'a'.repeat(150) + '.jpg';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(104); // 100 + .jpg
    });

    it('should handle empty filenames', () => {
      expect(sanitizeFilename('...')).toBe('file');
      expect(sanitizeFilename('---')).toBe('file');
    });

    it('should preserve valid filenames', () => {
      expect(sanitizeFilename('photo_2024-01-15.jpg')).toBe('photo_2024-01-15.jpg');
      expect(sanitizeFilename('Document-Final-v2.pdf')).toBe('document-final-v2.pdf');
    });
  });

  describe('validateFile', () => {
    it('should validate a valid JPEG file', async () => {
      const buffer = createMockJpegBuffer(5000);
      const result = await validateFile(buffer, 'photo.jpg', 'image/jpeg');

      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('jpg');
      expect(result.category).toBe('image');
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid PNG file', async () => {
      const buffer = createMockPngBuffer(5000);
      const result = await validateFile(buffer, 'screenshot.png', 'image/png');

      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('png');
      expect(result.category).toBe('image');
    });

    it('should validate a valid PDF file', async () => {
      const buffer = createMockPdfBuffer(5000);
      const result = await validateFile(buffer, 'document.pdf', 'application/pdf');

      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('pdf');
      expect(result.category).toBe('document');
    });

    it('should reject file that exceeds size limit', async () => {
      const buffer = Buffer.alloc(MAX_FILE_SIZE + 1);
      const result = await validateFile(buffer, 'large.jpg', 'image/jpeg');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(FileValidationError.FILE_TOO_LARGE);
    });

    it('should reject file with invalid extension', async () => {
      const buffer = createMockJpegBuffer();
      const result = await validateFile(buffer, 'file.exe', 'application/x-msdownload');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(FileValidationError.INVALID_FILE_TYPE);
    });

    it('should reject file with mismatched MIME type', async () => {
      const buffer = createMockJpegBuffer();
      // Claim it's a PNG but file says it's JPEG
      const result = await validateFile(buffer, 'photo.jpg', 'image/png');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(FileValidationError.INVALID_MIME_TYPE);
    });

    it('should detect signature mismatch (security check)', async () => {
      // File with .jpg extension but executable signature
      const buffer = createMockMaliciousFile();
      const result = await validateFile(buffer, 'malicious.jpg', 'image/jpeg');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(FileValidationError.SIGNATURE_MISMATCH);
    });

    it('should reject files with no extension', async () => {
      const buffer = createMockJpegBuffer();
      const result = await validateFile(buffer, 'noextension', 'image/jpeg');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(FileValidationError.INVALID_FILE_TYPE);
    });

    it('should respect custom allowed types', async () => {
      const buffer = createMockPdfBuffer();
      const result = await validateFile(buffer, 'doc.pdf', 'application/pdf', {
        allowedTypes: ['jpg', 'png'], // Only allow images
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe(FileValidationError.INVALID_FILE_TYPE);
    });

    it('should respect custom max size', async () => {
      const buffer = Buffer.alloc(2000);
      buffer[0] = 0xff;
      buffer[1] = 0xd8;
      buffer[2] = 0xff;

      const result = await validateFile(buffer, 'photo.jpg', 'image/jpeg', {
        maxSize: 1000, // 1KB limit
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe(FileValidationError.FILE_TOO_LARGE);
    });
  });

  describe('validateFiles', () => {
    it('should validate multiple valid files', async () => {
      const files = [
        { buffer: createMockJpegBuffer(1000), filename: 'photo1.jpg', mimeType: 'image/jpeg' },
        { buffer: createMockPngBuffer(2000), filename: 'photo2.png', mimeType: 'image/png' },
        { buffer: createMockPdfBuffer(3000), filename: 'doc.pdf', mimeType: 'application/pdf' },
      ];

      const results = await validateFiles(files);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.valid)).toBe(true);
    });

    it('should reject when total size exceeds limit', async () => {
      const largeFileSize = Math.floor(MAX_TOTAL_SIZE / 2) + 1;
      const files = [
        { buffer: Buffer.alloc(largeFileSize), filename: 'large1.jpg', mimeType: 'image/jpeg' },
        { buffer: Buffer.alloc(largeFileSize), filename: 'large2.jpg', mimeType: 'image/jpeg' },
      ];

      const results = await validateFiles(files);

      expect(results).toHaveLength(2);
      expect(results.every(r => !r.valid)).toBe(true);
      expect(results.every(r => r.error === FileValidationError.TOTAL_SIZE_EXCEEDED)).toBe(true);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(5242880)).toBe('5 MB');
      expect(formatFileSize(10485760)).toBe('10 MB');
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly error messages', () => {
      expect(getErrorMessage(FileValidationError.FILE_TOO_LARGE)).toContain('too large');
      expect(getErrorMessage(FileValidationError.INVALID_FILE_TYPE)).toContain('not supported');
      expect(getErrorMessage(FileValidationError.SIGNATURE_MISMATCH)).toContain('security risk');
    });
  });

  describe('getAllowedExtensions', () => {
    it('should return all allowed extensions', () => {
      const extensions = getAllowedExtensions();
      expect(extensions).toContain('.jpg');
      expect(extensions).toContain('.png');
      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.docx');
      expect(extensions.length).toBeGreaterThan(0);
    });
  });

  describe('getAllowedExtensionsByCategory', () => {
    it('should return only image extensions', () => {
      const extensions = getAllowedExtensionsByCategory('image');
      expect(extensions).toContain('.jpg');
      expect(extensions).toContain('.png');
      expect(extensions).not.toContain('.pdf');
    });

    it('should return only document extensions', () => {
      const extensions = getAllowedExtensionsByCategory('document');
      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.docx');
      expect(extensions).not.toContain('.jpg');
    });
  });
});

// =============================================================================
// INTEGRATION TEST EXAMPLES
// =============================================================================

/**
 * Example: Complete file upload workflow
 */
async function exampleCompleteWorkflow() {
  console.log('=== Complete File Upload Workflow ===\n');

  // 1. User uploads a file
  const fileBuffer = createMockJpegBuffer(5000);
  const filename = 'my vacation photo (2024).jpg';
  const mimeType = 'image/jpeg';

  console.log('1. Validating file...');
  const validation = await validateFile(fileBuffer, filename, mimeType);

  if (!validation.valid) {
    console.error('Validation failed:', getErrorMessage(validation.error!));
    return;
  }

  console.log('   ✓ File is valid');
  console.log('   - Sanitized filename:', validation.sanitizedFilename);
  console.log('   - File type:', validation.fileType);
  console.log('   - Category:', validation.category);

  // 2. Save to temporary storage
  console.log('\n2. Saving to temporary storage...');
  const uploadedFile = await saveUploadedFile(fileBuffer, filename, mimeType);

  console.log('   ✓ File saved');
  console.log('   - ID:', uploadedFile.id);
  console.log('   - Storage path:', uploadedFile.filePath);
  console.log('   - Size:', formatFileSize(uploadedFile.size));

  // 3. Move to final location (after feedback is created)
  console.log('\n3. Moving to final location...');
  const feedbackId = 'fb_01HQWER123456789ASDF';
  const finalFile = await moveFile(uploadedFile.absolutePath, feedbackId);

  console.log('   ✓ File moved');
  console.log('   - Final path:', finalFile.filePath);

  // 4. Clean up if needed
  console.log('\n4. File can be accessed at:', finalFile.filePath);
}

/**
 * Example: Security test - Reject malicious file
 */
async function exampleSecurityTest() {
  console.log('\n=== Security Test: Malicious File ===\n');

  // Attacker tries to upload executable disguised as image
  const maliciousBuffer = createMockMaliciousFile();
  const result = await validateFile(maliciousBuffer, 'innocent.jpg', 'image/jpeg');

  console.log('Attempting to upload executable disguised as .jpg...');
  if (!result.valid) {
    console.log('✓ BLOCKED:', getErrorMessage(result.error!));
  } else {
    console.log('✗ SECURITY BREACH: Malicious file was accepted!');
  }
}

/**
 * Example: Batch upload
 */
async function exampleBatchUpload() {
  console.log('\n=== Batch Upload Example ===\n');

  const files = [
    { buffer: createMockJpegBuffer(2000), filename: 'photo1.jpg', mimeType: 'image/jpeg' },
    { buffer: createMockPngBuffer(3000), filename: 'screenshot.png', mimeType: 'image/png' },
    { buffer: createMockPdfBuffer(4000), filename: 'report.pdf', mimeType: 'application/pdf' },
  ];

  console.log(`Validating ${files.length} files...`);
  const results = await validateFiles(files);

  results.forEach((result, index) => {
    if (result.valid) {
      console.log(`  ✓ File ${index + 1}: ${files[index].filename} - Valid`);
    } else {
      console.log(`  ✗ File ${index + 1}: ${files[index].filename} - ${getErrorMessage(result.error!)}`);
    }
  });

  const totalSize = files.reduce((sum, f) => sum + f.buffer.length, 0);
  console.log(`\nTotal size: ${formatFileSize(totalSize)} / ${formatFileSize(MAX_TOTAL_SIZE)}`);
}

// Export examples for manual testing
export {
  exampleCompleteWorkflow,
  exampleSecurityTest,
  exampleBatchUpload,
  createMockJpegBuffer,
  createMockPngBuffer,
  createMockPdfBuffer,
  createMockMaliciousFile,
};
