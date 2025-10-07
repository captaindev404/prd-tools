import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canMergeFeedback } from '@/lib/auth-helpers';
import type { MergeFeedbackInput } from '@/types/feedback';

/**
 * POST /api/feedback/[id]/merge - Merge feedback into another item
 *
 * Authorization:
 * - User must have PM, PO, MODERATOR, or ADMIN role
 *
 * Request body:
 * - targetId: string (ID of feedback to merge into)
 *
 * Process:
 * 1. Validate both feedback items exist
 * 2. Prevent circular merges or merging already merged items
 * 3. Set current feedback state to 'merged'
 * 4. Set duplicateOfId to target
 * 5. Transfer all votes from current to target
 * 6. Use transaction for atomicity
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
        { error: 'Unauthorized', message: 'You must be logged in to merge feedback' },
        { status: 401 }
      );
    }

    // Check authorization - only PM, PO, MODERATOR, ADMIN can merge
    if (!canMergeFeedback(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to merge feedback items',
        },
        { status: 403 }
      );
    }

    const sourceFeedbackId = params.id;

    // Parse request body
    const body: MergeFeedbackInput = await request.json();

    if (!body.targetId || typeof body.targetId !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'targetId is required and must be a string',
        },
        { status: 400 }
      );
    }

    const targetFeedbackId = body.targetId;

    // Cannot merge into itself
    if (sourceFeedbackId === targetFeedbackId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Cannot merge feedback into itself',
        },
        { status: 400 }
      );
    }

    // Verify both feedback items exist
    const [sourceFeedback, targetFeedback] = await Promise.all([
      prisma.feedback.findUnique({
        where: { id: sourceFeedbackId },
        select: {
          id: true,
          title: true,
          state: true,
          duplicateOfId: true,
        },
      }),
      prisma.feedback.findUnique({
        where: { id: targetFeedbackId },
        select: {
          id: true,
          title: true,
          state: true,
          duplicateOfId: true,
        },
      }),
    ]);

    if (!sourceFeedback) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Source feedback item not found',
        },
        { status: 404 }
      );
    }

    if (!targetFeedback) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Target feedback item not found',
        },
        { status: 404 }
      );
    }

    // Prevent merging already merged items
    if (sourceFeedback.state === 'merged') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Source feedback has already been merged',
        },
        { status: 400 }
      );
    }

    // Prevent merging into a merged item (should merge into the canonical one)
    if (targetFeedback.state === 'merged') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message:
            'Target feedback has been merged into another item. Please merge into the canonical item instead.',
        },
        { status: 400 }
      );
    }

    // Prevent circular merges
    if (targetFeedback.duplicateOfId === sourceFeedbackId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Circular merge detected. Target is already marked as duplicate of source.',
        },
        { status: 400 }
      );
    }

    // Perform merge in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update source feedback
      await tx.feedback.update({
        where: { id: sourceFeedbackId },
        data: {
          state: 'merged',
          duplicateOfId: targetFeedbackId,
        },
      });

      // Get all votes from source feedback
      const votesToMigrate = await tx.vote.findMany({
        where: { feedbackId: sourceFeedbackId },
      });

      // Transfer votes to target
      // For each vote, check if user has already voted on target
      for (const vote of votesToMigrate) {
        const existingVote = await tx.vote.findUnique({
          where: {
            feedbackId_userId: {
              feedbackId: targetFeedbackId,
              userId: vote.userId,
            },
          },
        });

        if (!existingVote) {
          // Create new vote on target
          await tx.vote.create({
            data: {
              feedbackId: targetFeedbackId,
              userId: vote.userId,
              weight: vote.weight,
              decayedWeight: vote.decayedWeight,
              createdAt: vote.createdAt,
            },
          });
        }
        // If user already voted on target, keep the existing vote
      }

      // Delete votes from source (they've been migrated)
      await tx.vote.deleteMany({
        where: { feedbackId: sourceFeedbackId },
      });

      return votesToMigrate.length;
    });

    // Log merge event
    await prisma.event.create({
      data: {
        type: 'feedback.merged',
        userId: user.id,
        payload: JSON.stringify({
          sourceFeedbackId,
          targetFeedbackId,
          votesMigrated: result,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      mergedId: sourceFeedbackId,
      targetId: targetFeedbackId,
      votesMigrated: result,
      message: `Successfully merged feedback into ${targetFeedbackId}. ${result} vote(s) migrated.`,
    });
  } catch (error) {
    console.error('Error merging feedback:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to merge feedback. Please try again later.',
      },
      { status: 500 }
    );
  }
}
