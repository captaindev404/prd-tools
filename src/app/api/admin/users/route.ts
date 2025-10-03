import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import type { UpdateUserRequest } from '@/types/admin';

/**
 * GET /api/admin/users
 * List all users with filtering and pagination (ADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');
    const village = searchParams.get('village');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Build where clause
    const where: any = {};

    if (roleParam && roleParam !== 'all') {
      where.role = roleParam as Role;
    }

    if (village) {
      where.currentVillageId = village;
    }

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { displayName: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get paginated users with stats
    const users = await prisma.user.findMany({
      where,
      include: {
        currentVillage: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            feedbacks: true,
            votes: true,
            questionnaireResponses: true,
            panelMemberships: true,
          },
        },
        sessions: {
          select: {
            expires: true,
          },
          orderBy: {
            expires: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Map users with last login
    const usersWithStats = users.map((user) => ({
      ...user,
      lastLogin: user.sessions[0]?.expires || null,
      sessions: undefined, // Remove sessions from response
    }));

    return NextResponse.json({
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update user (ADMIN only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = (await req.json()) as UpdateUserRequest & { userId: string };
    const { userId, role, currentVillageId, consents } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (userId === user.id && role && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (role !== undefined) {
      updateData.role = role;
    }

    if (currentVillageId !== undefined) {
      updateData.currentVillageId = currentVillageId;

      // Update village history
      if (currentVillageId) {
        const villageHistory = JSON.parse(existingUser.villageHistory || '[]');
        const lastEntry = villageHistory[villageHistory.length - 1];

        // Close previous village entry if exists
        if (lastEntry && !lastEntry.to) {
          lastEntry.to = new Date().toISOString();
        }

        // Add new village entry
        villageHistory.push({
          village_id: currentVillageId,
          from: new Date().toISOString(),
        });

        updateData.villageHistory = JSON.stringify(villageHistory);
      }
    }

    if (consents !== undefined) {
      updateData.consents = JSON.stringify(consents);

      // Update consent history
      const consentHistory = JSON.parse(existingUser.consentHistory || '[]');
      const existingConsents = JSON.parse(existingUser.consents || '[]');

      // Track changes
      consents.forEach((consent: string) => {
        if (!existingConsents.includes(consent)) {
          consentHistory.push({
            consent_type: consent,
            granted: true,
            timestamp: new Date().toISOString(),
          });
        }
      });

      existingConsents.forEach((consent: string) => {
        if (!consents.includes(consent)) {
          consentHistory.push({
            consent_type: consent,
            granted: false,
            timestamp: new Date().toISOString(),
          });
        }
      });

      updateData.consentHistory = JSON.stringify(consentHistory);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        currentVillage: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            feedbacks: true,
            votes: true,
            questionnaireResponses: true,
            panelMemberships: true,
          },
        },
      },
    });

    // Log role change event
    if (role && role !== existingUser.role) {
      await prisma.event.create({
        data: {
          type: 'admin.user.role_changed',
          userId: user.id,
          payload: JSON.stringify({
            targetUserId: userId,
            targetUserEmail: existingUser.email,
            oldRole: existingUser.role,
            newRole: role,
            changedBy: user.email,
          }),
        },
      });
    }

    // Log village change event
    if (currentVillageId && currentVillageId !== existingUser.currentVillageId) {
      await prisma.event.create({
        data: {
          type: 'admin.user.village_changed',
          userId: user.id,
          payload: JSON.stringify({
            targetUserId: userId,
            targetUserEmail: existingUser.email,
            oldVillageId: existingUser.currentVillageId,
            newVillageId: currentVillageId,
            changedBy: user.email,
          }),
        },
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
