# PRD Tool Phase 3 - Task Breakdown

**Phase**: Agent Integration
**Priority**: P1 (High)
**Total Effort**: 12 hours
**Dependencies**: Phase 1 Complete ✅, Phase 2 Complete ✅
**Goal**: Seamless workflow integration for automated operations

---

## Overview

Phase 3 transforms the PRD tool into a fully automated system that requires zero manual intervention. It builds on Phase 1's sync capabilities and Phase 2's real-time tracking to create a seamless workflow where agents and the database stay in sync automatically.

### Success Metrics
- Manual intervention: Every task → Zero (100% automated)
- Sync delay: 30+ min → <1 sec (99.9% reduction)
- Agent coordination: Manual → Automated
- Custom integration: Not possible → Flexible hooks

---

## Task 3.1: File Watcher for Auto-Completion (5 hours)

### Overview
**Command**: `prd watch-files`
**Description**: Monitor `docs/tasks/` directory and automatically mark tasks complete when new completion documents appear
**Priority**: P0 (Critical foundation for automation)

### Technical Approach
**Technology**: Use `notify` crate (v6.1) for cross-platform file system monitoring

**Architecture**:
```
File System                    File Watcher               PRD Database
  ├─ docs/tasks/                    │                         │
  │  ├─ TASK-033-...md              │                         │
  │  └─ TASK-050-...md  ────────>  Watch  ────────────>  UPDATE tasks
                                     │                    SET status='completed'
                                     │
                                 Debounce
                                 (500ms)
```

### Key Features
1. Real-time file monitoring (detects within 1 second)
2. Debouncing to handle rapid file creation
3. Daemon mode for background operation
4. Status monitoring and control
5. Automatic recovery from errors
6. CPU usage <1% when idle

### Implementation Structure
```
src/watcher/
├── mod.rs              # Module exports
├── file_watcher.rs     # Core watcher implementation
├── daemon.rs           # Daemon mode support
└── tests/
    └── watcher_tests.rs
```

### Database Schema (No changes needed)
Uses existing `tasks` table and `completion_doc_path` field from Phase 1.

### Core Implementation

**file_watcher.rs**:
```rust
use notify::{Watcher, RecursiveMode, Event, EventKind};
use notify::event::{CreateKind, ModifyKind};
use std::path::{Path, PathBuf};
use std::time::Duration;
use crate::db::Database;
use crate::sync::doc_scanner::parse_completion_doc;

pub struct FileWatcher {
    watcher: Box<dyn Watcher>,
    db: Database,
    docs_path: PathBuf,
    running: Arc<AtomicBool>,
}

impl FileWatcher {
    pub fn new(docs_path: PathBuf, db: Database) -> Result<Self> {
        let running = Arc::new(AtomicBool::new(false));

        let watcher = notify::recommended_watcher(move |res: Result<Event, _>| {
            match res {
                Ok(event) => {
                    if let Err(e) = handle_file_event(event, &db) {
                        eprintln!("Error handling file event: {}", e);
                    }
                }
                Err(e) => eprintln!("Watch error: {:?}", e),
            }
        })?;

        Ok(Self {
            watcher: Box::new(watcher),
            db,
            docs_path,
            running,
        })
    }

    pub fn start(&mut self) -> Result<()> {
        println!("👁 Watching {} for completion documents...", self.docs_path.display());

        self.watcher.watch(&self.docs_path, RecursiveMode::NonRecursive)?;
        self.running.store(true, Ordering::SeqCst);

        // Keep running until stopped
        while self.running.load(Ordering::SeqCst) {
            std::thread::sleep(Duration::from_millis(100));
        }

        Ok(())
    }

    pub fn stop(&mut self) {
        self.running.store(false, Ordering::SeqCst);
        println!("⏹ File watcher stopped");
    }
}

fn handle_file_event(event: Event, db: &Database) -> Result<()> {
    match event.kind {
        EventKind::Create(CreateKind::File) | EventKind::Modify(ModifyKind::Data(_)) => {
            for path in event.paths {
                if is_completion_doc(&path) {
                    process_completion_doc(path, db)?;
                }
            }
        }
        _ => {}
    }
    Ok(())
}

fn is_completion_doc(path: &Path) -> bool {
    path.file_name()
        .and_then(|n| n.to_str())
        .map(|n| n.starts_with("TASK-") && n.contains("COMPLETION"))
        .unwrap_or(false)
}

fn process_completion_doc(path: PathBuf, db: &Database) -> Result<()> {
    println!("✓ Detected new file: {}", path.file_name().unwrap().to_str().unwrap());

    // Parse and sync
    if let Some(doc) = parse_completion_doc(path)? {
        // Check if already complete
        let task = db.get_task(doc.task_id)?;
        if task.status == "completed" {
            println!("  ⚠ Task #{} already complete, skipping", doc.task_id);
            return Ok(());
        }

        // Mark complete
        db.execute(
            "UPDATE tasks
             SET status = 'completed',
                 completion_doc_path = ?,
                 auto_completed = TRUE,
                 updated_at = ?
             WHERE id = ?",
            params![doc.file_path.to_str(), doc.completed_at, doc.task_id]
        )?;

        // Update agent if provided
        if let Some(agent_id) = &doc.agent_id {
            db.execute(
                "UPDATE agents
                 SET status = 'idle',
                     current_task_id = NULL
                 WHERE id = ?",
                params![agent_id]
            )?;

            println!("  → Marked task #{} complete (agent {})", doc.task_id, agent_id);
        } else {
            println!("  → Marked task #{} complete", doc.task_id);
        }
    }

    Ok(())
}
```

