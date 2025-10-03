/**
 * Dashboard Data Fetching Service
 *
 * Centralized service layer for fetching all dashboard-related data.
 * Implements efficient data fetching patterns:
 * - Parallel requests where possible
 * - Proper error handling
 * - Type-safe functions
 * - Optimized database queries
 * - Caching strategies
 *
 * Used by the dashboard page to load user stats, recent activity,
 * trending feedback, roadmap updates, and notifications.
 */

import { prisma } from './prisma';
import type { FeedbackState, RoadmapStage, Role } from '@prisma/client';
import { getOrFetch, CacheTTL, CacheInvalidation } from './cache';

/**
 * Dashboard Statistics
 */
export interface DashboardStats {
  feedbackCount: number;
  feedbackByState: Record<FeedbackState, number>;
  votesGiven: number;
  researchSessionsCount: number;
  activePanelCount: number;
  questionnaireResponsesCount: number;
}

/**
 * Feedback item for dashboard display
 */
export interface DashboardFeedback {
  id: string;
  title: string;
  body: string;
  state: FeedbackState;
  createdAt: Date;
  voteCount: number;
  totalWeight: number;
  author: {
    id: string;
    displayName: string | null;
    email: string;
  };
  feature: {
    id: string;
    title: string;
    area: string;
  } | null;
  userHasVoted?: boolean;
}

/**
 * Roadmap item for dashboard display
 */
export interface DashboardRoadmapItem {
  id: string;
  title: string;
  stage: RoadmapStage;
  description: string | null;
  targetDate: Date | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    displayName: string | null;
  };
  features: Array<{
    id: string;
    title: string;
    area: string;
  }>;
}

/**
 * User notification for dashboard
 */
export interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Get comprehensive dashboard statistics for a user
 *
 * Fetches user activity stats including:
 * - Total feedback submitted
 * - Feedback breakdown by state
 * - Votes cast
 * - Research sessions participated
 * - Active panel memberships
 * - Questionnaire responses
 *
 * @param userId - The user ID
 * @returns Dashboard statistics
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  // Use cache-aside pattern with 1-minute TTL for user stats
  return getOrFetch(
    `dashboard:stats:${userId}`,
    async () => {
      try {
        // Execute all counts in parallel for efficiency
        const [
          feedbackCount,
          feedbackByStateData,
          votesGiven,
          researchSessionsCount,
          activePanelCount,
          questionnaireResponsesCount,
        ] = await Promise.all([
      // Total feedback submitted by user
      prisma.feedback.count({
        where: { authorId: userId },
      }),

      // Feedback grouped by state
      prisma.feedback.groupBy({
        by: ['state'],
        where: { authorId: userId },
        _count: true,
      }),

      // Total votes cast by user
      prisma.vote.count({
        where: { userId },
      }),

      // Research sessions user has participated in (as participant or facilitator)
      prisma.session.count({
        where: {
          OR: [
            { participantIds: { contains: userId } },
            { facilitatorIds: { contains: userId } },
          ],
          status: { in: ['completed', 'in_progress'] },
        },
      }),

      // Active panel memberships
      prisma.panelMembership.count({
        where: {
          userId,
          active: true,
        },
      }),

      // Questionnaire responses submitted
      prisma.questionnaireResponse.count({
        where: { respondentId: userId },
      }),
    ]);

    // Convert feedback by state array to record
    const feedbackByState: Record<FeedbackState, number> = {
      new: 0,
      triaged: 0,
      merged: 0,
      in_roadmap: 0,
      closed: 0,
    };

    feedbackByStateData.forEach((item) => {
      feedbackByState[item.state] = item._count;
    });

        return {
          feedbackCount,
          feedbackByState,
          votesGiven,
          researchSessionsCount,
          activePanelCount,
          questionnaireResponsesCount,
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error('Failed to fetch dashboard statistics');
      }
    },
    CacheTTL.ONE_MINUTE // Cache for 1 minute (highly dynamic data)
  );
}

