'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { Role } from '@prisma/client';

interface EligibleUser {
  id: string;
  displayName?: string | null;
  email: string;
  role: Role;
  currentVillage?: {
    id: string;
    name: string;
  } | null;
}

interface InviteMembersDialogProps {
  panelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteMembersDialog({
  panelId,
  open,
  onOpenChange,
  onSuccess,
}: InviteMembersDialogProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fetchEligibleUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/panels/${panelId}/eligibility-preview`);
      const data = await response.json();
      setEligibleUsers(data.sample || []);
    } catch (error) {
      console.error('Failed to fetch eligible users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch eligible users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchEligibleUsers();
      setSelectedUserIds(new Set());
      setResult(null);
    }
  }, [open, panelId]);

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleInvite = async () => {
    if (selectedUserIds.size === 0) return;

    setInviting(true);
    try {
      const response = await fetch(`/api/panels/${panelId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedUserIds) }),
      });

      const data = await response.json();
      setResult(data);

      toast({
        title: 'Invitation sent',
        description: `${data.added} users added, ${data.skipped?.length || 0} skipped`,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to invite members',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const filteredUsers = eligibleUsers.filter(user =>
    user.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Select users to invite to this panel
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-4">
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">
                    No eligible users found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                      >
                        <Checkbox
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => toggleUser(user.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={selectedUserIds.size === 0 || inviting}
              >
                {inviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  `Invite ${selectedUserIds.size} ${selectedUserIds.size === 1 ? 'user' : 'users'}`
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">{result.added} users added successfully</p>
              </div>

              {result.skipped && result.skipped.length > 0 && (
                <div>
                  <p className="font-medium text-destructive mb-2">
                    {result.skipped.length} users skipped:
                  </p>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1">
                      {result.skipped.map((skip: any, index: number) => (
                        <div key={index} className="text-sm flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                          <span>{skip.reason}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
