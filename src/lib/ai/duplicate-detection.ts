/**
 * AI-Powered Semantic Duplicate Detection
 *
 * Uses OpenAI embeddings to detect semantically similar feedback.
 * More accurate than fuzzy string matching as it understands meaning.
 * Complements existing Dice coefficient matching.
 */

import { prisma } from '@/lib/prisma';
import { createEmbedding, cosineSimilarity, isAIEnabled } from './openai-client';

/**
 * Semantic duplicate result
 */
export interface SemanticDuplicate {
  id: string;
  title: string;
  body: string;
  similarity: number; // 0-1 (higher is more similar)
  state: string;
  voteCount?: number;
  voteWeight?: number;
  createdAt: Date;
}

/**
 * Threshold for semantic similarity (per DSL spec: 0.85)
 */
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Find semantic duplicates using embeddings
 * @param title Feedback title
 * @param body Feedback body
 * @param threshold Similarity threshold (default: 0.85)
 * @returns Array of similar feedback items
 */
export async function findSemanticDuplicates(
  title: string,
  body: string,
  threshold = SIMILARITY_THRESHOLD
): Promise<SemanticDuplicate[]> {
  if (!isAIEnabled()) {
    console.warn('Semantic duplicate detection disabled: AI_ENABLED not set');
    return [];
  }

  try {
    // Create embedding for the input feedback
    const inputText = `${title}\n\n${body}`;
    const inputEmbedding = await createEmbedding(inputText);

    // Fetch all feedback with their embeddings
    // Note: In production, you'd want to store embeddings in the database
    // and use vector similarity search (e.g., pgvector for PostgreSQL)
    const allFeedback = await prisma.feedback.findMany({
      where: {
        state: {
          not: 'closed', // Don't check against closed feedback
        },
      },
      select: {
        id: true,
        title: true,
        body: true,
        state: true,
        createdAt: true,
      },
      // Limit to recent feedback for performance
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate similarities
    const duplicates: SemanticDuplicate[] = [];

    for (const feedback of allFeedback) {
      // Create embedding for existing feedback
      const feedbackText = `${feedback.title}\n\n${feedback.body}`;
      const feedbackEmbedding = await createEmbedding(feedbackText);

      // Calculate cosine similarity
      const similarity = cosineSimilarity(inputEmbedding, feedbackEmbedding);

      // Check if similar enough
      if (similarity >= threshold) {
        // Fetch vote stats
        const voteStats = await prisma.vote.aggregate({
          where: { feedbackId: feedback.id },
          _count: true,
          _sum: { decayedWeight: true },
        });

        duplicates.push({
          id: feedback.id,
          title: feedback.title,
          body: feedback.body,
          similarity,
          state: feedback.state,
          voteCount: voteStats._count || 0,
          voteWeight: voteStats._sum.decayedWeight || 0,
          createdAt: feedback.createdAt,
        });
      }
    }

    // Sort by similarity (highest first)
    duplicates.sort((a, b) => b.similarity - a.similarity);

    return duplicates;
  } catch (error) {
    console.error('Error finding semantic duplicates:', error);
    return [];
  }
}

/**
 * Find duplicates for existing feedback
 * @param feedbackId Feedback ID to check
 * @param threshold Similarity threshold
 * @returns Array of similar feedback items
 */
export async function findDuplicatesForFeedback(
  feedbackId: string,
  threshold = SIMILARITY_THRESHOLD
): Promise<SemanticDuplicate[]> {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { title: true, body: true },
  });

  if (!feedback) {
    throw new Error('Feedback not found');
  }

  const duplicates = await findSemanticDuplicates(
    feedback.title,
    feedback.body,
    threshold
  );

  // Filter out the original feedback
  return duplicates.filter((d) => d.id !== feedbackId);
}

/**
 * Check if feedback is likely a duplicate
 * @param title Feedback title
 * @param body Feedback body
 * @param threshold Similarity threshold
 * @returns True if duplicates found, false otherwise
 */
export async function isDuplicate(
  title: string,
  body: string,
  threshold = SIMILARITY_THRESHOLD
): Promise<boolean> {
  const duplicates = await findSemanticDuplicates(title, body, threshold);
  return duplicates.length > 0;
}

/**
 * Get similarity level description
 * @param similarity Similarity score (0-1)
 * @returns Human-readable description
 */
export function getSimilarityLevel(similarity: number): string {
  if (similarity >= 0.95) return 'Almost Identical';
  if (similarity >= 0.9) return 'Very Similar';
  if (similarity >= 0.85) return 'Similar';
  if (similarity >= 0.75) return 'Somewhat Similar';
  return 'Different';
}

/**
 * Combine fuzzy and semantic duplicate detection
 * Uses both Dice coefficient (existing) and embeddings (new)
 */
export async function findAllDuplicates(
  title: string,
  body: string
): Promise<{
  fuzzyDuplicates: Array<{ id: string; title: string; similarity: number }>;
  semanticDuplicates: SemanticDuplicate[];
  combinedDuplicates: SemanticDuplicate[];
}> {
  // Import fuzzy matching function
  const { findDuplicates: findFuzzyDuplicates } = await import('@/lib/fuzzy-match');

  // Run both detection methods in parallel
  const [fuzzyDuplicates, semanticDuplicates] = await Promise.all([
    findFuzzyDuplicates(title),
    isAIEnabled() ? findSemanticDuplicates(title, body, 0.85) : Promise.resolve([]),
  ]);

  // Combine and deduplicate results
  const duplicateMap = new Map<string, SemanticDuplicate>();

  // Add semantic duplicates (more accurate)
  for (const dup of semanticDuplicates) {
    duplicateMap.set(dup.id, dup);
  }

  // Add fuzzy duplicates not already found
  for (const dup of fuzzyDuplicates) {
    if (!duplicateMap.has(dup.id)) {
      // Fetch full details for fuzzy matches
      const feedback = await prisma.feedback.findUnique({
        where: { id: dup.id },
        include: {
          _count: {
            select: { votes: true },
          },
        },
      });

      if (feedback) {
        const voteStats = await prisma.vote.aggregate({
          where: { feedbackId: feedback.id },
          _sum: { decayedWeight: true },
        });

        duplicateMap.set(dup.id, {
          id: dup.id,
          title: dup.title,
          body: feedback.body,
          similarity: dup.similarity,
          state: dup.state,
          voteCount: feedback._count.votes,
          voteWeight: voteStats._sum.decayedWeight || 0,
          createdAt: feedback.createdAt,
        });
      }
    }
  }

  // Convert map to array and sort by similarity
  const combinedDuplicates = Array.from(duplicateMap.values()).sort(
    (a, b) => b.similarity - a.similarity
  );

  return {
    fuzzyDuplicates,
    semanticDuplicates,
    combinedDuplicates,
  };
}

/**
 * Generate embedding for feedback and store it
 * (For future optimization: pre-compute and store embeddings)
 */
export async function generateAndStoreFeedbackEmbedding(feedbackId: string): Promise<void> {
  if (!isAIEnabled()) return;

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { title: true, body: true },
  });

  if (!feedback) return;

  const text = `${feedback.title}\n\n${feedback.body}`;
  const embedding = await createEmbedding(text);

  // TODO: Store embedding in database
  // This would require adding an embedding column to the Feedback table
  // For now, embeddings are computed on-demand
  console.log(`Generated embedding for feedback ${feedbackId}: ${embedding.length} dimensions`);
}
