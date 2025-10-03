/**
 * PII Redaction Utility
 * Detects and masks personally identifiable information in feedback text
 * Strategy: Mask with ***[last4] to maintain last 4 characters
 */

interface PIIPattern {
  name: string;
  regex: RegExp;
  description: string;
}

const PII_PATTERNS: PIIPattern[] = [
  {
    name: 'phone',
    regex: /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    description: 'Phone numbers with various formats',
  },
  {
    name: 'email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    description: 'Email addresses',
  },
  {
    name: 'room',
    regex: /\b(?:room|chambre|rm)\s*#?\s*\d{3,4}\b/gi,
    description: 'Room numbers',
  },
  {
    name: 'reservation',
    regex: /\b(?:RES|RESV|reservation|réservation)\s*#?\s*[A-Z0-9]{6,}\b/gi,
    description: 'Reservation IDs',
  },
];

/**
 * Masks a string by keeping only the last N characters
 * @param text - Original text to mask
 * @param keepLast - Number of characters to keep at the end (default: 4)
 * @returns Masked string in format ***[last4]
 */
function maskWithLastChars(text: string, keepLast: number = 4): string {
  if (text.length <= keepLast) {
    return '***';
  }
  const lastChars = text.slice(-keepLast);
  return `***${lastChars}`;
}

/**
 * Redacts PII from text using pattern matching
 * Applies masking strategy: ***[last4]
 * @param text - Input text potentially containing PII
 * @returns Text with PII redacted
 */
export function redactPII(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let redactedText = text;

  // Apply each PII pattern
  for (const pattern of PII_PATTERNS) {
    redactedText = redactedText.replace(pattern.regex, (match) => {
      return maskWithLastChars(match);
    });
  }

  return redactedText;
}

/**
 * Detects if text contains PII without redacting it
 * Useful for flagging content that needs review
 * @param text - Input text to check
 * @returns Array of detected PII types
 */
export function detectPII(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const detected: string[] = [];

  for (const pattern of PII_PATTERNS) {
    if (pattern.regex.test(text)) {
      detected.push(pattern.name);
    }
    // Reset regex lastIndex for global patterns
    pattern.regex.lastIndex = 0;
  }

  return detected;
}

/**
 * Checks if text contains any PII
 * @param text - Input text to check
 * @returns True if PII is detected
 */
export function containsPII(text: string): boolean {
  return detectPII(text).length > 0;
}
