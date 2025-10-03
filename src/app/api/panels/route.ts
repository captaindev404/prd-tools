import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canCreatePanel } from '@/lib/auth-helpers';
import { validateCriteria } from '@/lib/panel-eligibility';
import { applyRateLimit, addRateLimitHeaders } from '@/middleware/rate-limit';

/**
 * GET /api/panels - List panels with pagination and filters
 *
 * Query parameters:
 * - search?: string - Search panels by name (case-insensitive)
 * - createdById?: string - Filter by panel creator
 * - includeArchived?: boolean (default: false) - Include archived panels
 * - archived?: boolean (alias for includeArchived)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 *
 * Access:
 * - RESEARCHER/PM/ADMIN: See all panels (with filters)
 * - Regular users: See only panels they're members of (filters still apply)
 */
export async function GET(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to view panels' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const createdById = searchParams.get('createdById');
    const includeArchived = searchParams.get('includeArchived') === 'true' || searchParams.get('archived') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const canSeeAll = canCreatePanel(user); // RESEARCHER/PM/ADMIN can see all
    const where: any = {};

    // Filter: archived panels
    if (!includeArchived) {
      where.archived = false;
    }

    // Filter: search by name
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Filter: created by specific user
    if (createdById) {
      where.createdById = createdById;
    }

    // If not RESEARCHER/PM/ADMIN, filter to only panels user is member of
    let panelIds: string[] | undefined;
    if (!canSeeAll) {
      const memberships = await prisma.panelMembership.findMany({
        where: { userId: user.id },
        select: { panelId: true },
      });
      panelIds = memberships.map((m) => m.panelId);

      if (panelIds.length === 0) {
        // User is not a member of any panels
        return NextResponse.json({
          items: [],
          total: 0,
          page,
          limit,
          hasMore: false,
        });
      }

      where.id = { in: panelIds };
    }

    // Fetch panels with member counts and creator details
    const [panels, total] = await Promise.all([
      prisma.panel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              displayName: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              memberships: true,
            },
          },
        },
      }),
      prisma.panel.count({ where }),
    ]);

    // Map panels to include memberCount and creator
    const panelsWithMetadata = panels.map((panel) => ({
      ...panel,
      memberCount: panel._count.memberships,
      creator: panel.createdBy,
      _count: undefined, // Remove _count from response
    }));

    const response = NextResponse.json({
      items: panelsWithMetadata,
      total,
      page,
      limit,
      hasMore: skip + panels.length < total,
    });

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error fetching panels:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch panels. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/panels - Create a new panel
 *
 * Request body:
 * - name: string (required, 3-100 chars)
 * - description?: string (max 1000 chars)
 * - eligibilityRules: object (required)
 * - sizeTarget?: number (max panel size)
 *
 * Access: RESEARCHER/PM/ADMIN only
 */
export async function POST(request: NextRequest) {
  // Apply rate limit
  const rateLimitResult = await applyRateLimit(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to create panels' },
        { status: 401 }
      );
    }

    if (!canCreatePanel(user)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to create panels. Only RESEARCHER, PM, or ADMIN roles can create panels.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation
    const errors: Array<{ field: string; message: string }> = [];

    if (!body.name || typeof body.name !== 'string') {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (body.name.length < 3) {
      errors.push({ field: 'name', message: 'Name must be at least 3 characters' });
    } else if (body.name.length > 100) {
      errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
    }

    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== 'string') {
        errors.push({ field: 'description', message: 'Description must be a string' });
      } else if (body.description.length > 500) {
        errors.push({ field: 'description', message: 'Description must not exceed 500 characters' });
      }
    }

    if (!body.eligibilityRules) {
      errors.push({ field: 'eligibilityRules', message: 'Eligibility rules are required' });
    } else {
      const criteriaValidation = validateCriteria(body.eligibilityRules);
      if (!criteriaValidation.valid) {
        errors.push({
          field: 'eligibilityRules',
          message: `Invalid eligibility rules: ${criteriaValidation.errors.join(', ')}`,
        });
      }
    }

    if (body.sizeTarget !== undefined && body.sizeTarget !== null) {
      if (typeof body.sizeTarget !== 'number' || body.sizeTarget < 1) {
        errors.push({ field: 'sizeTarget', message: 'Size target must be a positive number' });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please check your input and try again',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Create panel
    const panel = await prisma.panel.create({
      data: {
        id: `pan_${ulid()}`,
        name: body.name,
        description: body.description || null,
        eligibilityRules: JSON.stringify(body.eligibilityRules),
        sizeTarget: body.sizeTarget || null,
        quotas: '[]',
        createdById: user.id,
      },
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    // Fetch creator details
    const creator = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'panel.created',
        userId: user.id,
        payload: JSON.stringify({
          panelId: panel.id,
          panelName: panel.name,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          ...panel,
          memberCount: panel._count.memberships,
          creator,
        },
        message: 'Panel created successfully',
      },
      { status: 201 }
    );

    return addRateLimitHeaders(response, request);
  } catch (error) {
    console.error('Error creating panel:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create panel. Please try again later.',
      },
      { status: 500 }
    );
  }
}
