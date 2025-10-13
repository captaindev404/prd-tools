/**
 * Voting Analytics API
 *
 * GET /api/analytics/voting
 * Returns comprehensive voting patterns and statistics
 *
 * Query parameters:
 * - timeRange: 7d | 30d | 90d | 1y | all (default: 30d)
 * - productArea: Reservations | CheckIn | Payments | Housekeeping | Backoffice (optional)
 * - village: village ID (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getStartDate, getPreviousPeriod, calculateTrend } from '@/lib/analytics-helpers';
import type { TimeRange, TimeSeriesData, CategoryData } from '@/types/analytics';
import { ProductArea } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface VotingAnalytics {
  summary: {
    totalVotes: number;
    uniqueVoters: number;
    avgVotesPerUser: number;
    avgVotesPerFeedback: number;
    trend: number;
  };
  votingTrends: TimeSeriesData[];
  votesByProductArea: CategoryData[];
  votesByFeature: {
    featureId: string;
    featureName: string;
    voteCount: number;
    weightedVotes: number;
  }[];
  topVoters: {
    userId: string;
    displayName: string;
    voteCount: number;
    totalWeight: number;
  }[];
  voteDistribution: {
    range: string;
    count: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, ['PM', 'PO', 'ADMIN', 'RESEARCHER'])) {
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

    // Add feedback filters if needed
    const feedbackWhere: any = {};
    if (productArea) {
      feedbackWhere.feature = { area: productArea };
    }
    if (villageId) {
      feedbackWhere.villageId = villageId;
    }

    if (Object.keys(feedbackWhere).length > 0) {
      baseWhere.feedback = feedbackWhere;
    }

    // Previous period where clause
    const previousWhere: any = { ...baseWhere };
    if (previousPeriod.start && previousPeriod.end) {
      previousWhere.createdAt = {
        gte: previousPeriod.start,
        lt: previousPeriod.end,
      };
    }

    // Fetch current and previous period vote data
    const [currentVotes, previousVotes, votes, uniqueVoters, votesByDate] = await Promise.all([
      // Current period vote count
      prisma.vote.count({ where: baseWhere }),

      // Previous period vote count
      previousPeriod.start
        ? prisma.vote.count({ where: previousWhere })
        : Promise.resolve(0),

      // Votes with details
      prisma.vote.findMany({
        where: baseWhere,
        select: {
          id: true,
          userId: true,
          feedbackId: true,
          weight: true,
          decayedWeight: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          feedback: {
            select: {
              id: true,
              title: true,
              featureId: true,
              feature: {
                select: {
                  id: true,
                  title: true,
                  area: true,
                },
              },
            },
          },
        },
      }),

      // Unique voter count
      prisma.vote.groupBy({
        by: ['userId'],
        where: baseWhere,
        _count: true,
      }),

      // Votes grouped by date
      prisma.vote.groupBy({
        by: ['createdAt'],
        where: baseWhere,
        _count: true,
      }),
    ]);

    // Calculate summary metrics
    const totalVotes = currentVotes;
    const uniqueVoterCount = uniqueVoters.length;
    const avgVotesPerUser = uniqueVoterCount > 0 ? totalVotes / uniqueVoterCount : 0;

    // Calculate avg votes per feedback
    const feedbackWithVotes = new Map<string, number>();
    votes.forEach((vote) => {
      feedbackWithVotes.set(
        vote.feedbackId,
        (feedbackWithVotes.get(vote.feedbackId) || 0) + 1
      );
    });
    const avgVotesPerFeedback =
      feedbackWithVotes.size > 0
        ? Array.from(feedbackWithVotes.values()).reduce((sum, count) => sum + count, 0) /
          feedbackWithVotes.size
        : 0;

    // Calculate trend
    const trend = calculateTrend(currentVotes, previousVotes);

    // Group voting trends by date
    const votingTrends: TimeSeriesData[] = [];
    const dateGroups = new Map<string, number>();

    votesByDate.forEach((item) => {
      const date = new Date(item.createdAt);
      let key: string;

      if (timeRange === '7d' || timeRange === '30d') {
        // Group by day
        key = date.toISOString().split('T')[0] || '';
      } else if (timeRange === '90d') {
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0] || '';
      } else {
        // Group by month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      dateGroups.set(key, (dateGroups.get(key) || 0) + item._count);
    });

    dateGroups.forEach((value, date) => {
      votingTrends.push({ date, value });
    });
    votingTrends.sort((a, b) => a.date.localeCompare(b.date));

    // Votes by product area
    const votesByProductArea: CategoryData[] = [];
    const areaGroups = new Map<ProductArea, number>();

    votes.forEach((vote) => {
      const area = vote.feedback.feature?.area;
      if (area) {
        areaGroups.set(area, (areaGroups.get(area) || 0) + 1);
      }
    });

    areaGroups.forEach((value, category) => {
      const percentage = totalVotes > 0 ? (value / totalVotes) * 100 : 0;
      votesByProductArea.push({
        category,
        value,
        percentage: Math.round(percentage * 10) / 10,
      });
    });

    // Sort by value descending
    votesByProductArea.sort((a, b) => b.value - a.value);

    // Votes by feature (top 10)
    const featureVoteMap = new Map<
      string,
      { name: string; count: number; weightedVotes: number }
    >();

    votes.forEach((vote) => {
      const feature = vote.feedback.feature;
      if (feature) {
        const existing = featureVoteMap.get(feature.id);
        if (existing) {
          existing.count++;
          existing.weightedVotes += vote.weight;
        } else {
          featureVoteMap.set(feature.id, {
            name: feature.title,
            count: 1,
            weightedVotes: vote.weight,
          });
        }
      }
    });

    const votesByFeature = Array.from(featureVoteMap.entries())
      .map(([featureId, data]) => ({
        featureId,
        featureName: data.name,
        voteCount: data.count,
        weightedVotes: Math.round(data.weightedVotes * 10) / 10,
      }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10);

    // Top voters (top 10)
    const voterMap = new Map<string, { name: string; count: number; weight: number }>();

    votes.forEach((vote) => {
      const existing = voterMap.get(vote.userId);
      if (existing) {
        existing.count++;
        existing.weight += vote.weight;
      } else {
        voterMap.set(vote.userId, {
          name: vote.user.displayName || vote.user.email.split('@')[0] || 'Unknown',
          count: 1,
          weight: vote.weight,
        });
      }
    });

    const topVoters = Array.from(voterMap.entries())
      .map(([userId, data]) => ({
        userId,
        displayName: data.name,
        voteCount: data.count,
        totalWeight: Math.round(data.weight * 10) / 10,
      }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10);

    // Vote distribution (by vote weight ranges)
    const voteDistribution = [
      { range: '0.5-1.0', count: 0 },
      { range: '1.0-1.5', count: 0 },
      { range: '1.5-2.0', count: 0 },
      { range: '2.0-2.5', count: 0 },
      { range: '2.5+', count: 0 },
    ];

    votes.forEach((vote) => {
      const weight = vote.weight;
      if (weight < 1.0) voteDistribution[0].count++;
      else if (weight < 1.5) voteDistribution[1].count++;
      else if (weight < 2.0) voteDistribution[2].count++;
      else if (weight < 2.5) voteDistribution[3].count++;
      else voteDistribution[4].count++;
    });

    // Build analytics response
    const analytics: VotingAnalytics = {
      summary: {
        totalVotes,
        uniqueVoters: uniqueVoterCount,
        avgVotesPerUser: Math.round(avgVotesPerUser * 10) / 10,
        avgVotesPerFeedback: Math.round(avgVotesPerFeedback * 10) / 10,
        trend: trend.changePercentage,
      },
      votingTrends,
      votesByProductArea,
      votesByFeature,
      topVoters,
      voteDistribution,
    };

    // Cache response for 5 minutes
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching voting analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
