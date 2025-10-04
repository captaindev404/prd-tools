# Sidebar E2E Test Documentation

## Overview

The sidebar.spec.ts file contains comprehensive end-to-end tests for the sidebar responsive behavior and state persistence functionality. These tests cover all acceptance criteria for task PRD003-NAV-015.

## Test Coverage

### 1. Mobile View (<768px)
- **Drawer Trigger**: Verifies mobile drawer trigger button is visible
- **Open/Close**: Tests drawer opening on trigger click
- **Click Outside**: Tests drawer closing when clicking outside
- **Navigation**: Tests drawer closing when navigating to a new page
- **Content**: Verifies all navigation items are displayed in the drawer

### 2. Desktop View (>=768px)
- **Expanded State**: Verifies sidebar starts expanded by default
- **Collapse Action**: Tests sidebar collapsing on trigger click
- **Expand Action**: Tests sidebar expanding when clicked again
- **Labels**: Verifies navigation labels are visible when expanded
- **Icon Mode**: Verifies sidebar shows only icons when collapsed

### 3. State Persistence - Collapse State
- **Reload Persistence**: Verifies collapsed state persists after page reload
- **Expand Persistence**: Verifies expanded state persists after page reload
- **Navigation Persistence**: Verifies state persists across page navigation
- **Cookie Storage**: Tests that state is stored in cookies (sidebar_state)

### 4. State Persistence - Research Section
- **Expanded Persistence**: Verifies Research section expanded state persists
- **Collapsed Persistence**: Verifies Research section collapsed state persists
- **localStorage Storage**: Tests that state is stored in localStorage
- **Auto-Expand**: Verifies Research section auto-expands on research routes

### 5. Keyboard Shortcuts
- **Ctrl+B (Windows/Linux)**: Tests sidebar toggle with Ctrl+B
- **Cmd+B (macOS)**: Tests sidebar toggle with Cmd+B on Safari
- **Default Prevention**: Verifies browser default behavior is prevented

### 6. Responsive Breakpoint Transitions
- **Desktop to Mobile**: Tests layout switching from desktop to mobile on resize
- **Mobile to Desktop**: Tests layout switching from mobile to desktop on resize
- **Breakpoint Boundary**: Tests behavior at exactly 768px breakpoint

### 7. Cross-Browser Compatibility
- **Chromium**: Tests on Chrome browser
- **Firefox**: Tests on Firefox browser
- **Safari**: Tests on WebKit/Safari browser
- **Mobile Chrome**: Tests on Android Chrome (Pixel 5)
- **Mobile Safari**: Tests on iOS Safari (iPhone 12)

### 8. Accessibility
- **ARIA Attributes**: Verifies proper aria-label and aria-expanded attributes
- **Keyboard Navigation**: Tests Tab navigation through sidebar items
- **Focus Management**: Verifies proper focus states

## Running the Tests

### Prerequisites

1. **Install Playwright Browsers**:
   ```bash
   npx playwright install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Authentication Setup** (Important):
   - The tests require authenticated access to the dashboard
   - Either:
     - Set up proper test authentication credentials
     - Mock authentication state for tests
     - Or configure a test user in your CI/CD pipeline

### Run All Sidebar Tests

```bash
npx playwright test e2e/sidebar.spec.ts
```

### Run Specific Test Suite

```bash
# Mobile tests only
npx playwright test e2e/sidebar.spec.ts -g "Mobile View"

# Desktop tests only
npx playwright test e2e/sidebar.spec.ts -g "Desktop View"

# Persistence tests only
npx playwright test e2e/sidebar.spec.ts -g "State Persistence"

# Keyboard shortcut tests only
npx playwright test e2e/sidebar.spec.ts -g "Keyboard Shortcuts"
```

### Run on Specific Browser

```bash
# Chrome only
npx playwright test e2e/sidebar.spec.ts --project=chromium

# Firefox only
npx playwright test e2e/sidebar.spec.ts --project=firefox

