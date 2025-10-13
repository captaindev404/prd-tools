/**
 * Live Cursor Component
 *
 * Displays other users' cursors in real-time (Figma-style)
 */

'use client';

import { useMemo } from 'react';
import { MousePointer2 } from 'lucide-react';

interface LiveCursorProps {
  cursors: Array<{
    userId: string;
    displayName: string;
    feedbackId: string;
    x: number;
    y: number;
  }>;
  currentFeedbackId?: string;
}

export function LiveCursor({ cursors, currentFeedbackId }: LiveCursorProps) {
  // Filter cursors for current feedback item
  const visibleCursors = useMemo(() => {
    if (!currentFeedbackId) return [];
    return cursors.filter((c) => c.feedbackId === currentFeedbackId);
  }, [cursors, currentFeedbackId]);

  // Generate consistent colors for users
  const getUserColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#FFA07A', // Orange
      '#98D8C8', // Mint
      '#F7DC6F', // Yellow
      '#BB8FCE', // Purple
      '#85C1E2', // Sky Blue
    ];

    const hash = userId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
  };

  if (visibleCursors.length === 0) {
    return null;
  }

  return (
    <>
      {visibleCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="pointer-events-none fixed z-50 transition-all duration-100 ease-out"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
          }}
        >
          <MousePointer2
            className="h-5 w-5"
            style={{
              color: getUserColor(cursor.userId),
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          />
          <div
            className="mt-1 rounded px-2 py-1 text-xs font-medium text-white shadow-lg"
            style={{
              backgroundColor: getUserColor(cursor.userId),
            }}
          >
            {cursor.displayName}
          </div>
        </div>
      ))}
    </>
  );
}
