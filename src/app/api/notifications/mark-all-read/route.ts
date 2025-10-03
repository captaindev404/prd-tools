/**
 * Mark All Notifications as Read API Route
 *
 * POST - Mark all unread notifications as read for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { markAllNotificationsAsRead } from '@/lib/notifications';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';

export async function POST(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await markAllNotificationsAsRead(user.id);

    const response = NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} notification(s) marked as read`,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
