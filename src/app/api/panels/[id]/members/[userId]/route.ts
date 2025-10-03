import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canManagePanelMembers } from '@/lib/auth-helpers';

/**
 * PATCH /api/panels/[id]/members/[userId] - Update membership status
 *
 * Request body:
 * - status: string (accepted, declined, removed)
 *
 * Access:
 * - Users can accept/decline their own invitations
 * - RESEARCHER/PM/ADMIN can remove members
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to update membership status' },
        { status: 401 }
      );
    }

    const panelId = params.id;
    const targetUserId = params.userId;

    // Fetch membership
    const membership = await prisma.panelMembership.findUnique({
      where: {
        panelId_userId: {
          panelId,
          userId: targetUserId,
        },
      },
      include: {
        panel: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not found', message: 'Membership not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (!body.status || typeof body.status !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Status is required and must be a string',
        },
        { status: 400 }
      );
    }

    const validStatuses = ['accepted', 'declined', 'removed'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check permission
    const canManage = canManagePanelMembers(user);
    const isOwnMembership = user.id === targetUserId;

    if (body.status === 'removed') {
      // Only RESEARCHER/PM/ADMIN can remove members
      if (!canManage) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'You do not have permission to remove panel members',
          },
          { status: 403 }
        );
      }
    } else {
      // For accept/decline, user must be acting on their own membership
      if (!isOwnMembership) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'You can only accept or decline your own panel invitations',
          },
          { status: 403 }
        );
      }

      // Can only accept/decline if currently invited
      // TODO: Add status field to PanelMembership model
      // if (membership.status !== 'invited') {
      //   return NextResponse.json(
      //     {
      //       error: 'Validation failed',
      //       message: `Cannot ${body.status} membership with status '${membership.status}'`,
      //     },
      //     { status: 400 }
      //   );
      // }
    }

    // Update membership
    const updateData: any = {
      status: body.status,
    };

    if (body.status === 'accepted') {
      updateData.acceptedAt = new Date();
      updateData.active = true;
    } else if (body.status === 'declined' || body.status === 'removed') {
      updateData.active = false;
    }

    const updatedMembership = await prisma.panelMembership.update({
      where: {
        panelId_userId: {
          panelId,
          userId: targetUserId,
        },
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
        panel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log event
    const eventType = `panel.member_${body.status}`;
    await prisma.event.create({
      data: {
        type: eventType,
        userId: user.id,
        payload: JSON.stringify({
          panelId,
          panelName: membership.panel.name,
          targetUserId,
          actorUserId: user.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedMembership,
      message: `Membership ${body.status} successfully`,
    });
  } catch (error) {
    console.error('Error updating membership status:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update membership status. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/panels/[id]/members/[userId] - Remove member from panel
 *
 * Access: RESEARCHER/PM/ADMIN only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to remove panel members' },
        { status: 401 }
      );
    }

    if (!canManagePanelMembers(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to remove panel members',
        },
        { status: 403 }
      );
    }

    const panelId = params.id;
    const targetUserId = params.userId;

    // Fetch membership
    const membership = await prisma.panelMembership.findUnique({
      where: {
        panelId_userId: {
          panelId,
          userId: targetUserId,
        },
      },
      include: {
        panel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not found', message: 'Membership not found' },
        { status: 404 }
      );
    }

    // Delete membership
    await prisma.panelMembership.delete({
      where: {
        panelId_userId: {
          panelId,
          userId: targetUserId,
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'panel.member_removed',
        userId: user.id,
        payload: JSON.stringify({
          panelId,
          panelName: membership.panel.name,
          removedUserId: targetUserId,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed from panel successfully',
    });
  } catch (error) {
    console.error('Error removing panel member:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to remove panel member. Please try again later.',
      },
      { status: 500 }
    );
  }
}
