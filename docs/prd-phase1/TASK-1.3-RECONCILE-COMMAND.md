# Task 1.3: Reconcile Command - Consistency Checker

**Effort**: 2.5 hours
**Priority**: P0 (Critical)
**Status**: Waiting for Tasks 1.1 and 1.2
**Dependencies**: Task 1.1 (Document Scanner), Task 1.2 (Sync Command)

---

## Objective

Implement `prd reconcile` command to detect and fix inconsistencies between filesystem documentation and database state. This ensures the database remains accurate and the single source of truth.

---

## Background

Over time, the filesystem and database can drift out of sync due to:
- Manual operations
- Failed syncs
- External changes
- Agent crashes

The reconcile command acts as a "health check" that:
1. Detects inconsistencies
2. Provides clear recommendations
3. Optionally fixes issues automatically

---

## Acceptance Criteria

### Must Have
- [ ] Command: `prd reconcile` (no arguments required)
- [ ] Detects 5 types of inconsistencies:
  1. **Task not marked complete** - Database=pending but completion doc exists
  2. **Task marked but no doc** - Database=completed but no completion doc found
  3. **Agent status mismatch** - Agent=working but no current task assigned
  4. **Task/Agent mismatch** - Task=completed but assigned agent still working
  5. **Dependency mismatch** - Task=blocked but dependencies are complete
- [ ] Shows clear, actionable recommendations for each issue
- [ ] Interactive confirmation: "Apply fixes? [y/N]"
- [ ] Supports `--auto-fix` flag (skip confirmation)
- [ ] Logs all changes to activity log
- [ ] Shows summary: "Fixed X issues"

### Optional Features
- [ ] `--backup` flag: creates database backup before fixes
- [ ] `--type <type>` flag: only check specific inconsistency type
- [ ] JSON output mode for scripting

### Performance
- [ ] Full scan in <2 seconds for 1000 tasks
- [ ] Memory efficient (streaming queries)

---

## Technical Design

### Module Structure

```
tools/prd/src/sync/
├── mod.rs
├── doc_scanner.rs      # From Task 1.1
├── sync_engine.rs      # From Task 1.2
├── reconcile.rs        # NEW - THIS TASK
└── tests/
    ├── scanner_tests.rs
    ├── sync_tests.rs
    └── reconcile_tests.rs  # NEW - THIS TASK
```

### Data Structures

```rust
// File: src/sync/reconcile.rs

use anyhow::Result;
use colored::*;
use std::path::PathBuf;

/// Types of inconsistencies that can be detected
#[derive(Debug, Clone)]
pub enum Inconsistency {
    /// Task is pending in DB but has completion document
    TaskNotMarkedComplete {
        task_id: i32,
        doc_path: PathBuf,
        agent_id: Option<String>,
    },

    /// Task is marked complete in DB but no document exists
    TaskMarkedButNoDoc {
        task_id: i32,
        task_title: String,
        completed_at: String,
    },

    /// Agent status is "working" but no current task assigned
    AgentStatusMismatch {
        agent_id: String,
        agent_name: String,
        status: String,
        last_active: String,
    },

    /// Task is complete but assigned agent still marked as working
    TaskAgentMismatch {
        task_id: i32,
        task_title: String,
        agent_id: String,
        agent_name: String,
    },

    /// Task is blocked but all dependencies are complete
    DependencyMismatch {
        task_id: i32,
        task_title: String,
        blocking_dependencies: Vec<i32>,
    },
}

impl Inconsistency {
    /// Get a human-readable description
    pub fn describe(&self) -> String {
        match self {
            Inconsistency::TaskNotMarkedComplete { task_id, doc_path, .. } => {
                format!(
                    "Task #{}: Database=pending, Docs=exists\n   Location: {}\n   Recommended Action: Mark as complete",
                    task_id,
                    doc_path.display()
                )
            }
            Inconsistency::TaskMarkedButNoDoc { task_id, task_title, .. } => {
                format!(
                    "Task #{}: Database=completed, Docs=missing\n   Title: \"{}\"\n   Recommended Action: Flag for review (docs may be uncommitted)",
                    task_id,
                    task_title
                )
            }
            Inconsistency::AgentStatusMismatch { agent_id, agent_name, last_active, .. } => {
                format!(
                    "Agent {}: Status=working, Task=none\n   Name: {}\n   Last active: {}\n   Recommended Action: Set to idle",
                    agent_id,
                    agent_name,
                    last_active
                )
            }
            Inconsistency::TaskAgentMismatch { task_id, task_title, agent_id, .. } => {
                format!(
                    "Task #{}: Status=completed, Agent=working\n   Title: \"{}\"\n   Agent: {}\n   Recommended Action: Sync agent status",
                    task_id,
                    task_title,
                    agent_id
                )
            }
            Inconsistency::DependencyMismatch { task_id, task_title, blocking_dependencies } => {
                format!(
                    "Task #{}: Status=blocked, Dependencies=complete\n   Title: \"{}\"\n   Was blocked by: {:?}\n   Recommended Action: Unblock task",
                    task_id,
                    task_title,
                    blocking_dependencies
                )
            }
        }
    }
}

/// Result of reconciliation
#[derive(Debug)]
pub struct ReconcileResult {
    pub inconsistencies: Vec<Inconsistency>,
    pub fixed_count: usize,
    pub failed: Vec<String>,
}
```

