import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { RecordingStatus } from '@prisma/client';
import { createStorageClient } from '@/lib/recording/storage-client';

/**
 * POST /api/recording/upload
 * Upload a recording chunk
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
    });

    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    if (recording.recordedBy !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to upload to this recording' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const chunk = formData.get('chunk') as File | null;
    const chunkIndex = parseInt(formData.get('index') as string);

    if (!chunk) {
      return NextResponse.json(
        { error: 'Chunk data is required' },
        { status: 400 }
      );
    }

    // Upload chunk to storage
    const storageClient = createStorageClient();
    const chunkKey = `recordings/${recordingId}/chunk_${chunkIndex}`;

    const buffer = Buffer.from(await chunk.arrayBuffer());
    const chunkUrl = await storageClient.upload({
      key: chunkKey,
      data: buffer,
      contentType: chunk.type || 'application/octet-stream',
    });

    // Update recording with chunk info
    const chunkUrls = JSON.parse(recording.chunkUrls || '[]');
    chunkUrls.push(chunkUrl);

    await prisma.sessionRecording.update({
      where: { id: recordingId },
      data: {
        status: RecordingStatus.recording,
        chunkUrls: JSON.stringify(chunkUrls),
        uploadedChunks: recording.uploadedChunks + 1,
        recordingStartedAt: recording.recordingStartedAt || new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      chunkIndex,
      chunkUrl,
    });
  } catch (error) {
    console.error('Chunk upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
