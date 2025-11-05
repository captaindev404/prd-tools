/**
 * Content Policy Filter for Child-Safe Content
 * Based on DALL-E content policy and child safety requirements
 *
 * This filter ensures all prompts sent to OpenAI APIs are:
 * 1. Child-appropriate (no adult content, violence, etc.)
 * 2. DALL-E policy compliant
 * 3. Safe for children aged 3-12
 * 4. Multi-language supported
 */

export interface FilterResult {
  filtered: string;
  wasModified: boolean;
  replacements: Array<{ original: string; replacement: string; reason: string }>;
  riskLevel: 'safe' | 'low' | 'medium' | 'high';
}

// Safety terms to filter by language
const SAFETY_TERMS: Record<string, string[]> = {
  en: [
    // Isolation/alone terms (critical for child safety)
    'alone', 'isolated', 'abandoned', 'lonely', 'solitary', 'by themselves',
    'without anyone', 'all by', 'on their own',

    // Violence/danger
    'weapon', 'gun', 'knife', 'sword', 'hurt', 'pain', 'blood', 'injury',
    'attack', 'fight', 'battle', 'war', 'violence', 'dangerous',

    // Fear/scary
    'scary', 'frightening', 'terrifying', 'nightmare', 'horror', 'creepy',
    'spooky', 'haunted', 'monster', 'ghost',

    // Inappropriate content
    'nude', 'naked', 'undressed', 'explicit', 'adult', 'inappropriate',

    // Negative emotions (excessive)
    'depressed', 'suicidal', 'hopeless', 'despair', 'tragic',
  ],
  es: [
    'solo', 'aislado', 'abandonado', 'solitario', 'arma', 'cuchillo',
    'sangre', 'violencia', 'aterrador', 'pesadilla', 'desnudo', 'inapropiado',
  ],
  fr: [
    'seul', 'isolé', 'abandonné', 'solitaire', 'arme', 'couteau',
    'sang', 'violence', 'effrayant', 'cauchemar', 'nu', 'inapproprié',
  ],
  de: [
    'allein', 'isoliert', 'verlassen', 'einsam', 'Waffe', 'Messer',
    'Blut', 'Gewalt', 'gruselig', 'Albtraum', 'nackt', 'unangemessen',
  ],
  it: [
    'solo', 'isolato', 'abbandonato', 'solitario', 'arma', 'coltello',
    'sangue', 'violenza', 'spaventoso', 'incubo', 'nudo', 'inappropriato',
  ],
};

// Safe replacements for filtered terms
const SAFE_REPLACEMENTS: Record<string, Record<string, string>> = {
  en: {
    'alone': 'with their animal friends',
    'isolated': 'in a cozy place',
    'abandoned': 'exploring',
    'lonely': 'thinking',
    'weapon': 'magical tool',
    'gun': 'magic wand',
    'knife': 'spoon',
    'sword': 'magical staff',
    'hurt': 'surprised',
    'pain': 'discomfort',
    'blood': 'red paint',
    'scary': 'mysterious',
    'frightening': 'interesting',
    'terrifying': 'exciting',
    'nightmare': 'dream',
    'monster': 'friendly creature',
    'ghost': 'friendly spirit',
    'dangerous': 'adventurous',
  },
  es: {
    'solo': 'con sus amigos animales',
    'aislado': 'en un lugar acogedor',
    'arma': 'herramienta mágica',
    'aterrador': 'misterioso',
    'pesadilla': 'sueño',
  },
  fr: {
    'seul': 'avec ses amis animaux',
    'isolé': 'dans un endroit confortable',
    'arme': 'outil magique',
    'effrayant': 'mystérieux',
    'cauchemar': 'rêve',
  },
  de: {
    'allein': 'mit Tierfreunden',
    'isoliert': 'an einem gemütlichen Ort',
    'Waffe': 'magisches Werkzeug',
    'gruselig': 'geheimnisvoll',
    'Albtraum': 'Traum',
  },
  it: {
    'solo': 'con i suoi amici animali',
    'isolato': 'in un posto accogliente',
    'arma': 'strumento magico',
    'spaventoso': 'misterioso',
    'incubo': 'sogno',
  },
};

