import { redirect, notFound } from 'next/navigation';
import { requireAnyRole } from '@/lib/session';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SessionEditForm } from './session-edit-form';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';

export default async function EditSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireAnyRole([Role.RESEARCHER, Role.PM, Role.ADMIN, Role.USER]);

  const sessionData = await prisma.session.findUnique({
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

  if (!sessionData) {
    notFound();
  }

  // Check permissions - user must be facilitator or have RESEARCHER/PM/ADMIN role
  const facilitatorIds = JSON.parse(sessionData.facilitatorIds || '[]');
  const canEdit =
    facilitatorIds.includes(session.user.id) ||
    ['RESEARCHER', 'PM', 'ADMIN'].includes(session.user.role);

  if (!canEdit) {
    redirect('/research/sessions');
  }

  // Cannot edit completed sessions
  if (sessionData.status === 'completed') {
    redirect(`/research/sessions/${params.id}`);
  }

  // Fetch panels for the form
  const panels = await prisma.panel.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Fetch users with RESEARCHER, PM, or ADMIN role for facilitators
  const facilitators = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.RESEARCHER, Role.PM, Role.ADMIN],
      },
    },
    select: {
      id: true,
      displayName: true,
      email: true,
    },
    orderBy: {
      displayName: 'asc',
    },
  });

  // Fetch panel members if panel is set
  let panelMembers: any[] = [];
  if (sessionData.panelId) {
    const members = await prisma.panelMembership.findMany({
      where: {
        panelId: sessionData.panelId,
        active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    panelMembers = members.map((m) => ({
      id: m.user.id,
      displayName: m.user.displayName,
      email: m.user.email,
    }));
  }

  const initialData = {
    type: sessionData.type,
    prototypeLink: sessionData.prototypeLink || '',
    scheduledAt: new Date(sessionData.scheduledAt).toISOString().slice(0, 16),
    durationMinutes: sessionData.durationMinutes,
    panelId: sessionData.panelId || '',
    participantIds: JSON.parse(sessionData.participantIds || '[]'),
    facilitatorIds: JSON.parse(sessionData.facilitatorIds || '[]'),
    minParticipants: sessionData.minParticipants,
    maxParticipants: sessionData.maxParticipants,
    consentRequired: sessionData.consentRequired,
    recordingEnabled: sessionData.recordingEnabled,
    recordingStorageDays: sessionData.recordingStorageDays,
    notesSecure: sessionData.notesSecure,
  };

  // Session title for breadcrumbs
  const sessionTitle = sessionData.type === 'usability' ? 'Usability Test Session' :
    sessionData.type === 'interview' ? 'Interview Session' :
    sessionData.type === 'prototype_walkthrough' ? 'Prototype Walkthrough' :
    'Remote Test Session';

  // Truncate title for breadcrumbs (max 50 chars)
  const truncatedTitle = sessionTitle.length > 50
    ? sessionTitle.substring(0, 50) + '...'
    : sessionTitle;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { title: 'Research', href: '/research/sessions' },
            { title: 'Sessions', href: '/research/sessions' },
            { title: truncatedTitle, href: `/research/sessions/${params.id}` },
            { title: 'Edit' }
          ]}
        />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Research Session</h1>
        <p className="text-muted-foreground mt-1">
          Update session details and participants
        </p>
      </div>

      <SessionEditForm
        sessionId={params.id}
        initialData={initialData}
        panels={panels}
        panelMembers={panelMembers}
        facilitators={facilitators}
      />
    </div>
  );
}
