"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface CompleteSessionDialogProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompleteSessionDialog({
  sessionId,
  open,
  onOpenChange,
}: CompleteSessionDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [insights, setInsights] = useState('');
  const [recordingUrls, setRecordingUrls] = useState('');

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          insights,
          recordingUrls: recordingUrls
            .split('\n')
            .map((url) => url.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete session');
      }

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete Session</DialogTitle>
          <DialogDescription>
            Add session notes, insights, and recording links. This information
            will be stored securely and only accessible to facilitators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Enter your session notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insights">Key Insights (optional)</Label>
            <Textarea
              id="insights"
              placeholder="What were the key findings or insights?"
              value={insights}
              onChange={(e) => setInsights(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recordings">Recording URLs (optional)</Label>
            <Textarea
              id="recordings"
              placeholder="Enter recording URLs, one per line"
              value={recordingUrls}
              onChange={(e) => setRecordingUrls(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Add one URL per line
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
