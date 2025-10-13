/**
 * Translation Validation Utilities
 *
 * Tools for validating translation completeness and finding missing keys
 */

import enMessages from '@/messages/en.json';
import frMessages from '@/messages/fr.json';

type Messages = typeof enMessages;
type TranslationPath = string;

/**
 * Get all translation keys from a nested object
 */
function getAllKeys(obj: any, prefix = ''): TranslationPath[] {
  const keys: TranslationPath[] = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Find missing translation keys between two locales
 */
export function findMissingKeys(
  sourceMessages: Messages,
  targetMessages: Messages
): TranslationPath[] {
  const sourceKeys = new Set(getAllKeys(sourceMessages));
  const targetKeys = new Set(getAllKeys(targetMessages));

  const missing: TranslationPath[] = [];

  for (const key of sourceKeys) {
    if (!targetKeys.has(key)) {
      missing.push(key);
    }
  }

  return missing;
}

/**
 * Find extra keys that exist in target but not in source
 */
export function findExtraKeys(
  sourceMessages: Messages,
  targetMessages: Messages
): TranslationPath[] {
  const sourceKeys = new Set(getAllKeys(sourceMessages));
  const targetKeys = new Set(getAllKeys(targetMessages));

  const extra: TranslationPath[] = [];

  for (const key of targetKeys) {
    if (!sourceKeys.has(key)) {
      extra.push(key);
    }
  }

  return extra;
}

/**
 * Validate translation completeness
 */
export function validateTranslations() {
  const enKeys = getAllKeys(enMessages);
  const frKeys = getAllKeys(frMessages);

  const missingInFrench = findMissingKeys(enMessages, frMessages);
  const extraInFrench = findExtraKeys(enMessages, frMessages);

  return {
    totalKeys: enKeys.length,
    englishKeys: enKeys.length,
    frenchKeys: frKeys.length,
    missingInFrench,
    extraInFrench,
    isComplete: missingInFrench.length === 0 && extraInFrench.length === 0,
  };
}

/**
 * Get translation coverage percentage
 */
export function getTranslationCoverage(locale: 'fr'): number {
  const enKeys = getAllKeys(enMessages);
  const targetMessages = locale === 'fr' ? frMessages : enMessages;
  const targetKeys = getAllKeys(targetMessages);

  return (targetKeys.length / enKeys.length) * 100;
}

/**
 * Generate a report of missing translations
 */
export function generateMissingTranslationsReport(): string {
  const validation = validateTranslations();

  let report = '# Translation Validation Report\n\n';
  report += `## Summary\n\n`;
  report += `- Total keys in English: ${validation.englishKeys}\n`;
  report += `- Total keys in French: ${validation.frenchKeys}\n`;
  report += `- Coverage: ${((validation.frenchKeys / validation.englishKeys) * 100).toFixed(2)}%\n`;
  report += `- Complete: ${validation.isComplete ? 'Yes ✅' : 'No ❌'}\n\n`;

  if (validation.missingInFrench.length > 0) {
    report += `## Missing in French (${validation.missingInFrench.length})\n\n`;
    validation.missingInFrench.forEach((key) => {
      report += `- \`${key}\`\n`;
    });
    report += '\n';
  }

  if (validation.extraInFrench.length > 0) {
    report += `## Extra in French (${validation.extraInFrench.length})\n\n`;
    validation.extraInFrench.forEach((key) => {
      report += `- \`${key}\`\n`;
    });
    report += '\n';
  }

  return report;
}

/**
 * Check if a translation key exists
 */
export function hasTranslation(key: string, locale: 'en' | 'fr'): boolean {
  const messages = locale === 'en' ? enMessages : frMessages;
  const keys = getAllKeys(messages);
  return keys.includes(key);
}
