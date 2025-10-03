import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { prisma } from '@/lib/prisma';
import { redactPII, containsPII } from '@/lib/pii-redact';
import { getCurrentUser } from '@/lib/auth-helpers';
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { performAutoScreening } from '@/lib/moderation';
import { checkToxicity, shouldAutoFlag } from '@/lib/moderation-advanced';
import type { CreateFeedbackInput, FeedbackFilters } from '@/types/feedback';
import type { FeedbackState, ProductArea } from '@prisma/client';

/**
 * POST /api/feedback - Create new feedback
 *
 * Request body:
 * - title: string (8-120 chars)
 * - body: string (20-5000 chars)
 * - featureId?: string (optional)
 * - villageId?: string (optional)
 * - source?: 'app' | 'web' | 'kiosk' | 'support' | 'import'
 * - visibility?: 'public' | 'internal'
 *
 * Features:
 * - PII redaction in title and body
 * - Rate limiting (10 per user per day)
 * - 15-minute edit window
 * - Auto moderation status: auto_pending
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to submit feedback' },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(user.id);
    if (rateLimitCheck.isExceeded) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have reached the maximum of 10 feedback submissions per day. Please try again after ${rateLimitCheck.resetAt.toISOString()}`,
          resetAt: rateLimitCheck.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body: CreateFeedbackInput = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (!body.title || typeof body.title !== 'string') {
      errors.push({ field: 'title', message: 'Title is required' });
    } else if (body.title.length < 8) {
      errors.push({ field: 'title', message: 'Title must be at least 8 characters' });
    } else if (body.title.length > 120) {
      errors.push({ field: 'title', message: 'Title must not exceed 120 characters' });
    }

    if (!body.body || typeof body.body !== 'string') {
      errors.push({ field: 'body', message: 'Body is required' });
    } else if (body.body.length < 20) {
      errors.push({ field: 'body', message: 'Body must be at least 20 characters' });
    } else if (body.body.length > 5000) {
      errors.push({ field: 'body', message: 'Body must not exceed 5000 characters' });
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

    // Apply PII redaction
    const redactedTitle = redactPII(body.title);
    const redactedBody = redactPII(body.body);

    // Perform auto-screening (spam, off-topic, PII)
    const screeningResult = performAutoScreening(body.title, body.body, containsPII);

    // Run advanced toxicity detection
    const fullText = `${body.title} ${body.body}`;
    const advancedToxicityScore = await checkToxicity(fullText);

    // Use the higher toxicity score (advanced or basic)
    const finalToxicityScore = Math.max(screeningResult.toxicityScore, advancedToxicityScore);

    // Update needsReview if advanced toxicity detection flags content
    const needsReview = screeningResult.needsReview || shouldAutoFlag(finalToxicityScore);

    // Update moderation status and signals
    const moderationStatus = needsReview ? 'pending_review' : 'approved';
    const signals = [...screeningResult.signals];
    if (finalToxicityScore >= 0.7 && !signals.includes('toxicity')) {
      signals.push('toxicity');
    }

    // Calculate edit window (15 minutes from now)
    const editWindowEndsAt = new Date(Date.now() + 15 * 60 * 1000);

    // Create feedback with enhanced moderation data
    const feedback = await prisma.feedback.create({
      data: {
        id: `fb_${ulid()}`,
        authorId: user.id,
        title: redactedTitle,
        body: redactedBody,
        featureId: body.featureId || null,
        villageId: body.villageId || user.currentVillageId || null,
        visibility: body.visibility || 'public',
        source: body.source || 'app',
        state: 'new',
        // Enhanced moderation fields
        moderationStatus,
        moderationSignals: JSON.stringify(signals),
        toxicityScore: finalToxicityScore,
        spamScore: screeningResult.spamScore,
        offTopicScore: screeningResult.offTopicScore,
        hasPii: screeningResult.hasPii,
        needsReview,
        attachments: '[]',
        i18nData: '{}',
        editWindowEndsAt,
      },
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

    // Increment rate limit counter
    incrementRateLimit(user.id);

    // Log event
    await prisma.event.create({
      data: {
        type: 'feedback.created',
        userId: user.id,
        payload: JSON.stringify({
          feedbackId: feedback.id,
          title: feedback.title,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        data: feedback,
        message: 'Feedback submitted successfully',
      },
      { status: 201 }
    );

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create feedback. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback - List feedback with pagination
 *
 * Query parameters:
 * - state?: FeedbackState | FeedbackState[] (filter by state)
 * - area?: ProductArea (filter by feature area)
 * - villageId?: string (filter by village)
 * - featureId?: string (filter by feature)
 * - authorId?: string (filter by author)
 * - search?: string (search in title and body)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 * - sortBy?: 'createdAt' | 'updatedAt' | 'votes' (default: 'createdAt')
 * - sortOrder?: 'asc' | 'desc' (default: 'desc')
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const state = searchParams.get('state') as FeedbackState | null;
    const area = searchParams.get('area') as ProductArea | null;
    const villageId = searchParams.get('villageId');
    const featureId = searchParams.get('featureId');
    const authorId = searchParams.get('authorId');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20'))); // Max 50 per DSL spec
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'updatedAt' | 'votes';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: any = {};

    if (state) {
      where.state = state;
    }

    if (featureId) {
      where.featureId = featureId;
    }

    if (villageId) {
      where.villageId = villageId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by feature area if provided
    if (area) {
      where.feature = {
        area,
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get current user for vote status
    const currentUser = await getCurrentUser();

    // Determine ordering strategy based on sortBy
    let feedbackItems: any[];
    let total: number;

    if (sortBy === 'votes') {
      // OPTIMIZED: For vote sorting, use a subquery to calculate vote weights
      // This is more efficient than fetching all feedback and calculating in-memory

      // First, get the total count
      total = await prisma.feedback.count({ where });

      // Use raw SQL for efficient vote-based sorting with pagination
      // This approach calculates vote weights in a single query
      const feedbackIds = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `
        SELECT f.id
        FROM Feedback f
        LEFT JOIN (
          SELECT feedbackId, SUM(decayedWeight) as totalWeight
          FROM Vote
          GROUP BY feedbackId
        ) v ON f.id = v.feedbackId
        WHERE 1=1
        ${state ? `AND f.state = '${state}'` : ''}
        ${featureId ? `AND f.featureId = '${featureId}'` : ''}
        ${villageId ? `AND f.villageId = '${villageId}'` : ''}
        ${authorId ? `AND f.authorId = '${authorId}'` : ''}
        ORDER BY COALESCE(v.totalWeight, 0) ${sortOrder === 'desc' ? 'DESC' : 'ASC'}
        LIMIT ${limit} OFFSET ${skip}
        `
      );

      // Fetch full feedback data for the sorted IDs
      if (feedbackIds.length > 0) {
        feedbackItems = await prisma.feedback.findMany({
          where: {
            id: { in: feedbackIds.map(f => f.id) },
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
            _count: {
              select: {
                votes: true,
              },
            },
          },
        });

        // Sort feedbackItems to match the order from the raw query
        const idOrder = feedbackIds.map(f => f.id);
        feedbackItems.sort((a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id));
      } else {
        feedbackItems = [];
      }
    } else {
      // For other sorting, use database sorting with optimized includes
      const [items, totalCount] = await Promise.all([
        prisma.feedback.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder,
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
            _count: {
              select: {
                votes: true,
              },
            },
          },
        }),
        prisma.feedback.count({ where }),
      ]);

      feedbackItems = items;
      total = totalCount;
    }

    // OPTIMIZED: Batch calculate vote weights and user votes
    const feedbackIds = feedbackItems.map(f => f.id);

    // Get vote stats for all feedback in one query
    const voteStats = await prisma.vote.groupBy({
      by: ['feedbackId'],
      where: {
        feedbackId: { in: feedbackIds },
      },
      _sum: {
        weight: true,
        decayedWeight: true,
      },
      _count: true,
    });

    // Create a map for quick lookup
    const voteStatsMap = new Map(
      voteStats.map(stat => [
        stat.feedbackId,
        {
          voteCount: stat._count,
          totalWeight: stat._sum.decayedWeight || 0,
        },
      ])
    );

    // Get user votes in one query if user is logged in
    let userVotesMap = new Map<string, boolean>();
    if (currentUser && feedbackIds.length > 0) {
      const userVotes = await prisma.vote.findMany({
        where: {
          userId: currentUser.id,
          feedbackId: { in: feedbackIds },
        },
        select: {
          feedbackId: true,
        },
      });

      userVotesMap = new Map(userVotes.map(v => [v.feedbackId, true]));
    }

    // Combine all data efficiently
    const feedbackWithUserVotes = feedbackItems.map(feedback => {
      const stats = voteStatsMap.get(feedback.id) || { voteCount: 0, totalWeight: 0 };
      const userHasVoted = userVotesMap.get(feedback.id) || false;

      return {
        ...feedback,
        voteCount: stats.voteCount,
        totalWeight: stats.totalWeight,
        userHasVoted,
      };
    });

    const response = NextResponse.json({
      items: feedbackWithUserVotes,
      total,
      page,
      limit,
      hasMore: skip + feedbackItems.length < total,
    });

    return addRateLimitHeaders(response, request);
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
