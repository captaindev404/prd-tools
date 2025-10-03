/**
 * ResearchAnalytics Component
 *
 * Displays comprehensive research analytics with charts and metrics
 */

'use client';

import { MetricCard } from './metric-card';
import { AnalyticsChart } from './analytics-chart';
import { ExportButton } from './export-button';
import { Users, CheckCircle, MessageCircle, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMetric, formatPercentage } from '@/lib/analytics-helpers';
import type { ResearchAnalytics } from '@/types/analytics';

interface ResearchAnalyticsProps {
  data: ResearchAnalytics;
}

export function ResearchAnalyticsComponent({ data }: ResearchAnalyticsProps) {
  // Format top questions for export
  const exportData = data.topQuestions.map((item) => ({
    question: item.questionText,
    responses: item.responseCount,
    avgScore: item.avgScore?.toFixed(2) || 'N/A',
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Panels"
          value={formatMetric(data.summary.totalPanels)}
          trend={data.summary.trend}
          trendLabel="vs last period"
          icon={<Users className="h-4 w-4" />}
          color="primary"
        />
        <MetricCard
          label="Total Members"
          value={formatMetric(data.summary.totalMembers)}
          icon={<Users className="h-4 w-4" />}
          description="active panel members"
        />
        <MetricCard
          label="Response Rate"
          value={formatPercentage(data.summary.avgResponseRate)}
          icon={<MessageCircle className="h-4 w-4" />}
          description="questionnaire responses"
          color="success"
        />
        <MetricCard
          label="Average NPS"
          value={data.summary.avgNPS}
          icon={<TrendingUp className="h-4 w-4" />}
          description="net promoter score"
          color={data.summary.avgNPS >= 0 ? 'success' : 'warning'}
        />
      </div>

      {/* Panel Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Average Panel Size"
          value={data.panelStats.avgPanelSize.toFixed(1)}
          description="members per panel"
        />
        <MetricCard
          label="Questionnaires Sent"
          value={formatMetric(data.questionnaireStats.totalSent)}
          description="total questionnaires"
        />
        <MetricCard
          label="Session Completion"
          value={formatPercentage(data.sessionStats.completionRate)}
          description="completed sessions"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnalyticsChart
          title="Panel Membership Growth"
          description="Cumulative panel members over time"
          type="area"
          data={data.panelGrowth}
          height={300}
        />
        <AnalyticsChart
          title="Participation Trends"
          description="New panel members over time"
          type="line"
          data={data.participationTrends}
          height={300}
        />
      </div>

      {/* Top Questions Table */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold">Top Questions by Response Count</h3>
            <p className="text-sm text-gray-500">Most answered questionnaire questions</p>
          </div>
          <ExportButton
            data={exportData}
            filename="top-questions"
            variant="outline"
            size="sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead className="w-32">Responses</TableHead>
              <TableHead className="w-32">Avg Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-400">
                  No question data available
                </TableCell>
              </TableRow>
            ) : (
              data.topQuestions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={item.questionText}>
                      {item.questionText}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {item.responseCount}
                  </TableCell>
                  <TableCell>
                    {item.avgScore ? (
                      <span className="font-medium">{item.avgScore.toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Session Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Sessions"
          value={formatMetric(data.sessionStats.totalSessions)}
          description="research sessions"
        />
        <MetricCard
          label="Completed Sessions"
          value={formatMetric(data.sessionStats.completed)}
          description={formatPercentage(data.sessionStats.completionRate) + ' completion'}
          color="success"
        />
        <MetricCard
          label="Avg Participants"
          value={data.sessionStats.avgParticipants.toFixed(1)}
          description="per session"
        />
      </div>

      {/* Consent Stats */}
      <div className="rounded-lg border bg-white p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Research Consent</h3>
            <p className="text-sm text-gray-500">User consent for research participation</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold">{formatMetric(data.consentStats.totalUsers)}</div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatMetric(data.consentStats.consentedUsers)}
              </div>
              <div className="text-sm text-gray-500">Consented Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(data.consentStats.consentRate)}
              </div>
              <div className="text-sm text-gray-500">Consent Rate</div>
            </div>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${data.consentStats.consentRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questionnaire Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Total Responses"
          value={formatMetric(data.questionnaireStats.totalResponses)}
          description="questionnaire responses"
        />
        <MetricCard
          label="Overall NPS"
          value={data.questionnaireStats.avgNPS}
          description="from all questionnaires"
          color={data.questionnaireStats.avgNPS >= 0 ? 'success' : 'warning'}
        />
      </div>
    </div>
  );
}
