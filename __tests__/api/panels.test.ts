/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server'
import { Role } from '@prisma/client'
import {
  GET as GETById,
  PATCH,
  DELETE
} from '@/app/api/panels/[id]/route'
import {
  POST as POSTMembers,
  GET as GETMembers
} from '@/app/api/panels/[id]/members/route'
import {
  DELETE as DELETEMember
} from '@/app/api/panels/[id]/members/[userId]/route'
import {
  GET as GETEligibilityPreview
} from '@/app/api/panels/[id]/eligibility-preview/route'

/**
 * Integration Tests for Panels API
 *
 * Tests:
 * - PATCH /api/panels/[id] (update panel)
 * - DELETE /api/panels/[id] (soft delete panel)
 * - POST /api/panels/[id]/members (bulk invite members)
 * - DELETE /api/panels/[id]/members/[userId] (remove member)
 * - GET /api/panels/[id]/eligibility-preview (preview eligible users)
 * - Permission checks (401, 403)
 * - Ownership checks for edit/delete
 * - Eligibility validation
 */

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    panel: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    panelMembership: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
  canEditPanel: jest.fn(),
  canDeletePanel: jest.fn(),
  canManagePanelMembers: jest.fn(),
}))

jest.mock('@/lib/panel-eligibility', () => ({
  validateCriteria: jest.fn(),
  buildEligibilityWhereClause: jest.fn(),
  filterUsersByConsents: jest.fn(),
  checkEligibility: jest.fn(),
}))

