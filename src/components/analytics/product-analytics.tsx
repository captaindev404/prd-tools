/**
 * ProductAnalytics Component
 *
 * Displays comprehensive product analytics with charts and metrics
 */

'use client';

import { MetricCard } from './metric-card';
import { AnalyticsChart } from './analytics-chart';
import { ExportButton } from './export-button';
import { Package, TrendingUp, Users, Link as LinkIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMetric, formatPercentage } from '@/lib/analytics-helpers';
import type { ProductAnalytics } from '@/types/analytics';

interface ProductAnalyticsProps {
  data: ProductAnalytics;
}

export function ProductAnalyticsComponent({ data }: ProductAnalyticsProps) {
  // Format top contributors for export
  const contributorsExportData = data.topContributors.map((item) => ({
    name: item.displayName,
    feedback: item.feedbackCount,
    votes: item.voteCount,
    total: item.totalContributions,
  }));

  // Format village activity for export
  const villageExportData = data.villageActivity.map((item) => ({
    village: item.villageName,
    feedback: item.feedbackCount,
    votes: item.voteCount,
    activeUsers: item.activeUsers,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Features"
          value={formatMetric(data.summary.totalFeatures)}
          icon={<Package className="h-4 w-4" />}
          color="primary"
        />
        <MetricCard
          label="Roadmap Items"
          value={formatMetric(data.summary.roadmapItems)}
          icon={<TrendingUp className="h-4 w-4" />}
          description="active roadmap items"
        />
        <MetricCard
          label="NPS Score"
          value={data.summary.avgNPS}
          icon={<TrendingUp className="h-4 w-4" />}
          description="net promoter score"
          color={data.summary.avgNPS >= 0 ? 'success' : 'warning'}
        />
        <MetricCard
          label="Active Users"
          value={formatMetric(data.summary.activeUsers)}
          trend={data.summary.trend}
          trendLabel="vs last period"
          icon={<Users className="h-4 w-4" />}
          color="success"
        />
      </div>

      {/* User Engagement Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Submissions per User"
          value={data.userEngagement.submissionsPerUser.toFixed(1)}
          description="average feedback per user"
        />
        <MetricCard
          label="Votes per User"
          value={data.userEngagement.votesPerUser.toFixed(1)}
          description="average votes per user"
        />
        <MetricCard
          label="Feedback Linkage"
          value={formatPercentage(data.feedbackToFeatureRatio.linkageRate)}
          icon={<LinkIcon className="h-4 w-4" />}
          description="linked to features"
          color="primary"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnalyticsChart
          title="Feature Adoption by Status"
          description="Distribution of feature statuses"
          type="bar"
          data={data.featureAdoption}
          height={300}
        />
        <AnalyticsChart
          title="Roadmap Progress by Stage"
          description="Items in each roadmap stage"
          type="pie"
          data={data.roadmapProgress.byStage}
          height={300}
        />
      </div>

      {/* NPS Trends Chart */}
      {data.npsTrends.length > 0 && (
        <AnalyticsChart
          title="NPS Trends Over Time"
          description="Net Promoter Score progression"
          type="line"
          data={data.npsTrends}
          height={300}
        />
      )}

      {/* Village Activity Table */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold">Village Activity</h3>
            <p className="text-sm text-gray-500">Most active villages by engagement</p>
          </div>
          <ExportButton
            data={villageExportData}
            filename="village-activity"
            variant="outline"
            size="sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Village</TableHead>
              <TableHead className="w-32">Feedback</TableHead>
              <TableHead className="w-32">Votes</TableHead>
              <TableHead className="w-32">Active Users</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.villageActivity.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400">
                  No village activity data available
                </TableCell>
              </TableRow>
            ) : (
              data.villageActivity.slice(0, 10).map((item) => (
                <TableRow key={item.villageId}>
                  <TableCell className="font-medium">{item.villageName}</TableCell>
                  <TableCell className="font-semibold text-blue-600">
                    {item.feedbackCount}
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {item.voteCount}
                  </TableCell>
                  <TableCell className="font-semibold text-purple-600">
                    {item.activeUsers}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Top Contributors Table */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold">Top Contributors</h3>
            <p className="text-sm text-gray-500">Users with most feedback and votes</p>
          </div>
          <ExportButton
            data={contributorsExportData}
            filename="top-contributors"
            variant="outline"
            size="sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="w-32">Feedback</TableHead>
              <TableHead className="w-32">Votes</TableHead>
              <TableHead className="w-32">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topContributors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400">
                  No contributor data available
                </TableCell>
              </TableRow>
            ) : (
              data.topContributors.map((item) => (
                <TableRow key={item.userId}>
                  <TableCell className="font-medium">{item.displayName}</TableCell>
                  <TableCell className="font-semibold text-blue-600">
                    {item.feedbackCount}
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {item.voteCount}
                  </TableCell>
                  <TableCell className="font-semibold text-purple-600">
                    {item.totalContributions}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Roadmap Completion */}
      <div className="rounded-lg border bg-white p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Roadmap Progress</h3>
            <p className="text-sm text-gray-500">Overall roadmap completion status</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-2xl font-bold">{formatMetric(data.summary.roadmapItems)}</div>
              <div className="text-sm text-gray-500">Total Roadmap Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(data.roadmapProgress.completionRate)}
              </div>
              <div className="text-sm text-gray-500">Completion Rate</div>
            </div>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${data.roadmapProgress.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Total Feedback"
          value={formatMetric(data.feedbackToFeatureRatio.totalFeedback)}
          description="all feedback items"
        />
        <MetricCard
          label="Linked to Features"
          value={formatMetric(data.feedbackToFeatureRatio.linkedFeedback)}
          description={`${formatPercentage(data.feedbackToFeatureRatio.linkageRate)} of total`}
        />
      </div>
    </div>
  );
}
