# Task 1.4: Batch Completion - Bulk Operations

**Effort**: 1.5 hours
**Priority**: P0 (High)
**Status**: Ready to start
**Dependencies**: None (independent task)

---

## Objective

Implement `prd complete-batch` command to mark multiple tasks complete at once, supporting CLI arguments, JSON, and CSV input formats. This eliminates the need for repetitive `prd complete` commands.

---

## Background

Current workflow to complete 20 tasks:
```bash
prd complete 33 A11
prd complete 34 A11
prd complete 35 A11
# ... repeat 17 more times (30 minutes of manual work)
```

With batch completion:
```bash
prd complete-batch --tasks 33,34,35,36,37 --agent-map "33:A11,34:A11,35:A11"
# Or from file:
prd complete-batch --from-file completions.json
# Or from CSV:
prd complete-batch --from-csv completions.csv
```

---

## Acceptance Criteria

### Must Have
- [ ] Command: `prd complete-batch` with three input modes:
  1. **CLI arguments**: `--tasks <ids> --agent-map <map>`
  2. **JSON file**: `--from-file <path>`
  3. **CSV file**: `--from-csv <path>`
- [ ] Validates all inputs before applying (fail-fast)
- [ ] Atomic transaction: all tasks complete or none
- [ ] Updates task status to `completed`
- [ ] Sets agent status to `idle` for each task
- [ ] Shows clear progress for large batches (>10 tasks)
- [ ] Reports errors clearly per task
- [ ] Supports optional timestamps per task

### Performance
- [ ] 100 tasks in <3 seconds
- [ ] Memory efficient (streaming for large files)

### Error Handling
- [ ] Invalid task IDs → fail with list of invalid IDs
- [ ] Missing agents → create warning or fail
- [ ] Database errors → rollback transaction
- [ ] File parsing errors → clear error message

---

## Technical Design

### Module Structure

```
tools/prd/src/
├── batch/
│   ├── mod.rs              # NEW - Module exports
│   ├── complete.rs         # NEW - Batch completion logic
│   └── tests/
│       └── complete_tests.rs  # NEW - Unit tests
└── main.rs                 # Update with CompleteBatch command
```

### Data Structures

```rust
// File: src/batch/complete.rs

use anyhow::{Result, Context};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use std::path::Path;

/// A single task completion record
#[derive(Debug, Clone, Deserialize)]
pub struct CompletionRecord {
    /// Task ID (integer or "#42" format)
    pub task: String,

    /// Agent ID (e.g., "A11" or agent name)
    pub agent: String,

    /// Optional completion timestamp (defaults to now)
    #[serde(default = "default_timestamp")]
    pub timestamp: DateTime<Utc>,
}

fn default_timestamp() -> DateTime<Utc> {
    Utc::now()
}

/// Result of batch completion
#[derive(Debug)]
pub struct BatchResult {
    pub completed: usize,
    pub failed: Vec<BatchError>,
    pub duration_ms: u128,
}

#[derive(Debug)]
pub struct BatchError {
    pub task_id: String,
    pub agent_id: String,
    pub error: String,
}
```

### Input Parsers

```rust
// File: src/batch/complete.rs (continued)

/// Parse completion records from CLI arguments
///
/// Example:
/// --tasks "33,34,35" --agent-map "33:A11,34:A11,35:A12"
pub fn parse_cli_args(
    tasks: &str,
    agent_map: &str,
) -> Result<Vec<CompletionRecord>> {
    let task_ids: Vec<&str> = tasks.split(',').map(|s| s.trim()).collect();

    // Parse agent map: "33:A11,34:A11,35:A12"
    let mut agent_mapping = std::collections::HashMap::new();
    for pair in agent_map.split(',') {
        let parts: Vec<&str> = pair.split(':').collect();
        if parts.len() != 2 {
            anyhow::bail!("Invalid agent-map format. Expected 'task:agent', got '{}'", pair);
        }
        agent_mapping.insert(parts[0].trim(), parts[1].trim());
    }

    // Build records
    let mut records = Vec::new();
    for task_id in task_ids {
        let agent = agent_mapping.get(task_id)
            .ok_or_else(|| anyhow::anyhow!("No agent specified for task {}", task_id))?;

        records.push(CompletionRecord {
            task: task_id.to_string(),
            agent: agent.to_string(),
            timestamp: Utc::now(),
        });
    }

    Ok(records)
}

/// Parse completion records from JSON file
///
/// Expected format:
/// ```json
/// [
///   {
///     "task": "33",
///     "agent": "A11",
///     "timestamp": "2025-10-13T10:30:00Z"
///   }
/// ]
/// ```
pub fn parse_json_file(path: &Path) -> Result<Vec<CompletionRecord>> {
    let content = std::fs::read_to_string(path)
        .context("Failed to read JSON file")?;

    let records: Vec<CompletionRecord> = serde_json::from_str(&content)
        .context("Failed to parse JSON")?;

    if records.is_empty() {
        anyhow::bail!("JSON file contains no records");
    }

    Ok(records)
}

