'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ModerationActionsProps {
  feedbackId: string;
  onActionComplete?: () => void;
  inline?: boolean; // If true, shows buttons inline; if false, shows them stacked
}

export function ModerationActions({
  feedbackId,
  onActionComplete,
  inline = false,
}: ModerationActionsProps) {
  const { toast } = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);

    try {
      const response = await fetch(`/api/moderation/${feedbackId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve feedback');
      }

      toast({
        title: 'Feedback approved',
        description: 'The feedback has been approved and is now visible to users.',
      });

      // Call completion callback
      if (onActionComplete) {
        onActionComplete();
      }

      setShowApproveDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve feedback',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);

    try {
      const response = await fetch(`/api/moderation/${feedbackId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Rejected after manual review',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject feedback');
      }

      toast({
        title: 'Feedback rejected',
        description: 'The feedback has been rejected and hidden from users.',
      });

      // Call completion callback
      if (onActionComplete) {
        onActionComplete();
      }

      setShowRejectDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject feedback',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const containerClass = inline
    ? 'flex items-center gap-2'
    : 'flex flex-col gap-2';

  return (
    <>
      <div className={containerClass}>
        <Button
          onClick={() => setShowApproveDialog(true)}
          variant="default"
          size="sm"
          disabled={isApproving || isRejecting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <span className="ml-2">Approve</span>
        </Button>

        <Button
          onClick={() => setShowRejectDialog(true)}
          variant="destructive"
          size="sm"
          disabled={isApproving || isRejecting}
        >
          {isRejecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="ml-2">Reject</span>
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This feedback will be marked as approved and made visible to all users. The author
              will be able to see it in the public feedback list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This feedback will be marked as rejected and hidden from users. This action can be
              reversed later if needed. The author will not be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isRejecting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
