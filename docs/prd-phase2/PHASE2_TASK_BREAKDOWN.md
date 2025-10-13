# PRD Tool Phase 2 - Task Breakdown

**Phase**: Real-time Progress Tracking
**Priority**: P0 (Critical)
**Total Effort**: 12 hours
**Dependencies**: Phase 1 Complete ✅
**Goal**: Enable real-time visibility into agent work

---

## Overview

Phase 2 transforms the PRD tool from static snapshots to real-time monitoring with live dashboards, progress updates, and desktop notifications.

### Success Metrics
- Time to detect completion: 30+ min → <5 sec (99.7% reduction)
- Agent visibility: Static → Real-time
- Issue detection: Hours → Seconds

---

## Task 2.1: Live Progress Dashboard (6 hours)

### Overview
**Command**: `prd watch`
**Description**: Real-time terminal dashboard showing agent progress, task status, metrics
**Priority**: P0 (Critical foundation for real-time visibility)

### Technical Approach
**Technology**: Use `ratatui` (modern TUI framework, successor to tui-rs)
- Better performance than tui-rs
- Active maintenance
- Modern Rust patterns

### Key Features
1. Auto-refreshing display (every 2 seconds)
2. Color-coded agent status
3. Progress bars for active work
4. Recent activity log
5. Overall project metrics
6. Keyboard shortcuts (q=quit, r=refresh, s=sync)

### Implementation Structure
```
src/dashboard/
├── mod.rs              # Module exports
├── ui.rs               # Dashboard UI rendering
├── state.rs            # Dashboard state management
└── tests/
    └── dashboard_tests.rs
```

### Database Schema (Phase 1 already added progress tracking)
```sql
-- Already exists from Phase 1, just need to use it
CREATE TABLE agent_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    task_id INTEGER NOT NULL,
    progress INTEGER CHECK(progress >= 0 AND progress <= 100),
    message TEXT,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);
```

### Acceptance Criteria
- ✅ Renders in 80x24 terminal
- ✅ Updates every 2 seconds
- ✅ Shows 50+ agents without slowdown
- ✅ Color-coded status (idle/working/complete/error)
- ✅ Progress bars render correctly
- ✅ Keyboard controls work
- ✅ Graceful error handling

---

## Task 2.2: Agent Progress API (4 hours)

### Overview
**Command**: `prd report-progress`
**Description**: Allow agents to report progress that appears in dashboard
**Priority**: P0 (Required for dashboard to show real data)

### Technical Approach
**Method**: SQLite-based progress tracking (simple, reliable, no extra services)

### Key Features
1. Simple CLI command for reporting
2. Database-backed storage
3. Auto-cleanup of old records (>7 days)
4. Concurrent update support
5. Progress validation (0-100 range)

### Implementation
```rust
// New command
prd report-progress <agent> <task> <percent> [message]

// Examples:
prd report-progress A12 37 30 "Parsing Zod schemas..."
prd report-progress A12 37 60 "Writing validation..."
prd report-progress A12 37 100 "Complete!"
```

### Database Integration
Already has schema from Phase 1, just need to implement:
1. Insert progress records
2. Query latest progress per agent
3. Cleanup old records

### Acceptance Criteria
- ✅ CLI command works
- ✅ Progress visible in dashboard <1 sec
- ✅ Validates 0-100 range
- ✅ Handles concurrent updates
- ✅ Auto-cleans old data
- ✅ Performance: 100 updates/sec

---

## Task 2.3: Desktop Notifications (2 hours)

### Overview
**Feature**: System notifications for important events
**Description**: Send native desktop notifications for completions, errors, milestones
**Priority**: P1 (Nice to have, enhances experience)

### Technical Approach
**Technology**: `notify-rust` crate (cross-platform notifications)

### Key Features
1. Task completion notifications
2. Agent error notifications
3. Milestone notifications (25%, 50%, 75%, 100%)
4. Configurable (can disable)
5. Rate limiting (max 1/agent/minute)

### Notification Types
```
Complete: "🎉 Task #37 Complete! Agent A12 finished..."
Error:    "⚠️ Agent A15 Error! Task #57 failed..."
Milestone: "🎯 Milestone: 75% Complete! 45/59 tasks..."
```

### Implementation
```rust
// In dashboard watch loop, trigger on events
if task.status == Completed {
    notify_task_complete(&task, &agent);
}
```

### Configuration
```toml
# ~/.prd/config.toml
[notifications]
enabled = true
events = ["complete", "error", "milestone"]
sound = true
min_priority = "medium"
```

### Acceptance Criteria
- ✅ Works on macOS (primary target)
- ✅ Linux and Windows support (bonus)
- ✅ Configurable events
- ✅ Rate limiting works
- ✅ Respects system DND
- ✅ Can be disabled

---

## Implementation Order

**Sequential** (dependencies matter):
1. **Task 2.2** (Progress API) - Foundation (4h)
2. **Task 2.1** (Dashboard) - Uses progress API (6h)
3. **Task 2.3** (Notifications) - Triggered from dashboard (2h)

OR

**Optimized Parallel**:
- Task 2.2 + 2.1 can start together (2.1 can stub progress API initially)
- Task 2.3 after 2.1 completes

**Recommended**: Start 2.2 first (2h), then launch 2.1 and 2.3 in parallel

---

## Dependencies Added

```toml
# Cargo.toml additions
[dependencies]
ratatui = "0.26"       # Modern TUI framework
crossterm = "0.27"     # Terminal control
notify-rust = "4.10"   # Desktop notifications

# Development
tempfile = "3.8"       # For testing
```

---

## Testing Strategy

### Task 2.1 Tests
- Dashboard rendering
- State updates
- Keyboard input handling
- Error scenarios (no database, etc.)

### Task 2.2 Tests
- Progress insertion
- Progress queries
- Validation (0-100 range)
- Cleanup old records

### Task 2.3 Tests
- Notification triggering
- Rate limiting
- Configuration loading

### Integration Test
- End-to-end: report progress → appears in dashboard → triggers notification

---

## Phase 2 Complete When

- ✅ `prd watch` dashboard functional
- ✅ `prd report-progress` command works
- ✅ Desktop notifications trigger
- ✅ All tests pass (target: 30+ tests)
- ✅ Performance targets met
- ✅ Documentation updated

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboard refresh | <100ms | Time to re-render |
| Progress update latency | <1sec | Report → Dashboard |
| Notification delivery | <2sec | Event → Notification |
| Memory usage | <50MB | Dashboard running |
| CPU usage (idle) | <1% | Dashboard monitoring |

**Phase 2 delivers**: Real-time visibility eliminating 99.7% of detection time
