import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findDuplicates } from '@/lib/fuzzy-match';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feedback/check-duplicates - Check for similar feedback by title
 *
 * Query params:
 * - title: string (required) - Title to check for duplicates
 *
 * Uses Dice coefficient fuzzy matching with 0.86 threshold (per DSL spec)
 *
 * Returns:
 * - Array of similar feedback items with similarity scores
 * - Sorted by similarity (highest first)
 * - Includes vote counts for each item
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    if (!title || title.length < 8) {
      return NextResponse.json({
        hasDuplicates: false,
        count: 0,
        duplicates: [],
      });
    }

    // Find duplicates using fuzzy matching
    const duplicates = await findDuplicates(title);

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
          state: dup.state,
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
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to check duplicates. Please try again later.',
      },
      { status: 500 }
    );
  }
}
