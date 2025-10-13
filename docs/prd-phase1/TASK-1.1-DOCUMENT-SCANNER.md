# Task 1.1: Document Scanner Implementation

**Effort**: 2 hours
**Priority**: P0 (Critical)
**Status**: Ready to start
**Dependencies**: None

---

## Objective

Implement filesystem scanning logic to discover and parse completion documents from the `docs/tasks/` directory. This forms the foundation for auto-sync functionality.

---

## Background

When agents complete tasks, they create completion documents like:
- `docs/tasks/TASK-033-COMPLETION.md`
- `docs/tasks/TASK-050-COMPLETION.md`
- `docs/tasks/TASK-054-AUTOSAVE-IMPLEMENTATION.md`

Currently, there's no automated way to detect these documents and update the database. This task creates the scanning infrastructure.

---

## Acceptance Criteria

### Must Have
- [ ] Scans `docs/tasks/` directory for files matching pattern `TASK-*-COMPLETION.md` and `TASK-*-*.md`
- [ ] Extracts task ID from filename (e.g., `TASK-033-COMPLETION.md` → 33)
- [ ] Handles various filename formats:
  - `TASK-033-COMPLETION.md`
  - `TASK-050-TESTING-GUIDE.md`
  - `TASK-054-AUTOSAVE-IMPLEMENTATION.md`
- [ ] Parses optional YAML frontmatter for metadata
- [ ] Falls back to file modified time if no frontmatter
- [ ] Returns structured `CompletionDoc` objects
- [ ] Handles errors gracefully (malformed filenames, missing files, permission errors)

### Performance
- [ ] Scans 100 documents in <500ms
- [ ] Memory efficient (streaming, not loading all files into memory)

### Error Handling
- [ ] Invalid filename format → skip with warning
- [ ] Unreadable file → skip with error message
- [ ] Invalid frontmatter → use defaults

---

## Technical Design

### Module Structure
```
tools/prd/src/sync/
├── mod.rs              # Module exports
├── doc_scanner.rs      # Main implementation (THIS TASK)
└── tests/
    └── scanner_tests.rs # Unit tests
```

### Data Structures

```rust
// File: src/sync/doc_scanner.rs

use chrono::{DateTime, Utc};
use std::path::PathBuf;
use anyhow::Result;

/// Represents a parsed completion document
#[derive(Debug, Clone)]
pub struct CompletionDoc {
    /// Task ID extracted from filename
    pub task_id: i32,
    /// Optional agent ID from frontmatter
    pub agent_id: Option<String>,
    /// Completion timestamp (from frontmatter or file mtime)
    pub completed_at: DateTime<Utc>,
    /// Full path to the document
    pub file_path: PathBuf,
}

/// Frontmatter metadata (optional)
#[derive(Debug, serde::Deserialize)]
struct Frontmatter {
    task_id: Option<i32>,
    agent_id: Option<String>,
    completed_at: Option<String>,
}
```

### Core Functions

