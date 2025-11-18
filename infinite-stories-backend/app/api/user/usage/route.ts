import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';
import { getRateLimitStatus } from '@/lib/rate-limit/db-rate-limiter';

/**
 * GET /api/user/usage
 * Get user's API usage statistics, costs, and rate limits
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authUser = await requireAuth();
    if (!authUser) {
      return errorResponse('Unauthorized', 'Authentication required', 401);
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    // Get API usage records
    const usageRecords = await prisma.apiUsage.findMany({
      where: {
        userId: authUser.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics by operation
    const statsByOperation: Record<string, any> = {};

    for (const record of usageRecords) {
      if (!statsByOperation[record.operation]) {
        statsByOperation[record.operation] = {
          operation: record.operation,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalCost: 0,
          totalTokens: 0,
          averageDuration: 0,
        };
      }

      const stats = statsByOperation[record.operation];
      stats.totalRequests++;

      if (record.success) {
        stats.successfulRequests++;
      } else {
        stats.failedRequests++;
      }

      if (record.estimatedCost) {
        stats.totalCost += record.estimatedCost;
      }

      if (record.tokensUsed) {
        stats.totalTokens += record.tokensUsed;
      }

      if (record.requestDuration) {
        // Running average
        stats.averageDuration =
          (stats.averageDuration * (stats.totalRequests - 1) + record.requestDuration) /
          stats.totalRequests;
      }
    }

    // Calculate overall totals
    const totalRequests = usageRecords.length;
    const successfulRequests = usageRecords.filter((r) => r.success).length;
    const failedRequests = usageRecords.filter((r) => !r.success).length;
    const totalCost = usageRecords.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
    const totalTokens = usageRecords.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);

    // Get rate limit status
    const rateLimits = await getRateLimitStatus(authUser.id);

    // Get user stats
    const userStats = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        totalStoriesGenerated: true,
        totalAudioGenerated: true,
        totalIllustrationsGenerated: true,
        lastStoryGeneratedAt: true,
      },
    });

    return successResponse({
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
        totalTokens,
      },
      byOperation: Object.values(statsByOperation),
      rateLimits,
      userStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
