import { NextRequest, NextResponse } from 'next/server';
import type { StoryGenerationRequest, StoryGenerationResponse } from '@/types/openai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const body: StoryGenerationRequest = await request.json();
    const { hero, event, targetDuration, language } = body;

    // Validate required fields
    if (!hero || !event || !targetDuration || !language) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build story generation prompt
    const targetMinutes = Math.floor(targetDuration / 60);
    const traits = `${hero.primaryTrait}, ${hero.secondaryTrait}, ${
      hero.appearance || 'lovable appearance'
    }, ${hero.specialAbility || 'warm heart'}`;

    const prompt = `Create a ${targetMinutes}-minute bedtime story for a child about ${hero.name}, who is ${traits}.

Story context: ${event.promptSeed}

IMPORTANT INSTRUCTIONS:
- Write a complete, flowing story without any formatting markers
- Use natural, conversational language suitable for audio narration
- Include dialogue and sound effects naturally in the text
- Avoid special characters or formatting that would sound strange when read aloud
- Make the story engaging and immersive for bedtime listening
- DO NOT include scene markers, titles, or any meta-information
- Just tell the story from beginning to end`;

    // Call OpenAI Chat Completions API
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
            content: `You are a skilled children's bedtime storyteller who creates engaging, age-appropriate stories in ${language}.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Generate title
    const title = `${hero.name} and the ${event.rawValue}`;

    // Estimate duration (200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const estimatedDuration = (wordCount / 200.0) * 60.0;

    const result: StoryGenerationResponse = {
      title,
      content: content.trim(),
      estimatedDuration,
      scenes: undefined, // Scenes extracted separately
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
