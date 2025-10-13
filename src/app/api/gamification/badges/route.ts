import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserBadges, getUserBadgeProgress, getAllBadges } from '@/lib/gamification/badge-engine';

/**
 * GET /api/gamification/badges - Get badges
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'earned' | 'progress' | 'all'
    const category = searchParams.get('category'); // 'feedback' | 'voting' | 'research' | 'engagement'

    if (type === 'earned') {
      const badges = await getUserBadges(session.user.id);
      return NextResponse.json({ badges });
    }

    if (type === 'progress') {
      const progress = await getUserBadgeProgress(
        session.user.id,
        category as any
      );
      return NextResponse.json({ progress });
    }

    if (type === 'all') {
      const allBadges = await getAllBadges(category as any);
      return NextResponse.json({ badges: allBadges });
    }

    // Default: return earned badges
    const badges = await getUserBadges(session.user.id);
    return NextResponse.json({ badges });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
