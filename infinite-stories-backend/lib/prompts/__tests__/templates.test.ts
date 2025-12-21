import { describe, it, expect } from 'vitest';
import { AvatarPromptTemplate, buildAvatarPrompt } from '../templates/avatar.template';
import { StoryPromptTemplate, getSystemPrompt, getUserPrompt } from '../templates/story.template';
import {
  IllustrationPromptTemplate,
  buildIllustrationPrompt,
} from '../templates/illustration.template';
import { SceneExtractionPromptTemplate } from '../templates/scene-extraction.template';

describe('AvatarPromptTemplate', () => {
  describe('build', () => {
    it('should generate a valid avatar prompt', () => {
      const context = {
        heroName: 'Luna',
        heroAge: 7,
        heroTraits: ['brave', 'curious'],
      };

      const result = AvatarPromptTemplate.build(context);

      expect(result).toContain('Luna');
      expect(result).toContain('7-year-old');
      expect(result).toContain('child character');
    });

    it('should include physical traits when provided', () => {
      const context = {
        heroName: 'Max',
        heroAge: 8,
        heroTraits: ['adventurous'],
        physicalTraits: {
          hairColor: 'brown',
          eyeColor: 'blue',
          skinTone: 'fair',
        },
      };

      const result = AvatarPromptTemplate.build(context);

      expect(result).toContain('brown hair');
      expect(result).toContain('blue eyes');
      expect(result).toContain('fair skin tone');
    });

    it('should include special abilities when provided', () => {
      const context = {
        heroName: 'Stella',
        heroAge: 6,
        heroTraits: ['creative'],
        specialAbilities: ['flying', 'magic'],
      };

      const result = AvatarPromptTemplate.build(context);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include style guidance', () => {
      const context = {
        heroName: 'Test',
        heroAge: 5,
        heroTraits: [],
      };

      const result = AvatarPromptTemplate.build(context);

      expect(result.toLowerCase()).toMatch(/cartoon|friendly|child/);
    });
  });

  describe('buildAvatarPrompt (legacy)', () => {
    it('should work as a backwards-compatible wrapper', () => {
      const params = {
        heroName: 'Luna',
        heroAge: 7,
        heroTraits: ['brave'],
      };

      const result = buildAvatarPrompt(params);

      expect(result).toContain('Luna');
      expect(result).toBeDefined();
    });
  });
});

describe('StoryPromptTemplate', () => {
  describe('getSystemPrompt', () => {
    it('should return English system prompt', () => {
      const result = StoryPromptTemplate.getSystemPrompt('en');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(100);
    });

    it('should return French system prompt', () => {
      const result = StoryPromptTemplate.getSystemPrompt('fr');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(100);
    });

    it('should return Spanish system prompt', () => {
      const result = StoryPromptTemplate.getSystemPrompt('es');
      expect(result).toBeDefined();
    });

    it('should return German system prompt', () => {
      const result = StoryPromptTemplate.getSystemPrompt('de');
      expect(result).toBeDefined();
    });

    it('should return Italian system prompt', () => {
      const result = StoryPromptTemplate.getSystemPrompt('it');
      expect(result).toBeDefined();
    });
  });

  describe('buildUserPrompt', () => {
    it('should generate a valid user prompt', () => {
      const context = {
        heroName: 'Luna',
        heroAge: 7,
        heroTraits: ['brave', 'curious'],
        language: 'en' as const,
      };

      const result = StoryPromptTemplate.buildUserPrompt(context);

      expect(result).toContain('Luna');
      expect(result).toContain('7');
      expect(result).toContain('brave');
      expect(result).toContain('curious');
    });

    it('should include custom prompt when provided', () => {
      const context = {
        heroName: 'Max',
        heroAge: 8,
        heroTraits: ['adventurous'],
        language: 'en' as const,
      };

      const result = StoryPromptTemplate.buildUserPrompt(
        context,
        'Include a magical forest'
      );

      expect(result).toContain('magical forest');
    });

    it('should include event type when provided', () => {
      const context = {
        heroName: 'Stella',
        heroAge: 6,
        heroTraits: ['creative'],
        eventType: 'birthday',
        language: 'en' as const,
      };

      const result = StoryPromptTemplate.buildUserPrompt(context);

      expect(result).toContain('birthday');
    });

    it('should include special abilities when provided', () => {
      const context = {
        heroName: 'Leo',
        heroAge: 9,
        heroTraits: ['brave'],
        specialAbilities: ['flying', 'invisibility'],
        language: 'en' as const,
      };

      const result = StoryPromptTemplate.buildUserPrompt(context);

      expect(result).toContain('flying');
      expect(result).toContain('invisibility');
    });
  });

  describe('build', () => {
    it('should return both system and user prompts', () => {
      const context = {
        heroName: 'Test',
        heroAge: 5,
        heroTraits: ['happy'],
        language: 'en' as const,
      };

      const result = StoryPromptTemplate.build(context);

      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('user');
      expect(result.system.length).toBeGreaterThan(0);
      expect(result.user.length).toBeGreaterThan(0);
    });
  });

  describe('legacy functions', () => {
    it('getSystemPrompt should work', () => {
      const result = getSystemPrompt('en');
      expect(result).toBeDefined();
    });

    it('getUserPrompt should work', () => {
      const result = getUserPrompt({
        heroName: 'Luna',
        heroAge: 7,
        heroTraits: ['brave'],
        language: 'en',
      });
      expect(result).toContain('Luna');
    });
  });
});

