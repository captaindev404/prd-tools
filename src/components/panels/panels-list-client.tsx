'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Users, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error-handler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PanelsListClientProps {
  canManage?: boolean;
}

export function PanelsListClient({ canManage = false }: PanelsListClientProps) {
  const { toast } = useToast();
  const [panels, setPanels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; isRetryable: boolean } | null>(null);
  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  useEffect(() => {
    fetchPanels();
  }, [search, includeArchived]);

  const fetchPanels = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (includeArchived) params.set('includeArchived', 'true');

      const response = await fetch(`/api/panels?${params.toString()}`);

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      setPanels(data.panels || []);
    } catch (err) {
      const errorResult = await handleApiError(err, {
        context: 'Fetching panels list',
      });

      setError({
        message: errorResult.message,
        isRetryable: errorResult.isRetryable,
      });

      toast({
        title: 'Error loading panels',
        description: errorResult.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {canManage ? 'Research Panels' : 'My Research Panels'}
          </h1>
          <p className="text-muted-foreground">
            {canManage
              ? 'Manage user research panels and participants'
              : 'View panels you are invited to or a member of'}
          </p>
        </div>
        {canManage && (
          <Link href="/research/panels/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Panel
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search panels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {canManage && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="archived"
              checked={includeArchived}
              onCheckedChange={(checked) => setIncludeArchived(!!checked)}
            />
            <label htmlFor="archived" className="text-sm">
              Include archived
            </label>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error.message}</span>
            {error.isRetryable && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPanels}
                className="ml-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && panels.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No panels found</h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? 'Try a different search term'
                : canManage
                ? 'Get started by creating your first research panel'
                : 'You are not a member of any research panels yet'}
            </p>
            {canManage && (
              <Link href="/research/panels/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Panel
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Panels Grid */}
      {!loading && !error && panels.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {panels.map((panel) => (
            <Link key={panel.id} href={`/research/panels/${panel.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{panel.name}</CardTitle>
                    {panel.archived && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Archived
                      </span>
                    )}
                  </div>
                  {panel.description && (
                    <CardDescription className="line-clamp-2">
                      {panel.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {panel.memberCount || 0} members
                    {panel.sizeTarget && ` / ${panel.sizeTarget} target`}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
