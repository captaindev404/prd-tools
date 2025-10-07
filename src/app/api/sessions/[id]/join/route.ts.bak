import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

/**
 * POST /api/sessions/[id]/join - Join session
 *
 * Participant only
 * Verifies user is in participantIds
 * Returns session details and meeting link
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
          select: {
            id: true,
            name: true,
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

    const participantIds = JSON.parse(session.participantIds || '[]');

    // Verify user is a participant
    if (!participantIds.includes(user.id)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You are not a participant in this session',
        },
        { status: 403 }
      );
    }

    // Check if session is cancelled
    if (session.status === 'cancelled') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'This session has been cancelled',
        },
        { status: 400 }
      );
    }

    // Check if session is completed
    if (session.status === 'completed') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'This session has already been completed',
        },
        { status: 400 }
      );
    }

    // Fetch facilitator details
    const facilitatorIds = JSON.parse(session.facilitatorIds || '[]');
    const facilitators = await prisma.user.findMany({
      where: {
        id: {
          in: facilitatorIds,
        },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatarUrl: true,
      },
    });

    // Log join event
    await prisma.event.create({
      data: {
        type: 'session.joined',
        userId: user.id,
        payload: JSON.stringify({
          sessionId: session.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // In a real implementation, this would generate/return a meeting link
    // For now, we'll return the session details and prototype link if available
    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        type: session.type,
        prototypeLink: session.prototypeLink,
        scheduledAt: session.scheduledAt.toISOString(),
        durationMinutes: session.durationMinutes,
        panel: session.panel,
        facilitators,
        consentRequired: session.consentRequired,
        recordingEnabled: session.recordingEnabled,
        // In production, add meetingLink here (e.g., Zoom, Google Meet, etc.)
        meetingLink: session.prototypeLink || null,
      },
      message: 'Successfully joined session',
    });
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to join session. Please try again later.',
      },
      { status: 500 }
    );
  }
}
