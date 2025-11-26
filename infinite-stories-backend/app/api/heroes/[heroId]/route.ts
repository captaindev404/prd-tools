import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';
import { signHeroUrls, signStoryUrls } from '@/lib/storage/signed-url';

/**
 * GET /api/heroes/[heroId]
 * Get a specific hero with optional story inclusion
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { heroId } = await params;

    // Check if we should include stories
    const { searchParams } = new URL(req.url);
    const includeStories = searchParams.get('includeStories') === 'true';

    // Get the hero
    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      include: {
        visualProfile: true,
        stories: includeStories
          ? {
              orderBy: { createdAt: 'desc' },
              take: 10,
            }
          : false,
      },
    });

    if (!hero) {
      return errorResponse('NotFound', 'Hero not found', 404);
    }

    // Verify ownership
    if (hero.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this hero', 403);
    }

    // Sign avatar URL for secure access
    const signedHero = await signHeroUrls(hero);

    // Sign story URLs if included
    if (signedHero.stories && Array.isArray(signedHero.stories)) {
      signedHero.stories = await Promise.all(
        signedHero.stories.map((story: any) => signStoryUrls(story))
      );
    }

    return successResponse(signedHero);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/heroes/[heroId]
 * Update a hero's information
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { heroId } = await params;
    const body = await req.json();

    // Get the hero first to verify ownership
    const existingHero = await prisma.hero.findUnique({
      where: { id: heroId },
    });

    if (!existingHero) {
      return errorResponse('NotFound', 'Hero not found', 404);
    }

    if (existingHero.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this hero', 403);
    }

    // Update the hero
    const updatedHero = await prisma.hero.update({
      where: { id: heroId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.age !== undefined && { age: body.age }),
        ...(body.hairColor && { hairColor: body.hairColor }),
        ...(body.eyeColor && { eyeColor: body.eyeColor }),
        ...(body.skinTone && { skinTone: body.skinTone }),
        ...(body.height && { height: body.height }),
        ...(body.traits && { traits: body.traits }),
        ...(body.specialAbilities && { specialAbilities: body.specialAbilities }),
        ...(body.avatarUrl && { avatarUrl: body.avatarUrl }),
        ...(body.avatarPrompt && { avatarPrompt: body.avatarPrompt }),
        ...(body.avatarGenerationId && { avatarGenerationId: body.avatarGenerationId }),
      },
      include: {
        visualProfile: true,
      },
    });

    // Sign avatar URL for secure access
    const signedHero = await signHeroUrls(updatedHero);

    return successResponse(signedHero, 'Hero updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/heroes/[heroId]
 * Delete a hero (stories will be preserved with null heroId due to cascade)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { heroId } = await params;

    // Get the hero first to verify ownership
    const existingHero = await prisma.hero.findUnique({
      where: { id: heroId },
    });

    if (!existingHero) {
      return errorResponse('NotFound', 'Hero not found', 404);
    }

    if (existingHero.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this hero', 403);
    }

    // Delete the hero (cascade will handle visual profile)
    await prisma.hero.delete({
      where: { id: heroId },
    });

    return successResponse(
      { id: heroId },
      'Hero deleted successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
