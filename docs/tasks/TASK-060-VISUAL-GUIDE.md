# TASK-060: Real-Time Collaboration - Visual Guide

## Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Collaboration Dashboard                       🟢 Connected  👤👤👤 3 users  │
│  Real-time feedback triage with your team                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────┬──────────────────────────────────┐ │
│  │  FEEDBACK LIST (2/3)                │  COLLABORATION SIDEBAR (1/3)     │ │
│  │                                     │                                  │ │
│  │  🔍 Filter by State: [New ▼]       │  📋 Selected Feedback            │ │
│  │                                     │  "Login takes too long"          │ │
│  │  ┌──────────────────────────────┐  │                                  │ │
│  │  │ 🟦 Login takes too long      │  │  💬 Live Collaboration (3)       │ │
│  │  │ The login screen is slow...  │  │                                  │ │
│  │  │ [new] [15 votes] 👁️ 2        │  │  ┌────────────────────────────┐ │ │
│  │  │ by Alice Chen                │  │  │ 👤 Sarah PM                 │ │ │
│  │  │                       ✓  ✗   │  │  │ "Good catch, seeing this    │ │ │
│  │  └──────────────────────────────┘  │  │ in production too"          │ │ │
│  │                                     │  │ 2 minutes ago               │ │ │
│  │  ┌──────────────────────────────┐  │  │ [Reply]                     │ │ │
│  │  │ Booking confirmation error   │  │  │                             │ │ │
│  │  │ Users not receiving emails   │  │  │   👤 John Dev               │ │ │
│  │  │ [new] [8 votes] 👁️ 1         │  │  │   "I can reproduce this"    │ │ │
│  │  │ by Bob Martinez              │  │  │   1 minute ago              │ │ │
│  │  │                       ✓  ✗   │  │  └────────────────────────────┘ │ │
│  │  └──────────────────────────────┘  │                                  │ │
│  │                                     │  ┌────────────────────────────┐ │ │
│  │  ┌──────────────────────────────┐  │  │ [Type your comment here...] │ │ │
│  │  │ Payment gateway timeout      │  │  │                             │ │ │
│  │  │ Transactions failing at...   │  │  │          [Comment] ↵        │ │ │
│  │  │ [triaged] [23 votes]         │  │  └────────────────────────────┘ │ │
│  │  │ by Carol Lee                 │  │                                  │ │
│  │  │                       ✓  ✗   │  │  🔄 Recent Updates              │ │ │
│  │  └──────────────────────────────┘  │  Sarah updated feedback         │ │ │
│  │                                     │  John added comment             │ │ │
│  └─────────────────────────────────────┴──────────────────────────────────┘ │
│                                                                              │
│  👁️ Live Cursors (only when same feedback selected):                        │
│  🖱️ Alice (at x:450, y:320)  🖱️ Bob (at x:680, y:180)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Active Users Component

```
┌──────────────────────────────────┐
│  👤👤👤 +2    3 users online      │
│  ^   ^                           │
│  │   │                           │
│  │   └─ Overflow indicator       │
│  └───── Avatar stack             │
└──────────────────────────────────┘

Hover to see:
┌────────────────┐
│ 👤 Alice Chen  │
│ PM             │
│ 🟢 Viewing     │
├────────────────┤
│ 👤 Bob Martinez│
│ PO             │
└────────────────┘
```

### 2. Presence Badge

```
On Feedback Card:
┌─────────────────────────────────┐
│ Login takes too long            │
│ State: new | 15 votes | 👁️ 2   │
│                         └─┬─┘   │
│                           │     │
│                    Presence badge
└─────────────────────────────────┘

Hover:
┌──────────────────────┐
│ Currently viewing:   │
│ • Alice Chen         │
│ • Bob Martinez       │
└──────────────────────┘
```

### 3. Live Cursors

```
User views Feedback A:

Window 1 (Alice):                    Window 2 (Bob):
┌──────────────────────────┐        ┌──────────────────────────┐
│ [Feedback A selected]    │        │ [Feedback A selected]    │
│                          │        │                          │
│        🖱️ Alice          │        │        🖱️ Bob            │
│          │               │        │          │               │
│  (cursor shows in Bob's) │        │  (cursor shows in Alice's│
└──────────────────────────┘        └──────────────────────────┘

Different colors per user:
🖱️ Alice  (Red)
🖱️ Bob    (Teal)
🖱️ Carol  (Blue)
```

### 4. Comment Thread

