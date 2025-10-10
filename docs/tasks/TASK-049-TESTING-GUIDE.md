# QuestionnaireCreateForm - Testing Guide

## Overview

This guide explains how to run and understand the integration tests for the QuestionnaireCreateForm component.

## Test Files

### 1. Jest Integration Tests
**Location**: `src/components/questionnaires/__tests__/questionnaire-create-form.integration.test.tsx`
**Purpose**: Unit and integration tests for form logic, validation, and API integration
**Tests**: 33 test cases

### 2. Playwright E2E Tests
**Location**: `e2e/questionnaire-create-form.spec.ts`
**Purpose**: End-to-end tests in real browser environment
**Tests**: 10 complete user workflows

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run specific test file
npm test -- questionnaire-create-form.integration.test.tsx

# Run E2E tests
npm run test:e2e
```

### Jest Integration Tests

#### Run all tests
```bash
npm test
```

#### Run specific test file
```bash
npm test -- questionnaire-create-form.integration.test.tsx
```

#### Run with coverage
```bash
npm test -- --coverage
```

#### Run in watch mode
```bash
npm test:watch
```

#### Run a specific test
```bash
npm test -- -t "should save questionnaire as draft successfully"
```

### Playwright E2E Tests

#### Run all E2E tests
```bash
npm run test:e2e
```

#### Run specific file
```bash
npm run test:e2e -- questionnaire-create-form.spec.ts
```

#### Run in headed mode (see browser)
```bash
npm run test:e2e -- --headed
```

#### Run with UI
```bash
npm run test:e2e -- --ui
```

#### Run on specific browser
```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

#### Debug tests
```bash
npm run test:e2e -- --debug
```

## Test Structure

### Jest Tests Organization

```
QuestionnaireCreateForm - Integration Tests/
├── Complete Form Filling Workflow/
│   ├── should allow filling all form fields and adding questions
│   ├── should support adding multiple question types
│   ├── should allow configuring MCQ options
│   └── should allow selecting specific panels for targeting
├── Draft Save Functionality/
│   ├── should save questionnaire as draft successfully
│   ├── should handle draft save with all targeting options
│   └── should handle draft save with response settings
├── Publish Functionality/
│   ├── should publish questionnaire successfully
│   ├── should show validation checklist in publish dialog
│   └── should handle publish failure gracefully
├── Validation Error Handling/
│   ├── should show error when submitting with empty title
│   ├── should show error when title is too short
│   ├── should show error when title is too long
│   ├── should show error when no questions are added
│   ├── should show error when question has no text
│   ├── should show error when MCQ has less than 2 options
│   ├── should show error when specific panels selected but no panels chosen
│   ├── should show error when end date is before start date
│   └── should focus error alert for accessibility
├── API Integration and Error Handling/
│   ├── should handle network errors gracefully
│   ├── should handle API validation errors
│   └── should handle 500 server errors
├── Audience Size Calculation/
│   ├── should fetch and display audience size for all users
│   ├── should update audience size when panels are selected
│   ├── should show loading state while calculating audience size
│   └── should handle audience calculation errors
├── Keyboard Shortcuts and Accessibility/
│   ├── should save draft on Ctrl+Enter
│   ├── should have proper ARIA labels and roles
│   └── should announce loading states to screen readers
├── Cancel and Navigation/
│   ├── should go back when cancel button is clicked
│   └── should disable cancel button while submitting
└── Preview Functionality/
    ├── should open preview modal when preview button is clicked
    └── should disable preview button when no questions
```

### Playwright Tests Organization

```
QuestionnaireCreateForm E2E Tests/
├── should complete full form filling workflow
├── should save questionnaire as draft successfully
├── should publish questionnaire successfully
├── should show validation errors
├── should configure MCQ options
├── should select panels for targeting
├── should configure response settings
├── should support keyboard shortcuts
├── should preview questionnaire
└── should handle API errors gracefully
```

## Understanding Test Results

### Jest Output

```bash
PASS  src/components/questionnaires/__tests__/questionnaire-create-form.integration.test.tsx
  QuestionnaireCreateForm - Integration Tests
    Complete Form Filling Workflow
      ✓ should allow filling all form fields and adding questions (125ms)
      ✓ should support adding multiple question types (98ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Time:        5.549 s
```

### Playwright Output

```bash
Running 10 tests using 1 worker

  ✓ questionnaire-create-form.spec.ts:25:3 › should complete full form filling workflow (2.5s)
  ✓ questionnaire-create-form.spec.ts:59:3 › should save questionnaire as draft successfully (1.8s)
  ...

  10 passed (24.3s)
```

