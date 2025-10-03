import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { RoadmapCard } from '@/components/roadmap/roadmap-card';
import { Plus } from 'lucide-react';
import type { RoadmapListItem } from '@/types/roadmap';
import type { RoadmapStage } from '@prisma/client';

export default async function RoadmapPage() {
  const session = await auth();

  // Check if user can create roadmap items
  const canCreate = session?.user && ['PM', 'PO', 'ADMIN'].includes(session.user.role);

  // Check if user can view internal items
  const canViewInternal = session?.user && ['PM', 'PO', 'ADMIN'].includes(session.user.role);

  // Fetch roadmap items
  const roadmapItems = await prisma.roadmapItem.findMany({
    where: canViewInternal ? {} : { visibility: 'public' },
    orderBy: [
      { targetDate: 'asc' },
      { createdAt: 'desc' },
    ],
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      features: {
        select: {
          id: true,
        },
      },
      feedbacks: {
        select: {
          id: true,
        },
      },
    },
  });

  // Transform data
  const items: RoadmapListItem[] = roadmapItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    stage: item.stage,
    targetDate: item.targetDate?.toISOString() || null,
    progress: item.progress,
    visibility: item.visibility,
    createdBy: item.createdBy,
    featureCount: item.features.length,
    feedbackCount: item.feedbacks.length,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  // Group by stage
  const stages: RoadmapStage[] = ['now', 'next', 'later', 'under_consideration'];
  const itemsByStage: Record<RoadmapStage, RoadmapListItem[]> = {
    now: items.filter((item) => item.stage === 'now'),
    next: items.filter((item) => item.stage === 'next'),
    later: items.filter((item) => item.stage === 'later'),
    under_consideration: items.filter((item) => item.stage === 'under_consideration'),
  };

  const stageLabels: Record<RoadmapStage, string> = {
    now: 'Now',
    next: 'Next',
    later: 'Later',
    under_consideration: 'Under Consideration',
  };

  const stageColors: Record<RoadmapStage, string> = {
    now: 'border-green-500',
    next: 'border-blue-500',
    later: 'border-gray-400',
    under_consideration: 'border-yellow-500',
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Product Roadmap</h1>
          <p className="text-gray-600 mt-2">
            See what we&apos;re working on and what&apos;s coming next
          </p>
        </div>
        {canCreate && (
          <Link href="/roadmap/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Roadmap Item
            </Button>
          </Link>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map((stage) => (
          <div key={stage} className="flex flex-col">
            {/* Column Header */}
            <div
              className={`border-t-4 ${stageColors[stage]} bg-white rounded-t-lg p-4 mb-4`}
            >
              <h2 className="font-semibold text-lg">{stageLabels[stage]}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {itemsByStage[stage].length} item
                {itemsByStage[stage].length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-4">
              {itemsByStage[stage].length > 0 ? (
                itemsByStage[stage].map((item) => (
                  <RoadmapCard key={item.id} roadmapItem={item} />
                ))
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500">
                    No items in this stage
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No roadmap items yet
          </h3>
          <p className="text-gray-600 mb-6">
            {canCreate
              ? 'Get started by creating your first roadmap item'
              : 'Check back later for updates to the product roadmap'}
          </p>
          {canCreate && (
            <Link href="/roadmap/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Roadmap Item
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
