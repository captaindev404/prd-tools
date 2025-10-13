/**
 * HRIS Identity Reconciliation
 *
 * Handles identity matching and conflict resolution for HRIS sync
 * Preserves global user IDs while reconciling employee data
 */

import { prisma } from '../prisma';
import { HRISEmployee } from './hris-client';

export interface ReconciliationResult {
  action: 'create' | 'update' | 'conflict' | 'skip';
  userId?: string;
  conflictType?: string;
  conflictId?: string;
  reason?: string;
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'keep_system' | 'use_hris' | 'merge' | 'create_new';
  resolvedBy: string;
  notes?: string;
}

/**
 * Reconcile a single HRIS employee with existing system data
 */
export async function reconcileEmployee(
  employee: HRISEmployee,
  syncId: string
): Promise<ReconciliationResult> {
  try {
    // Step 1: Try to match by employee_id (primary key)
    const existingByEmployeeId = await prisma.user.findUnique({
      where: { employeeId: employee.employee_id },
      select: {
        id: true,
        employeeId: true,
        email: true,
        displayName: true,
        currentVillageId: true,
        role: true,
      },
    });

    // Step 2: Try to match by email (fallback)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: employee.email },
      select: {
        id: true,
        employeeId: true,
        email: true,
        displayName: true,
        currentVillageId: true,
        role: true,
      },
    });

    // Case 1: Perfect match by employee_id
    if (existingByEmployeeId && existingByEmployeeId.email === employee.email) {
      return {
        action: 'update',
        userId: existingByEmployeeId.id,
        reason: 'Matched by employee_id',
      };
    }

    // Case 2: Conflict - same employee_id but different email
    if (existingByEmployeeId && existingByEmployeeId.email !== employee.email) {
      const conflict = await createConflict({
        syncId,
        conflictType: 'email_change',
        hrisEmployeeId: employee.employee_id,
        hrisEmail: employee.email,
        hrisData: employee,
        existingUserId: existingByEmployeeId.id,
        systemData: existingByEmployeeId,
      });

      return {
        action: 'conflict',
        userId: existingByEmployeeId.id,
        conflictType: 'email_change',
        conflictId: conflict.id,
        reason: 'Email changed in HRIS',
      };
    }

    // Case 3: Conflict - same email but different employee_id
    if (existingByEmail && existingByEmail.employeeId !== employee.employee_id) {
      const conflict = await createConflict({
        syncId,
        conflictType: 'duplicate_email',
        hrisEmployeeId: employee.employee_id,
        hrisEmail: employee.email,
        hrisData: employee,
        existingUserId: existingByEmail.id,
        systemData: existingByEmail,
      });

      return {
        action: 'conflict',
        userId: existingByEmail.id,
        conflictType: 'duplicate_email',
        conflictId: conflict.id,
        reason: 'Email already exists with different employee_id',
      };
    }

    // Case 4: Match by email (employee_id doesn't exist yet)
    if (existingByEmail && !existingByEmployeeId) {
      return {
        action: 'update',
        userId: existingByEmail.id,
        reason: 'Matched by email, will update employee_id',
      };
    }

    // Case 5: Check if village exists (for new employees)
    if (employee.village_id) {
      const villageExists = await prisma.village.findUnique({
        where: { id: employee.village_id },
      });

      if (!villageExists) {
        const conflict = await createConflict({
          syncId,
          conflictType: 'village_not_found',
          hrisEmployeeId: employee.employee_id,
          hrisEmail: employee.email,
          hrisData: employee,
          existingUserId: null,
          systemData: null,
        });

        return {
          action: 'conflict',
          conflictType: 'village_not_found',
          conflictId: conflict.id,
          reason: `Village ${employee.village_id} does not exist`,
        };
      }
    }

    // Case 6: No match - create new user
    return {
      action: 'create',
      reason: 'New employee',
    };
  } catch (error) {
    console.error('Error reconciling employee:', error);
    return {
      action: 'skip',
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a conflict record
 */
async function createConflict(data: {
  syncId: string;
  conflictType: string;
  hrisEmployeeId: string;
  hrisEmail: string | null;
  hrisData: any;
  existingUserId: string | null;
  systemData: any;
}) {
  return await prisma.hRISConflict.create({
    data: {
      syncId: data.syncId,
      conflictType: data.conflictType,
      hrisEmployeeId: data.hrisEmployeeId,
      hrisEmail: data.hrisEmail,
      hrisData: JSON.stringify(data.hrisData),
      existingUserId: data.existingUserId,
      systemData: data.systemData ? JSON.stringify(data.systemData) : null,
      status: 'pending',
    },
  });
}

/**
 * Auto-resolve conflicts based on predefined rules
 */
export async function autoResolveConflict(conflictId: string): Promise<boolean> {
  const conflict = await prisma.hRISConflict.findUnique({
    where: { id: conflictId },
  });

  if (!conflict || conflict.status !== 'pending') {
    return false;
  }

  const hrisData = JSON.parse(conflict.hrisData) as HRISEmployee;

  // Auto-resolve rule 1: Email change for existing employee
  if (conflict.conflictType === 'email_change' && conflict.existingUserId) {
    // Verify email is not used by another user
    const emailInUse = await prisma.user.findUnique({
      where: { email: hrisData.email },
    });

    if (!emailInUse) {
      await prisma.hRISConflict.update({
        where: { id: conflictId },
        data: {
          status: 'auto_resolved',
          resolution: 'use_hris',
          resolvedAt: new Date(),
          resolutionNotes: 'Auto-resolved: Email updated from HRIS',
        },
      });

      // Update user email
      await prisma.user.update({
        where: { id: conflict.existingUserId },
        data: { email: hrisData.email },
      });

      return true;
    }
  }

  // Auto-resolve rule 2: Village not found - skip employee
  if (conflict.conflictType === 'village_not_found') {
    await prisma.hRISConflict.update({
      where: { id: conflictId },
      data: {
        status: 'auto_resolved',
        resolution: 'create_new',
        resolvedAt: new Date(),
        resolutionNotes: 'Auto-resolved: Create user without village assignment',
      },
    });
    return true;
  }

  return false;
}

/**
 * Manually resolve a conflict
 */
export async function resolveConflict(
  conflictId: string,
  resolution: ConflictResolution
): Promise<void> {
  const conflict = await prisma.hRISConflict.findUnique({
    where: { id: conflictId },
  });

  if (!conflict) {
    throw new Error('Conflict not found');
  }

  if (conflict.status !== 'pending') {
    throw new Error('Conflict already resolved');
  }

  const hrisData = JSON.parse(conflict.hrisData) as HRISEmployee;

  // Update conflict record
  await prisma.hRISConflict.update({
    where: { id: conflictId },
    data: {
      status: 'manually_resolved',
      resolution: resolution.resolution,
      resolvedBy: resolution.resolvedBy,
      resolvedAt: new Date(),
      resolutionNotes: resolution.notes,
    },
  });

  // Apply resolution
  switch (resolution.resolution) {
    case 'use_hris':
      if (conflict.existingUserId) {
        await updateUserFromHRIS(conflict.existingUserId, hrisData);
      }
      break;

    case 'keep_system':
      // Do nothing - keep existing system data
      break;

    case 'merge':
      if (conflict.existingUserId) {
        await mergeHRISData(conflict.existingUserId, hrisData);
      }
      break;

    case 'create_new':
      await createUserFromHRIS(hrisData);
      break;
  }
}

/**
 * Update user with HRIS data
 */
async function updateUserFromHRIS(userId: string, hrisData: HRISEmployee): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      employeeId: hrisData.employee_id,
      email: hrisData.email,
      displayName: hrisData.display_name || `${hrisData.first_name} ${hrisData.last_name}`,
      currentVillageId: hrisData.village_id || null,
      role: hrisData.role || 'USER',
    },
  });
}

