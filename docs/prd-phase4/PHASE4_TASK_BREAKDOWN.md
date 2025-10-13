# PRD Tool Phase 4 - Task Breakdown

**Phase**: Enhanced User Experience
**Priority**: P1 (High)
**Total Effort**: 10 hours
**Dependencies**: Phase 1 Complete ✅, Phase 2 Complete ✅, Phase 3 Complete ✅
**Goal**: Improve usability, intelligence, and developer satisfaction

---

## Overview

Phase 4 focuses on polishing the user experience to make the PRD tool not just functional, but delightful to use. It adds intelligence, helpful guidance, and visual clarity to transform good automation into an excellent developer experience.

### Success Metrics
- Error resolution time: 5 min → 30 sec (90% reduction)
- Agent selection accuracy: 60% (manual) → 90% (suggested) (50% improvement)
- User satisfaction: 7/10 → 9.5/10 (36% improvement)
- Time to understand progress: 10 min → 10 sec (99% reduction)

---

## Task 4.1: Better Error Messages (3 hours)

### Overview
**Description**: Transform terse error messages into helpful, actionable guidance with suggestions and context
**Priority**: P0 (Critical for usability)

### Technical Approach
**Strategy**: Context-aware error handling with fuzzy matching, suggestions, and actionable next steps

### Key Features
1. Fuzzy matching for typos (task IDs, agent IDs)
2. Contextual suggestions (similar items, recent activity)
3. Actionable next steps (commands to fix the issue)
4. Color-coded output for readability
5. Examples of correct usage

### Implementation Structure
```
src/errors/
├── mod.rs              # Module exports
├── context.rs          # Error context building (300 lines)
├── suggestions.rs      # Fuzzy matching and suggestions (250 lines)
└── tests/
    └── error_tests.rs  # Unit tests (150 lines)
```

### Core Implementation

