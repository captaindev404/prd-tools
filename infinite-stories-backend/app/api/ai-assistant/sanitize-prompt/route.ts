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

    const sanitizationPrompt = `You are a GPT-Image-1 prompt sanitizer specializing in children's content. Your task is to rewrite the following image generation prompt to be 100% compliant with OpenAI's GPT-Image-1 content policy while preserving the creative intent.

CRITICAL GPT-IMAGE-1 POLICY VIOLATIONS TO AVOID:
1. NEVER depict children in isolation, distress, danger, or negative situations
2. NEVER show children alone, lonely, abandoned, lost, scared, crying, or sad
3. NEVER include darkness, shadows, scary elements, or anything frightening
4. NEVER depict violence, weapons, fighting, battles, or conflict
5. NEVER show unsafe situations or activities that could harm children
6. NEVER use words that imply negative emotions or isolation

MANDATORY TRANSFORMATIONS:
- ALL children MUST be shown with friends, family, or friendly magical creatures
- ALL scenes MUST be bright, colorful, and cheerful
- ALL emotions MUST be positive (happy, excited, curious, playful)
- ALL environments MUST feel safe, warm, and welcoming
- ALL interactions MUST be friendly and playful

SPECIFIC WORD REPLACEMENTS (APPLY ALL):
- "alone" / "by himself" / "by herself" → "with friends" or "with magical companions"
- "lonely" / "solitary" / "isolated" → "surrounded by friendly creatures"
- "dark" / "shadowy" / "dim" → "bright" / "glowing" / "sunlit"
- "forest" → "magical garden" or "enchanted meadow"
- "scary" / "frightening" / "spooky" → "wonderful" / "delightful" / "magical"
- "mysterious" → "enchanting and delightful"
- "sad" / "crying" / "upset" → "happy" / "smiling" / "cheerful"
- Any weapons → "magical wands" or "toy props"
- Any violence → "playful games" or "friendly adventures"

ORIGINAL PROMPT TO SANITIZE:
${prompt}

IMPORTANT: Return ONLY the sanitized prompt. Ensure EVERY child in the image has companions. Add "surrounded by friends" if needed. The scene MUST be bright and cheerful with NO exceptions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a strict GPT-Image-1 content policy enforcer. You MUST rewrite prompts to be 100% safe for children. ALWAYS ensure children are shown with companions, NEVER alone. ALWAYS make scenes bright and positive. Remove ALL negative or scary elements. Output ONLY the sanitized prompt.',
          },
          {
            role: 'user',
            content: sanitizationPrompt,
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

    return NextResponse.json({ sanitizedPrompt });
  } catch (error) {
    console.error('Prompt sanitization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
