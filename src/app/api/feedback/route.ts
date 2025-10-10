import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { prisma } from '@/lib/prisma';
import { redactPII, containsPII } from '@/lib/pii-redact';
import { getCurrentUser } from '@/lib/auth-helpers';
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { performAutoScreening } from '@/lib/moderation';
import { checkToxicity, shouldAutoFlag } from '@/lib/moderation-advanced';
import { handleApiError, ApiErrors } from '@/lib/api-errors';
import type { CreateFeedbackInput, FeedbackFilters, Attachment } from '@/types/feedback';
import type { FeedbackState } from '@prisma/client';
import { ProductArea } from '@prisma/client';
import { moveFile, deleteFile, FILE_UPLOAD_LIMITS } from '@/lib/file-upload';
import * as path from 'path';

/**
 * POST /api/feedback - Create new feedback
 *
 * Request body:
 * - title: string (8-120 chars)
 * - body: string (20-5000 chars)
 * - featureId?: string (optional)
 * - productArea?: 'Reservations' | 'CheckIn' | 'Payments' | 'Housekeeping' | 'Backoffice' (optional)
 * - villageId?: string (optional)
 * - source?: 'app' | 'web' | 'kiosk' | 'support' | 'import'
 * - visibility?: 'public' | 'internal'
 * - attachments?: Array<Attachment> (optional, max 5 files)
 *
 * Features:
 * - PII redaction in title and body
 * - Rate limiting (10 per user per day)
 * - 15-minute edit window
 * - Auto moderation status: auto_pending
 * - File attachment support (moves files from temp to feedback folder)
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw ApiErrors.unauthorized('You must be logged in to submit feedback');
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
    let body: CreateFeedbackInput;
    try {
      body = await request.json();
    } catch (error) {
      throw ApiErrors.badRequest('Invalid JSON in request body');
    }

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

    // Validate productArea if provided
    if (body.productArea !== undefined && body.productArea !== null) {
      const validAreas = ['Reservations', 'CheckIn', 'Payments', 'Housekeeping', 'Backoffice'];
      if (!validAreas.includes(body.productArea as string)) {
        errors.push({
          field: 'productArea',
          message: `Invalid product area. Must be one of: ${validAreas.join(', ')}`,
        });
      }
    }

    // Validate attachments if provided
    if (body.attachments !== undefined) {
      if (!Array.isArray(body.attachments)) {
        errors.push({
          field: 'attachments',
          message: 'Attachments must be an array',
        });
      } else if (body.attachments.length > FILE_UPLOAD_LIMITS.MAX_FILES) {
        errors.push({
          field: 'attachments',
          message: `Maximum ${FILE_UPLOAD_LIMITS.MAX_FILES} attachments allowed`,
        });
      } else {
        // Validate each attachment structure
        body.attachments.forEach((attachment, index) => {
          if (!attachment.id || typeof attachment.id !== 'string') {
            errors.push({
              field: `attachments[${index}].id`,
              message: 'Attachment ID is required',
            });
          }
          if (!attachment.originalName || typeof attachment.originalName !== 'string') {
            errors.push({
              field: `attachments[${index}].originalName`,
              message: 'Attachment originalName is required',
            });
          }
          if (!attachment.storedName || typeof attachment.storedName !== 'string') {
            errors.push({
              field: `attachments[${index}].storedName`,
              message: 'Attachment storedName is required',
            });
          }
          if (!attachment.url || typeof attachment.url !== 'string') {
            errors.push({
              field: `attachments[${index}].url`,
              message: 'Attachment URL is required',
            });
          }
          if (typeof attachment.size !== 'number' || attachment.size <= 0) {
            errors.push({
              field: `attachments[${index}].size`,
              message: 'Attachment size must be a positive number',
            });
          }
          if (!attachment.mimeType || typeof attachment.mimeType !== 'string') {
            errors.push({
              field: `attachments[${index}].mimeType`,
              message: 'Attachment mimeType is required',
            });
          }
        });
      }
    }

    if (errors.length > 0) {
      throw ApiErrors.validationError(errors, 'Please check your input and try again');
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

    // Generate feedback ID early so we can move files to the correct directory
    const feedbackId = `fb_${ulid()}`;

    // Process attachments: move from temp to feedback directory
    let processedAttachments: Attachment[] = [];
    const tempFilePaths: string[] = []; // Track temp files for cleanup on error

    if (body.attachments && body.attachments.length > 0) {
      try {
        for (const attachment of body.attachments) {
          // Extract temp file path from URL
          // URL format: /uploads/feedback/temp/{storedName}
          const tempPath = path.join(
            process.cwd(),
            'public',
            'uploads',
            'feedback',
            'temp',
            attachment.storedName
          );
          tempFilePaths.push(tempPath);

          // Move file from temp to feedback directory
          const movedFile = await moveFile(tempPath, feedbackId);

          // Update attachment with new URL
          processedAttachments.push({
            id: attachment.id,
            originalName: attachment.originalName,
            storedName: attachment.storedName,
            url: movedFile.filePath, // Updated URL with feedbackId
            size: attachment.size,
            mimeType: attachment.mimeType,
            uploadedAt: attachment.uploadedAt || new Date().toISOString(),
          });
        }
      } catch (error) {
        // If moving files fails, we should not create the feedback
        // Clean up any successfully moved files would be complex here
        // The temp cleanup cron will handle orphaned temp files
        console.error('Failed to process attachments:', error);
        throw ApiErrors.badRequest(
          `Failed to process file attachments: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Create feedback with enhanced moderation data
    const feedback = await prisma.feedback.create({
      data: {
        id: feedbackId,
        authorId: user.id,
        title: redactedTitle,
        body: redactedBody,
        featureId: body.featureId || null,
        productArea: body.productArea || null,
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
        attachments: JSON.stringify(processedAttachments),
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
          attachmentCount: processedAttachments.length,
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
    return handleApiError(error);
  }
}

/**
 * GET /api/feedback - List feedback with pagination
 *
 * Query parameters:
 * - state?: FeedbackState | FeedbackState[] (filter by state)
 * - area?: ProductArea (filter by feature area)
 * - productArea?: ProductArea (filter by feedback's productArea field directly)
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
    const productArea = searchParams.get('productArea') as ProductArea | null;
    const villageId = searchParams.get('villageId');
    const featureId = searchParams.get('featureId');
    const authorId = searchParams.get('authorId');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20'))); // Max 50 per DSL spec
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'updatedAt' | 'votes';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Validate productArea if provided
    if (productArea) {
      const validAreas = Object.values(ProductArea);
      if (!validAreas.includes(productArea as ProductArea)) {
        return NextResponse.json(
          {
            error: 'Invalid productArea',
            message: `Product area must be one of: ${validAreas.join(', ')}`,
            validValues: validAreas,
          },
          { status: 400 }
        );
      }
    }

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

    // Filter by productArea if provided (direct field on feedback)
    if (productArea) {
      where.productArea = productArea;
    }

    // Filter by feature area if provided (related feature's area)
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
            village: {
              select: {
                id: true,
                name: true,
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
            village: {
              select: {
                id: true,
                name: true,
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
    return handleApiError(error);
  }
}
