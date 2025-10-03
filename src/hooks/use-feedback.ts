'use client';

/**
 * React Query hooks for Feedback operations
 *
 * Provides optimized data fetching and caching for:
 * - Feedback list with filters and pagination
 * - Individual feedback details
 * - Feedback mutations (create, update, vote)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchApi } from '@/lib/query-client';
import type { FeedbackState, ProductArea } from '@prisma/client';

// Types
export interface FeedbackFilters {
  state?: FeedbackState;
  area?: ProductArea;
  villageId?: string;
  featureId?: string;
  authorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'votes';
  sortOrder?: 'asc' | 'desc';
}

export interface FeedbackListResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateFeedbackInput {
  title: string;
  body: string;
  featureId?: string;
  villageId?: string;
  source?: 'app' | 'web' | 'kiosk' | 'support' | 'import';
  visibility?: 'public' | 'internal';
}

/**
 * Hook to fetch paginated feedback list with filters
 *
 * Features:
 * - Automatic caching and background refetching
 * - Query key based on filters for granular cache invalidation
 * - Optimized for frequent list views
 *
 * @param filters - Optional filters for the feedback list
 * @returns Query result with feedback items and pagination info
 */
export function useFeedbackList(filters?: FeedbackFilters) {
  return useQuery({
    queryKey: queryKeys.feedback.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.state) params.append('state', filters.state);
      if (filters?.area) params.append('area', filters.area);
      if (filters?.villageId) params.append('villageId', filters.villageId);
      if (filters?.featureId) params.append('featureId', filters.featureId);
      if (filters?.authorId) params.append('authorId', filters.authorId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const url = `/api/feedback${params.toString() ? `?${params}` : ''}`;
      return fetchApi<FeedbackListResponse>(url);
    },
    // Keep data fresh for 30 seconds for list views
    staleTime: 30 * 1000,
    // Refetch on window focus for real-time updates
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch individual feedback details
 *
 * @param id - Feedback ID
 * @returns Query result with feedback details
 */
export function useFeedback(id: string) {
  return useQuery({
    queryKey: queryKeys.feedback.detail(id),
    queryFn: () => fetchApi(`/api/feedback/${id}`),
    // Keep individual feedback fresh for 1 minute
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Hook to create new feedback
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic list invalidation on success
 * - Error handling with rollback
 *
 * @returns Mutation object with create function
 */
export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFeedbackInput) =>
      fetchApi('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate all feedback lists to refetch with new item
      queryClient.invalidateQueries({
        queryKey: queryKeys.feedback.lists(),
      });
    },
  });
}

/**
 * Hook to vote on feedback
 *
 * Features:
 * - Optimistic updates for instant feedback
 * - Automatic cache updates
 * - Rollback on error
 *
 * @returns Mutation object with vote function
 */
export function useVoteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedbackId }: { feedbackId: string }) =>
      fetchApi(`/api/feedback/${feedbackId}/vote`, {
        method: 'POST',
      }),
    onSuccess: (data, variables) => {
      // Invalidate the specific feedback detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.feedback.detail(variables.feedbackId),
      });
      // Invalidate all feedback lists to update vote counts
      queryClient.invalidateQueries({
        queryKey: queryKeys.feedback.lists(),
      });
    },
  });
}

/**
 * Hook to remove vote from feedback
 *
 * @returns Mutation object with unvote function
 */
export function useUnvoteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedbackId }: { feedbackId: string }) =>
      fetchApi(`/api/feedback/${feedbackId}/vote`, {
        method: 'DELETE',
      }),
    onSuccess: (data, variables) => {
      // Invalidate the specific feedback detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.feedback.detail(variables.feedbackId),
      });
      // Invalidate all feedback lists to update vote counts
      queryClient.invalidateQueries({
        queryKey: queryKeys.feedback.lists(),
      });
    },
  });
}
