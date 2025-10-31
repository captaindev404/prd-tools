# Backend Migration Guide

## Status: ALL AI Features Fully Migrated ✅ 🎉

### Quick Summary

- **Migration Progress**: 12/12 endpoints (100%)
- **iOS Files Modified**: 3 (AIService.swift, CustomEventAIAssistant.swift, AppConfiguration.swift)
- **Backend Routes Created**: 12 API endpoints
- **Security**: OpenAI API key now server-side only
- **Architecture**: iOS → Next.js Backend → OpenAI API

### Migrated Endpoints Quick Reference

| Category | Endpoint | iOS Method | Status |
|----------|----------|------------|--------|
| **Stories** | `/api/stories/generate` | `generateStory` | ✅ |
| | `/api/stories/generate-custom` | `generateStoryWithCustomEvent` | ✅ |
| | `/api/stories/extract-scenes` | `extractScenesFromStory` | ✅ |
| **Audio** | `/api/audio/generate` | `generateSpeech` | ✅ |
| **Images** | `/api/images/generate-avatar` | `generateAvatar` | ✅ |
| | `/api/images/generate-illustration` | `generateSceneIllustration` | ✅ |
| **AI Assist** | `/api/ai-assistant/generate-title` | `generateTitle` | ✅ |
| | `/api/ai-assistant/enhance-prompt` | `enhancePromptSeed` | ✅ |
| | `/api/ai-assistant/generate-keywords` | `generateKeywords` | ✅ |
| | `/api/ai-assistant/suggest-similar-events` | `suggestSimilarEvents` | ✅ |
| | `/api/ai-assistant/sanitize-prompt` | `sanitizePromptWithAI` | ✅ |
| **Other** | (via illustration) | EventPictogramGenerator | ✅ |

### What's Been Migrated

#### Story APIs (AIService.swift)

**Story Generation** (`generateStory`) - **COMPLETE** ✅
- iOS app now calls `/api/stories/generate` backend endpoint
- All OpenAI API calls for standard story generation are proxied through backend
- API key is now stored securely server-side only

**Custom Story Generation** (`generateStoryWithCustomEvent`) - **COMPLETE** ✅
- iOS app now calls `/api/stories/generate-custom` backend endpoint
- Supports custom events with keywords, tone, age range, and category
- All OpenAI calls proxied through backend

**Scene Extraction** (`extractScenesFromStory`) - **COMPLETE** ✅
- iOS app now calls `/api/stories/extract-scenes` backend endpoint
- AI-powered scene analysis for illustration timing
- Full support for scene metadata (emotion, importance, timestamps)

**Audio Generation** (`generateSpeech`) - **COMPLETE** ✅
- iOS app now calls `/api/audio/generate` backend endpoint
- Supports 7 specialized children's voices (coral, nova, fable, alloy, echo, onyx, shimmer)
- Multi-language support with voice-specific instructions
- Returns base64 encoded MP3 audio data

#### Image Generation APIs (AIService.swift)

**Avatar Generation** (`generateAvatar`) - **COMPLETE** ✅
- iOS app now calls `/api/images/generate-avatar` backend endpoint
- GPT-Image-1 with multi-turn consistency via generation ID chaining
- Built-in child-safe content filtering
- Supports custom sizes and quality levels

**Scene Illustration** (`generateSceneIllustration`) - **COMPLETE** ✅
- iOS app now calls `/api/images/generate-illustration` backend endpoint
- Character consistency maintained across scenes
- Automatic prompt enhancement with artistic style
- Child-safe content sanitization

**Pictogram Generation** (EventPictogramGenerator) - **COMPLETE** ✅
- Uses backend via `generateSceneIllustration` internally
- Icon-style illustrations for custom events
- 512x512 optimized format

**Prompt Sanitization** (`sanitizePromptWithAI`) - **COMPLETE** ✅
- iOS app now calls `/api/ai-assistant/sanitize-prompt` backend endpoint
- AI-powered content policy compliance checking
- Comprehensive safety transformations for child content

#### AI Assistant APIs (CustomEventAIAssistant.swift)

**Title Generation** (`generateTitle`) - **COMPLETE** ✅
- iOS app now calls `/api/ai-assistant/generate-title` backend endpoint
- Generates catchy 3-6 word titles for custom events

**Prompt Enhancement** (`enhancePromptSeed`) - **COMPLETE** ✅
- iOS app now calls `/api/ai-assistant/enhance-prompt` backend endpoint
- Enriches basic descriptions into detailed story prompts

**Keyword Generation** (`generateKeywords`) - **COMPLETE** ✅
- iOS app now calls `/api/ai-assistant/generate-keywords` backend endpoint
- Generates 5-8 relevant keywords for story events

**Similar Events Suggestion** (`suggestSimilarEvents`) - **COMPLETE** ✅
- iOS app now calls `/api/ai-assistant/suggest-similar-events` backend endpoint
- Suggests 3 related event ideas based on description

### How It Works

#### iOS App Changes

