/**
 * Enhanced Analytics Dashboard Page
 *
 * Comprehensive analytics dashboard with specialized visualizations
 * Includes filters, exports, and interactive charts using Recharts
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  AlertCircle,
  Download,
  TrendingUp,
  Users,
  MessageSquare,
  ThumbsUp,
  Target,
} from 'lucide-react';

// Import specialized chart components
import { FeedbackTrendsChart } from '@/components/analytics/FeedbackTrendsChart';
import { VotingPatternsChart } from '@/components/analytics/VotingPatternsChart';
import { NPSScoreCard } from '@/components/analytics/NPSScoreCard';
import { ResponseRatesChart } from '@/components/analytics/ResponseRatesChart';
import { PanelEngagementChart } from '@/components/analytics/PanelEngagementChart';
import { MetricCard } from '@/components/analytics/metric-card';
import { AnalyticsChart } from '@/components/analytics/analytics-chart';
import { exportAsCSV, exportAsJSON, generateExportFilename } from '@/lib/analytics-helpers';

import type { TimeRange, CategoryData, TimeSeriesData } from '@/types/analytics';

// Types for our API responses
interface VotingAnalytics {
  summary: {
    totalVotes: number;
    uniqueVoters: number;
    avgVotesPerUser: number;
    avgVotesPerFeedback: number;
    trend: number;
  };
  votingTrends: TimeSeriesData[];
  votesByProductArea: CategoryData[];
  votesByFeature: {
    featureId: string;
    featureName: string;
    voteCount: number;
    weightedVotes: number;
  }[];
  topVoters: {
    userId: string;
    displayName: string;
    voteCount: number;
    totalWeight: number;
  }[];
}

interface NPSAnalytics {
  summary: {
    overallNPS: number;
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    trend: number;
  };
  npsOverTime: TimeSeriesData[];
  npsDistribution: CategoryData[];
  npsByPanel: {
    panelId: string;
    panelName: string;
    npsScore: number;
    responseCount: number;
  }[];
}

export default function EnhancedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [productArea, setProductArea] = useState<string>('all');
  const [village, setVillage] = useState<string>('all');

  // Data states
  const [votingData, setVotingData] = useState<VotingAnalytics | null>(null);
  const [npsData, setNPSData] = useState<NPSAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch voting analytics
  const fetchVotingAnalytics = async () => {
    try {
      const params = new URLSearchParams({ timeRange });
      if (productArea !== 'all') params.append('productArea', productArea);
      if (village !== 'all') params.append('village', village);

      const response = await fetch(`/api/analytics/voting?${params}`);
      if (!response.ok) throw new Error('Failed to fetch voting analytics');
      const data = await response.json();
      setVotingData(data);
    } catch (err) {
      console.error('Error fetching voting analytics:', err);
      throw err;
    }
  };

  // Fetch NPS analytics
  const fetchNPSAnalytics = async () => {
    try {
      const params = new URLSearchParams({ timeRange });
      const response = await fetch(`/api/analytics/nps?${params}`);
      if (!response.ok) throw new Error('Failed to fetch NPS analytics');
      const data = await response.json();
      setNPSData(data);
    } catch (err) {
      console.error('Error fetching NPS analytics:', err);
      throw err;
    }
  };

  // Fetch all analytics data
  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchVotingAnalytics(), fetchNPSAnalytics()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchAllAnalytics();
  }, [timeRange, productArea, village]);

  // Export handlers
  const handleExportVoting = (format: 'csv' | 'json') => {
    if (!votingData) return;

    const exportData = {
      summary: votingData.summary,
      trends: votingData.votingTrends,
      byProductArea: votingData.votesByProductArea,
      byFeature: votingData.votesByFeature,
      topVoters: votingData.topVoters,
    };

    const filename = generateExportFilename('voting-analytics', format);
    if (format === 'csv') {
      // Flatten for CSV export
      exportAsCSV(votingData.votesByFeature, filename);
    } else {
      exportAsJSON(exportData, filename);
    }
  };

  const handleExportNPS = (format: 'csv' | 'json') => {
    if (!npsData) return;

    const exportData = {
      summary: npsData.summary,
      trends: npsData.npsOverTime,
      distribution: npsData.npsDistribution,
      byPanel: npsData.npsByPanel,
    };

    const filename = generateExportFilename('nps-analytics', format);
    if (format === 'csv') {
      exportAsCSV(npsData.npsByPanel, filename);
    } else {
      exportAsJSON(exportData, filename);
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-gray-600">
                Comprehensive insights into feedback, voting, NPS, and research metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time Range
              </label>
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Product Area
              </label>
              <Select value={productArea} onValueChange={setProductArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="Reservations">Reservations</SelectItem>
                  <SelectItem value="CheckIn">Check-In</SelectItem>
                  <SelectItem value="Payments">Payments</SelectItem>
                  <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="Backoffice">Backoffice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Village
              </label>
              <Select value={village} onValueChange={setVillage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Villages</SelectItem>
                  <SelectItem value="vlg-001">Punta Cana</SelectItem>
                  <SelectItem value="vlg-002">Cancún</SelectItem>
                  <SelectItem value="vlg-003">Martinique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchAllAnalytics} disabled={loading}>
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="voting">Voting</TabsTrigger>
          <TabsTrigger value="nps">NPS</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            renderLoadingSkeleton()
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Total Votes"
                  value={votingData?.summary.totalVotes || 0}
                  trend={votingData?.summary.trend}
                  trendLabel="vs last period"
                  icon={<ThumbsUp className="h-4 w-4" />}
                  color="primary"
                />
                <MetricCard
                  label="Unique Voters"
                  value={votingData?.summary.uniqueVoters || 0}
                  icon={<Users className="h-4 w-4" />}
                  description="active participants"
                />
                <MetricCard
                  label="NPS Score"
                  value={npsData?.summary.overallNPS || 0}
                  trend={npsData?.summary.trend}
                  icon={<Target className="h-4 w-4" />}
                  color={
                    (npsData?.summary.overallNPS || 0) >= 50
                      ? 'success'
                      : (npsData?.summary.overallNPS || 0) >= 0
                      ? 'default'
                      : 'danger'
                  }
                />
                <MetricCard
                  label="NPS Responses"
                  value={npsData?.summary.totalResponses || 0}
                  icon={<MessageSquare className="h-4 w-4" />}
                  description="survey completions"
                />
              </div>

              {/* Charts Row 1 */}
              <div className="grid gap-4 md:grid-cols-2">
                {votingData && (
                  <FeedbackTrendsChart
                    data={votingData.votingTrends}
                    title="Voting Activity Over Time"
                    description="Daily/weekly voting trends"
                    showArea
                  />
                )}
                {npsData && (
                  <NPSScoreCard
                    npsScore={npsData.summary.overallNPS}
                    totalResponses={npsData.summary.totalResponses}
                    promoters={npsData.summary.promoters}
                    passives={npsData.summary.passives}
                    detractors={npsData.summary.detractors}
                    trend={npsData.summary.trend}
                    height={350}
                  />
                )}
              </div>

              {/* Charts Row 2 */}
              <div className="grid gap-4 md:grid-cols-2">
                {votingData && (
                  <VotingPatternsChart
                    data={votingData.votesByProductArea}
                    title="Votes by Product Area"
                    description="Distribution of votes across product areas"
                  />
                )}
                {npsData && (
                  <AnalyticsChart
                    title="NPS Distribution"
                    description="Breakdown by respondent type"
                    type="pie"
                    data={npsData.npsDistribution}
                    height={350}
                    showLegend
                  />
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Voting Tab */}
        <TabsContent value="voting" className="space-y-6">
          {loading ? (
            renderLoadingSkeleton()
          ) : votingData ? (
            <>
              <div className="flex justify-end gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportVoting('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportVoting('json')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>

              {/* Voting Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Total Votes"
                  value={votingData.summary.totalVotes}
                  trend={votingData.summary.trend}
                  icon={<ThumbsUp className="h-4 w-4" />}
                  color="primary"
                />
                <MetricCard
                  label="Unique Voters"
                  value={votingData.summary.uniqueVoters}
                  icon={<Users className="h-4 w-4" />}
                />
                <MetricCard
                  label="Avg Votes/User"
                  value={votingData.summary.avgVotesPerUser.toFixed(1)}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <MetricCard
                  label="Avg Votes/Feedback"
                  value={votingData.summary.avgVotesPerFeedback.toFixed(1)}
                  icon={<MessageSquare className="h-4 w-4" />}
                />
              </div>

              {/* Voting Charts */}
              <FeedbackTrendsChart
                data={votingData.votingTrends}
                title="Voting Trends Over Time"
                description="Number of votes cast over time"
                showArea
              />

              <div className="grid gap-4 md:grid-cols-2">
                <VotingPatternsChart
                  data={votingData.votesByProductArea}
                  title="Votes by Product Area"
                />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Voted Features</CardTitle>
                    <p className="text-sm text-gray-500">Most popular features by vote count</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {votingData.votesByFeature.slice(0, 5).map((feature) => (
                        <div key={feature.featureId} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 truncate flex-1">
                            {feature.featureName}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              {feature.voteCount} votes
                            </span>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {feature.weightedVotes.toFixed(1)} weighted
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No voting data available</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* NPS Tab */}
        <TabsContent value="nps" className="space-y-6">
          {loading ? (
            renderLoadingSkeleton()
          ) : npsData ? (
            <>
              <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => handleExportNPS('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportNPS('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <NPSScoreCard
                  npsScore={npsData.summary.overallNPS}
                  totalResponses={npsData.summary.totalResponses}
                  promoters={npsData.summary.promoters}
                  passives={npsData.summary.passives}
                  detractors={npsData.summary.detractors}
                  trend={npsData.summary.trend}
                  height={350}
                  className="md:col-span-2"
                />
                <AnalyticsChart
                  title="NPS Distribution"
                  type="pie"
                  data={npsData.npsDistribution}
                  height={350}
                />
              </div>

              <FeedbackTrendsChart
                data={npsData.npsOverTime}
                title="NPS Trends Over Time"
                description="NPS score evolution"
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">NPS by Panel</CardTitle>
                  <p className="text-sm text-gray-500">Panel-specific NPS scores</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {npsData.npsByPanel.map((panel) => (
                      <div key={panel.panelId} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{panel.panelName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {panel.responseCount} responses
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              panel.npsScore >= 50
                                ? 'text-green-600'
                                : panel.npsScore >= 0
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {panel.npsScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No NPS data available</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="space-y-6">
          {loading ? (
            renderLoadingSkeleton()
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <ResponseRatesChart
                  data={{
                    sent: 1000,
                    opened: 750,
                    started: 600,
                    completed: 450,
                  }}
                />
                <PanelEngagementChart
                  data={[
                    { category: 'UX Testers', value: 45 },
                    { category: 'Beta Users', value: 32 },
                    { category: 'Feature Feedback', value: 28 },
                    { category: 'Power Users', value: 15 },
                  ]}
                  innerRadius={60}
                />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
