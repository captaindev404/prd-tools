import { encodingForModel } from 'js-tiktoken';
import type { Tiktoken } from 'js-tiktoken';

/**
 * Utility class for tokenizing text using GPT-4o's encoding (cl100k_base).
 * Provides token counting and smart text chunking capabilities.
 *
 * Uses js-tiktoken (pure JavaScript implementation) instead of tiktoken (WASM)
 * to avoid WASM loading issues with Next.js 16 Turbopack.
 *
 * Based on official js-tiktoken documentation:
 * https://github.com/dqbd/tiktoken/tree/main/js
 *
 * Note: js-tiktoken is a pure JS port, so free() is a no-op but kept for API compatibility.
 */
export class StoryTokenizer {
  private encoder: Tiktoken;

  constructor() {
    // GPT-4o uses cl100k_base encoding
    // Using encodingForModel() from js-tiktoken (pure JS, no WASM)
    this.encoder = encodingForModel('gpt-4o');
  }

  /**
   * Count the number of tokens in a text string.
   * @param text - The text to count tokens for
   * @returns Number of tokens
   */
  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  /**
   * Split text into chunks that fit within a token limit.
   * Chunks are created on sentence boundaries to preserve coherence.
   *
   * @param text - The text to chunk
   * @param maxTokens - Maximum tokens per chunk
   * @returns Array of text chunks
   */
  chunkText(text: string, maxTokens: number): string[] {
    const sentences = this.splitIntoSentences(text);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.countTokens(sentence);

      // If adding this sentence would exceed limit and we have content, start new chunk
      if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentTokens = sentenceTokens;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokens += sentenceTokens;
      }
    }

    // Add final chunk
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Split text into sentences while handling common abbreviations.
   * @param text - The text to split
   * @returns Array of sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Smart sentence splitting that handles common abbreviations
    // Split on sentence-ending punctuation followed by whitespace
    return text
      .replace(/([.!?])\s+/g, '$1|||')
      .split('|||')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Free the underlying encoder resources.
   * Note: js-tiktoken is pure JavaScript, so this is a no-op.
   * Kept for API compatibility with WASM version.
   */
  free() {
    // No-op for pure JavaScript implementation
    // js-tiktoken doesn't use WASM, so no resources to free
  }
}
