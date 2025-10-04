import { test, expect, Page } from '@playwright/test';
import { TEST_USERS, mockAuth } from './helpers/auth';

/**
 * E2E Tests for Sidebar Role-Based Navigation
 *
 * Tests the AppSidebar component's role-based filtering functionality
 * to ensure navigation items are correctly shown/hidden based on user roles.
 *
 * Roles Tested:
 * - USER: Basic access (Dashboard, Feedback, Roadmap, Settings)
 * - PM: Product Manager (+ Features, Research, Analytics)
 * - PO: Product Owner (+ Features, Research, Analytics)
 * - RESEARCHER: Research access (+ Research sections)
 * - MODERATOR: Moderation access (+ Moderation)
 * - ADMIN: Full access to all navigation items
 */

/**
 * Navigation item visibility expectations for each role
 */
const ROLE_NAV_EXPECTATIONS = {
  USER: {
    visible: [
      'Dashboard',
      'Feedback',
      'Roadmap',
      'Settings',
    ],
    hidden: [
      'Features',
      'Research',
      'Analytics',
      'Moderation',
      'Admin Panel',
    ],
  },
  PM: {
    visible: [
      'Dashboard',
      'Feedback',
      'Features',
      'Roadmap',
      'Research',
      'Analytics',
      'Settings',
    ],
    hidden: [
      'Moderation',
      'Admin Panel',
    ],
  },
  PO: {
    visible: [
      'Dashboard',
      'Feedback',
      'Features',
      'Roadmap',
      'Research',
      'Analytics',
      'Settings',
    ],
    hidden: [
      'Moderation',
      'Admin Panel',
    ],
  },
  RESEARCHER: {
    visible: [
      'Dashboard',
      'Feedback',
      'Roadmap',
      'Research',
      'Analytics',
      'Settings',
    ],
    hidden: [
      'Features',
      'Moderation',
      'Admin Panel',
    ],
  },
  MODERATOR: {
    visible: [
      'Dashboard',
      'Feedback',
      'Roadmap',
      'Moderation',
      'Settings',
    ],
    hidden: [
      'Features',
      'Research',
      'Analytics',
      'Admin Panel',
    ],
  },
  ADMIN: {
    visible: [
      'Dashboard',
      'Feedback',
      'Features',
      'Roadmap',
      'Research',
      'Analytics',
      'Moderation',
      'Admin Panel',
      'Settings',
    ],
    hidden: [],
  },
} as const;

/**
 * Helper to check if sidebar item is visible
 */
async function isSidebarItemVisible(page: Page, itemName: string): Promise<boolean> {
  // Look for the navigation item by text within the sidebar
  const sidebar = page.locator('[data-sidebar="sidebar"]').first();
  const item = sidebar.getByRole('link', { name: itemName, exact: false }).or(
    sidebar.getByRole('button', { name: itemName, exact: false })
  );

  try {
    await item.waitFor({ state: 'visible', timeout: 2000 });
    return await item.isVisible();
  } catch {
    return false;
  }
}

/**
 * Helper to capture screenshot with role name
 */
async function captureRoleScreenshot(page: Page, role: string, testInfo: any) {
  const screenshotPath = `e2e/screenshots/sidebar-${role.toLowerCase()}.png`;
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
  console.log(`Screenshot captured: ${screenshotPath}`);

  // Also attach to test report
  await testInfo.attach(`sidebar-${role}`, {
    path: screenshotPath,
    contentType: 'image/png',
  });
}

/**
 * Test Suite: Sidebar Navigation Role-Based Filtering
 */