#### 1. Main Entry Point
```rust
/// Scan a directory for completion documents
///
/// # Arguments
/// * `docs_dir` - Path to docs/tasks/ directory
///
/// # Returns
/// * `Ok(Vec<CompletionDoc>)` - List of parsed documents
/// * `Err(_)` - If directory doesn't exist or can't be read
///
/// # Example
/// ```
/// let docs = scan_completion_docs(Path::new("docs/tasks"))?;
/// println!("Found {} completion documents", docs.len());
/// ```
pub fn scan_completion_docs(docs_dir: &Path) -> Result<Vec<CompletionDoc>> {
    // 1. Check if directory exists
    // 2. Glob for TASK-*.md files
    // 3. Parse each file
    // 4. Filter out invalid entries
    // 5. Return results
}
```

#### 2. Filename Parser
```rust
/// Extract task ID from filename
///
/// Supports formats:
/// - TASK-033-COMPLETION.md → 33
/// - TASK-050-TESTING-GUIDE.md → 50
/// - TASK-054-AUTOSAVE-IMPLEMENTATION.md → 54
///
/// # Returns
/// * `Some(task_id)` if valid format
/// * `None` if invalid or no match
fn extract_task_id_from_filename(path: &Path) -> Option<i32> {
    // Use regex: TASK-(\d+)-
}
```

#### 3. Document Parser
```rust
/// Parse a single completion document
///
/// # Steps
/// 1. Extract task ID from filename
/// 2. Read file contents
/// 3. Parse YAML frontmatter (if present)
/// 4. Get file modified time as fallback
/// 5. Return CompletionDoc
///
/// # Returns
/// * `Some(CompletionDoc)` on success
/// * `None` if parsing fails (logs warning)
fn parse_completion_doc(path: PathBuf) -> Option<CompletionDoc> {
    // Implementation
}
```

#### 4. Frontmatter Parser
```rust
/// Parse YAML frontmatter from markdown file
///
/// Looks for:
/// ```markdown
/// ---
/// task_id: 33
/// agent_id: A11
/// completed_at: 2025-10-13T10:30:00Z
/// ---
/// ```
///
/// # Returns
/// * `Some(Frontmatter)` if found and valid
/// * `None` if no frontmatter or invalid YAML
fn parse_frontmatter(content: &str) -> Option<Frontmatter> {
    // Implementation
}
```

#### 5. File Metadata Helper
```rust
/// Get file modified time
fn get_file_modified_time(path: &Path) -> Option<DateTime<Utc>> {
    // Use std::fs::metadata
}
```

---

## Implementation Steps

### Step 1: Create Module Structure
```bash
mkdir -p tools/prd/src/sync/tests
touch tools/prd/src/sync/mod.rs
touch tools/prd/src/sync/doc_scanner.rs
touch tools/prd/src/sync/tests/scanner_tests.rs
```

### Step 2: Add Dependencies
Update `tools/prd/Cargo.toml`:
```toml
[dependencies]
glob = "0.3"        # File pattern matching
regex = "1.10"      # Task ID extraction
serde = { version = "1.0", features = ["derive"] }
serde_yaml = "0.9"  # YAML frontmatter parsing
```

### Step 3: Implement Core Functions
In order:
1. `extract_task_id_from_filename()` (simplest, no I/O)
2. `get_file_modified_time()` (simple I/O)
3. `parse_frontmatter()` (YAML parsing)
4. `parse_completion_doc()` (combines 1-3)
5. `scan_completion_docs()` (main entry point)

### Step 4: Write Tests (TDD Approach)
Write tests first, then implement to pass tests:

```rust
// File: src/sync/tests/scanner_tests.rs

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_extract_task_id_standard_format() {
        let path = Path::new("TASK-033-COMPLETION.md");
        assert_eq!(extract_task_id_from_filename(path), Some(33));
    }

    #[test]
    fn test_extract_task_id_custom_suffix() {
        let path = Path::new("TASK-050-TESTING-GUIDE.md");
        assert_eq!(extract_task_id_from_filename(path), Some(50));
    }

    #[test]
    fn test_extract_task_id_invalid_format() {
        let path = Path::new("README.md");
        assert_eq!(extract_task_id_from_filename(path), None);
    }

    #[test]
    fn test_parse_frontmatter_full() {
        let content = r#"---
task_id: 33
agent_id: A11
completed_at: 2025-10-13T10:30:00Z
---

# Task 33 Completion
"#;
        let fm = parse_frontmatter(content).unwrap();
        assert_eq!(fm.task_id, Some(33));
        assert_eq!(fm.agent_id, Some("A11".to_string()));
    }

    #[test]
    fn test_parse_frontmatter_missing() {
        let content = "# No frontmatter here";
        assert!(parse_frontmatter(content).is_none());
    }

    #[test]
    fn test_scan_empty_directory() {
        let temp_dir = tempdir().unwrap();
        let docs = scan_completion_docs(temp_dir.path()).unwrap();
        assert_eq!(docs.len(), 0);
    }

    #[test]
    fn test_scan_with_valid_docs() {
        let temp_dir = tempdir().unwrap();

        // Create test files
        fs::write(
            temp_dir.path().join("TASK-033-COMPLETION.md"),
            "# Task 33"
        ).unwrap();
        fs::write(
            temp_dir.path().join("TASK-050-TEST.md"),
            "# Task 50"
        ).unwrap();

        let docs = scan_completion_docs(temp_dir.path()).unwrap();
        assert_eq!(docs.len(), 2);

        // Check task IDs were extracted
        let ids: Vec<i32> = docs.iter().map(|d| d.task_id).collect();
        assert!(ids.contains(&33));
        assert!(ids.contains(&50));
    }

    #[test]
    fn test_scan_skips_invalid_files() {
        let temp_dir = tempdir().unwrap();

        // Create mix of valid and invalid files
        fs::write(temp_dir.path().join("TASK-033-COMPLETION.md"), "").unwrap();
        fs::write(temp_dir.path().join("README.md"), "").unwrap();
        fs::write(temp_dir.path().join("INVALID-033.md"), "").unwrap();

        let docs = scan_completion_docs(temp_dir.path()).unwrap();
        assert_eq!(docs.len(), 1);
        assert_eq!(docs[0].task_id, 33);
    }
}
```

### Step 5: Integration with Main Module
```rust
// File: src/sync/mod.rs

