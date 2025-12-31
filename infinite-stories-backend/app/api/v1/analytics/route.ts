import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/utils/api-response';

/**
 * GET /api/v1/analytics
 * Get aggregated analytics for the authenticated user
 *
 * Response:
 * - 200: Analytics retrieved successfully
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

    // Get or create analytics cache for this user
    let analyticsCache = await prisma.userAnalyticsCache.findUnique({
      where: { userId: user.id },
    });

    // If no cache exists, create one with default values
    if (!analyticsCache) {
      analyticsCache = await prisma.userAnalyticsCache.create({
        data: {
          userId: user.id,
        },
      });
    }

    return successResponse({
      totalStoriesListened: analyticsCache.totalStoriesListened,
      totalListeningTimeSeconds: analyticsCache.totalListeningTimeSeconds,
      currentStreak: analyticsCache.currentStreak,
      longestStreak: analyticsCache.longestStreak,
      lastListeningDate: analyticsCache.lastListeningDate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
