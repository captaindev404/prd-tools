/**
 * Centralized Prompt Management
 *
 * This module provides structured prompt composition with clear separation:
 * - System prompts (configuration, rules, persona)
 * - Context (hero profile, visual reference)
 * - User input (scene descriptions, custom text)
 *
 * @example
 * ```typescript
 * import { PromptBuilder, AvatarPromptTemplate, SanitizationService } from '@/lib/prompts';
 *
 * // Using templates
 * const prompt = AvatarPromptTemplate.build({
 *   heroName: 'Luna',
 *   heroAge: 8,
 *   heroTraits: ['brave', 'curious'],
 * });
 *
 * // Using PromptBuilder directly
 * const customPrompt = PromptBuilder.create('custom-prompt')
 *   .withSystemPrompt('You are a helpful assistant.')
 *   .withContext({ name: 'Luna' }, ctx => `User: ${ctx.name}`)
 *   .withUserInput('Tell me a story')
 *   .build();
 * ```
 */

// Builder
export {
  PromptBuilder,
  type BuiltPrompt,
  type PromptContext,
  type PromptBuilderConfig,
} from './builder';

// Input Validation
export {
  validateHeroName,
  validateHeroAge,
  validateHeroTraits,
  validateSpecialAbilities,
  validateHeroInput,
  validateCustomPrompt,
  validateLanguage,
  type ValidationResult,
  type HeroInput,
  type ValidatedHero,
} from './builder';

// Sanitization
export {
  SanitizationService,
  type SanitizationResult,
  type RiskLevel,
} from './sanitization';

// System Prompts
export {
  AVATAR_SYSTEM_PROMPT,
  AVATAR_STYLE_GUIDANCE,
  getTraitDescription,
  getAbilityVisual,
  STORY_SYSTEM_PROMPTS,
  getStorySystemPrompt,
  ILLUSTRATION_STYLE_GUIDANCE,
  CHARACTER_CONSISTENCY_INSTRUCTION,
  DEFAULT_ART_STYLE,
  SCENE_STYLE_SUFFIX,
  buildCharacterConsistencyPrompt,
  SAFE_REWRITER_SYSTEM_PROMPT,
  SCENE_EXTRACTION_SYSTEM_PROMPT,
  VISUAL_CHARACTERISTICS_SYSTEM_PROMPT,
  buildSceneExtractionPrompt,
  buildVisualCharacteristicsPrompt,
  type SupportedLanguage,
} from './system';

// Templates
export {
  AvatarPromptTemplate,
  buildAvatarPrompt,
  StoryPromptTemplate,
  getSystemPrompt,
  getUserPrompt,
  IllustrationPromptTemplate,
  buildIllustrationPrompt,
  SceneExtractionPromptTemplate,
  type AvatarContext,
  type StoryContext,
  type IllustrationContext,
  type HeroReference,
} from './templates';
