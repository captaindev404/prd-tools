# Design: OpenAI Model Upgrade & Response API Migration

## Architecture Overview

### Current Architecture
```
Service Layer (story-generator, illustration-generator, etc.)
    ↓
Chat Completions API / Images API / Audio API
    ↓
OpenAI SDK (openai.chat.completions.create, openai.images.generate, openai.audio.speech.create)
    ↓
HTTP → OpenAI API
```

### Target Architecture
```
Service Layer (story-generator, illustration-generator, etc.)
    ↓
Response API Abstraction Layer
    ↓
OpenAI SDK (openai.responses.create)
    ↓
HTTP → OpenAI Response API
```

## Key Design Decisions

### 1. Response API Migration Strategy

**Decision:** Migrate all text generation to Response API first, then images and audio.

**Rationale:**
- Response API provides unified interface for all model interactions
- Structured output format (`output` array with typed items)
- Better error handling with `status` field
- Built-in conversation chaining via `previous_response_id`
- Token usage tracking includes reasoning tokens

**Implementation:**
```typescript
// Before (Chat Completions API)
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-2024-08-06',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  response_format: { type: 'json_schema', json_schema: {...} }
});

// After (Response API)
const response = await openai.responses.create({
  model: 'gpt-5-mini',
  input: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  text: {
    format: { type: 'json_schema', json_schema: {...} }
  }
});

// Extract content from response
const content = response.output
  .find(item => item.type === 'message')
  ?.content?.find(c => c.type === 'output_text')
  ?.text;
```

### 2. Model Selection

#### Text Generation: gpt-5-mini
**Rationale:**
- Faster response times for story generation
- Lower cost per token vs gpt-4o
- Reasoning capabilities for complex story logic
- Verbosity control for appropriate story length
- Supports structured outputs (JSON schema)

**Configuration:**
```typescript
{
  model: 'gpt-5-mini',
  text: {
    verbosity: 'medium',  // Appropriate for 300-500 word stories
    reasoning: 'low'      // Minimal reasoning overhead for creative content
  }
}
```

#### Image Generation: gpt-5-mini
**Rationale:**
- Unified model for text and image generation
- Faster generation compared to dall-e-3
- Native support for multi-turn consistency
- Better integration with Response API
- Cost-effective for multiple illustrations per story

**Note:** If quality doesn't match dall-e-3, we can implement a hybrid approach or fallback mechanism.

#### Audio Generation: gpt-4o-mini-tts
**Rationale:**
- Supports `instructions` parameter for voice control
- Can specify accent, emotional range, intonation, speed, tone
- Better quality than tts-1
- Maintains compatibility with existing audio pipeline

**Enhanced Configuration:**
```typescript
{
  model: 'gpt-4o-mini-tts',
  voice: selectedVoice,
  input: text,
  instructions: 'Speak in a warm, gentle, storytelling tone suitable for bedtime. Pace slowly and emphasize emotional moments.'
}
```

### 3. Backward Compatibility

**Decision:** Maintain existing function signatures, change implementation only.

**Rationale:**
- No breaking changes to API routes
- Existing frontend/iOS app continues to work
- Database schemas remain unchanged
- Allows incremental migration and rollback

**Example:**
```typescript
// Public interface remains the same
export async function generateStory(params: StoryGenerationParams): Promise<GeneratedStory>

// Internal implementation changes to use Response API
```

### 4. Error Handling

**Decision:** Extend error handling to cover Response API formats.

**Response API Error Format:**
```typescript
{
  "id": "resp_...",
  "status": "failed",
  "error": {
    "type": "invalid_request_error",
    "message": "...",
    "code": "..."
  }
}
```

**Implementation:**
```typescript
// Check response status
if (response.status === 'failed') {
  throw new Error(`OpenAI API error: ${response.error?.message}`);
}

// Validate output structure
const messageItem = response.output.find(item => item.type === 'message');
if (!messageItem || messageItem.status !== 'completed') {
  throw new Error('Invalid response structure from OpenAI');
}
```

### 5. Token Usage Tracking

**Decision:** Leverage Response API's enhanced token usage reporting.

**Response API Usage Object:**
```typescript
{
  "usage": {
    "input_tokens": 150,
    "output_tokens": 450,
    "reasoning_tokens": 20,  // NEW: Track reasoning overhead
    "cached_tokens": 100,    // NEW: Track cache hits
    "total_tokens": 620
  }
}
```

