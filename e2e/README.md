# E2E Tests - Gentil Feedback Platform

This directory contains end-to-end (E2E) tests for the Gentil Feedback platform using Playwright.

## Overview

The E2E test suite covers critical user journeys including:
- **Authentication**: Sign-in/sign-out flows
- **Feedback Management**: Submit, edit, vote on feedback
- **Voting System**: Cast votes, view weighted voting
- **Roadmap**: View and interact with product roadmap
- **Questionnaires**: Complete questionnaire flow from creation to analytics (TASK-202)

## Test Files

### Core E2E Tests
- `auth.spec.ts` - Authentication flows
- `feedback.spec.ts` - Feedback submission and management
- `voting.spec.ts` - Voting functionality
- `roadmap.spec.ts` - Roadmap interactions
- `questionnaire.spec.ts` - Basic questionnaire tests
- `panels.spec.ts` - Research panel management (PRD003-PANEL-UI-023)

### Comprehensive Test Suites
- `questionnaire-flow.spec.ts` - **Complete questionnaire flow (TASK-202)**
  - RESEARCHER creates questionnaire with QuestionBuilder
  - Publish validation (missing translations)
  - USER responds to questionnaire
  - RESEARCHER views analytics dashboard
  - CSV export with PII (RESEARCHER only)
  - Language toggle EN/FR
  - Screenshot tests

- `panels.spec.ts` - **Complete panel flow (PRD003-PANEL-UI-023)**
  - RESEARCHER creates panel with eligibility rules
  - Preview shows matching users
  - Invite members with eligibility check
  - Edit panel configuration
  - Archive panel (soft delete)
  - Permission checks (USER cannot create panel)
  - All tests with screenshots on failure

### Helpers
- `helpers/auth.ts` - Authentication utilities and test user fixtures

## Prerequisites

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Setup Test Database
For E2E tests, you should use a separate test database:

```bash
# Copy .env to .env.test
cp .env .env.test

# Update DATABASE_URL in .env.test to point to test database
# Example: DATABASE_URL="file:./test.db"

# Run migrations on test database
DATABASE_URL="file:./test.db" npx prisma migrate deploy

# Seed test database
DATABASE_URL="file:./test.db" npm run db:seed
```

### 4. Environment Setup
Create `.env.test` with test-specific configuration:

```env
# Database
DATABASE_URL="file:./test.db"

# Auth (use test providers or mock)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key-for-e2e-tests"

# Azure AD (test tenant)
AZURE_AD_CLIENT_ID="test-client-id"
AZURE_AD_CLIENT_SECRET="test-client-secret"
AZURE_AD_TENANT_ID="test-tenant-id"

# Test mode flag
E2E_TEST_MODE="true"
```

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npx playwright test questionnaire-flow.spec.ts
```

### Run Tests in Specific Browser
```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Webkit only
npx playwright test --project=webkit
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run Tests with UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run Specific Test by Name
```bash
npx playwright test -g "should create questionnaire"
```

### Debug Mode
```bash
# Start in debug mode
npx playwright test --debug

# Debug specific test
npx playwright test questionnaire-flow.spec.ts --debug
```

## Test Configuration

Configuration is in `playwright.config.ts`:
- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_TEST_BASE_URL`)
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure only
- **Video**: Retained on failure
- **Trace**: On first retry

### Browsers Tested
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Writing New Tests

### Basic Structure
```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'researcher');
    await page.goto('/feature-page');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.locator('button:has-text("Click Me")');

    // Act
    await button.click();

    // Assert
    await expect(page.locator('text=/success/i')).toBeVisible();
  });
});
```

### Using Test Helpers

#### Authentication
```typescript
import { loginAs, TEST_USERS, clearAuth } from './helpers/auth';

// Login as different roles
await loginAs(page, 'researcher'); // RESEARCHER role
await loginAs(page, 'user');       // USER role
await loginAs(page, 'admin');      // ADMIN role

