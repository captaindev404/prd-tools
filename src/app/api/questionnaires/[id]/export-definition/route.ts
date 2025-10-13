/**
 * API Route: Export Questionnaire Definition
 * GET /api/questionnaires/[id]/export-definition
 *
 * Returns questionnaire definition data for export (PDF/JSON).
 * This is different from /export which exports response data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { QuestionnaireExportData } from '@/lib/questionnaire-export';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user;
    const { id } = await context.params;

    // Check if user has researcher/PM/ADMIN role
    const isResearcher = ['RESEARCHER', 'PM', 'ADMIN'].includes(user.role || '');
    if (!isResearcher) {
      return NextResponse.json(
        { error: 'Forbidden: Only researchers, PMs, and admins can export questionnaires' },
        { status: 403 }
      );
    }

    // Fetch questionnaire with creator info
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Check ownership or admin privilege
    if (questionnaire.createdById !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: You can only export your own questionnaires' },
        { status: 403 }
      );
    }

    // Parse JSON fields
    const questions = JSON.parse(questionnaire.questions || '[]');
    const panelIds = JSON.parse(questionnaire.panelIds || '[]');
    const adHocFilters = JSON.parse(questionnaire.adHocFilters || '{}');

    // Determine targeting type
    let targetingType = 'all_users';
    if (panelIds.length > 0) {
      targetingType = 'specific_panels';
    } else if (adHocFilters.villages?.length > 0) {
      targetingType = 'specific_villages';
    } else if (adHocFilters.roles?.length > 0) {
      targetingType = 'by_role';
    }

    // Build export data
    const exportData: QuestionnaireExportData = {
      id: questionnaire.id,
      title: questionnaire.title,
      version: questionnaire.version,
      status: questionnaire.status,
      createdAt: questionnaire.createdAt.toISOString(),
      updatedAt: questionnaire.updatedAt.toISOString(),
      questions,
      targeting: {
        type: targetingType,
        panelIds: panelIds.length > 0 ? panelIds : undefined,
        villageIds: adHocFilters.villages?.length > 0 ? adHocFilters.villages : undefined,
        roles: adHocFilters.roles?.length > 0 ? adHocFilters.roles : undefined,
      },
      responseSettings: {
        anonymous: questionnaire.anonymous,
        responseLimit: questionnaire.responseLimit,
        startAt: questionnaire.startAt?.toISOString() || null,
        endAt: questionnaire.endAt?.toISOString() || null,
        maxResponses: questionnaire.maxResponses,
      },
      creator: {
        displayName: questionnaire.createdBy.displayName,
        email: questionnaire.createdBy.email,
      },
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting questionnaire definition:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
