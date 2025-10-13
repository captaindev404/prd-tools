/**
 * Badge Engine - Check and award badges to users
 *
 * Badge Tiers:
 * - Bronze: 10 contributions
 * - Silver: 50 contributions
 * - Gold: 100 contributions
 * - Platinum: 500 contributions
 */

import { prisma } from '@/lib/prisma';
import { awardPoints } from './points-engine';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type BadgeCategory = 'feedback' | 'voting' | 'research' | 'engagement';

/**
 * Default badge definitions
 */
export const DEFAULT_BADGES = [
  // Feedback badges
  {
    key: 'feedback_bronze',
    name: 'Feedback Contributor',
    description: 'Submitted 10 feedback items',
    tier: 'bronze' as BadgeTier,
    category: 'feedback' as BadgeCategory,
    requirement: 10,
    points: 50,
  },
  {
    key: 'feedback_silver',
    name: 'Feedback Champion',
    description: 'Submitted 50 feedback items',
    tier: 'silver' as BadgeTier,
    category: 'feedback' as BadgeCategory,
    requirement: 50,
    points: 200,
  },
  {
    key: 'feedback_gold',
    name: 'Feedback Expert',
    description: 'Submitted 100 feedback items',
    tier: 'gold' as BadgeTier,
    category: 'feedback' as BadgeCategory,
    requirement: 100,
    points: 500,
  },
  {
    key: 'feedback_platinum',
    name: 'Feedback Legend',
    description: 'Submitted 500 feedback items',
    tier: 'platinum' as BadgeTier,
    category: 'feedback' as BadgeCategory,
    requirement: 500,
    points: 2000,
  },

  // Voting badges
  {
    key: 'voting_bronze',
    name: 'Active Voter',
    description: 'Voted on 10 feedback items',
    tier: 'bronze' as BadgeTier,
    category: 'voting' as BadgeCategory,
    requirement: 10,
    points: 30,
  },
  {
    key: 'voting_silver',
    name: 'Community Voice',
    description: 'Voted on 50 feedback items',
    tier: 'silver' as BadgeTier,
    category: 'voting' as BadgeCategory,
    requirement: 50,
    points: 150,
  },
  {
    key: 'voting_gold',
    name: 'Voting Expert',
    description: 'Voted on 100 feedback items',
    tier: 'gold' as BadgeTier,
    category: 'voting' as BadgeCategory,
    requirement: 100,
    points: 300,
  },
  {
    key: 'voting_platinum',
    name: 'Voting Legend',
    description: 'Voted on 500 feedback items',
    tier: 'platinum' as BadgeTier,
    category: 'voting' as BadgeCategory,
    requirement: 500,
    points: 1000,
  },

  // Research badges
  {
    key: 'research_bronze',
    name: 'Research Participant',
    description: 'Participated in 10 research activities',
    tier: 'bronze' as BadgeTier,
    category: 'research' as BadgeCategory,
    requirement: 10,
    points: 100,
  },
  {
    key: 'research_silver',
    name: 'Research Contributor',
    description: 'Participated in 50 research activities',
    tier: 'silver' as BadgeTier,
    category: 'research' as BadgeCategory,
    requirement: 50,
    points: 400,
  },
  {
    key: 'research_gold',
    name: 'Research Expert',
    description: 'Participated in 100 research activities',
    tier: 'gold' as BadgeTier,
    category: 'research' as BadgeCategory,
    requirement: 100,
    points: 800,
  },
  {
    key: 'research_platinum',
    name: 'Research Legend',
    description: 'Participated in 500 research activities',
    tier: 'platinum' as BadgeTier,
    category: 'research' as BadgeCategory,
    requirement: 500,
    points: 3000,
  },

  // Engagement badges
  {
    key: 'engagement_bronze',
    name: 'Community Member',
    description: 'Engaged with platform 10 times',
    tier: 'bronze' as BadgeTier,
    category: 'engagement' as BadgeCategory,
    requirement: 10,
    points: 25,
  },
  {
    key: 'engagement_silver',
    name: 'Active Community Member',
    description: 'Engaged with platform 50 times',
    tier: 'silver' as BadgeTier,
    category: 'engagement' as BadgeCategory,
    requirement: 50,
    points: 100,
  },
  {
    key: 'engagement_gold',
    name: 'Community Leader',
    description: 'Engaged with platform 100 times',
    tier: 'gold' as BadgeTier,
    category: 'engagement' as BadgeCategory,
    requirement: 100,
    points: 250,
  },
  {
    key: 'engagement_platinum',
    name: 'Community Champion',
    description: 'Engaged with platform 500 times',
    tier: 'platinum' as BadgeTier,
    category: 'engagement' as BadgeCategory,
    requirement: 500,
    points: 1500,
  },
];

/**
 * Seed badges into database (run once during setup)
 */
export async function seedBadges() {
  for (const badge of DEFAULT_BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      create: badge,
      update: badge,
    });
  }
}