/**
 * Get user's recent feedback submissions
 *
 * Fetches the most recent feedback submitted by a user,
 * including vote counts and feature information.
 *
 * @param userId - The user ID
 * @param limit - Maximum number of items to return (default: 5)
 * @returns Array of recent feedback items
 */
export async function getUserRecentFeedback(
  userId: string,
  limit: number = 5
): Promise<DashboardFeedback[]> {
  // Cache recent feedback with 1-minute TTL
  return getOrFetch(
    `dashboard:recent-feedback:${userId}:${limit}`,
    async () => {
      try {
        const feedback = await prisma.feedback.findMany({
      where: { authorId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        feature: {
          select: {
            id: true,
            title: true,
            area: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    // Get vote statistics for all feedback in parallel
    const feedbackIds = feedback.map((f) => f.id);

    const [voteStats, userVotes] = await Promise.all([
      // Get total weighted votes for each feedback
      prisma.vote.groupBy({
        by: ['feedbackId'],
        where: { feedbackId: { in: feedbackIds } },
        _sum: {
          decayedWeight: true,
        },
      }),
      // Check which items user has voted on
      prisma.vote.findMany({
        where: {
          userId,
          feedbackId: { in: feedbackIds },
        },
        select: { feedbackId: true },
      }),
    ]);

    // Create lookup maps
    const voteStatsMap = new Map(
      voteStats.map((stat) => [stat.feedbackId, stat._sum.decayedWeight || 0])
    );
    const userVotesMap = new Map(userVotes.map((v) => [v.feedbackId, true]));

        // Combine data
        return feedback.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          state: item.state,
          createdAt: item.createdAt,
          voteCount: item._count.votes,
          totalWeight: voteStatsMap.get(item.id) || 0,
          author: item.author,
          feature: item.feature,
          userHasVoted: userVotesMap.get(item.id) || false,
        }));
      } catch (error) {
        console.error('Error fetching user recent feedback:', error);
        throw new Error('Failed to fetch recent feedback');
      }
    },
    CacheTTL.ONE_MINUTE
  );
}

/**
 * Get trending feedback items
 *
 * Fetches feedback items with the most votes (by weighted vote count)
 * in recent time period. Excludes closed and merged items.
 *
 * @param limit - Maximum number of items to return (default: 10)
 * @param userId - Optional user ID to include userHasVoted flag
 * @returns Array of trending feedback items sorted by vote weight
 */
export async function getTrendingFeedback(
  limit: number = 10,
  userId?: string
): Promise<DashboardFeedback[]> {
  // Cache trending with 5-minute TTL (less dynamic, more expensive query)
  const cacheKey = userId
    ? `trending:feedback:${limit}:user:${userId}`
    : `trending:feedback:${limit}`;

  return getOrFetch(
    cacheKey,
    async () => {
      try {
        // Use raw SQL for efficient vote-based sorting
        const feedbackIds = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `
      SELECT f.id
      FROM Feedback f
      LEFT JOIN (
        SELECT feedbackId, SUM(decayedWeight) as totalWeight
        FROM Vote
        GROUP BY feedbackId
      ) v ON f.id = v.feedbackId
      WHERE f.state NOT IN ('closed', 'merged')
        AND f.moderationStatus = 'approved'
      ORDER BY COALESCE(v.totalWeight, 0) DESC
      LIMIT ${limit}
      `
    );

    if (feedbackIds.length === 0) {
      return [];
    }

    const ids = feedbackIds.map((f) => f.id);

    // Fetch full feedback data in parallel with vote stats
    const [feedback, voteStats, userVotes] = await Promise.all([
      prisma.feedback.findMany({
        where: { id: { in: ids } },
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          feature: {
            select: {
              id: true,
              title: true,
              area: true,
            },
          },
          _count: {
            select: {
              votes: true,
            },
          },
        },
      }),
      prisma.vote.groupBy({
        by: ['feedbackId'],
        where: { feedbackId: { in: ids } },
        _sum: {
          decayedWeight: true,
        },
      }),
      userId
        ? prisma.vote.findMany({
            where: {
              userId,
              feedbackId: { in: ids },
            },
            select: { feedbackId: true },
          })
        : Promise.resolve([]),
    ]);

    // Create lookup maps
    const voteStatsMap = new Map(
      voteStats.map((stat) => [stat.feedbackId, stat._sum.decayedWeight || 0])
    );
    const userVotesMap = new Map(userVotes.map((v) => [v.feedbackId, true]));

    // Combine data and sort by original order
    const feedbackMap = new Map(feedback.map((f) => [f.id, f]));

    const result: DashboardFeedback[] = [];

    for (const id of ids) {
      const item = feedbackMap.get(id);
      if (!item) continue;

      result.push({
        id: item.id,
        title: item.title,
        body: item.body,
        state: item.state,
        createdAt: item.createdAt,
        voteCount: item._count.votes,
        totalWeight: voteStatsMap.get(item.id) || 0,
        author: item.author,
        feature: item.feature,
        userHasVoted: userId ? userVotesMap.get(item.id) || false : undefined,
      });
    }

        return result;
      } catch (error) {
        console.error('Error fetching trending feedback:', error);
        throw new Error('Failed to fetch trending feedback');
      }
    },
    CacheTTL.FIVE_MINUTES // Cache for 5 minutes (expensive query)
  );
}

