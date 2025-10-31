# Infinite Stories Backend API Documentation

This backend provides API routes for all OpenAI API calls used by the InfiniteStories iOS app.

## Environment Setup

Create a `.env.local` file with your OpenAI API key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## API Routes

### Story Generation

#### 1. Generate Story (Standard Events)
**POST** `/api/stories/generate`

Generate a bedtime story based on a predefined story event.

**Request Body:**
```typescript
{
  hero: {
    name: string;
    primaryTrait: string;
    secondaryTrait: string;
    appearance: string;
    specialAbility: string;
    avatarPrompt?: string;
    avatarGenerationId?: string;
  };
  event: {
    rawValue: string;
    promptSeed: string;
  };
  targetDuration: number; // in seconds (300-600 for 5-10 minutes)
  language: string; // "en", "es", "fr", "de", "it"
}
```

**Response:**
```typescript
{
  title: string;
  content: string;
  estimatedDuration: number;
  scenes?: StoryScene[];
}
```

---

#### 2. Generate Custom Story
**POST** `/api/stories/generate-custom`

Generate a bedtime story based on a custom event.

**Request Body:**
```typescript
{
  hero: Hero;
  customEvent: {
    title: string;
    promptSeed: string;
    keywords: string[];
    tone: string;
    ageRange: string;
    category: string;
  };
  targetDuration: number;
  language: string;
}
```

**Response:** Same as generate story

---

#### 3. Extract Scenes from Story
**POST** `/api/stories/extract-scenes`

Analyze a story and extract key visual scenes for illustration.

**Request Body:**
```typescript
{
  storyContent: string;
  storyDuration: number;
  hero: Hero;
  eventContext: string;
}
```

**Response:**
```typescript
{
  scenes: [{
    sceneNumber: number;
    textSegment: string;
    illustrationPrompt: string;
    timestamp: number;
    emotion: 'joyful' | 'peaceful' | 'exciting' | 'mysterious' | 'heartwarming' | 'adventurous' | 'contemplative';
    importance: 'key' | 'major' | 'minor';
  }];
  sceneCount: number;
  reasoning: string;
}
```

---

### Audio Generation

#### 4. Generate Audio/Speech
**POST** `/api/audio/generate`

Convert text to speech using OpenAI's TTS (gpt-4o-mini-tts).

**Request Body:**
```typescript
{
  text: string;
  voice: string; // "coral", "nova", "fable", "alloy", "echo", "onyx", "shimmer"
  language: string; // "en", "es", "fr", "de", "it"
}
```

**Response:**
```typescript
{
  audioData: string; // base64 encoded MP3
  format: "mp3";
  size: number; // bytes
}
```

---

### Image Generation

#### 5. Generate Avatar
**POST** `/api/images/generate-avatar`

Generate a hero avatar using GPT-Image-1.

**Request Body:**
```typescript
{
  prompt: string;
  hero: Hero;
  size?: string; // "1024x1024" (default), "1024x1536", or "1536x1024"
  quality?: string; // "low", "medium", "high" (default: "high")
  previousGenerationId?: string; // for multi-turn consistency
}
```

**Response:**
```typescript
{
  imageData: string; // base64 encoded PNG
  revisedPrompt?: string;
  generationId?: string;
  usage?: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
  };
}
```

---

#### 6. Generate Scene Illustration
**POST** `/api/images/generate-illustration`

Generate an illustration for a story scene.

**Request Body:**
```typescript
{
  prompt: string;
  hero: Hero;
  previousGenerationId?: string; // for multi-turn consistency
}
```

**Response:** Same as avatar generation

---

#### 7. Generate Event Pictogram
**POST** `/api/images/generate-pictogram`

Generate a pictogram icon for a custom event.

**Request Body:**
```typescript
{
  prompt: string;
}
```

**Response:**
```typescript
{
  imageData: string; // base64 encoded PNG (512x512)
  revisedPrompt?: string;
  generationId?: string;
  usage?: object;
}
```

---

### AI Assistant Helpers

#### 8. Generate Title
**POST** `/api/ai-assistant/generate-title`

Generate a catchy title for a custom event.

**Request Body:**
```typescript
{
  description: string;
  language?: string; // default: "en"
}
```

**Response:**
```typescript
{
  title: string;
}
```

---

#### 9. Enhance Prompt
**POST** `/api/ai-assistant/enhance-prompt`

Enhance a basic event description into a detailed story prompt.

**Request Body:**
```typescript
{
  title: string;
  description: string;
  category?: string;
  ageRange?: string;
  tone?: string;
}
```

**Response:**
```typescript
{
  enhancedPrompt: string;
}
```

---

#### 10. Generate Keywords
**POST** `/api/ai-assistant/generate-keywords`

Generate relevant keywords for a story event.

**Request Body:**
```typescript
{
  event: string;
  description: string;
}
```

**Response:**
```typescript
{
  keywords: string[]; // 5-8 keywords
}
```

---

#### 11. Suggest Similar Events
**POST** `/api/ai-assistant/suggest-similar-events`

Suggest similar event ideas based on a description.

**Request Body:**
```typescript
{
  description: string;
}
```

**Response:**
```typescript
{
  suggestions: string[]; // 3 suggestions
}
```

---

#### 12. Sanitize Prompt
**POST** `/api/ai-assistant/sanitize-prompt`

Sanitize an image generation prompt for GPT-Image-1 content policy compliance.

**Request Body:**
```typescript
{
  prompt: string;
}
```

**Response:**
```typescript
{
  sanitizedPrompt: string;
}
```

---

## Error Handling

All routes return standard HTTP status codes:

- **200**: Success
- **400**: Bad Request (missing or invalid parameters)
- **500**: Internal Server Error (API key not configured or OpenAI API error)

Error responses follow this format:
```typescript
{
  error: string; // error message
}
```

## OpenAI API Models Used

- **Story Generation**: `gpt-4o`
- **Scene Extraction**: `gpt-4o` with JSON mode
- **Audio/TTS**: `gpt-4o-mini-tts`
- **Images**: `gpt-image-1`
- **AI Assistants**: `gpt-4o`

## Multi-Turn Image Consistency

Avatar and illustration generation support multi-turn consistency via `previousGenerationId`. This ensures visual consistency across multiple generated images by referencing previous generations.

**Flow:**
1. Generate hero avatar → get `generationId`
2. Use that `generationId` as `previousGenerationId` for first scene illustration
3. Use each illustration's `generationId` for the next illustration in sequence

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The server will run on `http://localhost:3000` by default.

## Type Definitions

All TypeScript types are defined in `/types/openai.ts`.

## Security Notes

- API key is stored server-side in environment variables only
- No API keys are ever sent to or stored by the client
- All OpenAI API calls are proxied through this backend
- Implement rate limiting and authentication as needed for production use
