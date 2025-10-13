'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TimelineItem } from '@/app/api/roadmap/timeline/route';

interface TimelineViewProps {
  stage?: string;
  includeCompleted?: boolean;
}

const stageColors: Record<string, string> = {
  now: '#10b981', // green
  next: '#3b82f6', // blue
  later: '#6b7280', // gray
  under_consideration: '#f59e0b', // yellow
};

export function TimelineView({ stage, includeCompleted = false }: TimelineViewProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimelineData();
  }, [stage, includeCompleted]);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (stage) params.append('stage', stage);
      if (includeCompleted) params.append('includeCompleted', 'true');

      const response = await fetch(`/api/roadmap/timeline?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline data');
      }

      const data = await response.json();
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Transform data for Gantt chart
  const chartData = items
    .filter((item) => item.startDate && item.targetDate)
    .map((item) => {
      const start = new Date(item.startDate!).getTime();
      const end = new Date(item.targetDate!).getTime();
      const duration = Math.floor((end - start) / (1000 * 60 * 60 * 24)); // days

      return {
        name: item.title,
        start: start,
        duration: duration,
        progress: item.progress,
        stage: item.stage,
        id: item.id,
      };
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Error loading timeline: {error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">
          No roadmap items with target dates to display
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.filter((i) => i.progress > 0 && i.progress < 100).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.filter((i) => i.progress === 100).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(items.reduce((acc, i) => acc + i.progress, 0) / items.length)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Gantt Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
            >
              <XAxis
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => format(new Date(value), 'MMM yyyy')}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null;

                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-white p-3 shadow-lg">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {data.duration} days
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Progress: {data.progress}%
                      </p>
                      <Badge
                        variant="secondary"
                        className="mt-1"
                        style={{
                          backgroundColor: stageColors[data.stage as string],
                          color: 'white',
                        }}
                      >
                        {data.stage}
                      </Badge>
                    </div>
                  );
                }}
              />
              <Bar dataKey="duration" stackId="a">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={stageColors[entry.stage]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Items List with Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Roadmap Items</h3>
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{item.title}</h4>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: stageColors[item.stage],
                        color: 'white',
                      }}
                    >
                      {item.stage}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    {item.startDate && (
                      <span>Start: {format(parseISO(item.startDate), 'MMM dd, yyyy')}</span>
                    )}
                    {item.targetDate && (
                      <span>Target: {format(parseISO(item.targetDate), 'MMM dd, yyyy')}</span>
                    )}
                    {item.features.length > 0 && (
                      <span>{item.features.length} feature(s)</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{item.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.progress}%`,
                          backgroundColor: stageColors[item.stage],
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
