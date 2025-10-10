import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/questionnaires/audience-stats
 * Calculate estimated audience size based on targeting criteria
 * Request body: { targetingType, panelIds?, villageIds?, roles? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Only researchers and admins can access this
    if (user.role !== 'RESEARCHER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Researcher or Admin access required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetingType, panelIds, villageIds, roles } = body;

    if (!targetingType) {
      return NextResponse.json(
        { error: 'targetingType is required' },
        { status: 400 }
      );
    }

    let estimatedReach = 0;
    let breakdown: Record<string, any> = {};

    switch (targetingType) {
      case 'all_users': {
        // Count all active users
        const totalUsers = await prisma.user.count();
        estimatedReach = totalUsers;
        breakdown = {
          description: 'All registered users',
          totalUsers,
        };
        break;
      }

      case 'specific_panels': {
        if (!panelIds || panelIds.length === 0) {
          return NextResponse.json({
            estimatedReach: 0,
            breakdown: {
              description: 'No panels selected',
              panels: [],
            },
          });
        }

        // Get membership counts for selected panels
        const panels = await prisma.panel.findMany({
          where: {
            id: { in: panelIds },
            archived: false,
          },
          include: {
            _count: {
              select: {
                memberships: {
                  where: {
                    active: true,
                  },
                },
              },
            },
          },
        });

        // Get unique user IDs across all selected panels to avoid double-counting
        const uniqueUserIds = await prisma.panelMembership.findMany({
          where: {
            panelId: { in: panelIds },
            active: true,
          },
          distinct: ['userId'],
          select: {
            userId: true,
          },
        });

        estimatedReach = uniqueUserIds.length;

        breakdown = {
          description: 'Users in selected panels (deduplicated)',
          panels: panels.map(p => ({
            id: p.id,
            name: p.name,
            memberCount: p._count.memberships,
          })),
          totalMemberships: panels.reduce((sum, p) => sum + p._count.memberships, 0),
          uniqueUsers: uniqueUserIds.length,
        };
        break;
      }

      case 'specific_villages': {
        if (!villageIds || villageIds.length === 0) {
          return NextResponse.json({
            estimatedReach: 0,
            breakdown: {
              description: 'No villages selected',
              villages: [],
            },
          });
        }

        // Get user counts per village
        const villages = await prisma.village.findMany({
          where: {
            id: { in: villageIds },
          },
          include: {
            _count: {
              select: {
                users: true,
              },
            },
          },
        });

        // Get unique users across selected villages
        const uniqueUserIds = await prisma.user.findMany({
          where: {
            currentVillageId: { in: villageIds },
          },
          distinct: ['id'],
          select: {
            id: true,
          },
        });

        estimatedReach = uniqueUserIds.length;

        breakdown = {
          description: 'Users in selected villages',
          villages: villages.map(v => ({
            id: v.id,
            name: v.name,
            userCount: v._count.users,
          })),
          totalUsers: uniqueUserIds.length,
        };
        break;
      }

      case 'by_role': {
        if (!roles || roles.length === 0) {
          return NextResponse.json({
            estimatedReach: 0,
            breakdown: {
              description: 'No roles selected',
              roles: [],
            },
          });
        }

        // Count users by role
        const roleCounts = await Promise.all(
          roles.map(async (role: string) => {
            const count = await prisma.user.count({
              where: { role: role as any },
            });
            return { role, count };
          })
        );

        estimatedReach = roleCounts.reduce((sum, r) => sum + r.count, 0);

        breakdown = {
          description: 'Users with selected roles',
          roles: roleCounts,
          totalUsers: estimatedReach,
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid targeting type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      estimatedReach,
      breakdown,
    });
  } catch (error) {
    console.error('Error calculating audience stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate audience statistics' },
      { status: 500 }
    );
  }
}
