'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FeedbackState, ProductArea } from '@/types/feedback';
import { Search } from 'lucide-react';

interface FeedbackFiltersProps {
  state: string;
  productArea: string;
  search: string;
  sortBy?: string;
  villageId?: string;
  onStateChange: (value: string) => void;
  onProductAreaChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSortByChange?: (value: string) => void;
  onVillageChange?: (value: string) => void;
}

interface Village {
  id: string;
  name: string;
}

const stateOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All States' },
  { value: 'new', label: 'New' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in_roadmap', label: 'In Roadmap' },
  { value: 'closed', label: 'Closed' },
];

const productAreaOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All Areas' },
  { value: 'Reservations', label: 'Reservations' },
  { value: 'CheckIn', label: 'Check-in' },
  { value: 'Payments', label: 'Payments' },
  { value: 'Housekeeping', label: 'Housekeeping' },
  { value: 'Backoffice', label: 'Backoffice' },
];

const sortByOptions: { value: string; label: string }[] = [
  { value: 'createdAt', label: 'Recent' },
  { value: 'votes', label: 'Most Voted' },
  { value: 'updatedAt', label: 'Recently Updated' },
];

export function FeedbackFilters({
  state,
  productArea,
  search,
  sortBy = 'createdAt',
  villageId = 'all',
  onStateChange,
  onProductAreaChange,
  onSearchChange,
  onSortByChange,
  onVillageChange,
}: FeedbackFiltersProps) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoadingVillages, setIsLoadingVillages] = useState(true);

  // Fetch villages on mount
  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await fetch('/api/villages');
        if (response.ok) {
          const data = await response.json();
          setVillages(data);
        }
      } catch (error) {
        console.error('Failed to fetch villages:', error);
      } finally {
        setIsLoadingVillages(false);
      }
    };

    fetchVillages();
  }, []);

  return (
    <div className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
      <div className="flex-1">
        <Label htmlFor="search" className="sr-only">
          Search feedback
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            type="search"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search feedback by title or content"
          />
        </div>
      </div>

      <div className="w-full md:w-48">
        <Label htmlFor="state-filter" className="sr-only">
          Filter by state
        </Label>
        <Select value={state} onValueChange={onStateChange}>
          <SelectTrigger id="state-filter" aria-label="Filter by state">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            {stateOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-48">
        <Label htmlFor="area-filter" className="sr-only">
          Filter by product area
        </Label>
        <Select value={productArea} onValueChange={onProductAreaChange}>
          <SelectTrigger id="area-filter" aria-label="Filter by product area">
            <SelectValue placeholder="Product Area" />
          </SelectTrigger>
          <SelectContent>
            {productAreaOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onVillageChange && (
        <div className="w-full md:w-48">
          <Label htmlFor="village-filter" className="sr-only">
            Filter by village
          </Label>
          <Select value={villageId} onValueChange={onVillageChange}>
            <SelectTrigger id="village-filter" aria-label="Filter by village" disabled={isLoadingVillages}>
              <SelectValue placeholder={isLoadingVillages ? "Loading..." : "Village"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Villages</SelectItem>
              {villages.map((village) => (
                <SelectItem key={village.id} value={village.id}>
                  {village.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {onSortByChange && (
        <div className="w-full md:w-48">
          <Label htmlFor="sort-filter" className="sr-only">
            Sort by
          </Label>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger id="sort-filter" aria-label="Sort by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortByOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
