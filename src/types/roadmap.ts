/**
 * Roadmap domain types
 * Based on DSL specification (dsl/global.yaml)
 */

import type { RoadmapStage, Visibility } from '@prisma/client';

export type { RoadmapStage, Visibility };

export interface RoadmapOwner {
  id: string;
  displayName: string | null;
  email: string;
  role: string;
}

export interface LinkedFeature {
  id: string;
  title: string;
  area: string;
  status: string;
}

export interface LinkedFeedback {
  id: string;
  title: string;
  state: string;
  voteCount: number;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  stage: RoadmapStage;
  targetDate: string | null;
  progress: number;
  visibility: Visibility;

  // Owner
  createdBy: RoadmapOwner;

  // Links
  features: LinkedFeature[];
  feedbacks: LinkedFeedback[];
  jiraTickets: string[];
  figmaLinks: string[];

  // Communications
  commsCadence: string | null;
  commsChannels: string[];
  commsAudience: Record<string, any>;

  // Metrics
  successCriteria: string[];
  guardrails: string[];

  createdAt: string;
  updatedAt: string;
}

export interface RoadmapListItem {
  id: string;
  title: string;
  description: string | null;
  stage: RoadmapStage;
  targetDate: string | null;
  progress: number;
  visibility: Visibility;

  // Owner
  createdBy: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };

  // Counts
  featureCount: number;
  feedbackCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface CreateRoadmapInput {
  title: string;
  description?: string;
  stage: RoadmapStage;
  targetDate?: string | null;
  progress?: number;
  visibility?: Visibility;

  // Links
  featureIds?: string[];
  feedbackIds?: string[];
  jiraTickets?: string[];
  figmaLinks?: string[];

  // Communications
  commsCadence?: string;
  commsChannels?: string[];
  commsAudience?: Record<string, any>;

  // Metrics
  successCriteria?: string[];
  guardrails?: string[];
}

export interface UpdateRoadmapInput {
  title?: string;
  description?: string;
  stage?: RoadmapStage;
  targetDate?: string | null;
  progress?: number;
  visibility?: Visibility;

  // Links
  featureIds?: string[];
  feedbackIds?: string[];
  jiraTickets?: string[];
  figmaLinks?: string[];

  // Communications
  commsCadence?: string;
  commsChannels?: string[];
  commsAudience?: Record<string, any>;

  // Metrics
  successCriteria?: string[];
  guardrails?: string[];
}

export interface PublishRoadmapInput {
  message?: string;
  audience?: {
    allUsers?: boolean;
    villages?: string[];
    panels?: string[];
  };
  channels?: ('in-app' | 'email' | 'inbox')[];
}

export interface PublishRoadmapResponse {
  success: boolean;
  notificationCount: number;
  eventId: string;
  message: string;
}

export interface RoadmapFilters {
  stage?: RoadmapStage | 'all';
  visibility?: Visibility | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface RoadmapListResponse {
  items: RoadmapListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface RoadmapApiResponse {
  success: boolean;
  data?: RoadmapItem;
  error?: string;
  message?: string;
}

export interface RoadmapValidationError {
  field: string;
  message: string;
}

export interface RoadmapApiErrorResponse {
  error: string;
  message: string;
  details?: RoadmapValidationError[];
  statusCode: number;
}
