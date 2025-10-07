import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canCreateFeature } from '@/lib/auth-helpers';

/**
 * POST /api/feedback/[id]/link-feature - Link feedback to a feature
 *
 * Authorization: PM, PO, or ADMIN role required
 *
 * Request body:
 * - featureId: string (required)
 *
 * Returns:
 * - Updated feedback with feature information
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to link features' },
        { status: 401 }
      );
    }

    // Check authorization (only PM/PO/ADMIN can link features)
    if (!canCreateFeature(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only PM, PO, or ADMIN roles can link feedback to features',
        },
        { status: 403 }
      );
    }

    const feedbackId = params.id;

    // Parse request body
    const body = await request.json();
    const { featureId } = body;

    // Validation
    if (!featureId || typeof featureId !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Feature ID is required',
        },
        { status: 400 }
      );
    }

    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { id: true, featureId: true },
    });

    if (!feedback) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Feedback item not found',
        },
        { status: 404 }
      );
    }

    // Check if feature exists
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      select: { id: true, title: true },
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

    // Check if already linked
    if (feedback.featureId === featureId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Feedback is already linked to this feature',
        },
        { status: 400 }
      );
    }

    // Link feedback to feature
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { featureId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        feature: {
          select: {
            id: true,
            title: true,
            area: true,
            status: true,
          },
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'feedback.feature_linked',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId,
          featureId,
          featureTitle: feature.title,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback linked to feature successfully',
    });
  } catch (error) {
    console.error('Error linking feedback to feature:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to link feedback to feature. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/feedback/[id]/link-feature - Unlink feedback from feature
 *
 * Authorization: PM, PO, or ADMIN role required
 *
 * Returns:
 * - Updated feedback without feature information
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to unlink features' },
        { status: 401 }
      );
    }

    // Check authorization (only PM/PO/ADMIN can unlink features)
    if (!canCreateFeature(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only PM, PO, or ADMIN roles can unlink feedback from features',
        },
        { status: 403 }
      );
    }

    const feedbackId = params.id;

    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
        featureId: true,
        feature: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Feedback item not found',
        },
        { status: 404 }
      );
    }

    // Check if linked to a feature
    if (!feedback.featureId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Feedback is not linked to any feature',
        },
        { status: 400 }
      );
    }

    const previousFeatureId = feedback.featureId;
    const previousFeatureTitle = feedback.feature?.title;

    // Unlink feedback from feature
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { featureId: null },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'feedback.feature_unlinked',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId,
          previousFeatureId,
          previousFeatureTitle,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback unlinked from feature successfully',
    });
  } catch (error) {
    console.error('Error unlinking feedback from feature:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to unlink feedback from feature. Please try again later.',
      },
      { status: 500 }
    );
  }
}
