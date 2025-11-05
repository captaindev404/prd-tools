import { openai } from './client';
import { filterPrompt, logFilterResults } from './content-filter';

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
}

export interface GeneratedAvatar {
  imageUrl: string;
  prompt: string;
  generationId?: string;
  revisedPrompt?: string;
}

/**
 * Generate an avatar image using DALL-E 3
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

  try {
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

    return {
      imageUrl: imageData.url,
      prompt: filtered.filtered,
      revisedPrompt: imageData.revised_prompt,
      // Note: DALL-E 3 doesn't return generation_id in the response yet
      // This would need to be extracted from headers or response metadata if available
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
