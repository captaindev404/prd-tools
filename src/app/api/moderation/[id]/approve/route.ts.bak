import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

/**
 * POST /api/moderation/[id]/approve - Approve feedback after moderation review
 *
 * Sets:
 * - moderationStatus = 'approved'
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
          message: 'You must have MODERATOR role to approve feedback',
        },
        { status: 403 }
      );
    }

    const feedbackId = params.id;

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

    // Update feedback to approved status
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        moderationStatus: 'approved',
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
        type: 'feedback.moderation.approved',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId: feedbackId,
          moderatorId: user.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback approved successfully',
    });
  } catch (error) {
    console.error('Error approving feedback:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to approve feedback. Please try again later.',
      },
      { status: 500 }
    );
  }
}
