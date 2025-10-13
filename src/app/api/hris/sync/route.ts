import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';
import { performHRISSync, isSyncRunning } from '@/lib/hris/hris-sync';
import { logAuditAction } from '@/lib/audit-log';
import { z } from 'zod';

const SyncRequestSchema = z.object({
  syncType: z.enum(['full', 'incremental', 'manual']).default('manual'),
  dryRun: z.boolean().default(false),
  since: z.string().optional(), // ISO date string for incremental sync
});

/**
 * POST /api/hris/sync
 * Trigger manual HRIS sync (ADMIN only)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Check if sync is already running
    const running = await isSyncRunning();
    if (running) {
      return NextResponse.json(
        { error: 'HRIS sync is already in progress' },
        { status: 409 } // Conflict
      );
    }

    // Parse request body
    const body = await req.json();
    const validated = SyncRequestSchema.parse(body);

    // Log sync trigger
    await logAuditAction({
      userId: user.id,
      action: 'hris.sync_triggered',
      metadata: { syncType: validated.syncType, dryRun: validated.dryRun },
      request: req,
    });

    // Perform sync
    const result = await performHRISSync({
      syncType: validated.syncType,
      triggeredBy: user.id,
      dryRun: validated.dryRun,
      since: validated.since ? new Date(validated.since) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `HRIS sync ${validated.dryRun ? '(dry run) ' : ''}completed`,
      result,
    });
  } catch (error) {
    console.error('Error triggering HRIS sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger HRIS sync',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/hris/sync
 * Check if sync is running (ADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const running = await isSyncRunning();

    return NextResponse.json({
      running,
      syncEnabled: process.env.HRIS_SYNC_ENABLED === 'true',
      hrisConfigured: !!(process.env.HRIS_API_URL && process.env.HRIS_API_KEY),
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json({ error: 'Failed to check sync status' }, { status: 500 });
  }
}
