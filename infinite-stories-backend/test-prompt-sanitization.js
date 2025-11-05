#!/usr/bin/env node

/**
 * Test script for prompt sanitization
 * Tests the GPT-4o-mini based safety filter for illustration generation
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Test cases with problematic prompts
const testCases = [
  {
    name: 'Gargouille (French gargoyle)',
    prompt: "A serene scene of Gaspard, now surrounded by friends, basking in the glow of newfound friendships. The bats are resting nearby, and the night is calm and peaceful. Gaspard's light shines warmly, symbolizing the joy of shared moments."
  },
  {
    name: 'Dark forest with isolation',
    prompt: "The hero walks alone through a dark, scary forest. The trees are twisted and shadowy. He feels isolated and afraid."
  },
  {
    name: 'Battle scene',
    prompt: "The brave warrior fights against the monster with his sword. The battle is fierce and the monster looks terrifying."
  },
  {
    name: 'Already safe prompt',
    prompt: "A cheerful scene with the hero playing happily with friends in a bright, sunny meadow filled with flowers and butterflies."
  }
];

async function testSanitization(testCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 Test: ${testCase.name}`);
  console.log('='.repeat(80));
  console.log(`📝 Original Prompt:\n${testCase.prompt}\n`);

  try {
    const response = await fetch(`${BACKEND_URL}/api/ai-assistant/sanitize-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: testCase.prompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Sanitization failed:`, error);
      return;
    }

    const data = await response.json();
    console.log(`✅ Sanitized Prompt:\n${data.sanitizedPrompt}\n`);
    console.log(`📊 Tokens Used: ${data.tokensUsed || 'N/A'}`);

    // Check for safety improvements
    const improvements = [];
    if (data.sanitizedPrompt.toLowerCase().includes('friends') ||
        data.sanitizedPrompt.toLowerCase().includes('companions')) {
      improvements.push('✓ Added companions');
    }
    if (data.sanitizedPrompt.toLowerCase().includes('bright') ||
        data.sanitizedPrompt.toLowerCase().includes('cheerful') ||
        data.sanitizedPrompt.toLowerCase().includes('sunny')) {
      improvements.push('✓ Added brightness');
    }
    if (data.sanitizedPrompt.toLowerCase().includes('child-friendly') ||
        data.sanitizedPrompt.toLowerCase().includes('safe for children')) {
      improvements.push('✓ Added safety descriptors');
    }
    if (!data.sanitizedPrompt.toLowerCase().includes('bat') &&
        testCase.prompt.toLowerCase().includes('bat')) {
      improvements.push('✓ Replaced bats with friendly creatures');
    }
    if (!data.sanitizedPrompt.toLowerCase().includes('gargouille') &&
        testCase.prompt.toLowerCase().includes('gargouille')) {
      improvements.push('✓ Replaced gargouille with safe term');
    }

    if (improvements.length > 0) {
      console.log('\n🎯 Safety Improvements:');
      improvements.forEach(imp => console.log(`   ${imp}`));
    }

  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Prompt Sanitization Tests');
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  console.log(`🤖 Using GPT-4o-mini for cost-effective sanitization`);

  for (const testCase of testCases) {
    await testSanitization(testCase);
    // Wait a bit between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ All tests completed!');
  console.log('='.repeat(80));
}

// Run tests
runTests().catch(console.error);