**context.rs**:
```rust
use crate::db::{Database, Task, Agent};
use anyhow::Result;
use colored::Colorize;

pub struct ErrorContext {
    db: Database,
}

impl ErrorContext {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub fn task_not_found(&self, task_id: i32) -> String {
        let mut msg = format!(
            "{} Task #{} not found in database\n",
            "Error:".red().bold(),
            task_id
        );

        // Find similar task IDs (off by one digit, etc.)
        if let Ok(similar) = self.find_similar_task_ids(task_id) {
            if !similar.is_empty() {
                msg.push_str(&format!("\n{}\n", "Did you mean one of these?".yellow()));
                for task in similar.iter().take(3) {
                    msg.push_str(&format!(
                        "  {} Task #{}: {}\n",
                        "•".cyan(),
                        task.id,
                        task.title.dimmed()
                    ));
                }
            }
        }

        // Show recent pending tasks
        if let Ok(recent) = self.get_recent_pending_tasks(5) {
            if !recent.is_empty() {
                msg.push_str(&format!("\n{}\n", "Recent pending tasks:".yellow()));
                for task in recent {
                    msg.push_str(&format!(
                        "  {} Task #{}: {} ({})\n",
                        "•".cyan(),
                        task.id,
                        task.title.dimmed(),
                        task.status.green()
                    ));
                }
            }
        }

        msg.push_str(&format!(
            "\n{} Use {} to see all tasks\n",
            "Tip:".blue().bold(),
            "prd list".green()
        ));

        msg
    }

    pub fn agent_not_found(&self, agent_id: &str) -> String {
        let mut msg = format!(
            "{} Agent '{}' not found\n",
            "Error:".red().bold(),
            agent_id
        );

        // Find similar agent IDs
        if let Ok(similar) = self.find_similar_agent_ids(agent_id) {
            if !similar.is_empty() {
                msg.push_str(&format!("\n{}\n", "Did you mean one of these?".yellow()));
                for agent in similar.iter().take(3) {
                    let status_str = match agent.status.as_str() {
                        "idle" => "Idle".green(),
                        "working" => "Working".yellow(),
                        "blocked" => "Blocked".red(),
                        _ => agent.status.dimmed(),
                    };
                    msg.push_str(&format!(
                        "  {} {} ({}) - {}\n",
                        "•".cyan(),
                        agent.id.bold(),
                        agent.name.dimmed(),
                        status_str
                    ));
                }
            }
        }

        // List all available agents
        if let Ok(agents) = self.db.get_all_agents() {
            msg.push_str(&format!("\n{}\n", "Available agents:".yellow()));
            for agent in agents.iter().take(5) {
                let status_str = match agent.status.as_str() {
                    "idle" => "Idle".green(),
                    "working" => format!("Working on task #{}", agent.current_task_id.unwrap_or(0)).yellow(),
                    _ => agent.status.dimmed(),
                };
                msg.push_str(&format!(
                    "  {} {} ({}) - {}\n",
                    "•".cyan(),
                    agent.id.bold(),
                    agent.name.dimmed(),
                    status_str
                ));
            }
        }

        msg.push_str(&format!(
            "\n{} Use {} to see all agents\n",
            "Tip:".blue().bold(),
            "prd agent-list".green()
        ));

        msg
    }

    pub fn task_already_complete(&self, task_id: i32) -> String {
        let mut msg = format!(
            "{} Task #{} is already marked as complete\n",
            "Warning:".yellow().bold(),
            task_id
        );

        if let Ok(task) = self.db.get_task(task_id) {
            msg.push_str(&format!("\n{}\n", "Task details:".cyan()));
            msg.push_str(&format!("  Title: {}\n", task.title));
            msg.push_str(&format!("  Status: {}\n", "completed".green()));

            if let Some(doc_path) = task.completion_doc_path {
                msg.push_str(&format!("  Documentation: {}\n", doc_path.dimmed()));
            }
        }

        msg.push_str(&format!(
            "\n{} This task is already done. No action needed.\n",
            "Info:".blue().bold()
        ));

        msg
    }

    pub fn invalid_status(&self, status: &str) -> String {
        let valid_statuses = vec!["pending", "in_progress", "completed", "cancelled", "blocked"];

        let mut msg = format!(
            "{} Invalid status: '{}'\n",
            "Error:".red().bold(),
            status
        );

        // Fuzzy match
        if let Some(suggestion) = find_closest_match(status, &valid_statuses) {
            msg.push_str(&format!(
                "\n{} Did you mean '{}'?\n",
                "Suggestion:".yellow(),
                suggestion.green()
            ));
        }

        msg.push_str(&format!("\n{}\n", "Valid statuses:".yellow()));
        for s in valid_statuses {
            msg.push_str(&format!("  {} {}\n", "•".cyan(), s.green()));
        }

        msg.push_str(&format!(
            "\n{} prd update <task_id> <status>\n",
            "Usage:".blue().bold()
        ));

        msg
    }

    fn find_similar_task_ids(&self, task_id: i32) -> Result<Vec<Task>> {
        // Find tasks with similar IDs (±10 range)
        let min_id = (task_id - 10).max(0);
        let max_id = task_id + 10;

        let tasks = self.db.get_tasks_in_range(min_id, max_id)?;
        Ok(tasks.into_iter()
            .filter(|t| t.id != task_id)
            .take(3)
            .collect())
    }

    fn find_similar_agent_ids(&self, agent_id: &str) -> Result<Vec<Agent>> {
        let all_agents = self.db.get_all_agents()?;

        let mut scored: Vec<(Agent, f64)> = all_agents
            .into_iter()
            .map(|agent| {
                let score = similarity_score(&agent.id, agent_id);
                (agent, score)
            })
            .collect();

        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        Ok(scored.into_iter()
            .take(3)
            .map(|(agent, _)| agent)
            .collect())
    }

    fn get_recent_pending_tasks(&self, limit: usize) -> Result<Vec<Task>> {
        self.db.get_recent_tasks("pending", limit)
    }
}

fn similarity_score(s1: &str, s2: &str) -> f64 {
    // Levenshtein distance-based similarity
    let s1_lower = s1.to_lowercase();
    let s2_lower = s2.to_lowercase();

    let distance = levenshtein_distance(&s1_lower, &s2_lower);
    let max_len = s1.len().max(s2.len()) as f64;

    if max_len == 0.0 {
        return 1.0;
    }

    1.0 - (distance as f64 / max_len)
}

fn levenshtein_distance(s1: &str, s2: &str) -> usize {
    let len1 = s1.len();
    let len2 = s2.len();
    let mut matrix = vec![vec![0; len2 + 1]; len1 + 1];

    for i in 0..=len1 {
        matrix[i][0] = i;
    }
    for j in 0..=len2 {
        matrix[0][j] = j;
    }

    for (i, c1) in s1.chars().enumerate() {
        for (j, c2) in s2.chars().enumerate() {
            let cost = if c1 == c2 { 0 } else { 1 };
            matrix[i + 1][j + 1] = (matrix[i][j + 1] + 1)
                .min(matrix[i + 1][j] + 1)
                .min(matrix[i][j] + cost);
        }
    }

    matrix[len1][len2]
}

fn find_closest_match<'a>(input: &str, options: &[&'a str]) -> Option<&'a str> {
    let mut best_match = None;
    let mut best_score = 0.0;

    for &option in options {
        let score = similarity_score(input, option);
        if score > best_score && score > 0.5 {
            best_score = score;
            best_match = Some(option);
        }
    }

    best_match
}
```

