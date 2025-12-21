import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';

/**
 * GET /api/stories/[storyId]/illustrations/status
 * Get illustration generation progress and status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { storyId } = await params;

    // Get the story with illustration counts
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        userId: true,
        illustrationStatus: true,
        illustrationCount: true,
      },
    });

    if (!story) {
      return errorResponse('NotFound', 'Story not found', 404);
    }

    if (story.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this story', 403);
    }

    // Get detailed illustration status
    const illustrations = await prisma.storyIllustration.findMany({
      where: {
        storyId,
      },
      select: {
        id: true,
        displayOrder: true,
        generationStatus: true,
        generationError: true,
        retryCount: true,
        imageUrl: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Calculate progress
    const total = illustrations.length;
    const completed = illustrations.filter((i: any) => i.generationStatus === 'completed').length;
    const processing = illustrations.filter((i: any) => i.generationStatus === 'processing').length;
    const failed = illustrations.filter((i: any) => i.generationStatus === 'failed').length;
    const pending = illustrations.filter((i: any) => i.generationStatus === 'pending').length;

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return successResponse({
      status: story.illustrationStatus,
      progress,
      total,
      completed,
      processing,
      failed,
      pending,
      illustrations: illustrations.map((i: any) => ({
        id: i.id,
        displayOrder: i.displayOrder,
        status: i.generationStatus,
        error: i.generationError,
        retryCount: i.retryCount,
        hasImage: !!i.imageUrl,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
