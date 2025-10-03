#!/usr/bin/env ts-node
/**
 * Web-Based Build Progress Dashboard
 *
 * HTTP server that displays real-time build progress in a web browser
 * Access at http://localhost:3001
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as http from 'http';
import * as fs from 'fs';

const DB_PATH = path.join(__dirname, 'prd.db');
const PORT = 3002;
const REFRESH_INTERVAL = 2000; // 2 seconds

let db: Database.Database;

interface Task {
  task_id: string;
  title: string;
  category: string;
  epic: string;
  priority: number;
  status: string;
  assigned_agent: string | null;
  updated_at: string;
}

function initialize() {
  db = new Database(DB_PATH);
}

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

function getRecentlyCompleted(limit: number = 10): Task[] {
  return db.prepare(`
    SELECT * FROM tasks
    WHERE status = 'completed'
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(limit) as Task[];
}

function getInProgress(): Task[] {
  return db.prepare(`
    SELECT * FROM tasks
    WHERE status = 'in_progress'
    ORDER BY updated_at DESC
  `).all() as Task[];
}

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

function generateHTML() {
  const stats = getStats();
  const recentlyCompleted = getRecentlyCompleted(10);
  const inProgress = getInProgress();
  const epicBreakdown = getEpicBreakdown();
  const now = new Date().toLocaleString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Odyssey Feedback - Build Dashboard</title>
  <meta http-equiv="refresh" content="2">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #667eea;
    }

    .header .subtitle {
      color: #666;
      font-size: 14px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
    }

    .stat-card .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }

    .stat-card.completed .value {
      color: #10b981;
    }

    .stat-card.in-progress .value {
      color: #f59e0b;
    }

    .stat-card.pending .value {
      color: #6b7280;
    }

    .progress-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .progress-bar-container {
      background: #e5e7eb;
      border-radius: 999px;
      height: 40px;
      overflow: hidden;
      margin: 20px 0;
      position: relative;
    }

    .progress-bar {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      height: 100%;
      transition: width 0.5s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }

    .section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .section h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }

    .task-list {
      list-style: none;
    }

    .task-item {
      padding: 15px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .task-item:last-child {
      border-bottom: none;
    }

    .task-item .task-id {
      font-weight: bold;
      color: #667eea;
      margin-right: 10px;
    }

    .task-item .task-title {
      flex: 1;
    }

    .task-item .task-meta {
      font-size: 12px;
      color: #666;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge.completed {
      background: #d1fae5;
      color: #065f46;
    }

    .badge.in-progress {
      background: #fef3c7;
      color: #92400e;
    }

    .epic-grid {
      display: grid;
      gap: 15px;
    }

    .epic-item {
      padding: 15px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .epic-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .epic-name {
      font-weight: bold;
      color: #333;
    }

    .epic-stats {
      font-size: 12px;
      color: #666;
    }

    .epic-progress-bar {
      background: #e5e7eb;
      border-radius: 999px;
      height: 20px;
      overflow: hidden;
    }

    .epic-progress-fill {
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      height: 100%;
      transition: width 0.5s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: bold;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #9ca3af;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .auto-refresh {
      animation: pulse 2s ease-in-out infinite;
      display: inline-block;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Odyssey Feedback - Build Dashboard</h1>
      <div class="subtitle">
        Last updated: ${now} <span class="auto-refresh">●</span> Auto-refreshing every 2 seconds
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total Tasks</div>
        <div class="value">${stats.total}</div>
      </div>
      <div class="stat-card completed">
        <div class="label">✅ Completed</div>
        <div class="value">${stats.completed}</div>
      </div>
      <div class="stat-card in-progress">
        <div class="label">⚙️ In Progress</div>
        <div class="value">${stats.inProgress}</div>
      </div>
      <div class="stat-card pending">
        <div class="label">📋 Pending</div>
        <div class="value">${stats.pending}</div>
      </div>
      <div class="stat-card">
        <div class="label">⏸️ Blocked</div>
        <div class="value">${stats.blocked}</div>
      </div>
      <div class="stat-card">
        <div class="label">❌ Failed</div>
        <div class="value">${stats.failed}</div>
      </div>
    </div>

    <div class="progress-section">
      <h2>Overall Progress</h2>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${stats.completionPct}%">
          ${stats.completionPct}% (${stats.completed}/${stats.total})
        </div>
      </div>
    </div>

    ${inProgress.length > 0 ? `
    <div class="section">
      <h2>⚙️ Tasks In Progress</h2>
      <ul class="task-list">
        ${inProgress.map(task => `
          <li class="task-item">
            <div>
              <span class="task-id">${task.task_id}</span>
              <span class="task-title">${task.title}</span>
            </div>
            <div class="task-meta">
              <span class="badge in-progress">${task.assigned_agent || 'Unassigned'}</span>
              <span>${task.epic}</span>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="section">
      <h2>✅ Recently Completed</h2>
      ${recentlyCompleted.length > 0 ? `
      <ul class="task-list">
        ${recentlyCompleted.map(task => `
          <li class="task-item">
            <div>
              <span class="task-id">${task.task_id}</span>
              <span class="task-title">${task.title}</span>
            </div>
            <div class="task-meta">
              <span class="badge completed">${task.assigned_agent || 'System'}</span>
              <span>${new Date(task.updated_at).toLocaleTimeString()}</span>
            </div>
          </li>
        `).join('')}
      </ul>
      ` : `
      <div class="empty-state">No completed tasks yet</div>
      `}
    </div>

    <div class="section">
      <h2>📦 Progress by Epic</h2>
      <div class="epic-grid">
        ${epicBreakdown.map(epic => {
          const pct = ((epic.completed / epic.total) * 100).toFixed(0);
          return `
            <div class="epic-item">
              <div class="epic-header">
                <div class="epic-name">${epic.epic}</div>
                <div class="epic-stats">${epic.completed}/${epic.total} tasks</div>
              </div>
              <div class="epic-progress-bar">
                <div class="epic-progress-fill" style="width: ${pct}%">
                  ${pct}%
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function startServer() {
  initialize();

  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(generateHTML());
    } else if (req.url === '/api/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        stats: getStats(),
        recentlyCompleted: getRecentlyCompleted(10),
        inProgress: getInProgress(),
        epicBreakdown: getEpicBreakdown()
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║          WEB DASHBOARD STARTED                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

🌐 Dashboard URL: http://localhost:${PORT}

Features:
  ✓ Auto-refreshes every 2 seconds
  ✓ Visual progress bars
  ✓ Real-time task tracking
  ✓ Epic breakdown
  ✓ Beautiful web interface

Press Ctrl+C to stop

Monitoring: ${DB_PATH}
    `);
  });

  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping web dashboard...');
    db.close();
    server.close();
    process.exit(0);
  });
}

if (require.main === module) {
  startServer();
}

export { startServer };
