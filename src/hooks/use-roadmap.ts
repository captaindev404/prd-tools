'use client';

/**
 * React Query hooks for Roadmap operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchApi } from '@/lib/query-client';
import type { RoadmapStage } from '@prisma/client';

export interface RoadmapFilters {
  stage?: RoadmapStage;
  featureId?: string;
  page?: number;
  limit?: number;
}

export interface RoadmapListResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Hook to fetch roadmap items with filters
 */
export function useRoadmapList(filters?: RoadmapFilters) {
  return useQuery({
    queryKey: queryKeys.roadmap.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.stage) params.append('stage', filters.stage);
      if (filters?.featureId) params.append('featureId', filters.featureId);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `/api/roadmap${params.toString() ? `?${params}` : ''}`;
      return fetchApi<RoadmapListResponse>(url);
    },
    // Roadmap changes less frequently, keep fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch individual roadmap item
 */
export function useRoadmapItem(id: string) {
  return useQuery({
    queryKey: queryKeys.roadmap.detail(id),
    queryFn: () => fetchApi(`/api/roadmap/${id}`),
    staleTime: 2 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Hook to create new roadmap item
 */
export function useCreateRoadmapItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      fetchApi('/api/roadmap', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.roadmap.lists(),
      });
    },
  });
}

/**
 * Hook to update roadmap item
 */
export function useUpdateRoadmapItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi(`/api/roadmap/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.roadmap.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.roadmap.lists(),
      });
    },
  });
}
