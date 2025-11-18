import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';
import { deleteFromR2 } from '@/lib/storage/r2-client';

/**
 * GET /api/stories/[storyId]
 * Get a specific story with optional illustration inclusion
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { storyId } = await params;

    // Check if we should include illustrations
    const { searchParams } = new URL(req.url);
    const includeIllustrations = searchParams.get('includeIllustrations') === 'true';

    // Get the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        hero: {
          select: {
            id: true,
            name: true,
            age: true,
            avatarUrl: true,
            traits: true,
          },
        },
        customEvent: true,
        illustrations: includeIllustrations
          ? {
              orderBy: { displayOrder: 'asc' },
            }
          : false,
        _count: {
          select: { illustrations: true },
        },
      },
    });

    if (!story) {
      return errorResponse('NotFound', 'Story not found', 404);
    }

    // Verify ownership
    if (story.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this story', 403);
    }

    return successResponse(story);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/stories/[storyId]
 * Update a story's content or metadata
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { storyId } = await params;
    const body = await req.json();

    // Get the story first to verify ownership
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!existingStory) {
      return errorResponse('NotFound', 'Story not found', 404);
    }

    if (existingStory.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this story', 403);
    }

    // Update the story
    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content && {
          content: body.content,
          // Reset audio status if content changed
          audioGenerationStatus: 'pending',
          audioUrl: null,
        }),
        ...(body.isFavorite !== undefined && { isFavorite: body.isFavorite }),
        ...(body.language && { language: body.language }),
      },
      include: {
        hero: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { illustrations: true },
        },
      },
    });

    return successResponse(updatedStory, 'Story updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/stories/[storyId]
 * Delete a story with cascade cleanup of audio and illustrations
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { storyId } = await params;

    // Get the story first to verify ownership and get file URLs
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        illustrations: true,
      },
    });

    if (!existingStory) {
      return errorResponse('NotFound', 'Story not found', 404);
    }

    if (existingStory.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this story', 403);
    }

    // Delete associated files from R2
    const filesToDelete: string[] = [];

    // Add audio file if exists
    if (existingStory.audioUrl) {
      const audioKey = existingStory.audioUrl.split('/').pop();
      if (audioKey) filesToDelete.push(`audio/${user.id}/${audioKey}`);
    }

    // Add illustration files
    for (const illustration of existingStory.illustrations) {
      if (illustration.imageUrl) {
        const illustrationKey = illustration.imageUrl.split('/').pop();
        if (illustrationKey) filesToDelete.push(`illustration/${user.id}/${illustrationKey}`);
      }
    }

    // Delete files from R2 (don't fail if file deletion fails)
    for (const key of filesToDelete) {
      await deleteFromR2(key).catch((err) => {
        console.error(`Failed to delete file ${key}:`, err);
      });
    }

    // Delete the story (cascade will handle illustrations)
    await prisma.story.delete({
      where: { id: storyId },
    });

    return successResponse(
      { id: storyId },
      'Story deleted successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
