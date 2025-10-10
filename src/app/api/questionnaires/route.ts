import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canCreateQuestionnaire } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import type { CreateQuestionnaireInput, QuestionnaireStatus } from '@/types/questionnaire';
import { normalizeQuestionText, normalizeMcqOptions, warnBilingualDeprecation } from '@/lib/questionnaire-helpers';

/**
 * GET /api/questionnaires - List questionnaires
 *
 * Query parameters:
 * - status?: 'draft' | 'published' | 'closed'
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 *
 * RESEARCHER/PM see all questionnaires
 * Regular users see published questionnaires targeted to them
 */
export async function GET(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as QuestionnaireStatus | null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Check if user can see all questionnaires (RESEARCHER/PM/ADMIN)
    const canSeeAll = canCreateQuestionnaire(user);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Regular users only see published questionnaires
    if (!canSeeAll) {
      where.status = 'published';
    }

    // Fetch questionnaires with counts
    const [questionnaires, total] = await Promise.all([
      prisma.questionnaire.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          createdBy: {
            select: {
              id: true,
              displayName: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
      }),
      prisma.questionnaire.count({ where }),
    ]);

    // For each questionnaire, check if user has responded
    const questionnairesWithUserStatus = await Promise.all(
      questionnaires.map(async (q) => {
        // Parse questions and targeting
        const questions = JSON.parse(q.questions || '[]');
        const adHocFilters = JSON.parse(q.adHocFilters || '{}');
        const panelIds = JSON.parse(q.panelIds || '[]');

        // Check if user has responded
        let userHasResponded = false;
        if (!canSeeAll) {
          const existingResponse = await prisma.questionnaireResponse.findFirst({
            where: {
              questionnaireId: q.id,
              respondentId: user.id,
            },
          });
          userHasResponded = !!existingResponse;
        }

        // Build targeting info
        let targetingType = 'all_users';
        if (panelIds.length > 0) {
          targetingType = 'specific_panels';
        } else if (adHocFilters.villages?.length > 0) {
          targetingType = 'specific_villages';
        } else if (adHocFilters.roles?.length > 0) {
          targetingType = 'by_role';
        }

        return {
          id: q.id,
          title: q.title,
          version: q.version,
          status: q.status,
          anonymous: q.anonymous,
          responseLimit: q.responseLimit,
          startAt: q.startAt,
          endAt: q.endAt,
          maxResponses: q.maxResponses,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          questionCount: questions.length,
          responseCount: q._count.responses,
          creator: q.createdBy,
          userHasResponded,
          targeting: {
            type: targetingType,
            panelIds,
            villageIds: adHocFilters.villages || [],
            roles: adHocFilters.roles || [],
          },
        };
      })
    );

    const response = NextResponse.json({
      items: questionnairesWithUserStatus,
      total,
      page,
      limit,
      hasMore: skip + questionnaires.length < total,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch questionnaires. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questionnaires - Create questionnaire
 *
 * RESEARCHER/PM only
 *
 * Request body: CreateQuestionnaireInput
 */
export async function POST(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canCreateQuestionnaire(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to create questionnaires',
        },
        { status: 403 }
      );
    }

    const body: CreateQuestionnaireInput = await request.json();

    // Normalize questions for backward compatibility (v0.6.0+)
    // Convert old bilingual format {en, fr} to new English-only format
    let hasBilingualFormat = false;
    if (body.questions && Array.isArray(body.questions)) {
      body.questions = body.questions.map((q: any) => {
        const normalizedQuestion = { ...q };

        // Normalize question text
        if (typeof q.text === 'object' && q.text !== null && ('en' in q.text || 'fr' in q.text)) {
          hasBilingualFormat = true;
          normalizedQuestion.text = normalizeQuestionText(q.text);
        }

        // Normalize MCQ options if present
        if ((q.type === 'mcq_single' || q.type === 'mcq_multiple') && q.options) {
          const normalizedOptions = normalizeMcqOptions(q.options);
          if (normalizedOptions.length !== q.options.length ||
              JSON.stringify(normalizedOptions) !== JSON.stringify(q.options)) {
            hasBilingualFormat = true;
            normalizedQuestion.options = normalizedOptions;
          }
        }

        return normalizedQuestion;
      });

      // Warn about deprecated bilingual format
      if (hasBilingualFormat) {
        warnBilingualDeprecation(
          'Bilingual question format detected in POST /api/questionnaires. ' +
          'This format is deprecated since v0.6.0. Please use plain strings for question text and MCQ options. ' +
          'Questions have been automatically normalized to English-only format.'
        );
      }
    }

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (!body.title || typeof body.title !== 'string') {
      errors.push({ field: 'title', message: 'Title is required' });
    } else if (body.title.length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    } else if (body.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
    }

    if (!body.questions || !Array.isArray(body.questions)) {
      errors.push({ field: 'questions', message: 'Questions array is required' });
    } else if (body.questions.length === 0) {
      errors.push({ field: 'questions', message: 'At least one question is required' });
    } else {
      // Validate each question
      body.questions.forEach((q, index) => {
        if (!q.type) {
          errors.push({ field: `questions[${index}].type`, message: 'Question type is required' });
        }
        if (!q.text || q.text.length < 3) {
          errors.push({
            field: `questions[${index}].text`,
            message: 'Question text must be at least 3 characters',
          });
        }
        if (q.type === 'mcq_single' || q.type === 'mcq_multiple') {
          if (!q.options || q.options.length < 2) {
            errors.push({
              field: `questions[${index}].options`,
              message: 'MCQ questions must have at least 2 options',
            });
          }
        }
      });
    }

    if (!body.targeting) {
      errors.push({ field: 'targeting', message: 'Targeting configuration is required' });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please check your input and try again',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Build panel IDs array
    const panelIds = body.targeting.panelIds || [];

    // Build ad-hoc filters
    const adHocFilters: any = {};
    if (body.targeting.type === 'specific_villages' && body.targeting.villageIds) {
      adHocFilters.villages = body.targeting.villageIds;
    }
    if (body.targeting.type === 'by_role' && body.targeting.roles) {
      adHocFilters.roles = body.targeting.roles;
    }

    // Verify panels exist
    if (panelIds.length > 0) {
      const panelCount = await prisma.panel.count({
        where: {
          id: {
            in: panelIds,
          },
        },
      });
      if (panelCount !== panelIds.length) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'One or more panel IDs are invalid',
          },
          { status: 400 }
        );
      }
    }

    // Create questionnaire
    const questionnaire = await prisma.questionnaire.create({
      data: {
        id: `qnn_${ulid()}`,
        title: body.title,
        version: '1.0.0',
        status: 'draft',
        questions: JSON.stringify(body.questions),
        panelIds: JSON.stringify(panelIds),
        adHocFilters: JSON.stringify(adHocFilters),
        anonymous: body.anonymous || false,
        responseLimit: body.responseLimit || 1,
        startAt: body.startAt ? new Date(body.startAt) : null,
        endAt: body.endAt ? new Date(body.endAt) : null,
        maxResponses: body.maxResponses || null,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'questionnaire.created',
        userId: user.id,
        payload: JSON.stringify({
          questionnaireId: questionnaire.id,
          title: questionnaire.title,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          ...questionnaire,
          questions: JSON.parse(questionnaire.questions),
          panelIds: JSON.parse(questionnaire.panelIds),
          adHocFilters: JSON.parse(questionnaire.adHocFilters),
        },
        message: 'Questionnaire created successfully',
      },
      { status: 201 }
    );

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create questionnaire. Please try again later.',
      },
      { status: 500 }
    );
  }
}
