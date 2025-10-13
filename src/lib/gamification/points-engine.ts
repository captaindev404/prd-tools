/**
 * Points Engine - Award and manage user points for gamification
 *
 * Point System:
 * - Submit feedback: +10 points
 * - Vote on feedback: +2 points
 * - Respond to questionnaire: +15 points
 * - Participate in session: +30 points
 * - Quality contribution bonus: +5 points
 */

import { prisma } from '@/lib/prisma';

export type PointAction =
  | 'submit_feedback'
  | 'vote'
  | 'questionnaire_response'
  | 'session_participation'
  | 'quality_bonus'
  | 'badge_earned';

export type PointCategory =
  | 'feedback'
  | 'voting'
  | 'research'
  | 'quality'
  | 'bonus';

const POINT_VALUES: Record<PointAction, { points: number; category: PointCategory }> = {
  submit_feedback: { points: 10, category: 'feedback' },
  vote: { points: 2, category: 'voting' },
  questionnaire_response: { points: 15, category: 'research' },
  session_participation: { points: 30, category: 'research' },
  quality_bonus: { points: 5, category: 'quality' },
  badge_earned: { points: 0, category: 'bonus' }, // Points determined by badge
};

// Level thresholds (exponential growth)
const LEVEL_THRESHOLDS = [
  100,   // Level 1 -> 2
  250,   // Level 2 -> 3
  500,   // Level 3 -> 4
  1000,  // Level 4 -> 5
  2000,  // Level 5 -> 6
  3500,  // Level 6 -> 7
  5500,  // Level 7 -> 8
  8000,  // Level 8 -> 9
  11000, // Level 9 -> 10
  15000, // Level 10+
];

/**
 * Award points to a user for an action
 */
export async function awardPoints(params: {
  userId: string;
  action: PointAction;
  resourceId?: string;
  resourceType?: string;
  bonusPoints?: number; // For badge earned
  metadata?: Record<string, any>;
}) {
  const { userId, action, resourceId, resourceType, bonusPoints, metadata } = params;

  const config = POINT_VALUES[action];
  const points = action === 'badge_earned' ? (bonusPoints || 0) : config.points;

  // Create point transaction
  await prisma.pointTransaction.create({
    data: {
      userId,
      points,
      category: config.category,
      action,
      resourceId,
      resourceType,
      metadata: JSON.stringify(metadata || {}),
    },
  });

  // Update user points
  const userPoints = await prisma.userPoints.upsert({
    where: { userId },
    create: {
      userId,
      feedbackPoints: config.category === 'feedback' ? points : 0,
      votingPoints: config.category === 'voting' ? points : 0,
      researchPoints: config.category === 'research' ? points : 0,
      qualityPoints: config.category === 'quality' ? points : 0,
      totalPoints: points,
      weeklyPoints: points,
      monthlyPoints: points,
      level: 1,
      nextLevelThreshold: LEVEL_THRESHOLDS[0],
    },
    update: {
      feedbackPoints: {
        increment: config.category === 'feedback' ? points : 0,
      },
      votingPoints: {
        increment: config.category === 'voting' ? points : 0,
      },
      researchPoints: {
        increment: config.category === 'research' ? points : 0,
      },
      qualityPoints: {
        increment: config.category === 'quality' ? points : 0,
      },
      totalPoints: {
        increment: points,
      },
      weeklyPoints: {
        increment: points,
      },
      monthlyPoints: {
        increment: points,
      },
    },
  });

  // Check for level up
  const updatedPoints = userPoints.totalPoints + points;
  const currentLevel = userPoints.level;
  const newLevel = calculateLevel(updatedPoints);

  if (newLevel > currentLevel) {
    await prisma.userPoints.update({
      where: { userId },
      data: {
        level: newLevel,
        nextLevelThreshold: LEVEL_THRESHOLDS[newLevel - 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1],
      },
    });

    // TODO: Send level up notification
    await createLevelUpNotification(userId, newLevel);
  }

  return {
    pointsAwarded: points,
    totalPoints: updatedPoints,
    level: newLevel,
    leveledUp: newLevel > currentLevel,
  };
}

