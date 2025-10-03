/**
 * Product Analytics API
 *
 * GET /api/metrics/product
 * Returns comprehensive product analytics for PM/PO/ADMIN roles
 *
 * Query parameters:
 * - timeRange: 7d | 30d | 90d | 1y | all (default: 30d)
 * - productArea: Reservations | CheckIn | Payments | Housekeeping | Backoffice (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { hasRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import {
  getStartDate,
  getPreviousPeriod,
  calculateTrend,
  calculateNPS,
  calculateResponseRate,
} from '@/lib/analytics-helpers';
import type {
  ProductAnalytics,
  TimeRange,
  TimeSeriesData,
  CategoryData,
  VillageActivityItem,
  ContributorItem,
} from '@/types/analytics';
import { ProductArea, FeatureStatus, RoadmapStage } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, ['PM', 'PO', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get('timeRange') as TimeRange) || '30d';
    const productArea = searchParams.get('productArea') as ProductArea | null;

    // Get date ranges
    const startDate = getStartDate(timeRange);
    const previousPeriod = getPreviousPeriod(timeRange);

    // Build base where clause
    const baseWhere: any = {};
    if (productArea) {
      baseWhere.area = productArea;
    }

    // Fetch feature data
    const [totalFeatures, featuresByStatus] = await Promise.all([
      // Total features
      prisma.feature.count({ where: baseWhere }),

      // Features by status
      prisma.feature.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: true,
      }),
    ]);

    // Format feature adoption data
    const featureAdoption: CategoryData[] = featuresByStatus.map((item) => {
      const percentage = totalFeatures > 0 ? (item._count / totalFeatures) * 100 : 0;
      return {
        category: item.status,
        value: item._count,
        percentage: Math.round(percentage * 10) / 10,
      };
    });

    // Fetch roadmap data
    const roadmapWhere: any = {};
    if (startDate) {
      roadmapWhere.createdAt = { gte: startDate };
    }

    const [totalRoadmapItems, roadmapByStage] = await Promise.all([
      // Total roadmap items
      prisma.roadmapItem.count({ where: roadmapWhere }),

      // Roadmap by stage
      prisma.roadmapItem.groupBy({
        by: ['stage'],
        where: roadmapWhere,
        _count: true,
      }),
    ]);

    // Format roadmap progress
    const byStage: CategoryData[] = roadmapByStage.map((item) => {
      const percentage = totalRoadmapItems > 0 ? (item._count / totalRoadmapItems) * 100 : 0;
      return {
        category: item.stage,
        value: item._count,
        percentage: Math.round(percentage * 10) / 10,
      };
    });

    // Calculate roadmap completion rate
    const completedItems = roadmapByStage.find((item) => item.stage === 'now')?._count || 0;
    const completionRate = calculateResponseRate(completedItems, totalRoadmapItems);

    // Fetch user engagement data
    const userEngagementWhere: any = {};
    if (startDate) {
      userEngagementWhere.createdAt = { gte: startDate };
    }

    const [
      totalFeedback,
      totalVotes,
      activeUsersFeedback,
      activeUsersVotes,
      currentActiveUsers,
      previousActiveUsers,
    ] = await Promise.all([
      // Total feedback
      prisma.feedback.count({ where: userEngagementWhere }),

      // Total votes
      prisma.vote.count({
        where: startDate ? { createdAt: { gte: startDate } } : undefined,
      }),

      // Active users (submitted feedback)
      prisma.feedback.findMany({
        where: userEngagementWhere,
        select: { authorId: true },
        distinct: ['authorId'],
      }),

      // Active users (voted)
      prisma.vote.findMany({
        where: startDate ? { createdAt: { gte: startDate } } : undefined,
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Current period active users
      prisma.feedback.findMany({
        where: userEngagementWhere,
        select: { authorId: true },
        distinct: ['authorId'],
      }),

      // Previous period active users
      previousPeriod.start && previousPeriod.end
        ? prisma.feedback.findMany({
            where: {
              createdAt: {
                gte: previousPeriod.start,
                lt: previousPeriod.end,
              },
            },
            select: { authorId: true },
            distinct: ['authorId'],
          })
        : Promise.resolve([]),
    ]);

    // Combine active users from both feedback and votes
    const activeUserIds = new Set([
      ...activeUsersFeedback.map((u) => u.authorId),
      ...activeUsersVotes.map((v) => v.userId),
    ]);
    const activeUsers = activeUserIds.size;

    // Calculate engagement metrics
    const submissionsPerUser = activeUsers > 0 ? totalFeedback / activeUsers : 0;
    const votesPerUser = activeUsers > 0 ? totalVotes / activeUsers : 0;

    // Calculate trend
    const engagementTrend = calculateTrend(currentActiveUsers.length, previousActiveUsers.length);

    // Fetch feedback-to-feature linkage data
    const [linkedFeedback, totalFeedbackForLinkage] = await Promise.all([
      // Feedback linked to features
      prisma.feedback.count({
        where: {
          ...userEngagementWhere,
          featureId: { not: null },
        },
      }),

      // Total feedback
      prisma.feedback.count({ where: userEngagementWhere }),
    ]);

    const linkageRate = calculateResponseRate(linkedFeedback, totalFeedbackForLinkage);

    // Fetch NPS trends
    const npsResponses = await prisma.questionnaireResponse.findMany({
      where: startDate ? {
        completedAt: { gte: startDate }
      } : undefined,
      select: {
        answers: true,
        completedAt: true,
        questionnaire: {
          select: {
            questions: true,
          },
        },
      },
    });

    // Extract NPS scores and group by date
    const npsByDate = new Map<string, number[]>();

    npsResponses.forEach((response) => {
      try {
        const questions = JSON.parse(response.questionnaire.questions as string);
        const answers = JSON.parse(response.answers as string);

        questions.forEach((q: any, index: number) => {
          if (q.type === 'nps' || (q.type === 'scale' && q.max === 10)) {
            const answer = answers[`q${index + 1}`];
            if (typeof answer === 'number' && answer >= 0 && answer <= 10) {
              const date = new Date(response.completedAt);
              let key: string;

              if (timeRange === '7d' || timeRange === '30d') {
                key = date.toISOString().split('T')[0];
              } else if (timeRange === '90d') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
              } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              }

              if (!npsByDate.has(key)) {
                npsByDate.set(key, []);
              }
              npsByDate.get(key)!.push(answer);
            }
          }
        });
      } catch (error) {
        console.error('Error parsing NPS data:', error);
      }
    });

    const npsTrends: TimeSeriesData[] = [];
    npsByDate.forEach((scores, date) => {
      const nps = calculateNPS(scores);
      npsTrends.push({ date, value: nps });
    });
    npsTrends.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate overall NPS
    const allNPSScores: number[] = [];
    npsByDate.forEach((scores) => allNPSScores.push(...scores));
    const avgNPS = calculateNPS(allNPSScores);

    // Fetch village activity
    const villages = await prisma.village.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const villageActivity: VillageActivityItem[] = await Promise.all(
      villages.map(async (village) => {
        const [feedbackCount, voteCount, activeUsersInVillage] = await Promise.all([
          prisma.feedback.count({
            where: {
              ...userEngagementWhere,
              villageId: village.id,
            },
          }),
          prisma.vote.count({
            where: {
              createdAt: startDate ? { gte: startDate } : undefined,
              user: {
                currentVillageId: village.id,
              },
            },
          }),
          prisma.feedback.findMany({
            where: {
              ...userEngagementWhere,
              villageId: village.id,
            },
            select: { authorId: true },
            distinct: ['authorId'],
          }),
        ]);

        return {
          villageId: village.id,
          villageName: village.name,
          feedbackCount,
          voteCount,
          activeUsers: activeUsersInVillage.length,
        };
      })
    );

    // Sort by feedback count
    villageActivity.sort((a, b) => b.feedbackCount - a.feedbackCount);

    // Fetch top contributors
    const topContributorsData = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        feedbacks: {
          where: userEngagementWhere,
          select: { id: true },
        },
        votes: {
          where: startDate ? { createdAt: { gte: startDate } } : undefined,
          select: { id: true },
        },
      },
      take: 100, // Get top 100 and then filter
    });

    const topContributors: ContributorItem[] = topContributorsData
      .map((user) => ({
        userId: user.id,
        displayName: user.displayName || 'Anonymous',
        feedbackCount: user.feedbacks.length,
        voteCount: user.votes.length,
        totalContributions: user.feedbacks.length + user.votes.length,
      }))
      .filter((c) => c.totalContributions > 0)
      .sort((a, b) => b.totalContributions - a.totalContributions)
      .slice(0, 10);

    // Build analytics response
    const analytics: ProductAnalytics = {
      summary: {
        totalFeatures,
        roadmapItems: totalRoadmapItems,
        avgNPS,
        activeUsers,
        trend: engagementTrend.changePercentage,
      },
      featureAdoption,
      roadmapProgress: {
        byStage,
        completionRate,
      },
      userEngagement: {
        activeUsers,
        submissionsPerUser: Math.round(submissionsPerUser * 10) / 10,
        votesPerUser: Math.round(votesPerUser * 10) / 10,
        trend: engagementTrend.changePercentage,
      },
      feedbackToFeatureRatio: {
        totalFeedback: totalFeedbackForLinkage,
        linkedFeedback,
        linkageRate,
      },
      npsTrends,
      villageActivity,
      topContributors,
    };

    // Cache response for 5 minutes
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
