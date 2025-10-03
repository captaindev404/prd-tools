/**
 * Advanced Moderation - Toxicity Detection
 *
 * Provides basic keyword-based toxicity detection for user-generated content.
 * Returns a score from 0.0 to 1.0 indicating the likelihood of toxic content.
 *
 * For production, consider integrating with Perspective API or similar services.
 */

// Weighted toxic keywords and patterns
const TOXIC_KEYWORDS = {
  severe: [
    // Hate speech and severe harassment (weight: 1.0)
    'hate',
    'racist',
    'sexist',
    'bigot',
    'nazi',
    'fascist',
    'terrorist',
    'kill yourself',
    'kys',
    'die',
    'suicide',
  ],
  high: [
    // Strong profanity and threats (weight: 0.8)
    'fuck',
    'shit',
    'bitch',
    'asshole',
    'bastard',
    'damn',
    'crap',
    'piss',
    'moron',
    'idiot',
    'stupid',
    'dumb',
    'loser',
    'pathetic',
    'worthless',
  ],
  moderate: [
    // Mild profanity and insults (weight: 0.5)
    'suck',
    'hell',
    'jerk',
    'fool',
    'ridiculous',
    'absurd',
    'useless',
    'trash',
    'garbage',
    'awful',
    'terrible',
    'horrible',
  ],
  low: [
    // Potentially problematic (weight: 0.3)
    'annoying',
    'irritating',
    'frustrating',
    'disappointing',
    'unacceptable',
    'inappropriate',
  ],
};

/**
 * Check text for toxic content using keyword-based detection
 * @param text - The text to analyze
 * @returns A toxicity score from 0.0 to 1.0
 */
export async function checkToxicity(text: string): Promise<number> {
  if (!text || text.trim().length === 0) {
    return 0.0;
  }

  const normalizedText = text.toLowerCase().trim();
  let score = 0.0;
  let matchCount = 0;

  // Check for severe keywords (weight: 1.0)
  for (const keyword of TOXIC_KEYWORDS.severe) {
    if (normalizedText.includes(keyword)) {
      score += 1.0;
      matchCount++;
    }
  }

  // Check for high-level keywords (weight: 0.8)
  for (const keyword of TOXIC_KEYWORDS.high) {
    if (normalizedText.includes(keyword)) {
      score += 0.8;
      matchCount++;
    }
  }

  // Check for moderate keywords (weight: 0.5)
  for (const keyword of TOXIC_KEYWORDS.moderate) {
    if (normalizedText.includes(keyword)) {
      score += 0.5;
      matchCount++;
    }
  }

  // Check for low-level keywords (weight: 0.3)
  for (const keyword of TOXIC_KEYWORDS.low) {
    if (normalizedText.includes(keyword)) {
      score += 0.3;
      matchCount++;
    }
  }

  // Normalize score (cap at 1.0)
  // Average the scores if multiple matches found
  if (matchCount > 0) {
    score = Math.min(score / matchCount, 1.0);
  }

  // Boost score for multiple toxic keywords
  if (matchCount >= 3) {
    score = Math.min(score * 1.3, 1.0);
  }

  return Number(score.toFixed(2));
}

/**
 * Check if text contains personal attacks
 * @param text - The text to analyze
 * @returns True if personal attack patterns are detected
 */
export function containsPersonalAttack(text: string): boolean {
  const normalizedText = text.toLowerCase();

  const attackPatterns = [
    /you are (stupid|dumb|idiot|moron|worthless|pathetic)/i,
    /you're (stupid|dumb|idiot|moron|worthless|pathetic)/i,
    /your (stupid|dumb|idiotic|moronic)/i,
    /(shut up|go away|get lost|nobody cares)/i,
  ];

  return attackPatterns.some(pattern => pattern.test(normalizedText));
}

/**
 * Get toxicity category based on score
 * @param score - Toxicity score from 0.0 to 1.0
 * @returns Category string
 */
export function getToxicityCategory(score: number): string {
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'moderate';
  if (score >= 0.3) return 'low';
  return 'none';
}

/**
 * Check if content should be auto-flagged based on toxicity
 * @param score - Toxicity score from 0.0 to 1.0
 * @returns True if content should be flagged for review
 */
export function shouldAutoFlag(score: number): boolean {
  return score >= 0.7;
}

// ==========================================
// OPTIONAL: Perspective API Integration
// ==========================================
// Uncomment and configure the following code to use Google's Perspective API
// for more accurate toxicity detection.
//
// Requirements:
// 1. Install the Perspective API client: npm install @conversationai/perspectiveapi-js-client
// 2. Get an API key from https://developers.perspectiveapi.com/s/
// 3. Set PERSPECTIVE_API_KEY in your .env file
//
// import Perspective from '@conversationai/perspectiveapi-js-client';
//
// const perspective = new Perspective({
//   apiKey: process.env.PERSPECTIVE_API_KEY || '',
// });
//
// export async function checkToxicityWithPerspective(text: string): Promise<number> {
//   try {
//     const result = await perspective.analyze({
//       comment: { text },
//       languages: ['en', 'fr'],
//       requestedAttributes: {
//         TOXICITY: {},
//         SEVERE_TOXICITY: {},
//         IDENTITY_ATTACK: {},
//         INSULT: {},
//         PROFANITY: {},
//         THREAT: {},
//       },
//     });
//
//     // Get the highest score from all attributes
//     const scores = Object.values(result.attributeScores).map(
//       (attr: any) => attr.summaryScore.value
//     );
//     const maxScore = Math.max(...scores);
//
//     return Number(maxScore.toFixed(2));
//   } catch (error) {
//     console.error('Perspective API error:', error);
//     // Fallback to basic keyword detection
//     return checkToxicity(text);
//   }
// }
//
// Usage:
// const score = await checkToxicityWithPerspective(feedbackBody);
