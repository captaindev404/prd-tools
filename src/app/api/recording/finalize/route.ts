import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { RecordingStatus } from '@prisma/client';
import { createStorageClient } from '@/lib/recording/storage-client';
import { transcribeAudio } from '@/lib/recording/transcription';

/**
 * POST /api/recording/finalize
 * Finalize recording and trigger processing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recording ID from header
    const recordingId = request.headers.get('X-Recording-Id');
    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' },
        { status: 400 }
      );
    }

    // Verify recording exists and user has access
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

    if (recording.recordedBy !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to finalize this recording' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.sessionRecording.update({
      where: { id: recordingId },
      data: {
        status: RecordingStatus.processing,
        processingStartedAt: new Date(),
        recordingEndedAt: new Date(),
      },
    });

    // Upload final file to storage
    const storageClient = createStorageClient();
    const storageKey = `recordings/${recordingId}/final.webm`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageUrl = await storageClient.upload({
      key: storageKey,
      data: buffer,
      contentType: file.type || 'video/webm',
      metadata: {
        sessionId: recording.sessionId,
        recordedBy: session.user.id,
        recordingId,
      },
    });

    // Generate signed URL for playback
    const signedUrl = await storageClient.getSignedUrl({
      key: storageKey,
      expiresIn: 3600, // 1 hour
    });

    const signedUrlExpiry = new Date();
    signedUrlExpiry.setHours(signedUrlExpiry.getHours() + 1);

    // Calculate recording duration (estimate from file size)
    const durationSeconds = Math.floor(file.size / 50000); // Rough estimate

    // Update recording with file info
    await prisma.sessionRecording.update({
      where: { id: recordingId },
      data: {
        status: RecordingStatus.completed,
        storageUrl,
        storageBucket: process.env.RECORDING_STORAGE_BUCKET || 'session-recordings',
        storageKey,
        signedUrl,
        signedUrlExpiry,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        durationSeconds,
        processingCompletedAt: new Date(),
      },
    });

    // Trigger transcription in background (if enabled)
    if (process.env.OPENAI_API_KEY) {
      // In production, this would be a background job
      // For now, we'll skip it and mark as pending
      await prisma.sessionRecording.update({
        where: { id: recordingId },
        data: {
          transcriptionStatus: 'pending',
        },
      });
    }

    // Log event
    await prisma.event.create({
      data: {
        type: 'session.recording.completed',
        userId: session.user.id,
        payload: JSON.stringify({
          recordingId,
          sessionId: recording.sessionId,
          fileSize: file.size,
          duration: durationSeconds,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      recordingId,
      storageUrl,
      signedUrl,
      fileSize: file.size,
      duration: durationSeconds,
    });
  } catch (error) {
    console.error('Recording finalize error:', error);

    // Update status to failed
    const recordingId = request.headers.get('X-Recording-Id');
    if (recordingId) {
      await prisma.sessionRecording.update({
        where: { id: recordingId },
        data: {
          status: RecordingStatus.failed,
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
