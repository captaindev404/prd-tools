import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

/**
 * POST /api/user/panels/[panelId]/decline - Decline panel invitation
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
        { error: 'Unauthorized', message: 'You must be logged in to decline panel invitations' },
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

    // Check if can be declined (not already active)
    if (membership.active) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Cannot decline - panel membership already active',
        },
        { status: 400 }
      );
    }

    // Update membership to declined
    const updatedMembership = await prisma.panelMembership.update({
      where: {
        panelId_userId: {
          panelId,
          userId: user.id,
        },
      },
      data: {
        active: false,
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
        type: 'panel.member_declined',
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
      message: 'Panel invitation declined successfully',
    });
  } catch (error) {
    console.error('Error declining panel invitation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to decline panel invitation. Please try again later.',
      },
      { status: 500 }
    );
  }
}
