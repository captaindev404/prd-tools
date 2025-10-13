/**
 * API Route: Join Collaboration Session
 *
 * POST /api/collaborate/join
 * - Creates or joins a collaboration session
 * - Returns session details and active users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const joinSessionSchema = z.object({
  sessionName: z.string().min(1).max(100),
  type: z.enum(['feedback', 'roadmap', 'moderation']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = joinSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { sessionName, type = 'feedback' } = validation.data;

    // Find or create collaboration session
    let collaborationSession = await prisma.collaborationSession.findFirst({
      where: { sessionName },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!collaborationSession) {
      collaborationSession = await prisma.collaborationSession.create({
        data: {
          sessionName,
          type,
          participantIds: JSON.stringify([session.user.id]),
          activeCount: 1,
        },
        include: {
          comments: true,
        },
      });
    } else {
      // Update last activity
      await prisma.collaborationSession.update({
        where: { id: collaborationSession.id },
        data: {
          lastActivityAt: new Date(),
        },
      });
    }

    // Parse participant IDs
    const participantIds = JSON.parse(collaborationSession.participantIds) as string[];

    // Get active users
    const activeUsers = await prisma.user.findMany({
      where: {
        id: { in: participantIds },
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        role: true,
      },
    });

    return NextResponse.json({
      session: {
        id: collaborationSession.id,
        sessionName: collaborationSession.sessionName,
        type: collaborationSession.type,
        activeCount: collaborationSession.activeCount,
        lastActivityAt: collaborationSession.lastActivityAt,
      },
      activeUsers,
      comments: collaborationSession.comments,
    });
  } catch (error) {
    console.error('Error joining collaboration session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session name from query params
    const searchParams = request.nextUrl.searchParams;
    const sessionName = searchParams.get('sessionName');

    if (!sessionName) {
      return NextResponse.json(
        { error: 'Session name required' },
        { status: 400 }
      );
    }

    // Find session
    const collaborationSession = await prisma.collaborationSession.findFirst({
      where: { sessionName },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!collaborationSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Parse participant IDs
    const participantIds = JSON.parse(collaborationSession.participantIds) as string[];

    // Get active users
    const activeUsers = await prisma.user.findMany({
      where: {
        id: { in: participantIds },
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        role: true,
      },
    });

    return NextResponse.json({
      session: {
        id: collaborationSession.id,
        sessionName: collaborationSession.sessionName,
        type: collaborationSession.type,
        activeCount: collaborationSession.activeCount,
        lastActivityAt: collaborationSession.lastActivityAt,
      },
      activeUsers,
      comments: collaborationSession.comments,
    });
  } catch (error) {
    console.error('Error fetching collaboration session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
