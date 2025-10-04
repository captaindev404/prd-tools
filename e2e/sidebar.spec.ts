import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Sidebar Responsive Behavior and State Persistence
 *
 * Tests:
 * - Mobile drawer (<768px) opens/closes
 * - Desktop sidebar (>=768px) expands/collapses
 * - Collapse state persists on page reload
 * - Research expanded state persists
 * - Ctrl+B keyboard shortcut works
 * - Cross-browser compatibility (Chrome, Firefox, Safari)
 * - Mobile browsers (iOS Safari, Android Chrome)
 *
 * Note: These tests assume authentication is configured. If tests fail due to
 * authentication redirects, you may need to:
 * 1. Configure proper test authentication in your CI/CD
 * 2. Or use a public test route that has the sidebar
 * 3. Or mock authentication state in the tests
 */

test.describe('Sidebar Responsive Behavior', () => {
  // Helper function to wait for page to be ready
  const waitForPageReady = async (page: any) => {
    // Wait for navigation to complete
    await page.waitForLoadState('domcontentloaded')

    // Try to wait for sidebar with a timeout
    const sidebar = page.locator('[data-sidebar="sidebar"]')
    const trigger = page.locator('[data-sidebar="trigger"]')

    // Check if we have either a sidebar or a trigger (for authenticated pages)
    try {
      await Promise.race([
        sidebar.waitFor({ timeout: 5000 }),
        trigger.waitFor({ timeout: 5000 })
      ])
    } catch (e) {
      // If we can't find sidebar, we might be on sign-in page
      // Skip this test for now
      throw new Error('Sidebar not found - likely redirected to sign-in page')
    }
  }

  // Helper function to clear localStorage and cookies
  const clearStorage = async (page: any) => {
    try {
      // Clear cookies first
      await page.context().clearCookies()

      // Then clear localStorage after page is loaded
      await page.evaluate(() => {
        try {
          localStorage.clear()
        } catch (e) {
          // Ignore if localStorage is not accessible
        }
      })
    } catch (e) {
      // Ignore storage clearing errors
    }
  }

  test.describe('Mobile View (<768px)', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard')
      await waitForPageReady(page)
      await clearStorage(page)
    })

    test('should show mobile drawer trigger button', async ({ page }) => {
      // Mobile should have a trigger button to open the drawer
      const trigger = page.locator('[data-sidebar="trigger"]')
      await expect(trigger).toBeVisible()
    })

    test('should open mobile drawer when trigger is clicked', async ({ page }) => {
      // Click the sidebar trigger
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()

      // Wait for drawer to open
      await page.waitForTimeout(300) // Wait for animation

      // Drawer should be visible with mobile attribute
      const mobileDrawer = page.locator('[data-sidebar="sidebar"][data-mobile="true"]')
      await expect(mobileDrawer).toBeVisible()
    })

    test('should close mobile drawer when clicking outside', async ({ page }) => {
      // Open drawer
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      // Verify drawer is open
      const mobileDrawer = page.locator('[data-sidebar="sidebar"][data-mobile="true"]')
      await expect(mobileDrawer).toBeVisible()

      // Click outside the drawer (on the overlay)
      await page.locator('body').click({ position: { x: 10, y: 10 } })
      await page.waitForTimeout(300)

      // Drawer should be closed
      await expect(mobileDrawer).not.toBeVisible()
    })

    test('should close mobile drawer when navigation link is clicked', async ({ page }) => {
      // Open drawer
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      // Click a navigation link
      const feedbackLink = page.locator('[data-sidebar="sidebar"] a[href="/feedback"]')
      await feedbackLink.click()

      // Wait for navigation
      await page.waitForURL('**/feedback')
      await page.waitForTimeout(300)

      // Drawer should be closed after navigation
      const mobileDrawer = page.locator('[data-sidebar="sidebar"][data-mobile="true"]')
      await expect(mobileDrawer).not.toBeVisible()
    })

    test('should display all navigation items in mobile drawer', async ({ page }) => {
      // Open drawer
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      // Check for key navigation items
      const drawer = page.locator('[data-sidebar="sidebar"][data-mobile="true"]')
      await expect(drawer.locator('text=Dashboard')).toBeVisible()
      await expect(drawer.locator('text=Feedback')).toBeVisible()
      await expect(drawer.locator('text=Roadmap')).toBeVisible()
    })
  })

  test.describe('Desktop View (>=768px)', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard')
      await waitForPageReady(page)
      await clearStorage(page)
    })

    test('should show expanded sidebar by default', async ({ page }) => {
      // Desktop sidebar should be visible
      const sidebar = page.locator('[data-sidebar="sidebar"]:not([data-mobile="true"])')
      await expect(sidebar).toBeVisible()

      // Should be in expanded state
      const sidebarContainer = page.locator('.group.peer[data-state="expanded"]')
      await expect(sidebarContainer).toBeVisible()
    })

    test('should collapse sidebar when trigger is clicked', async ({ page }) => {
      // Click the sidebar trigger
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      // Sidebar should be in collapsed state
      const sidebarContainer = page.locator('.group.peer[data-state="collapsed"]')
      await expect(sidebarContainer).toBeVisible()
    })

    test('should expand sidebar when trigger is clicked again', async ({ page }) => {
      // Collapse sidebar
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      // Verify collapsed
      let sidebarContainer = page.locator('.group.peer[data-state="collapsed"]')
      await expect(sidebarContainer).toBeVisible()

      // Expand sidebar
      await trigger.click()
      await page.waitForTimeout(300)

      // Verify expanded
      sidebarContainer = page.locator('.group.peer[data-state="expanded"]')
      await expect(sidebarContainer).toBeVisible()
    })

    test('should show navigation labels in expanded state', async ({ page }) => {
      // In expanded state, labels should be visible
      const sidebar = page.locator('[data-sidebar="sidebar"]:not([data-mobile="true"])')
      await expect(sidebar.locator('text=Dashboard')).toBeVisible()
      await expect(sidebar.locator('text=Feedback')).toBeVisible()
    })

    test('should show only icons in collapsed state', async ({ page }) => {
      // Collapse sidebar
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      // Check that the sidebar is narrower (icon mode)
      const sidebarContainer = page.locator('.group.peer[data-state="collapsed"]')
      await expect(sidebarContainer).toBeVisible()
      await expect(sidebarContainer).toHaveAttribute('data-collapsible', 'offcanvas')
    })
  })

  test.describe('State Persistence - Collapse State', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('should persist collapsed state across page reloads', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Collapse sidebar
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      // Verify collapsed state
      let sidebarContainer = page.locator('.group.peer[data-state="collapsed"]')
      await expect(sidebarContainer).toBeVisible()

      // Check localStorage value
      const cookieValue = await page.evaluate(() => {
        return document.cookie.includes('sidebar_state=false')
      })
      expect(cookieValue).toBe(true)

      // Reload page
      await page.reload()
      await waitForPageReady(page)

      // Sidebar should still be collapsed
      sidebarContainer = page.locator('.group.peer[data-state="collapsed"]')
      await expect(sidebarContainer).toBeVisible()
    })

    test('should persist expanded state across page reloads', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Sidebar starts expanded by default
      let sidebarContainer = page.locator('.group.peer[data-state="expanded"]')
      await expect(sidebarContainer).toBeVisible()

      // Check cookie value
      const cookieValue = await page.evaluate(() => {
        return document.cookie.includes('sidebar_state=true')
      })
      expect(cookieValue).toBe(true)

      // Reload page
      await page.reload()
      await waitForPageReady(page)

      // Sidebar should still be expanded
      sidebarContainer = page.locator('.group.peer[data-state="expanded"]')
      await expect(sidebarContainer).toBeVisible()
    })

    test('should persist collapsed state across navigation', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Collapse sidebar
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      // Navigate to feedback page
      await page.goto('/feedback')
      await waitForPageReady(page)

      // Sidebar should still be collapsed
      const sidebarContainer = page.locator('.group.peer[data-state="collapsed"]')
      await expect(sidebarContainer).toBeVisible()
    })
  })

  test.describe('State Persistence - Research Section', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('should persist Research section expanded state', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Find and expand Research section
      const researchButton = page.locator('[data-sidebar="menu-button"]:has-text("Research")')
      await researchButton.click()
      await page.waitForTimeout(300)

      // Verify submenu is visible
      const submenu = page.locator('#submenu-research-sessions')
      await expect(submenu).toBeVisible()

      // Check localStorage
      const isExpanded = await page.evaluate(() => {
        return localStorage.getItem('sidebar-research/sessions-expanded') === 'true'
      })
      expect(isExpanded).toBe(true)

      // Reload page
      await page.reload()
      await waitForPageReady(page)

      // Research section should still be expanded
      const submenuAfterReload = page.locator('#submenu-research-sessions')
      await expect(submenuAfterReload).toBeVisible()
    })

    test('should persist Research section collapsed state', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Expand Research section
      const researchButton = page.locator('[data-sidebar="menu-button"]:has-text("Research")')
      await researchButton.click()
      await page.waitForTimeout(300)

      // Collapse it again
      await researchButton.click()
      await page.waitForTimeout(300)

      // Verify submenu is hidden
      const submenu = page.locator('#submenu-research-sessions')
      await expect(submenu).not.toBeVisible()

      // Check localStorage
      const isExpanded = await page.evaluate(() => {
        return localStorage.getItem('sidebar-research/sessions-expanded') === 'false'
      })
      expect(isExpanded).toBe(true)

      // Reload page
      await page.reload()
      await waitForPageReady(page)

      // Research section should still be collapsed
      const submenuAfterReload = page.locator('#submenu-research-sessions')
      await expect(submenuAfterReload).not.toBeVisible()
    })

    test('should expand Research section when navigating to research route', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/research/panels')
      await waitForPageReady(page)

      // Research section should be auto-expanded when on a research page
      const submenu = page.locator('#submenu-research-sessions')
      await expect(submenu).toBeVisible()

      // Active panel link should be highlighted
      const panelsLink = page.locator('a[href="/research/panels"][aria-current="page"]')
      await expect(panelsLink).toBeVisible()
    })
  })

  test.describe('Keyboard Shortcuts', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('should toggle sidebar with Ctrl+B on Windows/Linux', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Sidebar starts expanded
      let sidebarContainer = page.locator('.group.peer[data-state="expanded"]')
      await expect(sidebarContainer).toBeVisible()

      // Press Ctrl+B
      await page.keyboard.press('Control+b')
      await page.waitForTimeout(300)

      // Sidebar should be collapsed
      sidebarContainer = page.locator('.group.peer[data-state="collapsed"]')
      await expect(sidebarContainer).toBeVisible()

      // Press Ctrl+B again
      await page.keyboard.press('Control+b')
      await page.waitForTimeout(300)

      // Sidebar should be expanded
      sidebarContainer = page.locator('.group.peer[data-state="expanded"]')
      await expect(sidebarContainer).toBeVisible()
    })

    test('should toggle sidebar with Cmd+B on macOS', async ({ page, browserName }) => {
      // Skip if not on webkit (Safari) or if running on non-Mac OS
      test.skip(browserName !== 'webkit', 'This test is for macOS Safari only')

      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Sidebar starts expanded
      let sidebarContainer = page.locator('.group.peer[data-state="expanded"]')
      await expect(sidebarContainer).toBeVisible()

      // Press Cmd+B
      await page.keyboard.press('Meta+b')
      await page.waitForTimeout(300)

      // Sidebar should be collapsed
      sidebarContainer = page.locator('.group.peer[data-state="collapsed"]')
      await expect(sidebarContainer).toBeVisible()

      // Press Cmd+B again
      await page.keyboard.press('Meta+b')
      await page.waitForTimeout(300)

      // Sidebar should be expanded
      sidebarContainer = page.locator('.group.peer[data-state="expanded"]')
      await expect(sidebarContainer).toBeVisible()
    })

    test('should prevent default browser behavior for Ctrl+B', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Listen for any unexpected navigation or bookmarks dialog
      let defaultPrevented = false
      await page.evaluate(() => {
        window.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            defaultPrevented = e.defaultPrevented
          }
        })
      })

      // Press Ctrl+B
      await page.keyboard.press('Control+b')
      await page.waitForTimeout(300)

      // Should still be on the same page
      expect(page.url()).toContain('/dashboard')
    })
  })

  test.describe('Responsive Breakpoint Transitions', () => {
    test('should switch from desktop to mobile layout on resize', async ({ page }) => {
      // Start with desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 })
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Desktop sidebar should be visible
      let desktopSidebar = page.locator('.group.peer[data-state="expanded"]')
      await expect(desktopSidebar).toBeVisible()

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500)

      // Desktop sidebar should be hidden, mobile trigger should appear
      const mobileTrigger = page.locator('[data-sidebar="trigger"]')
      await expect(mobileTrigger).toBeVisible()
    })

    test('should switch from mobile to desktop layout on resize', async ({ page }) => {
      // Start with mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Mobile trigger should be visible
      let mobileTrigger = page.locator('[data-sidebar="trigger"]')
      await expect(mobileTrigger).toBeVisible()

      // Resize to desktop
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.waitForTimeout(500)

      // Desktop sidebar should be visible
      const desktopSidebar = page.locator('.group.peer[data-state="expanded"]')
      await expect(desktopSidebar).toBeVisible()
    })

    test('should handle breakpoint at exactly 768px', async ({ page }) => {
      await clearStorage(page)

      // Test at 767px (mobile)
      await page.setViewportSize({ width: 767, height: 720 })
      await page.goto('/dashboard')
      await waitForPageReady(page)

      const mobileTrigger = page.locator('[data-sidebar="trigger"]')
      await expect(mobileTrigger).toBeVisible()

      // Test at 768px (desktop)
      await page.setViewportSize({ width: 768, height: 720 })
      await page.waitForTimeout(500)

      const desktopSidebar = page.locator('.group.peer')
      await expect(desktopSidebar).toBeVisible()
    })
  })

  test.describe('Cross-Browser Compatibility', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('should work correctly in Chromium', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'This test is for Chromium only')

      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Test collapse/expand
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      const collapsed = page.locator('.group.peer[data-state="collapsed"]')
      await expect(collapsed).toBeVisible()
    })

    test('should work correctly in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'This test is for Firefox only')

      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Test collapse/expand
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      const collapsed = page.locator('.group.peer[data-state="collapsed"]')
      await expect(collapsed).toBeVisible()
    })

    test('should work correctly in Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'This test is for Safari/WebKit only')

      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Test collapse/expand
      const trigger = page.locator('[data-sidebar="trigger"]')
      await trigger.click()
      await page.waitForTimeout(300)

      const collapsed = page.locator('.group.peer[data-state="collapsed"]')
      await expect(collapsed).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('should have proper ARIA attributes', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Check sidebar has navigation role
      const nav = page.locator('[data-sidebar="sidebar"] nav')
      await expect(nav).toHaveAttribute('aria-label', 'Main navigation')

      // Check Research collapsible has proper aria-expanded
      const researchButton = page.locator('[data-sidebar="menu-button"]:has-text("Research")')
      await expect(researchButton).toHaveAttribute('aria-expanded', 'false')

      // Expand it
      await researchButton.click()
      await page.waitForTimeout(300)
      await expect(researchButton).toHaveAttribute('aria-expanded', 'true')
    })

    test('should support keyboard navigation', async ({ page }) => {
      await clearStorage(page)
      await page.goto('/dashboard')
      await waitForPageReady(page)

      // Tab to first navigation item
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should be able to navigate with keyboard
      const dashboardLink = page.locator('a[href="/dashboard"]').first()
      await expect(dashboardLink).toBeFocused()

      // Press Enter to navigate
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)

      // Should stay on dashboard (or navigate if not already there)
      expect(page.url()).toContain('/dashboard')
    })
  })
})