/**
 * Get recent roadmap updates
 *
 * Fetches recently updated roadmap items across all stages,
 * ordered by most recently updated.
 *
 * @param limit - Maximum number of items to return (default: 5)
 * @returns Array of recent roadmap items
 */
export async function getRecentRoadmapUpdates(
  limit: number = 5
): Promise<DashboardRoadmapItem[]> {
  try {
    const roadmapItems = await prisma.roadmapItem.findMany({
      where: {
        visibility: 'public', // Only show public items on dashboard
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
        features: {
          select: {
            id: true,
            title: true,
            area: true,
          },
        },
      },
    });

    return roadmapItems.map((item) => ({
      id: item.id,
      title: item.title,
      stage: item.stage,
      description: item.description,
      targetDate: item.targetDate,
      progress: item.progress,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy,
      features: item.features.map((f) => ({
        id: f.id,
        title: f.title,
        area: f.area,
      })),
    }));
  } catch (error) {
    console.error('Error fetching recent roadmap updates:', error);
    throw new Error('Failed to fetch roadmap updates');
  }
}

/**
 * Get roadmap items by stage
 *
 * Fetches roadmap items filtered by stage (now, next, later, under_consideration).
 *
 * @param stage - The roadmap stage to filter by
 * @param limit - Maximum number of items to return (default: 10)
 * @returns Array of roadmap items for the specified stage
 */
export async function getRoadmapItemsByStage(
  stage: RoadmapStage,
  limit: number = 10
): Promise<DashboardRoadmapItem[]> {
  try {
    const roadmapItems = await prisma.roadmapItem.findMany({
      where: {
        stage,
        visibility: 'public',
      },
      take: limit,
      orderBy: [
        { targetDate: 'asc' },
        { updatedAt: 'desc' },
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
        features: {
          select: {
            id: true,
            title: true,
            area: true,
          },
        },
      },
    });

    return roadmapItems.map((item) => ({
      id: item.id,
      title: item.title,
      stage: item.stage,
      description: item.description,
      targetDate: item.targetDate,
      progress: item.progress,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy,
      features: item.features.map((f) => ({
        id: f.id,
        title: f.title,
        area: f.area,
      })),
    }));
  } catch (error) {
    console.error('Error fetching roadmap items by stage:', error);
    throw new Error('Failed to fetch roadmap items');
  }
}

/**
 * Get user notifications for dashboard
 *
 * Fetches recent notifications for a user with unread count.
 * Optimized for dashboard display.
 *
 * @param userId - The user ID
 * @param limit - Maximum number of items to return (default: 5)
 * @returns Notifications with metadata
 */
