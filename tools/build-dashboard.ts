#!/usr/bin/env ts-node
/**
 * Real-Time Build Progress Dashboard
 *
 * Monitors task completion and displays live progress updates
 * Updates automatically as agents complete tasks
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.join(__dirname, 'prd.db');
const REFRESH_INTERVAL = 2000; // 2 seconds
const LOG_FILE = path.join(__dirname, '../build-log.json');

interface Task {
  task_id: string;
  title: string;
  description: string;
  category: string;
  epic: string;
  priority: number;
  estimated_hours: number;
  status: string;
  depends_on: string | null;
  assigned_agent: string | null;
  tech_stack: string | null;
  created_at: string;
  updated_at: string;
}

interface BuildLog {
  started_at: string;
  last_updated: string;
  completed_tasks: string[];
  in_progress_tasks: string[];
  total_time_minutes: number;
}

let db: Database.Database;
let previousCompleted = 0;
let buildLog: BuildLog;

/**
 * Initialize database and build log
 */
function initialize() {
  db = new Database(DB_PATH);

  // Load or create build log
  if (fs.existsSync(LOG_FILE)) {
    buildLog = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  } else {
    buildLog = {
      started_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      completed_tasks: [],
      in_progress_tasks: [],
      total_time_minutes: 0
    };
    saveBuildLog();
  }
}

/**
 * Save build log to file
 */
function saveBuildLog() {
  buildLog.last_updated = new Date().toISOString();
  const startTime = new Date(buildLog.started_at).getTime();
  const currentTime = new Date().getTime();
  buildLog.total_time_minutes = Math.round((currentTime - startTime) / 1000 / 60);
  fs.writeFileSync(LOG_FILE, JSON.stringify(buildLog, null, 2));
}

/**
 * Clear screen
 */
function clearScreen() {
  process.stdout.write('\x1Bc');
}

/**
 * Get statistics
 */
function getStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
  const completed = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('completed') as { count: number };
  const inProgress = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('in_progress') as { count: number };
  const pending = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('pending') as { count: number };
  const blocked = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('blocked') as { count: number };
  const failed = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('failed') as { count: number };

  return {
    total: total.count,
    completed: completed.count,
    inProgress: inProgress.count,
    pending: pending.count,
    blocked: blocked.count,
    failed: failed.count,
    completionPct: ((completed.count / total.count) * 100).toFixed(1)
  };
}

/**
 * Get tasks by status
 */
function getTasksByStatus(status: string, limit: number = 10): Task[] {
  return db.prepare(`
    SELECT * FROM tasks
    WHERE status = ?
    ORDER BY updated_at DESC, priority ASC
    LIMIT ?
  `).all(status, limit) as Task[];
}

/**
 * Get recently completed tasks
 */
