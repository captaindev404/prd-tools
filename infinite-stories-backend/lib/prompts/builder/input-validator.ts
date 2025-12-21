/**
 * Input Validation Utilities
 *
 * Validates user inputs at API boundaries before prompt inclusion.
 * Ensures type safety and prevents invalid data from reaching prompts.
 */

export interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  error?: string;
}

export interface HeroInput {
  name: string;
  age: number;
  traits: string[];
}

export interface ValidatedHero {
  name: string;
  age: number;
  traits: string[];
}

/**
 * Allowed character traits (matches iOS app enum)
 */
const ALLOWED_TRAITS = [
  'brave',
  'kind',
  'curious',
  'adventurous',
  'creative',
  'funny',
  'smart',
  'gentle',
  'energetic',
  'patient',
  'caring',
  'determined',
];

/**
 * Allowed special abilities
 */
const ALLOWED_ABILITIES = [
  'flying',
  'super strength',
  'invisibility',
  'talking to animals',
  'magic',
  'time travel',
  'teleportation',
  'healing',
  'shape shifting',
  'telepathy',
];

/**
 * Validate hero name
 */
export function validateHeroName(name: unknown): ValidationResult<string> {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Hero name must be a string' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Hero name cannot be empty' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Hero name must be 50 characters or less' };
  }

  // Allow alphanumeric, spaces, and basic punctuation (for names like "John Jr." or "Anna-Marie")
  const validPattern = /^[a-zA-Z0-9\s\-'.]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Hero name contains invalid characters' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate hero age
 */
export function validateHeroAge(age: unknown): ValidationResult<number> {
  if (typeof age !== 'number') {
    // Try to parse if it's a string
    if (typeof age === 'string') {
      const parsed = parseInt(age, 10);
      if (isNaN(parsed)) {
        return { valid: false, error: 'Hero age must be a number' };
      }
      age = parsed;
    } else {
      return { valid: false, error: 'Hero age must be a number' };
    }
  }

  const numAge = age as number;
  if (numAge < 2 || numAge > 12) {
    return { valid: false, error: 'Hero age must be between 2 and 12' };
  }

  if (!Number.isInteger(numAge)) {
    return { valid: false, error: 'Hero age must be a whole number' };
  }

  return { valid: true, value: numAge };
}

/**
 * Validate hero traits
 */
export function validateHeroTraits(traits: unknown): ValidationResult<string[]> {
  if (!Array.isArray(traits)) {
    return { valid: false, error: 'Hero traits must be an array' };
  }

  if (traits.length === 0) {
    return { valid: false, error: 'At least one trait is required' };
  }

  if (traits.length > 5) {
    return { valid: false, error: 'Maximum 5 traits allowed' };
  }

  const validTraits: string[] = [];
  for (const trait of traits) {
    if (typeof trait !== 'string') {
      return { valid: false, error: 'Each trait must be a string' };
    }

    const lowerTrait = trait.toLowerCase().trim();
    if (!ALLOWED_TRAITS.includes(lowerTrait)) {
      return {
        valid: false,
        error: `Invalid trait: "${trait}". Allowed traits: ${ALLOWED_TRAITS.join(', ')}`,
      };
    }
    validTraits.push(lowerTrait);
  }

  return { valid: true, value: validTraits };
}

/**
 * Validate special abilities
 */
export function validateSpecialAbilities(
  abilities: unknown
): ValidationResult<string[]> {
  if (abilities === undefined || abilities === null) {
    return { valid: true, value: [] };
  }

  if (!Array.isArray(abilities)) {
    return { valid: false, error: 'Special abilities must be an array' };
  }

  if (abilities.length > 3) {
    return { valid: false, error: 'Maximum 3 special abilities allowed' };
  }

  const validAbilities: string[] = [];
  for (const ability of abilities) {
    if (typeof ability !== 'string') {
      return { valid: false, error: 'Each ability must be a string' };
    }

    const lowerAbility = ability.toLowerCase().trim();
    if (!ALLOWED_ABILITIES.includes(lowerAbility)) {
      return {
        valid: false,
        error: `Invalid ability: "${ability}". Allowed abilities: ${ALLOWED_ABILITIES.join(', ')}`,
      };
    }
    validAbilities.push(lowerAbility);
  }

  return { valid: true, value: validAbilities };
}

/**
 * Validate a complete hero input object
 */
export function validateHeroInput(input: unknown): ValidationResult<ValidatedHero> {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Hero input must be an object' };
  }

  const hero = input as Record<string, unknown>;

  const nameResult = validateHeroName(hero.name);
  if (!nameResult.valid) {
    return { valid: false, error: nameResult.error };
  }

  const ageResult = validateHeroAge(hero.age);
  if (!ageResult.valid) {
    return { valid: false, error: ageResult.error };
  }

  const traitsResult = validateHeroTraits(hero.traits);
  if (!traitsResult.valid) {
    return { valid: false, error: traitsResult.error };
  }

  return {
    valid: true,
    value: {
      name: nameResult.value!,
      age: ageResult.value!,
      traits: traitsResult.value!,
    },
  };
}

/**
 * Validate custom prompt/scene description
 */
export function validateCustomPrompt(
  prompt: unknown,
  maxLength: number = 500
): ValidationResult<string> {
  if (prompt === undefined || prompt === null || prompt === '') {
    return { valid: true, value: '' };
  }

  if (typeof prompt !== 'string') {
    return { valid: false, error: 'Custom prompt must be a string' };
  }

  const trimmed = prompt.trim();

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Custom prompt must be ${maxLength} characters or less`,
    };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate language code
 */
export function validateLanguage(
  language: unknown
): ValidationResult<string> {
  const ALLOWED_LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian'];
  const LANGUAGE_CODES = ['en', 'es', 'fr', 'de', 'it'];

  if (typeof language !== 'string') {
    return { valid: false, error: 'Language must be a string' };
  }

  const trimmed = language.trim();

  // Accept both full names and codes
  if (ALLOWED_LANGUAGES.includes(trimmed) || LANGUAGE_CODES.includes(trimmed.toLowerCase())) {
    return { valid: true, value: trimmed };
  }

  return {
    valid: false,
    error: `Invalid language: "${language}". Allowed: ${ALLOWED_LANGUAGES.join(', ')}`,
  };
}
