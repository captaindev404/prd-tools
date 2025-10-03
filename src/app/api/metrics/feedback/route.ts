import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * Feedback Analytics API
 *
 * GET /api/metrics/feedback
 * Returns comprehensive feedback analytics for PM/PO/ADMIN roles
 *
 * Query parameters:
 * - timeRange: 7d | 30d | 90d | 1y | all (default: 30d)
 * - productArea: Reservations | CheckIn | Payments | Housekeeping | Backoffice (optional)
 * - village: village ID (optional)
 */
import { hasRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getStartDate, getPreviousPeriod, calculateTrend, calculateAverage } from '@/lib/analytics-helpers';
import type { FeedbackAnalytics, TimeRange, TimeSeriesData, CategoryData, TopFeedbackItem } from '@/types/analytics';
import { ProductArea, FeedbackState, Source } from '@prisma/client';

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
    const villageId = searchParams.get('village');

    // Get date ranges
    const startDate = getStartDate(timeRange);
    const previousPeriod = getPreviousPeriod(timeRange);

    // Build base where clause
    const baseWhere: any = {};
    if (startDate) {
      baseWhere.createdAt = { gte: startDate };
    }
    if (productArea) {
      baseWhere.feature = { area: productArea };
    }
    if (villageId) {
      baseWhere.villageId = villageId;
    }

    // Build previous period where clause
    const previousWhere: any = { ...baseWhere };
    if (previousPeriod.start && previousPeriod.end) {
      previousWhere.createdAt = {
        gte: previousPeriod.start,
        lt: previousPeriod.end,
      };
    }

    // Fetch current period data
    const [
      currentFeedback,
      previousFeedback,
      feedbackWithVotes,
      topFeedback,
      feedbackByArea,
      feedbackBySource,
      feedbackByState,
      duplicates,
      triagedFeedback,
    ] = await Promise.all([
      // Total feedback in current period
      prisma.feedback.count({ where: baseWhere }),

      // Total feedback in previous period
      previousPeriod.start
        ? prisma.feedback.count({ where: previousWhere })
        : Promise.resolve(0),

      // Feedback with vote counts
      prisma.feedback.findMany({
        where: baseWhere,
        select: {
          id: true,
          votes: {
            select: {
              weight: true,
            },
          },
        },
      }),

      // Top 10 feedback by votes
      prisma.feedback.findMany({
        where: baseWhere,
        select: {
          id: true,
          title: true,
          state: true,
          createdAt: true,
          votes: {
            select: {
              weight: true,
            },
          },
        },
        orderBy: {
          votes: {
            _count: 'desc',
          },
        },
        take: 10,
      }),

      // Feedback by product area
      prisma.feedback.groupBy({
        by: ['featureId'],
        where: {
          ...baseWhere,
          featureId: { not: null },
        },
        _count: true,
      }),

      // Feedback by source
      prisma.feedback.groupBy({
        by: ['source'],
        where: baseWhere,
        _count: true,
      }),

      // Feedback by state
      prisma.feedback.groupBy({
        by: ['state'],
        where: baseWhere,
        _count: true,
      }),

      // Duplicate/merged feedback
      prisma.feedback.count({
        where: {
          ...baseWhere,
          state: 'merged',
        },
      }),

      // Triaged feedback (for response time calculation)
      prisma.feedback.findMany({
        where: {
          ...baseWhere,
          state: { in: ['triaged', 'in_roadmap', 'closed'] },
          moderatedAt: { not: null },
        },
        select: {
          createdAt: true,
          moderatedAt: true,
        },
      }),
    ]);

    // Calculate summary metrics
    const totalVotes = feedbackWithVotes.reduce(
      (sum, fb) => sum + fb.votes.reduce((s, v) => s + v.weight, 0),
      0
    );
    const avgVotes = currentFeedback > 0 ? totalVotes / currentFeedback : 0;

    // Calculate response rate (triaged vs total)
    const responseRate =
      currentFeedback > 0 ? (triagedFeedback.length / currentFeedback) * 100 : 0;

    // Calculate trend
    const trend = calculateTrend(currentFeedback, previousFeedback);

    // Calculate average response time
    const responseTimes = triagedFeedback
      .filter((fb) => fb.moderatedAt)
      .map((fb) => {
        const created = new Date(fb.createdAt).getTime();
        const moderated = new Date(fb.moderatedAt!).getTime();
        return (moderated - created) / (1000 * 60 * 60 * 24); // Convert to days
      });
    const avgDaysToTriage = calculateAverage(responseTimes);

    // Get submission trends (group by date)
    const feedbackByDate = await prisma.feedback.groupBy({
      by: ['createdAt'],
      where: baseWhere,
      _count: true,
    });

    // Group by day/week/month based on time range
    const submissionTrends: TimeSeriesData[] = [];
    const dateGroups = new Map<string, number>();

    feedbackByDate.forEach((item) => {
      const date = new Date(item.createdAt);
      let key: string;

      if (timeRange === '7d' || timeRange === '30d') {
        // Group by day
        key = date.toISOString().split('T')[0];
      } else if (timeRange === '90d') {
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // Group by month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      dateGroups.set(key, (dateGroups.get(key) || 0) + item._count);
    });

    dateGroups.forEach((value, date) => {
      submissionTrends.push({ date, value });
    });

    // Sort by date
    submissionTrends.sort((a, b) => a.date.localeCompare(b.date));

    // Format top feedback
    const topFeedbackFormatted: TopFeedbackItem[] = topFeedback.map((fb) => ({
      id: fb.id,
      title: fb.title,
      voteCount: fb.votes.reduce((sum, v) => sum + v.weight, 0),
      state: fb.state,
      createdAt: fb.createdAt.toISOString(),
    }));

    // Get feature data for product area grouping
    const featureIds = feedbackByArea.map((item) => item.featureId!);
    const features = await prisma.feature.findMany({
      where: { id: { in: featureIds } },
      select: { id: true, area: true },
    });

    const featureMap = new Map(features.map((f) => [f.id, f.area]));

    // Format by product area
    const byProductArea: CategoryData[] = [];
    const areaGroups = new Map<ProductArea, number>();

    feedbackByArea.forEach((item) => {
      const area = featureMap.get(item.featureId!);
      if (area) {
        areaGroups.set(area, (areaGroups.get(area) || 0) + item._count);
      }
    });

    areaGroups.forEach((value, category) => {
      const percentage = currentFeedback > 0 ? (value / currentFeedback) * 100 : 0;
      byProductArea.push({
        category,
        value,
        percentage: Math.round(percentage * 10) / 10,
      });
    });

    // Format by source
    const bySource: CategoryData[] = feedbackBySource.map((item) => {
      const percentage = currentFeedback > 0 ? (item._count / currentFeedback) * 100 : 0;
      return {
        category: item.source,
        value: item._count,
        percentage: Math.round(percentage * 10) / 10,
      };
    });

    // Format by state
    const byState: CategoryData[] = feedbackByState.map((item) => {
      const percentage = currentFeedback > 0 ? (item._count / currentFeedback) * 100 : 0;
      return {
        category: item.state,
        value: item._count,
        percentage: Math.round(percentage * 10) / 10,
      };
    });

    // Build analytics response
    const analytics: FeedbackAnalytics = {
      summary: {
        totalFeedback: currentFeedback,
        avgVotes: Math.round(avgVotes * 10) / 10,
        responseRate: Math.round(responseRate * 10) / 10,
        trend: trend.changePercentage,
      },
      submissionTrends,
      topFeedback: topFeedbackFormatted,
      byProductArea,
      bySource,
      byState,
      voteTrends: {
        totalVotes: Math.round(totalVotes),
        avgVotesPerFeedback: Math.round(avgVotes * 10) / 10,
        trend: 0, // Would need previous period vote data
      },
      duplicateStats: {
        totalDuplicates: duplicates,
        mergedCount: duplicates,
      },
      responseTime: {
        avgDaysToTriage: Math.round(avgDaysToTriage * 10) / 10,
        trend: 0, // Would need previous period data
      },
    };

    // Cache response for 5 minutes
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching feedback analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