```
┌────────────────────────────────────────┐
│ 💬 Live Collaboration Comments (3)     │
├────────────────────────────────────────┤
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ [Write your comment...]            │ │
│ │                                    │ │
│ │           Cmd+Enter to send ↵      │ │
│ │                      [Comment]     │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 👤 Sarah PM        2 minutes ago   │ │
│ │                                    │ │
│ │ Good catch, seeing this in         │ │
│ │ production too                     │ │
│ │                                    │ │
│ │ [Reply]                            │ │
│ │                                    │ │
│ │ ├─ 👤 John Dev    1 minute ago     │ │
│ │ │  I can reproduce this too        │ │
│ │ │                                  │ │
│ │ └─ 👤 Alice      30 seconds ago    │ │
│ │    Let's prioritize this           │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### 5. Connection Status

```
Connected:
┌──────────────────┐
│ 🟢 Connected     │  ← Green dot
└──────────────────┘

Disconnected:
┌──────────────────┐
│ 🔴 Disconnected  │  ← Red dot
└──────────────────┘

Reconnecting:
┌──────────────────┐
│ 🟡 Reconnecting  │  ← Yellow dot (spinner)
└──────────────────┘
```

## User Flow Diagrams

### Flow 1: Joining a Collaboration Session

```
User Opens Dashboard
        ↓
    Load Page
        ↓
┌──────────────────┐
│ Check Auth       │ → Not signed in → Redirect to /auth/signin
└────────┬─────────┘
         │ Signed in
         ↓
┌──────────────────┐
│ Check Role       │ → USER role → Show "Access Restricted"
└────────┬─────────┘
         │ PM/PO/MOD/ADMIN
         ↓
┌──────────────────┐
│ Connect WebSocket│
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Emit 'user:join' │
└────────┬─────────┘
         ↓
┌──────────────────────────────────┐
│ Server Updates Session           │
│ • Add user to participantIds     │
│ • Increment activeCount          │
│ • Save to database               │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│ Broadcast to All Users           │
│ 'user:joined' event              │
└────────┬─────────────────────────┘
         ↓
┌──────────────────────────────────┐
│ All Windows Update:              │
│ • ActiveUsers component          │
│ • User count                     │
│ • Avatar stack                   │
└──────────────────────────────────┘
```

### Flow 2: Real-Time Comment

```
User Types Comment in Window A
        ↓
    Clicks "Comment" or Cmd+Enter
        ↓
┌──────────────────┐
│ Client validates │
│ (not empty)      │
└────────┬─────────┘
         ↓
┌──────────────────────────┐
│ Emit 'comment:add'       │
│ {                        │
│   content: "text",       │
│   feedbackId: "fb_123",  │
│   sessionId: "sess_abc"  │
│ }                        │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Server Receives Event    │
│ • Validate user auth     │
│ • Validate session       │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Save to Database         │
│ CollaborationComment     │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Broadcast 'comment:added'│
│ to All Users in Session  │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ All Windows Receive:     │
│ • Window A: Optimistic   │
│   update confirms        │
│ • Window B: New comment  │
│   appears instantly      │
│ • Window C: New comment  │
│   appears instantly      │
└──────────────────────────┘
```

### Flow 3: Live Cursor Movement

```
User Moves Mouse in Window A
        ↓
    (throttled to ~60fps)
        ↓
┌──────────────────────────┐
│ Get mouse position       │
│ x: 450, y: 320           │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Emit 'cursor:move'       │
│ {                        │
│   feedbackId: "fb_123",  │
│   x: 450,                │
│   y: 320                 │
│ }                        │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Server Receives          │
│ • Add userId             │
│ • Add displayName        │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Broadcast 'cursor:update'│
│ to Others (not sender)   │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Window B & C:            │
│ • Render LiveCursor      │
│ • Position at x,y        │
│ • Show user name tag     │
│ • Use user-specific color│
└────────┬─────────────────┘
         ↓
    (after 5 seconds)
         ↓
┌──────────────────────────┐
│ Cursor fades out if      │
│ no new updates received  │
└──────────────────────────┘
```

## State Transitions

### Feedback State Machine

```
┌─────┐
│ new │ ──────────────────────────┐
└──┬──┘                           │
   │ [PM clicks ✓]                │ [PM clicks ✗]
   ↓                              ↓
┌─────────┐                   ┌────────┐
│ triaged │                   │ closed │
└────┬────┘                   └────────┘
     │ [Add to roadmap]
     ↓
┌───────────┐
│ in_roadmap│
└───────────┘
     │ [Mark as duplicate]
     ↓
┌────────┐
│ merged │
└────────┘
```

### WebSocket Connection States

```
[Page Load]
     ↓
┌─────────────┐
│ Disconnected│
└──────┬──────┘
       │ socket.connect()
       ↓
