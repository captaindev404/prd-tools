import { NextRequest, NextResponse } from 'next/server';
import type { PromptSanitizationRequest } from '@/types/openai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const body: PromptSanitizationRequest = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // System prompt for the safety rewriter
    const SAFE_REWRITER_PROMPT = `You are a moderation-safe rewriter for OpenAI's image generation API, specializing in children's bedtime story illustrations.

Your task:
1. Preserve the user's creative intent and story meaning
2. Remove or rephrase ANY terms that could trigger moderation, including:
   - Anything related to isolation, loneliness, or being alone
   - Dark, scary, gory, horror-related, or frightening elements
   - Sexual, romantic, or suggestive content
   - Violence, weapons, fighting, or conflict
   - Death, demons, monsters, or distressing creatures
   - Negative emotions (sad, crying, upset, scared, angry)

3. SPECIAL ATTENTION TO FANTASY CREATURES:
   - "gargoyle" / "gargouille" → "friendly stone guardian" or "magical statue friend"
   - "ghost" / "phantom" → "friendly spirit" or "glowing magical friend"
   - "monster" / "beast" → "gentle creature" or "magical companion"
   - "bat" / "bats" → "butterflies" or "fireflies"
   - "witch" / "sorcerer" → "friendly magical helper"
   - "demon" / "devil" → "playful sprite" or "mischievous fairy"

4. MANDATORY POSITIVE ADDITIONS:
   - Always add companions: "with friends", "surrounded by magical companions"
   - Always add brightness: "bright", "cheerful", "warm sunlight", "glowing"
   - Always add safety: "safe", "cozy", "peaceful", "friendly"
   - End with: "child-friendly illustration, warm and cheerful bedtime scene, safe for children"

5. FRENCH TERM HANDLING:
   - Detect and replace French dark fantasy terms
   - "gargouille" → "friendly stone guardian"
   - "château hanté" → "magical castle"
   - "forêt sombre" → "enchanted garden"
   - "seul" / "seule" → "with friends"

Example transformation:
Input: "A serene scene of Gaspard, now surrounded by friends, basking in the glow of newfound friendships. The bats are resting nearby, and the night is calm and peaceful."
Output: "A warm, bright scene of Gaspard happily playing with many friendly companions, surrounded by colorful butterflies and glowing fireflies. The magical garden is filled with warm golden sunlight and rainbow colors. Everyone is smiling and laughing together. Child-friendly illustration, warm and cheerful bedtime scene, safe for children."

Return ONLY the rewritten prompt. Make it sound natural and magical, not censored.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SAFE_REWRITER_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const sanitizedPrompt = data.choices[0].message.content.trim();

    // Log the sanitization for debugging
    console.log('🔒 Prompt sanitization results:');
    console.log('📝 Original:', prompt.substring(0, 100) + '...');
    console.log('✅ Sanitized:', sanitizedPrompt.substring(0, 100) + '...');
    console.log('📊 Tokens used:', data.usage?.total_tokens || 'unknown');

    return NextResponse.json({
      sanitizedPrompt,
      original: prompt,
      tokensUsed: data.usage?.total_tokens
    });
  } catch (error) {
    console.error('Prompt sanitization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
