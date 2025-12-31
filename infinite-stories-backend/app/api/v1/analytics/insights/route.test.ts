import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { prisma } from '@/lib/prisma/client';

/**
 * Integration tests for GET /api/v1/analytics/insights
 *
 * Tests cover:
 * - Average story length calculation
 * - Average listens per story calculation
 * - Preferred listening hour analysis
 * - Preferred listening period classification
 * - Most listened story query
 * - Total unique stories listened
 * - Edge cases (no data, single session, etc.)
 */

// Mock requireAuth to return a test user
const mockUserId = 'test-user-insights-123';
const mockAuthUser = { id: mockUserId, email: 'test-insights@example.com' };

// Mock the auth module
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(() => Promise.resolve(mockAuthUser)),
}));

describe('GET /api/v1/analytics/insights', () => {
  let testUser: any;
  let testHero: any;
  let testStories: any[] = [];

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.listeningSession.deleteMany({ where: { userId: mockUserId } });
    await prisma.story.deleteMany({ where: { userId: mockUserId } });
    await prisma.hero.deleteMany({ where: { userId: mockUserId } });
    await prisma.userAnalyticsCache.deleteMany({ where: { userId: mockUserId } });
    await prisma.user.deleteMany({ where: { id: mockUserId } });
    await prisma.user.deleteMany({ where: { email: 'test-insights@example.com' } });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: mockUserId,
        email: 'test-insights@example.com',
        emailVerified: true,
        name: 'Test User Insights',
      },
    });

    // Create test hero
    testHero = await prisma.hero.create({
      data: {
        userId: testUser.id,
        name: 'Test Hero',
        age: 8,
        traits: ['brave', 'kind'],
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.listeningSession.deleteMany({ where: { userId: mockUserId } });
    await prisma.story.deleteMany({ where: { userId: mockUserId } });
    await prisma.hero.deleteMany({ where: { userId: mockUserId } });
    await prisma.userAnalyticsCache.deleteMany({ where: { userId: mockUserId } });
    await prisma.user.deleteMany({ where: { id: mockUserId } });
  });

  beforeEach(async () => {
    // Clean up sessions and stories before each test
    await prisma.listeningSession.deleteMany({ where: { userId: mockUserId } });
    await prisma.story.deleteMany({ where: { userId: mockUserId } });
    testStories = [];
  });

  it('should return null values when user has no listening data', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.insights).toEqual({
      averageStoryLengthMinutes: null,
      averageListensPerStory: null,
      preferredListeningHour: null,
      preferredListeningPeriod: null,
      mostListenedStory: null,
      totalUniqueStoriesListened: 0,
    });
  });

  it('should calculate average story length correctly', async () => {
    // Create stories with different audio durations
    const story1 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 1',
        content: 'Test content',
        audioDuration: 300, // 5 minutes
        playCount: 1,
      },
    });

    const story2 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 2',
        content: 'Test content',
        audioDuration: 600, // 10 minutes
        playCount: 1,
      },
    });

    testStories.push(story1, story2);

    // Create listening sessions
    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story1.id,
        startedAt: new Date('2024-01-01T20:00:00Z'),
        duration: 300,
        completed: true,
      },
    });

    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story2.id,
        startedAt: new Date('2024-01-02T20:00:00Z'),
        duration: 600,
        completed: true,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Average: (300 + 600) / 2 / 60 = 7.5 minutes
    expect(data.data.insights.averageStoryLengthMinutes).toBe(7.5);
  });

  it('should calculate average listens per story correctly', async () => {
    const story1 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 1',
        content: 'Test content',
        audioDuration: 300,
        playCount: 3,
      },
    });

    const story2 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 2',
        content: 'Test content',
        audioDuration: 300,
        playCount: 1,
      },
    });

    testStories.push(story1, story2);

    // Create 3 sessions for story1, 1 for story2
    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story1.id,
        startedAt: new Date('2024-01-01T20:00:00Z'),
        duration: 300,
      },
    });

    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story1.id,
        startedAt: new Date('2024-01-02T20:00:00Z'),
        duration: 300,
      },
    });

    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story1.id,
        startedAt: new Date('2024-01-03T20:00:00Z'),
        duration: 300,
      },
    });

    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story2.id,
        startedAt: new Date('2024-01-04T20:00:00Z'),
        duration: 300,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // 4 total sessions / 2 unique stories = 2.0 average
    expect(data.data.insights.averageListensPerStory).toBe(2.0);
    expect(data.data.insights.totalUniqueStoriesListened).toBe(2);
  });

  it('should identify preferred listening hour and period - evening', async () => {
    const story = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 1',
        content: 'Test content',
        audioDuration: 300,
        playCount: 5,
      },
    });

    testStories.push(story);

    // Create sessions at different times, most at 8 PM (evening)
    const sessions = [
      new Date('2024-01-01T20:00:00Z'), // 8 PM
      new Date('2024-01-02T20:30:00Z'), // 8 PM
      new Date('2024-01-03T20:15:00Z'), // 8 PM
      new Date('2024-01-04T14:00:00Z'), // 2 PM (afternoon)
      new Date('2024-01-05T10:00:00Z'), // 10 AM (morning)
    ];

    for (const startedAt of sessions) {
      await prisma.listeningSession.create({
        data: {
          userId: testUser.id,
          storyId: story.id,
          startedAt,
          duration: 300,
        },
      });
    }

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.insights.preferredListeningHour).toBe(20);
    expect(data.data.insights.preferredListeningPeriod).toBe('evening');
  });

  it('should identify preferred listening period - morning', async () => {
    const story = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 1',
        content: 'Test content',
        audioDuration: 300,
        playCount: 3,
      },
    });

    testStories.push(story);

    // Create sessions in the morning (6-12)
    const sessions = [
      new Date('2024-01-01T08:00:00Z'), // 8 AM
      new Date('2024-01-02T09:00:00Z'), // 9 AM
      new Date('2024-01-03T09:30:00Z'), // 9 AM
    ];

    for (const startedAt of sessions) {
      await prisma.listeningSession.create({
        data: {
          userId: testUser.id,
          storyId: story.id,
          startedAt,
          duration: 300,
        },
      });
    }

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.insights.preferredListeningHour).toBe(9);
    expect(data.data.insights.preferredListeningPeriod).toBe('morning');
  });

  it('should identify preferred listening period - afternoon', async () => {
    const story = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 1',
        content: 'Test content',
        audioDuration: 300,
        playCount: 2,
      },
    });

    testStories.push(story);

    // Create sessions in the afternoon (12-17)
    const sessions = [
      new Date('2024-01-01T14:00:00Z'), // 2 PM
      new Date('2024-01-02T15:00:00Z'), // 3 PM
    ];

    for (const startedAt of sessions) {
      await prisma.listeningSession.create({
        data: {
          userId: testUser.id,
          storyId: story.id,
          startedAt,
          duration: 300,
        },
      });
    }

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.insights.preferredListeningPeriod).toBe('afternoon');
  });

  it('should identify preferred listening period - night', async () => {
    const story = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 1',
        content: 'Test content',
        audioDuration: 300,
        playCount: 2,
      },
    });

    testStories.push(story);

    // Create sessions at night (21-6)
    const sessions = [
      new Date('2024-01-01T22:00:00Z'), // 10 PM
      new Date('2024-01-02T23:00:00Z'), // 11 PM
    ];

    for (const startedAt of sessions) {
      await prisma.listeningSession.create({
        data: {
          userId: testUser.id,
          storyId: story.id,
          startedAt,
          duration: 300,
        },
      });
    }

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.insights.preferredListeningPeriod).toBe('night');
  });

  it('should identify most listened story correctly', async () => {
    const story1 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'The Magic Forest',
        content: 'Test content',
        audioDuration: 300,
        playCount: 15,
      },
    });

    const story2 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'The Dragon Adventure',
        content: 'Test content',
        audioDuration: 300,
        playCount: 8,
      },
    });

    testStories.push(story1, story2);

    // Create session (just need one to have listening data)
    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story1.id,
        startedAt: new Date('2024-01-01T20:00:00Z'),
        duration: 300,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.insights.mostListenedStory).toEqual({
      storyId: story1.id,
      title: 'The Magic Forest',
      playCount: 15,
    });
  });

  it('should handle stories without audio duration', async () => {
    const story1 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story Without Audio',
        content: 'Test content',
        // No audioDuration set
        playCount: 1,
      },
    });

    const story2 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story With Audio',
        content: 'Test content',
        audioDuration: 600,
        playCount: 1,
      },
    });

    testStories.push(story1, story2);

    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story1.id,
        startedAt: new Date('2024-01-01T20:00:00Z'),
        duration: 300,
      },
    });

    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story2.id,
        startedAt: new Date('2024-01-02T20:00:00Z'),
        duration: 600,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should only count story2 with audioDuration: 600 / 60 = 10 minutes
    expect(data.data.insights.averageStoryLengthMinutes).toBe(10);
    expect(data.data.insights.totalUniqueStoriesListened).toBe(2);
  });

  it('should handle single listening session correctly', async () => {
    const story = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Single Story',
        content: 'Test content',
        audioDuration: 480, // 8 minutes
        playCount: 1,
      },
    });

    testStories.push(story);

    await prisma.listeningSession.create({
      data: {
        userId: testUser.id,
        storyId: story.id,
        startedAt: new Date('2024-01-01T19:00:00Z'), // 7 PM
        duration: 480,
        completed: true,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.insights.averageStoryLengthMinutes).toBe(8);
    expect(data.data.insights.averageListensPerStory).toBe(1);
    expect(data.data.insights.preferredListeningHour).toBe(19);
    expect(data.data.insights.preferredListeningPeriod).toBe('evening');
    expect(data.data.insights.totalUniqueStoriesListened).toBe(1);
  });

  it('should handle multiple sessions for same story correctly', async () => {
    const story = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Repeated Story',
        content: 'Test content',
        audioDuration: 300,
        playCount: 5,
      },
    });

    testStories.push(story);

    // Create 5 sessions for the same story
    for (let i = 0; i < 5; i++) {
      await prisma.listeningSession.create({
        data: {
          userId: testUser.id,
          storyId: story.id,
          startedAt: new Date(`2024-01-0${i + 1}T20:00:00Z`),
          duration: 300,
        },
      });
    }

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // 5 sessions / 1 unique story = 5.0 average
    expect(data.data.insights.averageListensPerStory).toBe(5);
    expect(data.data.insights.totalUniqueStoriesListened).toBe(1);
  });

  it('should require authentication', async () => {
    // Mock requireAuth to return null (unauthenticated)
    const { requireAuth } = await import('@/lib/auth/session');
    vi.mocked(requireAuth).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');

    // Restore mock
    vi.mocked(requireAuth).mockResolvedValue(mockAuthUser);
  });

  it('should round average values to 2 decimal places', async () => {
    const story1 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 1',
        content: 'Test content',
        audioDuration: 333, // 5.55 minutes
        playCount: 3,
      },
    });

    const story2 = await prisma.story.create({
      data: {
        userId: testUser.id,
        heroId: testHero.id,
        title: 'Story 2',
        content: 'Test content',
        audioDuration: 666, // 11.1 minutes
        playCount: 2,
      },
    });

    testStories.push(story1, story2);

    // Create 3 sessions for story1, 2 for story2
    for (let i = 0; i < 3; i++) {
      await prisma.listeningSession.create({
        data: {
          userId: testUser.id,
          storyId: story1.id,
          startedAt: new Date(`2024-01-0${i + 1}T20:00:00Z`),
          duration: 333,
        },
      });
    }

    for (let i = 0; i < 2; i++) {
      await prisma.listeningSession.create({
        data: {
          userId: testUser.id,
          storyId: story2.id,
          startedAt: new Date(`2024-01-0${i + 4}T20:00:00Z`),
          duration: 666,
        },
      });
    }

    const req = new NextRequest('http://localhost:3000/api/v1/analytics/insights');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Average story length: (333 + 666) / 2 / 60 = 8.325 -> 8.32 minutes (toFixed rounds down)
    expect(data.data.insights.averageStoryLengthMinutes).toBe(8.32);
    // Average listens: 5 sessions / 2 stories = 2.5
    expect(data.data.insights.averageListensPerStory).toBe(2.5);
  });
});
