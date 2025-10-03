import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import {
  canCreateRoadmap,
  canViewInternalRoadmap,
  parseJsonField,
  isValidProgress,
} from '@/lib/roadmap-helpers';
import type { CreateRoadmapInput } from '@/types/roadmap';
import type { RoadmapStage, Visibility } from '@prisma/client';

/**
 * POST /api/roadmap - Create new roadmap item
 *
 * Request body:
 * - title: string (required, max 200 chars)
 * - description?: string
 * - stage: RoadmapStage (required)
 * - targetDate?: string (ISO date)
 * - progress?: number (0-100)
 * - visibility?: 'public' | 'internal'
 * - featureIds?: string[]
 * - feedbackIds?: string[]
 * - jiraTickets?: string[]
 * - figmaLinks?: string[]
 * - successCriteria?: string[]
 * - guardrails?: string[]
 *
 * Features:
 * - PM/PO/ADMIN only
 * - Links to features and feedback
 * - Auto-creates event log entry
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to create roadmap items',
        },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canCreateRoadmap(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to create roadmap items',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body: CreateRoadmapInput = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (!body.title || typeof body.title !== 'string') {
      errors.push({ field: 'title', message: 'Title is required' });
    } else if (body.title.length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    } else if (body.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
    }

    if (!body.stage) {
      errors.push({ field: 'stage', message: 'Stage is required' });
    } else if (!['now', 'next', 'later', 'under_consideration'].includes(body.stage)) {
      errors.push({ field: 'stage', message: 'Invalid stage value' });
    }

    if (body.progress !== undefined) {
      if (typeof body.progress !== 'number' || !isValidProgress(body.progress)) {
        errors.push({
          field: 'progress',
          message: 'Progress must be a number between 0 and 100',
        });
      }
    }

    if (body.targetDate) {
      const targetDate = new Date(body.targetDate);
      if (isNaN(targetDate.getTime())) {
        errors.push({ field: 'targetDate', message: 'Invalid target date format' });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please check your input and try again',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Verify linked features exist
    if (body.featureIds && body.featureIds.length > 0) {
      const features = await prisma.feature.findMany({
        where: { id: { in: body.featureIds } },
        select: { id: true },
      });

      if (features.length !== body.featureIds.length) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'One or more feature IDs are invalid',
          },
          { status: 400 }
        );
      }
    }

    // Verify linked feedback items exist
    if (body.feedbackIds && body.feedbackIds.length > 0) {
      const feedbacks = await prisma.feedback.findMany({
        where: { id: { in: body.feedbackIds } },
        select: { id: true },
      });

      if (feedbacks.length !== body.feedbackIds.length) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'One or more feedback IDs are invalid',
          },
          { status: 400 }
        );
      }
    }

    // Create roadmap item
    const roadmapItem = await prisma.roadmapItem.create({
      data: {
        id: `rmp_${ulid()}`,
        title: body.title,
        description: body.description || null,
        stage: body.stage as RoadmapStage,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        progress: body.progress ?? 0,
        visibility: (body.visibility as Visibility) || 'public',
        createdById: user.id,
        featureIds: JSON.stringify(body.featureIds || []),
        feedbackIds: JSON.stringify(body.feedbackIds || []),
        jiraTickets: JSON.stringify(body.jiraTickets || []),
        figmaLinks: JSON.stringify(body.figmaLinks || []),
        commsCadence: body.commsCadence || null,
        commsChannels: JSON.stringify(body.commsChannels || []),
        commsAudience: JSON.stringify(body.commsAudience || {}),
        successCriteria: JSON.stringify(body.successCriteria || []),
        guardrails: JSON.stringify(body.guardrails || []),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Connect features (many-to-many)
    if (body.featureIds && body.featureIds.length > 0) {
      await prisma.roadmapItem.update({
        where: { id: roadmapItem.id },
        data: {
          features: {
            connect: body.featureIds.map((id) => ({ id })),
          },
        },
      });
    }

    // Connect feedback items (many-to-many)
    if (body.feedbackIds && body.feedbackIds.length > 0) {
      await prisma.roadmapItem.update({
        where: { id: roadmapItem.id },
        data: {
          feedbacks: {
            connect: body.feedbackIds.map((id) => ({ id })),
          },
        },
      });
    }

    // Log event
    await prisma.event.create({
      data: {
        type: 'roadmap.created',
        userId: user.id,
        payload: JSON.stringify({
          roadmapId: roadmapItem.id,
          title: roadmapItem.title,
          stage: roadmapItem.stage,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        data: roadmapItem,
        message: 'Roadmap item created successfully',
      },
      { status: 201 }
    );

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error creating roadmap item:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create roadmap item. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/roadmap - List roadmap items with pagination
 *
 * Query parameters:
 * - stage?: RoadmapStage (filter by stage)
 * - visibility?: 'public' | 'internal' (filter by visibility, respects user role)
 * - search?: string (search in title and description)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 * - sortBy?: 'targetDate' | 'createdAt' (default: 'targetDate')
 * - sortOrder?: 'asc' | 'desc' (default: 'asc' for targetDate, 'desc' for createdAt)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);

    // Get current user (optional for public roadmap)
    const currentUser = await getCurrentUser();

    // Parse query parameters
    const stage = searchParams.get('stage') as RoadmapStage | null;
    const visibility = searchParams.get('visibility') as Visibility | null;
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = (searchParams.get('sortBy') || 'targetDate') as 'targetDate' | 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;

    // Determine sort order based on sortBy
    const order =
      sortOrder || (sortBy === 'targetDate' ? 'asc' : 'desc');

    // Build where clause
    const where: any = {};

    if (stage) {
      where.stage = stage;
    }

    // Handle visibility filtering based on user role
    if (visibility) {
      where.visibility = visibility;
    } else {
      // If no visibility specified, filter based on user permissions
      if (!currentUser || !canViewInternalRoadmap(currentUser)) {
        where.visibility = 'public';
      }
      // If user can view internal, show all (no filter)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch roadmap items with owner details and counts
    const [items, total] = await Promise.all([
      prisma.roadmapItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          features: {
            select: {
              id: true,
              title: true,
              area: true,
              status: true,
            },
          },
          feedbacks: {
            select: {
              id: true,
              title: true,
              state: true,
            },
          },
        },
      }),
      prisma.roadmapItem.count({ where }),
    ]);

    // Transform response
    const transformedItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      stage: item.stage,
      targetDate: item.targetDate?.toISOString() || null,
      progress: item.progress,
      visibility: item.visibility,
      createdBy: item.createdBy,
      featureCount: item.features.length,
      feedbackCount: item.feedbacks.length,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    const response = NextResponse.json({
      items: transformedItems,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error fetching roadmap items:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch roadmap items. Please try again later.',
      },
      { status: 500 }
    );
  }
}
