# Odyssey Feedback - Orchestration Tools

This directory contains tools for coordinating multiple Claude Code agents to build the Odyssey Feedback platform.

## Overview

The orchestration system uses:
- **SQLite** (`prd.db`) - Stores all tasks, dependencies, and metadata
- **Redis** - Coordinates agents in real-time using queues and shared state
- **TypeScript** - Orchestrator and monitoring scripts

## Files

### Core Files

- **`prd.db`** - SQLite database containing 119+ implementation tasks
- **`populate_tasks.sql`** - SQL script that populates tasks from PRD
- **`orchestrator.ts`** - Main orchestration script that coordinates agents
- **`progress-monitor.ts`** - Real-time dashboard showing progress
- **`redis-schema.md`** - Documentation of Redis key structure
- **`package.json`** - Node.js dependencies

### Documentation

- **`../docs/PRD.md`** - Complete Product Requirements Document
- **`../how-to-communicate-between-agents-using-redis.md`** - Redis patterns guide

## Setup

### Prerequisites

1. **Redis Server** (required for agent coordination)
   ```bash
   # Install Redis (macOS)
   brew install redis

   # Start Redis
   redis-server

   # Or using Docker
   docker run -d -p 6379:6379 redis:latest
   ```

2. **Node.js & TypeScript** (required for orchestrator)
   ```bash
   # Install dependencies
   cd tools
   npm install
   ```

3. **SQLite** (already installed on most systems)
   ```bash
   # Verify SQLite
   sqlite3 --version
   ```

### Verify Setup

```bash
# Check Redis connection
redis-cli PING
# Should return: PONG

# Check database
sqlite3 prd.db "SELECT COUNT(*) FROM tasks;"
# Should return: 119 (or total number of tasks)

# Check task breakdown
sqlite3 prd.db "SELECT epic, COUNT(*) as count FROM tasks GROUP BY epic ORDER BY count DESC;"
```

## Usage

### 1. ⭐ Real-Time Build Dashboard (NEW!)

```bash
cd tools
npm run dashboard
```

This launches a **live progress monitor** that auto-refreshes every 2 seconds:
- 📊 Overall progress bar (23% complete)
- ⚙️  Tasks currently in progress with agent info
- ✅ Recently completed tasks (last 5)
- 📦 Progress breakdown by epic with visual bars
- 📈 Build statistics (time elapsed, completion rate, estimates)
- 🎉 Celebrates new completions automatically!

**See `DASHBOARD_GUIDE.md` for complete documentation.**

### 2. Update Task Status

```bash
cd tools

# Mark task as started
npm run update-task start TASK-030 agent-007

# Mark task as completed
npm run update-task complete TASK-030 agent-007 "Implemented vote weights"

# Mark task as failed
npm run update-task fail TASK-030 agent-007 "Missing dependency"

# View task details
npm run update-task info TASK-030

# Reset to pending
npm run update-task reset TASK-030
```

**Dashboard automatically detects and announces these changes!** 🎊

### 3. View Tasks in Database

```bash
# List all pending tasks
sqlite3 prd.db "SELECT task_id, title, priority FROM tasks WHERE status='pending' ORDER BY priority LIMIT 10;"

# View tasks by epic
sqlite3 prd.db "SELECT task_id, title FROM tasks WHERE epic='Foundation' ORDER BY priority;"

# Check dependencies
sqlite3 prd.db "SELECT task_id, title, depends_on FROM tasks WHERE depends_on IS NOT NULL;"

# View completed tasks
sqlite3 prd.db "SELECT task_id, title, assigned_agent, updated_at FROM tasks WHERE status='completed' ORDER BY updated_at DESC LIMIT 10;"
```

### 2. Run Orchestrator (Simulation)

```bash
cd tools
npm run orchestrate
```

This will:
1. Connect to Redis and SQLite
2. Load all pending tasks
3. Populate task queue with ready tasks (no pending dependencies)
4. Simulate launching an agent
5. Display progress

**Note**: Currently this is a simulation. In production, it would launch actual Claude Code agents using the Task tool.

### 3. Monitor Progress

Open a separate terminal and run:

```bash
cd tools
npm run progress
```

This displays a real-time dashboard with:
- Overall progress (completion percentage)
- Active agents and their current tasks
- Recent errors
- Task queue status
- Recent activity log

Press `Ctrl+C` to exit.

### 4. Manual Redis Inspection

```bash
# View progress counters
redis-cli HGETALL odyssey:progress

# View task queue
redis-cli LRANGE odyssey:task:queue 0 -1

# Check specific task status
redis-cli GET odyssey:task:TASK-001:status

# View errors
redis-cli LRANGE odyssey:errors:list 0 -1

# View recent events
redis-cli XRANGE odyssey:events - +

# Monitor all Redis commands in real-time
redis-cli MONITOR
```

## Task Breakdown

The PRD has been broken down into **119 tasks** across **4 phases**:

