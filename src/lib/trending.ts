import { prisma } from '@/lib/prisma';
import { calculateDecayedWeight } from '@/lib/vote-weight';

/**
 * Trending Feedback Algorithm
 *
 * Implementation of trending algorithm per DSL requirements:
 * - Recent feedback (created in last 7-14 days)
 * - High vote count (weighted by recency)
 * - Uses vote decay algorithm (180-day half-life)
 *
 * Score Formula:
 * - Score = (weighted_votes * recency_factor) / age_in_days
 * - recency_factor = 2^(-age_in_days/180) to match vote decay
 */

export interface TrendingFeedbackItem {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  state: string;
  voteCount: number;
  totalWeight: number;
  trendingScore: number;
  author: {
    id: string;
    displayName: string | null;
    email: string;
  };
  feature: {
    id: string;
    title: string;
    area: string;
  } | null;
}

/**
 * Calculate trending score for feedback
 *
 * @param totalDecayedWeight - Sum of all decayed vote weights
 * @param ageInDays - Age of feedback in days
 * @returns Trending score
 */
function calculateTrendingScore(totalDecayedWeight: number, ageInDays: number): number {
  // Avoid division by zero for very recent feedback
  const adjustedAge = Math.max(0.1, ageInDays);

  // Score = weighted_votes / age_in_days
  // The decayed weight already includes recency factor
  return totalDecayedWeight / adjustedAge;
}

/**
 * Get trending feedback items
 *
 * @param options Configuration options
 * @returns Array of trending feedback items sorted by score
 */
export async function getTrendingFeedback(options: {
  maxAgeInDays?: number;
  limit?: number;
  minVotes?: number;
} = {}): Promise<TrendingFeedbackItem[]> {
  const {
    maxAgeInDays = 14,
    limit = 10,
    minVotes = 1,
  } = options;

  // Calculate cutoff date (feedback must be newer than this)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

  // Fetch recent feedback with votes
  const feedbackItems = await prisma.feedback.findMany({
    where: {
      createdAt: {
        gte: cutoffDate,
      },
      moderationStatus: 'approved', // Only show approved content
      state: {
        in: ['new', 'triaged', 'in_roadmap'], // Exclude closed/merged
      },
    },
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
        },
      },
      votes: {
        select: {
          weight: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate trending scores for each feedback
  const now = new Date();
  const trendingItems: TrendingFeedbackItem[] = [];

  for (const feedback of feedbackItems) {
    const voteCount = feedback.votes.length;

    // Skip if below minimum vote threshold
    if (voteCount < minVotes) {
      continue;
    }

    // Calculate total decayed weight
    const totalDecayedWeight = feedback.votes.reduce((sum, vote) => {
      return sum + calculateDecayedWeight(vote.weight, vote.createdAt);
    }, 0);

    // Calculate age in days
    const ageInDays = (now.getTime() - feedback.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate trending score
    const trendingScore = calculateTrendingScore(totalDecayedWeight, ageInDays);

    trendingItems.push({
      id: feedback.id,
      title: feedback.title,
      body: feedback.body,
      createdAt: feedback.createdAt,
      state: feedback.state,
      voteCount,
      totalWeight: totalDecayedWeight,
      trendingScore,
      author: feedback.author,
      feature: feedback.feature,
    });
  }

  // Sort by trending score (highest first) and limit results
  trendingItems.sort((a, b) => b.trendingScore - a.trendingScore);

  return trendingItems.slice(0, limit);
}

/**
 * Get trending feedback by product area
 *
 * @param area Product area to filter by
 * @param options Configuration options
 * @returns Array of trending feedback items for the area
 */
export async function getTrendingFeedbackByArea(
  area: string,
  options: {
    maxAgeInDays?: number;
    limit?: number;
    minVotes?: number;
  } = {}
): Promise<TrendingFeedbackItem[]> {
  const {
    maxAgeInDays = 14,
    limit = 5,
    minVotes = 1,
  } = options;

  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

  // Fetch recent feedback for specific area
  const feedbackItems = await prisma.feedback.findMany({
    where: {
      createdAt: {
        gte: cutoffDate,
      },
      moderationStatus: 'approved',
      state: {
        in: ['new', 'triaged', 'in_roadmap'],
      },
      feature: {
        area: area as any,
      },
    },
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
        },
      },
      votes: {
        select: {
          weight: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate trending scores
  const now = new Date();
  const trendingItems: TrendingFeedbackItem[] = [];

  for (const feedback of feedbackItems) {
    const voteCount = feedback.votes.length;

    if (voteCount < minVotes) {
      continue;
    }

    const totalDecayedWeight = feedback.votes.reduce((sum, vote) => {
      return sum + calculateDecayedWeight(vote.weight, vote.createdAt);
    }, 0);

    const ageInDays = (now.getTime() - feedback.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const trendingScore = calculateTrendingScore(totalDecayedWeight, ageInDays);

    trendingItems.push({
      id: feedback.id,
      title: feedback.title,
      body: feedback.body,
      createdAt: feedback.createdAt,
      state: feedback.state,
      voteCount,
      totalWeight: totalDecayedWeight,
      trendingScore,
      author: feedback.author,
      feature: feedback.feature,
    });
  }

  trendingItems.sort((a, b) => b.trendingScore - a.trendingScore);

  return trendingItems.slice(0, limit);
}
