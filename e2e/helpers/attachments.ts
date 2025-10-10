/**
 * E2E Test Helpers for File Attachments
 *
 * Provides reusable utility functions for testing file upload functionality.
 */

import { Page, expect } from '@playwright/test';
import { join } from 'path';

/**
 * File paths for test fixtures
 */
export const FIXTURES = {
  validImage: join(__dirname, '..', 'fixtures', 'test-image.png'),
  validJpeg: join(__dirname, '..', 'fixtures', 'test-image.jpg'),
  validPdf: join(__dirname, '..', 'fixtures', 'test-document.pdf'),
  largeImage: join(__dirname, '..', 'fixtures', 'test-large-image.jpg'),
  spoofedFile: join(__dirname, '..', 'fixtures', 'test-spoofed.jpg.exe'),
  invalidFile: join(__dirname, '..', 'fixtures', 'test-invalid.exe'),
};

/**
 * Wait for file upload to complete
 */
export async function waitForUploadComplete(
  page: Page,
  filename: string,
  timeout = 10000
) {
  // Wait for the file to appear in the uploaded files list
  const fileItem = page.locator(`[role="listitem"]:has-text("${filename}")`);
  await expect(fileItem).toBeVisible({ timeout });

  // Wait for "Complete" status
  const completeStatus = fileItem.locator('text=Complete');
  await expect(completeStatus).toBeVisible({ timeout });
}

/**
 * Upload a single file via file input
 */
export async function uploadSingleFile(
  page: Page,
  filePath: string,
  waitForComplete = true
) {
  // Click the upload zone to trigger file picker
  const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');
  await uploadZone.click();

  // Set file input value
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  if (waitForComplete) {
    const filename = filePath.split('/').pop() || 'unknown';
    await waitForUploadComplete(page, filename);
  }
}

/**
 * Upload multiple files via file input
 */
export async function uploadMultipleFiles(
  page: Page,
  filePaths: string[],
  waitForComplete = true
) {
  // Click the upload zone to trigger file picker
  const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');
  await uploadZone.click();

  // Set multiple files
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePaths);

  if (waitForComplete) {
    // Wait for all files to complete
    for (const filePath of filePaths) {
      const filename = filePath.split('/').pop() || 'unknown';
      await waitForUploadComplete(page, filename);
    }
  }
}

/**
 * Upload files via drag and drop
 * Note: Playwright's drag & drop for files requires special handling
 */
export async function uploadViaDragDrop(
  page: Page,
  filePaths: string[],
  waitForComplete = true
) {
  // Get the upload zone
  const uploadZone = page.locator('[role="button"][aria-label*="Drag and drop"]');

  // Use the file input approach (Playwright doesn't support true file drag & drop)
  // This simulates the drag & drop by directly setting files
  const fileInput = page.locator('input[type="file"]');

  // Trigger the drag events for visual feedback testing
  await uploadZone.dispatchEvent('dragenter');
  await page.waitForTimeout(100);

  // Set files (simulates drop)
  await fileInput.setInputFiles(filePaths);

  if (waitForComplete) {
    for (const filePath of filePaths) {
      const filename = filePath.split('/').pop() || 'unknown';
      await waitForUploadComplete(page, filename);
    }
  }
}

/**
 * Remove an uploaded file
 */
export async function removeUploadedFile(page: Page, filename: string) {
  const fileItem = page.locator(`[role="listitem"]:has-text("${filename}")`);
  const removeButton = fileItem.locator('button[aria-label*="Remove"]');
  await removeButton.click();

  // Wait for file to be removed
  await expect(fileItem).not.toBeVisible({ timeout: 5000 });
}

/**
 * Check if upload error is displayed
 */
export async function expectUploadError(page: Page, errorText?: string) {
  const errorAlert = page.locator('[role="alert"]');
  await expect(errorAlert).toBeVisible({ timeout: 5000 });

  if (errorText) {
    await expect(errorAlert).toContainText(errorText);
  }
}

/**
 * Get upload file count
 */
export async function getUploadedFileCount(page: Page): Promise<number> {
  const fileItems = page.locator('[role="listitem"]');
  return await fileItems.count();
}

/**
 * Navigate to feedback creation page
 */
