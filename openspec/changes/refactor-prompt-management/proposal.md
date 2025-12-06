# Change: Refactor Prompt Management for Predictability

## Why
Current prompt construction across the app mixes user parameters directly into system/configuration prompts via string interpolation. This causes:
1. **Unpredictable outputs** - Parameters embedded mid-prompt affect AI interpretation
2. **Prompt injection vulnerabilities** - User data directly in system context
3. **Duplicated logic** - Same sanitization code copied across 5+ routes
4. **Hard to maintain** - 40+ hardcoded term replacements spread across files
5. **No separation** - System instructions, user context, and parameters all concatenated

Example issue (avatar generation):
```typescript
// Current: parameters mixed into configuration
const prompt = `A friendly, child-appropriate cartoon illustration of ${heroName},
a ${heroAge}-year-old child character. ${physicalTraits}...`;
```

## What Changes
- Create centralized **PromptBuilder** pattern with clear separation:
  - **System prompt** (configuration, rules, persona)
  - **Context** (hero profile, visual reference)
  - **User input** (scene descriptions, custom text)
- Externalize prompt templates to configuration files
- Create single source of truth for sanitization rules
- Implement structured prompt composition (not string concatenation)
- Add validation layer between user input and prompt injection

## Impact
- Affected specs: New `prompt-management` capability
- Affected code:
  - `lib/openai/avatar-generator.ts`
  - `lib/openai/story-generator.ts`
  - `lib/openai/illustration-generator.ts`
  - `lib/openai/visual-consistency-service.ts`
  - `lib/openai/content-filter.ts`
  - `app/api/images/generate-illustration/route.ts`
  - `app/api/images/generate-avatar/route.ts`
  - `app/api/ai-assistant/sanitize-prompt/route.ts`
  - All AI assistant routes
