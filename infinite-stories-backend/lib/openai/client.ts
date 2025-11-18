import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// Voice options for audio generation (updated for gpt-4o-mini-tts)
export const VOICE_OPTIONS = [
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer',
  'ash',
  'ballad',
  'coral',
  'sage',
] as const;

export type VoiceOption = typeof VOICE_OPTIONS[number];

// Supported languages
export const SUPPORTED_LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
