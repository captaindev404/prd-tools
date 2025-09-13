# InfiniteStories Implementation Guide

## Overview

InfiniteStories is a SwiftUI iOS app that generates personalized bedtime stories for children using OpenAI's APIs. The app creates custom stories based on hero characters with unique traits and converts them to high-quality audio using OpenAI's gpt-4o-mini-tts model.

## Core Technologies

- **SwiftUI**: Modern declarative UI framework
- **SwiftData**: Apple's persistence framework for model storage
- **OpenAI API**: GPT-4o for story generation, gpt-4o-mini-tts for audio
- **AVFoundation**: MP3 audio playback
- **Keychain**: Secure API key storage

## Architecture

### MVVM Pattern
```
Views (SwiftUI) → ViewModels (Business Logic) → Services (API/Audio) → Models (SwiftData)
```

## Key Components

### 1. AI Service (`AIService.swift`)

**Story Generation**
- Model: `gpt-4o`
- Temperature: 0.8 for creative variation
- Max tokens: 2000 (5-10 minute stories)
- System prompt for child-friendly content

**Audio Generation**
- Model: `gpt-4o-mini-tts`
- Format: MP3
- Voice options with tailored instructions:
  - **coral**: Warm, nurturing bedtime voice
  - **nova**: Friendly, engaging storyteller
  - **fable**: Wise, grandfather-like tone
  - **alloy**: Clear, educational voice
  - **echo**: Soft, dreamy atmosphere
  - **onyx**: Deep, reassuring parent voice
  - **shimmer**: Bright, melodic enchantment

### 2. Audio Service (`AudioService.swift`)

**Key Features**
- OpenAI-exclusive audio (no local TTS fallback)
- MP3 file management in Documents directory
- Playback speed control (0.5x - 2.0x)
- Background audio support
- Idle timer management during playback

**Audio Flow**
1. Generate MP3 via OpenAI API
2. Save to Documents directory
3. Play using AVAudioPlayer
4. No fallback - errors are reported to user

### 3. Story Model (`Story.swift`)

**Auto-Regeneration Logic**
```swift
var title: String {
    didSet {
        markAudioForRegeneration()
    }
}

var content: String {
    didSet {
        markAudioForRegeneration()
    }
}
```

When stories are edited:
1. Property observers detect changes
2. Audio is marked for regeneration
3. Old audio files are deleted
4. New audio generates on next playback

### 4. Story ViewModel (`StoryViewModel.swift`)

**Responsibilities**
- Coordinates story generation
- Manages audio playback state
- Handles error reporting
- Triggers audio regeneration
- Manages API service lifecycle

## API Configuration

### OpenAI Setup

1. **API Key Storage**
   - Stored in iOS Keychain (secure)
   - Accessed via `KeychainHelper`
   - Never stored in UserDefaults or files

2. **Required Endpoints**
   - Chat: `https://api.openai.com/v1/chat/completions`
   - TTS: `https://api.openai.com/v1/audio/speech`

3. **Error Handling**
   - Invalid API key detection
   - Rate limiting (429 status)
   - Network failures
   - Invalid responses

## Audio Implementation Details

### Generation Process

```swift
// 1. Text to Speech Request
let requestBody = [
    "model": "gpt-4o-mini-tts",
    "input": storyText,
    "voice": selectedVoice,
    "instructions": voiceInstructions,
    "response_format": "mp3"
]

// 2. Save MP3 Response
let audioData = try await aiService.generateSpeech(...)
try audioData.write(to: audioURL)

// 3. Play Audio
audioPlayer = try AVAudioPlayer(contentsOf: audioURL)
audioPlayer.play()
```

### File Management

- **Naming**: `story_[timestamp].mp3`
- **Location**: App's Documents directory
- **Cleanup**: Old files deleted on regeneration
- **Persistence**: File paths stored in SwiftData

## User Interface

### Main Views

1. **ContentView**: Dashboard with hero carousel and story library
2. **HeroCreationView**: Multi-step character builder
3. **StoryGenerationView**: Event selection and generation
4. **AudioPlayerView**: Playback controls and progress
5. **SettingsView**: API key and preferences

### Audio Player Features

- Play/Pause toggle
- 15-second skip forward/backward
- Playback speed adjustment
- Progress slider (interactive)
- Time display (current/total)
- Visual feedback for playback state

## Data Persistence

### SwiftData Models

**Hero**
- Name, age, appearance
- Personality traits
- Special abilities
- Relationship to stories

**Story**
- Title and content
- Associated hero
- Audio file reference
- Play count and favorites
- Regeneration flag

### Relationships
```swift
@Relationship(inverse: \Hero.stories) var hero: Hero?
```

## Security Considerations

1. **API Keys**: Stored in Keychain, never in code
2. **Network**: HTTPS-only communication
3. **File Access**: Sandboxed app directory
4. **No Permissions**: No user permissions required

## Performance Optimizations

1. **Audio Caching**: MP3 files stored locally
2. **Lazy Loading**: Stories loaded on demand
3. **Background Processing**: Audio generation async
4. **Memory Management**: Proper cleanup of audio players

## Testing Recommendations

### Unit Tests
- Story generation logic
- Audio file management
- Model persistence
- Error handling

### Integration Tests
- API communication
- Audio playback
- Data persistence
- UI state management

### Manual Testing
- Various story lengths
- All voice options
- Network failures
- API key validation
- Audio regeneration

## Deployment Checklist

- [ ] Valid OpenAI API key configured
- [ ] API rate limits understood
- [ ] Error messages user-friendly
- [ ] Audio files properly cleaned up
- [ ] Keychain access working
- [ ] Background audio configured
- [ ] App Transport Security settings

## Future Enhancements

### Potential Features
- Story sharing capabilities
- Multiple language support
- Custom voice training
- Offline story caching
- Parent dashboard
- Sleep timer
- Story templates
- Character voice acting

### Technical Improvements
- Streaming audio generation
- Progressive story loading
- Advanced caching strategies
- Analytics integration
- CloudKit sync
- Widget support

## Troubleshooting

### Common Issues

**No Audio Generation**
- Check API key validity
- Verify network connection
- Check API rate limits
- Review error logs

**Audio Won't Play**
- Verify MP3 file exists
- Check AVAudioSession category
- Ensure file permissions
- Check audio format

**Story Not Generating**
- Validate API key
- Check token limits
- Review prompt length
- Verify model availability

## API Cost Considerations

### Pricing (as of 2024)
- **GPT-4o**: ~$0.01 per story
- **gpt-4o-mini-tts**: ~$0.03 per 1000 characters
- **Average story**: ~$0.05-0.10 total

### Optimization Tips
- Cache generated audio
- Implement retry limits
- Monitor usage patterns
- Set user limits if needed

## Support and Maintenance

### Logging
- Comprehensive console logging with emojis
- Error tracking for API failures
- Performance metrics for audio generation

### Updates
- Monitor OpenAI API changes
- Update voice instructions as needed
- Maintain iOS compatibility
- Review SwiftData migrations

## Conclusion

InfiniteStories provides a robust, secure, and user-friendly platform for generating personalized bedtime stories. The exclusive use of OpenAI's APIs ensures consistent, high-quality content and audio generation without fallbacks or compromises.