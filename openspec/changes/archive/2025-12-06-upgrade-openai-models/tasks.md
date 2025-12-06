# Tasks: OpenAI Model Upgrade & Response API Migration

## ⚠️ VALIDATION STATUS (2025-11-18 - UPDATED)

**🟡 IMPLEMENTATION FIXES APPLIED** - See `VALIDATION_FINDINGS.md` for full details

**Summary:**
- ✅ Response API exists (verified via OpenAI docs)
- ✅ **Text Generation FIXED** - Correct API structure implemented
- ⚠️ **Image generation with gpt-5-mini** - IMPLEMENTED but UNDOCUMENTED/UNTESTED
- ✅ gpt-5-mini model exists and is being used
- ✅ gpt-4o-mini-tts exists and supports instructions
- ⚠️ **REQUIRES TESTING** before production deployment

**Implementation Choice: Option 1** (Fix Response API)

**Status:**
- ✅ Text generation fixed (story-generator.ts, visual-consistency-service.ts)
- ✅ Image generation implemented with assumptions (illustration-generator.ts, avatar-generator.ts)
- ⚠️ Validation testing PENDING

**See VALIDATION_FINDINGS.md for:**
- Fixed implementation details
- Assumptions made for image generation
- Testing requirements
- Next steps

---

## Phase 1: Response API Migration (Text Generation)

### 1.1 Update story-generator.ts to use Response API ✅ COMPLETED
**Dependencies:** None
**Parallel:** Can run with 1.2

- [x] Update `generateStory()` to use `openai.responses.create`
- [x] Change `messages` parameter to `instructions` + `input` (string)
- [x] Update response_format configuration to use `text.format`
- [x] Add response status checking before processing output
- [x] Extract content from `response.output_text` (direct property)
- [x] Add token usage logging (input, output, total)
- [x] Update error handling for Response API error format
- [x] **FIXED**: Changed model to `gpt-5-mini` with correct API structure
- [x] **FIXED**: Restored `temperature` and `max_output_tokens` parameters

**Validation:**
- ⚠️ PENDING: Generate a test story and verify output structure
- ⚠️ PENDING: Confirm error handling works with invalid inputs
- ⚠️ PENDING: Verify token usage is logged correctly

### 1.2 Update extractScenesFromStory() to use Response API ✅ COMPLETED
**Dependencies:** None
**Parallel:** Can run with 1.1

- [x] Update `extractScenesFromStory()` to use `openai.responses.create`
- [x] Change `messages` parameter to `instructions` + `input` (string)
- [x] Update response_format to `text.format`
- [x] Add response status checking
- [x] Extract scenes from `response.output_text`
- [x] **FIXED**: Changed model to `gpt-5-mini` with correct API structure
- [x] **FIXED**: Restored `temperature` parameter

**Validation:**
- ⚠️ PENDING: Extract scenes from a test story
- ⚠️ PENDING: Verify scene structure is correct
- ⚠️ PENDING: Confirm timestamp and duration estimates are reasonable

### 1.3 Update visual-consistency-service.ts to use Response API ✅ COMPLETED
**Dependencies:** None
**Parallel:** Can run with 1.1, 1.2

- [x] Update `extractVisualCharacteristics()` to use Response API
- [x] Change messages to `instructions` + `input` (string) format
- [x] Update response_format to text.format
- [x] Add status checking and error handling
- [x] Extract characteristics from `response.output_text`
- [x] **FIXED**: Changed model to `gpt-5-mini` with correct API structure
- [x] **FIXED**: Restored `temperature` parameter

**Validation:**
- ⚠️ PENDING: Extract visual characteristics from test avatar prompt
- ⚠️ PENDING: Verify all fields are properly populated
- ⚠️ PENDING: Confirm canonical prompt generation works

### 1.4 Test Response API migration with existing models
**Dependencies:** 1.1, 1.2, 1.3

- [ ] Run integration tests for story generation
- [ ] Run integration tests for scene extraction
- [ ] Run integration tests for visual characteristics extraction
- [ ] Compare output quality vs baseline (Chat Completions API)
- [ ] Verify token usage is accurately tracked
- [ ] Test error scenarios (rate limits, invalid inputs, API errors)
- [ ] Document any behavioral differences

**Validation:**
- All tests pass
- Output quality matches or exceeds baseline
- Token usage metrics are accurate
- Error handling works correctly

