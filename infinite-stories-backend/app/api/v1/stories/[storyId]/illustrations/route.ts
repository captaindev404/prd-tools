import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';
import { generateStoryIllustrations } from '@/lib/openai/illustration-generator';
import { enforceRateLimit, recordApiUsage } from '@/lib/rate-limit/db-rate-limiter';
import { generateSignedUrl } from '@/lib/storage/signed-url';

/**
 * POST /api/stories/[storyId]/illustrations
 * Generate illustrations for a story
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const startTime = Date.now();

  try {
    const user = await getOrCreateUser();
    const { storyId } = await params;
    const body = await req.json();

    // Get the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        illustrations: true,
      },
    });

    if (!story) {
      return errorResponse('NotFound', 'Story not found', 404);
    }

    if (story.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this story', 403);
    }

    // Check if there are scenes to illustrate
    if (story.illustrations.length === 0) {
      return errorResponse(
        'ValidationError',
        'No scenes available for illustration. Generate story first.',
        400
      );
    }

    // Check rate limit
    await enforceRateLimit(user.id, 'illustration_generation');

    // Update story status
    await prisma.story.update({
      where: { id: storyId },
      data: {
        illustrationStatus: 'processing',
      },
    });

    // Generate illustrations
    const style = body.style || 'standard';
    const maxIllustrations = body.maxIllustrations || 10;

    const result = await generateStoryIllustrations(storyId, user.id, {
      style,
      maxIllustrations,
    });

    // Record API usage (per illustration)
    const duration = Date.now() - startTime;
    const costPerImage = style === 'hd' ? 0.167 : 0.011; // gpt-image-1 pricing (high/medium quality)

    await recordApiUsage({
      userId: user.id,
      operation: 'illustration_generation',
      model: 'gpt-image-1',
      estimatedCost: costPerImage * result.generated,
      requestDuration: duration,
      success: result.generated > 0,
      errorMessage: result.failed > 0 ? `${result.failed} illustrations failed` : undefined,
    });

    // Update user stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalIllustrationsGenerated: { increment: result.generated },
      },
    });

    return successResponse(
      {
        generated: result.generated,
        failed: result.failed,
        status: result.failed === 0 ? 'completed' : 'partial',
      },
      `Generated ${result.generated} illustrations${result.failed > 0 ? `, ${result.failed} failed` : ''}`
    );
  } catch (error) {
    // Update story with error status
    const { storyId } = await params;
    await prisma.story.update({
      where: { id: storyId },
      data: {
        illustrationStatus: 'failed',
      },
    }).catch(() => {});

    // Record failed API usage
    const duration = Date.now() - startTime;
    const user = await getOrCreateUser().catch(() => null);

    if (user) {
      await recordApiUsage({
        userId: user.id,
        operation: 'illustration_generation',
        model: 'gpt-image-1',
        requestDuration: duration,
        success: false,
        errorMessage: (error as Error).message,
      });
    }

    return handleApiError(error);
  }
}

/**
 * GET /api/stories/[storyId]/illustrations
 * List all illustrations for a story
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { storyId } = await params;

    // Verify story ownership
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!story) {
      return errorResponse('NotFound', 'Story not found', 404);
    }

    if (story.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this story', 403);
    }

    // Get illustrations
    const illustrations = await prisma.storyIllustration.findMany({
      where: {
        storyId,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Sign all image URLs for secure access
    const signedIllustrations = await Promise.all(
      illustrations.map(async (ill) => ({
        ...ill,
        imageUrl: ill.imageUrl ? await generateSignedUrl(ill.imageUrl) : null,
      }))
    );

    return successResponse({
      illustrations: signedIllustrations,
      total: signedIllustrations.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
