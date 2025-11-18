# Development Guide

## Building and Testing

```bash
# Build
xcodebuild -project InfiniteStories.xcodeproj -scheme InfiniteStories build

# Run tests
xcodebuild -project InfiniteStories.xcodeproj -scheme InfiniteStories test

# Run on simulator (iPhone 17)
xcrun simctl boot "iPhone 17"
xcodebuild -project InfiniteStories.xcodeproj -scheme InfiniteStories \
  -destination 'platform=iOS Simulator,name=iPhone 17' run
```

## Configuration Options

### AppConfiguration.swift
- `useImprovedUI`: Toggle enhanced magical UI (default: true)
- `enableFloatingAnimations`: Control performance-heavy animations
- `maxRecentStories`: Stories on home screen (default: 6)
- `enableHapticFeedback`: Haptic feedback for interactions
- `showStatsDashboard`: Display statistics on home screen

### UserDefaults Settings
- `allowIllustrationFailures: true`: Graceful illustration failure handling
- `showIllustrationErrors: false`: Error visibility control
- `maxIllustrationRetries: 3`: Retry attempt limits
- `enableDetailedLogging: true`: Comprehensive logging

### Theme Preferences
- System: Follow device appearance
- Light/Dark: Force specific mode

### Language Support
- English, Spanish, French, German, Italian
- Localized AI prompts and voices

## Development Best Practices

### API-Only Architecture
- Hero/Story data NOT persisted locally - use repositories only
- SwiftData only for preferences (CustomStoryEvent, HeroVisualProfile, StoryIllustration)
- Always check `NetworkMonitor.shared.isConnected` before API calls
- Show ErrorView with retry for all API failures
- Use `@State` with loading/error/data states, not optimistic updates

### Security
- Store API keys in Keychain, never hardcode
- HTTPS for all API calls
- Encrypted storage at rest

### Performance
- Idle timer disabled during playback
- Background task registration
- Device-adaptive performance
- Lazy loading for story queues
- Conditional rendering for animations

### Accessibility
- Full VoiceOver support
- Dynamic Type scaling
- Motion preference respect
- WCAG AA compliance
- 44pt minimum touch targets

### Testing
- Unit tests for critical services
- UI tests for user flows
- Test offline scenarios

## Known Limitations
- **Internet connection required** - App does not function offline
- Hero/Story data not persisted locally - re-fetched on app launch
- URLCache media expires based on HTTP headers
- iOS background task scheduling limitations
- Rate limits on backend API may temporarily block operations

## Cost Guidelines
- Monitor API usage to control costs
- Implement caching where appropriate (especially illustrations)
- Track user usage patterns for optimization
- Plan for ~$0.65-0.85 per active user monthly
- Illustration generation adds ~$0.15-0.25 per story
