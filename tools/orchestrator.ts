#!/usr/bin/env ts-node
/**
 * Odyssey Feedback Agent Orchestrator
 *
 * Coordinates multiple Claude Code agents using Redis and prd.db
 * - Loads tasks from SQLite database
 * - Distributes work via Redis task queue
 * - Tracks progress and dependencies
 * - Logs results back to database
 */

import { createClient } from 'redis';
import Database from 'better-sqlite3';
import { spawn } from 'child_process';
import * as path from 'path';

// Types
interface Task {
  task_id: string;
  title: string;
  description: string;
  category: string;
  epic: string;
  priority: number;
  estimated_hours: number;
  status: string;
  depends_on: string | null; // JSON array
  assigned_agent: string | null;
  tech_stack: string | null;
  files_to_modify: string | null;
  acceptance_criteria: string;
}

interface TaskResult {
  task_id: string;
  agent_id: string;
  started_at: string;
  completed_at: string;
  files_modified: string[];
  notes: string;
  errors: string[];
}

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DB_PATH = path.join(__dirname, 'prd.db');
const MAX_PARALLEL_AGENTS = parseInt(process.env.MAX_AGENTS || '3');
const NAMESPACE = 'odyssey';

// Redis client
let redis: ReturnType<typeof createClient>;

// SQLite client
let db: Database.Database;

/**
 * Initialize Redis and SQLite connections
 */
async function initialize() {
  console.log('🚀 Odyssey Feedback Orchestrator starting...\n');

  // Connect to Redis
  redis = createClient({ url: REDIS_URL });
  redis.on('error', (err) => console.error('Redis error:', err));
  await redis.connect();
  console.log('✅ Connected to Redis');

  // Connect to SQLite
  db = new Database(DB_PATH);
  console.log('✅ Connected to prd.db\n');

  // Cleanup old state
  await cleanupRedis();
}

/**
 * Clear old Redis state before starting
 */
async function cleanupRedis() {
  console.log('🧹 Cleaning up old Redis state...');

  const keys = await redis.keys(`${NAMESPACE}:*`);
  if (keys.length > 0) {
    await redis.del(keys);
    console.log(`   Deleted ${keys.length} old keys`);
  }

  console.log('✅ Redis cleanup complete\n');
}

/**
 * Load tasks from database and populate Redis
 */
async function loadTasks(): Promise<Task[]> {
  console.log('📚 Loading tasks from prd.db...');

  const tasks = db.prepare(`
    SELECT * FROM tasks
    WHERE status = 'pending'
    ORDER BY priority ASC, id ASC
  `).all() as Task[];

  console.log(`   Found ${tasks.length} pending tasks\n`);

  // Initialize progress counter
  await redis.hSet(`${NAMESPACE}:progress`, {
    total: tasks.length.toString(),
    pending: tasks.length.toString(),
    in_progress: '0',
    completed: '0',
    failed: '0',
    blocked: '0'
  });

  return tasks;
}

/**
 * Parse JSON dependencies from task
 */
function parseDependencies(task: Task): string[] {
  if (!task.depends_on) return [];
  try {
    return JSON.parse(task.depends_on);
  } catch {
    return [];
  }
}

/**
 * Check if all dependencies are completed
 */
async function dependenciesMet(task: Task): Promise<boolean> {
  const deps = parseDependencies(task);
  if (deps.length === 0) return true;

  for (const dep of deps) {
    const status = await redis.get(`${NAMESPACE}:task:${dep}:status`);
    if (status !== 'completed') {
      return false;
    }
  }

  return true;
}

/**
 * Populate task queue with tasks that have no pending dependencies
 */
async function populateTaskQueue(tasks: Task[]) {
  console.log('📋 Populating task queue...');

  let queuedCount = 0;
  let blockedCount = 0;

  for (const task of tasks) {
    const deps = parseDependencies(task);

    // Set task dependencies in Redis
    if (deps.length > 0) {
      await redis.sAdd(`${NAMESPACE}:task:${task.task_id}:dependencies`, deps);
    }

    // Check if ready to queue
    const ready = await dependenciesMet(task);

    if (ready) {
      await redis.lPush(`${NAMESPACE}:task:queue`, task.task_id);
      await redis.set(`${NAMESPACE}:task:${task.task_id}:status`, 'pending');
      queuedCount++;
    } else {
      await redis.set(`${NAMESPACE}:task:${task.task_id}:status`, 'blocked');
      await redis.hIncrBy(`${NAMESPACE}:progress`, 'blocked', 1);
      await redis.hIncrBy(`${NAMESPACE}:progress`, 'pending', -1);
      blockedCount++;
    }

    // Store task metadata in Redis
    await redis.set(
      `${NAMESPACE}:task:${task.task_id}:meta`,
      JSON.stringify({
        title: task.title,
        description: task.description,
        category: task.category,
        tech_stack: task.tech_stack,
        acceptance_criteria: task.acceptance_criteria
      })
    );
  }

  console.log(`   ✅ Queued: ${queuedCount} tasks`);
  console.log(`   ⏸️  Blocked: ${blockedCount} tasks (waiting on dependencies)\n`);
}

