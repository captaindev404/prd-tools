import { notFound, redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/session';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SessionDetailClient } from './session-detail-client';

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; }>;
}) {
  const { id } = await params;
  const session = await requireAnyRole([Role.RESEARCHER, Role.PM, Role.ADMIN, Role.USER]);

  const sessionData = await prisma.session.findUnique({
    where: { id },
    include: {
      panel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!sessionData) {
    notFound();
  }

  const participantIds = JSON.parse(sessionData.participantIds || '[]');
  const facilitatorIds = JSON.parse(sessionData.facilitatorIds || '[]');

  // Check if user can view this session
  const canView =
    ['RESEARCHER', 'PM', 'ADMIN'].includes(session.user.role) ||
    participantIds.includes(session.user.id) ||
    facilitatorIds.includes(session.user.id);

  if (!canView) {
    redirect('/research/sessions');
  }

  // Fetch participant details
  const participants = await prisma.user.findMany({
    where: {
      id: {
        in: participantIds,
      },
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      avatarUrl: true,
    },
  });

  // Fetch facilitator details
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
      role: true,
    },
  });

  // Determine user permissions
  const isFacilitator = facilitatorIds.includes(session.user.id);
  const isParticipant = participantIds.includes(session.user.id);
  const canEdit =
    isFacilitator ||
    ['RESEARCHER', 'PM', 'ADMIN'].includes(session.user.role);
  const canComplete = isFacilitator && sessionData.status !== 'completed';
  const canJoin = isParticipant && sessionData.status === 'scheduled';

  // Parse notes if available and user can see them
  let notes = null;
  if (sessionData.notesUri && (isFacilitator || ['RESEARCHER', 'PM', 'ADMIN'].includes(session.user.role))) {
    try {
      notes = JSON.parse(sessionData.notesUri);
    } catch {
      // If not JSON, treat as plain text
      notes = { notes: sessionData.notesUri };
    }
  }

  // Fetch recordings for this session
  const recordings = await prisma.sessionRecording.findMany({
    where: {
      sessionId: id,
      deletedAt: null, // Only show non-deleted recordings
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Parse JSON fields for recordings
  const recordingsWithParsedData = recordings.map(recording => ({
    ...recording,
    annotations: JSON.parse(recording.annotations || '[]'),
    highlights: JSON.parse(recording.highlights || '[]'),
    transcriptionSegments: recording.transcriptionText
      ? JSON.parse(recording.transcriptionText || '[]')
      : [],
  }));

  const sessionDetail = {
    ...sessionData,
    participantIds,
    facilitatorIds,
    panel: sessionData.panel,
    participants,
    facilitators,
    notes,
  };

  return (
    <SessionDetailClient
      session={sessionDetail}
      canEdit={canEdit}
      canComplete={canComplete}
      canJoin={canJoin}
      isFacilitator={isFacilitator}
      isParticipant={isParticipant}
      recordings={recordingsWithParsedData}
    />
  );
}
