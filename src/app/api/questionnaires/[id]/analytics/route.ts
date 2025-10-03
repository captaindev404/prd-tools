import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canViewQuestionnaireResponses, hasRole } from '@/lib/auth-helpers';
import {
  QuestionType,
} from '@/types/questionnaire';
import type {
  Question,
  QuestionAnalytics,
  LikertAnalytics,
  NPSAnalytics,
  MCQAnalytics,
  TextAnalytics,
  RatingAnalytics,
  DemographicsAnalytics,
} from '@/types/questionnaire';
import {
  computeNPS,
  computeLikertDistribution,
  computeMCQDistribution,
  computeNumericStats,
  segmentByVillage,
  segmentByRole,
} from '@/lib/questionnaire-analytics';

/**
 * GET /api/questionnaires/[id]/analytics - Get questionnaire analytics
 *
 * RESEARCHER/PM/PO/ADMIN roles only
 * Returns aggregated analytics for all questions
 * Supports segmentation query param: ?segment=village|role|panel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Check permissions - RESEARCHER/PM/PO/ADMIN
    if (!hasRole(user, ['RESEARCHER', 'PM', 'PO', 'ADMIN'])) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to view analytics',
        },
        { status: 403 }
      );
    }

    const questionnaireId = params.id;

    // Get segmentation parameter
    const searchParams = request.nextUrl.searchParams;
    const segmentBy = searchParams.get('segment'); // village, role, or panel

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Not found', message: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Fetch all responses
    const responses = await prisma.questionnaireResponse.findMany({
      where: { questionnaireId },
      include: {
        respondent: {
          select: {
            id: true,
            role: true,
            currentVillageId: true,
          },
        },
      },
    });

    const totalResponses = responses.length;

    if (totalResponses === 0) {
      return NextResponse.json({
        success: true,
        data: {
          questionnaireId,
          totalResponses: 0,
          responsesByDate: {},
          lastResponseAt: null,
          questions: [],
          demographics: {
            byRole: {},
            byVillage: {},
            totalResponses: 0,
          },
          segmentation: segmentBy ? { type: segmentBy, segments: {} } : undefined,
        },
      });
    }

    // Parse questions
    const questions: Question[] = JSON.parse(questionnaire.questions || '[]');

    // Calculate responses by date
    const responsesByDate: Record<string, number> = {};
    responses.forEach((r) => {
      const date = r.completedAt.toISOString().split('T')[0];
      responsesByDate[date] = (responsesByDate[date] || 0) + 1;
    });

    // Get last response date
    const lastResponseAt = responses.reduce((latest, r) => {
      return r.completedAt > latest ? r.completedAt : latest;
    }, responses[0].completedAt);

    // Calculate question-level analytics
    const questionAnalytics: QuestionAnalytics[] = questions.map((question) => {
      const answers = responses
        .map((r) => {
          const parsed = JSON.parse(r.answers);
          return parsed[question.id];
        })
        .filter((a) => a !== undefined && a !== null);

      return {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        data: calculateQuestionAnalytics(question, answers),
      };
    });

    // Calculate demographics
    const demographics: DemographicsAnalytics = {
      byRole: {},
      byVillage: {},
      totalResponses,
    };

    responses.forEach((r) => {
      // By role
      const role = r.respondent.role;
      demographics.byRole[role] = (demographics.byRole[role] || 0) + 1;

      // By village
      const village = r.respondent.currentVillageId || 'unassigned';
      demographics.byVillage[village] = (demographics.byVillage[village] || 0) + 1;
    });

    // Segmentation (if requested)
    let segmentation: any = undefined;
    if (segmentBy) {
      if (segmentBy === 'village') {
        // Create village map
        const userVillageMap: Record<string, string> = {};
        responses.forEach((r) => {
          userVillageMap[r.respondentId] = r.respondent.currentVillageId || 'unassigned';
        });

        // Segment responses
        const responsesWithUserId = responses.map((r) => ({
          userId: r.respondentId,
          response: r,
        }));
        const segments = segmentByVillage(responsesWithUserId, userVillageMap);

        segmentation = {
          type: 'village',
          segments: Object.keys(segments).reduce((acc, villageId) => {
            acc[villageId] = {
              count: segments[villageId].length,
              percentage: Math.round((segments[villageId].length / totalResponses) * 100),
            };
            return acc;
          }, {} as Record<string, any>),
        };
      } else if (segmentBy === 'role') {
        // Create role map
        const userRoleMap: Record<string, string> = {};
        responses.forEach((r) => {
          userRoleMap[r.respondentId] = r.respondent.role;
        });

        // Segment responses
        const responsesWithUserId = responses.map((r) => ({
          userId: r.respondentId,
          response: r,
        }));
        const segments = segmentByRole(responsesWithUserId, userRoleMap);

        segmentation = {
          type: 'role',
          segments: Object.keys(segments).reduce((acc, role) => {
            acc[role] = {
              count: segments[role].length,
              percentage: Math.round((segments[role].length / totalResponses) * 100),
            };
            return acc;
          }, {} as Record<string, any>),
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        questionnaireId,
        totalResponses,
        responsesByDate,
        lastResponseAt,
        questions: questionAnalytics,
        demographics,
        segmentation,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch analytics. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate analytics for a specific question type
 */
