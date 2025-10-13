'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Milestone } from '@/app/api/roadmap/milestones/route';

interface MilestoneCardProps {
  milestone: Milestone;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  'on-track': {
    icon: TrendingUp,
    label: 'On Track',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  'at-risk': {
    icon: AlertCircle,
    label: 'At Risk',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  delayed: {
    icon: Clock,
    label: 'Delayed',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

const stageColors: Record<string, string> = {
  now: 'bg-green-100 text-green-800',
  next: 'bg-blue-100 text-blue-800',
  later: 'bg-gray-100 text-gray-800',
  under_consideration: 'bg-yellow-100 text-yellow-800',
};

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const config = statusConfig[milestone.status];
  const StatusIcon = config.icon;

  return (
    <Link href={`/roadmap/${milestone.id}`}>
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${config.borderColor} border-l-4`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{milestone.title}</CardTitle>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className={stageColors[milestone.stage]}>
                  {milestone.stage}
                </Badge>
                <div className={`flex items-center gap-1 text-sm ${config.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  <span>{config.label}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {milestone.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {milestone.description}
            </p>
          )}

          {/* Progress */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{milestone.progress}%</span>
            </div>
            <Progress value={milestone.progress} className="h-2" />
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {milestone.targetDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Target: {format(parseISO(milestone.targetDate), 'MMM dd, yyyy')}</span>
              </div>
            )}

            {milestone.featureCount > 0 && (
              <div>
                <span className="font-medium">{milestone.featureCount}</span> feature
                {milestone.featureCount !== 1 ? 's' : ''}
              </div>
            )}

            {milestone.feedbackCount > 0 && (
              <div>
                <span className="font-medium">{milestone.feedbackCount}</span> feedback item
                {milestone.feedbackCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
