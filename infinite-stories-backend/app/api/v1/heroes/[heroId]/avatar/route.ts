import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';
import { generateAvatar } from '@/lib/openai/avatar-generator';
import { enforceRateLimit, recordApiUsage } from '@/lib/rate-limit/db-rate-limiter';
import { generateSignedUrl } from '@/lib/storage/signed-url';

/**
 * POST /api/heroes/[heroId]/avatar
 * Generate an AI avatar for a hero using DALL-E 3
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ heroId: string }> }
) {
  const startTime = Date.now();

  try {
    const user = await getOrCreateUser();
    const { heroId } = await params;
    const body = await req.json();

    // Get the hero first to verify ownership
    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
    });

    if (!hero) {
      return errorResponse('NotFound', 'Hero not found', 404);
    }

    if (hero.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this hero', 403);
    }

    // Check rate limit
    await enforceRateLimit(user.id, 'avatar_generation');

    // Generate the avatar
    const style = body.style || 'standard';
    const size = body.size || '1024x1024';

    const avatar = await generateAvatar({
      heroName: hero.name,
      heroAge: hero.age,
      heroTraits: hero.traits as string[],
      physicalTraits: {
        hairColor: hero.hairColor || undefined,
        eyeColor: hero.eyeColor || undefined,
        skinTone: hero.skinTone || undefined,
        height: hero.height || undefined,
      },
      specialAbilities: hero.specialAbilities as string[] | undefined,
      style,
      size,
      userId: user.id,
      heroId: heroId,
    });

    // Update hero with avatar URL and prompt
    const updatedHero = await prisma.hero.update({
      where: { id: heroId },
      data: {
        avatarUrl: avatar.imageUrl,
        avatarPrompt: avatar.prompt,
        avatarGenerationId: avatar.generationId || null,
      },
    });

    // Record API usage
    const duration = Date.now() - startTime;
    await recordApiUsage({
      userId: user.id,
      operation: 'avatar_generation',
      model: 'gpt-image-1',
      estimatedCost: style === 'hd' ? 0.167 : 0.011, // gpt-image-1 pricing (high/medium quality)
      requestDuration: duration,
      success: true,
    });

    // Sign URLs for secure access
    const signedAvatarUrl = await generateSignedUrl(avatar.imageUrl);

    // Return flat structure matching iOS AvatarGenerationResponse
    return successResponse(
      {
        heroId: heroId,
        avatarUrl: signedAvatarUrl,
        generationId: avatar.generationId || null,
      },
      'Avatar generated successfully'
    );
  } catch (error) {
    // Record failed API usage
    const duration = Date.now() - startTime;
    const user = await getOrCreateUser().catch(() => null);

    if (user) {
      await recordApiUsage({
        userId: user.id,
        operation: 'avatar_generation',
        model: 'gpt-image-1',
        requestDuration: duration,
        success: false,
        errorMessage: (error as Error).message,
      });
    }

    return handleApiError(error);
  }
}
