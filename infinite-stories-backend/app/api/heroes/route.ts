import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/clerk';
import {
  successResponse,
  errorResponse,
  handleApiError,
  validateRequiredFields,
} from '@/lib/utils/api-response';

/**
 * GET /api/heroes
 * List all heroes for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const includeStories = searchParams.get('includeStories') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get heroes with optional pagination
    const heroes = await prisma.hero.findMany({
      where: {
        userId: user.id,
      },
      include: {
        visualProfile: true,
        stories: includeStories
          ? {
              orderBy: { createdAt: 'desc' },
              take: 5,
            }
          : false,
        _count: {
          select: { stories: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.hero.count({
      where: {
        userId: user.id,
      },
    });

    return successResponse({
      heroes,
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
 * POST /api/heroes
 * Create a new hero
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await req.json();

    // Validate required fields
    const validation = validateRequiredFields(body, ['name', 'age', 'traits']);
    if (!validation.valid) {
      return errorResponse(
        'ValidationError',
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Validate age
    if (body.age < 3 || body.age > 12) {
      return errorResponse(
        'ValidationError',
        'Age must be between 3 and 12',
        400
      );
    }

    // Validate traits is an array
    if (!Array.isArray(body.traits) || body.traits.length === 0) {
      return errorResponse(
        'ValidationError',
        'Traits must be a non-empty array',
        400
      );
    }

    // Create the hero
    const hero = await prisma.hero.create({
      data: {
        name: body.name,
        age: body.age,
        traits: body.traits,
        userId: user.id,
        hairColor: body.hairColor || null,
        eyeColor: body.eyeColor || null,
        skinTone: body.skinTone || null,
        height: body.height || null,
        specialAbilities: body.specialAbilities || null,
        avatarUrl: body.avatarUrl || null,
        avatarPrompt: body.avatarPrompt || null,
        avatarGenerationId: body.avatarGenerationId || null,
      },
      include: {
        visualProfile: true,
      },
    });

    return successResponse(hero, 'Hero created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