/**
 * Merge HRIS data with existing user (selective update)
 */
async function mergeHRISData(userId: string, hrisData: HRISEmployee): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Only update fields that are empty or outdated
  await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: user.displayName || hrisData.display_name || `${hrisData.first_name} ${hrisData.last_name}`,
      currentVillageId: hrisData.village_id || user.currentVillageId,
      // Keep existing email and employeeId
    },
  });
}

/**
 * Create new user from HRIS data
 */
async function createUserFromHRIS(hrisData: HRISEmployee): Promise<void> {
  const { ulid } = await import('ulid');

  await prisma.user.create({
    data: {
      id: `usr_${ulid()}`,
      employeeId: hrisData.employee_id,
      email: hrisData.email,
      displayName: hrisData.display_name || `${hrisData.first_name} ${hrisData.last_name}`,
      currentVillageId: hrisData.village_id || null,
      role: hrisData.role || 'USER',
      villageHistory: hrisData.village_id
        ? JSON.stringify([
            {
              village_id: hrisData.village_id,
              from: hrisData.start_date || new Date().toISOString(),
              to: null,
            },
          ])
        : '[]',
    },
  });
}

/**
 * Get pending conflicts
 */
export async function getPendingConflicts(syncId?: string) {
  const where: any = { status: 'pending' };
  if (syncId) {
    where.syncId = syncId;
  }

  return await prisma.hRISConflict.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get conflict statistics
 */
export async function getConflictStats(syncId?: string) {
  const where: any = {};
  if (syncId) {
    where.syncId = syncId;
  }

  const [total, pending, autoResolved, manuallyResolved, ignored] = await Promise.all([
    prisma.hRISConflict.count({ where }),
    prisma.hRISConflict.count({ where: { ...where, status: 'pending' } }),
    prisma.hRISConflict.count({ where: { ...where, status: 'auto_resolved' } }),
    prisma.hRISConflict.count({ where: { ...where, status: 'manually_resolved' } }),
    prisma.hRISConflict.count({ where: { ...where, status: 'ignored' } }),
  ]);

  return {
    total,
    pending,
    autoResolved,
    manuallyResolved,
    ignored,
    byType: await getConflictsByType(syncId),
  };
}

/**
 * Get conflicts grouped by type
 */
async function getConflictsByType(syncId?: string) {
  const where: any = {};
  if (syncId) {
    where.syncId = syncId;
  }

  const conflicts = await prisma.hRISConflict.groupBy({
    by: ['conflictType'],
    where,
    _count: true,
  });

  return conflicts.reduce(
    (acc, item) => {
      acc[item.conflictType] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );
}
