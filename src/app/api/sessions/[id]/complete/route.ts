import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canCompleteSession } from '@/lib/auth-helpers';
import { encryptSessionNotes } from '@/lib/session-encryption';
import type { CompleteSessionInput } from '@/types/session';

/**
 * POST /api/sessions/[id]/complete - Mark session as completed
 *
 * Facilitator only
 * Optional: notes, recordings links, insights
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
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Not found', message: 'Session not found' },
        { status: 404 }
      );
    }

    // Check permissions - only facilitators can complete sessions
    if (!canCompleteSession(user, session)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only facilitators can complete sessions',
        },
        { status: 403 }
      );
    }

    // Cannot complete already completed or cancelled sessions
    if (session.status === 'completed') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Session is already completed',
        },
        { status: 400 }
      );
    }

    if (session.status === 'cancelled') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Cannot complete a cancelled session',
        },
        { status: 400 }
      );
    }

    const body: CompleteSessionInput = await request.json();

    // Build notes URI if notes or recordings are provided
    let notesUri = session.notesUri;
    if (body.notes || body.recordingUrls || body.insights) {
      // Store notes/recordings in a structured JSON format
      const notesData = {
        notes: body.notes || '',
        recordingUrls: body.recordingUrls || [],
        insights: body.insights || '',
        completedBy: user.id,
        completedAt: new Date().toISOString(),
      };
      const notesJson = JSON.stringify(notesData);

      // Encrypt notes if session is marked as secure
      notesUri = session.notesSecure
        ? encryptSessionNotes(notesJson)
        : notesJson;
    }

    // Update session status
    const completedSession = await prisma.session.update({
      where: { id: params.id },
      data: {
        status: 'completed',
        notesUri,
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
        type: 'session.completed',
        userId: user.id,
        payload: JSON.stringify({
          sessionId: completedSession.id,
          sessionType: completedSession.type,
          hasNotes: !!body.notes,
          hasRecordings: !!body.recordingUrls?.length,
          hasInsights: !!body.insights,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...completedSession,
        participantIds: JSON.parse(completedSession.participantIds),
        facilitatorIds: JSON.parse(completedSession.facilitatorIds),
      },
      message: 'Session completed successfully',
    });
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to complete session. Please try again later.',
      },
      { status: 500 }
    );
  }
}
