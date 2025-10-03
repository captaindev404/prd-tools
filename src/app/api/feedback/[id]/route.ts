import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redactPII } from '@/lib/pii-redact';
import { getCurrentUser, canEditFeedback } from '@/lib/auth-helpers';
import type { UpdateFeedbackInput } from '@/types/feedback';

/**
 * GET /api/feedback/[id] - Get single feedback item with full details
 *
 * Returns:
 * - Feedback with author details
 * - Feature information
 * - Vote count and weight
 * - Duplicate information
 * - All votes with user info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedbackId = params.id;

    // Fetch feedback with all relations
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
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
        duplicateOf: {
          select: {
            id: true,
            title: true,
          },
        },
        duplicates: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
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

    // Calculate vote statistics
    const voteStats = await prisma.vote.aggregate({
      where: { feedbackId: feedback.id },
      _sum: {
        weight: true,
        decayedWeight: true,
      },
      _count: true,
    });

    // Check if current user has voted (if authenticated)
    const user = await getCurrentUser();
    let userHasVoted = false;
    if (user) {
      const userVote = await prisma.vote.findUnique({
        where: {
          feedbackId_userId: {
            feedbackId: feedback.id,
            userId: user.id,
          },
        },
      });
      userHasVoted = !!userVote;
    }

    return NextResponse.json({
      ...feedback,
      voteCount: voteStats._count || 0,
      voteWeight: voteStats._sum.decayedWeight || 0,
      userHasVoted,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch feedback. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feedback/[id] - Edit feedback
 *
 * Authorization:
 * - User is author AND within 15-minute edit window
 * - OR user has PM/PO/ADMIN role
 *
 * Request body:
 * - title?: string (8-120 chars)
 * - body?: string (20-5000 chars)
 *
 * Features:
 * - PII redaction applied to updates
 * - Validation for length constraints
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to edit feedback' },
        { status: 401 }
      );
    }

    const feedbackId = params.id;

    // Fetch existing feedback
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
        authorId: true,
        editWindowEndsAt: true,
        title: true,
        body: true,
      },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Feedback item not found',
        },
        { status: 404 }
      );
    }

    // Check authorization
    if (!canEditFeedback(user, existingFeedback)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message:
            user.id === existingFeedback.authorId
              ? 'The edit window for this feedback has expired'
              : 'You do not have permission to edit this feedback',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body: UpdateFeedbackInput = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        errors.push({ field: 'title', message: 'Title must be a string' });
      } else if (body.title.length < 8) {
        errors.push({ field: 'title', message: 'Title must be at least 8 characters' });
      } else if (body.title.length > 120) {
        errors.push({ field: 'title', message: 'Title must not exceed 120 characters' });
      }
    }

    if (body.body !== undefined) {
      if (typeof body.body !== 'string') {
        errors.push({ field: 'body', message: 'Body must be a string' });
      } else if (body.body.length < 20) {
        errors.push({ field: 'body', message: 'Body must be at least 20 characters' });
      } else if (body.body.length > 5000) {
        errors.push({ field: 'body', message: 'Body must not exceed 5000 characters' });
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

    // Prepare update data with PII redaction
    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = redactPII(body.title);
    }

    if (body.body !== undefined) {
      updateData.body = redactPII(body.body);
    }

    // Update feedback
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
        feature: {
          select: {
            id: true,
            title: true,
            area: true,
          },
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'feedback.updated',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId: updatedFeedback.id,
          updatedFields: Object.keys(updateData),
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback updated successfully',
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update feedback. Please try again later.',
      },
      { status: 500 }
    );
  }
}
