import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { canViewInternalRoadmap, parseJsonField } from '@/lib/roadmap-helpers';
import type { RoadmapStage } from '@prisma/client';

export interface TimelineItem {
  id: string;
  title: string;
  stage: RoadmapStage;
  startDate: string | null;
  targetDate: string | null;
  progress: number;
  visibility: string;
  features: { id: string; title: string }[];
  createdBy: { id: string; displayName: string | null };
}

export interface TimelineResponse {
  items: TimelineItem[];
  stages: {
    now: TimelineItem[];
    next: TimelineItem[];
    later: TimelineItem[];
    under_consideration: TimelineItem[];
  };
}

/**
 * GET /api/roadmap/timeline - Get roadmap items formatted for timeline/Gantt view
 *
 * Query parameters:
 * - stage?: RoadmapStage (filter by stage)
 * - includeCompleted?: boolean (include 100% progress items)
 *
 * Features:
 * - Returns items with date ranges for Gantt visualization
 * - Groups by stage for timeline organization
 * - Respects visibility permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const currentUser = await getCurrentUser();

    // Parse query parameters
    const stage = searchParams.get('stage') as RoadmapStage | null;
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    // Build where clause
    const where: any = {};

    if (stage) {
      where.stage = stage;
    }

    // Handle visibility filtering
    if (!currentUser || !canViewInternalRoadmap(currentUser)) {
      where.visibility = 'public';
    }

    // Exclude completed items unless explicitly requested
    if (!includeCompleted) {
      where.progress = { lt: 100 };
    }

    // Fetch roadmap items
    const items = await prisma.roadmapItem.findMany({
      where,
      orderBy: [{ targetDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
        features: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Transform items for timeline view
    const timelineItems: TimelineItem[] = items.map((item) => {
      // Calculate start date (estimate based on stage and target date)
      let startDate: string | null = null;
      if (item.targetDate) {
        const targetDate = new Date(item.targetDate);
        const durationDays = item.stage === 'now' ? 30 : item.stage === 'next' ? 60 : 90;
        const startDateObj = new Date(targetDate);
        startDateObj.setDate(startDateObj.getDate() - durationDays);
        startDate = startDateObj.toISOString();
      }

      return {
        id: item.id,
        title: item.title,
        stage: item.stage,
        startDate,
        targetDate: item.targetDate?.toISOString() || null,
        progress: item.progress,
        visibility: item.visibility,
        features: item.features,
        createdBy: item.createdBy,
      };
    });

    // Group by stage
    const stages = {
      now: timelineItems.filter((item) => item.stage === 'now'),
      next: timelineItems.filter((item) => item.stage === 'next'),
      later: timelineItems.filter((item) => item.stage === 'later'),
      under_consideration: timelineItems.filter((item) => item.stage === 'under_consideration'),
    };

    const response = NextResponse.json({
      items: timelineItems,
      stages,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error fetching timeline data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch timeline data. Please try again later.',
      },
      { status: 500 }
    );
  }
}