**daemon.rs**:
```rust
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};

const PID_FILE: &str = "/tmp/prd-watcher.pid";
const LOG_FILE: &str = "/tmp/prd-watcher.log";

pub fn start_daemon(docs_path: PathBuf, db_path: PathBuf) -> Result<()> {
    // Check if already running
    if is_running()? {
        return Err(anyhow::anyhow!("File watcher already running"));
    }

    // Spawn background process
    let exe_path = std::env::current_exe()?;
    let child = Command::new(exe_path)
        .arg("watch-files")
        .arg("--docs-path")
        .arg(&docs_path)
        .arg("--db-path")
        .arg(&db_path)
        .arg("--daemon-mode")
        .stdin(Stdio::null())
        .stdout(Stdio::from(fs::File::create(LOG_FILE)?))
        .stderr(Stdio::from(fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(LOG_FILE)?))
        .spawn()?;

    // Write PID file
    fs::write(PID_FILE, child.id().to_string())?;

    println!("✓ File watcher started in background (PID: {})", child.id());
    println!("  Logs: {}", LOG_FILE);

    Ok(())
}

pub fn stop_daemon() -> Result<()> {
    if !is_running()? {
        return Err(anyhow::anyhow!("File watcher not running"));
    }

    let pid = fs::read_to_string(PID_FILE)?
        .trim()
        .parse::<i32>()?;

    // Send SIGTERM
    #[cfg(unix)]
    {
        use nix::sys::signal::{kill, Signal};
        use nix::unistd::Pid;
        kill(Pid::from_raw(pid), Signal::SIGTERM)?;
    }

    #[cfg(windows)]
    {
        Command::new("taskkill")
            .args(&["/PID", &pid.to_string(), "/F"])
            .output()?;
    }

    // Remove PID file
    fs::remove_file(PID_FILE)?;

    println!("✓ File watcher stopped");
    Ok(())
}

pub fn status() -> Result<()> {
    if !is_running()? {
        println!("File watcher: Not running");
        return Ok(());
    }

    let pid = fs::read_to_string(PID_FILE)?
        .trim()
        .parse::<i32>()?;

    // Read stats from log
    let stats = read_stats()?;

    println!("File watcher: Running (PID {})", pid);
    println!("Watching: {:?}", stats.docs_path);
    println!("Tasks auto-completed: {}", stats.tasks_completed);
    println!("Uptime: {}", format_duration(stats.uptime));
    println!("Logs: {}", LOG_FILE);

    Ok(())
}

fn is_running() -> Result<bool> {
    if !Path::new(PID_FILE).exists() {
        return Ok(false);
    }

    let pid = fs::read_to_string(PID_FILE)?
        .trim()
        .parse::<i32>()?;

    // Check if process exists
    #[cfg(unix)]
    {
        use nix::sys::signal::{kill, Signal};
        use nix::unistd::Pid;
        match kill(Pid::from_raw(pid), None) {
            Ok(_) => Ok(true),
            Err(_) => {
                // Process doesn't exist, clean up PID file
                let _ = fs::remove_file(PID_FILE);
                Ok(false)
            }
        }
    }

    #[cfg(windows)]
    {
        let output = Command::new("tasklist")
            .args(&["/FI", &format!("PID eq {}", pid)])
            .output()?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.contains(&pid.to_string()))
    }
}

struct WatcherStats {
    docs_path: PathBuf,
    tasks_completed: usize,
    uptime: Duration,
}

fn read_stats() -> Result<WatcherStats> {
    // Parse log file for stats
    // Implementation depends on log format
    Ok(WatcherStats {
        docs_path: PathBuf::from("docs/tasks"),
        tasks_completed: 0,
        uptime: Duration::from_secs(0),
    })
}
```

