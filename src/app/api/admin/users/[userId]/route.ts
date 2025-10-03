import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/users/[userId]
 * Get detailed user information (ADMIN only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { userId } = params;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse JSON fields
    const villageHistory = JSON.parse(targetUser.villageHistory || '[]');
    const consents = JSON.parse(targetUser.consents || '[]');
    const consentHistory = JSON.parse(targetUser.consentHistory || '[]');

    // Get village names for history
    const villageIds = villageHistory.map((v: any) => v.village_id);
    const villages = await prisma.village.findMany({
      where: { id: { in: villageIds } },
      select: { id: true, name: true },
    });

    const villageMap = new Map(villages.map((v) => [v.id, v.name]));
    const enrichedVillageHistory = villageHistory.map((v: any) => ({
      ...v,
      villageName: villageMap.get(v.village_id) || 'Unknown',
    }));

    return NextResponse.json({
      ...targetUser,
      villageHistory: enrichedVillageHistory,
      consents,
      consentHistory,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Deactivate/soft delete user (ADMIN only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { userId } = params;

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For SQLite, we'll mark email as deactivated (soft delete)
    // In production with proper DB, you'd add an `active` or `deactivatedAt` field
    const deactivatedEmail = `deactivated_${Date.now()}_${targetUser.email}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: deactivatedEmail,
        role: 'USER', // Downgrade role
      },
    });

    // Log deletion event
    await prisma.event.create({
      data: {
        type: 'admin.user.deactivated',
        userId: user.id,
        payload: JSON.stringify({
          targetUserId: userId,
          targetUserEmail: targetUser.email,
          deactivatedBy: user.email,
          reason: 'Admin action',
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}
