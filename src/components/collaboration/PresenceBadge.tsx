/**
 * Presence Badge Component
 *
 * Shows "X users viewing" indicator on feedback items
 */

'use client';

import { Eye } from 'lucide-react';
import { ActiveUser } from '@/lib/websocket/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PresenceBadgeProps {
  feedbackId: string;
  activeUsers: ActiveUser[];
}

export function PresenceBadge({ feedbackId, activeUsers }: PresenceBadgeProps) {
  const viewingUsers = activeUsers.filter((u) => u.viewingFeedbackId === feedbackId);

  if (viewingUsers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Eye className="h-3 w-3" />
            <span>{viewingUsers.length}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-semibold mb-1">Currently viewing:</div>
            <ul className="space-y-1">
              {viewingUsers.map((user) => (
                <li key={user.id} className="text-xs">
                  {user.displayName}
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
