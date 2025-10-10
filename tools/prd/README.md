# PRD Tool - Agent Task Management & Synchronization

A Rust-based CLI tool for managing tasks, breaking down work, and synchronizing between multiple agents. Perfect for coordinating complex development work across AI agents or team members.

## 🆕 What's New (Latest Version)

### Enhanced Automation & Usability
- ✅ **Broken Pipe Fix**: No more crashes when piping to `head`, `grep`, etc.
- 🔢 **Pagination**: Native `--limit` and `--offset` flags for list commands
- 🤖 **JSON Output**: `--json` flag for programmatic parsing
- 🎯 **Smart Task Selection**: `next` command finds the best task to work on
- ⚡ **Quick Complete**: `complete` command shortcut (no more verbose workflows)
- ❌ **Quick Cancel**: `cancel` command with optional reason (frees agents automatically)
- 🔍 **Agent Filter**: `--agent` flag to see tasks by specific agent
- 📦 **Batch Operations**: `batch-update` and `batch-assign` for bulk actions
- 🏷️ **Command Aliases**: `ls`, `tasks`, `agents`, `list-agents`, `create-agent`

### Examples of New Features

```bash
# Pagination - no more manual piping!
prd list --status pending --limit 10

# JSON output for scripts
prd list --status completed --json | jq '.[] | .title'

# Smart task selection
prd next --priority high --agent A1 --sync

# Quick completion and cancellation
prd complete "#42"                    # Uses assigned agent automatically
prd cancel "#42" --reason "Duplicate" # Quick cancel with reason

# Filter by agent
prd list --agent A1 --status in_progress

# Batch operations
prd batch-update "#1,#2,#3" completed
prd batch-assign "#10,#11,#12" backend-agent

# Aliases work everywhere
prd ls  # Same as 'prd list'
prd agents  # Same as 'prd agent-list'
```

## ✨ Features

- 📋 **Human-Readable IDs**: Use `#42` and `A5` instead of long UUIDs
- 🎯 **Epic Grouping**: Organize related tasks into epics
- 🔗 **Task Dependencies**: Define task ordering and blockers
- ✅ **Acceptance Criteria**: Define "done" with checklists
- 📊 **Advanced Filtering**: Filter by epic, priority, agent, status
- 🔨 **Task Breakdown**: Decompose large tasks into subtasks
- 👥 **Agent Coordination**: Register agents and assign work with synchronization
- 📈 **Progress Tracking**: Track estimated vs actual time, completion rates
- 🎯 **Interactive Dashboard**: Real-time visualization of work progress
- 💾 **SQLite Backend**: Persistent storage with migrations
- 🔄 **Activity Logging**: Complete audit trail of all task changes

## 🚀 Quick Start

### Installation

```bash
cd tools/prd
cargo build --release

# Optional: Add to shell profile
alias prd='/path/to/tools/prd/target/release/prd'
alias prd-dash='/path/to/tools/prd/target/release/prd-dashboard'
```

### Initialize Database

```bash
# Create a new database
prd init

# Or force recreate
prd init --force
```

### 5-Minute Tutorial

```bash
# 1. Create tasks with epics
prd create "Build auth system" --epic "User Management" --priority high
prd create "Add OAuth" --epic "User Management"
# Output: ID: #1, ID: #2

# 2. Add dependencies
prd depends "#2" --on "#1"  # OAuth depends on auth system

# 3. Add acceptance criteria
prd ac "#1" add "All unit tests pass"
prd ac "#1" add "Security review approved"
prd ac "#1" list

# 4. Create and assign agent
prd agent-create "backend-dev"
# Output: ID: A1

# 5. Start work
prd sync A1 "#1"

# 6. Check what's ready to work on
prd ready

# 7. Mark criterion complete
prd ac "#1" check 1

# 8. Complete task
prd update "#1" completed

# 9. View epic progress
prd epics

# 10. See statistics
prd stats
```

## 📖 Complete Command Reference

### All Commands at a Glance

