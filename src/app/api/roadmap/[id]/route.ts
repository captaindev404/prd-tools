import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import {
  canEditRoadmap,
  canDeleteRoadmap,
  isValidProgress,
  parseJsonField,
} from '@/lib/roadmap-helpers';
import type { UpdateRoadmapInput } from '@/types/roadmap';
import type { RoadmapStage, Visibility } from '@prisma/client';

/**
 * GET /api/roadmap/[id] - Get roadmap item details
 *
 * Features:
 * - Returns full roadmap details with all linked items
 * - Includes owner details
 * - Respects visibility (public visible to all, internal only to PM/PO/ADMIN)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get current user (optional for public items)
    const currentUser = await getCurrentUser();

    // Fetch roadmap item
    const roadmapItem = await prisma.roadmapItem.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        features: {
          select: {
            id: true,
            title: true,
            area: true,
            status: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            title: true,
            state: true,
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
      },
    });

    if (!roadmapItem) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Roadmap item not found',
        },
        { status: 404 }
      );
    }

    // Check visibility permissions
    if (roadmapItem.visibility === 'internal') {
      if (!currentUser) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to view this roadmap item',
          },
          { status: 401 }
        );
      }

      if (!['PM', 'PO', 'ADMIN'].includes(currentUser.role)) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'You do not have permission to view this roadmap item',
          },
          { status: 403 }
        );
      }
    }

    // Transform response
    const response = {
      id: roadmapItem.id,
      title: roadmapItem.title,
      description: roadmapItem.description,
      stage: roadmapItem.stage,
      targetDate: roadmapItem.targetDate?.toISOString() || null,
      progress: roadmapItem.progress,
      visibility: roadmapItem.visibility,
      createdBy: roadmapItem.createdBy,
      features: roadmapItem.features,
      feedbacks: roadmapItem.feedbacks.map((fb) => ({
        id: fb.id,
        title: fb.title,
        state: fb.state,
        voteCount: fb._count.votes,
      })),
      jiraTickets: parseJsonField<string[]>(roadmapItem.jiraTickets, []),
      figmaLinks: parseJsonField<string[]>(roadmapItem.figmaLinks, []),
      commsCadence: roadmapItem.commsCadence,
      commsChannels: parseJsonField<string[]>(roadmapItem.commsChannels, []),
      commsAudience: parseJsonField<Record<string, any>>(
        roadmapItem.commsAudience,
        {}
      ),
      successCriteria: parseJsonField<string[]>(roadmapItem.successCriteria, []),
      guardrails: parseJsonField<string[]>(roadmapItem.guardrails, []),
      createdAt: roadmapItem.createdAt.toISOString(),
      updatedAt: roadmapItem.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching roadmap item:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch roadmap item. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/roadmap/[id] - Update roadmap item
 *
 * Request body: Partial UpdateRoadmapInput
 * - title?: string
 * - description?: string
 * - stage?: RoadmapStage
 * - targetDate?: string | null
 * - progress?: number
 * - visibility?: 'public' | 'internal'
 * - featureIds?: string[]
 * - feedbackIds?: string[]
 * - jiraTickets?: string[]
 * - figmaLinks?: string[]
 * - successCriteria?: string[]
 * - guardrails?: string[]
 *
 * Features:
 * - PM/PO/ADMIN or owner can update
 * - Validates stage transitions
 * - Updates linked items
 * - Logs event
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to update roadmap items',
        },
        { status: 401 }
      );
    }

    // Fetch existing roadmap item
    const existingItem = await prisma.roadmapItem.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        stage: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Roadmap item not found',
        },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canEditRoadmap(user, existingItem)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to update this roadmap item',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body: UpdateRoadmapInput = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        errors.push({ field: 'title', message: 'Title must be a string' });
      } else if (body.title.length < 3) {
        errors.push({
          field: 'title',
          message: 'Title must be at least 3 characters',
        });
      } else if (body.title.length > 200) {
        errors.push({
          field: 'title',
          message: 'Title must not exceed 200 characters',
        });
      }
    }

    if (body.stage !== undefined) {
      if (!['now', 'next', 'later', 'under_consideration'].includes(body.stage)) {
        errors.push({ field: 'stage', message: 'Invalid stage value' });
      }
    }

    if (body.progress !== undefined) {
      if (typeof body.progress !== 'number' || !isValidProgress(body.progress)) {
        errors.push({
          field: 'progress',
          message: 'Progress must be a number between 0 and 100',
        });
      }
    }

    if (body.targetDate !== undefined && body.targetDate !== null) {
      const targetDate = new Date(body.targetDate);
      if (isNaN(targetDate.getTime())) {
        errors.push({ field: 'targetDate', message: 'Invalid target date format' });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please check your input and try again',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Verify linked features exist
    if (body.featureIds && body.featureIds.length > 0) {
      const features = await prisma.feature.findMany({
        where: { id: { in: body.featureIds } },
        select: { id: true },
      });

      if (features.length !== body.featureIds.length) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'One or more feature IDs are invalid',
          },
          { status: 400 }
        );
      }
    }

    // Verify linked feedback items exist
    if (body.feedbackIds && body.feedbackIds.length > 0) {
      const feedbacks = await prisma.feedback.findMany({
        where: { id: { in: body.feedbackIds } },
        select: { id: true },
      });

      if (feedbacks.length !== body.feedbackIds.length) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'One or more feedback IDs are invalid',
          },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.stage !== undefined) updateData.stage = body.stage as RoadmapStage;
    if (body.targetDate !== undefined) {
      updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null;
    }
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.visibility !== undefined)
      updateData.visibility = body.visibility as Visibility;

    if (body.jiraTickets !== undefined)
      updateData.jiraTickets = JSON.stringify(body.jiraTickets);
    if (body.figmaLinks !== undefined)
      updateData.figmaLinks = JSON.stringify(body.figmaLinks);
    if (body.commsCadence !== undefined)
      updateData.commsCadence = body.commsCadence;
    if (body.commsChannels !== undefined)
      updateData.commsChannels = JSON.stringify(body.commsChannels);
    if (body.commsAudience !== undefined)
      updateData.commsAudience = JSON.stringify(body.commsAudience);
    if (body.successCriteria !== undefined)
      updateData.successCriteria = JSON.stringify(body.successCriteria);
    if (body.guardrails !== undefined)
      updateData.guardrails = JSON.stringify(body.guardrails);

    // Update roadmap item
    const roadmapItem = await prisma.roadmapItem.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Update linked features if provided
    if (body.featureIds !== undefined) {
      await prisma.roadmapItem.update({
        where: { id },
        data: {
          features: {
            set: [], // Clear existing
            connect: body.featureIds.map((id) => ({ id })),
          },
          featureIds: JSON.stringify(body.featureIds),
        },
      });
    }

    // Update linked feedback items if provided
    if (body.feedbackIds !== undefined) {
      await prisma.roadmapItem.update({
        where: { id },
        data: {
          feedbacks: {
            set: [], // Clear existing
            connect: body.feedbackIds.map((id) => ({ id })),
          },
          feedbackIds: JSON.stringify(body.feedbackIds),
        },
      });
    }

    // Log event
    await prisma.event.create({
      data: {
        type: 'roadmap.updated',
        userId: user.id,
        payload: JSON.stringify({
          roadmapId: roadmapItem.id,
          title: roadmapItem.title,
          stage: roadmapItem.stage,
          updates: Object.keys(body),
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: roadmapItem,
      message: 'Roadmap item updated successfully',
    });
  } catch (error) {
    console.error('Error updating roadmap item:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update roadmap item. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/roadmap/[id] - Delete roadmap item
 *
 * Features:
 * - PM/PO/ADMIN or owner can delete
 * - Logs event
 * - Soft delete (could be implemented in the future)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to delete roadmap items',
        },
        { status: 401 }
      );
    }

    // Fetch existing roadmap item
    const existingItem = await prisma.roadmapItem.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        title: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Roadmap item not found',
        },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canDeleteRoadmap(user, existingItem)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to delete this roadmap item',
        },
        { status: 403 }
      );
    }

    // Delete roadmap item
    await prisma.roadmapItem.delete({
      where: { id },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'roadmap.deleted',
        userId: user.id,
        payload: JSON.stringify({
          roadmapId: id,
          title: existingItem.title,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Roadmap item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting roadmap item:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete roadmap item. Please try again later.',
      },
      { status: 500 }
    );
  }
}
