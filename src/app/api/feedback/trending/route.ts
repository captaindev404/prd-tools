import { NextRequest, NextResponse } from 'next/server';
import { getTrendingFeedback, getTrendingFeedbackByArea } from '@/lib/trending';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { handleApiError } from '@/lib/api-errors';
import type { ProductArea } from '@prisma/client';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/feedback/trending - Get trending feedback
 *
 * Query parameters:
 * - maxAgeInDays?: number (default: 14, max: 30)
 * - limit?: number (default: 10, max: 50)
 * - minVotes?: number (default: 1)
 * - area?: ProductArea (optional filter by product area)
 *
 * Returns trending feedback items sorted by trending score.
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);

    // Parse query parameters with validation
    const maxAgeInDays = Math.min(
      30,
      Math.max(1, parseInt(searchParams.get('maxAgeInDays') || '14'))
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '10'))
    );
    const minVotes = Math.max(0, parseInt(searchParams.get('minVotes') || '1'));
    const area = searchParams.get('area') as ProductArea | null;

    // Fetch trending feedback
    let trendingItems;

    if (area) {
      // Filter by product area
      trendingItems = await getTrendingFeedbackByArea(area, {
        maxAgeInDays,
        limit,
        minVotes,
      });
    } else {
      // Get all trending feedback
      trendingItems = await getTrendingFeedback({
        maxAgeInDays,
        limit,
        minVotes,
      });
    }

    const response = NextResponse.json({
      items: trendingItems,
      total: trendingItems.length,
      maxAgeInDays,
      limit,
      minVotes,
      area: area || null,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    return handleApiError(error);
  }
}