| Category | Command | Aliases | Key Options | Description |
|----------|---------|---------|-------------|-------------|
| **Database** | `init` | - | `--force` | Initialize new database |
| | `migrate latest` | - | - | Run all migrations |
| | `migrate status` | - | - | Show migration status |
| | `migrate rollback` | - | `<version>` | Rollback to version |
| **Task CRUD** | `create` | - | `--epic`, `--priority`, `--parent`, `--description` | Create new task |
| | `list` | `ls`, `tasks` | `--status`, `--epic`, `--priority`, `--agent`, `--no-agent`, `--limit`, `--offset`, `--json` | List/filter tasks |
| | `show` | - | `--logs` | Show task details |
| | `update` | - | `--agent` | Update task status |
| | `breakdown` | - | `--interactive` | Break task into subtasks |
| | `duration` | - | `--estimated`, `--actual` | Set time estimates |
| **Dependencies** | `depends` | - | `--on`, `--blocks`, `--list` | Manage dependencies |
| | `ready` | - | - | List tasks ready to work on |
| **Acceptance Criteria** | `ac add` | - | - | Add criterion |
| | `ac list` | - | - | List criteria |
| | `ac check` | - | - | Mark criterion done |
| | `ac uncheck` | - | - | Mark criterion incomplete |
| **Agents** | `agent-create` | `create-agent` | - | Register new agent |
| | `agent-list` | `agents`, `list-agents` | - | List all agents |
| | `agent-status` | - | `--task` | Update agent status |
| | `assign` | - | - | Assign task to agent |
| | `sync` | - | - | Start agent work on task |
| **Advanced** | `complete` | - | `--agent` | Complete task (quick) |
| | `cancel` | - | `--reason` | Cancel task (quick) |
| | `next` | - | `--priority`, `--epic`, `--agent`, `--sync` | Get next best task |
| | `batch-update` | - | `--agent` | Update multiple tasks |
| | `batch-assign` | - | - | Assign multiple tasks |
| **Reporting** | `stats` | - | - | Show task statistics |
| | `epics` | - | - | List all epics with progress |

### Database Management

```bash
# Initialize new database
prd init

# Run migrations
prd migrate latest
prd migrate status
prd migrate rollback 1
```

### Task Management

#### Create Tasks

```bash
prd create "Task title"
prd create "Task title" --description "Details here"
prd create "Task title" --priority critical
prd create "Task title" --epic "Feature Name"
prd create "Subtask" --parent "#42"

# Combine options
prd create "Deploy backend" \
  --priority high \
  --epic "Production Release" \
  --description "Deploy all services to prod"
```

**ID Formats Supported:**
- `#42` - Display ID (recommended)
- `42` - Display ID without #
- Full UUID (backward compatible)

#### List & Filter Tasks

```bash
# Basic listing
prd list                              # All tasks
prd ls                                # Alias for list
prd tasks                             # Another alias
prd list --status pending             # By status
prd list --status in_progress

# Advanced filtering
prd list --epic "User Management"     # By epic
prd list --priority critical          # By priority
prd list --no-agent                   # Unassigned tasks
prd list --agent A1                   # Tasks for specific agent
prd list --epic "Auth" --status pending  # Multiple filters

# Pagination
prd list --limit 10                   # First 10 tasks
prd list --limit 10 --offset 20       # Tasks 20-30
prd list --status pending --limit 5   # First 5 pending tasks

# JSON output
prd list --json                       # All tasks as JSON
prd list --status completed --json | jq '.[].title'  # Use with jq

# Ready tasks (all dependencies met)
prd ready
```

#### View Task Details

```bash
prd show "#42"                 # Basic info
prd show "#42" --logs          # Include activity log
```

#### Update Tasks

```bash
prd update "#42" in_progress
prd update "#42" completed --agent A1
prd update "#42" blocked
prd update "#42" cancelled

# Quick shortcuts
prd complete "#42"                    # Quick complete (uses assigned agent)
prd complete "#42" --agent A1         # Specify agent
prd cancel "#42"                      # Quick cancel
prd cancel "#42" --reason "Out of scope"  # Cancel with reason
```

**Statuses:** `pending`, `in_progress`, `blocked`, `review`, `completed`, `cancelled`

#### Break Down Tasks

```bash
# Interactive mode (guided prompts)
prd breakdown "#42" --interactive

# Manual mode
prd create "Subtask 1" --parent "#42"
prd create "Subtask 2" --parent "#42"
```

### Epic Management

```bash
# Create tasks in an epic
prd create "Auth API" --epic "User System"
prd create "User Profile" --epic "User System"

# List epics with progress
prd epics
# Output:
# User System - 1/2 tasks (50%)

# Filter by epic
prd list --epic "User System"
```

### Task Dependencies

```bash
# Task #2 depends on #1 (must complete #1 first)
prd depends "#2" --on "#1"

# Task #1 blocks #2 (same as above, different perspective)
prd depends "#1" --blocks "#2"

# List dependencies
prd depends "#2" --list

# Find tasks ready to work on
prd ready  # Shows tasks with all dependencies completed
```

**All Dependency Operations:**

