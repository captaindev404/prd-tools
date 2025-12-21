/**
 * Illustration Generation System Prompts
 *
 * Configuration for story illustration generation with character consistency.
 */

/**
 * Main illustration style guidance
 */
export const ILLUSTRATION_STYLE_GUIDANCE = `Create a beautiful children's book illustration in a warm, whimsical style. Use soft colors, gentle lighting, and a magical atmosphere. The art style should be similar to modern children's picture books with watercolor or soft digital painting techniques. Ensure the image is appropriate for children aged 4-10. Avoid any scary, violent, or inappropriate content. Focus on creating a sense of wonder and joy.`;

/**
 * Character consistency instructions
 */
export const CHARACTER_CONSISTENCY_INSTRUCTION = `CRITICAL: The character MUST look IDENTICAL to their established appearance. Same hair color, clothing, features, and overall design in every illustration.`;

/**
 * Default art style for illustrations
 */
export const DEFAULT_ART_STYLE = 'colorful cartoon illustration';

/**
 * Scene style additions for child-friendly content
 */
export const SCENE_STYLE_SUFFIX = 'bright cheerful colors, kid-friendly, simple and appealing design suitable for children aged 3-12. The scene should be warm, inviting, and perfect for a bedtime story.';

/**
 * Build character consistency prompt section
 */
export function buildCharacterConsistencyPrompt(
  heroName: string,
  appearance?: string,
  avatarPrompt?: string,
  primaryTrait?: string,
  secondaryTrait?: string
): string {
  let prompt = `The main character ${heroName} should be clearly visible and match this EXACT description: ${
    appearance || 'a lovable, friendly character'
  }.`;

  if (avatarPrompt) {
    prompt += `\n\nVISUAL REFERENCE (MUST MATCH EXACTLY): ${avatarPrompt}`;
  }

  if (primaryTrait || secondaryTrait) {
    const traits = [primaryTrait, secondaryTrait].filter(Boolean).join(' and ');
    prompt += `\n\nCharacter traits: ${traits} should be reflected in their expression and posture.`;
  }

  prompt += `\n\n${CHARACTER_CONSISTENCY_INSTRUCTION}`;

  return prompt;
}
