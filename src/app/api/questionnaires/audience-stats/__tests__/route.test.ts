/**
 * Tests for audience statistics calculation API endpoint
 * @jest-environment node
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    panel: {
      findMany: jest.fn(),
    },
    panelMembership: {
      findMany: jest.fn(),
    },
    village: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockPrismaUserCount = prisma.user.count as jest.MockedFunction<typeof prisma.user.count>;
const mockPrismaUserFindMany = prisma.user.findMany as jest.MockedFunction<typeof prisma.user.findMany>;
const mockPrismaPanelFindMany = prisma.panel.findMany as jest.MockedFunction<typeof prisma.panel.findMany>;
const mockPrismaPanelMembershipFindMany = prisma.panelMembership.findMany as jest.MockedFunction<typeof prisma.panelMembership.findMany>;
const mockPrismaVillageFindMany = prisma.village.findMany as jest.MockedFunction<typeof prisma.village.findMany>;

describe('POST /api/questionnaires/audience-stats', () => {
  const mockResearcherUser = {
    id: 'usr_researcher123',
    email: 'researcher@clubmed.com',
    role: 'RESEARCHER',
    employeeId: 'EMP123',
  };

  const mockAdminUser = {
    id: 'usr_admin123',
    email: 'admin@clubmed.com',
    role: 'ADMIN',
    employeeId: 'EMP456',
  };

  const mockRegularUser = {
    id: 'usr_user123',
    email: 'user@clubmed.com',
    role: 'USER',
    employeeId: 'EMP789',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({ targetingType: 'all_users' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized. Please log in.');
    });

    it('should return 403 if user is not a researcher or admin', async () => {
      mockGetCurrentUser.mockResolvedValue(mockRegularUser as any);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({ targetingType: 'all_users' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized. Researcher or Admin access required.');
    });

    it('should allow researchers to access the endpoint', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcherUser as any);
      mockPrismaUserCount.mockResolvedValue(150);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({ targetingType: 'all_users' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should allow admins to access the endpoint', async () => {
      mockGetCurrentUser.mockResolvedValue(mockAdminUser as any);
      mockPrismaUserCount.mockResolvedValue(150);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({ targetingType: 'all_users' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue(mockResearcherUser as any);
    });

    it('should return 400 if targetingType is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('targetingType is required');
    });

    it('should return 400 for invalid targeting type', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({ targetingType: 'invalid_type' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid targeting type');
    });
  });

  describe('All Users Targeting', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue(mockResearcherUser as any);
    });

    it('should calculate total user count for all_users targeting', async () => {
      mockPrismaUserCount.mockResolvedValue(250);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({ targetingType: 'all_users' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.estimatedReach).toBe(250);
      expect(data.breakdown.description).toBe('All registered users');
      expect(data.breakdown.totalUsers).toBe(250);
    });

    it('should handle zero users', async () => {
      mockPrismaUserCount.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({ targetingType: 'all_users' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedReach).toBe(0);
    });
  });

  describe('Panel Targeting', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue(mockResearcherUser as any);
    });

    it('should return 0 reach when no panels are selected', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({
          targetingType: 'specific_panels',
          panelIds: []
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedReach).toBe(0);
      expect(data.breakdown.description).toBe('No panels selected');
    });

    it('should calculate reach for single panel', async () => {
      const mockPanels = [
        {
          id: 'pan_123',
          name: 'Power Users',
          _count: { memberships: 45 },
        },
      ];

      const mockMemberships = [
        { userId: 'usr_1' },
        { userId: 'usr_2' },
        { userId: 'usr_3' },
      ];

      mockPrismaPanelFindMany.mockResolvedValue(mockPanels as any);
      mockPrismaPanelMembershipFindMany.mockResolvedValue(mockMemberships as any);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({
          targetingType: 'specific_panels',
          panelIds: ['pan_123']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedReach).toBe(3);
      expect(data.breakdown.panels[0].name).toBe('Power Users');
      expect(data.breakdown.panels[0].memberCount).toBe(45);
      expect(data.breakdown.uniqueUsers).toBe(3);
    });

    it('should deduplicate users across multiple panels', async () => {
      const mockPanels = [
        {
          id: 'pan_123',
          name: 'Power Users',
          _count: { memberships: 45 },
        },
        {
          id: 'pan_456',
          name: 'Beta Testers',
          _count: { memberships: 30 },
        },
      ];

      // Simulating overlapping users between panels
      const mockMemberships = [
        { userId: 'usr_1' },
        { userId: 'usr_2' },
        { userId: 'usr_3' },
        { userId: 'usr_4' },
        { userId: 'usr_5' },
      ];

      mockPrismaPanelFindMany.mockResolvedValue(mockPanels as any);
      mockPrismaPanelMembershipFindMany.mockResolvedValue(mockMemberships as any);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({
          targetingType: 'specific_panels',
          panelIds: ['pan_123', 'pan_456']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedReach).toBe(5); // Unique users
      expect(data.breakdown.totalMemberships).toBe(75); // 45 + 30
      expect(data.breakdown.uniqueUsers).toBe(5);
    });

    it('should exclude archived panels', async () => {
      mockPrismaPanelFindMany.mockResolvedValue([]);
      mockPrismaPanelMembershipFindMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({
          targetingType: 'specific_panels',
          panelIds: ['pan_archived']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(mockPrismaPanelFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            archived: false,
          }),
        })
      );
      expect(data.estimatedReach).toBe(0);
    });
  });

  describe('Village Targeting', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue(mockResearcherUser as any);
    });

    it('should return 0 reach when no villages are selected', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({
          targetingType: 'specific_villages',
          villageIds: []
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedReach).toBe(0);
      expect(data.breakdown.description).toBe('No villages selected');
    });

    it('should calculate reach for selected villages', async () => {
      const mockVillages = [
        {
          id: 'vlg-001',
          name: 'Punta Cana',
          _count: { users: 85 },
        },
        {
          id: 'vlg-002',
          name: 'Cancun',
          _count: { users: 72 },
        },
      ];

      const mockUsers = [
        { id: 'usr_1' },
        { id: 'usr_2' },
        { id: 'usr_3' },
      ];

      mockPrismaVillageFindMany.mockResolvedValue(mockVillages as any);
      mockPrismaUserFindMany.mockResolvedValue(mockUsers as any);

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({
          targetingType: 'specific_villages',
          villageIds: ['vlg-001', 'vlg-002']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedReach).toBe(3);
      expect(data.breakdown.villages).toHaveLength(2);
      expect(data.breakdown.villages[0].name).toBe('Punta Cana');
      expect(data.breakdown.totalUsers).toBe(3);
    });
  });

  describe('Role Targeting', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue(mockResearcherUser as any);
    });

    it('should return 0 reach when no roles are selected', async () => {
      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({
          targetingType: 'by_role',
          roles: []
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedReach).toBe(0);
      expect(data.breakdown.description).toBe('No roles selected');
    });

    it('should calculate reach for selected roles', async () => {
      mockPrismaUserCount
        .mockResolvedValueOnce(50) // PM count
        .mockResolvedValueOnce(30); // PO count

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({
          targetingType: 'by_role',
          roles: ['PM', 'PO']
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedReach).toBe(80); // 50 + 30
      expect(data.breakdown.roles).toHaveLength(2);
      expect(data.breakdown.roles[0]).toEqual({ role: 'PM', count: 50 });
      expect(data.breakdown.roles[1]).toEqual({ role: 'PO', count: 30 });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue(mockResearcherUser as any);
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaUserCount.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/questionnaires/audience-stats', {
        method: 'POST',
        body: JSON.stringify({ targetingType: 'all_users' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to calculate audience statistics');
    });
  });
});
