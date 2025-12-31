import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';

/**
 * GET /api/v1/custom-events/[eventId]
 * Get a specific custom event
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { eventId } = await params;

    // Get the custom event
    const customEvent = await prisma.customStoryEvent.findUnique({
      where: { id: eventId },
    });

    if (!customEvent) {
      return errorResponse('NotFound', 'Custom event not found', 404);
    }

    // Verify ownership
    if (customEvent.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this custom event', 403);
    }

    return successResponse(customEvent);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/v1/custom-events/[eventId]
 * Update a custom event
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { eventId } = await params;
    const body = await req.json();

    // Get the custom event first to verify ownership
    const existingEvent = await prisma.customStoryEvent.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return errorResponse('NotFound', 'Custom event not found', 404);
    }

    if (existingEvent.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this custom event', 403);
    }

    // Validate title length if provided
    if (body.title !== undefined) {
      if (body.title.length < 1 || body.title.length > 200) {
        return errorResponse(
          'ValidationError',
          'Title must be between 1 and 200 characters',
          400
        );
      }
    }

    // Validate promptSeed length if provided
    if (body.promptSeed !== undefined) {
      if (body.promptSeed.length < 1 || body.promptSeed.length > 2000) {
        return errorResponse(
          'ValidationError',
          'Prompt seed must be between 1 and 2000 characters',
          400
        );
      }
    }

    // Update the custom event
    const updatedEvent = await prisma.customStoryEvent.update({
      where: { id: eventId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.promptSeed !== undefined && { promptSeed: body.promptSeed }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.ageRange !== undefined && { ageRange: body.ageRange }),
        ...(body.tone !== undefined && { tone: body.tone }),
        ...(body.keywords !== undefined && { keywords: body.keywords }),
        ...(body.isFavorite !== undefined && { isFavorite: body.isFavorite }),
        ...(body.usageCount !== undefined && { usageCount: body.usageCount }),
        ...(body.lastUsedAt !== undefined && { lastUsedAt: new Date(body.lastUsedAt) }),
      },
    });

    return successResponse(updatedEvent, 'Custom event updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/v1/custom-events/[eventId]
 * Delete a custom event
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { eventId } = await params;

    // Get the custom event first to verify ownership
    const existingEvent = await prisma.customStoryEvent.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return errorResponse('NotFound', 'Custom event not found', 404);
    }

    if (existingEvent.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this custom event', 403);
    }

    // Delete the custom event (stories will have customEventId set to null due to SetNull cascade)
    await prisma.customStoryEvent.delete({
      where: { id: eventId },
    });

    return successResponse(
      { id: eventId },
      'Custom event deleted successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