| Command | Description | Example |
|---------|-------------|---------|
| `depends <task-id> --on <dep-id>` | Add dependency (task depends on dep) | `prd depends "#2" --on "#1"` |
| `depends <task-id> --blocks <task-id>` | Add blocking relationship | `prd depends "#1" --blocks "#2"` |
| `depends <task-id> --list` | Show all dependencies and blocking tasks | `prd depends "#42" --list` |
| `ready` | List all tasks with completed dependencies | `prd ready` |

**Query Patterns for Dependencies:**

```bash
# View full dependency tree for a task
prd depends "#42" --list
# Output:
# Dependencies for task #42
# Depends on:
#   #1
#   #5
# Blocks:
#   #50
#   #51

# Find all tasks ready to work on (no pending dependencies)
prd ready
# Output: List of tasks where all dependencies are completed

# Check if specific task is ready
prd show "#42" --logs  # Check task details including dependencies

# Find unblocked tasks in specific epic
prd list --epic "Auth System" --status pending
prd ready  # Cross-reference which are actually ready
```

**Features:**
- ✅ Circular dependency detection (prevents cycles)
- ✅ Automatic ready-task filtering (smart dependency resolution)
- ✅ Prevents completing tasks with pending dependencies (validation)
- ✅ Bidirectional dependency tracking (depends on / blocks)

### Acceptance Criteria

```bash
# Add criteria (Definition of Done)
prd ac "#42" add "All unit tests pass"
prd ac "#42" add "Code review approved"
prd ac "#42" add "Documentation updated"

# List criteria
prd ac "#42" list
# Output:
# 1. ☐ All unit tests pass
# 2. ☑ Code review approved
# 3. ☐ Documentation updated
# 1/3 criteria met

# Check off criteria
prd ac "#42" check 1    # Mark #1 as done
prd ac "#42" check 3    # Mark #3 as done

# Uncheck if needed
prd ac "#42" uncheck 1
```

**All Acceptance Criteria Operations:**

| Command | Description | Example |
|---------|-------------|---------|
| `ac <task-id> add <text>` | Add new criterion | `prd ac "#42" add "Tests pass"` |
| `ac <task-id> list` | Show all criteria with completion status | `prd ac "#42" list` |
| `ac <task-id> check <id>` | Mark criterion as completed | `prd ac "#42" check 1` |
| `ac <task-id> uncheck <id>` | Mark criterion as incomplete | `prd ac "#42" uncheck 1` |

### Agent Management

#### Create & List Agents

```bash
prd agent-create "backend-dev"      # Output: ID: A1
prd create-agent "frontend-dev"     # Alias works too
prd agent-list                      # List all agents
prd agents                          # Alias for agent-list
prd list-agents                     # Another alias
```

#### Assign & Sync Work

```bash
# Assign task to agent
prd assign "#42" A1
prd assign "#42" "backend-dev"  # Can use name

# Sync agent (start working on task)
prd sync A1 "#42"               # Sets agent to working, task to in_progress
prd sync "backend-dev" "#42"    # Can use agent name

# Quick completion (NEW!)
prd complete "#42"              # Uses assigned agent automatically
prd complete "#42" --agent A1   # Or specify agent

# Update agent status
prd agent-status A1 working --task "#42"
prd agent-status A1 idle
prd agent-status A1 blocked --task "#42"
```

**Agent Statuses:** `idle`, `working`, `blocked`, `offline`

#### Smart Task Selection (NEW!)

```bash
# Get next best task to work on
prd next                        # Highest priority ready task
prd next --priority high        # Next high-priority task
prd next --epic "Auth System"   # Next task in specific epic

# Auto-assign and sync in one command
prd next --agent A1             # Assigns to agent A1
prd next --agent A1 --sync      # Assigns and starts work

# Combined filters
prd next --priority critical --epic "Production" --agent A1 --sync
```

#### Batch Operations (NEW!)

```bash
# Update multiple tasks at once
prd batch-update "#1,#2,#3" completed
prd batch-update "#10,#11,#12" in_progress --agent A1

# Assign multiple tasks to an agent
prd batch-assign "#20,#21,#22" backend-dev
prd batch-assign "#30,#31,#32,#33" A2
```

### Time Tracking & Stats

```bash
# Set durations
prd duration "#42" --estimated 120     # 2 hours estimated
prd duration "#42" --actual 95         # 1.5 hours actual

# View statistics
prd stats
# Shows:
# - Total tasks: 88
# - Status breakdown
# - Completion percentage
# - Progress bar
```

## 🎯 ID System

### Task IDs
- **Display ID**: `#1`, `#2`, `#42` (human-readable)
- **Internal**: Full UUID (used in database)
- **Usage**: All commands accept display IDs

