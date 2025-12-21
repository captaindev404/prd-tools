/**
 * Content Policy Filter for Child-Safe Content
 * Based on DALL-E content policy and child safety requirements
 *
 * This filter ensures all prompts sent to OpenAI APIs are:
 * 1. Child-appropriate (no adult content, violence, etc.)
 * 2. DALL-E policy compliant
 * 3. Safe for children aged 3-12
 * 4. Multi-language supported
 *
 * NOTE: This module now uses the centralized SanitizationService.
 * The filterPrompt and validatePrompt functions are maintained for backwards compatibility.
 */

import { SanitizationService, type SanitizationResult, type RiskLevel } from '@/lib/prompts';

export interface FilterResult {
  filtered: string;
  wasModified: boolean;
  replacements: Array<{ original: string; replacement: string; reason: string }>;
  riskLevel: RiskLevel;
}

/**
 * Filter prompt content to ensure child safety and DALL-E compliance
 * Now delegates to centralized SanitizationService
 */
export function filterPrompt(prompt: string, language: string = 'en'): FilterResult {
  const result = SanitizationService.sanitize(prompt, language);

  return {
    filtered: result.sanitized,
    wasModified: result.wasModified,
    replacements: result.replacements,
    riskLevel: result.riskLevel,
  };
}

/**
 * Pre-validate prompt before sending to OpenAI
 * Returns true if prompt is safe, false if it should be rejected
 */
export function validatePrompt(prompt: string, language: string = 'en'): boolean {
  return SanitizationService.validate(prompt, language);
}

/**
 * Log filtering results for monitoring
 */
export function logFilterResults(result: FilterResult, context: string): void {
  SanitizationService.logResults(
    {
      sanitized: result.filtered,
      original: '',
      wasModified: result.wasModified,
      riskLevel: result.riskLevel,
      replacements: result.replacements,
      injectionAttempts: [],
    },
    context
  );
}