┌─────────────┐
│ Connecting  │ ──[timeout]──→ [Reconnecting]
└──────┬──────┘                       │
       │ 'connect' event              │
       ↓                              │
┌─────────────┐                       │
│  Connected  │ ←─────────────────────┘
└──────┬──────┘
       │ 'disconnect' event
       ↓
┌─────────────┐
│ Reconnecting│ ──[3 attempts]──→ [Failed]
└─────────────┘
```

## Data Models

### CollaborationSession

```
┌──────────────────────────────────┐
│ CollaborationSession             │
├──────────────────────────────────┤
│ id: "sess_01HJ..."               │
│ sessionName: "feedback-triage-..." │
│ type: "feedback"                 │
│ participantIds: ["usr_1", ...]   │
│ activeCount: 3                   │
│ lastActivityAt: 2025-10-13T...   │
│ createdAt: 2025-10-13T...        │
│ updatedAt: 2025-10-13T...        │
├──────────────────────────────────┤
│ Relations:                       │
│ • comments: CollaborationComment[]│
└──────────────────────────────────┘
```

### CollaborationComment

```
┌──────────────────────────────────┐
│ CollaborationComment             │
├──────────────────────────────────┤
│ id: "comm_01HJ..."               │
│ sessionId: "sess_01HJ..."        │
│ authorId: "usr_01HJ..."          │
│ authorName: "Alice Chen"         │
│ authorAvatar: "https://..."      │
│ content: "Good catch"            │
│ feedbackId: "fb_01HJ..."         │
│ parentId: null                   │
│ createdAt: 2025-10-13T...        │
├──────────────────────────────────┤
│ Relations:                       │
│ • session: CollaborationSession  │
│ • parent: CollaborationComment?  │
│ • replies: CollaborationComment[]│
└──────────────────────────────────┘
```

## WebSocket Event Payload Schemas

### user:join

```json
{
  "user": {
    "id": "usr_01HJ...",
    "displayName": "Alice Chen",
    "avatarUrl": "https://...",
    "role": "PM"
  },
  "sessionName": "feedback-triage-2025-10-13"
}
```

### cursor:move

```json
{
  "feedbackId": "fb_01HJ...",
  "x": 450,
  "y": 320
}
```

### comment:add

```json
{
  "content": "This is a good point",
  "feedbackId": "fb_01HJ...",
  "resourceType": "feedback",
  "parentId": null
}
```

### comment:added (broadcast)

```json
{
  "comment": {
    "id": "comm_01HJ...",
    "content": "This is a good point",
    "feedbackId": "fb_01HJ...",
    "author": {
      "id": "usr_01HJ...",
      "displayName": "Alice Chen",
      "avatarUrl": "https://..."
    },
    "createdAt": "2025-10-13T12:34:56Z",
    "replies": []
  }
}
```

## Performance Metrics

### Target Latencies

```
┌──────────────────────────────────┬──────────┐
│ Event                            │ Latency  │
├──────────────────────────────────┼──────────┤
│ User joins → Others notified     │ < 500ms  │
│ Comment sent → Appears in others │ < 500ms  │
│ Cursor move → Updates others     │ < 100ms  │
│ State change → Broadcast         │ < 300ms  │
│ Presence update → Badge change   │ < 200ms  │
└──────────────────────────────────┴──────────┘
```

### Resource Usage

```
┌──────────────────────────────┬───────────┐
│ Metric                       │ Target    │
├──────────────────────────────┼───────────┤
│ Server Memory (10 users)     │ < 200MB   │
│ Server Memory (100 users)    │ < 500MB   │
│ Client Memory per tab        │ < 100MB   │
│ WebSocket messages/second    │ < 50      │
│ Database connections         │ < 10      │
└──────────────────────────────┴───────────┘
```

---

## Color Coding

### User Cursor Colors

```
User 1: #FF6B6B (Red)       🖱️
User 2: #4ECDC4 (Teal)      🖱️
User 3: #45B7D1 (Blue)      🖱️
User 4: #FFA07A (Orange)    🖱️
User 5: #98D8C8 (Mint)      🖱️
User 6: #F7DC6F (Yellow)    🖱️
User 7: #BB8FCE (Purple)    🖱️
User 8: #85C1E2 (Sky Blue)  🖱️
```

### Status Indicators

```
🟢 Connected (Green)    - Active WebSocket
🔴 Disconnected (Red)   - No connection
🟡 Reconnecting (Yellow) - Attempting reconnect
```

### Feedback States

```
new         - Blue badge
triaged     - Green badge
merged      - Purple badge
in_roadmap  - Orange badge
closed      - Gray badge
```

---

This visual guide provides a comprehensive overview of the collaboration dashboard's UI components, data flows, and interaction patterns.
