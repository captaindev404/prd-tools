#!/usr/bin/env tsx
/**
 * HRIS Sync Script
 *
 * Syncs employee data from HRIS to Odyssey Feedback user database
 * - Matches users by employeeId
 * - Updates displayName, currentVillageId, email
 * - Creates new users if not exists
 * - Detects village transfers and updates villageHistory
 *
 * Run: npx tsx src/scripts/hris-sync.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HRISEmployee {
  employee_id: string;
  display_name: string;
  email: string;
  village_id: string;
  department?: string;
  role?: string;
}

interface VillageHistoryEntry {
  village_id: string;
  from: string;
  to: string | null;
}

interface SyncResult {
  totalEmployees: number;
  created: number;
  updated: number;
  villageTransfers: number;
  errors: Array<{ employeeId: string; error: string }>;
}

/**
 * Fetch employee data from HRIS API (or use mock data)
 */
async function fetchHRISData(): Promise<HRISEmployee[]> {
  const HRIS_API_URL = process.env.HRIS_API_URL;
  const HRIS_API_KEY = process.env.HRIS_API_KEY;

  // If HRIS API is configured, fetch real data
  if (HRIS_API_URL && HRIS_API_KEY) {
    try {
      const response = await fetch(HRIS_API_URL, {
        headers: {
          'Authorization': `Bearer ${HRIS_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HRIS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.employees || data;
    } catch (error) {
      console.error('Error fetching from HRIS API:', error);
      throw error;
    }
  }

  // Mock data for testing
  console.log('⚠️  Using mock HRIS data (configure HRIS_API_URL and HRIS_API_KEY for real data)');

  return [
    {
      employee_id: 'EMP001',
      display_name: 'Alice Johnson',
      email: 'alice.johnson@clubmed.com',
      village_id: 'vlg-001',
      department: 'Product',
      role: 'PM',
    },
    {
      employee_id: 'EMP002',
      display_name: 'Bob Smith',
      email: 'bob.smith@clubmed.com',
      village_id: 'vlg-002',
      department: 'Engineering',
      role: 'PO',
    },
    {
      employee_id: 'EMP003',
      display_name: 'Carol Davis',
      email: 'carol.davis@clubmed.com',
      village_id: 'vlg-001',
      department: 'Research',
      role: 'RESEARCHER',
    },
    {
      employee_id: 'EMP004',
      display_name: 'David Wilson - Transferred',
      email: 'david.wilson@clubmed.com',
      village_id: 'vlg-003', // Simulating a village transfer
      department: 'Operations',
      role: 'USER',
    },
  ];
}

/**
 * Parse village history from JSON string
 */
function parseVillageHistory(historyJson: string): VillageHistoryEntry[] {
  try {
    return JSON.parse(historyJson);
  } catch {
    return [];
  }
}

/**
 * Detect and handle village transfer
 */
async function handleVillageTransfer(
  userId: string,
  currentVillageId: string | null,
  newVillageId: string,
  currentHistory: VillageHistoryEntry[]
): Promise<{ transferred: boolean; newHistory: VillageHistoryEntry[] }> {

  // No transfer if village is the same or user has no current village
  if (!currentVillageId || currentVillageId === newVillageId) {
    return { transferred: false, newHistory: currentHistory };
  }

  const today = new Date().toISOString().split('T')[0];
  const updatedHistory = [...currentHistory];

  // Find the current active entry (where to is null)
  const activeEntryIndex = updatedHistory.findIndex(entry => entry.to === null);

  if (activeEntryIndex >= 0) {
    // Close the current entry
    updatedHistory[activeEntryIndex].to = today;
  }

  // Add new entry for the new village
  updatedHistory.push({
    village_id: newVillageId,
    from: today,
    to: null,
  });

  console.log(`  🔄 Village transfer detected: ${currentVillageId} → ${newVillageId}`);

  return { transferred: true, newHistory: updatedHistory };
}

/**
 * Sync a single employee
 */
async function syncEmployee(employee: HRISEmployee, result: SyncResult): Promise<void> {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { employeeId: employee.employee_id },
    });

    if (existingUser) {
      // User exists - update
      const updates: any = {};
      let hasChanges = false;

      // Check for changes
      if (existingUser.displayName !== employee.display_name) {
        updates.displayName = employee.display_name;
        hasChanges = true;
      }

      if (existingUser.email !== employee.email) {
        updates.email = employee.email;
        hasChanges = true;
      }

      // Check for village transfer
      const currentHistory = parseVillageHistory(existingUser.villageHistory);
      const { transferred, newHistory } = await handleVillageTransfer(
        existingUser.id,
        existingUser.currentVillageId,
        employee.village_id,
        currentHistory
      );

      if (transferred) {
        updates.currentVillageId = employee.village_id;
        updates.villageHistory = JSON.stringify(newHistory);
        hasChanges = true;
        result.villageTransfers++;

        // Log village transfer event
        await prisma.event.create({
          data: {
            type: 'user.village_transfer',
            userId: existingUser.id,
            payload: JSON.stringify({
              employeeId: employee.employee_id,
              fromVillageId: existingUser.currentVillageId,
              toVillageId: employee.village_id,
              timestamp: new Date().toISOString(),
            }),
          },
        });
      }

      if (hasChanges) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: updates,
        });
        result.updated++;
        console.log(`  ✅ Updated: ${employee.display_name} (${employee.employee_id})`);
      }
    } else {
      // User doesn't exist - create
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const villageHistory: VillageHistoryEntry[] = [
        {
          village_id: employee.village_id,
          from: new Date().toISOString().split('T')[0],
          to: null,
        },
      ];

      await prisma.user.create({
        data: {
          id: userId,
          employeeId: employee.employee_id,
          email: employee.email,
          displayName: employee.display_name,
          currentVillageId: employee.village_id,
          villageHistory: JSON.stringify(villageHistory),
          role: (employee.role as any) || 'USER',
          preferredLanguage: 'en',
          consents: JSON.stringify([]),
          consentHistory: JSON.stringify([]),
        },
      });

      result.created++;
      console.log(`  ✨ Created: ${employee.display_name} (${employee.employee_id})`);
    }
  } catch (error) {
    console.error(`  ❌ Error syncing ${employee.employee_id}:`, error);
    result.errors.push({
      employeeId: employee.employee_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Main sync function
 */
async function syncHRIS(): Promise<SyncResult> {
  console.log('🔄 Starting HRIS sync...\n');

  const result: SyncResult = {
    totalEmployees: 0,
    created: 0,
    updated: 0,
    villageTransfers: 0,
    errors: [],
  };

  try {
    // Fetch employee data
    const employees = await fetchHRISData();
    result.totalEmployees = employees.length;

    console.log(`📊 Processing ${employees.length} employees...\n`);

    // Sync each employee
    for (const employee of employees) {
      await syncEmployee(employee, result);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 HRIS Sync Summary');
    console.log('='.repeat(60));
    console.log(`Total employees:    ${result.totalEmployees}`);
    console.log(`Created:            ${result.created}`);
    console.log(`Updated:            ${result.updated}`);
    console.log(`Village transfers:  ${result.villageTransfers}`);
    console.log(`Errors:             ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error) => {
        console.log(`  - ${error.employeeId}: ${error.error}`);
      });
    }

    console.log('='.repeat(60));

    return result;
  } catch (error) {
    console.error('\n❌ Fatal error during HRIS sync:', error);
    throw error;
  }
}

// Run the sync
if (require.main === module) {
  syncHRIS()
    .then(() => {
      console.log('\n✅ HRIS sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ HRIS sync failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { syncHRIS, fetchHRISData };
