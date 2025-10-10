/**
 * Questionnaire Create Form - E2E Tests with Playwright
 *
 * These tests run in a real browser environment and test the complete
 * user workflow for creating questionnaires.
 *
 * Run with: npm run test:e2e -- questionnaire-create-form.spec.ts
 */

import { test, expect } from '@playwright/test';

// Mock API responses
const mockPanels = [
  {
    id: 'pan_01HX5J3K4M',
    name: 'Beta Testers',
    description: 'Early adopters testing new features',
    _count: { memberships: 25 },
  },
  {
    id: 'pan_01HX5J3K5N',
    name: 'Power Users',
    description: 'Frequent users with advanced needs',
    _count: { memberships: 50 },
  },
];

test.describe('QuestionnaireCreateForm E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'usr_01HX5J3K4M',
            email: 'test@clubmed.com',
            role: 'RESEARCHER',
          },
        }),
      });
    });

    // Mock panels API
    await page.route('**/api/research/panels', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ panels: mockPanels }),
      });
    });

    // Mock audience stats API
    await page.route('**/api/questionnaires/audience-stats', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      let estimatedReach = 1250; // Default for all_users

      if (postData.targetingType === 'specific_panels') {
        if (postData.panelIds?.includes('pan_01HX5J3K4M')) {
          estimatedReach = 25;
        }
        if (postData.panelIds?.length === 2) {
          estimatedReach = 70; // Combined unique users
        }
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ estimatedReach }),
      });
    });

    // Navigate to create page
    await page.goto('/research/questionnaires/new');
  });

  test('should complete full form filling workflow', async ({ page }) => {
    // Fill title
    await page.getByLabel(/title/i).fill('Q4 2024 Guest Experience Survey');

    // Verify character count
    await expect(page.locator('text=/of 200 characters/')).toBeVisible();

    // Navigate to Questions tab
    await page.getByRole('tab', { name: /questions/i }).click();

    // Add a Likert question
    await page.getByRole('button', { name: /add question/i }).click();

    // Verify question was added
    await expect(page.getByText(/question 1 - likert/i)).toBeVisible();

    // Fill question text
    await page.locator('textarea[placeholder*="Enter your question"]').first().fill(
      'How satisfied are you with our service?'
    );

    // Navigate to Targeting tab
    await page.getByRole('tab', { name: /targeting & settings/i }).click();

    // Verify targeting is shown
    await expect(page.getByText(/target audience/i)).toBeVisible();

    // Verify audience size is calculated
    await expect(page.getByText(/1,250/)).toBeVisible();
  });

  test('should save questionnaire as draft successfully', async ({ page }) => {
    // Mock create API
    await page.route('**/api/questionnaires', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'qnn_01HX5J3K4M',
              title: 'Test Survey',
              status: 'draft',
            },
          }),
        });
      }
    });

    // Fill minimum required fields
    await page.getByLabel(/title/i).fill('Test Survey');

    // Add a question
    await page.getByRole('tab', { name: /questions/i }).click();
    await page.getByRole('button', { name: /add question/i }).click();
    await page.locator('textarea[placeholder*="Enter your question"]').first().fill(
      'Test question?'
    );

    // Click Save as Draft
    await page.getByRole('button', { name: /save as draft/i }).click();

    // Verify loading state
    await expect(page.getByText(/saving draft/i)).toBeVisible();

    // Wait for navigation
    await page.waitForURL('**/research/questionnaires/qnn_01HX5J3K4M');
  });

  test('should publish questionnaire successfully', async ({ page }) => {
    // Mock create API
    await page.route('**/api/questionnaires', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'qnn_01HX5J3K4M',
              title: 'Published Survey',
              status: 'draft',
            },
          }),
        });
      }
    });

    // Mock publish API
    await page.route('**/api/questionnaires/*/publish', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'qnn_01HX5J3K4M',
            status: 'published',
          },
        }),
      });
    });

    // Fill form
    await page.getByLabel(/title/i).fill('Published Survey');

    // Add question
    await page.getByRole('tab', { name: /questions/i }).click();
    await page.getByRole('button', { name: /add question/i }).click();
    await page.locator('textarea[placeholder*="Enter your question"]').first().fill(
      'Test question?'
    );

    // Click Save & Publish
    await page.getByRole('button', { name: /save & publish/i }).click();

    // Verify publish dialog opens
    await expect(page.getByText(/ready to publish/i)).toBeVisible();

    // Confirm publish
    await page.getByRole('button', { name: /confirm & publish/i }).click();

    // Verify loading state
    await expect(page.getByText(/publishing/i)).toBeVisible();

    // Wait for navigation
    await page.waitForURL('**/research/questionnaires/qnn_01HX5J3K4M');
  });

  test('should show validation errors', async ({ page }) => {
    // Try to save without title
    await page.getByRole('button', { name: /save as draft/i }).click();

    // Verify error message
    await expect(page.getByText(/title is required/i)).toBeVisible();

    // Fill short title
    await page.getByLabel(/title/i).fill('ab');
    await page.getByRole('button', { name: /save as draft/i }).click();

    // Verify error message
    await expect(page.getByText(/title must be at least 3 characters/i)).toBeVisible();

    // Fix title but no questions
    await page.getByLabel(/title/i).fill('Test Survey');
    await page.getByRole('button', { name: /save as draft/i }).click();

    // Verify error message
    await expect(page.getByText(/at least one question is required/i)).toBeVisible();
  });

  test('should configure MCQ options', async ({ page }) => {
    // Navigate to Questions tab
    await page.getByRole('tab', { name: /questions/i }).click();

    // Select MCQ type
    await page.locator('[aria-label="Select question type"]').click();
    await page.getByRole('option', { name: /multiple choice \(single\)/i }).click();

    // Add question
    await page.getByRole('button', { name: /add question/i }).click();

    // Fill question text
    await page.locator('textarea[placeholder*="Enter your question"]').first().fill(
      'What is your preferred vacation type?'
    );

    // Fill MCQ options
    await page.locator('textarea[placeholder*="Option 1"]').fill(
      'Beach Resort\nSki Resort\nCity Break\nAdventure Travel'
    );

    // Verify options are entered
    const optionsTextarea = page.locator('textarea[placeholder*="Option 1"]');
    await expect(optionsTextarea).toHaveValue(/Beach Resort/);
  });

  test('should select panels for targeting', async ({ page }) => {
    // Navigate to Targeting tab
    await page.getByRole('tab', { name: /targeting & settings/i }).click();

    // Change targeting to specific panels
    await page.locator('[aria-label="Select target audience"]').click();
    await page.getByRole('option', { name: /specific panels/i }).click();

    // Select Beta Testers panel
    await page.getByLabel(/beta testers/i).check();

    // Verify audience size updates
    await expect(page.getByText(/25/)).toBeVisible();

    // Select Power Users panel
    await page.getByLabel(/power users/i).check();

    // Verify combined audience size
    await expect(page.getByText(/70/)).toBeVisible();
  });

  test('should configure response settings', async ({ page }) => {
    // Navigate to Targeting tab
    await page.getByRole('tab', { name: /targeting & settings/i }).click();

    // Enable anonymous responses
    await page.getByLabel(/allow anonymous responses/i).check();

    // Set response limit
    await page.getByLabel(/response limit per user/i).click();
    await page.getByRole('option', { name: /once only/i }).click();

    // Set max responses
    await page.getByLabel(/maximum total responses/i).fill('100');

    // Verify settings are applied
    await expect(page.getByLabel(/allow anonymous responses/i)).toBeChecked();
    await expect(page.getByLabel(/maximum total responses/i)).toHaveValue('100');
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    // Mock create API
    await page.route('**/api/questionnaires', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'qnn_01HX5J3K4M',
              title: 'Test Survey',
              status: 'draft',
            },
          }),
        });
      }
    });

    // Fill form
    await page.getByLabel(/title/i).fill('Test Survey');

    // Add question
    await page.getByRole('tab', { name: /questions/i }).click();
    await page.getByRole('button', { name: /add question/i }).click();
    await page.locator('textarea[placeholder*="Enter your question"]').first().fill(
      'Test question?'
    );

    // Press Ctrl+Enter to save (or Cmd+Enter on Mac)
    await page.keyboard.press('Control+Enter');

    // Verify loading state
    await expect(page.getByText(/saving draft/i)).toBeVisible();

    // Wait for navigation
    await page.waitForURL('**/research/questionnaires/qnn_01HX5J3K4M');
  });

  test('should preview questionnaire', async ({ page }) => {
    // Fill title
    await page.getByLabel(/title/i).fill('Preview Test');

    // Add question
    await page.getByRole('tab', { name: /questions/i }).click();
    await page.getByRole('button', { name: /add question/i }).click();
    await page.locator('textarea[placeholder*="Enter your question"]').first().fill(
      'Preview question?'
    );

    // Click Preview button
    await page.getByRole('button', { name: /preview/i }).click();

    // Verify preview modal opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.getByText(/Preview Test/i)).toBeVisible();

    // Close preview
    await page.getByRole('button', { name: /close/i }).first().click();

    // Verify modal closes
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/questionnaires', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Internal server error',
          }),
        });
      }
    });

    // Fill form
    await page.getByLabel(/title/i).fill('Error Test');

    // Add question
    await page.getByRole('tab', { name: /questions/i }).click();
    await page.getByRole('button', { name: /add question/i }).click();
    await page.locator('textarea[placeholder*="Enter your question"]').first().fill(
      'Test question?'
    );

    // Try to save
    await page.getByRole('button', { name: /save as draft/i }).click();

    // Verify error message is shown
    await expect(page.getByText(/internal server error/i)).toBeVisible();

    // Verify form is still editable
    await expect(page.getByRole('button', { name: /save as draft/i })).not.toBeDisabled();
  });
});