export async function navigateToFeedbackForm(page: Page) {
  await page.goto('/feedback');

  // Look for "New Feedback" or "Submit" button
  const submitButton = page
    .locator('text=/new feedback|submit feedback/i')
    .first();

  if (await submitButton.isVisible()) {
    await submitButton.click();
  }

  // Wait for form to be visible
  await expect(
    page.locator('input[name="title"], input[placeholder*="title" i]')
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Fill feedback form with basic data
 */
export async function fillFeedbackForm(
  page: Page,
  data: { title: string; body: string }
) {
  const titleField = page
    .locator('input[name="title"], input[placeholder*="title" i]')
    .first();
  const bodyField = page
    .locator('textarea[name="body"], textarea[placeholder*="description" i]')
    .first();

  await titleField.fill(data.title);
  await bodyField.fill(data.body);
}

/**
 * Submit feedback form
 */
export async function submitFeedbackForm(page: Page) {
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
}

/**
 * Create feedback with attachments (full workflow)
 */
export async function createFeedbackWithAttachments(
  page: Page,
  feedbackData: { title: string; body: string },
  attachmentPaths: string[]
) {
  await navigateToFeedbackForm(page);
  await fillFeedbackForm(page, feedbackData);

  // Upload attachments if provided
  if (attachmentPaths.length > 0) {
    await uploadMultipleFiles(page, attachmentPaths);
  }

  await submitFeedbackForm(page);

  // Wait for success message or redirect
  await expect(
    page.locator('text=/success|submitted/i')
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Check if image lightbox is open
 */
export async function expectLightboxOpen(page: Page) {
  const lightbox = page.locator('[role="dialog"]');
  await expect(lightbox).toBeVisible({ timeout: 5000 });
}

/**
 * Close image lightbox
 */
export async function closeLightbox(page: Page) {
  // Look for close button (X) or ESC key
  const closeButton = page.locator('[role="dialog"] button[aria-label*="close" i]');

  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Use ESC key as fallback
    await page.keyboard.press('Escape');
  }

  // Wait for lightbox to close
  const lightbox = page.locator('[role="dialog"]');
  await expect(lightbox).not.toBeVisible({ timeout: 5000 });
}

/**
 * Navigate lightbox (next/previous)
 */
export async function navigateLightbox(page: Page, direction: 'next' | 'previous') {
  const button = page.locator(
    `[role="dialog"] button[aria-label*="${direction}" i]`
  );
  await button.click();

  // Wait for image to load
  await page.waitForTimeout(500);
}

/**
 * Check attachment display on feedback detail page
 */
export async function expectAttachmentsOnDetail(
  page: Page,
  fileCount: number,
  fileNames?: string[]
) {
  // Check attachment section exists
  const attachmentSection = page.locator('text=/attachments/i').first();
  await expect(attachmentSection).toBeVisible({ timeout: 5000 });

  // Check file count
  const attachments = page.locator('[data-testid*="attachment"]');
  await expect(attachments).toHaveCount(fileCount);

  // Check specific file names if provided
  if (fileNames) {
    for (const fileName of fileNames) {
      const attachment = page.locator(`text="${fileName}"`);
      await expect(attachment).toBeVisible();
    }
  }
}

/**
 * Click on an image attachment to open lightbox
 */
export async function clickImageAttachment(page: Page, fileName: string) {
  const attachment = page.locator(`[data-testid*="attachment"]:has-text("${fileName}")`);
  await attachment.click();

  await expectLightboxOpen(page);
}

/**
 * Download a document attachment
 */
export async function downloadAttachment(page: Page, fileName: string) {
  const attachment = page.locator(
    `[data-testid*="attachment"]:has-text("${fileName}")`
  );
  const downloadButton = attachment.locator('button:has-text("Download")');

  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent('download');
  await downloadButton.click();

  const download = await downloadPromise;
  return download;
}

/**
 * Wait for upload progress indicator
 */
export async function waitForUploadProgress(page: Page, filename: string) {
  const fileItem = page.locator(`[role="listitem"]:has-text("${filename}")`);
  const progressBar = fileItem.locator('[role="progressbar"]');

  // Wait for progress to appear
  await expect(progressBar).toBeVisible({ timeout: 5000 });

  // Check progress text
  const progressText = fileItem.locator('text=/uploading/i');
  await expect(progressText).toBeVisible();
}

/**
 * Check rate limit error
 */
export async function expectRateLimitError(page: Page) {
  const errorMessage = page.locator('text=/rate limit/i');
  await expect(errorMessage).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for authentication state
 */
export async function waitForAuth(page: Page) {
  // Wait for auth to complete (either redirect to login or show authenticated UI)
  await page.waitForLoadState('networkidle');

  // Check if on login page or authenticated
  const isLoginPage = await page
    .locator('text=/sign in|log in/i')
    .first()
    .isVisible()
    .catch(() => false);

  return !isLoginPage;
}

/**
 * Mock authentication for tests
 * This is a placeholder - implement based on your auth setup
 */
export async function mockAuth(page: Page, userRole = 'USER') {
  // Set auth cookies or local storage
  // This depends on your NextAuth.js setup
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Date.now() / 1000 + 86400, // 1 day
    },
  ]);
}

/**
 * Clean up uploaded test files from server
 * Should be called in afterEach or afterAll hooks
 */
export async function cleanupTestUploads(page: Page) {
  // Call cleanup API endpoint if available
  try {
    await page.request.delete('/api/test/cleanup-uploads', {
      timeout: 5000,
    });
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn('Failed to cleanup test uploads:', error);
  }
}
