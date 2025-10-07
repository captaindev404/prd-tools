'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ModerationActions } from '@/components/moderation/moderation-actions';
import {
  AlertTriangle,
  Clock,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ModerationQueueItem {
  id: string;
  title: string;
  body: string;
  author: {
    id: string;
    displayName: string | null;
    email: string;
    role: string;
  };
  createdAt: string;
  toxicityScore: number;
  spamScore: number;
  offTopicScore: number;
  hasPii: boolean;
  moderationSignals: string[];
  metrics: {
    hoursOld: number;
    minutesOld: number;
    slaHoursRemaining: number;
    approachingSla: boolean;
  };
}

interface QueueStats {
  total: number;
  approachingSla: number;
  withPii: number;
  averageAge: number;
}

const ITEMS_PER_PAGE = 20;

export default function ModerationQueuePage() {
  const router = useRouter();

  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'with_pii' | 'approaching_sla'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch moderation queue
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        filter: filter,
      });

      const response = await fetch(`/api/moderation/queue?${params}`);

      if (response.status === 403) {
        router.push('/unauthorized');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch moderation queue');
      }

      const data = await response.json();
      setItems(data.items);
      setStats(data.stats);
      setTotalItems(data.total);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, router]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleActionComplete = () => {
    // Refresh the queue after action
    fetchQueue();
  };

  const formatTimeAgo = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h ago`;
  };

  const getScoreBadge = (score: number, label: string) => {
    if (score < 0.5) return null;

    const variant = score >= 0.7 ? 'destructive' : 'secondary';
    const percentage = Math.round(score * 100);

    return (
      <Badge variant={variant} className="text-xs">
        {label}: {percentage}%
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Moderation Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and moderate flagged feedback submissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approaching SLA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.approachingSla}</div>
              <p className="text-xs text-muted-foreground">Over 24h old</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">With PII</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.withPii}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Age</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageAge}h</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <Select value={filter} onValueChange={(value: any) => {
          setFilter(value);
          setPage(1);
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="with_pii">With PII</SelectItem>
            <SelectItem value="approaching_sla">Approaching SLA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {items.length} {items.length === 1 ? 'item' : 'items'}
          {totalItems > 0 && ` (${totalItems} total)`}
        </div>
      )}

      {/* Queue Items */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive font-medium">Error loading queue</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button onClick={fetchQueue} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No items to review</p>
          <p className="text-sm text-muted-foreground mt-2">
            All feedback has been reviewed or no items match your filters
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/feedback/${item.id}`}
                          className="text-lg font-semibold hover:underline truncate"
                        >
                          {item.title}
                        </Link>
                        {item.metrics.approachingSla && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            SLA: {item.metrics.slaHoursRemaining}h left
                          </Badge>
                        )}
                      </div>

                      {/* Author info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <span>By {item.author.displayName || item.author.email}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(item.metrics.minutesOld)}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.author.role}
                        </Badge>
                      </div>

                      {/* Moderation signals */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.hasPii && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            PII Detected
                          </Badge>
                        )}
                        {getScoreBadge(item.toxicityScore, 'Toxicity')}
                        {getScoreBadge(item.spamScore, 'Spam')}
                        {getScoreBadge(item.offTopicScore, 'Off-topic')}
                      </div>

                      {/* Body preview */}
                      <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {item.body}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <ModerationActions
                        feedbackId={item.id}
                        onActionComplete={handleActionComplete}
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* SLA Info Banner */}
      <div className="mt-8 p-4 bg-muted rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium mb-1">SLA Information</p>
          <p className="text-muted-foreground">
            All flagged feedback must be reviewed within 48 hours of submission. Items older than
            24 hours are marked as approaching SLA and should be prioritized.
          </p>
        </div>
      </div>
    </div>
  );
}
