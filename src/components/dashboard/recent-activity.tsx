import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, ThumbsUp, Layers, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';

interface ActivityItem {
  id: string;
  type: 'feedback' | 'vote' | 'feature';
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: {
    status?: string;
    votes?: number;
    author?: string;
  };
}

interface RecentActivityProps {
  items: ActivityItem[];
  showViewAll?: boolean;
}

/**
 * RecentActivity - Display recent user activity and system updates
 *
 * Shows a list of recent activities including:
 * - Feedback submissions
 * - Votes cast
 * - Feature updates
 *
 * Each item displays:
 * - Icon based on type
 * - Title and description
 * - Relative timestamp
 * - Status badge if applicable
 */
export function RecentActivity({ items, showViewAll = true }: RecentActivityProps) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'feedback':
        return MessageSquare;
      case 'vote':
        return ThumbsUp;
      case 'feature':
        return Layers;
      default:
        return MessageSquare;
    }
  };

  const getIconColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'feedback':
        return 'text-blue-600';
      case 'vote':
        return 'text-green-600';
      case 'feature':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg break-words">Recent Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Latest updates and interactions</CardDescription>
          </div>
          {showViewAll && (
            <Button asChild variant="ghost" size="sm" className="min-h-[44px] flex-shrink-0">
              <Link href="/activity" className="gap-1">
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">All</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        {items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recent activity"
            description="Get started with Odyssey Feedback by submitting ideas or voting on existing feedback."
            actions={[
              {
                label: 'Submit Feedback',
                href: '/feedback/new',
                variant: 'default',
                icon: MessageSquare,
              },
              {
                label: 'Browse Ideas',
                href: '/feedback',
                variant: 'outline',
              },
            ]}
            size="sm"
          />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {items.map((item) => {
              const Icon = getIcon(item.type);
              const iconColor = getIconColor(item.type);

              return (
                <div
                  key={item.id}
                  className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 last:pb-0 border-b last:border-0"
                >
                  <div className={`flex-shrink-0 mt-0.5 sm:mt-1 ${iconColor}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm font-medium leading-tight break-words">
                        {item.title}
                      </p>
                      <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    {item.metadata && (
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-1 flex-wrap">
                        {item.metadata.status && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                            {item.metadata.status}
                          </Badge>
                        )}
                        {item.metadata.votes !== undefined && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {item.metadata.votes} votes
                          </span>
                        )}
                        {item.metadata.author && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px]">
                            by {item.metadata.author}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
