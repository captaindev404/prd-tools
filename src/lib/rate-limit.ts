/**
 * Rate Limiting Utility
 * Tracks user submission rate for feedback
 * Per DSL spec: 10 submissions per user per day
 *
 * Also supports upload-specific rate limiting:
 * - 10 uploads per minute per user
 * - Different limit key: upload:{userId}
 */

interface RateLimitEntry {
  count: number;
  windowStart: Date;
}

// In-memory store for rate limiting (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Feedback submission rate limits (per DSL spec)
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 per day per DSL spec

// Upload-specific rate limits
const UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const UPLOAD_RATE_LIMIT_MAX_REQUESTS = 10; // 10 uploads per minute

/**
 * Checks if a user has exceeded their rate limit
 * @param userId - User ID to check
 * @returns Object with limit status and current count
 */
export function checkRateLimit(userId: string): {
  isExceeded: boolean;
  count: number;
  resetAt: Date;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  // No entry or window expired - allow request
  if (!entry) {
    return {
      isExceeded: false,
      count: 0,
      resetAt: new Date(now + RATE_LIMIT_WINDOW_MS),
    };
  }

  const windowAge = now - entry.windowStart.getTime();

  // Window expired - reset counter
  if (windowAge >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.delete(userId);
    return {
      isExceeded: false,
      count: 0,
      resetAt: new Date(now + RATE_LIMIT_WINDOW_MS),
    };
  }

  // Within window - check limit
  const isExceeded = entry.count >= RATE_LIMIT_MAX_REQUESTS;
  const resetAt = new Date(entry.windowStart.getTime() + RATE_LIMIT_WINDOW_MS);

  return {
    isExceeded,
    count: entry.count,
    resetAt,
  };
}

/**
 * Increments the rate limit counter for a user
 * @param userId - User ID to increment
 */
export function incrementRateLimit(userId: string): void {
  const now = new Date();
  const entry = rateLimitStore.get(userId);

  if (!entry) {
    rateLimitStore.set(userId, {
      count: 1,
      windowStart: now,
    });
  } else {
    const windowAge = now.getTime() - entry.windowStart.getTime();

    // Reset if window expired
    if (windowAge >= RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.set(userId, {
        count: 1,
        windowStart: now,
      });
    } else {
      // Increment within window
      entry.count++;
    }
  }
}

/**
 * Clears rate limit for a user (useful for testing or admin overrides)
 * @param userId - User ID to clear
 */
export function clearRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}

/**
 * Cleans up expired entries from the rate limit store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  rateLimitStore.forEach((entry, userId) => {
    const windowAge = now - entry.windowStart.getTime();
    if (windowAge >= RATE_LIMIT_WINDOW_MS) {
      entriesToDelete.push(userId);
    }
  });

  entriesToDelete.forEach((userId) => {
    rateLimitStore.delete(userId);
  });
}

// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 60 * 60 * 1000);
}

/**
 * Rate limit result with headers
 */
export interface RateLimitResult {
  isExceeded: boolean;
  count: number;
  limit: number;
  resetAt: Date;
  remaining: number;
}

/**
 * Check upload rate limit for a user
 * Per spec: 10 uploads per minute per user
 *
 * @param userId - User ID to check
 * @returns Rate limit status with headers
 */
export function checkUploadRateLimit(userId: string): RateLimitResult {
  const limitKey = `upload:${userId}`;
  const now = Date.now();
  const entry = rateLimitStore.get(limitKey);

  // No entry or window expired - allow request
  if (!entry) {
    return {
      isExceeded: false,
      count: 0,
      limit: UPLOAD_RATE_LIMIT_MAX_REQUESTS,
      resetAt: new Date(now + UPLOAD_RATE_LIMIT_WINDOW_MS),
      remaining: UPLOAD_RATE_LIMIT_MAX_REQUESTS,
    };
  }

  const windowAge = now - entry.windowStart.getTime();

  // Window expired - reset counter
  if (windowAge >= UPLOAD_RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.delete(limitKey);
    return {
      isExceeded: false,
      count: 0,
      limit: UPLOAD_RATE_LIMIT_MAX_REQUESTS,
      resetAt: new Date(now + UPLOAD_RATE_LIMIT_WINDOW_MS),
      remaining: UPLOAD_RATE_LIMIT_MAX_REQUESTS,
    };
  }

  // Within window - check limit
  const isExceeded = entry.count >= UPLOAD_RATE_LIMIT_MAX_REQUESTS;
  const resetAt = new Date(entry.windowStart.getTime() + UPLOAD_RATE_LIMIT_WINDOW_MS);
  const remaining = Math.max(0, UPLOAD_RATE_LIMIT_MAX_REQUESTS - entry.count);

  return {
    isExceeded,
    count: entry.count,
    limit: UPLOAD_RATE_LIMIT_MAX_REQUESTS,
    resetAt,
    remaining,
  };
}

/**
 * Increment upload rate limit counter for a user
 *
 * @param userId - User ID to increment
 */
export function incrementUploadRateLimit(userId: string): void {
  const limitKey = `upload:${userId}`;
  const now = new Date();
  const entry = rateLimitStore.get(limitKey);

  if (!entry) {
    rateLimitStore.set(limitKey, {
      count: 1,
      windowStart: now,
    });
  } else {
    const windowAge = now.getTime() - entry.windowStart.getTime();

    // Reset if window expired
    if (windowAge >= UPLOAD_RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.set(limitKey, {
        count: 1,
        windowStart: now,
      });
    } else {
      // Increment within window
      entry.count++;
    }
  }
}

/**
 * Get rate limit headers for HTTP responses
 *
 * @param result - Rate limit result
 * @returns Headers object for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.resetAt.getTime() / 1000).toString(), // Unix timestamp
  };
}

/**
 * Log rate limit violation
 *
 * @param userId - User ID that exceeded limit
 * @param limitType - Type of limit ('feedback' | 'upload')
 * @param count - Current count
 * @param limit - Maximum allowed
 */
export function logRateLimitViolation(
  userId: string,
  limitType: 'feedback' | 'upload',
  count: number,
  limit: number
): void {
  const timestamp = new Date().toISOString();
  console.warn(
    `[RATE_LIMIT_VIOLATION] ${timestamp} - User ${userId} exceeded ${limitType} rate limit: ${count}/${limit}`
  );

  // In production, you would also:
  // 1. Send to monitoring service (e.g., DataDog, New Relic)
  // 2. Store in database for analysis
  // 3. Trigger alerts if violation rate is high
}
