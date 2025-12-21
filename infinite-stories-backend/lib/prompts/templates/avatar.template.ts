/**
 * Avatar Prompt Template
 *
 * Template for generating child-friendly character avatars.
 */

import { PromptBuilder } from '../builder';
import {
  AVATAR_SYSTEM_PROMPT,
  AVATAR_STYLE_GUIDANCE,
  getTraitDescription,
  getAbilityVisual,
} from '../system';

export interface AvatarContext {
  [key: string]: unknown;
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
}

/**
 * Avatar prompt template configuration
 */
export const AvatarPromptTemplate = {
  id: 'avatar-v1',
  version: '1.0.0',

  /**
   * Build avatar prompt using PromptBuilder
   */
  build(context: AvatarContext, customDescription?: string): string {
    return PromptBuilder.create(this.id)
      .withContext(context, formatAvatarContext)
      .withUserInput(customDescription)
      .withContextString(AVATAR_STYLE_GUIDANCE)
      .buildCombined();
  },
};

/**
 * Format avatar context for prompt inclusion
 */
function formatAvatarContext(ctx: AvatarContext): string {
  let prompt = `A friendly, child-appropriate cartoon illustration of ${ctx.heroName}, `;
  prompt += `a ${ctx.heroAge}-year-old child character. `;

  // Add physical traits
  if (ctx.physicalTraits) {
    if (ctx.physicalTraits.hairColor) {
      prompt += `${ctx.physicalTraits.hairColor} hair, `;
    }
    if (ctx.physicalTraits.eyeColor) {
      prompt += `${ctx.physicalTraits.eyeColor} eyes, `;
    }
    if (ctx.physicalTraits.skinTone) {
      prompt += `${ctx.physicalTraits.skinTone} skin tone, `;
    }
  }

  // Add personality traits
  if (ctx.heroTraits.length > 0) {
    const traitDescriptions = ctx.heroTraits
      .map((trait) => getTraitDescription(trait))
      .filter(Boolean)
      .join(', ');
    if (traitDescriptions) {
      prompt += `with a ${traitDescriptions} expression. `;
    }
  }

  // Add special abilities as visual elements
  if (ctx.specialAbilities && ctx.specialAbilities.length > 0) {
    const abilityVisuals = ctx.specialAbilities
      .map((ability) => getAbilityVisual(ability))
      .filter(Boolean)
      .join(', ');
    if (abilityVisuals) {
      prompt += `The character has ${abilityVisuals}. `;
    }
  }

  return prompt;
}

/**
 * Legacy function for backwards compatibility
 * Use AvatarPromptTemplate.build() for new code
 */
export function buildAvatarPrompt(params: {
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
  return AvatarPromptTemplate.build(params);
}
