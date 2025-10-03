/**
 * React Query Configuration
 *
 * Provides centralized query client setup with:
 * - Automatic retry logic with exponential backoff
 * - Optimized cache times for different data types
 * - Error handling defaults
 * - Network state awareness
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default query options for the application
 *
 * - staleTime: How long data is considered fresh (no refetch on mount)
 * - gcTime (formerly cacheTime): How long unused data stays in cache
 * - retry: Number of automatic retry attempts for failed queries
 * - refetchOnWindowFocus: Refetch when user returns to the tab
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Data is fresh for 1 minute (no refetch on mount within this window)
    staleTime: 60 * 1000, // 1 minute

    // Keep unused data in cache for 5 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Refetch on window focus for important data
    refetchOnWindowFocus: true,

    // Don't refetch on reconnect by default (can be overridden per query)
    refetchOnReconnect: false,

    // Don't refetch on mount if data is still fresh
    refetchOnMount: true,
  },
  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount, error: any) => {
      // Don't retry on client errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry once for network errors
      return failureCount < 1;
    },
  },
};

/**
 * Creates a new QueryClient instance with default configuration
 *
 * This should be called once per request on the server, and once per
 * session on the client.
 *
 * @returns Configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}

/**
 * Singleton query client for client-side usage
 *
 * In App Router, we need to be careful about sharing state between
 * requests on the server. This client should only be used on the client side.
 */
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Gets or creates the browser query client
 *
 * This ensures we only create one query client per browser session,
 * avoiding state leakage between requests.
 *
 * @returns QueryClient instance for browser usage
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // On server, always create a new query client
    return createQueryClient();
  }

  // On browser, create query client if it doesn't exist
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}

/**
 * Query Keys Factory
 *
 * Centralized query key management to avoid typos and ensure consistency.
 * Following React Query best practices for hierarchical keys.
 */
export const queryKeys = {
  // Feedback queries
  feedback: {
    all: ['feedback'] as const,
    lists: () => [...queryKeys.feedback.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.feedback.lists(), filters] as const,
    details: () => [...queryKeys.feedback.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.feedback.details(), id] as const,
  },

  // Roadmap queries
  roadmap: {
    all: ['roadmap'] as const,
    lists: () => [...queryKeys.roadmap.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.roadmap.lists(), filters] as const,
    details: () => [...queryKeys.roadmap.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.roadmap.details(), id] as const,
  },

  // Features queries
  features: {
    all: ['features'] as const,
    lists: () => [...queryKeys.features.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.features.lists(), filters] as const,
    details: () => [...queryKeys.features.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.features.details(), id] as const,
  },

  // Notifications queries
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },

  // Questionnaires queries
  questionnaires: {
    all: ['questionnaires'] as const,
    lists: () => [...queryKeys.questionnaires.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.questionnaires.lists(), filters] as const,
    details: () => [...queryKeys.questionnaires.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.questionnaires.details(), id] as const,
    analytics: (id: string) => [...queryKeys.questionnaires.all, id, 'analytics'] as const,
  },

  // Research sessions queries
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.sessions.lists(), filters] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
  },

  // User queries
  user: {
    current: () => ['user', 'current'] as const,
    profile: (id: string) => ['user', 'profile', id] as const,
  },
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper for API calls
 *
 * Automatically handles:
 * - JSON parsing
 * - Error responses
 * - Type safety
 *
 * @param url API endpoint URL
 * @param options Fetch options
 * @returns Parsed JSON response
 */
export async function fetchApi<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText
    }));
    throw new ApiError(
      response.status,
      response.statusText,
      error.message || error.error || 'An error occurred'
    );
  }

  return response.json();
}
