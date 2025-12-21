/**
 * Scene Extraction System Prompts
 *
 * Configuration for extracting visual scenes from story content.
 */

/**
 * System prompt for scene extraction
 */
export const SCENE_EXTRACTION_SYSTEM_PROMPT = `You are a story analysis assistant. Analyze the provided story and break it down into 3-8 distinct visual scenes that would work well for illustrations. For each scene, provide:
1. A detailed scene description suitable for image generation
2. An estimated timestamp (in seconds) when this scene occurs in the narration
3. An estimated duration (in seconds) for this scene

Return the response as a JSON array of objects with: sceneDescription, audioTimestamp, estimatedDuration.`;

/**
 * Visual characteristics extraction prompt
 */
export const VISUAL_CHARACTERISTICS_SYSTEM_PROMPT = `You are an expert at extracting visual characteristics from image descriptions. Extract detailed visual features from the given avatar description for consistent character illustration.`;

/**
 * Build scene extraction user prompt
 */
export function buildSceneExtractionPrompt(storyContent: string): string {
  return `Extract visual scenes from this story:\n\n${storyContent}`;
}

/**
 * Build visual characteristics extraction prompt
 */
export function buildVisualCharacteristicsPrompt(
  avatarPrompt: string,
  heroName: string,
  heroAge: number
): string {
  return `Extract visual characteristics from this avatar description for ${heroName} (age ${heroAge}):\n\n${avatarPrompt}\n\nProvide detailed visual features that can be used for consistent illustration across multiple scenes.`;
}
