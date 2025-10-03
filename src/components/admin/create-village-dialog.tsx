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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface CreateVillageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateVillageDialog({ open, onOpenChange, onSuccess }: CreateVillageDialogProps) {
  const [villageId, setVillageId] = useState('');
  const [villageName, setVillageName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!villageId.trim() || !villageName.trim()) {
      toast({
        title: 'Validation error',
        description: 'Both Village ID and Name are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/villages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: villageId.trim(),
          name: villageName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create village');
      }

      toast({
        title: 'Village created',
        description: `${villageName} has been created successfully`,
      });

      setVillageId('');
      setVillageName('');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create village',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Village</DialogTitle>
            <DialogDescription>
              Add a new Club Med village to the system. Users can then be assigned to this village.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="villageId">Village ID</Label>
              <Input
                id="villageId"
                placeholder="e.g., vlg-001"
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier for the village (e.g., vlg-001)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="villageName">Village Name</Label>
              <Input
                id="villageName"
                placeholder="e.g., Chamonix Mont-Blanc"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                The display name of the village
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !villageId.trim() || !villageName.trim()}>
              {isLoading ? 'Creating...' : 'Create Village'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