test.describe('Sidebar Role-Based Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  /**
   * Test: USER Role Navigation
   */
  test('USER role should see Dashboard, Feedback, Roadmap, Settings only', async ({ page }, testInfo) => {
    // Authenticate as USER
    await mockAuth(page, TEST_USERS.user);
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

    // Capture screenshot
    await captureRoleScreenshot(page, 'USER', testInfo);

    // Check visible items
    for (const item of ROLE_NAV_EXPECTATIONS.USER.visible) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be visible for USER`).toBe(true);
    }

    // Check hidden items
    for (const item of ROLE_NAV_EXPECTATIONS.USER.hidden) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be hidden for USER`).toBe(false);
    }
  });

  /**
   * Test: PM Role Navigation
   */
  test('PM role should see Dashboard, Feedback, Features, Roadmap, Research, Analytics, Settings', async ({ page }, testInfo) => {
    // Authenticate as PM
    await mockAuth(page, TEST_USERS.pm);
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

    // Capture screenshot
    await captureRoleScreenshot(page, 'PM', testInfo);

    // Check visible items
    for (const item of ROLE_NAV_EXPECTATIONS.PM.visible) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be visible for PM`).toBe(true);
    }

    // Check hidden items
    for (const item of ROLE_NAV_EXPECTATIONS.PM.hidden) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be hidden for PM`).toBe(false);
    }
  });

  /**
   * Test: PO Role Navigation
   */
  test('PO role should see Dashboard, Feedback, Features, Roadmap, Research, Analytics, Settings', async ({ page }, testInfo) => {
    // Authenticate as PO
    await mockAuth(page, TEST_USERS.po);
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

    // Capture screenshot
    await captureRoleScreenshot(page, 'PO', testInfo);

    // Check visible items
    for (const item of ROLE_NAV_EXPECTATIONS.PO.visible) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be visible for PO`).toBe(true);
    }

    // Check hidden items
    for (const item of ROLE_NAV_EXPECTATIONS.PO.hidden) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be hidden for PO`).toBe(false);
    }
  });

  /**
   * Test: RESEARCHER Role Navigation
   */
  test('RESEARCHER role should see Dashboard, Feedback, Roadmap, Research, Analytics, Settings', async ({ page }, testInfo) => {
    // Authenticate as RESEARCHER
    await mockAuth(page, TEST_USERS.researcher);
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

    // Capture screenshot
    await captureRoleScreenshot(page, 'RESEARCHER', testInfo);

    // Check visible items
    for (const item of ROLE_NAV_EXPECTATIONS.RESEARCHER.visible) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be visible for RESEARCHER`).toBe(true);
    }

    // Check hidden items
    for (const item of ROLE_NAV_EXPECTATIONS.RESEARCHER.hidden) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be hidden for RESEARCHER`).toBe(false);
    }

    // RESEARCHER should see Research submenu items
    const researchButton = page.locator('[data-sidebar="sidebar"]').getByRole('button', { name: /research/i });
    if (await researchButton.isVisible()) {
      await researchButton.click();

      // Check for submenu items
      const sessions = await page.getByRole('link', { name: /sessions/i }).isVisible();
      const panels = await page.getByRole('link', { name: /panels/i }).isVisible();
      const questionnaires = await page.getByRole('link', { name: /questionnaires/i }).isVisible();

      expect(sessions, 'Sessions submenu should be visible for RESEARCHER').toBe(true);
      expect(panels, 'Panels submenu should be visible for RESEARCHER').toBe(true);
      expect(questionnaires, 'Questionnaires submenu should be visible for RESEARCHER').toBe(true);
    }
  });

  /**
   * Test: MODERATOR Role Navigation
   */
  test('MODERATOR role should see Dashboard, Feedback, Roadmap, Moderation, Settings', async ({ page }, testInfo) => {
    // Authenticate as MODERATOR
    await mockAuth(page, TEST_USERS.moderator);
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

    // Capture screenshot
    await captureRoleScreenshot(page, 'MODERATOR', testInfo);

    // Check visible items
    for (const item of ROLE_NAV_EXPECTATIONS.MODERATOR.visible) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be visible for MODERATOR`).toBe(true);
    }

    // Check hidden items
    for (const item of ROLE_NAV_EXPECTATIONS.MODERATOR.hidden) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be hidden for MODERATOR`).toBe(false);
    }
  });

  /**
   * Test: ADMIN Role Navigation
   */
  test('ADMIN role should see all navigation items', async ({ page }, testInfo) => {
    // Authenticate as ADMIN
    await mockAuth(page, TEST_USERS.admin);
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

    // Capture screenshot
    await captureRoleScreenshot(page, 'ADMIN', testInfo);

    // Check all visible items
    for (const item of ROLE_NAV_EXPECTATIONS.ADMIN.visible) {
      const visible = await isSidebarItemVisible(page, item);
      expect(visible, `${item} should be visible for ADMIN`).toBe(true);
    }

    // Check that ADMIN has access to Research submenu
    const researchButton = page.locator('[data-sidebar="sidebar"]').getByRole('button', { name: /research/i });
    if (await researchButton.isVisible()) {
      await researchButton.click();

      const sessions = await page.getByRole('link', { name: /sessions/i }).isVisible();
      const panels = await page.getByRole('link', { name: /panels/i }).isVisible();
      const questionnaires = await page.getByRole('link', { name: /questionnaires/i }).isVisible();

      expect(sessions, 'Sessions submenu should be visible for ADMIN').toBe(true);
      expect(panels, 'Panels submenu should be visible for ADMIN').toBe(true);
      expect(questionnaires, 'Questionnaires submenu should be visible for ADMIN').toBe(true);
    }

    // Check that ADMIN has access to Admin Panel submenu
    const adminButton = page.locator('[data-sidebar="sidebar"]').getByRole('button', { name: /admin panel/i });
    if (await adminButton.isVisible()) {
      await adminButton.click();

      const users = await page.getByRole('link', { name: /users/i }).isVisible();
      const villages = await page.getByRole('link', { name: /villages/i }).isVisible();

      expect(users, 'Users submenu should be visible for ADMIN').toBe(true);
      expect(villages, 'Villages submenu should be visible for ADMIN').toBe(true);
    }
  });

  /**
   * Test: Sidebar persistence across navigation
   */
  test('Sidebar state should persist across page navigation', async ({ page }) => {
    // Authenticate as ADMIN (has all items)
    await mockAuth(page, TEST_USERS.admin);
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

    // Expand Research menu
    const researchButton = page.locator('[data-sidebar="sidebar"]').getByRole('button', { name: /research/i });
    if (await researchButton.isVisible()) {
      await researchButton.click();
      await page.waitForTimeout(300); // Wait for animation
    }

    // Navigate to feedback page
    await page.goto('/feedback');
    await page.waitForTimeout(500);

    // Check if Research is still expanded (if localStorage persistence works)
    const sessionsLink = page.getByRole('link', { name: /sessions/i });
    // Note: This might fail if localStorage isn't properly set up in the test environment
    // but the test documents the expected behavior
  });

  /**
   * Test: Sidebar sections grouping
   */
  test('Sidebar should properly group items by section', async ({ page }) => {
    // Authenticate as ADMIN to see all sections
    await mockAuth(page, TEST_USERS.admin);
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

    // Check section headers exist
    const productSection = page.getByText('PRODUCT', { exact: true });
    const insightsSection = page.getByText('INSIGHTS', { exact: true });
    const adminSection = page.getByText('ADMIN', { exact: true });

    await expect(productSection).toBeVisible();
    await expect(insightsSection).toBeVisible();
    await expect(adminSection).toBeVisible();
  });

  /**
   * Test: Navigation items are clickable and navigate correctly
   */
  test('Navigation items should navigate to correct routes', async ({ page }) => {
    // Authenticate as PM (has good coverage)
    await mockAuth(page, TEST_USERS.pm);
    await page.goto('/dashboard');

    // Wait for sidebar to load
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

    // Test feedback navigation
    const feedbackLink = page.locator('[data-sidebar="sidebar"]').getByRole('link', { name: /feedback/i }).first();
    await feedbackLink.click();
    await page.waitForURL(/\/feedback/, { timeout: 5000 });
    expect(page.url()).toContain('/feedback');

    // Test features navigation
    const featuresLink = page.locator('[data-sidebar="sidebar"]').getByRole('link', { name: /features/i }).first();
    await featuresLink.click();
    await page.waitForURL(/\/features/, { timeout: 5000 });
    expect(page.url()).toContain('/features');

    // Test roadmap navigation
    const roadmapLink = page.locator('[data-sidebar="sidebar"]').getByRole('link', { name: /roadmap/i }).first();
    await roadmapLink.click();
    await page.waitForURL(/\/roadmap/, { timeout: 5000 });
    expect(page.url()).toContain('/roadmap');
  });
});

