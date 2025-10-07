import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { logDataExport } from '@/lib/audit-log';

/**
 * POST /api/user/data-export - Request GDPR data export
 *
 * Generates a comprehensive JSON export of all user data including:
 * - Profile information
 * - All feedback submitted
 * - All votes cast
 * - Village history
 * - Consent history
 * - Panel memberships
 * - Questionnaire responses
 *
 * Returns:
 * - JSON file download
 */
export async function POST(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to export your data' },
        { status: 401 }
      );
    }

    // Fetch all user data
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        currentVillage: {
          select: {
            id: true,
            name: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            title: true,
            body: true,
            state: true,
            visibility: true,
            source: true,
            villageId: true,
            featureId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        votes: {
          select: {
            id: true,
            feedbackId: true,
            weight: true,
            decayedWeight: true,
            createdAt: true,
            feedback: {
              select: {
                title: true,
                state: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        panelMemberships: {
          select: {
            id: true,
            panelId: true,
            joinedAt: true,
            active: true,
            panel: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        questionnaireResponses: {
          select: {
            id: true,
            questionnaireId: true,
            answers: true,
            completedAt: true,
            questionnaire: {
              select: {
                title: true,
                version: true,
              },
            },
          },
          orderBy: { completedAt: 'desc' },
        },
        events: {
          select: {
            type: true,
            payload: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit events to last 100
        },
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

    // Build comprehensive data export
    const dataExport = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        export_version: '1.0',
        user_id: dbUser.id,
      },
      profile: {
        id: dbUser.id,
        employee_id: dbUser.employeeId,
        email: dbUser.email,
        display_name: dbUser.displayName,
        bio: dbUser.bio,
        avatar_url: dbUser.avatarUrl,
        preferred_language: dbUser.preferredLanguage,
        role: dbUser.role,
        account_created: dbUser.createdAt.toISOString(),
        last_updated: dbUser.updatedAt.toISOString(),
      },
      village_context: {
        current_village: dbUser.currentVillage
          ? {
              id: dbUser.currentVillage.id,
              name: dbUser.currentVillage.name,
            }
          : null,
        village_history: villageHistory,
      },
      consent_preferences: {
        current_consents: {
          research_contact: consents.includes('research_contact'),
          usage_analytics: consents.includes('usage_analytics'),
          email_updates: consents.includes('email_updates'),
        },
        consent_history: consentHistory,
      },
      feedback_submitted: {
        total_count: dbUser.feedbacks.length,
        items: dbUser.feedbacks.map((fb) => ({
          id: fb.id,
          title: fb.title,
          body: fb.body,
          state: fb.state,
          visibility: fb.visibility,
          source: fb.source,
          village_id: fb.villageId,
          feature_id: fb.featureId,
          created_at: fb.createdAt.toISOString(),
          updated_at: fb.updatedAt.toISOString(),
        })),
      },
      votes_cast: {
        total_count: dbUser.votes.length,
        items: dbUser.votes.map((vote) => ({
          id: vote.id,
          feedback_id: vote.feedbackId,
          feedback_title: vote.feedback.title,
          feedback_state: vote.feedback.state,
          weight: vote.weight,
          decayed_weight: vote.decayedWeight,
          created_at: vote.createdAt.toISOString(),
        })),
      },
      research_participation: {
        panel_memberships: {
          total_count: dbUser.panelMemberships.length,
          items: dbUser.panelMemberships.map((pm) => ({
            id: pm.id,
            panel_id: pm.panelId,
            panel_name: pm.panel.name,
            joined_at: pm.joinedAt.toISOString(),
            active: pm.active,
          })),
        },
        questionnaire_responses: {
          total_count: dbUser.questionnaireResponses.length,
          items: dbUser.questionnaireResponses.map((qr) => ({
            id: qr.id,
            questionnaire_id: qr.questionnaireId,
            questionnaire_title: qr.questionnaire.title,
            questionnaire_version: qr.questionnaire.version,
            answers: JSON.parse(qr.answers),
            completed_at: qr.completedAt.toISOString(),
          })),
        },
      },
      activity_events: {
        total_count: dbUser.events.length,
        note: 'Last 100 events only',
        items: dbUser.events.map((event) => ({
          type: event.type,
          payload: JSON.parse(event.payload),
          created_at: event.createdAt.toISOString(),
        })),
      },
    };

    // Calculate approximate size
    const dataSize = JSON.stringify(dataExport).length;
    const fileSizeKB = Math.round(dataSize / 1024);

    // Log audit event for data export
    await logDataExport(user.id, user.email, user.role, 'full', dataSize, request);

    // Return JSON for download
    return new NextResponse(JSON.stringify(dataExport, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gentil-feedback-data-export-${user.id}-${Date.now()}.json"`,
        'X-Export-Size-KB': fileSizeKB.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to export data. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/data-export - Get export metadata (size estimate)
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
        { error: 'Unauthorized', message: 'You must be logged in to view export information' },
        { status: 401 }
      );
    }

    // Get counts for size estimation
    const [
      feedbackCount,
      voteCount,
      panelCount,
      questionnaireResponseCount,
      eventCount,
    ] = await Promise.all([
      prisma.feedback.count({ where: { authorId: user.id } }),
      prisma.vote.count({ where: { userId: user.id } }),
      prisma.panelMembership.count({ where: { userId: user.id } }),
      prisma.questionnaireResponse.count({ where: { respondentId: user.id } }),
      prisma.event.count({ where: { userId: user.id } }),
    ]);

    // Estimate size (rough approximation)
    const estimatedSizeKB = Math.round(
      (feedbackCount * 2 + voteCount * 0.5 + panelCount * 0.2 + questionnaireResponseCount * 1 + Math.min(eventCount, 100) * 0.3) + 5
    );

    return NextResponse.json({
      success: true,
      data: {
        estimated_size_kb: estimatedSizeKB,
        counts: {
          feedback: feedbackCount,
          votes: voteCount,
          panel_memberships: panelCount,
          questionnaire_responses: questionnaireResponseCount,
          events: Math.min(eventCount, 100),
        },
        note: 'This is an estimate. Actual size may vary.',
      },
    });
  } catch (error) {
    console.error('Error getting export metadata:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to get export information. Please try again later.',
      },
      { status: 500 }
    );
  }
}
