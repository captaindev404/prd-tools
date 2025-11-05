import type { SupportedLanguage } from './client';

/**
 * Prompt localization service for multi-language story generation
 */

export const LANGUAGE_CONFIGS: Record<
  SupportedLanguage,
  {
    name: string;
    systemPromptSuffix: string;
    bedtimePhrase: string;
  }
> = {
  en: {
    name: 'English',
    systemPromptSuffix: 'Generate stories in English.',
    bedtimePhrase: 'Sweet dreams',
  },
  es: {
    name: 'Spanish',
    systemPromptSuffix: 'Generate stories in Spanish.',
    bedtimePhrase: 'Dulces sueños',
  },
  fr: {
    name: 'French',
    systemPromptSuffix: 'Generate stories in French.',
    bedtimePhrase: 'Fais de beaux rêves',
  },
  de: {
    name: 'German',
    systemPromptSuffix: 'Generate stories in German.',
    bedtimePhrase: 'Träum süß',
  },
  it: {
    name: 'Italian',
    systemPromptSuffix: 'Generate stories in Italian.',
    bedtimePhrase: 'Sogni d\'oro',
  },
};

export function localizePrompt(
  basePrompt: string,
  language: SupportedLanguage
): string {
  const config = LANGUAGE_CONFIGS[language];
  return `${basePrompt} ${config.systemPromptSuffix}`;
}

export function getBedtimePhrase(language: SupportedLanguage): string {
  return LANGUAGE_CONFIGS[language].bedtimePhrase;
}
