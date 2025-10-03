import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';

/**
 * PATCH /api/user/consent - Update consent preferences
 *
 * Request body:
 * - consent_research_contact?: boolean
 * - consent_analytics?: boolean (mapped to usage_analytics)
 * - consent_email_updates?: boolean
 *
 * Features:
 * - Updates consent array in database
 * - Logs consent changes with timestamp
 * - Returns updated consent status
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
        { error: 'Unauthorized', message: 'You must be logged in to update consent preferences' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Fetch current user data
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        consents: true,
        consentHistory: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Not found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Parse existing consents and history
    const currentConsents: string[] = JSON.parse(dbUser.consents);
    const consentHistory: Array<{
      consent_type: string;
      granted: boolean;
      timestamp: string;
    }> = JSON.parse(dbUser.consentHistory);

    // Update consents based on body
    const consentTypes = [
      { key: 'consent_research_contact', value: 'research_contact' },
      { key: 'consent_analytics', value: 'usage_analytics' },
      { key: 'consent_email_updates', value: 'email_updates' },
    ];

    let hasChanges = false;
    const timestamp = new Date().toISOString();

    for (const { key, value } of consentTypes) {
      if (body[key] !== undefined && typeof body[key] === 'boolean') {
        const currentlyGranted = currentConsents.includes(value);

        if (body[key] !== currentlyGranted) {
          hasChanges = true;

          if (body[key]) {
            // Grant consent
            if (!currentConsents.includes(value)) {
              currentConsents.push(value);
            }
          } else {
            // Revoke consent
            const index = currentConsents.indexOf(value);
            if (index > -1) {
              currentConsents.splice(index, 1);
            }
          }

          // Log consent change
          consentHistory.push({
            consent_type: value,
            granted: body[key],
            timestamp,
          });
        }
      }
    }

    if (!hasChanges) {
      return NextResponse.json({
        success: true,
        message: 'No consent changes detected',
        data: {
          research_contact: currentConsents.includes('research_contact'),
          usage_analytics: currentConsents.includes('usage_analytics'),
          email_updates: currentConsents.includes('email_updates'),
        },
      });
    }

    // Update database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        consents: JSON.stringify(currentConsents),
        consentHistory: JSON.stringify(consentHistory),
      },
    });

    // Log consent change event
    await prisma.event.create({
      data: {
        type: 'user.consent_updated',
        userId: user.id,
        payload: JSON.stringify({
          userId: user.id,
          consents: currentConsents,
          timestamp,
        }),
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Consent preferences updated successfully',
      data: {
        research_contact: currentConsents.includes('research_contact'),
        usage_analytics: currentConsents.includes('usage_analytics'),
        email_updates: currentConsents.includes('email_updates'),
        lastUpdated: timestamp,
      },
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error updating consent preferences:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update consent preferences. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/consent - Get current consent preferences
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
        { error: 'Unauthorized', message: 'You must be logged in to view consent preferences' },
        { status: 401 }
      );
    }

    // Fetch current user consent data
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        consents: true,
        consentHistory: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Not found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Parse consents
    const currentConsents: string[] = JSON.parse(dbUser.consents);
    const consentHistory = JSON.parse(dbUser.consentHistory);

    // Get last updated timestamp for each consent type
    const getLastUpdated = (consentType: string) => {
      const entries = consentHistory.filter((h: any) => h.consent_type === consentType);
      return entries.length > 0 ? entries[entries.length - 1].timestamp : null;
    };

    const response = NextResponse.json({
      success: true,
      data: {
        research_contact: {
          granted: currentConsents.includes('research_contact'),
          lastUpdated: getLastUpdated('research_contact'),
        },
        usage_analytics: {
          granted: currentConsents.includes('usage_analytics'),
          lastUpdated: getLastUpdated('usage_analytics'),
        },
        email_updates: {
          granted: currentConsents.includes('email_updates'),
          lastUpdated: getLastUpdated('email_updates'),
        },
      },
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error fetching consent preferences:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch consent preferences. Please try again later.',
      },
      { status: 500 }
    );
  }
}
