import { Page } from '@playwright/test';

/**
 * E2E Test Authentication Helpers
 *
 * These helpers mock authentication for different user roles in E2E tests.
 * In production, you would use real test user credentials or session mocking.
 */

export interface TestUser {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'RESEARCHER' | 'PM' | 'ADMIN' | 'MODERATOR';
  employeeId: string;
  preferredLanguage: 'en' | 'fr';
}

export const TEST_USERS = {
  researcher: {
    id: 'usr_researcher_test_001',
    email: 'researcher@clubmed.test',
    displayName: 'Test Researcher',
    role: 'RESEARCHER' as const,
    employeeId: 'EMP-RES-001',
    preferredLanguage: 'en' as const,
  },
  user: {
    id: 'usr_user_test_001',
    email: 'user@clubmed.test',
    displayName: 'Test User',
    role: 'USER' as const,
    employeeId: 'EMP-USR-001',
    preferredLanguage: 'en' as const,
  },
  pm: {
    id: 'usr_pm_test_001',
    email: 'pm@clubmed.test',
    displayName: 'Test PM',
    role: 'PM' as const,
    employeeId: 'EMP-PM-001',
    preferredLanguage: 'en' as const,
  },
  admin: {
    id: 'usr_admin_test_001',
    email: 'admin@clubmed.test',
    displayName: 'Test Admin',
    role: 'ADMIN' as const,
    employeeId: 'EMP-ADM-001',
    preferredLanguage: 'en' as const,
  },
};

/**
 * Mock authentication by setting session storage
 *
 * Note: This is a simplified mock for E2E testing.
 * In a real environment, you would:
 * 1. Use a test database with seeded users
 * 2. Authenticate via the actual auth flow
 * 3. Or use API routes to set test sessions
 */
export async function mockAuth(page: Page, user: TestUser) {
  await page.goto('/');

  // Set session data in localStorage or sessionStorage
  // This depends on your NextAuth configuration
  await page.evaluate((userData) => {
    const session = {
      user: userData,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // Store session data
    localStorage.setItem('test-session', JSON.stringify(session));
    sessionStorage.setItem('test-user', JSON.stringify(userData));
  }, user);
}

/**
 * Clear authentication session
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('test-session');
    sessionStorage.removeItem('test-user');
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const session = localStorage.getItem('test-session');
    return !!session;
  });
}

/**
 * Login as a specific role
 */
export async function loginAs(page: Page, role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role];
  await mockAuth(page, user);
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options?: { timeout?: number }
) {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: options?.timeout || 10000 }
  );
}

/**
 * Take screenshot on failure
 */
export async function takeScreenshotOnFailure(
  page: Page,
  testInfo: { title: string; status?: string }
) {
  if (testInfo.status === 'failed') {
    const screenshotPath = `screenshots/${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }
}
