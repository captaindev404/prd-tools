/**
 * Milestone Definitions
 *
 * Defines all available milestones for Reading Journey gamification.
 * Each milestone has an ID, display metadata, and unlock criteria.
 */

export enum MilestoneCategory {
  STORIES = 'stories',
  LISTENING_TIME = 'listening_time',
  STREAKS = 'streaks',
}

export interface MilestoneDefinition {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  target: number; // Target value to unlock (stories count, seconds, or days)
  emoji?: string; // Optional emoji for visual representation
  order: number; // Display order within category
}

/**
 * All milestone definitions
 * Organized by category: Stories, Listening Time, Streaks
 */
export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  // Stories Milestones
  {
    id: 'FIRST_STORY',
    category: MilestoneCategory.STORIES,
    title: 'First Story',
    description: 'Listen to your first story',
    target: 1,
    emoji: '📖',
    order: 1,
  },
  {
    id: 'STORIES_5',
    category: MilestoneCategory.STORIES,
    title: 'Story Explorer',
    description: 'Listen to 5 stories',
    target: 5,
    emoji: '🌟',
    order: 2,
  },
  {
    id: 'STORIES_10',
    category: MilestoneCategory.STORIES,
    title: 'Story Enthusiast',
    description: 'Listen to 10 stories',
    target: 10,
    emoji: '🎭',
    order: 3,
  },
  {
    id: 'STORIES_25',
    category: MilestoneCategory.STORIES,
    title: 'Story Connoisseur',
    description: 'Listen to 25 stories',
    target: 25,
    emoji: '🏆',
    order: 4,
  },
  {
    id: 'STORIES_50',
    category: MilestoneCategory.STORIES,
    title: 'Story Master',
    description: 'Listen to 50 stories',
    target: 50,
    emoji: '👑',
    order: 5,
  },

  // Listening Time Milestones (in seconds)
  {
    id: 'LISTENING_1H',
    category: MilestoneCategory.LISTENING_TIME,
    title: 'One Hour of Stories',
    description: 'Listen to 1 hour of stories',
    target: 3600, // 1 hour in seconds
    emoji: '⏰',
    order: 1,
  },
  {
    id: 'LISTENING_5H',
    category: MilestoneCategory.LISTENING_TIME,
    title: 'Five Hours of Stories',
    description: 'Listen to 5 hours of stories',
    target: 18000, // 5 hours in seconds
    emoji: '⌛',
    order: 2,
  },
  {
    id: 'LISTENING_10H',
    category: MilestoneCategory.LISTENING_TIME,
    title: 'Ten Hours of Stories',
    description: 'Listen to 10 hours of stories',
    target: 36000, // 10 hours in seconds
    emoji: '🕰️',
    order: 3,
  },

  // Streak Milestones (in days)
  {
    id: 'STREAK_7',
    category: MilestoneCategory.STREAKS,
    title: 'Week Streak',
    description: 'Listen to stories for 7 days in a row',
    target: 7,
    emoji: '🔥',
    order: 1,
  },
  {
    id: 'STREAK_30',
    category: MilestoneCategory.STREAKS,
    title: 'Month Streak',
    description: 'Listen to stories for 30 days in a row',
    target: 30,
    emoji: '🌈',
    order: 2,
  },
];

/**
 * Get milestone definition by ID
 */
export function getMilestoneById(milestoneId: string): MilestoneDefinition | undefined {
  return MILESTONE_DEFINITIONS.find((m) => m.id === milestoneId);
}

/**
 * Get all milestones by category
 */
export function getMilestonesByCategory(category: MilestoneCategory): MilestoneDefinition[] {
  return MILESTONE_DEFINITIONS.filter((m) => m.category === category).sort(
    (a, b) => a.order - b.order
  );
}

/**
 * Check which milestones should be unlocked based on user stats
 *
 * @param stats - User analytics cache with totalStoriesListened, totalListeningTimeSeconds, currentStreak, longestStreak
 * @returns Array of milestone IDs that should be unlocked
 */
export function checkMilestoneUnlocks(stats: {
  totalStoriesListened: number;
  totalListeningTimeSeconds: number;
  currentStreak: number;
  longestStreak: number;
}): string[] {
  const unlockedMilestones: string[] = [];

  for (const milestone of MILESTONE_DEFINITIONS) {
    let isUnlocked = false;

    switch (milestone.category) {
      case MilestoneCategory.STORIES:
        isUnlocked = stats.totalStoriesListened >= milestone.target;
        break;

      case MilestoneCategory.LISTENING_TIME:
        isUnlocked = stats.totalListeningTimeSeconds >= milestone.target;
        break;

      case MilestoneCategory.STREAKS:
        // Check both current and longest streak (once achieved, always unlocked)
        isUnlocked =
          stats.currentStreak >= milestone.target ||
          stats.longestStreak >= milestone.target;
        break;
    }

    if (isUnlocked) {
      unlockedMilestones.push(milestone.id);
    }
  }

  return unlockedMilestones;
}

/**
 * Calculate progress towards a specific milestone
 *
 * @param milestoneId - Milestone ID
 * @param stats - User analytics cache
 * @returns Progress object with current value and percentage
 */
export function calculateMilestoneProgress(
  milestoneId: string,
  stats: {
    totalStoriesListened: number;
    totalListeningTimeSeconds: number;
    currentStreak: number;
    longestStreak: number;
  }
): { current: number; target: number; percentage: number } | null {
  const milestone = getMilestoneById(milestoneId);
  if (!milestone) return null;

  let current = 0;

  switch (milestone.category) {
    case MilestoneCategory.STORIES:
      current = stats.totalStoriesListened;
      break;

    case MilestoneCategory.LISTENING_TIME:
      current = stats.totalListeningTimeSeconds;
      break;

    case MilestoneCategory.STREAKS:
      // Use the higher of current or longest streak
      current = Math.max(stats.currentStreak, stats.longestStreak);
      break;
  }

  const percentage = Math.min((current / milestone.target) * 100, 100);

  return {
    current,
    target: milestone.target,
    percentage: Math.round(percentage),
  };
}
