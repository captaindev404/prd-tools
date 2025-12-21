/**
 * SanitizationService - Centralized content sanitization
 *
 * Handles all prompt sanitization with centralized rules:
 * - Term replacements (phrase and word level)
 * - Prompt injection detection
 * - Risk level assessment
 * - Positive element additions
 */

import {
  PHRASE_REPLACEMENTS,
  WORD_REPLACEMENTS,
  BANNED_PATTERNS,
  HIGH_RISK_TERMS,
  MEDIUM_RISK_TERMS,
  POSITIVE_ADDITIONS,
  CHILD_FRIENDLY_SUFFIX,
  COMPANION_SUFFIX,
} from './rules';

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high';

export interface SanitizationResult {
  sanitized: string;
  original: string;
  wasModified: boolean;
  riskLevel: RiskLevel;
  replacements: Array<{
    original: string;
    replacement: string;
    reason: string;
  }>;
  injectionAttempts: string[];
}

export class SanitizationService {
  /**
   * Sanitize a prompt for child-safe content
   */
  static sanitize(prompt: string, language: string = 'en'): SanitizationResult {
    const original = prompt;
    let sanitized = prompt;
    const replacements: SanitizationResult['replacements'] = [];
    const injectionAttempts: string[] = [];

    // Step 1: Remove non-ASCII characters (preserve basic Latin characters)
    sanitized = sanitized.replace(/[^\x00-\x7F\u00C0-\u024F]/g, '');

    // Step 2: Check for prompt injection attempts
    for (const pattern of BANNED_PATTERNS) {
      const match = sanitized.match(pattern);
      if (match) {
        injectionAttempts.push(match[0]);
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // Step 3: Apply phrase replacements (language-specific)
    const phraseRules = PHRASE_REPLACEMENTS[language] || PHRASE_REPLACEMENTS.en;
    for (const [phrase, replacement] of phraseRules) {
      const regex = new RegExp(phrase, 'gi');
      if (regex.test(sanitized)) {
        sanitized = sanitized.replace(regex, replacement);
        replacements.push({
          original: phrase,
          replacement,
          reason: 'Phrase replacement for child safety',
        });
      }
    }

    // Step 4: Apply word replacements (language-specific)
    const wordRules = WORD_REPLACEMENTS[language] || WORD_REPLACEMENTS.en;
    for (const [word, replacement, category] of wordRules) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(sanitized)) {
        sanitized = sanitized.replace(regex, replacement);
        replacements.push({
          original: word,
          replacement,
          reason: `${category} content replacement`,
        });
      }
    }

    // Step 5: Ensure positive elements are present
    sanitized = this.ensurePositiveElements(sanitized);

    // Step 6: Calculate risk level
    const riskLevel = this.calculateRiskLevel(original, replacements, injectionAttempts);

    return {
      sanitized,
      original,
      wasModified: sanitized !== original,
      riskLevel,
      replacements,
      injectionAttempts,
    };
  }

  /**
   * Validate a prompt without modifying it
   * Returns true if safe, false if should be rejected
   */
  static validate(prompt: string, language: string = 'en'): boolean {
    const result = this.sanitize(prompt, language);
    return result.riskLevel !== 'high';
  }

  /**
   * Check for high-risk terms that should block content
   */
  static containsHighRiskContent(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    return HIGH_RISK_TERMS.some((term) => lowerPrompt.includes(term));
  }

  /**
   * Ensure positive elements are present in the prompt
   */
  private static ensurePositiveElements(prompt: string): string {
    let result = prompt;
    const lowerPrompt = prompt.toLowerCase();

    // Check for companionship indicators
    const hasCompanions = POSITIVE_ADDITIONS.companionship.some(
      (term) => lowerPrompt.includes(term)
    );

    if (!hasCompanions) {
      result = result.replace(/\.$/, '');
      result += ` ${COMPANION_SUFFIX}`;
    }

    // Check for brightness indicators
    const hasBrightness = POSITIVE_ADDITIONS.brightness.some(
      (term) => lowerPrompt.includes(term)
    );

    if (!hasBrightness) {
      result += ` ${CHILD_FRIENDLY_SUFFIX}`;
    }

    return result;
  }

  /**
   * Calculate risk level based on content analysis
   */
  private static calculateRiskLevel(
    original: string,
    replacements: SanitizationResult['replacements'],
    injectionAttempts: string[]
  ): RiskLevel {
    const lowerOriginal = original.toLowerCase();

    // High risk: injection attempts or high-risk terms
    if (injectionAttempts.length > 0) {
      return 'high';
    }

    if (HIGH_RISK_TERMS.some((term) => lowerOriginal.includes(term))) {
      return 'high';
    }

    // Medium risk: violence/weapon terms
    if (MEDIUM_RISK_TERMS.some((term) => lowerOriginal.includes(term))) {
      return 'medium';
    }

    // Low risk: some replacements made
    if (replacements.length > 0) {
      return 'low';
    }

    return 'safe';
  }

  /**
   * Log sanitization results for monitoring
   */
  static logResults(result: SanitizationResult, context: string): void {
    if (result.wasModified) {
      console.log(`Content filtered in ${context}:`, {
        riskLevel: result.riskLevel,
        replacementCount: result.replacements.length,
        injectionAttempts: result.injectionAttempts.length,
        replacements: result.replacements.map((r) => ({
          original: r.original,
          reason: r.reason,
        })),
      });
    }

    if (result.injectionAttempts.length > 0) {
      console.warn(`Prompt injection attempts detected in ${context}:`, result.injectionAttempts);
    }
  }
}