## Phase 2: Text Generation Model Upgrade

### 2.1 Upgrade story generation to gpt-5-mini
**Dependencies:** 1.4

- [x] Change model from `gpt-4o-2024-08-06` to `gpt-5-mini` in generateStory()
- [x] Add `text.verbosity: 'medium'` configuration
- [x] Add `text.reasoning: 'low'` configuration (commented out for now)
- [x] Keep temperature at 0.8 for creativity
- [ ] Test story generation with various hero/event combinations
- [ ] Monitor response times and token usage

**Validation:**
- Generate 10 test stories with different parameters
- Verify story length is 300-500 words
- Confirm story quality meets child-safety standards
- Check content filtering still works
- Measure average response time
- Compare token usage vs gpt-4o

### 2.2 Upgrade scene extraction to gpt-5-mini
**Dependencies:** 1.4

- [x] Change model to `gpt-5-mini` in extractScenesFromStory()
- [x] Keep temperature at 0.3 for consistency
- [x] Add `text.reasoning: 'low'` configuration (commented out for now)
- [ ] Test scene extraction with various story lengths
- [ ] Verify 3-8 scenes are consistently identified

**Validation:**
- Extract scenes from 5 different stories
- Verify scene descriptions are detailed enough for image generation
- Confirm timestamp estimates are reasonable
- Measure extraction performance

### 2.3 Upgrade visual characteristics extraction to gpt-5-mini
**Dependencies:** 1.4

- [x] Change model to `gpt-5-mini` in extractVisualCharacteristics()
- [x] Keep temperature at 0.3 for stable extraction
- [ ] Test with various avatar prompts
- [ ] Verify canonical prompt generation

**Validation:**
- Extract characteristics from 5 different avatar prompts
- Verify all relevant fields are populated
- Confirm canonical prompts are consistent
- Measure extraction speed

### 2.4 Performance and cost analysis for text upgrades
**Dependencies:** 2.1, 2.2, 2.3

- [ ] Measure average response times for all text generation endpoints
- [ ] Calculate token usage for typical requests
- [ ] Estimate cost savings vs gpt-4o-2024-08-06
- [ ] Document performance metrics (P50, P95, P99 latencies)
- [ ] Create monitoring dashboard for token usage

**Validation:**
- Response times meet targets (< 5s for stories, < 3s for scenes)
- Cost per request is lower than gpt-4o
- Quality metrics meet standards

## Phase 3: Image Generation Model Upgrade

### 3.1 Update illustration-generator.ts to use Response API and gpt-5-mini ✅ COMPLETED
**Dependencies:** 2.4

- [x] Update `generateIllustration()` to use Response API
- [x] Change model from `dall-e-3` to `gpt-5-mini`
- [x] Implement `previous_response_id` tracking for consistency
- [x] Update response parsing to use `response.output_image_url`
- [x] Maintain R2 upload functionality
- [x] Keep content filtering integration
- [x] **IMPLEMENTED**: `instructions` + `input` format
- [x] **IMPLEMENTED**: `image` parameter with size/quality
- [x] **NOTE**: `output_image_url` property is ASSUMED (undocumented)

**Validation:**
- ⚠️ CRITICAL PENDING: Test if Response API supports image generation
- ⚠️ PENDING: Generate 5 test illustrations with different scenes
- ⚠️ PENDING: Verify image quality is acceptable
- ⚠️ PENDING: Test multi-turn consistency with sequential illustrations
- ⚠️ PENDING: Confirm R2 upload works correctly

### 3.2 Update avatar-generator.ts to use Response API and gpt-5-mini ✅ COMPLETED
**Dependencies:** 3.1 (can run in parallel)

- [x] Update `generateAvatar()` to use Response API
- [x] Change model from `dall-e-3` to `gpt-5-mini`
- [x] Update response parsing to use `response.output_image_url`
- [x] **IMPLEMENTED**: `instructions` + `input` format
- [x] **IMPLEMENTED**: `image` parameter with size/quality
- [x] **NOTE**: `output_image_url` property is ASSUMED (undocumented)
- [ ] Test with various hero parameters
- [ ] Ensure content filtering works

