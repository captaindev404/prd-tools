"use client";

import { SessionType } from '@prisma/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionTypeBadge } from './session-type-badge';
import { Calendar, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface SessionCardProps {
  id: string;
  type: SessionType;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  panel?: {
    id: string;
    name: string;
  } | null;
  participantCount: number;
  facilitatorNames: string[];
  onClick?: () => void;
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function SessionCard({
  id,
  type,
  scheduledAt,
  durationMinutes,
  status,
  panel,
  participantCount,
  facilitatorNames,
  onClick,
}: SessionCardProps) {
  const scheduledDate = new Date(scheduledAt);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <SessionTypeBadge type={type} />
          <Badge className={statusColors[status as keyof typeof statusColors]}>
            {status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          {format(scheduledDate, 'PPP')}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          {format(scheduledDate, 'p')} • {durationMinutes} min
        </div>
        {panel && (
          <div className="text-sm font-medium">
            Panel: {panel.name}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </div>
          {facilitatorNames.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {facilitatorNames.slice(0, 2).join(', ')}
              {facilitatorNames.length > 2 && ` +${facilitatorNames.length - 2}`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
