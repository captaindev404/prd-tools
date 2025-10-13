/**
 * WebSocket Server Setup for Real-Time Collaboration
 *
 * This module sets up a Socket.IO server for real-time collaboration features:
 * - User presence tracking
 * - Live cursor movements
 * - Real-time feedback updates
 * - Collaborative comments
 * - Feedback triage events
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/prisma';

export interface SocketUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
}

export interface CursorPosition {
  feedbackId: string;
  x: number;
  y: number;
}

export interface PresenceData {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  sessionName: string;
  viewingFeedbackId?: string;
}

export interface CommentData {
  content: string;
  feedbackId?: string;
  resourceId?: string;
  resourceType?: string;
  parentId?: string;
}

// Store active users per session
const activeSessions = new Map<string, Map<string, SocketUser>>();

let io: SocketIOServer | null = null;

export function initializeWebSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Handle user joining a collaboration session
    socket.on('user:join', async (data: {
      user: SocketUser;
      sessionName: string;
    }) => {
      const { user, sessionName } = data;
      console.log(`[WebSocket] User ${user.displayName} joining session: ${sessionName}`);

      // Join the session room
      socket.join(sessionName);

      // Store user data with socket
      socket.data.user = user;
      socket.data.sessionName = sessionName;

      // Track active users in this session
      if (!activeSessions.has(sessionName)) {
        activeSessions.set(sessionName, new Map());
      }
      activeSessions.get(sessionName)?.set(socket.id, user);

      // Update session in database
      try {
        const session = await prisma.collaborationSession.findFirst({
          where: { sessionName },
        });

        const activeUsers = Array.from(activeSessions.get(sessionName)?.values() || []);
        const participantIds = activeUsers.map((u) => u.id);

        if (session) {
          await prisma.collaborationSession.update({
            where: { id: session.id },
            data: {
              participantIds: JSON.stringify(participantIds),
              activeCount: activeUsers.length,
              lastActivityAt: new Date(),
            },
          });
        } else {
          await prisma.collaborationSession.create({
            data: {
              sessionName,
              participantIds: JSON.stringify(participantIds),
              activeCount: activeUsers.length,
              type: 'feedback',
            },
          });
        }

        // Notify all users in session
        io?.to(sessionName).emit('user:joined', {
          user,
          activeUsers,
        });
      } catch (error) {
        console.error('[WebSocket] Error updating session:', error);
      }
    });

    // Handle cursor movement
    socket.on('cursor:move', (data: CursorPosition) => {
      const { sessionName, user } = socket.data;

      if (sessionName && user) {
        // Broadcast cursor position to all other users in session
        socket.to(sessionName).emit('cursor:update', {
          userId: user.id,
          displayName: user.displayName,
          ...data,
        });
      }
    });

    // Handle presence updates (e.g., user viewing specific feedback)
    socket.on('presence:update', (data: { viewingFeedbackId?: string }) => {
      const { sessionName, user } = socket.data;

      if (sessionName && user) {
        socket.data.viewingFeedbackId = data.viewingFeedbackId;

        // Broadcast presence update
        io?.to(sessionName).emit('presence:changed', {
          userId: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          viewingFeedbackId: data.viewingFeedbackId,
        });
      }
    });

    // Handle feedback updates
    socket.on('feedback:updated', async (data: {
      feedbackId: string;
      changes: Record<string, unknown>;
    }) => {
      const { sessionName, user } = socket.data;

      if (sessionName) {
        // Broadcast to all users in session
        io?.to(sessionName).emit('feedback:changed', {
          feedbackId: data.feedbackId,
          changes: data.changes,
          updatedBy: {
            id: user.id,
            displayName: user.displayName,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle collaborative comments
    socket.on('comment:add', async (data: CommentData) => {
      const { sessionName, user } = socket.data;

      if (!sessionName || !user) return;

      try {
        // Find or create session
        let session = await prisma.collaborationSession.findFirst({
          where: { sessionName },
        });

        if (!session) {
          session = await prisma.collaborationSession.create({
            data: {
              sessionName,
              participantIds: JSON.stringify([user.id]),
              activeCount: 1,
              type: 'feedback',
            },
          });
        }

        // Create comment
        const comment = await prisma.collaborationComment.create({
          data: {
            sessionId: session.id,
            authorId: user.id,
            authorName: user.displayName,
            authorAvatar: user.avatarUrl,
            content: data.content,
            feedbackId: data.feedbackId,
            resourceId: data.resourceId,
            resourceType: data.resourceType,
            parentId: data.parentId,
          },
          include: {
            replies: true,
          },
        });

        // Broadcast new comment to all users in session
        io?.to(sessionName).emit('comment:added', {
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
        console.error('[WebSocket] Error adding comment:', error);
        socket.emit('error', { message: 'Failed to add comment' });
      }
    });

    // Handle feedback assignment
    socket.on('feedback:assign', (data: {
      feedbackId: string;
      assignedTo: string;
      assignedToName: string;
    }) => {
      const { sessionName, user } = socket.data;

      if (sessionName) {
        io?.to(sessionName).emit('feedback:assigned', {
          feedbackId: data.feedbackId,
          assignedTo: data.assignedTo,
          assignedToName: data.assignedToName,
          assignedBy: {
            id: user.id,
            displayName: user.displayName,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle user leaving
    socket.on('user:leave', async () => {
      await handleUserDisconnect(socket);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      await handleUserDisconnect(socket);
    });
  });

  return io;
}

async function handleUserDisconnect(socket: Socket) {
  const { sessionName, user } = socket.data;

  if (sessionName && user) {
    // Remove user from active session
    const sessionUsers = activeSessions.get(sessionName);
    if (sessionUsers) {
      sessionUsers.delete(socket.id);

      const activeUsers = Array.from(sessionUsers.values());

      // Update session in database
      try {
        const session = await prisma.collaborationSession.findFirst({
          where: { sessionName },
        });

        if (session) {
          await prisma.collaborationSession.update({
            where: { id: session.id },
            data: {
              participantIds: JSON.stringify(activeUsers.map((u) => u.id)),
              activeCount: activeUsers.length,
              lastActivityAt: new Date(),
            },
          });
        }

        // Notify remaining users
        io?.to(sessionName).emit('user:left', {
          user,
          activeUsers,
        });
      } catch (error) {
        console.error('[WebSocket] Error updating session on disconnect:', error);
      }

      // Clean up empty sessions
      if (activeUsers.length === 0) {
        activeSessions.delete(sessionName);
      }
    }
  }
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function getActiveUsers(sessionName: string): SocketUser[] {
  const sessionUsers = activeSessions.get(sessionName);
  return sessionUsers ? Array.from(sessionUsers.values()) : [];
}
