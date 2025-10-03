'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeatureStatusBadge } from '@/components/features/feature-status-badge';
import { ProductAreaBadge } from '@/components/features/product-area-badge';
import { ArrowLeft, Edit, MessageSquare, MapPin, Trash2 } from 'lucide-react';
import type { FeatureStatus, ProductArea, FeedbackState } from '@prisma/client';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';

interface FeedbackItem {
  id: string;
  title: string;
  state: FeedbackState;
  author: {
    id: string;
    displayName: string | null;
    email: string;
  };
  voteCount: number;
  voteWeight: number;
  createdAt: string;
}

interface RoadmapItem {
  id: string;
  title: string;
  stage: string;
  description: string | null;
  createdAt: string;
}

interface FeatureDetail {
  id: string;
  title: string;
  description: string | null;
  area: ProductArea;
  status: FeatureStatus;
  tags: string[];
  feedbacks: FeedbackItem[];
  roadmapItems: RoadmapItem[];
  feedbackCount: number;
  roadmapItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [feature, setFeature] = useState<FeatureDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user can edit features (PM, PO, ADMIN)
  const canEdit =
    session?.user?.role === 'PM' ||
    session?.user?.role === 'PO' ||
    session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchFeature();
  }, [params.id]);

  const fetchFeature = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/features/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Feature not found');
        }
        throw new Error('Failed to fetch feature');
      }

      const data = await response.json();
      setFeature(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/features/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete feature');
      }

      const data = await response.json();

      if (data.softDeleted) {
        // Feature was soft-deleted (marked as deprecated)
        alert(data.message);
        fetchFeature(); // Refresh to show new status
      } else {
        // Feature was hard-deleted
        alert('Feature deleted successfully');
        router.push('/features');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete feature');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-40 w-full mb-6" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/features">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Features
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Feature not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Truncate title for breadcrumbs (max 50 chars)
  const truncatedTitle = feature.title.length > 50
    ? feature.title.substring(0, 50) + '...'
    : feature.title;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { title: 'Features', href: '/features' },
            { title: truncatedTitle }
          ]}
        />
      </div>

      {/* Feature header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <ProductAreaBadge area={feature.area} />
            <FeatureStatusBadge status={feature.status} />
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/features/${feature.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-2">{feature.title}</h1>

        {feature.description && (
          <p className="text-lg text-muted-foreground mt-4">{feature.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>
              {feature.feedbackCount} {feature.feedbackCount === 1 ? 'feedback' : 'feedbacks'}
            </span>
          </div>
          {feature.roadmapItemCount > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>
                {feature.roadmapItemCount} roadmap {feature.roadmapItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Linked Feedback */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Linked Feedback ({feature.feedbacks.length})</CardTitle>
          <CardDescription>
            Feedback items related to this feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feature.feedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback linked to this feature yet.</p>
          ) : (
            <div className="space-y-4">
              {feature.feedbacks.map((feedback) => (
                <Link
                  key={feedback.id}
                  href={`/feedback/${feedback.id}`}
                  className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{feedback.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>by {feedback.author.displayName || feedback.author.email}</span>
                        <span>•</span>
                        <span>{feedback.voteCount} votes</span>
                        <span>•</span>
                        <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {feedback.state}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Roadmap Items */}
      <Card>
        <CardHeader>
          <CardTitle>Roadmap Items ({feature.roadmapItems.length})</CardTitle>
          <CardDescription>
            Roadmap items that include this feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feature.roadmapItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This feature is not yet included in any roadmap items.
            </p>
          ) : (
            <div className="space-y-4">
              {feature.roadmapItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Stage: {item.stage} • Created {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
