/**
 * POST /api/ai/categorize - Categorize feedback using AI
 *
 * Analyzes feedback content and suggests product area categorization.
 * Requires authentication. Rate limited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { categorizeFeedback } from '@/lib/ai/categorization';
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
          message: 'AI categorization is not currently available. Please contact your administrator.',
        },
        { status: 503 }
      );
    }

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      throw ApiErrors.unauthorized('You must be logged in to use AI features');
    }

    // Check AI rate limit (100 requests per minute per user)
    const rateLimitCheck = checkAIRateLimit(user.id, 100, 60000);
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
    const { title, body: feedbackBody, feedbackId, confidenceThreshold } = body;

    // Validation
    if (!title || typeof title !== 'string') {
      throw ApiErrors.badRequest('Title is required');
    }

    if (!feedbackBody || typeof feedbackBody !== 'string') {
      throw ApiErrors.badRequest('Body is required');
    }

    // Call AI categorization
    const result = await categorizeFeedback(title, feedbackBody, confidenceThreshold || 0.6);

    const latencyMs = Date.now() - startTime;

    // Log AI usage
    await prisma.aIUsageLog.create({
      data: {
        operation: 'categorization',
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        userId: user.id,
        feedbackId: feedbackId || null,
        success: !!result,
        latencyMs,
        result: JSON.stringify(result || {}),
        confidence: result?.confidence,
        // Note: Token counts would come from OpenAI response metadata
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
      },
    });

    // If feedbackId provided, save AI metadata
    if (feedbackId && result) {
      await prisma.feedbackAIMetadata.upsert({
        where: { feedbackId },
        create: {
          feedbackId,
          aiProductArea: result.productArea,
          categorizationConfidence: result.confidence,
          categorizationReasoning: result.reasoning,
        },
        update: {
          aiProductArea: result.productArea,
          categorizationConfidence: result.confidence,
          categorizationReasoning: result.reasoning,
          updatedAt: new Date(),
        },
      });
    }

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: 'Could not categorize feedback with sufficient confidence',
          data: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Feedback categorized successfully',
    });
  } catch (error) {
    // Log failed AI usage
    try {
      const user = await getCurrentUser();
      if (user) {
        await prisma.aIUsageLog.create({
          data: {
            operation: 'categorization',
            model: process.env.AI_MODEL || 'gpt-4o-mini',
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
