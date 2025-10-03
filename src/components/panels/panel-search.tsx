'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { debounce } from '@/lib/utils';

interface PanelSearchProps {
  totalCount: number;
}

/**
 * PanelSearch component for filtering panels by name.
 *
 * Features:
 * - Debounced search input (300ms)
 * - Updates URL query param ?search=...
 * - Resets to page 1 when searching
 * - Clear search button (X icon)
 * - Loading state during search
 */
export function PanelSearch({ totalCount }: PanelSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [isSearching, setIsSearching] = useState(false);

  // Debounced function to update URL params
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateURL = useCallback(
    debounce((value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set('search', value.trim());
        // Reset to page 1 when searching
        params.set('page', '1');
      } else {
        params.delete('search');
        // Reset to page 1 when clearing search
        params.set('page', '1');
      }

      // Update URL without full page reload
      router.push(`?${params.toString()}`, { scroll: false });
      setIsSearching(false);
    }, 300),
    [searchParams, router]
  );

  // Handle input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setIsSearching(true);
    debouncedUpdateURL(value);
  };

  // Clear search
  const handleClear = () => {
    setSearchValue('');
    setIsSearching(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    // Reset to page 1 when clearing
    params.set('page', '1');
    router.push(`?${params.toString()}`, { scroll: false });
    setIsSearching(false);
  };

  // Update local state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchValue(urlSearch);
  }, [searchParams]);

  const hasSearch = searchValue.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search panels by name..."
          value={searchValue}
          onChange={handleSearchChange}
          className="pl-9 pr-20"
          aria-label="Search panels"
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          )}
          {hasSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 w-7 p-0"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!hasSearch && totalCount > 0 && (
        <div className="text-sm text-muted-foreground">
          Total: {totalCount} {totalCount === 1 ? 'panel' : 'panels'}
        </div>
      )}
    </div>
  );
}