## Common Issues and Solutions

### Issue 1: Radix UI Component Errors in Jest

**Error**:
```
TypeError: target.hasPointerCapture is not a function
TypeError: candidate?.scrollIntoView is not a function
ReferenceError: ResizeObserver is not defined
```

**Solution**: These errors occur because Radix UI components use browser APIs not available in JSDOM. The polyfills in `jest.setup.js` help, but some tests may still fail. **Use Playwright tests** for complex UI interactions.

### Issue 2: Tests Timing Out

**Error**:
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solution**: Increase timeout or check if async operations are properly awaited:
```typescript
// Increase timeout for specific test
test('slow test', async () => {
  // ...
}, 10000); // 10 second timeout

// Or use waitFor with longer timeout
await waitFor(() => {
  expect(mockFetch).toHaveBeenCalled();
}, { timeout: 5000 });
```

### Issue 3: Mock Not Being Called

**Error**:
```
Expected mock function to have been called, but it was not called.
```

**Solution**: Ensure mocks are set up before the component renders:
```typescript
// Set up mock BEFORE render
global.fetch = jest.fn().mockResolvedValue({ /* ... */ });

// Then render
render(<QuestionnaireCreateForm availablePanels={mockPanels} />);
```

### Issue 4: Playwright Can't Find Elements

**Error**:
```
Error: locator.click: Timeout 30000ms exceeded.
```

**Solution**: Use more specific locators or wait for elements:
```typescript
// Wait for element to be visible
await page.waitForSelector('button[name="Save"]');

// Use more specific locator
await page.getByRole('button', { name: /save as draft/i }).click();
```

## Debugging Tests

### Debugging Jest Tests

#### Use VSCode Debugger
1. Set breakpoint in test file
2. Click "Debug Test" above test name
3. Step through code

#### Add console.log
```typescript
test('my test', async () => {
  console.log('Current state:', screen.debug());
  // ...
});
```

#### Use screen.debug()
```typescript
test('my test', async () => {
  // Print current DOM
  screen.debug();

  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

### Debugging Playwright Tests

#### Run in headed mode
```bash
npm run test:e2e -- --headed
```

#### Use debug mode
```bash
npm run test:e2e -- --debug
```

#### Add page.pause()
```typescript
test('my test', async ({ page }) => {
  // Test pauses here, browser stays open
  await page.pause();
});
```

#### Take screenshots
```typescript
test('my test', async ({ page }) => {
  await page.screenshot({ path: 'screenshot.png' });
});
```

## Best Practices

### Writing Tests

1. **Use User-Centric Queries**
   ```typescript
   // Good
   screen.getByRole('button', { name: /save/i })
   screen.getByLabelText(/title/i)

   // Bad
   container.querySelector('.save-button')
   screen.getByTestId('save-btn')
   ```

2. **Test User Behavior, Not Implementation**
   ```typescript
   // Good - tests what user sees
   await user.click(screen.getByRole('button', { name: /save/i }));
   expect(screen.getByText(/saved successfully/i)).toBeVisible();

   // Bad - tests implementation details
   expect(component.state.isSaving).toBe(true);
   ```

3. **Proper Async Handling**
   ```typescript
   // Good
   await waitFor(() => {
     expect(mockFetch).toHaveBeenCalled();
   });

   // Bad - can cause flaky tests
   expect(mockFetch).toHaveBeenCalled();
   ```

4. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.restoreAllMocks();
     cleanup();
   });
   ```

### Maintaining Tests

1. **Keep Tests Independent**: Each test should be able to run alone
2. **Use Descriptive Names**: Name tests clearly: "should X when Y"
3. **Avoid Test Interdependence**: Don't rely on test execution order
4. **Mock External Dependencies**: Always mock API calls, router, etc.
5. **Test Accessibility**: Include ARIA labels and screen reader tests

## Coverage Reports

### Generate Coverage Report

```bash
npm test -- --coverage
```

### View Coverage in Browser

```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Current thresholds (in `jest.config.js`):
```javascript
coverageThreshold: {
  global: {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70,
  },
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Jest tests
        run: npm test -- --coverage

      - name: Run Playwright tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

For questions or issues with tests:
1. Check this guide for common issues
2. Review test execution reports in `docs/tasks/`
3. Check Jest/Playwright documentation
4. Ask team for help with specific scenarios
