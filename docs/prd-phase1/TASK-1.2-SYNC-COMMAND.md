# Task 1.2: Sync Command - Auto-completion from Docs

**Effort**: 3 hours
**Priority**: P0 (Critical)
**Status**: Waiting for Task 1.1
**Dependencies**: Task 1.1 (Document Scanner)

---

## Objective

Implement `prd sync` command that automatically detects completion documents and marks tasks complete in the database. This is the primary feature for eliminating manual synchronization work.

---

## Background

Currently, when agents complete tasks and create completion documents, developers must manually run:
```bash
prd complete 33 A11
prd complete 34 A11
prd complete 35 A11
# ... 20+ times
```

With `prd sync`, this becomes:
```bash
prd sync  # Done! 20 tasks marked complete in 0.3s
```

---

## Acceptance Criteria

### Must Have
- [ ] Command: `prd sync` (no arguments required)
- [ ] Scans `docs/tasks/` using `scan_completion_docs()` from Task 1.1
- [ ] For each completion document:
  - Checks if task exists in database
  - Skips if already marked `completed`
  - Updates task `status` to `completed`
  - Sets `completion_doc_path` field
  - Updates `updated_at` timestamp
  - Sets `completed_at` to doc timestamp
  - Sets assigned agent to `idle` (if agent_id in frontmatter)
- [ ] Provides clear progress output
- [ ] Shows summary statistics
- [ ] Supports `--dry-run` flag (preview without applying)
- [ ] Uses database transactions (all-or-nothing)

### Performance
- [ ] Syncs 100 documents in <1 second
- [ ] Shows progress for operations taking >2 seconds

### Error Handling
- [ ] Missing docs directory → create or warn
- [ ] Task not in database → skip with warning
- [ ] Database error → rollback transaction
- [ ] Invalid task ID in document → skip with error

---

## Technical Design

### Database Schema Changes

Add migration `003_add_completion_fields.sql`:

```sql
-- Migration 003: Add completion tracking fields
-- Timestamp: 2025-10-13

ALTER TABLE tasks ADD COLUMN completion_doc_path TEXT;
ALTER TABLE tasks ADD COLUMN auto_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN git_commit_hash TEXT;  -- For future git integration

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_auto_completed
ON tasks(auto_completed) WHERE auto_completed = TRUE;
```

### Module Structure

```
tools/prd/src/sync/
├── mod.rs
├── doc_scanner.rs      # From Task 1.1
├── sync_engine.rs      # NEW - THIS TASK
└── tests/
    ├── scanner_tests.rs
    └── sync_tests.rs   # NEW - THIS TASK
```

### Core Implementation

