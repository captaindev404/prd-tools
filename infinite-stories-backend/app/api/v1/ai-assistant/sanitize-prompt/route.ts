import { NextRequest, NextResponse } from 'next/server';
import type { PromptSanitizationRequest } from '@/types/openai';
import { SAFE_REWRITER_SYSTEM_PROMPT } from '@/lib/prompts';

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

    // Use centralized system prompt for safety rewriting
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
            content: SAFE_REWRITER_SYSTEM_PROMPT,
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
