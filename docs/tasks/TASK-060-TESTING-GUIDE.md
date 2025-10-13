# TASK-060: Real-Time Collaboration - Testing Guide

## Quick Start

### 1. Start the Server

```bash
# Make sure dependencies are installed
npm install

# Generate Prisma client (if not done)
npm run db:generate

# Run any pending migrations
npm run db:migrate

# Start the custom server with WebSocket support
node server.js
```

Expected output:
```
> Ready on http://localhost:3000
> WebSocket server ready at ws://localhost:3000/api/socket
```

### 2. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000/feedback/collaborate
```

You must be signed in with a user that has one of these roles:
- PM
- PO
- MODERATOR
- ADMIN

## Multi-User Testing Setup

To test real-time collaboration features, you need multiple browser sessions:

### Option 1: Multiple Browsers
1. Open Chrome: `http://localhost:3000/feedback/collaborate`
2. Open Firefox: `http://localhost:3000/feedback/collaborate`
3. Open Safari: `http://localhost:3000/feedback/collaborate`

### Option 2: Incognito/Private Windows
1. Open regular Chrome window
2. Open Chrome Incognito: Cmd/Ctrl+Shift+N
3. Open another Incognito window
4. Navigate to dashboard in all windows

### Option 3: Different Devices (Best)
1. Open on laptop
2. Open on tablet/phone
3. Open on another computer
4. All connected to same network

## Test Scenarios

### Test 1: Connection and Presence

**Goal**: Verify users can see each other online

**Steps**:
1. Open dashboard in Window 1
2. Wait for "Connected" status (green dot)
3. Note your avatar appears in ActiveUsers
4. Open dashboard in Window 2
5. Verify Window 1 shows 2 users
6. Verify Window 2 shows 2 users
7. Check avatar stack displays both users

**Expected Result**:
- Both windows show "2 users online"
- Avatar stack shows both user avatars
- Connection status: 🟢 Connected

**Screenshot**:
```
Top-right corner should show:
🟢 Connected  👤👤 2 users online
```

---

### Test 2: Live Cursors

**Goal**: See other users' cursors in real-time

**Steps**:
1. In Window 1: Click on a feedback item to select it
2. In Window 2: Click on the SAME feedback item
3. In Window 1: Move your mouse around the screen
4. In Window 2: Observe the cursor

**Expected Result**:
- Window 2 shows a colored cursor with Window 1 user's name
- Cursor follows mouse movement smoothly (100ms delay max)
- Cursor disappears after 5 seconds of no movement
- Different users have different cursor colors

**Troubleshooting**:
- If cursor doesn't appear: Check both windows are viewing SAME feedback
- Cursor only shows when feedback item is selected
- Move mouse continuously for best visibility

---

### Test 3: Presence Badges

**Goal**: See who's viewing which feedback

**Steps**:
1. In Window 1: Click Feedback Item A
2. In Window 2: Click Feedback Item A
3. Observe the eye icon badge on Feedback A
4. In Window 2: Click Feedback Item B
5. Observe badges update

**Expected Result**:
- Feedback A shows: 👁️ 2 (when both viewing)
- Feedback A shows: 👁️ 1 (when one viewing)
- Feedback B shows: 👁️ 1 (when Window 2 switches)
- Hover badge shows list of viewing users

---

### Test 4: Real-Time Comments

**Goal**: Comments appear instantly across all windows

**Steps**:
1. Both windows select the same feedback item
2. In Window 1: Type "This is a test comment" in comment box
3. In Window 1: Click "Comment" button or press Cmd+Enter
4. In Window 2: Observe the comment

**Expected Result**:
- Comment appears in Window 2 within 1 second
- Author name and avatar displayed correctly
- Timestamp shows "just now"
- Comment persists on page refresh

**Test Replies**:
1. In Window 2: Click "Reply" on the comment
2. Type "I agree with this"
3. Click "Reply" button
4. In Window 1: See nested reply appear

**Expected Result**:
- Reply shows indented under original comment
- Reply has smaller avatar (6px vs 8px)
- Thread hierarchy is clear

---

### Test 5: Feedback State Updates

**Goal**: State changes broadcast to all users

**Steps**:
1. Both windows viewing feedback list
2. In Window 1: Click ✓ (checkmark) on a feedback item
3. In Window 2: Observe the feedback item
4. Check "Recent Updates" panel

**Expected Result**:
- Feedback badge changes from "new" to "triaged"
- Update appears in both windows simultaneously
- Recent Updates panel shows: "[User] updated feedback"
- Update notification fades after 5 seconds

---

### Test 6: Connection Stability

**Goal**: Test reconnection and error handling

**Steps**:
1. Open dashboard in 2 windows
2. In Window 1: Open DevTools Network tab
3. Disable network (throttle to Offline)
4. Wait 5 seconds
5. Re-enable network
6. Observe reconnection

**Expected Result**:
- Status changes to "🔴 Disconnected"
- Socket automatically tries to reconnect
- Status returns to "🟢 Connected"
- Missed messages are caught up

**Test Server Restart**:
1. With both windows open and connected
2. Stop server (Ctrl+C)
3. Observe client status changes to Disconnected
4. Restart server: `node server.js`
5. Clients automatically reconnect within 10 seconds

---

