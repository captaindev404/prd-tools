# Real-Time Build Progress Dashboard

## Overview

The Build Progress Dashboard provides live monitoring of task completion as agents work on the Odyssey Feedback project. It automatically updates every 2 seconds and announces new completions.

## Features

✅ **Real-Time Updates** - Auto-refreshes every 2 seconds
✅ **Progress Tracking** - Visual progress bars by epic and overall
✅ **Task Status** - Shows in-progress, completed, pending, blocked, failed
✅ **Recently Completed** - Lists last 5 completed tasks with timestamps
✅ **Epic Breakdown** - Progress by epic (Foundation, Auth, Feedback, etc.)
✅ **Build Statistics** - Time elapsed, completion rate, estimated remaining
✅ **Auto-Announcements** - Celebrates new task completions
✅ **Persistent Log** - Saves build progress to `build-log.json`

## Quick Start

### Start the Dashboard

```bash
cd tools
npm run dashboard
```

The dashboard will display:
- Overall progress bar (29/126 tasks = 23%)
- Tasks currently in progress
- Recently completed tasks
- Progress by epic with mini progress bars
- Build statistics and estimated completion time

### Update Tasks

In a separate terminal, update task status:

```bash
# Mark task as started
cd tools
npm run update-task start TASK-030 agent-007

# Mark task as completed
npm run update-task complete TASK-030 agent-007 "Vote weight calculation implemented"

# View task info
npm run update-task info TASK-030
```

The dashboard will automatically detect and announce the completion!

## Dashboard Layout

```
╔═══════════════════════════════════════════════════════════════════════════╗
║          ODYSSEY FEEDBACK - REAL-TIME BUILD DASHBOARD                     ║
╚═══════════════════════════════════════════════════════════════════════════╝

📊 OVERALL PROGRESS
[██████████████░░░░░░░░░░░░] 23.0%
Total: 126 | Completed: 29 | In Progress: 0 | Pending: 97

⚙️  TASKS IN PROGRESS
TASK-030 | Implement vote weight calculation       | agent-007

✅ RECENTLY COMPLETED
TASK-029 | Edit feedback page                      | 17:45:23
TASK-028 | Feedback submission form                | 17:44:10
...

📦 PROGRESS BY EPIC
Foundation        │ 12 │ 12 │ 0 │   0  │ [███████████████] 100%
Feedback          │ 11 │ 11 │ 0 │   0  │ [███████████████] 100%
Auth              │  6 │  6 │ 0 │   0  │ [███████████████] 100%
Voting            │  6 │  1 │ 1 │   4  │ [███░░░░░░░░░░░░]  17%
...

📈 BUILD STATISTICS
Build Started:     02/10/2025 15:45:00
Time Elapsed:      2h 5m
Est. Remaining:    10h (97 tasks pending)
Completion Rate:   14.0 tasks/hour
```

## Task Updater Commands

### Start a Task

```bash
npm run update-task start TASK-030 agent-007
```

This marks the task as `in_progress` and assigns it to agent-007.

### Complete a Task

```bash
npm run update-task complete TASK-030 agent-007 "Implemented weighted voting logic"
```

This marks the task as `completed` and adds optional notes.

### Fail a Task

```bash
npm run update-task fail TASK-030 agent-007 "Missing dependency"
```

This marks the task as `failed` with a reason.

### View Task Info

```bash
npm run update-task info TASK-030
```

Shows complete task details from the database.

### Reset a Task

```bash
npm run update-task reset TASK-030
```

Resets the task status to `pending`.

## Batch Updates

You can update multiple tasks programmatically:

```typescript
import { batchUpdate } from './task-updater';

batchUpdate([
  { task_id: 'TASK-030', status: 'completed', assigned_agent: 'agent-007' },
  { task_id: 'TASK-031', status: 'completed', assigned_agent: 'agent-007' },
  { task_id: 'TASK-032', status: 'in_progress', assigned_agent: 'agent-008' }
]);
```

## Integration with Agents

When launching agents, have them update task status:

```bash
# Before agent starts work
npm run update-task start TASK-030 agent-007

# Launch agent
# ... agent does work ...

# After agent completes
npm run update-task complete TASK-030 agent-007 "Task completed successfully"
```

## Announcement Example

When a task completes, the dashboard shows:

```
🎉 ===========================================================================
   TASK COMPLETED: TASK-030
   Implement vote weight calculation
   Agent: agent-007 | Epic: Voting
==============================================================================
```

## Build Log

Progress is saved to `build-log.json`:

```json
{
  "started_at": "2025-10-02T15:45:00Z",
  "last_updated": "2025-10-02T17:49:15Z",
  "completed_tasks": ["TASK-001", "TASK-002", ...],
  "in_progress_tasks": ["TASK-030"],
  "total_time_minutes": 125
}
```

This log persists across dashboard restarts.

## Keyboard Controls

- **Ctrl+C** - Stop the dashboard gracefully
  - Saves final statistics
  - Closes database connection
  - Shows summary before exit

## Tips

1. **Run in tmux/screen** for persistent monitoring
2. **Split terminal** - dashboard on one side, updates on the other
3. **Watch build-log.json** for progress history
4. **Query database** directly for custom reports:
   ```bash
   sqlite3 prd.db "SELECT epic, COUNT(*) FROM tasks WHERE status='completed' GROUP BY epic"
   ```

## Troubleshooting

### Dashboard not updating

- Check that `prd.db` exists and is writable
- Verify tasks are being updated (check `updated_at` timestamp)
- Restart dashboard with `npm run dashboard`

### Task updates not showing

- Ensure you're using correct task_id format (TASK-XXX)
- Check task exists: `npm run update-task info TASK-XXX`
- Verify database permissions

### Dashboard displays wrong data

- The dashboard reads from `prd.db` every 2 seconds
- If data seems stale, check database directly:
  ```bash
  sqlite3 prd.db "SELECT * FROM tasks WHERE status='in_progress'"
  ```

## Advanced Usage

### Custom Refresh Interval

Edit `build-dashboard.ts`:

```typescript
const REFRESH_INTERVAL = 5000; // 5 seconds instead of 2
```

### Filter by Epic

```bash
sqlite3 prd.db "UPDATE tasks SET status='in_progress' WHERE epic='Voting' AND status='pending' LIMIT 1"
```

Watch the dashboard detect it automatically!

### Progress API

You can query progress programmatically:

```typescript
import Database from 'better-sqlite3';
const db = new Database('prd.db');

const stats = db.prepare(`
  SELECT
    status,
    COUNT(*) as count
  FROM tasks
  GROUP BY status
`).all();

console.log(stats);
// [ { status: 'completed', count: 29 }, { status: 'pending', count: 97 } ]
```

## Integration Example

Here's how to integrate with agent orchestration:

```bash
#!/bin/bash
# Launch agent with automatic status updates

TASK_ID="TASK-030"
AGENT_ID="agent-007"

# Mark as started
npm run update-task start $TASK_ID $AGENT_ID

# Launch agent (your agent execution here)
# ... agent work ...

# Check if agent succeeded
if [ $? -eq 0 ]; then
  npm run update-task complete $TASK_ID $AGENT_ID "Success"
else
  npm run update-task fail $TASK_ID $AGENT_ID "Agent failed"
fi
```

## Next Steps

1. Start the dashboard: `npm run dashboard`
2. Launch agents in parallel and watch progress update in real-time
3. Use task updater to manually mark tasks as you work
4. Monitor epic progress to prioritize next tasks

---

**Dashboard created**: 2025-10-02
**Version**: 1.0.0
**Status**: ✅ Fully Operational
