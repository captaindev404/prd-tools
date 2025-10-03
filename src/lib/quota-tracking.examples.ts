/**
 * Quota Tracking Utility - Usage Examples
 *
 * Demonstrates how to use the quota tracking functions
 * in real-world scenarios for research panels.
 */

import {
  calculateQuotaProgressWithMapping,
  getQuotaHealthSummary,
  type PanelMemberWithQuotas,
  type QuotaProgress,
} from './quota-tracking';
import type { Panel } from '@/types/panel';

/**
 * Example 1: Balanced Role Distribution
 *
 * Target: 30% PM, 20% PO, 50% USER
 * Actual: 30% PM, 20% PO, 50% USER (Perfect balance)
 */
export function exampleBalancedPanel() {
  const panel: Panel = {
    id: 'pan_01HQX7K2M3N4P5Q6R7S8T9U0',
    name: 'Product Feedback Panel',
    description: 'Balanced panel for product feedback research',
    createdById: 'usr_researcher',
    archived: false,
    eligibilityRules: {
      includeRoles: ['PM', 'PO', 'USER'],
    },
    sizeTarget: 100,
    quotas: [
      { id: 'quota_pm', key: 'role', targetPercentage: 30 },
      { id: 'quota_po', key: 'role', targetPercentage: 20 },
      { id: 'quota_user', key: 'role', targetPercentage: 50 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const members: PanelMemberWithQuotas[] = [
    ...createMembers(30, 'PM', 'paris'),
    ...createMembers(20, 'PO', 'lyon'),
    ...createMembers(50, 'USER', 'marseille'),
  ];

  const quotaMapping = new Map([
    ['quota_pm', 'PM'],
    ['quota_po', 'PO'],
    ['quota_user', 'USER'],
  ]);

  const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);
  const summary = getQuotaHealthSummary(progress);

  console.log('\n=== Example 1: Balanced Panel ===');
  console.log('Progress:', JSON.stringify(progress, null, 2));
  console.log('Summary:', summary);
  console.log('Expected: All quotas on_track with 0% deviation\n');

  return { progress, summary };
}

/**
 * Example 2: Over-Recruited PM Segment
 *
 * Target: 40% PM, 60% USER
 * Actual: 66.7% PM, 33.3% USER (PMs over-recruited)
 */
export function exampleOverRecruitedSegment() {
  const panel: Panel = {
    id: 'pan_02ABC3D4E5F6G7H8I9J0K1L2',
    name: 'PM Research Panel',
    description: 'Panel showing PM over-recruitment',
    createdById: 'usr_researcher',
    archived: false,
    eligibilityRules: {},
    sizeTarget: 100,
    quotas: [
      { id: 'quota_pm', key: 'role', targetPercentage: 40 },
      { id: 'quota_user', key: 'role', targetPercentage: 60 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const members: PanelMemberWithQuotas[] = [
    ...createMembers(20, 'PM', 'paris'),   // 66.7% of 30
    ...createMembers(10, 'USER', 'lyon'),  // 33.3% of 30
  ];

  const quotaMapping = new Map([
    ['quota_pm', 'PM'],
    ['quota_user', 'USER'],
  ]);

  const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);
  const summary = getQuotaHealthSummary(progress);

  console.log('\n=== Example 2: Over-Recruited PM Segment ===');
  console.log('Progress:', JSON.stringify(progress, null, 2));
  console.log('Summary:', summary);
  console.log('Expected: PM critical (+26.67%), USER critical (-26.67%)\n');

  return { progress, summary };
}

/**
 * Example 3: Village Geographic Distribution
 *
 * Target: Equal distribution across 3 villages (33.3% each)
 * Actual: Paris 45%, Lyon 30%, Marseille 25%
 */
export function exampleVillageDistribution() {
  const panel: Panel = {
    id: 'pan_03MNO4P5Q6R7S8T9U0V1W2X3',
    name: 'Geographic Distribution Panel',
    description: 'Panel tracking village representation',
    createdById: 'usr_researcher',
    archived: false,
    eligibilityRules: {},
    sizeTarget: 100,
    quotas: [
      { id: 'quota_paris', key: 'village_id', targetPercentage: 33.33 },
      { id: 'quota_lyon', key: 'village_id', targetPercentage: 33.33 },
      { id: 'quota_marseille', key: 'village_id', targetPercentage: 33.33 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const members: PanelMemberWithQuotas[] = [
    ...createMembers(45, 'USER', 'paris'),
    ...createMembers(30, 'USER', 'lyon'),
    ...createMembers(25, 'USER', 'marseille'),
  ];

  const quotaMapping = new Map([
    ['quota_paris', 'paris'],
    ['quota_lyon', 'lyon'],
    ['quota_marseille', 'marseille'],
  ]);

  const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);
  const summary = getQuotaHealthSummary(progress);

  console.log('\n=== Example 3: Village Distribution ===');
  console.log('Progress:', JSON.stringify(progress, null, 2));
  console.log('Summary:', summary);
  console.log('Expected: Paris warning (+11.67%), Lyon on_track (-3.33%), Marseille warning (-8.33%)\n');

  return { progress, summary };
}

/**
 * Example 4: Complex Multi-Dimensional Quotas
 *
 * Combining role and village quotas
 */
export function exampleMultiDimensionalQuotas() {
  const panel: Panel = {
    id: 'pan_04YZA5B6C7D8E9F0G1H2I3J4',
    name: 'Complex Quota Panel',
    description: 'Panel with role and village quotas',
    createdById: 'usr_researcher',
    archived: false,
    eligibilityRules: {},
    sizeTarget: 100,
    quotas: [
      // Role quotas
      { id: 'quota_pm', key: 'role', targetPercentage: 30 },
      { id: 'quota_user', key: 'role', targetPercentage: 70 },
      // Village quotas
      { id: 'quota_paris', key: 'village_id', targetPercentage: 50 },
      { id: 'quota_lyon', key: 'village_id', targetPercentage: 50 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const members: PanelMemberWithQuotas[] = [
    // Paris: 15 PM, 35 USER = 50 total
    ...createMembers(15, 'PM', 'paris'),
    ...createMembers(35, 'USER', 'paris'),
    // Lyon: 15 PM, 35 USER = 50 total
    ...createMembers(15, 'PM', 'lyon'),
    ...createMembers(35, 'USER', 'lyon'),
  ];

  const quotaMapping = new Map([
    ['quota_pm', 'PM'],
    ['quota_user', 'USER'],
    ['quota_paris', 'paris'],
    ['quota_lyon', 'lyon'],
  ]);

  const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);
  const summary = getQuotaHealthSummary(progress);

  console.log('\n=== Example 4: Multi-Dimensional Quotas ===');
  console.log('Progress:', JSON.stringify(progress, null, 2));
  console.log('Summary:', summary);
  console.log('Expected: All quotas on_track (perfect balance)\n');

  return { progress, summary };
}

/**
 * Example 5: Department-Based Quotas (with HRIS integration)
 *
 * Target: 25% Engineering, 25% Product, 25% Operations, 25% Support
 */
export function exampleDepartmentQuotas() {
  const panel: Panel = {
    id: 'pan_05KLM6N7O8P9Q0R1S2T3U4V5',
    name: 'Department Distribution Panel',
    description: 'Panel tracking department representation',
    createdById: 'usr_researcher',
    archived: false,
    eligibilityRules: {},
    sizeTarget: 100,
    quotas: [
      { id: 'quota_eng', key: 'department', targetPercentage: 25 },
      { id: 'quota_product', key: 'department', targetPercentage: 25 },
      { id: 'quota_ops', key: 'department', targetPercentage: 25 },
      { id: 'quota_support', key: 'department', targetPercentage: 25 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const members: PanelMemberWithQuotas[] = [
    ...createMembersWithDept(30, 'USER', 'paris', 'Engineering'),
    ...createMembersWithDept(20, 'USER', 'lyon', 'Product'),
    ...createMembersWithDept(25, 'USER', 'marseille', 'Operations'),
    ...createMembersWithDept(25, 'USER', 'nice', 'Support'),
  ];

  const quotaMapping = new Map([
    ['quota_eng', 'Engineering'],
    ['quota_product', 'Product'],
    ['quota_ops', 'Operations'],
    ['quota_support', 'Support'],
  ]);

  const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);
  const summary = getQuotaHealthSummary(progress);

  console.log('\n=== Example 5: Department Quotas ===');
  console.log('Progress:', JSON.stringify(progress, null, 2));
  console.log('Summary:', summary);
  console.log('Expected: Engineering on_track, Product warning, others on_track\n');

  return { progress, summary };
}

/**
 * Example 6: Interpreting Quota Status
 *
 * Demonstrates how to interpret quota status indicators
 */
export function exampleQuotaStatusInterpretation() {
  console.log('\n=== Quota Status Interpretation Guide ===\n');

  const examples: QuotaProgress[] = [
    {
      quotaKey: 'role',
      quotaValue: 'PM',
      targetPercentage: 30,
      currentCount: 31,
      currentPercentage: 31,
      deviation: 1,
      status: 'on_track',
    },
    {
      quotaKey: 'role',
      quotaValue: 'PO',
      targetPercentage: 20,
      currentCount: 28,
      currentPercentage: 28,
      deviation: 8,
      status: 'warning',
    },
    {
      quotaKey: 'role',
      quotaValue: 'USER',
      targetPercentage: 50,
      currentCount: 30,
      currentPercentage: 30,
      deviation: -20,
      status: 'critical',
    },
  ];

  console.log('Status Definitions:');
  console.log('  - on_track:  Within ±5% of target');
  console.log('  - warning:   Between ±5-15% of target');
  console.log('  - critical:  More than ±15% from target\n');

  examples.forEach(quota => {
    console.log(`${quota.quotaValue} (${quota.status}):`);
    console.log(`  Target: ${quota.targetPercentage}%`);
    console.log(`  Current: ${quota.currentPercentage}% (${quota.currentCount} members)`);
    console.log(`  Deviation: ${quota.deviation > 0 ? '+' : ''}${quota.deviation}%`);
    console.log(`  Action: ${getRecommendedAction(quota)}\n`);
  });

  return examples;
}

/**
 * Helper: Get recommended action based on quota status
 */
function getRecommendedAction(quota: QuotaProgress): string {
  if (quota.status === 'on_track') {
    return 'No action needed - continue recruitment as planned';
  } else if (quota.status === 'warning') {
    if (quota.deviation > 0) {
      return `Slow recruitment for ${quota.quotaValue} - over quota by ${quota.deviation}%`;
    } else {
      return `Prioritize recruitment for ${quota.quotaValue} - under quota by ${Math.abs(quota.deviation)}%`;
    }
  } else {
    // critical
    if (quota.deviation > 0) {
      return `STOP recruiting ${quota.quotaValue} - significantly over quota`;
    } else {
      return `URGENT: Recruit more ${quota.quotaValue} - significantly under quota`;
    }
  }
}

/**
 * Helper: Create mock members
 */
function createMembers(
  count: number,
  role: string,
  villageId: string
): PanelMemberWithQuotas[] {
  return Array(count)
    .fill(null)
    .map((_, i) => ({
      id: `usr_${role.toLowerCase()}_${villageId}_${i}`,
      role,
      villageId,
      employeeId: `emp_${role.toLowerCase()}_${i}`,
    }));
}

/**
 * Helper: Create mock members with department
 */
function createMembersWithDept(
  count: number,
  role: string,
  villageId: string,
  department: string
): PanelMemberWithQuotas[] {
  return Array(count)
    .fill(null)
    .map((_, i) => ({
      id: `usr_${department.toLowerCase()}_${i}`,
      role,
      villageId,
      employeeId: `emp_${department.toLowerCase()}_${i}`,
      department,
    }));
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('\n========================================');
  console.log('QUOTA TRACKING UTILITY - EXAMPLES');
  console.log('========================================');

  exampleBalancedPanel();
  exampleOverRecruitedSegment();
  exampleVillageDistribution();
  exampleMultiDimensionalQuotas();
  exampleDepartmentQuotas();
  exampleQuotaStatusInterpretation();

  console.log('\n========================================\n');
}

// Uncomment to run examples:
// runAllExamples();
