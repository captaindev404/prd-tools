import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findDuplicates } from '@/lib/fuzzy-match';

/**
 * GET /api/feedback/[id]/duplicates - Find similar feedback items
 *
 * Uses Dice coefficient fuzzy matching with 0.86 threshold (per DSL spec)
 *
 * Returns:
 * - Array of similar feedback items with similarity scores
 * - Sorted by similarity (highest first)
 * - Includes vote counts for each item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedbackId = params.id;

    // Get the feedback item to check for duplicates
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
        title: true,
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

    // Find duplicates using fuzzy matching
    const duplicates = await findDuplicates(feedback.title, feedback.id);

    // Fetch vote counts for each duplicate
    const duplicatesWithVotes = await Promise.all(
      duplicates.map(async (dup) => {
        const voteStats = await prisma.vote.aggregate({
          where: { feedbackId: dup.id },
          _sum: {
            decayedWeight: true,
          },
          _count: true,
        });

        return {
          id: dup.id,
          title: dup.title,
          body: dup.body,
          state: dup.state,
          createdAt: dup.createdAt,
          similarity: dup.similarity,
          voteCount: voteStats._count || 0,
          voteWeight: voteStats._sum.decayedWeight || 0,
        };
      })
    );

    return NextResponse.json({
      hasDuplicates: duplicatesWithVotes.length > 0,
      count: duplicatesWithVotes.length,
      duplicates: duplicatesWithVotes,
    });
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to find duplicates. Please try again later.',
      },
      { status: 500 }
    );
  }
}
