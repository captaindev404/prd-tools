import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canViewQuestionnaireResponses } from '@/lib/auth-helpers';
import { QuestionType } from '@/types/questionnaire';
import type { SubmitResponseInput, Question } from '@/types/questionnaire';

/**
 * GET /api/questionnaires/[id]/responses - List responses
 *
 * RESEARCHER/PM only
 * Query parameters:
 * - startDate?: string (ISO date)
 * - endDate?: string (ISO date)
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

    // Check permissions
    if (!canViewQuestionnaireResponses(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to view responses',
        },
        { status: 403 }
      );
    }

    const questionnaireId = params.id;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Check questionnaire exists
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Not found', message: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {
      questionnaireId,
    };

    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) {
        where.completedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.completedAt.lte = new Date(endDate);
      }
    }

    // Fetch responses
    const responses = await prisma.questionnaireResponse.findMany({
      where,
      orderBy: {
        completedAt: 'desc',
      },
      include: {
        respondent: questionnaire.anonymous
          ? false
          : {
              select: {
                id: true,
                displayName: true,
                email: true,
                role: true,
                currentVillageId: true,
              },
            },
      },
    });

    // Parse answers
    const formattedResponses = responses.map((r) => ({
      id: r.id,
      questionnaireId: r.questionnaireId,
      respondentId: questionnaire.anonymous ? null : r.respondentId,
      respondent: questionnaire.anonymous ? null : r.respondent,
      answers: JSON.parse(r.answers),
      completedAt: r.completedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedResponses,
      total: responses.length,
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch responses. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questionnaires/[id]/responses - Submit response
 *
 * Verify user is targeted by questionnaire
 * Validate response against question schema
 * Check if user already responded (if limit = 1)
 */
export async function POST(
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

    const questionnaireId = params.id;

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Not found', message: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Check if published
    if (questionnaire.status !== 'published') {
      return NextResponse.json(
        {
          error: 'Invalid state',
          message: 'Questionnaire is not published',
        },
        { status: 400 }
      );
    }

    // Check if closed
    if (questionnaire.endAt && new Date() > questionnaire.endAt) {
      return NextResponse.json(
        {
          error: 'Questionnaire closed',
          message: 'This questionnaire is no longer accepting responses',
        },
        { status: 400 }
      );
    }

    // Check if max responses reached
    if (questionnaire.maxResponses) {
      const responseCount = await prisma.questionnaireResponse.count({
        where: { questionnaireId },
      });
      if (responseCount >= questionnaire.maxResponses) {
        return NextResponse.json(
          {
            error: 'Max responses reached',
            message: 'This questionnaire has reached its maximum number of responses',
          },
          { status: 400 }
        );
      }
    }

    // Check if user already responded (if responseLimit = 1)
    if (questionnaire.responseLimit === 1) {
      const existingResponse = await prisma.questionnaireResponse.findFirst({
        where: {
          questionnaireId,
          respondentId: user.id,
        },
      });

      if (existingResponse) {
        return NextResponse.json(
          {
            error: 'Already responded',
            message: 'You have already submitted a response to this questionnaire',
          },
          { status: 400 }
        );
      }
    }

    // TODO: Verify user is targeted by questionnaire
    // This would check panels, villages, roles based on adHocFilters
    // For now, we allow all users to respond to published questionnaires

    const body: SubmitResponseInput = await request.json();

    // Validate response
    const questions: Question[] = JSON.parse(questionnaire.questions || '[]');
    const errors: Array<{ field: string; message: string }> = [];

    // Check all required questions are answered
    questions.forEach((question) => {
      if (question.required && !body.answers[question.id]) {
        errors.push({
          field: `answers.${question.id}`,
          message: `Question "${question.text}" is required`,
        });
      }

      // Validate answer type
      const answer = body.answers[question.id];
      if (answer !== undefined && answer !== null) {
        switch (question.type) {
          case QuestionType.LIKERT_5:
            if (typeof answer !== 'number' || answer < 1 || answer > 5) {
              errors.push({
                field: `answers.${question.id}`,
                message: 'Answer must be a number between 1 and 5',
              });
            }
            break;
          case QuestionType.LIKERT_7:
            if (typeof answer !== 'number' || answer < 1 || answer > 7) {
              errors.push({
                field: `answers.${question.id}`,
                message: 'Answer must be a number between 1 and 7',
              });
            }
            break;
          case QuestionType.NPS:
            if (typeof answer !== 'number' || answer < 0 || answer > 10) {
              errors.push({
                field: `answers.${question.id}`,
                message: 'Answer must be a number between 0 and 10',
              });
            }
            break;
          case QuestionType.MCQ_SINGLE:
            if (typeof answer !== 'string') {
              errors.push({
                field: `answers.${question.id}`,
                message: 'Answer must be a single option ID',
              });
            }
            break;
          case QuestionType.MCQ_MULTIPLE:
            if (!Array.isArray(answer)) {
              errors.push({
                field: `answers.${question.id}`,
                message: 'Answer must be an array of option IDs',
              });
            }
            break;
          case QuestionType.TEXT:
            if (typeof answer !== 'string') {
              errors.push({
                field: `answers.${question.id}`,
                message: 'Answer must be a string',
              });
            } else if (question.maxLength && answer.length > question.maxLength) {
              errors.push({
                field: `answers.${question.id}`,
                message: `Answer must not exceed ${question.maxLength} characters`,
              });
            }
            break;
          case QuestionType.RATING:
            const maxRating = question.maxRating || 5;
            if (typeof answer !== 'number' || answer < 1 || answer > maxRating) {
              errors.push({
                field: `answers.${question.id}`,
                message: `Answer must be a number between 1 and ${maxRating}`,
              });
            }
            break;
        }
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please check your responses and try again',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Create response
    const response = await prisma.questionnaireResponse.create({
      data: {
        questionnaireId,
        respondentId: user.id,
        answers: JSON.stringify(body.answers),
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'questionnaire.response.recorded',
        userId: user.id,
        payload: JSON.stringify({
          questionnaireId,
          responseId: response.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: response.id,
          questionnaireId: response.questionnaireId,
          completedAt: response.completedAt,
        },
        message: 'Response submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to submit response. Please try again later.',
      },
      { status: 500 }
    );
  }
}
