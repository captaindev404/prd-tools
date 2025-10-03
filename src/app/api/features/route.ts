import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canCreateFeature } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { handleApiError, ApiErrors } from '@/lib/api-errors';
import type { CreateFeatureInput } from '@/types/feature';
import type { ProductArea, FeatureStatus } from '@prisma/client';

/**
 * GET /api/features - List all features with filtering and pagination
 *
 * Query parameters:
 * - area?: ProductArea (filter by product area)
 * - status?: FeatureStatus (filter by status)
 * - search?: string (search in title and description)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 * - sortBy?: 'createdAt' | 'updatedAt' | 'title' (default: 'createdAt')
 * - sortOrder?: 'asc' | 'desc' (default: 'desc')
 *
 * Returns:
 * - List of features with feedback counts
 * - Pagination metadata
 */
export async function GET(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const area = searchParams.get('area') as ProductArea | null;
    const status = searchParams.get('status') as FeatureStatus | null;
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'updatedAt' | 'title';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: any = {};

    if (area) {
      where.area = area;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch features with counts
    const [features, total] = await Promise.all([
      prisma.feature.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          _count: {
            select: {
              feedbacks: true,
              roadmapItems: true,
            },
          },
        },
      }),
      prisma.feature.count({ where }),
    ]);

    // Transform response to include parsed tags
    const featuresWithParsedTags = features.map((feature) => ({
      ...feature,
      tags: JSON.parse(feature.tags || '[]'),
      feedbackCount: feature._count.feedbacks,
      roadmapItemCount: feature._count.roadmapItems,
    }));

    const response = NextResponse.json({
      items: featuresWithParsedTags,
      total,
      page,
      limit,
      hasMore: skip + features.length < total,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/features - Create new feature
 *
 * Authorization: PM, PO, or ADMIN role required
 *
 * Request body:
 * - title: string (required, 3-100 chars)
 * - description?: string (optional, max 2000 chars)
 * - area: ProductArea (required)
 * - status?: FeatureStatus (optional, default: 'idea')
 *
 * Returns:
 * - Created feature with details
 */
export async function POST(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw ApiErrors.unauthorized('You must be logged in to create features');
    }

    // Check authorization
    if (!canCreateFeature(user)) {
      throw ApiErrors.forbidden('Only PM, PO, or ADMIN roles can create features');
    }

    // Parse and validate request body
    let body: CreateFeatureInput;
    try {
      body = await request.json();
    } catch (error) {
      throw ApiErrors.badRequest('Invalid JSON in request body');
    }

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (!body.title || typeof body.title !== 'string') {
      errors.push({ field: 'title', message: 'Title is required' });
    } else if (body.title.length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    } else if (body.title.length > 100) {
      errors.push({ field: 'title', message: 'Title must not exceed 100 characters' });
    }

    if (!body.area) {
      errors.push({ field: 'area', message: 'Product area is required' });
    } else if (!['Reservations', 'CheckIn', 'Payments', 'Housekeeping', 'Backoffice'].includes(body.area)) {
      errors.push({ field: 'area', message: 'Invalid product area' });
    }

    if (body.description && typeof body.description === 'string' && body.description.length > 2000) {
      errors.push({ field: 'description', message: 'Description must not exceed 2000 characters' });
    }

    if (body.status) {
      const validStatuses = ['idea', 'discovery', 'shaping', 'in_progress', 'released', 'generally_available', 'deprecated'];
      if (!validStatuses.includes(body.status)) {
        errors.push({ field: 'status', message: 'Invalid feature status' });
      }
    }

    if (errors.length > 0) {
      throw ApiErrors.validationError(errors, 'Please check your input and try again');
    }

    // Generate feature ID: feat-{area}-{random}
    const areaSlug = body.area.toLowerCase().replace(/\s+/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const featureId = `feat-${areaSlug}-${randomSuffix}`;

    // Create feature
    const feature = await prisma.feature.create({
      data: {
        id: featureId,
        title: body.title,
        description: body.description || null,
        area: body.area,
        status: body.status || 'idea',
        tags: '[]',
      },
      include: {
        _count: {
          select: {
            feedbacks: true,
            roadmapItems: true,
          },
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'feature.created',
        userId: user.id,
        payload: JSON.stringify({
          featureId: feature.id,
          title: feature.title,
          area: feature.area,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          ...feature,
          tags: JSON.parse(feature.tags || '[]'),
          feedbackCount: feature._count.feedbacks,
          roadmapItemCount: feature._count.roadmapItems,
        },
        message: 'Feature created successfully',
      },
      { status: 201 }
    );

    return addRateLimitHeaders(response, request);
  } catch (error) {
    return handleApiError(error);
  }
}
