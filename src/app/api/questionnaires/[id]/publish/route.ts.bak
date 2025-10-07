import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canPublishQuestionnaire } from '@/lib/auth-helpers';
import { sendBulkEmail } from '@/lib/email';
import {
  generateQuestionnaireInviteHTML,
  generateQuestionnaireInviteText,
} from '@/lib/email-templates/questionnaire-invite';
import { sendQuestionnaireNotifications } from '@/lib/notifications';

/**
 * POST /api/questionnaires/[id]/publish - Publish questionnaire
 *
 * RESEARCHER/PM only
 * Changes status from 'draft' to 'published'
 * Sends notifications to targeted users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canPublishQuestionnaire(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to publish questionnaires',
        },
        { status: 403 }
      );
    }

    const questionnaireId = params.id;

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Not found', message: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Cannot publish already published questionnaire
    if (questionnaire.status === 'published') {
      return NextResponse.json(
        {
          error: 'Invalid state',
          message: 'Questionnaire is already published',
        },
        { status: 400 }
      );
    }

    // Check status - must be draft
    if (questionnaire.status !== 'draft') {
      return NextResponse.json(
        {
          error: 'Invalid state',
          message: `Cannot publish questionnaire with status '${questionnaire.status}'`,
        },
        { status: 400 }
      );
    }

    // Comprehensive validation
    const errors: string[] = [];

    // Parse questions
    const questions = JSON.parse(questionnaire.questions || '[]');

    // Validate questions exist
    if (questions.length === 0) {
      errors.push('At least one question is required');
    }

    // Validate each question has EN and FR translations
    questions.forEach((q: any, index: number) => {
      // Check for multilingual text (EN/FR)
      if (typeof q.text === 'object') {
        if (!q.text?.en || !q.text?.fr) {
          errors.push(`Question ${index + 1}: Missing EN or FR translation`);
        }
      } else if (typeof q.text === 'string') {
        // Legacy format - allow but warn
        console.warn(`Question ${index + 1} uses legacy text format (string instead of {en, fr})`);
      } else {
        errors.push(`Question ${index + 1}: Invalid text format`);
      }

      // Validate question type
      const validTypes = [
        'likert_5',
        'likert_7',
        'nps',
        'mcq_single',
        'mcq_multiple',
        'text',
        'rating',
        'number'
      ];
      if (!validTypes.includes(q.type)) {
        errors.push(`Question ${index + 1}: Invalid question type "${q.type}"`);
      }

      // Validate MCQ options
      if ((q.type === 'mcq_single' || q.type === 'mcq_multiple') && (!q.options || q.options.length < 2)) {
        errors.push(`Question ${index + 1}: MCQ questions must have at least 2 options`);
      }
    });

    // Validate targeting - must have panelIds or adHocFilters
    const panelIds = JSON.parse(questionnaire.panelIds || '[]');
    const adHocFilters = JSON.parse(questionnaire.adHocFilters || '{}');

    if (panelIds.length === 0 && Object.keys(adHocFilters).length === 0) {
      errors.push('Targeting required: Must specify panelIds or adHocFilters');
    }

    // Validate dates if both are provided
    if (questionnaire.startAt && questionnaire.endAt) {
      if (new Date(questionnaire.startAt) >= new Date(questionnaire.endAt)) {
        errors.push('Start date must be before end date');
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please fix the following issues before publishing',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Update status to published
    const updated = await prisma.questionnaire.update({
      where: { id: questionnaireId },
      data: {
        status: 'published',
        startAt: questionnaire.startAt || new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'questionnaire.published',
        userId: user.id,
        payload: JSON.stringify({
          questionnaireId: updated.id,
          title: updated.title,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // Get eligible users based on targeting (reuse variables from validation)
    const deliveryMode = JSON.parse(updated.deliveryMode || '[]');
    // panelIds and adHocFilters already declared above during validation
    let emailsSent = 0;
    let emailErrors: string[] = [];

    let eligibleUsers: any[] = [];

    // Determine eligible users for notifications and emails
    if (true) {
      try {

        // If panel targeting
        if (panelIds.length > 0) {
          const panelMemberships = await prisma.panelMembership.findMany({
            where: {
              panelId: { in: panelIds },
              active: true,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  preferredLanguage: true,
                  consents: true,
                },
              },
            },
          });
          eligibleUsers = panelMemberships.map((pm) => pm.user);
        } else {
          // Ad-hoc targeting by villages or other filters
          const userQuery: any = {};

          if (adHocFilters.villages && adHocFilters.villages.length > 0) {
            userQuery.currentVillageId = { in: adHocFilters.villages };
          }

          eligibleUsers = await prisma.user.findMany({
            where: userQuery,
            select: {
              id: true,
              email: true,
              preferredLanguage: true,
              consents: true,
            },
          });
        }

        // Send in-app notifications to all eligible users
        if (eligibleUsers.length > 0 && deliveryMode.includes('in-app')) {
          await sendQuestionnaireNotifications(
            eligibleUsers.map(u => u.id),
            updated.id,
            updated.title
          );
        }

        // Filter users who have consented to email updates for email delivery
        const usersWithConsent = eligibleUsers.filter((user) => {
          const consents = JSON.parse(user.consents || '[]');
          return consents.includes('email_updates');
        });

        if (usersWithConsent.length > 0 && deliveryMode.includes('email')) {
          // Prepare bulk email recipients
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const questionnaireLink = `${appUrl}/questionnaires/${updated.id}`;
          const deadlineStr = updated.endAt
            ? new Date(updated.endAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : null;

          const recipients = usersWithConsent.map((user) => {
            const language = (user.preferredLanguage as 'en' | 'fr') || 'en';
            const deadlineLocalized = updated.endAt
              ? new Date(updated.endAt).toLocaleDateString(
                  language === 'fr' ? 'fr-FR' : 'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )
              : null;

            const html = generateQuestionnaireInviteHTML({
              questionnaireTitle: updated.title,
              deadline: deadlineLocalized,
              link: questionnaireLink,
              language,
            });

            const text = generateQuestionnaireInviteText({
              questionnaireTitle: updated.title,
              deadline: deadlineLocalized,
              link: questionnaireLink,
              language,
            });

            return {
              email: user.email,
              subject:
                language === 'fr'
                  ? `Nouveau questionnaire : ${updated.title}`
                  : `New Questionnaire: ${updated.title}`,
              html,
              text,
            };
          });

          // Send bulk emails
          const emailResult = await sendBulkEmail(recipients);
          emailsSent = emailResult.successCount;

          if (emailResult.errors.length > 0) {
            emailErrors = emailResult.errors.map((e) => e.error);
          }

          // Log email send events
          await prisma.event.create({
            data: {
              type: 'questionnaire.emails_sent',
              userId: user.id,
              payload: JSON.stringify({
                questionnaireId: updated.id,
                emailsSent,
                emailsFailed: emailResult.failureCount,
                timestamp: new Date().toISOString(),
              }),
            },
          });
        }
      } catch (error) {
        console.error('Error sending questionnaire emails:', error);
        // Don't fail the publish if email fails
        emailErrors.push(
          error instanceof Error ? error.message : 'Unknown email error'
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        questions: JSON.parse(updated.questions),
        panelIds: JSON.parse(updated.panelIds),
        adHocFilters: JSON.parse(updated.adHocFilters),
      },
      message: 'Questionnaire published successfully',
      emailsSent,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error) {
    console.error('Error publishing questionnaire:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to publish questionnaire. Please try again later.',
      },
      { status: 500 }
    );
  }
}
