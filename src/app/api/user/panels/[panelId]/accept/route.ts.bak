import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

/**
 * POST /api/user/panels/[panelId]/accept - Accept panel invitation
 *
 * Access: User must have an invitation to the panel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { panelId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to accept panel invitations' },
        { status: 401 }
      );
    }

    const panelId = params.panelId;

    // Fetch membership
    const membership = await prisma.panelMembership.findUnique({
      where: {
        panelId_userId: {
          panelId,
          userId: user.id,
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
        { error: 'Not found', message: 'Panel invitation not found' },
        { status: 404 }
      );
    }

    // Check if already active (accepted)
    if (membership.active) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Panel membership already active',
        },
        { status: 400 }
      );
    }

    // Update membership to accepted
    const updatedMembership = await prisma.panelMembership.update({
      where: {
        panelId_userId: {
          panelId,
          userId: user.id,
        },
      },
      data: {
        active: true,
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

    // Log event
    await prisma.event.create({
      data: {
        type: 'panel.member_accepted',
        userId: user.id,
        payload: JSON.stringify({
          panelId,
          panelName: membership.panel.name,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedMembership,
      message: 'Panel invitation accepted successfully',
    });
  } catch (error) {
    console.error('Error accepting panel invitation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to accept panel invitation. Please try again later.',
      },
      { status: 500 }
    );
  }
}
