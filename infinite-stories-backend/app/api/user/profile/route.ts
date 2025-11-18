import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';

/**
 * GET /api/user/profile
 * Get the authenticated user's profile information
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authUser = await requireAuth();
    if (!authUser) {
      return errorResponse('Unauthorized', 'Authentication required', 401);
    }

    // Get user with extended information
    const userProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        _count: {
          select: {
            heroes: true,
            customEvents: true,
          },
        },
      },
    });

    if (!userProfile) {
      return errorResponse('NotFound', 'User profile not found', 404);
    }

    // Get story count separately (stories link to user directly)
    const storyCount = await prisma.story.count({
      where: { userId: authUser.id },
    });

    return successResponse({
      ...userProfile,
      _count: {
        ...userProfile._count,
        stories: storyCount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/user/profile
 * Update user preferences and profile information
 */
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const authUser = await requireAuth();
    if (!authUser) {
      return errorResponse('Unauthorized', 'Authentication required', 401);
    }

    const body = await req.json();

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        ...(body.name && { name: body.name }),
      },
    });

    return successResponse(updatedUser, 'Profile updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