**suggestions.rs**:
```rust
use crate::db::{Database, Task, Agent};
use anyhow::Result;

pub struct SuggestionEngine {
    db: Database,
}

impl SuggestionEngine {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub fn suggest_next_task(&self) -> Result<Option<Task>> {
        // Find highest priority ready task
        let ready_tasks = self.db.get_ready_tasks()?;

        let mut tasks: Vec<_> = ready_tasks
            .into_iter()
            .filter(|t| t.status == "pending")
            .collect();

        // Sort by priority
        tasks.sort_by(|a, b| {
            let priority_order = |p: &str| match p {
                "critical" => 0,
                "high" => 1,
                "medium" => 2,
                "low" => 3,
                _ => 4,
            };

            let a_priority = a.priority.as_deref().unwrap_or("medium");
            let b_priority = b.priority.as_deref().unwrap_or("medium");

            priority_order(a_priority).cmp(&priority_order(b_priority))
        });

        Ok(tasks.into_iter().next())
    }

    pub fn suggest_idle_agents(&self) -> Result<Vec<Agent>> {
        let agents = self.db.get_all_agents()?;

        Ok(agents
            .into_iter()
            .filter(|a| a.status == "idle")
            .collect())
    }

    pub fn suggest_command(&self, partial: &str) -> Vec<&'static str> {
        let commands = vec![
            "prd list",
            "prd create",
            "prd show",
            "prd update",
            "prd complete",
            "prd assign",
            "prd agent-list",
            "prd agent-create",
            "prd sync-docs",
            "prd reconcile",
            "prd complete-batch",
            "prd watch",
            "prd watch-files",
            "prd report-progress",
            "prd install-git-hook",
            "prd hooks",
            "prd stats",
        ];

        let partial_lower = partial.to_lowercase();
        commands
            .into_iter()
            .filter(|cmd| cmd.to_lowercase().contains(&partial_lower))
            .collect()
    }
}
```

### Integration with Existing Commands

Modify existing commands to use ErrorContext:

```rust
// In src/main.rs
use crate::errors::ErrorContext;

Commands::Complete { task_id, agent_id } => {
    let db = Database::new(get_db_path()?)?;
    let error_ctx = ErrorContext::new(db.clone());

    // Check if task exists
    let task = match db.get_task(task_id) {
        Ok(task) => task,
        Err(_) => {
            eprintln!("{}", error_ctx.task_not_found(task_id));
            std::process::exit(1);
        }
    };

    // Check if already complete
    if task.status == "completed" {
        println!("{}", error_ctx.task_already_complete(task_id));
        return Ok(());
    }

    // Check if agent exists
    if let Some(ref agent_id) = agent_id {
        match db.get_agent(agent_id) {
            Ok(_) => {},
            Err(_) => {
                eprintln!("{}", error_ctx.agent_not_found(agent_id));
                std::process::exit(1);
            }
        }
    }

    // ... rest of completion logic
}
```

### Acceptance Criteria
- ✅ All errors include helpful context
- ✅ Suggests corrections for typos (>70% accuracy)
- ✅ Shows relevant alternatives (similar items)
- ✅ Includes actionable next steps
- ✅ Uses color coding for readability
- ✅ Fuzzy matching works for task IDs and agent IDs
- ✅ Command suggestions available

---

## Task 4.2: Smart Agent Suggestions (4 hours)

### Overview
**Description**: Suggest the best agent for a task based on specialization, past performance, and availability
**Priority**: P1 (High value)

### Technical Approach
**Algorithm**: Weighted scoring based on specialization match, success rate, similar task experience, and availability

### Key Features
1. Agent specialization tracking
2. Performance history analysis
3. Similar task pattern matching
4. Availability weighting
5. Top 3 recommendations with explanations
6. Interactive selection

