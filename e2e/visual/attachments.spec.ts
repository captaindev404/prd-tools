/**
 * Visual Regression Tests for File Attachments
 *
 * Captures screenshots of various states to detect visual regressions.
 * Uses Playwright's built-in screenshot comparison capabilities.
 *
 * Run with: npm run test:e2e -- --project=chromium visual/attachments.spec.ts
 * Update snapshots: npm run test:e2e -- --project=chromium visual/attachments.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test';
import {
  FIXTURES,
  uploadSingleFile,
  uploadMultipleFiles,
  navigateToFeedbackForm,
  expectUploadError,
} from '../helpers/attachments';

/**
 * Setup
 */
test.beforeEach(async ({ page }) => {
  await navigateToFeedbackForm(page);

  // Wait for upload component to be ready
  const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');
  await expect(uploadZone).toBeVisible({ timeout: 10000 });
});

/**
 * =============================================================================
 * EMPTY STATE SCREENSHOTS
 * =============================================================================
 */

test.describe('Visual: Empty State', () => {
  test('should match snapshot of empty upload component', async ({ page }) => {
    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');

    // Take screenshot of upload zone
    await expect(uploadZone).toHaveScreenshot('upload-empty-state.png', {
      maxDiffPixels: 100, // Allow minor rendering differences
    });
  });

  test('should match snapshot of empty upload component - mobile', async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');

    await expect(uploadZone).toHaveScreenshot('upload-empty-state-mobile.png', {
      maxDiffPixels: 100,
    });
  });
});

/**
 * =============================================================================
 * DRAG & DROP HOVER STATE
 * =============================================================================
 */

