import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getCurrentUser,
  canViewSession,
  canEditSession,
  canDeleteSession,
} from '@/lib/auth-helpers';
import { decryptSessionNotes, isEncrypted } from '@/lib/session-encryption';
import type { UpdateSessionInput } from '@/types/session';

/**
 * GET /api/sessions/[id] - Get session details
 *
 * RESEARCHER/PM see full details
 * Participants see session info (no sensitive notes if notesSecure=true)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: id },
      include: {
        panel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Not found', message: 'Session not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canViewSession(user, session)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to view this session',
        },
        { status: 403 }
      );
    }

    const participantIds = JSON.parse(session.participantIds || '[]');
    const facilitatorIds = JSON.parse(session.facilitatorIds || '[]');

    // Fetch participant details
    const participants = await prisma.user.findMany({
      where: {
        id: {
          in: participantIds,
        },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatarUrl: true,
      },
    });

    // Fetch facilitator details
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
        avatarUrl: true,
        role: true,
      },
    });

    // Check if user is facilitator (for notes access)
    const isFacilitator = facilitatorIds.includes(user.id);
    const canSeeNotes = isFacilitator || ['RESEARCHER', 'PM', 'ADMIN'].includes(user.role);

    // Decrypt notes if user has permission and notes are encrypted
    let notesUri = session.notesUri;
    if (canSeeNotes && notesUri && session.notesSecure && isEncrypted(notesUri)) {
      try {
        notesUri = decryptSessionNotes(notesUri);
      } catch (error) {
        console.error('Failed to decrypt session notes:', error);
        // Return null if decryption fails
        notesUri = null;
      }
    }

    return NextResponse.json({
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
      notesUri: canSeeNotes ? notesUri : null,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      panel: session.panel,
      participants,
      facilitators,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch session. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sessions/[id] - Update session
 *
 * RESEARCHER/PM or facilitator
 * Cannot update if status = 'completed'
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Not found', message: 'Session not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canEditSession(user, session)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to edit this session',
        },
        { status: 403 }
      );
    }

    // Cannot update completed sessions
    if (session.status === 'completed') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Cannot update a completed session',
        },
        { status: 400 }
      );
    }

    const body: UpdateSessionInput = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    // Validate participant count if provided
    if (body.participantIds) {
      const minParticipants = session.minParticipants;
      const maxParticipants = session.maxParticipants;

      if (body.participantIds.length < minParticipants) {
        errors.push({
          field: 'participantIds',
          message: `Number of participants (${body.participantIds.length}) is below minimum (${minParticipants})`,
        });
      }

      if (body.participantIds.length > maxParticipants) {
        errors.push({
          field: 'participantIds',
          message: `Number of participants (${body.participantIds.length}) exceeds maximum (${maxParticipants})`,
        });
      }

      // Verify participants are panel members if panel exists
      if (session.panelId) {
        const panel = await prisma.panel.findUnique({
          where: { id: session.panelId },
          include: {
            memberships: {
              where: { active: true },
              select: { userId: true },
            },
          },
        });

        if (panel) {
          const panelMemberIds = panel.memberships.map((m) => m.userId);
          const invalidParticipants = body.participantIds.filter(
            (id) => !panelMemberIds.includes(id)
          );

          if (invalidParticipants.length > 0) {
            errors.push({
              field: 'participantIds',
              message: `${invalidParticipants.length} participant(s) are not panel members`,
            });
          }
        }
      }
    }

    // Validate facilitators if provided
    if (body.facilitatorIds) {
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
        errors.push({
          field: 'facilitatorIds',
          message: 'One or more facilitator IDs are invalid',
        });
      } else {
        const nonResearcherFacilitators = facilitators.filter(
          (f) => f.role !== 'RESEARCHER' && f.role !== 'PM' && f.role !== 'ADMIN'
        );

        if (nonResearcherFacilitators.length > 0) {
          errors.push({
            field: 'facilitatorIds',
            message: 'Facilitators must have RESEARCHER, PM, or ADMIN role',
          });
        }
      }
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

    // Build update data
    const updateData: any = {};

    if (body.scheduledAt) {
      updateData.scheduledAt = new Date(body.scheduledAt);
    }

    if (body.durationMinutes !== undefined) {
      updateData.durationMinutes = body.durationMinutes;
    }

    if (body.participantIds) {
      updateData.participantIds = JSON.stringify(body.participantIds);
    }

    if (body.facilitatorIds) {
      updateData.facilitatorIds = JSON.stringify(body.facilitatorIds);
    }

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.prototypeLink !== undefined) {
      updateData.prototypeLink = body.prototypeLink;
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: id },
      data: updateData,
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
        type: 'session.updated',
        userId: user.id,
        payload: JSON.stringify({
          sessionId: updatedSession.id,
          changes: Object.keys(updateData),
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedSession,
        participantIds: JSON.parse(updatedSession.participantIds),
        facilitatorIds: JSON.parse(updatedSession.facilitatorIds),
      },
      message: 'Session updated successfully',
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update session. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[id] - Cancel session
 *
 * RESEARCHER/PM or facilitator
 * Sets status to 'cancelled'
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Not found', message: 'Session not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canDeleteSession(user, session)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to cancel this session',
        },
        { status: 403 }
      );
    }

    // Update status to cancelled
    const cancelledSession = await prisma.session.update({
      where: { id: id },
      data: { status: 'cancelled' },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'session.cancelled',
        userId: user.id,
        payload: JSON.stringify({
          sessionId: cancelledSession.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // TODO: Send notifications to participants

    return NextResponse.json({
      success: true,
      message: 'Session cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to cancel session. Please try again later.',
      },
      { status: 500 }
    );
  }
}
