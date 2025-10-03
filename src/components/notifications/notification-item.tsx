/**
 * NotificationItem Component
 *
 * Displays a single notification with icon, title, body, and timestamp.
 * Shows unread indicator and handles click to mark as read and navigate.
 */

'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  MessageSquare,
  Map,
  GitMerge,
  Users,
  Calendar,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    link?: string | null;
    readAt: Date | null;
    createdAt: Date;
  };
  onMarkAsRead?: (id: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  panel_invite: Users,
  questionnaire: MessageSquare,
  roadmap_update: Map,
  feedback_merged: GitMerge,
  feedback_reply: MessageSquare,
  feedback_status_change: Info,
  research_session: Calendar,
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const Icon = iconMap[notification.type] || Bell;
  const isUnread = !notification.readAt;

  const handleClick = () => {
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg transition-colors hover:bg-accent cursor-pointer',
        isUnread && 'bg-accent/50'
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">
        <div
          className={cn(
            'rounded-full p-2',
            isUnread ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn('text-sm font-medium', isUnread && 'font-semibold')}>
            {notification.title}
          </h4>
          {isUnread && (
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