/**
 * Determine agent type based on task category and tech stack
 */
function determineAgentType(task: Task): string {
  const category = task.category.toLowerCase();
  const techStack = (task.tech_stack || '').toLowerCase();

  // Map categories to agent types
  if (category.includes('ui') || techStack.includes('shadcn')) {
    return 'shadcn-design-engineer';
  }

  if (category.includes('backend') || category.includes('api') ||
      techStack.includes('nextjs') || techStack.includes('prisma')) {
    return 'fullstack-nodejs-nextjs-engineer';
  }

  // Default to general purpose for setup, docs, etc.
  return 'general-purpose';
}

/**
 * Launch a coding agent for a specific task
 */
async function launchAgent(taskId: string, agentId: string): Promise<void> {
  console.log(`🤖 Agent ${agentId} starting task ${taskId}...`);

  // Get task metadata
  const metaStr = await redis.get(`${NAMESPACE}:task:${taskId}:meta`);
  if (!metaStr) {
    console.error(`   ❌ No metadata found for ${taskId}`);
    return;
  }

  const meta = JSON.parse(metaStr);
  const task = db.prepare('SELECT * FROM tasks WHERE task_id = ?').get(taskId) as Task;
  const agentType = determineAgentType(task);

  // Update status
  await redis.set(`${NAMESPACE}:task:${taskId}:status`, 'assigned');
  await redis.hSet(`${NAMESPACE}:agent:${agentId}`, {
    agent_type: agentType,
    current_task: taskId,
    status: 'working',
    started_at: new Date().toISOString()
  });
  await redis.expire(`${NAMESPACE}:agent:${agentId}`, 86400); // 24h TTL

  // Mark in progress
  await redis.set(`${NAMESPACE}:task:${taskId}:status`, 'in_progress');
  await redis.hIncrBy(`${NAMESPACE}:progress`, 'pending', -1);
  await redis.hIncrBy(`${NAMESPACE}:progress`, 'in_progress', 1);

  const startTime = new Date().toISOString();

  // Build agent prompt
  const prompt = buildAgentPrompt(task, meta);

  // Log event
  await redis.xAdd(`${NAMESPACE}:events`, '*', {
    event_type: 'task_started',
    task_id: taskId,
    agent_id: agentId,
    agent_type: agentType,
    timestamp: startTime
  });

  console.log(`   📝 Task: ${meta.title}`);
  console.log(`   🎯 Agent Type: ${agentType}`);
  console.log(`   ⏱️  Started: ${startTime}\n`);

  // In a real implementation, this would launch an actual Claude Code agent
  // For now, we'll simulate the agent completing the task
  // TODO: Integrate with actual agent launching mechanism

  // Simulate work (in production, this would be the actual agent execution)
  console.log(`   ⚙️  Agent ${agentId} would execute task using ${agentType} agent...`);
  console.log(`   📄 Prompt: ${prompt.substring(0, 100)}...\n`);

  // For demonstration, mark as completed immediately
  // In production, you would wait for the agent to finish
  await completeTask(taskId, agentId, {
    task_id: taskId,
    agent_id: agentId,
    started_at: startTime,
    completed_at: new Date().toISOString(),
    files_modified: [],
    notes: 'Task queued for agent execution (simulated)',
    errors: []
  });
}

/**
 * Build detailed prompt for agent
 */
function buildAgentPrompt(task: Task, meta: any): string {
  return `
You are a coding agent working on the Odyssey Feedback project.

TASK ID: ${task.task_id}
TITLE: ${meta.title}
CATEGORY: ${meta.category}
PRIORITY: ${task.priority}
ESTIMATED HOURS: ${task.estimated_hours}

DESCRIPTION:
${meta.description}

TECH STACK:
${meta.tech_stack || 'N/A'}

ACCEPTANCE CRITERIA:
${meta.acceptance_criteria}

INSTRUCTIONS:
1. Read the task description carefully
2. Implement the required changes
3. Follow the acceptance criteria exactly
4. Test your changes
5. Report results to Redis using the following keys:
   - Set odyssey:task:${task.task_id}:status to "completed"
   - Set odyssey:task:${task.task_id}:result with JSON containing:
     - files_modified: array of file paths
     - notes: brief summary of changes
     - errors: array of any errors encountered

6. Update progress counter:
   - redis-cli HINCRBY odyssey:progress in_progress -1
   - redis-cli HINCRBY odyssey:progress completed 1

Redis server: ${REDIS_URL}
Database: ${DB_PATH}

Begin implementation now.
`.trim();
}

/**
 * Mark task as completed and log results
 */
