import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canEditSession } from '@/lib/auth-helpers';

/**
 * POST /api/sessions/[id]/participants - Add participants to session
 *
 * RESEARCHER/PM or facilitator
 * Verifies users are panel members
 * Checks max participants limit
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        panel: {
          include: {
            memberships: {
              where: { active: true },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Not found', message: 'Session not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canEditSession(user, session)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to manage participants',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'User IDs array is required',
        },
        { status: 400 }
      );
    }

    const currentParticipantIds = JSON.parse(session.participantIds || '[]');

    // Check if adding would exceed max participants
    const uniqueIds = new Set([...currentParticipantIds, ...userIds]);
    const newParticipantIds = Array.from(uniqueIds);
    if (newParticipantIds.length > session.maxParticipants) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: `Cannot add participants. Would exceed maximum of ${session.maxParticipants}`,
        },
        { status: 400 }
      );
    }

    // Verify users are panel members if panel exists
    if (session.panel) {
      const panelMemberIds = session.panel.memberships.map((m) => m.userId);
      const invalidUsers = userIds.filter((id) => !panelMemberIds.includes(id));

      if (invalidUsers.length > 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'All participants must be members of the session panel',
          },
          { status: 400 }
        );
      }
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: params.id },
      data: {
        participantIds: JSON.stringify(newParticipantIds),
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'session.participants.added',
        userId: user.id,
        payload: JSON.stringify({
          sessionId: updatedSession.id,
          addedUserIds: userIds,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // TODO: Send invitation notifications to new participants

    return NextResponse.json({
      success: true,
      data: {
        participantIds: newParticipantIds,
      },
      message: 'Participants added successfully',
    });
  } catch (error) {
    console.error('Error adding participants:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to add participants. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[id]/participants - Remove participant from session
 *
 * RESEARCHER/PM or facilitator
 * Query parameter: userId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Not found', message: 'Session not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canEditSession(user, session)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to manage participants',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'userId query parameter is required',
        },
        { status: 400 }
      );
    }

    const currentParticipantIds = JSON.parse(session.participantIds || '[]');
    const newParticipantIds = currentParticipantIds.filter(
      (id: string) => id !== userIdToRemove
    );

    // Check minimum participants
    if (newParticipantIds.length < session.minParticipants) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: `Cannot remove participant. Would be below minimum of ${session.minParticipants}`,
        },
        { status: 400 }
      );
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: params.id },
      data: {
        participantIds: JSON.stringify(newParticipantIds),
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'session.participant.removed',
        userId: user.id,
        payload: JSON.stringify({
          sessionId: updatedSession.id,
          removedUserId: userIdToRemove,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // TODO: Send cancellation notification to removed participant

    return NextResponse.json({
      success: true,
      data: {
        participantIds: newParticipantIds,
      },
      message: 'Participant removed successfully',
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to remove participant. Please try again later.',
      },
      { status: 500 }
    );
  }
}
