import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserPoints, getPointHistory } from '@/lib/gamification/points-engine';

/**
 * GET /api/gamification/points - Get user's points summary
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const historyLimit = parseInt(searchParams.get('historyLimit') || '50');

    const points = await getUserPoints(session.user.id);

    if (includeHistory) {
      const history = await getPointHistory(session.user.id, historyLimit);
      return NextResponse.json({ ...points, history });
    }

    return NextResponse.json(points);
  } catch (error) {
    console.error('Error fetching user points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user points' },
      { status: 500 }
    );
  }
}