### Agent IDs
- **Display ID**: `A1`, `A2`, `A5` (human-readable)
- **Name**: Can use agent name in commands
- **Internal**: Full UUID

### Examples

```bash
prd show "#42"           # ✅ Recommended
prd show "42"            # ✅ Also works
prd show "#42" --logs    # ✅ With additional flags
prd sync A5 "#42"        # ✅ Agent and task IDs
prd sync backend-dev #42 # ✅ Agent name works too
```

## 🔄 Complete Workflow Example

```bash
# Initialize project
prd init

# Create epic with tasks
prd create "User Authentication" --epic "Auth System" --priority critical
# ID: #1

prd create "OAuth Integration" --epic "Auth System" --priority high
# ID: #2

prd create "Password Reset" --epic "Auth System"
# ID: #3

# Set dependencies
prd depends "#2" --on "#1"  # OAuth needs auth first
prd depends "#3" --on "#1"  # Password reset needs auth first

# Add acceptance criteria
prd ac "#1" add "All tests pass"
prd ac "#1" add "Security audit complete"
prd ac "#1" add "Documentation updated"

# Create agents
prd agent-create "auth-backend-agent"  # A1
prd agent-create "qa-agent"            # A2

# Check what's ready
prd ready
# Shows #1 (no dependencies)

# Start work
prd sync A1 "#1"

# ...time passes...

# Check off criteria
prd ac "#1" check 1
prd ac "#1" check 2
prd ac "#1" check 3

# Complete task
prd update "#1" completed

# Check what's ready now
prd ready
# Shows #2 and #3 (dependency #1 is done)

# View epic progress
prd epics
# Auth System - 1/3 tasks (33%)

# View overall progress
prd stats
```

## 📊 Advanced Features

### Filtering Combinations

```bash
# Unassigned high-priority tasks in specific epic
prd list --epic "Auth System" --priority high --no-agent

# Pending tasks not assigned
prd list --status pending --no-agent

# Critical tasks in review
prd list --priority critical --status review
```

### Task Hierarchy

```bash
# Create parent task
prd create "Build Payment Feature" --priority high
# ID: #10

# Create subtasks
prd breakdown "#10" --interactive
# Or manually:
prd create "Stripe Integration" --parent "#10"  # #11
prd create "Payment UI" --parent "#10"          # #12
prd create "Receipt Generation" --parent "#10"  # #13

# Set dependencies between subtasks
prd depends "#12" --on "#11"  # UI depends on Stripe integration

# View hierarchy
prd show "#10"  # Shows all subtasks
```

### Multi-Agent Coordination

```bash
# Scenario: 3 agents working in parallel

# Agent 1: Backend work
prd sync backend-agent "#11"

# Agent 2: Waiting for #11 to complete
prd ready  # Shows #11 in progress, #12 not ready

# Agent 3: Independent work
prd sync qa-agent "#13"

# Agent 1 completes
prd update "#11" completed

# Now Agent 2 can start
prd ready  # Shows #12 is now ready
prd sync frontend-agent "#12"
```

## 🗄️ Database Schema

### Tables

#### `tasks`
```sql
id TEXT PRIMARY KEY           -- UUID
display_id INTEGER UNIQUE     -- Human-readable #42
title TEXT NOT NULL
description TEXT
status TEXT NOT NULL
priority TEXT NOT NULL
parent_id TEXT               -- Links to parent task
assigned_agent TEXT          -- Links to agents.id
created_at TEXT
updated_at TEXT
completed_at TEXT
estimated_duration INTEGER   -- Minutes
actual_duration INTEGER      -- Minutes
epic_name TEXT              -- Epic group name
```

#### `agents`
```sql
id TEXT PRIMARY KEY           -- UUID
display_id INTEGER UNIQUE     -- Human-readable A5
name TEXT UNIQUE NOT NULL
status TEXT NOT NULL
current_task_id TEXT         -- Links to tasks.id
created_at TEXT
last_active TEXT
```

#### `task_dependencies`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
task_display_id INTEGER      -- Task that has dependency
depends_on_display_id INTEGER -- Task it depends on
dependency_type TEXT         -- 'blocks'
created_at TEXT
```

#### `acceptance_criteria`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
task_display_id INTEGER
criterion TEXT NOT NULL
completed BOOLEAN DEFAULT 0
created_at TEXT
completed_at TEXT
```

#### `task_logs`
```sql
id TEXT PRIMARY KEY
task_id TEXT NOT NULL
agent_id TEXT
action TEXT NOT NULL
details TEXT
created_at TEXT
```

## 🔧 Programmatic API

### Rust Library Usage

