# Upgrade OpenAI Models and Migrate to Response API

**Change ID:** `upgrade-openai-models`
**Status:** Proposed
**Created:** 2025-11-14

## Overview

Upgrade all OpenAI model calls to the latest generation models and migrate from the Chat Completions API to the new Response API for improved performance, capabilities, and consistency.

## Motivation

**Current State:**
- Text generation uses `gpt-4o-2024-08-06` via Chat Completions API
- Image generation uses `dall-e-3`
- Audio generation uses `tts-1` (older TTS model)
- Multiple API patterns (completions, images, audio) across services

**Desired State:**
- Text generation uses `gpt-5-mini` with Response API
- Image generation uses `gpt-5-mini` with Response API
- Audio generation uses `gpt-4o-mini-tts` with enhanced instructions
- Unified Response API pattern across all services

**Benefits:**
1. **Performance**: gpt-5-mini offers faster response times with reasoning capabilities
2. **Cost Optimization**: Mini models provide better cost/performance ratio
3. **Enhanced Capabilities**: Response API provides structured outputs, reasoning tokens, and better tool calling
4. **Audio Quality**: gpt-4o-mini-tts supports instruction-based voice control (accent, tone, speed, emotion)
5. **Consistency**: Unified API pattern across all OpenAI services
6. **Future-Proof**: Latest API format aligned with OpenAI's roadmap

## Scope

### Affected Services
- `infinite-stories-backend/lib/openai/story-generator.ts` - Story generation (GPT-4o → gpt-5-mini)
- `infinite-stories-backend/lib/openai/illustration-generator.ts` - Illustration generation (dall-e-3 → gpt-5-mini)
- `infinite-stories-backend/lib/openai/avatar-generator.ts` - Avatar generation (dall-e-3 → gpt-5-mini)
- `infinite-stories-backend/lib/openai/audio-generator.ts` - Audio generation (tts-1 → gpt-4o-mini-tts)
- `infinite-stories-backend/lib/openai/visual-consistency-service.ts` - Visual extraction (GPT-4o → gpt-5-mini)

### Out of Scope
- `content-filter.ts` - Content filtering logic remains unchanged
- `prompt-localizer.ts` - Localization logic remains unchanged
- Frontend iOS app changes
- Database schema changes (existing fields remain compatible)

## Implementation Strategy

### Phase 1: Response API Migration
Migrate text generation services from Chat Completions API to Response API while maintaining current models to validate API migration separately from model upgrades.

### Phase 2: Text Generation Upgrade
Upgrade text generation calls from `gpt-4o-2024-08-06` to `gpt-5-mini` with appropriate reasoning and verbosity configurations.

### Phase 3: Image Generation Upgrade
Migrate image generation from `dall-e-3` to `gpt-5-mini` image capabilities.

### Phase 4: Audio Generation Upgrade
Upgrade audio generation from `tts-1` to `gpt-4o-mini-tts` with instruction-based voice control.

### Phase 5: Testing & Validation
Comprehensive testing of all upgraded services with real-world scenarios.

## Success Criteria

1. All OpenAI API calls use Response API format
2. Text generation uses `gpt-5-mini` with structured outputs
3. Image generation uses `gpt-5-mini` with character consistency
4. Audio generation uses `gpt-4o-mini-tts` with voice instructions
5. All existing tests pass with new models
6. Response times maintain or improve over current implementation
7. Generated content quality meets or exceeds current standards
8. No breaking changes to API contracts

## Risks & Mitigations

**Risk:** Model behavior differences may affect content quality
- **Mitigation:** Extensive testing with existing stories/scenarios; maintain content filtering

**Risk:** Response API format changes may break existing code
- **Mitigation:** Incremental migration; comprehensive unit tests; backward compatibility layer

**Risk:** Cost implications of model changes unclear
- **Mitigation:** Monitor token usage; mini models typically cost less; add usage tracking

**Risk:** gpt-5-mini image generation may not match dall-e-3 quality
- **Mitigation:** A/B testing; fallback to dall-e-3 if needed; quality validation

## Dependencies

- OpenAI SDK: Already installed, supports Response API
- No new external dependencies required
- Existing error handling and retry logic remains compatible

## Related Changes

- `finish-backend-migration` - This change builds on the backend migration
- Future: Offline story playback (would benefit from optimized model costs)

## Acceptance Criteria

- [ ] All text generation uses Response API with gpt-5-mini
- [ ] All image generation uses gpt-5-mini with consistent quality
- [ ] All audio generation uses gpt-4o-mini-tts with voice instructions
- [ ] Content filtering still works correctly
- [ ] API error handling covers Response API error formats
- [ ] Token usage metrics tracked and logged
- [ ] Integration tests pass for all services
- [ ] Documentation updated with new model references
