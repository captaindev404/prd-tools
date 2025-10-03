import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  ThumbsUp,
  FileText,
  Users,
  Video,
  MapPin,
  CheckCircle2,
  Shield
} from 'lucide-react';
import type { ActivityEvent } from '@/types/admin';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const eventIcons: Record<string, any> = {
  'feedback.created': MessageSquare,
  'vote.cast': ThumbsUp,
  'questionnaire.response.recorded': FileText,
  'panel.membership.joined': Users,
  'session.completed': Video,
  'village.changed': MapPin,
  'admin.user.role_changed': Shield,
  'admin.user.village_changed': MapPin,
  'admin.village.created': MapPin,
};

const eventColors: Record<string, string> = {
  'feedback.created': 'text-blue-600',
  'vote.cast': 'text-green-600',
  'questionnaire.response.recorded': 'text-purple-600',
  'panel.membership.joined': 'text-orange-600',
  'session.completed': 'text-pink-600',
  'village.changed': 'text-indigo-600',
  'admin.user.role_changed': 'text-red-600',
  'admin.user.village_changed': 'text-indigo-600',
  'admin.village.created': 'text-teal-600',
};

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = eventIcons[event.type] || CheckCircle2;
            const iconColor = eventColors[event.type] || 'text-gray-600';

            return (
              <div key={event.id}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{event.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {event.userName && (
                        <>
                          <span>{event.userName}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                {index < events.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
