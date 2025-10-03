/**
 * Rate Limiting Utility
 * Tracks user submission rate for feedback
 * Per DSL spec: 10 submissions per user per day
 */

interface RateLimitEntry {
  count: number;
  windowStart: Date;
}

// In-memory store for rate limiting (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 per day per DSL spec

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
