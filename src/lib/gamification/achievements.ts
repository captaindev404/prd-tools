/**
 * Achievements - Track special accomplishments and milestones
 *
 * Achievement Types:
 * - Streak: Consecutive activity streaks
 * - Milestone: Reaching significant thresholds
 * - Special: Unique accomplishments
 */

import { prisma } from '@/lib/prisma';
import { awardPoints } from './points-engine';

export type AchievementCategory = 'streak' | 'milestone' | 'special';

/**
 * Default achievement definitions
 */
export const DEFAULT_ACHIEVEMENTS = [
  // Streak achievements
  {
    key: 'streak_7day',
    name: '7-Day Streak',
    description: 'Engaged with the platform for 7 consecutive days',
    category: 'streak' as AchievementCategory,
    requirement: JSON.stringify({ consecutiveDays: 7 }),
    points: 100,
    hidden: false,
  },
  {
    key: 'streak_30day',
    name: '30-Day Streak',
    description: 'Engaged with the platform for 30 consecutive days',
    category: 'streak' as AchievementCategory,
    requirement: JSON.stringify({ consecutiveDays: 30 }),
    points: 500,
    hidden: false,
  },
  {
    key: 'streak_100day',
    name: '100-Day Streak',
    description: 'Engaged with the platform for 100 consecutive days',
    category: 'streak' as AchievementCategory,
    requirement: JSON.stringify({ consecutiveDays: 100 }),
    points: 2000,
    hidden: false,
  },

  // Milestone achievements
  {
    key: 'milestone_level5',
    name: 'Level 5 Reached',
    description: 'Reached Level 5',
    category: 'milestone' as AchievementCategory,
    requirement: JSON.stringify({ level: 5 }),
    points: 200,
    hidden: false,
  },
  {
    key: 'milestone_level10',
    name: 'Level 10 Reached',
    description: 'Reached Level 10',
    category: 'milestone' as AchievementCategory,
    requirement: JSON.stringify({ level: 10 }),
    points: 500,
    hidden: false,
  },
  {
    key: 'milestone_1000points',
    name: 'Point Master',
    description: 'Earned 1,000 total points',
    category: 'milestone' as AchievementCategory,
    requirement: JSON.stringify({ totalPoints: 1000 }),
    points: 250,
    hidden: false,
  },
  {
    key: 'milestone_10000points',
    name: 'Point Legend',
    description: 'Earned 10,000 total points',
    category: 'milestone' as AchievementCategory,
    requirement: JSON.stringify({ totalPoints: 10000 }),
    points: 1000,
    hidden: false,
  },

  // Special achievements
  {
    key: 'special_first_feedback',
    name: 'First Steps',
    description: 'Submitted your first feedback',
    category: 'special' as AchievementCategory,
    requirement: JSON.stringify({ feedbackCount: 1 }),
    points: 25,
    hidden: false,
  },
  {
    key: 'special_first_vote',
    name: 'Voice Heard',
    description: 'Cast your first vote',
    category: 'special' as AchievementCategory,
    requirement: JSON.stringify({ voteCount: 1 }),
    points: 10,
    hidden: false,
  },
  {
    key: 'special_first_questionnaire',
    name: 'Research Pioneer',
    description: 'Completed your first questionnaire',
    category: 'special' as AchievementCategory,
    requirement: JSON.stringify({ questionnaireCount: 1 }),
    points: 50,
    hidden: false,
  },
  {
    key: 'special_early_adopter',
    name: 'Early Adopter',
    description: 'One of the first 100 users on the platform',
    category: 'special' as AchievementCategory,
    requirement: JSON.stringify({ earlyUser: true }),
    points: 100,
    hidden: true, // Secret achievement
  },
  {
    key: 'special_all_badges',
    name: 'Badge Collector',
    description: 'Earned all available badges',
    category: 'special' as AchievementCategory,
    requirement: JSON.stringify({ allBadges: true }),
    points: 1000,
    hidden: true, // Secret achievement
  },
];

/**
 * Seed achievements into database (run once during setup)
 */
export async function seedAchievements() {
  for (const achievement of DEFAULT_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      create: achievement,
      update: achievement,
    });
  }
}

/**
 * Check and award achievements for a user
 */
export async function checkAndAwardAchievements(userId: string) {
  const awardedAchievements: string[] = [];

  // Get user stats
  const userStats = await getUserStats(userId);

  // Get all achievements
  const achievements = await prisma.achievement.findMany();

  for (const achievement of achievements) {
    const requirement = JSON.parse(achievement.requirement);

    // Check if user already has this achievement
    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    // Check if requirement is met
    const isMet = checkRequirement(requirement, userStats);

    if (!userAchievement) {
      // Create new achievement tracking
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: JSON.stringify(userStats),
          earnedAt: isMet ? new Date() : null,
        },
      });

      if (isMet) {
        await awardAchievement(userId, achievement.id, achievement.points);
        awardedAchievements.push(achievement.key);
      }
    } else if (!userAchievement.earnedAt && isMet) {
      // Update existing achievement to earned
      await prisma.userAchievement.update({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        data: {
          progress: JSON.stringify(userStats),
          earnedAt: new Date(),
        },
      });

      await awardAchievement(userId, achievement.id, achievement.points);
      awardedAchievements.push(achievement.key);
    } else if (!userAchievement.earnedAt) {
      // Update progress
      await prisma.userAchievement.update({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        data: {
          progress: JSON.stringify(userStats),
        },
      });
    }
  }

  return awardedAchievements;
}

