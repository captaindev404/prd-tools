'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { RoadmapItem } from '@/types/roadmap';

interface PublishDialogProps {
  roadmapItem: RoadmapItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PublishDialog({
  roadmapItem,
  open,
  onOpenChange,
  onSuccess,
}: PublishDialogProps) {
  const [message, setMessage] = useState('');
  const [allUsers, setAllUsers] = useState(true);
  const [emailChannel, setEmailChannel] = useState(false);
  const [inAppChannel, setInAppChannel] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePublish = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const channels: string[] = [];
      if (inAppChannel) channels.push('in-app');
      if (emailChannel) channels.push('email');

      const response = await fetch(`/api/roadmap/${roadmapItem.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message || undefined,
          audience: {
            allUsers,
          },
          channels,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to publish roadmap update');
      }

      const data = await response.json();
      setSuccess(true);

      // Show success message briefly, then close
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
        if (onSuccess) onSuccess();
        // Reset form
        setMessage('');
        setAllUsers(true);
        setEmailChannel(false);
        setInAppChannel(true);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultMessage = `Roadmap update: ${roadmapItem.title} is now in "${roadmapItem.stage}" stage`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Publish Roadmap Update</DialogTitle>
          <DialogDescription>
            Send a notification about this roadmap update to users.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center font-medium">
                Roadmap update published successfully!
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Roadmap Info */}
              <div className="rounded-lg bg-gray-50 p-3">
                <h4 className="font-medium text-sm">{roadmapItem.title}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Stage: {roadmapItem.stage} | Progress: {roadmapItem.progress}%
                </p>
              </div>

              {/* Custom Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Custom Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder={defaultMessage}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Leave empty to use the default message
                </p>
              </div>

              {/* Audience */}
              <div className="space-y-2">
                <Label>Audience</Label>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">All Users</p>
                    <p className="text-xs text-gray-500">
                      Send to all registered users
                    </p>
                  </div>
                  <Switch checked={allUsers} onCheckedChange={setAllUsers} />
                </div>
              </div>

              {/* Channels */}
              <div className="space-y-2">
                <Label>Notification Channels</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">In-App</p>
                      <p className="text-xs text-gray-500">
                        Show in application notifications
                      </p>
                    </div>
                    <Switch
                      checked={inAppChannel}
                      onCheckedChange={setInAppChannel}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-xs text-gray-500">
                        Send email notifications
                      </p>
                    </div>
                    <Switch
                      checked={emailChannel}
                      onCheckedChange={setEmailChannel}
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Publish Update
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
