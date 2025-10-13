import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createStorageClient } from '@/lib/recording/storage-client';

/**
 * GET /api/recording/playback/[id]
 * Get signed URL for recording playback
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordingId } = await context.params;

    // Get recording
    const recording = await prisma.sessionRecording.findUnique({
      where: { id: recordingId },
      include: {
        session: true,
      },
    });

    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Check if user has access
    const facilitatorIds = JSON.parse(recording.session.facilitatorIds || '[]');
    const participantIds = JSON.parse(recording.session.participantIds || '[]');

    const hasAccess =
      recording.recordedBy === session.user.id ||
      facilitatorIds.includes(session.user.id) ||
      participantIds.includes(session.user.id) ||
      ['RESEARCHER', 'PM', 'ADMIN'].includes(session.user.role);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to access this recording' },
        { status: 403 }
      );
    }

    // Check if recording has been deleted
    if (recording.deletedAt) {
      return NextResponse.json(
        { error: 'Recording has been deleted' },
        { status: 410 }
      );
    }

    // Check if recording has expired
    if (recording.expiresAt && recording.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Recording has expired' },
        { status: 410 }
      );
    }

    // Check if signed URL is still valid
    const needsNewSignedUrl =
      !recording.signedUrl ||
      !recording.signedUrlExpiry ||
      recording.signedUrlExpiry < new Date();

    let signedUrl = recording.signedUrl;

    if (needsNewSignedUrl && recording.storageKey) {
      // Generate new signed URL
      const storageClient = createStorageClient();
      signedUrl = await storageClient.getSignedUrl({
        key: recording.storageKey,
        expiresIn: 3600, // 1 hour
      });

      const signedUrlExpiry = new Date();
      signedUrlExpiry.setHours(signedUrlExpiry.getHours() + 1);

      // Update recording with new signed URL
      await prisma.sessionRecording.update({
        where: { id: recordingId },
        data: {
          signedUrl,
          signedUrlExpiry,
        },
      });
    }

    // Log access
    await prisma.event.create({
      data: {
        type: 'session.recording.accessed',
        userId: session.user.id,
        payload: JSON.stringify({
          recordingId,
          sessionId: recording.sessionId,
        }),
      },
    });

    return NextResponse.json({
      recordingId: recording.id,
      sessionId: recording.sessionId,
      signedUrl,
      expiresAt: recording.expiresAt,
      duration: recording.durationSeconds,
      fileSize: recording.fileSize,
      mimeType: recording.mimeType,
      annotations: JSON.parse(recording.annotations || '[]'),
      highlights: JSON.parse(recording.highlights || '[]'),
      transcriptionStatus: recording.transcriptionStatus,
      transcriptionUrl: recording.transcriptionUrl,
    });
  } catch (error) {
    console.error('Playback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recording/playback/[id]
 * Add annotation or highlight to recording
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordingId } = await context.params;
    const body = await request.json();
    const { type, timestamp, text, annotationType, start, end, label, color } = body;

    // Get recording
    const recording = await prisma.sessionRecording.findUnique({
      where: { id: recordingId },
      include: {
        session: true,
      },
    });

    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Check if user has access
    const facilitatorIds = JSON.parse(recording.session.facilitatorIds || '[]');

    const canAnnotate =
      facilitatorIds.includes(session.user.id) ||
      ['RESEARCHER', 'PM', 'ADMIN'].includes(session.user.role);

    if (!canAnnotate) {
      return NextResponse.json(
        { error: 'You do not have permission to annotate this recording' },
        { status: 403 }
      );
    }

    if (type === 'annotation') {
      // Add annotation
      const annotations = JSON.parse(recording.annotations || '[]');
      const newAnnotation = {
        id: `ann_${Date.now()}`,
        timestamp,
        text,
        author: session.user.displayName || session.user.email,
        authorId: session.user.id,
        type: annotationType || 'note',
        createdAt: new Date().toISOString(),
      };

      annotations.push(newAnnotation);

      await prisma.sessionRecording.update({
        where: { id: recordingId },
        data: {
          annotations: JSON.stringify(annotations),
        },
      });

      return NextResponse.json({
        success: true,
        annotation: newAnnotation,
      });
    } else if (type === 'highlight') {
      // Add highlight
      const highlights = JSON.parse(recording.highlights || '[]');
      const newHighlight = {
        id: `hl_${Date.now()}`,
        start,
        end,
        label,
        color: color || '#FFD700',
      };

      highlights.push(newHighlight);

      await prisma.sessionRecording.update({
        where: { id: recordingId },
        data: {
          highlights: JSON.stringify(highlights),
        },
      });

      return NextResponse.json({
        success: true,
        highlight: newHighlight,
      });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "annotation" or "highlight"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Annotation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recording/playback/[id]
 * Soft delete a recording
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordingId } = await context.params;

    // Get recording
    const recording = await prisma.sessionRecording.findUnique({
      where: { id: recordingId },
      include: {
        session: true,
      },
    });

    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete
    const facilitatorIds = JSON.parse(recording.session.facilitatorIds || '[]');

    const canDelete =
      recording.recordedBy === session.user.id ||
      facilitatorIds.includes(session.user.id) ||
      ['RESEARCHER', 'ADMIN'].includes(session.user.role);

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this recording' },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.sessionRecording.update({
      where: { id: recordingId },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user.id,
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'session.recording.deleted',
        userId: session.user.id,
        payload: JSON.stringify({
          recordingId,
          sessionId: recording.sessionId,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recording error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
