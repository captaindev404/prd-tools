export {
  AVATAR_SYSTEM_PROMPT,
  AVATAR_STYLE_GUIDANCE,
  getTraitDescription,
  getAbilityVisual,
} from './avatar-generation';

export {
  STORY_SYSTEM_PROMPTS,
  getStorySystemPrompt,
  type SupportedLanguage,
} from './story-generation';

export {
  ILLUSTRATION_STYLE_GUIDANCE,
  CHARACTER_CONSISTENCY_INSTRUCTION,
  DEFAULT_ART_STYLE,
  SCENE_STYLE_SUFFIX,
  buildCharacterConsistencyPrompt,
} from './illustration';

export {
  SAFE_REWRITER_SYSTEM_PROMPT,
  SAFE_REWRITER_EXAMPLE,
} from './safety';

export {
  SCENE_EXTRACTION_SYSTEM_PROMPT,
  VISUAL_CHARACTERISTICS_SYSTEM_PROMPT,
  buildSceneExtractionPrompt,
  buildVisualCharacteristicsPrompt,
} from './scene-extraction';
