# TASK-061: AI Features Testing Guide

## Quick Start

### 1. Configure Environment

Add to your `.env` file:

```bash
OPENAI_API_KEY="sk-..." # Get from https://platform.openai.com/api-keys
AI_ENABLED=true
AI_MODEL="gpt-4o-mini"
AI_CATEGORIZATION_ENABLED=true
AI_SENTIMENT_ENABLED=true
AI_DUPLICATE_DETECTION_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.6
```

### 2. Run Database Migration

```bash
npm run db:migrate -- --name add-ai-models
```

### 3. Start Development Server

```bash
npm run dev
```

## Testing Scenarios

### Scenario 1: Categorization Accuracy

Test the AI's ability to correctly categorize feedback into product areas.

#### Test Cases

**Reservations**
```bash
curl -X POST http://localhost:3000/api/ai/categorize \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Cannot modify booking dates online",
    "body": "I tried to change my reservation dates but the website keeps showing an error. Had to call support to fix it."
  }'
```
Expected: `productArea: "Reservations"`, confidence > 0.8

**CheckIn**
```bash
curl -X POST http://localhost:3000/api/ai/categorize \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Long queue at check-in desk",
    "body": "Waited 45 minutes to check in. There should be a mobile check-in option to speed things up."
  }'
```
Expected: `productArea: "CheckIn"`, confidence > 0.8

**Payments**
```bash
curl -X POST http://localhost:3000/api/ai/categorize \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Credit card payment failed",
    "body": "My payment was declined but money was deducted from my account. Need help resolving this billing issue."
  }'
```
Expected: `productArea: "Payments"`, confidence > 0.8

**Housekeeping**
```bash
curl -X POST http://localhost:3000/api/ai/categorize \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Room not cleaned properly",
    "body": "Arrived to find room not cleaned. Towels were not replaced and bed was not made."
  }'
```
Expected: `productArea: "Housekeeping"`, confidence > 0.8

**Backoffice**
```bash
curl -X POST http://localhost:3000/api/ai/categorize \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Dashboard loading very slow",
    "body": "The admin dashboard takes forever to load. Reports take 30+ seconds to generate. Database queries need optimization."
  }'
```
Expected: `productArea: "Backoffice"`, confidence > 0.8

### Scenario 2: Sentiment Analysis

Test sentiment detection across positive, neutral, and negative feedback.

**Positive Sentiment**
```bash
curl -X POST http://localhost:3000/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Great check-in experience!",
    "body": "Check-in was smooth and fast, staff was incredibly friendly and helpful. Love the new mobile app feature!"
  }'
```
Expected: `sentiment: "positive"`, score > 0.7

**Negative Sentiment**
```bash
curl -X POST http://localhost:3000/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Terrible experience, room was dirty",
    "body": "Room was not cleaned at all. Bathroom was disgusting. Very disappointed and frustrated. This is unacceptable."
  }'
```
Expected: `sentiment: "negative"`, score < 0.3, urgencyScore > 0.6

**Neutral Sentiment**
```bash
curl -X POST http://localhost:3000/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Add filter option to booking search",
    "body": "It would be helpful to have a filter for amenities when searching for rooms. Current search shows all rooms."
  }'
```
Expected: `sentiment: "neutral"`, score between 0.45-0.55

### Scenario 3: Duplicate Detection

Test semantic similarity detection.

**Step 1**: Submit original feedback via UI or API
**Step 2**: Test with similar feedback

```bash
curl -X POST http://localhost:3000/api/ai/duplicates \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Payment declined error",
    "body": "My credit card was rejected during checkout but I was still charged",
    "combineWithFuzzy": true
  }'
```

If there's existing feedback about payment failures, it should return duplicates with similarity > 0.85.

### Scenario 4: Admin Dashboard

1. Visit: `http://localhost:3000/admin/ai`
2. Verify:
   - Configuration shows correct AI model
   - Statistics display total operations
   - Success rate is calculated correctly
   - Recent activity shows your test requests
   - Operation breakdown charts are populated

### Scenario 5: Rate Limiting

Test that rate limits are enforced:

```bash
# Run this in a loop 101 times
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/ai/categorize \
    -H "Content-Type: application/json" \
    -H "Cookie: your-auth-cookie" \
    -d '{"title":"Test","body":"Testing rate limit"}' \
    -w "\n%{http_code}\n"
done
```

Expected: First 100 requests return 200, 101st returns 429 (Rate Limited)

### Scenario 6: Error Handling

Test graceful degradation when AI is unavailable:

**Invalid API Key**
1. Set `OPENAI_API_KEY="sk-invalid"`
2. Restart server
3. Try categorization
4. Expected: 500 error with clear message, logged to AIUsageLog with success=false

**AI Disabled**
1. Set `AI_ENABLED=false`
2. Restart server
3. Try categorization
4. Expected: 503 error "AI features are disabled"

### Scenario 7: Confidence Threshold

Test low-confidence handling:

```bash
curl -X POST http://localhost:3000/api/ai/categorize \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "title": "Need help",
    "body": "Something is wrong",
    "confidenceThreshold": 0.9
  }'
```

Expected: `success: false`, message about insufficient confidence (ambiguous feedback)

### Scenario 8: Batch Processing

Test batch categorization (via lib function, not API):

