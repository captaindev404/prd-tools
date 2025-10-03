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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Village {
  id: string;
  name: string;
}

interface EditVillageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentVillageId: string | null;
  userName: string;
  villages: Village[];
  onSuccess?: () => void;
}

export function EditVillageDialog({
  open,
  onOpenChange,
  userId,
  currentVillageId,
  userName,
  villages,
  onSuccess,
}: EditVillageDialogProps) {
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(currentVillageId);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (selectedVillageId === currentVillageId) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentVillageId: selectedVillageId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update village');
      }

      const villageName = villages.find((v) => v.id === selectedVillageId)?.name || 'None';

      toast({
        title: 'Village updated',
        description: `${userName}'s village has been changed to ${villageName}`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update village',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentVillage = villages.find((v) => v.id === currentVillageId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Village</DialogTitle>
          <DialogDescription>
            Update the village assignment for {userName}. This will update their village history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Village</label>
            <p className="text-sm text-muted-foreground">
              {currentVillage ? currentVillage.name : 'No village assigned'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Village</label>
            <Select
              value={selectedVillageId || 'none'}
              onValueChange={(value) => setSelectedVillageId(value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No village</SelectItem>
                {villages.map((village) => (
                  <SelectItem key={village.id} value={village.id}>
                    {village.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedVillageId === currentVillageId}
          >
            {isLoading ? 'Updating...' : 'Update Village'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
