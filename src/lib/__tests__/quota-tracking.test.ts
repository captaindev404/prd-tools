/**
 * Tests and Examples for Quota Tracking Utility
 */

import {
  calculateQuotaProgress,
  calculateQuotaProgressWithMapping,
  getQuotaHealthSummary,
  type PanelMemberWithQuotas,
  type QuotaProgress,
} from '../quota-tracking';
import type { Panel } from '@/types/panel';

describe('Quota Tracking Utility', () => {
  describe('calculateQuotaProgressWithMapping', () => {
    it('should calculate quota progress for role-based quotas', () => {
      // Panel with role quotas: 40% PM, 60% USER
      const panel: Panel = {
        id: 'pan_01234',
        name: 'Test Panel',
        description: 'Test panel for quota tracking',
        createdById: 'usr_admin',
        archived: false,
        eligibilityRules: {},
        sizeTarget: 100,
        quotas: [
          { id: 'q1', key: 'role', targetPercentage: 40 },
          { id: 'q2', key: 'role', targetPercentage: 60 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Current members: 2 PMs, 1 USER (66.7% PM, 33.3% USER)
      const members: PanelMemberWithQuotas[] = [
        { id: 'u1', role: 'PM', villageId: 'paris', employeeId: 'e1' },
        { id: 'u2', role: 'PM', villageId: 'paris', employeeId: 'e2' },
        { id: 'u3', role: 'USER', villageId: 'lyon', employeeId: 'e3' },
      ];

      // Map quota IDs to expected values
      const quotaMapping = new Map([
        ['q1', 'PM'],
        ['q2', 'USER'],
      ]);

      const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);

      // Check PM quota
      const pmQuota = progress.find(q => q.quotaValue === 'PM');
      expect(pmQuota).toBeDefined();
      expect(pmQuota?.currentCount).toBe(2);
      expect(pmQuota?.currentPercentage).toBe(66.67);
      expect(pmQuota?.deviation).toBe(26.67);
      expect(pmQuota?.status).toBe('critical'); // More than 15% deviation

      // Check USER quota
      const userQuota = progress.find(q => q.quotaValue === 'USER');
      expect(userQuota).toBeDefined();
      expect(userQuota?.currentCount).toBe(1);
      expect(userQuota?.currentPercentage).toBe(33.33);
      expect(userQuota?.deviation).toBe(-26.67);
      expect(userQuota?.status).toBe('critical'); // More than 15% deviation
    });

    it('should calculate quota progress for village-based quotas', () => {
      const panel: Panel = {
        id: 'pan_56789',
        name: 'Village Panel',
        description: 'Panel with village quotas',
        createdById: 'usr_admin',
        archived: false,
        eligibilityRules: {},
        sizeTarget: 100,
        quotas: [
          { id: 'q1', key: 'village_id', targetPercentage: 50 },
          { id: 'q2', key: 'village_id', targetPercentage: 50 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const members: PanelMemberWithQuotas[] = [
        { id: 'u1', role: 'USER', villageId: 'paris', employeeId: 'e1' },
        { id: 'u2', role: 'USER', villageId: 'paris', employeeId: 'e2' },
        { id: 'u3', role: 'USER', villageId: 'lyon', employeeId: 'e3' },
        { id: 'u4', role: 'USER', villageId: 'lyon', employeeId: 'e4' },
      ];

      const quotaMapping = new Map([
        ['q1', 'paris'],
        ['q2', 'lyon'],
      ]);

      const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);

      // Both villages should be on track
      expect(progress).toHaveLength(2);
      progress.forEach(q => {
        expect(q.currentPercentage).toBe(50);
        expect(q.deviation).toBe(0);
        expect(q.status).toBe('on_track');
      });
    });

    it('should handle empty members array gracefully', () => {
      const panel: Panel = {
        id: 'pan_empty',
        name: 'Empty Panel',
        description: 'Panel with no members',
        createdById: 'usr_admin',
        archived: false,
        eligibilityRules: {},
        sizeTarget: 100,
        quotas: [
          { id: 'q1', key: 'role', targetPercentage: 50 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const members: PanelMemberWithQuotas[] = [];
      const quotaMapping = new Map([['q1', 'PM']]);

      const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);

      expect(progress).toHaveLength(0);
    });

    it('should handle panels without quotas gracefully', () => {
      const panel: Panel = {
        id: 'pan_noquota',
        name: 'No Quota Panel',
        description: 'Panel without quotas',
        createdById: 'usr_admin',
        archived: false,
        eligibilityRules: {},
        sizeTarget: 100,
        quotas: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const members: PanelMemberWithQuotas[] = [
        { id: 'u1', role: 'USER', villageId: 'paris', employeeId: 'e1' },
      ];

      const quotaMapping = new Map();

      const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);

      expect(progress).toHaveLength(0);
    });
  });

  describe('getQuotaHealthSummary', () => {
    it('should calculate health summary correctly', () => {
      const quotaProgress: QuotaProgress[] = [
        {
          quotaKey: 'role',
          quotaValue: 'PM',
          targetPercentage: 40,
          currentCount: 42,
          currentPercentage: 42,
          deviation: 2,
          status: 'on_track',
        },
        {
          quotaKey: 'role',
          quotaValue: 'USER',
          targetPercentage: 60,
          currentCount: 58,
          currentPercentage: 58,
          deviation: -2,
          status: 'on_track',
        },
        {
          quotaKey: 'village_id',
          quotaValue: 'paris',
          targetPercentage: 30,
          currentCount: 40,
          currentPercentage: 40,
          deviation: 10,
          status: 'warning',
        },
      ];

      const summary = getQuotaHealthSummary(quotaProgress);

      expect(summary.total).toBe(3);
      expect(summary.onTrack).toBe(2);
      expect(summary.warning).toBe(1);
      expect(summary.critical).toBe(0);
      expect(summary.avgDeviation).toBe(4.67); // (2 + 2 + 10) / 3
      expect(summary.healthScore).toBe(66.67); // 2/3 * 100
    });

    it('should handle empty progress array', () => {
      const summary = getQuotaHealthSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.onTrack).toBe(0);
      expect(summary.warning).toBe(0);
      expect(summary.critical).toBe(0);
      expect(summary.avgDeviation).toBe(0);
      expect(summary.healthScore).toBe(100);
    });
  });
});

/**
 * Usage Examples
 */

// Example 1: Track role-based quotas
export function exampleRoleQuotas() {
  const panel: Panel = {
    id: 'pan_roles',
    name: 'Product Manager Research Panel',
    description: 'Panel for PM feedback',
    createdById: 'usr_researcher',
    archived: false,
    eligibilityRules: {
      includeRoles: ['PM', 'PO', 'USER'],
    },
    sizeTarget: 50,
    quotas: [
      { id: 'quota_pm', key: 'role', targetPercentage: 30 },
      { id: 'quota_po', key: 'role', targetPercentage: 20 },
      { id: 'quota_user', key: 'role', targetPercentage: 50 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const members: PanelMemberWithQuotas[] = [
    // 15 PMs
    ...Array(15).fill(null).map((_, i) => ({
      id: `u_pm_${i}`,
      role: 'PM',
      villageId: 'paris',
      employeeId: `emp_pm_${i}`,
    })),
    // 10 POs
    ...Array(10).fill(null).map((_, i) => ({
      id: `u_po_${i}`,
      role: 'PO',
      villageId: 'lyon',
      employeeId: `emp_po_${i}`,
    })),
    // 25 USERs
    ...Array(25).fill(null).map((_, i) => ({
      id: `u_user_${i}`,
      role: 'USER',
      villageId: 'marseille',
      employeeId: `emp_user_${i}`,
    })),
  ];

  const quotaMapping = new Map([
    ['quota_pm', 'PM'],
    ['quota_po', 'PO'],
    ['quota_user', 'USER'],
  ]);

  const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);
  const summary = getQuotaHealthSummary(progress);

  console.log('Role Quota Progress:', progress);
  console.log('Health Summary:', summary);

  return { progress, summary };
}

// Example 2: Track village distribution
export function exampleVillageQuotas() {
  const panel: Panel = {
    id: 'pan_villages',
    name: 'Multi-Village Panel',
    description: 'Balanced village representation',
    createdById: 'usr_researcher',
    archived: false,
    eligibilityRules: {},
    sizeTarget: 100,
    quotas: [
      { id: 'quota_paris', key: 'village_id', targetPercentage: 40 },
      { id: 'quota_lyon', key: 'village_id', targetPercentage: 35 },
      { id: 'quota_marseille', key: 'village_id', targetPercentage: 25 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const members: PanelMemberWithQuotas[] = [
    ...Array(45).fill(null).map((_, i) => ({
      id: `u_paris_${i}`,
      role: 'USER',
      villageId: 'paris',
      employeeId: `emp_paris_${i}`,
    })),
    ...Array(30).fill(null).map((_, i) => ({
      id: `u_lyon_${i}`,
      role: 'USER',
      villageId: 'lyon',
      employeeId: `emp_lyon_${i}`,
    })),
    ...Array(25).fill(null).map((_, i) => ({
      id: `u_marseille_${i}`,
      role: 'USER',
      villageId: 'marseille',
      employeeId: `emp_marseille_${i}`,
    })),
  ];

  const quotaMapping = new Map([
    ['quota_paris', 'paris'],
    ['quota_lyon', 'lyon'],
    ['quota_marseille', 'marseille'],
  ]);

  const progress = calculateQuotaProgressWithMapping(panel, members, quotaMapping);
  const summary = getQuotaHealthSummary(progress);

  console.log('Village Quota Progress:', progress);
  console.log('Health Summary:', summary);

  return { progress, summary };
}
