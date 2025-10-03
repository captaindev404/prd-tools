'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { FeedbackFilters } from '@/components/feedback/FeedbackFilters';
import { Plus, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { debounce } from '@/lib/utils';
import { FeedbackListItem } from '@/types/feedback';
import { EmptyState } from '@/components/ui/empty-state';

const ITEMS_PER_PAGE = 20;

export default function FeedbackListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [feedback, setFeedback] = useState<(FeedbackListItem & { totalWeight?: number; userHasVoted?: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [state, setState] = useState(searchParams.get('state') || 'all');
  const [productArea, setProductArea] = useState(searchParams.get('area') || 'all');
  const [villageId, setVillageId] = useState(searchParams.get('villageId') || 'all');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Pagination state
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch feedback data
  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sortBy,
        sortOrder: 'desc',
      });

      if (state !== 'all') params.set('state', state);
      if (productArea !== 'all') params.set('area', productArea);
      if (villageId !== 'all') params.set('villageId', villageId);
      if (search) params.set('search', search);

      const response = await fetch(`/api/feedback?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();

      // Map API response to ensure voteWeight is set from totalWeight
      const items = (data.items || []).map((item: any) => ({
        ...item,
        voteWeight: item.totalWeight || item.voteWeight || 0,
      }));

      setFeedback(items);
      setTotalItems(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [state, productArea, villageId, search, sortBy, page]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (state !== 'all') params.set('state', state);
    if (productArea !== 'all') params.set('area', productArea);
    if (villageId !== 'all') params.set('villageId', villageId);
    if (search) params.set('q', search);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (page > 1) params.set('page', page.toString());

    const queryString = params.toString();
    router.replace(`/feedback${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [state, productArea, villageId, search, sortBy, page, router]);

  // Debounced search handler
  const debouncedSearchFn = useCallback((value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  }, []);

  const debouncedSearch = debounce(debouncedSearchFn, 300);

  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };


  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
          <p className="text-muted-foreground mt-1">
            Share your ideas and vote on features that matter to you
          </p>
        </div>
        <Button asChild>
          <Link href="/feedback/new">
            <Plus className="mr-2 h-4 w-4" />
            Submit Feedback
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FeedbackFilters
          state={state}
          productArea={productArea}
          villageId={villageId}
          search={search}
          sortBy={sortBy}
          onStateChange={(value) => {
            setState(value);
            setPage(1);
          }}
          onProductAreaChange={(value) => {
            setProductArea(value);
            setPage(1);
          }}
          onVillageChange={(value) => {
            setVillageId(value);
            setPage(1);
          }}
          onSearchChange={handleSearchChange}
          onSortByChange={(value) => {
            setSortBy(value);
            setPage(1);
          }}
        />
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {feedback.length} {feedback.length === 1 ? 'result' : 'results'}
        </div>
      )}

      {/* Feedback list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive font-medium">Error loading feedback</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button onClick={fetchFeedback} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      ) : feedback.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg">
          <EmptyState
            icon={MessageSquare}
            title="No feedback found"
            description="Try adjusting your filters or be the first to submit feedback to help shape our products."
            action={{
              label: 'Submit Feedback',
              href: '/feedback/new',
              variant: 'default',
              icon: Plus,
            }}
          />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {feedback.map((item) => (
              <FeedbackCard
                key={item.id}
                feedback={item}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
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
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
    </div>
  );
}
