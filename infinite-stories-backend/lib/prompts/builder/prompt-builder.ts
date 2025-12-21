/**
 * PromptBuilder - Structured prompt composition with clear separation of concerns
 *
 * Separates prompts into three layers:
 * - System: Persona, rules, output format (immutable, from configuration)
 * - Context: Hero profile, visual reference (validated input)
 * - User: Scene descriptions, custom text (sanitized user input)
 */

import { SanitizationService } from '../sanitization/sanitization-service';

export type PromptContext = Record<string, unknown>;

export interface BuiltPrompt {
  system: string;
  user: string;
  metadata: {
    templateId: string;
    contextKeys: string[];
    sanitized: boolean;
  };
}

export interface PromptBuilderConfig {
  templateId: string;
  enableSanitization?: boolean;
  language?: string;
}

export class PromptBuilder {
  private templateId: string;
  private systemPrompt: string = '';
  private contextParts: string[] = [];
  private userInputParts: string[] = [];
  private enableSanitization: boolean;
  private language: string;
  private contextKeys: string[] = [];

  private constructor(config: PromptBuilderConfig) {
    this.templateId = config.templateId;
    this.enableSanitization = config.enableSanitization ?? true;
    this.language = config.language ?? 'en';
  }

  /**
   * Create a new PromptBuilder instance
   */
  static create(templateId: string, options?: Partial<PromptBuilderConfig>): PromptBuilder {
    return new PromptBuilder({
      templateId,
      ...options,
    });
  }

  /**
   * Set the system prompt (configuration-based, immutable at runtime)
   * System prompts should NOT contain user data
   */
  withSystemPrompt(systemPrompt: string): PromptBuilder {
    this.systemPrompt = systemPrompt;
    return this;
  }

  /**
   * Add context data (validated input like hero profiles)
   * Context is separated from system instructions
   */
  withContext<T extends Record<string, unknown>>(
    context: T,
    formatter: (ctx: T) => string
  ): PromptBuilder {
    const formatted = formatter(context);
    if (formatted.trim()) {
      this.contextParts.push(formatted);
      this.contextKeys.push(...Object.keys(context));
    }
    return this;
  }

  /**
   * Add raw context string (for pre-formatted context)
   */
  withContextString(contextString: string): PromptBuilder {
    if (contextString.trim()) {
      this.contextParts.push(contextString);
    }
    return this;
  }

  /**
   * Add user input (will be sanitized if enabled)
   */
  withUserInput(input: string | null | undefined): PromptBuilder {
    if (input?.trim()) {
      this.userInputParts.push(input);
    }
    return this;
  }

  /**
   * Set the language for sanitization
   */
  withLanguage(language: string): PromptBuilder {
    this.language = language;
    return this;
  }

  /**
   * Build the final prompt structure
   */
  build(): BuiltPrompt {
    // Build user prompt by combining context and user input
    let userPrompt = '';

    if (this.contextParts.length > 0) {
      userPrompt += this.contextParts.join('\n\n');
    }

    if (this.userInputParts.length > 0) {
      if (userPrompt) {
        userPrompt += '\n\n';
      }

      // Sanitize user input if enabled
      let userInput = this.userInputParts.join('\n\n');
      if (this.enableSanitization) {
        const sanitizationResult = SanitizationService.sanitize(userInput, this.language);
        userInput = sanitizationResult.sanitized;
      }

      userPrompt += userInput;
    }

    return {
      system: this.systemPrompt,
      user: userPrompt,
      metadata: {
        templateId: this.templateId,
        contextKeys: [...new Set(this.contextKeys)],
        sanitized: this.enableSanitization && this.userInputParts.length > 0,
      },
    };
  }

  /**
   * Build a single combined prompt (for APIs that don't support system/user separation)
   */
  buildCombined(): string {
    const { system, user } = this.build();

    if (system && user) {
      return `${system}\n\n${user}`;
    }

    return system || user;
  }
}
