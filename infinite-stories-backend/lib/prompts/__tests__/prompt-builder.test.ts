import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../builder/prompt-builder';

describe('PromptBuilder', () => {
  describe('create', () => {
    it('should create a new PromptBuilder instance', () => {
      const builder = PromptBuilder.create('test-template');
      expect(builder).toBeDefined();
    });

    it('should accept optional configuration', () => {
      const builder = PromptBuilder.create('test-template', {
        enableSanitization: false,
        language: 'fr',
      });
      expect(builder).toBeDefined();
    });
  });

  describe('withSystemPrompt', () => {
    it('should set the system prompt', () => {
      const result = PromptBuilder.create('test')
        .withSystemPrompt('You are a helpful assistant.')
        .build();

      expect(result.system).toBe('You are a helpful assistant.');
    });

    it('should support chaining', () => {
      const builder = PromptBuilder.create('test');
      const result = builder.withSystemPrompt('System prompt');
      expect(result).toBe(builder);
    });
  });

  describe('withContext', () => {
    it('should format and include context data', () => {
      const context = { heroName: 'Luna', heroAge: 8 };
      const formatter = (ctx: typeof context) =>
        `Character: ${ctx.heroName}, Age: ${ctx.heroAge}`;

      const result = PromptBuilder.create('test')
        .withContext(context, formatter)
        .build();

      expect(result.user).toBe('Character: Luna, Age: 8');
      expect(result.metadata.contextKeys).toContain('heroName');
      expect(result.metadata.contextKeys).toContain('heroAge');
    });

    it('should skip empty context strings', () => {
      const context = { heroName: 'Luna' };
      const formatter = () => '   ';

      const result = PromptBuilder.create('test')
        .withContext(context, formatter)
        .build();

      expect(result.user).toBe('');
    });
  });

  describe('withContextString', () => {
    it('should add pre-formatted context', () => {
      const result = PromptBuilder.create('test')
        .withContextString('Character consistency: bright eyes, friendly smile')
        .build();

      expect(result.user).toBe(
        'Character consistency: bright eyes, friendly smile'
      );
    });

    it('should skip empty strings', () => {
      const result = PromptBuilder.create('test')
        .withContextString('')
        .withContextString('Valid context')
        .build();

      expect(result.user).toBe('Valid context');
    });
  });

  describe('withUserInput', () => {
    it('should include user input in the prompt', () => {
      const result = PromptBuilder.create('test', { enableSanitization: false })
        .withUserInput('Create a story about a brave knight')
        .build();

      expect(result.user).toContain('Create a story about a brave knight');
    });

    it('should skip null or undefined input', () => {
      const result = PromptBuilder.create('test')
        .withUserInput(null)
        .withUserInput(undefined)
        .withContextString('Context only')
        .build();

      expect(result.user).toBe('Context only');
    });

    it('should sanitize user input when enabled', () => {
      const result = PromptBuilder.create('test', { enableSanitization: true })
        .withUserInput('A scary monster attacks')
        .build();

      expect(result.metadata.sanitized).toBe(true);
      expect(result.user).not.toContain('scary');
    });
  });

  describe('withLanguage', () => {
    it('should set the language for sanitization', () => {
      const builder = PromptBuilder.create('test').withLanguage('fr');
      expect(builder).toBeDefined();
    });
  });

  describe('build', () => {
    it('should return a complete BuiltPrompt structure', () => {
      const result = PromptBuilder.create('test-template')
        .withSystemPrompt('System instruction')
        .withContext({ key: 'value' }, (ctx) => `Key: ${ctx.key}`)
        .withUserInput('User question')
        .build();

      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.templateId).toBe('test-template');
    });

    it('should combine multiple context parts with newlines', () => {
      const result = PromptBuilder.create('test')
        .withContextString('Part 1')
        .withContextString('Part 2')
        .build();

      expect(result.user).toBe('Part 1\n\nPart 2');
    });

    it('should separate context and user input with newlines', () => {
      const result = PromptBuilder.create('test', { enableSanitization: false })
        .withContextString('Context')
        .withUserInput('User input')
        .build();

      expect(result.user).toBe('Context\n\nUser input');
    });
  });

  describe('buildCombined', () => {
    it('should combine system and user prompts', () => {
      const result = PromptBuilder.create('test')
        .withSystemPrompt('System')
        .withContextString('User context')
        .buildCombined();

      expect(result).toBe('System\n\nUser context');
    });

    it('should return only system prompt if no user parts', () => {
      const result = PromptBuilder.create('test')
        .withSystemPrompt('System only')
        .buildCombined();

      expect(result).toBe('System only');
    });

    it('should return only user prompt if no system', () => {
      const result = PromptBuilder.create('test')
        .withContextString('User only')
        .buildCombined();

      expect(result).toBe('User only');
    });
  });

  describe('metadata', () => {
    it('should track template ID', () => {
      const result = PromptBuilder.create('my-template').build();
      expect(result.metadata.templateId).toBe('my-template');
    });

    it('should track unique context keys', () => {
      const result = PromptBuilder.create('test')
        .withContext({ a: 1, b: 2 }, () => 'First')
        .withContext({ b: 3, c: 4 }, () => 'Second')
        .build();

      expect(result.metadata.contextKeys).toContain('a');
      expect(result.metadata.contextKeys).toContain('b');
      expect(result.metadata.contextKeys).toContain('c');
      expect(
        result.metadata.contextKeys.filter((k) => k === 'b').length
      ).toBe(1);
    });

    it('should indicate whether sanitization was applied', () => {
      const withSanitization = PromptBuilder.create('test', {
        enableSanitization: true,
      })
        .withUserInput('Test input')
        .build();

      const withoutSanitization = PromptBuilder.create('test', {
        enableSanitization: false,
      })
        .withUserInput('Test input')
        .build();

      expect(withSanitization.metadata.sanitized).toBe(true);
      expect(withoutSanitization.metadata.sanitized).toBe(false);
    });
  });
});
