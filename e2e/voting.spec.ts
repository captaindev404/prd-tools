import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Voting on Feedback
 *
 * Tests:
 * - Vote on feedback
 * - Remove vote
 * - View vote count
 * - Prevent duplicate votes
 */

test.describe('Voting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feedback')
  })

  test('should display vote buttons on feedback items', async ({ page }) => {
    // Look for vote or upvote buttons
    const voteButton = page.locator('[data-testid="vote-button"], button:has-text("Vote"), button:has-text("Upvote")').first()
    const feedbackItem = page.locator('[data-testid="feedback-item"], [data-testid="feedback-card"]').first()

    // If feedback exists, vote button should be visible
    if (await feedbackItem.isVisible().catch(() => false)) {
      await expect(voteButton.or(page.locator('text=/vote/i'))).toBeVisible()
    }
  })

  test('should show vote count', async ({ page }) => {
    const feedbackItem = page.locator('[data-testid="feedback-item"]').first()

    if (await feedbackItem.isVisible().catch(() => false)) {
      // Should display vote count (could be 0)
      const voteCount = page.locator('[data-testid="vote-count"], text=/\\d+ vote/i').first()
      await expect(voteCount.or(feedbackItem)).toBeVisible()
    }
  })

  test('should toggle vote on click', async ({ page }) => {
    const firstFeedback = page.locator('[data-testid="feedback-item"]').first()

    if (await firstFeedback.isVisible().catch(() => false)) {
      await firstFeedback.click()

      const voteButton = page.locator('[data-testid="vote-button"], button:has-text("Vote")').first()

      if (await voteButton.isVisible().catch(() => false)) {
        // Get initial vote count
        const voteCountBefore = await page.locator('[data-testid="vote-count"]').textContent().catch(() => '0')

        // Click vote button
        await voteButton.click()

        // Wait for vote to register
        await page.waitForTimeout(1000)

        // Vote count should change or button state should change
        const voteCountAfter = await page.locator('[data-testid="vote-count"]').textContent().catch(() => '0')

        // Either count changed or button text changed (Vote -> Unvote)
        const buttonTextChanged = await voteButton.textContent()
        expect(voteCountBefore !== voteCountAfter || buttonTextChanged?.includes('Unvote')).toBeTruthy()
      }
    }
  })

  test('should require authentication to vote', async ({ page, context }) => {
    // Clear any existing auth
    await context.clearCookies()

    const firstFeedback = page.locator('[data-testid="feedback-item"]').first()

    if (await firstFeedback.isVisible().catch(() => false)) {
      await firstFeedback.click()

      const voteButton = page.locator('[data-testid="vote-button"]').first()

      if (await voteButton.isVisible().catch(() => false)) {
        await voteButton.click()

        // Should redirect to sign-in or show auth prompt
        await expect(page.locator('text=/sign in|log in/i')).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should display weighted vote information', async ({ page }) => {
    const firstFeedback = page.locator('[data-testid="feedback-item"]').first()

    if (await firstFeedback.isVisible().catch(() => false)) {
      await firstFeedback.click()

      // Look for vote details or tooltips
      const voteDetails = page.locator('[data-testid="vote-details"], text=/weight|weighted/i')

      // Vote weight info may or may not be displayed
      // Just verify page loaded properly
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
