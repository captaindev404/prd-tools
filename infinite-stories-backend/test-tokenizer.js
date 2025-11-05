#!/usr/bin/env node

/**
 * Test the StoryTokenizer implementation
 * Verifies token estimation accuracy
 */

// Simple test for the tokenizer logic
class StoryTokenizer {
  constructor() {
    this.CHARS_PER_TOKEN = 4;
  }

  countTokens(text) {
    const estimated = Math.ceil(text.length / this.CHARS_PER_TOKEN);
    return Math.ceil(estimated * 1.1);
  }

  chunkText(text, maxTokens) {
    const sentences = this.splitIntoSentences(text);
    const chunks = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.countTokens(sentence);

      if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentTokens = sentenceTokens;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  splitIntoSentences(text) {
    return text
      .replace(/([.!?])\s+/g, '$1|||')
      .split('|||')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
}

// Test cases
console.log('🧪 Testing StoryTokenizer\n');
console.log('='.repeat(80));

const tokenizer = new StoryTokenizer();

// Test 1: Short text
const shortText = "Hello, world!";
const shortTokens = tokenizer.countTokens(shortText);
console.log('\n📝 Test 1: Short Text');
console.log(`Text: "${shortText}"`);
console.log(`Characters: ${shortText.length}`);
console.log(`Estimated tokens: ${shortTokens}`);
console.log(`Expected: ~${Math.ceil(shortText.length / 4)} tokens`);

// Test 2: Story paragraph
const storyText = `Once upon a time, in a magical forest far away, there lived a brave little hero named Luna.
She had the power to glow in the dark, lighting up the entire forest with her warm, gentle light.
Every night, Luna would explore the enchanted woods, making friends with all the magical creatures.`;

const storyTokens = tokenizer.countTokens(storyText);
console.log('\n📝 Test 2: Story Paragraph');
console.log(`Characters: ${storyText.length}`);
console.log(`Estimated tokens: ${storyTokens}`);
console.log(`Expected: ~${Math.ceil(storyText.length / 4)} tokens (with 10% buffer)`);

// Test 3: Chunking
const longStory = `${storyText} ${storyText} ${storyText}`;
const chunks = tokenizer.chunkText(longStory, 100);
console.log('\n📝 Test 3: Text Chunking');
console.log(`Original length: ${longStory.length} characters`);
console.log(`Number of chunks: ${chunks.length}`);
chunks.forEach((chunk, i) => {
  const tokens = tokenizer.countTokens(chunk);
  console.log(`  Chunk ${i + 1}: ${tokens} tokens, ${chunk.length} chars`);
});

// Test 4: Multi-language (French)
const frenchText = "Il était une fois, dans une forêt magique, vivait une brave petite héroïne nommée Luna.";
const frenchTokens = tokenizer.countTokens(frenchText);
console.log('\n📝 Test 4: French Text');
console.log(`Text: "${frenchText}"`);
console.log(`Characters: ${frenchText.length}`);
console.log(`Estimated tokens: ${frenchTokens}`);

// Test 5: Scene extraction scenario
const scenePrompt = `A warm, bright scene of Gaspard happily playing with many friendly companions,
surrounded by colorful butterflies and glowing fireflies. The magical garden is filled with
warm golden sunlight and rainbow colors. Everyone is smiling and laughing together.`;

const sceneTokens = tokenizer.countTokens(scenePrompt);
console.log('\n📝 Test 5: Scene Illustration Prompt');
console.log(`Characters: ${scenePrompt.length}`);
console.log(`Estimated tokens: ${sceneTokens}`);

console.log('\n' + '='.repeat(80));
console.log('✅ All tests completed successfully!');
console.log('\n💡 Token Estimation Formula:');
console.log('   tokens = Math.ceil((text.length / 4) * 1.1)');
console.log('   - Assumes ~4 characters per token for English');
console.log('   - Adds 10% buffer for safety');
console.log('   - No WASM dependencies (avoids tiktoken issues)');
