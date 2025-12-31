import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/utils/api-response';

/**
 * Interface for analytics summary response
 */
interface AnalyticsSummary {
  totalStoriesListened: number;
  totalListeningTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  favoriteStoriesCount: number;
  lastListeningDate: string | null; // ISO8601 date string
}

/**
 * Calculate streak values based on listening sessions and timezone
 *
 * Algorithm:
 * 1. Get all unique listening dates in user's timezone
 * 2. Sort dates in descending order
 * 3. Calculate current streak: count consecutive days from most recent date
 * 4. Calculate longest streak: find maximum consecutive day sequence
 *
 * @param userId - User ID
 * @param timezone - IANA timezone (e.g., "America/New_York", "Europe/Paris")
 * @returns Object with currentStreak, longestStreak, and lastListeningDate
 */
async function calculateStreaks(
  userId: string,
  timezone: string
): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastListeningDate: Date | null;
}> {
  // Validate timezone
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  // Get all completed sessions ordered by date
  const sessions = await prisma.listeningSession.findMany({
    where: {
      userId,
      completed: true,
    },
    select: {
      startedAt: true,
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  if (sessions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastListeningDate: null,
    };
  }

  // Convert timestamps to dates in user's timezone and get unique dates
  const uniqueDates = new Set<string>();
  for (const session of sessions) {
    const dateStr = formatDateInTimezone(session.startedAt, timezone);
    uniqueDates.add(dateStr);
  }

  // Sort dates in descending order (most recent first)
  const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));

  // Get today's date in user's timezone
  const today = formatDateInTimezone(new Date(), timezone);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = today;

  for (const date of sortedDates) {
    if (date === checkDate) {
      currentStreak++;
      // Move to previous day
      checkDate = getPreviousDate(checkDate, timezone);
    } else if (date < checkDate) {
      // Gap found, streak broken
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const currentDate = sortedDates[i];
    const nextDate = sortedDates[i + 1];
    const expectedPrevDate = getPreviousDate(currentDate, timezone);

    if (nextDate === expectedPrevDate) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  // Account for final streak
  longestStreak = Math.max(longestStreak, tempStreak);

  // Parse last listening date
  const lastListeningDate = new Date(sortedDates[0] + 'T00:00:00Z');

  return {
    currentStreak,
    longestStreak,
    lastListeningDate,
  };
}

/**
 * Validate IANA timezone identifier
 */
function isValidTimezone(timezone: string): boolean {
  try {
    // Try to create a date formatter with the timezone
    // If timezone is invalid, this will throw
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format date in specific timezone as YYYY-MM-DD
 */
function formatDateInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // en-CA locale formats as YYYY-MM-DD
  return formatter.format(date);
}

/**
 * Get previous date string (YYYY-MM-DD format)
 */
function getPreviousDate(dateStr: string, timezone: string): string {
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid DST issues
  date.setDate(date.getDate() - 1);
  return formatDateInTimezone(date, timezone);
}

/**
 * GET /api/v1/analytics/summary
 * Get analytics summary for the authenticated user
 *
 * Query parameters:
 * - timezone: string (optional) - IANA timezone identifier (default: UTC)
 *   Examples: "America/New_York", "Europe/Paris", "Asia/Tokyo", "UTC"
 * - refresh: boolean (optional) - Force recomputation from sessions (default: false)
 *   Use this when pulling to refresh to ensure data is up-to-date
 *
 * Response fields:
 * - totalStoriesListened: number - Total unique stories listened to completion
 * - totalListeningTimeMinutes: number - Total listening time in minutes
 * - currentStreak: number - Consecutive days with listening activity (timezone-aware)
 * - longestStreak: number - Longest streak ever achieved (timezone-aware)
 * - favoriteStoriesCount: number - Number of stories marked as favorite
 * - lastListeningDate: string | null - Last date user listened to a story (ISO8601 date)
 *
 * Implementation notes:
 * - Uses UserAnalyticsCache for pre-computed values where available
 * - Falls back to real-time queries if cache is empty or refresh=true
 * - Streak calculation respects user timezone (crucial for international users)
 * - Favorites count queries Story table directly (not cached)
 *
 * Response:
 * - 200: Summary retrieved successfully
 * - 400: Invalid timezone parameter
 * - 401: Unauthorized
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const timezone = searchParams.get('timezone') || 'UTC';
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Validate timezone
    if (!isValidTimezone(timezone)) {
      return errorResponse(
        'ValidationError',
        `Invalid timezone: ${timezone}. Must be a valid IANA timezone identifier (e.g., "America/New_York", "Europe/Paris", "UTC")`,
        400
      );
    }

    // Get or create analytics cache
    let cache = await prisma.userAnalyticsCache.findUnique({
      where: { userId: user.id },
    });

    // If no cache exists, create one with default values
    if (!cache) {
      cache = await prisma.userAnalyticsCache.create({
        data: {
          userId: user.id,
          totalStoriesListened: 0,
          totalListeningTimeSeconds: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastListeningDate: null,
        },
      });
    }

    // Calculate streaks with timezone support
    // Note: We always recalculate streaks in real-time to ensure timezone accuracy
    // The cache values are used as a fallback and for the other metrics
    const streakData = await calculateStreaks(user.id, timezone);

    // Get favorites count (always real-time, not cached)
    const favoriteStoriesCount = await prisma.story.count({
      where: {
        userId: user.id,
        isFavorite: true,
      },
    });

    // Compute real-time values if cache is empty or force refresh requested
    let totalStoriesListened = cache.totalStoriesListened;
    let totalListeningTimeSeconds = cache.totalListeningTimeSeconds;

    const shouldRecompute = forceRefresh || (totalStoriesListened === 0 && totalListeningTimeSeconds === 0);

    if (shouldRecompute) {
      // Compute from sessions
      const sessionsData = await prisma.listeningSession.groupBy({
        by: ['storyId'],
        where: {
          userId: user.id,
          completed: true,
        },
        _count: {
          storyId: true,
        },
      });

      totalStoriesListened = sessionsData.length;

      // Sum total listening time
      const durationSum = await prisma.listeningSession.aggregate({
        where: {
          userId: user.id,
          completed: true,
          duration: {
            not: null,
          },
        },
        _sum: {
          duration: true,
        },
      });

      totalListeningTimeSeconds = durationSum._sum.duration || 0;

      // Update cache for future requests
      await prisma.userAnalyticsCache.update({
        where: { userId: user.id },
        data: {
          totalStoriesListened,
          totalListeningTimeSeconds,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          lastListeningDate: streakData.lastListeningDate,
        },
      });
    }

    // Convert listening time to minutes (rounded)
    const totalListeningTimeMinutes = Math.round(totalListeningTimeSeconds / 60);

    // Format last listening date as ISO8601 date string (YYYY-MM-DD)
    const lastListeningDate = streakData.lastListeningDate
      ? formatDateInTimezone(streakData.lastListeningDate, timezone)
      : null;

    // Build response
    const summary: AnalyticsSummary = {
      totalStoriesListened,
      totalListeningTimeMinutes,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      favoriteStoriesCount,
      lastListeningDate,
    };

    return successResponse(summary, 'Analytics summary retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
