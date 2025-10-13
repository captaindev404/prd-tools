/**
 * Active Users Component
 *
 * Displays avatars and names of users currently active in the collaboration session
 */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users } from 'lucide-react';
import { ActiveUser } from '@/lib/websocket/client';

interface ActiveUsersProps {
  users: ActiveUser[];
  maxDisplay?: number;
}

export function ActiveUsers({ users, maxDisplay = 5 }: ActiveUsersProps) {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - displayUsers.length;

  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>No active users</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <div className="flex items-center -space-x-2">
          {displayUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  {user.viewingFeedbackId && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-semibold">{user.displayName}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                  {user.viewingFeedbackId && (
                    <div className="text-xs text-green-600">
                      Viewing feedback
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted">
                  <span className="text-xs font-medium">+{remainingCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  {remainingCount} more user{remainingCount > 1 ? 's' : ''}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      <div className="text-sm text-muted-foreground">
        {users.length} {users.length === 1 ? 'user' : 'users'} online
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
