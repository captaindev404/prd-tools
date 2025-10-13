"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { SessionType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SessionTypeBadge } from '@/components/sessions/session-type-badge';
import { CompleteSessionDialog } from '@/components/sessions/complete-session-dialog';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Link as LinkIcon,
  Edit,
  CheckCircle,
  LogIn,
  XCircle,
  Video,
  Shield,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { RecordingControls } from '@/components/research/RecordingControls';
import { VideoPlayer } from '@/components/research/VideoPlayer';
import { TranscriptViewer } from '@/components/research/TranscriptViewer';

interface SessionDetailClientProps {
  session: any;
  canEdit: boolean;
  canComplete: boolean;
  canJoin: boolean;
  isFacilitator: boolean;
  isParticipant: boolean;
  recordings?: any[];
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function SessionDetailClient({
  session,
  canEdit,
  canComplete,
  canJoin,
  isFacilitator,
  isParticipant,
  recordings = [],
}: SessionDetailClientProps) {
  const router = useRouter();
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [joining, setJoining] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel session');
      }

      router.refresh();
    } catch (error) {
      console.error('Error cancelling session:', error);
      alert('Failed to cancel session. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to join session');
      }

      const data = await response.json();
      // In production, this would redirect to the meeting link
      alert('Successfully joined session!');
      router.refresh();
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Failed to join session. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // Session title for breadcrumbs
  const sessionTitle = session.type === SessionType.usability ? 'Usability Test Session' :
    session.type === SessionType.interview ? 'Interview Session' :
    session.type === SessionType.prototype_walkthrough ? 'Prototype Walkthrough' :
    'Remote Test Session';

  // Truncate title for breadcrumbs (max 50 chars)
  const truncatedTitle = sessionTitle.length > 50
    ? sessionTitle.substring(0, 50) + '...'
    : sessionTitle;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { title: 'Research', href: '/research/sessions' },
            { title: 'Sessions', href: '/research/sessions' },
            { title: truncatedTitle }
          ]}
        />
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SessionTypeBadge type={session.type} />
            <Badge className={statusColors[session.status as keyof typeof statusColors]}>
              {session.status.replace('_', ' ')}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">
            {session.type === SessionType.usability && 'Usability Test Session'}
            {session.type === SessionType.interview && 'Interview Session'}
            {session.type === SessionType.prototype_walkthrough && 'Prototype Walkthrough'}
            {session.type === SessionType.remote_test && 'Remote Test Session'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(session.scheduledAt), 'PPP p')}
          </p>
        </div>

        <div className="flex gap-2">
          {canJoin && (
            <Button onClick={handleJoin} disabled={joining}>
              <LogIn className="mr-2 h-4 w-4" />
              Join Session
            </Button>
          )}
          {canComplete && (
            <Button onClick={() => setCompleteDialogOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Session
            </Button>
          )}
          {canEdit && session.status !== 'completed' && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/research/sessions/${session.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={cancelling}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Session
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel the session and notify all participants. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, keep it</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>
                      Yes, cancel session
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(session.scheduledAt), 'PPPP')} at{' '}
                    {format(new Date(session.scheduledAt), 'p')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {session.durationMinutes} minutes
                  </p>
                </div>
              </div>

              {session.panel && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Research Panel</p>
                    <p className="text-sm text-muted-foreground">
                      {session.panel.name}
                    </p>
                  </div>
                </div>
              )}

              {session.prototypeLink && (
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Prototype Link</p>
                    <a
                      href={session.prototypeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {session.prototypeLink}
                    </a>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {session.consentRequired ? (
                    <Shield className="h-4 w-4 text-green-600" />
                  ) : (
                    <Shield className="h-4 w-4 text-gray-400" />
                  )}
                  <span>Consent {session.consentRequired ? 'Required' : 'Not Required'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {session.recordingEnabled ? (
                    <Video className="h-4 w-4 text-green-600" />
                  ) : (
                    <Video className="h-4 w-4 text-gray-400" />
                  )}
                  <span>Recording {session.recordingEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>

              {session.recordingEnabled && (
                <p className="text-xs text-muted-foreground">
                  Recordings will be stored for {session.recordingStorageDays} days
                </p>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle>
                Participants ({session.participants.length}/{session.maxParticipants})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              ) : (
                <div className="space-y-2">
                  {session.participants.map((participant: any) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {participant.displayName?.[0] || participant.email[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {participant.displayName || participant.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {participant.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recording Controls (During Session) */}
          {isFacilitator && session.recordingEnabled && session.status === 'in_progress' && (
            <RecordingControls
              sessionId={session.id}
              onRecordingStart={(recordingId) => {
                console.log('Recording started:', recordingId);
              }}
              onRecordingStop={(blob, duration) => {
                console.log('Recording stopped:', duration, 'seconds');
                router.refresh();
              }}
              onError={(error) => {
                console.error('Recording error:', error);
                alert(error.message);
              }}
            />
          )}

          {/* Recordings Playback (Completed Sessions) */}
          {recordings.length > 0 && (
            <div className="space-y-6">
              {recordings.map((recording) => (
                <div key={recording.id}>
                  <VideoPlayer
                    recordingId={recording.id}
                    videoUrl={recording.signedUrl || ''}
                    annotations={recording.annotations || []}
                    highlights={recording.highlights || []}
                    canAnnotate={isFacilitator}
                    onAddAnnotation={async (timestamp, text, type) => {
                      const response = await fetch(`/api/recording/playback/${recording.id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'annotation', timestamp, text, annotationType: type }),
                      });
                      if (response.ok) {
                        router.refresh();
                      }
                    }}
                  />

                  {recording.transcriptionSegments && recording.transcriptionSegments.length > 0 && (
                    <TranscriptViewer
                      segments={recording.transcriptionSegments}
                      language={recording.transcriptionLanguage || 'en'}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Session Notes (Facilitators only) */}
          {session.notes && isFacilitator && (
            <Card>
              <CardHeader>
                <CardTitle>Session Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.notes.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm whitespace-pre-wrap">{session.notes.notes}</p>
                  </div>
                )}

                {session.notes.insights && (
                  <div>
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {session.notes.insights}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Facilitators */}
          <Card>
            <CardHeader>
              <CardTitle>Facilitators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {session.facilitators.map((facilitator: any) => (
                  <div
                    key={facilitator.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {facilitator.displayName?.[0] || facilitator.email[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {facilitator.displayName || facilitator.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {facilitator.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle>Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Min Participants</p>
                <p className="font-medium">{session.minParticipants}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max Participants</p>
                <p className="font-medium">{session.maxParticipants}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(session.createdAt), 'PPP')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CompleteSessionDialog
        sessionId={session.id}
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
      />
    </div>
  );
}
