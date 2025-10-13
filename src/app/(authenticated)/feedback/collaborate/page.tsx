/**
 * Collaboration Dashboard Page
 *
 * Real-time feedback collaboration interface for PMs, POs, and moderators
 * Features:
 * - Live user presence tracking
 * - Real-time feedback updates
 * - Collaborative comments
 * - Live cursors
 * - Feedback triage
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActiveUsers } from '@/components/collaboration/ActiveUsers';
import { LiveCursor } from '@/components/collaboration/LiveCursor';
import { PresenceBadge } from '@/components/collaboration/PresenceBadge';
import { CollaborativeComments } from '@/components/collaboration/CollaborativeComments';
import {
  useCollaborationSocket,
  useLiveCursors,
  useFeedbackUpdates,
  useCollaborativeComments,
  usePresence,
} from '@/lib/websocket/client';
import {
  Users,
  MessageSquare,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Feedback {
  id: string;
  title: string;
  body: string;
  state: string;
  moderationStatus: string;
  createdAt: string;
  author: {
    displayName: string;
    avatarUrl?: string;
  };
  _count: {
    votes: number;
  };
}

export default function CollaborationDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>('new');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  // Session name based on current date
  const sessionName = useMemo(() => {
    const date = new Date().toISOString().split('T')[0];
    return `feedback-triage-${date}`;
  }, []);

  // Initialize WebSocket connection
  const { socket, isConnected, activeUsers } = useCollaborationSocket(
    sessionName,
    session?.user
      ? {
          id: session.user.id || '',
          displayName: session.user.name || 'Unknown User',
          avatarUrl: session.user.image || undefined,
          role: (session.user as { role?: string }).role || 'USER',
        }
      : null
  );

  // Live collaboration hooks
  const { cursors, updateCursor } = useLiveCursors(socket);
  const { updates, updateFeedback, assignFeedback } = useFeedbackUpdates(socket);
  const { comments, addComment } = useCollaborativeComments(
    socket,
    selectedFeedback?.id
  );
  const { updatePresence } = usePresence(socket);

  // Fetch feedback list
  useEffect(() => {
    async function fetchFeedback() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/feedback?state=${stateFilter}&limit=50`
        );

        if (!response.ok) throw new Error('Failed to fetch feedback');

        const data = await response.json();
        setFeedbackList(data.feedback || []);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeedback();
  }, [stateFilter]);

  // Update presence when viewing feedback
  useEffect(() => {
    if (selectedFeedback && socket) {
      updatePresence(selectedFeedback.id);
    }

    return () => {
      if (socket) {
        updatePresence(undefined);
      }
    };
  }, [selectedFeedback, socket, updatePresence]);

  // Handle mouse movement for live cursors
  useEffect(() => {
    if (!selectedFeedback) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateCursor({
        feedbackId: selectedFeedback.id,
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [selectedFeedback, updateCursor]);

  // Handle comment submission
  const handleAddComment = (content: string, parentId?: string) => {
    addComment({
      content,
      feedbackId: selectedFeedback?.id,
      resourceType: 'feedback',
      parentId,
    });
  };

  // Handle feedback state change
  const handleStateChange = async (feedbackId: string, newState: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      });

      if (!response.ok) throw new Error('Failed to update feedback');

      // Broadcast update to all users
      updateFeedback(feedbackId, { state: newState });

      // Update local state
      setFeedbackList((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, state: newState } : f))
      );
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  if (!session) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to access the collaboration dashboard
          </p>
          <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  const userRole = (session.user as { role?: string }).role;
  const hasAccess = ['PM', 'PO', 'MODERATOR', 'ADMIN'].includes(userRole || '');

  if (!hasAccess) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            This feature is only available to PMs, POs, and Moderators
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collaboration Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time feedback triage with your team
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div
            className={`flex items-center gap-2 text-sm ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-600' : 'bg-red-600'
              }`}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>

          {/* Active Users */}
          <ActiveUsers users={activeUsers} />
        </div>
      </div>

      {/* Live Cursors */}
      <LiveCursor cursors={cursors} currentFeedbackId={selectedFeedback?.id} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filter by State</span>
              </div>

              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="triaged">Triaged</SelectItem>
                  <SelectItem value="merged">Merged</SelectItem>
                  <SelectItem value="in_roadmap">In Roadmap</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No feedback items found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackList.map((feedback) => (
                  <Card
                    key={feedback.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedFeedback?.id === feedback.id
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() => setSelectedFeedback(feedback)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{feedback.title}</h3>
                          <PresenceBadge
                            feedbackId={feedback.id}
                            activeUsers={activeUsers}
                          />
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {feedback.body}
                        </p>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{feedback.state}</Badge>
                          <Badge variant="outline">
                            {feedback._count.votes} votes
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            by {feedback.author.displayName}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStateChange(feedback.id, 'triaged');
                          }}
                          title="Mark as Triaged"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStateChange(feedback.id, 'closed');
                          }}
                          title="Close"
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Collaboration Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {selectedFeedback ? (
            <>
              {/* Selected Feedback Details */}
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Selected Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedFeedback.title}
                </p>
              </Card>

              {/* Real-Time Comments */}
              <Card className="p-4">
                <CollaborativeComments
                  comments={comments}
                  onAddComment={handleAddComment}
                  feedbackId={selectedFeedback.id}
                />
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Select a feedback item to start collaborating
              </p>
            </Card>
          )}

          {/* Recent Updates */}
          {updates.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="h-4 w-4" />
                <span className="font-semibold text-sm">Recent Updates</span>
              </div>
              <div className="space-y-2">
                {updates.slice(0, 5).map((update, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 bg-muted rounded-md"
                  >
                    <span className="font-medium">
                      {update.updatedBy.displayName}
                    </span>{' '}
                    updated feedback
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