### Implementation Structure
```
src/suggestions/
├── mod.rs              # Module exports
├── agent_matcher.rs    # Agent matching algorithm (400 lines)
├── specializations.rs  # Specialization management (200 lines)
└── tests/
    └── matcher_tests.rs  # Unit tests (150 lines)
```

### Database Schema Addition

```sql
-- Agent specializations
CREATE TABLE IF NOT EXISTS agent_specializations (
    agent_id TEXT NOT NULL,
    specialization TEXT NOT NULL,
    PRIMARY KEY (agent_id, specialization),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Agent performance metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
    agent_id TEXT PRIMARY KEY,
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    avg_completion_time_hours REAL DEFAULT 0.0,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Task keywords for matching
CREATE TABLE IF NOT EXISTS task_keywords (
    task_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    PRIMARY KEY (task_id, keyword),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

### Core Implementation

**agent_matcher.rs**:
```rust
use crate::db::{Database, Task, Agent};
use anyhow::Result;
use colored::Colorize;

pub struct AgentMatcher {
    db: Database,
}

#[derive(Debug, Clone)]
pub struct AgentRecommendation {
    pub agent: Agent,
    pub score: f64,
    pub reasons: Vec<String>,
}

impl AgentMatcher {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub fn suggest_agents(&self, task: &Task, count: usize) -> Result<Vec<AgentRecommendation>> {
        let all_agents = self.db.get_all_agents()?;

        let mut recommendations: Vec<AgentRecommendation> = all_agents
            .into_iter()
            .map(|agent| self.score_agent(&agent, task))
            .collect::<Result<Vec<_>>>()?;

        recommendations.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

        Ok(recommendations.into_iter().take(count).collect())
    }

    fn score_agent(&self, agent: &Agent, task: &Task) -> Result<AgentRecommendation> {
        let mut score = 0.0;
        let mut reasons = Vec::new();

        // 1. Specialization match (40% weight)
        let spec_score = self.specialization_score(agent, task)?;
        score += spec_score * 0.4;
        if spec_score > 0.7 {
            reasons.push(format!(
                "Strong specialization match ({:.0}%)",
                spec_score * 100.0
            ));
        }

        // 2. Past performance (30% weight)
        let perf_score = self.performance_score(agent)?;
        score += perf_score * 0.3;
        if perf_score > 0.8 {
            reasons.push(format!(
                "Excellent track record ({:.0}% success rate)",
                perf_score * 100.0
            ));
        }

        // 3. Similar task experience (20% weight)
        let exp_score = self.experience_score(agent, task)?;
        score += exp_score * 0.2;
        if exp_score > 0.5 {
            let similar_count = (exp_score * 10.0) as usize;
            reasons.push(format!(
                "Completed {} similar tasks",
                similar_count
            ));
        }

        // 4. Availability (10% weight)
        let avail_score = self.availability_score(agent);
        score += avail_score * 0.1;
        match agent.status.as_str() {
            "idle" => reasons.push("Available now".to_string()),
            "working" => {
                if let Some(task_id) = agent.current_task_id {
                    reasons.push(format!("Working on task #{}", task_id));
                }
            }
            _ => {}
        }

        Ok(AgentRecommendation {
            agent: agent.clone(),
            score,
            reasons,
        })
    }

    fn specialization_score(&self, agent: &Agent, task: &Task) -> Result<f64> {
        let agent_specs = self.db.get_agent_specializations(&agent.id)?;
        if agent_specs.is_empty() {
            return Ok(0.3); // Neutral score if no specializations
        }

        let task_keywords = self.extract_task_keywords(task);
        if task_keywords.is_empty() {
            return Ok(0.5);
        }

        let matches = task_keywords
            .iter()
            .filter(|keyword| {
                agent_specs.iter().any(|spec| {
                    spec.to_lowercase().contains(&keyword.to_lowercase()) ||
                    keyword.to_lowercase().contains(&spec.to_lowercase())
                })
            })
            .count();

        Ok((matches as f64 / task_keywords.len() as f64).min(1.0))
    }

    fn performance_score(&self, agent: &Agent) -> Result<f64> {
        let metrics = self.db.get_agent_metrics(&agent.id)?;

        if metrics.total_tasks == 0 {
            return Ok(0.5); // Neutral score for new agents
        }

        let success_rate = metrics.completed_tasks as f64 / metrics.total_tasks as f64;
        Ok(success_rate)
    }

