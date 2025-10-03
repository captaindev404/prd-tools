/**
 * Moderation Scoring Library
 * Provides auto-screening functionality for feedback submissions
 * - Toxicity detection
 * - Spam detection
 * - Off-topic detection
 *
 * All scores range from 0.0 (clean) to 1.0 (highly problematic)
 * Threshold: 0.7 triggers manual review
 */

/**
 * Toxic keywords and patterns
 * This is a basic implementation - can be enhanced with ML models
 */
const TOXIC_KEYWORDS = [
  'idiot', 'stupid', 'hate', 'kill', 'die', 'worst',
  'terrible', 'useless', 'garbage', 'trash', 'crap',
  'suck', 'awful', 'pathetic', 'incompetent', 'moron',
  'imbecile', 'fool', 'dumb', 'worthless'
];

/**
 * Spam patterns
 */
const SPAM_PATTERNS = {
  // Excessive repeated characters (e.g., "aaaaaaa")
  repeatedChars: /(.)\1{5,}/gi,
  // Excessive capital letters
  excessiveCaps: /[A-Z]{10,}/g,
  // Multiple URLs
  urls: /https?:\/\/[^\s]+/gi,
  // Shortened URLs (bit.ly, tinyurl, etc.)
  shortenedUrls: /\b(bit\.ly|tinyurl|goo\.gl|ow\.ly|short\.to|t\.co)\b/gi,
  // Excessive special characters
  specialChars: /[!@#$%^&*()]{5,}/g,
  // Suspicious promotional text
  promotional: /\b(buy|sale|discount|offer|limited time|click here|visit now)\b/gi,
  // Repeated words
  repeatedWords: /\b(\w+)\s+\1\s+\1/gi,
};

/**
 * Off-topic indicators
 */
const OFF_TOPIC_INDICATORS = {
  // Very short submissions (less than useful feedback)
  tooShort: 15,
  // Gibberish patterns (random characters)
  gibberish: /^[^aeiou\s]{15,}$/i,
  // Excessive emojis (simplified pattern without unicode escapes)
  excessiveEmojis: /[\uD800-\uDFFF]{5,}/g,
};

/**
 * Calculate toxicity score for given text
 * @param text - Text to analyze
 * @returns Score from 0.0 to 1.0
 */
export function calculateToxicityScore(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0.0;
  }

  const lowerText = text.toLowerCase();
  let matchCount = 0;
  let weightedScore = 0;

  // Count toxic keyword matches
  for (const keyword of TOXIC_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) {
      matchCount += matches.length;
    }
  }

  // Calculate score based on frequency relative to text length
  const wordCount = text.split(/\s+/).length;
  const frequency = matchCount / Math.max(wordCount, 1);

  // Score scales with frequency, capped at 1.0
  weightedScore = Math.min(frequency * 2, 1.0);

  // Boost score if multiple different toxic words are present
  const uniqueToxicWords = TOXIC_KEYWORDS.filter(keyword =>
    lowerText.includes(keyword)
  ).length;

  if (uniqueToxicWords >= 3) {
    weightedScore = Math.min(weightedScore + 0.2, 1.0);
  }

  return Math.round(weightedScore * 100) / 100; // Round to 2 decimals
}

/**
 * Detect repetitive text patterns
 * @param text - Text to analyze
 * @returns True if repetitive patterns detected
 */
export function detectRepetitiveText(text: string): boolean {
  if (!text) return false;

  // Check for repeated characters (5+ same char in a row)
  if (SPAM_PATTERNS.repeatedChars.test(text)) {
    return true;
  }

  // Check for repeated words (same word 3+ times in a row)
  if (SPAM_PATTERNS.repeatedWords.test(text)) {
    return true;
  }

  return false;
}

/**
 * Detect excessive capitalization
 * @param text - Text to analyze
 * @returns True if more than 50% uppercase
 */
export function detectExcessiveCaps(text: string): boolean {
  if (!text || text.length < 10) return false;

  const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
  const letterCount = (text.match(/[A-Za-z]/g) || []).length;

  if (letterCount === 0) return false;

  const capsPercentage = uppercaseCount / letterCount;
  return capsPercentage > 0.5;
}

/**
 * Detect suspicious URLs
 * @param text - Text to analyze
 * @returns True if multiple URLs or shortened links detected
 */
export function detectSuspiciousURLs(text: string): boolean {
  if (!text) return false;

  // Check for multiple URLs (3 or more)
  const urlMatches = text.match(SPAM_PATTERNS.urls);
  if (urlMatches && urlMatches.length >= 3) {
    return true;
  }

  // Check for shortened URLs (always suspicious in feedback)
  if (SPAM_PATTERNS.shortenedUrls.test(text)) {
    return true;
  }

  return false;
}

/**
 * Detect gibberish (non-dictionary words)
 * @param text - Text to analyze
 * @returns True if high ratio of gibberish detected
 */