jest.mock('@/lib/notifications', () => ({
  sendPanelInviteNotification: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import { getCurrentUser, canManagePanelMembers } from '@/lib/auth-helpers'
import {
  validateCriteria,
  buildEligibilityWhereClause,
  filterUsersByConsents,
  checkEligibility
} from '@/lib/panel-eligibility'
import { sendPanelInviteNotification } from '@/lib/notifications'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockCanManagePanelMembers = canManagePanelMembers as jest.MockedFunction<typeof canManagePanelMembers>
const mockValidateCriteria = validateCriteria as jest.MockedFunction<typeof validateCriteria>
const mockBuildEligibilityWhereClause = buildEligibilityWhereClause as jest.MockedFunction<typeof buildEligibilityWhereClause>
const mockFilterUsersByConsents = filterUsersByConsents as jest.MockedFunction<typeof filterUsersByConsents>
const mockCheckEligibility = checkEligibility as jest.MockedFunction<typeof checkEligibility>
const mockSendPanelInviteNotification = sendPanelInviteNotification as jest.MockedFunction<typeof sendPanelInviteNotification>

describe('Panels API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PATCH /api/panels/[id] - Update Panel', () => {
    const mockResearcher = {
      id: 'usr_researcher',
      email: 'researcher@example.com',
      displayName: 'Researcher',
      role: Role.RESEARCHER,
    }

    const mockPanel = {
      id: 'pan_123',
      name: 'Test Panel',
      description: 'Test Description',
      eligibilityRules: JSON.stringify({ roles: ['USER'] }),
      sizeTarget: 50,
      archived: false,
      createdById: 'usr_researcher',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should update panel successfully with valid data', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)
      mockValidateCriteria.mockReturnValue({ valid: true, errors: [] })

      const updatedPanel = {
        ...mockPanel,
        name: 'Updated Panel Name',
        description: 'Updated Description',
        _count: { memberships: 5 },
      }

      mockPrisma.panel.update.mockResolvedValue(updatedPanel as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Panel Name',
          description: 'Updated Description',
        }),
      })

      const response = await PATCH(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Updated Panel Name')
      expect(mockPrisma.panel.update).toHaveBeenCalled()
      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'panel.updated',
          }),
        })
      )
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      })

      const response = await PATCH(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when panel does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      })

      const response = await PATCH(request, { params: { id: 'pan_nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
    })

    it('should return 403 when user is not creator and lacks permissions', async () => {
      const otherUser = {
        id: 'usr_other',
        email: 'other@example.com',
        displayName: 'Other User',
        role: Role.USER,
      }

      mockGetCurrentUser.mockResolvedValue(otherUser)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      })

      const response = await PATCH(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should allow panel creator to edit even without special role', async () => {
      const creator = {
        id: 'usr_researcher',
        email: 'creator@example.com',
        displayName: 'Creator',
        role: Role.USER, // Regular user but is creator
      }

      mockGetCurrentUser.mockResolvedValue(creator)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)
      mockValidateCriteria.mockReturnValue({ valid: true, errors: [] })

      const updatedPanel = {
        ...mockPanel,
        name: 'Updated by Creator',
        _count: { memberships: 0 },
      }

      mockPrisma.panel.update.mockResolvedValue(updatedPanel as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated by Creator' }),
      })

      const response = await PATCH(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should validate name length (minimum 3 characters)', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'AB' }), // Too short
      })

      const response = await PATCH(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Name must be at least 3 characters',
          }),
        ])
      )
    })

    it('should validate name length (maximum 100 characters)', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'A'.repeat(101) }), // Too long
      })

      const response = await PATCH(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Name must not exceed 100 characters',
          }),
        ])
      )
    })

    it('should validate description length (maximum 500 characters)', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'PATCH',
        body: JSON.stringify({ description: 'A'.repeat(501) }), // Too long
      })

      const response = await PATCH(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'description',
            message: 'Description must not exceed 500 characters',
          }),
        ])
      )
    })

    it('should validate eligibility rules', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)
      mockValidateCriteria.mockReturnValue({
        valid: false,
        errors: ['Invalid role specified', 'Missing required field'],
      })

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'PATCH',
        body: JSON.stringify({
          eligibilityRules: { invalid: 'criteria' },
        }),
      })

      const response = await PATCH(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'eligibilityRules',
            message: expect.stringContaining('Invalid eligibility rules'),
          }),
        ])
      )
    })

    it('should validate sizeTarget is a positive number', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'PATCH',
        body: JSON.stringify({ sizeTarget: -5 }), // Negative number
      })

      const response = await PATCH(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sizeTarget',
            message: 'Size target must be a positive number',
          }),
        ])
      )
    })
  })

  describe('DELETE /api/panels/[id] - Soft Delete Panel', () => {
    const mockAdmin = {
      id: 'usr_admin',
      email: 'admin@example.com',
      displayName: 'Admin',
      role: Role.ADMIN,
    }

    const mockPanel = {
      id: 'pan_123',
      name: 'Test Panel',
      description: 'Test Description',
      eligibilityRules: JSON.stringify({ roles: ['USER'] }),
      sizeTarget: 50,
      archived: false,
      createdById: 'usr_creator',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should soft delete panel successfully by admin', async () => {
      mockGetCurrentUser.mockResolvedValue(mockAdmin)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)
      mockPrisma.panel.update.mockResolvedValue({ ...mockPanel, archived: true } as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'pan_123' } })

      expect(response.status).toBe(204)
      expect(mockPrisma.panel.update).toHaveBeenCalledWith({
        where: { id: 'pan_123' },
        data: { archived: true },
      })
      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'panel.archived',
          }),
        })
      )
    })

    it('should allow panel creator to delete', async () => {
      const creator = {
        id: 'usr_creator',
        email: 'creator@example.com',
        displayName: 'Creator',
        role: Role.RESEARCHER,
      }

      mockGetCurrentUser.mockResolvedValue(creator)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)
      mockPrisma.panel.update.mockResolvedValue({ ...mockPanel, archived: true } as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'pan_123' } })

      expect(response.status).toBe(204)
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when panel does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue(mockAdmin)
      mockPrisma.panel.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'pan_nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
    })

    it('should return 403 when user is not creator or admin', async () => {
      const otherUser = {
        id: 'usr_other',
        email: 'other@example.com',
        displayName: 'Other User',
        role: Role.RESEARCHER, // Has RESEARCHER role but not creator or admin
      }

      mockGetCurrentUser.mockResolvedValue(otherUser)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  describe('POST /api/panels/[id]/members - Bulk Invite Members', () => {
    const mockResearcher = {
      id: 'usr_researcher',
      email: 'researcher@example.com',
      displayName: 'Researcher',
      role: Role.RESEARCHER,
    }

    const mockPanel = {
      id: 'pan_123',
      name: 'Test Panel',
      description: 'Test Description',
      eligibilityRules: JSON.stringify({ roles: ['USER'], required_consents: ['research_contact'] }),
      sizeTarget: 50,
      archived: false,
      createdById: 'usr_researcher',
      _count: { memberships: 10 },
    }

    it('should invite eligible users successfully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockCanManagePanelMembers.mockReturnValue(true)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const eligibleUsers = [
        {
          id: 'usr_eligible1',
          employeeId: 'emp_001',
          displayName: 'Eligible User 1',
          email: 'eligible1@example.com',
          role: Role.USER,
          currentVillageId: 'village_1',
          consents: JSON.stringify({ research_contact: true }),
          villageHistory: JSON.stringify([]),
          createdAt: new Date(),
        },
      ]

      mockPrisma.user.findMany.mockResolvedValue(eligibleUsers as any)
      mockPrisma.panelMembership.findUnique.mockResolvedValue(null)
      mockCheckEligibility.mockReturnValue({ eligible: true, reasons: [] })
      mockPrisma.panelMembership.create.mockResolvedValue({} as any)
      mockPrisma.event.create.mockResolvedValue({} as any)
      mockSendPanelInviteNotification.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members', {
        method: 'POST',
        body: JSON.stringify({ userIds: ['usr_eligible1'] }),
      })

      const response = await POSTMembers(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.added).toBe(1)
      expect(data.skipped).toHaveLength(0)
      expect(mockPrisma.panelMembership.create).toHaveBeenCalled()
      expect(mockSendPanelInviteNotification).toHaveBeenCalledWith(
        'usr_eligible1',
        'pan_123',
        'Test Panel',
        'Researcher'
      )
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members', {
        method: 'POST',
        body: JSON.stringify({ userIds: ['usr_1'] }),
      })

      const response = await POSTMembers(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when user lacks panel management permissions', async () => {
      const regularUser = {
        id: 'usr_user',
        email: 'user@example.com',
        displayName: 'User',
        role: Role.USER,
      }

      mockGetCurrentUser.mockResolvedValue(regularUser)
      mockCanManagePanelMembers.mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members', {
        method: 'POST',
        body: JSON.stringify({ userIds: ['usr_1'] }),
      })

      const response = await POSTMembers(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return 404 when panel does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockCanManagePanelMembers.mockReturnValue(true)
      mockPrisma.panel.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_nonexistent/members', {
        method: 'POST',
        body: JSON.stringify({ userIds: ['usr_1'] }),
      })

      const response = await POSTMembers(request, { params: { id: 'pan_nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
    })

    it('should validate userIds is a non-empty array', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockCanManagePanelMembers.mockReturnValue(true)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members', {
        method: 'POST',
        body: JSON.stringify({ userIds: [] }), // Empty array
      })

      const response = await POSTMembers(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.message).toBe('userIds must be a non-empty array')
    })

    it('should check size target before inviting', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockCanManagePanelMembers.mockReturnValue(true)

      const fullPanel = {
        ...mockPanel,
        sizeTarget: 15,
        _count: { memberships: 10 },
      }

      mockPrisma.panel.findUnique.mockResolvedValue(fullPanel as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members', {
        method: 'POST',
        body: JSON.stringify({ userIds: ['usr_1', 'usr_2', 'usr_3', 'usr_4', 'usr_5', 'usr_6'] }), // Would exceed target
      })

      const response = await POSTMembers(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.message).toContain('exceed panel size target')
    })

    it('should skip users who are already members', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockCanManagePanelMembers.mockReturnValue(true)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const users = [
        {
          id: 'usr_existing',
          employeeId: 'emp_001',
          displayName: 'Existing User',
          email: 'existing@example.com',
          role: Role.USER,
          currentVillageId: 'village_1',
          consents: JSON.stringify({ research_contact: true }),
          villageHistory: JSON.stringify([]),
          createdAt: new Date(),
        },
      ]

      mockPrisma.user.findMany.mockResolvedValue(users as any)
      mockPrisma.panelMembership.findUnique.mockResolvedValue({ id: 'membership_existing' } as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members', {
        method: 'POST',
        body: JSON.stringify({ userIds: ['usr_existing'] }),
      })

      const response = await POSTMembers(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.added).toBe(0)
      expect(data.skipped).toHaveLength(1)
      expect(data.skipped[0].reason).toContain('Already a member')
    })

    it('should skip users who do not meet eligibility criteria', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockCanManagePanelMembers.mockReturnValue(true)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)

      const ineligibleUsers = [
        {
          id: 'usr_ineligible',
          employeeId: 'emp_002',
          displayName: 'Ineligible User',
          email: 'ineligible@example.com',
          role: Role.ADMIN, // Wrong role
          currentVillageId: 'village_1',
          consents: JSON.stringify({ research_contact: false }),
          villageHistory: JSON.stringify([]),
          createdAt: new Date(),
        },
      ]

      mockPrisma.user.findMany.mockResolvedValue(ineligibleUsers as any)
      mockPrisma.panelMembership.findUnique.mockResolvedValue(null)
      mockCheckEligibility.mockReturnValue({
        eligible: false,
        reasons: ['Role does not match', 'Missing required consent']
      })

      const request = new NextRequest('http://localhost/api/panels/pan_123/members', {
        method: 'POST',
        body: JSON.stringify({ userIds: ['usr_ineligible'] }),
      })

      const response = await POSTMembers(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.added).toBe(0)
      expect(data.skipped).toHaveLength(1)
      expect(data.skipped[0].reason).toContain('Does not meet eligibility criteria')
    })
  })

  describe('DELETE /api/panels/[id]/members/[userId] - Remove Member', () => {
    const mockResearcher = {
      id: 'usr_researcher',
      email: 'researcher@example.com',
      displayName: 'Researcher',
      role: Role.RESEARCHER,
    }

    const mockMembership = {
      id: 'membership_123',
      panelId: 'pan_123',
      userId: 'usr_member',
      active: true,
      panel: {
        id: 'pan_123',
        name: 'Test Panel',
      },
    }

    it('should remove member successfully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panelMembership.findFirst.mockResolvedValue(mockMembership as any)
      mockPrisma.panelMembership.delete.mockResolvedValue(mockMembership as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members/usr_member', {
        method: 'DELETE',
      })

      const response = await DELETEMember(request, { params: { id: 'pan_123', userId: 'usr_member' } })

      expect(response.status).toBe(204)
      expect(mockPrisma.panelMembership.delete).toHaveBeenCalledWith({
        where: { id: 'membership_123' },
      })
      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'panel.member_removed',
          }),
        })
      )
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members/usr_member', {
        method: 'DELETE',
      })

      const response = await DELETEMember(request, { params: { id: 'pan_123', userId: 'usr_member' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when user lacks permissions (not RESEARCHER/PM/ADMIN)', async () => {
      const regularUser = {
        id: 'usr_user',
        email: 'user@example.com',
        displayName: 'User',
        role: Role.USER,
      }

      mockGetCurrentUser.mockResolvedValue(regularUser)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members/usr_member', {
        method: 'DELETE',
      })

      const response = await DELETEMember(request, { params: { id: 'pan_123', userId: 'usr_member' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return 404 when membership does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panelMembership.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members/usr_nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETEMember(request, { params: { id: 'pan_123', userId: 'usr_nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Panel member not found')
    })

    it('should allow PM to remove members', async () => {
      const pmUser = {
        id: 'usr_pm',
        email: 'pm@example.com',
        displayName: 'PM',
        role: Role.PM,
      }

      mockGetCurrentUser.mockResolvedValue(pmUser)
      mockPrisma.panelMembership.findFirst.mockResolvedValue(mockMembership as any)
      mockPrisma.panelMembership.delete.mockResolvedValue(mockMembership as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members/usr_member', {
        method: 'DELETE',
      })

      const response = await DELETEMember(request, { params: { id: 'pan_123', userId: 'usr_member' } })

      expect(response.status).toBe(204)
    })

    it('should allow ADMIN to remove members', async () => {
      const adminUser = {
        id: 'usr_admin',
        email: 'admin@example.com',
        displayName: 'Admin',
        role: Role.ADMIN,
      }

      mockGetCurrentUser.mockResolvedValue(adminUser)
      mockPrisma.panelMembership.findFirst.mockResolvedValue(mockMembership as any)
      mockPrisma.panelMembership.delete.mockResolvedValue(mockMembership as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123/members/usr_member', {
        method: 'DELETE',
      })

      const response = await DELETEMember(request, { params: { id: 'pan_123', userId: 'usr_member' } })

      expect(response.status).toBe(204)
    })
  })

  describe('GET /api/panels/[id]/eligibility-preview - Preview Eligible Users', () => {
    const mockResearcher = {
      id: 'usr_researcher',
      email: 'researcher@example.com',
      displayName: 'Researcher',
      role: Role.RESEARCHER,
    }

    const mockPanel = {
      id: 'pan_123',
      name: 'Test Panel',
      description: 'Test Description',
      eligibilityRules: JSON.stringify({
        roles: ['USER'],
        required_consents: ['research_contact'],
        villages: ['village_1'],
      }),
      sizeTarget: 50,
      archived: false,
    }

    it('should return eligible users preview successfully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)
      mockBuildEligibilityWhereClause.mockReturnValue({ role: 'USER' })

      const eligibleUsers = [
        {
          id: 'usr_eligible1',
          employeeId: 'emp_001',
          email: 'eligible1@example.com',
          displayName: 'Eligible User 1',
          role: Role.USER,
          currentVillageId: 'village_1',
          consents: JSON.stringify({ research_contact: true }),
          villageHistory: JSON.stringify([]),
          createdAt: new Date(),
        },
        {
          id: 'usr_eligible2',
          employeeId: 'emp_002',
          email: 'eligible2@example.com',
          displayName: 'Eligible User 2',
          role: Role.USER,
          currentVillageId: 'village_1',
          consents: JSON.stringify({ research_contact: true }),
          villageHistory: JSON.stringify([]),
          createdAt: new Date(),
        },
      ]

      mockPrisma.user.findMany.mockResolvedValue(eligibleUsers as any)
      mockFilterUsersByConsents.mockReturnValue(eligibleUsers)

      const request = new NextRequest('http://localhost/api/panels/pan_123/eligibility-preview')

      const response = await GETEligibilityPreview(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(2)
      expect(data.data.sample).toHaveLength(2)
      expect(data.data.sample[0]).toMatchObject({
        id: 'usr_eligible1',
        displayName: 'Eligible User 1',
        role: Role.USER,
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_123/eligibility-preview')

      const response = await GETEligibilityPreview(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when user lacks permissions (not RESEARCHER/PM/ADMIN)', async () => {
      const regularUser = {
        id: 'usr_user',
        email: 'user@example.com',
        displayName: 'User',
        role: Role.USER,
      }

      mockGetCurrentUser.mockResolvedValue(regularUser)

      const request = new NextRequest('http://localhost/api/panels/pan_123/eligibility-preview')

      const response = await GETEligibilityPreview(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return 404 when panel does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/panels/pan_nonexistent/eligibility-preview')

      const response = await GETEligibilityPreview(request, { params: { id: 'pan_nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
    })

    it('should limit sample to 10 users even if more are eligible', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)
      mockBuildEligibilityWhereClause.mockReturnValue({ role: 'USER' })

      const manyEligibleUsers = Array.from({ length: 50 }, (_, i) => ({
        id: `usr_eligible${i}`,
        employeeId: `emp_${i.toString().padStart(3, '0')}`,
        email: `eligible${i}@example.com`,
        displayName: `Eligible User ${i}`,
        role: Role.USER,
        currentVillageId: 'village_1',
        consents: JSON.stringify({ research_contact: true }),
        villageHistory: JSON.stringify([]),
        createdAt: new Date(),
      }))

      mockPrisma.user.findMany.mockResolvedValue(manyEligibleUsers as any)
      mockFilterUsersByConsents.mockReturnValue(manyEligibleUsers)

      const request = new NextRequest('http://localhost/api/panels/pan_123/eligibility-preview')

      const response = await GETEligibilityPreview(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(50)
      expect(data.data.sample).toHaveLength(10) // Should be limited to 10
    })

    it('should handle invalid eligibility rules JSON', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)

      const invalidPanel = {
        ...mockPanel,
        eligibilityRules: 'invalid json {',
      }

      mockPrisma.panel.findUnique.mockResolvedValue(invalidPanel as any)

      const request = new NextRequest('http://localhost/api/panels/pan_123/eligibility-preview')

      const response = await GETEligibilityPreview(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Invalid eligibility rules')
    })

    it('should include note when count reaches limit of 200', async () => {
      mockGetCurrentUser.mockResolvedValue(mockResearcher)
      mockPrisma.panel.findUnique.mockResolvedValue(mockPanel as any)
      mockBuildEligibilityWhereClause.mockReturnValue({ role: 'USER' })

      const maxEligibleUsers = Array.from({ length: 200 }, (_, i) => ({
        id: `usr_eligible${i}`,
        employeeId: `emp_${i.toString().padStart(3, '0')}`,
        email: `eligible${i}@example.com`,
        displayName: `Eligible User ${i}`,
        role: Role.USER,
        currentVillageId: 'village_1',
        consents: JSON.stringify({ research_contact: true }),
        villageHistory: JSON.stringify([]),
        createdAt: new Date(),
      }))

      mockPrisma.user.findMany.mockResolvedValue(maxEligibleUsers as any)
      mockFilterUsersByConsents.mockReturnValue(maxEligibleUsers)

      const request = new NextRequest('http://localhost/api/panels/pan_123/eligibility-preview')

      const response = await GETEligibilityPreview(request, { params: { id: 'pan_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.count).toBe(200)
      expect(data.data.note).toBeDefined()
      expect(data.data.note).toContain('Count may be higher')
    })
  })
})
