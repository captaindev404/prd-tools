import { openai, type VoiceOption, type SupportedLanguage } from './client';
import { uploadToR2, generateFileKey } from '@/lib/storage/r2-client';

export interface AudioGenerationParams {
  text: string;
  voice?: VoiceOption;
  language: SupportedLanguage;
  userId: string;
  storyId: string;
}

export interface GeneratedAudio {
  audioUrl: string;
  duration: number; // in seconds (estimated)
  voice: VoiceOption;
  format: 'mp3';
}

// Voice mapping for different languages and story types (includes new voices)
const VOICE_RECOMMENDATIONS: Record<SupportedLanguage, VoiceOption[]> = {
  English: ['nova', 'shimmer', 'alloy', 'ash', 'ballad', 'coral', 'sage'],
  Spanish: ['nova', 'shimmer', 'alloy', 'ash', 'ballad', 'coral', 'sage'],
  French: ['nova', 'shimmer', 'alloy', 'ash', 'ballad', 'coral', 'sage'],
  German: ['nova', 'shimmer', 'alloy', 'ash', 'ballad', 'coral', 'sage'],
  Italian: ['nova', 'shimmer', 'alloy', 'ash', 'ballad', 'coral', 'sage'],
};

/**
 * Generate audio from text using OpenAI TTS
 */
export async function generateAudio(
  params: AudioGenerationParams
): Promise<GeneratedAudio> {
  const { text, voice, language, userId, storyId } = params;

  // Select voice (use provided or default for language)
  const selectedVoice = voice || VOICE_RECOMMENDATIONS[language][0];

  try {
    // Generate audio using gpt-4o-mini-tts with enhanced voice control
    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: selectedVoice,
      input: text,
      response_format: 'mp3',
      speed: 0.9, // Slower pacing for bedtime stories
      instructions: 'Speak in a warm, gentle, storytelling tone suitable for bedtime. Pace slowly and emphasize emotional moments. Use a soothing voice that helps children relax and feel comforted.',
    });

    // Get audio buffer
    const buffer = Buffer.from(await response.arrayBuffer());

    // Generate unique file key
    const fileKey = generateFileKey({
      userId,
      type: 'audio',
      filename: `${storyId}.mp3`,
    });

    // Upload to R2
    const audioUrl = await uploadToR2({
      key: fileKey,
      body: buffer,
      contentType: 'audio/mpeg',
      metadata: {
        storyId,
        voice: selectedVoice,
        language,
      },
    });

    // Estimate duration (slower pacing: ~130 words per minute due to speed 0.9, ~5 chars per word)
    const wordCount = text.length / 5;
    const estimatedDuration = Math.ceil((wordCount / 130) * 60);

    return {
      audioUrl,
      duration: estimatedDuration,
      voice: selectedVoice,
      format: 'mp3',
    };
  } catch (error) {
    console.error('Error generating audio:', error);
    throw new Error(`Failed to generate audio: ${(error as Error).message}`);
  }
}

/**
 * Get recommended voice for a story based on hero traits and language
 * Enhanced with new gpt-4o-mini-tts voices
 */
export function getRecommendedVoice(
  language: SupportedLanguage,
  heroTraits: string[]
): VoiceOption {
  const recommendations = VOICE_RECOMMENDATIONS[language];

  // More nuanced voice selection based on hero traits
  if (heroTraits.includes('energetic') || heroTraits.includes('adventurous')) {
    return 'shimmer'; // Bright, energetic voice
  }

  if (heroTraits.includes('gentle') || heroTraits.includes('kind') || heroTraits.includes('caring')) {
    return 'nova'; // Warm, gentle voice
  }

  if (heroTraits.includes('brave') || heroTraits.includes('determined')) {
    return 'ash'; // Confident, strong voice
  }

  if (heroTraits.includes('creative') || heroTraits.includes('imaginative')) {
    return 'ballad'; // Expressive, artistic voice
  }

  if (heroTraits.includes('funny') || heroTraits.includes('playful')) {
    return 'coral'; // Cheerful, playful voice
  }

  if (heroTraits.includes('wise') || heroTraits.includes('smart')) {
    return 'sage'; // Thoughtful, calm voice
  }

  // Default to nova for bedtime stories
  return 'nova';
}

/**
 * Validate text length for audio generation
 */
export function validateAudioText(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }

  // OpenAI TTS has a 4096 character limit
  if (text.length > 4096) {
    return { valid: false, error: 'Text exceeds maximum length of 4096 characters' };
  }

  return { valid: true };
}
