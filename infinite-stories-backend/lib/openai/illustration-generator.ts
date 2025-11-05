import { openai } from './client';
import { filterPrompt, logFilterResults } from './content-filter';
import { uploadToR2, generateFileKey } from '@/lib/storage/r2-client';
import { prisma } from '@/lib/prisma/client';

export interface IllustrationGenerationParams {
  sceneDescription: string;
  heroName: string;
  heroVisualProfile?: {
    hairColor?: string;
    eyeColor?: string;
    skinTone?: string;
    artStyle?: string;
    canonicalPrompt?: string;
  };
  previousGenerationId?: string; // For multi-turn consistency
  style?: 'standard' | 'hd';
  size?: '1024x1024' | '1024x1536' | '1536x1024';
  userId: string;
  storyId: string;
  illustrationId: string;
}

export interface GeneratedIllustration {
  imageUrl: string;
  prompt: string;
  generationId?: string;
  revisedPrompt?: string;
}

/**
 * Generate an illustration for a story scene using DALL-E 3 with multi-turn consistency
 */
export async function generateIllustration(
  params: IllustrationGenerationParams
): Promise<GeneratedIllustration> {
  const {
    sceneDescription,
    heroName,
    heroVisualProfile,
    previousGenerationId,
    style = 'standard',
    size = '1024x1024',
    userId,
    storyId,
    illustrationId,
  } = params;

  // Build the illustration prompt with character consistency
  const prompt = buildIllustrationPrompt({
    sceneDescription,
    heroName,
    heroVisualProfile,
  });

  // Apply content filtering
  const filtered = filterPrompt(prompt, 'en');
  logFilterResults(filtered, 'illustration-generation');

  if (filtered.riskLevel === 'high') {
    throw new Error('Illustration generation failed: Content safety check failed');
  }

  try {
    // Generate illustration using DALL-E 3
    // Note: Multi-turn consistency via previousGenerationId is a planned feature
    // For now, we maintain consistency through detailed prompts
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: filtered.filtered,
      n: 1,
      size,
      quality: style === 'hd' ? 'hd' : 'standard',
      response_format: 'url',
    });

    const imageData = response.data[0];

    if (!imageData?.url) {
      throw new Error('No image URL returned from DALL-E');
    }

    // Download the image from OpenAI's temporary URL
    const imageResponse = await fetch(imageData.url);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Generate unique file key
    const fileKey = generateFileKey({
      userId,
      type: 'illustration',
      filename: `${storyId}-${illustrationId}.png`,
    });

    // Upload to R2
    const imageUrl = await uploadToR2({
      key: fileKey,
      body: imageBuffer,
      contentType: 'image/png',
      metadata: {
        storyId,
        illustrationId,
        sceneDescription,
      },
    });

    return {
      imageUrl,
      prompt: filtered.filtered,
      revisedPrompt: imageData.revised_prompt,
      // Store generation ID for future multi-turn consistency
      generationId: previousGenerationId, // Would be extracted from response in future
    };
  } catch (error) {
    console.error('Error generating illustration:', error);
    throw new Error(`Failed to generate illustration: ${(error as Error).message}`);
  }
}

/**
 * Build illustration prompt with character consistency
 */
function buildIllustrationPrompt(params: {
  sceneDescription: string;
  heroName: string;
  heroVisualProfile?: {
    hairColor?: string;
    eyeColor?: string;
    skinTone?: string;
    artStyle?: string;
    canonicalPrompt?: string;
  };
}): string {
  const { sceneDescription, heroName, heroVisualProfile } = params;

  let prompt = '';

  // Use canonical prompt if available for maximum consistency
  if (heroVisualProfile?.canonicalPrompt) {
    prompt = `${heroVisualProfile.canonicalPrompt} `;
  } else {
    // Build character description
    prompt = `A child-friendly cartoon illustration featuring ${heroName}, a friendly child character`;

    if (heroVisualProfile) {
      if (heroVisualProfile.hairColor) {
        prompt += ` with ${heroVisualProfile.hairColor} hair`;
      }
      if (heroVisualProfile.eyeColor) {
        prompt += ` and ${heroVisualProfile.eyeColor} eyes`;
      }
      if (heroVisualProfile.skinTone) {
        prompt += `, ${heroVisualProfile.skinTone} skin tone`;
      }
    }

    prompt += '. ';
  }

  // Add scene description
  prompt += `Scene: ${sceneDescription}. `;

  // Add style guidelines
  const artStyle = heroVisualProfile?.artStyle || 'colorful cartoon';
  prompt += `Style: ${artStyle}, bright cheerful colors, kid-friendly, `;
  prompt += 'simple and appealing design suitable for children aged 3-12. ';
  prompt += 'The scene should be warm, inviting, and perfect for a bedtime story.';

  return prompt;
}

