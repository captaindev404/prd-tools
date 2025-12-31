import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';

// Zod schemas for validation
const VisualProfileCreateSchema = z.object({
  hairStyle: z.string().optional(),
  hairColor: z.string().optional(),
  hairTexture: z.string().optional(),
  eyeColor: z.string().optional(),
  eyeShape: z.string().optional(),
  skinTone: z.string().optional(),
  facialFeatures: z.string().optional(),
  bodyType: z.string().optional(),
  height: z.string().optional(),
  age: z.number().optional(),
  typicalClothing: z.string().optional(),
  colorPalette: z.array(z.string()).optional(),
  accessories: z.string().optional(),
  artStyle: z.string().optional(),
  visualKeywords: z.array(z.string()).optional(),
  canonicalPrompt: z.string().optional(),
  simplifiedPrompt: z.string().optional(),
});

const VisualProfileUpdateSchema = VisualProfileCreateSchema.partial();

/**
 * GET /api/v1/heroes/[heroId]/visual-profile
 * Get the visual profile for a hero
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { heroId } = await params;

    // Get the hero to verify ownership
    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      include: { visualProfile: true },
    });

    if (!hero) {
      return errorResponse('NotFound', 'Hero not found', 404);
    }

    if (hero.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this hero', 403);
    }

    if (!hero.visualProfile) {
      return errorResponse('NotFound', 'Visual profile not found for this hero', 404);
    }

    return successResponse(hero.visualProfile);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/heroes/[heroId]/visual-profile
 * Create a visual profile for a hero
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { heroId } = await params;
    const body = await req.json();

    // Validate request body
    const validationResult = VisualProfileCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        'ValidationError',
        'Invalid request body',
        400,
        validationResult.error.flatten()
      );
    }

    // Get the hero to verify ownership
    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      include: { visualProfile: true },
    });

    if (!hero) {
      return errorResponse('NotFound', 'Hero not found', 404);
    }

    if (hero.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this hero', 403);
    }

    // Check if visual profile already exists
    if (hero.visualProfile) {
      return errorResponse(
        'Conflict',
        'Visual profile already exists for this hero. Use PATCH to update.',
        409
      );
    }

    // Create the visual profile
    const visualProfile = await prisma.heroVisualProfile.create({
      data: {
        heroId,
        ...validationResult.data,
      },
    });

    return successResponse(visualProfile, 'Visual profile created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/v1/heroes/[heroId]/visual-profile
 * Update the visual profile for a hero
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { heroId } = await params;
    const body = await req.json();

    // Validate request body
    const validationResult = VisualProfileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        'ValidationError',
        'Invalid request body',
        400,
        validationResult.error.flatten()
      );
    }

    // Get the hero to verify ownership
    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      include: { visualProfile: true },
    });

    if (!hero) {
      return errorResponse('NotFound', 'Hero not found', 404);
    }

    if (hero.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this hero', 403);
    }

    if (!hero.visualProfile) {
      return errorResponse(
        'NotFound',
        'Visual profile not found for this hero. Use POST to create.',
        404
      );
    }

    // Update the visual profile
    const updatedProfile = await prisma.heroVisualProfile.update({
      where: { heroId },
      data: validationResult.data,
    });

    return successResponse(updatedProfile, 'Visual profile updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/v1/heroes/[heroId]/visual-profile
 * Delete the visual profile for a hero
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { heroId } = await params;

    // Get the hero to verify ownership
    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      include: { visualProfile: true },
    });

    if (!hero) {
      return errorResponse('NotFound', 'Hero not found', 404);
    }

    if (hero.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this hero', 403);
    }

    if (!hero.visualProfile) {
      return errorResponse('NotFound', 'Visual profile not found for this hero', 404);
    }

    // Delete the visual profile
    await prisma.heroVisualProfile.delete({
      where: { heroId },
    });

    return successResponse({ heroId }, 'Visual profile deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