    fn experience_score(&self, agent: &Agent, task: &Task) -> Result<f64> {
        let agent_tasks = self.db.get_agent_completed_tasks(&agent.id)?;
        let task_keywords = self.extract_task_keywords(task);

        if task_keywords.is_empty() {
            return Ok(0.0);
        }

        let similar_count = agent_tasks
            .iter()
            .filter(|t| {
                let t_keywords = self.extract_task_keywords(t);
                t_keywords.iter().any(|k| task_keywords.contains(k))
            })
            .count();

        Ok((similar_count as f64 / 10.0).min(1.0))
    }

    fn availability_score(&self, agent: &Agent) -> f64 {
        match agent.status.as_str() {
            "idle" => 1.0,
            "working" => 0.5,
            _ => 0.0,
        }
    }

    fn extract_task_keywords(&self, task: &Task) -> Vec<String> {
        let text = format!("{} {}", task.title, task.description.as_deref().unwrap_or(""));
        let text_lower = text.to_lowercase();

        let common_keywords = vec![
            "ui", "ux", "frontend", "backend", "api", "database", "testing",
            "validation", "form", "component", "authentication", "auth",
            "design", "layout", "responsive", "accessibility", "performance",
            "optimization", "refactor", "bug", "fix", "feature", "enhancement",
        ];

        common_keywords
            .into_iter()
            .filter(|&keyword| text_lower.contains(keyword))
            .map(|s| s.to_string())
            .collect()
    }

    pub fn format_recommendations(&self, recommendations: &[AgentRecommendation]) -> String {
        let mut output = String::new();

        for (i, rec) in recommendations.iter().enumerate() {
            let medal = match i {
                0 => "🥇",
                1 => "🥈",
                2 => "🥉",
                _ => "•",
            };

            let score_str = format!("{:.0}%", rec.score * 100.0);
            let score_colored = if rec.score > 0.8 {
                score_str.green()
            } else if rec.score > 0.6 {
                score_str.yellow()
            } else {
                score_str.dimmed()
            };

            output.push_str(&format!(
                "{} {} ({}) - {} match",
                medal,
                rec.agent.id.bold(),
                rec.agent.name.dimmed(),
                score_colored
            ));

            if i == 0 && rec.score > 0.8 {
                output.push_str(&format!(" {}", "⭐ RECOMMENDED".green().bold()));
            }

            output.push('\n');

            // Status
            let status_str = match rec.agent.status.as_str() {
                "idle" => "Idle (available now)".green(),
                "working" => format!(
                    "Working on task #{}",
                    rec.agent.current_task_id.unwrap_or(0)
                ).yellow(),
                _ => rec.agent.status.dimmed(),
            };
            output.push_str(&format!("  Status: {}\n", status_str));

            // Reasons
            if !rec.reasons.is_empty() {
                output.push_str(&format!("  Why: {}\n", rec.reasons.join(", ").dimmed()));
            }

            output.push('\n');
        }

        output
    }
}
```

### CLI Integration

```rust
Commands::Assign { task_id, agent_id, suggest } => {
    let db = Database::new(get_db_path()?)?;
    let task = db.get_task(task_id)?;

    if suggest {
        // Show agent suggestions
        let matcher = suggestions::AgentMatcher::new(db.clone());
        let recommendations = matcher.suggest_agents(&task, 3)?;

        println!("Task #{}: {}", task_id, task.title.bold());
        if let Some(desc) = &task.description {
            println!("Description: {}\n", desc.dimmed());
        }

        println!("{}\n", "Recommended agents:".yellow().bold());
        println!("{}", matcher.format_recommendations(&recommendations));

        // Interactive selection
        print!("Assign to {} (top recommendation)? [Y/n]: ", recommendations[0].agent.id.bold());
        std::io::stdout().flush()?;

        let mut input = String::new();
        std::io::stdin().read_line(&mut input)?;

        let selected_agent = if input.trim().is_empty() || input.trim().to_lowercase() == "y" {
            &recommendations[0].agent
        } else {
            print!("Enter agent ID: ");
            std::io::stdout().flush()?;
            input.clear();
            std::io::stdin().read_line(&mut input)?;
            db.get_agent(input.trim())?
        };

        // Assign task
        db.assign_task(task_id, &selected_agent.id)?;
        println!("\n✓ Assigned task #{} to {}", task_id, selected_agent.id.green());
    } else if let Some(agent_id) = agent_id {
        // Direct assignment
        db.assign_task(task_id, &agent_id)?;
        println!("✓ Assigned task #{} to {}", task_id, agent_id.green());
    } else {
        return Err(anyhow::anyhow!("Either provide agent_id or use --suggest flag"));
    }
}

