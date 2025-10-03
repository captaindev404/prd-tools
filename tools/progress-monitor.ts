#!/usr/bin/env ts-node
/**
 * Progress Monitor for Odyssey Feedback Orchestrator
 *
 * Real-time dashboard showing task progress, active agents, and errors
 * Updates every 5 seconds
 */

import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NAMESPACE = 'odyssey';
const REFRESH_INTERVAL = 5000; // 5 seconds

let redis: ReturnType<typeof createClient>;

/**
 * Initialize Redis connection
 */
async function initialize() {
  redis = createClient({ url: REDIS_URL });
  redis.on('error', (err) => console.error('Redis error:', err));
  await redis.connect();
}

/**
 * Clear screen (cross-platform)
 */
function clearScreen() {
  process.stdout.write('\x1Bc');
}

/**
 * Format timestamp
 */
function formatTime(isoString: string): string {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleTimeString();
}

/**
 * Display progress dashboard
 */
async function displayDashboard() {
  clearScreen();

  const now = new Date().toLocaleString();

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ODYSSEY FEEDBACK - AGENT ORCHESTRATION DASHBOARD        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`  Last Updated: ${now}\n`);

  // Get progress metrics
  const progress = await redis.hGetAll(`${NAMESPACE}:progress`);
  const total = parseInt(progress.total || '0');
  const completed = parseInt(progress.completed || '0');
  const inProgress = parseInt(progress.in_progress || '0');
  const pending = parseInt(progress.pending || '0');
  const blocked = parseInt(progress.blocked || '0');
  const failed = parseInt(progress.failed || '0');

  // Calculate percentage
  const completionPct = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

  // Progress bar
  const barLength = 50;
  const completedBars = Math.round((completed / total) * barLength);
  const progressBar = '█'.repeat(completedBars) + '░'.repeat(barLength - completedBars);

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ OVERALL PROGRESS                                            │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ [${progressBar}] ${completionPct}% │`);
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ Total Tasks:       ${total.toString().padStart(4)}                                        │`);
  console.log(`│ ✅ Completed:      ${completed.toString().padStart(4)}  (${completionPct}%)                           │`);
  console.log(`│ ⚙️  In Progress:    ${inProgress.toString().padStart(4)}                                        │`);
  console.log(`│ 📋 Pending:        ${pending.toString().padStart(4)}                                        │`);
  console.log(`│ ⏸️  Blocked:        ${blocked.toString().padStart(4)}  (waiting on dependencies)              │`);
  console.log(`│ ❌ Failed:         ${failed.toString().padStart(4)}                                        │`);
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // Active agents
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ ACTIVE AGENTS                                               │');
  console.log('├─────────────────────────────────────────────────────────────┤');

  const agentKeys = await redis.keys(`${NAMESPACE}:agent:*`);

  if (agentKeys.length === 0) {
    console.log('│ No active agents                                            │');
  } else {
    for (const key of agentKeys.slice(0, 5)) {
      const agent = await redis.hGetAll(key);
      const agentId = key.split(':').pop() || 'unknown';
      const status = agent.status || 'unknown';
      const task = agent.current_task || 'none';
      const type = agent.agent_type || 'unknown';

      const statusIcon = status === 'working' ? '⚙️' : status === 'idle' ? '💤' : '✅';
      console.log(`│ ${statusIcon} ${agentId.padEnd(15)} | ${type.substring(0, 20).padEnd(20)} | ${task.padEnd(10)} │`);
    }
  }

  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // Recent errors
  const errors = await redis.lRange(`${NAMESPACE}:errors:list`, 0, 9);

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ RECENT ERRORS                                               │');
  console.log('├─────────────────────────────────────────────────────────────┤');

  if (errors.length === 0) {
    console.log('│ No errors reported ✨                                       │');
  } else {
    errors.forEach((error, i) => {
      const truncated = error.substring(0, 55);
      console.log(`│ ${(i + 1).toString().padStart(2)}. ${truncated.padEnd(55)} │`);
    });
  }

  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // Task queue status
  const queueLength = await redis.lLen(`${NAMESPACE}:task:queue`);

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ TASK QUEUE                                                  │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ Tasks in queue: ${queueLength.toString().padStart(4)}                                       │`);

  if (queueLength > 0) {
    const nextTasks = await redis.lRange(`${NAMESPACE}:task:queue`, -5, -1);
    console.log('│ Next tasks to process:                                      │');

    nextTasks.reverse().forEach((taskId, i) => {
      console.log(`│   ${(i + 1)}. ${taskId.padEnd(50)} │`);
    });
  }

  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // Recent completions
  const events = await redis.xRevRange(`${NAMESPACE}:events`, '+', '-', { COUNT: 5 });

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ RECENT ACTIVITY                                             │');
  console.log('├─────────────────────────────────────────────────────────────┤');

  if (events.length === 0) {
    console.log('│ No activity yet                                             │');
  } else {
    events.forEach((event) => {
      const data = event.message;
      const type = data.event_type || 'unknown';
      const taskId = data.task_id || 'N/A';
      const timestamp = formatTime(data.timestamp);

      const icon = type === 'task_completed' ? '✅' :
        type === 'task_started' ? '🚀' :
          type === 'task_failed' ? '❌' : 'ℹ️';

      console.log(`│ ${icon} ${type.padEnd(20)} | ${taskId.padEnd(12)} | ${timestamp.padEnd(12)} │`);
    });
  }

  console.log('└─────────────────────────────────────────────────────────────┘\n');

  console.log('💡 Commands:');
  console.log('   • View queue:        redis-cli LRANGE odyssey:task:queue 0 -1');
  console.log('   • View all errors:   redis-cli LRANGE odyssey:errors:list 0 -1');
  console.log('   • View events:       redis-cli XRANGE odyssey:events - +');
  console.log('   • Clear errors:      redis-cli DEL odyssey:errors:list');
  console.log('\n   Press Ctrl+C to exit\n');
}

/**
 * Main monitoring loop
 */
async function monitor() {
  await initialize();

  console.log('🚀 Starting progress monitor...\n');

  // Initial display
  await displayDashboard();

  // Refresh every 5 seconds
  setInterval(async () => {
    try {
      await displayDashboard();
    } catch (err) {
      console.error('Error updating dashboard:', err);
    }
  }, REFRESH_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down monitor...');
    await redis.quit();
    process.exit(0);
  });
}

// Run monitor
if (require.main === module) {
  monitor().catch((err) => {
    console.error('❌ Monitor failed:', err);
    process.exit(1);
  });
}

export { monitor, displayDashboard };