/**
 * Check if requirement is met
 */
function checkRequirement(requirement: any, userStats: any): boolean {
  if (requirement.consecutiveDays) {
    return userStats.consecutiveDays >= requirement.consecutiveDays;
  }

  if (requirement.level) {
    return userStats.level >= requirement.level;
  }

  if (requirement.totalPoints) {
    return userStats.totalPoints >= requirement.totalPoints;
  }

  if (requirement.feedbackCount) {
    return userStats.feedbackCount >= requirement.feedbackCount;
  }

  if (requirement.voteCount) {
    return userStats.voteCount >= requirement.voteCount;
  }

  if (requirement.questionnaireCount) {
    return userStats.questionnaireCount >= requirement.questionnaireCount;
  }

  if (requirement.earlyUser) {
    return userStats.earlyUser;
  }

  if (requirement.allBadges) {
    return userStats.allBadges;
  }

  return false;
}

/**
 * Award an achievement to a user
 */
async function awardAchievement(userId: string, achievementId: string, bonusPoints: number) {
  // Award bonus points
  await awardPoints({
    userId,
    action: 'badge_earned', // Reuse badge_earned action for achievements
    resourceId: achievementId,
    resourceType: 'achievement',
    bonusPoints,
  });

  // Get achievement details for notification
  const achievement = await prisma.achievement.findUnique({
    where: { id: achievementId },
  });

  if (achievement) {
    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'achievement_earned',
        title: `Achievement Unlocked: ${achievement.name}`,
        body: `${achievement.description} You earned ${bonusPoints} bonus points!`,
        link: '/achievements',
      },
    });
  }
}

/**
 * Get user statistics for achievement checking
 */
async function getUserStats(userId: string) {
  const [user, userPoints, feedbackCount, voteCount, questionnaireCount, badgeCount, totalBadges, userCreatedAt] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userPoints.findUnique({ where: { userId } }),
      prisma.feedback.count({ where: { authorId: userId } }),
      prisma.vote.count({ where: { userId } }),
      prisma.questionnaireResponse.count({ where: { respondentId: userId } }),
      prisma.userBadge.count({ where: { userId, earnedAt: { not: null } } }),
      prisma.badge.count(),
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    ]);

  // Calculate consecutive days (simplified - in production, track daily activity)
  const consecutiveDays = await calculateConsecutiveDays(userId);

  // Check if early user (first 100)
  const userRank = await prisma.user.count({
    where: {
      createdAt: {
        lt: userCreatedAt?.createdAt || new Date(),
      },
    },
  });

  return {
    level: userPoints?.level || 1,
    totalPoints: userPoints?.totalPoints || 0,
    feedbackCount,
    voteCount,
    questionnaireCount,
    consecutiveDays,
    earlyUser: userRank < 100,
    allBadges: badgeCount === totalBadges && totalBadges > 0,
  };
}

/**
 * Calculate consecutive days of activity
 * This is a simplified version - in production, track daily activity in a separate table
 */
async function calculateConsecutiveDays(userId: string): Promise<number> {
  // Get recent point transactions
  const recentActivity = await prisma.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 365, // Last year
  });

  if (recentActivity.length === 0) {
    return 0;
  }

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() - 1); // Start from yesterday

  // Check consecutive days backwards
  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const hasActivity = recentActivity.some((activity) => {
      const activityDate = new Date(activity.createdAt);
      return activityDate >= dayStart && activityDate <= dayEnd;
    });

    if (hasActivity) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(userId: string) {
  return prisma.userAchievement.findMany({
    where: {
      userId,
      earnedAt: { not: null },
    },
    include: {
      achievement: true,
    },
    orderBy: { earnedAt: 'desc' },
  });
}

/**
 * Get user's achievement progress
 */
export async function getUserAchievementProgress(userId: string, category?: AchievementCategory) {
  const where = category ? { achievement: { category } } : {};

  return prisma.userAchievement.findMany({
    where: {
      userId,
      ...where,
    },
    include: {
      achievement: true,
    },
    orderBy: [
      { earnedAt: { sort: 'desc', nulls: 'last' } },
      { achievement: { points: 'desc' } },
    ],
  });
}

/**
 * Get all achievements (including hidden ones for admins)
 */
export async function getAllAchievements(includeHidden: boolean = false) {
  return prisma.achievement.findMany({
    where: includeHidden ? undefined : { hidden: false },
    orderBy: [{ category: 'asc' }, { points: 'asc' }],
  });
}

/**
 * Get achievement statistics
 */
export async function getAchievementStats() {
  const totalAchievements = await prisma.achievement.count();
  const earnedAchievements = await prisma.userAchievement.count({
    where: { earnedAt: { not: null } },
  });

  // Get rarest achievements
  const rarest = await prisma.userAchievement.groupBy({
    by: ['achievementId'],
    where: { earnedAt: { not: null } },
    _count: { achievementId: true },
    orderBy: { _count: { achievementId: 'asc' } },
    take: 5,
  });

  const rarestAchievements = await Promise.all(
    rarest.map(async (item) => {
      const achievement = await prisma.achievement.findUnique({
        where: { id: item.achievementId },
      });
      return {
        achievement,
        count: item._count.achievementId,
      };
    })
  );

  return {
    totalAchievements,
    earnedAchievements,
    rarestAchievements,
  };
}