export async function getDashboardNotifications(
  userId: string,
  limit: number = 5
): Promise<{
  notifications: DashboardNotification[];
  unreadCount: number;
  total: number;
}> {
  try {
    const [notifications, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      unreadCount,
      total,
    };
  } catch (error) {
    console.error('Error fetching dashboard notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

/**
 * Get complete dashboard data in a single call
 *
 * Fetches all dashboard data in parallel for optimal performance.
 * This is the primary function to use for loading the dashboard page.
 *
 * @param userId - The user ID
 * @returns Complete dashboard data
 */
export async function getCompleteDashboardData(userId: string) {
  try {
    const [stats, recentFeedback, trendingFeedback, roadmapUpdates, notifications] =
      await Promise.all([
        getDashboardStats(userId),
        getUserRecentFeedback(userId, 5),
        getTrendingFeedback(10, userId),
        getRecentRoadmapUpdates(5),
        getDashboardNotifications(userId, 5),
      ]);

    return {
      stats,
      recentFeedback,
      trendingFeedback,
      roadmapUpdates,
      notifications,
    };
  } catch (error) {
    console.error('Error fetching complete dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
}

/**
 * Get activity timeline for a user
 *
 * Fetches recent activity across feedback, votes, and research participation.
 * Useful for showing a chronological activity feed.
 *
 * @param userId - The user ID
 * @param limit - Maximum number of items to return (default: 10)
 * @returns Array of activity items sorted by date
 */
export async function getUserActivityTimeline(
  userId: string,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    type: 'feedback' | 'vote' | 'questionnaire_response';
    timestamp: Date;
    title: string;
    link: string;
  }>
> {
  try {
    // Fetch recent activities in parallel
    const [recentFeedback, recentVotes, recentResponses] = await Promise.all([
      prisma.feedback.findMany({
        where: { authorId: userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
      prisma.vote.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          feedback: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.questionnaireResponse.findMany({
        where: { respondentId: userId },
        take: limit,
        orderBy: { completedAt: 'desc' },
        include: {
          questionnaire: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    // Combine and sort all activities
    const activities: Array<{
      id: string;
      type: 'feedback' | 'vote' | 'questionnaire_response';
      timestamp: Date;
      title: string;
      link: string;
    }> = [
      ...recentFeedback.map((f) => ({
        id: f.id,
        type: 'feedback' as const,
        timestamp: f.createdAt,
        title: `Created feedback: ${f.title}`,
        link: `/feedback/${f.id}`,
      })),
      ...recentVotes.map((v) => ({
        id: v.id,
        type: 'vote' as const,
        timestamp: v.createdAt,
        title: `Voted on: ${v.feedback.title}`,
        link: `/feedback/${v.feedback.id}`,
      })),
      ...recentResponses.map((r) => ({
        id: r.id,
        type: 'questionnaire_response' as const,
        timestamp: r.completedAt,
        title: `Completed questionnaire: ${r.questionnaire.title}`,
        link: `/questionnaires/${r.questionnaire.id}`,
      })),
    ];

    // Sort by timestamp (most recent first) and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching user activity timeline:', error);
    throw new Error('Failed to fetch activity timeline');
  }
}

/**
 * Get quick stats for dashboard cards
 *
 * Lightweight version of stats for displaying key metrics.
 *
 * @param userId - The user ID
 * @returns Quick stats object
 */
export async function getQuickStats(userId: string): Promise<{
  totalFeedback: number;
  totalVotes: number;
  unreadNotifications: number;
  activePanels: number;
}> {
  // Cache quick stats with 1-minute TTL
  return getOrFetch(
    `dashboard:quick-stats:${userId}`,
    async () => {
      try {
        const [totalFeedback, totalVotes, unreadNotifications, activePanels] =
          await Promise.all([
        prisma.feedback.count({ where: { authorId: userId } }),
        prisma.vote.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, readAt: null } }),
        prisma.panelMembership.count({ where: { userId, active: true } }),
      ]);

        return {
          totalFeedback,
          totalVotes,
          unreadNotifications,
          activePanels,
        };
      } catch (error) {
        console.error('Error fetching quick stats:', error);
        throw new Error('Failed to fetch quick stats');
      }
    },
    CacheTTL.ONE_MINUTE
  );
}

/**
 * PM/PO Activity Metrics
 *
 * Metrics specific to Product Manager and Product Owner roles.
 */
export interface PMActivityMetrics {
  moderationQueueCount: number;
  moderationOldestItemAge: number | null; // Hours since oldest item created
  topVotedFeedbackCount: number;
  roadmapItemsNow: number;
  roadmapItemsNext: number;
  roadmapItemsLater: number;
  teamFeedbackThisMonth: number;
}

/**
 * Get PM/PO activity metrics for dashboard
 *
 * Fetches role-specific metrics for Product Managers and Product Owners:
 * - Moderation Queue: Items in pending_review status with SLA tracking
 * - Top Voted Feedback: Feedback with 10+ votes
 * - Roadmap Items: Breakdown by stage (now, next, later)
 * - Team Feedback: New feedback submissions this month
 *
 * This function is optimized for PM/PO dashboard display and uses
 * parallel queries for performance.
 *
 * @param userRole - User's role (should be 'PM', 'PO', or 'ADMIN')
 * @returns PM activity metrics
 */
export async function getPMActivityMetrics(userRole: Role): Promise<PMActivityMetrics> {
  try {
    // Only calculate for PM/PO/ADMIN roles
    if (userRole !== 'PM' && userRole !== 'PO' && userRole !== 'ADMIN') {
      return {
        moderationQueueCount: 0,
        moderationOldestItemAge: null,
        topVotedFeedbackCount: 0,
        roadmapItemsNow: 0,
        roadmapItemsNext: 0,
        roadmapItemsLater: 0,
        teamFeedbackThisMonth: 0,
      };
    }

    // Calculate date ranges
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Execute all queries in parallel for efficiency
    const [
      moderationQueue,
      topVotedStats,
      roadmapNow,
      roadmapNext,
      roadmapLater,
      teamFeedbackCount,
    ] = await Promise.all([
      // Moderation Queue: Items pending review with oldest item tracking
      prisma.feedback.findMany({
        where: {
          moderationStatus: 'pending_review',
        },
        select: {
          id: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),

      // Top Voted Feedback: Items with 10+ votes
      prisma.$queryRaw<Array<{ feedbackId: string; voteCount: number }>>`
        SELECT v.feedbackId, COUNT(*) as voteCount
        FROM Vote v
        INNER JOIN Feedback f ON v.feedbackId = f.id
        WHERE f.moderationStatus = 'approved'
        GROUP BY v.feedbackId
        HAVING COUNT(*) >= 10
      `,

      // Roadmap Items by Stage - Now
      prisma.roadmapItem.count({
        where: { stage: 'now' },
      }),

      // Roadmap Items by Stage - Next
      prisma.roadmapItem.count({
        where: { stage: 'next' },
      }),

      // Roadmap Items by Stage - Later
      prisma.roadmapItem.count({
        where: { stage: 'later' },
      }),

      // Team Feedback This Month: All feedback created this month
      prisma.feedback.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
          },
          moderationStatus: 'approved',
        },
      }),
    ]);

    // Calculate oldest item age in hours
    let moderationOldestItemAge: number | null = null;
    if (moderationQueue.length > 0) {
      const oldestItem = moderationQueue[0];
      const ageInMs = now.getTime() - oldestItem.createdAt.getTime();
      moderationOldestItemAge = Math.floor(ageInMs / (1000 * 60 * 60)); // Convert to hours
    }

    return {
      moderationQueueCount: moderationQueue.length,
      moderationOldestItemAge,
      topVotedFeedbackCount: topVotedStats.length,
      roadmapItemsNow: roadmapNow,
      roadmapItemsNext: roadmapNext,
      roadmapItemsLater: roadmapLater,
      teamFeedbackThisMonth: teamFeedbackCount,
    };
  } catch (error) {
    console.error('Error fetching PM activity metrics:', error);
    throw new Error('Failed to fetch PM activity metrics');
  }
}
