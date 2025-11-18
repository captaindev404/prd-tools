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
 * Generate an illustration for a story scene using DALL-E 3
 * Character consistency is achieved through detailed canonical prompts from HeroVisualProfile
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
    // Generate illustration using Response API with gpt-5-mini
    const response = await openai.responses.create({
      model: 'gpt-5-mini',
      instructions: 'You are an expert at generating child-friendly story illustrations that maintain character consistency.',
      input: filtered.filtered,
      previous_response_id: previousGenerationId, // Multi-turn consistency
      image: {
        size,
        quality: style === 'hd' ? 'hd' : 'standard',
      },
    });

    // Check response status
    if (response.status === 'failed') {
      throw new Error(`OpenAI API error: ${response.error?.message || 'Unknown error'}`);
    }

    // Extract image from response output
    const imageUrl = response.output_image_url;
    if (!imageUrl) {
      throw new Error('No image URL in OpenAI response');
    }

    // Log token usage
    if (response.usage) {
      console.log('Illustration generation token usage:', {
        input: response.usage.input_tokens || 0,
        output: response.usage.output_tokens || 0,
        total: response.usage.total_tokens || 0,
      });
    }

    // Download the image from OpenAI's temporary URL
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Generate unique file key
    const fileKey = generateFileKey({
      userId,
      type: 'illustration',
      filename: `${storyId}-${illustrationId}.png`,
    });

    // Upload to R2
    const r2Url = await uploadToR2({
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
      imageUrl: r2Url,
      prompt: filtered.filtered,
      revisedPrompt: undefined,
      // Store generation ID for multi-turn consistency
      generationId: response.id,
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