**File: `AppConfiguration.swift`**
- Added `backendBaseURL` configuration
- Debug: `http://localhost:3000`
- Production: Configure with your deployed backend URL

**File: `AIService.swift`**
- Updated `generateStory()` method to call backend API
- Request format matches backend expectations
- Response parsing updated for backend format
- All logging preserved for debugging

#### Backend Endpoints

**1. Standard Story Generation**
`POST /api/stories/generate`

**Request:**
```json
{
  "hero": {
    "name": "Hero Name",
    "primaryTrait": "Brave",
    "secondaryTrait": "Kind",
    "appearance": "Description",
    "specialAbility": "Special power"
  },
  "event": {
    "rawValue": "Bedtime",
    "promptSeed": "Story context"
  },
  "targetDuration": 300,
  "language": "en"
}
```

**Response:**
```json
{
  "title": "Story Title",
  "content": "Full story text...",
  "estimatedDuration": 300.5
}
```

---

**2. Custom Story Generation**
`POST /api/stories/generate-custom`

**Request:**
```json
{
  "hero": { /* same as above */ },
  "customEvent": {
    "title": "Custom Event Title",
    "promptSeed": "Enhanced prompt description",
    "keywords": ["keyword1", "keyword2"],
    "tone": "Peaceful",
    "ageRange": "4-7",
    "category": "Adventure"
  },
  "targetDuration": 300,
  "language": "en"
}
```

**Response:**
```json
{
  "title": "Custom Event Title",
  "content": "Full story text...",
  "estimatedDuration": 300.5
}
```

---

**3. Scene Extraction**
`POST /api/stories/extract-scenes`

**Request:**
```json
{
  "storyContent": "Full story text to analyze...",
  "storyDuration": 300,
  "hero": {
    "name": "Hero Name",
    "primaryTrait": "Brave",
    "secondaryTrait": "Kind",
    "appearance": "Description",
    "specialAbility": "Special power"
  },
  "eventContext": "Bedtime story about..."
}
```

**Response:**
```json
{
  "scenes": [
    {
      "sceneNumber": 1,
      "textSegment": "Story text for this scene...",
      "illustrationPrompt": "Detailed DALL-E prompt...",
      "timestamp": 0.0,
      "emotion": "joyful",
      "importance": "key"
    }
  ],
  "sceneCount": 5,
  "reasoning": "Scene selection explanation"
}
```

---

**4. Audio/TTS Generation**
`POST /api/audio/generate`

**Request:**
```json
{
  "text": "Full story text to convert to speech...",
  "voice": "coral",
  "language": "en"
}
```

**Response:**
```json
{
  "audioData": "base64_encoded_mp3_data...",
  "format": "mp3",
  "size": 245678
}
```

---

**5. AI Assistant - Title Generation**
`POST /api/ai-assistant/generate-title`

**Request:**
```json
{
  "description": "A day at the zoo with talking animals",
  "language": "en"
}
```

**Response:**
```json
{
  "title": "Zoo Adventure with Talking Friends"
}
```

---

**6. AI Assistant - Prompt Enhancement**
`POST /api/ai-assistant/enhance-prompt`

**Request:**
```json
{
  "title": "Zoo Adventure",
  "description": "Visit a zoo",
  "category": "Adventure",
  "ageRange": "4-7",
  "tone": "Exciting"
}
```

**Response:**
```json
{
  "enhancedPrompt": "A magical day at the zoo where friendly animals can talk, teaching valuable lessons about friendship..."
}
```

---

**7. AI Assistant - Keyword Generation**
`POST /api/ai-assistant/generate-keywords`

**Request:**
```json
{
  "event": "Zoo Day",
  "description": "A visit to a magical zoo"
}
```

**Response:**
```json
{
  "keywords": ["animals", "zoo", "adventure", "friendship", "magical", "learning"]
}
```

---

**8. AI Assistant - Similar Events**
`POST /api/ai-assistant/suggest-similar-events`

**Request:**
```json
{
  "description": "A day at the zoo"
}
```

**Response:**
```json
{
  "suggestions": [
    "Safari Park Adventure",
    "Farm Animal Friends",
    "Aquarium Discovery Day"
  ]
}
```

### Testing the Migration

1. **Start the backend:**
   ```bash
   cd infinite-story-backend
   npm run dev
   ```

2. **Configure OpenAI API Key:**
   ```bash
   # Create .env.local
   OPENAI_API_KEY=your_key_here
   ```

3. **Run the iOS app:**
   - The app will automatically use `http://localhost:3000` in debug mode

   **Test Story Features:**
   - ✅ Generate a standard story with any hero
   - ✅ Generate a custom story with a custom event
   - ✅ Verify scene extraction after story generation
   - ✅ Play the generated audio (uses backend TTS)

   **Test Image Features:**
   - ✅ Create a new hero and generate avatar
   - ✅ Generate story with illustrations (tests scene illustration)
   - ✅ Create custom event with pictogram

   **Test AI Assistants:**
   - ✅ Create a new custom event (tests title generation)
   - ✅ Use "Enhance with AI" option (tests prompt enhancement)
   - ✅ Observe keyword generation
   - ✅ Check similar event suggestions

