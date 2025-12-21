# Tasks: Refactor Prompt Management

## 1. Create Prompt Infrastructure
- [ ] 1.1 Create `lib/prompts/` directory structure
- [ ] 1.2 Implement `PromptBuilder` class with system/context/user layers
- [ ] 1.3 Create `SanitizationService` with centralized rules
- [ ] 1.4 Add input validation utilities for hero/story parameters
- [ ] 1.5 Write unit tests for PromptBuilder and SanitizationService

## 2. Externalize System Prompts
- [ ] 2.1 Create `lib/prompts/system/avatar-generation.ts` with avatar system prompt
- [ ] 2.2 Create `lib/prompts/system/story-generation.ts` with story system prompts (5 languages)
- [ ] 2.3 Create `lib/prompts/system/illustration.ts` with illustration system prompt
- [ ] 2.4 Create `lib/prompts/system/safety.ts` with content safety rules
- [ ] 2.5 Create `lib/prompts/system/scene-extraction.ts` with scene extraction prompt

## 3. Centralize Sanitization Rules
- [ ] 3.1 Extract term replacements from `app/api/v1/images/generate-illustration/route.ts` (~40 terms)
- [ ] 3.2 Extract term replacements from `app/api/v1/images/generate-avatar/route.ts` (deduplicate)
- [ ] 3.3 Extract safety terms from `lib/openai/content-filter.ts` (5 languages)
- [ ] 3.4 Create `lib/prompts/sanitization/rules.ts` with all centralized rules
- [ ] 3.5 Create `lib/prompts/sanitization/filters.ts` with filter functions

## 4. Create Prompt Templates
- [ ] 4.1 Create `lib/prompts/templates/avatar.template.ts`
- [ ] 4.2 Create `lib/prompts/templates/story.template.ts`
- [ ] 4.3 Create `lib/prompts/templates/illustration.template.ts`
- [ ] 4.4 Create `lib/prompts/templates/scene-extraction.template.ts`
- [ ] 4.5 Write tests to verify templates produce expected output format

## 5. Migrate Avatar Generation (Pilot)
- [ ] 5.1 Refactor `lib/openai/avatar-generator.ts` `buildAvatarPrompt()` to use PromptBuilder
- [ ] 5.2 Update `app/api/v1/heroes/[heroId]/avatar/route.ts` to use new builder
- [ ] 5.3 Remove duplicated `enhancedBasicSanitization()` from route
- [ ] 5.4 Verify avatar generation produces equivalent results
- [ ] 5.5 Add integration tests for avatar prompt generation

## 6. Migrate Story Generation
- [ ] 6.1 Refactor `lib/openai/story-generator.ts` `getSystemPrompt()` and `getUserPrompt()`
- [ ] 6.2 Update `app/api/v1/stories/generate/route.ts`
- [ ] 6.3 Update `app/api/v1/stories/generate-custom/route.ts`
- [ ] 6.4 Verify multi-language story generation works correctly
- [ ] 6.5 Add tests for story prompt generation

## 7. Migrate Illustration Generation
- [ ] 7.1 Refactor `lib/openai/illustration-generator.ts` `buildIllustrationPrompt()`
- [ ] 7.2 Update `app/api/v1/images/generate-illustration/route.ts`
- [ ] 7.3 Remove duplicated sanitization from route
- [ ] 7.4 Fix internal API call to use v1 path (`/api/v1/ai-assistant/sanitize-prompt`)
- [ ] 7.5 Verify character consistency prompts work correctly
- [ ] 7.6 Add tests for illustration prompt generation

## 8. Migrate Remaining Services
- [ ] 8.1 Refactor `lib/openai/visual-consistency-service.ts` prompts
- [ ] 8.2 Refactor AI assistant routes under `app/api/v1/ai-assistant/`
- [ ] 8.3 Update `lib/openai/content-filter.ts` to use centralized rules
- [ ] 8.4 Remove deprecated inline sanitization functions from routes

## 9. Validation & Cleanup
- [ ] 9.1 Run full test suite to verify no regressions
- [ ] 9.2 Remove unused sanitization code from routes
- [ ] 9.3 Update documentation with new prompt architecture
- [ ] 9.4 Add JSDoc comments to PromptBuilder and templates
