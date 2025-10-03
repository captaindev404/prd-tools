import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import type { CreateVillageRequest, UpdateVillageRequest } from '@/types/admin';

/**
 * GET /api/admin/villages
 * List all villages with user counts (ADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const villages = await prisma.village.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(villages);
  } catch (error) {
    console.error('Error fetching villages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch villages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/villages
 * Create a new village (ADMIN only)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = (await req.json()) as CreateVillageRequest;
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Village ID and name are required' },
        { status: 400 }
      );
    }

    // Check if village ID already exists
    const existingVillage = await prisma.village.findUnique({
      where: { id },
    });

    if (existingVillage) {
      return NextResponse.json(
        { error: 'Village ID already exists' },
        { status: 400 }
      );
    }

    // Create village
    const village = await prisma.village.create({
      data: {
        id,
        name,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    // Log creation event
    await prisma.event.create({
      data: {
        type: 'admin.village.created',
        userId: user.id,
        payload: JSON.stringify({
          villageId: village.id,
          villageName: village.name,
          createdBy: user.email,
        }),
      },
    });

    return NextResponse.json(village, { status: 201 });
  } catch (error) {
    console.error('Error creating village:', error);
    return NextResponse.json(
      { error: 'Failed to create village' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/villages
 * Update a village (ADMIN only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = (await req.json()) as UpdateVillageRequest;
    const { id, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Village ID is required' },
        { status: 400 }
      );
    }

    const existingVillage = await prisma.village.findUnique({
      where: { id },
    });

    if (!existingVillage) {
      return NextResponse.json({ error: 'Village not found' }, { status: 404 });
    }

    // Update village
    const updatedVillage = await prisma.village.update({
      where: { id },
      data: {
        ...(name && { name }),
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    // Log update event
    await prisma.event.create({
      data: {
        type: 'admin.village.updated',
        userId: user.id,
        payload: JSON.stringify({
          villageId: updatedVillage.id,
          oldName: existingVillage.name,
          newName: updatedVillage.name,
          updatedBy: user.email,
        }),
      },
    });

    return NextResponse.json(updatedVillage);
  } catch (error) {
    console.error('Error updating village:', error);
    return NextResponse.json(
      { error: 'Failed to update village' },
      { status: 500 }
    );
  }
}
