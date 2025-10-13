'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { FileText, Download, Loader2, Calendar, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChangelogEntry, ChangelogResponse } from '@/app/api/roadmap/changelog/route';

interface ReleaseNotesProps {
  since?: string;
  limit?: number;
  stage?: string;
}

const changeTypeColors = {
  new: 'bg-green-100 text-green-800',
  updated: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
};

const changeTypeLabels = {
  new: 'New',
  updated: 'Updated',
  completed: 'Completed',
};

export function ReleaseNotes({ since, limit = 50, stage }: ReleaseNotesProps) {
  const [data, setData] = useState<ChangelogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchChangelog();
  }, [since, limit, stage]);

  const fetchChangelog = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (since) params.append('since', since);
      if (limit) params.append('limit', limit.toString());
      if (stage) params.append('stage', stage);

      const response = await fetch(`/api/roadmap/changelog?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch changelog');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadChangelog = async (format: 'html' | 'markdown') => {
    try {
      setDownloading(true);
      const response = await fetch('/api/roadmap/changelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          since,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate changelog');
      }

      const result = await response.json();

      // Create download
      const blob = new Blob([result.content], {
        type: format === 'html' ? 'text/html' : 'text/markdown',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `changelog-${format === 'html' ? 'html' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading changelog:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Error loading changelog: {error}</p>
      </div>
    );
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">No changelog entries to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Download Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Release Notes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.summary.total} updates across all stages
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChangelog('markdown')}
            disabled={downloading}
          >
            <Download className="mr-2 h-4 w-4" />
            Markdown
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChangelog('html')}
            disabled={downloading}
          >
            <Download className="mr-2 h-4 w-4" />
            HTML
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.summary.new}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.summary.updated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.summary.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Changelog Entries */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({data.summary.total})</TabsTrigger>
          <TabsTrigger value="new">New ({data.summary.new})</TabsTrigger>
          <TabsTrigger value="updated">Updated ({data.summary.updated})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({data.summary.completed})</TabsTrigger>
        </TabsList>

        {(['all', 'new', 'updated', 'completed'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {data.entries
              .filter((entry) => tab === 'all' || entry.changeType === tab)
              .map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{entry.title}</h3>
                          <Badge
                            variant="secondary"
                            className={changeTypeColors[entry.changeType]}
                          >
                            {changeTypeLabels[entry.changeType]}
                          </Badge>
                          <Badge variant="outline">{entry.stage}</Badge>
                        </div>

                        {entry.description && (
                          <p className="text-sm text-muted-foreground">{entry.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(parseISO(entry.date), 'MMM dd, yyyy')}</span>
                          </div>

                          {entry.targetDate && (
                            <span>Target: {format(parseISO(entry.targetDate), 'MMM dd, yyyy')}</span>
                          )}

                          <span>Progress: {entry.progress}%</span>

                          {entry.features.length > 0 && (
                            <span>{entry.features.length} feature(s)</span>
                          )}

                          {entry.feedbacks.length > 0 && (
                            <span>{entry.feedbacks.length} feedback item(s)</span>
                          )}

                          {entry.jiraTickets.length > 0 && (
                            <span>{entry.jiraTickets.length} Jira ticket(s)</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold">{entry.progress}%</div>
                        <div className="text-xs text-muted-foreground">complete</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
