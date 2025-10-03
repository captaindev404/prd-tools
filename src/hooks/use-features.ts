'use client';

/**
 * React Query hooks for Features catalog operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchApi } from '@/lib/query-client';
import type { ProductArea, FeatureStatus } from '@prisma/client';

export interface FeatureFilters {
  area?: ProductArea;
  status?: FeatureStatus;
  page?: number;
  limit?: number;
}

export interface FeatureListResponse {
  items: any[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Hook to fetch features catalog with filters
 */
export function useFeaturesList(filters?: FeatureFilters) {
  return useQuery({
    queryKey: queryKeys.features.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.area) params.append('area', filters.area);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `/api/features${params.toString() ? `?${params}` : ''}`;
      return fetchApi<FeatureListResponse>(url);
    },
    // Features change rarely, keep fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch individual feature
 */
export function useFeature(id: string) {
  return useQuery({
    queryKey: queryKeys.features.detail(id),
    queryFn: () => fetchApi(`/api/features/${id}`),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Hook to create new feature
 */
export function useCreateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      fetchApi('/api/features', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.features.lists(),
      });
    },
  });
}

/**
 * Hook to update feature
 */
export function useUpdateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetchApi(`/api/features/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.features.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.features.lists(),
      });
    },
  });
}
