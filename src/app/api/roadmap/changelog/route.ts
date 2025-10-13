import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';
import { parseJsonField } from '@/lib/roadmap-helpers';
import { format } from 'date-fns';

export interface ChangelogEntry {
  id: string;
  title: string;
  description: string | null;
  stage: string;
  targetDate: string | null;
  progress: number;
  features: { id: string; title: string }[];
  feedbacks: { id: string; title: string }[];
  jiraTickets: string[];
  date: string;
  changeType: 'new' | 'updated' | 'completed';
}

export interface ChangelogResponse {
  entries: ChangelogEntry[];
  summary: {
    total: number;
    new: number;
    updated: number;
    completed: number;
  };
}

/**
 * GET /api/roadmap/changelog - Auto-generate changelog from roadmap updates
 *
 * Query parameters:
 * - since?: ISO date (only items updated since this date)
 * - limit?: number (default: 50)
 * - stage?: RoadmapStage (filter by stage)
 *
 * Features:
 * - Auto-generates changelog entries from roadmap updates
 * - Groups by update type (new, updated, completed)
 * - Includes linked features and feedback
 * - Supports date range filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const since = searchParams.get('since');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const stage = searchParams.get('stage');

    // Build where clause
    const where: any = {
      visibility: 'public', // Only public roadmap items in changelog
    };

    if (since) {
      where.updatedAt = {
        gte: new Date(since),
      };
    }

    if (stage) {
      where.stage = stage;
    }

    // Fetch roadmap items
    const items = await prisma.roadmapItem.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        features: {
          select: {
            id: true,
            title: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Determine change type based on progress and creation date
    const determineChangeType = (
      item: any
    ): ChangelogEntry['changeType'] => {
      if (item.progress === 100) return 'completed';

      const daysSinceCreation = Math.floor(
        (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If created in last 7 days, consider it new
      if (daysSinceCreation <= 7) return 'new';

      // Otherwise it's an update
      return 'updated';
    };

    // Transform to changelog entries
    const entries: ChangelogEntry[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      stage: item.stage,
      targetDate: item.targetDate?.toISOString() || null,
      progress: item.progress,
      features: item.features,
      feedbacks: item.feedbacks,
      jiraTickets: parseJsonField(item.jiraTickets, []),
      date: item.updatedAt.toISOString(),
      changeType: determineChangeType(item),
    }));

    // Calculate summary
    const summary = {
      total: entries.length,
      new: entries.filter((e) => e.changeType === 'new').length,
      updated: entries.filter((e) => e.changeType === 'updated').length,
      completed: entries.filter((e) => e.changeType === 'completed').length,
    };

    const response = NextResponse.json({
      entries,
      summary,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error generating changelog:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate changelog. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/roadmap/changelog - Generate formatted changelog document
 *
 * Request body:
 * - since?: ISO date
 * - format?: 'html' | 'markdown' | 'json'
 *
 * Features:
 * - Generates formatted changelog document
 * - Supports multiple output formats
 * - Groups entries by date and type
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const since = body.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const outputFormat = body.format || 'html';

    // Fetch changelog data
    const where = {
      visibility: 'public' as const,
      updatedAt: {
        gte: new Date(since),
      },
    };

    const items = await prisma.roadmapItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        features: {
          select: {
            id: true,
            title: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Generate changelog content
    let content = '';

    if (outputFormat === 'markdown') {
      content = `# Product Roadmap Changelog\n\n`;
      content += `Generated on ${format(new Date(), 'MMMM dd, yyyy')}\n\n`;

      items.forEach((item) => {
        content += `## ${item.title}\n\n`;
        content += `**Stage:** ${item.stage}\n`;
        content += `**Progress:** ${item.progress}%\n`;
        if (item.targetDate) {
          content += `**Target Date:** ${format(new Date(item.targetDate), 'MMMM dd, yyyy')}\n`;
        }
        if (item.description) {
          content += `\n${item.description}\n`;
        }
        if (item.features.length > 0) {
          content += `\n**Related Features:**\n`;
          item.features.forEach((f) => {
            content += `- ${f.title}\n`;
          });
        }
        content += `\n---\n\n`;
      });
    } else if (outputFormat === 'html') {
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Product Roadmap Changelog</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            h1 { color: #333; border-bottom: 3px solid #0070f3; padding-bottom: 10px; }
            h2 { color: #0070f3; margin-top: 30px; }
            .meta { color: #666; font-size: 14px; }
            .progress { background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
            .progress-bar { background: #0070f3; height: 100%; transition: width 0.3s; }
            .features { list-style: none; padding: 0; }
            .features li { padding: 5px 0; padding-left: 20px; position: relative; }
            .features li:before { content: "→"; position: absolute; left: 0; color: #0070f3; }
          </style>
        </head>
        <body>
          <h1>Product Roadmap Changelog</h1>
          <p class="meta">Generated on ${format(new Date(), 'MMMM dd, yyyy')}</p>
      `;

      items.forEach((item) => {
        content += `
          <h2>${item.title}</h2>
          <div class="meta">
            <strong>Stage:</strong> ${item.stage} |
            <strong>Progress:</strong> ${item.progress}%
            ${item.targetDate ? ` | <strong>Target:</strong> ${format(new Date(item.targetDate), 'MMM dd, yyyy')}` : ''}
          </div>
          <div class="progress">
            <div class="progress-bar" style="width: ${item.progress}%"></div>
          </div>
        `;

        if (item.description) {
          content += `<p>${item.description}</p>`;
        }

        if (item.features.length > 0) {
          content += `<h3>Related Features</h3><ul class="features">`;
          item.features.forEach((f) => {
            content += `<li>${f.title}</li>`;
          });
          content += `</ul>`;
        }
      });

      content += `</body></html>`;
    } else {
      // JSON format
      content = JSON.stringify(items, null, 2);
    }

    const response = NextResponse.json({
      success: true,
      format: outputFormat,
      content,
      itemCount: items.length,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error generating changelog document:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate changelog document. Please try again later.',
      },
      { status: 500 }
    );
  }
}