# Safari only
npx playwright test e2e/sidebar.spec.ts --project=webkit

# Mobile Chrome
npx playwright test e2e/sidebar.spec.ts --project="Mobile Chrome"

# Mobile Safari
npx playwright test e2e/sidebar.spec.ts --project="Mobile Safari"
```

### Debug Mode

```bash
# Run in debug mode with Playwright Inspector
npx playwright test e2e/sidebar.spec.ts --debug

# Run specific test in debug mode
npx playwright test e2e/sidebar.spec.ts -g "should collapse sidebar" --debug
```

### Headed Mode (See Browser)

```bash
# Run with visible browser
npx playwright test e2e/sidebar.spec.ts --headed

# Run with slow motion
npx playwright test e2e/sidebar.spec.ts --headed --slowMo=500
```

## Test Structure

Each test follows this pattern:

1. **Setup**: Navigate to dashboard and wait for page ready
2. **Action**: Perform the test action (click, type, resize, etc.)
3. **Assertion**: Verify expected outcome
4. **Cleanup**: Tests are isolated with beforeEach hooks

## Acceptance Criteria Mapping

| Acceptance Criteria | Test(s) |
|---------------------|---------|
| Mobile (<768px): Drawer opens/closes | `should open mobile drawer when trigger is clicked` |
| Desktop (≥768px): Sidebar expands/collapses | `should collapse sidebar when trigger is clicked` |
| Collapse state persists on page reload | `should persist collapsed state across page reloads` |
| Research expanded state persists | `should persist Research section expanded state` |
| Ctrl+B keyboard shortcut works | `should toggle sidebar with Ctrl+B on Windows/Linux` |
| Test on Chrome, Firefox, Safari | All tests run on all browsers via projects |
| Test on iOS Safari, Android Chrome | Mobile projects configured in playwright.config.ts |

## Troubleshooting

### Tests Failing with Authentication Errors

If tests fail because they're redirected to sign-in:

1. **Option 1 - Mock Authentication**:
   ```typescript
   test.beforeEach(async ({ page, context }) => {
     // Set authentication cookie
     await context.addCookies([{
       name: 'authjs.session-token',
       value: 'test-token',
       domain: 'localhost',
       path: '/',
     }])
   })
   ```

2. **Option 2 - Use Test User**:
   - Create a dedicated test user in your database
   - Implement login helper function
   - Log in before each test suite

3. **Option 3 - Skip Auth in Test Environment**:
   - Add environment variable to bypass auth in tests
   - Configure middleware to skip auth when `process.env.TEST_MODE === 'true'`

### localStorage Not Accessible

If you get "Failed to read localStorage" errors:

- Ensure page is fully loaded before accessing localStorage
- Use try/catch blocks around localStorage access
- Our `clearStorage` helper already handles this

### Browsers Not Installed

If you see "Executable doesn't exist" errors:

```bash
npx playwright install
```

### Tests Timing Out

If tests timeout waiting for elements:

1. Increase timeout in test or globally in config
2. Check if the page is actually loading
3. Verify selectors are correct
4. Use `page.pause()` to debug

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
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run db:migrate
      - run: npm run build
      - run: npx playwright test e2e/sidebar.spec.ts
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Future Enhancements

Potential improvements for the test suite:

1. **Visual Regression Tests**: Add screenshot comparisons for collapsed/expanded states
2. **Performance Tests**: Measure sidebar animation performance
3. **Touch Gestures**: Add swipe gesture tests for mobile
4. **Theme Switching**: Test sidebar with different themes
5. **RTL Support**: Test right-to-left layout if needed

## Related Files

- **Test File**: `/e2e/sidebar.spec.ts`
- **Component**: `/src/components/ui/sidebar.tsx`
- **App Sidebar**: `/src/components/layout/app-sidebar.tsx`
- **Layout**: `/src/app/(authenticated)/layout.tsx`
- **Hook**: `/src/hooks/use-mobile.tsx`
- **Config**: `/playwright.config.ts`