### CLI Integration (main.rs)
```rust
Commands::WatchFiles {
    #[arg(long)]
    daemon: bool,

    #[arg(long)]
    status: bool,

    #[arg(long)]
    stop: bool,

    #[arg(long, default_value = "docs/tasks")]
    docs_path: PathBuf,
} => {
    if status {
        watcher::daemon::status()?;
    } else if stop {
        watcher::daemon::stop_daemon()?;
    } else if daemon {
        watcher::daemon::start_daemon(docs_path, db_path)?;
    } else {
        let db = Database::new(db_path)?;
        let mut watcher = watcher::FileWatcher::new(docs_path, db)?;
        watcher.start()?;
    }
}
```

### Acceptance Criteria
- ✅ Detects new completion documents within 1 second
- ✅ Handles rapid file creation (10+ files/sec)
- ✅ Debounces duplicate events (500ms window)
- ✅ Runs reliably as daemon
- ✅ Logs all auto-completions
- ✅ Handles file system errors gracefully
- ✅ CPU usage <1% when idle
- ✅ Can start, stop, check status
- ✅ Auto-restarts on crash (with systemd/launchd)
- ✅ Works on macOS, Linux, Windows

---

## Task 3.2: Git Integration (4 hours)

### Overview
**Commands**:
- `prd sync-docs --from-git`
- `prd install-git-hook`

**Description**: Auto-detect task completions from git commit messages and history
**Priority**: P1 (High value, optional feature)

### Technical Approach
**Technology**: Use `git2` crate (v0.18) for Git operations

**Two Integration Modes**:
1. **Manual Sync**: Scan git history for task completions
2. **Git Hooks**: Auto-mark tasks complete on commit

### Key Features
1. Parse commit messages for task IDs
2. Support multiple commit message patterns
3. Date range and branch filtering
4. Git hook installation
5. Fast scanning (1000+ commits in <5 seconds)

### Implementation Structure
```
src/git/
├── mod.rs              # Module exports
├── sync.rs             # Git history scanning
├── hooks.rs            # Git hook management
└── tests/
    └── git_tests.rs
```

### Core Implementation

