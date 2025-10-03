/**
 * Notification Helper Functions
 *
 * Provides utility functions for creating and managing in-app notifications.
 * Used by various APIs to send notifications to users about panels, questionnaires,
 * roadmap updates, feedback merges, and other events.
 */

import { prisma } from './prisma';

export type NotificationType =
  | 'panel_invite'
  | 'questionnaire'
  | 'roadmap_update'
  | 'feedback_merged'
  | 'feedback_reply'
  | 'feedback_status_change'
  | 'research_session';

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        link,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create multiple notifications in bulk
 */
export async function createBulkNotifications(notifications: NotificationData[]) {
  try {
    return await prisma.notification.createMany({
      data: notifications,
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}

/**
 * Send notification when a user is invited to a panel
 */
export async function sendPanelInviteNotification(
  userId: string,
  panelId: string,
  panelName: string,
  invitedBy?: string
) {
  const inviterInfo = invitedBy ? ` by ${invitedBy}` : '';

  return createNotification(
    userId,
    'panel_invite',
    'Panel Invitation',
    `You've been invited${inviterInfo} to join the panel "${panelName}".`,
    `/panels/${panelId}`
  );
}

/**
 * Send notification when a new questionnaire is available
 */
export async function sendQuestionnaireNotification(
  userId: string,
  questionnaireId: string,
  questionnaireTitle: string
) {
  return createNotification(
    userId,
    'questionnaire',
    'New Questionnaire Available',
    `A new questionnaire "${questionnaireTitle}" is ready for your response.`,
    `/questionnaires/${questionnaireId}`
  );
}

/**
 * Send notifications to multiple users about a questionnaire
 */
export async function sendQuestionnaireNotifications(
  userIds: string[],
  questionnaireId: string,
  questionnaireTitle: string
) {
  const notifications = userIds.map(userId => ({
    userId,
    type: 'questionnaire' as NotificationType,
    title: 'New Questionnaire Available',
    body: `A new questionnaire "${questionnaireTitle}" is ready for your response.`,
    link: `/questionnaires/${questionnaireId}`,
  }));

  return createBulkNotifications(notifications);
}

/**
 * Send notification when a roadmap item is updated or published
 */
export async function sendRoadmapUpdateNotification(
  userId: string,
  roadmapItemId: string,
  roadmapTitle: string,
  updateType: 'published' | 'updated' = 'updated'
) {
  const actionText = updateType === 'published' ? 'published' : 'updated';

  return createNotification(
    userId,
    'roadmap_update',
    'Roadmap Update',
    `The roadmap item "${roadmapTitle}" has been ${actionText}.`,
    `/roadmap/${roadmapItemId}`
  );
}

/**
 * Send notifications to multiple users about a roadmap update
 */
export async function sendRoadmapUpdateNotifications(
  userIds: string[],
  roadmapItemId: string,
  roadmapTitle: string,
  updateType: 'published' | 'updated' = 'updated'
) {
  const actionText = updateType === 'published' ? 'published' : 'updated';

  const notifications = userIds.map(userId => ({
    userId,
    type: 'roadmap_update' as NotificationType,
    title: 'Roadmap Update',
    body: `The roadmap item "${roadmapTitle}" has been ${actionText}.`,
    link: `/roadmap/${roadmapItemId}`,
  }));

  return createBulkNotifications(notifications);
}

/**
 * Send notification when a user's feedback is merged into another
 */
export async function sendFeedbackMergedNotification(
  userId: string,
  feedbackId: string,
  feedbackTitle: string,
  mergedIntoId: string,
  mergedIntoTitle: string
) {
  return createNotification(
    userId,
    'feedback_merged',
    'Feedback Merged',
    `Your feedback "${feedbackTitle}" has been merged with "${mergedIntoTitle}".`,
    `/feedback/${mergedIntoId}`
  );
}

/**
 * Send notification when there's a reply to a user's feedback
 */
export async function sendFeedbackReplyNotification(
  userId: string,
  feedbackId: string,
  feedbackTitle: string,
  replierName?: string
) {
  const fromText = replierName ? ` from ${replierName}` : '';

  return createNotification(
    userId,
    'feedback_reply',
    'New Reply to Your Feedback',
    `You received a reply${fromText} on "${feedbackTitle}".`,
    `/feedback/${feedbackId}`
  );
}

/**
 * Send notification when feedback status changes
 */
export async function sendFeedbackStatusChangeNotification(
  userId: string,
  feedbackId: string,
  feedbackTitle: string,
  newStatus: string
) {
  const statusMap: Record<string, string> = {
    triaged: 'has been reviewed and triaged',
    in_roadmap: 'has been added to the roadmap',
    closed: 'has been closed',
  };

  const statusText = statusMap[newStatus] || `status changed to ${newStatus}`;

  return createNotification(
    userId,
    'feedback_status_change',
    'Feedback Status Update',
    `Your feedback "${feedbackTitle}" ${statusText}.`,
    `/feedback/${feedbackId}`
  );
}

/**
 * Send notification about a research session
 */
export async function sendResearchSessionNotification(
  userId: string,
  sessionId: string,
  sessionType: string,
  scheduledAt: Date
) {
  const dateStr = scheduledAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return createNotification(
    userId,
    'research_session',
    'Research Session Scheduled',
    `You're scheduled for a ${sessionType} session on ${dateStr}.`,
    `/sessions/${sessionId}`
  );
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    return await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, readAt: null },
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { unreadOnly = false, limit = 20, offset = 0 } = options;

  try {
    const where = {
      userId,
      ...(unreadOnly && { readAt: null }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      getUnreadNotificationCount(userId),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
}