### Test 7: Session Persistence

**Goal**: Comments and session data persist

**Steps**:
1. Add 3 comments in Window 1
2. Close Window 1 completely
3. Reopen Window 1 and navigate to dashboard
4. Select same feedback item

**Expected Result**:
- All 3 comments still visible
- Comment order preserved
- Timestamps accurate
- Session continues with same name

---

## Performance Testing

### Test 8: Many Users (Stress Test)

**Goal**: Test with 10+ concurrent users

**Setup**:
1. Open 10 browser windows/tabs
2. Sign in to each (use different accounts if possible)
3. All navigate to collaboration dashboard

**Monitor**:
- Server CPU/Memory usage
- WebSocket message rate
- Comment latency (time to appear in other windows)
- Cursor update smoothness

**Expected Performance**:
- Comment latency < 500ms
- Cursor updates < 100ms
- No memory leaks (check Chrome Task Manager)
- Server RAM < 500MB

---

## Debugging

### Check WebSocket Connection

**Browser DevTools**:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: WS (WebSocket)
4. Look for: `ws://localhost:3000/api/socket`
5. Click connection to see messages

**Expected Messages**:
- `user:join` when connecting
- `cursor:move` when moving mouse
- `comment:added` when commenting
- `presence:changed` when switching feedback

### Check Server Logs

Terminal running `node server.js` shows:
```
[WebSocket] Client connected: <socket-id>
[WebSocket] User Alice joining session: feedback-triage-2025-10-13
[WebSocket] Client disconnected: <socket-id>
```

### Common Issues

**Issue**: Cursors not appearing
- **Fix**: Ensure both users viewing SAME feedback item
- Check DevTools for `cursor:move` events

**Issue**: Comments not appearing
- **Fix**: Check API endpoint `/api/collaborate/comment` returns 200
- Verify user has write permissions
- Check database for comment records

**Issue**: "Disconnected" status
- **Fix**: Restart server with `node server.js` (not `npm run dev`)
- Check CORS configuration matches origin
- Verify port 3000 not blocked by firewall

**Issue**: Users not seeing each other
- **Fix**: All must join same session (same date)
- Check ActiveUsers component receives data
- Verify Socket.IO connection established

---

## Manual Test Checklist

Use this checklist for comprehensive testing:

- [ ] Server starts without errors
- [ ] Dashboard loads for authorized users (PM/PO/MODERATOR)
- [ ] Dashboard shows access denied for regular users
- [ ] Connection status shows "Connected"
- [ ] Active users display correctly
- [ ] Can select feedback items
- [ ] State filter works (new, triaged, etc.)
- [ ] Can add comments
- [ ] Comments appear in other windows
- [ ] Can reply to comments
- [ ] Replies nest correctly
- [ ] Cursors visible when viewing same feedback
- [ ] Cursor colors different per user
- [ ] Presence badges show correct count
- [ ] Hover presence badge shows user names
- [ ] State changes broadcast instantly
- [ ] Recent updates panel shows changes
- [ ] Page refresh preserves comments
- [ ] Closing window removes user from ActiveUsers
- [ ] Reopening window reconnects automatically
- [ ] Multiple users can collaborate simultaneously

---

## Automated Testing (Future)

### Unit Tests

```typescript
// Example test structure
describe('WebSocket Server', () => {
  it('should add user to session on join', async () => {
    // Test user:join event
  });

  it('should broadcast cursor updates', async () => {
    // Test cursor:move event
  });

  it('should persist comments to database', async () => {
    // Test comment:add event
  });
});
```

### Integration Tests

```typescript
describe('Collaboration Dashboard', () => {
  it('should render active users', () => {
    // Test ActiveUsers component
  });

  it('should display comments in real-time', () => {
    // Test CollaborativeComments component
  });
});
```

### E2E Tests (Playwright)

```typescript
test('multi-user collaboration', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Test collaboration flow
});
```

---

## Reporting Issues

When reporting issues, include:

1. **Steps to Reproduce**
2. **Expected Behavior**
3. **Actual Behavior**
4. **Browser Console Logs** (DevTools → Console)
5. **Network Tab** (WebSocket frames)
6. **Server Logs** (terminal output)
7. **Screenshots/Video**

Example issue:
```
Title: Comments not appearing in Window 2

Steps:
1. Open dashboard in Chrome and Firefox
2. Both select Feedback #123
3. Add comment in Chrome
4. Firefox shows no new comment

Expected: Comment appears in Firefox within 1 second
Actual: Comment does not appear

Console: No errors
Network: See WebSocket frame "comment:added" sent
Server: No errors logged
```

---

## Success Criteria

The collaboration feature is working correctly when:

1. ✅ Multiple users can connect simultaneously
2. ✅ Users see each other in ActiveUsers component
3. ✅ Live cursors appear when viewing same feedback
4. ✅ Comments sync instantly across all sessions
5. ✅ Presence badges show accurate viewer counts
6. ✅ State changes broadcast to all users
7. ✅ Connections are stable and auto-reconnect
8. ✅ Performance is smooth with 10+ users
9. ✅ No console errors during normal operation
10. ✅ Session data persists across page refreshes

---

**Next**: After successful testing, proceed with production deployment following recommendations in TASK-060-COMPLETION.md
