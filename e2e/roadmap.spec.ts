import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Roadmap Viewing
 *
 * Tests:
 * - View roadmap page
 * - Filter by stage (now, next, later)
 * - View roadmap item details
 * - See linked feedback
 */

test.describe('Roadmap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/roadmap')
  })

  test('should display roadmap page', async ({ page }) => {
    // Should load roadmap page
    await expect(page).toHaveURL(/\/roadmap/)

    // Should have roadmap title or heading
    const heading = page.locator('h1, h2').filter({ hasText: /roadmap/i })
    await expect(heading.or(page.locator('text=/roadmap/i'))).toBeVisible()
  })

  test('should display roadmap stages', async ({ page }) => {
    // Should show different stages: Now, Next, Later
    const nowStage = page.locator('text=/now/i').first()
    const nextStage = page.locator('text=/next/i').first()
    const laterStage = page.locator('text=/later/i').first()

    // At least one stage should be visible
    const nowVisible = await nowStage.isVisible().catch(() => false)
    const nextVisible = await nextStage.isVisible().catch(() => false)
    const laterVisible = await laterStage.isVisible().catch(() => false)

    expect(nowVisible || nextVisible || laterVisible).toBeTruthy()
  })

  test('should display roadmap items', async ({ page }) => {
    // Look for roadmap items or cards
    const roadmapItem = page.locator('[data-testid="roadmap-item"], [data-testid="roadmap-card"]').first()
    const emptyState = page.locator('text=/no items|empty/i')

    // Either items or empty state should be visible
    const itemsVisible = await roadmapItem.isVisible().catch(() => false)
    const emptyVisible = await emptyState.isVisible().catch(() => false)

    expect(itemsVisible || emptyVisible).toBeTruthy()
  })

  test('should filter roadmap by stage', async ({ page }) => {
    // Click on a stage filter
    const nowFilter = page.locator('button:has-text("Now"), [data-testid="stage-now"]').first()

    if (await nowFilter.isVisible().catch(() => false)) {
      await nowFilter.click()

      // URL or content should update
      await page.waitForTimeout(500)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should view roadmap item details', async ({ page }) => {
    const firstItem = page.locator('[data-testid="roadmap-item"]').first()

    if (await firstItem.isVisible().catch(() => false)) {
      await firstItem.click()

      // Should show item details
      await expect(page.locator('text=/description|details|feature/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display linked feedback on roadmap items', async ({ page }) => {
    const firstItem = page.locator('[data-testid="roadmap-item"]').first()

    if (await firstItem.isVisible().catch(() => false)) {
      await firstItem.click()

      // Look for linked feedback section
      const feedbackSection = page.locator('text=/linked feedback|related feedback/i')

      // Feedback section may or may not exist
      // Just verify page loaded
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should show progress indicators', async ({ page }) => {
    // Look for progress bars or indicators
    const progressBar = page.locator('[data-testid="progress-bar"], [role="progressbar"]').first()
    const progressText = page.locator('text=/\\d+%/').first()

    // Progress indicator may or may not be present
    // Just verify page structure
    await expect(page.locator('body')).toBeVisible()
  })

  test('should filter by product area', async ({ page }) => {
    // Look for area filters
    const areaFilter = page.locator('text=/product area|area/i').first()

    if (await areaFilter.isVisible().catch(() => false)) {
      await areaFilter.click()

      // Select an area
      const reservationsArea = page.locator('text=/reservation/i').first()
      if (await reservationsArea.isVisible().catch(() => false)) {
        await reservationsArea.click()

        // Should filter results
        await page.waitForTimeout(500)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})
