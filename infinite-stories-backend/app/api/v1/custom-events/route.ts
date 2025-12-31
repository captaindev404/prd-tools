import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';
import {
  successResponse,
  errorResponse,
  handleApiError,
  validateRequiredFields,
} from '@/lib/utils/api-response';

/**
 * GET /api/v1/custom-events
 * List all custom events for the authenticated user
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';

    // Build where clause
    const whereClause: any = {
      userId: user.id,
    };

    if (category) {
      whereClause.category = category;
    }

    if (favoritesOnly) {
      whereClause.isFavorite = true;
    }

    // Get custom events with pagination
    const customEvents = await prisma.customStoryEvent.findMany({
      where: whereClause,
      orderBy: [
        { isFavorite: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.customStoryEvent.count({
      where: whereClause,
    });

    return successResponse({
      customEvents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/custom-events
 * Create a new custom event
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();

    // Validate required fields
    const validation = validateRequiredFields(body, ['title', 'promptSeed']);
    if (!validation.valid) {
      return errorResponse(
        'ValidationError',
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Validate title length
    if (body.title.length < 1 || body.title.length > 200) {
      return errorResponse(
        'ValidationError',
        'Title must be between 1 and 200 characters',
        400
      );
    }

    // Validate promptSeed length
    if (body.promptSeed.length < 1 || body.promptSeed.length > 2000) {
      return errorResponse(
        'ValidationError',
        'Prompt seed must be between 1 and 2000 characters',
        400
      );
    }

    // Create the custom event
    const customEvent = await prisma.customStoryEvent.create({
      data: {
        title: body.title,
        description: body.description || '',
        promptSeed: body.promptSeed,
        category: body.category || 'general',
        ageRange: body.ageRange || null,
        tone: body.tone || 'cheerful',
        keywords: body.keywords || [],
        userId: user.id,
      },
    });

    return successResponse(customEvent, 'Custom event created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
