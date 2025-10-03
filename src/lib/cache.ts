/**
 * Redis Cache Utility
 *
 * Provides a centralized caching layer for the application using Redis.
 * Implements TTL-based caching with automatic serialization/deserialization.
 *
 * Features:
 * - Automatic JSON serialization/deserialization
 * - TTL (Time-To-Live) support
 * - Namespace-based key prefixing
 * - Graceful fallback on Redis errors
 * - Type-safe cache operations
 *
 * Performance Benefits:
 * - Reduces database query load
 * - Improves response times for frequently accessed data
 * - Enables horizontal scaling with shared cache
 */

import Redis from 'ioredis';

/**
 * Redis client singleton
 *
 * Configuration:
 * - Host: localhost (development), or REDIS_URL env var (production)
 * - Port: 6379 (default)
 * - Max retries: 3
 * - Retry delay: 200ms
 */
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  // Skip Redis in test environment
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  if (!redis) {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          // Exponential backoff: 200ms, 400ms, 800ms
          const delay = Math.min(times * 200, 2000);
          return delay;
        },
        // Gracefully handle connection errors
        lazyConnect: true,
        enableReadyCheck: true,
      });

      // Connect asynchronously
      redis.connect().catch((error) => {
        console.warn('Redis connection failed, cache disabled:', error.message);
        redis = null;
      });

      // Log connection events
      redis.on('connect', () => {
        console.info('Redis cache connected');
      });

      redis.on('error', (error) => {
        console.warn('Redis error:', error.message);
      });
    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
      redis = null;
    }
  }

  return redis;
}

/**
 * Cache key namespace
 * Used to prefix all cache keys to avoid collisions
 */
const CACHE_NAMESPACE = 'odyssey';

/**
 * Generate a namespaced cache key
 *
 * @param key - The cache key
 * @returns Namespaced key (e.g., "odyssey:dashboard:stats:usr_123")
 */
function getCacheKey(key: string): string {
  return `${CACHE_NAMESPACE}:${key}`;
}

/**
 * Cache TTL (Time-To-Live) presets in seconds
 */
export const CacheTTL = {
  /** 1 minute - For highly dynamic data (user stats, notifications) */
  ONE_MINUTE: 60,
  /** 5 minutes - For trending data, activity feeds */
  FIVE_MINUTES: 300,
  /** 15 minutes - For dashboard metrics, aggregations */
  FIFTEEN_MINUTES: 900,
  /** 1 hour - For feature lists, roadmap items */
  ONE_HOUR: 3600,
  /** 1 day - For static configuration, rarely changing data */
  ONE_DAY: 86400,
} as const;

/**
 * Get a value from cache
 *
 * @param key - The cache key (will be namespaced)
 * @param defaultValue - Optional default value if cache miss or error
 * @returns The cached value or default value
 */
export async function getCached<T>(
  key: string,
  defaultValue?: T
): Promise<T | null> {
  const client = getRedisClient();
  if (!client) {
    return defaultValue ?? null;
  }

  try {
    const cachedValue = await client.get(getCacheKey(key));
    if (cachedValue === null) {
      return defaultValue ?? null;
    }

    return JSON.parse(cachedValue) as T;
  } catch (error) {
    console.warn(`Cache get error for key "${key}":`, error);
    return defaultValue ?? null;
  }
}

/**
 * Set a value in cache with TTL
 *
 * @param key - The cache key (will be namespaced)
 * @param value - The value to cache (will be JSON serialized)
 * @param ttlSeconds - Time-to-live in seconds (default: 5 minutes)
 * @returns true if successful, false otherwise
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = CacheTTL.FIVE_MINUTES
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    await client.setex(getCacheKey(key), ttlSeconds, serialized);
    return true;
  } catch (error) {
    console.warn(`Cache set error for key "${key}":`, error);
    return false;
  }
}

/**
 * Delete a value from cache
 *
 * @param key - The cache key (will be namespaced)
 * @returns true if key was deleted, false otherwise
 */
