/**
 * WebSocket Client Helper for Real-Time Collaboration
 *
 * Provides hooks and utilities for client-side WebSocket connections
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketUser, CursorPosition, CommentData } from './server';

export interface ActiveUser extends SocketUser {
  viewingFeedbackId?: string;
}

export interface FeedbackUpdate {
  feedbackId: string;
  changes: Record<string, unknown>;
  updatedBy: {
    id: string;
    displayName: string;
  };
  timestamp: string;
}

export interface Comment {
  id: string;
  content: string;
  feedbackId?: string;
  resourceId?: string;
  resourceType?: string;
  parentId?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  replies?: Comment[];
}

/**
 * Hook to establish and manage WebSocket connection
 */
export function useCollaborationSocket(sessionName: string, user: SocketUser | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    if (!user || !sessionName) return;

    // Create socket connection
    const socketInstance = io({
      path: '/api/socket',
      autoConnect: false,
    });

    // Connection handlers
    socketInstance.on('connect', () => {
      console.log('[Client] Connected to WebSocket server');
      setIsConnected(true);

      // Join the collaboration session
      socketInstance.emit('user:join', {
        user,
        sessionName,
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('[Client] Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // User presence handlers
    socketInstance.on('user:joined', (data: { user: SocketUser; activeUsers: ActiveUser[] }) => {
      console.log('[Client] User joined:', data.user.displayName);
      setActiveUsers(data.activeUsers);
    });

    socketInstance.on('user:left', (data: { user: SocketUser; activeUsers: ActiveUser[] }) => {
      console.log('[Client] User left:', data.user.displayName);
      setActiveUsers(data.activeUsers);
    });

    socketInstance.on('presence:changed', (data: {
      userId: string;
      displayName: string;
      avatarUrl?: string;
      viewingFeedbackId?: string;
    }) => {
      setActiveUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId
            ? { ...u, viewingFeedbackId: data.viewingFeedbackId }
            : u
        )
      );
    });

    // Connect
    socketInstance.connect();
    setSocket(socketInstance);

    // Cleanup
    return () => {
      if (socketInstance.connected) {
        socketInstance.emit('user:leave');
      }
      socketInstance.disconnect();
    };
  }, [sessionName, user]);

  return { socket, isConnected, activeUsers };
}

/**
 * Hook to handle live cursors
 */
export function useLiveCursors(socket: Socket | null) {
  const [cursors, setCursors] = useState<
    Map<string, CursorPosition & { displayName: string; userId: string }>
  >(new Map());

  useEffect(() => {
    if (!socket) return;

    const handleCursorUpdate = (data: CursorPosition & { userId: string; displayName: string }) => {
      setCursors((prev) => {
        const updated = new Map(prev);
        updated.set(data.userId, data);
        return updated;
      });

      // Remove cursor after 5 seconds of inactivity
      setTimeout(() => {
        setCursors((prev) => {
          const updated = new Map(prev);
          updated.delete(data.userId);
          return updated;
        });
      }, 5000);
    };

    socket.on('cursor:update', handleCursorUpdate);

    return () => {
      socket.off('cursor:update', handleCursorUpdate);
    };
  }, [socket]);

  const updateCursor = useCallback(
    (position: CursorPosition) => {
      if (socket?.connected) {
        socket.emit('cursor:move', position);
      }
    },
    [socket]
  );

  return { cursors: Array.from(cursors.values()), updateCursor };
}

/**
 * Hook to handle real-time feedback updates
 */
export function useFeedbackUpdates(socket: Socket | null) {
  const [updates, setUpdates] = useState<FeedbackUpdate[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleFeedbackChanged = (data: FeedbackUpdate) => {
      setUpdates((prev) => [...prev, data]);

      // Clear update after 5 seconds
      setTimeout(() => {
        setUpdates((prev) => prev.filter((u) => u.timestamp !== data.timestamp));
      }, 5000);
    };

    const handleFeedbackAssigned = (data: {
      feedbackId: string;
      assignedTo: string;
      assignedToName: string;
      assignedBy: { id: string; displayName: string };
      timestamp: string;
    }) => {
      setUpdates((prev) => [
        ...prev,
        {
          feedbackId: data.feedbackId,
          changes: {
            assignedTo: data.assignedTo,
            assignedToName: data.assignedToName,
          },
          updatedBy: data.assignedBy,
          timestamp: data.timestamp,
        },
      ]);
    };

    socket.on('feedback:changed', handleFeedbackChanged);
    socket.on('feedback:assigned', handleFeedbackAssigned);

    return () => {
      socket.off('feedback:changed', handleFeedbackChanged);
      socket.off('feedback:assigned', handleFeedbackAssigned);
    };
  }, [socket]);

  const updateFeedback = useCallback(
    (feedbackId: string, changes: Record<string, unknown>) => {
      if (socket?.connected) {
        socket.emit('feedback:updated', { feedbackId, changes });
      }
    },
    [socket]
  );

  const assignFeedback = useCallback(
    (feedbackId: string, assignedTo: string, assignedToName: string) => {
      if (socket?.connected) {
        socket.emit('feedback:assign', { feedbackId, assignedTo, assignedToName });
      }
    },
    [socket]
  );

  return { updates, updateFeedback, assignFeedback };
}

/**
 * Hook to handle collaborative comments
 */
export function useCollaborativeComments(socket: Socket | null, feedbackId?: string) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleCommentAdded = (data: { comment: Comment }) => {
      // Only add comments for current feedback if feedbackId is specified
      if (!feedbackId || data.comment.feedbackId === feedbackId) {
        setComments((prev) => [...prev, data.comment]);
      }
    };

    socket.on('comment:added', handleCommentAdded);

    return () => {
      socket.off('comment:added', handleCommentAdded);
    };
  }, [socket, feedbackId]);

  const addComment = useCallback(
    (data: CommentData) => {
      if (socket?.connected) {
        socket.emit('comment:add', data);
      }
    },
    [socket]
  );

  return { comments, addComment };
}

/**
 * Hook to update user presence
 */
export function usePresence(socket: Socket | null) {
  const updatePresence = useCallback(
    (viewingFeedbackId?: string) => {
      if (socket?.connected) {
        socket.emit('presence:update', { viewingFeedbackId });
      }
    },
    [socket]
  );

  return { updatePresence };
}
