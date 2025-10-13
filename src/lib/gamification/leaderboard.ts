/**
 * Leaderboard - Calculate and manage user rankings
 *
 * Leaderboard Types:
 * - Weekly top contributors
 * - Monthly top contributors
 * - All-time rankings
 * - Category-specific (feedback, research, voting)
 */

import { prisma } from '@/lib/prisma';

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';
export type LeaderboardCategory = 'overall' | 'feedback' | 'voting' | 'research';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  points: number;
  level: number;
}

/**
 * Get leaderboard rankings
 */
export async function getLeaderboard(params: {
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const { period, category, limit = 50 } = params;

  // Check if we have a recent snapshot
  const recentSnapshot = await getRecentSnapshot(period, category);
  if (recentSnapshot) {
    return JSON.parse(recentSnapshot.rankings);
  }

  // Calculate fresh rankings
  const rankings = await calculateRankings(period, category, limit);

  // Save snapshot for future queries
  await saveSnapshot(period, category, rankings);

  return rankings;
}

/**
 * Calculate fresh rankings
 */
async function calculateRankings(
  period: LeaderboardPeriod,
  category: LeaderboardCategory,
  limit: number
): Promise<LeaderboardEntry[]> {
  // Determine which points field to use
  let pointsField: 'totalPoints' | 'weeklyPoints' | 'monthlyPoints' = 'totalPoints';
  if (period === 'weekly') pointsField = 'weeklyPoints';
  if (period === 'monthly') pointsField = 'monthlyPoints';

  // Build category-specific query
  let categoryField: 'feedbackPoints' | 'votingPoints' | 'researchPoints' | null = null;
  if (category === 'feedback') categoryField = 'feedbackPoints';
  if (category === 'voting') categoryField = 'votingPoints';
  if (category === 'research') categoryField = 'researchPoints';

  // Get top users
  const userPoints = await prisma.userPoints.findMany({
    orderBy: categoryField
      ? { [categoryField]: 'desc' }
      : { [pointsField]: 'desc' },
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

  return userPoints.map((up, index) => ({
    rank: index + 1,
    userId: up.userId,
    displayName: up.user.displayName || 'Anonymous',
    avatarUrl: up.user.avatarUrl,
    role: up.user.role,
    points: categoryField
      ? up[categoryField]
      : period === 'weekly'
        ? up.weeklyPoints
        : period === 'monthly'
          ? up.monthlyPoints
          : up.totalPoints,
    level: up.level,
  }));
}

/**
 * Get recent snapshot from database
 */
async function getRecentSnapshot(period: LeaderboardPeriod, category: LeaderboardCategory) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour cache

  return prisma.leaderboard.findFirst({
    where: {
      period,
      category,
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Save leaderboard snapshot
 */
async function saveSnapshot(
  period: LeaderboardPeriod,
  category: LeaderboardCategory,
  rankings: LeaderboardEntry[]
) {
  const now = new Date();

  // Calculate period boundaries
  let periodStart: Date;
  let periodEnd: Date;

  if (period === 'weekly') {
    periodStart = getStartOfWeek(now);
    periodEnd = getEndOfWeek(now);
  } else if (period === 'monthly') {
    periodStart = getStartOfMonth(now);
    periodEnd = getEndOfMonth(now);
  } else {
    periodStart = new Date(0); // Beginning of time
    periodEnd = now;
  }

  await prisma.leaderboard.create({
    data: {
      period,
      category,
      rankings: JSON.stringify(rankings),
      periodStart,
      periodEnd,
    },
  });
}

/**
 * Get user's position on leaderboard
 */
export async function getUserLeaderboardPosition(
  userId: string,
  period: LeaderboardPeriod,
  category: LeaderboardCategory
) {
  const leaderboard = await getLeaderboard({ period, category, limit: 1000 });

  const userPosition = leaderboard.find((entry) => entry.userId === userId);

  return userPosition || null;
}

/**
 * Generate weekly leaderboard (called by cron job)
 */
export async function generateWeeklyLeaderboards() {
  const categories: LeaderboardCategory[] = ['overall', 'feedback', 'voting', 'research'];

  for (const category of categories) {
    const rankings = await calculateRankings('weekly', category, 100);
    await saveSnapshot('weekly', category, rankings);
  }
}

/**
 * Generate monthly leaderboard (called by cron job)
 */
export async function generateMonthlyLeaderboards() {
  const categories: LeaderboardCategory[] = ['overall', 'feedback', 'voting', 'research'];

  for (const category of categories) {
    const rankings = await calculateRankings('monthly', category, 100);
    await saveSnapshot('monthly', category, rankings);
  }
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats() {
  const totalParticipants = await prisma.userPoints.count();

  const topWeekly = await prisma.userPoints.findFirst({
    orderBy: { weeklyPoints: 'desc' },
    include: {
      user: {
        select: {
          displayName: true,
        },
      },
    },
  });

  const topMonthly = await prisma.userPoints.findFirst({
    orderBy: { monthlyPoints: 'desc' },
    include: {
      user: {
        select: {
          displayName: true,
        },
      },
    },
  });

  const topAllTime = await prisma.userPoints.findFirst({
    orderBy: { totalPoints: 'desc' },
    include: {
      user: {
        select: {
          displayName: true,
        },
      },
    },
  });

  return {
    totalParticipants,
    topWeekly: topWeekly
      ? {
          displayName: topWeekly.user.displayName || 'Anonymous',
          points: topWeekly.weeklyPoints,
        }
      : null,
    topMonthly: topMonthly
      ? {
          displayName: topMonthly.user.displayName || 'Anonymous',
          points: topMonthly.monthlyPoints,
        }
      : null,
    topAllTime: topAllTime
      ? {
          displayName: topAllTime.user.displayName || 'Anonymous',
          points: topAllTime.totalPoints,
        }
      : null,
  };
}

/**
 * Get nearby users on leaderboard (users around current user's rank)
 */
export async function getNearbyLeaderboard(
  userId: string,
  period: LeaderboardPeriod,
  category: LeaderboardCategory,
  range: number = 5
): Promise<LeaderboardEntry[]> {
  const fullLeaderboard = await getLeaderboard({ period, category, limit: 1000 });

  const userIndex = fullLeaderboard.findIndex((entry) => entry.userId === userId);

  if (userIndex === -1) {
    return [];
  }

  const start = Math.max(0, userIndex - range);
  const end = Math.min(fullLeaderboard.length, userIndex + range + 1);

  return fullLeaderboard.slice(start, end);
}

// Helper functions for date calculations

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  return new Date(d.setDate(diff));
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
