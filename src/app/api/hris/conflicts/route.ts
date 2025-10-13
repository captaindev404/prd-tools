import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';
import { resolveConflict, getPendingConflicts } from '@/lib/hris/hris-reconciliation';
import { logAuditAction } from '@/lib/audit-log';
import { z } from 'zod';

const ResolveConflictSchema = z.object({
  conflictId: z.string(),
  resolution: z.enum(['keep_system', 'use_hris', 'merge', 'create_new']),
  notes: z.string().optional(),
});

/**
 * GET /api/hris/conflicts
 * Get all pending conflicts (ADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const syncId = searchParams.get('syncId') || undefined;

    const conflicts = await getPendingConflicts(syncId);

    return NextResponse.json({
      conflicts: conflicts.map((c) => ({
        ...c,
        hrisData: JSON.parse(c.hrisData),
        systemData: c.systemData ? JSON.parse(c.systemData) : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    return NextResponse.json({ error: 'Failed to fetch conflicts' }, { status: 500 });
  }
}

/**
 * POST /api/hris/conflicts
 * Resolve a conflict (ADMIN only)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const validated = ResolveConflictSchema.parse(body);

    // Resolve conflict
    await resolveConflict(validated.conflictId, {
      conflictId: validated.conflictId,
      resolution: validated.resolution,
      resolvedBy: user.id,
      notes: validated.notes,
    });

    // Log resolution
    await logAuditAction({
      userId: user.id,
      action: 'hris.conflict_resolved',
      resourceId: validated.conflictId,
      resourceType: 'hris_conflict',
      metadata: {
        resolution: validated.resolution,
        notes: validated.notes,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: 'Conflict resolved successfully',
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return NextResponse.json(
      {
        error: 'Failed to resolve conflict',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
