import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/utils/api-response';

/**
 * Date range configuration for activity queries
 */
const RANGE_CONFIG = {
  week: { days: 7, label: 'Week' },
  month: { days: 30, label: 'Month' },
  year: { days: 365, label: 'Year' },
} as const;

type RangeType = keyof typeof RANGE_CONFIG;

/**
 * Activity data point for a single day
 */
interface ActivityDataPoint {
  date: string; // ISO date format: YYYY-MM-DD
  minutes: number; // Total listening minutes for the day
}

/**
 * GET /api/v1/analytics/activity
 * Get daily activity data (listening minutes per day) for the authenticated user
 *
 * Query parameters:
 * - range: string (optional) - Time range: "week", "month", or "year" (default: "week")
 * - timezone: string (optional) - IANA timezone (e.g., "America/New_York", default: "UTC")
 *
 * Response:
 * - 200: Activity data retrieved successfully
 * - 400: Invalid range parameter
 * - 401: Unauthorized
 * - 404: User not found
 *
 * Returns:
 * Array of { date: "YYYY-MM-DD", minutes: number } objects
 * - Missing days are filled with 0 minutes
 * - Ordered by date ascending (oldest to newest)
 * - Aggregates all listening sessions within each day in user's timezone
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
    const range = (searchParams.get('range') || 'week') as RangeType;
    const timezone = searchParams.get('timezone') || 'UTC';

    // Validate range parameter
    if (!RANGE_CONFIG[range]) {
      return errorResponse(
        'ValidationError',
        `Invalid range parameter. Must be one of: ${Object.keys(RANGE_CONFIG).join(', ')}`,
        400
      );
    }

    // Validate timezone (basic check - IANA timezone should not contain spaces)
    if (timezone.includes(' ') || timezone.length > 50) {
      return errorResponse(
        'ValidationError',
        'Invalid timezone parameter. Must be a valid IANA timezone identifier',
        400
      );
    }

    // Calculate date range
    const daysToFetch = RANGE_CONFIG[range].days;
    const endDate = new Date(); // Today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch + 1); // Include today

    // Set time boundaries to cover full days in UTC
    // We'll aggregate by date in the application layer using the timezone
    const startDateTime = new Date(startDate);
    startDateTime.setUTCHours(0, 0, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setUTCHours(23, 59, 59, 999);

    // Fetch all listening sessions in the date range
    const sessions = await prisma.listeningSession.findMany({
      where: {
        userId: user.id,
        startedAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
        // Only include sessions with a duration (completed or partial)
        duration: {
          not: null,
        },
      },
      select: {
        startedAt: true,
        duration: true,
      },
      orderBy: {
        startedAt: 'asc',
      },
    });

    // Aggregate sessions by date in the user's timezone
    const activityByDate = new Map<string, number>();

    for (const session of sessions) {
      if (session.duration === null) continue;

      // Convert startedAt to user's timezone and extract date
      const dateInTimezone = convertToTimezone(session.startedAt, timezone);
      const dateKey = dateInTimezone.split('T')[0]; // YYYY-MM-DD

      // Aggregate duration in seconds, then convert to minutes
      const currentSeconds = activityByDate.get(dateKey) || 0;
      activityByDate.set(dateKey, currentSeconds + session.duration);
    }

    // Generate complete date range with missing days filled with 0
    const activityData: ActivityDataPoint[] = [];

    for (let i = 0; i < daysToFetch; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);

      // Convert to user's timezone for consistency
      const dateInTimezone = convertToTimezone(currentDate, timezone);
      const dateKey = dateInTimezone.split('T')[0]; // YYYY-MM-DD

      const totalSeconds = activityByDate.get(dateKey) || 0;
      const totalMinutes = Math.round(totalSeconds / 60);

      activityData.push({
        date: dateKey,
        minutes: totalMinutes,
      });
    }

    // Sort by date ascending (should already be sorted, but ensure)
    activityData.sort((a, b) => a.date.localeCompare(b.date));

    return successResponse({
      range,
      timezone,
      startDate: activityData[0]?.date || null,
      endDate: activityData[activityData.length - 1]?.date || null,
      activity: activityData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Convert a Date to ISO string in the specified timezone
 * Returns date in format: YYYY-MM-DDTHH:mm:ss.sssZ
 *
 * Note: This is a simplified implementation. For production, consider using
 * a library like date-fns-tz or luxon for robust timezone handling.
 *
 * This implementation uses Intl.DateTimeFormat for basic timezone conversion.
 */
function convertToTimezone(date: Date, timezone: string): string {
  try {
    // Use Intl.DateTimeFormat to get date parts in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const dateParts: Record<string, string> = {};

    for (const part of parts) {
      if (part.type !== 'literal') {
        dateParts[part.type] = part.value;
      }
    }

    // Construct ISO date string (YYYY-MM-DDTHH:mm:ss)
    const isoDate = `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}`;

    return isoDate;
  } catch (error) {
    // Fallback to UTC if timezone conversion fails
    console.warn(`Timezone conversion failed for ${timezone}, using UTC:`, error);
    return date.toISOString();
  }
}
