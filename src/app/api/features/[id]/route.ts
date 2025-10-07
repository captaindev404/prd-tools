import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canEditFeature, canDeleteFeature } from '@/lib/auth-helpers';
import { isValidStatusTransition } from '@/types/feature';
import type { UpdateFeatureInput } from '@/types/feature';
import type { FeatureStatus } from '@prisma/client';

/**
 * GET /api/features/[id] - Get single feature with full details
 *
 * Returns:
 * - Feature details
 * - Linked feedback items with vote counts
 * - Linked roadmap items
 * - Feedback and roadmap counts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { id: featureId } = await params;

    // Fetch feature with all relations
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        feedbacks: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        roadmapItems: {
          select: {
            id: true,
            title: true,
            stage: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            feedbacks: true,
            roadmapItems: true,
          },
        },
      },
    });

    if (!feature) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Feature not found',
        },
        { status: 404 }
      );
    }

    // Get vote weights for each feedback
    const feedbacksWithVotes = await Promise.all(
      feature.feedbacks.map(async (feedback) => {
        const voteStats = await prisma.vote.aggregate({
          where: { feedbackId: feedback.id },
          _sum: {
            weight: true,
            decayedWeight: true,
          },
        });

        return {
          ...feedback,
          voteCount: feedback._count.votes,
          voteWeight: voteStats._sum.decayedWeight || 0,
        };
      })
    );

    return NextResponse.json({
      ...feature,
      tags: JSON.parse(feature.tags || '[]'),
      feedbacks: feedbacksWithVotes,
      feedbackCount: feature._count.feedbacks,
      roadmapItemCount: feature._count.roadmapItems,
    });
  } catch (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch feature. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/features/[id] - Update feature
 *
 * Authorization: PM, PO, or ADMIN role required
 *
 * Request body:
 * - title?: string (3-100 chars)
 * - description?: string (max 2000 chars)
 * - area?: ProductArea
 * - status?: FeatureStatus (validates transitions)
 *
 * Features:
 * - Validates status transitions per DSL spec
 * - Logs status changes
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to edit features' },
        { status: 401 }
      );
    }

    const { id: featureId } = await params;

    // Fetch existing feature
    const existingFeature = await prisma.feature.findUnique({
      where: { id: featureId },
      select: {
        id: true,
        title: true,
        description: true,
        area: true,
        status: true,
      },
    });

    if (!existingFeature) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Feature not found',
        },
        { status: 404 }
      );
    }

    // Check authorization
    if (!canEditFeature(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only PM, PO, or ADMIN roles can edit features',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body: UpdateFeatureInput = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        errors.push({ field: 'title', message: 'Title must be a string' });
      } else if (body.title.length < 3) {
        errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
      } else if (body.title.length > 100) {
        errors.push({ field: 'title', message: 'Title must not exceed 100 characters' });
      }
    }

    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== 'string') {
        errors.push({ field: 'description', message: 'Description must be a string' });
      } else if (body.description.length > 2000) {
        errors.push({ field: 'description', message: 'Description must not exceed 2000 characters' });
      }
    }

    if (body.area !== undefined) {
      const validAreas = ['Reservations', 'CheckIn', 'Payments', 'Housekeeping', 'Backoffice'];
      if (!validAreas.includes(body.area)) {
        errors.push({ field: 'area', message: 'Invalid product area' });
      }
    }

    if (body.status !== undefined) {
      const validStatuses = ['idea', 'discovery', 'shaping', 'in_progress', 'released', 'generally_available', 'deprecated'];
      if (!validStatuses.includes(body.status)) {
        errors.push({ field: 'status', message: 'Invalid feature status' });
      } else if (!isValidStatusTransition(existingFeature.status as FeatureStatus, body.status as FeatureStatus)) {
        errors.push({
          field: 'status',
          message: `Invalid status transition from '${existingFeature.status}' to '${body.status}'`,
        });
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

    // Prepare update data
    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.area !== undefined) {
      updateData.area = body.area;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // Update feature
    const updatedFeature = await prisma.feature.update({
      where: { id: featureId },
      data: updateData,
      include: {
        _count: {
          select: {
            feedbacks: true,
            roadmapItems: true,
          },
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: body.status && body.status !== existingFeature.status
          ? 'feature.status_changed'
          : 'feature.updated',
        userId: user.id,
        payload: JSON.stringify({
          featureId: updatedFeature.id,
          updatedFields: Object.keys(updateData),
          oldStatus: existingFeature.status,
          newStatus: updatedFeature.status,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedFeature,
        tags: JSON.parse(updatedFeature.tags || '[]'),
        feedbackCount: updatedFeature._count.feedbacks,
        roadmapItemCount: updatedFeature._count.roadmapItems,
      },
      message: 'Feature updated successfully',
    });
  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update feature. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/features/[id] - Delete feature
 *
 * Authorization: PM, PO, or ADMIN role required
 *
 * Behavior:
 * - Hard delete if no linked roadmap items
 * - Soft delete (mark as deprecated) if linked to roadmap items
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to delete features' },
        { status: 401 }
      );
    }

    // Check authorization
    if (!canDeleteFeature(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only PM, PO, or ADMIN roles can delete features',
        },
        { status: 403 }
      );
    }

    const { id: featureId } = await params;

    // Check if feature exists and count roadmap items
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        _count: {
          select: {
            roadmapItems: true,
            feedbacks: true,
          },
        },
      },
    });

    if (!feature) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Feature not found',
        },
        { status: 404 }
      );
    }

    // If linked to roadmap items, soft delete (mark as deprecated)
    if (feature._count.roadmapItems > 0) {
      const updatedFeature = await prisma.feature.update({
        where: { id: featureId },
        data: { status: 'deprecated' },
      });

      // Log event
      await prisma.event.create({
        data: {
          type: 'feature.deprecated',
          userId: user.id,
          payload: JSON.stringify({
            featureId: updatedFeature.id,
            reason: 'soft_delete_due_to_roadmap_items',
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Feature marked as deprecated (linked to roadmap items)',
        data: {
          id: updatedFeature.id,
          status: updatedFeature.status,
          softDeleted: true,
        },
      });
    }

    // Hard delete if no roadmap items
    // First, unlink any feedback items
    await prisma.feedback.updateMany({
      where: { featureId },
      data: { featureId: null },
    });

    // Then delete the feature
    await prisma.feature.delete({
      where: { id: featureId },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'feature.deleted',
        userId: user.id,
        payload: JSON.stringify({
          featureId,
          title: feature.title,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feature deleted successfully',
      data: {
        id: featureId,
        deleted: true,
      },
    });
  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete feature. Please try again later.',
      },
      { status: 500 }
    );
  }
}
