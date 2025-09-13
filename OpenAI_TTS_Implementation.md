# OpenAI Text-to-Speech Implementation Guide

## Implementation Summary

Your InfiniteStories app has been successfully updated to use **OpenAI's TTS API exclusively**, with all local TTS fallback logic removed. The app now requires a valid OpenAI API key for audio generation.

## Key Changes Implemented

### 1. AudioService.swift
- **Removed**: All AVSpeechSynthesizer and local TTS fallback logic
- **Updated**: `generateAudioFile()` now only uses OpenAI TTS API
- **Enhanced**: Error handling for API failures without fallback
- **Simplified**: Playback only supports MP3 files from OpenAI

### 2. AIService.swift
- **Updated**: Uses stable `tts-1-hd` model for high-quality audio
- **Added**: Comprehensive error handling with specific HTTP status codes
- **Implemented**: 60-second timeout for TTS requests
- **Optional**: `generateSpeechFast()` method using `tts-1` for faster generation

### 3. StoryViewModel.swift
- **Removed**: All TTS fallback logic
- **Enhanced**: Audio generation with proper API key validation
- **Improved**: Error messages guide users to configure API key
- **Updated**: Audio regeneration properly handles edited stories

### 4. Story.swift Model
- **Implemented**: Automatic audio regeneration flagging on content changes
- **Added**: `audioNeedsRegeneration` tracking
- **Updated**: `lastModified` timestamp management

## OpenAI TTS API Details

### Endpoint
```
https://api.openai.com/v1/audio/speech
```

### Request Format
```json
{
  "model": "tts-1-hd",     // High-definition model
  "input": "Text to convert",
  "voice": "nova",         // Voice selection
  "response_format": "mp3", // Audio format
  "speed": 1.0            // Playback speed (0.25-4.0)
}
```

### Available Voices (Child-Friendly)
1. **coral** - Warm and nurturing, ideal for bedtime
2. **nova** - Friendly and cheerful, captivating for young listeners
3. **fable** - Wise and comforting, like a loving grandparent
4. **alloy** - Clear and pleasant, perfect for educational stories
5. **echo** - Soft and dreamy, creates magical atmosphere
6. **onyx** - Deep and reassuring, protective parent voice
7. **shimmer** - Bright and melodic, sparkles with imagination

## Error Handling Strategy

### API Errors
- **401 Unauthorized**: Direct user to settings to configure API key
- **429 Rate Limited**: Show message to try again later
- **400 Bad Request**: Display specific error from API response
- **500-503 Server Errors**: Indicate OpenAI service issue

### Implementation
```swift
switch error {
case .noAIService:
    "Please configure OpenAI API key in settings"
case .audioGenerationFailed(let message):
    "Audio generation failed: \(message)"
case .invalidAudioData:
    "Invalid audio data received"
default:
    "Audio generation failed"
}
```

## Rate Limiting Considerations

### OpenAI TTS Limits
- **Tier 1**: 3 requests per minute
- **Tier 2**: 50 requests per minute
- **Tier 3**: 500 requests per minute
- **Character limit**: 4096 characters per request

### Best Practices
1. Cache generated audio files locally
2. Show progress indicators during generation
3. Implement request queuing for multiple stories
4. Consider batch processing for multiple generations

## Audio Format Selection

### MP3 (Recommended)
- **Pros**: Universal compatibility, good compression, native iOS support
- **File size**: ~1 MB per minute at 128 kbps
- **Use case**: Default choice for all stories

### Alternative Formats
- **Opus**: Better compression (50% smaller) but requires additional handling
- **AAC**: Native iOS but larger files
- **FLAC**: Lossless but unnecessary for speech

## Swift Implementation Details

### URLSession Configuration
```swift
var urlRequest = URLRequest(url: URL(string: ttsURL)!)
urlRequest.httpMethod = "POST"
urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
urlRequest.timeoutInterval = 60.0  // 60 second timeout
```

### Audio Playback
```swift
// Only MP3 files from OpenAI are supported
guard url.pathExtension == "mp3" else {
    throw AudioServiceError.playbackFailed
}

audioPlayer = try AVAudioPlayer(contentsOf: url)
audioPlayer?.enableRate = true  // For speed control
audioPlayer?.rate = playbackSpeed
```

## Audio Regeneration Flow

### When Stories Are Edited
1. User edits story content in StoryEditView
2. Story model automatically sets `audioNeedsRegeneration = true`
3. On next playback attempt, app detects regeneration flag
4. New audio is generated with OpenAI TTS
5. Old audio file is deleted, new one is saved

### Manual Regeneration
```swift
func regenerateAudioForStory(_ story: Story) async {
    // Delete old audio
    if let oldFile = story.audioFileName {
        deleteAudioFile(fileName: oldFile)
    }
    
    // Generate new audio
    story.audioNeedsRegeneration = false
    await generateAudioForStory(story)
}
```

## Testing Recommendations

### Unit Tests
1. Test API key validation
2. Test error handling for various HTTP status codes
3. Test audio file saving and retrieval
4. Test regeneration flag behavior

### Integration Tests
1. Test full story generation → audio generation flow
2. Test story editing → audio regeneration flow
3. Test playback with various file states
4. Test network failure scenarios

### Manual Testing
1. Test with invalid API key
2. Test with rate limiting (rapid requests)
3. Test with large text content (near 4096 char limit)
4. Test audio playback interruptions

## Performance Optimization

### Caching Strategy
- Store generated MP3 files in Documents directory
- Use UUID-based filenames to avoid conflicts
- Clean up orphaned audio files periodically

### Memory Management
- Stream large audio responses
- Release audio players when not in use
- Monitor memory usage during playback

### Network Optimization
- Use background URLSession for large files
- Implement retry logic with exponential backoff
- Show progress indicators for long operations

## Security Considerations

1. **API Key Storage**: Use Keychain for secure storage
2. **Network Security**: All requests use HTTPS
3. **File Security**: Audio files stored in app sandbox
4. **Content Validation**: Sanitize text before sending to API

## Troubleshooting Guide

### Common Issues

1. **"No AI service configured"**
   - Solution: Ensure API key is set in AppSettings
   - Check: KeychainHelper is working properly

2. **"Audio generation failed: 401"**
   - Solution: Verify API key is valid
   - Check: OpenAI dashboard for key status

3. **"Audio playback failed"**
   - Solution: Ensure MP3 file exists and is valid
   - Check: File permissions and storage space

4. **"Rate limit exceeded"**
   - Solution: Wait before retrying
   - Consider: Upgrading OpenAI tier for higher limits

## Future Enhancements

1. **Streaming Audio**: Implement streaming for faster playback start
2. **Voice Cloning**: Use OpenAI's voice cloning (when available)
3. **Multi-language**: Support for international stories
4. **Batch Processing**: Queue multiple story audio generations
5. **Offline Mode**: Cache multiple stories for offline playback

## Migration Notes

For existing users with locally generated TTS files:
- Old `.txt` TTS files will no longer play
- Users must regenerate audio using OpenAI API
- Provide clear messaging about API key requirement
- Consider one-time migration to generate all audio

## Support Resources

- [OpenAI TTS Documentation](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/audio/createSpeech)
- [OpenAI Pricing](https://openai.com/pricing)
- [iOS AVAudioPlayer Documentation](https://developer.apple.com/documentation/avfaudio/avaudioplayer)