describe('IllustrationPromptTemplate', () => {
  describe('build', () => {
    it('should generate a valid illustration prompt', () => {
      const context = {
        sceneDescription: 'A child playing in a garden',
        heroName: 'Luna',
      };

      const result = IllustrationPromptTemplate.build(context);

      expect(result).toContain('Luna');
      expect(result).toContain('garden');
    });

    it('should use canonical prompt when available', () => {
      const context = {
        sceneDescription: 'A child reading a book',
        heroName: 'Max',
        heroVisualProfile: {
          canonicalPrompt: 'A friendly 8-year-old boy with brown hair',
        },
      };

      const result = IllustrationPromptTemplate.build(context);

      expect(result).toContain('friendly 8-year-old boy');
    });

    it('should include visual profile details when no canonical prompt', () => {
      const context = {
        sceneDescription: 'A child at the beach',
        heroName: 'Stella',
        heroVisualProfile: {
          hairColor: 'blonde',
          eyeColor: 'green',
          skinTone: 'tan',
        },
      };

      const result = IllustrationPromptTemplate.build(context);

      expect(result).toContain('blonde hair');
      expect(result).toContain('green eyes');
      expect(result).toContain('tan skin tone');
    });

    it('should include art style', () => {
      const context = {
        sceneDescription: 'A child in a castle',
        heroName: 'Leo',
        heroVisualProfile: {
          artStyle: 'watercolor illustration',
        },
      };

      const result = IllustrationPromptTemplate.build(context);

      expect(result).toContain('watercolor');
    });
  });

  describe('buildEnhanced', () => {
    it('should include character consistency prompt', () => {
      const result = IllustrationPromptTemplate.buildEnhanced(
        'A child exploring a cave',
        {
          name: 'Luna',
          appearance: 'bright blue eyes and curly red hair',
        }
      );

      expect(result).toContain('Luna');
      expect(result).toContain('blue eyes');
      expect(result).toContain('red hair');
    });

    it('should include avatar prompt when provided', () => {
      const result = IllustrationPromptTemplate.buildEnhanced(
        'A child flying through clouds',
        {
          name: 'Max',
          avatarPrompt: 'A friendly boy with a cape',
        }
      );

      expect(result).toContain('cape');
    });
  });

  describe('buildIllustrationPrompt (legacy)', () => {
    it('should work as a backwards-compatible wrapper', () => {
      const result = buildIllustrationPrompt({
        sceneDescription: 'A magical forest',
        heroName: 'Luna',
      });

      expect(result).toContain('Luna');
      expect(result).toContain('forest');
    });
  });
});

describe('SceneExtractionPromptTemplate', () => {
  describe('build', () => {
    it('should generate a valid scene extraction prompt', () => {
      const storyText =
        'Luna walked through the magical forest. She found a hidden treehouse.';

      const result = SceneExtractionPromptTemplate.build(storyText);

      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('user');
      expect(result.user).toContain(storyText);
    });

    it('should include the story content in user prompt', () => {
      const storyText = 'A story about Max exploring a castle.';

      const result = SceneExtractionPromptTemplate.build(storyText);

      expect(result.user).toContain('Max');
      expect(result.user).toContain('castle');
    });
  });

  describe('getSystemPrompt', () => {
    it('should return a valid system prompt', () => {
      const result = SceneExtractionPromptTemplate.getSystemPrompt();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(100);
      expect(result.toLowerCase()).toContain('scene');
    });
  });

  describe('buildUserPrompt', () => {
    it('should include the story text', () => {
      const storyText = 'Once upon a time, there was a brave knight.';
      const result = SceneExtractionPromptTemplate.buildUserPrompt(storyText);

      expect(result).toContain(storyText);
    });

    it('should wrap story text in extraction context', () => {
      const storyText = 'A magical adventure.';
      const result = SceneExtractionPromptTemplate.buildUserPrompt(storyText);

      expect(result).toContain('A magical adventure.');
    });
  });
});
