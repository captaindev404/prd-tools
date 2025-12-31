import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/utils/api-response';
import {
  MILESTONE_DEFINITIONS,
  checkMilestoneUnlocks,
  calculateMilestoneProgress,
  getMilestoneById,
} from '@/lib/analytics/milestone-definitions';

/**
 * Milestone Response Type
 */
interface MilestoneResponse {
  id: string;
  category: string;
  title: string;
  description: string;
  emoji?: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number; // Current progress value
  target?: number; // Target value to unlock
  percentage?: number; // Progress percentage (0-100)
}

/**
 * GET /api/v1/analytics/milestones
 * Get all milestones with unlock status for the authenticated user
 *
 * Response:
 * - 200: Milestones retrieved successfully
 * - 401: Unauthorized
 * - 404: User not found
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authUser = await requireAuth();
    if (!authUser) {
      return errorResponse('Unauthorized', 'Authentication required', 401);
    }

    // Get full user from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      return errorResponse('NotFound', 'User not found', 404);
    }

    // Get or create analytics cache for this user
    let analyticsCache = await prisma.userAnalyticsCache.findUnique({
      where: { userId: user.id },
    });

    // If no cache exists, create one with default values
    if (!analyticsCache) {
      analyticsCache = await prisma.userAnalyticsCache.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Get all unlocked milestones from database
    const unlockedMilestones = await prisma.userMilestone.findMany({
      where: { userId: user.id },
    });

    // Create a map of unlocked milestone IDs to unlockedAt timestamps
    const unlockedMap = new Map<string, Date>();
    unlockedMilestones.forEach((milestone) => {
      unlockedMap.set(milestone.milestoneId, milestone.unlockedAt);
    });

    // Check which milestones should be unlocked based on current stats
    const shouldBeUnlocked = checkMilestoneUnlocks({
      totalStoriesListened: analyticsCache.totalStoriesListened,
      totalListeningTimeSeconds: analyticsCache.totalListeningTimeSeconds,
      currentStreak: analyticsCache.currentStreak,
      longestStreak: analyticsCache.longestStreak,
    });

    // Unlock any milestones that should be unlocked but aren't yet
    const newlyUnlocked: string[] = [];
    for (const milestoneId of shouldBeUnlocked) {
      if (!unlockedMap.has(milestoneId)) {
        // Create new milestone unlock
        const newMilestone = await prisma.userMilestone.create({
          data: {
            userId: user.id,
            milestoneId,
          },
        });
        unlockedMap.set(milestoneId, newMilestone.unlockedAt);
        newlyUnlocked.push(milestoneId);
      }
    }

    // Build response with all milestones
    const milestones: MilestoneResponse[] = MILESTONE_DEFINITIONS.map(
      (definition) => {
        const unlocked = unlockedMap.has(definition.id);
        const unlockedAt = unlockedMap.get(definition.id);

        // Calculate progress for this milestone
        const progress = calculateMilestoneProgress(definition.id, {
          totalStoriesListened: analyticsCache.totalStoriesListened,
          totalListeningTimeSeconds: analyticsCache.totalListeningTimeSeconds,
          currentStreak: analyticsCache.currentStreak,
          longestStreak: analyticsCache.longestStreak,
        });

        const milestone: MilestoneResponse = {
          id: definition.id,
          category: definition.category,
          title: definition.title,
          description: definition.description,
          emoji: definition.emoji,
          unlocked,
        };

        // Add unlockedAt timestamp if unlocked
        if (unlocked && unlockedAt) {
          milestone.unlockedAt = unlockedAt.toISOString();
        }

        // Add progress information if not unlocked
        if (!unlocked && progress) {
          milestone.progress = progress.current;
          milestone.target = progress.target;
          milestone.percentage = progress.percentage;
        }

        return milestone;
      }
    );

    // Sort milestones by category and order
    milestones.sort((a, b) => {
      const defA = getMilestoneById(a.id);
      const defB = getMilestoneById(b.id);

      if (!defA || !defB) return 0;

      // First sort by category
      if (defA.category !== defB.category) {
        return defA.category.localeCompare(defB.category);
      }

      // Then by order within category
      return defA.order - defB.order;
    });

    return successResponse({
      milestones,
      summary: {
        totalMilestones: MILESTONE_DEFINITIONS.length,
        unlockedCount: unlockedMap.size,
        newlyUnlocked: newlyUnlocked.length > 0 ? newlyUnlocked : undefined,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
