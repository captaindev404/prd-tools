/**
 * HRIS Sync Logic
 *
 * Handles bidirectional HRIS sync with conflict detection and resolution
 * Supports full sync, incremental sync, and manual sync operations
 */

import { prisma } from '../prisma';
import { logAuditAction, AuditAction } from '../audit-log';
import { HRISClient, HRISEmployee, createHRISClient, MockHRISClient } from './hris-client';
import { reconcileEmployee, autoResolveConflict, ReconciliationResult } from './hris-reconciliation';

export interface SyncOptions {
  syncType: 'full' | 'incremental' | 'manual';
  triggeredBy?: string;
  dryRun?: boolean;
  since?: Date;
}

export interface SyncResult {
  syncId: string;
  status: 'completed' | 'failed' | 'completed_with_errors';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  conflictsDetected: number;
  conflictsAutoResolved: number;
  duration: number;
  errors: Array<{ employeeId: string; error: string }>;
}

/**
 * Perform HRIS sync
 */
export async function performHRISSync(options: SyncOptions): Promise<SyncResult> {
  const startTime = Date.now();

  // Create sync record
  const sync = await prisma.hRISSync.create({
    data: {
      status: 'in_progress',
      syncType: options.syncType,
      triggeredBy: options.triggeredBy,
      startedAt: new Date(),
      metadata: JSON.stringify(options),
    },
  });

  const result: SyncResult = {
    syncId: sync.id,
    status: 'completed',
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    conflictsDetected: 0,
    conflictsAutoResolved: 0,
    duration: 0,
    errors: [],
  };

  try {
    // Get HRIS client
    const client = getHRISClient();
    if (!client) {
      throw new Error('HRIS client not available');
    }

    // Fetch employees from HRIS
    let employees: HRISEmployee[];
    if (options.syncType === 'incremental' && options.since) {
      employees = await client.fetchEmployeesSince(options.since);
    } else {
      employees = await client.fetchAllEmployees({ status: 'active' });
    }

    console.log(`Fetched ${employees.length} employees from HRIS`);

    // Process each employee
    for (const employee of employees) {
      result.recordsProcessed++;

      try {
        // Reconcile employee
        const reconciliation = await reconcileEmployee(employee, sync.id);

        // Handle reconciliation result
        switch (reconciliation.action) {
          case 'create':
            if (!options.dryRun) {
              await createUser(employee);
              result.recordsCreated++;
              await logAuditAction({
                userId: 'system',
                action: 'hris.user_created',
                resourceId: employee.employee_id,
                resourceType: 'user',
                metadata: { employee, syncId: sync.id },
              });
            }
            break;

          case 'update':
            if (!options.dryRun && reconciliation.userId) {
              await updateUser(reconciliation.userId, employee);
              result.recordsUpdated++;
              await logAuditAction({
                userId: 'system',
                action: 'hris.user_updated',
                resourceId: reconciliation.userId,
                resourceType: 'user',
                metadata: { employee, syncId: sync.id },
              });
            }
            break;

          case 'conflict':
            result.conflictsDetected++;
            console.log(`Conflict detected for ${employee.employee_id}: ${reconciliation.reason}`);

            // Try auto-resolution
            if (!options.dryRun && reconciliation.conflictId) {
              const autoResolved = await autoResolveConflict(reconciliation.conflictId);
              if (autoResolved) {
                result.conflictsAutoResolved++;
                result.recordsUpdated++;
              }
            }
            break;

          case 'skip':
            result.recordsFailed++;
            result.errors.push({
              employeeId: employee.employee_id,
              error: reconciliation.reason || 'Unknown error',
            });
            break;
        }
      } catch (error) {
        result.recordsFailed++;
        result.errors.push({
          employeeId: employee.employee_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`Error processing employee ${employee.employee_id}:`, error);
      }
    }

    // Update sync record
    const endTime = Date.now();
    result.duration = endTime - startTime;
    result.status =
      result.recordsFailed > 0 && result.recordsFailed === result.recordsProcessed
        ? 'failed'
        : result.recordsFailed > 0
          ? 'completed_with_errors'
          : 'completed';

    await prisma.hRISSync.update({
      where: { id: sync.id },
      data: {
        status: result.status,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsFailed: result.recordsFailed,
        conflictsDetected: result.conflictsDetected,
        completedAt: new Date(),
        errorDetails: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
      },
    });

    // Log audit event
    if (options.triggeredBy) {
      await logAuditAction({
        userId: options.triggeredBy,
        action: 'hris.sync_completed',
        resourceId: sync.id,
        resourceType: 'hris_sync',
        metadata: result,
      });
    }

    return result;
  } catch (error) {
    // Handle fatal error
    const endTime = Date.now();
    result.duration = endTime - startTime;
    result.status = 'failed';

    await prisma.hRISSync.update({
      where: { id: sync.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: error instanceof Error ? error.stack : null,
      },
    });

    if (options.triggeredBy) {
      await logAuditAction({
        userId: options.triggeredBy,
        action: 'hris.sync_failed',
        resourceId: sync.id,
        resourceType: 'hris_sync',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          ...result,
        },
      });
    }

    throw error;
  }
}