async function completeTask(taskId: string, agentId: string, result: TaskResult) {
  console.log(`✅ Task ${taskId} completed by agent ${agentId}`);

  // Store result
  await redis.set(`${NAMESPACE}:task:${taskId}:result`, JSON.stringify(result));
  await redis.set(`${NAMESPACE}:task:${taskId}:status`, 'completed');

  // Update progress
  await redis.hIncrBy(`${NAMESPACE}:progress`, 'in_progress', -1);
  await redis.hIncrBy(`${NAMESPACE}:progress`, 'completed', 1);

  // Update agent status
  await redis.hSet(`${NAMESPACE}:agent:${agentId}`, {
    status: 'idle',
    current_task: ''
  });

  // Update database
  db.prepare(`
    UPDATE tasks
    SET status = 'completed',
        assigned_agent = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE task_id = ?
  `).run(agentId, taskId);

  // Log coordination event
  await redis.xAdd(`${NAMESPACE}:events`, '*', {
    event_type: 'task_completed',
    task_id: taskId,
    agent_id: agentId,
    timestamp: result.completed_at
  });

  console.log(`   📁 Files modified: ${result.files_modified.join(', ') || 'none'}`);
  console.log(`   📝 Notes: ${result.notes}\n`);

  // Check if any blocked tasks can now proceed
  await unblockDependentTasks(taskId);
}

/**
 * Check for tasks blocked by this task and unblock them
 */
async function unblockDependentTasks(completedTaskId: string) {
  // Find all blocked tasks
  const allTasks = db.prepare(`
    SELECT task_id, depends_on
    FROM tasks
    WHERE status = 'blocked'
  `).all() as Task[];

  for (const task of allTasks) {
    const deps = parseDependencies(task);

    // Check if this completed task was blocking it
    if (!deps.includes(completedTaskId)) continue;

    // Check if all dependencies now met
    const ready = await dependenciesMet(task);

    if (ready) {
      console.log(`🔓 Unblocking task ${task.task_id} (dependencies satisfied)`);

      // Move from blocked to pending queue
      await redis.lPush(`${NAMESPACE}:task:queue`, task.task_id);
      await redis.set(`${NAMESPACE}:task:${task.task_id}:status`, 'pending');
      await redis.hIncrBy(`${NAMESPACE}:progress`, 'blocked', -1);
      await redis.hIncrBy(`${NAMESPACE}:progress`, 'pending', 1);

      db.prepare('UPDATE tasks SET status = ? WHERE task_id = ?')
        .run('pending', task.task_id);
    }
  }
}

/**
 * Display progress dashboard
 */
async function displayProgress() {
  const progress = await redis.hGetAll(`${NAMESPACE}:progress`);
  const errors = await redis.lRange(`${NAMESPACE}:errors:list`, 0, 4);

  console.log('\n📊 === PROGRESS DASHBOARD ===');
  console.log(`Total Tasks:      ${progress.total || 0}`);
  console.log(`✅ Completed:     ${progress.completed || 0}`);
  console.log(`⚙️  In Progress:   ${progress.in_progress || 0}`);
  console.log(`📋 Pending:       ${progress.pending || 0}`);
  console.log(`⏸️  Blocked:       ${progress.blocked || 0}`);
  console.log(`❌ Failed:        ${progress.failed || 0}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Recent Errors:');
    errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }

  console.log('='.repeat(40) + '\n');
}

/**
 * Main orchestration loop
 */
async function orchestrate() {
  await initialize();

  // Load and queue tasks
  const tasks = await loadTasks();
  await populateTaskQueue(tasks);

  // Display initial progress
  await displayProgress();

  // Simulated agent launches (in production, this would be a work queue)
  console.log(`🚀 Ready to launch up to ${MAX_PARALLEL_AGENTS} parallel agents\n`);
  console.log('📝 In a production setup, agents would now:');
  console.log('   1. Pop tasks from Redis queue: RPOP odyssey:task:queue');
  console.log('   2. Check dependencies are met');
  console.log('   3. Execute the task (write code, run tests, etc.)');
  console.log('   4. Report results back to Redis');
  console.log('   5. Update prd.db status\n');

  // Example: Launch first agent for demonstration
  const firstTaskId = await redis.rPop(`${NAMESPACE}:task:queue`);
  if (firstTaskId) {
    await launchAgent(firstTaskId, 'agent-001');
    await displayProgress();
  }

  console.log('✨ Orchestrator simulation complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Start Redis: redis-server');
  console.log('   2. Run this orchestrator: ts-node tools/orchestrator.ts');
  console.log('   3. Monitor progress: watch -n 5 "redis-cli HGETALL odyssey:progress"');
  console.log('   4. View queue: redis-cli LRANGE odyssey:task:queue 0 -1');
  console.log('   5. Check errors: redis-cli LRANGE odyssey:errors:list 0 -1\n');

  // Cleanup
  await redis.quit();
  db.close();
}

// Run orchestrator
if (require.main === module) {
  orchestrate().catch((err) => {
    console.error('❌ Orchestrator failed:', err);
    process.exit(1);
  });
}

export { orchestrate, loadTasks, populateTaskQueue, launchAgent };
