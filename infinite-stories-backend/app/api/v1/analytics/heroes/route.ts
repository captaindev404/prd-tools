import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { requireAuth } from '@/lib/auth/session';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/utils/api-response';
import { signHeroUrls } from '@/lib/storage/signed-url';

/**
 * Hero Analytics Response Interface
 */
interface HeroAnalytics {
  heroId: string;
  heroName: string;
  avatarUrl: string | null;
  storiesCount: number;
  totalListeningMinutes: number;
  isMostActive: boolean;
}

/**
 * GET /api/v1/analytics/heroes
 * Get hero analytics for the authenticated user
 *
 * Returns aggregated statistics per hero:
 * - Total number of stories generated for each hero
 * - Total listening time in minutes for each hero
 * - Flag indicating which hero is most active (highest listening time)
 *
 * Response:
 * - 200: Hero analytics retrieved successfully
 * - 401: Unauthorized
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

    // Get all heroes for the user with basic info
    const heroes = await prisma.hero.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no heroes, return empty array
    if (heroes.length === 0) {
      return successResponse({
        heroes: [],
      });
    }

    // Get story counts per hero
    const storyCounts = await prisma.story.groupBy({
      by: ['heroId'],
      where: {
        userId: user.id,
        heroId: { in: heroes.map(h => h.id) },
      },
      _count: {
        id: true,
      },
    });

    // Create a map for quick lookup
    const storyCountMap = new Map(
      storyCounts.map(sc => [sc.heroId, sc._count.id])
    );

    // Get listening time per hero by joining ListeningSession with Story
    // We aggregate the duration from listening sessions for each hero
    const heroIds = heroes.map(h => h.id);
    const listeningTimeResults = await prisma.$queryRaw<
      Array<{ heroId: string; totalSeconds: bigint | null }>
    >`
      SELECT
        s."heroId",
        COALESCE(SUM(ls.duration), 0) as "totalSeconds"
      FROM "Story" s
      LEFT JOIN "ListeningSession" ls ON s.id = ls."storyId"
      WHERE s."userId" = ${user.id}
        AND s."heroId" = ANY(${heroIds}::text[])
      GROUP BY s."heroId"
    `;

    // Process raw SQL results and convert to map
    // Handle both null and bigint values from the query
    const listeningTimeMap = new Map<string, number>();

    for (const result of listeningTimeResults) {
      const seconds = result.totalSeconds
        ? Number(result.totalSeconds)
        : 0;
      listeningTimeMap.set(result.heroId, seconds);
    }

    // Find the hero with most listening time
    let maxListeningTime = 0;
    let mostActiveHeroId: string | null = null;

    for (const [heroId, seconds] of listeningTimeMap.entries()) {
      if (seconds > maxListeningTime) {
        maxListeningTime = seconds;
        mostActiveHeroId = heroId;
      }
    }

    // Build hero analytics array
    const heroAnalytics: HeroAnalytics[] = await Promise.all(
      heroes.map(async (hero) => {
        const storiesCount = storyCountMap.get(hero.id) || 0;
        const totalSeconds = listeningTimeMap.get(hero.id) || 0;
        const totalListeningMinutes = Math.round(totalSeconds / 60);
        const isMostActive = hero.id === mostActiveHeroId && maxListeningTime > 0;

        // Sign the hero avatar URL
        const signedHero = await signHeroUrls({
          avatarUrl: hero.avatarUrl,
        });

        return {
          heroId: hero.id,
          heroName: hero.name,
          avatarUrl: signedHero.avatarUrl || null,
          storiesCount,
          totalListeningMinutes,
          isMostActive,
        };
      })
    );

    return successResponse({
      heroes: heroAnalytics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