// New command to manage agent specializations
Commands::AgentUpdate { agent_id, add_spec, remove_spec } => {
    let db = Database::new(get_db_path()?)?;

    if let Some(spec) = add_spec {
        db.add_agent_specialization(&agent_id, &spec)?;
        println!("✓ Added specialization '{}' to {}", spec.green(), agent_id);
    }

    if let Some(spec) = remove_spec {
        db.remove_agent_specialization(&agent_id, &spec)?;
        println!("✓ Removed specialization '{}' from {}", spec.red(), agent_id);
    }

    // Show agent profile
    let agent = db.get_agent(&agent_id)?;
    let specs = db.get_agent_specializations(&agent_id)?;
    let metrics = db.get_agent_metrics(&agent_id)?;

    println!("\n{} {}", "Agent:".bold(), agent.id);
    println!("Name: {}", agent.name);
    println!("Status: {}", agent.status);

    if !specs.is_empty() {
        println!("\nSpecializations:");
        for spec in specs {
            println!("  • {}", spec.cyan());
        }
    }

    println!("\nPerformance:");
    println!("  Total tasks: {}", metrics.total_tasks);
    println!("  Completed: {} ({:.0}%)",
        metrics.completed_tasks,
        if metrics.total_tasks > 0 {
            (metrics.completed_tasks as f64 / metrics.total_tasks as f64) * 100.0
        } else {
            0.0
        }
    );
}
```

### Acceptance Criteria
- ✅ Suggests agents with >80% accuracy
- ✅ Shows top 3 recommendations
- ✅ Explains match reasoning
- ✅ Considers availability and workload
- ✅ Learns from past task completions
- ✅ Can be overridden manually
- ✅ Interactive selection works
- ✅ Specialization management functional

---

## Task 4.3: Visual Progress Timelines (3 hours)

### Overview
**Description**: Show project progress over time with visual timelines and velocity calculations
**Priority**: P1 (Nice to have)

### Technical Approach
**Visualization**: ASCII-based charts and timelines that render in terminal

### Key Features
1. Sprint-based timeline view
2. Agent breakdown per sprint
3. Velocity calculations
4. Trend analysis
5. Burndown chart
6. Estimated completion date

### Implementation Structure
```
src/visualization/
├── mod.rs              # Module exports
├── timeline.rs         # Timeline rendering (300 lines)
├── charts.rs           # Chart generation (250 lines)
└── tests/
    └── viz_tests.rs    # Unit tests (100 lines)
```

### Database Schema Addition

```sql
-- Sprints for timeline
CREATE TABLE IF NOT EXISTS sprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    goal TEXT
);

