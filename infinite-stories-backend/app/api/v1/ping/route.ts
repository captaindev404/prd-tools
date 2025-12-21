import { NextResponse } from 'next/server';

/**
 * GET /api/ping
 * Simple health check endpoint for Docker/load balancer health checks.
 * Does NOT check database - just verifies the server is running.
 * Use /api/health for comprehensive health checks including DB.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() });
}
