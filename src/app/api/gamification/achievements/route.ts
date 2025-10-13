import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getUserAchievements,
  getUserAchievementProgress,
  getAllAchievements,
  getAchievementStats,
} from '@/lib/gamification/achievements';

/**
 * GET /api/gamification/achievements - Get achievements
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'earned' | 'progress' | 'all' | 'stats'
    const category = searchParams.get('category'); // 'streak' | 'milestone' | 'special'

    if (type === 'stats') {
      const stats = await getAchievementStats();
      return NextResponse.json(stats);
    }

    if (type === 'earned') {
      const achievements = await getUserAchievements(session.user.id);
      return NextResponse.json({ achievements });
    }

    if (type === 'progress') {
      const progress = await getUserAchievementProgress(
        session.user.id,
        category as any
      );
      return NextResponse.json({ progress });
    }

    if (type === 'all') {
      const allAchievements = await getAllAchievements(false); // Don't include hidden
      return NextResponse.json({ achievements: allAchievements });
    }

    // Default: return earned achievements
    const achievements = await getUserAchievements(session.user.id);
    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
