# PRD Tools - Task Management System

## Overview
Rust-based CLI tool for managing development tasks, agent coordination, and project progress tracking. Located in `tools/prd/`.

**IMPORTANT**: Always use PRD Skills as the primary interface. Only use direct Bash commands when a skill is unavailable.

## Available PRD Skills
- **prd-task-management**: Create, view, update, and manage tasks
- **prd-project-overview**: View project statistics, epic progress, and summaries
- **prd-agent-management**: Create and manage development agents
- **prd-dependencies**: Manage task dependencies and blockers
- **prd-database-management**: Initialize and manage the database
- **prd-automation**: Automate task management with git integration, documentation sync, file watching, and hooks

## Key Features
- **Human-Readable IDs**: Use `#42` for tasks and `A1` for agents instead of UUIDs
- **Epic Grouping**: Organize related tasks into epics
- **Task Dependencies**: Define task ordering with circular dependency detection
- **Acceptance Criteria**: Track "definition of done" with checklists
- **Agent Management**: Coordinate work across multiple agents
- **Progress Tracking**: Monitor estimated vs actual time, completion rates

## Installation & Setup
```bash
cd tools/prd
cargo build --release
./target/release/prd --database tools/prd.db init
```

## Task Statuses
- `pending`, `in_progress`, `blocked`, `review`, `completed`, `cancelled`

## Priority Levels
- `low`, `medium` (default), `high`, `critical`

## Database Location
`tools/prd.db` in project root

## Integration
- Use PRD Skills first for all operations
- Track feature implementation tasks
- Link tasks to git commits
- Monitor epic progress for releases

For complete documentation, see `tools/prd/README.md` and `tools/prd/QUICKSTART.md`.