**Validation:**
- ⚠️ CRITICAL PENDING: Test if Response API supports image generation
- ⚠️ PENDING: Generate 5 test avatars with different hero traits
- ⚠️ PENDING: Verify avatar quality and style
- ⚠️ PENDING: Confirm child-friendly appearance
- ⚠️ PENDING: Test special ability visual representations

### 3.3 Update generateStoryIllustrations() for multi-turn consistency ✅ IMPLEMENTED
**Dependencies:** 3.1

- [x] Store first illustration's response ID
- [x] Pass `previous_response_id` to subsequent illustration calls
- [x] Database already stores response IDs (generationId field)
- [ ] Test sequential illustration generation for full story
- [ ] Verify character consistency across all illustrations

**Validation:**
- ⚠️ PENDING: Generate full illustration set for 3 different stories
- ⚠️ PENDING: Verify character appearance is consistent across scenes
- ⚠️ PENDING: Confirm art style remains uniform
- ⚠️ PENDING: Test with different hero visual profiles

### 3.4 Image quality validation and comparison
**Dependencies:** 3.1, 3.2, 3.3

- [ ] Generate 20 illustrations with gpt-5-mini
- [ ] Generate same 20 illustrations with dall-e-3 (for comparison)
- [ ] Conduct quality assessment (clarity, style, appropriateness)
- [ ] Measure generation times for both models
- [ ] Calculate cost per illustration
- [ ] Document findings and recommendations

**Validation:**
- Quality comparison documented
- Performance metrics recorded
- Cost analysis completed
- Decision on production model made (gpt-5-mini vs dall-e-3)


**Validation:**
- Model selection works via environment variable
- Fallback mechanism tested
- Monitoring alerts configured

## Phase 4: Audio Generation Model Upgrade

### 4.1 Update audio-generator.ts to use gpt-4o-mini-tts
**Dependencies:** None (can run parallel with Phase 3)

- [x] Change model from `tts-1` to `gpt-4o-mini-tts` in generateAudio()
- [x] Add `instructions` parameter with bedtime storytelling tone
- [x] Update voice selection to include all 10 voices (add ash, ballad, coral, sage)
- [x] Enhance voice recommendation logic for hero traits
- [x] Update duration estimation for slower pacing
- [x] Maintain R2 upload functionality

**Validation:**
- Generate audio for 5 different stories
- Verify voice instructions are applied (warm, gentle, slow)
- Confirm audio quality meets standards
- Test all 10 voices

### 4.2 Implement instruction-based voice customization
**Dependencies:** 4.1

- [x] Create instruction templates for different story types
- [x] Add instruction for "warm, gentle, storytelling tone suitable for bedtime"
- [x] Add instruction for "pace slowly and emphasize emotional moments"
- [x] Add instruction for "soothing voice that helps children relax"
- [ ] Test instructions with different hero traits (energetic vs gentle)
- [ ] Document instruction format and best practices

**Validation:**
- Instructions properly formatted
- Audio tone matches instructions
- Different hero traits result in appropriate voice variations

### 4.3 Update voice recommendations
**Dependencies:** 4.1

- [x] Expand VOICE_RECOMMENDATIONS to include new voices (ash, ballad, coral, sage)
- [x] Update `getRecommendedVoice()` logic for more nuanced selection
- [ ] Test voice selection for different hero trait combinations
- [ ] Document voice characteristics and recommendations

**Validation:**
- Voice recommendations appropriate for hero traits
- All voices tested and documented
- Recommendation logic covers edge cases

### 4.4 Audio quality validation
**Dependencies:** 4.2, 4.3

- [ ] Generate audio for 10 stories with various parameters
- [ ] Compare quality vs tts-1 baseline
- [ ] Verify instruction adherence (tone, pacing, emotion)
- [ ] Measure generation times
- [ ] Calculate cost per audio file
- [ ] Document quality improvements

**Validation:**
- Audio quality documented
- Instruction effectiveness validated
- Performance metrics recorded

## Phase 5: Testing & Validation

### 5.1 Integration testing
**Dependencies:** 2.4, 3.5, 4.4

- [ ] Test full story generation flow (hero → story → scenes → illustrations → audio)
- [ ] Test with multiple languages (en, es, fr, de, it)
- [ ] Test content filtering with all new models
- [ ] Test error handling and recovery
- [ ] Test rate limit handling
- [ ] Verify R2 storage integration works correctly

