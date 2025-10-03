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
import { handleApiError } from '@/lib/api-error-handler';

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

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      setEligibleUsers(data.sample || []);
    } catch (err) {
      const errorResult = await handleApiError(err, {
        context: 'Fetching eligible users',
      });

      toast({
        title: 'Error loading eligible users',
        description: errorResult.message,
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

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      setResult(data);

      toast({
        title: 'Invitation sent',
        description: `${data.added} users added, ${data.skipped?.length || 0} skipped`,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      const errorResult = await handleApiError(err, {
        context: 'Inviting panel members',
      });

      toast({
        title: 'Error inviting members',
        description: errorResult.message,
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
      <DialogContent className="max-w-2xl" aria-describedby="invite-description">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription id="invite-description">
            Select users to invite to this panel
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-4">
              <div>
                <label htmlFor="user-search" className="sr-only">
                  Search users
                </label>
                <Input
                  id="user-search"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search eligible users by name or email"
                />
              </div>

              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Loading eligible users</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8" role="status">
                    No eligible users found
                  </p>
                ) : (
                  <div className="space-y-2" role="list" aria-label="Eligible users">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                        role="listitem"
                      >
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => toggleUser(user.id)}
                          aria-label={`Select ${user.displayName || user.email} for invitation`}
                        />
                        <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                aria-label="Cancel invitation"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={selectedUserIds.size === 0 || inviting}
                aria-label={`Invite ${selectedUserIds.size} selected ${selectedUserIds.size === 1 ? 'user' : 'users'}`}
              >
                {inviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
            <div className="space-y-4" role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <p className="font-medium">{result.added} users added successfully</p>
              </div>

              {result.skipped && result.skipped.length > 0 && (
                <div>
                  <p className="font-medium text-destructive mb-2">
                    {result.skipped.length} users skipped:
                  </p>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1" role="list" aria-label="Skipped users">
                      {result.skipped.map((skip: any, index: number) => (
                        <div key={index} className="text-sm flex items-start gap-2" role="listitem">
                          <XCircle className="h-4 w-4 text-destructive mt-0.5" aria-hidden="true" />
                          <span>{skip.reason}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} aria-label="Close invitation results">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
