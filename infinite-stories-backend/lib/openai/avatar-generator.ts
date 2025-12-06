import { openai } from './client';
import { filterPrompt, logFilterResults } from './content-filter';
import { uploadToR2, generateFileKey } from '@/lib/storage/r2-client';

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

  // Build the avatar prompt
  const prompt = buildAvatarPrompt({
    heroName,
    heroAge,
    heroTraits,
    physicalTraits,
    specialAbilities,
  });

  // Apply content filtering
  const filtered = filterPrompt(prompt, 'en');
  logFilterResults(filtered, 'avatar-generation');

  if (filtered.riskLevel === 'high') {
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
      prompt: filtered.filtered,
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
      prompt: filtered.filtered,
      revisedPrompt: image.revised_prompt,
      generationId: fileKey,
    };
  } catch (error) {
    console.error('Error generating avatar:', error);
    throw new Error(`Failed to generate avatar: ${(error as Error).message}`);
  }
}

/**
 * Build a child-appropriate avatar prompt
 */
function buildAvatarPrompt(params: {
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
}): string {
  const { heroName, heroAge, heroTraits, physicalTraits, specialAbilities } = params;

  let prompt = `A friendly, child-appropriate cartoon illustration of ${heroName}, `;
  prompt += `a ${heroAge}-year-old child character. `;

  // Add physical traits
  if (physicalTraits) {
    if (physicalTraits.hairColor) {
      prompt += `${physicalTraits.hairColor} hair, `;
    }
    if (physicalTraits.eyeColor) {
      prompt += `${physicalTraits.eyeColor} eyes, `;
    }
    if (physicalTraits.skinTone) {
      prompt += `${physicalTraits.skinTone} skin tone, `;
    }
  }

  // Add personality traits
  if (heroTraits.length > 0) {
    const traitDescriptions = heroTraits
      .map((trait) => getTraitDescription(trait))
      .filter(Boolean)
      .join(', ');
    if (traitDescriptions) {
      prompt += `with a ${traitDescriptions} expression. `;
    }
  }

  // Add special abilities as visual elements
  if (specialAbilities && specialAbilities.length > 0) {
    const abilityVisuals = specialAbilities
      .map((ability) => getAbilityVisual(ability))
      .filter(Boolean)
      .join(', ');
    if (abilityVisuals) {
      prompt += `The character has ${abilityVisuals}. `;
    }
  }

  // Style guidelines
  prompt += 'Style: colorful, cheerful, kid-friendly cartoon illustration, ';
  prompt += 'bright colors, simple and appealing design suitable for children aged 3-12. ';
  prompt += 'The character should look happy and friendly, perfect for a bedtime story app.';

  return prompt;
}

/**
 * Get visual description for personality trait
 */
function getTraitDescription(trait: string): string {
  const descriptions: Record<string, string> = {
    brave: 'confident and determined',
    kind: 'warm and gentle',
    curious: 'inquisitive and alert',
    adventurous: 'excited and energetic',
    creative: 'imaginative and expressive',
    funny: 'playful and cheerful',
    smart: 'thoughtful and clever',
    gentle: 'calm and peaceful',
    energetic: 'lively and enthusiastic',
    patient: 'composed and serene',
    caring: 'compassionate and attentive',
    determined: 'focused and resolute',
  };

  return descriptions[trait.toLowerCase()] || '';
}

/**
 * Get visual representation for special ability
 */
function getAbilityVisual(ability: string): string {
  const visuals: Record<string, string> = {
    flying: 'small sparkly wings or a flowing cape',
    'super strength': 'a confident stance and determined expression',
    invisibility: 'a subtle shimmer or glow around them',
    'talking to animals': 'friendly animals nearby',
    magic: 'sparkles or stars floating around them',
    'time travel': 'a magical pocket watch or clock',
    teleportation: 'magical portals or swirls',
    healing: 'a gentle glow and healing sparkles',
    'shape shifting': 'subtle transformation effects',
    telepathy: 'thought bubbles or mind connection symbols',
  };

  return visuals[ability.toLowerCase()] || 'magical elements';
}
