/**
 * API Rate Limiting Middleware
 *
 * Provides IP-based rate limiting for API routes to prevent abuse.
 * Uses sliding window algorithm with in-memory storage.
 *
 * Rate Limits (per IP address):
 * - Read endpoints (GET): 100 requests per minute
 * - Write endpoints (POST/PUT/DELETE): 10 requests per minute
 *
 * For production, consider using Redis or another distributed cache.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  requests: number[];
  windowStart: number;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
const RATE_LIMITS = {
  read: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  write: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Gets the client IP address from the request
 */
function getClientIp(request: NextRequest): string {
  // Try various headers for reverse proxy scenarios
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    // x-forwarded-for can be a comma-separated list
    const firstIp = forwarded.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default (shouldn't happen in production)
  return 'unknown';
}

/**
 * Determines if a request is a read or write operation
 */
function getRequestType(method: string): 'read' | 'write' {
  return method === 'GET' || method === 'HEAD' ? 'read' : 'write';
}

/**
 * Cleans up old request timestamps from the sliding window
 */
function cleanupOldRequests(
  requests: number[],
  windowMs: number,
  now: number
): number[] {
  const cutoff = now - windowMs;
  return requests.filter((timestamp) => timestamp > cutoff);
}

/**
 * Checks if a request should be rate limited
 *
 * @param request - The incoming request
 * @returns Object with rate limit status and headers
 */
export function checkApiRateLimit(request: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} {
  const clientIp = getClientIp(request);
  const requestType = getRequestType(request.method);
  const limit = RATE_LIMITS[requestType];
  const now = Date.now();

  // Create key for this IP and request type
  const key = `${clientIp}:${requestType}`;

  // Get or create entry
  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = {
      requests: [],
      windowStart: now,
    };
    rateLimitStore.set(key, entry);
  }

  // Clean up old requests outside the window
  entry.requests = cleanupOldRequests(entry.requests, limit.windowMs, now);

  // Check if limit exceeded
  const currentCount = entry.requests.length;
  const allowed = currentCount < limit.maxRequests;

  if (allowed) {
    // Add this request to the window
    entry.requests.push(now);
  }

  // Calculate reset time (end of current window)
  const oldestRequest = entry.requests[0] || now;
  const resetAt = oldestRequest + limit.windowMs;

  return {
    allowed,
    remaining: Math.max(0, limit.maxRequests - currentCount - (allowed ? 1 : 0)),
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil((resetAt - now) / 1000),
  };
}

/**
 * Applies rate limiting to an API route
 *
 * Usage in API routes:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(request);
 *   if (rateLimitResult) return rateLimitResult; // Rate limited
 *
 *   // Your route logic here...
 * }
 * ```
 *
 * @param request - The incoming request
 * @returns NextResponse with 429 status if rate limited, null if allowed
 */
export async function applyRateLimit(
  request: NextRequest
): Promise<NextResponse | null> {
  const result = checkApiRateLimit(request);

  // Add rate limit headers to track usage
  const headers = {
    'X-RateLimit-Limit': RATE_LIMITS[getRequestType(request.method)].maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };

  if (!result.allowed) {
    // Rate limit exceeded - return 429 Too Many Requests
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': result.retryAfter!.toString(),
        },
      }
    );
  }

  // Request allowed - no response needed, but caller should add headers
  return null;
}

/**
 * Helper to add rate limit headers to a successful response
 *
 * @param response - The response to augment
 * @param request - The original request
 * @returns Response with rate limit headers
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const result = checkApiRateLimit(request);
  const requestType = getRequestType(request.method);

  response.headers.set(
    'X-RateLimit-Limit',
    RATE_LIMITS[requestType].maxRequests.toString()
  );
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

  return response;
}

/**
 * Clears rate limit for a specific IP (admin function)
 */
export function clearIpRateLimit(ip: string): void {
  rateLimitStore.delete(`${ip}:read`);
  rateLimitStore.delete(`${ip}:write`);
}

/**
 * Cleanup function to remove expired entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  rateLimitStore.forEach((entry, key) => {
    // If no recent requests in the last 5 minutes, remove entry
    const hasRecentRequests = entry.requests.some((timestamp) => now - timestamp < 5 * 60 * 1000);

    if (!hasRecentRequests) {
      entriesToDelete.push(key);
    }
  });

  entriesToDelete.forEach((key) => {
    rateLimitStore.delete(key);
  });
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 *
 * Usage:
 * ```typescript
 * export const GET = withRateLimit(async (request: NextRequest) => {
 *   // Your route logic here
 *   return NextResponse.json({ data: 'success' });
 * });
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResponse = await applyRateLimit(request);

    if (rateLimitResponse) {
      // Rate limit exceeded
      return rateLimitResponse;
    }

    // Call the actual handler
    const response = await handler(request, context);

    // Add rate limit headers to successful response
    return addRateLimitHeaders(response, request);
  };
}
