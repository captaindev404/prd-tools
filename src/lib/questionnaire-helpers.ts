/**
 * Questionnaire Helper Utilities
 *
 * This module provides helper functions for questionnaire data transformation
 * and backward compatibility with older bilingual formats.
 *
 * @version 0.6.0
 */

/**
 * Normalizes question text from old bilingual format to new English-only format
 *
 * This function ensures backward compatibility with questionnaires created before v0.6.0
 * that used the bilingual {en, fr} format.
 *
 * @param text - Question text (string or bilingual object)
 * @returns Normalized English text
 * @throws Error if input format is invalid
 *
 * @example
 * // New format (v0.6.0+)
 * normalizeQuestionText("What is your name?")
 * // => "What is your name?"
 *
 * @example
 * // Old format (pre-v0.6.0)
 * normalizeQuestionText({ en: "What is your name?", fr: "Quel est votre nom?" })
 * // => "What is your name?"
 */
export function normalizeQuestionText(
  text: string | { en: string; fr: string }
): string {
  // New format: plain string
  if (typeof text === 'string') {
    return text;
  }

  // Old format: bilingual object
  if (text && typeof text === 'object' && 'en' in text) {
    return text.en || '';
  }

  // Invalid format
  throw new Error(
    'Invalid question text format. Expected string or { en: string, fr: string }'
  );
}

/**
 * Normalizes an array of question texts
 *
 * @param texts - Array of question texts (mixed formats)
 * @returns Array of normalized English texts
 *
 * @example
 * normalizeQuestionTexts([
 *   "Question 1",
 *   { en: "Question 2", fr: "Question 2 FR" }
 * ])
 * // => ["Question 1", "Question 2"]
 */
export function normalizeQuestionTexts(
  texts: Array<string | { en: string; fr: string }>
): string[] {
  return texts.map((text) => normalizeQuestionText(text));
}

/**
 * Checks if question text is in old bilingual format
 *
 * @param text - Question text to check
 * @returns True if text is in old {en, fr} format
 *
 * @example
 * isBilingualFormat("Hello") // => false
 * isBilingualFormat({ en: "Hello", fr: "Bonjour" }) // => true
 */
export function isBilingualFormat(
  text: unknown
): text is { en: string; fr: string } {
  return (
    typeof text === 'object' &&
    text !== null &&
    'en' in text &&
    'fr' in text &&
    typeof (text as any).en === 'string' &&
    typeof (text as any).fr === 'string'
  );
}

/**
 * Normalizes MCQ option labels from old format to new format
 *
 * @param options - MCQ options (mixed formats)
 * @returns Normalized options with English labels
 *
 * @example
 * // Old format
 * normalizeMcqOptions([
 *   { id: '1', text: { en: "Option 1", fr: "Option 1 FR" }, order: 1 }
 * ])
 * // => [{ id: '1', text: "Option 1", order: 1 }]
 */
export function normalizeMcqOptions<T extends { text: any }>(
  options: T[]
): Array<Omit<T, 'text'> & { text: string }> {
  return options.map((option) => ({
    ...option,
    text: normalizeQuestionText(option.text),
  }));
}

/**
 * Type guard to check if a question uses the old bilingual format
 *
 * @param question - Question object to check
 * @returns True if question uses old format
 */
export function isLegacyQuestion(question: {
  text: any;
}): question is { text: { en: string; fr: string } } {
  return isBilingualFormat(question.text);
}

/**
 * Logs a deprecation warning for old bilingual format usage (development only)
 *
 * @param context - Context where the old format was detected
 */
export function warnBilingualDeprecation(context: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[Deprecation Warning] Bilingual question format detected in ${context}. ` +
        'This format is deprecated as of v0.6.0. ' +
        'Please use plain string for question text. ' +
        'Backward compatibility is maintained but will be removed in v0.8.0.'
    );
  }
}