/// Parse completion records from CSV file
///
/// Expected format:
/// ```csv
/// task_id,agent_id,timestamp
/// 33,A11,2025-10-13T10:30:00Z
/// 34,A11,2025-10-13T11:00:00Z
/// ```
pub fn parse_csv_file(path: &Path) -> Result<Vec<CompletionRecord>> {
    let mut reader = csv::Reader::from_path(path)
        .context("Failed to open CSV file")?;

    let mut records = Vec::new();

    for result in reader.deserialize() {
        let record: CompletionRecord = result
            .context("Failed to parse CSV record")?;
        records.push(record);
    }

    if records.is_empty() {
        anyhow::bail!("CSV file contains no records");
    }

    Ok(records)
}
```

### Core Completion Logic

```rust
// File: src/batch/complete.rs (continued)

use crate::db::Database;
use colored::*;

/// Complete multiple tasks at once
///
/// # Arguments
/// * `db` - Database connection
/// * `records` - List of completion records
///
/// # Returns
/// * `Ok(BatchResult)` - Summary of batch operation
///
/// # Behavior
/// - Uses a single transaction (atomic)
/// - Shows progress for operations taking >2 seconds
/// - Validates all inputs before applying changes
pub fn complete_batch(
    db: &Database,
    records: Vec<CompletionRecord>,
) -> Result<BatchResult> {
    let start = std::time::Instant::now();

    println!("{} Preparing to complete {} task(s)...",
        "⚙".cyan(),
        records.len()
    );

    // 1. Validate all records first (fail-fast)
    println!("{} Validating inputs...", "🔍".cyan());
    let validated = validate_records(db, &records)?;

    // 2. Show summary before applying
    println!("\n{}", "Summary:".bold());
    println!("  Tasks: {}", validated.len());
    let agents: std::collections::HashSet<_> = validated.iter()
        .map(|r| r.agent.as_str())
        .collect();
    println!("  Agents: {} ({})", agents.len(), agents.iter().take(3).cloned().collect::<Vec<_>>().join(", "));

    // 3. Apply changes in transaction
    println!("\n{} Applying changes...\n", "⚡".cyan());

    let conn = db.get_connection();
    let tx = conn.unchecked_transaction()?;

    let mut completed = 0;
    let mut failed = Vec::new();

    // Show progress bar for large batches
    let show_progress = validated.len() > 10;
    let pb = if show_progress {
        use indicatif::{ProgressBar, ProgressStyle};
        let pb = ProgressBar::new(validated.len() as u64);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("{spinner:.green} [{bar:40.cyan/blue}] {pos}/{len} ({eta})")
                .unwrap()
                .progress_chars("#>-")
        );
        Some(pb)
    } else {
        None
    };

    for record in &validated {
        match complete_single_task(&tx, record) {
            Ok(_) => {
                completed += 1;
                if !show_progress {
                    println!("✓ Completed task {} (agent {})",
                        record.task.cyan(),
                        record.agent.dimmed()
                    );
                }
                if let Some(pb) = &pb {
                    pb.inc(1);
                }
            }
            Err(e) => {
                failed.push(BatchError {
                    task_id: record.task.clone(),
                    agent_id: record.agent.clone(),
                    error: e.to_string(),
                });
                println!("❌ Failed task {}: {}",
                    record.task.red(),
                    e.to_string().dimmed()
                );
            }
        }
    }

    if let Some(pb) = pb {
        pb.finish_with_message("Done!");
    }

    // 4. Commit or rollback
    if failed.is_empty() {
        tx.commit()?;
        println!("\n{} All changes committed",
            "✓".green().bold()
        );
    } else {
        drop(tx); // Rollback
        anyhow::bail!("Batch operation failed. No changes applied.");
    }

    let duration_ms = start.elapsed().as_millis();

    // 5. Show summary
    println!("\n{}", "━".repeat(50).dimmed());
    println!("\n{}", "Result:".bold());
    println!("  Completed: {}", completed.to_string().green().bold());
    if !failed.is_empty() {
        println!("  Failed: {}", failed.len().to_string().red());
    }
    println!("  Time: {}s", (duration_ms as f64 / 1000.0));

    Ok(BatchResult {
        completed,
        failed,
        duration_ms,
    })
}

