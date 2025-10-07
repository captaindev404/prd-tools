/**
 * Analytics type definitions for Gentil Feedback
 *
 * Defines the data structures for analytics across feedback, research, and product metrics.
 */

import { ProductArea, FeatureStatus, RoadmapStage, FeedbackState, Source } from '@prisma/client';

// ========== TIME RANGE ==========

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

// ========== FEEDBACK ANALYTICS ==========

export interface FeedbackAnalytics {
  summary: {
    totalFeedback: number;
    avgVotes: number;
    responseRate: number;
    trend: number;
  };
  submissionTrends: TimeSeriesData[];
  topFeedback: TopFeedbackItem[];
  byProductArea: CategoryData[];
  bySource: CategoryData[];
  byState: CategoryData[];
  voteTrends: {
    totalVotes: number;
    avgVotesPerFeedback: number;
    trend: number;
  };
  duplicateStats: {
    totalDuplicates: number;
    mergedCount: number;
  };
  responseTime: {
    avgDaysToTriage: number;
    trend: number;
  };
}

export interface TopFeedbackItem {
  id: string;
  title: string;
  voteCount: number;
  state: FeedbackState;
  createdAt: string;
}

// ========== RESEARCH ANALYTICS ==========

export interface ResearchAnalytics {
  summary: {
    totalPanels: number;
    totalMembers: number;
    avgResponseRate: number;
    avgNPS: number;
    trend: number;
  };
  panelStats: {
    totalPanels: number;
    totalMembers: number;
    avgPanelSize: number;
  };
  questionnaireStats: {
    totalSent: number;
    totalResponses: number;
    responseRate: number;
    avgNPS: number;
  };
  sessionStats: {
    totalSessions: number;
    completed: number;
    completionRate: number;
    avgParticipants: number;
  };
  participationTrends: TimeSeriesData[];
  panelGrowth: TimeSeriesData[];
  topQuestions: TopQuestionItem[];
  consentStats: {
    totalUsers: number;
    consentedUsers: number;
    consentRate: number;
  };
}

export interface TopQuestionItem {
  id: string;
  questionText: string;
  responseCount: number;
  avgScore?: number;
}

// ========== PRODUCT ANALYTICS ==========

export interface ProductAnalytics {
  summary: {
    totalFeatures: number;
    roadmapItems: number;
    avgNPS: number;
    activeUsers: number;
    trend: number;
  };
  featureAdoption: CategoryData[];
  roadmapProgress: {
    byStage: CategoryData[];
    completionRate: number;
  };
  userEngagement: {
    activeUsers: number;
    submissionsPerUser: number;
    votesPerUser: number;
    trend: number;
  };
  feedbackToFeatureRatio: {
    totalFeedback: number;
    linkedFeedback: number;
    linkageRate: number;
  };
  npsTrends: TimeSeriesData[];
  villageActivity: VillageActivityItem[];
  topContributors: ContributorItem[];
}

export interface VillageActivityItem {
  villageId: string;
  villageName: string;
  feedbackCount: number;
  voteCount: number;
  activeUsers: number;
}

export interface ContributorItem {
  userId: string;
  displayName: string;
  feedbackCount: number;
  voteCount: number;
  totalContributions: number;
}

// ========== COMMON TYPES ==========

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface CategoryData {
  category: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface MetricCardData {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

// ========== CHART DATA ==========

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: TimeSeriesData[] | CategoryData[];
  xKey?: string;
  yKey?: string;
  colors?: string[];
  height?: number;
}

// ========== EXPORT TYPES ==========

export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  data: unknown;
}

// ========== API QUERY PARAMS ==========

export interface FeedbackAnalyticsParams {
  timeRange?: TimeRange;
  productArea?: ProductArea;
  village?: string;
}

export interface ResearchAnalyticsParams {
  timeRange?: TimeRange;
  panelId?: string;
}

export interface ProductAnalyticsParams {
  timeRange?: TimeRange;
  productArea?: ProductArea;
}

// ========== HELPER TYPES ==========

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  direction: 'up' | 'down' | 'stable';
}
