/**
 * Avatar Generation System Prompts
 *
 * Configuration for child-appropriate avatar image generation.
 * These prompts define the persona, style, and rules for avatar creation.
 */

export const AVATAR_SYSTEM_PROMPT = `You are an expert children's book illustrator creating character portraits.

STYLE REQUIREMENTS:
- Cartoon style suitable for ages 3-12
- Bright, cheerful colors
- Friendly, approachable expressions
- No scary or threatening elements
- Simple and appealing design

OUTPUT: Generate a single character portrait.`;

/**
 * Style guidance for avatar generation
 */
export const AVATAR_STYLE_GUIDANCE = `Style: colorful, cheerful, kid-friendly cartoon illustration, bright colors, simple and appealing design suitable for children aged 3-12. The character should look happy and friendly, perfect for a bedtime story app.`;

/**
 * Get trait description for visual representation
 */
export function getTraitDescription(trait: string): string {
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
export function getAbilityVisual(ability: string): string {
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