/**
 * Filter prompt content to ensure child safety and DALL-E compliance
 */
export function filterPrompt(prompt: string, language: string = 'en'): FilterResult {
  let filtered = prompt;
  const replacements: Array<{ original: string; replacement: string; reason: string }> = [];
  let riskLevel: FilterResult['riskLevel'] = 'safe';

  // Get language-specific terms (fallback to English)
  const safetyTerms = SAFETY_TERMS[language] || SAFETY_TERMS.en;
  const replacementMap = SAFE_REPLACEMENTS[language] || SAFE_REPLACEMENTS.en;

  // Check each safety term
  for (const term of safetyTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    if (regex.test(filtered)) {
      const replacement = replacementMap[term.toLowerCase()] || 'friendly';
      const matches = filtered.match(regex);

      if (matches) {
        // Determine risk level
        if (term.includes('alone') || term.includes('isolated') || term.includes('abandoned')) {
          riskLevel = 'high';
        } else if (term.includes('weapon') || term.includes('violence') || term.includes('blood')) {
          riskLevel = riskLevel === 'high' ? 'high' : 'medium';
        } else if (riskLevel === 'safe') {
          riskLevel = 'low';
        }

        filtered = filtered.replace(regex, replacement);

        replacements.push({
          original: term,
          replacement,
          reason: getReason(term),
        });
      }
    }
  }

  // Additional DALL-E specific filters
  filtered = applyDALLEPolicyFilters(filtered, replacements);

  return {
    filtered,
    wasModified: replacements.length > 0,
    replacements,
    riskLevel,
  };
}

/**
 * Apply DALL-E specific content policy filters
 */
function applyDALLEPolicyFilters(
  prompt: string,
  replacements: FilterResult['replacements']
): string {
  let filtered = prompt;

  // Remove specific people references
  const peoplePattern = /\b(celebrity|famous person|politician|historical figure)\b/gi;
  if (peoplePattern.test(filtered)) {
    filtered = filtered.replace(peoplePattern, 'character');
    replacements.push({
      original: 'specific person reference',
      replacement: 'character',
      reason: 'DALL-E policy: no specific people',
    });
  }

  // Soften any remaining intense language
  const intensePatterns = [
    { pattern: /\bintense\b/gi, replacement: 'interesting' },
    { pattern: /\bdark\b/gi, replacement: 'mysterious' },
    { pattern: /\bevil\b/gi, replacement: 'mischievous' },
  ];

  for (const { pattern, replacement } of intensePatterns) {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, replacement);
    }
  }

  return filtered;
}

/**
 * Get reason for term filtering
 */
function getReason(term: string): string {
  if (term.includes('alone') || term.includes('isolated') || term.includes('abandoned')) {
    return 'Isolation concerns for child safety';
  }
  if (term.includes('weapon') || term.includes('gun') || term.includes('knife')) {
    return 'Violence/weapon content not suitable for children';
  }
  if (term.includes('scary') || term.includes('frightening') || term.includes('nightmare')) {
    return 'Fear-inducing content not suitable for bedtime stories';
  }
  if (term.includes('nude') || term.includes('naked') || term.includes('explicit')) {
    return 'Inappropriate content for children';
  }
  return 'Content policy compliance';
}

/**
 * Pre-validate prompt before sending to OpenAI
 * Returns true if prompt is safe, false if it should be rejected
 */
export function validatePrompt(prompt: string, language: string = 'en'): boolean {
  const result = filterPrompt(prompt, language);

  // Reject prompts with high risk level
  if (result.riskLevel === 'high') {
    console.warn('Prompt rejected due to high risk level:', {
      replacements: result.replacements,
    });
    return false;
  }

  return true;
}

/**
 * Log filtering results for monitoring
 */
export function logFilterResults(result: FilterResult, context: string): void {
  if (result.wasModified) {
    console.log(`Content filtered in ${context}:`, {
      riskLevel: result.riskLevel,
      replacementCount: result.replacements.length,
      replacements: result.replacements.map((r) => ({
        original: r.original,
        reason: r.reason,
      })),
    });
  }
}
