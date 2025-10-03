'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error-handler';
import { Loader2 } from 'lucide-react';

interface ArchivePanelDialogProps {
  panelId: string;
  panelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Archive Panel Confirmation Dialog
 *
 * Displays a confirmation dialog when archiving a panel.
 * - Uses shadcn AlertDialog component
 * - Shows warning message about archiving
 * - Calls DELETE /api/panels/[id] API endpoint
 * - Displays loading state during API call
 * - Shows success toast and redirects on success
 * - Handles errors with error toast
 */
export function ArchivePanelDialog({
  panelId,
  panelName,
  open,
  onOpenChange,
  onSuccess,
}: ArchivePanelDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);

    try {
      const response = await fetch(`/api/panels/${panelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw response;
      }

      // Success - panel archived
      toast({
        title: 'Panel archived',
        description: `"${panelName}" has been successfully archived.`,
      });

      // Close dialog
      onOpenChange(false);

      // Call success callback or redirect to panels list
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/panels');
      }
    } catch (err) {
      const errorResult = await handleApiError(err, {
        context: 'Archiving panel',
      });

      toast({
        title: 'Error archiving panel',
        description: errorResult.message,
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive panel?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive "{panelName}"? This will:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Remove the panel from the active panels list</li>
            <li>Prevent new member invitations</li>
            <li>Make the panel read-only for existing members</li>
            <li>Preserve all panel data and history</li>
          </ul>
          <p className="mt-4 text-xs">
            Note: Panel data can be recovered by contacting an administrator.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleArchive();
            }}
            disabled={isArchiving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isArchiving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              'Archive'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
