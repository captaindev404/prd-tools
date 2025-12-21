import { openai } from './client';
import { uploadToR2, generateFileKey } from '@/lib/storage/r2-client';
import { AvatarPromptTemplate, SanitizationService } from '@/lib/prompts';

export interface AvatarGenerationParams {
  heroName: string;
  heroAge: number;
  heroTraits: string[];
  physicalTraits?: {
    hairColor?: string;
    eyeColor?: string;
    skinTone?: string;
    height?: string;
  };
  specialAbilities?: string[];
  style?: 'standard' | 'hd';
  size?: '1024x1024' | '1024x1536' | '1536x1024';
  userId: string;
  heroId: string;
}

export interface GeneratedAvatar {
  imageUrl: string;
  prompt: string;
  generationId?: string;
  revisedPrompt?: string;
}

/**
 * Generate an avatar image using gpt-image-1
 */
export async function generateAvatar(
  params: AvatarGenerationParams
): Promise<GeneratedAvatar> {
  const {
    heroName,
    heroAge,
    heroTraits,
    physicalTraits,
    specialAbilities,
    style = 'standard',
    size = '1024x1024',
    userId,
    heroId,
  } = params;

  // Build the avatar prompt using centralized template
  const prompt = AvatarPromptTemplate.build({
    heroName,
    heroAge,
    heroTraits,
    physicalTraits,
    specialAbilities,
  });

  // Apply centralized sanitization
  const sanitizationResult = SanitizationService.sanitize(prompt, 'en');
  SanitizationService.logResults(sanitizationResult, 'avatar-generation');

  if (sanitizationResult.riskLevel === 'high') {
    throw new Error('Avatar generation failed: Content safety check failed');
  }

  // Map quality for gpt-image-1 (low/medium/high instead of standard/hd)
  const qualityMap: Record<string, 'low' | 'medium' | 'high'> = {
    standard: 'medium',
    hd: 'high',
  };

  try {
    // Generate avatar using gpt-image-1 Images API
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: sanitizationResult.sanitized,
      size: size,
      quality: qualityMap[style] || 'medium',
      n: 1,
    });

    // Extract image from response
    if (!response.data || response.data.length === 0) {
      throw new Error('No images generated in OpenAI response');
    }

    const image = response.data[0];

    // gpt-image-1 returns b64_json by default
    let imageBuffer: Buffer;
    if (image.b64_json) {
      imageBuffer = Buffer.from(image.b64_json, 'base64');
    } else if (image.url) {
      // Fallback to URL if provided
      const imageResponse = await fetch(image.url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } else {
      throw new Error('No image data in OpenAI response');
    }

    // Generate unique file key for R2
    const fileKey = generateFileKey({
      userId,
      type: 'avatar',
      filename: `${heroId}.png`,
    });

    // Upload to R2
    const r2Url = await uploadToR2({
      key: fileKey,
      body: imageBuffer,
      contentType: 'image/png',
      metadata: {
        heroId,
        heroName,
        generatedAt: new Date().toISOString(),
      },
    });

    // Log usage info
    console.log('Avatar generation completed, uploaded to R2:', r2Url);

    return {
      imageUrl: r2Url,
      prompt: sanitizationResult.sanitized,
      revisedPrompt: image.revised_prompt,
      generationId: fileKey,
    };
  } catch (error) {
    console.error('Error generating avatar:', error);
    throw new Error(`Failed to generate avatar: ${(error as Error).message}`);
  }
}
