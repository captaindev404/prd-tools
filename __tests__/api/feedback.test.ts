import { NextRequest, NextResponse } from 'next/server'
import { Role } from '@prisma/client'
import { GET, POST } from '@/app/api/feedback/route'
import { GET as GETById, PATCH } from '@/app/api/feedback/[id]/route'

/**
 * Integration Tests for Feedback API
 *
 * Tests:
 * - POST /api/feedback (create, validation, rate limit)
 * - GET /api/feedback (filters, pagination)
 * - PATCH /api/feedback/:id (edit window, permissions)
 */

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    feedback: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    vote: {
      findUnique: jest.fn(),
      aggregate: jest.fn(),
    },
    event: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
  canEditFeedback: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  incrementRateLimit: jest.fn(),
}))

jest.mock('@/lib/moderation', () => ({
  performAutoScreening: jest.fn(),
}))

jest.mock('@/lib/moderation-advanced', () => ({
  checkToxicity: jest.fn(),
  shouldAutoFlag: jest.fn(),
}))

jest.mock('ulid', () => ({
  ulid: jest.fn(() => 'test123'),
}))

import { prisma } from '@/lib/prisma'
import { getCurrentUser, canEditFeedback } from '@/lib/auth-helpers'
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit'
import { performAutoScreening } from '@/lib/moderation'
import { checkToxicity, shouldAutoFlag } from '@/lib/moderation-advanced'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockCanEditFeedback = canEditFeedback as jest.MockedFunction<typeof canEditFeedback>
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>
const mockIncrementRateLimit = incrementRateLimit as jest.MockedFunction<typeof incrementRateLimit>
const mockPerformAutoScreening = performAutoScreening as jest.MockedFunction<typeof performAutoScreening>
const mockCheckToxicity = checkToxicity as jest.MockedFunction<typeof checkToxicity>
const mockShouldAutoFlag = shouldAutoFlag as jest.MockedFunction<typeof shouldAutoFlag>

