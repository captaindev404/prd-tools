'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Edit, Calendar, User, MapPin, Tag, Shield, AlertTriangle, X } from 'lucide-react';
import { Feedback, DuplicateSuggestion } from '@/types/feedback';
import { formatDateTime, isWithinEditWindow } from '@/lib/utils';
import { ModerationActions } from '@/components/moderation/moderation-actions';
import { LinkFeatureDialog } from '@/components/features/link-feature-dialog';
import { VoteButton } from '@/components/feedback/vote-button';
import { useSession } from 'next-auth/react';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';

const stateColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  triaged: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  merged: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  in_roadmap: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const stateLabels: Record<string, string> = {
  new: 'New',
  triaged: 'Triaged',
  merged: 'Merged',
  in_roadmap: 'In Roadmap',
  closed: 'Closed',
};

const productAreaColors: Record<string, string> = {
  Reservations: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  CheckIn: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Payments: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  Housekeeping: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  Backoffice: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

// Mock data for development
const mockFeedback: Feedback = {
  id: 'fb_01HXQJ9K2M3N4P5Q6R7S8T9V0W',
  title: 'Add passport scanning to speed up check-in process',
  body: 'Currently, the check-in process requires manual entry of passport information which can take 3-5 minutes per guest. Implementing automated passport scanning would significantly reduce this time and improve the guest experience. This would also reduce errors in data entry and allow staff to focus more on guest interaction rather than administrative tasks.\n\nI\'ve observed that during peak check-in times, this manual process creates long queues and frustrated guests. A passport scanner integrated with the check-in system could reduce processing time to under 1 minute.',
  author: {
    id: 'usr_001',
    displayName: 'Marie Dubois',
    email: 'marie.dubois@clubmed.com',
    currentVillageId: 'vlg-001',
  },
  state: 'in_roadmap',
  visibility: 'public',
  source: 'web',
  productArea: 'CheckIn',
  villageContext: 'La Rosière',
  featureRefs: [
    {
      id: 'feat-checkin-mobile',
      title: 'Mobile Check-in',
      area: 'CheckIn',
      tags: ['rx', 'guest-experience'],
      status: 'generally_available',
    },
  ],
  moderationStatus: 'approved',
  voteCount: 42,
  voteWeight: 58.3,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  editableUntil: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
};

const mockDuplicates: DuplicateSuggestion[] = [
  {
    id: 'fb_duplicate1',
    title: 'Implement automated passport reading at check-in',
    similarity: 0.92,
    voteCount: 12,
    state: 'triaged',
  },
];

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const feedbackId = params.id as string;
  const { data: session } = useSession();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // User permissions
  const currentUserId = session?.user?.id;
  const isAuthenticated = !!session?.user;
  const isModerator = session?.user?.role === 'MODERATOR' || session?.user?.role === 'ADMIN';
  const canManageFeatures = session?.user?.role === 'PM' || session?.user?.role === 'PO' || session?.user?.role === 'ADMIN';

  const handleUnlinkFeature = async () => {
    if (!feedback?.featureRefs?.[0]?.id || !canManageFeatures) return;

    if (!confirm('Are you sure you want to unlink this feature from the feedback?')) {
      return;
    }

    setIsUnlinking(true);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/link-feature`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unlink feature');
      }

      // Refresh feedback to show updated feature link
      await fetchFeedback();
      alert('Feature unlinked successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unlink feature');
    } finally {
      setIsUnlinking(false);
    }
  };

  const fetchFeedback = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedback(data);
      setUserHasVoted(data.userHasVoted || false);

      // Fetch duplicate suggestions if available
      try {
        const duplicatesResponse = await fetch(`/api/feedback/${feedbackId}/duplicates`);
        if (duplicatesResponse.ok) {
          const duplicatesData = await duplicatesResponse.json();
          setDuplicates(duplicatesData.duplicates || []);
        }
      } catch (duplicatesErr) {
        // Ignore duplicate fetch errors - not critical
        console.error('Failed to fetch duplicates:', duplicatesErr);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [feedbackId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-destructive font-medium">
            {error || 'Feedback not found'}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/feedback">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feedback
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = feedback.author.id === currentUserId && isWithinEditWindow(feedback.createdAt);

  // Truncate title for breadcrumbs (max 50 chars)
  const truncatedTitle = feedback.title.length > 50
    ? feedback.title.substring(0, 50) + '...'
    : feedback.title;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { title: 'Feedback', href: '/feedback' },
            { title: truncatedTitle }
          ]}
        />
      </div>

      {/* Main feedback card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {feedback.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{feedback.author.displayName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={feedback.createdAt}>
                    {formatDateTime(feedback.createdAt)}
                  </time>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={stateColors[feedback.state]} variant="secondary">
                {stateLabels[feedback.state]}
              </Badge>
              {canEdit && (
                <Button size="sm" asChild>
                  <Link href={`/feedback/${feedback.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Moderation Status Alert */}
          {feedback.moderationStatus === 'pending_review' && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Under Review</AlertTitle>
              <AlertDescription>
                This feedback is currently under moderation review. It will be visible to all users
                once approved.
              </AlertDescription>
              {isModerator && (
                <div className="mt-3">
                  <ModerationActions
                    feedbackId={feedback.id}
                    inline={true}
                    onActionComplete={() => router.push('/moderation')}
                  />
                </div>
              )}
            </Alert>
          )}

          {feedback.moderationStatus === 'rejected' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Rejected</AlertTitle>
              <AlertDescription>
                This feedback has been rejected during moderation review and is not visible to
                regular users.
              </AlertDescription>
            </Alert>
          )}

          {/* Body */}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{feedback.body}</p>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid gap-4 md:grid-cols-2">
            {feedback.productArea && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Product Area</p>
                  <Badge
                    className={productAreaColors[feedback.productArea] || productAreaColors.Backoffice}
                    variant="secondary"
                    aria-label={`Product area: ${feedback.productArea}`}
                  >
                    {feedback.productArea}
                  </Badge>
                </div>
              </div>
            )}

            {feedback.village && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Village</p>
                  <p className="text-sm text-muted-foreground" aria-label={`Village: ${feedback.village.name}`}>
                    {feedback.village.name}
                  </p>
                </div>
              </div>
            )}

            {feedback.villageContext && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Village Context</p>
                  <p className="text-sm text-muted-foreground">{feedback.villageContext}</p>
                </div>
              </div>
            )}
          </div>

          {/* Feature references */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Linked Features</h3>
              {canManageFeatures && !feedback.featureRefs?.length && (
                <LinkFeatureDialog
                  feedbackId={feedback.id}
                  currentFeatureId={feedback.featureRefs?.[0]?.id}
                  onLinked={fetchFeedback}
                />
              )}
            </div>
            {feedback.featureRefs && feedback.featureRefs.length > 0 ? (
              <div className="space-y-2">
                {feedback.featureRefs.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/features/${feature.id}`}
                        className="font-medium hover:underline"
                      >
                        {feature.title}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {feature.area}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {feature.status}
                      </Badge>
                    </div>
                    {canManageFeatures && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleUnlinkFeature}
                        disabled={isUnlinking}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No features linked to this feedback yet.
                {canManageFeatures && ' Use the button above to link a feature.'}
              </p>
            )}
          </div>

          <Separator />

          {/* Voting */}
          <div>
            <h3 className="text-sm font-medium mb-3">Vote for this feedback</h3>
            <VoteButton
              feedbackId={feedback.id}
              initialVoteCount={feedback.voteCount}
              initialTotalWeight={feedback.voteWeight}
              initialUserHasVoted={userHasVoted}
              isAuthenticated={isAuthenticated}
              variant="default"
            />
          </div>
        </CardContent>
      </Card>

      {/* Duplicate suggestions */}
      {duplicates.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Similar Feedback</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {duplicates.map((duplicate) => (
                <div
                  key={duplicate.id}
                  className="flex items-start gap-3 p-3 rounded-md border bg-muted/50"
                >
                  <div className="flex-1">
                    <Link
                      href={`/feedback/${duplicate.id}`}
                      className="font-medium hover:underline line-clamp-2"
                    >
                      {duplicate.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {duplicate.voteCount} {duplicate.voteCount === 1 ? 'vote' : 'votes'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(duplicate.similarity * 100)}% similar
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
