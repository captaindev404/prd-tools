/**
 * NPS Analytics API
 *
 * GET /api/analytics/nps
 * Returns Net Promoter Score analytics and trends
 *
 * Query parameters:
 * - timeRange: 7d | 30d | 90d | 1y | all (default: 30d)
 * - panelId: panel ID (optional)
 * - questionnaireId: questionnaire ID (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getStartDate, getPreviousPeriod, calculateNPS, calculateTrend } from '@/lib/analytics-helpers';
import type { TimeRange, TimeSeriesData, CategoryData } from '@/types/analytics';

export const dynamic = 'force-dynamic';

interface NPSAnalytics {
  summary: {
    overallNPS: number;
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    trend: number;
  };
  npsOverTime: TimeSeriesData[];
  npsDistribution: CategoryData[];
  npsByPanel: {
    panelId: string;
    panelName: string;
    npsScore: number;
    responseCount: number;
  }[];
  npsByQuestionnaire: {
    questionnaireId: string;
    questionnaireTitle: string;
    npsScore: number;
    responseCount: number;
  }[];
  scoreBreakdown: {
    score: number;
    count: number;
    percentage: number;
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
    const panelId = searchParams.get('panelId');
    const questionnaireId = searchParams.get('questionnaireId');

    // Get date ranges
    const startDate = getStartDate(timeRange);
    const previousPeriod = getPreviousPeriod(timeRange);

    // Build base where clause
    const responseWhere: any = {};
    if (startDate) {
      responseWhere.completedAt = { gte: startDate };
    }
    if (questionnaireId) {
      responseWhere.questionnaireId = questionnaireId;
    }

    // If panelId is specified, filter by questionnaires linked to that panel
    if (panelId) {
      const panelQuestionnaires = await prisma.questionnaire.findMany({
        where: {
          panelIds: {
            contains: panelId,
          },
        },
        select: { id: true },
      });

      if (panelQuestionnaires.length > 0) {
        responseWhere.questionnaireId = {
          in: panelQuestionnaires.map((q) => q.id),
        };
      }
    }

    // Previous period where clause
    const previousWhere: any = { ...responseWhere };
    if (previousPeriod.start && previousPeriod.end) {
      previousWhere.completedAt = {
        gte: previousPeriod.start,
        lt: previousPeriod.end,
      };
    }

    // Fetch questionnaire responses with NPS questions
    const [currentResponses, previousResponses] = await Promise.all([
      prisma.questionnaireResponse.findMany({
        where: responseWhere,
        select: {
          id: true,
          answers: true,
          completedAt: true,
          questionnaire: {
            select: {
              id: true,
              title: true,
              questions: true,
              panelIds: true,
            },
          },
        },
      }),

      // Previous period for trend calculation
      previousPeriod.start
        ? prisma.questionnaireResponse.findMany({
            where: previousWhere,
            select: {
              id: true,
              answers: true,
              questionnaire: {
                select: {
                  questions: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    // Extract NPS scores from responses
    const extractNPSScores = (
      responses: typeof currentResponses
    ): { score: number; date: Date; questionnaireId: string; panelIds: string[] }[] => {
      const scores: { score: number; date: Date; questionnaireId: string; panelIds: string[] }[] = [];

      responses.forEach((response) => {
        try {
          const questions = JSON.parse(response.questionnaire.questions as string);
          const answers = JSON.parse(response.answers as string);
          const panelIds = JSON.parse(response.questionnaire.panelIds as string);

          // Find NPS questions
          questions.forEach((q: any, index: number) => {
            if (q.type === 'nps' || (q.type === 'scale' && q.max === 10 && q.min === 0)) {
              const answer = answers[`q${index + 1}`];
              if (typeof answer === 'number' && answer >= 0 && answer <= 10) {
                scores.push({
                  score: answer,
                  date: response.completedAt,
                  questionnaireId: response.questionnaire.id,
                  panelIds: Array.isArray(panelIds) ? panelIds : [],
                });
              }
            }
          });
        } catch (error) {
          console.error('Error parsing response data:', error);
        }
      });

      return scores;
    };

    const currentScores = extractNPSScores(currentResponses);
    const previousScores = extractNPSScores(previousResponses);

    // Calculate overall NPS
    const overallNPS = calculateNPS(currentScores.map((s) => s.score));
    const previousNPS = calculateNPS(previousScores.map((s) => s.score));
    const trend = calculateTrend(overallNPS, previousNPS);

    // Categorize scores
    const promoters = currentScores.filter((s) => s.score >= 9).length;
    const passives = currentScores.filter((s) => s.score >= 7 && s.score <= 8).length;
    const detractors = currentScores.filter((s) => s.score <= 6).length;

    // NPS over time
    const npsOverTime: TimeSeriesData[] = [];
    const dateGroups = new Map<string, number[]>();

    currentScores.forEach((item) => {
      const date = new Date(item.date);
      let key: string;

      if (timeRange === '7d' || timeRange === '30d') {
        key = date.toISOString().split('T')[0] || '';
      } else if (timeRange === '90d') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0] || '';
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const scores = dateGroups.get(key) || [];
      scores.push(item.score);
      dateGroups.set(key, scores);
    });

    dateGroups.forEach((scores, date) => {
      npsOverTime.push({
        date,
        value: calculateNPS(scores),
      });
    });
    npsOverTime.sort((a, b) => a.date.localeCompare(b.date));

    // NPS distribution
    const npsDistribution: CategoryData[] = [
      { category: 'Detractors (0-6)', value: detractors, color: '#ef4444' },
      { category: 'Passives (7-8)', value: passives, color: '#f59e0b' },
      { category: 'Promoters (9-10)', value: promoters, color: '#10b981' },
    ];

    // Score breakdown (0-10)
    const scoreMap = new Map<number, number>();
    for (let i = 0; i <= 10; i++) {
      scoreMap.set(i, 0);
    }

    currentScores.forEach((item) => {
      scoreMap.set(item.score, (scoreMap.get(item.score) || 0) + 1);
    });

    const scoreBreakdown = Array.from(scoreMap.entries()).map(([score, count]) => ({
      score,
      count,
      percentage: currentScores.length > 0 ? (count / currentScores.length) * 100 : 0,
    }));

    // NPS by panel
    const panelScoreMap = new Map<string, number[]>();

    currentScores.forEach((item) => {
      item.panelIds.forEach((pId) => {
        const scores = panelScoreMap.get(pId) || [];
        scores.push(item.score);
        panelScoreMap.set(pId, scores);
      });
    });

    const panelIds = Array.from(panelScoreMap.keys());
    const panels = await prisma.panel.findMany({
      where: { id: { in: panelIds } },
      select: { id: true, name: true },
    });

    const npsByPanel = panels.map((panel) => {
      const scores = panelScoreMap.get(panel.id) || [];
      return {
        panelId: panel.id,
        panelName: panel.name,
        npsScore: calculateNPS(scores),
        responseCount: scores.length,
      };
    });

    // Sort by response count descending
    npsByPanel.sort((a, b) => b.responseCount - a.responseCount);

    // NPS by questionnaire
    const questionnaireScoreMap = new Map<string, number[]>();

    currentScores.forEach((item) => {
      const scores = questionnaireScoreMap.get(item.questionnaireId) || [];
      scores.push(item.score);
      questionnaireScoreMap.set(item.questionnaireId, scores);
    });

    const qIds = Array.from(questionnaireScoreMap.keys());
    const questionnaires = await prisma.questionnaire.findMany({
      where: { id: { in: qIds } },
      select: { id: true, title: true },
    });

    const npsByQuestionnaire = questionnaires.map((q) => {
      const scores = questionnaireScoreMap.get(q.id) || [];
      return {
        questionnaireId: q.id,
        questionnaireTitle: q.title,
        npsScore: calculateNPS(scores),
        responseCount: scores.length,
      };
    });

    // Sort by response count descending
    npsByQuestionnaire.sort((a, b) => b.responseCount - a.responseCount);

    // Build analytics response
    const analytics: NPSAnalytics = {
      summary: {
        overallNPS: Math.round(overallNPS),
        totalResponses: currentScores.length,
        promoters,
        passives,
        detractors,
        trend: trend.changePercentage,
      },
      npsOverTime,
      npsDistribution,
      npsByPanel,
      npsByQuestionnaire,
      scoreBreakdown,
    };

    // Cache response for 5 minutes
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching NPS analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
