/**
 * Milestone Service
 *
 * Handles automatic milestone unlock detection and persistence.
 * Should be called whenever user analytics are updated (e.g., after completing a listening session).
 */

import { prisma } from '@/lib/prisma/client';
import { checkMilestoneUnlocks } from './milestone-definitions';

/**
 * Check and unlock milestones for a user based on their current analytics
 *
 * @param userId - User ID to check milestones for
 * @returns Array of newly unlocked milestone IDs
 */
export async function checkAndUnlockMilestones(
  userId: string
): Promise<string[]> {
  try {
    // Get user's analytics cache
    const analyticsCache = await prisma.userAnalyticsCache.findUnique({
      where: { userId },
    });

    if (!analyticsCache) {
      // No analytics cache exists yet, no milestones to unlock
      return [];
    }

    // Check which milestones should be unlocked based on current stats
    const shouldBeUnlocked = checkMilestoneUnlocks({
      totalStoriesListened: analyticsCache.totalStoriesListened,
      totalListeningTimeSeconds: analyticsCache.totalListeningTimeSeconds,
      currentStreak: analyticsCache.currentStreak,
      longestStreak: analyticsCache.longestStreak,
    });

    // Get already unlocked milestones
    const existingUnlocks = await prisma.userMilestone.findMany({
      where: {
        userId,
        milestoneId: { in: shouldBeUnlocked },
      },
      select: { milestoneId: true },
    });

    const existingMilestoneIds = new Set(
      existingUnlocks.map((m) => m.milestoneId)
    );

    // Find newly unlocked milestones
    const newlyUnlocked = shouldBeUnlocked.filter(
      (milestoneId) => !existingMilestoneIds.has(milestoneId)
    );

    // Create new milestone unlocks
    if (newlyUnlocked.length > 0) {
      await prisma.userMilestone.createMany({
        data: newlyUnlocked.map((milestoneId) => ({
          userId,
          milestoneId,
        })),
      });
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('[MilestoneService] Error checking milestones:', error);
    // Don't throw - milestone unlocking is non-critical
    return [];
  }
}

/**
 * Get all unlocked milestones for a user
 *
 * @param userId - User ID
 * @returns Array of unlocked milestone records
 */
export async function getUnlockedMilestones(userId: string) {
  return prisma.userMilestone.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'asc' },
  });
}

/**
 * Check if a specific milestone is unlocked for a user
 *
 * @param userId - User ID
 * @param milestoneId - Milestone ID to check
 * @returns True if milestone is unlocked, false otherwise
 */
export async function isMilestoneUnlocked(
  userId: string,
  milestoneId: string
): Promise<boolean> {
  const milestone = await prisma.userMilestone.findUnique({
    where: {
      userId_milestoneId: {
        userId,
        milestoneId,
      },
    },
  });

  return milestone !== null;
}

/**
 * Manually unlock a milestone for a user (for testing or admin purposes)
 *
 * @param userId - User ID
 * @param milestoneId - Milestone ID to unlock
 * @returns The created milestone record, or null if already unlocked
 */
export async function unlockMilestone(userId: string, milestoneId: string) {
  try {
    return await prisma.userMilestone.create({
      data: {
        userId,
        milestoneId,
      },
    });
  } catch (error) {
    // Likely a unique constraint violation (already unlocked)
    return null;
  }
}
