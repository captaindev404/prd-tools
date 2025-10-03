import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { RoadmapForm } from '@/components/roadmap/roadmap-form';
import { parseJsonField } from '@/lib/roadmap-helpers';
import type { RoadmapItem } from '@/types/roadmap';

interface EditRoadmapPageProps {
  params: {
    id: string;
  };
}

export default async function EditRoadmapPage({ params }: EditRoadmapPageProps) {
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Fetch roadmap item
  const roadmapItem = await prisma.roadmapItem.findUnique({
    where: { id: params.id },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
        },
      },
      features: {
        select: {
          id: true,
          title: true,
          area: true,
          status: true,
        },
      },
      feedbacks: {
        select: {
          id: true,
          title: true,
          state: true,
          _count: {
            select: {
              votes: true,
            },
          },
        },
      },
    },
  });

  if (!roadmapItem) {
    notFound();
  }

  // Check if user has permission to edit
  const canEdit =
    ['PM', 'PO', 'ADMIN'].includes(session.user.role) ||
    session.user.id === roadmapItem.createdById;

  if (!canEdit) {
    redirect(`/roadmap/${params.id}`);
  }

  // Transform data for form
  const roadmapData: RoadmapItem = {
    id: roadmapItem.id,
    title: roadmapItem.title,
    description: roadmapItem.description,
    stage: roadmapItem.stage,
    targetDate: roadmapItem.targetDate?.toISOString() || null,
    progress: roadmapItem.progress,
    visibility: roadmapItem.visibility,
    createdBy: roadmapItem.createdBy,
    features: roadmapItem.features,
    feedbacks: roadmapItem.feedbacks.map((fb) => ({
      id: fb.id,
      title: fb.title,
      state: fb.state,
      voteCount: fb._count.votes,
    })),
    jiraTickets: parseJsonField<string[]>(roadmapItem.jiraTickets, []),
    figmaLinks: parseJsonField<string[]>(roadmapItem.figmaLinks, []),
    commsCadence: roadmapItem.commsCadence,
    commsChannels: parseJsonField<string[]>(roadmapItem.commsChannels, []),
    commsAudience: parseJsonField<Record<string, any>>(
      roadmapItem.commsAudience,
      {}
    ),
    successCriteria: parseJsonField<string[]>(roadmapItem.successCriteria, []),
    guardrails: parseJsonField<string[]>(roadmapItem.guardrails, []),
    createdAt: roadmapItem.createdAt.toISOString(),
    updatedAt: roadmapItem.updatedAt.toISOString(),
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Roadmap Item</h1>
        <p className="text-gray-600 mt-2">
          Update the details of this roadmap item. Changes will be visible to users
          based on the visibility setting.
        </p>
      </div>

      <RoadmapForm roadmapItem={roadmapData} isEdit={true} />
    </div>
  );
}
