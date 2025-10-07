import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

/**
 * POST /api/moderation/[id]/reject - Reject feedback after moderation review
 *
 * Request body (optional):
 * - reason?: string (rejection reason)
 *
 * Sets:
 * - moderationStatus = 'rejected'
 * - needsReview = false
 * - moderatedBy = current moderator ID
 * - moderatedAt = current timestamp
 *
 * Only accessible to users with MODERATOR role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    if (user.role !== 'MODERATOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You must have MODERATOR role to reject feedback',
        },
        { status: 403 }
      );
    }

    const feedbackId = params.id;

    // Parse request body for optional rejection reason
    let rejectionReason: string | undefined;
    try {
      const body = await request.json();
      rejectionReason = body.reason;
    } catch (e) {
      // Body is optional, ignore parse errors
    }

    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: 'Not found', message: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Update feedback to rejected status
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        moderationStatus: 'rejected',
        needsReview: false,
        moderatedBy: user.id,
        moderatedAt: new Date(),
      },
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

    // Log moderation action
    await prisma.event.create({
      data: {
        type: 'feedback.moderation.rejected',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId: feedbackId,
          moderatorId: user.id,
          reason: rejectionReason || 'No reason provided',
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting feedback:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to reject feedback. Please try again later.',
      },
      { status: 500 }
    );
  }
}
