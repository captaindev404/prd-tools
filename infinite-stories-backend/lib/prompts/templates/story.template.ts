/**
 * Story Prompt Template
 *
 * Template for generating personalized bedtime stories.
 */

import { PromptBuilder } from '../builder';
import { getStorySystemPrompt, type SupportedLanguage } from '../system';

export interface StoryContext {
  [key: string]: unknown;
  heroName: string;
  heroAge: number;
  heroTraits: string[];
  specialAbilities?: string[];
  eventType?: string;
  language: SupportedLanguage;
}

/**
 * Story prompt template configuration
 */
export const StoryPromptTemplate = {
  id: 'story-v1',
  version: '1.0.0',

  /**
   * Get system prompt for story generation
   */
  getSystemPrompt(language: SupportedLanguage): string {
    return getStorySystemPrompt(language);
  },

  /**
   * Build user prompt for story generation
   */
  buildUserPrompt(context: StoryContext, customPrompt?: string): string {
    return PromptBuilder.create(this.id, { enableSanitization: true })
      .withContext(context, formatStoryContext)
      .withUserInput(customPrompt)
      .buildCombined();
  },

  /**
   * Build complete story prompt (system + user)
   */
  build(context: StoryContext, customPrompt?: string) {
    return {
      system: this.getSystemPrompt(context.language),
      user: this.buildUserPrompt(context, customPrompt),
    };
  },
};

/**
 * Format story context for prompt inclusion
 */
function formatStoryContext(ctx: StoryContext): string {
  let prompt = `Create a ${ctx.language} bedtime story featuring:\n`;
  prompt += `- Hero: ${ctx.heroName}, age ${ctx.heroAge}\n`;
  prompt += `- Personality: ${ctx.heroTraits.join(', ')}\n`;

  if (ctx.specialAbilities && ctx.specialAbilities.length > 0) {
    prompt += `- Special abilities: ${ctx.specialAbilities.join(', ')}\n`;
  }

  if (ctx.eventType) {
    prompt += `- Story theme: ${ctx.eventType}\n`;
  }

  prompt += '\nThe story should be engaging, age-appropriate, and end on a positive, calming note perfect for bedtime.';

  return prompt;
}

/**
 * Legacy function for backwards compatibility
 * Use StoryPromptTemplate methods for new code
 */
export function getSystemPrompt(language: SupportedLanguage): string {
  return StoryPromptTemplate.getSystemPrompt(language);
}

/**
 * Legacy function for backwards compatibility
 */
export function getUserPrompt(params: {
  heroName: string;
  heroAge: number;
  heroTraits: string[];
  specialAbilities?: string[];
  eventType?: string;
  customPrompt?: string;
  language: SupportedLanguage;
}): string {
  const { customPrompt, ...context } = params;
  return StoryPromptTemplate.buildUserPrompt(context, customPrompt);
}
