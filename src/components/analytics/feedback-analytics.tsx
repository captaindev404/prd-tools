/**
 * FeedbackAnalytics Component
 *
 * Displays comprehensive feedback analytics with charts and metrics
 */

'use client';

import { MetricCard } from './metric-card';
import { AnalyticsChart } from './analytics-chart';
import { ExportButton } from './export-button';
import { MessageSquare, TrendingUp, Clock, Copy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatMetric, formatPercentage } from '@/lib/analytics-helpers';
import type { FeedbackAnalytics } from '@/types/analytics';
import Link from 'next/link';

interface FeedbackAnalyticsProps {
  data: FeedbackAnalytics;
}

export function FeedbackAnalyticsComponent({ data }: FeedbackAnalyticsProps) {
  // Format top feedback for export
  const exportData = data.topFeedback.map((item) => ({
    id: item.id,
    title: item.title,
    votes: item.voteCount,
    state: item.state,
    created: new Date(item.createdAt).toLocaleDateString(),
  }));

  const getStateBadgeColor = (state: string) => {
    switch (state) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'triaged':
        return 'bg-amber-100 text-amber-800';
      case 'in_roadmap':
        return 'bg-green-100 text-green-800';
      case 'merged':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Feedback"
          value={formatMetric(data.summary.totalFeedback)}
          trend={data.summary.trend}
          trendLabel="vs last period"
          icon={<MessageSquare className="h-4 w-4" />}
          color="primary"
        />
        <MetricCard
          label="Average Votes"
          value={data.summary.avgVotes.toFixed(1)}
          icon={<TrendingUp className="h-4 w-4" />}
          description="per feedback item"
        />
        <MetricCard
          label="Response Rate"
          value={formatPercentage(data.summary.responseRate)}
          icon={<Clock className="h-4 w-4" />}
          description="triaged feedback"
          color="success"
        />
        <MetricCard
          label="Duplicates Merged"
          value={formatMetric(data.duplicateStats.mergedCount)}
          icon={<Copy className="h-4 w-4" />}
          description="duplicate submissions"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnalyticsChart
          title="Feedback Submissions Over Time"
          description="Daily/weekly submission trends"
          type="line"
          data={data.submissionTrends}
          height={300}
        />
        <AnalyticsChart
          title="Feedback by Product Area"
          description="Distribution across product areas"
          type="pie"
          data={data.byProductArea}
          height={300}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnalyticsChart
          title="Feedback by Source"
          description="Submission channels"
          type="bar"
          data={data.bySource}
          height={300}
        />
        <AnalyticsChart
          title="Feedback by State"
          description="Current status distribution"
          type="bar"
          data={data.byState}
          height={300}
        />
      </div>

      {/* Top Feedback Table */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold">Top Feedback by Votes</h3>
            <p className="text-sm text-gray-500">Most voted feedback items</p>
          </div>
          <ExportButton
            data={exportData}
            filename="top-feedback"
            variant="outline"
            size="sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="w-24">Votes</TableHead>
              <TableHead className="w-32">State</TableHead>
              <TableHead className="w-32">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topFeedback.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400">
                  No feedback data available
                </TableCell>
              </TableRow>
            ) : (
              data.topFeedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/feedback/${item.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {Math.round(item.voteCount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStateBadgeColor(item.state)}>
                      {item.state}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Votes"
          value={formatMetric(data.voteTrends.totalVotes)}
          description="across all feedback"
        />
        <MetricCard
          label="Avg Votes per Feedback"
          value={data.voteTrends.avgVotesPerFeedback.toFixed(1)}
          description="voting engagement"
        />
        <MetricCard
          label="Avg Time to Triage"
          value={`${data.responseTime.avgDaysToTriage} days`}
          description="response efficiency"
        />
      </div>
    </div>
  );
}
