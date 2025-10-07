import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/users/[userId]/activity
 * Get user activity log (ADMIN only)
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
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Check user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get feedback submissions
    const feedbacks = await prisma.feedback.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        state: true,
        createdAt: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Get votes cast
    const votes = await prisma.vote.findMany({
      where: { userId },
      include: {
        feedback: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Get questionnaire responses
    const questionnaireResponses = await prisma.questionnaireResponse.findMany({
      where: { respondentId: userId },
      include: {
        questionnaire: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 10,
    });

    // Get panel memberships
    const panelMemberships = await prisma.panelMembership.findMany({
      where: { userId },
      include: {
        panel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // Get session participations (from participantIds JSON)
    const sessions = await prisma.session.findMany({
      where: {
        participantIds: {
          contains: userId,
        },
      },
      select: {
        id: true,
        type: true,
        scheduledAt: true,
        status: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      take: 10,
    });

    // Parse village history
    const villageHistory = JSON.parse(targetUser.villageHistory || '[]');
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

    // Parse consent history
    const consentHistory = JSON.parse(targetUser.consentHistory || '[]');

    // Map to response format
    const activity = {
      feedback: feedbacks.map((f) => ({
        id: f.id,
        title: f.title,
        state: f.state,
        createdAt: f.createdAt,
        voteCount: f._count.votes,
      })),
      votes: votes.map((v) => ({
        id: v.id,
        feedbackId: v.feedbackId,
        feedbackTitle: v.feedback.title,
        createdAt: v.createdAt,
      })),
      questionnaireResponses: questionnaireResponses.map((qr) => ({
        id: qr.id,
        questionnaireId: qr.questionnaireId,
        questionnaireTitle: qr.questionnaire.title,
        completedAt: qr.completedAt,
      })),
      panelMemberships: panelMemberships.map((pm) => ({
        id: pm.id,
        panelId: pm.panelId,
        panelName: pm.panel.name,
        joinedAt: pm.joinedAt,
        active: pm.active,
      })),
      sessionParticipations: sessions,
      villageHistory: enrichedVillageHistory,
      consentHistory,
    };

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
