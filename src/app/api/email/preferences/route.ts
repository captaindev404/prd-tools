/**
 * API endpoint for managing email notification preferences
 * GET /api/email/preferences - Get user's notification preferences
 * PUT /api/email/preferences - Update user's notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getOrCreateNotificationPreferences } from '@/lib/email/email-queue';

/**
 * GET /api/email/preferences
 * Get current user's notification preferences
 */
export async function GET() {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create preferences
    const preferences = await getOrCreateNotificationPreferences(session.user.id);

    return NextResponse.json({
      preferences: {
        feedbackUpdates: preferences.feedbackUpdates,
        roadmapUpdates: preferences.roadmapUpdates,
        researchInvites: preferences.researchInvites,
        weeklyDigest: preferences.weeklyDigest,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/email/preferences:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email/preferences
 * Update current user's notification preferences
 */
const updatePreferencesSchema = z.object({
  feedbackUpdates: z.enum(['real_time', 'daily', 'weekly', 'never']).optional(),
  roadmapUpdates: z.enum(['real_time', 'daily', 'weekly', 'never']).optional(),
  researchInvites: z.enum(['real_time', 'daily', 'weekly', 'never']).optional(),
  weeklyDigest: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const updates = updatePreferencesSchema.parse(body);

    // Get or create preferences
    await getOrCreateNotificationPreferences(session.user.id);

    // Update preferences
    const updatedPreferences = await prisma.notificationPreferences.update({
      where: { userId: session.user.id },
      data: updates,
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
    console.error('Error in PUT /api/email/preferences:', error);

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