// Clear auth
await clearAuth(page);
```

#### Wait for API Responses
```typescript
import { waitForApiResponse } from './helpers/auth';

await waitForApiResponse(page, '/api/questionnaires', { timeout: 10000 });
```

### Screenshots on Failure
Screenshots are automatically captured on test failure and saved to:
```
test-results/screenshots/test-name-timestamp.png
```

You can also manually capture screenshots:
```typescript
await page.screenshot({
  path: 'test-results/screenshots/my-screenshot.png',
  fullPage: true
});
```

## Test Data Management

### Test Users
Pre-configured test users are available in `helpers/auth.ts`:

```typescript
TEST_USERS.researcher // RESEARCHER role
TEST_USERS.user       // USER role
TEST_USERS.pm         // PM role
TEST_USERS.admin      // ADMIN role
```

### Creating Test Data via API
```typescript
// Create test questionnaire
const response = await page.request.post('/api/questionnaires', {
  data: {
    title: 'Test Questionnaire',
    questions: [...],
    // ...
  },
});

const result = await response.json();
const questionnaireId = result.data?.id;
```

## Debugging Failed Tests

### 1. View HTML Report
After tests run, open the HTML report:
```bash
npx playwright show-report
```

### 2. View Screenshots
Check `test-results/screenshots/` for failure screenshots.

### 3. View Traces
Traces are captured on first retry. View with:
```bash
npx playwright show-trace test-results/trace.zip
```

### 4. Run in Headed Mode
See what's happening in the browser:
```bash
npx playwright test --headed --project=chromium
```

### 5. Use Playwright Inspector
```bash
npx playwright test --debug
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Setup test database
        run: |
          DATABASE_URL="file:./test.db" npx prisma migrate deploy
          DATABASE_URL="file:./test.db" npm run db:seed

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to set up clean state
- Don't rely on order of test execution

### 2. Locators
Prefer stable locators:
```typescript
// Good: Use data-testid
page.locator('[data-testid="submit-button"]')

// Good: Use accessible roles
page.getByRole('button', { name: 'Submit' })

// Avoid: Fragile CSS selectors
page.locator('div.container > button.blue')
```

### 3. Assertions
Always use Playwright's auto-waiting assertions:
```typescript
// Good
await expect(page.locator('text=Success')).toBeVisible();

// Bad (doesn't wait)
const element = await page.locator('text=Success');
expect(element).toBeTruthy();
```

### 4. Cleanup
Clean up test data in `afterEach` or `afterAll`:
```typescript
test.afterEach(async ({ page }) => {
  // Delete test data
  await clearAuth(page);
});
```

### 5. Performance
- Run tests in parallel (default)
- Use `test.describe.serial()` only when necessary
- Minimize navigation between pages

## Troubleshooting

### Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Check if server is running (`npm run dev`)
- Verify network/API responses

### Authentication Issues
- Check test user credentials in `helpers/auth.ts`
- Verify NextAuth configuration
- Check session/cookie handling

### Flaky Tests
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use `test.retry()` for known flaky tests
- Check for race conditions

### Browser Not Found
```bash
npx playwright install chromium
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)

## Task-202 Acceptance Criteria

All acceptance criteria for TASK-202 are covered in `questionnaire-flow.spec.ts`:

- ✅ Test: RESEARCHER creates questionnaire with QuestionBuilder
- ✅ Test: Publish validation (missing translations fails)
- ✅ Test: USER responds to questionnaire
- ✅ Test: RESEARCHER views analytics dashboard
- ✅ Test: Export CSV with PII (RESEARCHER only)
- ✅ Test: Language toggle switches EN/FR
- ✅ All tests passing (after proper setup)
- ✅ Screenshots on failure (automatic)

## Support

For questions or issues with E2E tests, refer to:
- Project documentation in `/docs`
- Playwright Discord: https://aka.ms/playwright/discord
