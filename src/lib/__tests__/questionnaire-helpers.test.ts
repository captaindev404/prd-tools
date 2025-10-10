/**
 * Tests for Questionnaire Helper Utilities
 */

import {
  normalizeQuestionText,
  normalizeQuestionTexts,
  isBilingualFormat,
  normalizeMcqOptions,
  isLegacyQuestion,
  warnBilingualDeprecation,
} from '../questionnaire-helpers';

describe('normalizeQuestionText', () => {
  describe('new format (string)', () => {
    it('should return string as-is', () => {
      const text = 'What is your name?';
      expect(normalizeQuestionText(text)).toBe(text);
    });

    it('should handle empty string', () => {
      expect(normalizeQuestionText('')).toBe('');
    });

    it('should handle strings with special characters', () => {
      const text = 'Rate from 1-10: How satisfied are you?';
      expect(normalizeQuestionText(text)).toBe(text);
    });

    it('should handle multiline strings', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      expect(normalizeQuestionText(text)).toBe(text);
    });
  });

  describe('old format (bilingual object)', () => {
    it('should extract English text from bilingual object', () => {
      const text = { en: 'What is your name?', fr: 'Quel est votre nom?' };
      expect(normalizeQuestionText(text)).toBe('What is your name?');
    });

    it('should handle empty English text', () => {
      const text = { en: '', fr: 'Texte français' };
      expect(normalizeQuestionText(text)).toBe('');
    });

    it('should return empty string if English is missing but fr exists', () => {
      const text = { en: '', fr: 'Bonjour' };
      expect(normalizeQuestionText(text)).toBe('');
    });

    it('should handle bilingual object with only en field', () => {
      const text = { en: 'Hello', fr: '' };
      expect(normalizeQuestionText(text)).toBe('Hello');
    });
  });

  describe('invalid formats', () => {
    it('should throw error for null', () => {
      expect(() => normalizeQuestionText(null as any)).toThrow(
        'Invalid question text format'
      );
    });

    it('should throw error for undefined', () => {
      expect(() => normalizeQuestionText(undefined as any)).toThrow(
        'Invalid question text format'
      );
    });

    it('should throw error for number', () => {
      expect(() => normalizeQuestionText(123 as any)).toThrow(
        'Invalid question text format'
      );
    });

    it('should throw error for array', () => {
      expect(() => normalizeQuestionText(['text'] as any)).toThrow(
        'Invalid question text format'
      );
    });

    it('should throw error for object without en/fr fields', () => {
      expect(() => normalizeQuestionText({ foo: 'bar' } as any)).toThrow(
        'Invalid question text format'
      );
    });

    it('should throw error for object with only fr field', () => {
      expect(() => normalizeQuestionText({ fr: 'Bonjour' } as any)).toThrow(
        'Invalid question text format'
      );
    });
  });
});

describe('normalizeQuestionTexts', () => {
  it('should normalize array of strings', () => {
    const texts = ['Question 1', 'Question 2', 'Question 3'];
    expect(normalizeQuestionTexts(texts)).toEqual(texts);
  });

  it('should normalize array of bilingual objects', () => {
    const texts = [
      { en: 'Question 1', fr: 'Question 1 FR' },
      { en: 'Question 2', fr: 'Question 2 FR' },
    ];
    expect(normalizeQuestionTexts(texts)).toEqual(['Question 1', 'Question 2']);
  });

  it('should normalize mixed array of strings and objects', () => {
    const texts = [
      'Question 1',
      { en: 'Question 2', fr: 'Question 2 FR' },
      'Question 3',
    ];
    expect(normalizeQuestionTexts(texts)).toEqual([
      'Question 1',
      'Question 2',
      'Question 3',
    ]);
  });

  it('should handle empty array', () => {
    expect(normalizeQuestionTexts([])).toEqual([]);
  });

  it('should throw error if any item is invalid', () => {
    const texts = ['Question 1', null as any, 'Question 3'];
    expect(() => normalizeQuestionTexts(texts)).toThrow();
  });
});

