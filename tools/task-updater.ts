#!/usr/bin/env ts-node
/**
 * Task Updater - Updates task status in database
 *
 * Can be called by agents to mark tasks as in_progress, completed, or failed
 */

import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(__dirname, 'prd.db');

interface UpdateTaskParams {
  task_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';
  assigned_agent?: string;
  notes?: string;
}

let db: Database.Database;

/**
 * Initialize database
 */
function initialize() {
  db = new Database(DB_PATH);
}

/**
 * Update task status
 */
export function updateTask(params: UpdateTaskParams): boolean {
  if (!db) initialize();

  try {
    const updates: string[] = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [params.status];

    if (params.assigned_agent) {
      updates.push('assigned_agent = ?');
      values.push(params.assigned_agent);
    }

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE task_id = ?
    `;

    values.push(params.task_id);

    const result = db.prepare(query).run(...values);

    if (result.changes > 0) {
      console.log(`✅ Updated ${params.task_id} → ${params.status}${params.assigned_agent ? ` (${params.assigned_agent})` : ''}`);

      // Log to coordination table if exists
      try {
        db.prepare(`
          INSERT INTO redis_coordination (event_type, task_id, agent_id, payload, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          `task_${params.status}`,
          params.task_id,
          params.assigned_agent || null,
          JSON.stringify({ notes: params.notes || null })
        );
      } catch (e) {
        // Coordination table may not exist, ignore
      }

      return true;
    } else {
      console.warn(`⚠️  No task found with ID: ${params.task_id}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Failed to update ${params.task_id}:`, err);
    return false;
  }
}

/**
 * Mark task as in progress
 */
export function startTask(task_id: string, agent_id: string): boolean {
  return updateTask({ task_id, status: 'in_progress', assigned_agent: agent_id });
}

/**
 * Mark task as completed
 */
export function completeTask(task_id: string, agent_id: string, notes?: string): boolean {
  return updateTask({ task_id, status: 'completed', assigned_agent: agent_id, notes });
}

/**
 * Mark task as failed
 */
export function failTask(task_id: string, agent_id: string, notes?: string): boolean {
  return updateTask({ task_id, status: 'failed', assigned_agent: agent_id, notes });
}

/**
 * Batch update multiple tasks
 */
export function batchUpdate(updates: UpdateTaskParams[]): number {
  if (!db) initialize();

  let successCount = 0;

  db.transaction(() => {
    for (const update of updates) {
      if (updateTask(update)) {
        successCount++;
      }
    }
  })();

  console.log(`\n📊 Batch update: ${successCount}/${updates.length} tasks updated\n`);
  return successCount;
}

/**
 * Get task info
 */
export function getTask(task_id: string) {
  if (!db) initialize();

  return db.prepare('SELECT * FROM tasks WHERE task_id = ?').get(task_id);
}

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage:
  ts-node task-updater.ts <command> <task_id> [agent_id] [notes]

Commands:
  start <task_id> <agent_id>           - Mark task as in_progress
  complete <task_id> <agent_id>        - Mark task as completed
  fail <task_id> <agent_id> [notes]    - Mark task as failed
  info <task_id>                       - Show task info
  reset <task_id>                      - Reset task to pending

Examples:
  ts-node task-updater.ts start TASK-030 agent-007
  ts-node task-updater.ts complete TASK-030 agent-007 "Implemented vote weight calculation"
  ts-node task-updater.ts info TASK-030
    `);
    process.exit(1);
  }

  initialize();

  const [command, task_id, agent_id, notes] = args;

  let success = false;

  switch (command) {
    case 'start':
      if (!agent_id) {
        console.error('❌ Agent ID required for start command');
        process.exit(1);
      }
      success = startTask(task_id, agent_id);
      break;

    case 'complete':
      if (!agent_id) {
        console.error('❌ Agent ID required for complete command');
        process.exit(1);
      }
      success = completeTask(task_id, agent_id, notes);
      break;

    case 'fail':
      if (!agent_id) {
        console.error('❌ Agent ID required for fail command');
        process.exit(1);
      }
      success = failTask(task_id, agent_id, notes);
      break;

    case 'info':
      const task = getTask(task_id);
      if (task) {
        console.log('\n📋 Task Info:');
        console.log(JSON.stringify(task, null, 2));
        success = true;
      } else {
        console.error(`❌ Task not found: ${task_id}`);
      }
      break;

    case 'reset':
      success = updateTask({ task_id, status: 'pending' });
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }

  db.close();
  process.exit(success ? 0 : 1);
}
