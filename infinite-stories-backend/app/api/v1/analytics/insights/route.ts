import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/utils/api-response';

/**
 * GET /api/v1/analytics/insights
 * Get listening insights for the authenticated user
 *
 * Returns:
 * - averageStoryLengthMinutes: Average duration of stories with listening sessions
 * - averageListensPerStory: Average number of listening sessions per unique story
 * - preferredListeningHour: Most common hour of day for starting listening sessions (0-23)
 * - preferredListeningPeriod: Time period classification (morning/afternoon/evening/night)
 * - mostListenedStory: Story with the highest play count
 * - totalUniqueStoriesListened: Count of unique stories with at least one listening session
 *
 * Response:
 * - 200: Insights retrieved successfully
 * - 401: Unauthorized
 * - 404: User not found
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authUser = await requireAuth();
    if (!authUser) {
      return errorResponse('Unauthorized', 'Authentication required', 401);
    }

    // Get full user from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      return errorResponse('NotFound', 'User not found', 404);
    }

    // Get all listening sessions for this user
    const sessions = await prisma.listeningSession.findMany({
      where: { userId: user.id },
      orderBy: {
        startedAt: 'desc',
      },
    });

    // If user has no listening data, return null/default values
    if (sessions.length === 0) {
      return successResponse({
        insights: {
          averageStoryLengthMinutes: null,
          averageListensPerStory: null,
          preferredListeningHour: null,
          preferredListeningPeriod: null,
          mostListenedStory: null,
          totalUniqueStoriesListened: 0,
        },
      });
    }

    // Get unique story IDs from sessions
    const uniqueStoryIds = Array.from(new Set(sessions.map((s) => s.storyId)));

    // Fetch all unique stories that have listening sessions
    const stories = await prisma.story.findMany({
      where: {
        id: { in: uniqueStoryIds },
      },
      select: {
        id: true,
        title: true,
        audioDuration: true,
        playCount: true,
      },
    });

    // Calculate average story length (in minutes)
    // Only include stories that have audioDuration
    const storiesWithDuration = stories.filter(
      (story) => story.audioDuration !== null && story.audioDuration !== undefined
    );

    const averageStoryLengthMinutes =
      storiesWithDuration.length > 0
        ? parseFloat(
            (
              storiesWithDuration.reduce((sum, story) => sum + (story.audioDuration || 0), 0) /
              storiesWithDuration.length /
              60
            ).toFixed(2)
          )
        : null;

    // Calculate average listens per story
    const totalUniqueStoriesListened = uniqueStoryIds.length;
    const averageListensPerStory =
      totalUniqueStoriesListened > 0
        ? parseFloat((sessions.length / totalUniqueStoriesListened).toFixed(2))
        : null;

    // Calculate preferred listening hour
    // Group sessions by hour of day (using UTC to avoid timezone issues)
    const hourCounts = new Map<number, number>();
    sessions.forEach((session) => {
      const hour = session.startedAt.getUTCHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    // Find hour with most sessions
    let preferredListeningHour: number | null = null;
    let maxCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        preferredListeningHour = hour;
      }
    });

    // Classify preferred listening period
    const preferredListeningPeriod = preferredListeningHour !== null
      ? classifyTimeOfDay(preferredListeningHour)
      : null;

    // Find most listened story
    // Get all stories the user has listened to
    const userStories = await prisma.story.findMany({
      where: {
        userId: user.id,
        playCount: { gt: 0 },
      },
      orderBy: {
        playCount: 'desc',
      },
      take: 1,
      select: {
        id: true,
        title: true,
        playCount: true,
      },
    });

    const mostListenedStory =
      userStories.length > 0
        ? {
            storyId: userStories[0].id,
            title: userStories[0].title,
            playCount: userStories[0].playCount,
          }
        : null;

    return successResponse({
      insights: {
        averageStoryLengthMinutes,
        averageListensPerStory,
        preferredListeningHour,
        preferredListeningPeriod,
        mostListenedStory,
        totalUniqueStoriesListened,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Classify hour of day into a time period
 * - morning: 6-12
 * - afternoon: 12-17
 * - evening: 17-21
 * - night: 21-6
 */
function classifyTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 6 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'evening';
  } else {
    return 'night';
  }
}