**sync.rs**:
```rust
use git2::{Repository, Oid};
use regex::Regex;
use chrono::{DateTime, Utc};

pub struct GitSync {
    repo: Repository,
}

impl GitSync {
    pub fn new(repo_path: &Path) -> Result<Self> {
        let repo = Repository::open(repo_path)?;
        Ok(Self { repo })
    }

    pub fn scan_for_completions(
        &self,
        since: Option<DateTime<Utc>>,
        until: Option<DateTime<Utc>>,
        branch: Option<&str>,
    ) -> Result<Vec<CompletionDoc>> {
        let mut revwalk = self.repo.revwalk()?;

        // Set starting point
        if let Some(branch_name) = branch {
            let branch = self.repo.find_branch(branch_name, git2::BranchType::Local)?;
            revwalk.push(branch.get().target().unwrap())?;
        } else {
            revwalk.push_head()?;
        }

        let mut completions = Vec::new();
        let task_regex = Regex::new(
            r"(?i)(?:complete|finish|done|task|closes?|fix(?:es)?)[:\s]+(?:task[:\s]*)?#?(\d+)|TASK-(\d+)"
        )?;

        for oid in revwalk {
            let oid = oid?;
            let commit = self.repo.find_commit(oid)?;

            // Filter by date range
            let commit_time = DateTime::from_timestamp(commit.time().seconds(), 0)
                .ok_or_else(|| anyhow::anyhow!("Invalid commit time"))?;

            if let Some(since) = since {
                if commit_time < since {
                    break; // Commits are chronological, stop here
                }
            }

            if let Some(until) = until {
                if commit_time > until {
                    continue;
                }
            }

            // Parse commit message
            let message = commit.message().unwrap_or("");
            let task_ids = extract_task_ids(&task_regex, message);

            for task_id in task_ids {
                completions.push(CompletionDoc {
                    task_id,
                    agent_id: parse_agent_from_email(commit.author().email()),
                    completed_at: commit_time,
                    file_path: PathBuf::from(format!("git:{}", commit.id())),
                    git_commit_hash: Some(commit.id().to_string()),
                });
            }
        }

        Ok(completions)
    }
}

fn extract_task_ids(regex: &Regex, message: &str) -> Vec<i32> {
    regex.captures_iter(message)
        .filter_map(|cap| {
            cap.get(1)
                .or_else(|| cap.get(2))
                .and_then(|m| m.as_str().parse().ok())
        })
        .collect()
}

fn parse_agent_from_email(email: Option<&str>) -> Option<String> {
    // Try to extract agent ID from email
    // Example: agent-a12@example.com -> A12
    email.and_then(|e| {
        let re = Regex::new(r"agent-?(a\d+)@").ok()?;
        re.captures(e)
            .and_then(|cap| cap.get(1))
            .map(|m| m.as_str().to_uppercase())
    })
}
```

**hooks.rs**:
```rust
use std::fs;
use std::path::Path;

const POST_COMMIT_HOOK: &str = r#"#!/bin/bash
# PRD Tool - Auto-complete tasks from commit messages
# Generated by: prd install-git-hook

commit_msg=$(git log -1 --pretty=%B)

# Extract task IDs from commit message
if [[ $commit_msg =~ TASK-([0-9]+) ]] || \
   [[ $commit_msg =~ [Tt]ask[:\s]+#?([0-9]+) ]] || \
   [[ $commit_msg =~ [Cc]omplete[:\s]+#?([0-9]+) ]] || \
   [[ $commit_msg =~ [Ff]inish(?:es)?[:\s]+#?([0-9]+) ]]; then

    task_id="${BASH_REMATCH[1]}"

    if [ -n "$task_id" ]; then
        echo "🔍 Detected task #$task_id in commit, marking complete..."
        prd complete "$task_id" --auto 2>/dev/null

        if [ $? -eq 0 ]; then
            echo "✓ Task #$task_id marked complete"
        fi
    fi
fi
"#;

pub fn install_git_hook(repo_path: &Path) -> Result<()> {
    let hook_path = repo_path.join(".git/hooks/post-commit");

    // Check if hook already exists
    if hook_path.exists() {
        let existing = fs::read_to_string(&hook_path)?;
        if existing.contains("PRD Tool") {
            return Err(anyhow::anyhow!("PRD hook already installed"));
        }

        // Backup existing hook
        fs::copy(&hook_path, hook_path.with_extension("backup"))?;
        println!("⚠ Backed up existing hook to post-commit.backup");
    }

    // Write hook
    fs::write(&hook_path, POST_COMMIT_HOOK)?;

    // Make executable (Unix only)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&hook_path)?.permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&hook_path, perms)?;
    }

    println!("✓ Git hook installed at {}", hook_path.display());
    println!("  Tasks will be auto-completed on commit");

    Ok(())
}

pub fn uninstall_git_hook(repo_path: &Path) -> Result<()> {
    let hook_path = repo_path.join(".git/hooks/post-commit");

    if !hook_path.exists() {
        return Err(anyhow::anyhow!("No git hook found"));
    }

    let content = fs::read_to_string(&hook_path)?;
    if !content.contains("PRD Tool") {
        return Err(anyhow::anyhow!("Not a PRD tool hook"));
    }

    fs::remove_file(&hook_path)?;
    println!("✓ Git hook removed");

    // Restore backup if exists
    let backup_path = hook_path.with_extension("backup");
    if backup_path.exists() {
        fs::rename(&backup_path, &hook_path)?;
        println!("  Restored previous hook from backup");
    }

    Ok(())
}
```