describe('Feedback API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/feedback - Create Feedback', () => {
    const mockUser = {
      id: 'usr_test',
      email: 'test@example.com',
      displayName: 'Test User',
      role: Role.USER,
      currentVillageId: 'village_1',
    }

    it('should create feedback successfully with valid data', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockCheckRateLimit.mockReturnValue({
        isExceeded: false,
        count: 5,
        limit: 10,
        resetAt: new Date(),
      })
      mockPerformAutoScreening.mockReturnValue({
        needsReview: false,
        signals: [],
        toxicityScore: 0.1,
        spamScore: 0.05,
        offTopicScore: 0.02,
        hasPii: false,
      })
      mockCheckToxicity.mockResolvedValue(0.1)
      mockShouldAutoFlag.mockReturnValue(false)

      const mockFeedback = {
        id: 'fb_test123',
        authorId: 'usr_test',
        title: 'Great feature request',
        body: 'This is a detailed description of the feature I need for my work.',
        state: 'new',
        moderationStatus: 'approved',
        createdAt: new Date(),
        author: mockUser,
        feature: null,
      }

      mockPrisma.feedback.create.mockResolvedValue(mockFeedback as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Great feature request',
          body: 'This is a detailed description of the feature I need for my work.',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('fb_test123')
      expect(mockPrisma.feedback.create).toHaveBeenCalled()
      expect(mockIncrementRateLimit).toHaveBeenCalledWith('usr_test')
      expect(mockPrisma.event.create).toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test feedback',
          body: 'This is a test feedback body.',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 429 when rate limit is exceeded', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      const resetAt = new Date(Date.now() + 3600000)
      mockCheckRateLimit.mockReturnValue({
        isExceeded: true,
        count: 10,
        limit: 10,
        resetAt,
      })

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test feedback',
          body: 'This is a test feedback body.',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
      expect(data.resetAt).toBeDefined()
    })

    it('should return 400 when title is too short', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockCheckRateLimit.mockReturnValue({
        isExceeded: false,
        count: 5,
        limit: 10,
        resetAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Short', // Less than 8 characters
          body: 'This is a valid body with enough characters.',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: 'Title must be at least 8 characters',
          }),
        ])
      )
    })

    it('should return 400 when title is too long', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockCheckRateLimit.mockReturnValue({
        isExceeded: false,
        count: 5,
        limit: 10,
        resetAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'A'.repeat(121), // More than 120 characters
          body: 'This is a valid body with enough characters.',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: 'Title must not exceed 120 characters',
          }),
        ])
      )
    })

    it('should return 400 when body is too short', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockCheckRateLimit.mockReturnValue({
        isExceeded: false,
        count: 5,
        limit: 10,
        resetAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Valid title here',
          body: 'Too short', // Less than 20 characters
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
            message: 'Body must be at least 20 characters',
          }),
        ])
      )
    })

    it('should return 400 when body is too long', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockCheckRateLimit.mockReturnValue({
        isExceeded: false,
        count: 5,
        limit: 10,
        resetAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Valid title here',
          body: 'A'.repeat(5001), // More than 5000 characters
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
            message: 'Body must not exceed 5000 characters',
          }),
        ])
      )
    })

    it('should apply PII redaction to title and body', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockCheckRateLimit.mockReturnValue({
        isExceeded: false,
        count: 5,
        limit: 10,
        resetAt: new Date(),
      })
      mockPerformAutoScreening.mockReturnValue({
        needsReview: false,
        signals: [],
        toxicityScore: 0.1,
        spamScore: 0.05,
        offTopicScore: 0.02,
        hasPii: true,
      })
      mockCheckToxicity.mockResolvedValue(0.1)
      mockShouldAutoFlag.mockReturnValue(false)

      mockPrisma.feedback.create.mockImplementation((args: any) => {
        return Promise.resolve({
          id: 'fb_test123',
          ...args.data,
          author: mockUser,
        } as any)
      })
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Contact me at test@email.com',
          body: 'You can call me at 555-123-4567 for more details.',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockPrisma.feedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.not.stringContaining('test@email.com'),
            body: expect.not.stringContaining('555-123-4567'),
          }),
        })
      )
    })

    it('should set moderation status to pending_review for toxic content', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockCheckRateLimit.mockReturnValue({
        isExceeded: false,
        count: 5,
        limit: 10,
        resetAt: new Date(),
      })
      mockPerformAutoScreening.mockReturnValue({
        needsReview: true,
        signals: ['toxicity'],
        toxicityScore: 0.8,
        spamScore: 0.05,
        offTopicScore: 0.02,
        hasPii: false,
      })
      mockCheckToxicity.mockResolvedValue(0.8)
      mockShouldAutoFlag.mockReturnValue(true)

      mockPrisma.feedback.create.mockResolvedValue({
        id: 'fb_toxic',
        moderationStatus: 'pending_review',
      } as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Toxic feedback title',
          body: 'This contains toxic content that should be flagged.',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockPrisma.feedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: 'pending_review',
            needsReview: true,
          }),
        })
      )
    })
  })

  describe('GET /api/feedback - List Feedback', () => {
    it('should return paginated feedback list', async () => {
      const mockFeedbackList = [
        {
          id: 'fb_1',
          title: 'Feedback 1',
          body: 'Body 1',
          author: { id: 'usr_1', displayName: 'User 1', email: 'user1@test.com' },
          feature: null,
          _count: { votes: 5 },
        },
        {
          id: 'fb_2',
          title: 'Feedback 2',
          body: 'Body 2',
          author: { id: 'usr_2', displayName: 'User 2', email: 'user2@test.com' },
          feature: null,
          _count: { votes: 3 },
        },
      ]

      mockPrisma.feedback.findMany.mockResolvedValue(mockFeedbackList as any)
      mockPrisma.feedback.count.mockResolvedValue(2)
      mockPrisma.vote.aggregate.mockResolvedValue({
        _sum: { weight: 10, decayedWeight: 8 },
        _count: 5,
      } as any)
      mockPrisma.vote.findUnique.mockResolvedValue(null)
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback?page=1&limit=20')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(2)
      expect(data.total).toBe(2)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(20)
    })

    it('should filter feedback by state', async () => {
      mockPrisma.feedback.findMany.mockResolvedValue([])
      mockPrisma.feedback.count.mockResolvedValue(0)
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback?state=new')

      await GET(request)

      expect(mockPrisma.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            state: 'new',
          }),
        })
      )
    })

    it('should filter feedback by featureId', async () => {
      mockPrisma.feedback.findMany.mockResolvedValue([])
      mockPrisma.feedback.count.mockResolvedValue(0)
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback?featureId=ft_123')

      await GET(request)

      expect(mockPrisma.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            featureId: 'ft_123',
          }),
        })
      )
    })

    it('should search feedback by title and body', async () => {
      mockPrisma.feedback.findMany.mockResolvedValue([])
      mockPrisma.feedback.count.mockResolvedValue(0)
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback?search=feature')

      await GET(request)

      expect(mockPrisma.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.anything() }),
              expect.objectContaining({ body: expect.anything() }),
            ]),
          }),
        })
      )
    })

    it('should respect pagination limits (max 100)', async () => {
      mockPrisma.feedback.findMany.mockResolvedValue([])
      mockPrisma.feedback.count.mockResolvedValue(0)
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback?limit=200')

      const response = await GET(request)
      const data = await response.json()

      expect(data.limit).toBe(100) // Should be capped at 100
    })
  })

  describe('GET /api/feedback/:id - Get Single Feedback', () => {
    it('should return feedback details with vote statistics', async () => {
      const mockFeedback = {
        id: 'fb_123',
        title: 'Test Feedback',
        body: 'Test body',
        author: { id: 'usr_1', displayName: 'User 1', email: 'user1@test.com', role: Role.USER },
        feature: null,
        duplicateOf: null,
        duplicates: [],
        votes: [],
      }

      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockPrisma.vote.aggregate.mockResolvedValue({
        _sum: { weight: 15, decayedWeight: 12 },
        _count: 7,
      } as any)
      mockPrisma.vote.findUnique.mockResolvedValue(null)
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_123')

      const response = await GETById(request, { params: { id: 'fb_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('fb_123')
      expect(data.voteCount).toBe(7)
      expect(data.voteWeight).toBe(12)
    })

    it('should return 404 for non-existent feedback', async () => {
      mockPrisma.feedback.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_nonexistent')

      const response = await GETById(request, { params: { id: 'fb_nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
    })
  })

  describe('PATCH /api/feedback/:id - Edit Feedback', () => {
    const mockUser = {
      id: 'usr_author',
      email: 'author@example.com',
      displayName: 'Author',
      role: Role.USER,
    }

    it('should update feedback within edit window', async () => {
      const editWindowEndsAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      const mockFeedback = {
        id: 'fb_123',
        authorId: 'usr_author',
        title: 'Original title',
        body: 'Original body',
        editWindowEndsAt,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockCanEditFeedback.mockReturnValue(true)

      const updatedFeedback = {
        ...mockFeedback,
        title: 'Updated title',
        body: 'Updated body with enough characters',
        author: mockUser,
      }

      mockPrisma.feedback.update.mockResolvedValue(updatedFeedback as any)
      mockPrisma.event.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/feedback/fb_123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated title',
          body: 'Updated body with enough characters',
        }),
      })

      const response = await PATCH(request, { params: { id: 'fb_123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.feedback.update).toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated title',
        }),
      })

      const response = await PATCH(request, { params: { id: 'fb_123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 for non-existent feedback', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/feedback/fb_nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated title',
        }),
      })

      const response = await PATCH(request, { params: { id: 'fb_nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not found')
    })

    it('should return 403 when edit window has expired', async () => {
      const editWindowEndsAt = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      const mockFeedback = {
        id: 'fb_123',
        authorId: 'usr_author',
        title: 'Original title',
        body: 'Original body',
        editWindowEndsAt,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockCanEditFeedback.mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/feedback/fb_123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated title',
        }),
      })

      const response = await PATCH(request, { params: { id: 'fb_123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return 403 when user is not the author and lacks permissions', async () => {
      const otherUser = {
        id: 'usr_other',
        email: 'other@example.com',
        displayName: 'Other User',
        role: Role.USER,
      }

      const mockFeedback = {
        id: 'fb_123',
        authorId: 'usr_author',
        title: 'Original title',
        body: 'Original body',
        editWindowEndsAt: new Date(Date.now() + 10 * 60 * 1000),
      }

      mockGetCurrentUser.mockResolvedValue(otherUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockCanEditFeedback.mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/feedback/fb_123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated title',
        }),
      })

      const response = await PATCH(request, { params: { id: 'fb_123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should validate updated title length', async () => {
      const mockFeedback = {
        id: 'fb_123',
        authorId: 'usr_author',
        title: 'Original title',
        body: 'Original body',
        editWindowEndsAt: new Date(Date.now() + 10 * 60 * 1000),
      }

      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback as any)
      mockCanEditFeedback.mockReturnValue(true)

      const request = new NextRequest('http://localhost/api/feedback/fb_123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Short', // Less than 8 characters
        }),
      })

      const response = await PATCH(request, { params: { id: 'fb_123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })
})
