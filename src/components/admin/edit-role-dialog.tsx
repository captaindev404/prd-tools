'use client';

import { useState } from 'react';
import { Role } from '@prisma/client';
import { AlertTriangle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentRole: Role;
  userName: string;
  onSuccess?: () => void;
}

const roles: Role[] = ['USER', 'PM', 'PO', 'RESEARCHER', 'MODERATOR', 'ADMIN'];

const roleLabels: Record<Role, string> = {
  USER: 'User',
  PM: 'Product Manager',
  PO: 'Product Owner',
  RESEARCHER: 'Researcher',
  MODERATOR: 'Moderator',
  ADMIN: 'Administrator',
};

export function EditRoleDialog({
  open,
  onOpenChange,
  userId,
  currentRole,
  userName,
  onSuccess,
}: EditRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (selectedRole === currentRole) {
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
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }

      toast({
        title: 'Role updated',
        description: `${userName}'s role has been changed to ${roleLabels[selectedRole]}`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDowngrade = selectedRole === 'USER' && currentRole !== 'USER';
  const isAdminChange = selectedRole === 'ADMIN' || currentRole === 'ADMIN';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for {userName}. This will change their permissions immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Role</label>
            <p className="text-sm text-muted-foreground">{roleLabels[currentRole]}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Role</label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdminChange && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Changing administrator privileges is a critical action. Ensure this change is
                authorized.
              </AlertDescription>
            </Alert>
          )}

          {isDowngrade && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will remove all elevated permissions from this user.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || selectedRole === currentRole}>
            {isLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