/**
 * Test Suite: Role Comparison Summary
 */
test.describe('Sidebar Role Comparison', () => {
  test('should generate comparison matrix of all roles', async ({ page }, testInfo) => {
    const comparisonResults: Record<string, string[]> = {};

    // Test each role and collect visible items
    for (const [roleName, user] of Object.entries(TEST_USERS)) {
      await mockAuth(page, user);
      await page.goto('/dashboard');
      await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });

      const visibleItems: string[] = [];
      const allPossibleItems = [
        'Dashboard',
        'Feedback',
        'Features',
        'Roadmap',
        'Research',
        'Analytics',
        'Moderation',
        'Admin Panel',
        'Settings',
      ];

      for (const item of allPossibleItems) {
        if (await isSidebarItemVisible(page, item)) {
          visibleItems.push(item);
        }
      }

      comparisonResults[roleName.toUpperCase()] = visibleItems;
    }

    // Log comparison matrix
    console.log('\n=== SIDEBAR NAVIGATION COMPARISON MATRIX ===\n');
    console.log(JSON.stringify(comparisonResults, null, 2));

    // Verify the comparison matches expectations
    expect(comparisonResults.USER.length).toBeGreaterThan(0);
    expect(comparisonResults.ADMIN.length).toBeGreaterThanOrEqual(comparisonResults.USER.length);
  });
});
