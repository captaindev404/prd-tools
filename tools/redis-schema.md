# Redis Coordination Schema for Odyssey Feedback

This document defines the Redis key structure and patterns used to coordinate multiple Claude Code agents working on the Odyssey Feedback project.

## Namespace

All keys use the prefix `odyssey:` to avoid collisions with other projects.

---

## Key Definitions

### 1. Task Queue

**Key**: `odyssey:task:queue`
**Type**: List (FIFO queue)
**Purpose**: Main task queue where agents pop tasks to work on

**Operations**:
```bash
# Producer: Add tasks to queue
redis-cli LPUSH odyssey:task:queue "TASK-001"
redis-cli LPUSH odyssey:task:queue "TASK-002"

# Consumer (agent): Pop next task
redis-cli RPOP odyssey:task:queue
# Returns: "TASK-001"
```

**Lifecycle**: Cleared at orchestration start, populated from `prd.db`

---

### 2. Task Status

**Key Pattern**: `odyssey:task:{task_id}:status`
**Type**: String
**Purpose**: Track current status of each task

**Values**:
- `pending` - Task queued, not yet assigned
- `assigned` - Task popped by agent, work starting
- `in_progress` - Agent actively working
- `completed` - Task finished successfully
- `failed` - Task failed, error logged
- `blocked` - Task waiting for dependencies

**Operations**:
```bash
# Set status
redis-cli SET odyssey:task:TASK-001:status "in_progress"

# Check status
redis-cli GET odyssey:task:TASK-001:status

# Check if task completed (for dependency resolution)
status=$(redis-cli GET odyssey:task:TASK-001:status)
if [ "$status" = "completed" ]; then
  # Unblock dependent tasks
fi
```

**TTL**: No expiration (persist until project cleanup)

---

### 3. Task Result

**Key Pattern**: `odyssey:task:{task_id}:result`
**Type**: String (JSON)
**Purpose**: Store task execution results (files modified, notes, errors)

**Schema**:
```json
{
  "task_id": "TASK-001",
  "agent_id": "agent-fullstack-001",
  "started_at": "2025-10-02T14:30:00Z",
  "completed_at": "2025-10-02T14:45:00Z",
  "files_modified": [
    "package.json",
    "next.config.js"
  ],
  "notes": "Next.js 14 initialized with TypeScript",
  "errors": []
}
```

**Operations**:
```bash
# Agent: Store result on completion
redis-cli SET odyssey:task:TASK-001:result '{
  "task_id": "TASK-001",
  "files_modified": ["package.json"],
  "notes": "Setup complete"
}'

# Orchestrator: Retrieve result
redis-cli GET odyssey:task:TASK-001:result
```

**TTL**: No expiration

---

### 4. Error List

**Key**: `odyssey:errors:list`
**Type**: List
**Purpose**: Centralized error log for all agents

**Operations**:
```bash
# Agent: Report error
redis-cli LPUSH odyssey:errors:list "TASK-042: File not found - prisma/schema.prisma"

# Orchestrator: Check for errors
error_count=$(redis-cli LLEN odyssey:errors:list)
if [ "$error_count" -gt 0 ]; then
  redis-cli LRANGE odyssey:errors:list 0 -1  # Get all errors
fi
```

**Lifecycle**: Cleared at orchestration start

---

### 5. Progress Counter

**Key**: `odyssey:progress`
**Type**: Hash
**Purpose**: Track overall project progress

**Fields**:
- `total` - Total tasks in project
- `pending` - Tasks not yet started
- `in_progress` - Tasks currently being worked on
- `completed` - Successfully finished tasks
- `failed` - Failed tasks
- `blocked` - Tasks waiting on dependencies

**Operations**:
```bash
# Initialize counters
redis-cli HSET odyssey:progress total 119
redis-cli HSET odyssey:progress pending 119
redis-cli HSET odyssey:progress in_progress 0
redis-cli HSET odyssey:progress completed 0
redis-cli HSET odyssey:progress failed 0
redis-cli HSET odyssey:progress blocked 0

# Agent: Update on task start
redis-cli HINCRBY odyssey:progress pending -1
redis-cli HINCRBY odyssey:progress in_progress 1

# Agent: Update on task completion
redis-cli HINCRBY odyssey:progress in_progress -1
redis-cli HINCRBY odyssey:progress completed 1

# Orchestrator: Get progress snapshot
redis-cli HGETALL odyssey:progress
```

---

### 6. Agent Registry

**Key Pattern**: `odyssey:agent:{agent_id}`
**Type**: Hash
**Purpose**: Track active agents and their current task

**Fields**:
- `agent_type` - Type of agent (e.g., "fullstack-nodejs-nextjs-engineer")
- `current_task` - Task ID currently working on
- `started_at` - ISO timestamp when agent started
- `status` - "idle" | "working" | "finished"

**Operations**:
```bash
# Agent: Register on start
redis-cli HSET odyssey:agent:agent-001 agent_type "fullstack-nodejs-nextjs-engineer"
redis-cli HSET odyssey:agent:agent-001 status "idle"
redis-cli HSET odyssey:agent:agent-001 started_at "2025-10-02T14:00:00Z"

# Agent: Update when picking up task
redis-cli HSET odyssey:agent:agent-001 current_task "TASK-019"
redis-cli HSET odyssey:agent:agent-001 status "working"

# Agent: Mark finished
redis-cli HSET odyssey:agent:agent-001 status "finished"

# Orchestrator: List all agents
redis-cli KEYS "odyssey:agent:*"
```

