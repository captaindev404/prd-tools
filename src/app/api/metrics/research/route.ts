/**
 * Research Analytics API
 *
 * GET /api/metrics/research
 * Returns comprehensive research analytics for RESEARCHER/PM/ADMIN roles
 *
 * Query parameters:
 * - timeRange: 7d | 30d | 90d | 1y | all (default: 30d)
 * - panelId: panel ID (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { hasRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import {
  getStartDate,
  getPreviousPeriod,
  calculateTrend,
  calculateAverage,
  calculateNPS,
  calculateResponseRate,
} from '@/lib/analytics-helpers';
import type {
  ResearchAnalytics,
  TimeRange,
  TimeSeriesData,
  TopQuestionItem,
} from '@/types/analytics';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, ['RESEARCHER', 'PM', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get('timeRange') as TimeRange) || '30d';
    const panelId = searchParams.get('panelId');

    // Get date ranges
    const startDate = getStartDate(timeRange);
    const previousPeriod = getPreviousPeriod(timeRange);

    // Build base where clause for questionnaires
    const questionnaireWhere: any = {};
    if (startDate) {
      questionnaireWhere.createdAt = { gte: startDate };
    }

    // Build base where clause for sessions
    const sessionWhere: any = {};
    if (startDate) {
      sessionWhere.createdAt = { gte: startDate };
    }
    if (panelId) {
      sessionWhere.panelId = panelId;
    }

    // Build base where clause for panel memberships
    const membershipWhere: any = {};
    if (startDate) {
      membershipWhere.joinedAt = { gte: startDate };
    }
    if (panelId) {
      membershipWhere.panelId = panelId;
    }

    // Fetch panel data
    const [
      totalPanels,
      panels,
      totalMembers,
      currentMemberships,
      previousMemberships,
    ] = await Promise.all([
      // Total panels
      prisma.panel.count({
        where: panelId ? { id: panelId } : undefined,
      }),

      // Panel details
      prisma.panel.findMany({
        where: panelId ? { id: panelId } : undefined,
        select: {
          id: true,
          name: true,
          memberships: {
            where: { active: true },
            select: { id: true },
          },
        },
      }),

      // Total active members
      prisma.panelMembership.count({
        where: {
          active: true,
          ...(panelId ? { panelId } : {}),
        },
      }),

      // Current period memberships
      prisma.panelMembership.count({
        where: {
          ...membershipWhere,
          active: true,
        },
      }),

      // Previous period memberships
      previousPeriod.start && previousPeriod.end
        ? prisma.panelMembership.count({
            where: {
              joinedAt: {
                gte: previousPeriod.start,
                lt: previousPeriod.end,
              },
              active: true,
              ...(panelId ? { panelId } : {}),
            },
          })
        : Promise.resolve(0),
    ]);

    // Calculate average panel size
    const avgPanelSize =
      panels.length > 0
        ? panels.reduce((sum, panel) => sum + panel.memberships.length, 0) / panels.length
        : 0;

    // Fetch questionnaire data
    const [questionnaires, questionnaireResponses, allResponses] = await Promise.all([
      // Questionnaires
      prisma.questionnaire.findMany({
        where: {
          ...questionnaireWhere,
          status: 'published',
        },
        select: {
          id: true,
          title: true,
          questions: true,
          responses: {
            select: {
              id: true,
              answers: true,
            },
          },
        },
      }),

      // Total responses
      prisma.questionnaireResponse.count({
        where: startDate ? {
          completedAt: { gte: startDate },
        } : {},
      }),

      // All responses for NPS calculation
      prisma.questionnaireResponse.findMany({
        where: startDate ? {
          completedAt: { gte: startDate },
        } : {},
        select: {
          answers: true,
          questionnaire: {
            select: {
              questions: true,
            },
          },
        },
      }),
    ]);

    const totalQuestionnaires = questionnaires.length;

    // Calculate response rate
    const totalSent = questionnaires.reduce((sum, q) => {
      // Estimate sent count (this would need actual tracking in production)
      return sum + 100; // Placeholder
    }, 0);

    const responseRateValue = calculateResponseRate(questionnaireResponses, totalSent);

    // Calculate NPS from responses
    const npsScores: number[] = [];
    allResponses.forEach((response) => {
      try {
        const questions = JSON.parse(response.questionnaire.questions as string);
        const answers = JSON.parse(response.answers as string);

        // Find NPS questions (type: nps or scale 0-10)
        questions.forEach((q: any, index: number) => {
          if (q.type === 'nps' || (q.type === 'scale' && q.max === 10)) {
            const answer = answers[`q${index + 1}`];
            if (typeof answer === 'number' && answer >= 0 && answer <= 10) {
              npsScores.push(answer);
            }
          }
        });
      } catch (error) {
        console.error('Error parsing questionnaire data:', error);
      }
    });

    const avgNPS = calculateNPS(npsScores);

    // Fetch session data
    const [totalSessions, completedSessions, sessions] = await Promise.all([
      // Total sessions
      prisma.session.count({
        where: sessionWhere,
      }),

      // Completed sessions
      prisma.session.count({
        where: {
          ...sessionWhere,
          status: 'completed',
        },
      }),

      // Session details
      prisma.session.findMany({
        where: sessionWhere,
        select: {
          id: true,
          type: true,
          participantIds: true,
          status: true,
        },
      }),
    ]);

    const completionRate = calculateResponseRate(completedSessions, totalSessions);

    // Calculate average participants per session
    const avgParticipants =
      sessions.length > 0
        ? calculateAverage(
            sessions.map((s) => {
              try {
                const participants = JSON.parse(s.participantIds as string);
                return Array.isArray(participants) ? participants.length : 0;
              } catch {
                return 0;
              }
            })
          )
        : 0;

    // Get participation trends (group by date)
    const membershipsByDate = await prisma.panelMembership.groupBy({
      by: ['joinedAt'],
      where: membershipWhere,
      _count: true,
    });

    // Group by day/week/month
    const participationTrends: TimeSeriesData[] = [];
    const dateGroups = new Map<string, number>();

    membershipsByDate.forEach((item) => {
      const date = new Date(item.joinedAt);
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

      dateGroups.set(key, (dateGroups.get(key) || 0) + item._count);
    });

    dateGroups.forEach((value, date) => {
      participationTrends.push({ date, value });
    });
    participationTrends.sort((a, b) => a.date.localeCompare(b.date));

    // Get panel growth trends
    const panelGrowth: TimeSeriesData[] = [];
    let cumulativeMembers = 0;

    participationTrends.forEach((trend) => {
      cumulativeMembers += trend.value;
      panelGrowth.push({
        date: trend.date,
        value: cumulativeMembers,
      });
    });

    // Get top questions by response count
    const questionCounts = new Map<string, { count: number; text: string; scores: number[] }>();

    questionnaires.forEach((q) => {
      try {
        const questions = JSON.parse(q.questions as string);
        questions.forEach((question: any, index: number) => {
          const key = `${q.id}-q${index + 1}`;
          const responseCount = q.responses.length;
          const scores: number[] = [];

          q.responses.forEach((r) => {
            try {
              const answers = JSON.parse(r.answers as string);
              const answer = answers[`q${index + 1}`];
              if (typeof answer === 'number') {
                scores.push(answer);
              }
            } catch {
              // Ignore parse errors
            }
          });

          questionCounts.set(key, {
            count: responseCount,
            text: question.text || question.label || 'Question',
            scores,
          });
        });
      } catch (error) {
        console.error('Error parsing questions:', error);
      }
    });

    const topQuestions: TopQuestionItem[] = Array.from(questionCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({
        id,
        questionText: data.text,
        responseCount: data.count,
        avgScore: data.scores.length > 0 ? calculateAverage(data.scores) : undefined,
      }));

    // Get consent stats
    const [totalUsers, consentedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          consents: {
            contains: 'research_contact',
          },
        },
      }),
    ]);

    const consentRate = calculateResponseRate(consentedUsers, totalUsers);

    // Calculate trend
    const trend = calculateTrend(currentMemberships, previousMemberships);

    // Build analytics response
    const analytics: ResearchAnalytics = {
      summary: {
        totalPanels,
        totalMembers,
        avgResponseRate: responseRateValue,
        avgNPS,
        trend: trend.changePercentage,
      },
      panelStats: {
        totalPanels,
        totalMembers,
        avgPanelSize: Math.round(avgPanelSize * 10) / 10,
      },
      questionnaireStats: {
        totalSent,
        totalResponses: questionnaireResponses,
        responseRate: responseRateValue,
        avgNPS,
      },
      sessionStats: {
        totalSessions,
        completed: completedSessions,
        completionRate,
        avgParticipants: Math.round(avgParticipants * 10) / 10,
      },
      participationTrends,
      panelGrowth,
      topQuestions,
      consentStats: {
        totalUsers,
        consentedUsers,
        consentRate,
      },
    };

    // Cache response for 5 minutes
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching research analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
