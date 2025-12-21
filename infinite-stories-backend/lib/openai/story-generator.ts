import {openai, type SupportedLanguage} from './client';
import { StoryPromptTemplate, SceneExtractionPromptTemplate } from '@/lib/prompts';

export interface StoryGenerationParams {
    heroName: string;
    heroAge: number;
    heroTraits: string[];
    specialAbilities?: string[];
    eventType?: string;
    customPrompt?: string;
    language: SupportedLanguage;
    maxTokens?: number;
}

export interface StoryScene {
    sceneDescription: string;
    audioTimestamp: number; // Estimated timestamp in seconds
    estimatedDuration: number; // Estimated duration of this scene
}

export interface GeneratedStory {
    title: string;
    content: string;
    scenes: StoryScene[];
}

/**
 * Generate a personalized story using GPT-4o
 */
export async function generateStory(
    params: StoryGenerationParams
): Promise<GeneratedStory> {
    const {
        heroName,
        heroAge,
        heroTraits,
        specialAbilities,
        eventType,
        customPrompt,
        language,
        maxTokens = 2000,
    } = params;

    // Build the story generation prompt using centralized templates
    const { system: systemPrompt, user: userPrompt } = StoryPromptTemplate.build(
        {
            heroName,
            heroAge,
            heroTraits,
            specialAbilities,
            eventType,
            language,
        },
        customPrompt
    );

    try {
        const response = await openai.responses.create({
            model: 'gpt-5-mini',
            instructions: systemPrompt,  // ✅ System prompt as instructions
            input: userPrompt,            // ✅ User input as string
            text: {
                format: {
                    type: 'json_schema',
                    name: 'story_response',
                    strict: true,
                    schema: {
                        type: 'object',
                        properties: {
                            title: {
                                type: 'string',
                                description: 'The title of the story',
                            },
                            content: {
                                type: 'string',
                                description: 'The full story content',
                            },
                        },
                        required: ['title', 'content'],
                        additionalProperties: false,
                    },
                },
            },
        });

        // Check response status
        if (response.status === 'failed') {
            throw new Error(`OpenAI API error: ${response.error?.message || 'Unknown error'}`);
        }

        // Extract text content directly
        const textContent = response.output_text;
        if (!textContent) {
            throw new Error('No text content in OpenAI response');
        }

        // Log token usage
        console.log('Story generation token usage:', {
            input: response.usage?.input_tokens || 0,
            output: response.usage?.output_tokens || 0,
            total: response.usage?.total_tokens || 0,
        });

        // Parse the JSON response
        const parsed = JSON.parse(textContent) as { title: string; content: string };

        return {
            title: parsed.title,
            content: parsed.content,
            scenes: [],
        };
    } catch (error) {
        console.error('Error generating story:', error);
        throw new Error(`Failed to generate story: ${(error as Error).message}`);
    }
}

/**
 * Extract scenes from story content for illustration synchronization
 */
export async function extractScenesFromStory(
    storyContent: string,
    language: SupportedLanguage = 'English'
): Promise<StoryScene[]> {
    // Use centralized scene extraction template
    const { system: systemPrompt, user: userInput } = SceneExtractionPromptTemplate.build(storyContent);

    try {
        const response = await openai.responses.create({
            model: 'gpt-5-mini',
            instructions: systemPrompt,
            input: userInput,
            text: {
                format: {
                    type: 'json_schema',
                    name: 'scene_extraction',
                    strict: true,
                    schema: {
                        type: 'object',
                        properties: {
                            scenes: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        sceneDescription: {
                                            type: 'string',
                                            description: 'Detailed scene description for image generation',
                                        },
                                        audioTimestamp: {
                                            type: 'number',
                                            description: 'Estimated timestamp in seconds',
                                        },
                                        estimatedDuration: {
                                            type: 'number',
                                            description: 'Estimated duration in seconds',
                                        },
                                    },
                                    required: ['sceneDescription', 'audioTimestamp', 'estimatedDuration'],
                                    additionalProperties: false,
                                },
                            },
                        },
                        required: ['scenes'],
                        additionalProperties: false,
                    },
                },
            },
        });

        // Check response status
        if (response.status === 'failed') {
            throw new Error(`OpenAI API error: ${response.error?.message || 'Unknown error'}`);
        }

        // Extract text content directly
        const textContent = response.output_text;
        if (!textContent) {
            throw new Error('No text content in OpenAI response');
        }

        // Log token usage
        console.log('Scene extraction token usage:', {
            input: response.usage?.input_tokens || 0,
            output: response.usage?.output_tokens || 0,
            total: response.usage?.total_tokens || 0,
        });

        const parsed = JSON.parse(textContent) as { scenes: StoryScene[] };
        return parsed.scenes;
    } catch (error) {
        console.error('Error extracting scenes:', error);
        throw new Error(`Failed to extract scenes: ${(error as Error).message}`);
    }
}