```rust
// File: src/sync/sync_engine.rs

use crate::db::Database;
use crate::sync::doc_scanner::{scan_completion_docs, CompletionDoc};
use anyhow::{Result, Context};
use colored::*;
use std::path::Path;

/// Result of a sync operation
#[derive(Debug)]
pub struct SyncResult {
    pub newly_completed: usize,
    pub already_synced: usize,
    pub failed: Vec<SyncError>,
    pub duration_ms: u128,
}

#[derive(Debug)]
pub struct SyncError {
    pub task_id: i32,
    pub error: String,
}

/// Sync tasks from completion documents
///
/// # Arguments
/// * `db` - Database connection
/// * `docs_dir` - Path to docs/tasks/
/// * `dry_run` - If true, preview without applying changes
///
/// # Returns
/// * `Ok(SyncResult)` - Summary of sync operation
/// * `Err(_)` - Fatal error (e.g., database connection lost)
pub fn sync_tasks_from_docs(
    db: &Database,
    docs_dir: &Path,
    dry_run: bool,
) -> Result<SyncResult> {
    let start = std::time::Instant::now();

    // 1. Scan for completion documents
    println!("{} Scanning {} for completion documents...",
        "🔍".cyan(),
        docs_dir.display()
    );

    let docs = scan_completion_docs(docs_dir)
        .context("Failed to scan completion documents")?;

    if docs.is_empty() {
        println!("{}", "No completion documents found.".yellow());
        return Ok(SyncResult {
            newly_completed: 0,
            already_synced: 0,
            failed: Vec::new(),
            duration_ms: start.elapsed().as_millis(),
        });
    }

    println!("Found {} completion document(s)", docs.len());

    if dry_run {
        println!("\n{} {}", "DRY RUN".yellow().bold(), "No changes will be made".dimmed());
    }

    // 2. Process each document
    let mut newly_completed = 0;
    let mut already_synced = 0;
    let mut failed: Vec<SyncError> = Vec::new();

    for doc in docs {
        match process_completion_doc(db, &doc, dry_run) {
            Ok(status) => match status {
                SyncStatus::Completed => {
                    newly_completed += 1;
                    let action = if dry_run { "Would mark" } else { "Marked" };
                    println!("✓ {} task #{} complete ({})",
                        action.green(),
                        doc.task_id,
                        doc.file_path.file_name().unwrap().to_str().unwrap().dimmed()
                    );
                }
                SyncStatus::AlreadySynced => {
                    already_synced += 1;
                    println!("⚠ Skipped task #{} (already marked complete)",
                        doc.task_id.to_string().dimmed()
                    );
                }
            },
            Err(e) => {
                failed.push(SyncError {
                    task_id: doc.task_id,
                    error: e.to_string(),
                });
                println!("❌ Failed to sync task #{}: {}",
                    doc.task_id.to_string().red(),
                    e.to_string().dimmed()
                );
            }
        }
    }

    // 3. Show summary
    println!("\n{}", "━".repeat(50).dimmed());
    println!("\n{}", "Summary:".bold());
    println!("  Newly completed: {}", newly_completed.to_string().green().bold());
    println!("  Already synced: {}", already_synced);
    if !failed.is_empty() {
        println!("  Errors: {}", failed.len().to_string().red());
    }

    let duration_ms = start.elapsed().as_millis();
    println!("  Time: {}s", (duration_ms as f64 / 1000.0));

    Ok(SyncResult {
        newly_completed,
        already_synced,
        failed,
        duration_ms,
    })
}

enum SyncStatus {
    Completed,
    AlreadySynced,
}

/// Process a single completion document
fn process_completion_doc(
    db: &Database,
    doc: &CompletionDoc,
    dry_run: bool,
) -> Result<SyncStatus> {
    // 1. Check if task exists
    let task_result = db.get_connection().query_row(
        "SELECT id, status FROM tasks WHERE display_id = ?1",
        [doc.task_id],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?
            ))
        }
    );

    let (task_uuid, current_status) = match task_result {
        Ok(data) => data,
        Err(_) => {
            return Err(anyhow::anyhow!("Task #{} not found in database", doc.task_id));
        }
    };

    // 2. Skip if already completed
    if current_status == "completed" {
        return Ok(SyncStatus::AlreadySynced);
    }

    // 3. If dry-run, stop here
    if dry_run {
        return Ok(SyncStatus::Completed);
    }

    // 4. Update task in transaction
    let conn = db.get_connection();
    let tx = conn.unchecked_transaction()?;

    // Update task
    tx.execute(
        "UPDATE tasks
         SET status = 'completed',
             completion_doc_path = ?1,
             auto_completed = TRUE,
             completed_at = ?2,
             updated_at = ?2
         WHERE id = ?3",
        rusqlite::params![
            doc.file_path.to_str(),
            doc.completed_at.to_rfc3339(),
            task_uuid
        ]
    )?;

    // Update agent to idle (if provided)
    if let Some(agent_id) = &doc.agent_id {
        // Resolve agent UUID
        if let Ok(agent_uuid) = crate::resolver::resolve_agent_id(&tx, agent_id) {
            tx.execute(
                "UPDATE agents
                 SET status = 'idle',
                     current_task_id = NULL,
                     last_active = ?1
                 WHERE id = ?2",
                rusqlite::params![
                    chrono::Utc::now().to_rfc3339(),
                    agent_uuid
                ]
            )?;
        }
    }

    tx.commit()?;

    Ok(SyncStatus::Completed)
}
```

### CLI Integration

Update `src/main.rs`:

```rust
// Add to Commands enum
#[derive(Subcommand)]
enum Commands {
    // ... existing commands ...

    /// Automatically sync task completions from documentation
    Sync {
        /// Preview changes without applying them
        #[arg(long)]
        dry_run: bool,

        /// Custom docs directory (default: docs/tasks)
        #[arg(short, long, default_value = "docs/tasks")]
        docs_dir: PathBuf,
    },

    // ... other commands ...
}

// Add to match block
match cli.command {
    // ... existing matches ...

    Commands::Sync { dry_run, docs_dir } => {
        let result = sync::sync_tasks_from_docs(&db, &docs_dir, dry_run)?;

        if result.newly_completed == 0 && result.already_synced == 0 {
            println!("{}", "No tasks to sync.".yellow());
        }

        if !result.failed.is_empty() {
            std::process::exit(1);
        }
    }

    // ... other matches ...
}
```

---

## Implementation Steps

### Step 1: Create Database Migration
```bash
cd tools/prd/src/migrations
touch 003_add_completion_fields.sql
```

Add migration SQL (see schema above).

### Step 2: Update Migration Runner
Ensure migration runner loads and applies new migration.

### Step 3: Implement Sync Engine
```bash
touch tools/prd/src/sync/sync_engine.rs
```

Implement functions in order:
1. `process_completion_doc()` - Core sync logic
2. `sync_tasks_from_docs()` - Main entry point

### Step 4: Add CLI Command
Update `src/main.rs` with Sync command.

### Step 5: Write Tests

