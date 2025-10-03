import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { logAccountDeletion } from '@/lib/audit-log';

/**
 * POST /api/user/delete-account - Request GDPR account deletion
 *
 * GDPR-compliant account deletion with two modes:
 * 1. Full deletion (default): Removes all user data
 * 2. Anonymization: Replaces user info with anonymized data, keeps contributions
 *
 * Request body:
 * - confirmEmail: string (must match user email)
 * - mode?: 'delete' | 'anonymize' (default: 'delete')
 * - reason?: string (optional feedback)
 *
 * Returns:
 * - Confirmation of deletion/anonymization
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
        { error: 'Unauthorized', message: 'You must be logged in to delete your account' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (!body.confirmEmail || typeof body.confirmEmail !== 'string') {
      errors.push({ field: 'confirmEmail', message: 'Email confirmation is required' });
    } else if (body.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      errors.push({ field: 'confirmEmail', message: 'Email does not match your account email' });
    }

    if (body.mode && !['delete', 'anonymize'].includes(body.mode)) {
      errors.push({ field: 'mode', message: 'Mode must be either "delete" or "anonymize"' });
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

    const mode = body.mode || 'delete';
    const timestamp = new Date().toISOString();

    if (mode === 'anonymize') {
      // ANONYMIZATION MODE: Keep contributions but anonymize user
      const anonymizedEmail = `deleted_${user.id}@anonymized.local`;
      const anonymizedName = `Deleted User ${user.id.substring(0, 8)}`;

      await prisma.$transaction(async (tx) => {
        // Update user with anonymized data
        await tx.user.update({
          where: { id: user.id },
          data: {
            email: anonymizedEmail,
            displayName: anonymizedName,
            bio: null,
            avatarUrl: null,
            employeeId: `DELETED_${user.id.substring(0, 8)}`,
            consents: '[]',
            consentHistory: JSON.stringify([
              {
                action: 'account_anonymized',
                timestamp,
              },
            ]),
          },
        });

        // Log anonymization event
        await tx.event.create({
          data: {
            type: 'user.account_anonymized',
            userId: user.id,
            payload: JSON.stringify({
              userId: user.id,
              reason: body.reason || null,
              timestamp,
            }),
          },
        });
      });

      // Log audit event
      await logAccountDeletion(user.id, user.email, 'anonymize', body.reason, request);

      return NextResponse.json({
        success: true,
        mode: 'anonymize',
        message: 'Your account has been anonymized. Your contributions remain but are no longer linked to your identity.',
      });
    } else {
      // FULL DELETION MODE: Remove all user data
      await prisma.$transaction(async (tx) => {
        // 1. Delete questionnaire responses
        await tx.questionnaireResponse.deleteMany({
          where: { respondentId: user.id },
        });

        // 2. Delete panel memberships
        await tx.panelMembership.deleteMany({
          where: { userId: user.id },
        });

        // 3. Delete votes
        await tx.vote.deleteMany({
          where: { userId: user.id },
        });

        // 4. Delete feedback
        await tx.feedback.deleteMany({
          where: { authorId: user.id },
        });

        // 5. Delete events
        await tx.event.deleteMany({
          where: { userId: user.id },
        });

        // 6. Delete notifications
        await tx.notification.deleteMany({
          where: { userId: user.id },
        });

        // 7. Log deletion event (will be deleted with user but kept for audit)
        await tx.event.create({
          data: {
            type: 'user.account_deleted',
            userId: user.id,
            payload: JSON.stringify({
              userId: user.id,
              email: user.email,
              reason: body.reason || null,
              timestamp,
            }),
          },
        });

        // 8. Finally, delete the user
        await tx.user.delete({
          where: { id: user.id },
        });
      });

      // Log audit event (must be before user deletion completes)
      await logAccountDeletion(user.id, user.email, 'delete', body.reason, request);

      return NextResponse.json({
        success: true,
        mode: 'delete',
        message: 'Your account and all associated data have been permanently deleted.',
      });
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete account. Please try again later or contact support.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/delete-account - Get account deletion preview
 *
 * Shows what data will be deleted/anonymized
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
        { error: 'Unauthorized', message: 'You must be logged in to view deletion preview' },
        { status: 401 }
      );
    }

    // Get counts of data that will be affected
    const [
      feedbackCount,
      voteCount,
      panelCount,
      questionnaireResponseCount,
      notificationCount,
    ] = await Promise.all([
      prisma.feedback.count({ where: { authorId: user.id } }),
      prisma.vote.count({ where: { userId: user.id } }),
      prisma.panelMembership.count({ where: { userId: user.id } }),
      prisma.questionnaireResponse.count({ where: { respondentId: user.id } }),
      prisma.notification.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        deletion_preview: {
          feedback_items: feedbackCount,
          votes_cast: voteCount,
          panel_memberships: panelCount,
          questionnaire_responses: questionnaireResponseCount,
          notifications: notificationCount,
        },
        modes: {
          delete: {
            description: 'Permanently delete all your data and account',
            irreversible: true,
            data_retained: 'None - all data will be permanently deleted',
          },
          anonymize: {
            description: 'Keep your contributions but remove personal information',
            irreversible: true,
            data_retained: 'Feedback, votes, and responses (anonymized)',
          },
        },
        note: 'This action is irreversible. Please export your data first if needed.',
      },
    });
  } catch (error) {
    console.error('Error getting deletion preview:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to get deletion preview. Please try again later.',
      },
      { status: 500 }
    );
  }
}