/// Validate all records before applying
fn validate_records(
    db: &Database,
    records: &[CompletionRecord],
) -> Result<Vec<CompletionRecord>> {
    let mut validated = Vec::new();
    let mut errors = Vec::new();

    for record in records {
        // Check task exists
        let task_uuid_result = crate::resolver::resolve_task_id(
            db.get_connection(),
            &record.task
        );

        if task_uuid_result.is_err() {
            errors.push(format!("Task {} not found", record.task));
            continue;
        }

        // Check agent exists (or can be created)
        let agent_uuid_result = crate::resolver::resolve_agent_id(
            db.get_connection(),
            &record.agent
        );

        if agent_uuid_result.is_err() {
            // Agent doesn't exist - this is OK, we'll create it
            // But warn the user
            println!("⚠ Agent {} not found. Will create if needed.",
                record.agent.yellow()
            );
        }

        validated.push(record.clone());
    }

    if !errors.is_empty() {
        anyhow::bail!("Validation failed:\n  {}", errors.join("\n  "));
    }

    Ok(validated)
}

/// Complete a single task (within transaction)
fn complete_single_task(
    tx: &rusqlite::Transaction,
    record: &CompletionRecord,
) -> Result<()> {
    // 1. Resolve task UUID
    let task_uuid = crate::resolver::resolve_task_id(tx, &record.task)?;

    // 2. Update task status
    tx.execute(
        "UPDATE tasks
         SET status = 'completed',
             completed_at = ?1,
             updated_at = ?1
         WHERE id = ?2",
        rusqlite::params![
            record.timestamp.to_rfc3339(),
            task_uuid
        ]
    )?;

    // 3. Resolve or create agent
    let agent_uuid = match crate::resolver::resolve_agent_id(tx, &record.agent) {
        Ok(uuid) => uuid,
        Err(_) => {
            // Create agent
            let new_agent = crate::db::Database::create_agent_in_tx(tx, record.agent.clone())?;
            new_agent
        }
    };

    // 4. Set agent to idle
    tx.execute(
        "UPDATE agents
         SET status = 'idle',
             current_task_id = NULL,
             last_active = ?1
         WHERE id = ?2",
        rusqlite::params![
            record.timestamp.to_rfc3339(),
            agent_uuid
        ]
    )?;

    Ok(())
}
```

### CLI Integration

```rust
// Update src/main.rs

Commands::CompleteBatch {
    /// Comma-separated task IDs (e.g., "33,34,35")
    #[arg(long, conflicts_with_all = ["from_file", "from_csv"])]
    tasks: Option<String>,

    /// Agent mapping (e.g., "33:A11,34:A11,35:A12")
    #[arg(long, requires = "tasks")]
    agent_map: Option<String>,

    /// JSON file path
    #[arg(long, conflicts_with = "from_csv")]
    from_file: Option<PathBuf>,

    /// CSV file path
    #[arg(long, conflicts_with = "from_file")]
    from_csv: Option<PathBuf>,
}

