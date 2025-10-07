/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { Role } from '@prisma/client'
import { POST, DELETE, GET } from '@/app/api/feedback/[id]/vote/route'

/**
 * Integration Tests for Voting API
 *
 * Tests:
 * - POST /api/feedback/:id/vote (create vote, weight calculation)
 * - DELETE /api/feedback/:id/vote (remove vote)
 * - GET /api/feedback/:id/vote (check vote status)
 * - Unique constraint (one vote per user)
 * - Vote weight calculation integration
 */

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    feedback: {
      findUnique: jest.fn(),
    },
    vote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    panelMembership: {
      findMany: jest.fn(),
    },
    event: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('Vote API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/feedback/:id/vote - Cast Vote', () => {
    const mockUser = {
      id: 'usr_voter',
      email: 'voter@example.com',
      displayName: 'Test Voter',
      role: Role.USER,
      currentVillageId: 'village_1',
    }

    const mockFeedback = {
      id: 'fb_123',
      title: 'Test Feedback',
      state: 'new',
    }

    it('should cast vote successfully with correct weight calculation', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.findUnique.mockResolvedValue(null) // User hasn't voted yet

      // Mock for calculateBaseVoteWeight dependencies
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_voter',
        role: Role.USER,
        currentVillageId: 'village_1',
      } as any)
      mockPrisma.panelMembership.findMany.mockResolvedValue([])

      const mockVote = {
        id: 'vote_123',
        feedbackId: 'fb_123',
        userId: 'usr_voter',
        weight: 1.0,
        decayedWeight: 1.0,
        createdAt: new Date(),
        user: {
          id: 'usr_voter',
          displayName: 'Test Voter',
          role: Role.USER,
        },
      }

      mockPrisma.vote.create.mockResolvedValue(mockVote as any)
      mockPrisma.event.create.mockResolvedValue({} as any)
      mockPrisma.vote.aggregate.mockResolvedValue({
        _count: 1,
        _sum: {
          weight: 1.0,
          decayedWeight: 1.0,
        },
      } as any)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.vote.weight).toBe(1.0)
      expect(data.data.stats.count).toBe(1)
      expect(mockPrisma.vote.create).toHaveBeenCalled()
      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'vote.cast',
          }),
        })
      )
    })

    it('should calculate higher weight for PM role (2.0)', async () => {
      const pmUser = {
        ...mockUser,
        id: 'usr_pm',
        role: Role.PM,
      }

      mockGetCurrentUser.mockResolvedValue(pmUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.findUnique.mockResolvedValue(null)

      // Mock for calculateBaseVoteWeight dependencies
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_pm',
        role: Role.PM,
        currentVillageId: 'village_1',
      } as any)
      mockPrisma.panelMembership.findMany.mockResolvedValue([])

      mockPrisma.vote.create.mockImplementation((args: any) => {
        // Verify weight is 2.0 for PM (role weight 2.0 × village priority 1.0)
        expect(args.data.weight).toBeCloseTo(2.0, 2)
        return Promise.resolve({
          id: 'vote_pm',
          ...args.data,
          user: { id: 'usr_pm', displayName: 'PM User', role: Role.PM },
        } as any)
      })
      mockPrisma.event.create.mockResolvedValue({} as any)
      mockPrisma.vote.aggregate.mockResolvedValue({
        _count: 1,
        _sum: { weight: 2.0, decayedWeight: 2.0 },
      } as any)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockPrisma.vote.create).toHaveBeenCalled()
    })

    it('should apply panel membership boost (+0.3)', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.findUnique.mockResolvedValue(null)

      // Mock for calculateBaseVoteWeight dependencies
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_voter',
        role: Role.USER,
        currentVillageId: 'village_1',
      } as any)

      // User is a member of an active panel
      mockPrisma.panelMembership.findMany.mockResolvedValue([
        {
          userId: 'usr_voter',
          panelId: 'pan_123',
          active: true,
        },
      ] as any)

      mockPrisma.vote.create.mockImplementation((args: any) => {
        // Verify weight is 1.3 (base 1.0 + panel boost 0.3 × village priority 1.0)
        expect(args.data.weight).toBeCloseTo(1.3, 2)
        return Promise.resolve({
          id: 'vote_panel',
          ...args.data,
          user: mockUser,
        } as any)
      })
      mockPrisma.event.create.mockResolvedValue({} as any)
      mockPrisma.vote.aggregate.mockResolvedValue({
        _count: 1,
        _sum: { weight: 1.3, decayedWeight: 1.3 },
      } as any)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'fb_123' }) })

      expect(response.status).toBe(201)
      expect(mockPrisma.vote.create).toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when feedback does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_nonexistent/vote', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'fb_nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
      expect(data.message).toBe('Feedback item not found')
    })

    it('should return 409 when user has already voted', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)

      // User has already voted
      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'vote_existing',
        feedbackId: 'fb_123',
        userId: 'usr_voter',
        weight: 1.0,
      } as any)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toBe('You have already voted on this feedback')
      expect(mockPrisma.vote.create).not.toHaveBeenCalled()
    })

    it('should aggregate vote statistics correctly', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.findUnique.mockResolvedValue(null)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_voter',
        role: Role.USER,
        currentVillageId: 'village_1',
      } as any)
      mockPrisma.panelMembership.findMany.mockResolvedValue([])

      mockPrisma.vote.create.mockResolvedValue({
        id: 'vote_new',
        feedbackId: 'fb_123',
        userId: 'usr_voter',
        weight: 1.0,
        decayedWeight: 1.0,
        user: mockUser,
      } as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      // Mock aggregate to return stats with multiple votes
      mockPrisma.vote.aggregate.mockResolvedValue({
        _count: 5,
        _sum: {
          weight: 7.5,
          decayedWeight: 6.2,
        },
      } as any)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.stats.count).toBe(5)
      expect(data.data.stats.totalWeight).toBe(7.5)
      expect(data.data.stats.totalDecayedWeight).toBe(6.2)
    })
  })

  describe('DELETE /api/feedback/:id/vote - Remove Vote', () => {
    const mockUser = {
      id: 'usr_voter',
      email: 'voter@example.com',
      displayName: 'Test Voter',
      role: Role.USER,
    }

    const mockFeedback = {
      id: 'fb_123',
    }

    const mockVote = {
      id: 'vote_123',
      feedbackId: 'fb_123',
      userId: 'usr_voter',
      weight: 1.0,
    }

    it('should remove vote successfully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.findUnique.mockResolvedValue(mockVote as any)
      mockPrisma.vote.delete.mockResolvedValue(mockVote as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'fb_123' }) })

      expect(response.status).toBe(204)
      expect(mockPrisma.vote.delete).toHaveBeenCalledWith({
        where: { id: 'vote_123' },
      })
      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'vote.removed',
          }),
        })
      )
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when feedback does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_nonexistent/vote', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'fb_nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
      expect(data.message).toBe('Feedback item not found')
    })

    it('should return 404 when user has not voted', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
      expect(data.message).toBe('You have not voted on this feedback')
      expect(mockPrisma.vote.delete).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/feedback/:id/vote - Check Vote Status', () => {
    const mockUser = {
      id: 'usr_voter',
      email: 'voter@example.com',
      displayName: 'Test Voter',
      role: Role.USER,
    }

    const mockFeedback = {
      id: 'fb_123',
    }

    it('should return vote information when user has voted', async () => {
      const mockVote = {
        id: 'vote_123',
        feedbackId: 'fb_123',
        userId: 'usr_voter',
        weight: 2.0,
        decayedWeight: 1.8,
        createdAt: new Date(),
        user: {
          id: 'usr_voter',
          displayName: 'Test Voter',
          role: Role.USER,
        },
      }

      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.findUnique.mockResolvedValue(mockVote as any)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote')

      const response = await GET(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasVoted).toBe(true)
      expect(data.vote).toBeDefined()
      expect(data.vote.id).toBe('vote_123')
      expect(data.vote.weight).toBe(2.0)
      expect(data.vote.currentDecayedWeight).toBeDefined()
    })

    it('should return null when user has not voted', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote')

      const response = await GET(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasVoted).toBe(false)
      expect(data.vote).toBeNull()
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote')

      const response = await GET(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when feedback does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_nonexistent/vote')

      const response = await GET(request, { params: Promise.resolve({ id: 'fb_nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
      expect(data.message).toBe('Feedback item not found')
    })

    it('should calculate current decayed weight for old votes', async () => {
      const oldDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // 180 days ago
      const mockOldVote = {
        id: 'vote_old',
        feedbackId: 'fb_123',
        userId: 'usr_voter',
        weight: 2.0,
        decayedWeight: 2.0,
        createdAt: oldDate,
        user: {
          id: 'usr_voter',
          displayName: 'Test Voter',
          role: Role.USER,
        },
      }

      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.findUnique.mockResolvedValue(mockOldVote as any)

      const request = new NextRequest('http://localhost/api/feedback/fb_123/vote')

      const response = await GET(request, { params: Promise.resolve({ id: 'fb_123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.vote.currentDecayedWeight).toBeDefined()
      // After 180 days (half-life), weight should be approximately halved
      expect(data.vote.currentDecayedWeight).toBeCloseTo(1.0, 1)
    })
  })

  describe('Vote Uniqueness Constraint', () => {
    it('should enforce one vote per user per feedback', async () => {
      const mockUser = {
        id: 'usr_voter',
        email: 'voter@example.com',
        displayName: 'Test Voter',
        role: Role.USER,
        currentVillageId: 'village_1',
      }

      const mockFeedback = {
        id: 'fb_123',
        title: 'Test Feedback',
        state: 'new',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)

      // First vote attempt - should succeed
      mockPrisma.vote.findUnique.mockResolvedValueOnce(null)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_voter',
        role: Role.USER,
        currentVillageId: 'village_1',
      } as any)
      mockPrisma.panelMembership.findMany.mockResolvedValue([])
      mockPrisma.vote.create.mockResolvedValue({
        id: 'vote_123',
        feedbackId: 'fb_123',
        userId: 'usr_voter',
        weight: 1.0,
        user: mockUser,
      } as any)
      mockPrisma.event.create.mockResolvedValue({} as any)
      mockPrisma.vote.aggregate.mockResolvedValue({
        _count: 1,
        _sum: { weight: 1.0, decayedWeight: 1.0 },
      } as any)

      const request1 = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'POST',
      })
      const response1 = await POST(request1, { params: Promise.resolve({ id: 'fb_123' }) })
      expect(response1.status).toBe(201)

      // Second vote attempt - should fail
      mockPrisma.vote.findUnique.mockResolvedValueOnce({
        id: 'vote_123',
        feedbackId: 'fb_123',
        userId: 'usr_voter',
        weight: 1.0,
      } as any)

      const request2 = new NextRequest('http://localhost/api/feedback/fb_123/vote', {
        method: 'POST',
      })
      const response2 = await POST(request2, { params: Promise.resolve({ id: 'fb_123' }) })
      const data2 = await response2.json()

      expect(response2.status).toBe(409)
      expect(data2.error).toBe('Conflict')
    })
  })
})
