import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/clerk';
import {
  successResponse,
  errorResponse,
  handleApiError,
  validateRequiredFields,
} from '@/lib/utils/api-response';
import { generateStory, extractScenesFromStory } from '@/lib/openai/story-generator';
import { enforceRateLimit, recordApiUsage } from '@/lib/rate-limit/db-rate-limiter';
import type { SupportedLanguage } from '@/lib/openai/client';

/**
 * POST /api/stories
 * Generate a new personalized story for a hero
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await getOrCreateUser();
    const body = await req.json();

    // Validate required fields
    const validation = validateRequiredFields(body, ['heroId', 'language']);
    if (!validation.valid) {
      return errorResponse(
        'ValidationError',
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Get the hero
    const hero = await prisma.hero.findUnique({
      where: { id: body.heroId },
      include: {
        visualProfile: true,
      },
    });

    if (!hero) {
      return errorResponse('NotFound', 'Hero not found', 404);
    }

    if (hero.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this hero', 403);
    }

    // Check rate limit
    await enforceRateLimit(user.id, 'story_generation');

    // Generate the story
    const language = body.language as SupportedLanguage;
    const story = await generateStory({
      heroName: hero.name,
      heroAge: hero.age,
      heroTraits: hero.traits as string[],
      specialAbilities: hero.specialAbilities as string[] | undefined,
      eventType: body.eventType,
      customPrompt: body.customPrompt,
      language,
      maxTokens: body.maxTokens || 2000,
    });

    // Extract scenes for potential illustrations
    const scenes = await extractScenesFromStory(story.content, language);

    // Create story in database
    const createdStory = await prisma.story.create({
      data: {
        heroId: hero.id,
        userId: user.id,
        title: story.title,
        content: story.content,
        language,
        eventType: body.eventType || null,
        customEventId: body.customEventId || null,
        audioGenerationStatus: 'pending',
        illustrationStatus: scenes.length > 0 ? 'pending' : 'none',
        generationMetadata: {
          prompt: {
            heroName: hero.name,
            heroAge: hero.age,
            heroTraits: hero.traits,
            eventType: body.eventType,
            customPrompt: body.customPrompt,
          },
          scenesExtracted: scenes.length,
        },
      },
    });

    // Create scene placeholders for illustrations
    if (scenes.length > 0) {
      await prisma.storyIllustration.createMany({
        data: scenes.map((scene, index) => ({
          storyId: createdStory.id,
          sceneDescription: scene.sceneDescription,
          imageUrl: '', // Will be populated when generated
          imagePrompt: scene.sceneDescription,
          displayOrder: index,
          audioTimestamp: scene.audioTimestamp,
          audioDuration: scene.estimatedDuration,
          generationStatus: 'pending',
        })),
      });

      // Update illustration count
      await prisma.story.update({
        where: { id: createdStory.id },
        data: {
          illustrationCount: scenes.length,
        },
      });
    }

    // Record API usage
    const duration = Date.now() - startTime;
    await recordApiUsage({
      userId: user.id,
      operation: 'story_generation',
      model: 'gpt-4o',
      tokensUsed: 2000, // Estimate - would need actual token count from response
      estimatedCost: 0.03, // Approximate GPT-4o cost
      requestDuration: duration,
      success: true,
    });

    // Update user stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalStoriesGenerated: { increment: 1 },
        lastStoryGeneratedAt: new Date(),
      },
    });

    return successResponse(
      {
        story: createdStory,
        scenes: scenes.length,
      },
      'Story generated successfully',
      201
    );
  } catch (error) {
    // Record failed API usage
    const duration = Date.now() - startTime;
    const user = await getOrCreateUser().catch(() => null);

    if (user) {
      await recordApiUsage({
        userId: user.id,
        operation: 'story_generation',
        model: 'gpt-4o',
        requestDuration: duration,
        success: false,
        errorMessage: (error as Error).message,
      });
    }

    return handleApiError(error);
  }
}

/**
 * GET /api/stories
 * List stories for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const heroId = searchParams.get('heroId');
    const includeIllustrations = searchParams.get('includeIllustrations') === 'true';
    const language = searchParams.get('language');
    const isFavorite = searchParams.get('isFavorite') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (heroId) {
      where.heroId = heroId;
    }

    if (language) {
      where.language = language;
    }

    if (isFavorite) {
      where.isFavorite = true;
    }

    // Get stories with filtering and pagination
    const stories = await prisma.story.findMany({
      where,
      include: {
        hero: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        illustrations: includeIllustrations,
        _count: {
          select: { illustrations: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.story.count({ where });

    return successResponse({
      stories,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