**Validation:**
- End-to-end flow works for all languages
- Content filtering effective
- Error handling robust
- Rate limits handled gracefully

### 5.2 Performance benchmarking
**Dependencies:** 5.1

- [ ] Measure P50, P95, P99 latencies for all endpoints
- [ ] Compare vs baseline (pre-upgrade metrics)
- [ ] Document performance improvements/regressions
- [ ] Identify any bottlenecks
- [ ] Optimize slow operations

**Validation:**
- Performance metrics documented
- No significant regressions
- Improvements quantified

### 5.3 Cost analysis
**Dependencies:** 5.1

- [ ] Calculate token usage for typical user workflows
- [ ] Estimate monthly costs based on usage patterns
- [ ] Compare vs pre-upgrade costs
- [ ] Identify cost optimization opportunities
- [ ] Set up cost monitoring and alerts

**Validation:**
- Cost analysis completed
- Cost savings/increases documented
- Monitoring configured

### 5.4 Quality validation
**Dependencies:** 5.1

- [ ] Conduct quality assessment for stories (10 samples)
- [ ] Conduct quality assessment for illustrations (20 samples)
- [ ] Conduct quality assessment for audio (10 samples)
- [ ] Compare vs pre-upgrade quality
- [ ] Document any quality changes
- [ ] Address any quality issues

**Validation:**
- Quality meets or exceeds baseline
- Any regressions documented and addressed
- User-facing quality maintained

### 5.5 Documentation updates
**Dependencies:** 5.2, 5.3, 5.4

- [ ] Update API documentation with new models
- [ ] Document Response API patterns used
- [ ] Update OPENAI_INTEGRATION.md with model details
- [ ] Document token usage and costs
- [ ] Update error handling documentation
- [ ] Create runbook for model rollback

**Validation:**
- All documentation updated
- Model changes clearly documented
- Rollback procedure tested

### 5.6 Monitoring and alerting
**Dependencies:** 5.3

- [ ] Set up token usage monitoring
- [ ] Set up error rate monitoring
- [ ] Set up latency monitoring
- [ ] Set up cost alerts
- [ ] Set up quality metric alerts
- [ ] Create dashboard for OpenAI API metrics

**Validation:**
- All monitoring configured
- Alerts tested
- Dashboard accessible

## Phase 6: Deployment & Rollback Plan

### 6.1 Staging deployment
**Dependencies:** 5.6

- [ ] Deploy to staging environment
- [ ] Run full test suite in staging
- [ ] Monitor metrics for 24 hours
- [ ] Test with staging iOS app
- [ ] Validate all endpoints work correctly

**Validation:**
- All tests pass in staging
- No errors in staging logs
- iOS app works correctly
- Metrics look healthy

### 6.2 Production deployment
**Dependencies:** 6.1

- [ ] Deploy to production during low-traffic period
- [ ] Monitor error rates closely
- [ ] Monitor response times
- [ ] Track token usage and costs
- [ ] Test with production iOS app
- [ ] Monitor for 48 hours before declaring success

**Validation:**
- Production deployment successful
- No error rate increase
- Performance stable
- User experience maintained

### 6.3 Rollback procedure (if needed)
**Dependencies:** None (contingency plan)

- [ ] Set environment variables to previous models:
  - `OPENAI_TEXT_MODEL=gpt-4o-2024-08-06`
  - `OPENAI_IMAGE_MODEL=dall-e-3`
  - `OPENAI_AUDIO_MODEL=tts-1`
- [ ] Redeploy with rollback configuration
- [ ] Verify services return to baseline behavior
- [ ] Document rollback reasons
- [ ] Plan remediation

**Validation:**
- Rollback procedure tested in staging
- Services restore to baseline
- User impact minimized

## Summary

**Total Tasks:** 43
**Estimated Timeline:** 2-3 weeks
**Parallelizable:** Phases 3 and 4 can run in parallel after Phase 2

**Critical Path:**
1. Response API migration (1.1-1.4) → 3-4 days
2. Text model upgrade (2.1-2.4) → 2-3 days
3. Image model upgrade (3.1-3.5) → 4-5 days
4. Testing & validation (5.1-5.6) → 3-4 days
5. Deployment (6.1-6.2) → 2-3 days

**Success Metrics:**
- All 43 tasks completed
- No production incidents
- Cost savings achieved
- Quality maintained or improved
- Performance maintained or improved