The tool can be used as a Rust library for agent integration:

```rust
use prd_tool::{PRDClient, Priority, TaskStatus};

// Initialize client
let client = PRDClient::new("path/to/prd.db")?;

// Task operations
let task = client.create_task(
    "Implement feature X".to_string(),
    Some("Description".to_string()),
    Priority::High,
    None,  // No parent
    Some("Epic Name".to_string()),
)?;

// Agent operations
client.create_agent("my-agent".to_string())?;
client.sync_agent("my-agent", &task.id)?;

// Complete task
client.complete_task(&task.id, "my-agent")?;

// Query tasks
let pending = client.list_tasks(Some(TaskStatus::Pending))?;
```

See `examples/` directory for complete working examples.

## 🎮 Dashboard

Launch the interactive dashboard:

```bash
prd-dashboard
prd-dashboard /custom/path/prd.db 10  # Custom path, 10s refresh
```

Features:
- 📊 Real-time statistics and progress bar
- 🔥 Active tasks (in progress)
- ⚠️ Blocked tasks
- 👥 Agent activity
- 📝 Recent activity log
- 📋 Upcoming high-priority tasks

Press `Ctrl+C` to exit.

## 💡 Best Practices

### 1. Use Epics for Grouping

```bash
# Group related tasks
prd create "Setup DB" --epic "Backend Infrastructure"
prd create "Deploy API" --epic "Backend Infrastructure"
prd create "Add monitoring" --epic "Backend Infrastructure"

# View epic progress
prd epics
# Backend Infrastructure - 1/3 tasks (33%)

# Work on one epic at a time
prd list --epic "Backend Infrastructure" --status pending
```

### 2. Define Dependencies Early

```bash
# Create tasks
prd create "DB Schema" --priority critical    # #1
prd create "API Endpoints" --priority high    # #2
prd create "Frontend Integration"             # #3

# Set logical ordering
prd depends "#2" --on "#1"  # API needs DB
prd depends "#3" --on "#2"  # Frontend needs API

# Get smart work queue
prd ready  # Shows only #1 initially
```

### 3. Use Acceptance Criteria

```bash
# Define "done" clearly
prd ac "#42" add "All unit tests pass (>90% coverage)"
prd ac "#42" add "Integration tests pass"
prd ac "#42" add "Code reviewed and approved"
prd ac "#42" add "Documentation updated"
prd ac "#42" add "Deployed to staging"

# Track progress
prd ac "#42" list

# Check off as you go
prd ac "#42" check 1
prd ac "#42" check 2
```

### 4. Agent Coordination

```bash
# Register agents
prd agent-create "ios-engineer"      # A1
prd agent-create "backend-engineer"  # A2
prd agent-create "qa-engineer"       # A3

# Assign by specialty
prd sync A1 "#frontend-task"
prd sync A2 "#api-task"
prd sync A3 "#test-task"

# Monitor agent workload
prd agent-list
```

### 5. Break Down Large Tasks

```bash
# Create parent
prd create "Build Payment System" --priority critical
# ID: #50

# Interactive breakdown
prd breakdown "#50" --interactive
# Creates #51, #52, #53, etc.

# Add dependencies between subtasks
prd depends "#52" --on "#51"
prd depends "#53" --on "#52"
```

## 🔍 Filtering & Search

### Query Pattern Reference

All commands that support filtering:

| Command | Supports |
|---------|----------|
| `list` | `--status`, `--epic`, `--priority`, `--agent`, `--no-agent`, `--limit`, `--offset`, `--json` |
| `next` | `--priority`, `--epic`, `--agent`, `--sync` |
| `ready` | No filters (shows all ready tasks) |
| `epics` | No filters (shows all epics) |
| `stats` | No filters (shows all statistics) |

### ID Resolution Patterns

The tool accepts multiple ID formats for maximum flexibility:

**Task IDs:**
```bash
prd show "#42"           # Display ID with hash
prd show "42"            # Display ID without hash
prd show "uuid-abc123"   # UUID prefix
prd show "full-uuid"     # Full UUID
```

**Agent IDs:**
```bash
prd sync "A5" "#42"      # Display ID with A prefix
prd sync "5" "#42"       # Display ID (number only)
prd sync "agent-name" "#42"  # Agent name
prd sync "uuid-prefix" "#42" # UUID prefix
```

### Filter by Status

```bash
prd list --status pending
prd list --status in_progress
prd list --status blocked
prd list --status review
prd list --status completed
prd list --status cancelled
```

**Available statuses:** `pending`, `in_progress`, `blocked`, `review`, `completed`, `cancelled`

### Filter by Priority