-- Sprint task assignments
CREATE TABLE IF NOT EXISTS sprint_tasks (
    sprint_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    PRIMARY KEY (sprint_id, task_id),
    FOREIGN KEY (sprint_id) REFERENCES sprints(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

### Core Implementation

**timeline.rs**:
```rust
use crate::db::Database;
use anyhow::Result;
use colored::Colorize;
use chrono::{DateTime, Utc, Duration};

pub struct TimelineRenderer {
    db: Database,
}

impl TimelineRenderer {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub fn render(&self) -> Result<String> {
        let mut output = String::new();

        output.push_str(&format!("{}\n\n", "Project Progress Timeline".bold()));

        // Get or infer sprints
        let sprints = self.get_or_infer_sprints()?;

        for sprint in &sprints {
            output.push_str(&self.render_sprint(sprint)?);
        }

        // Overall velocity
        output.push_str(&self.render_velocity(&sprints)?);

        // Burndown chart
        output.push_str(&self.render_burndown()?);

        Ok(output)
    }

    fn render_sprint(&self, sprint: &Sprint) -> Result<String> {
        let mut output = String::new();

        let status = if sprint.is_complete() {
            "Complete".green()
        } else {
            "In Progress".yellow()
        };

        output.push_str(&format!(
            "Sprint {} ({} - {}) {}\n",
            sprint.number.to_string().bold(),
            sprint.start_date.format("%b %d"),
            sprint.end_date.format("%b %d"),
            status
        ));

        // Progress bar
        let percent = sprint.completion_percentage();
        let bar_width = 40;
        let filled = (percent / 100.0 * bar_width as f64) as usize;
        let empty = bar_width - filled;

        output.push_str(&format!(
            "│ {}{} {}/{} tasks │ {}%\n",
            "█".repeat(filled).green(),
            "░".repeat(empty).dimmed(),
            sprint.completed_tasks,
            sprint.total_tasks,
            percent
        ));

        // Agent breakdown
        if !sprint.agent_tasks.is_empty() {
            output.push_str("├─────────────────────────────────────────────┤\n");
            for (agent_id, count) in &sprint.agent_tasks {
                let bar_len = (count * 2).min(20);
                output.push_str(&format!(
                    "│ {} {} {} tasks\n",
                    agent_id.cyan(),
                    "█".repeat(bar_len).blue(),
                    count
                ));
            }
        }

        output.push_str("└─────────────────────────────────────────────┘\n\n");

        Ok(output)
    }

    fn render_velocity(&self, sprints: &[Sprint]) -> Result<String> {
        let mut output = String::new();

        output.push_str(&format!("{}\n", "─".repeat(47)));
        output.push_str(&format!("{}\n", "Velocity Metrics".bold()));
        output.push_str(&format!("{}\n", "─".repeat(47)));

        let completed_sprints: Vec<_> = sprints
            .iter()
            .filter(|s| s.is_complete())
            .collect();

        if completed_sprints.is_empty() {
            output.push_str("No completed sprints yet\n\n");
            return Ok(output);
        }

        let total_tasks: usize = completed_sprints
            .iter()
            .map(|s| s.completed_tasks)
            .sum();

        let avg_velocity = total_tasks as f64 / completed_sprints.len() as f64;

        output.push_str(&format!("Average velocity: {:.1} tasks/sprint\n", avg_velocity));

        // Trend
        if completed_sprints.len() >= 2 {
            let recent = completed_sprints[completed_sprints.len() - 1].completed_tasks;
            let previous = completed_sprints[completed_sprints.len() - 2].completed_tasks;

            let trend = if recent > previous {
                format!("↑ +{} tasks", recent - previous).green()
            } else if recent < previous {
                format!("↓ -{} tasks", previous - recent).red()
            } else {
                "→ Stable".yellow()
            };

            output.push_str(&format!("Trend: {}\n", trend));
        }

        // Remaining estimate
        let total_tasks = self.db.get_all_tasks()?.len();
        let completed_tasks = self.db.get_completed_tasks()?.len();
        let remaining = total_tasks - completed_tasks;

        if remaining > 0 && avg_velocity > 0.0 {
            let remaining_sprints = (remaining as f64 / avg_velocity).ceil();
            output.push_str(&format!(
                "Estimated completion: {:.1} sprints remaining\n",
                remaining_sprints
            ));
        }

        output.push('\n');

        Ok(output)
    }

    fn render_burndown(&self) -> Result<String> {
        let mut output = String::new();

        output.push_str(&format!("{}\n", "─".repeat(47)));
        output.push_str(&format!("{}\n", "Burndown Chart".bold()));
        output.push_str(&format!("{}\n", "─".repeat(47)));

        let snapshots = self.get_daily_snapshots()?;
        if snapshots.len() < 2 {
            output.push_str("Not enough data for burndown chart\n\n");
            return Ok(output);
        }

        let max_tasks = snapshots[0].remaining_tasks;
        let height = 10;
        let width = 40.min(snapshots.len());

        // Render chart
        for y in (0..=height).rev() {
            let threshold = (y as f64 / height as f64) * max_tasks as f64;
            output.push_str(&format!("{:3}│", threshold as usize));

            for i in 0..width {
                let idx = (i as f64 / width as f64 * snapshots.len() as f64) as usize;
                let snapshot = &snapshots[idx.min(snapshots.len() - 1)];

                if snapshot.remaining_tasks as f64 <= threshold {
                    output.push('●');
                } else {
                    output.push(' ');
                }
            }

            if y == height {
                output.push_str(&format!("  Ideal ⋯"));
            } else if y == 0 {
                output.push_str(&format!("  Actual ●"));
            }

            output.push('\n');
        }

        output.push_str(&format!(
            "   └{}\n",
            "─".repeat(width)
        ));

        output.push_str(&format!(
            "    {}{}  ({})\n\n",
            snapshots.first().map(|s| s.date.format("%b %d").to_string()).unwrap_or_default(),
            " ".repeat(width.saturating_sub(15)),
            snapshots.last().map(|s| s.date.format("%b %d").to_string()).unwrap_or_default()
        ));

        Ok(output)
    }

    fn get_or_infer_sprints(&self) -> Result<Vec<Sprint>> {
        // Try to get from database
        if let Ok(sprints) = self.db.get_all_sprints() {
            if !sprints.is_empty() {
                return Ok(sprints);
            }
        }

        // Infer from task completion dates
        self.infer_sprints_from_tasks()
    }

    fn infer_sprints_from_tasks(&self) -> Result<Vec<Sprint>> {
        // Group tasks by week
        // Implementation details...
        Ok(vec![])
    }

    fn get_daily_snapshots(&self) -> Result<Vec<ProgressSnapshot>> {
        // Get daily remaining task counts
        // Implementation details...
        Ok(vec![])
    }
}

#[derive(Debug)]
struct Sprint {
    number: usize,
    start_date: DateTime<Utc>,
    end_date: DateTime<Utc>,
    total_tasks: usize,
    completed_tasks: usize,
    agent_tasks: Vec<(String, usize)>,
}

impl Sprint {
    fn is_complete(&self) -> bool {
        Utc::now() > self.end_date
    }

    fn completion_percentage(&self) -> usize {
        if self.total_tasks == 0 {
            return 100;
        }
        (self.completed_tasks * 100 / self.total_tasks)
    }
}

#[derive(Debug)]
struct ProgressSnapshot {
    date: DateTime<Utc>,
    remaining_tasks: usize,
}
```

### CLI Integration

```rust
Commands::Stats { visual } => {
    let db = Database::new(get_db_path()?)?;

    if visual {
        // Visual timeline
        let renderer = visualization::TimelineRenderer::new(db);
        let output = renderer.render()?;
        println!("{}", output);
    } else {
        // Simple stats (existing implementation)
        let stats = db.get_stats()?;
        println!("Tasks: {} total, {} completed, {} pending",
            stats.total,
            stats.completed,
            stats.pending
        );
    }
}
```

### Acceptance Criteria
- ✅ Shows historical sprint data
- ✅ Visualizes current sprint progress
- ✅ Calculates velocity and trends
- ✅ Predicts completion date
- ✅ Shows burndown chart
- ✅ Renders cleanly in terminal
- ✅ Handles missing data gracefully

---

## Implementation Order

**Sequential** (recommended):
1. **Task 4.1** (Error Messages) - Foundation (3h)
2. **Task 4.2** (Agent Suggestions) - Independent (4h)
3. **Task 4.3** (Visual Timeline) - Builds on existing data (3h)

**Parallel Option**:
- Tasks 4.1 and 4.2 can run in parallel (mostly independent)
- Task 4.3 should wait for 4.1 (uses error context patterns)

---

## Dependencies Added

```toml
# Cargo.toml additions
[dependencies]
colored = "2.1"        # Terminal colors
similar = "2.3"        # String similarity for fuzzy matching
dialoguer = "0.11"     # Interactive prompts (already present from Phase 1)

# Already present:
chrono = { version = "0.4", features = ["serde"] }
```

---

## Testing Strategy

### Task 4.1 Tests
- Error message formatting
- Fuzzy matching accuracy
- Suggestion relevance
- Color output (mocked)

### Task 4.2 Tests
- Scoring algorithm
- Specialization matching
- Performance calculation
- Recommendation ordering

### Task 4.3 Tests
- Sprint inference
- Chart rendering
- Velocity calculation
- Date handling

### Integration Test
- End-to-end: Error occurs → Helpful message → Suggested fix works

---

## Phase 4 Complete When

- ✅ Error messages are helpful and actionable
- ✅ Agent suggestions achieve >80% acceptance rate
- ✅ Visual timeline renders correctly
- ✅ All tests pass (target: 20+ tests)
- ✅ User satisfaction improved
- ✅ Documentation updated

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Error resolution time | <30 sec | Time from error to fix |
| Agent suggestion accuracy | >80% | % times suggestion is accepted |
| User satisfaction | 9.5/10 | Survey after Phase 4 |
| Timeline render time | <500ms | Time to generate output |

**Phase 4 delivers**: Delightful developer experience with intelligent assistance

