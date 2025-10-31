---
name: prd-agent-management
description: Manage development agents (AI agents or team members) using PRD Tool. Use when creating agents, assigning tasks to agents, syncing agent work, or checking agent status. Supports agent statuses (idle, working, blocked, offline).
allowed-tools: Bash
---

# PRD Agent Management

This skill helps you create and manage agents (AI agents or team members) using the PRD Tool.

## Database Location

**IMPORTANT**: Always run commands from the project root and use the relative database path:
```bash
./tools/prd/target/release/prd --database tools/prd.db
```

## Creating Agents

### Create New Agent
```bash
prd agent-create "agent-name"
```

**Example**:
```bash
prd agent-create "backend-dev"    # Output: ID: A1
prd agent-create "frontend-dev"   # Output: ID: A2
prd agent-create "qa-engineer"    # Output: ID: A3
```

### Add Specializations
```bash
prd agent-specialize A1 backend api database
prd agent-specialize A2 frontend react ui
```

## Viewing Agents

### List All Agents
```bash
prd agent-list
prd agents  # Shorthand
```

### Agent Status
```bash
# View agent status
prd agent-status

# View specific agent
prd show-agent A1
```

## Assigning Work

### Assign Task to Agent
```bash
# Simple assignment
prd assign "#42" A1

# Sync (assign + start work)
prd sync A1 "#42"
```

**Important**: `prd sync` does two things:
1. Sets agent status to `working`
2. Sets task status to `in_progress`
3. Links agent and task together

### Update Agent Status
```bash
# Set agent to working
prd agent-status A1 working --task "#42"

# Set agent to idle
prd agent-status A1 idle

# Set agent to blocked
prd agent-status A1 blocked

# Set agent to offline
prd agent-status A1 offline
```

**Valid Statuses**: `idle`, `working`, `blocked`, `offline`

## Agent Workflows

### Start Work
```bash
# Method 1: Sync (recommended)
prd sync A1 "#42"

# Method 2: Manual
prd assign "#42" A1
prd update "#42" in_progress
prd agent-status A1 working --task "#42"
```

### Complete Work
```bash
# Complete the task
prd complete "#42"

# Agent automatically returns to idle
```

### Get Next Task for Agent
```bash
# Find next task for agent
prd next --agent A1

# Auto-assign and start
prd next --agent A1 --sync

# Filter by priority
prd next --agent A1 --priority high --sync
```

## Agent Task Matching

### Suggest Best Agent for Task
```bash
prd suggest "#42"
```

This uses intelligent matching based on:
- Agent specializations
- Task history and success rate
- Current agent workload
- Task priority

## Batch Operations

### Assign Multiple Tasks
```bash
prd batch-assign "#10,#11,#12" A1
```

## Progress Reporting

### Report Progress
```bash
prd report-progress A1 "#42" 75 "Almost done with testing"
```

**Parameters**:
- Agent ID: `A1`
- Task ID: `#42`
- Progress %: `75`
- Message: `"Almost done with testing"`

## Viewing Agent Work

### List Tasks for Agent
```bash
# All tasks for agent
prd list --agent A1

# Filter by status
prd list --agent A1 --status in_progress
prd list --agent A1 --status completed

# Filter by epic
prd list --agent A1 --epic "Backend"
```

### View Unassigned Tasks
```bash
prd list --no-agent
prd list --no-agent --priority high
```

## Agent ID Format

- Use `A1`, `A2`, etc. in commands
- Display IDs are assigned sequentially starting from A1
- Can also use agent name in some commands

## Examples

### Complete Agent Workflow
```bash
# 1. Create agent
prd agent-create "backend-specialist"
# Output: ID: A1

# 2. Add specializations
prd agent-specialize A1 backend firebase authentication

# 3. Find and assign work
prd next --agent A1 --priority high --sync
# Auto-assigns next high-priority task

# 4. Report progress
prd report-progress A1 "#42" 50 "Completed auth setup"

# 5. Complete task
prd complete "#42"

# Agent automatically returns to idle
```

### Multi-Agent Coordination
```bash
# Create multiple agents
prd agent-create "backend-dev"   # A1
prd agent-create "frontend-dev"  # A2

# Assign different tasks
prd sync A1 "#10"  # Backend work
prd sync A2 "#11"  # Frontend work

# Check agent status
prd agent-list

# View each agent's tasks
prd list --agent A1
prd list --agent A2
```

### Finding Work
```bash
# Show what each agent is working on
prd agent-status

# Find unassigned critical tasks
prd list --no-agent --priority critical

# Get best agent match for task
prd suggest "#42"
```

## Best Practices

1. **Use Sync**: Prefer `prd sync A1 "#42"` over manual assignment
2. **Specialize Agents**: Add specializations to improve task matching
3. **Report Progress**: Use progress reporting for long-running tasks
4. **Track Status**: Keep agent status updated for coordination
5. **Use Smart Matching**: Use `prd suggest` for optimal assignments

## Integration Notes

- Agent work is tracked in activity logs
- Agent metrics are calculated based on completion history
- Specializations improve intelligent task matching
- Agent status affects task suggestions and workload balancing