```bash
prd list --priority low
prd list --priority medium
prd list --priority high
prd list --priority critical
```

**Available priorities:** `low`, `medium`, `high`, `critical`

### Filter by Epic

```bash
prd list --epic "User Management"
prd list --epic "Backend Infrastructure"
prd list --epic "Frontend" --status pending
```

### Filter by Agent Assignment

```bash
# Unassigned tasks only
prd list --no-agent

# Tasks assigned to specific agent
prd list --agent "A1"
prd list --agent "backend-dev"
prd list --agent "5"
```

### Pagination & Output Format

```bash
# Limit results
prd list --limit 10                    # First 10 tasks
prd list --limit 20 --offset 10        # Tasks 10-30
prd list --status pending --limit 5    # First 5 pending

# JSON output for scripting
prd list --json
prd list --status completed --json | jq '.[].title'
prd list --epic "Auth" --json | jq 'length'
```

### Combined Filters

```bash
# Critical unassigned tasks
prd list --priority critical --no-agent

# Pending high-priority tasks in specific epic
prd list --epic "Auth System" --status pending --priority high

# First 5 critical tasks assigned to specific agent
prd list --priority critical --agent "A1" --limit 5

# In-progress tasks in epic with JSON output
prd list --epic "Backend" --status in_progress --json

# Unassigned medium priority tasks
prd list --priority medium --no-agent --limit 10

# All tasks in epic paginated
prd list --epic "User Management" --limit 10 --offset 0
```

### Query Use Cases

**Find work to do:**
```bash
# Get all unassigned high-priority tasks
prd list --priority high --no-agent

# Get next task automatically
prd next --priority high

# Get next task in specific epic
prd next --epic "Auth System"
```

**Monitor progress:**
```bash
# See all in-progress work
prd list --status in_progress

# See what specific agent is working on
prd list --agent "backend-dev" --status in_progress

# Check blocked tasks
prd list --status blocked
```

**Epic tracking:**
```bash
# All tasks in epic
prd list --epic "Payment System"

# Pending tasks in epic
prd list --epic "Payment System" --status pending

# Progress overview
prd epics
```

**Team coordination:**
```bash
# See all agent activity
prd agent-list

# Tasks ready for assignment
prd ready

# Assign next critical task
prd next --priority critical --agent A1 --sync
```

**Reporting & Analysis:**
```bash
# Export completed tasks as JSON
prd list --status completed --json > completed.json

# Get task counts by epic
prd list --epic "Auth" --json | jq 'length'

# Find stale in-progress tasks
prd list --status in_progress --json | jq '.[] | select(.updated_at < "2025-01-01")'
```

### Advanced Shell Piping

```bash
# Combine with standard Unix tools
prd list --priority high | grep "API"
prd ready | head -n 1
prd list --status pending | wc -l

# Extract specific fields (with JSON)
prd list --json | jq '.[].id'
prd list --epic "Auth" --json | jq -r '.[].title'
```

## 🔄 Migration Guide

If you have an existing PRD database, the migration is automatic and preserves all data:

```bash
# Check current version
prd migrate status

# Run migrations (safe - preserves all data)
prd migrate latest

# Verify data preserved
prd list
prd agent-list
```

**What gets migrated:**
- ✅ All tasks preserve UUIDs and get new display IDs (sequential)
- ✅ All agents preserve UUIDs and get new display IDs (sequential)
- ✅ Epic names added (initially NULL)
- ✅ New tables created (dependencies, acceptance criteria)
- ✅ Zero data loss guaranteed

## 📝 Task Statuses & Workflow

### Status Flow

```
pending → in_progress → review → completed
                ↓
            blocked
                ↓
          (back to pending)
```

### When to Use Each Status

- **pending**: Task created, not started
- **in_progress**: Agent actively working on it
- **blocked**: Waiting on external factors, dependencies, or decisions
- **review**: Work done, awaiting approval/review
- **completed**: Fully done and accepted
- **cancelled**: No longer needed (scope change, etc.)

## 🎯 Priorities

- **low**: Nice to have, no urgency
- **medium**: Standard priority (default)
- **high**: Important, should be done soon
- **critical**: Must be done ASAP, blocking other work

Tasks are always sorted by priority (critical → high → medium → low).

## 👥 Agent Coordination Patterns

### Pattern 1: Single Agent, Multiple Tasks

```bash
prd agent-create "solo-dev"  # A1
prd ready | head -1          # Get next task: #1
prd sync A1 "#1"
# ... work ...
prd update "#1" completed
prd ready | head -1          # Get next task
```

### Pattern 2: Multiple Agents, Specialized Work