```rust
// File: src/sync/tests/sync_tests.rs

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_sync_marks_task_complete() {
        // 1. Setup: Create test database
        let temp_db = tempfile::NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        // 2. Create test task
        db.create_task("Test task".to_string(), None, Priority::Medium, None, None).unwrap();

        // 3. Create completion document
        let temp_docs = tempdir().unwrap();
        std::fs::write(
            temp_docs.path().join("TASK-001-COMPLETION.md"),
            "# Task Complete"
        ).unwrap();

        // 4. Run sync
        let result = sync_tasks_from_docs(&db, temp_docs.path(), false).unwrap();

        // 5. Verify
        assert_eq!(result.newly_completed, 1);
        assert_eq!(result.already_synced, 0);
        assert!(result.failed.is_empty());

        // 6. Verify task status in DB
        let task = db.get_task_by_display_id(1).unwrap().unwrap();
        assert_eq!(task.status, TaskStatus::Completed);
        assert!(task.auto_completed);
    }

    #[test]
    fn test_sync_skips_already_completed() {
        // Setup database with completed task
        let temp_db = tempfile::NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        let task = db.create_task("Test".to_string(), None, Priority::Medium, None, None).unwrap();
        db.update_task_status(&task.id, TaskStatus::Completed, None).unwrap();

        // Create completion doc
        let temp_docs = tempdir().unwrap();
        std::fs::write(
            temp_docs.path().join("TASK-001-COMPLETION.md"),
            "# Done"
        ).unwrap();

        // Run sync
        let result = sync_tasks_from_docs(&db, temp_docs.path(), false).unwrap();

        // Verify skipped
        assert_eq!(result.already_synced, 1);
        assert_eq!(result.newly_completed, 0);
    }

    #[test]
    fn test_sync_dry_run_no_changes() {
        let temp_db = tempfile::NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        db.create_task("Test".to_string(), None, Priority::Medium, None, None).unwrap();

        let temp_docs = tempdir().unwrap();
        std::fs::write(
            temp_docs.path().join("TASK-001-COMPLETION.md"),
            "# Done"
        ).unwrap();

        // Run sync with dry_run = true
        let result = sync_tasks_from_docs(&db, temp_docs.path(), true).unwrap();

        // Verify preview worked
        assert_eq!(result.newly_completed, 1);

        // Verify database NOT updated
        let task = db.get_task_by_display_id(1).unwrap().unwrap();
        assert_ne!(task.status, TaskStatus::Completed);
    }

    #[test]
    fn test_sync_handles_missing_task() {
        let temp_db = tempfile::NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        // Create doc for non-existent task
        let temp_docs = tempdir().unwrap();
        std::fs::write(
            temp_docs.path().join("TASK-999-COMPLETION.md"),
            "# Done"
        ).unwrap();

        // Run sync
        let result = sync_tasks_from_docs(&db, temp_docs.path(), false).unwrap();

        // Verify error reported
        assert_eq!(result.failed.len(), 1);
        assert_eq!(result.failed[0].task_id, 999);
    }

    #[test]
    fn test_sync_updates_agent_status() {
        let temp_db = tempfile::NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        // Create task and agent
        let task = db.create_task("Test".to_string(), None, Priority::Medium, None, None).unwrap();
        let agent = db.create_agent("TestAgent".to_string()).unwrap();
        db.assign_task(&task.id, &agent.id).unwrap();

        // Create completion doc with agent_id
        let temp_docs = tempdir().unwrap();
        let content = r#"---
agent_id: A1
---
# Task Complete
"#;
        std::fs::write(
            temp_docs.path().join("TASK-001-COMPLETION.md"),
            content
        ).unwrap();

        // Run sync
        sync_tasks_from_docs(&db, temp_docs.path(), false).unwrap();

        // Verify agent set to idle
        let updated_agent = db.get_agent(&agent.id).unwrap().unwrap();
        assert_eq!(updated_agent.status, AgentStatus::Idle);
        assert!(updated_agent.current_task_id.is_none());
    }
}
```

---

## Manual Testing

```bash
# 1. Setup test environment
cd /Users/captaindev404/Code/club-med/gentil-feedback
mkdir -p docs/tasks

# 2. Create test completion docs
echo "# Task 1 Complete" > docs/tasks/TASK-001-COMPLETION.md
echo "---
agent_id: A1
completed_at: 2025-10-13T10:30:00Z
---
# Task 2 Complete" > docs/tasks/TASK-002-COMPLETION.md

# 3. Build and run migration
cd tools/prd
cargo build
./target/release/prd migrate latest

# 4. Test dry-run
./target/release/prd sync --dry-run
# Should show: "Would mark task #1 complete..."

# 5. Test actual sync
./target/release/prd sync
# Should show: "✓ Marked task #1 complete..."

# 6. Verify idempotency (run again)
./target/release/prd sync
# Should show: "⚠ Skipped task #1 (already marked complete)"

# 7. Check database
./target/release/prd show 1
# Should show: Status: ● Completed
```

---

## Success Criteria

Task 1.2 is complete when:
- ✅ Migration applied successfully
- ✅ `prd sync` command works as specified
- ✅ `prd sync --dry-run` previews without changes
- ✅ All unit tests pass
- ✅ Integration tests pass
- ✅ Manual testing successful
- ✅ Performance <1s for 100 documents
- ✅ Error messages clear and actionable
- ✅ Code documented with examples

---

## Handoff to Next Tasks

After Task 1.2:
- **Task 1.3** (Reconcile) can use `sync_tasks_from_docs()` logic
- **Task 1.4** (Batch) is independent, can proceed in parallel

Provide to next task:
- Database schema with new fields
- `SyncResult` struct for reporting
- Error handling patterns
