'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Role } from '@prisma/client';
import { MoreHorizontal, Eye, Edit, UserX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from './role-badge';
import { EditRoleDialog } from './edit-role-dialog';
import { EditVillageDialog } from './edit-village-dialog';
import type { UserWithStats } from '@/types/admin';
import { formatDistanceToNow } from 'date-fns';

interface UserTableProps {
  users: UserWithStats[];
  villages: Array<{ id: string; name: string }>;
  onUserUpdated: () => void;
}

export function UserTable({ users, villages, onUserUpdated }: UserTableProps) {
  const [editRoleUser, setEditRoleUser] = useState<{
    userId: string;
    currentRole: Role;
    userName: string;
  } | null>(null);
  const [editVillageUser, setEditVillageUser] = useState<{
    userId: string;
    currentVillageId: string | null;
    userName: string;
  } | null>(null);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1 && parts[0] && parts[1]
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (users.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-sm text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {getInitials(user.displayName, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.displayName || user.email.split('@')[0]}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.employeeId}</TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell>
                  {user.currentVillage ? (
                    <span className="text-sm">{user.currentVillage.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No village</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{user._count.feedbacks} feedback</div>
                    <div className="text-muted-foreground">{user._count.votes} votes</div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.lastLogin ? (
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/${user.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setEditRoleUser({
                            userId: user.id,
                            currentRole: user.role,
                            userName: user.displayName || user.email,
                          })
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setEditVillageUser({
                            userId: user.id,
                            currentVillageId: user.currentVillageId,
                            userName: user.displayName || user.email,
                          })
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Village
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editRoleUser && (
        <EditRoleDialog
          open={!!editRoleUser}
          onOpenChange={(open) => !open && setEditRoleUser(null)}
          userId={editRoleUser.userId}
          currentRole={editRoleUser.currentRole}
          userName={editRoleUser.userName}
          onSuccess={onUserUpdated}
        />
      )}

      {editVillageUser && (
        <EditVillageDialog
          open={!!editVillageUser}
          onOpenChange={(open) => !open && setEditVillageUser(null)}
          userId={editVillageUser.userId}
          currentVillageId={editVillageUser.currentVillageId}
          userName={editVillageUser.userName}
          villages={villages}
          onSuccess={onUserUpdated}
        />
      )}
    </>
  );
}
