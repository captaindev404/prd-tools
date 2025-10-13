import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';
import { getSyncHistory, getLatestSync } from '@/lib/hris/hris-sync';
import { getPendingConflicts, getConflictStats } from '@/lib/hris/hris-reconciliation';

/**
 * GET /api/hris/status
 * Get HRIS sync status and history (ADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'summary'; // summary | history | conflicts

    switch (view) {
      case 'history': {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const history = await getSyncHistory({
          limit,
          offset: (page - 1) * limit,
        });

        return NextResponse.json({
          syncs: history.syncs,
          pagination: {
            page,
            limit,
            total: history.total,
            totalPages: Math.ceil(history.total / limit),
          },
        });
      }

      case 'conflicts': {
        const syncId = searchParams.get('syncId') || undefined;
        const conflicts = await getPendingConflicts(syncId);
        const stats = await getConflictStats(syncId);

        return NextResponse.json({
          conflicts: conflicts.map((c) => ({
            ...c,
            hrisData: JSON.parse(c.hrisData),
            systemData: c.systemData ? JSON.parse(c.systemData) : null,
          })),
          stats,
        });
      }

      case 'summary':
      default: {
        const latestSync = await getLatestSync();
        const conflictStats = await getConflictStats();
        const pendingConflicts = await getPendingConflicts();

        return NextResponse.json({
          latestSync,
          conflictStats,
          pendingConflictsCount: pendingConflicts.length,
          hrisConfigured: !!(process.env.HRIS_API_URL && process.env.HRIS_API_KEY),
          syncEnabled: process.env.HRIS_SYNC_ENABLED === 'true',
        });
      }
    }
  } catch (error) {
    console.error('Error fetching HRIS status:', error);
    return NextResponse.json({ error: 'Failed to fetch HRIS status' }, { status: 500 });
  }
}
