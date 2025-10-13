# PRD Tool Phase 1 - Task Breakdown

**Phase**: Critical Sync Features
**Priority**: P0 (Critical)
**Total Effort**: 9 hours
**Goal**: Eliminate 90% of manual synchronization work

---

## Overview

Phase 1 focuses on implementing automated synchronization features that will drastically reduce manual overhead when agents complete tasks. The current workflow requires ~30 minutes per sprint of manual `prd complete` commands. After Phase 1, this will be reduced to ~3 minutes.

### Current State Analysis

**Existing Commands**:
- ✅ `prd create`, `prd list`, `prd show` (CRUD operations working)
- ✅ `prd complete <task_id> <agent_id>` (manual completion)
- ✅ `prd sync <agent> <task>` (marks task in-progress)
- ✅ `prd agent-create`, `prd agent-list` (agent management)

**Pain Points**:
- 20+ tasks completed = 20+ manual `prd complete` commands
- No way to bulk-mark tasks complete
- No auto-detection of completion documents in `docs/tasks/`
- Database and filesystem get out of sync

---

## Task Breakdown

### Task 1.1: Document Scanner Implementation
**Effort**: 2 hours
**Priority**: P0 (Critical - foundation for other tasks)
**Dependencies**: None

#### Description
Implement filesystem scanning logic to discover and parse completion documents from the `docs/tasks/` directory. This forms the foundation for auto-sync functionality.

#### Acceptance Criteria
- [ ] Scans `docs/tasks/` directory for files matching pattern `TASK-*-COMPLETION.md`
- [ ] Extracts task ID from filename (e.g., `TASK-033-COMPLETION.md` → 33)
- [ ] Parses optional YAML frontmatter for metadata:
  - `task_id`: Integer
  - `agent_id`: String (optional)
  - `completed_at`: ISO 8601 timestamp (optional)
- [ ] Falls back to file modified time if no frontmatter
- [ ] Handles malformed filenames gracefully
- [ ] Returns structured `CompletionDoc` objects
- [ ] Performance: Scans 100 documents in <500ms

#### Implementation Notes
```rust
// New file: src/sync/doc_scanner.rs

pub struct CompletionDoc {
    pub task_id: i32,
    pub agent_id: Option<String>,
    pub completed_at: DateTime<Utc>,
    pub file_path: PathBuf,
}

pub fn scan_completion_docs(docs_dir: &Path) -> Result<Vec<CompletionDoc>>
```

#### Testing
- Unit tests for filename parsing
- Tests for frontmatter extraction
- Error handling tests (missing files, invalid formats)
- Performance benchmark with 100+ files

#### Files to Create/Modify
- `tools/prd/src/sync/mod.rs` (new module)
- `tools/prd/src/sync/doc_scanner.rs` (new)
- `tools/prd/src/sync/tests/scanner_tests.rs` (new)
- `tools/prd/Cargo.toml` (add `glob = "0.3"`, `regex = "1.10"`)

---

### Task 1.2: Sync Command - Auto-completion from Docs
**Effort**: 3 hours
**Priority**: P0 (Critical)
**Dependencies**: Task 1.1

#### Description
Implement `prd sync` command that automatically detects completion documents and marks tasks complete in the database. This is the primary feature for eliminating manual work.

#### Acceptance Criteria
- [ ] Command: `prd sync` (no arguments)
- [ ] Scans `docs/tasks/` for completion documents
- [ ] For each document:
  - [ ] Checks if task exists in database
  - [ ] Skips if already marked complete
  - [ ] Updates task status to `completed`
  - [ ] Sets `completion_doc_path` field
  - [ ] Updates `updated_at` timestamp
  - [ ] Sets agent to `idle` if agent_id provided
- [ ] Shows progress: "✓ Found TASK-033-COMPLETION.md → Marking #33 complete"
- [ ] Shows summary: "Synced X tasks, skipped Y, failed Z"
- [ ] Supports `--dry-run` flag (preview without applying)
- [ ] Atomic operation: rollback on error
- [ ] Performance: <1 second for 100 documents

