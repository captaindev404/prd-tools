/**
 * API Route: Collaborative Comments
 *
 * POST /api/collaborate/comment
 * - Add a comment to a collaboration session
 *
 * GET /api/collaborate/comment?sessionId={id}&feedbackId={id}
 * - Get comments for a session or feedback item
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addCommentSchema = z.object({
  sessionId: z.string(),
  content: z.string().min(1).max(2000),
  feedbackId: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.enum(['feedback', 'roadmap', 'moderation']).optional(),
  parentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validation = addCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { sessionId, content, feedbackId, resourceId, resourceType, parentId } =
      validation.data;

    // Verify session exists
    const collaborationSession = await prisma.collaborationSession.findUnique({
      where: { id: sessionId },
    });

    if (!collaborationSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Create comment
    const comment = await prisma.collaborationComment.create({
      data: {
        sessionId,
        authorId: user.id,
        authorName: user.displayName || 'Unknown User',
        authorAvatar: user.avatarUrl,
        content,
        feedbackId,
        resourceId,
        resourceType,
        parentId,
      },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Update session activity
    await prisma.collaborationSession.update({
      where: { id: sessionId },
      data: {
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        feedbackId: comment.feedbackId,
        resourceId: comment.resourceId,
        resourceType: comment.resourceType,
        parentId: comment.parentId,
        author: {
          id: comment.authorId,
          displayName: comment.authorName,
          avatarUrl: comment.authorAvatar,
        },
        createdAt: comment.createdAt.toISOString(),
        replies: comment.replies,
      },
    });
  } catch (error) {
    console.error('Error adding comment:', error);
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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const feedbackId = searchParams.get('feedbackId');
    const resourceId = searchParams.get('resourceId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: {
      sessionId: string;
      feedbackId?: string;
      resourceId?: string;
      parentId: null;
    } = {
      sessionId,
      parentId: null, // Only get top-level comments, replies are included
    };

    if (feedbackId) {
      where.feedbackId = feedbackId;
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    // Get comments
    const comments = await prisma.collaborationComment.findMany({
      where,
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            replies: true, // Get nested replies
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        feedbackId: c.feedbackId,
        resourceId: c.resourceId,
        resourceType: c.resourceType,
        parentId: c.parentId,
        author: {
          id: c.authorId,
          displayName: c.authorName,
          avatarUrl: c.authorAvatar,
        },
        createdAt: c.createdAt.toISOString(),
        replies: c.replies,
      })),
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