**Implementation:**
```typescript
// Log detailed token usage for cost tracking
console.log('Token usage:', {
  input: response.usage.input_tokens,
  output: response.usage.output_tokens,
  reasoning: response.usage.reasoning_tokens,
  cached: response.usage.cached_tokens,
  total: response.usage.total_tokens
});
```

### 6. Content Filtering Integration

**Decision:** Content filtering remains unchanged, applied before API calls.

**Rationale:**
- Filter logic is model-agnostic
- Operates on prompt strings before API submission
- Same safety requirements apply regardless of model
- No changes needed to filter implementation

### 7. Testing Strategy

**Decision:** Comprehensive testing at multiple levels.

**Test Layers:**
1. **Unit Tests:** Test response parsing, error handling, token tracking
2. **Integration Tests:** Test actual API calls with new models
3. **Quality Tests:** Compare output quality (stories, images, audio) vs baseline
4. **Performance Tests:** Measure response times, token usage
5. **Cost Tests:** Track actual costs vs projections

**Quality Validation:**
```typescript
// Test scenarios
- Generate story with known parameters, validate structure and content
- Generate illustration, validate character consistency
- Generate audio, validate voice instructions applied
- Test multi-turn consistency for illustrations
- Test error scenarios and recovery
```

### 8. Rollback Strategy

**Decision:** Feature flags for model selection, easy rollback to previous models.

**Implementation:**
```typescript
// Environment variable controls model selection
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-5-mini';
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-5-mini';
const AUDIO_MODEL = process.env.OPENAI_AUDIO_MODEL || 'gpt-4o-mini-tts';

// Rollback by changing env vars:
// OPENAI_TEXT_MODEL=gpt-4o-2024-08-06
// OPENAI_IMAGE_MODEL=dall-e-3
// OPENAI_AUDIO_MODEL=tts-1
```

### 9. Performance Considerations

**Expected Improvements:**
- **Text Generation:** 20-40% faster response times with gpt-5-mini
- **Image Generation:** 10-30% faster with gpt-5-mini vs dall-e-3
- **Audio Generation:** Similar performance, enhanced quality

**Monitoring:**
- Track P50, P95, P99 latencies for each service
- Monitor error rates before/after migration
- Track token usage and costs
- Alert on quality degradation

### 10. Multi-Turn Consistency

**Decision:** Leverage Response API's `previous_response_id` for illustration consistency.

**Implementation:**
```typescript
// First illustration
const response1 = await openai.responses.create({
  model: 'gpt-5-mini',
  input: buildPrompt(scene1, heroProfile)
});

// Subsequent illustrations reference previous
const response2 = await openai.responses.create({
  model: 'gpt-5-mini',
  input: buildPrompt(scene2, heroProfile),
  previous_response_id: response1.id  // Maintains character consistency
});
```

## Trade-offs

### Pros
✅ Unified API pattern across all services
✅ Better performance and cost efficiency
✅ Enhanced audio control with instructions
✅ Built-in multi-turn consistency
✅ Future-proof with latest OpenAI APIs
✅ Better token usage visibility

### Cons
❌ API migration requires testing across all services
❌ gpt-5-mini image quality unknown (needs validation)
❌ Response API relatively new (less community knowledge)
❌ Requires OpenAI SDK update if not already compatible
❌ Documentation may be less mature than Chat Completions API

## Migration Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Image quality degradation | High | Medium | A/B testing, fallback to dall-e-3, quality metrics |
| API format breaking changes | High | Low | Comprehensive tests, backward compatibility layer |
| Performance regression | Medium | Low | Performance benchmarks, monitoring, rollback plan |
| Cost increase | Medium | Low | Token usage tracking, cost alerts, model selection tuning |
| Reasoning token overhead | Low | Medium | Configure low reasoning level, monitor usage |

## Validation Checklist

- [ ] Response API successfully parses all current scenarios
- [ ] gpt-5-mini text quality matches or exceeds gpt-4o
- [ ] gpt-5-mini image quality acceptable vs dall-e-3
- [ ] gpt-4o-mini-tts audio quality matches expectations
- [ ] Voice instructions properly applied in audio
- [ ] Multi-turn illustration consistency works
- [ ] Token usage properly tracked and logged
- [ ] Error handling covers all Response API error types
- [ ] Performance metrics meet targets
- [ ] Cost projections validated with real usage
- [ ] All existing tests pass
- [ ] No breaking changes to API contracts
