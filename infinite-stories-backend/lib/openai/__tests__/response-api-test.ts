/**
 * Test to validate OpenAI Response API implementation
 *
 * This test verifies that the Response API works as expected
 * with gpt-5-mini model for text and image generation.
 */

import { openai } from '../client';

interface ResponseAPITest {
  name: string;
  test: () => Promise<void>;
}

const tests: ResponseAPITest[] = [
  {
    name: 'Text generation with gpt-5-mini',
    test: async () => {
      console.log('\n🧪 Testing text generation with gpt-5-mini...');

      try {
        const response = await openai.responses.create({
          model: 'gpt-5-mini',
          input: [
            {
              role: 'system',
              content: 'You are a helpful assistant.',
            },
            {
              role: 'user',
              content: 'Say "hello world" in exactly two words.',
            },
          ],
          text: {
            verbosity: 'low',
            format: {
              type: 'json_schema',
              name: 'test_response',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
                required: ['message'],
                additionalProperties: false,
              },
            },
          },
        });

        console.log('✅ Response received');
        console.log('Response ID:', response.id);
        console.log('Response status:', response.status);

        // Check response structure
        if (response.status === 'failed') {
          throw new Error(`API error: ${response.error?.message}`);
        }

        const messageItem = response.output?.find(item => item.type === 'message');
        if (!messageItem) {
          throw new Error('No message item in output');
        }

        console.log('Message status:', messageItem.status);

        const textContent = messageItem.content?.find(c => c.type === 'output_text');
        if (!textContent) {
          throw new Error('No text content in message');
        }

        console.log('Text content:', textContent.text);

        // Check token usage
        if (response.usage) {
          console.log('Token usage:', {
            input: response.usage.input_tokens,
            output: response.usage.output_tokens,
            reasoning: response.usage.reasoning_tokens,
            cached: response.usage.cached_tokens,
            total: response.usage.total_tokens,
          });
        }

        console.log('✅ Text generation test passed');
      } catch (error) {
        console.error('❌ Text generation test failed:', error);
        throw error;
      }
    },
  },
  {
    name: 'Image generation with gpt-5-mini',
    test: async () => {
      console.log('\n🧪 Testing image generation with gpt-5-mini...');

      try {
        const response = await openai.responses.create({
          model: 'gpt-5-mini',
          input: [
            {
              role: 'user',
              content: 'A cute cartoon cat wearing a party hat',
            },
          ],
          image: {
            size: '1024x1024',
            quality: 'standard',
          },
        });

        console.log('✅ Response received');
        console.log('Response ID:', response.id);
        console.log('Response status:', response.status);

        // Check response structure
        if (response.status === 'failed') {
          throw new Error(`API error: ${response.error?.message}`);
        }

        const messageItem = response.output?.find(item => item.type === 'message');
        if (!messageItem) {
          throw new Error('No message item in output');
        }

        const imageContent = messageItem.content?.find(c => c.type === 'output_image');
        if (!imageContent) {
          throw new Error('No image content in message');
        }

        console.log('Image URL:', imageContent.url?.substring(0, 50) + '...');
        console.log('Revised prompt:', imageContent.revised_prompt?.substring(0, 80) + '...');

        console.log('✅ Image generation test passed');
      } catch (error) {
        console.error('❌ Image generation test failed:', error);
        throw error;
      }
    },
  },
  {
    name: 'Multi-turn image consistency',
    test: async () => {
      console.log('\n🧪 Testing multi-turn image consistency...');

      try {
        // First generation
        const response1 = await openai.responses.create({
          model: 'gpt-5-mini',
          input: [
            {
              role: 'user',
              content: 'A friendly cartoon character named Luna with purple hair',
            },
          ],
          image: {
            size: '1024x1024',
            quality: 'standard',
          },
        });

        console.log('✅ First image generated');
        console.log('First response ID:', response1.id);

        // Second generation with previous_response_id
        const response2 = await openai.responses.create({
          model: 'gpt-5-mini',
          input: [
            {
              role: 'user',
              content: 'Luna is now riding a bicycle in a park',
            },
          ],
          previous_response_id: response1.id,
          image: {
            size: '1024x1024',
            quality: 'standard',
          },
        });

        console.log('✅ Second image generated with consistency');
        console.log('Second response ID:', response2.id);

        console.log('✅ Multi-turn consistency test passed');
      } catch (error) {
        console.error('❌ Multi-turn consistency test failed:', error);
        throw error;
      }
    },
  },
];

async function runTests() {
  console.log('🚀 Starting Response API validation tests...\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.test();
      passed++;
    } catch (error) {
      failed++;
      console.error(`\n❌ Test "${test.name}" failed:`, error);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Test Summary: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runTests };
