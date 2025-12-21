import { NextRequest, NextResponse } from 'next/server';
import type { AvatarGenerationRequest, ImageGenerationResponse } from '@/types/openai';

// Basic sanitization helper
function enhancedBasicSanitization(prompt: string): string {
  // Remove non-ASCII characters
  const asciiOnly = prompt.replace(/[^\x00-\x7F]/g, '');

  // Apply safety transformations
  let sanitized = asciiOnly;

  // Phrase replacements (order matters - longer phrases first)
  const phraseReplacements: [string, string][] = [
    ['standing alone', 'standing with friends'],
    ['sitting alone', 'sitting with companions'],
    ['walking alone', 'walking with friends'],
    ['all alone', 'with magical friends'],
    ['by himself', 'with his friends'],
    ['by herself', 'with her friends'],
    ['by themselves', 'with their companions'],
    ['dark forest', 'bright enchanted garden'],
    ['dark woods', 'sunny magical meadow'],
    ['scary forest', 'magical garden'],
    ['haunted house', 'magical castle'],
    ['abandoned house', 'cozy cottage'],
    ['fighting with', 'playing with'],
    ['in battle', 'on an adventure'],
  ];

  for (const [problematic, safe] of phraseReplacements) {
    sanitized = sanitized.replace(new RegExp(problematic, 'gi'), safe);
  }

  // Word replacements with word boundaries
  const wordReplacements: [string, string][] = [
    ['\\balone\\b', 'with friends'],
    ['\\blonely\\b', 'happy with companions'],
    ['\\bisolated\\b', 'surrounded by friendly creatures'],
    ['\\babandoned\\b', 'in a cozy magical place'],
    ['\\bsolitary\\b', 'with cheerful friends'],
    ['\\bsolo\\b', 'with companions'],
    ['\\bdark\\b', 'bright'],
    ['\\bscary\\b', 'wonderful'],
    ['\\bfrightening\\b', 'magical'],
    ['\\bterrifying\\b', 'amazing'],
    ['\\bspooky\\b', 'enchanting'],
    ['\\bhaunted\\b', 'magical'],
    ['\\bmysterious\\b', 'delightful'],
    ['\\bshadowy\\b', 'glowing'],
    ['\\bgloomy\\b', 'bright'],
    ['\\beerie\\b', 'cheerful'],
    ['\\bcreepy\\b', 'friendly'],
    ['\\bfighting\\b', 'playing'],
    ['\\bbattle\\b', 'adventure'],
    ['\\bweapon\\b', 'magical wand'],
    ['\\bsword\\b', 'toy wand'],
    ['\\bswords\\b', 'toy wands'],
    ['\\battacking\\b', 'playing with'],
    ['\\bsad\\b', 'happy'],
    ['\\bcrying\\b', 'smiling'],
    ['\\btears\\b', 'sparkles'],
    ['\\bupset\\b', 'curious'],
    ['\\bangry\\b', 'determined'],
    ['\\bscared\\b', 'excited'],
    ['\\bafraid\\b', 'brave'],
    ['\\bworried\\b', 'thoughtful'],
    ['\\bfrightened\\b', 'amazed'],
  ];

  for (const [pattern, replacement] of wordReplacements) {
    sanitized = sanitized.replace(new RegExp(pattern, 'gi'), replacement);
  }

  // Ensure companions are present
  if (
    !sanitized.toLowerCase().includes('friends') &&
    !sanitized.toLowerCase().includes('companions') &&
    !sanitized.toLowerCase().includes('family') &&
    !sanitized.toLowerCase().includes('creatures')
  ) {
    sanitized = sanitized.replace(/\.$/, '');
    sanitized += ' surrounded by friendly magical creatures and companions.';
  }

  // Ensure brightness
  if (
    !sanitized.toLowerCase().includes('bright') &&
    !sanitized.toLowerCase().includes('colorful') &&
    !sanitized.toLowerCase().includes('sunny') &&
    !sanitized.toLowerCase().includes('cheerful')
  ) {
    sanitized += ' The scene is bright, colorful, cheerful, and child-friendly with warm sunlight and a magical atmosphere.';
  }

  return sanitized;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const body: AvatarGenerationRequest = await request.json();
    const { prompt, hero, size = '1024x1024', quality = 'high', previousGenerationId } = body;

    if (!prompt || !hero) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Apply enhanced basic sanitization
    const filteredPrompt = enhancedBasicSanitization(prompt);

    // Map quality parameter (standard/hd -> low/medium/high for GPT-Image-1)
    let gptImageQuality = quality;
    if (quality === 'standard') gptImageQuality = 'medium';
    if (quality === 'hd') gptImageQuality = 'high';

    // Build request body
    const requestBody: any = {
      model: 'gpt-image-1',
      prompt: filteredPrompt,
      n: 1,
      size: size,
      quality: gptImageQuality,
      background: 'auto',
      output_format: 'png',
      moderation: 'auto',
    };

    // Add previous generation ID for multi-turn consistency
    if (previousGenerationId) {
      requestBody.previous_generation_id = previousGenerationId;
    }

    // Call OpenAI Image Generation API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const firstImage = data.data[0];

    // Extract generation ID from response
    const generationId =
      firstImage.generation_id ||
      firstImage.generationId ||
      firstImage.gen_id ||
      firstImage.id ||
      data.generation_id ||
      data.generationId ||
      data.gen_id;

    const result: ImageGenerationResponse = {
      imageData: firstImage.b64_json,
      revisedPrompt: firstImage.revised_prompt,
      generationId: generationId,
    };

    // Include usage info if available
    if (data.usage) {
      return NextResponse.json({
        ...result,
        usage: data.usage,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Avatar generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
