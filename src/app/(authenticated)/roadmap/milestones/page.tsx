'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MilestoneCard } from '@/components/roadmap/MilestoneCard';
import type { Milestone } from '@/app/api/roadmap/milestones/route';

interface MilestonesResponse {
  milestones: Milestone[];
  summary: {
    total: number;
    completed: number;
    onTrack: number;
    atRisk: number;
    delayed: number;
  };
}

export default function MilestonesPage() {
  const [data, setData] = useState<MilestonesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roadmap/milestones');
      if (!response.ok) {
        throw new Error('Failed to fetch milestones');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Error loading milestones: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/roadmap">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Roadmap
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Milestones</h1>
          <p className="mt-2 text-muted-foreground">
            Track progress and status of roadmap milestones
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-2xl font-bold">{data.summary.total}</div>
          <div className="text-sm text-muted-foreground">Total Milestones</div>
        </div>
        <div className="rounded-lg border bg-green-50 p-4">
          <div className="text-2xl font-bold text-green-600">{data.summary.completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="text-2xl font-bold text-blue-600">{data.summary.onTrack}</div>
          <div className="text-sm text-muted-foreground">On Track</div>
        </div>
        <div className="rounded-lg border bg-yellow-50 p-4">
          <div className="text-2xl font-bold text-yellow-600">{data.summary.atRisk}</div>
          <div className="text-sm text-muted-foreground">At Risk</div>
        </div>
        <div className="rounded-lg border bg-red-50 p-4">
          <div className="text-2xl font-bold text-red-600">{data.summary.delayed}</div>
          <div className="text-sm text-muted-foreground">Delayed</div>
        </div>
      </div>

      {/* Milestones by Status */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({data.summary.total})</TabsTrigger>
          <TabsTrigger value="on-track">On Track ({data.summary.onTrack})</TabsTrigger>
          <TabsTrigger value="at-risk">At Risk ({data.summary.atRisk})</TabsTrigger>
          <TabsTrigger value="delayed">Delayed ({data.summary.delayed})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({data.summary.completed})</TabsTrigger>
        </TabsList>

        {(['all', 'on-track', 'at-risk', 'delayed', 'completed'] as const).map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {data.milestones
                .filter((m) => status === 'all' || m.status === status)
                .map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
            </div>

            {data.milestones.filter((m) => status === 'all' || m.status === status).length ===
              0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No milestones in this category
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