```bash
prd agent-create "backend-dev"   # A1
prd agent-create "frontend-dev"  # A2

# Assign by specialty
prd list --epic "API Development" | grep "#" | while read id rest; do
    prd assign "$id" A1
done

prd list --epic "UI Development" | grep "#" | while read id rest; do
    prd assign "$id" A2
done
```

### Pattern 3: Parallel Work with Dependencies

```bash
# Tasks:
# #1: Database schema (no deps)
# #2: API layer (depends on #1)
# #3: Unit tests (depends on #2)
# #4: Integration tests (depends on #2)
# #5: Frontend (depends on #2)

# Agent 1 starts on #1
prd sync A1 "#1"

# Meanwhile, Agent 2 works on independent task
prd sync A2 "#100"  # Different epic

# Agent 1 completes #1
prd update "#1" completed

# Now #2 is ready
prd ready  # Shows #2

# Agent 1 takes #2
prd sync A1 "#2"

# Agent 1 completes #2
prd update "#2" completed

# Now #3, #4, #5 all ready
prd ready  # Shows #3, #4, #5

# Multiple agents can work in parallel
prd sync A1 "#3"
prd sync A2 "#4"
prd sync A3 "#5"
```

## 🛠️ Development & Contributing

### Building

```bash
cd tools/prd
cargo build --release
cargo test
```

### Running Tests

```bash
cargo test
cargo test --release
```

### Creating Migrations

```bash
# 1. Create SQL file
cat > migrations/004_new_feature.sql <<EOF
ALTER TABLE tasks ADD COLUMN new_field TEXT;
CREATE INDEX idx_new_field ON tasks(new_field);
EOF

# 2. Run migration
prd migrate latest

# 3. Verify
prd migrate status
```

### Technology Stack

- **Rust 2021 Edition**
- **rusqlite** - SQLite database
- **clap** - CLI argument parsing
- **colored** - Terminal colors
- **tabled** - Table formatting
- **dialoguer** - Interactive prompts
- **chrono** - Date/time handling
- **uuid** - Unique identifiers

## 🐛 Troubleshooting

### Common Command Errors

```bash
# ✅ NOW SUPPORTED: --limit flag works!
prd list --status pending --limit 10

# ✅ Shell piping also still works (and won't crash!)
prd list --status pending | head -n 10
prd ready | grep "High"

# ✅ BOTH WORK: Multiple aliases available
prd agent-list          # Official command
prd agents              # Alias
prd list-agents         # Also works

# ❌ WRONG: agent-status requires arguments
prd agent-status

# ✅ CORRECT: Provide agent and status
prd agent-status A1 working --task "#42"
prd agent-status A1 idle

# ✅ NEW: Quick shortcuts
prd complete "#42"                    # Instead of update + agent-status
prd cancel "#42" --reason "Duplicate" # Quick cancel with optional reason
prd next --agent A1 --sync            # Instead of ready + assign + sync
```

### Task Cancellation

```bash
# Cancel unassigned task
prd cancel "#42" --reason "Out of scope"

# Cancel assigned task (automatically frees agent)
prd cancel "#50" --reason "Requirements changed"

# Cancel without reason
prd cancel "#10"

# Alternative: Use update command
prd update "#42" cancelled

# View all cancelled tasks
prd list --status cancelled
```

**Note:** Cancelling a task automatically sets any assigned agent to `idle` status.

### Database Issues

```bash
# Check migration status
prd migrate status

# Re-run migrations
prd migrate latest

# Create fresh database (WARNING: deletes all data)
prd init --force
```

### ID Resolution Errors

```bash
# If "Ambiguous ID" error:
prd show "#42"      # Use full display ID
prd show "task-uuid-here"  # Or use full UUID

# List all tasks to find correct ID
prd list | grep "keyword"
```

### Foreign Key Errors

These were fixed in the migration system. If you encounter them:

```bash
# Recreate database
prd init --force

# Re-import tasks if needed
```

## 📚 Examples

### Example 1: Sprint Planning

```bash
# Create sprint epic
prd create "Sprint 42 - Q4 2025" --epic "Sprint 42"

# Add user stories
prd create "As user, I can login with Google" --epic "Sprint 42" --priority high
prd create "As user, I can reset password" --epic "Sprint 42"
prd create "As admin, I can view analytics" --epic "Sprint 42" --priority high

# View sprint tasks
prd list --epic "Sprint 42"

# Track progress
prd epics
```

### Example 2: Bug Tracking

