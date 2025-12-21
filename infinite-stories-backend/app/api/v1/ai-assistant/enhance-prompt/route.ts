import { NextRequest, NextResponse } from 'next/server';
import type { AIAssistantRequest } from '@/types/openai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const body: AIAssistantRequest = await request.json();
    const { title, description, category, ageRange, tone } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const prompt = `Enhance this bedtime story event into a detailed, engaging story prompt:

Title: ${title}
Description: ${description}
Category: ${category || 'General'}
Age Range: ${ageRange || '4-10'}
Tone: ${tone || 'Peaceful'}

Create a rich, detailed story prompt that a storyteller can use to generate an engaging bedtime story. Include:
- Setting details
- Character motivations
- Key story beats
- Emotional arc
- Sensory details

Keep it under 150 words. Focus on creating a vivid, engaging narrative framework.`;

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
            content: 'You are an expert at crafting detailed story prompts for children\'s bedtime stories.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0].message.content.trim();

    return NextResponse.json({ enhancedPrompt });
  } catch (error) {
    console.error('Prompt enhancement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
