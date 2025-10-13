import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { RecordingType, RecordingStatus } from '@prisma/client';
import { ulid } from 'ulid';

/**
 * POST /api/recording/start
 * Initialize a new recording session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, type } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify session exists and user has access
    const researchSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!researchSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user is facilitator or has researcher/admin role
    const facilitatorIds = JSON.parse(researchSession.facilitatorIds || '[]');
    const canRecord =
      facilitatorIds.includes(session.user.id) ||
      ['RESEARCHER', 'PM', 'ADMIN'].includes(session.user.role);

    if (!canRecord) {
      return NextResponse.json(
        { error: 'You do not have permission to record this session' },
        { status: 403 }
      );
    }

    // Check if recording is enabled for this session
    if (!researchSession.recordingEnabled) {
      return NextResponse.json(
        { error: 'Recording is not enabled for this session' },
        { status: 400 }
      );
    }

    // Determine recording type
    const recordingType: RecordingType =
      type === 'camera' ? RecordingType.camera :
      type === 'screen' ? RecordingType.screen :
      RecordingType.both;

    // Calculate expiry date based on storage days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + researchSession.recordingStorageDays);

    // Create recording record
    const recording = await prisma.sessionRecording.create({
      data: {
        id: `rec_${ulid()}`,
        sessionId,
        type: recordingType,
        status: RecordingStatus.initializing,
        recordedBy: session.user.id,
        expiresAt,
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'session.recording.started',
        userId: session.user.id,
        payload: JSON.stringify({
          recordingId: recording.id,
          sessionId,
          type: recordingType,
        }),
      },
    });

    return NextResponse.json({
      recordingId: recording.id,
      status: recording.status,
      expiresAt: recording.expiresAt,
    });
  } catch (error) {
    console.error('Recording start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
