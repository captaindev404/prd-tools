# WebSocket Library

Real-time collaboration infrastructure for Gentil Feedback using Socket.IO.

## Overview

This library provides WebSocket functionality for real-time features:
- User presence tracking
- Live cursor movements
- Real-time feedback updates
- Collaborative comments
- Instant notifications

## Architecture

```
┌─────────────┐           WebSocket            ┌─────────────┐
│   Browser   │ ←────────────────────────────→ │   Server    │
│  (client.ts)│         /api/socket            │ (server.ts) │
└─────────────┘                                └─────────────┘
      ↓                                               ↓
React Hooks                                   Event Handlers
      ↓                                               ↓
  Components                                     Database
```

## Files

### `server.ts`
Server-side WebSocket event handlers and session management.

**Key Functions**:
- `initializeWebSocketServer(httpServer)` - Setup Socket.IO server
- `getIO()` - Get Socket.IO instance
- `getActiveUsers(sessionName)` - Get users in session

**Events Handled**:
- `user:join` - User joins session
- `user:leave` - User leaves session
- `cursor:move` - Cursor position update
- `presence:update` - User viewing context change
- `feedback:updated` - Feedback state change
- `comment:add` - New comment
- `feedback:assign` - Feedback assignment

### `client.ts`
Client-side React hooks for WebSocket features.

**Hooks Provided**:
- `useCollaborationSocket()` - Main connection management
- `useLiveCursors()` - Cursor tracking
- `useFeedbackUpdates()` - Real-time feedback changes
- `useCollaborativeComments()` - Comment management
- `usePresence()` - Presence updates

## Usage

### Server Setup

```typescript
// In server.js or custom Next.js server
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeWebSocketServer } from '@/lib/websocket/server';

const httpServer = createServer(/* ... */);
const io = initializeWebSocketServer(httpServer);

httpServer.listen(3000);
```

### Client Usage

```typescript
'use client';

import { useCollaborationSocket } from '@/lib/websocket/client';

export default function CollaborationPage() {
  const { socket, isConnected, activeUsers } = useCollaborationSocket(
    'my-session',
    currentUser
  );

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Active Users: {activeUsers.length}</p>
    </div>
  );
}
```

### Live Cursors

```typescript
import { useLiveCursors } from '@/lib/websocket/client';

const { cursors, updateCursor } = useLiveCursors(socket);

// Update cursor position
const handleMouseMove = (e: MouseEvent) => {
  updateCursor({
    feedbackId: 'fb_123',
    x: e.clientX,
    y: e.clientY
  });
};

// Render cursors
{cursors.map(cursor => (
  <Cursor key={cursor.userId} {...cursor} />
))}
```

### Real-Time Comments

```typescript
import { useCollaborativeComments } from '@/lib/websocket/client';

const { comments, addComment } = useCollaborativeComments(socket, feedbackId);

// Add comment
const handleSubmit = (content: string) => {
  addComment({ content, feedbackId });
};

// Render comments
{comments.map(comment => (
  <Comment key={comment.id} {...comment} />
))}
```

## Event Flow

### User Joins Session

```
Client                          Server                      Database
  │                              │                            │
  ├─ emit('user:join') ──────────▶                            │
  │                              ├─ Add to session map        │
  │                              ├─ Update session ──────────▶│
  │                              │                            │
  │◀─── emit('user:joined') ─────┤◀─── Save complete ────────┤
  │                              │                            │
```

### Real-Time Comment

```
Client A        Server          Database        Client B
  │              │                │                │
  ├─ comment ────▶               │                │
  │              ├─ Save ────────▶               │
  │              │                │                │
  │              │◀─── Saved ─────┤               │
  │              ├─ Broadcast ─────────────────────▶
  │              │                │                │
```

## Data Structures

### SocketUser

```typescript
interface SocketUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
}
```

### CursorPosition

```typescript
interface CursorPosition {
  feedbackId: string;
  x: number;
  y: number;
}
```

### CommentData