### Core Implementation

```rust
// File: src/sync/reconcile.rs (continued)

use crate::db::Database;
use crate::sync::doc_scanner::scan_completion_docs;

/// Reconcile database with filesystem
///
/// # Arguments
/// * `db` - Database connection
/// * `docs_dir` - Path to docs/tasks/
/// * `auto_fix` - If true, apply fixes without confirmation
///
/// # Returns
/// * `Ok(ReconcileResult)` - Summary of reconciliation
pub fn reconcile(
    db: &Database,
    docs_dir: &Path,
    auto_fix: bool,
) -> Result<ReconcileResult> {
    println!("{} Reconciling PRD database with filesystem...\n", "🔍".cyan());

    // 1. Find all inconsistencies
    let inconsistencies = find_all_inconsistencies(db, docs_dir)?;

    if inconsistencies.is_empty() {
        println!("{}", "✓ No inconsistencies found! Database is in sync.".green().bold());
        return Ok(ReconcileResult {
            inconsistencies: vec![],
            fixed_count: 0,
            failed: vec![],
        });
    }

    // 2. Display inconsistencies
    println!("{}: {}\n", "Inconsistencies Found".bold(), inconsistencies.len());

    for (i, issue) in inconsistencies.iter().enumerate() {
        println!("{}. ⚠ {}", i + 1, issue.describe());
        println!();
    }

    println!("{}", "━".repeat(50).dimmed());

    // 3. Ask for confirmation (unless auto-fix)
    let should_fix = if auto_fix {
        println!("\n{} mode enabled\n", "AUTO-FIX".yellow().bold());
        true
    } else {
        use dialoguer::Confirm;
        Confirm::new()
            .with_prompt("Apply fixes?")
            .default(false)
            .interact()?
    };

    if !should_fix {
        println!("{}", "No changes applied.".dimmed());
        return Ok(ReconcileResult {
            inconsistencies,
            fixed_count: 0,
            failed: vec![],
        });
    }

    // 4. Apply fixes
    println!("\n{}\n", "Applying fixes...".cyan());

    let mut fixed_count = 0;
    let mut failed = Vec::new();

    for issue in &inconsistencies {
        match apply_fix(db, issue) {
            Ok(_) => {
                fixed_count += 1;
                println!("✓ {}", get_fix_description(issue).green());
            }
            Err(e) => {
                failed.push(format!("{}: {}", get_fix_description(issue), e));
                println!("❌ {}: {}", get_fix_description(issue).red(), e.to_string().dimmed());
            }
        }
    }

    // 5. Summary
    println!("\n{} applied successfully.", format!("{} fixes", fixed_count).green().bold());

    if !failed.is_empty() {
        println!("\n{} failed:", format!("{} fixes", failed.len()).red());
        for fail in &failed {
            println!("  {}", fail.dimmed());
        }
    }

    Ok(ReconcileResult {
        inconsistencies,
        fixed_count,
        failed,
    })
}

/// Find all inconsistencies
fn find_all_inconsistencies(db: &Database, docs_dir: &Path) -> Result<Vec<Inconsistency>> {
    let mut issues = Vec::new();

    // Check 1: Tasks with docs but not marked complete
    issues.extend(check_tasks_not_marked_complete(db, docs_dir)?);

    // Check 2: Completed tasks without docs
    issues.extend(check_tasks_without_docs(db, docs_dir)?);

    // Check 3: Agent status mismatches
    issues.extend(check_agent_status_mismatches(db)?);

    // Check 4: Task-Agent mismatches
    issues.extend(check_task_agent_mismatches(db)?);

    // Check 5: Dependency mismatches
    issues.extend(check_dependency_mismatches(db)?);

    Ok(issues)
}

/// Check 1: Tasks with completion docs but not marked complete
fn check_tasks_not_marked_complete(db: &Database, docs_dir: &Path) -> Result<Vec<Inconsistency>> {
    let mut issues = Vec::new();

    // Scan completion documents
    let docs = scan_completion_docs(docs_dir)?;

    for doc in docs {
        // Check if task is complete in database
        let status: Result<String, _> = db.get_connection().query_row(
            "SELECT status FROM tasks WHERE display_id = ?1",
            [doc.task_id],
            |row| row.get(0)
        );

        match status {
            Ok(status_str) if status_str != "completed" => {
                issues.push(Inconsistency::TaskNotMarkedComplete {
                    task_id: doc.task_id,
                    doc_path: doc.file_path,
                    agent_id: doc.agent_id,
                });
            }
            _ => {}
        }
    }

    Ok(issues)
}

/// Check 2: Completed tasks without docs
fn check_tasks_without_docs(db: &Database, docs_dir: &Path) -> Result<Vec<Inconsistency>> {
    let mut issues = Vec::new();

    // Get all completed tasks from database
    let completed_tasks = db.get_connection().prepare(
        "SELECT display_id, title, completed_at FROM tasks WHERE status = 'completed'"
    )?;

    let mut rows = completed_tasks.query([])?;

    while let Some(row) = rows.next()? {
        let task_id: i32 = row.get(0)?;
        let title: String = row.get(1)?;
        let completed_at: String = row.get(2)?;

        // Check if completion doc exists
        let expected_paths = vec![
            docs_dir.join(format!("TASK-{:03}-COMPLETION.md", task_id)),
            // Also check for any TASK-{ID}-*.md pattern
        ];

        let doc_exists = expected_paths.iter().any(|p| p.exists()) ||
            docs_dir.read_dir()
                .ok()
                .and_then(|entries| {
                    entries.filter_map(|e| e.ok())
                        .any(|e| {
                            e.file_name()
                                .to_str()
                                .map(|s| s.starts_with(&format!("TASK-{:03}-", task_id)))
                                .unwrap_or(false)
                        })
                        .then_some(())
                })
                .is_some();

        if !doc_exists {
            issues.push(Inconsistency::TaskMarkedButNoDoc {
                task_id,
                task_title: title,
                completed_at,
            });
        }
    }

    Ok(issues)
}

/// Check 3: Agent status mismatches
fn check_agent_status_mismatches(db: &Database) -> Result<Vec<Inconsistency>> {
    let mut issues = Vec::new();

    // Find agents marked as "working" with no current task
    let mut stmt = db.get_connection().prepare(
        "SELECT id, name, status, current_task_id, last_active
         FROM agents
         WHERE status = 'working' AND current_task_id IS NULL"
    )?;

    let mut rows = stmt.query([])?;

    while let Some(row) = rows.next()? {
        let agent_uuid: String = row.get(0)?;
        let name: String = row.get(1)?;
        let status: String = row.get(2)?;
        let last_active: String = row.get(4)?;

        // Get display_id
        let agent_id = crate::resolver::format_agent_id(db.get_connection(), &agent_uuid);

        issues.push(Inconsistency::AgentStatusMismatch {
            agent_id,
            agent_name: name,
            status,
            last_active,
        });
    }

    Ok(issues)
}

/// Check 4: Task-Agent mismatches
fn check_task_agent_mismatches(db: &Database) -> Result<Vec<Inconsistency>> {
    let mut issues = Vec::new();

    // Find completed tasks with agents still marked as working
    let mut stmt = db.get_connection().prepare(
        "SELECT t.display_id, t.title, a.id, a.name
         FROM tasks t
         JOIN agents a ON t.assigned_agent = a.id
         WHERE t.status = 'completed' AND a.status = 'working'"
    )?;

    let mut rows = stmt.query([])?;

    while let Some(row) = rows.next()? {
        let task_id: i32 = row.get(0)?;
        let task_title: String = row.get(1)?;
        let agent_uuid: String = row.get(2)?;
        let agent_name: String = row.get(3)?;

        let agent_id = crate::resolver::format_agent_id(db.get_connection(), &agent_uuid);

        issues.push(Inconsistency::TaskAgentMismatch {
            task_id,
            task_title,
            agent_id,
            agent_name,
        });
    }

    Ok(issues)
}

/// Check 5: Dependency mismatches
fn check_dependency_mismatches(db: &Database) -> Result<Vec<Inconsistency>> {
    let mut issues = Vec::new();

    // Find blocked tasks whose dependencies are complete
    let blocked_tasks = db.list_tasks(Some(crate::db::TaskStatus::Blocked))?;

    for task in blocked_tasks {
        if let Some(display_id) = task.display_id {
            // Get dependencies
            let deps = db.get_connection().get_dependencies(display_id)?;

            // Check if all dependencies are complete
            let all_complete = deps.iter().all(|dep_id| {
                db.get_connection().query_row(
                    "SELECT status FROM tasks WHERE display_id = ?1",
                    [dep_id],
                    |row| row.get::<_, String>(0)
                ).map(|s| s == "completed").unwrap_or(false)
            });

            if all_complete && !deps.is_empty() {
                issues.push(Inconsistency::DependencyMismatch {
                    task_id: display_id,
                    task_title: task.title.clone(),
                    blocking_dependencies: deps,
                });
            }
        }
    }

    Ok(issues)
}

/// Apply a single fix
fn apply_fix(db: &Database, issue: &Inconsistency) -> Result<()> {
    match issue {
        Inconsistency::TaskNotMarkedComplete { task_id, agent_id, .. } => {
            // Mark task complete
            let task_uuid = crate::resolver::resolve_task_id(
                db.get_connection(),
                &task_id.to_string()
            )?;

            db.update_task_status(
                &task_uuid,
                crate::db::TaskStatus::Completed,
                agent_id.as_deref()
            )?;
        }

        Inconsistency::TaskMarkedButNoDoc { task_id, .. } => {
            // Just log - can't auto-fix missing documentation
            // User should review and either create doc or mark as incomplete
            eprintln!("Note: Task #{} marked complete but no doc found. Consider reviewing.", task_id);
        }

        Inconsistency::AgentStatusMismatch { agent_id, .. } => {
            // Set agent to idle
            let agent_uuid = crate::resolver::resolve_agent_id(
                db.get_connection(),
                agent_id
            )?;

            db.update_agent_status(
                &agent_uuid,
                crate::db::AgentStatus::Idle,
                None
            )?;
        }

        Inconsistency::TaskAgentMismatch { agent_id, .. } => {
            // Set agent to idle
            let agent_uuid = crate::resolver::resolve_agent_id(
                db.get_connection(),
                agent_id
            )?;

            db.update_agent_status(
                &agent_uuid,
                crate::db::AgentStatus::Idle,
                None
            )?;
        }

        Inconsistency::DependencyMismatch { task_id, .. } => {
            // Unblock task (set to pending)
            let task_uuid = crate::resolver::resolve_task_id(
                db.get_connection(),
                &task_id.to_string()
            )?;

            db.update_task_status(
                &task_uuid,
                crate::db::TaskStatus::Pending,
                None
            )?;
        }
    }

    Ok(())
}

/// Get human-readable description of fix
fn get_fix_description(issue: &Inconsistency) -> String {
    match issue {
        Inconsistency::TaskNotMarkedComplete { task_id, .. } => {
            format!("Marked task #{} as complete", task_id)
        }
        Inconsistency::TaskMarkedButNoDoc { task_id, .. } => {
            format!("Flagged task #{} for review", task_id)
        }
        Inconsistency::AgentStatusMismatch { agent_id, .. } => {
            format!("Set agent {} to idle", agent_id)
        }
        Inconsistency::TaskAgentMismatch { agent_id, .. } => {
            format!("Synced agent {} status", agent_id)
        }
        Inconsistency::DependencyMismatch { task_id, .. } => {
            format!("Unblocked task #{}", task_id)
        }
    }
}
```

