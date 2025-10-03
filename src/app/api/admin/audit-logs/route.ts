import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { getUserAuditLogs, AuditAction } from '@/lib/audit-log';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';

/**
 * GET /api/admin/audit-logs - Get audit logs
 *
 * Query parameters:
 * - userId?: string (filter by user)
 * - actions?: string (comma-separated audit actions)
 * - startDate?: ISO date string
 * - endDate?: ISO date string
 * - page?: number (default: 1)
 * - limit?: number (default: 50, max: 100)
 *
 * Access: ADMIN only
 */
export async function GET(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Only ADMIN can view audit logs
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only administrators can access audit logs',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const actionsParam = searchParams.get('actions');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'userId parameter is required',
        },
        { status: 400 }
      );
    }

    // Parse actions filter
    const actions = actionsParam
      ? actionsParam.split(',').filter((a) => Object.values(AuditAction).includes(a as AuditAction)) as AuditAction[]
      : undefined;

    // Parse dates
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Fetch audit logs
    const { logs, total } = await getUserAuditLogs(userId, {
      limit,
      offset,
      startDate,
      endDate,
      actions,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
        hasMore: offset + logs.length < total,
      },
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch audit logs. Please try again later.',
      },
      { status: 500 }
    );
  }
}