```bash
# Report bug
prd create "Login fails on Safari" --priority critical --epic "Bugs Q4"

# Add AC for verification
prd ac "#bug-id" add "Bug reproduced"
prd ac "#bug-id" add "Fix implemented"
prd ac "#bug-id" add "Verified on Safari"
prd ac "#bug-id" add "Regression tests added"

# Assign to developer
prd sync dev-agent "#bug-id"
```

### Example 4: Task Cancellation Workflows

```bash
# Cancel duplicate task
prd cancel "#15" --reason "Duplicate of #12"

# Cancel out-of-scope work
prd cancel "#42" --reason "Out of scope for this sprint"

# Cancel blocked task that's no longer needed
prd cancel "#8" --reason "Dependency on deprecated feature"

# Batch cancel related tasks (using update)
prd batch-update "#20,#21,#22" cancelled

# View cancelled tasks
prd list --status cancelled
prd list --status cancelled --json > cancelled_report.json
```

### Example 3: Feature Development

```bash
# Main feature
prd create "Add real-time chat" --priority high --epic "Chat Feature"
# ID: #100

# Breakdown
prd create "WebSocket server" --parent "#100" --priority critical  # #101
prd create "Chat UI component" --parent "#100" --priority high     # #102
prd create "Message persistence" --parent "#100"                   # #103
prd create "Typing indicators" --parent "#100"                     # #104
prd create "Read receipts" --parent "#100" --priority low          # #105

# Set dependencies
prd depends "#102" --on "#101"  # UI needs server
prd depends "#104" --on "#101"  # Typing needs server
prd depends "#105" --on "#103"  # Receipts need persistence

# Check dependency graph
prd depends "#102" --list
prd depends "#104" --list

# Find what can be worked on
prd ready
# Shows #101 and #103 (no dependencies)

# Assign agents
prd sync backend-dev "#101"
prd sync db-dev "#103"
```

## 📖 Command Cheat Sheet

### Quick Command Reference

| Command | Example | Description |
|---------|---------|-------------|
| `init` | `prd init` | Create new database |
| `create` | `prd create "Task" --epic "Epic"` | Create task |
| `list` / `ls` | `prd list --limit 10 --json` | List/filter tasks with pagination |
| `show` | `prd show "#42"` | View details |
| `update` | `prd update "#42" completed` | Change status |
| `complete` | `prd complete "#42"` | Quick complete task |
| `cancel` | `prd cancel "#42" --reason "text"` | Quick cancel task |
| `next` | `prd next --agent A1 --sync` | Get next best task |
| `batch-update` | `prd batch-update "#1,#2,#3" done` | Update multiple tasks |
| `batch-assign` | `prd batch-assign "#1,#2" A1` | Assign multiple tasks |
| `breakdown` | `prd breakdown "#42" --interactive` | Create subtasks |
| `assign` | `prd assign "#42" A1` | Assign to agent |
| `sync` | `prd sync A1 "#42"` | Start work |
| `depends` | `prd depends "#2" --on "#1"` | Add dependency |
| `ready` | `prd ready` | Show available tasks |
| `ac` | `prd ac "#42" add "Test"` | Acceptance criteria |
| `epics` | `prd epics` | List all epics |
| `stats` | `prd stats` | Show statistics |
| `agent-create` | `prd agent-create "name"` | Register agent |
| `agent-list` / `agents` | `prd agents` | List agents |
| `migrate` | `prd migrate latest` | Run migrations |

### Common Query Patterns

**Finding tasks to work on:**
```bash
prd ready                                    # All ready tasks
prd list --no-agent --priority high          # High-priority unassigned
prd next --epic "Auth" --agent A1 --sync     # Auto-assign next in epic
```

**Filtering and searching:**
```bash
prd list --status pending --limit 10         # First 10 pending
prd list --epic "Backend" --agent A1         # Epic + agent filter
prd list --priority critical --json          # JSON output for scripts
```

**Task details and relationships:**
```bash
prd show "#42" --logs                        # Full details with history
prd depends "#42" --list                     # Show dependency tree
prd ac "#42" list                            # Acceptance criteria status
```

**Batch operations:**
```bash
prd batch-update "#1,#2,#3" completed        # Complete multiple tasks
prd batch-assign "#10,#11,#12" backend-dev   # Assign multiple to agent
prd cancel "#5" --reason "Duplicate feature" # Cancel with reason
```

**Reporting:**
```bash
prd stats                                    # Overall statistics
prd epics                                    # Epic progress
prd agent-list                               # Agent activity
prd list --status completed --json > export.json  # Export data
```

## 📄 License

MIT

---

**Pro Tip**: Keep `prd-dashboard` running in a separate terminal while working for real-time progress visualization! 🚀