#### CLI Output Example
```
🔍 Scanning docs/tasks/ for completion documents...
✓ Found TASK-033-COMPLETION.md → Marking #33 complete (agent A11)
✓ Found TASK-050-COMPLETION.md → Marking #50 complete (agent A14)
⚠ Skipped TASK-060-COMPLETION.md (already marked complete)

Summary:
  Newly completed: 18 tasks
  Already synced: 2 tasks
  Errors: 0
  Time: 0.3s
```

#### Implementation Notes
```rust
// Update file: src/main.rs - Add to Commands enum

Commands::Sync {
    #[arg(long)]
    dry_run: bool,
}

// New function in src/sync/sync_engine.rs
pub fn sync_tasks_from_docs(
    db: &Database,
    docs_dir: &Path,
    dry_run: bool
) -> Result<SyncResult>
```

#### Database Schema Addition
```sql
-- Add to migrations
ALTER TABLE tasks ADD COLUMN completion_doc_path TEXT;
ALTER TABLE tasks ADD COLUMN auto_completed BOOLEAN DEFAULT FALSE;
```

#### Testing
- Integration test: create doc, run sync, verify DB updated
- Dry-run test: ensure no DB changes
- Idempotency test: run sync twice, verify second run skips
- Error handling: malformed docs, missing tasks

#### Files to Create/Modify
- `tools/prd/src/sync/sync_engine.rs` (new)
- `tools/prd/src/main.rs` (add Sync command)
- `tools/prd/src/db.rs` (add `completion_doc_path` field)
- `tools/prd/src/migrations/003_add_completion_fields.sql` (new)
- `tools/prd/src/sync/tests/sync_tests.rs` (new)

---

### Task 1.3: Reconcile Command - Consistency Checker
**Effort**: 2.5 hours
**Priority**: P0 (Critical)
**Dependencies**: Task 1.1, Task 1.2

#### Description
Implement `prd reconcile` command to detect and fix inconsistencies between filesystem documentation and database state. This ensures the database remains the source of truth.

#### Acceptance Criteria
- [ ] Command: `prd reconcile` (no arguments)
- [ ] Detects 5 types of inconsistencies:
  1. Task marked pending but completion doc exists
  2. Task marked completed but no completion doc
  3. Agent status = working but no current task
  4. Task completed but agent still marked as working
  5. Task blocked but dependencies are complete
- [ ] Shows clear, actionable recommendations for each issue
- [ ] Interactive confirmation: "Apply fixes? [y/N]"
- [ ] Supports `--auto-fix` flag (skip confirmation)
- [ ] Creates backup before applying fixes (optional with `--backup`)
- [ ] Logs all changes to activity log
- [ ] Shows summary: "Fixed X issues"

#### CLI Output Example
```
🔍 Reconciling PRD database with filesystem...

Inconsistencies Found: 3

1. ⚠ Task #33: Database=pending, Docs=exists
   Location: docs/tasks/TASK-033-COMPLETION.md
   Recommended Action: Mark as complete

2. ⚠ Agent A11: Status=working, Task=none
   Last active: 2025-10-13 08:30
   Recommended Action: Set to idle

3. ⚠ Task #65: Depends on #60, but #60 not complete
   Recommended Action: Update dependency status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply fixes? [y/N]: y

Applying fixes...
✓ Fixed task #33 (marked complete)
✓ Set agent A11 to idle
✓ Updated dependency status for task #65

3 fixes applied successfully.
```

#### Implementation Notes
```rust
// New file: src/sync/reconcile.rs

pub enum Inconsistency {
    TaskNotMarkedComplete { task_id: i32, doc_path: PathBuf },
    TaskMarkedButNoDoc { task_id: i32 },
    AgentStatusMismatch { agent_id: String, expected: String, actual: String },
    DependencyMismatch { task_id: i32, depends_on: i32 },
}

pub fn find_inconsistencies(db: &Database) -> Result<Vec<Inconsistency>>
pub fn fix_inconsistency(db: &Database, issue: &Inconsistency) -> Result<()>
```

