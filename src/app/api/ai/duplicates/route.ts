/**
 * POST /api/ai/duplicates - Find semantic duplicates using AI embeddings
 *
 * Uses OpenAI embeddings to find semantically similar feedback.
 * More accurate than fuzzy string matching.
 * Requires authentication. Rate limited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { findSemanticDuplicates, findAllDuplicates } from '@/lib/ai/duplicate-detection';
import { getCurrentUser } from '@/lib/auth-helpers';
import { checkAIRateLimit, isAIEnabled } from '@/lib/ai/openai-client';
import { prisma } from '@/lib/prisma';
import { handleApiError, ApiErrors } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if AI is enabled
    if (!isAIEnabled()) {
      return NextResponse.json(
        {
          error: 'AI features are disabled',
          message: 'AI duplicate detection is not currently available. Please contact your administrator.',
        },
        { status: 503 }
      );
    }

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw ApiErrors.unauthorized('You must be logged in to use AI features');
    }

    // Check AI rate limit (lower limit for embeddings as they're more expensive)
    const rateLimitCheck = checkAIRateLimit(user.id, 50, 60000);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many AI requests. Please try again later.',
          resetAt: rateLimitCheck.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, body: feedbackBody, feedbackId, threshold, combineWithFuzzy } = body;

    // Validation
    if (!title || typeof title !== 'string') {
      throw ApiErrors.badRequest('Title is required');
    }

    if (!feedbackBody || typeof feedbackBody !== 'string') {
      throw ApiErrors.badRequest('Body is required');
    }

    let result;

    // Call AI duplicate detection
    if (combineWithFuzzy) {
      // Combine fuzzy and semantic detection
      result = await findAllDuplicates(title, feedbackBody);
    } else {
      // Semantic only
      const duplicates = await findSemanticDuplicates(title, feedbackBody, threshold || 0.85);
      result = { semanticDuplicates: duplicates };
    }

    const latencyMs = Date.now() - startTime;

    // Log AI usage
    await prisma.aIUsageLog.create({
      data: {
        operation: 'duplicate_detection',
        model: 'text-embedding-3-small',
        userId: user.id,
        feedbackId: feedbackId || null,
        success: true,
        latencyMs,
        result: JSON.stringify({
          duplicateCount: result.semanticDuplicates?.length || 0,
        }),
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
      },
    });

    // If feedbackId provided, save semantic duplicates
    if (feedbackId && result.semanticDuplicates) {
      const duplicateIds = result.semanticDuplicates.map((d) => ({
        feedbackId: d.id,
        similarity: d.similarity,
      }));

      await prisma.feedbackAIMetadata.upsert({
        where: { feedbackId },
        create: {
          feedbackId,
          semanticDuplicates: JSON.stringify(duplicateIds),
          duplicateCheckAt: new Date(),
        },
        update: {
          semanticDuplicates: JSON.stringify(duplicateIds),
          duplicateCheckAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasDuplicates: (result.semanticDuplicates?.length || 0) > 0,
        count: result.semanticDuplicates?.length || 0,
        duplicates: result.semanticDuplicates || [],
        fuzzyDuplicates: result.fuzzyDuplicates || [],
        combinedDuplicates: result.combinedDuplicates || [],
      },
      message: 'Duplicate check completed successfully',
    });
  } catch (error) {
    // Log failed AI usage
    try {
      const user = await getCurrentUser();
      if (user) {
        await prisma.aIUsageLog.create({
          data: {
            operation: 'duplicate_detection',
            model: 'text-embedding-3-small',
            userId: user.id,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            latencyMs: Date.now() - startTime,
            result: '{}',
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
        });
      }
    } catch (logError) {
      console.error('Failed to log AI error:', logError);
    }

    return handleApiError(error);
  }
}