### CLI Integration

```rust
// Update src/main.rs

Commands::Reconcile {
    /// Apply fixes without confirmation
    #[arg(long)]
    auto_fix: bool,

    /// Custom docs directory
    #[arg(short, long, default_value = "docs/tasks")]
    docs_dir: PathBuf,

    /// Create backup before applying fixes
    #[arg(long)]
    backup: bool,
}

// In match block
Commands::Reconcile { auto_fix, docs_dir, backup } => {
    if backup {
        // Create backup
        let backup_path = format!("tools/prd.db.backup.{}", chrono::Utc::now().timestamp());
        std::fs::copy("tools/prd.db", &backup_path)?;
        println!("{} Created backup: {}", "✓".green(), backup_path.dimmed());
    }

    let result = sync::reconcile(&db, &docs_dir, auto_fix)?;

    if result.fixed_count == 0 && result.inconsistencies.is_empty() {
        println!("{}", "Database is healthy!".green().bold());
    }
}
```

---

## Testing

```rust
// File: src/sync/tests/reconcile_tests.rs

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::{tempdir, NamedTempFile};

    #[test]
    fn test_detect_task_not_marked_complete() {
        // Setup
        let temp_db = NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        // Create pending task
        db.create_task("Test".to_string(), None, Priority::Medium, None, None).unwrap();

        // Create completion doc
        let temp_docs = tempdir().unwrap();
        std::fs::write(
            temp_docs.path().join("TASK-001-COMPLETION.md"),
            "# Done"
        ).unwrap();

        // Run reconcile
        let result = reconcile(&db, temp_docs.path(), false).unwrap();

        // Verify detected
        assert_eq!(result.inconsistencies.len(), 1);
        match &result.inconsistencies[0] {
            Inconsistency::TaskNotMarkedComplete { task_id, .. } => {
                assert_eq!(*task_id, 1);
            }
            _ => panic!("Wrong inconsistency type"),
        }
    }

    #[test]
    fn test_detect_task_without_doc() {
        let temp_db = NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        // Create and complete task
        let task = db.create_task("Test".to_string(), None, Priority::Medium, None, None).unwrap();
        db.update_task_status(&task.id, TaskStatus::Completed, None).unwrap();

        // No completion doc created
        let temp_docs = tempdir().unwrap();

        // Run reconcile
        let result = reconcile(&db, temp_docs.path(), false).unwrap();

        // Verify detected
        assert_eq!(result.inconsistencies.len(), 1);
        match &result.inconsistencies[0] {
            Inconsistency::TaskMarkedButNoDoc { task_id, .. } => {
                assert_eq!(*task_id, 1);
            }
            _ => panic!("Wrong inconsistency type"),
        }
    }

    #[test]
    fn test_detect_agent_status_mismatch() {
        let temp_db = NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        // Create agent marked as working with no task
        let agent = db.create_agent("TestAgent".to_string()).unwrap();
        db.update_agent_status(&agent.id, AgentStatus::Working, None).unwrap();

        let temp_docs = tempdir().unwrap();

        // Run reconcile
        let result = reconcile(&db, temp_docs.path(), false).unwrap();

        // Verify detected
        assert!(result.inconsistencies.iter().any(|i| {
            matches!(i, Inconsistency::AgentStatusMismatch { .. })
        }));
    }

    #[test]
    fn test_auto_fix_applies_changes() {
        let temp_db = NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        db.create_task("Test".to_string(), None, Priority::Medium, None, None).unwrap();

        let temp_docs = tempdir().unwrap();
        std::fs::write(
            temp_docs.path().join("TASK-001-COMPLETION.md"),
            "# Done"
        ).unwrap();

        // Run reconcile with auto_fix = true
        let result = reconcile(&db, temp_docs.path(), true).unwrap();

        // Verify fix applied
        assert_eq!(result.fixed_count, 1);

        // Verify task now complete
        let task = db.get_task_by_display_id(1).unwrap().unwrap();
        assert_eq!(task.status, TaskStatus::Completed);
    }
}
```

