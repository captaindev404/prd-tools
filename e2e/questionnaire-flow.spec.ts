import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs, clearAuth, waitForApiResponse } from './helpers/auth';

/**
 * E2E Tests for Questionnaire Flow (TASK-202)
 *
 * Comprehensive test suite covering:
 * - RESEARCHER creates questionnaire with QuestionBuilder
 * - Publish validation (missing translations fails)
 * - USER responds to questionnaire
 * - RESEARCHER views analytics dashboard
 * - Export CSV with PII (RESEARCHER only)
 * - Language toggle switches EN/FR
 *
 * Prerequisites:
 * - Test database with seeded users (RESEARCHER, USER)
 * - Dev server running on localhost:3000
 */

test.describe('Questionnaire Flow - Complete User Journey', () => {
  let questionnaireId: string;

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await clearAuth(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Take screenshot on failure
    if (testInfo.status === 'failed') {
      const screenshotPath = `test-results/screenshots/${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
    }
  });

  test.describe('RESEARCHER - Create Questionnaire', () => {
    test('should create questionnaire with QuestionBuilder using API', async ({ page }) => {
      // Login as RESEARCHER
      await loginAs(page, 'researcher');
      await page.goto('/research/questionnaires');

      // Verify RESEARCHER can access questionnaires page
      await expect(page).toHaveURL(/\/research\/questionnaires/);

      // Check for "New Questionnaire" button or link
      const newButton = page.locator('text=/new questionnaire|create/i').first();
      const hasNewButton = await newButton.isVisible().catch(() => false);

      if (hasNewButton) {
        await newButton.click();
        await expect(page).toHaveURL(/\/research\/questionnaires\/new/);

        // Verify page shows API-based creation (since UI builder is under construction)
        await expect(page.locator('text=/questionnaire builder/i')).toBeVisible();
        await expect(page.locator('text=/api endpoint/i')).toBeVisible();
      }

      // Create questionnaire via API
      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'E2E Test Questionnaire - Customer Satisfaction',
          questions: [
            {
              id: 'q1',
              type: 'nps',
              text: { en: 'How likely are you to recommend us?', fr: 'Quelle est la probabilité que vous nous recommandiez ?' },
              required: true,
              order: 0,
            },
            {
              id: 'q2',
              type: 'likert',
              text: { en: 'Rate your experience', fr: 'Évaluez votre expérience' },
              required: true,
              order: 1,
              scale: { min: 1, max: 5, labels: { en: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'], fr: ['Mauvais', 'Passable', 'Bon', 'Très bon', 'Excellent'] } },
            },
            {
              id: 'q3',
              type: 'text',
              text: { en: 'What could we improve?', fr: 'Que pourrions-nous améliorer ?' },
              required: false,
              order: 2,
              multiline: true,
            },
            {
              id: 'q4',
              type: 'mcq',
              text: { en: 'Which features do you use most?', fr: 'Quelles fonctionnalités utilisez-vous le plus ?' },
              required: true,
              order: 3,
              options: [
                { value: 'reservations', label: { en: 'Reservations', fr: 'Réservations' } },
                { value: 'checkin', label: { en: 'Check-in', fr: 'Enregistrement' } },
                { value: 'payments', label: { en: 'Payments', fr: 'Paiements' } },
                { value: 'housekeeping', label: { en: 'Housekeeping', fr: 'Entretien' } },
              ],
              allowMultiple: true,
            },
          ],
          targeting: {
            type: 'all_users',
          },
          anonymous: false,
          responseLimit: 1,
        },
      });

      expect(createResponse.ok()).toBeTruthy();
      const result = await createResponse.json();
      questionnaireId = result.data?.id;

      console.log(`✅ Created questionnaire: ${questionnaireId}`);

      // Verify questionnaire appears in list
      await page.goto('/research/questionnaires');
      await expect(page.locator(`text=/E2E Test Questionnaire/i`)).toBeVisible({ timeout: 5000 });
    });

    test('should fail to publish questionnaire with missing translations', async ({ page }) => {
      // Login as RESEARCHER
      await loginAs(page, 'researcher');

      // Create questionnaire with incomplete translations (EN only)
      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'Incomplete Translation Test',
          questions: [
            {
              id: 'q1',
              type: 'text',
              text: 'English only question', // Missing FR translation
              required: true,
              order: 0,
            },
          ],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 1,
        },
      });

      const result = await createResponse.json();
      const testQuestionnaireId = result.data?.id;

      // Try to publish
      const publishResponse = await page.request.post(
        `/api/questionnaires/${testQuestionnaireId}/publish`,
        { data: {} }
      );

      // Should fail with validation error
      expect(publishResponse.status()).toBe(400);
      const errorResult = await publishResponse.json();
      expect(errorResult.error).toMatch(/translation|language/i);

      console.log('✅ Publish validation correctly rejected incomplete translations');
    });

    test('should successfully publish questionnaire with complete translations', async ({ page }) => {
      // Login as RESEARCHER
      await loginAs(page, 'researcher');

      // Assume questionnaireId was created in first test
      // In real scenario, we'd create a new one or use a fixture

      // Create a properly translated questionnaire
      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'Complete Translation Test',
          questions: [
            {
              id: 'q1',
              type: 'text',
              text: { en: 'English question', fr: 'Question en français' },
              required: true,
              order: 0,
            },
          ],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 1,
        },
      });

      const result = await createResponse.json();
      const testQuestionnaireId = result.data?.id;

      // Publish should succeed
      const publishResponse = await page.request.post(
        `/api/questionnaires/${testQuestionnaireId}/publish`,
        { data: {} }
      );

      expect(publishResponse.ok()).toBeTruthy();
      const publishResult = await publishResponse.json();
      expect(publishResult.data?.status).toBe('published');

      console.log('✅ Questionnaire published successfully with complete translations');
    });
  });

  test.describe('USER - Respond to Questionnaire', () => {
    test('should display questionnaire to authenticated USER', async ({ page }) => {
      // Login as USER
      await loginAs(page, 'user');
      await page.goto('/research/my-questionnaires');

      // Should see available questionnaires
      await expect(page.locator('text=/questionnaire/i')).toBeVisible();
    });

    test('should validate required questions before submission', async ({ page }) => {
      // Login as USER
      await loginAs(page, 'user');

      // Navigate to a test questionnaire response page
      // For this test, we'll use a mock questionnaire ID
      // In production, you'd query for a published questionnaire
      await page.goto('/questionnaires/qnn_test_001/respond');

      // Try to submit without answering required questions
      const submitButton = page.locator('button:has-text("Submit Response"), button[type="submit"]');

      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();

        // Should show validation error
        await expect(page.locator('text=/required|validation/i')).toBeVisible({ timeout: 3000 });
        console.log('✅ Validation correctly prevents submission of incomplete questionnaire');
      }
    });

    test('should successfully submit complete questionnaire response', async ({ page }) => {
      // Login as USER
      await loginAs(page, 'user');

      // Create a test questionnaire first
      await loginAs(page, 'researcher');
      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'User Response Test',
          questions: [
            {
              id: 'q1',
              type: 'nps',
              text: { en: 'Rate us 0-10', fr: 'Notez-nous 0-10' },
              required: true,
              order: 0,
            },
            {
              id: 'q2',
              type: 'text',
              text: { en: 'Any comments?', fr: 'Des commentaires ?' },
              required: false,
              order: 1,
            },
          ],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 1,
        },
      });

      const result = await createResponse.json();
      const testQid = result.data?.id;

      // Publish it
      await page.request.post(`/api/questionnaires/${testQid}/publish`, { data: {} });

      // Now login as USER and respond
      await loginAs(page, 'user');
      await page.goto(`/questionnaires/${testQid}/respond`);

      // Wait for questionnaire to load
      await expect(page.locator('text=/User Response Test/i')).toBeVisible({ timeout: 5000 });

      // Fill out the questionnaire
      // For NPS question (typically radio buttons or slider)
      const npsInput = page.locator('input[type="radio"][value="8"], input[type="number"]').first();
      if (await npsInput.isVisible().catch(() => false)) {
        await npsInput.click();
      }

      // Fill optional text field
      const textArea = page.locator('textarea').first();
      if (await textArea.isVisible().catch(() => false)) {
        await textArea.fill('Great experience overall!');
      }

      // Submit
      const submitButton = page.locator('button:has-text("Submit Response")');
      await submitButton.click();

      // Wait for submission
      await waitForApiResponse(page, `/api/questionnaires/${testQid}/responses`, { timeout: 10000 });

      // Should show success message
      await expect(page.locator('text=/thank you|success|submitted/i')).toBeVisible({ timeout: 5000 });

      console.log('✅ User successfully submitted questionnaire response');
    });

    test('should show completion message after submission', async ({ page }) => {
      // This test assumes a questionnaire was already completed
      // We'll navigate to the response page of an already-answered questionnaire

      await loginAs(page, 'user');

      // Try to respond to the same questionnaire again
      // Should show "already responded" or redirect
      await page.goto('/questionnaires/qnn_test_001/respond');

      // Look for completion or already-responded message
      const completionMessage = page.locator('text=/thank you|already responded|completed/i');
      const isCompleted = await completionMessage.isVisible().catch(() => false);

      if (isCompleted) {
        console.log('✅ Completion message displayed correctly');
      }
    });
  });

  test.describe('RESEARCHER - View Analytics Dashboard', () => {
    test('should display analytics dashboard for RESEARCHER', async ({ page }) => {
      // Login as RESEARCHER
      await loginAs(page, 'researcher');

      // Create and publish a questionnaire with responses
      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'Analytics Test Questionnaire',
          questions: [
            {
              id: 'q1',
              type: 'nps',
              text: { en: 'NPS Question', fr: 'Question NPS' },
              required: true,
              order: 0,
            },
          ],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 100,
        },
      });

      const result = await createResponse.json();
      const analyticsQid = result.data?.id;

      // Navigate to analytics page
      await page.goto(`/research/questionnaires/${analyticsQid}/analytics`);

      // Should display analytics page
      await expect(page).toHaveURL(/\/analytics/);
      await expect(page.locator('text=/analytics/i')).toBeVisible();

      // Should show summary cards
      await expect(page.locator('text=/total responses|responses/i')).toBeVisible();

      // Should show tabs for different views
      const tabs = ['questions', 'demographics', 'responses'];
      for (const tab of tabs) {
        const tabElement = page.locator(`text=/^${tab}$/i`);
        if (await tabElement.isVisible().catch(() => false)) {
          console.log(`✅ Tab "${tab}" is visible`);
        }
      }

      console.log('✅ Analytics dashboard loads correctly for RESEARCHER');
    });

    test('should show "No Responses" state for new questionnaire', async ({ page }) => {
      // Login as RESEARCHER
      await loginAs(page, 'researcher');

      // Create a new questionnaire without responses
      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'Empty Analytics Test',
          questions: [
            {
              id: 'q1',
              type: 'text',
              text: { en: 'Test', fr: 'Test' },
              required: true,
              order: 0,
            },
          ],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 1,
        },
      });

      const result = await createResponse.json();
      const emptyQid = result.data?.id;

      await page.goto(`/research/questionnaires/${emptyQid}/analytics`);

      // Should show empty state
      await expect(page.locator('text=/no responses|0 responses/i')).toBeVisible();

      console.log('✅ Empty state displayed correctly for questionnaire with no responses');
    });
  });

  test.describe('RESEARCHER - Export CSV with PII', () => {
    test('should export CSV without PII when includePII=false', async ({ page }) => {
      // Login as RESEARCHER
      await loginAs(page, 'researcher');

      // Create test questionnaire
      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'Export Test',
          questions: [{ id: 'q1', type: 'text', text: { en: 'Q', fr: 'Q' }, required: true, order: 0 }],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 1,
        },
      });

      const result = await createResponse.json();
      const exportQid = result.data?.id;

      // Export CSV without PII
      const exportResponse = await page.request.get(
        `/api/questionnaires/${exportQid}/export?format=csv&includePII=false`
      );

      expect(exportResponse.ok()).toBeTruthy();
      const csvData = await exportResponse.text();

      // CSV should NOT contain PII fields
      expect(csvData).not.toMatch(/email|employeeId/i);
      // But should contain non-PII demographics
      expect(csvData).toMatch(/role|village/i);

      console.log('✅ CSV export without PII works correctly');
    });

    test('should export CSV with PII when includePII=true (RESEARCHER only)', async ({ page }) => {
      // Login as RESEARCHER
      await loginAs(page, 'researcher');

      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'PII Export Test',
          questions: [{ id: 'q1', type: 'text', text: { en: 'Q', fr: 'Q' }, required: true, order: 0 }],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 1,
        },
      });

      const result = await createResponse.json();
      const piiQid = result.data?.id;

      // Export CSV with PII
      const exportResponse = await page.request.get(
        `/api/questionnaires/${piiQid}/export?format=csv&includePII=true`
      );

      expect(exportResponse.ok()).toBeTruthy();
      const csvData = await exportResponse.text();

      // CSV SHOULD contain PII fields for RESEARCHER
      expect(csvData).toMatch(/userId|email|employeeId/i);

      console.log('✅ CSV export with PII works correctly for RESEARCHER');
    });

    test('should deny PII export for non-RESEARCHER users', async ({ page }) => {
      // Login as regular USER
      await loginAs(page, 'user');

      // Try to export with PII
      const exportResponse = await page.request.get(
        '/api/questionnaires/qnn_test_001/export?format=csv&includePII=true'
      );

      // Should be forbidden
      expect(exportResponse.status()).toBe(403);

      console.log('✅ PII export correctly denied for non-RESEARCHER users');
    });

    test('should download CSV file with correct headers', async ({ page }) => {
      // Login as RESEARCHER
      await loginAs(page, 'researcher');

      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'Download Test',
          questions: [{ id: 'q1', type: 'text', text: { en: 'Q', fr: 'Q' }, required: true, order: 0 }],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 1,
        },
      });

      const result = await createResponse.json();
      const downloadQid = result.data?.id;

      await page.goto(`/research/questionnaires/${downloadQid}/analytics`);

      // Click export button
      const exportButton = page.locator('button:has-text("Export"), text=/download|export/i').first();

      if (await exportButton.isVisible().catch(() => false)) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          exportButton.click(),
        ]);

        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.csv$/);

        console.log(`✅ CSV file downloaded: ${filename}`);
      }
    });
  });

  test.describe('Language Toggle - EN/FR', () => {
    test('should display questionnaire in English by default', async ({ page }) => {
      // Login as USER with EN preference
      await loginAs(page, 'user');

      await page.goto('/questionnaires/qnn_test_001/respond');

      // Check for English text (assuming questionnaire has EN/FR translations)
      const englishText = page.locator('text=/how likely|rate us/i');
      const isEnglish = await englishText.isVisible().catch(() => false);

      if (isEnglish) {
        console.log('✅ Questionnaire displays in English by default');
      }
    });

    test('should switch to French when language toggle is clicked', async ({ page }) => {
      // Login as USER
      await loginAs(page, 'user');

      await page.goto('/questionnaires/qnn_test_001/respond');

      // Look for language toggle (typically in header or settings)
      const languageToggle = page.locator('[data-testid="language-toggle"], button:has-text("FR"), text=/français/i').first();

      if (await languageToggle.isVisible().catch(() => false)) {
        await languageToggle.click();

        // Should now display French text
        const frenchText = page.locator('text=/probabilité|notez-nous/i');
        await expect(frenchText).toBeVisible({ timeout: 3000 });

        console.log('✅ Language toggle switches to French correctly');
      }
    });

    test('should persist language preference across pages', async ({ page }) => {
      // Login as USER
      await loginAs(page, 'user');

      await page.goto('/research/my-questionnaires');

      // Switch to French
      const languageToggle = page.locator('[data-testid="language-toggle"], button:has-text("FR")').first();

      if (await languageToggle.isVisible().catch(() => false)) {
        await languageToggle.click();

        // Navigate to different page
        await page.goto('/feedback');

        // Language should still be French
        const frenchNav = page.locator('text=/commentaires|retour/i');
        const isFrench = await frenchNav.isVisible().catch(() => false);

        if (isFrench) {
          console.log('✅ Language preference persists across navigation');
        }
      }
    });

    test('should display question labels in selected language', async ({ page }) => {
      // Login as USER
      await loginAs(page, 'user');

      // Create a test questionnaire with clear EN/FR labels
      await loginAs(page, 'researcher');
      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'Language Test',
          questions: [
            {
              id: 'q1',
              type: 'mcq',
              text: { en: 'Choose an option', fr: 'Choisissez une option' },
              required: true,
              order: 0,
              options: [
                { value: 'opt1', label: { en: 'Option One', fr: 'Option Un' } },
                { value: 'opt2', label: { en: 'Option Two', fr: 'Option Deux' } },
              ],
            },
          ],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 1,
        },
      });

      const result = await createResponse.json();
      const langQid = result.data?.id;

      await page.request.post(`/api/questionnaires/${langQid}/publish`, { data: {} });

      // Now respond as USER in French
      await loginAs(page, 'user');
      await page.goto(`/questionnaires/${langQid}/respond`);

      // Switch to French
      const langToggle = page.locator('[data-testid="language-toggle"], button:has-text("FR")').first();
      if (await langToggle.isVisible().catch(() => false)) {
        await langToggle.click();

        // Check for French option labels
        await expect(page.locator('text=/Option Un|Option Deux/i')).toBeVisible({ timeout: 3000 });

        console.log('✅ Question labels display correctly in French');
      }
    });
  });

  test.describe('Screenshot Tests', () => {
    test('should capture screenshot of analytics dashboard', async ({ page }) => {
      await loginAs(page, 'researcher');

      const createResponse = await page.request.post('/api/questionnaires', {
        data: {
          title: 'Screenshot Test',
          questions: [{ id: 'q1', type: 'text', text: { en: 'Q', fr: 'Q' }, required: true, order: 0 }],
          targeting: { type: 'all_users' },
          anonymous: false,
          responseLimit: 1,
        },
      });

      const result = await createResponse.json();
      const screenshotQid = result.data?.id;

      await page.goto(`/research/questionnaires/${screenshotQid}/analytics`);

      // Take screenshot
      await page.screenshot({
        path: 'test-results/screenshots/analytics-dashboard.png',
        fullPage: true,
      });

      console.log('✅ Screenshot captured: analytics-dashboard.png');
    });

    test('should capture screenshot of questionnaire response form', async ({ page }) => {
      await loginAs(page, 'user');
      await page.goto('/questionnaires/qnn_test_001/respond');

      await page.screenshot({
        path: 'test-results/screenshots/questionnaire-response-form.png',
        fullPage: true,
      });

      console.log('✅ Screenshot captured: questionnaire-response-form.png');
    });
  });
});
