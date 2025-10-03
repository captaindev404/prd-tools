'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import type { ProductArea, FeatureStatus } from '@prisma/client';

interface Feature {
  id: string;
  title: string;
  area: ProductArea;
  status: FeatureStatus;
}

interface LinkFeatureDialogProps {
  feedbackId: string;
  currentFeatureId?: string | null;
  onLinked: () => void;
}

export function LinkFeatureDialog({
  feedbackId,
  currentFeatureId,
  onLinked,
}: LinkFeatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      fetchFeatures();
    }
  }, [open, areaFilter, statusFilter, searchQuery]);

  const fetchFeatures = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '100',
        ...(areaFilter !== 'all' && { area: areaFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/features?${params}`);
      if (!response.ok) throw new Error('Failed to fetch features');

      const data = await response.json();
      setFeatures(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load features');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedFeatureId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/feedback/${feedbackId}/link-feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featureId: selectedFeatureId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to link feature');
      }

      setOpen(false);
      onLinked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFeatures = features.filter((f) => f.id !== currentFeatureId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <LinkIcon className="mr-2 h-4 w-4" />
          Link Feature
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Feedback to Feature</DialogTitle>
          <DialogDescription>
            Select a feature to link this feedback to. This helps organize feedback by product area.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="area-filter">Product Area</Label>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger id="area-filter">
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

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search">Search Features</Label>
            <Input
              id="search"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Feature selection */}
          <div className="space-y-2">
            <Label htmlFor="feature">Select Feature *</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No features found matching your criteria
              </p>
            ) : (
              <Select value={selectedFeatureId} onValueChange={setSelectedFeatureId}>
                <SelectTrigger id="feature">
                  <SelectValue placeholder="Choose a feature" />
                </SelectTrigger>
                <SelectContent>
                  {filteredFeatures.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      <div className="flex items-center gap-2">
                        <span>{feature.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ({feature.area} • {feature.status})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={!selectedFeatureId || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Link Feature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