function calculateQuestionAnalytics(
  question: Question,
  answers: any[]
): LikertAnalytics | NPSAnalytics | MCQAnalytics | TextAnalytics | RatingAnalytics {
  const type = question.type;

  switch (type) {
    case QuestionType.LIKERT_5:
    case QuestionType.LIKERT_7:
      return calculateLikertAnalytics(answers, type === QuestionType.LIKERT_7 ? 7 : 5);

    case QuestionType.NPS:
      return calculateNPSAnalytics(answers);

    case QuestionType.MCQ_SINGLE:
    case QuestionType.MCQ_MULTIPLE:
      return calculateMCQAnalytics(answers, question);

    case QuestionType.TEXT:
      return calculateTextAnalytics(answers);

    case QuestionType.RATING:
      return calculateRatingAnalytics(answers, question.maxRating || 5);

    default:
      throw new Error(`Unknown question type: ${type}`);
  }
}

/**
 * Calculate Likert scale analytics
 */
function calculateLikertAnalytics(answers: number[], scale: number): LikertAnalytics {
  const distribution: Record<number, number> = {};
  for (let i = 1; i <= scale; i++) {
    distribution[i] = 0;
  }

  answers.forEach((answer) => {
    if (answer >= 1 && answer <= scale) {
      distribution[answer]++;
    }
  });

  const sorted = [...answers].sort((a, b) => a - b);
  const mean = answers.reduce((sum, a) => sum + a, 0) / answers.length;
  const median = sorted[Math.floor(sorted.length / 2)];

  // Calculate mode
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = sorted[0];
  answers.forEach((answer) => {
    frequency[answer] = (frequency[answer] || 0) + 1;
    if (frequency[answer] > maxFreq) {
      maxFreq = frequency[answer];
      mode = answer;
    }
  });

  return {
    mean: Math.round(mean * 100) / 100,
    median,
    mode,
    distribution,
    totalResponses: answers.length,
  };
}

/**
 * Calculate NPS analytics
 * NPS = (% promoters - % detractors)
 * Promoters: 9-10
 * Passives: 7-8
 * Detractors: 0-6
 */
function calculateNPSAnalytics(answers: number[]): NPSAnalytics {
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  answers.forEach((answer) => {
    if (answer >= 9) {
      promoters++;
    } else if (answer >= 7) {
      passives++;
    } else {
      detractors++;
    }
  });

  const total = answers.length;
  const promotersPercent = (promoters / total) * 100;
  const passivesPercent = (passives / total) * 100;
  const detractorsPercent = (detractors / total) * 100;
  const score = promotersPercent - detractorsPercent;

  return {
    score: Math.round(score * 100) / 100,
    promoters,
    passives,
    detractors,
    promotersPercent: Math.round(promotersPercent * 100) / 100,
    passivesPercent: Math.round(passivesPercent * 100) / 100,
    detractorsPercent: Math.round(detractorsPercent * 100) / 100,
    totalResponses: total,
  };
}

/**
 * Calculate MCQ analytics
 */
function calculateMCQAnalytics(answers: any[], question: Question): MCQAnalytics {
  const distribution: Record<string, number> = {};
  const percentages: Record<string, number> = {};

  // Initialize for all options
  if ('options' in question && question.options) {
    question.options.forEach((opt) => {
      distribution[opt.id] = 0;
    });
  }

  // Count answers
  answers.forEach((answer) => {
    if (Array.isArray(answer)) {
      // MCQ_MULTIPLE
      answer.forEach((optionId) => {
        distribution[optionId] = (distribution[optionId] || 0) + 1;
      });
    } else {
      // MCQ_SINGLE
      distribution[answer] = (distribution[answer] || 0) + 1;
    }
  });

  // Calculate percentages
  const total = answers.length;
  Object.keys(distribution).forEach((optionId) => {
    percentages[optionId] = Math.round((distribution[optionId] / total) * 10000) / 100;
  });

  return {
    distribution,
    percentages,
    totalResponses: total,
  };
}

/**
 * Calculate text analytics
 */
function calculateTextAnalytics(answers: string[]): TextAnalytics {
  // Optional: Calculate word frequency for word cloud
  const wordFrequency: Record<string, number> = {};

  answers.forEach((answer) => {
    const words = answer
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3); // Filter out short words

    words.forEach((word) => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });

  return {
    responses: answers,
    wordFrequency,
    totalResponses: answers.length,
  };
}

/**
 * Calculate rating analytics
 */
function calculateRatingAnalytics(answers: number[], maxRating: number): RatingAnalytics {
  const distribution: Record<number, number> = {};
  for (let i = 1; i <= maxRating; i++) {
    distribution[i] = 0;
  }

  answers.forEach((answer) => {
    if (answer >= 1 && answer <= maxRating) {
      distribution[answer]++;
    }
  });

  const average = answers.reduce((sum, a) => sum + a, 0) / answers.length;

  return {
    average: Math.round(average * 100) / 100,
    distribution,
    totalResponses: answers.length,
  };
}