function getRecentlyCompleted(limit: number = 5): Task[] {
  return db.prepare(`
    SELECT * FROM tasks
    WHERE status = 'completed'
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(limit) as Task[];
}

/**
 * Get epic breakdown
 */
function getEpicBreakdown() {
  return db.prepare(`
    SELECT
      epic,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM tasks
    GROUP BY epic
    ORDER BY completed DESC, total DESC
  `).all() as Array<{
    epic: string;
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
  }>;
}

/**
 * Create progress bar
 */
function createProgressBar(current: number, total: number, width: number = 50): string {
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Format duration
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Check for newly completed tasks
 */
function checkNewCompletions(currentCompleted: number): Task[] {
  if (currentCompleted > previousCompleted) {
    const newlyCompleted = getRecentlyCompleted(currentCompleted - previousCompleted);
    previousCompleted = currentCompleted;
    return newlyCompleted;
  }
  return [];
}

/**
 * Display dashboard
 */
function displayDashboard() {
  clearScreen();

  const stats = getStats();
  const recentlyCompleted = getRecentlyCompleted(5);
  const inProgressTasks = getTasksByStatus('in_progress', 5);
  const epicBreakdown = getEpicBreakdown();
  const now = new Date().toLocaleString();

  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║          ODYSSEY FEEDBACK - REAL-TIME BUILD DASHBOARD                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
  console.log(`  Last Updated: ${now} | Elapsed: ${formatDuration(buildLog.total_time_minutes)}\n`);

  // Overall Progress
  const progressBar = createProgressBar(stats.completed, stats.total, 60);
  console.log('┌───────────────────────────────────────────────────────────────────────────┐');
  console.log('│ 📊 OVERALL PROGRESS                                                       │');
  console.log('├───────────────────────────────────────────────────────────────────────────┤');
  console.log(`│ [${progressBar}] ${stats.completionPct}% │`);
  console.log('├───────────────────────────────────────────────────────────────────────────┤');
  console.log(`│ Total Tasks:       ${stats.total.toString().padStart(3)}                                                       │`);
  console.log(`│ ✅ Completed:      ${stats.completed.toString().padStart(3)}  (${stats.completionPct}%)                                        │`);
  console.log(`│ ⚙️  In Progress:    ${stats.inProgress.toString().padStart(3)}                                                       │`);
  console.log(`│ 📋 Pending:        ${stats.pending.toString().padStart(3)}                                                       │`);
  console.log(`│ ⏸️  Blocked:        ${stats.blocked.toString().padStart(3)}                                                       │`);
  console.log(`│ ❌ Failed:         ${stats.failed.toString().padStart(3)}                                                       │`);
  console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

  // In Progress Tasks
  console.log('┌───────────────────────────────────────────────────────────────────────────┐');
  console.log('│ ⚙️  TASKS IN PROGRESS                                                     │');
  console.log('├───────────────────────────────────────────────────────────────────────────┤');

  if (inProgressTasks.length === 0) {
    console.log('│ No tasks currently in progress                                            │');
  } else {
    inProgressTasks.forEach((task) => {
      const title = task.title.substring(0, 50).padEnd(50);
      const agent = (task.assigned_agent || 'unassigned').substring(0, 15).padEnd(15);
      console.log(`│ ${task.task_id} | ${title} | ${agent} │`);
    });
  }

  console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

  // Recently Completed
  console.log('┌───────────────────────────────────────────────────────────────────────────┐');
  console.log('│ ✅ RECENTLY COMPLETED                                                     │');
  console.log('├───────────────────────────────────────────────────────────────────────────┤');

  if (recentlyCompleted.length === 0) {
    console.log('│ No completed tasks yet                                                    │');
  } else {
    recentlyCompleted.forEach((task) => {
      const title = task.title.substring(0, 50).padEnd(50);
      const time = new Date(task.updated_at).toLocaleTimeString();
      console.log(`│ ${task.task_id} | ${title} | ${time.padEnd(8)} │`);
    });
  }

  console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

  // Epic Breakdown
  console.log('┌───────────────────────────────────────────────────────────────────────────┐');
  console.log('│ 📦 PROGRESS BY EPIC                                                       │');
  console.log('├───────────────────────────────────────────────────────────────────────────┤');
  console.log('│ Epic                  │ Total │ Done │ WIP │ Pending │ Progress         │');
  console.log('├───────────────────────────────────────────────────────────────────────────┤');

  epicBreakdown.slice(0, 10).forEach((epic) => {
    const name = epic.epic.substring(0, 20).padEnd(20);
    const pct = ((epic.completed / epic.total) * 100).toFixed(0);
    const bar = createProgressBar(epic.completed, epic.total, 15);
    console.log(`│ ${name} │  ${epic.total.toString().padStart(3)}  │  ${epic.completed.toString().padStart(2)}  │  ${epic.in_progress.toString().padStart(1)}  │   ${epic.pending.toString().padStart(3)}   │ [${bar}] ${pct.padStart(3)}% │`);
  });

  console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

  // Build Stats
  const estimatedTotal = 400; // From PRD
  const estimatedRemaining = estimatedTotal * (1 - (stats.completed / stats.total));

  console.log('┌───────────────────────────────────────────────────────────────────────────┐');
  console.log('│ 📈 BUILD STATISTICS                                                       │');
  console.log('├───────────────────────────────────────────────────────────────────────────┤');
  console.log(`│ Build Started:     ${new Date(buildLog.started_at).toLocaleString().padEnd(50)} │`);
  console.log(`│ Time Elapsed:      ${formatDuration(buildLog.total_time_minutes).padEnd(50)} │`);
  console.log(`│ Est. Remaining:    ${Math.round(estimatedRemaining)}h (${stats.pending} tasks pending)`.padEnd(76) + '│');
  console.log(`│ Completion Rate:   ${(stats.completed / (buildLog.total_time_minutes / 60 || 1)).toFixed(1)} tasks/hour`.padEnd(76) + '│');
  console.log('└───────────────────────────────────────────────────────────────────────────┘\n');

  // Quick Links
  console.log('💡 Quick Commands:');
  console.log('   • View app:        http://localhost:3000');
  console.log('   • Database GUI:    npm run db:studio');
  console.log('   • Query tasks:     sqlite3 tools/prd.db "SELECT * FROM tasks WHERE status=\'completed\'"');
  console.log('   • Stop dashboard:  Ctrl+C');
  console.log('');
}

/**
 * Announce new completion
 */
function announceCompletion(task: Task) {
  console.log('\n🎉 ' + '='.repeat(75));
  console.log(`   TASK COMPLETED: ${task.task_id}`);
  console.log(`   ${task.title}`);
  console.log(`   Agent: ${task.assigned_agent || 'unknown'} | Epic: ${task.epic}`);
  console.log('='.repeat(78) + '\n');

  // Add to build log
  if (!buildLog.completed_tasks.includes(task.task_id)) {
    buildLog.completed_tasks.push(task.task_id);
    saveBuildLog();
  }
}

/**
 * Monitor and display dashboard
 */
async function monitor() {
  initialize();

  console.log('🚀 Starting Real-Time Build Progress Dashboard...\n');
  console.log('   Monitoring: /Users/captaindev404/Code/club-med/gentil-feedback/tools/prd.db');
  console.log('   Refresh rate: 2 seconds\n');

  // Initial state
  const initialStats = getStats();
  previousCompleted = initialStats.completed;

  // Display dashboard immediately
  displayDashboard();

  // Set up refresh interval
  const interval = setInterval(() => {
    const currentStats = getStats();

    // Check for new completions
    const newCompletions = checkNewCompletions(currentStats.completed);

    // Display dashboard
    displayDashboard();

    // Announce new completions
    newCompletions.forEach((task) => {
      announceCompletion(task);
    });

  }, REFRESH_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n\n👋 Stopping dashboard...');
    saveBuildLog();
    db.close();

    const finalStats = getStats();
    console.log('\n📊 Final Statistics:');
    console.log(`   Completed: ${finalStats.completed}/${finalStats.total} tasks (${finalStats.completionPct}%)`);
    console.log(`   Total Time: ${formatDuration(buildLog.total_time_minutes)}`);
    console.log(`   Log saved to: ${LOG_FILE}\n`);

    process.exit(0);
  });
}

// Run monitor
if (require.main === module) {
  monitor().catch((err) => {
    console.error('❌ Dashboard failed:', err);
    process.exit(1);
  });
}

export { monitor, displayDashboard };