export function detectGibberish(text: string): boolean {
  if (!text || text.length < 20) return false;

  // Check for long strings without vowels (likely gibberish)
  const noVowelPattern = /\b[^aeiou\s]{8,}\b/gi;
  const gibberishMatches = text.match(noVowelPattern);

  if (gibberishMatches && gibberishMatches.length >= 2) {
    return true;
  }

  // Check for excessive consonant-only sequences
  const consonantRatio = (text.match(/[bcdfghjklmnpqrstvwxyz]{5,}/gi) || []).length;
  const words = text.split(/\s+/).length;

  return consonantRatio / Math.max(words, 1) > 0.3;
}

/**
 * Calculate enhanced spam score with advanced detection
 * @param text - Text to analyze
 * @returns Score from 0.0 to 1.0
 */
export function calculateSpamScore(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0.0;
  }

  let score = 0.0;
  const indicators: string[] = [];

  // Check for repetitive text
  if (detectRepetitiveText(text)) {
    score += 0.25;
    indicators.push('repetitive_text');
  }

  // Check for excessive capitals
  if (detectExcessiveCaps(text)) {
    score += 0.25;
    indicators.push('excessive_caps');
  }

  // Check for suspicious URLs
  if (detectSuspiciousURLs(text)) {
    score += 0.3;
    indicators.push('suspicious_urls');
  }

  // Check for gibberish
  if (detectGibberish(text)) {
    score += 0.3;
    indicators.push('gibberish');
  }

  // Check for excessive special characters
  const specialMatches = text.match(SPAM_PATTERNS.specialChars);
  if (specialMatches && specialMatches.length > 0) {
    score += 0.15;
    indicators.push('special_chars');
  }

  // Check for promotional language
  const promoMatches = text.match(SPAM_PATTERNS.promotional);
  if (promoMatches && promoMatches.length >= 2) {
    score += 0.2;
    indicators.push('promotional');
  }

  // Cap at 1.0
  score = Math.min(score, 1.0);

  return Math.round(score * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate off-topic score for given text
 * @param text - Text to analyze
 * @returns Score from 0.0 to 1.0
 */
export function calculateOffTopicScore(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0.0;
  }

  let score = 0.0;

  // Check if text is too short to be meaningful feedback
  if (text.trim().length < OFF_TOPIC_INDICATORS.tooShort) {
    score += 0.4;
  }

  // Check for gibberish (long strings without vowels)
  if (OFF_TOPIC_INDICATORS.gibberish.test(text)) {
    score += 0.5;
  }

  // Check for excessive emojis
  const emojiMatches = text.match(OFF_TOPIC_INDICATORS.excessiveEmojis);
  if (emojiMatches && emojiMatches.length > 0) {
    score += 0.3;
  }

  // Check if text has very few actual words
  const wordCount = text.split(/\s+/).filter(word => word.length >= 3).length;
  if (wordCount < 3) {
    score += 0.3;
  }

  // Cap at 1.0
  score = Math.min(score, 1.0);

  return Math.round(score * 100) / 100; // Round to 2 decimals
}

/**
 * Auto-screening result interface
 */
export interface AutoScreeningResult {
  toxicityScore: number;
  spamScore: number;
  offTopicScore: number;
  hasPii: boolean;
  needsReview: boolean;
  moderationStatus: 'pending_review' | 'approved';
  signals: string[];
}

/**
 * Perform complete auto-screening on feedback text
 * @param title - Feedback title
 * @param body - Feedback body
 * @param detectPIIFn - PII detection function (injected to avoid circular deps)
 * @returns Auto-screening result
 */
export function performAutoScreening(
  title: string,
  body: string,
  detectPIIFn: (text: string) => boolean
): AutoScreeningResult {
  // Combine title and body for comprehensive analysis
  const fullText = `${title} ${body}`;

  // Calculate scores
  const toxicityScore = calculateToxicityScore(fullText);
  const spamScore = calculateSpamScore(fullText);
  const offTopicScore = calculateOffTopicScore(fullText);

  // Detect PII
  const hasPii = detectPIIFn(fullText);

  // Determine signals
  const signals: string[] = [];
  if (toxicityScore >= 0.7) signals.push('toxicity');
  if (spamScore >= 0.7) signals.push('spam');
  if (offTopicScore >= 0.7) signals.push('off_topic');
  if (hasPii) signals.push('pii');

  // Determine if manual review is needed
  const needsReview =
    toxicityScore >= 0.7 ||
    spamScore >= 0.7 ||
    offTopicScore >= 0.7 ||
    hasPii;

  // Set moderation status
  const moderationStatus = needsReview ? 'pending_review' : 'approved';

  return {
    toxicityScore,
    spamScore,
    offTopicScore,
    hasPii,
    needsReview,
    moderationStatus,
    signals,
  };
}
