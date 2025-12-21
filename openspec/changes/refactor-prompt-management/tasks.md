# Tasks: Refactor Prompt Management

## 1. Create Prompt Infrastructure
- [x] 1.1 Create `lib/prompts/` directory structure
- [x] 1.2 Implement `PromptBuilder` class with system/context/user layers
- [x] 1.3 Create `SanitizationService` with centralized rules
- [x] 1.4 Add input validation utilities for hero/story parameters
- [x] 1.5 Write unit tests for PromptBuilder and SanitizationService

## 2. Externalize System Prompts
- [x] 2.1 Create `lib/prompts/system/avatar-generation.ts` with avatar system prompt
- [x] 2.2 Create `lib/prompts/system/story-generation.ts` with story system prompts (5 languages)
- [x] 2.3 Create `lib/prompts/system/illustration.ts` with illustration system prompt
- [x] 2.4 Create `lib/prompts/system/safety.ts` with content safety rules
- [x] 2.5 Create `lib/prompts/system/scene-extraction.ts` with scene extraction prompt

## 3. Centralize Sanitization Rules
- [x] 3.1 Extract term replacements from `app/api/v1/images/generate-illustration/route.ts` (~40 terms)
- [x] 3.2 Extract term replacements from `app/api/v1/images/generate-avatar/route.ts` (deduplicate)
- [x] 3.3 Extract safety terms from `lib/openai/content-filter.ts` (5 languages)
- [x] 3.4 Create `lib/prompts/sanitization/rules.ts` with all centralized rules
- [x] 3.5 Create `lib/prompts/sanitization/sanitization-service.ts` with filter functions

## 4. Create Prompt Templates
- [x] 4.1 Create `lib/prompts/templates/avatar.template.ts`
- [x] 4.2 Create `lib/prompts/templates/story.template.ts`
- [x] 4.3 Create `lib/prompts/templates/illustration.template.ts`
- [x] 4.4 Create `lib/prompts/templates/scene-extraction.template.ts`
- [x] 4.5 Write tests to verify templates produce expected output format

## 5. Migrate Avatar Generation (Pilot)
- [x] 5.1 Refactor `lib/openai/avatar-generator.ts` `buildAvatarPrompt()` to use PromptBuilder
- [x] 5.2 Update `app/api/v1/images/generate-avatar/route.ts` to use centralized sanitization
- [x] 5.3 Remove duplicated `enhancedBasicSanitization()` from route
- [ ] 5.4 Verify avatar generation produces equivalent results
- [ ] 5.5 Add integration tests for avatar prompt generation

## 6. Migrate Story Generation
- [x] 6.1 Refactor `lib/openai/story-generator.ts` `getSystemPrompt()` and `getUserPrompt()`
- [x] 6.2 Update story generator to use StoryPromptTemplate
- [x] 6.3 Update scene extraction to use SceneExtractionPromptTemplate
- [ ] 6.4 Verify multi-language story generation works correctly
- [ ] 6.5 Add tests for story prompt generation

## 7. Migrate Illustration Generation
- [x] 7.1 Refactor `lib/openai/illustration-generator.ts` `buildIllustrationPrompt()`
- [x] 7.2 Update `app/api/v1/images/generate-illustration/route.ts`
- [x] 7.3 Remove duplicated sanitization from route
- [x] 7.4 Use centralized buildCharacterConsistencyPrompt and ILLUSTRATION_STYLE_GUIDANCE
- [ ] 7.5 Verify character consistency prompts work correctly
- [ ] 7.6 Add tests for illustration prompt generation

## 8. Migrate Remaining Services
- [x] 8.1 Refactor `lib/openai/visual-consistency-service.ts` prompts
- [x] 8.2 Refactor AI assistant sanitize-prompt route to use centralized system prompt
- [x] 8.3 Update `lib/openai/content-filter.ts` to delegate to centralized SanitizationService
- [x] 8.4 Remove deprecated inline sanitization functions from routes

## 9. Validation & Cleanup
- [x] 9.1 Run TypeScript compilation to verify no type errors in new code
- [x] 9.2 Remove unused sanitization code from routes
- [x] 9.3 Update documentation with new prompt architecture
- [x] 9.4 Add JSDoc comments to PromptBuilder and templates
