import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';

/**
 * Vote Weight Calculation for Odyssey Feedback Platform
 *
 * Implements weighted voting system per DSL spec:
 * - Role multipliers: USER=1.0, PM=2.0, PO=3.0, RESEARCHER=1.5, MODERATOR=1.0, ADMIN=1.0
 * - Village priority bonus: high=1.5, medium=1.0, low=0.5 (default to medium if not set)
 * - Panel membership boost: +0.3 weight
 * - Time decay: 180-day half-life (weight × 2^(-days_since_vote/180))
 */

/**
 * Role weight multipliers as defined in DSL
 */
const ROLE_WEIGHTS: Record<Role, number> = {
  USER: 1.0,
  PM: 2.0,
  PO: 3.0,
  RESEARCHER: 1.5,
  ADMIN: 1.0,
  MODERATOR: 1.0,
};

/**
 * Village priority multipliers
 * Note: In future iterations, this can be stored in the database
 */
const VILLAGE_PRIORITY_WEIGHTS: Record<string, number> = {
  high: 1.5,
  medium: 1.0,
  low: 0.5,
};

/**
 * Panel membership bonus (added to base weight)
 */
const PANEL_MEMBERSHIP_BOOST = 0.3;

/**
 * Half-life for vote decay in days
 */
const VOTE_DECAY_HALF_LIFE_DAYS = 180;

/**
 * Calculate the base vote weight for a user
 * Does not include time decay (that's applied separately)
 *
 * @param userId - User ID who is casting the vote
 * @param feedbackId - Feedback item being voted on
 * @returns Base weight before time decay
 */
export async function calculateBaseVoteWeight(
  userId: string,
  feedbackId: string
): Promise<number> {
  // Fetch user with role and village information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      currentVillageId: true,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Start with role weight
  let weight = ROLE_WEIGHTS[user.role] || 1.0;

  // Check if user is a member of any panel related to this feedback
  const panelMemberships = await prisma.panelMembership.findMany({
    where: {
      userId,
      active: true,
    },
    select: {
      panelId: true,
    },
  });

  // If user belongs to any active panel, apply panel boost
  if (panelMemberships.length > 0) {
    weight += PANEL_MEMBERSHIP_BOOST;
  }

  // Fetch feedback to check village context
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      villageId: true,
    },
  });

  if (!feedback) {
    throw new Error(`Feedback not found: ${feedbackId}`);
  }

  // Apply village priority multiplier if feedback has village context
  // For now, we default to medium priority (1.0)
  // In future iterations, village priority could be stored in a Village table
  // or as metadata in the Feedback model
  const villagePriorityMultiplier = VILLAGE_PRIORITY_WEIGHTS.medium;
  weight *= villagePriorityMultiplier;

  return weight;
}

/**
 * Calculate vote weight with time decay applied
 *
 * Formula: weight × 2^(-days_since_vote/180)
 *
 * @param baseWeight - Base weight before decay
 * @param voteCreatedAt - When the vote was cast
 * @returns Decayed weight
 */
export function calculateDecayedWeight(
  baseWeight: number,
  voteCreatedAt: Date
): number {
  const now = new Date();
  const daysSinceVote = (now.getTime() - voteCreatedAt.getTime()) / (1000 * 60 * 60 * 24);

  // Apply exponential decay: weight × 2^(-days/half_life)
  const decayFactor = Math.pow(2, -daysSinceVote / VOTE_DECAY_HALF_LIFE_DAYS);
  const decayedWeight = baseWeight * decayFactor;

  return decayedWeight;
}

/**
 * Calculate the full vote weight including decay for a specific vote
 *
 * @param voteId - Vote ID
 * @returns Current weight with decay applied
 */
export async function calculateVoteWeight(voteId: string): Promise<number> {
  const vote = await prisma.vote.findUnique({
    where: { id: voteId },
    select: {
      weight: true,
      createdAt: true,
    },
  });

  if (!vote) {
    throw new Error(`Vote not found: ${voteId}`);
  }

  return calculateDecayedWeight(vote.weight, vote.createdAt);
}

/**
 * Calculate and update decayed weights for all votes on a feedback item
 * This can be run periodically or on-demand when displaying feedback
 *
 * @param feedbackId - Feedback item ID
 */
export async function updateDecayedWeights(feedbackId: string): Promise<void> {
  const votes = await prisma.vote.findMany({
    where: { feedbackId },
    select: {
      id: true,
      weight: true,
      createdAt: true,
    },
  });

  // Update each vote's decayed weight
  await Promise.all(
    votes.map((vote) => {
      const decayedWeight = calculateDecayedWeight(vote.weight, vote.createdAt);
      return prisma.vote.update({
        where: { id: vote.id },
        data: { decayedWeight },
      });
    })
  );
}

/**
 * Get aggregated vote statistics for a feedback item
 * Applies current decay to all votes
 *
 * @param feedbackId - Feedback item ID
 * @returns Vote statistics with count and total weight
 */
export async function getVoteStats(feedbackId: string): Promise<{
  count: number;
  totalWeight: number;
  totalDecayedWeight: number;
}> {
  const votes = await prisma.vote.findMany({
    where: { feedbackId },
    select: {
      weight: true,
      createdAt: true,
    },
  });

  const count = votes.length;
  const totalWeight = votes.reduce((sum, vote) => sum + vote.weight, 0);
  const totalDecayedWeight = votes.reduce(
    (sum, vote) => sum + calculateDecayedWeight(vote.weight, vote.createdAt),
    0
  );

  return {
    count,
    totalWeight,
    totalDecayedWeight,
  };
}

/**
 * Check if a user has already voted on a feedback item
 *
 * @param userId - User ID
 * @param feedbackId - Feedback item ID
 * @returns True if user has voted, false otherwise
 */
export async function hasUserVoted(
  userId: string,
  feedbackId: string
): Promise<boolean> {
  const vote = await prisma.vote.findUnique({
    where: {
      feedbackId_userId: {
        feedbackId,
        userId,
      },
    },
  });

  return vote !== null;
}
