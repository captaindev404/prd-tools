/**
 * API endpoint for unsubscribe functionality
 * GET /api/email/unsubscribe?token=xxx - Get preferences by token
 * PUT /api/email/unsubscribe - Update preferences by token
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/email/unsubscribe?token=xxx
 * Get notification preferences by unsubscribe token (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          error: 'Token is required',
        },
        { status: 400 }
      );
    }

    // Find preferences by token
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { unsubscribeToken: token },
      select: {
        feedbackUpdates: true,
        roadmapUpdates: true,
        researchInvites: true,
        weeklyDigest: true,
      },
    });

    if (!preferences) {
      return NextResponse.json(
        {
          error: 'Invalid token',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      preferences,
    });
  } catch (error) {
    console.error('Error in GET /api/email/unsubscribe:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email/unsubscribe
 * Update notification preferences by token (public endpoint)
 */
const updateByTokenSchema = z.object({
  token: z.string(),
  preferences: z.object({
    feedbackUpdates: z.enum(['real_time', 'daily', 'weekly', 'never']),
    roadmapUpdates: z.enum(['real_time', 'daily', 'weekly', 'never']),
    researchInvites: z.enum(['real_time', 'daily', 'weekly', 'never']),
    weeklyDigest: z.boolean(),
  }),
});

export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { token, preferences } = updateByTokenSchema.parse(body);

    // Find preferences by token
    const existingPrefs = await prisma.notificationPreferences.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!existingPrefs) {
      return NextResponse.json(
        {
          error: 'Invalid token',
        },
        { status: 404 }
      );
    }

    // Update preferences
    const updatedPreferences = await prisma.notificationPreferences.update({
      where: { unsubscribeToken: token },
      data: preferences,
    });

    return NextResponse.json({
      success: true,
      preferences: {
        feedbackUpdates: updatedPreferences.feedbackUpdates,
        roadmapUpdates: updatedPreferences.roadmapUpdates,
        researchInvites: updatedPreferences.researchInvites,
        weeklyDigest: updatedPreferences.weeklyDigest,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/email/unsubscribe:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
