import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';

/**
 * GET /api/user/profile - Get current user profile
 *
 * Returns:
 * - User profile including consent flags
 */
export async function GET(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to view your profile' },
        { status: 401 }
      );
    }

    // Fetch full user details from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        employeeId: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        preferredLanguage: true,
        role: true,
        currentVillageId: true,
        currentVillage: {
          select: {
            id: true,
            name: true,
          },
        },
        villageHistory: true,
        consents: true,
        consentHistory: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Not found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const villageHistory = JSON.parse(dbUser.villageHistory);
    const consents = JSON.parse(dbUser.consents);
    const consentHistory = JSON.parse(dbUser.consentHistory);

    // Build consent object
    const consentFlags = {
      research_contact: consents.includes('research_contact'),
      usage_analytics: consents.includes('usage_analytics'),
      email_updates: consents.includes('email_updates'),
    };

    const response = NextResponse.json({
      success: true,
      data: {
        ...dbUser,
        villageHistory,
        consents: consentFlags,
        consentHistory,
      },
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch profile. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile - Update user profile
 *
 * Request body:
 * - displayName?: string (max 100 chars)
 * - bio?: string (max 500 chars)
 * - avatarUrl?: string (valid URL)
 * - preferredLanguage?: "en" | "fr"
 */
export async function PATCH(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to update your profile' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (body.displayName !== undefined) {
      if (typeof body.displayName !== 'string') {
        errors.push({ field: 'displayName', message: 'Display name must be a string' });
      } else if (body.displayName.length > 100) {
        errors.push({ field: 'displayName', message: 'Display name must not exceed 100 characters' });
      }
    }

    if (body.bio !== undefined) {
      if (body.bio !== null && typeof body.bio !== 'string') {
        errors.push({ field: 'bio', message: 'Bio must be a string' });
      } else if (body.bio && body.bio.length > 500) {
        errors.push({ field: 'bio', message: 'Bio must not exceed 500 characters' });
      }
    }

    if (body.avatarUrl !== undefined) {
      if (body.avatarUrl !== null && typeof body.avatarUrl !== 'string') {
        errors.push({ field: 'avatarUrl', message: 'Avatar URL must be a string' });
      } else if (body.avatarUrl) {
        try {
          new URL(body.avatarUrl);
        } catch {
          errors.push({ field: 'avatarUrl', message: 'Avatar URL must be a valid URL' });
        }
      }
    }

    if (body.preferredLanguage !== undefined) {
      if (!['en', 'fr'].includes(body.preferredLanguage)) {
        errors.push({ field: 'preferredLanguage', message: 'Language must be either "en" or "fr"' });
      }
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

    // Build update data
    const updateData: any = {};

    if (body.displayName !== undefined) {
      updateData.displayName = body.displayName;
    }

    if (body.bio !== undefined) {
      updateData.bio = body.bio;
    }

    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
    }

    if (body.preferredLanguage !== undefined) {
      updateData.preferredLanguage = body.preferredLanguage;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        preferredLanguage: true,
        role: true,
        currentVillageId: true,
        currentVillage: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedAt: true,
      },
    });

    // Log profile update event
    await prisma.event.create({
      data: {
        type: 'user.profile_updated',
        userId: user.id,
        payload: JSON.stringify({
          userId: user.id,
          fields: Object.keys(updateData),
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const response = NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update profile. Please try again later.',
      },
      { status: 500 }
    );
  }
}