**TTL**: 24 hours (auto-cleanup stale agents)

---

### 7. Dependency Lock

**Key Pattern**: `odyssey:task:{task_id}:dependencies`
**Type**: Set
**Purpose**: Track task dependencies (tasks that must complete first)

**Operations**:
```bash
# Orchestrator: Add dependencies for TASK-019
redis-cli SADD odyssey:task:TASK-019:dependencies "TASK-006" "TASK-016"

# Agent: Check if dependencies met before starting
deps=$(redis-cli SMEMBERS odyssey:task:TASK-019:dependencies)
all_complete=true
for dep in $deps; do
  status=$(redis-cli GET odyssey:task:$dep:status)
  if [ "$status" != "completed" ]; then
    all_complete=false
    break
  fi
done

if [ "$all_complete" = true ]; then
  # Safe to start task
else
  # Set task as blocked, requeue
  redis-cli SET odyssey:task:TASK-019:status "blocked"
  redis-cli LPUSH odyssey:task:queue "TASK-019"
fi
```

---

### 8. Coordination Events

**Key**: `odyssey:events`
**Type**: Stream (Redis Streams for event log)
**Purpose**: Audit trail of all coordination events

**Operations**:
```bash
# Agent: Log event
redis-cli XADD odyssey:events * \
  event_type "task_started" \
  task_id "TASK-001" \
  agent_id "agent-001" \
  timestamp "2025-10-02T14:30:00Z"

# Orchestrator: Read events
redis-cli XRANGE odyssey:events - +
```

**Lifecycle**: Persist for debugging, optional trimming after N entries

---

## Coordination Patterns

### Pattern 1: Task Assignment Flow

```bash
# 1. Agent requests next task
task_id=$(redis-cli RPOP odyssey:task:queue)

if [ -z "$task_id" ]; then
  # No tasks available
  exit 0
fi

# 2. Check dependencies
deps=$(redis-cli SMEMBERS odyssey:task:$task_id:dependencies)
# ... validate all deps completed ...

# 3. Mark as assigned
redis-cli SET odyssey:task:$task_id:status "assigned"
redis-cli HSET odyssey:agent:$agent_id current_task "$task_id"

# 4. Start work
redis-cli SET odyssey:task:$task_id:status "in_progress"
redis-cli HINCRBY odyssey:progress pending -1
redis-cli HINCRBY odyssey:progress in_progress 1

# 5. Execute task (agent does work here)
# ...

# 6. Mark complete
redis-cli SET odyssey:task:$task_id:status "completed"
redis-cli SET odyssey:task:$task_id:result "$result_json"
redis-cli HINCRBY odyssey:progress in_progress -1
redis-cli HINCRBY odyssey:progress completed 1
```

### Pattern 2: Error Handling

```bash
# Agent encounters error
redis-cli LPUSH odyssey:errors:list "TASK-042: Prisma schema validation failed"
redis-cli SET odyssey:task:TASK-042:status "failed"
redis-cli HINCRBY odyssey:progress in_progress -1
redis-cli HINCRBY odyssey:progress failed 1

# Log error in result
redis-cli SET odyssey:task:TASK-042:result '{
  "task_id": "TASK-042",
  "errors": ["Prisma schema validation failed: ..."]
}'
```

### Pattern 3: Progress Monitoring

```bash
# Dashboard script (runs every 5s)
while true; do
  clear
  echo "=== Odyssey Feedback Progress ==="
  redis-cli HGETALL odyssey:progress | awk 'NR%2{printf "%s: ",$0;next;}1'

  echo -e "\n=== Errors ==="
  redis-cli LRANGE odyssey:errors:list 0 4  # Last 5 errors

  echo -e "\n=== Active Agents ==="
  redis-cli KEYS "odyssey:agent:*" | while read key; do
    redis-cli HGETALL "$key" | awk 'NR%2{printf "%s: ",$0;next;}1'
    echo "---"
  done

  sleep 5
done
```

---

## Cleanup Commands

```bash
# Clear all Odyssey keys (use with caution!)
redis-cli --scan --pattern "odyssey:*" | xargs redis-cli DEL

# Clear specific namespaces
redis-cli DEL odyssey:task:queue
redis-cli DEL odyssey:errors:list
redis-cli DEL odyssey:progress

# Clear task-specific keys
redis-cli --scan --pattern "odyssey:task:*" | xargs redis-cli DEL

# Clear agent registry
redis-cli --scan --pattern "odyssey:agent:*" | xargs redis-cli DEL
```

---

## Best Practices

1. **Namespace all keys**: Always use `odyssey:` prefix
2. **Set TTLs on agent keys**: Prevents stale agent entries (24h)
3. **Atomic operations**: Use INCR/DECR for counters, SETNX for locks
4. **Error resilience**: Always log errors to `odyssey:errors:list`
5. **Dependency validation**: Check all deps before starting task
6. **Cleanup on start**: Clear old state before new orchestration run
7. **Monitor progress**: Use hash counters for real-time dashboards

---

## Integration with prd.db

The orchestrator script bridges SQLite (`prd.db`) and Redis:

1. **On start**: Read all pending tasks from `prd.db`, push to Redis queue
2. **Dependencies**: Load `task_dependencies` table, populate Redis sets
3. **On completion**: Update `prd.db` task status and `updated_at`
4. **Logging**: Write Redis events back to `redis_coordination` table for audit

---

## Reference

For more Redis patterns, see: `how-to-communicate-between-agents-using-redis.md`
