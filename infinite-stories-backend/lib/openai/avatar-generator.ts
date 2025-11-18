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
    // Generate avatar using Response API with gpt-5-mini
    const response = await openai.responses.create({
      model: 'gpt-5-mini',
      instructions: 'You are an expert at generating child-friendly avatar images for bedtime story characters.',
      input: filtered.filtered,
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
      console.log('Avatar generation token usage:', {
        input: response.usage.input_tokens || 0,
        output: response.usage.output_tokens || 0,
        total: response.usage.total_tokens || 0,
      });
    }

    return {
      imageUrl,
      prompt: filtered.filtered,
      revisedPrompt: undefined,
      generationId: response.id,
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