/**
 * Generate multiple illustrations for a story with consistency
 */
export async function generateStoryIllustrations(
  storyId: string,
  userId: string,
  options?: {
    style?: 'standard' | 'hd';
    maxIllustrations?: number;
  }
): Promise<{ generated: number; failed: number }> {
  const { style = 'standard', maxIllustrations = 10 } = options || {};

  // Get story with pending illustrations
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      hero: {
        include: {
          visualProfile: true,
        },
      },
      illustrations: {
        where: {
          generationStatus: 'pending',
        },
        orderBy: {
          displayOrder: 'asc',
        },
        take: maxIllustrations,
      },
    },
  });

  if (!story) {
    throw new Error('Story not found');
  }

  let generated = 0;
  let failed = 0;
  let previousGenerationId: string | undefined;

  // Generate illustrations sequentially for consistency
  for (const illustration of story.illustrations) {
    try {
      // Update status to processing
      await prisma.storyIllustration.update({
        where: { id: illustration.id },
        data: { generationStatus: 'processing' },
      });

      // Generate the illustration
      const result = await generateIllustration({
        sceneDescription: illustration.sceneDescription,
        heroName: story.hero?.name || 'hero',
        heroVisualProfile: story.hero?.visualProfile
          ? {
              hairColor: story.hero.visualProfile.hairColor || undefined,
              eyeColor: story.hero.visualProfile.eyeColor || undefined,
              skinTone: story.hero.visualProfile.skinTone || undefined,
              artStyle: story.hero.visualProfile.artStyle || undefined,
              canonicalPrompt: story.hero.visualProfile.canonicalPrompt || undefined,
            }
          : undefined,
        previousGenerationId,
        style,
        userId,
        storyId: story.id,
        illustrationId: illustration.id,
      });

      // Update illustration with result
      await prisma.storyIllustration.update({
        where: { id: illustration.id },
        data: {
          imageUrl: result.imageUrl,
          imagePrompt: result.prompt,
          generationId: result.generationId,
          generationStatus: 'completed',
          generationError: null,
        },
      });

      // Store generation ID for next illustration
      previousGenerationId = result.generationId;
      generated++;
    } catch (error) {
      // Update illustration with error
      await prisma.storyIllustration.update({
        where: { id: illustration.id },
        data: {
          generationStatus: 'failed',
          generationError: (error as Error).message,
          retryCount: { increment: 1 },
        },
      });

      failed++;
      console.error(`Failed to generate illustration ${illustration.id}:`, error);
    }
  }

  // Update story illustration status
  const totalCompleted = await prisma.storyIllustration.count({
    where: {
      storyId: story.id,
      generationStatus: 'completed',
    },
  });

  const totalFailed = await prisma.storyIllustration.count({
    where: {
      storyId: story.id,
      generationStatus: 'failed',
    },
  });

  const totalPending = await prisma.storyIllustration.count({
    where: {
      storyId: story.id,
      generationStatus: 'pending',
    },
  });

  let illustrationStatus: string;
  if (totalCompleted > 0 && totalPending === 0 && totalFailed === 0) {
    illustrationStatus = 'completed';
  } else if (totalCompleted > 0 && (totalPending > 0 || totalFailed > 0)) {
    illustrationStatus = 'partial';
  } else if (totalFailed > 0 && totalPending === 0) {
    illustrationStatus = 'failed';
  } else {
    illustrationStatus = 'pending';
  }

  await prisma.story.update({
    where: { id: story.id },
    data: {
      illustrationStatus,
      illustrationCount: totalCompleted,
    },
  });

  return { generated, failed };
}
