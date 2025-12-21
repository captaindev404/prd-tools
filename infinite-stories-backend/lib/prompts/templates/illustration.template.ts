/**
 * Illustration Prompt Template
 *
 * Template for generating story illustrations with character consistency.
 */

import { PromptBuilder } from '../builder';
import {
  ILLUSTRATION_STYLE_GUIDANCE,
  buildCharacterConsistencyPrompt,
  DEFAULT_ART_STYLE,
  SCENE_STYLE_SUFFIX,
} from '../system';

export interface IllustrationContext {
  [key: string]: unknown;
  sceneDescription: string;
  heroName: string;
  heroVisualProfile?: {
    hairColor?: string;
    eyeColor?: string;
    skinTone?: string;
    artStyle?: string;
    canonicalPrompt?: string;
  };
}

export interface HeroReference {
  name: string;
  appearance?: string;
  avatarPrompt?: string;
  primaryTrait?: string;
  secondaryTrait?: string;
}

/**
 * Illustration prompt template configuration
 */
export const IllustrationPromptTemplate = {
  id: 'illustration-v1',
  version: '1.0.0',

  /**
   * Build illustration prompt using PromptBuilder
   */
  build(context: IllustrationContext): string {
    return PromptBuilder.create(this.id)
      .withContext(context, formatIllustrationContext)
      .buildCombined();
  },

  /**
   * Build enhanced prompt with hero reference and style guidance
   */
  buildEnhanced(
    sceneDescription: string,
    hero: HeroReference
  ): string {
    const heroConsistency = buildCharacterConsistencyPrompt(
      hero.name,
      hero.appearance,
      hero.avatarPrompt,
      hero.primaryTrait,
      hero.secondaryTrait
    );

    return PromptBuilder.create(this.id)
      .withUserInput(sceneDescription)
      .withContextString(heroConsistency)
      .withContextString(ILLUSTRATION_STYLE_GUIDANCE)
      .buildCombined();
  },
};

/**
 * Format illustration context for prompt inclusion
 */
function formatIllustrationContext(ctx: IllustrationContext): string {
  let prompt = '';

  // Use canonical prompt if available for maximum consistency
  if (ctx.heroVisualProfile?.canonicalPrompt) {
    prompt = `${ctx.heroVisualProfile.canonicalPrompt} `;
  } else {
    // Build character description
    prompt = `A child-friendly cartoon illustration featuring ${ctx.heroName}, a friendly child character`;

    if (ctx.heroVisualProfile) {
      if (ctx.heroVisualProfile.hairColor) {
        prompt += ` with ${ctx.heroVisualProfile.hairColor} hair`;
      }
      if (ctx.heroVisualProfile.eyeColor) {
        prompt += ` and ${ctx.heroVisualProfile.eyeColor} eyes`;
      }
      if (ctx.heroVisualProfile.skinTone) {
        prompt += `, ${ctx.heroVisualProfile.skinTone} skin tone`;
      }
    }

    prompt += '. ';
  }

  // Add scene description
  prompt += `Scene: ${ctx.sceneDescription}. `;

  // Add style guidelines
  const artStyle = ctx.heroVisualProfile?.artStyle || DEFAULT_ART_STYLE;
  prompt += `Style: ${artStyle}, ${SCENE_STYLE_SUFFIX}`;

  return prompt;
}

/**
 * Legacy function for backwards compatibility
 * Use IllustrationPromptTemplate.build() for new code
 */
export function buildIllustrationPrompt(params: {
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
  return IllustrationPromptTemplate.build(params);
}