describe('isBilingualFormat', () => {
  it('should return true for valid bilingual object', () => {
    const text = { en: 'Hello', fr: 'Bonjour' };
    expect(isBilingualFormat(text)).toBe(true);
  });

  it('should return false for string', () => {
    expect(isBilingualFormat('Hello')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isBilingualFormat(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isBilingualFormat(undefined)).toBe(false);
  });

  it('should return false for number', () => {
    expect(isBilingualFormat(123)).toBe(false);
  });

  it('should return false for array', () => {
    expect(isBilingualFormat(['en', 'fr'])).toBe(false);
  });

  it('should return false for object without en field', () => {
    expect(isBilingualFormat({ fr: 'Bonjour' })).toBe(false);
  });

  it('should return false for object without fr field', () => {
    expect(isBilingualFormat({ en: 'Hello' })).toBe(false);
  });

  it('should return false for object with non-string fields', () => {
    expect(isBilingualFormat({ en: 123, fr: 456 })).toBe(false);
  });

  it('should return false for empty object', () => {
    expect(isBilingualFormat({})).toBe(false);
  });
});

describe('normalizeMcqOptions', () => {
  it('should normalize options with string text', () => {
    const options = [
      { id: '1', text: 'Option 1', order: 1 },
      { id: '2', text: 'Option 2', order: 2 },
    ];
    expect(normalizeMcqOptions(options)).toEqual(options);
  });

  it('should normalize options with bilingual text', () => {
    const options = [
      { id: '1', text: { en: 'Option 1', fr: 'Option 1 FR' }, order: 1 },
      { id: '2', text: { en: 'Option 2', fr: 'Option 2 FR' }, order: 2 },
    ];
    expect(normalizeMcqOptions(options)).toEqual([
      { id: '1', text: 'Option 1', order: 1 },
      { id: '2', text: 'Option 2', order: 2 },
    ]);
  });

  it('should normalize mixed options', () => {
    const options = [
      { id: '1', text: 'Option 1', order: 1 },
      { id: '2', text: { en: 'Option 2', fr: 'Option 2 FR' }, order: 2 },
      { id: '3', text: 'Option 3', order: 3 },
    ];
    expect(normalizeMcqOptions(options)).toEqual([
      { id: '1', text: 'Option 1', order: 1 },
      { id: '2', text: 'Option 2', order: 2 },
      { id: '3', text: 'Option 3', order: 3 },
    ]);
  });

  it('should preserve additional option properties', () => {
    const options = [
      {
        id: '1',
        text: { en: 'Option 1', fr: 'Option 1 FR' },
        order: 1,
        value: 'opt1',
        selected: true,
      },
    ];
    expect(normalizeMcqOptions(options)).toEqual([
      {
        id: '1',
        text: 'Option 1',
        order: 1,
        value: 'opt1',
        selected: true,
      },
    ]);
  });

  it('should handle empty options array', () => {
    expect(normalizeMcqOptions([])).toEqual([]);
  });
});

describe('isLegacyQuestion', () => {
  it('should return true for question with bilingual text', () => {
    const question = { text: { en: 'Question?', fr: 'Question?' } };
    expect(isLegacyQuestion(question)).toBe(true);
  });

  it('should return false for question with string text', () => {
    const question = { text: 'Question?' };
    expect(isLegacyQuestion(question)).toBe(false);
  });

  it('should work with full question objects', () => {
    const legacyQuestion = {
      id: 'q1',
      type: 'text' as const,
      text: { en: 'What is your name?', fr: 'Quel est votre nom?' },
      required: true,
    };
    expect(isLegacyQuestion(legacyQuestion)).toBe(true);

    const newQuestion = {
      id: 'q1',
      type: 'text' as const,
      text: 'What is your name?',
      required: true,
    };
    expect(isLegacyQuestion(newQuestion)).toBe(false);
  });
});

describe('warnBilingualDeprecation', () => {
  const originalEnv = process.env.NODE_ENV;
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

  beforeEach(() => {
    consoleWarnSpy.mockClear();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    consoleWarnSpy.mockRestore();
  });

  it('should log warning in development mode', () => {
    process.env.NODE_ENV = 'development';
    warnBilingualDeprecation('QuestionBuilder');

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Deprecation Warning]')
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('QuestionBuilder')
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('v0.6.0')
    );
  });

  it('should not log warning in production mode', () => {
    process.env.NODE_ENV = 'production';
    warnBilingualDeprecation('QuestionBuilder');

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should not log warning in test mode', () => {
    process.env.NODE_ENV = 'test';
    warnBilingualDeprecation('QuestionBuilder');

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should include context in warning message', () => {
    process.env.NODE_ENV = 'development';
    warnBilingualDeprecation('API /api/questionnaires');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('API /api/questionnaires')
    );
  });
});
