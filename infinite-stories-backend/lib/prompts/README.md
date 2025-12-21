# Prompt Management System

This module provides a centralized, type-safe system for managing AI prompts used throughout the application.

## Architecture

```
lib/prompts/
├── builder/           # PromptBuilder pattern implementation
│   ├── prompt-builder.ts
│   └── input-validator.ts
├── sanitization/      # Content filtering and safety
│   ├── rules.ts
│   └── sanitization-service.ts
├── system/            # System prompts (immutable)
│   ├── avatar-generation.ts
│   ├── story-generation.ts
│   ├── illustration.ts
│   ├── safety.ts
│   └── scene-extraction.ts
├── templates/         # Prompt templates
│   ├── avatar.template.ts
│   ├── story.template.ts
│   ├── illustration.template.ts
│   └── scene-extraction.template.ts
└── __tests__/         # Unit tests
```

## Key Components

### PromptBuilder

Fluent API for constructing prompts with clear separation of concerns:

```typescript
import { PromptBuilder } from '@/lib/prompts';

const result = PromptBuilder.create('my-template')
  .withSystemPrompt('You are a helpful assistant.')
  .withContext({ heroName: 'Luna' }, (ctx) => `Hero: ${ctx.heroName}`)
  .withUserInput('Create a story about adventure')
  .build();

// result.system - System prompt (persona, rules)
// result.user - User prompt (context + sanitized user input)
// result.metadata - Template ID, context keys, sanitization status
```

### SanitizationService

Centralized content filtering for child-safe content:

```typescript
import { SanitizationService } from '@/lib/prompts';

const result = SanitizationService.sanitize('A scary monster', 'en');

// result.sanitized - Cleaned prompt
// result.wasModified - Whether changes were made
// result.riskLevel - 'safe' | 'low' | 'medium' | 'high'
// result.replacements - List of term replacements
// result.injectionAttempts - Detected injection patterns
```

### Prompt Templates

Pre-configured templates for common use cases:

```typescript
import {
  AvatarPromptTemplate,
  StoryPromptTemplate,
  IllustrationPromptTemplate,
  SceneExtractionPromptTemplate
} from '@/lib/prompts';

// Avatar generation
const avatarPrompt = AvatarPromptTemplate.build({
  heroName: 'Luna',
  heroAge: 7,
  heroTraits: ['brave', 'curious'],
});

// Story generation
const { system, user } = StoryPromptTemplate.build({
  heroName: 'Luna',
  heroAge: 7,
  heroTraits: ['brave'],
  language: 'en',
});

// Illustration generation
const illustrationPrompt = IllustrationPromptTemplate.build({
  sceneDescription: 'A child in a garden',
  heroName: 'Luna',
});
```

## Sanitization Rules

The system includes comprehensive rules for:

- **Phrase replacements**: Multi-word patterns (e.g., "dark forest" → "bright enchanted garden")
- **Word replacements**: Individual terms with word boundaries
- **Prompt injection detection**: Patterns like "ignore previous instructions"
- **Multi-language support**: English, French, Spanish, German, Italian

### Risk Levels

- **safe**: No modifications needed
- **low**: Minor replacements made
- **medium**: Weapon/violence terms detected
- **high**: Injection attempts or explicit content

## Testing

Run tests with:

```bash
npm test
```

Tests cover:
- PromptBuilder fluent API
- SanitizationService filtering
- All prompt templates
- Multi-language support
- Edge cases and error handling
