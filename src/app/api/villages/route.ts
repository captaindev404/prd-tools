import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/villages
 * List all villages (public endpoint for filters)
 */
export async function GET(req: NextRequest) {
  try {
    const villages = await prisma.village.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(villages);
  } catch (error) {
    console.error('Error fetching villages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch villages' },
      { status: 500 }
    );
  }
}
