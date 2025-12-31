import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma/client';
import {
  checkAndUnlockMilestones,
  getUnlockedMilestones,
  isMilestoneUnlocked,
  unlockMilestone,
} from '../milestone-service';

describe('Milestone Service', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: 'test-user-service',
        email: 'service@test.com',
        name: 'Test User',
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.userMilestone.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.userAnalyticsCache.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
  });

  describe('checkAndUnlockMilestones', () => {
    it('should return empty array when no analytics cache exists', async () => {
      const newlyUnlocked = await checkAndUnlockMilestones(testUser.id);

      expect(newlyUnlocked).toEqual([]);
    });

    it('should unlock milestones based on analytics stats', async () => {
      // Create analytics cache
      await prisma.userAnalyticsCache.create({
        data: {
          userId: testUser.id,
          totalStoriesListened: 5,
        },
      });

      const newlyUnlocked = await checkAndUnlockMilestones(testUser.id);

      expect(newlyUnlocked).toContain('FIRST_STORY');
      expect(newlyUnlocked).toContain('STORIES_5');
      expect(newlyUnlocked).toHaveLength(2);

      // Verify milestones were persisted
      const milestones = await prisma.userMilestone.findMany({
        where: { userId: testUser.id },
      });

      expect(milestones).toHaveLength(2);
    });

    it('should only unlock new milestones on subsequent calls', async () => {
      // Create analytics cache with 1 story
      await prisma.userAnalyticsCache.create({
        data: {
          userId: testUser.id,
          totalStoriesListened: 1,
        },
      });

      // First check - should unlock FIRST_STORY
      const firstUnlock = await checkAndUnlockMilestones(testUser.id);
      expect(firstUnlock).toContain('FIRST_STORY');
      expect(firstUnlock).toHaveLength(1);

      // Second check without changes - should not unlock anything new
      const secondUnlock = await checkAndUnlockMilestones(testUser.id);
      expect(secondUnlock).toEqual([]);

      // Update analytics to 5 stories
      await prisma.userAnalyticsCache.update({
        where: { userId: testUser.id },
        data: { totalStoriesListened: 5 },
      });

      // Third check - should only unlock STORIES_5
      const thirdUnlock = await checkAndUnlockMilestones(testUser.id);
      expect(thirdUnlock).toContain('STORIES_5');
      expect(thirdUnlock).not.toContain('FIRST_STORY');
      expect(thirdUnlock).toHaveLength(1);
    });

    it('should handle multiple categories of milestones', async () => {
      await prisma.userAnalyticsCache.create({
        data: {
          userId: testUser.id,
          totalStoriesListened: 10,
          totalListeningTimeSeconds: 3600, // 1 hour
          currentStreak: 7,
          longestStreak: 7,
        },
      });

      const newlyUnlocked = await checkAndUnlockMilestones(testUser.id);

      // Should unlock milestones from all 3 categories
      expect(newlyUnlocked).toContain('FIRST_STORY');
      expect(newlyUnlocked).toContain('STORIES_5');
      expect(newlyUnlocked).toContain('STORIES_10');
      expect(newlyUnlocked).toContain('LISTENING_1H');
      expect(newlyUnlocked).toContain('STREAK_7');
      expect(newlyUnlocked).toHaveLength(5);
    });

    it('should not throw error on database issues', async () => {
      // Invalid user ID should not throw
      const newlyUnlocked = await checkAndUnlockMilestones('non-existent-user');

      expect(newlyUnlocked).toEqual([]);
    });

    it('should handle concurrent unlock requests gracefully', async () => {
      await prisma.userAnalyticsCache.create({
        data: {
          userId: testUser.id,
          totalStoriesListened: 1,
        },
      });

      // Simulate concurrent requests
      const [result1, result2] = await Promise.all([
        checkAndUnlockMilestones(testUser.id),
        checkAndUnlockMilestones(testUser.id),
      ]);

      // One should unlock, one should return empty
      const totalUnlocked = [...new Set([...result1, ...result2])];
      expect(totalUnlocked).toContain('FIRST_STORY');

      // Should only have one milestone record in database
      const milestones = await prisma.userMilestone.findMany({
        where: { userId: testUser.id },
      });

      expect(milestones).toHaveLength(1);
    });
  });

  describe('getUnlockedMilestones', () => {
    it('should return empty array when no milestones unlocked', async () => {
      const milestones = await getUnlockedMilestones(testUser.id);

      expect(milestones).toEqual([]);
    });

    it('should return all unlocked milestones sorted by unlockedAt', async () => {
      // Create milestones with slight time differences
      await prisma.userMilestone.create({
        data: {
          userId: testUser.id,
          milestoneId: 'FIRST_STORY',
        },
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      await prisma.userMilestone.create({
        data: {
          userId: testUser.id,
          milestoneId: 'STORIES_5',
        },
      });

      const milestones = await getUnlockedMilestones(testUser.id);

      expect(milestones).toHaveLength(2);
      expect(milestones[0].milestoneId).toBe('FIRST_STORY');
      expect(milestones[1].milestoneId).toBe('STORIES_5');

      // Verify sorting by unlockedAt
      expect(milestones[0].unlockedAt.getTime()).toBeLessThanOrEqual(
        milestones[1].unlockedAt.getTime()
      );
    });

    it('should only return milestones for the specified user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          id: 'other-user-service',
          email: 'other@test.com',
          name: 'Other User',
        },
      });

      // Create milestones for both users
      await prisma.userMilestone.create({
        data: {
          userId: testUser.id,
          milestoneId: 'FIRST_STORY',
        },
      });

      await prisma.userMilestone.create({
        data: {
          userId: otherUser.id,
          milestoneId: 'STORIES_5',
        },
      });

      const milestones = await getUnlockedMilestones(testUser.id);

      expect(milestones).toHaveLength(1);
      expect(milestones[0].milestoneId).toBe('FIRST_STORY');

      // Clean up
      await prisma.userMilestone.deleteMany({ where: { userId: otherUser.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('isMilestoneUnlocked', () => {
    it('should return false when milestone is not unlocked', async () => {
      const unlocked = await isMilestoneUnlocked(testUser.id, 'FIRST_STORY');

      expect(unlocked).toBe(false);
    });

    it('should return true when milestone is unlocked', async () => {
      await prisma.userMilestone.create({
        data: {
          userId: testUser.id,
          milestoneId: 'FIRST_STORY',
        },
      });

      const unlocked = await isMilestoneUnlocked(testUser.id, 'FIRST_STORY');

      expect(unlocked).toBe(true);
    });

    it('should return false for different user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          id: 'other-user-check',
          email: 'other@check.com',
          name: 'Other User',
        },
      });

      // Unlock milestone for test user
      await prisma.userMilestone.create({
        data: {
          userId: testUser.id,
          milestoneId: 'FIRST_STORY',
        },
      });

      // Check for other user - should be false
      const unlocked = await isMilestoneUnlocked(otherUser.id, 'FIRST_STORY');

      expect(unlocked).toBe(false);

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('unlockMilestone', () => {
    it('should manually unlock a milestone', async () => {
      const milestone = await unlockMilestone(testUser.id, 'FIRST_STORY');

      expect(milestone).toBeDefined();
      expect(milestone?.userId).toBe(testUser.id);
      expect(milestone?.milestoneId).toBe('FIRST_STORY');
      expect(milestone?.unlockedAt).toBeDefined();

      // Verify in database
      const dbMilestone = await prisma.userMilestone.findUnique({
        where: {
          userId_milestoneId: {
            userId: testUser.id,
            milestoneId: 'FIRST_STORY',
          },
        },
      });

      expect(dbMilestone).toBeDefined();
    });

    it('should return null when trying to unlock already unlocked milestone', async () => {
      // Unlock first time
      const first = await unlockMilestone(testUser.id, 'FIRST_STORY');
      expect(first).toBeDefined();

      // Try to unlock again
      const second = await unlockMilestone(testUser.id, 'FIRST_STORY');
      expect(second).toBeNull();

      // Should still only have one record in database
      const milestones = await prisma.userMilestone.findMany({
        where: {
          userId: testUser.id,
          milestoneId: 'FIRST_STORY',
        },
      });

      expect(milestones).toHaveLength(1);
    });

    it('should allow unlocking different milestones for the same user', async () => {
      const milestone1 = await unlockMilestone(testUser.id, 'FIRST_STORY');
      const milestone2 = await unlockMilestone(testUser.id, 'STORIES_5');

      expect(milestone1).toBeDefined();
      expect(milestone2).toBeDefined();

      const milestones = await prisma.userMilestone.findMany({
        where: { userId: testUser.id },
      });

      expect(milestones).toHaveLength(2);
    });

    it('should allow same milestone for different users', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          id: 'other-user-unlock',
          email: 'other@unlock.com',
          name: 'Other User',
        },
      });

      const milestone1 = await unlockMilestone(testUser.id, 'FIRST_STORY');
      const milestone2 = await unlockMilestone(otherUser.id, 'FIRST_STORY');

      expect(milestone1).toBeDefined();
      expect(milestone2).toBeDefined();

      // Clean up
      await prisma.userMilestone.deleteMany({ where: { userId: otherUser.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Integration Flow', () => {
    it('should handle complete milestone progression flow', async () => {
      // 1. Start with no analytics
      let unlocked = await getUnlockedMilestones(testUser.id);
      expect(unlocked).toEqual([]);

      // 2. Create analytics cache with some progress
      await prisma.userAnalyticsCache.create({
        data: {
          userId: testUser.id,
          totalStoriesListened: 3,
          totalListeningTimeSeconds: 1800, // 30 minutes
        },
      });

      // 3. Check and unlock milestones
      let newlyUnlocked = await checkAndUnlockMilestones(testUser.id);
      expect(newlyUnlocked).toContain('FIRST_STORY');
      expect(newlyUnlocked).toHaveLength(1);

      // 4. Verify FIRST_STORY is unlocked
      const isFirstStoryUnlocked = await isMilestoneUnlocked(testUser.id, 'FIRST_STORY');
      expect(isFirstStoryUnlocked).toBe(true);

      const isStories5Unlocked = await isMilestoneUnlocked(testUser.id, 'STORIES_5');
      expect(isStories5Unlocked).toBe(false);

      // 5. Update analytics to trigger more unlocks
      await prisma.userAnalyticsCache.update({
        where: { userId: testUser.id },
        data: {
          totalStoriesListened: 10,
          totalListeningTimeSeconds: 3600, // 1 hour
          currentStreak: 7,
          longestStreak: 7,
        },
      });

      // 6. Check again
      newlyUnlocked = await checkAndUnlockMilestones(testUser.id);
      expect(newlyUnlocked).toContain('STORIES_5');
      expect(newlyUnlocked).toContain('STORIES_10');
      expect(newlyUnlocked).toContain('LISTENING_1H');
      expect(newlyUnlocked).toContain('STREAK_7');
      expect(newlyUnlocked).not.toContain('FIRST_STORY'); // Already unlocked

      // 7. Get all unlocked milestones
      unlocked = await getUnlockedMilestones(testUser.id);
      expect(unlocked).toHaveLength(5);

      // 8. Verify all expected milestones are unlocked
      const milestoneIds = unlocked.map((m) => m.milestoneId);
      expect(milestoneIds).toContain('FIRST_STORY');
      expect(milestoneIds).toContain('STORIES_5');
      expect(milestoneIds).toContain('STORIES_10');
      expect(milestoneIds).toContain('LISTENING_1H');
      expect(milestoneIds).toContain('STREAK_7');
    });
  });
});