test.describe('Visual: Hover and Drag States', () => {
  test('should match snapshot of hover state', async ({ page }) => {
    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');

    // Hover over upload zone
    await uploadZone.hover();

    // Wait for hover animation to complete
    await page.waitForTimeout(300);

    await expect(uploadZone).toHaveScreenshot('upload-hover-state.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match snapshot of drag-over state', async ({ page }) => {
    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');

    // Simulate dragenter event
    await uploadZone.dispatchEvent('dragenter');

    // Wait for drag animation
    await page.waitForTimeout(300);

    await expect(uploadZone).toHaveScreenshot('upload-drag-over-state.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match snapshot of focused state', async ({ page }) => {
    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');

    // Focus the upload zone
    await uploadZone.focus();

    // Wait for focus ring animation
    await page.waitForTimeout(200);

    await expect(uploadZone).toHaveScreenshot('upload-focused-state.png', {
      maxDiffPixels: 100,
    });
  });
});

/**
 * =============================================================================
 * UPLOAD PROGRESS SCREENSHOTS
 * =============================================================================
 */

test.describe('Visual: Upload Progress', () => {
  test('should match snapshot of uploading state', async ({ page }) => {
    // Start upload but don't wait for completion
    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');
    await uploadZone.click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURES.validImage);

    // Wait for upload to start
    await page.waitForTimeout(500);

    // Take screenshot of progress state
    const fileList = page.locator('[role="list"]');
    await expect(fileList).toHaveScreenshot('upload-progress-state.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match snapshot of multiple files uploading', async ({ page }) => {
    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');
    await uploadZone.click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      FIXTURES.validImage,
      FIXTURES.validJpeg,
      FIXTURES.validPdf,
    ]);

    // Wait for uploads to start
    await page.waitForTimeout(800);

    const fileList = page.locator('[role="list"]');
    await expect(fileList).toHaveScreenshot('upload-multiple-progress.png', {
      maxDiffPixels: 150,
    });
  });
});

/**
 * =============================================================================
 * UPLOADED FILES SCREENSHOTS
 * =============================================================================
 */

test.describe('Visual: Uploaded Files', () => {
  test('should match snapshot of single uploaded image', async ({ page }) => {
    await uploadSingleFile(page, FIXTURES.validImage);

    // Wait for thumbnail to load
    await page.waitForTimeout(500);

    const fileList = page.locator('[role="list"]');
    await expect(fileList).toHaveScreenshot('upload-single-image.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match snapshot of uploaded PDF document', async ({ page }) => {
    await uploadSingleFile(page, FIXTURES.validPdf);

    const fileList = page.locator('[role="list"]');
    await expect(fileList).toHaveScreenshot('upload-single-pdf.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match snapshot of multiple uploaded files', async ({ page }) => {
    await uploadMultipleFiles(page, [
      FIXTURES.validImage,
      FIXTURES.validJpeg,
      FIXTURES.validPdf,
    ]);

    // Wait for all thumbnails to load
    await page.waitForTimeout(1000);

    const fileList = page.locator('[role="list"]');
    await expect(fileList).toHaveScreenshot('upload-multiple-files.png', {
      maxDiffPixels: 150,
    });
  });

  test('should match snapshot of 5 files (maximum)', async ({ page }) => {
    await uploadMultipleFiles(page, [
      FIXTURES.validImage,
      FIXTURES.validJpeg,
      FIXTURES.validPdf,
      FIXTURES.validImage,
      FIXTURES.validJpeg,
    ]);

    await page.waitForTimeout(1500);

    const fileList = page.locator('[role="list"]');
    await expect(fileList).toHaveScreenshot('upload-max-files.png', {
      maxDiffPixels: 200,
    });
  });

  test('should match snapshot of uploaded file with hover on remove button', async ({
    page,
  }) => {
    await uploadSingleFile(page, FIXTURES.validImage);

    const fileItem = page.locator('[role="listitem"]').first();
    const removeButton = fileItem.locator('button[aria-label*="Remove"]');

    // Hover over remove button
    await removeButton.hover();
    await page.waitForTimeout(300);

    await expect(fileItem).toHaveScreenshot('upload-file-remove-hover.png', {
      maxDiffPixels: 100,
    });
  });
});

/**
 * =============================================================================
 * ERROR STATE SCREENSHOTS
 * =============================================================================
 */

test.describe('Visual: Error States', () => {
  test('should match snapshot of file too large error', async ({ page }) => {
    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');
    await uploadZone.click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURES.largeImage);

    // Wait for error to appear
    await expectUploadError(page, /10.*MB|size/i);

    // Screenshot the entire component with error
    const container = page.locator('.w-full').first();
    await expect(container).toHaveScreenshot('error-file-too-large.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match snapshot of invalid file type error', async ({ page }) => {
    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');
    await uploadZone.click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURES.invalidFile);

    await expectUploadError(page, /file type|not allowed/i);

    const container = page.locator('.w-full').first();
    await expect(container).toHaveScreenshot('error-invalid-file-type.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match snapshot of too many files error', async ({ page }) => {
    // Upload 5 files first
    await uploadMultipleFiles(page, [
      FIXTURES.validImage,
      FIXTURES.validJpeg,
      FIXTURES.validPdf,
      FIXTURES.validImage,
      FIXTURES.validJpeg,
    ]);

    // Try to upload one more
    const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');
    await uploadZone.click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURES.validPdf);

    await expectUploadError(page, /maximum.*5.*files/i);

    const container = page.locator('.w-full').first();
    await expect(container).toHaveScreenshot('error-too-many-files.png', {
      maxDiffPixels: 150,
    });
  });

  test('should match snapshot of file with upload error', async ({ page }) => {
    // This would require mocking a server error
    // For now, we'll skip actual implementation and document the intended test
    test.skip();
  });
});

/**
 * =============================================================================
 * FULL COMPONENT SCREENSHOTS
 * =============================================================================
 */

test.describe('Visual: Full Component States', () => {
  test('should match snapshot of complete upload flow', async ({ page }) => {
    // Capture the full form with upload component
    const form = page.locator('form').first();

    // Take initial screenshot
    await expect(form).toHaveScreenshot('component-full-empty.png', {
      maxDiffPixels: 200,
    });

    // Upload files
    await uploadMultipleFiles(page, [
      FIXTURES.validImage,
      FIXTURES.validPdf,
      FIXTURES.validJpeg,
    ]);

    await page.waitForTimeout(1000);

    // Take screenshot with uploaded files
    await expect(form).toHaveScreenshot('component-full-with-files.png', {
      maxDiffPixels: 200,
    });
  });

  test('should match snapshot of disabled state', async ({ page }) => {
    // This would require setting the component to disabled
    // For implementation, we'd need to pass disabled prop or test edit window expiry
    test.skip();
  });
});

/**
 * =============================================================================
 * DARK MODE SCREENSHOTS (if implemented)
 * =============================================================================
 */

test.describe('Visual: Dark Mode', () => {
  test.skip('should match snapshot in dark mode', async ({ page }) => {
    // If dark mode is implemented, this would:
    // 1. Enable dark mode (via button or localStorage)
    // 2. Take screenshots of various states
    // 3. Compare with dark mode baselines
  });
});

/**
 * =============================================================================
 * RESPONSIVE SCREENSHOTS
 * =============================================================================
 */

test.describe('Visual: Responsive Design', () => {
  test('should match snapshot on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await uploadMultipleFiles(page, [
      FIXTURES.validImage,
      FIXTURES.validJpeg,
      FIXTURES.validPdf,
    ]);

    await page.waitForTimeout(1000);

    const uploadComponent = page.locator('.w-full').first();
    await expect(uploadComponent).toHaveScreenshot('responsive-tablet.png', {
      maxDiffPixels: 200,
    });
  });

  test('should match snapshot on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await uploadMultipleFiles(page, [
      FIXTURES.validImage,
      FIXTURES.validPdf,
    ]);

    await page.waitForTimeout(1000);

    const uploadComponent = page.locator('.w-full').first();
    await expect(uploadComponent).toHaveScreenshot('responsive-mobile.png', {
      maxDiffPixels: 200,
    });
  });

  test('should match snapshot on large desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await uploadMultipleFiles(page, [
      FIXTURES.validImage,
      FIXTURES.validJpeg,
      FIXTURES.validPdf,
    ]);

    await page.waitForTimeout(1000);

    const uploadComponent = page.locator('.w-full').first();
    await expect(uploadComponent).toHaveScreenshot('responsive-desktop.png', {
      maxDiffPixels: 200,
    });
  });
});