```typescript
import { batchCategorizeFeedback } from '@/lib/ai/categorization';

const results = await batchCategorizeFeedback([
  { id: 'fb_1', title: 'Booking issue', body: 'Cannot reserve room' },
  { id: 'fb_2', title: 'Checkout slow', body: 'Checkout took 30 minutes' },
  { id: 'fb_3', title: 'Payment error', body: 'Card declined' },
]);

console.log(results);
```

Expected: All 3 feedback items categorized with results

## Performance Benchmarks

### Latency Targets

- **Categorization**: < 2000ms
- **Sentiment Analysis**: < 2000ms
- **Duplicate Detection**: < 3000ms (includes embedding generation)

### Load Testing

```bash
# Install Apache Bench if needed
brew install ab

# Test 50 concurrent requests
ab -n 50 -c 10 -H "Content-Type: application/json" \
   -H "Cookie: your-auth-cookie" \
   -p test-payload.json \
   http://localhost:3000/api/ai/categorize
```

Verify:
- No failed requests
- 95th percentile < 3000ms
- Rate limiting works correctly

## Accuracy Testing

### Categorization Accuracy Matrix

Test with 20 diverse feedback examples across all categories:

| Expected Category | Test Count | Correct | Accuracy |
|------------------|------------|---------|----------|
| Reservations     | 4          | ?       | ?%       |
| CheckIn          | 4          | ?       | ?%       |
| Payments         | 4          | ?       | ?%       |
| Housekeeping     | 4          | ?       | ?%       |
| Backoffice       | 4          | ?       | ?%       |
| **Overall**      | **20**     | **?**   | **?%**   |

Target: >85% accuracy

### Sentiment Accuracy Matrix

Test with 15 examples:

| Expected Sentiment | Test Count | Correct | Accuracy |
|-------------------|------------|---------|----------|
| Positive          | 5          | ?       | ?%       |
| Neutral           | 5          | ?       | ?%       |
| Negative          | 5          | ?       | ?%       |
| **Overall**       | **15**     | **?**   | **?%**   |

Target: >80% accuracy

### Duplicate Detection

Test with 5 pairs of similar feedback:

| Pair | Expected Similarity | Actual | Threshold Pass |
|------|-------------------|--------|----------------|
| 1    | High (>0.9)       | ?      | ?              |
| 2    | High (>0.9)       | ?      | ?              |
| 3    | Medium (0.85-0.9) | ?      | ?              |
| 4    | Medium (0.85-0.9) | ?      | ?              |
| 5    | Low (<0.85)       | ?      | ?              |

Target: 100% correct threshold decisions

## Cost Monitoring

Track costs in admin dashboard:

1. Submit 100 test categorizations
2. Check `/admin/ai` for:
   - Total operations count
   - Token usage (if implemented)
   - Estimated cost
3. Verify costs align with OpenAI pricing

Expected cost: ~$0.03 for 100 categorizations

## Debugging Tips

### Check AI Usage Logs

```typescript
// Via Prisma Studio
npm run db:studio

// Navigate to AIUsageLog table
// Filter by: success=false
// Review errorMessage field
```

### Enable Verbose Logging

Add to AI functions:

```typescript
console.log('AI Request:', { title, body });
console.log('AI Response:', result);
```

### Test in Isolation

```typescript
// Test OpenAI client directly
import { callOpenAI } from '@/lib/ai/openai-client';

const response = await callOpenAI(
  'You are a helpful assistant',
  'Say hello',
  { responseFormat: 'text' }
);
console.log(response);
```

## Common Issues

### "AI features are disabled"
- Check `AI_ENABLED=true` in .env
- Restart dev server

### "OpenAI API key is missing"
- Check `OPENAI_API_KEY` in .env
- Verify key is valid (starts with "sk-")

### "Rate limit exceeded"
- Wait 1 minute for rate limit to reset
- Or increase limit in `openai-client.ts`

### "No response from OpenAI API"
- Check internet connection
- Verify OpenAI service status
- Check API key billing status

### Low categorization accuracy
- Review categorization examples in `categorization.ts`
- Adjust confidence threshold
- Consider switching to `gpt-4` for better accuracy

## Integration Testing

### With Feedback Creation

1. Go to `/feedback/new`
2. Fill in title and body
3. (Future) Click "Auto-categorize" button
4. Verify:
   - Category suggestion appears
   - Confidence score displayed
   - Can override suggestion

### With Admin Dashboard

1. Go to `/admin/ai`
2. Verify real-time stats update
3. Check recent activity feed
4. Review operation breakdown

## Production Readiness Checklist

- [ ] OpenAI API key configured
- [ ] AI features enabled
- [ ] Database migration applied
- [ ] Rate limits tested
- [ ] Error handling verified
- [ ] Categorization accuracy >85%
- [ ] Sentiment accuracy >80%
- [ ] Duplicate detection working
- [ ] Admin dashboard accessible
- [ ] Cost monitoring in place
- [ ] Logs being written correctly
- [ ] Performance meets targets (<2s latency)

## Next Steps After Testing

1. **Collect Accuracy Data**
   - Track manual overrides
   - Build training dataset for fine-tuning

2. **Optimize Performance**
   - Cache common categorizations
   - Store embeddings in database
   - Implement vector search

3. **Enhance Features**
   - Add multi-language support
   - Implement trend analysis
   - Create category migration tools

4. **Scale Infrastructure**
   - Move to Redis for rate limiting
   - Set up OpenAI fallback (Anthropic Claude)
   - Implement request queuing

---

For questions or issues during testing, refer to the completion report (TASK-061-COMPLETION.md) or contact the development team.