/**
 * Create user from HRIS data
 */
async function createUser(employee: HRISEmployee): Promise<void> {
  const { ulid } = await import('ulid');

  await prisma.user.create({
    data: {
      id: `usr_${ulid()}`,
      employeeId: employee.employee_id,
      email: employee.email,
      displayName: employee.display_name || `${employee.first_name} ${employee.last_name}`,
      currentVillageId: employee.village_id || null,
      role: employee.role || 'USER',
      villageHistory: employee.village_id
        ? JSON.stringify([
            {
              village_id: employee.village_id,
              from: employee.start_date || new Date().toISOString(),
              to: null,
            },
          ])
        : '[]',
    },
  });
}

/**
 * Update user from HRIS data
 */
async function updateUser(userId: string, employee: HRISEmployee): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentVillageId: true, villageHistory: true },
  });

  if (!existingUser) {
    throw new Error(`User ${userId} not found`);
  }

  // Parse existing village history
  const villageHistory = JSON.parse(existingUser.villageHistory);

  // Check for village transfer
  let updatedVillageHistory = villageHistory;
  if (
    employee.village_id &&
    existingUser.currentVillageId &&
    employee.village_id !== existingUser.currentVillageId
  ) {
    // Close current village assignment
    updatedVillageHistory = villageHistory.map((entry: any) =>
      entry.village_id === existingUser.currentVillageId && !entry.to
        ? { ...entry, to: employee.transfer_date || new Date().toISOString() }
        : entry
    );

    // Add new village assignment
    updatedVillageHistory.push({
      village_id: employee.village_id,
      from: employee.transfer_date || new Date().toISOString(),
      to: null,
    });
  }

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      employeeId: employee.employee_id,
      email: employee.email,
      displayName: employee.display_name || `${employee.first_name} ${employee.last_name}`,
      currentVillageId: employee.village_id || existingUser.currentVillageId,
      role: employee.role || 'USER',
      villageHistory: JSON.stringify(updatedVillageHistory),
    },
  });
}

/**
 * Get HRIS client (with mock fallback for development)
 */
function getHRISClient(): HRISClient | null {
  const syncEnabled = process.env.HRIS_SYNC_ENABLED === 'true';
  if (!syncEnabled) {
    console.log('HRIS sync is disabled');
    return null;
  }

  // Try to create real client
  const client = createHRISClient();
  if (client) {
    return client;
  }

  // Fallback to mock client in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock HRIS client for development');
    return new MockHRISClient();
  }

  return null;
}

/**
 * Get sync history
 */
export async function getSyncHistory(options?: { limit?: number; offset?: number }) {
  const { limit = 20, offset = 0 } = options || {};

  const [syncs, total] = await Promise.all([
    prisma.hRISSync.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hRISSync.count(),
  ]);

  return {
    syncs: syncs.map((sync) => ({
      ...sync,
      metadata: JSON.parse(sync.metadata),
      errorDetails: sync.errorDetails ? JSON.parse(sync.errorDetails) : null,
    })),
    total,
  };
}

/**
 * Get sync status
 */
export async function getSyncStatus(syncId: string) {
  const sync = await prisma.hRISSync.findUnique({
    where: { id: syncId },
  });

  if (!sync) {
    return null;
  }

  return {
    ...sync,
    metadata: JSON.parse(sync.metadata),
    errorDetails: sync.errorDetails ? JSON.parse(sync.errorDetails) : null,
  };
}

/**
 * Get latest sync
 */
export async function getLatestSync() {
  const sync = await prisma.hRISSync.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!sync) {
    return null;
  }

  return {
    ...sync,
    metadata: JSON.parse(sync.metadata),
    errorDetails: sync.errorDetails ? JSON.parse(sync.errorDetails) : null,
  };
}

/**
 * Check if sync is currently running
 */
export async function isSyncRunning(): Promise<boolean> {
  const runningSync = await prisma.hRISSync.findFirst({
    where: { status: 'in_progress' },
  });

  return !!runningSync;
}
