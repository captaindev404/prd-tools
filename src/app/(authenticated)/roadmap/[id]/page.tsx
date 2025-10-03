import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RoadmapStageBadge } from '@/components/roadmap/roadmap-stage-badge';
import { RoadmapProgress } from '@/components/roadmap/roadmap-progress';
import { PublishDialog } from '@/components/roadmap/publish-dialog';
import { RoadmapDetailClient } from '@/components/roadmap/roadmap-detail-client';
import {
  Calendar,
  Edit,
  Package,
  MessageSquare,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { parseJsonField } from '@/lib/roadmap-helpers';
import type { RoadmapItem } from '@/types/roadmap';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';

interface RoadmapDetailPageProps {
  params: {
    id: string;
  };
}

export default async function RoadmapDetailPage({
  params,
}: RoadmapDetailPageProps) {
  const session = await auth();

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
          avatarUrl: true,
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

  // Check visibility permissions
  if (roadmapItem.visibility === 'internal') {
    if (!session?.user) {
      redirect('/auth/signin');
    }

    const canViewInternal = ['PM', 'PO', 'ADMIN'].includes(session.user.role);
    if (!canViewInternal) {
      redirect('/roadmap');
    }
  }

  // Check if user can edit/publish
  const canEdit = session?.user && (
    ['PM', 'PO', 'ADMIN'].includes(session.user.role) ||
    session.user.id === roadmapItem.createdById
  );

  const canPublish = session?.user && ['PM', 'PO', 'ADMIN'].includes(session.user.role);

  // Transform data
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

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No target date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Truncate title for breadcrumbs (max 50 chars)
  const truncatedTitle = roadmapData.title.length > 50
    ? roadmapData.title.substring(0, 50) + '...'
    : roadmapData.title;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { title: 'Roadmap', href: '/roadmap' },
            { title: truncatedTitle }
          ]}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <RoadmapStageBadge stage={roadmapData.stage} />
            {roadmapData.visibility === 'internal' && (
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                Internal
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{roadmapData.title}</h1>
          {roadmapData.description && (
            <p className="text-gray-600 text-lg">{roadmapData.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {canEdit && (
            <Link href={`/roadmap/${roadmapData.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <RoadmapProgress progress={roadmapData.progress} />
              {roadmapData.targetDate && (
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Target: {formatDate(roadmapData.targetDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Features */}
          {roadmapData.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Linked Features ({roadmapData.features.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roadmapData.features.map((feature) => (
                    <Link
                      key={feature.id}
                      href={`/features/${feature.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{feature.title}</p>
                        <p className="text-sm text-gray-500">{feature.area}</p>
                      </div>
                      <Badge variant="outline">{feature.status}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Feedback */}
          {roadmapData.feedbacks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Related Feedback ({roadmapData.feedbacks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roadmapData.feedbacks.map((feedback) => (
                    <Link
                      key={feedback.id}
                      href={`/feedback/${feedback.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{feedback.title}</p>
                        <p className="text-sm text-gray-500">
                          {feedback.voteCount} vote{feedback.voteCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="outline">{feedback.state}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* External Links */}
          {(roadmapData.jiraTickets.length > 0 || roadmapData.figmaLinks.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  External Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmapData.jiraTickets.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Jira Tickets</h4>
                    <div className="space-y-1">
                      {roadmapData.jiraTickets.map((ticket, index) => (
                        <a
                          key={index}
                          href={`https://jira.clubmed.com/browse/${ticket}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {ticket}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {roadmapData.figmaLinks.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Figma Files</h4>
                    <div className="space-y-1">
                      {roadmapData.figmaLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline truncate"
                        >
                          <ExternalLink className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{link}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Card */}
          <Card>
            <CardHeader>
              <CardTitle>Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {(roadmapData.createdBy.displayName || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {roadmapData.createdBy.displayName || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">{roadmapData.createdBy.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publish Button */}
          {canPublish && (
            <RoadmapDetailClient roadmapItem={roadmapData} />
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">
                  {new Date(roadmapData.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">
                  {new Date(roadmapData.updatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
