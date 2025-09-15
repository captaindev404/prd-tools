# OpenAI API Integration Documentation
## InfiniteStories App

### Table of Contents
- [Overview](#overview)
- [API Endpoints Used](#api-endpoints-used)
- [Implementation Details](#implementation-details)
- [Audio Generation](#audio-generation)
- [Story Generation](#story-generation)
- [Avatar Generation](#avatar-generation)
- [Custom Event AI Assistant](#custom-event-ai-assistant)
- [Security & Configuration](#security--configuration)
- [Best Practices](#best-practices)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Multi-Language Support](#multi-language-support)
- [Cost Optimization](#cost-optimization)
- [Testing & Debugging](#testing--debugging)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

---

## Overview

InfiniteStories exclusively uses OpenAI's API for all AI-powered features. The app integrates with multiple OpenAI models for story generation, text-to-speech, image generation, and content enhancement. There are **no mock services or fallback mechanisms** - all AI features require a valid OpenAI API key.

### Key Integration Points
- **Story Generation**: GPT-4o model for creating personalized bedtime stories
- **Audio Synthesis**: gpt-4o-mini-tts model for high-quality voice generation
- **Avatar Creation**: DALL-E 3 for generating hero illustrations
- **Content Enhancement**: GPT-4o for custom event optimization

---

## API Endpoints Used

### 1. Chat Completions Endpoint
```
URL: https://api.openai.com/v1/chat/completions
Method: POST
Models: gpt-4o
```
Used for:
- Story generation (main and custom events)
- Custom event title generation
- Prompt enhancement
- Keyword generation

### 2. Text-to-Speech Endpoint
```
URL: https://api.openai.com/v1/audio/speech
Method: POST
Model: gpt-4o-mini-tts
```
Used for:
- Converting story text to MP3 audio files
- Multi-language voice synthesis
- Voice-specific storytelling instructions

### 3. Image Generation Endpoint
```
URL: https://api.openai.com/v1/images/generations
Method: POST
Model: dall-e-3
```
Used for:
- Generating hero avatar illustrations
- Creating story-related artwork

---

## Implementation Details

### Core Service Architecture

#### AIService.swift
Primary service handling all OpenAI interactions:

```swift
class OpenAIService: AIServiceProtocol {
    private let apiKey: String
    private let chatURL = "https://api.openai.com/v1/chat/completions"
    private let ttsURL = "https://api.openai.com/v1/audio/speech"
    private let imageURL = "https://api.openai.com/v1/images/generations"

    // Story generation with GPT-4o
    func generateStory(request: StoryGenerationRequest) async throws -> StoryGenerationResponse

    // Custom event story generation
    func generateStoryWithCustomEvent(request: CustomStoryGenerationRequest) async throws -> StoryGenerationResponse

    // Audio generation with gpt-4o-mini-tts
    func generateSpeech(text: String, voice: String, language: String) async throws -> Data

    // Avatar generation with DALL-E 3
    func generateAvatar(request: AvatarGenerationRequest) async throws -> AvatarGenerationResponse
}
```

### API Key Management

#### Secure Storage with Keychain
```swift
class KeychainHelper {
    // API keys stored in iOS Keychain for security
    func saveString(_ string: String, for key: String) -> Bool
    func loadString(key: String) -> String?
    func delete(key: String) -> Bool
}

// Key identifier
private let apiKeyIdentifier = "com.infinitestories.openai.apikey"
```

**Security Features:**
- API keys never hardcoded
- Stored securely in iOS Keychain
- Encrypted at rest
- Access controlled by iOS biometric/passcode

### Request/Response Handling

#### Request Structure
```swift
// Story Generation Request
let requestBody = [
    "model": "gpt-4o",
    "messages": [
        ["role": "system", "content": systemMessage],
        ["role": "user", "content": prompt]
    ],
    "max_tokens": 2000,
    "temperature": 0.8
]

// Headers
urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
```

#### Response Parsing
```swift
guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
      let choices = json["choices"] as? [[String: Any]],
      let firstChoice = choices.first,
      let message = firstChoice["message"] as? [String: Any],
      let content = message["content"] as? String else {
    throw AIServiceError.invalidResponse
}
```

### Error Handling

#### Error Types
```swift
enum AIServiceError: Error {
    case invalidAPIKey
    case networkError(Error)
    case invalidResponse
    case apiError(String)
    case rateLimitExceeded
    case imageGenerationFailed
    case fileSystemError
}
```

#### Error Recovery
```swift
// HTTP status code handling
guard httpResponse.statusCode == 200 else {
    if httpResponse.statusCode == 429 {
        throw AIServiceError.rateLimitExceeded
    }
    throw AIServiceError.apiError("HTTP \(httpResponse.statusCode)")
}
```

### Rate Limiting Considerations

**Current Implementation:**
- No built-in retry logic (immediate failure on 429)
- No request queuing
- No exponential backoff

**Recommended Improvements:**
```swift
// Example retry logic with exponential backoff
func retryWithBackoff<T>(
    maxAttempts: Int = 3,
    initialDelay: TimeInterval = 1.0,
    operation: @escaping () async throws -> T
) async throws -> T {
    var lastError: Error?

    for attempt in 0..<maxAttempts {
        do {
            return try await operation()
        } catch AIServiceError.rateLimitExceeded {
            lastError = error
            let delay = initialDelay * pow(2.0, Double(attempt))
            try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        } catch {
            throw error
        }
    }

    throw lastError ?? AIServiceError.rateLimitExceeded
}
```

---

## Audio Generation

### TTS Model Configuration

#### Model Selection
```swift
// Using gpt-4o-mini-tts with voice-specific instructions
let requestBody = [
    "model": "gpt-4o-mini-tts",
    "input": text,
    "voice": voice,  // coral, nova, fable, alloy, echo, onyx, shimmer
    "instructions": getStorytellingInstructions(for: voice, language: language),
    "response_format": "mp3"
]
```

### Voice Selection & Parameters

#### Available Voices
```swift
static let availableVoices = [
    ("coral", "Coral", "Warm and nurturing - ideal for bedtime"),
    ("nova", "Nova", "Friendly and cheerful - captivating for young listeners"),
    ("fable", "Fable", "Wise and comforting - like a loving grandparent"),
    ("alloy", "Alloy", "Clear and pleasant - perfect for educational stories"),
    ("echo", "Echo", "Soft and dreamy - creates magical atmosphere"),
    ("onyx", "Onyx", "Deep and reassuring - protective parent voice"),
    ("shimmer", "Shimmer", "Bright and melodic - sparkles with imagination")
]
```

#### Voice-Specific Instructions
```swift
private func getStorytellingInstructions(for voice: String, language: String) -> String {
    switch voice.lowercased() {
    case "coral":
        return "Speak with a warm, gentle, and nurturing tone perfect for bedtime stories. Use a calm and soothing pace with clear pronunciation. Add subtle emotional expressions to bring characters to life while maintaining a peaceful atmosphere that helps children relax and drift off to sleep."

    case "nova":
        return "Use a friendly, cheerful, and engaging storyteller voice that captivates young listeners. Speak clearly at a moderate pace with gentle enthusiasm. Create distinct character voices while keeping the overall tone calming and suitable for bedtime."
    // ... more voice-specific instructions
    }
}
```

### Multi-Language Support

#### Supported Languages
- English
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Italian (Italiano)

#### Language-Specific Instructions
```swift
static func getLanguageInstruction(for language: String) -> String {
    switch language {
    case "Spanish": return "Please respond entirely in Spanish."
    case "French": return "Please respond entirely in French."
    case "German": return "Please respond entirely in German."
    case "Italian": return "Please respond entirely in Italian."
    default: return "Please respond entirely in English."
    }
}
```

### Audio File Management

#### File Storage
```swift
// MP3 files stored in Documents directory
let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
let audioFileName = "\(fileName).mp3"  // Timestamp-based naming
let audioURL = documentsPath.appendingPathComponent(audioFileName)

// Save audio data
try audioData.write(to: audioURL)
```

#### File Format & Quality
- **Format**: MP3 (exclusively)
- **Bitrate**: Determined by OpenAI API
- **Storage**: Local Documents directory
- **Naming**: Timestamp-based for uniqueness

---

## Story Generation

### Prompt Engineering

#### System Message Template
```swift
static func getSystemMessage(for language: String) -> String {
    let baseMessage = """
    You are a skilled children's storyteller who creates engaging, age-appropriate stories for bedtime.
    Your stories should be calming, imaginative, and help children feel safe and ready for sleep.
    Avoid scary elements or intense conflict.
    Focus on gentle adventures, friendship, and positive messages.
    """
    return baseMessage + " " + getLanguageInstruction(for: language)
}
```

#### Prompt Template Structure
```swift
static func getPromptTemplate(for language: String, storyLength: Int, hero: String, traits: String, event: String) -> String {
    return """
    Create a \(storyLength)-minute bedtime story about \(hero).

    Character traits:
    \(traits)

    Story event: \(event)

    Requirements:
    - Should be calming and sleep-inducing
    - Include elements from the character traits
    - Centered around the mentioned event
    - Appropriate for children aged 4-10
    - Approximately \(storyLength * 150) words

    Format your response as:
    [Story Title]

    [Story content...]
    """
}
```

### Custom Event Enhancement

#### AI-Powered Enhancement
```swift
func enhancePromptSeed(
    title: String,
    description: String,
    category: EventCategory,
    ageRange: AgeRange,
    tone: StoryTone
) async -> String {
    let prompt = """
    Create an enhanced story prompt seed for children's bedtime stories.

    Event Title: \(title)
    Description: \(description)
    Category: \(category.rawValue)
    Age Range: \(ageRange.rawValue)
    Tone: \(tone.rawValue)

    Generate a one-sentence prompt seed that:
    1. Captures the essence of the event
    2. Is appropriate for \(ageRange.rawValue)
    3. Matches the \(tone.rawValue) tone
    4. Sparks imagination and wonder
    5. Is suitable for bedtime stories
    """
}
```

### Token Usage & Optimization

#### Current Settings
```swift
// Story generation
"max_tokens": 2000      // ~500-750 words
"temperature": 0.8      // Creative but coherent

// Title generation
"max_tokens": 20        // Short titles

// Keyword generation
"max_tokens": 50        // 5-8 keywords

// Enhancement
"max_tokens": 150       // One detailed sentence
```

#### Token Optimization Strategies
1. **Precise Prompts**: Clear, specific instructions reduce output tokens
2. **Response Formatting**: Structured output reduces unnecessary tokens
3. **Language Targeting**: Native language generation is more efficient
4. **Batch Processing**: Combine related requests when possible

---

## Avatar Generation

### DALL-E 3 Integration

#### Request Configuration
```swift
let requestBody = [
    "model": "dall-e-3",
    "prompt": avatarPrompt,
    "n": 1,                          // Single image
    "size": "1024x1024",            // Square format
    "quality": "standard",          // or "hd" for higher quality
    "response_format": "b64_json"   // Base64 encoded
]
```

#### Avatar Generation Parameters
```swift
struct AvatarGenerationRequest {
    let hero: Hero
    let prompt: String
    let size: String     // "1024x1024", "1792x1024", or "1024x1792"
    let quality: String  // "standard" or "hd"
}
```

### Image Processing
```swift
// Parse base64 response
guard let b64Json = firstImage["b64_json"] as? String,
      let imageData = Data(base64Encoded: b64Json) else {
    throw AIServiceError.invalidResponse
}

// Access revised prompt (DALL-E 3 feature)
let revisedPrompt = firstImage["revised_prompt"] as? String
```

---

## Custom Event AI Assistant

### Implementation
```swift
class CustomEventAIAssistant {
    // Title generation from description
    func generateTitle(from description: String) async -> String?

    // Enhance prompt with AI
    func enhancePromptSeed(...) async -> String

    // Generate relevant keywords
    func generateKeywords(for event: String, description: String) async -> [String]

    // Suggest similar events
    func suggestSimilarEvents(to description: String) async -> [String]
}
```

### Use Cases
1. **Title Generation**: Create catchy titles from descriptions
2. **Prompt Enhancement**: Optimize story generation prompts
3. **Keyword Extraction**: Generate searchable tags
4. **Content Suggestions**: Recommend related story events

---

## Security & Configuration

### API Key Security

#### Storage Best Practices
```swift
class AppSettings {
    private let keychainHelper = KeychainHelper.shared
    private let apiKeyIdentifier = "com.infinitestories.openai.apikey"

    @Published var openAIAPIKey: String {
        didSet {
            if openAIAPIKey.isEmpty {
                _ = keychainHelper.delete(key: apiKeyIdentifier)
            } else {
                _ = keychainHelper.saveString(openAIAPIKey, for: apiKeyIdentifier)
            }
        }
    }

    var hasValidAPIKey: Bool {
        return !openAIAPIKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}
```

#### Security Checklist
- ✅ API keys stored in iOS Keychain
- ✅ Never hardcoded in source
- ✅ Encrypted at rest
- ✅ Protected by device authentication
- ✅ Transmitted over HTTPS only
- ✅ Keys can be deleted securely

### Required Permissions

#### Info.plist Configuration
```xml
<!-- Background modes for long-running operations -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>processing</string>
    <string>fetch</string>
</array>

<!-- Network access -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>
```

---

## Best Practices

### 1. Request Optimization
```swift
// Batch related operations
async func generateStoryWithAudio(hero: Hero, event: StoryEvent) async throws -> (Story, URL) {
    // Generate story first
    let storyResponse = try await generateStory(...)

    // Then generate audio
    let audioURL = try await generateAudio(storyResponse.content)

    return (story, audioURL)
}
```

### 2. Error Handling Pattern
```swift
do {
    let response = try await aiService.generateStory(request: request)
    // Handle success
} catch AIServiceError.invalidAPIKey {
    // Prompt user to configure API key
} catch AIServiceError.rateLimitExceeded {
    // Show rate limit message, implement backoff
} catch AIServiceError.networkError(let error) {
    // Handle network issues
} catch {
    // Generic error handling
}
```

### 3. Background Task Management
```swift
// Use background tasks for long operations
backgroundTaskId = BackgroundTaskManager.shared.beginBackgroundTask(
    withName: "StoryGeneration",
    expirationHandler: { [weak self] in
        self?.handleBackgroundTaskExpiration()
    }
)

// Clean up when done
defer {
    BackgroundTaskManager.shared.endBackgroundTask(backgroundTaskId)
}
```

### 4. Memory Management
```swift
// Cancel ongoing tasks when needed
func cancelCurrentTask() {
    currentTask?.cancel()
    currentTask = nil
}

// Clean up audio files periodically
func cleanupOldAudioFiles(olderThan days: Int = 30) {
    // Remove audio files older than specified days
}
```

---

## Performance Optimization

### 1. Caching Strategies
```swift
// Cache generated content
class StoryCache {
    private var cache: [String: StoryGenerationResponse] = [:]

    func getCached(for key: String) -> StoryGenerationResponse? {
        return cache[key]
    }

    func cache(_ response: StoryGenerationResponse, for key: String) {
        cache[key] = response
    }
}
```

### 2. Concurrent Operations
```swift
// Generate multiple stories concurrently
func generateMultipleStories(heroes: [Hero], event: StoryEvent) async throws -> [Story] {
    try await withThrowingTaskGroup(of: Story.self) { group in
        for hero in heroes {
            group.addTask {
                try await self.generateStory(for: hero, event: event)
            }
        }

        var stories: [Story] = []
        for try await story in group {
            stories.append(story)
        }
        return stories
    }
}
```

### 3. Request Debouncing
```swift
// Debounce rapid API calls
class DebouncedAPICall {
    private var task: Task<Void, Never>?

    func debounce(delay: TimeInterval, action: @escaping () async -> Void) {
        task?.cancel()
        task = Task {
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            if !Task.isCancelled {
                await action()
            }
        }
    }
}
```

---

## Error Handling

### Comprehensive Error Responses

#### User-Friendly Messages
```swift
func handleAIError(_ error: Error) -> String {
    switch error {
    case AIServiceError.invalidAPIKey:
        return "Please configure your OpenAI API key in Settings"

    case AIServiceError.rateLimitExceeded:
        return "API rate limit reached. Please try again in a few minutes"

    case AIServiceError.networkError:
        return "Network connection error. Please check your internet connection"

    case AIServiceError.invalidResponse:
        return "Received invalid response from AI service. Please try again"

    default:
        return "An unexpected error occurred: \(error.localizedDescription)"
    }
}
```

### Retry Logic Implementation
```swift
extension OpenAIService {
    func generateStoryWithRetry(
        request: StoryGenerationRequest,
        maxAttempts: Int = 3
    ) async throws -> StoryGenerationResponse {
        var lastError: Error?

        for attempt in 1...maxAttempts {
            do {
                return try await generateStory(request: request)
            } catch AIServiceError.rateLimitExceeded where attempt < maxAttempts {
                lastError = error
                // Exponential backoff: 2^attempt seconds
                let delay = pow(2.0, Double(attempt))
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            } catch {
                throw error
            }
        }

        throw lastError ?? AIServiceError.invalidResponse
    }
}
```

---

## Multi-Language Support

### Language Detection
```swift
// Detect system language and map to supported language
let systemLanguage = Locale.current.language.languageCode?.identifier ?? "en"
let defaultLanguage = AppSettings.languageCodeToSupported(systemLanguage)

static func languageCodeToSupported(_ code: String) -> String {
    switch code {
    case "es": return "Spanish"
    case "fr": return "French"
    case "de": return "German"
    case "it": return "Italian"
    default: return "English"
    }
}
```

### Localized Prompts
```swift
// Language-specific prompt templates
static func getPromptTemplate(for language: String, ...) -> String {
    switch language {
    case "Spanish":
        return "Crea un cuento para dormir de \(storyLength) minutos..."
    case "French":
        return "Créez une histoire pour dormir de \(storyLength) minutes..."
    // ... other languages
    }
}
```

---

## Cost Optimization

### Token Usage Optimization

#### Strategies
1. **Efficient Prompts**: Minimize instruction tokens
2. **Response Limits**: Set appropriate max_tokens
3. **Caching**: Reuse generated content when possible
4. **Batch Processing**: Combine related requests

#### Cost Tracking
```swift
struct APIUsageTracker {
    private var tokenCounts: [String: Int] = [:]

    func trackUsage(model: String, tokens: Int) {
        tokenCounts[model, default: 0] += tokens
    }

    func estimatedCost(model: String) -> Double {
        let tokens = tokenCounts[model] ?? 0
        switch model {
        case "gpt-4o":
            return Double(tokens) * 0.00003  // $0.03 per 1K tokens
        case "gpt-4o-mini-tts":
            return Double(tokens) * 0.000015 // $0.015 per 1K tokens
        default:
            return 0
        }
    }
}
```

### Model Selection Strategy
- **GPT-4o**: High-quality story generation (worth the cost)
- **gpt-4o-mini-tts**: Efficient audio generation
- **DALL-E 3**: Standard quality for avatars (HD only when needed)

---

## Testing & Debugging

### Debug Logging
```swift
// Comprehensive logging throughout the service
print("🤖 === OpenAI Story Generation Started ===")
print("🤖 Hero: \(request.hero.name)")
print("🤖 Event: \(request.event.rawValue)")
print("🤖 Target Duration: \(Int(request.targetDuration/60)) minutes")
print("🤖 📝 Generated Prompt:")
print("🤖 \(prompt)")
```

### Testing Strategies

#### Unit Tests
```swift
func testStoryGeneration() async throws {
    let service = OpenAIService(apiKey: testAPIKey)
    let request = StoryGenerationRequest(...)

    let response = try await service.generateStory(request: request)

    XCTAssertFalse(response.title.isEmpty)
    XCTAssertFalse(response.content.isEmpty)
    XCTAssertGreaterThan(response.estimatedDuration, 0)
}
```

#### Mock Service for Testing
```swift
class MockAIService: AIServiceProtocol {
    func generateStory(request: StoryGenerationRequest) async throws -> StoryGenerationResponse {
        // Return mock response for testing
        return StoryGenerationResponse(
            title: "Test Story",
            content: "Once upon a time...",
            estimatedDuration: 300
        )
    }
}
```

### Network Monitoring
```swift
// Monitor API calls
class APIMonitor {
    static func logRequest(endpoint: String, size: Int) {
        print("📤 API Request to \(endpoint): \(size) bytes")
    }

    static func logResponse(endpoint: String, statusCode: Int, size: Int) {
        print("📥 API Response from \(endpoint): \(statusCode), \(size) bytes")
    }
}
```

---

## Migration Guide

### Upgrading API Versions

#### From GPT-3.5 to GPT-4o
```swift
// Old implementation
"model": "gpt-3.5-turbo"

// New implementation
"model": "gpt-4o"  // Latest model with better quality
```

#### Handling Deprecations
```swift
// Check for model availability
func isModelAvailable(_ model: String) async -> Bool {
    // Query OpenAI models endpoint
    // Return availability status
}

// Fallback strategy
let preferredModel = "gpt-4o"
let fallbackModel = "gpt-4o-mini"
```

### API Response Changes
```swift
// Handle different response formats
if let content = message["content"] as? String {
    // Text response
} else if let contentArray = message["content"] as? [[String: Any]] {
    // Multi-modal response (future support)
}
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. API Key Issues
**Problem**: "Invalid API key" error
**Solution**:
```swift
// Verify API key format
func validateAPIKey(_ key: String) -> Bool {
    let pattern = "^sk-[a-zA-Z0-9]{48}$"
    return key.range(of: pattern, options: .regularExpression) != nil
}
```

#### 2. Rate Limiting
**Problem**: 429 Too Many Requests
**Solution**:
- Implement exponential backoff
- Track request counts
- Use request queuing
- Consider tier upgrade

#### 3. Network Timeouts
**Problem**: Request timeout errors
**Solution**:
```swift
// Configure timeout
var urlRequest = URLRequest(url: url)
urlRequest.timeoutInterval = 60.0  // 60 seconds
```

#### 4. Response Parsing Errors
**Problem**: Invalid JSON response
**Solution**:
```swift
// Safe parsing with detailed error info
do {
    let json = try JSONSerialization.jsonObject(with: data)
    // Process JSON
} catch {
    print("JSON Error: \(error)")
    if let responseString = String(data: data, encoding: .utf8) {
        print("Raw response: \(responseString)")
    }
}
```

#### 5. Audio Generation Failures
**Problem**: TTS fails to generate audio
**Solution**:
- Verify text length (max 4096 chars)
- Check voice availability
- Ensure language support
- Validate API response format

### Debug Checklist
- [ ] API key is valid and has correct permissions
- [ ] Network connectivity is available
- [ ] Request format matches API specifications
- [ ] Response parsing handles all cases
- [ ] Error messages are user-friendly
- [ ] Background tasks are properly managed
- [ ] Memory is properly released
- [ ] Files are cleaned up appropriately

---

## API Cost Monitoring

### Estimated Costs (as of 2025)

| Feature | Model | Input Cost | Output Cost | Avg Request |
|---------|-------|------------|-------------|-------------|
| Story Generation | GPT-4o | $0.0025/1K tokens | $0.01/1K tokens | ~$0.02-0.03 |
| Audio Generation | gpt-4o-mini-tts | $0.015/1M chars | - | ~$0.01-0.02 |
| Avatar Generation | DALL-E 3 | $0.04/image (standard) | - | $0.04 |
| Event Enhancement | GPT-4o | $0.0025/1K tokens | $0.01/1K tokens | ~$0.01 |

### Monthly Cost Estimation
For average usage (10 stories/month per user):
- Story Generation: $0.30
- Audio Generation: $0.20
- Avatar (one-time): $0.04
- Total: ~$0.50-0.60 per user/month

---

## Future Considerations

### Potential Enhancements

1. **Streaming Responses**
```swift
// Stream story generation for better UX
func streamStory() -> AsyncStream<String> {
    // Implement SSE streaming
}
```

2. **Function Calling**
```swift
// Use function calling for structured outputs
"functions": [{
    "name": "generate_story",
    "parameters": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "content": {"type": "string"},
            "moral": {"type": "string"}
        }
    }
}]
```

3. **Vision API Integration**
```swift
// Analyze uploaded images for story inspiration
func analyzeImage(_ imageData: Data) async throws -> String {
    // Use GPT-4o vision capabilities
}
```

4. **Embeddings for Similarity**
```swift
// Find similar stories using embeddings
func generateEmbedding(text: String) async throws -> [Float] {
    // Use text-embedding-3-small model
}
```

### API Version Tracking
- Current: OpenAI API v1
- GPT-4o: Latest as of 2025
- Monitor OpenAI announcements for updates
- Test new models in staging before production

---

## Contact & Support

For OpenAI API issues:
- Documentation: https://platform.openai.com/docs
- API Status: https://status.openai.com
- Support: https://help.openai.com

For InfiniteStories implementation:
- Review this documentation
- Check debug logs in Xcode console
- Verify API key configuration
- Test with minimal requests first

---

*Last Updated: January 2025*
*OpenAI API Version: v1*
*Models: GPT-4o, gpt-4o-mini-tts, DALL-E 3*