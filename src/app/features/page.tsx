'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FeatureCard, type FeatureCardData } from '@/components/features/feature-card';
import { FeatureFilters } from '@/components/features/feature-filters';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { debounce } from '@/lib/utils';

const ITEMS_PER_PAGE = 20;

interface FeaturesListResponse {
  items: FeatureCardData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export default function FeaturesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [features, setFeatures] = useState<FeatureCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [area, setArea] = useState(searchParams.get('area') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Pagination state
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Check if user can create features (PM, PO, ADMIN)
  const canCreateFeature =
    session?.user?.role === 'PM' ||
    session?.user?.role === 'PO' ||
    session?.user?.role === 'ADMIN';

  // Fetch features data
  const fetchFeatures = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(area !== 'all' && { area }),
        ...(status !== 'all' && { status }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/features?${params}`);
      if (!response.ok) throw new Error('Failed to fetch features');

      const data: FeaturesListResponse = await response.json();

      setFeatures(data.items);
      setTotalItems(data.total);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [area, status, search, page]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (area !== 'all') params.set('area', area);
    if (status !== 'all') params.set('status', status);
    if (search) params.set('q', search);
    if (page > 1) params.set('page', page.toString());

    const queryString = params.toString();
    router.replace(`/features${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [area, status, search, page, router]);

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
          <h1 className="text-3xl font-bold tracking-tight">Features Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Browse product features and track their development status
          </p>
        </div>
        {canCreateFeature && (
          <Button asChild>
            <Link href="/features/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Feature
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FeatureFilters
          area={area}
          status={status}
          search={search}
          onAreaChange={(value) => {
            setArea(value);
            setPage(1);
          }}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {features.length} of {totalItems} {totalItems === 1 ? 'feature' : 'features'}
        </div>
      )}

      {/* Features grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive font-medium">Error loading features</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button onClick={fetchFeatures} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      ) : features.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground font-medium">No features found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {canCreateFeature
              ? 'Try adjusting your filters or create the first feature'
              : 'Try adjusting your filters'}
          </p>
          {canCreateFeature && (
            <Button asChild variant="outline" className="mt-4">
              <Link href="/features/new">Create Feature</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
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
    </div>
  );
}