### Phase 1: MVP (Weeks 1-8)
- **Foundation** (14 tasks): Project setup, Prisma schema, database migrations
- **Auth** (6 tasks): NextAuth.js with Azure AD/Keycloak
- **Feedback CRUD** (11 tasks): Create, read, update, merge feedback
- **Voting** (6 tasks): Weighted voting system
- **Features** (5 tasks): Feature catalog management
- **Moderation** (4 tasks): Auto-screening and review queue
- **Settings** (3 tasks): User profile and consent management
- **Roadmap** (2 tasks): Basic roadmap view

### Phase 2: Research Tools (Weeks 9-12)
- **Research Panels** (8 tasks): Panel creation, eligibility, invites
- **Questionnaires** (12 tasks): Builder, delivery, analytics

### Phase 3: Advanced Features (Weeks 13-16)
- **Sessions** (7 tasks): Research session scheduling
- **Roadmap Comms** (6 tasks): Publish updates, notifications
- **Integrations** (9 tasks): SendGrid, Jira, Figma, HRIS

### Phase 4: Polish & Scale (Weeks 17-20)
- **Performance** (5 tasks): Optimization, caching, PostgreSQL migration
- **Security** (5 tasks): GDPR compliance, CSP, audit logging
- **Testing** (6 tasks): Unit, integration, E2E tests
- **Documentation** (4 tasks): API docs, guides, deployment
- **Admin** (2 tasks): User management panel

### Redis Coordination (Ongoing)
- **Redis Coordination** (7 tasks): Setup, schema, monitoring

## Task Dependencies

Tasks have dependencies defined in the `depends_on` column. The orchestrator:

1. Loads all tasks from `prd.db`
2. Only queues tasks whose dependencies are completed
3. Marks other tasks as `blocked`
4. When a task completes, checks if any blocked tasks can be unblocked
5. Automatically queues newly unblocked tasks

Example dependency chain:
```
TASK-001 (Initialize Next.js)
  └── TASK-003 (Setup Prisma)
       └── TASK-004 (Define User schema)
            └── TASK-013 (Configure NextAuth)
                 └── TASK-014 (Azure AD provider)
```

## Agent Types

The orchestrator automatically selects agent types based on task category and tech stack:

| Category/Tech Stack | Agent Type |
|---------------------|------------|
| UI, Shadcn | `shadcn-design-engineer` |
| Backend, API, Next.js, Prisma | `fullstack-nodejs-nextjs-engineer` |
| Setup, Docs, Other | `general-purpose` |

## Redis Schema

See `redis-schema.md` for complete documentation.

**Key patterns**:
- `odyssey:task:queue` - Main task queue (list)
- `odyssey:task:{id}:status` - Task status (string)
- `odyssey:task:{id}:result` - Task result (JSON)
- `odyssey:task:{id}:dependencies` - Task dependencies (set)
- `odyssey:progress` - Progress counters (hash)
- `odyssey:agent:{id}` - Agent registry (hash)
- `odyssey:errors:list` - Error log (list)
- `odyssey:events` - Event stream (stream)

## Cleanup

To reset Redis state:

```bash
# Clear all Odyssey keys
redis-cli --scan --pattern "odyssey:*" | xargs redis-cli DEL

# Or delete specific namespaces
redis-cli DEL odyssey:task:queue
redis-cli DEL odyssey:errors:list
redis-cli --scan --pattern "odyssey:task:*" | xargs redis-cli DEL
```

To reset database task statuses:

```bash
sqlite3 prd.db "UPDATE tasks SET status='pending', assigned_agent=NULL WHERE status IN ('in_progress', 'completed');"
```

## Production Integration

To integrate with actual Claude Code agents:

1. **Modify `orchestrator.ts`**:
   - Replace simulation in `launchAgent()` with actual agent launch
   - Use the Task tool to spawn agents
   - Pass the generated prompt
   - Wait for agent completion

2. **Agent Execution**:
   - Each agent receives a prompt with task details
   - Agent executes the task (writes code, runs tests)
   - Agent reports results to Redis
   - Agent updates status in `prd.db`

3. **Scaling**:
   - Adjust `MAX_PARALLEL_AGENTS` env var (default: 3)
   - Monitor Redis and system resources
   - Consider distributed Redis for high load

## Troubleshooting

### Redis connection fails
```bash
# Check if Redis is running
redis-cli PING

# Start Redis if needed
redis-server
```

### Database locked
```bash
# Check for other processes accessing prd.db
lsof prd.db

# Kill if necessary or wait for completion
```

### Tasks stuck in "blocked" state
```bash
# Check dependency status
sqlite3 prd.db "SELECT task_id, depends_on FROM tasks WHERE status='blocked';"

# Manually mark dependency as completed if needed
redis-cli SET odyssey:task:TASK-XXX:status completed
```

## Contributing

When adding new tasks:

1. Add to `populate_tasks.sql`
2. Run: `sqlite3 prd.db < populate_tasks.sql`
3. Update `depends_on` JSON for task dependencies
4. Update this README with new task counts

## References

- **PRD**: `../docs/PRD.md`
- **DSL**: `../dsl/global.yaml`
- **Redis Guide**: `../how-to-communicate-between-agents-using-redis.md`
- **Project Instructions**: `../CLAUDE.md`

---

**Last Updated**: 2025-10-02
**Version**: 0.5.0
