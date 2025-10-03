import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canManagePanelMembers } from '@/lib/auth-helpers';
import { checkEligibility, buildEligibilityWhereClause, filterUsersByConsents } from '@/lib/panel-eligibility';
import { sendPanelInviteNotification } from '@/lib/notifications';

/**
 * GET /api/panels/[id]/members - List panel members
 *
 * Query parameters:
 * - status?: string (filter by status: invited, accepted, declined, removed)
 *
 * Access: RESEARCHER/PM/ADMIN or panel members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to view panel members' },
        { status: 401 }
      );
    }

    const panelId = params.id;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    // Check if panel exists
    const panel = await prisma.panel.findUnique({
      where: { id: panelId },
    });

    if (!panel) {
      return NextResponse.json(
        { error: 'Not found', message: 'Panel not found' },
        { status: 404 }
      );
    }

    // Check access
    const canManage = canManagePanelMembers(user);
    const isMember = await prisma.panelMembership.findFirst({
      where: { panelId, userId: user.id },
    });

    if (!canManage && !isMember) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to view this panel\'s members' },
        { status: 403 }
      );
    }

    // Build where clause
    const where: any = { panelId };
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Fetch memberships
    const memberships = await prisma.panelMembership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            currentVillageId: true,
            currentVillage: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: memberships,
    });
  } catch (error) {
    console.error('Error fetching panel members:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch panel members. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/panels/[id]/members - Invite users to panel
 *
 * Request body:
 * - userIds: string[] (array of user IDs to invite)
 *
 * Access: RESEARCHER/PM/ADMIN only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to invite members' },
        { status: 401 }
      );
    }

    if (!canManagePanelMembers(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to invite panel members',
        },
        { status: 403 }
      );
    }

    const panelId = params.id;

    // Fetch panel
    const panel = await prisma.panel.findUnique({
      where: { id: panelId },
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    if (!panel) {
      return NextResponse.json(
        { error: 'Not found', message: 'Panel not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validation
    if (!Array.isArray(body.userIds) || body.userIds.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'userIds must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // Check size target
    if (panel.sizeTarget) {
      const currentSize = panel._count.memberships;
      if (currentSize + body.userIds.length > panel.sizeTarget) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: `Inviting ${body.userIds.length} users would exceed panel size target of ${panel.sizeTarget} (current: ${currentSize})`,
          },
          { status: 400 }
        );
      }
    }

    // Parse eligibility criteria
    const eligibilityRules = JSON.parse(panel.eligibilityRules);

    // Fetch users to invite
    const usersToInvite = await prisma.user.findMany({
      where: {
        id: { in: body.userIds },
      },
      select: {
        id: true,
        employeeId: true,
        displayName: true,
        email: true,
        role: true,
        currentVillageId: true,
        consents: true,
        villageHistory: true,
        createdAt: true,
      },
    });

    if (usersToInvite.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'No valid users found with provided IDs',
        },
        { status: 400 }
      );
    }

    // Check eligibility and consent for each user
    const invitationResults = {
      invited: [] as string[],
      skipped: [] as Array<{ userId: string; reason: string }>,
    };

    for (const userToInvite of usersToInvite) {
      // Check if already a member
      const existingMembership = await prisma.panelMembership.findUnique({
        where: {
          panelId_userId: {
            panelId,
            userId: userToInvite.id,
          },
        },
      });

      if (existingMembership) {
        invitationResults.skipped.push({
          userId: userToInvite.id,
          reason: `Already a member`,
        });
        continue;
      }

      // Check eligibility
      const eligibilityCheck = checkEligibility(userToInvite, eligibilityRules);
      if (!eligibilityCheck.eligible) {
        invitationResults.skipped.push({
          userId: userToInvite.id,
          reason: `Does not meet eligibility criteria: ${eligibilityCheck.reasons.join('; ')}`,
        });
        continue;
      }

      // Create membership
      try {
        await prisma.panelMembership.create({
          data: {
            panelId,
            userId: userToInvite.id,
            // TODO: Add status and invitedById fields to PanelMembership model
            // status: 'invited',
            // invitedById: user.id,
            active: true,
          },
        });

        invitationResults.invited.push(userToInvite.id);

        // Log event
        await prisma.event.create({
          data: {
            type: 'panel.member_invited',
            userId: user.id,
            payload: JSON.stringify({
              panelId,
              panelName: panel.name,
              invitedUserId: userToInvite.id,
              invitedUserEmail: userToInvite.email,
              timestamp: new Date().toISOString(),
            }),
          },
        });

        // Send in-app notification to user
        await sendPanelInviteNotification(
          userToInvite.id,
          panelId,
          panel.name,
          user.displayName || user.email
        );
      } catch (error) {
        console.error(`Error creating membership for user ${userToInvite.id}:`, error);
        invitationResults.skipped.push({
          userId: userToInvite.id,
          reason: 'Failed to create membership',
        });
      }
    }

    return NextResponse.json({
      added: invitationResults.invited.length,
      skipped: invitationResults.skipped,
    });
  } catch (error) {
    console.error('Error inviting panel members:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to invite panel members. Please try again later.',
      },
      { status: 500 }
    );
  }
}
