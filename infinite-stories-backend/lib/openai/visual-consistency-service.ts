import { openai } from './client';
import { prisma } from '@/lib/prisma/client';

export interface VisualCharacteristics {
  hairStyle?: string;
  hairColor?: string;
  hairTexture?: string;
  eyeColor?: string;
  eyeShape?: string;
  skinTone?: string;
  facialFeatures?: string;
  bodyType?: string;
  height?: string;
  age?: number;
  typicalClothing?: string;
  colorPalette?: string[];
  accessories?: string;
  artStyle?: string;
  visualKeywords?: string[];
}

/**
 * Extract visual characteristics from avatar prompt using GPT-4
 */
export async function extractVisualCharacteristics(
  avatarPrompt: string,
  heroName: string,
  heroAge: number
): Promise<VisualCharacteristics> {
  try {
    const response = await openai.responses.create({
      model: 'gpt-5-mini',
      instructions: 'You are an expert at extracting visual characteristics from image descriptions. Extract detailed visual features from the given avatar description for consistent character illustration.',  // ✅ System prompt
      input: `Extract visual characteristics from this avatar description for ${heroName} (age ${heroAge}):\n\n${avatarPrompt}\n\nProvide detailed visual features that can be used for consistent illustration across multiple scenes.`,  // ✅ User input as string
      temperature: 0.3,  // ✅ Restored
      text: {
        format: {
          type: 'json_schema',
          name: 'visual_characteristics',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              hairStyle: { type: 'string' },
              hairColor: { type: 'string' },
              hairTexture: { type: 'string' },
              eyeColor: { type: 'string' },
              eyeShape: { type: 'string' },
              skinTone: { type: 'string' },
              facialFeatures: { type: 'string' },
              bodyType: { type: 'string' },
              height: { type: 'string' },
              age: { type: 'number' },
              typicalClothing: { type: 'string' },
              colorPalette: {
                type: 'array',
                items: { type: 'string' },
              },
              accessories: { type: 'string' },
              artStyle: { type: 'string' },
              visualKeywords: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: [],
            additionalProperties: false,
          },
        },
      },
    });

    // Check response status
    if (response.status === 'failed') {
      throw new Error(`OpenAI API error: ${response.error?.message || 'Unknown error'}`);
    }

    // Extract text content directly
    const textContent = response.output_text;
    if (!textContent) {
      throw new Error('No text content in OpenAI response');
    }

    // Log token usage
    console.log('Visual characteristics extraction token usage:', {
      input: response.usage?.input_tokens || 0,
      output: response.usage?.output_tokens || 0,
      total: response.usage?.total_tokens || 0,
    });

    const characteristics = JSON.parse(textContent) as VisualCharacteristics;
    return characteristics;
  } catch (error) {
    console.error('Error extracting visual characteristics:', error);
    throw new Error(`Failed to extract visual characteristics: ${(error as Error).message}`);
  }
}

/**
 * Generate canonical prompt for consistent character illustration
 */
export function generateCanonicalPrompt(
  heroName: string,
  characteristics: VisualCharacteristics
): string {
  let prompt = `${heroName}, a ${characteristics.age || 'young'}-year-old child, `;

  const features: string[] = [];

  if (characteristics.hairStyle && characteristics.hairColor) {
    features.push(`${characteristics.hairColor} ${characteristics.hairStyle} hair`);
  } else if (characteristics.hairColor) {
    features.push(`${characteristics.hairColor} hair`);
  }

  if (characteristics.eyeColor) {
    features.push(`${characteristics.eyeColor} eyes`);
  }

  if (characteristics.skinTone) {
    features.push(`${characteristics.skinTone} skin`);
  }

  if (features.length > 0) {
    prompt += features.join(', ') + ', ';
  }

  if (characteristics.bodyType) {
    prompt += `${characteristics.bodyType} build, `;
  }

  if (characteristics.typicalClothing) {
    prompt += `wearing ${characteristics.typicalClothing}, `;
  }

  if (characteristics.accessories) {
    prompt += `with ${characteristics.accessories}, `;
  }

  // Add art style
  const artStyle = characteristics.artStyle || 'colorful cartoon illustration';
  prompt += `${artStyle} style`;

  return prompt;
}

/**
 * Generate simplified prompt for quick reference
 */
export function generateSimplifiedPrompt(
  heroName: string,
  characteristics: VisualCharacteristics
): string {
  const features: string[] = [heroName];

  if (characteristics.hairColor) features.push(`${characteristics.hairColor} hair`);
  if (characteristics.eyeColor) features.push(`${characteristics.eyeColor} eyes`);
  if (characteristics.skinTone) features.push(`${characteristics.skinTone} skin`);

  return features.join(', ');
}

/**
 * Create or update hero visual profile
 */
export async function createOrUpdateVisualProfile(
  heroId: string,
  avatarPrompt: string,
  heroName: string,
  heroAge: number
): Promise<void> {
  try {
    // Extract visual characteristics
    const characteristics = await extractVisualCharacteristics(
      avatarPrompt,
      heroName,
      heroAge
    );

    // Generate prompts
    const canonicalPrompt = generateCanonicalPrompt(heroName, characteristics);
    const simplifiedPrompt = generateSimplifiedPrompt(heroName, characteristics);

    // Check if visual profile exists
    const existingProfile = await prisma.heroVisualProfile.findUnique({
      where: { heroId },
    });

    if (existingProfile) {
      // Update existing profile
      await prisma.heroVisualProfile.update({
        where: { heroId },
        data: {
          ...characteristics,
          colorPalette: characteristics.colorPalette || [],
          visualKeywords: characteristics.visualKeywords || [],
          canonicalPrompt,
          simplifiedPrompt,
        },
      });
    } else {
      // Create new profile
      await prisma.heroVisualProfile.create({
        data: {
          heroId,
          ...characteristics,
          colorPalette: characteristics.colorPalette || [],
          visualKeywords: characteristics.visualKeywords || [],
          canonicalPrompt,
          simplifiedPrompt,
        },
      });

      // Link profile to hero
      await prisma.hero.update({
        where: { id: heroId },
        data: {
          visualProfileId: heroId, // This should be the profile ID
        },
      });
    }
  } catch (error) {
    console.error('Error creating/updating visual profile:', error);
    throw new Error(`Failed to create/update visual profile: ${(error as Error).message}`);
  }
}

/**
 * Get scene character description for illustration
 */
export function generateSceneCharacterDescription(
  canonicalPrompt: string,
  sceneContext: string
): string {
  return `${canonicalPrompt}. Scene context: ${sceneContext}`;
}
