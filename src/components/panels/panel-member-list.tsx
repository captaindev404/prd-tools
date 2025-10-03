'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Role } from '@prisma/client';

interface PanelMember {
  id: string;
  userId: string;
  active: boolean;
  joinedAt: Date | string;
  user: {
    id: string;
    displayName?: string | null;
    email: string;
    role: Role;
    currentVillage?: {
      id: string;
      name: string;
    } | null;
  };
  invitedBy?: {
    id: string;
    displayName?: string | null;
    email: string;
  } | null;
}

interface PanelMemberListProps {
  members: PanelMember[];
  canManage: boolean;
  onRemoveMember?: (userId: string) => void;
}

function getStatusBadge(active: boolean) {
  return active
    ? <Badge variant="default">Active</Badge>
    : <Badge variant="secondary">Inactive</Badge>;
}

export function PanelMemberList({ members, canManage, onRemoveMember }: PanelMemberListProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No members in this panel yet.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Village</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            {canManage && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{member.user.displayName || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{member.user.role}</Badge>
              </TableCell>
              <TableCell>
                {member.user.currentVillage ? (
                  <span className="text-sm">{member.user.currentVillage.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(member.active)}</TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">
                    {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                  </p>
                  {member.invitedBy && (
                    <p className="text-xs text-muted-foreground">
                      by {member.invitedBy.displayName || member.invitedBy.email}
                    </p>
                  )}
                </div>
              </TableCell>
              {canManage && (
                <TableCell>
                  {member.active && onRemoveMember && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMember(member.userId)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