---

## Manual Testing

```bash
# 1. Create test scenario
cd /Users/captaindev404/Code/club-med/gentil-feedback
./tools/prd/target/release/prd create "Test task 1"
./tools/prd/target/release/prd create "Test task 2"

# 2. Create completion doc but don't mark complete
echo "# Task 1 Complete" > docs/tasks/TASK-001-COMPLETION.md

# 3. Mark task 2 complete without creating doc
./tools/prd/target/release/prd complete 2

# 4. Run reconcile
./tools/prd/target/release/prd reconcile

# Expected output:
# Inconsistencies Found: 2
# 1. ⚠ Task #1: Database=pending, Docs=exists
# 2. ⚠ Task #2: Database=completed, Docs=missing

# 5. Test auto-fix
./tools/prd/target/release/prd reconcile --auto-fix

# 6. Verify fixes
./tools/prd/target/release/prd show 1
# Should show: Status: ● Completed
```

---

## Success Criteria

Task 1.3 is complete when:
- ✅ Detects all 5 inconsistency types
- ✅ Interactive confirmation works
- ✅ Auto-fix mode applies changes
- ✅ All unit tests pass
- ✅ Clear, actionable recommendations shown
- ✅ Performance <2s for 1000 tasks
- ✅ Backup option works (if implemented)
- ✅ Manual testing successful

---

## Handoff

After Task 1.3, Phase 1 is complete!

Next steps:
1. Integration testing of all Phase 1 features
2. Documentation update
3. Release Phase 1
4. Begin Phase 2 (Real-time Progress Tracking)
