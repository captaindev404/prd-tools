import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { cleanupOrphanedFiles, formatBytes, CleanupConfig } from '@/lib/file-cleanup';
import { logAuditAction, AuditAction } from '@/lib/audit-log';

/**
 * GET /api/admin/cleanup-files - Manually trigger file cleanup
 *
 * Query parameters:
 * - maxAgeHours?: number (default: 24) - Maximum age of files to delete
 * - dryRun?: boolean (default: false) - Preview what would be deleted without actually deleting
 * - verbose?: boolean (default: false) - Include detailed logs
 *
 * Access: ADMIN only
 *
 * Response:
 * - success: boolean
 * - result: CleanupResult object with statistics
 * - message: Summary message
 *
 * @example
 * // Delete files older than 1 hour
 * GET /api/admin/cleanup-files?maxAgeHours=1
 *
 * @example
 * // Dry run - preview what would be deleted
 * GET /api/admin/cleanup-files?dryRun=true
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Only ADMIN can trigger cleanup
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Only administrators can trigger file cleanup',
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const maxAgeHours = parseInt(searchParams.get('maxAgeHours') || '24');
    const dryRun = searchParams.get('dryRun') === 'true';
    const verbose = searchParams.get('verbose') === 'true';

    // Validate maxAgeHours
    if (isNaN(maxAgeHours) || maxAgeHours < 0 || maxAgeHours > 168) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'maxAgeHours must be between 0 and 168 (7 days)',
        },
        { status: 400 }
      );
    }

    // Run cleanup
    const cleanupConfig: CleanupConfig = {
      maxAgeHours,
      dryRun,
      verbose,
    };

    const result = await cleanupOrphanedFiles(cleanupConfig);

    // Log audit action (only if files were actually deleted)
    if (!dryRun && result.filesDeleted > 0) {
      await logAuditAction({
        userId: user.id,
        action: AuditAction.FILE_CLEANUP,
        resourceId: 'temp-uploads',
        resourceType: 'file-storage',
        metadata: JSON.stringify({
          filesDeleted: result.filesDeleted,
          bytesFreed: result.totalBytesFreed,
          maxAgeHours,
          duration: result.duration,
          errors: result.errors.length,
        }),
      });
    }

    // Build response message
    const message = dryRun
      ? `Would delete ${result.filesDeleted} file(s), freeing ${formatBytes(result.totalBytesFreed)}`
      : `Deleted ${result.filesDeleted} file(s), freed ${formatBytes(result.totalBytesFreed)}`;

    return NextResponse.json({
      success: result.success,
      data: {
        filesScanned: result.filesScanned,
        filesDeleted: result.filesDeleted,
        bytesFreed: result.totalBytesFreed,
        bytesFreedFormatted: formatBytes(result.totalBytesFreed),
        duration: result.duration,
        dryRun,
        maxAgeHours,
        errors: result.errors,
        deletedFiles: verbose ? result.deletedFiles : undefined,
      },
      message,
    });
  } catch (error) {
    console.error('Error during file cleanup:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to cleanup files. Please try again later.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
