'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RoadmapStageBadge } from './roadmap-stage-badge';
import { RoadmapProgress } from './roadmap-progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadmapListItem } from '@/types/roadmap';

interface RoadmapCardProps {
  roadmapItem: RoadmapListItem;
  className?: string;
}

export function RoadmapCard({ roadmapItem, className }: RoadmapCardProps) {
  const {
    id,
    title,
    description,
    stage,
    targetDate,
    progress,
    createdBy,
    featureCount,
    feedbackCount,
  } = roadmapItem;

  // Format target date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No target date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/roadmap/${id}`}>
      <Card
        className={cn(
          'h-full transition-all hover:shadow-lg cursor-pointer',
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">{title}</h3>
            <RoadmapStageBadge stage={stage} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          )}

          {/* Progress */}
          <RoadmapProgress progress={progress} />

          {/* Target Date */}
          {targetDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(targetDate)}</span>
            </div>
          )}

          {/* Counts */}
          <div className="flex items-center gap-3 pt-2">
            {featureCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {featureCount} feature{featureCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {feedbackCount > 0 && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {feedbackCount} feedback
                </span>
              </div>
            )}
          </div>

          {/* Owner */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              {createdBy.avatarUrl ? (
                <img
                  src={createdBy.avatarUrl}
                  alt={createdBy.displayName || 'User'}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {((createdBy.displayName || 'U')[0] || 'U').toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-600">
                {createdBy.displayName || 'Unknown'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
