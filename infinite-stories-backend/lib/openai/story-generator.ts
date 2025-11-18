import {openai, type SupportedLanguage} from './client';

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

    // Build the story generation prompt
    const systemPrompt = getSystemPrompt(language);
    const userPrompt = getUserPrompt({
        heroName,
        heroAge,
        heroTraits,
        specialAbilities,
        eventType,
        customPrompt,
        language,
    });

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
    language: SupportedLanguage = 'en'
): Promise<StoryScene[]> {
    const systemPrompt = `You are a story analysis assistant. Analyze the provided story and break it down into 3-8 distinct visual scenes that would work well for illustrations. For each scene, provide:
1. A detailed scene description suitable for image generation
2. An estimated timestamp (in seconds) when this scene occurs in the narration
3. An estimated duration (in seconds) for this scene

Return the response as a JSON array of objects with: sceneDescription, audioTimestamp, estimatedDuration.`;

    try {
        const response = await openai.responses.create({
            model: 'gpt-5-mini',
            instructions: systemPrompt,  // ✅ System prompt as instructions
            input: `Extract visual scenes from this story:\n\n${storyContent}`,  // ✅ String input
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

// Helper functions

function getSystemPrompt(language: SupportedLanguage): string {
    const prompts: Record<SupportedLanguage, string> = {
        English: 'You are a creative children\'s storyteller. Generate engaging, age-appropriate bedtime stories that are fun, educational, and promote positive values. Stories should be 300-500 words long, suitable for children aged 3-12. You must provide both a creative title and the full story content as separate fields in the JSON response.',
        Spanish: 'Eres un narrador creativo de cuentos infantiles. Genera historias para dormir atractivas y apropiadas para la edad que sean divertidas, educativas y promuevan valores positivos. Las historias deben tener 300-500 palabras, adecuadas para niños de 3-12 años. Debes proporcionar un título creativo y el contenido completo de la historia como campos separados en la respuesta JSON.',
        French: 'Vous êtes un conteur créatif pour enfants. Générez des histoires pour s\'endormir engageantes et adaptées à l\'âge qui sont amusantes, éducatives et promeuvent des valeurs positives. Les histoires doivent faire 300-500 mots, adaptées aux enfants de 3 à 12 ans. Vous devez fournir un titre créatif et le contenu complet de l\'histoire comme champs séparés dans la réponse JSON.',
        German: 'Sie sind ein kreativer Kindergeschichtenerzähler. Generieren Sie ansprechende, altersgerechte Gute-Nacht-Geschichten, die Spaß machen, lehrreich sind und positive Werte fördern. Geschichten sollten 300-500 Wörter lang und für Kinder im Alter von 3-12 Jahren geeignet sein. Sie müssen sowohl einen kreativen Titel als auch den vollständigen Geschichteninhalt als separate Felder in der JSON-Antwort bereitstellen.',
        Italian: 'Sei un narratore creativo di storie per bambini. Genera storie della buonanotte coinvolgenti e appropriate all\'età che siano divertenti, educative e promuovano valori positivi. Le storie dovrebbero essere lunghe 300-500 parole, adatte a bambini dai 3 ai 12 anni. Devi fornire un titolo creativo e il contenuto completo della storia come campi separati nella risposta JSON.',
    };

    return prompts[language];
}

function getUserPrompt(params: Omit<StoryGenerationParams, 'maxTokens'>): string {
    const {
        heroName,
        heroAge,
        heroTraits,
        specialAbilities,
        eventType,
        customPrompt,
        language,
    } = params;

    let prompt = `Create a ${language} bedtime story featuring:\n`;
    prompt += `- Hero: ${heroName}, age ${heroAge}\n`;
    prompt += `- Personality: ${heroTraits.join(', ')}\n`;

    if (specialAbilities && specialAbilities.length > 0) {
        prompt += `- Special abilities: ${specialAbilities.join(', ')}\n`;
    }

    if (eventType) {
        prompt += `- Story theme: ${eventType}\n`;
    }

    if (customPrompt) {
        prompt += `- Custom scenario: ${customPrompt}\n`;
    }

    prompt += '\nThe story should be engaging, age-appropriate, and end on a positive, calming note perfect for bedtime.';

    return prompt;
}

function parseStoryResponse(response: string): GeneratedStory {
    // Split by lines and extract title (first non-empty line)
    const lines = response.split('\n').filter((line) => line.trim());
    const title = lines[0].replace(/^#+\s*/, '').trim(); // Remove markdown headers
    const content = lines.slice(1).join('\n').trim();

    // For now, return empty scenes array - they will be extracted separately
    return {
        title,
        content,
        scenes: [],
    };
}
