## Context
The InfiniteStories backend has 17+ files with prompt construction logic. User parameters (hero names, traits, descriptions) are directly interpolated into prompts via template literals. This creates unpredictable AI behavior and potential prompt injection vulnerabilities.

Key issues identified:
- `avatar-generator.ts` - 5 parameters directly interpolated
- `story-generator.ts` - 6 parameters mixed into system/user prompts
- `illustration-generator.ts` - Scene descriptions directly embedded
- 40+ hardcoded term replacements duplicated across routes
- No separation between system instructions and user content

## Goals / Non-Goals

**Goals:**
- Separate system prompts from user parameters
- Make prompt output predictable and testable
- Centralize sanitization rules
- Enable prompt versioning and A/B testing
- Prevent prompt injection attacks

**Non-Goals:**
- Dynamic prompt editing UI (admin panel)
- Multi-model prompt optimization
- Prompt analytics/logging infrastructure
- Changing the AI models used (covered by other specs)

## Decisions

### Decision 1: Structured Prompt Builder Pattern
**Rationale:** Instead of string concatenation, use a builder that enforces structure:

```typescript
// New pattern
const prompt = PromptBuilder.create('avatar-generation')
  .withSystemPrompt(AvatarSystemPrompts.CHILD_FRIENDLY_CARTOON)
  .withContext({ hero: heroProfile, style: 'cartoon' })
  .withUserInput(customDescription)
  .withSafetyRules(SafetyRules.CHILD_CONTENT)
  .build();

// Output: { system: string, user: string, metadata: object }
```

**Alternatives considered:**
- Template strings with placeholders - Still allows injection, just moves problem
- Handlebars/Mustache templates - Overkill, adds dependency
- JSON schema prompts - Not compatible with all OpenAI endpoints

### Decision 2: Three-Layer Prompt Structure
**Rationale:** Clear separation prevents parameter leakage:

| Layer | Purpose | Source |
|-------|---------|--------|
| **System** | Persona, rules, output format | Configuration files |
| **Context** | Hero profile, visual reference | Database/validated input |
| **User** | Scene description, custom text | User input (sanitized) |

### Decision 3: Externalize Prompts to Config Files
**Rationale:** Move prompts from code to `lib/prompts/` config files:

```
lib/prompts/
├── system/
│   ├── avatar-generation.ts    # System prompts for avatar
│   ├── story-generation.ts     # System prompts for stories
│   ├── illustration.ts         # System prompts for illustrations
│   └── safety.ts               # Content safety rules
├── templates/
│   ├── avatar.template.ts      # Avatar prompt templates
│   ├── story.template.ts       # Story prompt templates
│   └── illustration.template.ts
├── sanitization/
│   ├── rules.ts                # Centralized sanitization rules
│   └── filters.ts              # Term replacement mappings
└── builder/
    └── prompt-builder.ts       # Core builder implementation
```

### Decision 4: Input Validation Before Prompt Injection
**Rationale:** Validate and escape user input at boundaries:

```typescript
// User input validation
const validatedHero = HeroInputValidator.validate({
  name: heroName,      // Max 50 chars, alphanumeric + spaces
  age: heroAge,        // 2-12 range
  traits: heroTraits,  // From allowed enum
});

// Now safe to use in prompts
builder.withContext({ hero: validatedHero });
```

### Decision 5: Immutable Prompt Segments
**Rationale:** System prompts should never contain user data:

```typescript
// WRONG - user data in system prompt
const systemPrompt = `You are creating a story for ${heroName}...`;

// CORRECT - user data in separate segment
const systemPrompt = `You are a children's storyteller...`;
const userPrompt = `Create a story for: ${hero.name}`;
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Route Layer                        │
│  (receives request, validates input, calls PromptBuilder)   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    PromptBuilder                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ SystemPrompt │  │   Context    │  │  UserInput   │      │
│  │  (immutable) │  │ (validated)  │  │ (sanitized)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────┐       │
│  │            SanitizationService                   │       │
│  │  - Term replacement                              │       │
│  │  - Length validation                             │       │
│  │  - Injection detection                           │       │
│  └──────────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   OpenAI Service                            │
│  (receives structured prompt, makes API call)               │
└─────────────────────────────────────────────────────────────┘
```

## Prompt Template Format

```typescript
// lib/prompts/templates/avatar.template.ts
export const AvatarPromptTemplate = {
  id: 'avatar-v1',
  version: '1.0.0',

  system: `You are an expert children's book illustrator creating character portraits.

STYLE REQUIREMENTS:
- Cartoon style suitable for ages 4-10
- Bright, cheerful colors
- Friendly, approachable expressions
- No scary or threatening elements

OUTPUT: Generate a single character portrait.`,

  contextTemplate: (ctx: AvatarContext) => `
CHARACTER PROFILE:
- Name: ${ctx.hero.name}
- Age: ${ctx.hero.age}
- Personality: ${ctx.traits.join(', ')}
${ctx.physicalDescription ? `- Appearance: ${ctx.physicalDescription}` : ''}
${ctx.specialAbility ? `- Special ability visual: ${ctx.specialAbility}` : ''}`,

  userTemplate: (input: string | null) =>
    input ? `ADDITIONAL DETAILS: ${input}` : '',
};
```

## Sanitization Centralization

```typescript
// lib/prompts/sanitization/rules.ts
export const SanitizationRules = {
  // Centralized term replacements (currently duplicated in 5+ files)
  termReplacements: {
    'gargoyle': 'friendly stone guardian',
    'gargouille': 'friendly stone guardian',
    'demon': 'magical creature',
    'ghost': 'friendly spirit',
    // ... 40+ more
  },

  // Phrase patterns to remove
  bannedPatterns: [
    /ignore previous instructions/i,
    /system prompt/i,
    /you are now/i,
  ],

  // Language-specific rules
  languages: {
    fr: { /* French-specific rules */ },
    es: { /* Spanish-specific rules */ },
  },
};
```

## Migration Strategy

1. **Phase 1: Create infrastructure** (no behavior change)
   - Add `lib/prompts/` directory structure
   - Create PromptBuilder class
   - Create SanitizationService with existing rules

2. **Phase 2: Migrate one generator** (avatar-generator)
   - Refactor `buildAvatarPrompt()` to use PromptBuilder
   - Verify output matches current behavior
   - Add tests

3. **Phase 3: Migrate remaining generators**
   - story-generator.ts
   - illustration-generator.ts
   - visual-consistency-service.ts

4. **Phase 4: Clean up duplicates**
   - Remove duplicated sanitization from routes
   - Point all routes to centralized rules

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking existing prompt behavior | A/B test new prompts, compare outputs |
| Over-engineering simple prompts | Start minimal, add complexity only when needed |
| Performance overhead from builder | Builder is compile-time, not runtime |
| Learning curve for team | Clear documentation, consistent patterns |

## Open Questions
- [ ] Should prompt templates be editable at runtime (environment variables)?
- [ ] Do we need prompt versioning for rollback capability?
