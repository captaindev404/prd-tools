/**
 * Batch Operations API
 *
 * Handles batch create/update/delete operations for efficient data migration
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/client';
import type { PrismaClient } from '@prisma/client';

/**
 * POST /api/batch/heroes
 * Batch create heroes
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { heroes } = body;

    if (!Array.isArray(heroes)) {
      return NextResponse.json(
        { error: 'Invalid request: heroes must be an array' },
        { status: 400 }
      );
    }

    // Validate batch size (max 100 heroes per batch)
    if (heroes.length > 100) {
      return NextResponse.json(
        { error: 'Batch size too large: maximum 100 heroes per request' },
        { status: 400 }
      );
    }

    const results = {
      created: [] as any[],
      failed: [] as any[],
      total: heroes.length,
    };

    // Create heroes in transaction for data consistency
    await prisma.$transaction(async (tx: any) => {
      for (const heroData of heroes) {
        try {
          const hero = await tx.hero.create({
            data: {
              userId: session.user.id,
              name: heroData.name,
              age: heroData.age,
              traits: heroData.traits || [],
              specialAbilities: heroData.specialAbilities,
              avatarUrl: heroData.avatarUrl,
              avatarPrompt: heroData.avatarPrompt,
              avatarGenerationId: heroData.avatarGenerationId,
              hairColor: heroData.hairColor,
              eyeColor: heroData.eyeColor,
              skinTone: heroData.skinTone,
              height: heroData.height,
            },
          });

          results.created.push({
            localId: heroData.id, // Original ID from iOS
            serverId: hero.id,    // New backend ID
            name: hero.name,
          });

        } catch (error: any) {
          results.failed.push({
            localId: heroData.id,
            name: heroData.name,
            error: error.message,
          });
        }
      }
    });

    return NextResponse.json({
      success: results.failed.length === 0,
      created: results.created.length,
      failed: results.failed.length,
      total: results.total,
      results,
    });

  } catch (error: any) {
    console.error('Batch heroes error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
