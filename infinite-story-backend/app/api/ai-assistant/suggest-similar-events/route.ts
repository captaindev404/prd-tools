import { NextRequest, NextResponse } from 'next/server';

interface SimilarEventsRequest {
  description: string;
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

    const body: SimilarEventsRequest = await request.json();
    const { description } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const prompt = `Based on this story event description, suggest 3 similar but distinct bedtime story event ideas:

"${description}"

Each suggestion should be:
- Different from the original but thematically related
- Appropriate for children's bedtime stories
- Brief (5-8 words each)

Return only the 3 suggestions separated by | characters, nothing else.`;

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
            content: 'You are a creative children\'s story consultant who suggests related story ideas.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 60,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const suggestionsText = data.choices[0].message.content;
    const suggestions = suggestionsText
      .split('|')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
      .slice(0, 3);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Similar events suggestion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
