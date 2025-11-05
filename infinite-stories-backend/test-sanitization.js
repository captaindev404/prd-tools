#!/usr/bin/env node

/**
 * Test script for content sanitization
 * Tests problematic prompts that were causing moderation_blocked errors
 */

const TEST_PROMPTS = [
  {
    name: "Gargoyle (French) Test",
    prompt: "A serene scene of Gaspard, now surrounded by friends, basking in the glow of newfound friendships. The bats are resting nearby, and the night is calm and peaceful. Gaspard's light shines warmly, symbolizing the joy of shared moments.",
    expectedChanges: ["gargouille", "gargoyle", "bats", "night"]
  },
  {
    name: "Dark Fantasy Creatures",
    prompt: "The gargoyle stood alone in the dark forest, surrounded by bats and ghosts. The monster lurked in the shadows, creating a scary atmosphere.",
    expectedChanges: ["gargoyle", "alone", "dark", "bats", "ghosts", "monster", "scary", "shadows"]
  },
  {
    name: "Isolation Terms",
    prompt: "The child was all alone, standing by himself in the abandoned castle. He felt lonely and isolated, with no friends nearby.",
    expectedChanges: ["alone", "by himself", "abandoned", "lonely", "isolated"]
  },
  {
    name: "French Dark Terms",
    prompt: "La gargouille était seule dans la forêt sombre. Les chauves-souris volaient autour du château hanté.",
    expectedChanges: ["gargouille", "seule", "forêt sombre", "chauves-souris", "château hanté"]
  },
  {
    name: "Mixed Language Test",
    prompt: "The gargouille and the bat were playing in the dark castle. Le monstre était seul et triste.",
    expectedChanges: ["gargouille", "bat", "dark", "monstre", "seul", "triste"]
  }
];

async function testSanitization() {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';

  console.log('🧪 Starting Content Sanitization Tests');
  console.log('=====================================\n');

  for (const test of TEST_PROMPTS) {
    console.log(`📝 Test: ${test.name}`);
    console.log(`Original: ${test.prompt.substring(0, 100)}...`);

    try {
      const response = await fetch(`${baseUrl}/api/ai-assistant/sanitize-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: test.prompt }),
      });

      if (!response.ok) {
        console.error(`❌ Failed: HTTP ${response.status}`);
        const error = await response.text();
        console.error(`   Error: ${error}`);
        continue;
      }

      const data = await response.json();
      const sanitized = data.sanitizedPrompt;

      console.log(`✅ Success!`);
      console.log(`Sanitized: ${sanitized.substring(0, 100)}...`);

      // Check if problematic terms were replaced
      let changesFound = [];
      for (const term of test.expectedChanges) {
        const original = test.prompt.toLowerCase();
        const cleaned = sanitized.toLowerCase();

        if (original.includes(term.toLowerCase()) && !cleaned.includes(term.toLowerCase())) {
          changesFound.push(term);
        }
      }

      console.log(`🔄 Terms replaced: ${changesFound.join(', ') || 'None detected'}`);

      // Check for safety additions
      const safetyTerms = ['bright', 'cheerful', 'friendly', 'magical', 'companions', 'child-friendly'];
      const safetyAdded = safetyTerms.filter(term =>
        sanitized.toLowerCase().includes(term) && !test.prompt.toLowerCase().includes(term)
      );

      console.log(`➕ Safety terms added: ${safetyAdded.join(', ') || 'None'}`);

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }

    console.log('-----------------------------------\n');
  }

  console.log('🎉 Tests Complete!');
}

// Run the tests
testSanitization().catch(console.error);