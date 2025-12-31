import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '../route';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';

// Mock dependencies
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    userAnalyticsCache: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    story: {
      count: vi.fn(),
    },
    listeningSession: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

/**
 * Test suite for GET /api/v1/analytics/summary
 *
 * Tests cover:
 * 1. Authentication requirements
 * 2. Cache retrieval and fallback to real-time queries
 * 3. Streak calculation with timezone support
 * 4. Favorites count query
 * 5. Data type conversions (seconds to minutes)
 * 6. Edge cases (new users, no sessions, invalid timezones)
 */
describe('GET /api/v1/analytics/summary', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test 2.1: Route Creation
   */
  describe('Route creation and authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      vi.mocked(requireAuth).mockResolvedValue(null);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('Authentication required');
    });

    it('should return 404 if authenticated user not found in database', async () => {
      // Mock authenticated user but not in DB
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NotFound');
    });
  });

  /**
   * Test 2.2: Total Stories Count Query
   */
  describe('Total stories listened count', () => {
    it('should return cached total stories listened', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 15,
        totalListeningTimeSeconds: 3600,
        currentStreak: 5,
        longestStreak: 10,
        lastListeningDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.story.count).mockResolvedValue(5);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.totalStoriesListened).toBe(15);
    });

    it('should compute total stories from sessions when cache is empty', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const emptyCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastListeningDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(emptyCache);

      // Mock groupBy to return unique story IDs
      vi.mocked(prisma.listeningSession.groupBy).mockResolvedValue([
        { storyId: 'story-1', _count: { storyId: 3 } },
        { storyId: 'story-2', _count: { storyId: 2 } },
        { storyId: 'story-3', _count: { storyId: 1 } },
      ] as any);

      vi.mocked(prisma.listeningSession.aggregate).mockResolvedValue({
        _sum: { duration: 7200 },
      } as any);

      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.story.count).mockResolvedValue(2);
      vi.mocked(prisma.userAnalyticsCache.update).mockResolvedValue(emptyCache);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.totalStoriesListened).toBe(3); // 3 unique stories
      expect(prisma.listeningSession.groupBy).toHaveBeenCalledWith({
        by: ['storyId'],
        where: {
          userId: 'user-123',
          completed: true,
        },
        _count: {
          storyId: true,
        },
      });
    });
  });

  /**
   * Test 2.3: Total Listening Time Aggregation
   */
  describe('Total listening time aggregation', () => {
    it('should return cached total listening time in minutes', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 10,
        totalListeningTimeSeconds: 7200, // 120 minutes
        currentStreak: 3,
        longestStreak: 5,
        lastListeningDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.story.count).mockResolvedValue(3);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.totalListeningTimeMinutes).toBe(120);
    });

    it('should compute total listening time from sessions when cache is empty', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const emptyCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastListeningDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(emptyCache);
      vi.mocked(prisma.listeningSession.groupBy).mockResolvedValue([
        { storyId: 'story-1', _count: { storyId: 1 } },
      ] as any);

      // Mock aggregate to return total duration in seconds
      vi.mocked(prisma.listeningSession.aggregate).mockResolvedValue({
        _sum: { duration: 3600 }, // 60 minutes
      } as any);

      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.story.count).mockResolvedValue(1);
      vi.mocked(prisma.userAnalyticsCache.update).mockResolvedValue(emptyCache);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.totalListeningTimeMinutes).toBe(60);
      expect(prisma.listeningSession.aggregate).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          completed: true,
          duration: {
            not: null,
          },
        },
        _sum: {
          duration: true,
        },
      });
    });

    it('should round listening time to nearest minute', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 5,
        totalListeningTimeSeconds: 3650, // 60.83 minutes -> rounds to 61
        currentStreak: 2,
        longestStreak: 4,
        lastListeningDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.story.count).mockResolvedValue(2);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.totalListeningTimeMinutes).toBe(61);
    });
  });

  /**
   * Test 2.4: Streak Calculation with Timezone Support
   */
  describe('Streak calculation with timezone support', () => {
    it('should calculate current streak for consecutive days (UTC)', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 10,
        totalListeningTimeSeconds: 3600,
        currentStreak: 0,
        longestStreak: 0,
        lastListeningDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);

      // Mock sessions for consecutive days (today, yesterday, day before)
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBefore = new Date(now);
      dayBefore.setDate(dayBefore.getDate() - 2);

      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([
        { startedAt: now },
        { startedAt: yesterday },
        { startedAt: dayBefore },
      ] as any);

      vi.mocked(prisma.story.count).mockResolvedValue(5);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.currentStreak).toBeGreaterThanOrEqual(3);
    });

    it('should calculate longest streak across all sessions', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 10,
        totalListeningTimeSeconds: 3600,
        currentStreak: 0,
        longestStreak: 0,
        lastListeningDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);

      // Mock sessions with a longer streak in the past
      const sessions = [
        { startedAt: new Date('2024-12-31') },
        { startedAt: new Date('2024-12-30') },
        { startedAt: new Date('2024-12-29') },
        { startedAt: new Date('2024-12-28') },
        { startedAt: new Date('2024-12-27') }, // 5-day streak
        { startedAt: new Date('2024-12-20') }, // Gap
        { startedAt: new Date('2024-12-19') },
        { startedAt: new Date('2024-12-18') }, // 3-day streak
      ];

      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue(sessions as any);
      vi.mocked(prisma.story.count).mockResolvedValue(5);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.longestStreak).toBeGreaterThanOrEqual(5);
    });

    it('should support timezone parameter (America/New_York)', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 5,
        totalListeningTimeSeconds: 1800,
        currentStreak: 0,
        longestStreak: 0,
        lastListeningDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([
        { startedAt: new Date('2024-12-31T05:00:00Z') }, // Dec 31 in America/New_York
      ] as any);
      vi.mocked(prisma.story.count).mockResolvedValue(2);

      const mockRequest = new Request(
        'http://localhost/api/v1/analytics/summary?timezone=America/New_York'
      );

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveProperty('currentStreak');
      expect(data.data).toHaveProperty('longestStreak');
    });

    it('should return 400 for invalid timezone', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockRequest = new Request(
        'http://localhost/api/v1/analytics/summary?timezone=Invalid/Timezone'
      );

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ValidationError');
      expect(data.message).toContain('Invalid timezone');
    });

    it('should return streak of 0 for no completed sessions', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastListeningDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.listeningSession.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.listeningSession.aggregate).mockResolvedValue({
        _sum: { duration: 0 },
      } as any);
      vi.mocked(prisma.story.count).mockResolvedValue(0);
      vi.mocked(prisma.userAnalyticsCache.update).mockResolvedValue(mockCache);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.currentStreak).toBe(0);
      expect(data.data.longestStreak).toBe(0);
      expect(data.data.lastListeningDate).toBeNull();
    });
  });

  /**
   * Test 2.5: Favorites Count Query
   */
  describe('Favorites count query', () => {
    it('should return count of favorite stories', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 20,
        totalListeningTimeSeconds: 7200,
        currentStreak: 5,
        longestStreak: 10,
        lastListeningDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);

      // Mock favorites count
      vi.mocked(prisma.story.count).mockResolvedValue(8);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.favoriteStoriesCount).toBe(8);
      expect(prisma.story.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isFavorite: true,
        },
      });
    });

    it('should return 0 for users with no favorite stories', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 5,
        totalListeningTimeSeconds: 1800,
        currentStreak: 1,
        longestStreak: 2,
        lastListeningDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.story.count).mockResolvedValue(0);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.favoriteStoriesCount).toBe(0);
    });
  });

  /**
   * Test 2.6: Integration Tests for Complete Summary
   */
  describe('Complete summary response', () => {
    it('should return all summary fields with correct structure', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 25,
        totalListeningTimeSeconds: 9000, // 150 minutes
        currentStreak: 7,
        longestStreak: 14,
        lastListeningDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([
        { startedAt: new Date('2024-12-31') },
      ] as any);
      vi.mocked(prisma.story.count).mockResolvedValue(12);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Analytics summary retrieved successfully');
      expect(data.data).toMatchObject({
        totalStoriesListened: 25,
        totalListeningTimeMinutes: 150,
        currentStreak: expect.any(Number),
        longestStreak: expect.any(Number),
        favoriteStoriesCount: 12,
        lastListeningDate: expect.any(String),
      });
    });

    it('should create cache for new users', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      // No cache exists
      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(null);

      const newCache = {
        id: 'cache-new',
        userId: 'user-123',
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastListeningDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.create).mockResolvedValue(newCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.listeningSession.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.listeningSession.aggregate).mockResolvedValue({
        _sum: { duration: 0 },
      } as any);
      vi.mocked(prisma.story.count).mockResolvedValue(0);
      vi.mocked(prisma.userAnalyticsCache.update).mockResolvedValue(newCache);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.userAnalyticsCache.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          totalStoriesListened: 0,
          totalListeningTimeSeconds: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastListeningDate: null,
        },
      });
      expect(data.data.totalStoriesListened).toBe(0);
      expect(data.data.totalListeningTimeMinutes).toBe(0);
    });

    it('should handle null duration aggregation gracefully', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const emptyCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 0,
        totalListeningTimeSeconds: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastListeningDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(emptyCache);
      vi.mocked(prisma.listeningSession.groupBy).mockResolvedValue([
        { storyId: 'story-1', _count: { storyId: 1 } },
      ] as any);

      // Mock null duration sum
      vi.mocked(prisma.listeningSession.aggregate).mockResolvedValue({
        _sum: { duration: null },
      } as any);

      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.story.count).mockResolvedValue(0);
      vi.mocked(prisma.userAnalyticsCache.update).mockResolvedValue(emptyCache);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.totalListeningTimeMinutes).toBe(0);
    });

    it('should format last listening date as ISO8601 date string', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const mockCache = {
        id: 'cache-123',
        userId: 'user-123',
        totalStoriesListened: 10,
        totalListeningTimeSeconds: 3600,
        currentStreak: 3,
        longestStreak: 5,
        lastListeningDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.userAnalyticsCache.findUnique).mockResolvedValue(mockCache);
      vi.mocked(prisma.listeningSession.findMany).mockResolvedValue([
        { startedAt: new Date('2024-12-31T12:00:00Z') },
      ] as any);
      vi.mocked(prisma.story.count).mockResolvedValue(3);

      const mockRequest = new Request('http://localhost/api/v1/analytics/summary');

      const response = await GET(mockRequest as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.lastListeningDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });
  });
});
