import { NextRequest, NextResponse } from 'next/server';
import type { SceneExtractionRequest, StoryScene } from '@/types/openai';

interface SceneJSON {
  sceneNumber: number;
  textSegment: string;
  timestamp: number;
  illustrationPrompt: string;
  emotion: string;
  importance: string;
}

interface SceneExtractionResponse {
  scenes: SceneJSON[];
  sceneCount: number;
  reasoning: string;
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

    const body: SceneExtractionRequest = await request.json();
    const { storyContent, storyDuration, hero, eventContext } = body;

    if (!storyContent || !storyDuration || !hero || !eventContext) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert at analyzing children's bedtime stories and identifying key visual moments for illustration.

Analyze the following story and identify the most important scenes for illustration. Consider:
- Natural narrative breaks and transitions
- Key emotional moments
- Visual variety (different settings, actions, moods)
- Story pacing (distribute scenes evenly throughout)

Story Context: ${eventContext}
Story Duration: ${Math.floor(storyDuration)} seconds

STORY TEXT:
${storyContent}

INSTRUCTIONS:
1. Identify the optimal number of scenes for this story (typically 1 scene per 15-20 seconds of narration)
2. Choose scenes that best represent the story arc
3. For each scene, provide:
   - The exact text segment from the story
   - A detailed illustration prompt for GPT-Image-1
   - Estimated timestamp when this scene would occur during audio playback
   - The emotional tone and importance

The illustration prompts should:
- Be child-friendly and magical
- Use warm, watercolor or soft digital art style
- Be specific about colors, composition, and atmosphere
- Include the hero character in the scene
- Be under 150 words each

Return your analysis as a JSON object matching this structure:
{
    "scenes": [
        {
            "sceneNumber": 1,
            "textSegment": "exact text from story",
            "timestamp": 0.0,
            "illustrationPrompt": "detailed GPT-Image-1 prompt",
            "emotion": "joyful|peaceful|exciting|mysterious|heartwarming|adventurous|contemplative",
            "importance": "key|major|minor"
        }
    ],
    "sceneCount": total_number,
    "reasoning": "brief explanation of scene selection"
}`;

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
            content: 'You are an expert at visual storytelling and scene analysis for children\'s books.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const sceneResponse: SceneExtractionResponse = JSON.parse(content);

    // Convert to StoryScene format
    const scenes: StoryScene[] = sceneResponse.scenes
      .sort((a, b) => a.sceneNumber - b.sceneNumber)
      .map((jsonScene) => ({
        sceneNumber: jsonScene.sceneNumber,
        textSegment: jsonScene.textSegment,
        illustrationPrompt: jsonScene.illustrationPrompt,
        timestamp: jsonScene.timestamp,
        emotion: jsonScene.emotion as any,
        importance: jsonScene.importance as any,
      }));

    return NextResponse.json({
      scenes,
      sceneCount: sceneResponse.sceneCount,
      reasoning: sceneResponse.reasoning,
    });
  } catch (error) {
    console.error('Scene extraction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
