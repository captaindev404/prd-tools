import { NextRequest, NextResponse } from 'next/server';
import type { ImageGenerationRequest, ImageGenerationResponse, Hero } from '@/types/openai';

interface IllustrationRequest extends ImageGenerationRequest {
  hero: Hero;
}

// Basic sanitization helper (same as avatar route)
function enhancedBasicSanitization(prompt: string): string {
  const asciiOnly = prompt.replace(/[^\x00-\x7F]/g, '');
  let sanitized = asciiOnly;

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

  if (
    !sanitized.toLowerCase().includes('friends') &&
    !sanitized.toLowerCase().includes('companions') &&
    !sanitized.toLowerCase().includes('family') &&
    !sanitized.toLowerCase().includes('creatures')
  ) {
    sanitized = sanitized.replace(/\.$/, '');
    sanitized += ' surrounded by friendly magical creatures and companions.';
  }

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

    const body: IllustrationRequest = await request.json();
    const { prompt, hero, previousGenerationId } = body;

    if (!prompt || !hero) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, call the AI-based sanitization endpoint for robust content filtering
    let sanitizedPrompt = prompt;

    try {
      const sanitizationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ai-assistant/sanitize-prompt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        }
      );

      if (sanitizationResponse.ok) {
        const sanitizationData = await sanitizationResponse.json();
        sanitizedPrompt = sanitizationData.sanitizedPrompt;
        console.log('✅ AI sanitization applied successfully');
      } else {
        console.warn('⚠️ AI sanitization failed, using original prompt with basic filtering');
      }
    } catch (sanitizationError) {
      console.error('❌ Sanitization error:', sanitizationError);
      // Continue with original prompt if sanitization fails
    }

    // Enhance prompt with child-friendly artistic style
    const styleGuidance = `Create a beautiful children's book illustration in a warm, whimsical style. Use soft colors, gentle lighting, and a magical atmosphere. The art style should be similar to modern children's picture books with watercolor or soft digital painting techniques. Ensure the image is appropriate for children aged 4-10. Avoid any scary, violent, or inappropriate content. Focus on creating a sense of wonder and joy.`;

    const heroConsistency = `The main character ${hero.name} should be clearly visible and match this EXACT description: ${
      hero.appearance || 'a lovable, friendly character'
    }.${
      hero.avatarPrompt
        ? `\n\nVISUAL REFERENCE (MUST MATCH EXACTLY): ${hero.avatarPrompt}`
        : ''
    }\n\nCharacter traits: ${hero.primaryTrait} and ${hero.secondaryTrait} should be reflected in their expression and posture.\n\nCRITICAL: The character MUST look IDENTICAL to their established appearance. Same hair color, clothing, features, and overall design in every illustration.`;

    const enhancedPrompt = `${sanitizedPrompt}\n\n${heroConsistency}\n\n${styleGuidance}`;

    // Apply additional basic sanitization as a fallback
    const filteredPrompt = enhancedBasicSanitization(enhancedPrompt);

    // Build request body
    const requestBody: any = {
      model: 'gpt-image-1',
      prompt: filteredPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
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

    // Extract generation ID
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
    console.error('Illustration generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
