import { describe, it, expect } from 'vitest';
import {
  MILESTONE_DEFINITIONS,
  MilestoneCategory,
  getMilestoneById,
  getMilestonesByCategory,
  checkMilestoneUnlocks,
  calculateMilestoneProgress,
} from '../milestone-definitions';

describe('Milestone Definitions', () => {
  describe('MILESTONE_DEFINITIONS', () => {
    it('should have all required milestones', () => {
      const expectedIds = [
        'FIRST_STORY',
        'STORIES_5',
        'STORIES_10',
        'STORIES_25',
        'STORIES_50',
        'LISTENING_1H',
        'LISTENING_5H',
        'LISTENING_10H',
        'STREAK_7',
        'STREAK_30',
      ];

      const actualIds = MILESTONE_DEFINITIONS.map((m) => m.id);
      expect(actualIds.sort()).toEqual(expectedIds.sort());
    });

    it('should have unique milestone IDs', () => {
      const ids = MILESTONE_DEFINITIONS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid milestone structure', () => {
      MILESTONE_DEFINITIONS.forEach((milestone) => {
        expect(milestone).toHaveProperty('id');
        expect(milestone).toHaveProperty('category');
        expect(milestone).toHaveProperty('title');
        expect(milestone).toHaveProperty('description');
        expect(milestone).toHaveProperty('target');
        expect(milestone).toHaveProperty('order');

        expect(typeof milestone.id).toBe('string');
        expect(typeof milestone.title).toBe('string');
        expect(typeof milestone.description).toBe('string');
        expect(typeof milestone.target).toBe('number');
        expect(typeof milestone.order).toBe('number');
        expect(milestone.target).toBeGreaterThan(0);
        expect(milestone.order).toBeGreaterThan(0);
      });
    });

    it('should have correct targets for story milestones', () => {
      const firstStory = getMilestoneById('FIRST_STORY');
      const stories5 = getMilestoneById('STORIES_5');
      const stories10 = getMilestoneById('STORIES_10');
      const stories25 = getMilestoneById('STORIES_25');
      const stories50 = getMilestoneById('STORIES_50');

      expect(firstStory?.target).toBe(1);
      expect(stories5?.target).toBe(5);
      expect(stories10?.target).toBe(10);
      expect(stories25?.target).toBe(25);
      expect(stories50?.target).toBe(50);
    });

    it('should have correct targets for listening time milestones', () => {
      const listening1h = getMilestoneById('LISTENING_1H');
      const listening5h = getMilestoneById('LISTENING_5H');
      const listening10h = getMilestoneById('LISTENING_10H');

      expect(listening1h?.target).toBe(3600); // 1 hour in seconds
      expect(listening5h?.target).toBe(18000); // 5 hours in seconds
      expect(listening10h?.target).toBe(36000); // 10 hours in seconds
    });

    it('should have correct targets for streak milestones', () => {
      const streak7 = getMilestoneById('STREAK_7');
      const streak30 = getMilestoneById('STREAK_30');

      expect(streak7?.target).toBe(7);
      expect(streak30?.target).toBe(30);
    });
  });

  describe('getMilestoneById', () => {
    it('should return milestone by ID', () => {
      const milestone = getMilestoneById('FIRST_STORY');

      expect(milestone).toBeDefined();
      expect(milestone?.id).toBe('FIRST_STORY');
      expect(milestone?.category).toBe(MilestoneCategory.STORIES);
    });

    it('should return undefined for non-existent ID', () => {
      const milestone = getMilestoneById('NON_EXISTENT');
      expect(milestone).toBeUndefined();
    });
  });

  describe('getMilestonesByCategory', () => {
    it('should return all story milestones sorted by order', () => {
      const milestones = getMilestonesByCategory(MilestoneCategory.STORIES);

      expect(milestones).toHaveLength(5);
      expect(milestones.map((m) => m.id)).toEqual([
        'FIRST_STORY',
        'STORIES_5',
        'STORIES_10',
        'STORIES_25',
        'STORIES_50',
      ]);

      // Verify sorting by order
      for (let i = 1; i < milestones.length; i++) {
        expect(milestones[i].order).toBeGreaterThan(milestones[i - 1].order);
      }
    });

    it('should return all listening time milestones sorted by order', () => {
      const milestones = getMilestonesByCategory(MilestoneCategory.LISTENING_TIME);

      expect(milestones).toHaveLength(3);
      expect(milestones.map((m) => m.id)).toEqual([
        'LISTENING_1H',
        'LISTENING_5H',
        'LISTENING_10H',
      ]);
    });

    it('should return all streak milestones sorted by order', () => {
      const milestones = getMilestonesByCategory(MilestoneCategory.STREAKS);

      expect(milestones).toHaveLength(2);
      expect(milestones.map((m) => m.id)).toEqual(['STREAK_7', 'STREAK_30']);
    });
  });

  describe('checkMilestoneUnlocks', () => {
    it('should return empty array for zero stats', () => {
      const unlocked = checkMilestoneUnlocks({
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
      });

      expect(unlocked).toEqual([]);
    });

    it('should unlock FIRST_STORY with 1 story listened', () => {
      const unlocked = checkMilestoneUnlocks({
        totalStoriesListened: 1,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
      });

      expect(unlocked).toContain('FIRST_STORY');
      expect(unlocked).toHaveLength(1);
    });

    it('should unlock multiple story milestones progressively', () => {
      const unlocked = checkMilestoneUnlocks({
        totalStoriesListened: 10,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
      });

      expect(unlocked).toContain('FIRST_STORY');
      expect(unlocked).toContain('STORIES_5');
      expect(unlocked).toContain('STORIES_10');
      expect(unlocked).not.toContain('STORIES_25');
      expect(unlocked).toHaveLength(3);
    });

    it('should unlock listening time milestones', () => {
      const unlocked = checkMilestoneUnlocks({
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 18000, // 5 hours
        currentStreak: 0,
        longestStreak: 0,
      });

      expect(unlocked).toContain('LISTENING_1H');
      expect(unlocked).toContain('LISTENING_5H');
      expect(unlocked).not.toContain('LISTENING_10H');
    });

    it('should unlock streak milestones based on current streak', () => {
      const unlocked = checkMilestoneUnlocks({
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 7,
        longestStreak: 7,
      });

      expect(unlocked).toContain('STREAK_7');
      expect(unlocked).not.toContain('STREAK_30');
    });

    it('should unlock streak milestones based on longest streak even if current is lower', () => {
      const unlocked = checkMilestoneUnlocks({
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 2,
        longestStreak: 10,
      });

      expect(unlocked).toContain('STREAK_7');
      expect(unlocked).not.toContain('STREAK_30');
    });

    it('should unlock milestones across all categories', () => {
      const unlocked = checkMilestoneUnlocks({
        totalStoriesListened: 50,
        totalListeningTimeSeconds: 36000, // 10 hours
        currentStreak: 30,
        longestStreak: 30,
      });

      // All milestones should be unlocked
      expect(unlocked).toContain('FIRST_STORY');
      expect(unlocked).toContain('STORIES_5');
      expect(unlocked).toContain('STORIES_10');
      expect(unlocked).toContain('STORIES_25');
      expect(unlocked).toContain('STORIES_50');
      expect(unlocked).toContain('LISTENING_1H');
      expect(unlocked).toContain('LISTENING_5H');
      expect(unlocked).toContain('LISTENING_10H');
      expect(unlocked).toContain('STREAK_7');
      expect(unlocked).toContain('STREAK_30');
      expect(unlocked).toHaveLength(MILESTONE_DEFINITIONS.length);
    });

    it('should unlock milestones when exactly meeting targets', () => {
      const unlocked = checkMilestoneUnlocks({
        totalStoriesListened: 5,
        totalListeningTimeSeconds: 3600,
        currentStreak: 7,
        longestStreak: 7,
      });

      expect(unlocked).toContain('STORIES_5');
      expect(unlocked).toContain('LISTENING_1H');
      expect(unlocked).toContain('STREAK_7');
    });

    it('should not unlock milestones when one below target', () => {
      const unlocked = checkMilestoneUnlocks({
        totalStoriesListened: 4,
        totalListeningTimeSeconds: 3599,
        currentStreak: 6,
        longestStreak: 6,
      });

      expect(unlocked).not.toContain('STORIES_5');
      expect(unlocked).not.toContain('LISTENING_1H');
      expect(unlocked).not.toContain('STREAK_7');
    });
  });

  describe('calculateMilestoneProgress', () => {
    it('should return null for non-existent milestone', () => {
      const progress = calculateMilestoneProgress('NON_EXISTENT', {
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
      });

      expect(progress).toBeNull();
    });

    it('should calculate progress for story milestone', () => {
      const progress = calculateMilestoneProgress('STORIES_10', {
        totalStoriesListened: 7,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
      });

      expect(progress).toEqual({
        current: 7,
        target: 10,
        percentage: 70,
      });
    });

    it('should calculate progress for listening time milestone', () => {
      const progress = calculateMilestoneProgress('LISTENING_5H', {
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 9000, // 2.5 hours
        currentStreak: 0,
        longestStreak: 0,
      });

      expect(progress).toEqual({
        current: 9000,
        target: 18000,
        percentage: 50,
      });
    });

    it('should calculate progress for streak milestone using current streak', () => {
      const progress = calculateMilestoneProgress('STREAK_7', {
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 5,
        longestStreak: 3,
      });

      expect(progress).toEqual({
        current: 5,
        target: 7,
        percentage: 71, // Math.round(5/7 * 100) = 71
      });
    });

    it('should calculate progress for streak milestone using longest streak if higher', () => {
      const progress = calculateMilestoneProgress('STREAK_7', {
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 3,
        longestStreak: 5,
      });

      expect(progress).toEqual({
        current: 5,
        target: 7,
        percentage: 71,
      });
    });

    it('should cap percentage at 100 when target is met', () => {
      const progress = calculateMilestoneProgress('FIRST_STORY', {
        totalStoriesListened: 10,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
      });

      expect(progress).toEqual({
        current: 10,
        target: 1,
        percentage: 100,
      });
    });

    it('should return 0% for no progress', () => {
      const progress = calculateMilestoneProgress('STORIES_50', {
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
      });

      expect(progress).toEqual({
        current: 0,
        target: 50,
        percentage: 0,
      });
    });

    it('should round percentages correctly', () => {
      // 1/3 = 33.33... should round to 33
      const progress1 = calculateMilestoneProgress('STORIES_5', {
        totalStoriesListened: 1,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
      });
      expect(progress1?.percentage).toBe(20);

      // 2/3 = 66.66... should round to 67
      const progress2 = calculateMilestoneProgress('STREAK_7', {
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 5,
        longestStreak: 5,
      });
      expect(progress2?.percentage).toBe(71);
    });
  });
});
