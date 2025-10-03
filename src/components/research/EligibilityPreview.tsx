'use client';

import * as React from 'react';
import { useState } from 'react';
import { Users, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  EligibilityPreviewData,
  EligibilityPreviewResponse,
} from '@/types/panel';

interface EligibilityPreviewProps {
  panelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota?: number | null;
}

export function EligibilityPreview({
  panelId,
  open,
  onOpenChange,
  quota,
}: EligibilityPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EligibilityPreviewData | null>(null);

  // Fetch eligibility preview when dialog opens
  React.useEffect(() => {
    if (open && panelId) {
      fetchEligibilityPreview();
    } else {
      // Reset state when dialog closes
      setData(null);
      setError(null);
    }
  }, [open, panelId]);

  const fetchEligibilityPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/panels/${panelId}/eligibility-preview`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch eligibility preview');
      }

      const result: EligibilityPreviewResponse = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching eligibility preview:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Calculate quota projections if quota is set
  const quotaProjection = quota && data ? {
    total: data.count,
    quota: quota,
    percentageFilled: Math.min(100, (quota / data.count) * 100),
    remaining: Math.max(0, data.count - quota),
  } : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Eligibility Preview
          </DialogTitle>
          <DialogDescription>
            Preview of users who match this panel's eligibility criteria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {data && !loading && !error && (
            <>
              {/* Count Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {data.count.toLocaleString()}
                    <span className="text-base font-normal text-muted-foreground">
                      eligible users
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Users who match the configured eligibility criteria
                  </CardDescription>
                </CardHeader>
                {quotaProjection && (
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Quota Target</span>
                        <span className="font-medium">
                          {quotaProjection.quota.toLocaleString()} users
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Coverage</span>
                        <Badge variant={quotaProjection.percentageFilled >= 100 ? 'default' : 'secondary'}>
                          {quotaProjection.percentageFilled.toFixed(1)}%
                        </Badge>
                      </div>
                      {quotaProjection.remaining > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Additional pool</span>
                          <span className="font-medium">
                            +{quotaProjection.remaining.toLocaleString()} users
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Note if count >= 200 */}
              {data.note && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{data.note}</AlertDescription>
                </Alert>
              )}

              {/* Sample User List */}
              {data.sample.length > 0 ? (
                <div className="border rounded-lg">
                  <div className="p-4 border-b bg-muted/50">
                    <h3 className="text-sm font-medium">Sample Users (First {data.sample.length})</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Showing a representative sample of eligible users
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Village</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sample.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.displayName || 'N/A'}
                            {user.employeeId && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({user.employeeId})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.villageId || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No users match the current eligibility criteria. Consider adjusting the criteria.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
