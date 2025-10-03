import { calculateDecayedWeight } from '@/lib/vote-weight'
import { Role } from '@prisma/client'

/**
 * Unit Tests for Vote Weight Calculation
 *
 * Tests the weighted voting system per DSL spec:
 * - Role weights: USER=1.0, PM=2.0, PO=3.0, RESEARCHER=1.5, MODERATOR=1.0, ADMIN=1.0
 * - Village priority: high=1.5, medium=1.0, low=0.5
 * - Panel membership boost: +0.3
 * - Time decay: 180-day half-life (weight × 2^(-days/180))
 */

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    panelMembership: {
      findMany: jest.fn(),
    },
    feedback: {
      findUnique: jest.fn(),
    },
    vote: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  calculateBaseVoteWeight,
  calculateVoteWeight,
  getVoteStats,
  hasUserVoted,
} from '@/lib/vote-weight'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Vote Weight Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateDecayedWeight', () => {
    it('should return full weight for votes just created', () => {
      const now = new Date()
      const weight = calculateDecayedWeight(1.0, now)
      expect(weight).toBeCloseTo(1.0, 4)
    })

    it('should apply 50% decay after 180 days (half-life)', () => {
      const now = new Date()
      const voteDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      const weight = calculateDecayedWeight(1.0, voteDate)
      expect(weight).toBeCloseTo(0.5, 4)
    })

    it('should apply 25% decay after 360 days (2x half-life)', () => {
      const now = new Date()
      const voteDate = new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000)
      const weight = calculateDecayedWeight(1.0, voteDate)
      expect(weight).toBeCloseTo(0.25, 4)
    })

    it('should handle base weight other than 1.0', () => {
      const now = new Date()
      const voteDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      const weight = calculateDecayedWeight(3.0, voteDate)
      expect(weight).toBeCloseTo(1.5, 4) // 3.0 × 0.5 = 1.5
    })

    it('should handle very old votes (approaching zero)', () => {
      const now = new Date()
      const voteDate = new Date(now.getTime() - 1800 * 24 * 60 * 60 * 1000) // 1800 days = 10x half-life
      const weight = calculateDecayedWeight(1.0, voteDate)
      expect(weight).toBeLessThan(0.001)
    })

    it('should handle zero base weight', () => {
      const now = new Date()
      const weight = calculateDecayedWeight(0, now)
      expect(weight).toBe(0)
    })
  })

  describe('calculateBaseVoteWeight', () => {
    it('should calculate weight for USER role (1.0 × 1.0 = 1.0)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_test',
        role: Role.USER,
        currentVillageId: 'village_1',
      } as any)

      mockPrisma.panelMembership.findMany.mockResolvedValue([])

      mockPrisma.feedback.findUnique.mockResolvedValue({
        id: 'fb_test',
        villageId: 'village_1',
      } as any)

      const weight = await calculateBaseVoteWeight('usr_test', 'fb_test')
      expect(weight).toBeCloseTo(1.0, 2)
    })

    it('should calculate weight for PM role (2.0 × 1.0 = 2.0)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_pm',
        role: Role.PM,
        currentVillageId: 'village_1',
      } as any)

      mockPrisma.panelMembership.findMany.mockResolvedValue([])

      mockPrisma.feedback.findUnique.mockResolvedValue({
        id: 'fb_test',
        villageId: 'village_1',
      } as any)

      const weight = await calculateBaseVoteWeight('usr_pm', 'fb_test')
      expect(weight).toBeCloseTo(2.0, 2)
    })

    it('should calculate weight for PO role (3.0 × 1.0 = 3.0)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_po',
        role: Role.PO,
        currentVillageId: 'village_1',
      } as any)

      mockPrisma.panelMembership.findMany.mockResolvedValue([])

      mockPrisma.feedback.findUnique.mockResolvedValue({
        id: 'fb_test',
        villageId: 'village_1',
      } as any)

      const weight = await calculateBaseVoteWeight('usr_po', 'fb_test')
      expect(weight).toBeCloseTo(3.0, 2)
    })

    it('should calculate weight for RESEARCHER role (1.5 × 1.0 = 1.5)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_researcher',
        role: Role.RESEARCHER,
        currentVillageId: 'village_1',
      } as any)

      mockPrisma.panelMembership.findMany.mockResolvedValue([])

      mockPrisma.feedback.findUnique.mockResolvedValue({
        id: 'fb_test',
        villageId: 'village_1',
      } as any)

      const weight = await calculateBaseVoteWeight('usr_researcher', 'fb_test')
      expect(weight).toBeCloseTo(1.5, 2)
    })

    it('should add panel membership boost (+0.3)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_panel',
        role: Role.USER,
        currentVillageId: 'village_1',
      } as any)

      mockPrisma.panelMembership.findMany.mockResolvedValue([
        {
          userId: 'usr_panel',
          panelId: 'pan_test',
          active: true,
        },
      ] as any)

      mockPrisma.feedback.findUnique.mockResolvedValue({
        id: 'fb_test',
        villageId: 'village_1',
      } as any)

      const weight = await calculateBaseVoteWeight('usr_panel', 'fb_test')
      // USER (1.0) + panel boost (0.3) = 1.3, then × village priority (1.0) = 1.3
      expect(weight).toBeCloseTo(1.3, 2)
    })

    it('should combine role weight and panel boost for PM', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_pm_panel',
        role: Role.PM,
        currentVillageId: 'village_1',
      } as any)

      mockPrisma.panelMembership.findMany.mockResolvedValue([
        {
          userId: 'usr_pm_panel',
          panelId: 'pan_test',
          active: true,
        },
      ] as any)

      mockPrisma.feedback.findUnique.mockResolvedValue({
        id: 'fb_test',
        villageId: 'village_1',
      } as any)

      const weight = await calculateBaseVoteWeight('usr_pm_panel', 'fb_test')
      // PM (2.0) + panel boost (0.3) = 2.3, then × village priority (1.0) = 2.3
      expect(weight).toBeCloseTo(2.3, 2)
    })

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(
        calculateBaseVoteWeight('usr_nonexistent', 'fb_test')
      ).rejects.toThrow('User not found')
    })

    it('should throw error for non-existent feedback', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_test',
        role: Role.USER,
        currentVillageId: 'village_1',
      } as any)

      mockPrisma.panelMembership.findMany.mockResolvedValue([])
      mockPrisma.feedback.findUnique.mockResolvedValue(null)

      await expect(
        calculateBaseVoteWeight('usr_test', 'fb_nonexistent')
      ).rejects.toThrow('Feedback not found')
    })

    it('should handle user with no village', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_novillage',
        role: Role.USER,
        currentVillageId: null,
      } as any)

      mockPrisma.panelMembership.findMany.mockResolvedValue([])

      mockPrisma.feedback.findUnique.mockResolvedValue({
        id: 'fb_test',
        villageId: null,
      } as any)

      const weight = await calculateBaseVoteWeight('usr_novillage', 'fb_test')
      expect(weight).toBeCloseTo(1.0, 2)
    })

    it('should not add panel boost for inactive memberships', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_inactive_panel',
        role: Role.USER,
        currentVillageId: 'village_1',
      } as any)

      // No active memberships returned (filtered by active: true in query)
      mockPrisma.panelMembership.findMany.mockResolvedValue([])

      mockPrisma.feedback.findUnique.mockResolvedValue({
        id: 'fb_test',
        villageId: 'village_1',
      } as any)

      const weight = await calculateBaseVoteWeight('usr_inactive_panel', 'fb_test')
      expect(weight).toBeCloseTo(1.0, 2)
    })
  })

  describe('calculateVoteWeight', () => {
    it('should calculate current weight with decay', async () => {
      const now = new Date()
      const voteDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'vote_test',
        weight: 2.0,
        createdAt: voteDate,
      } as any)

      const weight = await calculateVoteWeight('vote_test')
      // 2.0 × 0.5 (180-day decay) = 1.0
      expect(weight).toBeCloseTo(1.0, 4)
    })

    it('should throw error for non-existent vote', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue(null)

      await expect(calculateVoteWeight('vote_nonexistent')).rejects.toThrow(
        'Vote not found'
      )
    })
  })

  describe('getVoteStats', () => {
    it('should aggregate vote statistics', async () => {
      const now = new Date()
      const oldVote = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

      mockPrisma.vote.findMany.mockResolvedValue([
        { weight: 1.0, createdAt: now },
        { weight: 2.0, createdAt: now },
        { weight: 1.0, createdAt: oldVote }, // Will decay to 0.5
      ] as any)

      const stats = await getVoteStats('fb_test')

      expect(stats.count).toBe(3)
      expect(stats.totalWeight).toBeCloseTo(4.0, 2) // 1.0 + 2.0 + 1.0
      expect(stats.totalDecayedWeight).toBeCloseTo(3.5, 2) // 1.0 + 2.0 + 0.5
    })

    it('should handle feedback with no votes', async () => {
      mockPrisma.vote.findMany.mockResolvedValue([])

      const stats = await getVoteStats('fb_novotes')

      expect(stats.count).toBe(0)
      expect(stats.totalWeight).toBe(0)
      expect(stats.totalDecayedWeight).toBe(0)
    })
  })

  describe('hasUserVoted', () => {
    it('should return true when user has voted', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'vote_test',
        userId: 'usr_test',
        feedbackId: 'fb_test',
      } as any)

      const hasVoted = await hasUserVoted('usr_test', 'fb_test')
      expect(hasVoted).toBe(true)
    })

    it('should return false when user has not voted', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue(null)

      const hasVoted = await hasUserVoted('usr_test', 'fb_test')
      expect(hasVoted).toBe(false)
    })
  })
})
