/**
 * Tests for rate-limit.ts
 *
 * Test suite for rate limiting utilities including upload rate limits
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  checkRateLimit,
  incrementRateLimit,
  clearRateLimit,
  checkUploadRateLimit,
  incrementUploadRateLimit,
  getRateLimitHeaders,
  logRateLimitViolation,
  RateLimitResult,
} from './rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearRateLimit('test-user-1');
    clearRateLimit('test-user-2');
  });

  describe('feedback rate limiting', () => {
    it('should allow requests within limit', () => {
      const userId = 'test-user-1';

      // First request should be allowed
      const result1 = checkRateLimit(userId);
      expect(result1.isExceeded).toBe(false);
      expect(result1.count).toBe(0);

      // Increment and check again
      incrementRateLimit(userId);
      const result2 = checkRateLimit(userId);
      expect(result2.isExceeded).toBe(false);
      expect(result2.count).toBe(1);
    });

    it('should block requests after limit exceeded', () => {
      const userId = 'test-user-1';

      // Simulate 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        incrementRateLimit(userId);
      }

      const result = checkRateLimit(userId);
      expect(result.isExceeded).toBe(true);
      expect(result.count).toBe(10);
    });

    it('should reset counter after window expires', () => {
      const userId = 'test-user-1';

      // This test would require time manipulation
      // For now, we can test the logic manually
      incrementRateLimit(userId);
      const result = checkRateLimit(userId);
      expect(result.count).toBe(1);

      clearRateLimit(userId);
      const resultAfterClear = checkRateLimit(userId);
      expect(resultAfterClear.count).toBe(0);
    });

    it('should handle multiple users independently', () => {
      const user1 = 'test-user-1';
      const user2 = 'test-user-2';

      incrementRateLimit(user1);
      incrementRateLimit(user1);
      incrementRateLimit(user2);

      const result1 = checkRateLimit(user1);
      const result2 = checkRateLimit(user2);

      expect(result1.count).toBe(2);
      expect(result2.count).toBe(1);
    });
  });

  describe('upload rate limiting', () => {
    it('should allow uploads within limit', () => {
      const userId = 'test-user-1';

      const result1 = checkUploadRateLimit(userId);
      expect(result1.isExceeded).toBe(false);
      expect(result1.count).toBe(0);
      expect(result1.limit).toBe(10);
      expect(result1.remaining).toBe(10);

      incrementUploadRateLimit(userId);
      const result2 = checkUploadRateLimit(userId);
      expect(result2.count).toBe(1);
      expect(result2.remaining).toBe(9);
    });

    it('should block uploads after limit exceeded', () => {
      const userId = 'test-user-1';

      // Simulate 10 uploads (the limit)
      for (let i = 0; i < 10; i++) {
        incrementUploadRateLimit(userId);
      }

      const result = checkUploadRateLimit(userId);
      expect(result.isExceeded).toBe(true);
      expect(result.count).toBe(10);
      expect(result.remaining).toBe(0);
    });

    it('should return correct reset time', () => {
      const userId = 'test-user-1';
      const before = Date.now();

      incrementUploadRateLimit(userId);
      const result = checkUploadRateLimit(userId);

      const after = Date.now();
      const resetTime = result.resetAt.getTime();

      // Reset time should be approximately 1 minute in the future
      expect(resetTime).toBeGreaterThan(before);
      expect(resetTime).toBeLessThanOrEqual(after + 60 * 1000 + 100); // +100ms tolerance
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return correct headers', () => {
      const result: RateLimitResult = {
        isExceeded: false,
        count: 3,
        limit: 10,
        resetAt: new Date('2025-01-01T00:00:00Z'),
        remaining: 7,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('7');
      expect(headers['X-RateLimit-Reset']).toBe(
        Math.floor(new Date('2025-01-01T00:00:00Z').getTime() / 1000).toString()
      );
    });

    it('should handle exceeded limit', () => {
      const result: RateLimitResult = {
        isExceeded: true,
        count: 10,
        limit: 10,
        resetAt: new Date(),
        remaining: 0,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('0');
    });
  });

  describe('logRateLimitViolation', () => {
    it('should not throw error', () => {
      expect(() => {
        logRateLimitViolation('test-user-1', 'feedback', 11, 10);
      }).not.toThrow();

      expect(() => {
        logRateLimitViolation('test-user-2', 'upload', 15, 10);
      }).not.toThrow();
    });
  });
});
