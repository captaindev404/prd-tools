import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { checkEligibility, type EligibilityCriteria, buildEligibilityWhereClause, filterUsersByConsents } from '@/lib/panel-eligibility';

/**
 * GET /api/panels/[id]/eligibility-preview - Preview eligible users
 *
 * Returns count and sample of users who match the panel's eligibility criteria
 *
 * Access: RESEARCHER/PM/ADMIN only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to preview eligibility' },
        { status: 401 }
      );
    }

    // Check role authorization
    if (!['RESEARCHER', 'PM', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only RESEARCHER, PM, or ADMIN roles can preview panel eligibility',
        },
        { status: 403 }
      );
    }

    // Get panel
    const panel = await prisma.panel.findUnique({
      where: { id: params.id },
    });

    if (!panel) {
      return NextResponse.json(
        { error: 'Not found', message: 'Panel not found' },
        { status: 404 }
      );
    }

    // Parse eligibility rules
    let rules: EligibilityCriteria;
    try {
      rules = JSON.parse(panel.eligibilityRules || '{}');
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid eligibility rules',
          message: 'Panel has invalid eligibility rules JSON',
        },
        { status: 500 }
      );
    }

    // Build Prisma where clause for simple filtering (role, village, tenure)
    const where = buildEligibilityWhereClause(rules);

    // Fetch potential users (limit to avoid performance issues)
    const potentialUsers = await prisma.user.findMany({
      where,
      take: 200, // Get more than we need to account for consent filtering
      select: {
        id: true,
        employeeId: true,
        email: true,
        displayName: true,
        role: true,
        currentVillageId: true,
        consents: true,
        villageHistory: true,
        createdAt: true,
      },
    });

    // Filter by consent requirements (in-memory due to JSON field)
    let eligibleUsers = potentialUsers;
    if (rules.required_consents && rules.required_consents.length > 0) {
      eligibleUsers = filterUsersByConsents(potentialUsers, rules.required_consents);
    }

    // Further filter using full eligibility check (handles attribute predicates)
    if (rules.attributes_predicates && rules.attributes_predicates.length > 0) {
      eligibleUsers = eligibleUsers.filter((user) => {
        const result = checkEligibility(user, rules);
        return result.eligible;
      });
    }

    // Get count
    const count = eligibleUsers.length;

    // Get sample (first 10)
    const sample = eligibleUsers.slice(0, 10).map((user) => ({
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      villageId: user.currentVillageId,
    }));

    return NextResponse.json({
      success: true,
      data: {
        count,
        sample,
        note: count >= 200
          ? 'Count may be higher; showing sample of first 200 matches. Consider refining eligibility criteria.'
          : undefined,
      },
    });
  } catch (error) {
    console.error('Error previewing eligibility:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to preview eligibility. Please try again later.',
      },
      { status: 500 }
    );
  }
}
