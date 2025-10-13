/**
 * OpenAI Client Wrapper
 *
 * Central configuration for OpenAI API integration.
 * Handles API key management, rate limiting, and error handling.
 */

import OpenAI from 'openai';

// Environment configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AI_ENABLED = process.env.AI_ENABLED === 'true';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

// Singleton client instance
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 * @throws Error if AI is disabled or API key is missing
 */
export function getOpenAIClient(): OpenAI {
  if (!AI_ENABLED) {
    throw new Error('AI features are disabled. Set AI_ENABLED=true in environment variables.');
  }

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY in environment variables.');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return AI_ENABLED && !!OPENAI_API_KEY;
}

/**
 * Get configured AI model
 */
export function getAIModel(): string {
  return AI_MODEL;
}

/**
 * Call OpenAI Chat Completion API with structured output
 * @param systemPrompt System instructions for the AI
 * @param userPrompt User input/question
 * @param options Optional parameters (temperature, max_tokens, etc.)
 */
export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json_object' | 'text';
  } = {}
): Promise<string> {
  const client = getOpenAIClient();
  const {
    temperature = 0.3, // Lower temperature for more deterministic results
    maxTokens = 500,
    responseFormat = 'json_object',
  } = options;

  try {
    const completion = await client.chat.completions.create({
      model: getAIModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI API');
    }

    return content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error instanceof Error) {
      throw new Error(`AI request failed: ${error.message}`);
    }
    throw new Error('AI request failed with unknown error');
  }
}

/**
 * Create embeddings for text (used for semantic similarity)
 * @param text Text to embed
 * @returns Embedding vector (1536 dimensions for text-embedding-3-small)
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('OpenAI Embeddings error:', error);
    if (error instanceof Error) {
      throw new Error(`Embedding creation failed: ${error.message}`);
    }
    throw new Error('Embedding creation failed with unknown error');
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param vecA First embedding vector
 * @param vecB Second embedding vector
 * @returns Similarity score (0-1, higher is more similar)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Rate limiting for AI requests
 * Simple in-memory rate limiter (for production, use Redis)
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkAIRateLimit(userId: string, maxRequests = 100, windowMs = 60000): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
} {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    // Reset or initialize
    requestCounts.set(userId, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  if (userLimit.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(userLimit.resetAt),
    };
  }

  userLimit.count++;
  return {
    allowed: true,
    remaining: maxRequests - userLimit.count,
    resetAt: new Date(userLimit.resetAt),
  };
}
