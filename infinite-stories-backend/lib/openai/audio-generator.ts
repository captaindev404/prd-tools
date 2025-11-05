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

// Voice mapping for different languages and story types
const VOICE_RECOMMENDATIONS: Record<SupportedLanguage, VoiceOption[]> = {
  en: ['nova', 'shimmer', 'alloy'],
  es: ['nova', 'shimmer', 'alloy'],
  fr: ['nova', 'shimmer', 'alloy'],
  de: ['nova', 'shimmer', 'alloy'],
  it: ['nova', 'shimmer', 'alloy'],
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
    // Generate audio using OpenAI TTS
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice,
      input: text,
      response_format: 'mp3',
      speed: 1.0,
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

    // Estimate duration (rough estimate: ~150 words per minute, ~5 chars per word)
    const wordCount = text.length / 5;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60);

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
 */
export function getRecommendedVoice(
  language: SupportedLanguage,
  heroTraits: string[]
): VoiceOption {
  // Simple logic - can be enhanced based on traits
  const recommendations = VOICE_RECOMMENDATIONS[language];

  if (heroTraits.includes('energetic') || heroTraits.includes('adventurous')) {
    return recommendations[1] || 'shimmer';
  }

  if (heroTraits.includes('gentle') || heroTraits.includes('kind')) {
    return recommendations[0] || 'nova';
  }

  return recommendations[0] || 'alloy';
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
