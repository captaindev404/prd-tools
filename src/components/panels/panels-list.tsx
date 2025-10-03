'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PanelCard, type PanelCardData } from '@/components/panels/panel-card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

interface PanelsListProps {
  initialPanels: PanelCardData[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
}

/**
 * PanelsList - Client component for paginated panels display
 *
 * Features:
 * - Pagination with page numbers
 * - Previous/Next navigation
 * - Maintains search filters across pages
 * - Shows "Showing X-Y of Z panels"
 * - Loading states
 */
export function PanelsList({ initialPanels, initialTotal, initialPage, pageSize }: PanelsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [panels, setPanels] = useState<PanelCardData[]>(initialPanels);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  // Fetch panels when page changes
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    if (page !== currentPage) {
      setCurrentPage(page);
      fetchPanels(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentPage]);

  const fetchPanels = async (page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      params.set('limit', pageSize.toString());

      const response = await fetch(`/api/panels?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch panels');

      const data = await response.json();
      setPanels(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching panels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const renderPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (panels.length === 0 && !isLoading) {
    const searchQuery = searchParams.get('search');
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          {searchQuery
            ? `No panels found matching "${searchQuery}". Try a different search term.`
            : 'No research panels found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      {total > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {startIndex}-{endIndex} of {total} {total === 1 ? 'panel' : 'panels'}
        </div>
      )}

      {/* Panels grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panels.map((panel) => (
            <PanelCard key={panel.id} panel={panel} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {/* Previous button */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && updatePage(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>

              {/* Page numbers */}
              {renderPageNumbers().map((page, index) => (
                <PaginationItem key={`${page}-${index}`}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => updatePage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              {/* Next button */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && updatePage(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  aria-disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
