import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getCurrentUser,
  hasRole,
  canEditQuestionnaire,
  canDeleteQuestionnaire,
  canViewQuestionnaireResponses,
} from '@/lib/auth-helpers';
import type { UpdateQuestionnaireInput } from '@/types/questionnaire';
import { normalizeQuestionText, normalizeMcqOptions, warnBilingualDeprecation } from '@/lib/questionnaire-helpers';

/**
 * GET /api/questionnaires/[id] - Get questionnaire details
 *
 * RESEARCHER/PM see full details including analytics
 * Regular users see published questionnaires only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id: questionnaireId } = await params;

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
        panels: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Not found', message: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canViewFull = canViewQuestionnaireResponses(user);

    // Regular users can only see published questionnaires
    if (!canViewFull && questionnaire.status !== 'published') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to view this questionnaire' },
        { status: 403 }
      );
    }

    // Parse JSON fields
    const questions = JSON.parse(questionnaire.questions || '[]');
    const panelIds = JSON.parse(questionnaire.panelIds || '[]');
    const adHocFilters = JSON.parse(questionnaire.adHocFilters || '{}');

    // Build targeting info
    let targetingType = 'all_users';
    if (panelIds.length > 0) {
      targetingType = 'specific_panels';
    } else if (adHocFilters.villages?.length > 0) {
      targetingType = 'specific_villages';
    } else if (adHocFilters.roles?.length > 0) {
      targetingType = 'by_role';
    }

    // Check if current user has responded
    let userHasResponded = false;
    if (!canViewFull) {
      const existingResponse = await prisma.questionnaireResponse.findFirst({
        where: {
          questionnaireId: questionnaire.id,
          respondentId: user.id,
        },
      });
      userHasResponded = !!existingResponse;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: questionnaire.id,
        title: questionnaire.title,
        version: questionnaire.version,
        status: questionnaire.status,
        questions,
        targeting: {
          type: targetingType,
          panelIds,
          villageIds: adHocFilters.villages || [],
          roles: adHocFilters.roles || [],
        },
        anonymous: questionnaire.anonymous,
        responseLimit: questionnaire.responseLimit,
        startAt: questionnaire.startAt,
        endAt: questionnaire.endAt,
        maxResponses: questionnaire.maxResponses,
        createdAt: questionnaire.createdAt,
        updatedAt: questionnaire.updatedAt,
        responseCount: questionnaire._count.responses,
        creator: questionnaire.createdBy,
        panels: questionnaire.panels,
        userHasResponded,
      },
    });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch questionnaire. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/questionnaires/[id] - Update questionnaire
 *
 * RESEARCHER/PM/ADMIN roles only
 * Only draft questionnaires can be updated
 * Published questionnaires require creating a new version
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Check authorization - RESEARCHER/PM/ADMIN roles required
    if (!hasRole(user, ['RESEARCHER', 'PM', 'ADMIN'])) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: questionnaireId } = await params;

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Not found', message: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Check if questionnaire is in draft status
    if (questionnaire.status !== 'draft') {
      return NextResponse.json(
        {
          error: 'Invalid state',
          message: 'Only draft questionnaires can be updated. Published questionnaires cannot be modified.',
        },
        { status: 400 }
      );
    }

    // Check permissions
    if (!canEditQuestionnaire(user, { createdById: questionnaire.createdById })) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to edit this questionnaire',
        },
        { status: 403 }
      );
    }

    const body: UpdateQuestionnaireInput = await request.json();

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
          `PATCH /api/questionnaires/${questionnaireId}. ` +
          'This format is deprecated since v0.6.0. Please use plain strings for question text and MCQ options. ' +
          'Questions have been automatically normalized to English-only format.'
        );
      }
    }

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.length < 3) {
        errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
      } else if (body.title.length > 200) {
        errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
      }
    }

    if (body.questions !== undefined) {
      if (!Array.isArray(body.questions) || body.questions.length === 0) {
        errors.push({ field: 'questions', message: 'At least one question is required' });
      } else {
        // Validate each question
        body.questions.forEach((q, index) => {
          if (!q.type) {
            errors.push({
              field: `questions[${index}].type`,
              message: 'Question type is required',
            });
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

    // Prepare update data
    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.questions !== undefined) {
      updateData.questions = JSON.stringify(body.questions);
    }

    if (body.targeting !== undefined) {
      const panelIds = body.targeting.panelIds || [];
      const adHocFilters: any = {};

      if (body.targeting.type === 'specific_villages' && body.targeting.villageIds) {
        adHocFilters.villages = body.targeting.villageIds;
      }
      if (body.targeting.type === 'by_role' && body.targeting.roles) {
        adHocFilters.roles = body.targeting.roles;
      }

      updateData.panelIds = JSON.stringify(panelIds);
      updateData.adHocFilters = JSON.stringify(adHocFilters);
    }

    if (body.anonymous !== undefined) {
      updateData.anonymous = body.anonymous;
    }

    if (body.responseLimit !== undefined) {
      updateData.responseLimit = body.responseLimit;
    }

    if (body.endAt !== undefined) {
      updateData.endAt = body.endAt ? new Date(body.endAt) : null;
    }

    if (body.maxResponses !== undefined) {
      updateData.maxResponses = body.maxResponses;
    }

    // Update questionnaire (draft only, so no version increment needed)
    const updated = await prisma.questionnaire.update({
      where: { id: questionnaireId },
      data: updateData,
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
        type: 'questionnaire.updated',
        userId: user.id,
        payload: JSON.stringify({
          questionnaireId: updated.id,
          title: updated.title,
          version: updated.version,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        questions: JSON.parse(updated.questions),
        panelIds: JSON.parse(updated.panelIds),
        adHocFilters: JSON.parse(updated.adHocFilters),
      },
      message: 'Questionnaire updated successfully',
    });
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update questionnaire. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/questionnaires/[id] - Delete questionnaire
 *
 * Only allow if status = 'draft' or no responses
 * Otherwise, set status to 'closed'
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id: questionnaireId } = await params;

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Not found', message: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canDeleteQuestionnaire(user, { createdById: questionnaire.createdById })) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to delete this questionnaire',
        },
        { status: 403 }
      );
    }

    // If draft or no responses, allow deletion
    if (questionnaire.status === 'draft' || questionnaire._count.responses === 0) {
      await prisma.questionnaire.delete({
        where: { id: questionnaireId },
      });

      // Log event
      await prisma.event.create({
        data: {
          type: 'questionnaire.deleted',
          userId: user.id,
          payload: JSON.stringify({
            questionnaireId,
            title: questionnaire.title,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Questionnaire deleted successfully',
      });
    } else {
      // Close instead of delete
      await prisma.questionnaire.update({
        where: { id: questionnaireId },
        data: { status: 'closed' },
      });

      // Log event
      await prisma.event.create({
        data: {
          type: 'questionnaire.closed',
          userId: user.id,
          payload: JSON.stringify({
            questionnaireId,
            title: questionnaire.title,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Questionnaire closed (has responses, cannot be deleted)',
      });
    }
  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete questionnaire. Please try again later.',
      },
      { status: 500 }
    );
  }
}
