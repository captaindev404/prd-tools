'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface FeatureFiltersProps {
  area: string;
  status: string;
  search: string;
  onAreaChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function FeatureFilters({
  area,
  status,
  search,
  onAreaChange,
  onStatusChange,
  onSearchChange,
}: FeatureFiltersProps) {
  return (
    <Card className="p-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search features..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Product Area Filter */}
        <div className="space-y-2">
          <Label htmlFor="area">Product Area</Label>
          <Select value={area} onValueChange={onAreaChange}>
            <SelectTrigger id="area">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="Reservations">Reservations</SelectItem>
              <SelectItem value="CheckIn">Check-in</SelectItem>
              <SelectItem value="Payments">Payments</SelectItem>
              <SelectItem value="Housekeeping">Housekeeping</SelectItem>
              <SelectItem value="Backoffice">Backoffice</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="idea">Idea</SelectItem>
              <SelectItem value="discovery">Discovery</SelectItem>
              <SelectItem value="shaping">Shaping</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="generally_available">Generally Available</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