/**
 * Calculate user level based on total points
 */
export function calculateLevel(totalPoints: number): number {
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalPoints < LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return LEVEL_THRESHOLDS.length + 1;
}

/**
 * Get user points summary
 */
export async function getUserPoints(userId: string) {
  const userPoints = await prisma.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    return {
      totalPoints: 0,
      feedbackPoints: 0,
      votingPoints: 0,
      researchPoints: 0,
      qualityPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      level: 1,
      nextLevelThreshold: LEVEL_THRESHOLDS[0],
      pointsToNextLevel: LEVEL_THRESHOLDS[0],
    };
  }

  return {
    ...userPoints,
    pointsToNextLevel: userPoints.nextLevelThreshold - userPoints.totalPoints,
  };
}

/**
 * Get point transaction history
 */
export async function getPointHistory(userId: string, limit: number = 50) {
  return prisma.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Reset weekly points (called by background job)
 */
export async function resetWeeklyPoints() {
  await prisma.userPoints.updateMany({
    data: {
      weeklyPoints: 0,
      lastWeekReset: new Date(),
    },
  });
}

/**
 * Reset monthly points (called by background job)
 */
export async function resetMonthlyPoints() {
  await prisma.userPoints.updateMany({
    data: {
      monthlyPoints: 0,
      lastMonthReset: new Date(),
    },
  });
}

/**
 * Create level up notification
 */
async function createLevelUpNotification(userId: string, newLevel: number) {
  await prisma.notification.create({
    data: {
      userId,
      type: 'level_up',
      title: `Level Up! You're now Level ${newLevel}`,
      body: `Congratulations! You've reached Level ${newLevel}. Keep up the great contributions!`,
      link: '/achievements',
    },
  });
}

/**
 * Get top point earners for leaderboard
 */
export async function getTopPointEarners(params: {
  period: 'weekly' | 'monthly' | 'all_time';
  category?: 'overall' | 'feedback' | 'voting' | 'research';
  limit?: number;
}) {
  const { period, category = 'overall', limit = 10 } = params;

  // Determine which points field to use
  let orderByField: 'totalPoints' | 'weeklyPoints' | 'monthlyPoints' = 'totalPoints';
  if (period === 'weekly') orderByField = 'weeklyPoints';
  if (period === 'monthly') orderByField = 'monthlyPoints';

  // Get top users
  const topUsers = await prisma.userPoints.findMany({
    where: category !== 'overall' ? {} : undefined, // TODO: Add category filtering
    orderBy: { [orderByField]: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });

  return topUsers.map((userPoint, index) => ({
    rank: index + 1,
    userId: userPoint.userId,
    displayName: userPoint.user.displayName || 'Anonymous',
    avatarUrl: userPoint.user.avatarUrl,
    role: userPoint.user.role,
    points: period === 'weekly'
      ? userPoint.weeklyPoints
      : period === 'monthly'
        ? userPoint.monthlyPoints
        : userPoint.totalPoints,
    level: userPoint.level,
  }));
}

/**
 * Get user rank in leaderboard
 */
export async function getUserRank(userId: string, period: 'weekly' | 'monthly' | 'all_time') {
  let orderByField: 'totalPoints' | 'weeklyPoints' | 'monthlyPoints' = 'totalPoints';
  if (period === 'weekly') orderByField = 'weeklyPoints';
  if (period === 'monthly') orderByField = 'monthlyPoints';

  const userPoints = await prisma.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    return null;
  }

  const userScore = userPoints[orderByField];

  // Count users with higher scores
  const rank = await prisma.userPoints.count({
    where: {
      [orderByField]: {
        gt: userScore,
      },
    },
  });

  return rank + 1;
}