### Supported Commit Message Patterns
```
# All these patterns will be recognized:
Complete TASK-033: General Info Tab
Finish task #50 - Testing complete
TASK-054: Autosave implementation done
[TASK-057] Add progress indicator
Task 60: Implement dark mode
Closes #42
Fixes task #38
Done: task 55
```

### CLI Integration (main.rs)
```rust
Commands::SyncDocs {
    #[arg(long)]
    from_git: bool,

    #[arg(long)]
    since: Option<String>,

    #[arg(long)]
    until: Option<String>,

    #[arg(long)]
    branch: Option<String>,
} => {
    if from_git {
        let repo_path = std::env::current_dir()?;
        let git_sync = git::GitSync::new(&repo_path)?;

        let since = since.as_ref().map(|s| DateTime::parse_from_rfc3339(s)).transpose()?;
        let until = until.as_ref().map(|s| DateTime::parse_from_rfc3339(s)).transpose()?;

        let completions = git_sync.scan_for_completions(
            since.map(|dt| dt.with_timezone(&Utc)),
            until.map(|dt| dt.with_timezone(&Utc)),
            branch.as_deref(),
        )?;

        // Sync to database
        sync_completions(&db, completions)?;
    } else {
        // Regular file-based sync (Phase 1)
        // ...
    }
}

Commands::InstallGitHook {
    #[arg(long)]
    uninstall: bool,
} => {
    let repo_path = std::env::current_dir()?;

    if uninstall {
        git::hooks::uninstall_git_hook(&repo_path)?;
    } else {
        git::hooks::install_git_hook(&repo_path)?;
    }
}
```

### Acceptance Criteria
- ✅ Correctly parses 5+ commit message patterns
- ✅ Handles 1000+ commits in <5 seconds
- ✅ Supports date range filtering (`--since`, `--until`)
- ✅ Supports branch filtering (`--branch`)
- ✅ Git hook installs correctly
- ✅ Hook doesn't slow down commits (<100ms overhead)
- ✅ Gracefully handles repos without .git directory
- ✅ Can backup and restore existing hooks
- ✅ Works on macOS, Linux, Windows

---

## Task 3.3: Hook System (3 hours)

### Overview
**Commands**:
- `prd hooks init`
- `prd hooks list`
- `prd hooks test`
- `prd hooks enable/disable`

**Description**: Allow custom scripts to run on PRD events (task start, complete, agent sync, etc.)
**Priority**: P1 (Enables custom workflows)

### Technical Approach
**Configuration**: TOML-based hook configuration at `~/.prd/hooks.toml`

**Hook Types**:
1. `on_task_complete` - Task marked complete
2. `on_task_start` - Task assigned/started
3. `on_sync` - Sync command completes
4. `on_agent_error` - Agent reports error
5. `on_milestone` - Project milestone reached