4. **Check logs:**
   - iOS logs will show "(via backend)" for ALL operations:
     - "Story generation started (via backend)"
     - "Custom story generation started (via backend)"
     - "Scene extraction started (via backend)"
     - "TTS generation started (via backend)"
     - "Avatar generation started (via backend)"
     - "Scene Illustration Generation Started (via backend)"
     - "AI-based prompt sanitization started (via backend)"
   - Backend console will show all API requests to OpenAI
   - All response formats are properly parsed
   - Images and audio successfully decoded from base64
   - Generation IDs properly tracked for visual consistency

### Migration Summary

**🎉 ALL 12 ENDPOINTS FULLY MIGRATED (100% complete)**

**Story Features:**
1. ✅ Story generation (standard)
2. ✅ Story generation (custom)
3. ✅ Scene extraction
4. ✅ Audio/TTS generation

**Image Generation:**
5. ✅ Avatar generation
6. ✅ Scene illustration generation
7. ✅ Pictogram generation (via illustration endpoint)
8. ✅ Prompt sanitization

**AI Assistants:**
9. ✅ AI title generation
10. ✅ AI prompt enhancement
11. ✅ AI keyword generation
12. ✅ AI similar events suggestion

### Security Benefits

✅ **Zero Client-Side API Keys**: OpenAI API key stored only on backend
✅ **Centralized Control**: All AI operations proxied through backend
✅ **Cost Monitoring**: Track all API usage server-side
✅ **Rate Limiting**: Server-side control over request rates
✅ **Content Safety**: Consistent sanitization across all image generation
✅ **Future-Proof**: Change AI models without iOS app updates

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        iOS App                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AIService.swift                                     │   │
│  │  CustomEventAIAssistant.swift                        │   │
│  │  EventPictogramGenerator.swift                       │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │ HTTP POST                              │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Backend (Port 3000)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes (/api/*)                                 │   │
│  │  - stories/generate                                  │   │
│  │  - stories/generate-custom                           │   │
│  │  - stories/extract-scenes                            │   │
│  │  - audio/generate                                    │   │
│  │  - images/generate-avatar                            │   │
│  │  - images/generate-illustration                      │   │
│  │  - ai-assistant/* (4 routes)                         │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │ HTTPS                                  │
│                     │ Authorization: Bearer $API_KEY         │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenAI API                                │
│  - gpt-4o (story & scene extraction)                        │
│  - gpt-4o-mini-tts (audio)                                  │
│  - gpt-image-1 (avatars & illustrations)                    │
└─────────────────────────────────────────────────────────────┘
```

### Rollback Instructions

To revert to direct OpenAI calls (if needed):

1. **Restore original service files from git:**
   ```bash
   git checkout HEAD~[n] InfiniteStories/Services/AIService.swift
   git checkout HEAD~[n] InfiniteStories/Services/CustomEventAIAssistant.swift
   git checkout HEAD~[n] InfiniteStories/AppConfiguration.swift
   ```
   Replace `[n]` with the appropriate number of commits back.

2. **Or manually update** `AppConfiguration.swift`:
   - Comment out or remove the `backendBaseURL` usage
   - The app will need to use API keys directly again

3. **Re-enable API key input** in iOS app settings

**Note:** Reverting is NOT recommended as it reduces security and increases client-side complexity.

### Production Deployment

Before deploying to production:

1. **Deploy the backend** to a hosting service (Vercel, Netlify, etc.)

2. **Update `AppConfiguration.swift`**:
   ```swift
   static let backendBaseURL = "https://your-backend.vercel.app"
   ```

3. **Configure backend environment**:
   - Set `OPENAI_API_KEY` in production environment
   - Add CORS headers if needed for web clients
   - Consider rate limiting and authentication

4. **Test thoroughly**:
   - Generate stories in production
   - Monitor backend logs
   - Check error handling

### Benefits of Backend Migration

✅ **Security**: API keys never exposed to client
✅ **Cost Control**: Centralized API usage monitoring
✅ **Rate Limiting**: Server-side control over API calls
✅ **Caching**: Future ability to cache responses
✅ **Analytics**: Track usage patterns server-side
✅ **Updates**: Change AI models without app updates

### Troubleshooting

**Backend not responding:**
- Check if backend is running: `npm run dev`
- Verify port 3000 is not in use
- Check backend logs for errors

**iOS can't connect:**
- Verify `backendBaseURL` is correct
- Check iOS simulator can reach localhost
- Review iOS console logs for connection errors

**Story generation fails:**
- Check backend has valid `OPENAI_API_KEY`
- Verify OpenAI API quota
- Review backend error logs

**Format mismatch errors:**
- Compare request format with API documentation
- Check response parsing in iOS code
- Verify JSON structure matches TypeScript types