#### Testing
- Test each inconsistency type detection
- Test fix application
- Test interactive confirmation
- Test auto-fix mode
- Test backup creation (if implemented)

#### Files to Create/Modify
- `tools/prd/src/sync/reconcile.rs` (new)
- `tools/prd/src/main.rs` (add Reconcile command)
- `tools/prd/src/sync/tests/reconcile_tests.rs` (new)

---

### Task 1.4: Batch Completion - Bulk Operations
**Effort**: 1.5 hours
**Priority**: P0 (High)
**Dependencies**: None (independent of sync features)

#### Description
Implement `prd complete-batch` command to mark multiple tasks complete at once, supporting CLI arguments, JSON, and CSV input formats.

#### Acceptance Criteria
- [ ] Command: `prd complete-batch`
- [ ] Three input modes:
  1. CLI arguments: `--tasks 33,34,35 --agent-map "33:A11,34:A11,35:A12"`
  2. JSON file: `--from-file completions.json`
  3. CSV file: `--from-csv completions.csv`
- [ ] Validates all inputs before applying (fail-fast)
- [ ] Atomic transaction: all tasks complete or none
- [ ] Shows progress for large batches (>10 tasks)
- [ ] Updates agent status to idle for each task
- [ ] Reports errors clearly per task
- [ ] Performance: 100 tasks in <3 seconds

#### CLI Examples
```bash
# Option 1: CLI arguments
prd complete-batch --tasks 33,34,35 --agent-map "33:A11,34:A11,35:A12"

# Option 2: JSON file
prd complete-batch --from-file completions.json

# Option 3: CSV file
prd complete-batch --from-csv completions.csv
```

#### Input Format Examples

**JSON** (`completions.json`):
```json
[
  {
    "task": 33,
    "agent": "A11",
    "timestamp": "2025-10-13T10:30:00Z"
  },
  {
    "task": 34,
    "agent": "A11",
    "timestamp": "2025-10-13T11:00:00Z"
  }
]
```

**CSV** (`completions.csv`):
```csv
task_id,agent_id,timestamp
33,A11,2025-10-13T10:30:00Z
34,A11,2025-10-13T11:00:00Z
```

#### Implementation Notes
```rust
// Update src/main.rs

Commands::CompleteBatch {
    #[arg(long, conflicts_with_all = ["from_file", "from_csv"])]
    tasks: Option<String>,

    #[arg(long)]
    agent_map: Option<String>,

    #[arg(long, conflicts_with = "from_csv")]
    from_file: Option<PathBuf>,

    #[arg(long, conflicts_with = "from_file")]
    from_csv: Option<PathBuf>,
}

// New file: src/batch/complete.rs
#[derive(Deserialize)]
struct CompletionRecord {
    task: i32,
    agent: String,
    timestamp: Option<DateTime<Utc>>,
}

pub fn complete_batch(db: &Database, records: Vec<CompletionRecord>) -> Result<()>
```

#### Testing
- Test CLI argument parsing
- Test JSON file input
- Test CSV file input
- Test validation (invalid task IDs, missing agents)
- Test transaction rollback on error
- Test large batch (100+ tasks)

#### Files to Create/Modify
- `tools/prd/src/batch/mod.rs` (new module)
- `tools/prd/src/batch/complete.rs` (new)
- `tools/prd/src/main.rs` (add CompleteBatch command)
- `tools/prd/Cargo.toml` (add `csv = "1.3"`)
- `tools/prd/src/batch/tests/complete_tests.rs` (new)

---

## Implementation Order

**Recommended sequential order**:
1. **Task 1.1** (Document Scanner) - Foundation
2. **Task 1.2** (Sync Command) - Core feature, depends on 1.1
3. **Task 1.4** (Batch Completion) - Independent, can run parallel
4. **Task 1.3** (Reconcile) - Builds on 1.1 and 1.2

**Parallel execution (optional)**:
- Tasks 1.1 + 1.4 can run in parallel (independent)
- Task 1.3 requires 1.1 and 1.2 to be complete