### Key Features
1. Variable substitution in hook commands
2. Async execution (don't block operations)
3. Timeout protection (30 seconds)
4. Error logging
5. Enable/disable hooks
6. Test hooks without side effects

### Implementation Structure
```
src/hooks/
├── mod.rs              # Module exports
├── config.rs           # Hook configuration
├── executor.rs         # Hook execution
└── tests/
    └── hooks_tests.rs
```

### Core Implementation

**config.rs**:
```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct HookConfig {
    #[serde(default)]
    pub on_task_complete: Option<String>,

    #[serde(default)]
    pub on_task_start: Option<String>,

    #[serde(default)]
    pub on_sync: Option<String>,

    #[serde(default)]
    pub on_agent_error: Option<String>,

    #[serde(default)]
    pub on_milestone: Option<String>,

    #[serde(default)]
    pub enabled: HashMap<String, bool>,
}

impl Default for HookConfig {
    fn default() -> Self {
        Self {
            on_task_complete: None,
            on_task_start: None,
            on_sync: None,
            on_agent_error: None,
            on_milestone: None,
            enabled: HashMap::new(),
        }
    }
}

impl HookConfig {
    pub fn load() -> Result<Self> {
        let config_path = get_hooks_config_path()?;

        if !config_path.exists() {
            return Ok(Self::default());
        }

        let content = fs::read_to_string(config_path)?;
        let config: HookConfig = toml::from_str(&content)?;

        Ok(config)
    }

    pub fn save(&self) -> Result<()> {
        let config_path = get_hooks_config_path()?;

        // Ensure directory exists
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let content = toml::to_string_pretty(self)?;
        fs::write(config_path, content)?;

        Ok(())
    }

    pub fn init_default() -> Result<()> {
        let config = Self {
            on_task_complete: Some("echo 'Task {task_id} completed by {agent_id}'".to_string()),
            on_task_start: Some("echo 'Task {task_id} started by {agent_id}'".to_string()),
            on_sync: None,
            on_agent_error: Some("echo 'Agent {agent_id} error: {error}'".to_string()),
            on_milestone: Some("echo 'Milestone: {percent}% complete'".to_string()),
            enabled: HashMap::from([
                ("on_task_complete".to_string(), false),
                ("on_task_start".to_string(), false),
                ("on_agent_error".to_string(), false),
                ("on_milestone".to_string(), false),
            ]),
        };

        config.save()?;

        println!("✓ Created hook configuration at {}", get_hooks_config_path()?.display());
        println!("  Edit the file to configure your hooks");
        println!("  Use 'prd hooks enable <name>' to activate hooks");

        Ok(())
    }

    pub fn is_enabled(&self, hook_name: &str) -> bool {
        self.enabled.get(hook_name).copied().unwrap_or(false)
    }
}

fn get_hooks_config_path() -> Result<PathBuf> {
    let home = std::env::var("HOME")?;
    Ok(PathBuf::from(home).join(".prd").join("hooks.toml"))
}
```

**executor.rs**:
```rust
use std::collections::HashMap;
use std::process::{Command, Stdio};
use std::time::Duration;
use std::thread;

pub struct HookExecutor {
    config: HookConfig,
}

impl HookExecutor {
    pub fn new(config: HookConfig) -> Self {
        Self { config }
    }

    pub fn trigger_task_complete(&self, task: &Task, agent: &Agent) -> Result<()> {
        if !self.config.is_enabled("on_task_complete") {
            return Ok(());
        }

        if let Some(hook_cmd) = &self.config.on_task_complete {
            let vars = HashMap::from([
                ("task_id".to_string(), task.id.to_string()),
                ("agent_id".to_string(), agent.id.clone()),
                ("task_title".to_string(), task.title.clone()),
                ("status".to_string(), task.status.clone()),
                ("timestamp".to_string(), Utc::now().to_rfc3339()),
            ]);

            self.execute_hook(hook_cmd, vars)?;
        }

        Ok(())
    }

    pub fn trigger_task_start(&self, task: &Task, agent: &Agent) -> Result<()> {
        if !self.config.is_enabled("on_task_start") {
            return Ok(());
        }

        if let Some(hook_cmd) = &self.config.on_task_start {
            let vars = HashMap::from([
                ("task_id".to_string(), task.id.to_string()),
                ("agent_id".to_string(), agent.id.clone()),
                ("task_title".to_string(), task.title.clone()),
                ("timestamp".to_string(), Utc::now().to_rfc3339()),
            ]);

            self.execute_hook(hook_cmd, vars)?;
        }

        Ok(())
    }

    pub fn trigger_agent_error(&self, agent: &Agent, task: &Task, error: &str) -> Result<()> {
        if !self.config.is_enabled("on_agent_error") {
            return Ok(());
        }

        if let Some(hook_cmd) = &self.config.on_agent_error {
            let vars = HashMap::from([
                ("agent_id".to_string(), agent.id.clone()),
                ("task_id".to_string(), task.id.to_string()),
                ("error".to_string(), error.to_string()),
                ("timestamp".to_string(), Utc::now().to_rfc3339()),
            ]);

            self.execute_hook(hook_cmd, vars)?;
        }

        Ok(())
    }

    pub fn trigger_milestone(&self, percent: u8, completed: i32, total: i32) -> Result<()> {
        if !self.config.is_enabled("on_milestone") {
            return Ok(());
        }

        if let Some(hook_cmd) = &self.config.on_milestone {
            let vars = HashMap::from([
                ("percent".to_string(), percent.to_string()),
                ("completed".to_string(), completed.to_string()),
                ("total".to_string(), total.to_string()),
                ("timestamp".to_string(), Utc::now().to_rfc3339()),
            ]);

            self.execute_hook(hook_cmd, vars)?;
        }

        Ok(())
    }

    fn execute_hook(&self, hook_cmd: &str, vars: HashMap<String, String>) -> Result<()> {
        // Substitute variables
        let mut cmd = hook_cmd.to_string();
        for (key, value) in vars {
            cmd = cmd.replace(&format!("{{{}}}", key), &value);
        }

        // Execute asynchronously with timeout
        thread::spawn(move || {
            if let Err(e) = execute_with_timeout(&cmd, Duration::from_secs(30)) {
                eprintln!("Hook execution failed: {}", e);
            }
        });

        Ok(())
    }
}

fn execute_with_timeout(cmd: &str, timeout: Duration) -> Result<()> {
    // Parse command (handle spaces properly)
    let parts: Vec<&str> = shell_words::split(cmd)?
        .iter()
        .map(|s| s.as_str())
        .collect();

    if parts.is_empty() {
        return Ok(());
    }

    // Execute with timeout
    let output = Command::new(parts[0])
        .args(&parts[1..])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?
        .wait_timeout(timeout)?;

    match output {
        Some(status) => {
            if !status.success() {
                eprintln!("Hook exited with status: {}", status);
            }
        }
        None => {
            eprintln!("Hook timed out after {:?}", timeout);
        }
    }

    Ok(())
}
```

### Hook Configuration File Example

**~/.prd/hooks.toml**:
```toml
# Task completion hook
on_task_complete = "./scripts/notify-slack.sh {task_id} {agent_id}"

# Task start hook
on_task_start = "./scripts/log-start.sh {task_id} {agent_id}"

# Sync completion hook
on_sync = "prd reconcile --auto-fix"

# Agent error hook
on_agent_error = "./scripts/alert-team.sh {agent_id} {error}"

# Milestone hook
on_milestone = "./scripts/celebrate.sh {percent}"

# Enable/disable individual hooks
[enabled]
on_task_complete = true
on_task_start = false
on_sync = true
on_agent_error = true
on_milestone = true
```

### CLI Integration (main.rs)
```rust
Commands::Hooks { subcommand } => {
    match subcommand {
        HooksSubcommand::Init => {
            hooks::HookConfig::init_default()?;
        }
        HooksSubcommand::List => {
            let config = hooks::HookConfig::load()?;
            println!("Configured hooks:\n");

            print_hook_status("on_task_complete", &config.on_task_complete, &config);
            print_hook_status("on_task_start", &config.on_task_start, &config);
            print_hook_status("on_sync", &config.on_sync, &config);
            print_hook_status("on_agent_error", &config.on_agent_error, &config);
            print_hook_status("on_milestone", &config.on_milestone, &config);
        }
        HooksSubcommand::Test { hook_name, task_id, agent_id } => {
            let config = hooks::HookConfig::load()?;
            let executor = hooks::HookExecutor::new(config);

            println!("Testing hook: {}", hook_name);

            // Create mock data
            let task = Task {
                id: task_id.unwrap_or(1),
                title: "Test task".to_string(),
                status: "completed".to_string(),
                // ...
            };

            let agent = Agent {
                id: agent_id.unwrap_or("A1".to_string()),
                name: "Test agent".to_string(),
                // ...
            };

            match hook_name.as_str() {
                "on_task_complete" => executor.trigger_task_complete(&task, &agent)?,
                "on_task_start" => executor.trigger_task_start(&task, &agent)?,
                "on_agent_error" => executor.trigger_agent_error(&agent, &task, "Test error")?,
                _ => return Err(anyhow::anyhow!("Unknown hook: {}", hook_name)),
            }

            println!("✓ Hook triggered");
        }
        HooksSubcommand::Enable { hook_name } => {
            let mut config = hooks::HookConfig::load()?;
            config.enabled.insert(hook_name.clone(), true);
            config.save()?;
            println!("✓ Enabled hook: {}", hook_name);
        }
        HooksSubcommand::Disable { hook_name } => {
            let mut config = hooks::HookConfig::load()?;
            config.enabled.insert(hook_name.clone(), false);
            config.save()?;
            println!("✓ Disabled hook: {}", hook_name);
        }
    }
}
```

### Example Hook Scripts

**scripts/notify-slack.sh**:
```bash
#!/bin/bash
TASK_ID=$1
AGENT_ID=$2

curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"✅ Task #$TASK_ID completed by agent $AGENT_ID\"}"
```

**scripts/log-metrics.sh**:
```bash
#!/bin/bash
TASK_ID=$1
TIMESTAMP=$(date -Iseconds)
echo "$TIMESTAMP,task_complete,$TASK_ID" >> metrics.csv
```

### Acceptance Criteria
- ✅ Supports all 5 major events (start, complete, error, milestone, sync)
- ✅ Variable substitution works correctly
- ✅ Hooks run asynchronously (don't block main operation)
- ✅ Hook failures logged but don't break PRD commands
- ✅ Timeout protection (hooks killed after 30 seconds)
- ✅ Easy to enable/disable hooks
- ✅ Can test hooks without side effects
- ✅ Configuration persists across runs
- ✅ Clear error messages on hook failures

---

## Implementation Order

**Sequential** (recommended):
1. **Task 3.1** (File Watcher) - Foundation (5h)
2. **Task 3.2** (Git Integration) - Independent feature (4h)
3. **Task 3.3** (Hook System) - Builds on events from 3.1/3.2 (3h)

**Parallel Option**:
- Tasks 3.1 and 3.2 can run in parallel (independent)
- Task 3.3 should wait for 3.1 to complete (needs events)

---

## Dependencies Added

```toml
# Cargo.toml additions
[dependencies]
notify = "6.1"         # File system watcher
git2 = "0.18"          # Git integration
shell-words = "1.1"    # Safe command parsing
nix = "0.27"           # Unix process management (Unix only)

# Already present from Phase 1-2:
regex = "1.10"
toml = "0.8"
```

---

## Testing Strategy

### Task 3.1 Tests
- File watcher detects new files
- Handles rapid file creation
- Daemon start/stop/status
- Error recovery

### Task 3.2 Tests
- Commit message parsing (all patterns)
- Date range filtering
- Branch filtering
- Hook installation/uninstallation
- Performance (1000+ commits)

### Task 3.3 Tests
- Hook configuration loading
- Variable substitution
- Async execution
- Timeout protection
- Enable/disable functionality

### Integration Test
- End-to-end: Create doc → File watcher detects → Mark complete → Trigger hook

---

## Phase 3 Complete When

- ✅ `prd watch-files` daemon functional
- ✅ `prd sync-docs --from-git` works
- ✅ Git hook auto-completes tasks on commit
- ✅ Hook system triggers on all events
- ✅ All tests pass (target: 20+ tests)
- ✅ Performance targets met
- ✅ Documentation updated

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| File detection latency | <1sec | Time from file create to DB update |
| Git sync performance | <5sec for 1000 commits | Time to scan history |
| Hook execution | <30sec max | Timeout enforcement |
| Daemon stability | 24h+ uptime | Test with monitoring |
| CPU usage (daemon idle) | <1% | System monitoring |

**Phase 3 delivers**: Zero manual intervention, 100% automated workflow

