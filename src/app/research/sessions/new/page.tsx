import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/session';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SessionCreateForm } from './session-create-form';

export default async function NewSessionPage() {
  const session = await requireAnyRole([Role.RESEARCHER, Role.PM, Role.ADMIN]);

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

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Research Session</h1>
        <p className="text-muted-foreground mt-1">
          Schedule a new research session with participants
        </p>
      </div>

      <SessionCreateForm
        panels={panels}
        facilitators={facilitators}
      />
    </div>
  );
}
