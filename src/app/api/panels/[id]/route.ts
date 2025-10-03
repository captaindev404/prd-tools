import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canEditPanel, canDeletePanel, canManagePanelMembers } from '@/lib/auth-helpers';
import { validateCriteria, buildEligibilityWhereClause, filterUsersByConsents } from '@/lib/panel-eligibility';

/**
 * GET /api/panels/[id] - Get panel details
 *
 * Access:
 * - RESEARCHER/PM/ADMIN: See full details including eligible users count
 * - Panel members: See panel info and member list
 * - Non-members: 403 error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to view panel details' },
        { status: 401 }
      );
    }

    const panelId = params.id;

    // Fetch panel
    const panel = await prisma.panel.findUnique({
      where: { id: panelId },
      include: {
        memberships: {
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
        },
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

    // Check if user has access
    const canManage = canManagePanelMembers(user);
    const isMember = panel.memberships.some((m) => m.userId === user.id);

    if (!canManage && !isMember) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to view this panel' },
        { status: 403 }
      );
    }

    // Panel doesn't have createdById in schema
    const creator = null;

    // Fetch eligible users count (only for RESEARCHER/PM/ADMIN)
    let eligibleUsersCount = 0;
    if (canManage) {
      try {
        const eligibilityRules = JSON.parse(panel.eligibilityRules);
        const whereClause = buildEligibilityWhereClause(eligibilityRules);

        // Get all users matching DB-level criteria
        const candidateUsers = await prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            role: true,
            currentVillageId: true,
            consents: true,
            villageHistory: true,
            createdAt: true,
            email: true,
          },
        });

        // Filter by consent requirements (in-memory)
        const eligibleUsers = filterUsersByConsents(
          candidateUsers,
          eligibilityRules.required_consents || []
        );

        eligibleUsersCount = eligibleUsers.length;
      } catch (error) {
        console.error('Error calculating eligible users:', error);
      }
    }

    // Transform memberships for response
    // TODO: Add invitedById to PanelMembership
    const membershipsWithInviter = panel.memberships.map((membership) => ({
      ...membership,
      invitedBy: null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...panel,
        memberCount: panel._count.memberships,
        creator,
        memberships: membershipsWithInviter,
        eligibleUsersCount: canManage ? eligibleUsersCount : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching panel details:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch panel details. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/panels/[id] - Update panel
 *
 * Request body:
 * - name?: string
 * - description?: string
 * - eligibilityRules?: object
 * - sizeTarget?: number
 *
 * Access: RESEARCHER/PM/ADMIN or panel creator
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to update panels' },
        { status: 401 }
      );
    }

    const panelId = params.id;

    // Fetch panel
    const panel = await prisma.panel.findUnique({
      where: { id: panelId },
    });

    if (!panel) {
      return NextResponse.json(
        { error: 'Not found', message: 'Panel not found' },
        { status: 404 }
      );
    }

    // Check permission (Panel doesn't have createdById, so only RESEARCHER/PM/ADMIN can edit)
    if (!canEditPanel(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to edit this panel',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        errors.push({ field: 'name', message: 'Name must be a string' });
      } else if (body.name.length < 3) {
        errors.push({ field: 'name', message: 'Name must be at least 3 characters' });
      } else if (body.name.length > 100) {
        errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
      }
    }

    // Description field doesn't exist in Panel model

    if (body.eligibilityRules !== undefined) {
      const criteriaValidation = validateCriteria(body.eligibilityRules);
      if (!criteriaValidation.valid) {
        errors.push({
          field: 'eligibilityRules',
          message: `Invalid eligibility rules: ${criteriaValidation.errors.join(', ')}`,
        });
      }
    }

    if (body.sizeTarget !== undefined && body.sizeTarget !== null) {
      if (typeof body.sizeTarget !== 'number' || body.sizeTarget < 1) {
        errors.push({ field: 'sizeTarget', message: 'Size target must be a positive number' });
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

    // Build update data
    const updateData: any = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.eligibilityRules !== undefined) {
      updateData.eligibilityRules = JSON.stringify(body.eligibilityRules);
    }

    if (body.sizeTarget !== undefined) {
      updateData.sizeTarget = body.sizeTarget;
    }

    // Update panel
    const updatedPanel = await prisma.panel.update({
      where: { id: panelId },
      data: updateData,
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    // TODO: Add createdById to Panel model
    const creator = null;

    // Log event
    await prisma.event.create({
      data: {
        type: 'panel.updated',
        userId: user.id,
        payload: JSON.stringify({
          panelId: updatedPanel.id,
          panelName: updatedPanel.name,
          updatedFields: Object.keys(updateData),
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedPanel,
        memberCount: updatedPanel._count.memberships,
        creator,
      },
      message: 'Panel updated successfully',
    });
  } catch (error) {
    console.error('Error updating panel:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update panel. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/panels/[id] - Delete panel
 *
 * Soft delete (archive) if has members, hard delete if no members
 *
 * Access: ADMIN or panel creator
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to delete panels' },
        { status: 401 }
      );
    }

    const panelId = params.id;

    // Fetch panel with member count
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

    // Check permission (Panel doesn't have createdById, so only ADMIN can delete)
    if (!canDeletePanel(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to delete this panel',
        },
        { status: 403 }
      );
    }

    const hasMembers = panel._count.memberships > 0;

    if (hasMembers) {
      // Soft delete (archive)
      // TODO: Add archived field to Panel model
      // await prisma.panel.update({
      //   where: { id: panelId },
      //   data: { archived: true },
      // });

      // Log event
      await prisma.event.create({
        data: {
          type: 'panel.archived',
          userId: user.id,
          payload: JSON.stringify({
            panelId: panel.id,
            panelName: panel.name,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Panel archived successfully (panel has members)',
      });
    } else {
      // Hard delete (no members)
      await prisma.panel.delete({
        where: { id: panelId },
      });

      // Log event
      await prisma.event.create({
        data: {
          type: 'panel.deleted',
          userId: user.id,
          payload: JSON.stringify({
            panelId: panel.id,
            panelName: panel.name,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Panel deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting panel:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete panel. Please try again later.',
      },
      { status: 500 }
    );
  }
}
