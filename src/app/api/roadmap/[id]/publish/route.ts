import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { canPublishRoadmap } from '@/lib/roadmap-helpers';
import type { PublishRoadmapInput } from '@/types/roadmap';
import { sendBulkEmail } from '@/lib/email';
import {
  generateRoadmapUpdateHTML,
  generateRoadmapUpdateText,
} from '@/lib/email-templates/roadmap-update';
import { sendRoadmapUpdateNotifications } from '@/lib/notifications';

/**
 * POST /api/roadmap/[id]/publish - Publish roadmap update
 *
 * Request body:
 * - message?: string (custom message for the update)
 * - audience?: {
 *     allUsers?: boolean
 *     villages?: string[]
 *     panels?: string[]
 *   }
 * - channels?: ('in-app' | 'email' | 'inbox')[]
 *
 * Features:
 * - PM/PO/ADMIN only
 * - Creates communication event
 * - Sends notifications based on audience
 * - Logs event
 * - Optional: Queue email notifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to publish roadmap updates',
        },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canPublishRoadmap(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to publish roadmap updates',
        },
        { status: 403 }
      );
    }

    // Fetch roadmap item
    const roadmapItem = await prisma.roadmapItem.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (!roadmapItem) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Roadmap item not found',
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body: PublishRoadmapInput = await request.json();

    const message =
      body.message ||
      `Roadmap update: ${roadmapItem.title} is now in "${roadmapItem.stage}" stage`;
    const channels = body.channels || ['in-app'];
    const audience = body.audience || { allUsers: true };

    // Determine target users based on audience
    let targetUserIds: string[] = [];
    let targetUsers: any[] = [];

    if (audience.allUsers) {
      // Get all active users with email consent
      targetUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          preferredLanguage: true,
          consents: true,
        },
      });
      targetUserIds = targetUsers.map((u) => u.id);
    } else {
      const userQueries: any[] = [];

      // Filter by villages
      if (audience.villages && audience.villages.length > 0) {
        userQueries.push({
          currentVillageId: { in: audience.villages },
        });
      }

      // Filter by panel membership
      if (audience.panels && audience.panels.length > 0) {
        const panelMembers = await prisma.panelMembership.findMany({
          where: {
            panelId: { in: audience.panels },
            active: true,
          },
          select: { userId: true },
          distinct: ['userId'],
        });
        const panelUserIds = panelMembers.map((pm) => pm.userId);
        userQueries.push({
          id: { in: panelUserIds },
        });
      }

      // Query users
      if (userQueries.length > 0) {
        targetUsers = await prisma.user.findMany({
          where: {
            OR: userQueries,
          },
          select: {
            id: true,
            email: true,
            preferredLanguage: true,
            consents: true,
          },
          distinct: ['id'],
        });
        targetUserIds = targetUsers.map((u) => u.id);
      }
    }

    // Create event for roadmap publication
    const publishEvent = await prisma.event.create({
      data: {
        type: 'roadmap.published',
        userId: user.id,
        payload: JSON.stringify({
          roadmapId: roadmapItem.id,
          title: roadmapItem.title,
          stage: roadmapItem.stage,
          message,
          channels,
          audience,
          targetUserCount: targetUserIds.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // Send in-app notifications if in-app channel is enabled
    let notificationsSent = 0;
    if (channels.includes('in-app') && targetUserIds.length > 0) {
      // Limit to avoid overwhelming the database
      const maxNotifications = 1000;
      const userIdsToNotify = targetUserIds.slice(0, maxNotifications);

      await sendRoadmapUpdateNotifications(
        userIdsToNotify,
        roadmapItem.id,
        roadmapItem.title,
        'published'
      );

      notificationsSent = userIdsToNotify.length;
    }

    // Send email notifications if email channel is enabled
    let emailsSent = 0;
    let emailErrors: string[] = [];

    if (channels.includes('email')) {
      try {
        // Filter users who have consented to email updates
        const usersWithConsent = targetUsers.filter((user) => {
          const consents = JSON.parse(user.consents || '[]');
          return consents.includes('email_updates');
        });

        if (usersWithConsent.length > 0) {
          // Prepare bulk email recipients
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const roadmapLink = `${appUrl}/roadmap/${roadmapItem.id}`;
          const summary = roadmapItem.description || message;

          const recipients = usersWithConsent.map((user) => {
            const language = (user.preferredLanguage as 'en' | 'fr') || 'en';

            const html = generateRoadmapUpdateHTML({
              title: roadmapItem.title,
              stage: roadmapItem.stage as any,
              summary,
              link: roadmapLink,
              language,
            });

            const text = generateRoadmapUpdateText({
              title: roadmapItem.title,
              stage: roadmapItem.stage as any,
              summary,
              link: roadmapLink,
              language,
            });

            return {
              email: user.email,
              subject:
                language === 'fr'
                  ? `Mise à jour de la feuille de route : ${roadmapItem.title}`
                  : `Roadmap Update: ${roadmapItem.title}`,
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
              type: 'roadmap.emails_sent',
              userId: user.id,
              payload: JSON.stringify({
                roadmapId: roadmapItem.id,
                emailsSent,
                emailsFailed: emailResult.failureCount,
                timestamp: new Date().toISOString(),
              }),
            },
          });
        }
      } catch (error) {
        console.error('Error sending roadmap emails:', error);
        // Don't fail the publish if email fails
        emailErrors.push(
          error instanceof Error ? error.message : 'Unknown email error'
        );
      }
    }

    // Update roadmap item's communication settings
    await prisma.roadmapItem.update({
      where: { id },
      data: {
        commsChannels: JSON.stringify(channels),
        commsAudience: JSON.stringify(audience),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      notificationCount: notificationsSent,
      eventId: publishEvent.id,
      message: `Roadmap update published to ${notificationsSent} users`,
      emailsSent,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error) {
    console.error('Error publishing roadmap update:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to publish roadmap update. Please try again later.',
      },
      { status: 500 }
    );
  }
}