export async function deleteCached(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const result = await client.del(getCacheKey(key));
    return result > 0;
  } catch (error) {
    console.warn(`Cache delete error for key "${key}":`, error);
    return false;
  }
}

/**
 * Delete multiple cache keys matching a pattern
 *
 * WARNING: Use with caution. Can be slow on large datasets.
 *
 * @param pattern - The key pattern (e.g., "dashboard:*")
 * @returns Number of keys deleted
 */
export async function deleteCachedPattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    const fullPattern = getCacheKey(pattern);
    const keys = await client.keys(fullPattern);

    if (keys.length === 0) {
      return 0;
    }

    const result = await client.del(...keys);
    return result;
  } catch (error) {
    console.warn(`Cache pattern delete error for pattern "${pattern}":`, error);
    return 0;
  }
}

/**
 * Cache-aside pattern: Get from cache or fetch and cache
 *
 * This is the recommended pattern for most use cases.
 *
 * @param key - The cache key
 * @param fetchFn - Function to fetch data on cache miss
 * @param ttlSeconds - Time-to-live in seconds
 * @returns The cached or freshly fetched value
 *
 * @example
 * ```typescript
 * const stats = await getOrFetch(
 *   `dashboard:stats:${userId}`,
 *   () => getDashboardStatsFromDB(userId),
 *   CacheTTL.FIVE_MINUTES
 * );
 * ```
 */
export async function getOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = CacheTTL.FIVE_MINUTES
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch fresh data
  const freshData = await fetchFn();

  // Store in cache for next time (fire and forget)
  setCached(key, freshData, ttlSeconds).catch((error) => {
    console.warn(`Failed to cache data for key "${key}":`, error);
  });

  return freshData;
}

/**
 * Increment a counter in cache (atomic operation)
 *
 * @param key - The cache key
 * @param amount - Amount to increment by (default: 1)
 * @returns The new value after increment
 */
export async function incrementCounter(
  key: string,
  amount: number = 1
): Promise<number | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const result = await client.incrby(getCacheKey(key), amount);
    return result;
  } catch (error) {
    console.warn(`Cache increment error for key "${key}":`, error);
    return null;
  }
}

/**
 * Set a counter with expiration
 *
 * @param key - The cache key
 * @param value - Initial value
 * @param ttlSeconds - Time-to-live in seconds
 * @returns true if successful
 */
export async function setCounter(
  key: string,
  value: number,
  ttlSeconds: number = CacheTTL.FIVE_MINUTES
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.setex(getCacheKey(key), ttlSeconds, value.toString());
    return true;
  } catch (error) {
    console.warn(`Cache set counter error for key "${key}":`, error);
    return false;
  }
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  /**
   * Invalidate all dashboard caches for a user
   */
  async invalidateDashboard(userId: string): Promise<void> {
    await deleteCachedPattern(`dashboard:*:${userId}`);
  },

  /**
   * Invalidate trending feedback cache
   */
  async invalidateTrending(): Promise<void> {
    await deleteCachedPattern('trending:*');
  },

  /**
   * Invalidate all user-related caches
   */
  async invalidateUser(userId: string): Promise<void> {
    await deleteCachedPattern(`*:${userId}:*`);
    await deleteCachedPattern(`*:${userId}`);
  },

  /**
   * Invalidate feedback-related caches
   */
  async invalidateFeedback(feedbackId: string): Promise<void> {
    await deleteCachedPattern(`feedback:${feedbackId}:*`);
    // Also invalidate trending since votes may have changed
    await this.invalidateTrending();
  },

  /**
   * Invalidate all caches (use with caution)
   */
  async invalidateAll(): Promise<void> {
    await deleteCachedPattern('*');
  },
};

/**
 * Health check for Redis connection
 *
 * @returns true if Redis is connected and responsive
 */
export async function isCacheHealthy(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    return false;
  }
}