mod doc_scanner;

pub use doc_scanner::{scan_completion_docs, CompletionDoc};
```

---

## Testing Strategy

### Unit Tests (in scanner_tests.rs)
- ✅ Filename parsing (valid formats)
- ✅ Filename parsing (invalid formats)
- ✅ Frontmatter parsing (full metadata)
- ✅ Frontmatter parsing (partial metadata)
- ✅ Frontmatter parsing (missing frontmatter)
- ✅ Frontmatter parsing (invalid YAML)
- ✅ Directory scanning (empty directory)
- ✅ Directory scanning (valid docs)
- ✅ Directory scanning (mixed valid/invalid)
- ✅ File modified time fallback

### Performance Tests
```rust
#[test]
fn bench_scan_100_documents() {
    let temp_dir = tempdir().unwrap();

    // Create 100 test documents
    for i in 1..=100 {
        fs::write(
            temp_dir.path().join(format!("TASK-{:03}-COMPLETION.md", i)),
            "# Test"
        ).unwrap();
    }

    let start = Instant::now();
    let docs = scan_completion_docs(temp_dir.path()).unwrap();
    let duration = start.elapsed();

    assert_eq!(docs.len(), 100);
    assert!(duration < Duration::from_millis(500),
            "Scanning took {}ms (expected <500ms)", duration.as_millis());
}
```

### Error Handling Tests
```rust
#[test]
fn test_scan_nonexistent_directory() {
    let result = scan_completion_docs(Path::new("/nonexistent/path"));
    assert!(result.is_err());
}

#[test]
fn test_scan_permission_denied() {
    // Create directory with no read permissions (Unix only)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let temp_dir = tempdir().unwrap();
        let mut perms = temp_dir.path().metadata().unwrap().permissions();
        perms.set_mode(0o000);
        fs::set_permissions(temp_dir.path(), perms).unwrap();

        let result = scan_completion_docs(temp_dir.path());
        assert!(result.is_err());
    }
}
```

---

## Manual Testing

After implementation, test manually:

```bash
# 1. Create test completion docs
cd /Users/captaindev404/Code/club-med/gentil-feedback
mkdir -p docs/tasks
echo "# Task 33 Complete" > docs/tasks/TASK-033-COMPLETION.md
echo "# Task 50 Complete" > docs/tasks/TASK-050-TESTING.md

# 2. Build PRD tool
cd tools/prd
cargo build

# 3. Test in Rust REPL (optional)
cargo test -- --nocapture scanner_tests

# 4. Verify output
# Should find 2 documents with task IDs 33 and 50
```

---

## Documentation

Add to `tools/prd/README.md`:

```markdown
## Sync Module

The `sync` module provides functionality for detecting and synchronizing task completion documents.

### Document Scanner

Scans the `docs/tasks/` directory for completion documents matching the pattern:
- `TASK-{ID}-COMPLETION.md`
- `TASK-{ID}-*.md`

Example:
```rust
use prd_tool::sync::scan_completion_docs;

let docs = scan_completion_docs(Path::new("docs/tasks"))?;
for doc in docs {
    println!("Task {} completed at {}", doc.task_id, doc.completed_at);
}
```
```

---

## Success Criteria

Task 1.1 is complete when:
- ✅ All unit tests pass
- ✅ Performance benchmark passes (<500ms for 100 docs)
- ✅ Error handling tests pass
- ✅ Manual testing successful
- ✅ Code documented (doc comments)
- ✅ Module integrated into main crate
- ✅ No compiler warnings

---

## Handoff to Next Task

After Task 1.1 completion:
1. **Task 1.2** (Sync Command) can use `scan_completion_docs()` function
2. **Task 1.3** (Reconcile) can use `scan_completion_docs()` for consistency checks

Provide to next task:
- `CompletionDoc` struct definition
- `scan_completion_docs()` function signature
- Example usage from tests
