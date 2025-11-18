# OpenAI API Integration Details

## API Endpoints and Models

### Story Generation (GPT-4o)
- **Temperature**: 0.8 for creative output
- **Max Tokens**: 2000 for stories
- **Features**: Scene extraction with timestamps for illustration sync
- **Use Cases**: Story generation, custom events, scene segmentation, visual characteristic extraction

### Audio Synthesis (gpt-4o-mini-tts)
- **Format**: MP3 exclusively
- **Voices**: 7 specialized children's storytelling voices
- **Features**: Voice-specific narration, multi-language support (5 languages)

### Avatar Generation (GPT-Image-1)
- **Resolution**: 1024x1024, 1024x1536, or 1536x1024 pixels
- **Quality**: Low, medium, or high
- **Response**: Base64 encoded
- **Storage**: Documents/Avatars directory
- **Features**: Comprehensive safety filtering, visual profile extraction

### Illustration Generation (GPT-Image-1 with Multi-Turn)
- **Multi-Scene Support**: Generate multiple illustrations per story
- **Audio Synchronization**: Timestamp-based display
- **Visual Consistency**: Character appearance maintained via generation ID chaining
- **Multi-Turn**: Each illustration references previous image
- **Sequential Processing**: One-by-one to maintain visual chain
- **Error Handling**: Retry mechanisms with graceful failure and chain recovery
- **Content Safety**: Child-safe filtering with multi-language support
- **Storage**: Documents/StoryIllustrations directory

## Multi-Turn Image Generation Implementation
- **Generation ID Chaining**: Each illustration references previous image's generation ID
- **Avatar Integration**: First illustration uses hero avatar's generation ID
- **Sequential Processing**: Illustrations generated one-by-one
- **Error Recovery**: Graceful fallback to previous generation IDs
- **Persistent Storage**: Generation IDs stored in Hero and StoryIllustration models

## Security and Best Practices
- API keys stored in iOS Keychain (never hardcoded)
- All communications over HTTPS
- Comprehensive error handling
- No silent failures - explicit error reporting
- Rate limit detection (HTTP 429)

## Cost Optimization
- **Average Monthly Cost**: ~$0.45-0.55 per user (10 stories)
- **Story Generation**: ~$0.02-0.03 per story
- **Audio Generation**: ~$0.01-0.02 per story
- **Avatar Generation**: $0.02-0.19 per image
- **Illustration Generation**: $0.02-0.19 per image

## Areas for Improvement
- Implement exponential backoff for rate limiting
- Add request queuing and batching
- Implement usage monitoring and cost tracking
- Develop content caching strategy
- Optimize illustration file size and compression
- Add illustration preloading
