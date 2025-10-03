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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Search, CheckCircle2, XCircle } from 'lucide-react';
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
  panelName: string;
  eligibilityRules: any;
  onInviteComplete?: () => void;
}

export function InviteMembersDialog({
  panelId,
  panelName,
  eligibilityRules,
  onInviteComplete,
}: InviteMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch eligible users when dialog opens
  useEffect(() => {
    if (open) {
      fetchEligibleUsers();
    }
  }, [open]);

  const fetchEligibleUsers = async () => {
    try {
      setLoading(true);
      // TODO: Implement an API endpoint to get eligible users
      // For now, this is a placeholder
      // const response = await fetch(`/api/panels/${panelId}/eligible-users`);
      // const data = await response.json();
      // setEligibleUsers(data.users || []);
      setEligibleUsers([]);
    } catch (error) {
      console.error('Error fetching eligible users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch eligible users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (selectedUserIds.size === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user to invite',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/panels/${panelId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to invite members');
      }

      toast({
        title: 'Success',
        description: result.message || `Invited ${result.data.invited} user(s) to ${panelName}`,
      });

      setOpen(false);
      setSelectedUserIds(new Set());
      onInviteComplete?.();
    } catch (error: any) {
      console.error('Error inviting members:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const filteredUsers = eligibleUsers.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Members to {panelName}</DialogTitle>
          <DialogDescription>
            Select users to invite to this panel. Only users meeting eligibility criteria are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading eligible users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No eligible users found.</p>
              <p className="text-sm mt-2">
                Users must meet the panel's eligibility criteria and have research contact consent.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <Checkbox
                    checked={selectedUserIds.has(user.id)}
                    onCheckedChange={() => toggleUserSelection(user.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.displayName || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                    {user.currentVillage && (
                      <Badge variant="secondary" className="text-xs">
                        {user.currentVillage.name}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedUserIds.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>{selectedUserIds.size} user(s) selected</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading || selectedUserIds.size === 0}>
            {loading ? 'Inviting...' : `Invite ${selectedUserIds.size} User(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
