import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getOrCreateUser } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api-response';

/**
 * POST /api/v1/custom-events/[eventId]/enhance
 * Enhance a custom event with AI-generated improvements
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { eventId } = await params;

    // Get the custom event to verify ownership
    const existingEvent = await prisma.customStoryEvent.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return errorResponse('NotFound', 'Custom event not found', 404);
    }

    if (existingEvent.userId !== user.id) {
      return errorResponse('Forbidden', 'You do not have access to this custom event', 403);
    }

    // Check if already enhanced
    if (existingEvent.aiEnhanced) {
      return errorResponse('BadRequest', 'This event has already been enhanced', 400);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return errorResponse('ServerError', 'AI service not configured', 500);
    }

    // Step 1: Enhance the prompt seed
    const enhancePrompt = `Enhance this bedtime story event into a detailed, engaging story prompt:

Title: ${existingEvent.title}
Description: ${existingEvent.description}
Category: ${existingEvent.category || 'General'}
Age Range: ${existingEvent.ageRange || '4-10'}
Tone: ${existingEvent.tone || 'cheerful'}

Create a rich, detailed story prompt that a storyteller can use to generate an engaging bedtime story. Include:
- Setting details
- Character motivations
- Key story beats
- Emotional arc
- Sensory details

Keep it under 150 words. Focus on creating a vivid, engaging narrative framework.`;

    const enhanceResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert at crafting detailed story prompts for children\'s bedtime stories.',
          },
          {
            role: 'user',
            content: enhancePrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!enhanceResponse.ok) {
      const error = await enhanceResponse.json();
      console.error('OpenAI enhance error:', error);
      return errorResponse('AIError', 'Failed to enhance prompt', 502);
    }

    const enhanceData = await enhanceResponse.json();
    const enhancedPrompt = enhanceData.choices[0].message.content.trim();

    // Step 2: Generate keywords
    const keywordPrompt = `Generate 5-8 relevant keywords for this bedtime story event:

Event: ${existingEvent.title}
Description: ${enhancedPrompt}

Keywords should be:
- Single words or short phrases (1-3 words)
- Relevant to the story theme
- Child-appropriate
- Helpful for story generation

Return only the keywords separated by commas, nothing else.`;

    const keywordResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert at identifying relevant keywords for children\'s stories.',
          },
          {
            role: 'user',
            content: keywordPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!keywordResponse.ok) {
      const error = await keywordResponse.json();
      console.error('OpenAI keyword error:', error);
      return errorResponse('AIError', 'Failed to generate keywords', 502);
    }

    const keywordData = await keywordResponse.json();
    const keywordsText = keywordData.choices[0].message.content;
    const keywords = keywordsText
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0)
      .slice(0, 8);

    // Update the custom event with enhancement data
    const updatedEvent = await prisma.customStoryEvent.update({
      where: { id: eventId },
      data: {
        promptSeed: enhancedPrompt,
        keywords: keywords,
        aiEnhanced: true,
        aiEnhancementMetadata: {
          enhancedAt: new Date().toISOString(),
          model: 'gpt-4o-mini',
          originalPromptSeed: existingEvent.promptSeed,
        },
      },
    });

    return successResponse(updatedEvent, 'Custom event enhanced successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