/**
 * Check and award badges for a user
 */
export async function checkAndAwardBadges(userId: string, category: BadgeCategory) {
  // Get user's activity counts
  const counts = await getUserActivityCounts(userId);

  // Get relevant count for category
  let activityCount = 0;
  switch (category) {
    case 'feedback':
      activityCount = counts.feedbackCount;
      break;
    case 'voting':
      activityCount = counts.voteCount;
      break;
    case 'research':
      activityCount = counts.questionnaireCount + counts.sessionCount;
      break;
    case 'engagement':
      activityCount = counts.feedbackCount + counts.voteCount + counts.questionnaireCount;
      break;
  }

  // Get all badges for this category
  const badges = await prisma.badge.findMany({
    where: { category },
    orderBy: { requirement: 'asc' },
  });

  const awardedBadges: string[] = [];

  // Check each badge
  for (const badge of badges) {
    // Check if user already has this badge
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
    });

    if (!userBadge) {
      // Create progress tracking
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          progress: activityCount,
          earnedAt: activityCount >= badge.requirement ? new Date() : null,
        },
      });

      // Award badge if requirement met
      if (activityCount >= badge.requirement) {
        await awardBadge(userId, badge.id, badge.points);
        awardedBadges.push(badge.key);
      }
    } else if (!userBadge.earnedAt && activityCount >= badge.requirement) {
      // Update existing badge to earned
      await prisma.userBadge.update({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id,
          },
        },
        data: {
          progress: activityCount,
          earnedAt: new Date(),
        },
      });

      await awardBadge(userId, badge.id, badge.points);
      awardedBadges.push(badge.key);
    } else if (userBadge.earnedAt === null) {
      // Update progress for unearnerd badges
      await prisma.userBadge.update({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id,
          },
        },
        data: {
          progress: activityCount,
        },
      });
    }
  }

  return awardedBadges;
}

/**
 * Award a badge to a user
 */
async function awardBadge(userId: string, badgeId: string, bonusPoints: number) {
  // Award bonus points for earning the badge
  await awardPoints({
    userId,
    action: 'badge_earned',
    resourceId: badgeId,
    resourceType: 'badge',
    bonusPoints,
  });

  // Get badge details for notification
  const badge = await prisma.badge.findUnique({
    where: { id: badgeId },
  });

  if (badge) {
    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'badge_earned',
        title: `Badge Earned: ${badge.name}`,
        body: `Congratulations! You've earned the ${badge.name} badge. ${badge.description}`,
        link: '/achievements',
      },
    });
  }
}

/**
 * Get user's activity counts
 */
async function getUserActivityCounts(userId: string) {
  const [feedbackCount, voteCount, questionnaireCount, sessionCount] = await Promise.all([
    prisma.feedback.count({ where: { authorId: userId } }),
    prisma.vote.count({ where: { userId } }),
    prisma.questionnaireResponse.count({ where: { respondentId: userId } }),
    prisma.session.count({
      where: {
        OR: [
          { facilitatorIds: { contains: userId } },
          { participantIds: { contains: userId } },
        ],
      },
    }),
  ]);

  return {
    feedbackCount,
    voteCount,
    questionnaireCount,
    sessionCount,
  };
}

/**
 * Get user's badges
 */
export async function getUserBadges(userId: string) {
  return prisma.userBadge.findMany({
    where: {
      userId,
      earnedAt: { not: null },
    },
    include: {
      badge: true,
    },
    orderBy: { earnedAt: 'desc' },
  });
}

/**
 * Get user's badge progress
 */
export async function getUserBadgeProgress(userId: string, category?: BadgeCategory) {
  const where = category ? { badge: { category } } : {};

  return prisma.userBadge.findMany({
    where: {
      userId,
      ...where,
    },
    include: {
      badge: true,
    },
    orderBy: [
      { earnedAt: { sort: 'desc', nulls: 'last' } },
      { badge: { requirement: 'asc' } },
    ],
  });
}

/**
 * Get all available badges
 */
export async function getAllBadges(category?: BadgeCategory) {
  return prisma.badge.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: 'asc' }, { requirement: 'asc' }],
  });
}

/**
 * Get badge statistics
 */
export async function getBadgeStats() {
  const totalBadges = await prisma.badge.count();
  const earnedBadges = await prisma.userBadge.count({
    where: { earnedAt: { not: null } },
  });

  // Get most earned badges
  const mostEarned = await prisma.userBadge.groupBy({
    by: ['badgeId'],
    where: { earnedAt: { not: null } },
    _count: { badgeId: true },
    orderBy: { _count: { badgeId: 'desc' } },
    take: 5,
  });

  const mostEarnedBadges = await Promise.all(
    mostEarned.map(async (item) => {
      const badge = await prisma.badge.findUnique({ where: { id: item.badgeId } });
      return {
        badge,
        count: item._count.badgeId,
      };
    })
  );

  return {
    totalBadges,
    earnedBadges,
    mostEarnedBadges,
  };
}
