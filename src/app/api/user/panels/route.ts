import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

/**
 * GET /api/user/panels - Get current user's panel memberships
 *
 * Returns all panels user is invited to or member of
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to view your panel memberships' },
        { status: 401 }
      );
    }

    // Fetch user's memberships
    const memberships = await prisma.panelMembership.findMany({
      where: { userId: user.id },
      include: {
        panel: {
          include: {
            _count: {
              select: {
                memberships: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Fetch creator and inviter details for each membership
    const membershipsWithDetails = await Promise.all(
      memberships.map(async (membership) => {
        const [creator, inviter] = await Promise.all([
          Promise.resolve(null), // Panel doesn't have createdById
          Promise.resolve(null), // PanelMembership doesn't have invitedById
        ]);

        return {
          ...membership,
          panel: {
            ...membership.panel,
            memberCount: membership.panel._count.memberships,
            creator,
          },
          invitedBy: inviter,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: membershipsWithDetails,
    });
  } catch (error) {
    console.error('Error fetching user panel memberships:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch panel memberships. Please try again later.',
      },
      { status: 500 }
    );
  }
}