// In match block
Commands::CompleteBatch { tasks, agent_map, from_file, from_csv } => {
    use prd_tool::batch;

    let records = if let Some(tasks_str) = tasks {
        let map = agent_map.ok_or_else(|| anyhow::anyhow!("--agent-map required with --tasks"))?;
        batch::parse_cli_args(&tasks_str, &map)?
    } else if let Some(json_path) = from_file {
        batch::parse_json_file(&json_path)?
    } else if let Some(csv_path) = from_csv {
        batch::parse_csv_file(&csv_path)?
    } else {
        anyhow::bail!("Must specify --tasks, --from-file, or --from-csv");
    };

    let result = batch::complete_batch(&db, records)?;

    if !result.failed.is_empty() {
        std::process::exit(1);
    }
}
```

---

## Testing

```rust
// File: src/batch/tests/complete_tests.rs

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;

    #[test]
    fn test_parse_cli_args() {
        let tasks = "33,34,35";
        let agent_map = "33:A11,34:A11,35:A12";

        let records = parse_cli_args(tasks, agent_map).unwrap();

        assert_eq!(records.len(), 3);
        assert_eq!(records[0].task, "33");
        assert_eq!(records[0].agent, "A11");
        assert_eq!(records[2].agent, "A12");
    }

    #[test]
    fn test_parse_json_file() {
        let temp_file = NamedTempFile::new().unwrap();
        let json_content = r#"[
            {
                "task": "33",
                "agent": "A11",
                "timestamp": "2025-10-13T10:30:00Z"
            },
            {
                "task": "34",
                "agent": "A11"
            }
        ]"#;

        std::fs::write(temp_file.path(), json_content).unwrap();

        let records = parse_json_file(temp_file.path()).unwrap();

        assert_eq!(records.len(), 2);
        assert_eq!(records[0].task, "33");
    }

    #[test]
    fn test_parse_csv_file() {
        let temp_file = NamedTempFile::new().unwrap();
        let csv_content = "task,agent,timestamp\n33,A11,2025-10-13T10:30:00Z\n34,A11,2025-10-13T11:00:00Z";

        std::fs::write(temp_file.path(), csv_content).unwrap();

        let records = parse_csv_file(temp_file.path()).unwrap();

        assert_eq!(records.len(), 2);
    }

    #[test]
    fn test_complete_batch_atomicity() {
        let temp_db = NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        // Create test tasks
        db.create_task("Task 1".to_string(), None, Priority::Medium, None, None).unwrap();
        db.create_task("Task 2".to_string(), None, Priority::Medium, None, None).unwrap();

        // Create agent
        db.create_agent("TestAgent".to_string()).unwrap();

        // Prepare records (one valid, one invalid)
        let records = vec![
            CompletionRecord {
                task: "1".to_string(),
                agent: "A1".to_string(),
                timestamp: Utc::now(),
            },
            CompletionRecord {
                task: "999".to_string(), // Invalid task
                agent: "A1".to_string(),
                timestamp: Utc::now(),
            },
        ];

        // Run batch (should fail)
        let result = complete_batch(&db, records);

        assert!(result.is_err());

        // Verify NO tasks were completed (atomicity)
        let task1 = db.get_task_by_display_id(1).unwrap().unwrap();
        assert_ne!(task1.status, TaskStatus::Completed);
    }

    #[test]
    fn test_complete_batch_success() {
        let temp_db = NamedTempFile::new().unwrap();
        let db = Database::new(temp_db.path().to_str().unwrap()).unwrap();

        // Create test tasks
        db.create_task("Task 1".to_string(), None, Priority::Medium, None, None).unwrap();
        db.create_task("Task 2".to_string(), None, Priority::Medium, None, None).unwrap();

        // Create agent
        db.create_agent("TestAgent".to_string()).unwrap();

        // Prepare records
        let records = vec![
            CompletionRecord {
                task: "1".to_string(),
                agent: "A1".to_string(),
                timestamp: Utc::now(),
            },
            CompletionRecord {
                task: "2".to_string(),
                agent: "A1".to_string(),
                timestamp: Utc::now(),
            },
        ];

        // Run batch
        let result = complete_batch(&db, records).unwrap();

        // Verify success
        assert_eq!(result.completed, 2);
        assert!(result.failed.is_empty());

        // Verify tasks completed
        let task1 = db.get_task_by_display_id(1).unwrap().unwrap();
        let task2 = db.get_task_by_display_id(2).unwrap().unwrap();
        assert_eq!(task1.status, TaskStatus::Completed);
        assert_eq!(task2.status, TaskStatus::Completed);
    }
}
```

---

## Manual Testing

```bash
# 1. Create test tasks
cd /Users/captaindev404/Code/club-med/gentil-feedback/tools/prd
./target/release/prd create "Test task 1"
./target/release/prd create "Test task 2"
./target/release/prd create "Test task 3"
./target/release/prd agent-create "TestAgent"

# 2. Test CLI args mode
./target/release/prd complete-batch \
  --tasks "1,2,3" \
  --agent-map "1:A1,2:A1,3:A1"

# Expected: All 3 tasks marked complete

# 3. Create JSON test file
cat > completions.json <<'EOF'
[
  {
    "task": "4",
    "agent": "A1",
    "timestamp": "2025-10-13T10:30:00Z"
  },
  {
    "task": "5",
    "agent": "A1"
  }
]
EOF

./target/release/prd create "Test task 4"
./target/release/prd create "Test task 5"

# 4. Test JSON mode
./target/release/prd complete-batch --from-file completions.json

# 5. Create CSV test file
cat > completions.csv <<'EOF'
task,agent,timestamp
6,A1,2025-10-13T10:30:00Z
7,A1,2025-10-13T11:00:00Z
EOF

./target/release/prd create "Test task 6"
./target/release/prd create "Test task 7"

# 6. Test CSV mode
./target/release/prd complete-batch --from-csv completions.csv

# 7. Verify all completed
./target/release/prd list --status completed
# Should show tasks 1-7

# 8. Test error handling (invalid task)
./target/release/prd complete-batch \
  --tasks "999" \
  --agent-map "999:A1"
# Should fail with clear error
```

---

## Success Criteria

Task 1.4 is complete when:
- ✅ All three input modes work (CLI, JSON, CSV)
- ✅ Atomic transaction (all-or-nothing)
- ✅ Progress bar for large batches
- ✅ All unit tests pass
- ✅ Performance: 100 tasks in <3s
- ✅ Clear error messages
- ✅ Manual testing successful
- ✅ Code documented with examples

---

## Notes

This task is **independent** of Tasks 1.1-1.3 and can be developed in parallel. It only uses existing PRD database operations (`update_task_status`, `update_agent_status`).
