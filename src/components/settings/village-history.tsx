'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar } from 'lucide-react';

interface VillageHistoryEntry {
  village_id: string;
  village_name?: string;
  from: string;
  to?: string;
}

interface VillageHistoryProps {
  history: VillageHistoryEntry[];
  currentVillageId?: string | null;
}

export function VillageHistory({ history, currentVillageId }: VillageHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDuration = (from: string, to?: string) => {
    const startDate = new Date(from);
    const endDate = to ? new Date(to) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
    }
  };

  // Sort history by date (most recent first)
  const sortedHistory = [...history].sort((a, b) => {
    return new Date(b.from).getTime() - new Date(a.from).getTime();
  });

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Village History</CardTitle>
          <CardDescription>No village history available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            You haven&apos;t been assigned to any villages yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Village History
        </CardTitle>
        <CardDescription>
          Your assignment history across Club Med villages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedHistory.map((entry, index) => {
            const isCurrent = entry.village_id === currentVillageId && !entry.to;
            const duration = calculateDuration(entry.from, entry.to);

            return (
              <div
                key={`${entry.village_id}-${entry.from}`}
                className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
              >
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      isCurrent
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">
                      {entry.village_name || entry.village_id}
                    </h4>
                    {isCurrent && (
                      <Badge
                        variant="default"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Current
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(entry.from)}</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{entry.to ? formatDate(entry.to) : 'Present'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    Duration: {duration}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total villages:</span>
            <span className="font-medium">{sortedHistory.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
