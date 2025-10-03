import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canCreateSession } from '@/lib/auth-helpers';
import type { CreateSessionInput } from '@/types/session';

/**
 * GET /api/sessions - List sessions
 *
 * Query parameters:
 * - status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
 * - panelId?: string
 * - startDate?: ISO date string
 * - endDate?: ISO date string
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 *
 * RESEARCHER/PM see all sessions
 * Regular users see only sessions they're participants in
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const panelId = searchParams.get('panelId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Check if user can see all sessions (RESEARCHER/PM/ADMIN)
    const canSeeAll = canCreateSession(user);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (panelId) {
      where.panelId = panelId;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) {
        where.scheduledAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.scheduledAt.lte = new Date(endDate);
      }
    }

    // Regular users only see sessions they're participants in
    if (!canSeeAll) {
      where.OR = [
        {
          participantIds: {
            contains: user.id,
          },
        },
        {
          facilitatorIds: {
            contains: user.id,
          },
        },
      ];
    }

    // Fetch sessions
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          scheduledAt: 'asc',
        },
        include: {
          panel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.session.count({ where }),
    ]);

    // Transform sessions to include facilitator names and participant count
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const participantIds = JSON.parse(session.participantIds || '[]');
        const facilitatorIds = JSON.parse(session.facilitatorIds || '[]');

        // Fetch facilitator names
        const facilitators = await prisma.user.findMany({
          where: {
            id: {
              in: facilitatorIds,
            },
          },
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        });

        const facilitatorNames = facilitators.map(
          (f) => f.displayName || f.email.split('@')[0]
        );

        return {
          id: session.id,
          type: session.type,
          prototypeLink: session.prototypeLink,
          scheduledAt: session.scheduledAt.toISOString(),
          durationMinutes: session.durationMinutes,
          panelId: session.panelId,
          participantIds,
          facilitatorIds,
          minParticipants: session.minParticipants,
          maxParticipants: session.maxParticipants,
          consentRequired: session.consentRequired,
          recordingEnabled: session.recordingEnabled,
          recordingStorageDays: session.recordingStorageDays,
          notesSecure: session.notesSecure,
          notesUri: session.notesUri,
          status: session.status,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          panel: session.panel,
          participantCount: participantIds.length,
          facilitatorNames,
        };
      })
    );

    return NextResponse.json({
      items: sessionsWithDetails,
      total,
      page,
      limit,
      hasMore: skip + sessions.length < total,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch sessions. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions - Create session
 *
 * RESEARCHER/PM only
 *
 * Request body: CreateSessionInput
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canCreateSession(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to create sessions',
        },
        { status: 403 }
      );
    }

    const body: CreateSessionInput = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (!body.type) {
      errors.push({ field: 'type', message: 'Session type is required' });
    }

    if (!body.scheduledAt) {
      errors.push({ field: 'scheduledAt', message: 'Scheduled date/time is required' });
    }

    if (!body.participantIds || body.participantIds.length === 0) {
      errors.push({ field: 'participantIds', message: 'At least one participant is required' });
    }

    if (!body.facilitatorIds || body.facilitatorIds.length === 0) {
      errors.push({ field: 'facilitatorIds', message: 'At least one facilitator is required' });
    }

    const minParticipants = body.minParticipants || 1;
    const maxParticipants = body.maxParticipants || 6;

    if (minParticipants > maxParticipants) {
      errors.push({
        field: 'minParticipants',
        message: 'Minimum participants cannot exceed maximum participants',
      });
    }

    if (body.participantIds && body.participantIds.length > maxParticipants) {
      errors.push({
        field: 'participantIds',
        message: `Number of participants (${body.participantIds.length}) exceeds maximum (${maxParticipants})`,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please check your input and try again',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Verify panel exists if provided
    if (body.panelId) {
      const panel = await prisma.panel.findUnique({
        where: { id: body.panelId },
        include: {
          memberships: {
            where: { active: true },
            select: { userId: true },
          },
        },
      });

      if (!panel) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'Panel not found',
          },
          { status: 400 }
        );
      }

      // Verify all participants are panel members
      const panelMemberIds = panel.memberships.map((m) => m.userId);
      const invalidParticipants = body.participantIds.filter(
        (id) => !panelMemberIds.includes(id)
      );

      if (invalidParticipants.length > 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'All participants must be members of the selected panel',
            details: [
              {
                field: 'participantIds',
                message: `${invalidParticipants.length} participant(s) are not panel members`,
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Verify facilitators are RESEARCHER role
    const facilitators = await prisma.user.findMany({
      where: {
        id: {
          in: body.facilitatorIds,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (facilitators.length !== body.facilitatorIds.length) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'One or more facilitator IDs are invalid',
        },
        { status: 400 }
      );
    }

    const nonResearcherFacilitators = facilitators.filter(
      (f) => f.role !== 'RESEARCHER' && f.role !== 'PM' && f.role !== 'ADMIN'
    );

    if (nonResearcherFacilitators.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Facilitators must have RESEARCHER, PM, or ADMIN role',
        },
        { status: 400 }
      );
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        id: `ses_${ulid()}`,
        type: body.type,
        prototypeLink: body.prototypeLink || null,
        scheduledAt: new Date(body.scheduledAt),
        durationMinutes: body.durationMinutes || 45,
        panelId: body.panelId || null,
        participantIds: JSON.stringify(body.participantIds),
        facilitatorIds: JSON.stringify(body.facilitatorIds),
        minParticipants,
        maxParticipants,
        consentRequired: body.consentRequired ?? true,
        recordingEnabled: body.recordingEnabled ?? true,
        recordingStorageDays: body.recordingStorageDays || 365,
        notesSecure: body.notesSecure ?? true,
        status: 'scheduled',
      },
      include: {
        panel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'session.created',
        userId: user.id,
        payload: JSON.stringify({
          sessionId: session.id,
          sessionType: session.type,
          scheduledAt: session.scheduledAt.toISOString(),
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...session,
          participantIds: JSON.parse(session.participantIds),
          facilitatorIds: JSON.parse(session.facilitatorIds),
        },
        message: 'Session created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create session. Please try again later.',
      },
      { status: 500 }
    );
  }
}
