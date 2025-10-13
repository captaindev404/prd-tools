import { NextRequest, NextResponse } from 'next/server';
import { performHRISSync, isSyncRunning } from '@/lib/hris/hris-sync';

/**
 * GET /api/cron/hris-sync
 * Scheduled HRIS sync endpoint (called by cron job or Vercel Cron)
 *
 * For Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/hris-sync",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 *
 * For external cron (e.g., cron tab):
 * 0 2 * * * curl -X GET https://your-domain.com/api/cron/hris-sync \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron authorization (protect from unauthorized access)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'development-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if HRIS sync is enabled
    if (process.env.HRIS_SYNC_ENABLED !== 'true') {
      console.log('HRIS sync is disabled');
      return NextResponse.json({
        skipped: true,
        message: 'HRIS sync is disabled',
      });
    }

    // Check if sync is already running
    const running = await isSyncRunning();
    if (running) {
      console.log('HRIS sync already in progress, skipping');
      return NextResponse.json({
        skipped: true,
        message: 'Sync already in progress',
      });
    }

    // Determine sync type (incremental or full)
    const syncType = process.env.HRIS_SYNC_TYPE || 'incremental';
    const since = syncType === 'incremental' ? new Date(Date.now() - 24 * 60 * 60 * 1000) : undefined; // Last 24 hours

    console.log(`Starting scheduled HRIS sync (${syncType})...`);

    // Perform sync
    const result = await performHRISSync({
      syncType: syncType as 'full' | 'incremental',
      triggeredBy: 'cron',
      since,
    });

    console.log('HRIS sync completed:', result);

    return NextResponse.json({
      success: true,
      message: 'HRIS sync completed',
      result: {
        syncId: result.syncId,
        status: result.status,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        conflictsDetected: result.conflictsDetected,
        duration: result.duration,
      },
    });
  } catch (error) {
    console.error('Cron HRIS sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// For Vercel Cron, also support POST
export async function POST(req: NextRequest) {
  return GET(req);
}
