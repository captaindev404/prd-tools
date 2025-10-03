'use client';

/**
 * React Query hooks for Notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchApi } from '@/lib/query-client';

export interface NotificationFilters {
  unreadOnly?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  items: any[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Hook to fetch user notifications
 *
 * Features:
 * - Real-time updates with polling
 * - Unread count tracking
 * - Auto-refresh on window focus
 */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.unreadOnly) params.append('unreadOnly', 'true');
      if (filters?.type) params.append('type', filters.type);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `/api/notifications${params.toString() ? `?${params}` : ''}`;
      return fetchApi<NotificationListResponse>(url);
    },
    // Notifications should be fresh, refetch every 30 seconds
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Poll every 30 seconds for new notifications
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch unread notification count
 *
 * Features:
 * - Aggressive polling for real-time badge updates
 * - Minimal data transfer (just count)
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => fetchApi<{ count: number }>('/api/notifications/unread-count'),
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 15 * 1000, // Poll every 15 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      fetchApi(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      }),
    onSuccess: () => {
      // Invalidate all notification queries to update read status
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchApi('/api/notifications/read-all', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
