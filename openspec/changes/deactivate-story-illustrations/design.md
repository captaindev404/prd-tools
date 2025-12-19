# Design: Deactivate Story Illustrations

## Architecture Decision

### Feature Flag Approach
Use a compile-time static flag in `AppConfiguration.swift` for consistency with existing feature flags (e.g., `enablePullToRefresh`, `showStatsDashboard`).

```swift
// In AppConfiguration.swift
struct AppConfiguration {
    // MARK: - Feature Flags (V2 Features)

    /// Enable story illustration generation
    /// Set to false to defer illustration feature to V2
    /// Note: Avatar generation remains enabled
    static let enableStoryIllustrations = false
}
```

### Why Static Flag vs Runtime Toggle

| Approach | Pros | Cons |
|----------|------|------|
| Static Flag | Simple, no UI overhead, compile-time guarantee | Requires rebuild to change |
| Runtime Toggle | User can enable/disable | Unnecessary complexity for V2 deferral |
| Remote Config | Server-controlled | Overkill for internal feature deferral |

**Decision:** Static flag - matches existing pattern, simplest implementation.

## Implementation Strategy

### 1. Guard Illustration Generation
The `StoryViewModel` already has an `enableIllustrations` property. This will be initialized from the feature flag:

```swift
// StoryViewModel.swift
@Published var enableIllustrations: Bool = AppConfiguration.enableStoryIllustrations
```

This ensures:
- Generation is skipped at the source
- Existing conditional logic already handles `enableIllustrations == false`
- No changes needed to generation methods

### 2. Hide UI Elements
When flag is `false`:
- `StoryGenerationView`: Hide the "Generate Illustrations" toggle entirely
- `AudioPlayerView`: Hide illustration carousel section (show only audio controls)

### 3. Graceful Degradation
Stories without illustrations already work correctly:
- `hasIllustrations` returns `false` for empty illustration arrays
- UI conditionally shows "No illustrations available" state
- Audio playback unaffected

### 4. Avatar Generation Preserved
Avatar generation is separate from story illustrations:
- Uses different API endpoint (`/api/heroes/{id}/avatar`)
- Has separate UI in `AvatarGenerationView` and `HeroCreationView`
- Not affected by `enableStoryIllustrations` flag

## Code Flow with Flag Disabled

```
User taps "Generate Story"
    ↓
StoryGenerationView checks AppConfiguration.enableStoryIllustrations
    ↓ (false)
Hide illustration toggle → user cannot enable illustrations
    ↓
StoryViewModel.generateStory() called
    ↓
enableIllustrations = false (from flag)
    ↓
Step 1: Generate Story ✓
Step 2: Generate Audio ✓
Step 3: Skip Illustrations (enableIllustrations = false)
    ↓
Story ready for playback without illustrations
    ↓
AudioPlayerView checks hasIllustrations
    ↓ (false)
Show audio-only player (no carousel)
```

## Testing Considerations
- Verify story generation completes without illustrations
- Verify audio playback works without illustrations
- Verify no crash when accessing story.illustrations (empty array)
- Verify UI hides illustration-related elements
- Verify avatar generation still works
