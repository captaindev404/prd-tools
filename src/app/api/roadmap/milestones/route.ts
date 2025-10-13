import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { canViewInternalRoadmap } from '@/lib/roadmap-helpers';

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  progress: number;
  stage: string;
  featureCount: number;
  feedbackCount: number;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed';
}

/**
 * GET /api/roadmap/milestones - Get milestone summary for roadmap items
 *
 * Query parameters:
 * - status?: 'on-track' | 'at-risk' | 'delayed' | 'completed'
 *
 * Features:
 * - Calculates milestone status based on progress and target date
 * - Groups roadmap items as milestones
 * - Returns aggregated metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const currentUser = await getCurrentUser();
    const statusFilter = searchParams.get('status') as Milestone['status'] | null;

    // Build where clause
    const where: any = {};

    // Handle visibility filtering
    if (!currentUser || !canViewInternalRoadmap(currentUser)) {
      where.visibility = 'public';
    }

    // Fetch roadmap items
    const items = await prisma.roadmapItem.findMany({
      where,
      orderBy: [{ targetDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        features: {
          select: { id: true },
        },
        feedbacks: {
          select: { id: true },
        },
      },
    });

    // Calculate milestone status
    const calculateStatus = (
      progress: number,
      targetDate: Date | null
    ): Milestone['status'] => {
      if (progress === 100) return 'completed';
      if (!targetDate) return 'on-track';

      const now = new Date();
      const daysUntilTarget = Math.floor(
        (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Completed
      if (progress === 100) return 'completed';

      // Delayed (past target date and not completed)
      if (daysUntilTarget < 0) return 'delayed';

      // At risk (less than 30 days remaining and progress < 75%)
      if (daysUntilTarget < 30 && progress < 75) return 'at-risk';

      // On track
      return 'on-track';
    };

    // Transform to milestones
    const milestones: Milestone[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      targetDate: item.targetDate?.toISOString() || null,
      progress: item.progress,
      stage: item.stage,
      featureCount: item.features.length,
      feedbackCount: item.feedbacks.length,
      status: calculateStatus(item.progress, item.targetDate),
    }));

    // Filter by status if provided
    const filteredMilestones = statusFilter
      ? milestones.filter((m) => m.status === statusFilter)
      : milestones;

    // Calculate summary statistics
    const summary = {
      total: milestones.length,
      completed: milestones.filter((m) => m.status === 'completed').length,
      onTrack: milestones.filter((m) => m.status === 'on-track').length,
      atRisk: milestones.filter((m) => m.status === 'at-risk').length,
      delayed: milestones.filter((m) => m.status === 'delayed').length,
    };

    const response = NextResponse.json({
      milestones: filteredMilestones,
      summary,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch milestones. Please try again later.',
      },
      { status: 500 }
    );
  }
}
