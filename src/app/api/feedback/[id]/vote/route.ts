import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { calculateBaseVoteWeight, calculateDecayedWeight, hasUserVoted } from '@/lib/vote-weight';
import { handleApiError, ApiErrors } from '@/lib/api-errors';

/**
 * POST /api/feedback/[id]/vote - Cast a vote on feedback
 *
 * Authorization:
 * - User must be authenticated
 * - User can only vote once per feedback item
 *
 * Returns:
 * - 201: Vote created successfully with calculated weight
 * - 401: User not authenticated
 * - 404: Feedback item not found
 * - 409: User has already voted on this feedback
 * - 500: Server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw ApiErrors.unauthorized('You must be logged in to vote on feedback');
    }

    const { id: feedbackId } = await params;

    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
        title: true,
        state: true,
      },
    });

    if (!feedback) {
      throw ApiErrors.notFound('Feedback', 'Feedback item not found');
    }

    // Check if user has already voted
    const alreadyVoted = await hasUserVoted(user.id, feedbackId);
    if (alreadyVoted) {
      throw ApiErrors.conflict('You have already voted on this feedback');
    }

    // Calculate vote weight based on user role, panel membership, and village priority
    const baseWeight = await calculateBaseVoteWeight(user.id, feedbackId);
    const now = new Date();
    const decayedWeight = calculateDecayedWeight(baseWeight, now);

    // Create vote record
    const vote = await prisma.vote.create({
      data: {
        feedbackId,
        userId: user.id,
        weight: baseWeight,
        decayedWeight,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            role: true,
          },
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'vote.cast',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId,
          voteId: vote.id,
          weight: baseWeight,
          timestamp: now.toISOString(),
        }),
      },
    });

    // Get updated vote statistics
    const voteStats = await prisma.vote.aggregate({
      where: { feedbackId },
      _count: true,
      _sum: {
        weight: true,
        decayedWeight: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          vote,
          stats: {
            count: voteStats._count,
            totalWeight: voteStats._sum.weight || 0,
            totalDecayedWeight: voteStats._sum.decayedWeight || 0,
          },
        },
        message: 'Vote cast successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/feedback/[id]/vote - Remove a vote from feedback
 *
 * Authorization:
 * - User must be authenticated
 * - User can only remove their own vote
 *
 * Returns:
 * - 204: Vote removed successfully
 * - 401: User not authenticated
 * - 404: Vote not found or feedback not found
 * - 500: Server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw ApiErrors.unauthorized('You must be logged in to remove a vote');
    }

    const { id: feedbackId } = await params;

    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
      },
    });

    if (!feedback) {
      throw ApiErrors.notFound('Feedback', 'Feedback item not found');
    }

    // Find user's vote
    const vote = await prisma.vote.findUnique({
      where: {
        feedbackId_userId: {
          feedbackId,
          userId: user.id,
        },
      },
    });

    if (!vote) {
      throw ApiErrors.notFound('Vote', 'You have not voted on this feedback');
    }

    // Delete the vote
    await prisma.vote.delete({
      where: {
        id: vote.id,
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'vote.removed',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId,
          voteId: vote.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/feedback/[id]/vote - Get current user's vote status
 *
 * Authorization:
 * - User must be authenticated
 *
 * Returns:
 * - 200: Vote information (or null if not voted)
 * - 401: User not authenticated
 * - 404: Feedback not found
 * - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw ApiErrors.unauthorized('You must be logged in to check vote status');
    }

    const { id: feedbackId } = await params;

    // Check if feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
      },
    });

    if (!feedback) {
      throw ApiErrors.notFound('Feedback', 'Feedback item not found');
    }

    // Find user's vote
    const vote = await prisma.vote.findUnique({
      where: {
        feedbackId_userId: {
          feedbackId,
          userId: user.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            role: true,
          },
        },
      },
    });

    // Calculate current decayed weight if vote exists
    let currentDecayedWeight = null;
    if (vote) {
      currentDecayedWeight = calculateDecayedWeight(vote.weight, vote.createdAt);
    }

    return NextResponse.json({
      hasVoted: vote !== null,
      vote: vote
        ? {
            ...vote,
            currentDecayedWeight,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