---

## Testing Strategy

### Unit Tests
Each task should have comprehensive unit tests covering:
- Core functionality
- Edge cases (empty inputs, malformed data)
- Error handling
- Performance benchmarks

### Integration Tests
After all tasks complete, create end-to-end tests:
```rust
// tests/phase1_integration_test.rs

#[test]
fn test_sync_workflow() {
    // 1. Create database
    // 2. Create sample tasks
    // 3. Create completion docs
    // 4. Run prd sync
    // 5. Verify database updated
    // 6. Run prd reconcile
    // 7. Verify no inconsistencies
}
```

### Performance Benchmarks
Create benchmarks for critical operations:
- Document scanning: 100 files in <500ms
- Sync operation: 100 tasks in <1s
- Batch completion: 100 tasks in <3s

---

## Success Metrics - Phase 1

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Manual sync time | 30 min/sprint | 3 min/sprint | Time to mark 20 tasks complete |
| Sync accuracy | 60% (human error) | 100% (automated) | % of tasks correctly synced |
| Commands required | 20+ | 1 | Number of CLI commands |
| Developer satisfaction | 3/10 | 9/10 | Survey score |

### Phase 1 Acceptance Criteria
- ✅ `prd sync` completes in <1 second for 100 tasks
- ✅ `prd reconcile` detects all 5 inconsistency types
- ✅ `prd complete-batch` handles 100 tasks atomically
- ✅ Zero data corruption in all automated operations
- ✅ Comprehensive error messages for all failure modes
- ✅ Documentation and examples for all new commands

---

## Dependencies & Prerequisites

### Cargo Dependencies to Add
```toml
# Add to Cargo.toml
[dependencies]
glob = "0.3"        # File pattern matching
regex = "1.10"      # Regex parsing
csv = "1.3"         # CSV parsing
toml = "0.8"        # TOML parsing (for frontmatter)
```

### Database Migrations
```sql
-- Migration 003: Add completion tracking fields
ALTER TABLE tasks ADD COLUMN completion_doc_path TEXT;
ALTER TABLE tasks ADD COLUMN auto_completed BOOLEAN DEFAULT FALSE;
```

---

## Documentation Requirements

For each task, create:
1. **Command documentation** in `README.md` or `docs/COMMANDS.md`
2. **Example workflows** showing typical usage
3. **Error reference** listing all error messages and solutions

Example documentation:
```markdown
## prd sync

Automatically detect and mark tasks complete from completion documents.

**Usage:**
```bash
prd sync [--dry-run]
```

**Options:**
- `--dry-run`: Preview changes without applying

**Example:**
```bash
# Scan and sync all completion documents
prd sync

# Preview what would be synced
prd sync --dry-run
```
```

---

## Risk Mitigation

### Risk: Database Corruption
**Mitigation**:
- Use transactions for all write operations
- Test rollback scenarios
- Add integrity checks before sync

### Risk: Performance Degradation
**Mitigation**:
- Benchmark with large datasets (1000+ tasks)
- Add progress indicators for long operations
- Optimize database queries

### Risk: File System Errors
**Mitigation**:
- Handle missing directories gracefully
- Validate file permissions
- Add retry logic for transient errors

---

## Post-Phase 1 Verification

After completing all tasks, verify:
1. ✅ Run `prd sync` on 20+ completion documents
2. ✅ Verify database updated correctly
3. ✅ Run `prd reconcile` - should show 0 inconsistencies
4. ✅ Test `prd complete-batch` with 50 tasks
5. ✅ Check performance benchmarks met
6. ✅ Review error messages for clarity
7. ✅ Update main README with new commands

---

## Next Steps

After Phase 1 completion, move to:
- **Phase 2**: Real-time Progress Tracking (`prd watch`, progress API, notifications)
- **Phase 3**: Agent Integration (file watcher, git integration, hooks)
- **Phase 4**: Enhanced User Experience (better errors, agent suggestions, visual timeline)
