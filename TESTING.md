# Testing Guide for Odyssey Feedback Platform

This document provides comprehensive instructions for running tests in the Odyssey Feedback platform.

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)

## Overview

The Odyssey Feedback platform uses a multi-layered testing approach:

1. **Unit Tests** - Test individual functions and utilities in isolation
2. **Integration Tests** - Test API routes and their interactions with mocked dependencies
3. **Component Tests** - Test React components with React Testing Library
4. **E2E Tests** - Test critical user flows with Playwright

## Test Infrastructure

### Dependencies

- **Jest** - JavaScript testing framework
- **React Testing Library** - Component testing utilities
- **Playwright** - End-to-end testing framework
- **@testing-library/jest-dom** - Custom Jest matchers
- **@testing-library/user-event** - User interaction simulation

### Configuration Files

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup and global mocks
- `playwright.config.ts` - Playwright E2E test configuration

## Running Tests

### All Tests

Run all unit and integration tests:

```bash
npm test
```

### Watch Mode

Run tests in watch mode (re-runs on file changes):

```bash
npm run test:watch
```

### Coverage Report

Generate and view test coverage:

```bash
npm run test:coverage
```

Coverage thresholds are set to 70% for:
- Statements
- Branches
- Functions
- Lines

### Unit Tests Only

Run only unit tests (excluding E2E tests):

```bash
npm run test:unit
```

### Specific Test File

Run a specific test file:

```bash
npm test -- __tests__/lib/vote-weight.test.ts
```

### E2E Tests

Run end-to-end tests with Playwright:

```bash
npm run test:e2e
```

Run E2E tests in headed mode (see browser):

```bash
npx playwright test --headed
```

Run specific E2E test file:

```bash
npx playwright test e2e/feedback.spec.ts
```

Run E2E tests in debug mode:

```bash
npx playwright test --debug
```

View E2E test report:

```bash
npx playwright show-report
```

## Test Coverage

### Current Test Files

#### Unit Tests

1. **`__tests__/lib/vote-weight.test.ts`**
   - Tests vote weight calculation formulas
   - Role-based weights (USER=1.0, PM=2.0, PO=3.0, etc.)
   - Panel membership boost (+0.3)
   - Time decay (180-day half-life)
   - Edge cases and error handling

2. **`__tests__/lib/pii-redact.test.ts`**
   - Tests PII detection and redaction
   - Phone number patterns (multiple formats)
   - Email address patterns
   - Room number patterns
   - Reservation ID patterns
   - Masking strategy (keep last 4 characters)

#### Integration Tests

3. **`__tests__/api/feedback.test.ts`**
   - POST /api/feedback - Create feedback
   - GET /api/feedback - List feedback with filters
   - GET /api/feedback/:id - Get feedback details
   - PATCH /api/feedback/:id - Edit feedback
   - Validation, rate limiting, PII redaction
   - Moderation status handling

4. **`__tests__/api/vote.test.ts`**
   - POST /api/feedback/:id/vote - Cast vote
   - DELETE /api/feedback/:id/vote - Remove vote
   - GET /api/feedback/:id/vote - Check vote status
   - Weight calculation integration
   - Unique vote constraint
   - Vote aggregation

#### Component Tests

5. **`src/components/__tests__/button.test.tsx`**
   - Button component rendering
   - Variant and size props
   - Click event handling
   - Disabled state

#### E2E Tests

6. **`e2e/auth.spec.ts`**
   - Sign-in flow
   - Protected route redirection
   - Sign-out flow

7. **`e2e/feedback.spec.ts`**
   - Submit new feedback
   - Edit feedback within 15-minute window
   - View feedback details
   - Filter and search feedback

8. **`e2e/voting.spec.ts`**
   - Vote on feedback
   - Remove vote
   - Vote count display
   - Authentication requirement

9. **`e2e/roadmap.spec.ts`**
   - View roadmap
   - Filter by stage (now, next, later)
   - View roadmap item details
   - Linked feedback

10. **`e2e/questionnaire.spec.ts`**
    - View available questionnaires
    - Complete questionnaire
    - Submit responses
    - Question type rendering

## Writing Tests

### Unit Test Example

```typescript
import { myFunction } from '@/lib/my-module'

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })

  it('should handle edge case', () => {
    expect(() => myFunction(null)).toThrow()
  })
})
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle click', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()

    render(<MyComponent onClick={onClick} />)
    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalled()
  })
})
```

### Integration Test Example

```typescript
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/my-route/route'

jest.mock('@/lib/prisma')
jest.mock('@/lib/auth-helpers')

describe('GET /api/my-route', () => {
  it('should return data', async () => {
    const request = new NextRequest('http://localhost/api/my-route')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('items')
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should complete user flow', async ({ page }) => {
  await page.goto('/')

  await page.click('text=Submit Feedback')
  await page.fill('input[name="title"]', 'Test Feedback')
  await page.fill('textarea[name="body"]', 'Test description')
  await page.click('button[type="submit"]')

  await expect(page.locator('text=Success')).toBeVisible()
})
```

## Mocking

### Prisma Client

The Prisma client is mocked globally in `jest.setup.js` for integration tests:

```typescript
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    feedback: { create: jest.fn() },
    // ... other models
  },
}))
```

### NextAuth

NextAuth is mocked globally in `jest.setup.js`:

```typescript
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}))
```

Use the global utility to mock sessions in tests:

```typescript
global.testUtils.mockSession({
  user: { id: 'usr_test', email: 'test@example.com' },
})
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
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Database

For integration and E2E tests that require a database:

1. Create a test database:
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/odyssey_test" npx prisma migrate deploy
   ```

2. Seed test data:
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/odyssey_test" npm run db:seed
   ```

3. Run tests with test database:
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/odyssey_test" npm test
   ```

## Debugging Tests

### Jest Debug

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then attach your debugger (VS Code, Chrome DevTools, etc.)

### Playwright Debug

```bash
npx playwright test --debug
```

This opens the Playwright Inspector for step-by-step debugging.

## Best Practices

1. **Isolate Tests** - Each test should be independent and not rely on others
2. **Use Descriptive Names** - Test names should clearly describe what they test
3. **Mock External Dependencies** - Use mocks for databases, APIs, and external services
4. **Test Edge Cases** - Include tests for error conditions and boundary cases
5. **Keep Tests Fast** - Unit tests should run in milliseconds, integration tests in seconds
6. **Update Tests with Code** - Keep tests in sync with implementation changes
7. **Aim for Coverage** - Strive for >70% code coverage but focus on critical paths

## Troubleshooting

### Jest tests not found

If Jest can't find your tests, check:
- Test files are in `__tests__` directories or have `.test.ts` or `.spec.ts` extensions
- `jest.config.js` `testMatch` pattern includes your test files

### Playwright browser not installed

Install Playwright browsers:
```bash
npx playwright install
```

### Module resolution errors

Ensure `tsconfig.json` paths match `jest.config.js` moduleNameMapper.

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://testingjavascript.com/)

---

For questions or issues, please contact the development team or open an issue in the repository.