```typescript
interface CommentData {
  content: string;
  feedbackId?: string;
  resourceId?: string;
  resourceType?: string;
  parentId?: string;
}
```

## Session Management

Sessions are automatically created and managed:

**Session Name Format**: `{type}-{context}-{date}`
- Example: `feedback-triage-2025-10-13`

**Session Lifecycle**:
1. Created on first user join
2. Updated on each activity
3. Cleaned up when last user leaves
4. Persisted to database for history

## Performance Considerations

### Cursor Updates
- Throttled to ~60fps (16ms)
- Auto-cleanup after 5 seconds inactivity
- Only sent to users viewing same context

### Comments
- Loaded in batches (50 per request)
- Cached on client side
- Real-time updates via WebSocket

### Presence
- Updated on context change only
- Debounced to prevent spam
- Tracked per feedback item

## Error Handling

### Connection Errors

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  // Auto-retry handled by Socket.IO
});
```

### Event Errors

```typescript
socket.on('error', (data) => {
  console.error('Event error:', data.message);
  // Show user-friendly error message
});
```

## Security

### Authentication
All events require valid NextAuth session:

```typescript
socket.on('event', async (data) => {
  const { user } = socket.data;
  if (!user) {
    socket.emit('error', { message: 'Unauthorized' });
    return;
  }
  // ... handle event
});
```

### Validation
All input validated with Zod schemas:

```typescript
const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  feedbackId: z.string().optional(),
});

const data = commentSchema.parse(input);
```

## Debugging

### Enable Debug Logs

```typescript
// Client
localStorage.debug = 'socket.io-client:*';

// Server
DEBUG=socket.io:* node server.js
```

### Inspect WebSocket Frames

1. Open DevTools (F12)
2. Go to Network tab
3. Filter: WS (WebSocket)
4. Click connection
5. View frames sent/received

### Common Issues

**Issue**: Connection timeout
- Check server is running: `node server.js`
- Verify WebSocket path: `/api/socket`
- Check CORS configuration

**Issue**: Events not received
- Verify user is in correct room/session
- Check event name matches exactly
- Ensure socket is connected

**Issue**: Duplicate events
- Check for multiple socket connections
- Verify cleanup in useEffect

## Testing

### Unit Tests

```typescript
import { initializeWebSocketServer } from './server';

describe('WebSocket Server', () => {
  it('should handle user join', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
import { io as ioc } from 'socket.io-client';

test('real-time comment', async () => {
  const client = ioc('http://localhost:3000', {
    path: '/api/socket'
  });

  client.emit('comment:add', { content: 'Test' });
  // Assert comment received
});
```

## Production Considerations

### Scalability

For >100 concurrent users, use Redis adapter:

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Monitoring

Track key metrics:
- Active connections
- Message rate
- Error rate
- Latency (p50, p95, p99)

### Rate Limiting

Implement per-user rate limits:

```typescript
const userRateLimits = new Map();

socket.on('cursor:move', (data) => {
  const userId = socket.data.user.id;
  const now = Date.now();
  const last = userRateLimits.get(userId) || 0;

  if (now - last < 16) { // 60fps max
    return;
  }

  userRateLimits.set(userId, now);
  // ... handle event
});
```

## Related Documentation

- [TASK-060-COMPLETION.md](../../../docs/tasks/TASK-060-COMPLETION.md) - Implementation details
- [TASK-060-TESTING-GUIDE.md](../../../docs/tasks/TASK-060-TESTING-GUIDE.md) - Testing procedures
- [TASK-060-VISUAL-GUIDE.md](../../../docs/tasks/TASK-060-VISUAL-GUIDE.md) - UI/UX reference

## Support

For questions or issues:
1. Check troubleshooting section above
2. Review related documentation
3. Inspect WebSocket frames in DevTools
4. Check server logs for errors
5. Consult Socket.IO documentation: https://socket.io/docs/

---

**Remember**: Always use `node server.js` for WebSocket support, not `npm run dev`!
