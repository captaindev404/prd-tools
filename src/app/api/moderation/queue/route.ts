import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

/**
 * GET /api/moderation/queue - List feedback items needing moderation review
 *
 * Query parameters:
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 50)
 * - filter?: 'all' | 'with_pii' | 'approaching_sla' (default: 'all')
 * - minScore?: number (0.0-1.0, filter by minimum score threshold)
 *
 * Returns feedback items that need manual review, sorted by oldest first (FIFO for SLA)
 * Only accessible to users with MODERATOR role
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    if (user.role !== 'MODERATOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You must have MODERATOR role to access the moderation queue',
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'with_pii' | 'approaching_sla';
    const minScore = parseFloat(searchParams.get('minScore') || '0');

    // Build where clause
    const where: any = {
      OR: [
        { moderationStatus: 'pending_review' },
        { needsReview: true },
      ],
    };

    // Apply filters
    if (filter === 'with_pii') {
      where.hasPii = true;
    }

    if (filter === 'approaching_sla') {
      // Items older than 24 hours (approaching 48-hour SLA)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      where.createdAt = {
        lte: twentyFourHoursAgo,
      };
    }

    // Apply minimum score filter if provided
    if (minScore > 0) {
      where.OR = [
        { toxicityScore: { gte: minScore } },
        { spamScore: { gte: minScore } },
        { offTopicScore: { gte: minScore } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch pending items with author information
    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'asc', // FIFO - oldest first for SLA compliance
        },
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              email: true,
              role: true,
            },
          },
          feature: {
            select: {
              id: true,
              title: true,
              area: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    // Calculate time metrics for each item
    const now = Date.now();
    const itemsWithMetrics = items.map((item) => {
      const submittedAt = item.createdAt.getTime();
      const hoursOld = Math.floor((now - submittedAt) / (1000 * 60 * 60));
      const minutesOld = Math.floor((now - submittedAt) / (1000 * 60));
      const slaHoursRemaining = Math.max(0, 48 - hoursOld);
      const approachingSla = hoursOld >= 24;

      // Parse moderation signals
      let signals: string[] = [];
      try {
        signals = JSON.parse(item.moderationSignals || '[]');
      } catch (e) {
        signals = [];
      }

      return {
        ...item,
        moderationSignals: signals,
        metrics: {
          hoursOld,
          minutesOld,
          slaHoursRemaining,
          approachingSla,
        },
      };
    });

    // Calculate SLA statistics
    const slaStats = {
      total: total,
      approachingSla: itemsWithMetrics.filter((item) => item.metrics.approachingSla).length,
      withPii: items.filter((item) => item.hasPii).length,
      averageAge: items.length > 0
        ? Math.floor(
            items.reduce((sum, item) => {
              const hoursOld = (now - item.createdAt.getTime()) / (1000 * 60 * 60);
              return sum + hoursOld;
            }, 0) / items.length
          )
        : 0,
    };

    return NextResponse.json({
      items: itemsWithMetrics,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
      stats: slaStats,
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch moderation queue. Please try again later.',
      },
      { status: 500 }
    );
  }
}
