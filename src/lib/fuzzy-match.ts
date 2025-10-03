import { prisma } from '@/lib/prisma';
import type { Feedback } from '@prisma/client';

/**
 * Fuzzy Match Utility
 * Uses Dice coefficient (Sørensen-Dice) for string similarity
 * Threshold: 0.86 similarity per DSL spec
 */

/**
 * Generates bigrams (pairs of consecutive characters) from a string
 * @param str - Input string
 * @returns Set of bigrams
 */
function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  const normalized = str.toLowerCase().trim();

  for (let i = 0; i < normalized.length - 1; i++) {
    bigrams.add(normalized.substring(i, i + 2));
  }

  return bigrams;
}

/**
 * Calculates Dice coefficient (Sørensen-Dice) between two strings
 * Formula: 2 * |intersection| / (|set1| + |set2|)
 * Returns a value between 0 (no similarity) and 1 (identical)
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1
 */
export function getSimilarityScore(str1: string, str2: string): number {
  // Handle edge cases
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  // Strings shorter than 2 characters cannot form bigrams
  if (str1.length < 2 || str2.length < 2) {
    return str1.toLowerCase() === str2.toLowerCase() ? 1 : 0;
  }

  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);

  // Calculate intersection
  let intersection = 0;
  bigrams1.forEach((bigram) => {
    if (bigrams2.has(bigram)) {
      intersection++;
    }
  });

  // Dice coefficient formula
  const diceCoefficient = (2 * intersection) / (bigrams1.size + bigrams2.size);

  return diceCoefficient;
}

/**
 * Alternative: Levenshtein distance normalized to similarity score
 * Kept as backup/alternative implementation
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1
 */
export function getLevenshteinSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const len1 = s1.length;
  const len2 = s2.length;

  // Create distance matrix
  const matrix: number[][] = Array.from({ length: len1 + 1 }, () =>
    Array(len2 + 1).fill(0)
  );

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);

  // Normalize to similarity score
  return 1 - distance / maxLen;
}

/**
 * Finds duplicate feedback items based on title similarity
 * Uses Dice coefficient with 0.86 threshold per DSL spec
 * @param title - Title to search for duplicates
 * @param excludeId - Feedback ID to exclude from results (optional)
 * @param threshold - Similarity threshold (default: 0.86)
 * @returns Array of similar feedback items with similarity scores
 */
export async function findDuplicates(
  title: string,
  excludeId?: string,
  threshold: number = 0.86
): Promise<Array<Feedback & { similarity: number }>> {
  // Get all non-merged feedback items
  const allFeedback = await prisma.feedback.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      state: { not: 'merged' }, // Exclude already merged items
    },
    select: {
      id: true,
      title: true,
      body: true,
      authorId: true,
      villageId: true,
      visibility: true,
      source: true,
      featureId: true,
      state: true,
      moderationStatus: true,
      moderationSignals: true,
      duplicateOfId: true,
      attachments: true,
      i18nData: true,
      createdAt: true,
      updatedAt: true,
      editWindowEndsAt: true,
      toxicityScore: true,
      spamScore: true,
      offTopicScore: true,
      hasPii: true,
      needsReview: true,
      moderatedBy: true,
      moderatedAt: true,
    },
  });

  // Calculate similarity scores
  const candidates = allFeedback
    .map((feedback) => ({
      ...feedback,
      similarity: getSimilarityScore(title, feedback.title),
    }))
    .filter((item) => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity); // Sort by similarity desc

  return candidates;
}

/**
 * Finds the best matching duplicate for a given title
 * Returns the single most similar item above threshold
 * @param title - Title to search for duplicates
 * @param excludeId - Feedback ID to exclude from results (optional)
 * @param threshold - Similarity threshold (default: 0.86)
 * @returns Best matching feedback item or null
 */
export async function findBestMatch(
  title: string,
  excludeId?: string,
  threshold: number = 0.86
): Promise<(Feedback & { similarity: number }) | null> {
  const duplicates = await findDuplicates(title, excludeId, threshold);
  return duplicates.length > 0 ? duplicates[0] : null;
}
