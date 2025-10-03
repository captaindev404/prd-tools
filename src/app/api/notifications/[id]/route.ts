/**
 * Single Notification API Route
 *
 * PATCH - Mark a specific notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { markNotificationAsRead } from '@/lib/notifications';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const notification = await markNotificationAsRead(id, user.id);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    const response = NextResponse.json(notification);
    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
