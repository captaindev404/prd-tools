import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { canCreateRoadmap } from '@/lib/roadmap-helpers';
import { sendEmailWithLogging } from '@/lib/email/sendgrid-client';

export interface PublishRequest {
  roadmapIds: string[];
  message?: string;
  channels: ('in-app' | 'email')[];
  audience: {
    allUsers?: boolean;
    villages?: string[];
    roles?: string[];
    panels?: string[];
  };
}

/**
 * POST /api/roadmap/publish - Publish roadmap updates to stakeholders
 *
 * Request body:
 * - roadmapIds: string[] (roadmap items to include in update)
 * - message?: string (optional custom message)
 * - channels: ('in-app' | 'email')[] (notification channels)
 * - audience: object (targeting filters)
 *
 * Features:
 * - Multi-channel notifications (in-app, email)
 * - Audience filtering (villages, roles, panels)
 * - Auto-generates changelog if not provided
 * - Respects user notification preferences
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

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
    if (!canCreateRoadmap(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to publish roadmap updates',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body: PublishRequest = await request.json();

    // Validation
    if (!body.roadmapIds || body.roadmapIds.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'At least one roadmap item is required',
        },
        { status: 400 }
      );
    }

    if (!body.channels || body.channels.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'At least one notification channel is required',
        },
        { status: 400 }
      );
    }

    // Fetch roadmap items
    const roadmapItems = await prisma.roadmapItem.findMany({
      where: {
        id: { in: body.roadmapIds },
      },
      include: {
        features: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (roadmapItems.length !== body.roadmapIds.length) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'One or more roadmap items not found',
        },
        { status: 400 }
      );
    }

    // Build audience query
    const audienceWhere: any = {};

    if (body.audience.villages && body.audience.villages.length > 0) {
      audienceWhere.currentVillageId = { in: body.audience.villages };
    }

    if (body.audience.roles && body.audience.roles.length > 0) {
      audienceWhere.role = { in: body.audience.roles };
    }

    if (body.audience.panels && body.audience.panels.length > 0) {
      audienceWhere.panelMemberships = {
        some: {
          panelId: { in: body.audience.panels },
          active: true,
        },
      };
    }

    // Fetch target users
    const targetUsers = await prisma.user.findMany({
      where: audienceWhere,
      include: {
        notificationPreferences: true,
      },
    });

    // Generate notification content
    const notificationTitle = `Roadmap Update: ${roadmapItems.length} item${
      roadmapItems.length > 1 ? 's' : ''
    } updated`;
    const notificationBody =
      body.message ||
      `Check out the latest updates to our product roadmap: ${roadmapItems
        .map((item) => item.title)
        .join(', ')}`;

    let notificationCount = 0;
    let emailCount = 0;

    // Send in-app notifications
    if (body.channels.includes('in-app')) {
      const notifications = targetUsers.map((targetUser) => ({
        userId: targetUser.id,
        type: 'roadmap_update',
        title: notificationTitle,
        body: notificationBody,
        link: `/roadmap`,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      notificationCount = notifications.length;
    }

    // Send email notifications
    if (body.channels.includes('email')) {
      for (const targetUser of targetUsers) {
        // Check user preferences
        const prefs = targetUser.notificationPreferences;
        if (prefs && prefs.roadmapUpdates === 'never') {
          continue;
        }

        try {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body>
              <h2>${notificationTitle}</h2>
              <p>${notificationBody}</p>
              <h3>Updated Items:</h3>
              <ul>
                ${roadmapItems
                  .map(
                    (item) => `
                  <li>
                    <strong>${item.title}</strong> - ${item.stage}
                    ${item.targetDate ? `(Target: ${new Date(item.targetDate).toLocaleDateString()})` : ''}
                  </li>
                `
                  )
                  .join('')}
              </ul>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/roadmap">View Full Roadmap</a></p>
            </body>
            </html>
          `;

          await sendEmailWithLogging({
            to: targetUser.email,
            templateType: 'roadmap_update',
            subject: notificationTitle,
            html: htmlContent,
            text: `${notificationTitle}\n\n${notificationBody}\n\nUpdated Items:\n${roadmapItems.map(item => `- ${item.title} (${item.stage})`).join('\n')}\n\nView Full Roadmap: ${process.env.NEXT_PUBLIC_APP_URL}/roadmap`,
            userId: targetUser.id,
            metadata: {
              roadmapIds: body.roadmapIds,
              publishedBy: user.id,
            },
          });

          emailCount++;
        } catch (emailError) {
          console.error(`Failed to send email to ${targetUser.email}:`, emailError);
          // Continue with other users
        }
      }
    }

    // Log event
    await prisma.event.create({
      data: {
        type: 'roadmap.published',
        userId: user.id,
        payload: JSON.stringify({
          roadmapIds: body.roadmapIds,
          channels: body.channels,
          audienceSize: targetUsers.length,
          notificationsSent: notificationCount,
          emailsSent: emailCount,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Roadmap updates published successfully',
      summary: {
        roadmapItemsPublished: roadmapItems.length,
        targetUsers: targetUsers.length,
        notificationsSent: notificationCount,
        emailsSent: emailCount,
      },
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error publishing roadmap updates:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to publish roadmap updates. Please try again later.',
      },
      { status: 500 }
    );
  }
}
