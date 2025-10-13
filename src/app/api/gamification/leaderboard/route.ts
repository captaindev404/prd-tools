import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getLeaderboard,
  getUserLeaderboardPosition,
  getNearbyLeaderboard,
  getLeaderboardStats,
} from '@/lib/gamification/leaderboard';

/**
 * GET /api/gamification/leaderboard - Get leaderboard rankings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'all_time') as 'weekly' | 'monthly' | 'all_time';
    const category = (searchParams.get('category') || 'overall') as
      | 'overall'
      | 'feedback'
      | 'voting'
      | 'research';
    const limit = parseInt(searchParams.get('limit') || '50');
    const view = searchParams.get('view'); // 'top' | 'nearby' | 'stats' | 'position'

    if (view === 'stats') {
      const stats = await getLeaderboardStats();
      return NextResponse.json(stats);
    }

    if (view === 'position') {
      const position = await getUserLeaderboardPosition(session.user.id, period, category);
      return NextResponse.json({ position });
    }

    if (view === 'nearby') {
      const range = parseInt(searchParams.get('range') || '5');
      const nearby = await getNearbyLeaderboard(session.user.id, period, category, range);
      return NextResponse.json({ leaderboard: nearby });
    }

    // Default: top rankings
    const leaderboard = await getLeaderboard({ period, category, limit });
    const userPosition = await getUserLeaderboardPosition(session.user.id, period, category);

    return NextResponse.json({
      leaderboard,
      userPosition,
      period,
      category,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
