import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/health
 * Health check endpoint for uptime monitoring
 */
export async function GET(req: NextRequest) {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'CLERK_SECRET_KEY',
      'OPENAI_API_KEY',
      'R2_BUCKET_NAME',
    ];

    const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

    if (missingEnvVars.length > 0) {
      return errorResponse(
        'ConfigurationError',
        `Missing environment variables: ${missingEnvVars.join(', ')}`,
        503
      );
    }

    return successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    });
  } catch (error) {
    return errorResponse(
      'ServiceUnavailable',
      'Health check failed',
      503,
      {
        error: (error as Error).message,
      }
    );
  }
}
