# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InfiniteStories** is a SwiftUI iOS/macOS app that generates personalized audio bedtime stories for children. Parents create hero characters with customizable traits, then generate AI-powered stories for different daily events or custom scenarios. Each story is converted to high-quality audio for playback during bedtime, with support for multiple languages and themes.

## Architecture

### Core Data Models (SwiftData)
- **Hero**: Character with name, personality traits, appearance, and special abilities
- **Story**: Generated story content linked to a hero with audio file reference
  - Auto-regenerates audio when content changes
  - Supports custom events and multi-language generation
- **CustomStoryEvent**: User-defined story scenarios with AI enhancement
  - Categories, age ranges, and tone settings
  - AI-powered prompt enhancement and keyword generation
- **CharacterTrait**: Enum defining personality options (brave, kind, curious, etc.)
- **StoryEvent**: Enum for story contexts (bedtime, school day, birthday, etc.)

### Services Layer
- **AIService**: Handles story generation via OpenAI GPT-4o and audio via gpt-4o-mini-tts model
  - Multi-language support (English, Spanish, French, German, Italian)
  - Custom prompt localization and optimization
- **AudioService**: OpenAI-exclusive audio generation and playback with advanced media controls
  - Lock screen integration via MPNowPlayingInfoCenter and MPRemoteCommandCenter
  - Background audio session management with interruption handling
  - Automatic idle timer management during playback
  - MP3 file management with timestamp-based naming
  - Playback speed control and seeking capabilities
  - Audio route change detection (headphones disconnection)
  - Navigation delegate for story queue management
- **CustomEventAIAssistant**: AI-powered helper for creating and enhancing custom events
  - Title generation from descriptions
  - Prompt seed enhancement based on context
  - Keyword and similar event suggestions
- **IdleTimerManager**: Prevents screen sleep during audio playback with reference counting
- **BackgroundTaskManager**: Manages iOS background tasks for audio and story processing
- **NetworkService**: Monitors network connectivity and handles network-dependent operations
- **ThemeSettings**: Manages dark/light/system theme preferences
- **AppSettings**: User preferences and API configuration with secure keychain storage

### View Architecture (MVVM)
- **ContentView**: Main dashboard showing hero and story library
- **ImprovedContentView**: Enhanced magical UI with animations and improved layout
- **HeroCreationView**: Multi-step wizard for creating/editing heroes
- **HeroListView**: Complete hero management with edit/delete capabilities
- **StoryGenerationView**: Event selection and story generation interface
- **CustomEventCreationView**: Multi-step wizard for creating custom story events
  - AI-powered enhancement options
  - Category and tone customization
- **StoryEditView**: In-app story editor with auto-formatting
  - Character/word count tracking
  - Automatic audio regeneration on save
- **AudioPlayerView**: Advanced story playback with comprehensive controls
  - Lock screen integration with MPNowPlayingInfoCenter
  - Previous/Next story navigation with queue management
  - Dynamic UI updates when switching stories
  - Enhanced audio export with metadata
  - Playback speed control (0.5x to 2.0x)
  - Skip forward/backward 15 seconds
- **ImprovedStoryLibraryView**: Enhanced story list with filtering and sorting
- **AdaptiveHeroGridView**: Responsive hero display grid
- **EnhancedEventPickerView**: Improved event selection with custom events
- **HeroSelectionForStoryView**: Hero picker for story generation
- **SettingsView**: API configuration, theme selection, and language preferences

### ViewModels
- **StoryViewModel**: Manages story generation, audio playback, and error handling
  - Integrates with custom events and AI enhancement
  - Story queue management for sequential playback
  - Lock screen Now Playing info updates
  - Audio navigation delegate implementation

### Utilities
- **KeychainHelper**: Secure storage for API keys and sensitive data
- **PromptLocalizer**: Multi-language prompt generation and localization
- **AccessibilityEnhancements**: WCAG AA compliance and VoiceOver optimizations
  - Dynamic type support
  - Motion-aware animations
  - High contrast mode detection
- **DataMigrationHelper**: Database migration utilities for app updates
- **ColorExtensions**: Color utility functions for theme support

### Theme System
- **ColorTheme**: Centralized color definitions for light/dark modes
- **ThemeSettings**: User theme preference management (system/light/dark)
- Adaptive UI that responds to system appearance settings

## Key Features

1. **Hero Creation**: Step-by-step character building with trait selection
2. **Story Generation**: AI-powered stories using OpenAI GPT-4o based on hero traits and events
3. **Custom Events**: User-defined story scenarios with AI enhancement
   - Categorization by type, age range, and tone
   - AI-powered prompt optimization
   - Keyword tagging and search
4. **Multi-Language Support**: Stories and audio in 5 languages
   - English, Spanish, French, German, Italian
   - Localized prompts and voice synthesis
5. **Audio Generation**: High-quality voice synthesis using OpenAI's gpt-4o-mini-tts model
6. **Story Editing**: In-app content editing with automatic audio regeneration
7. **Story Library**: Persistent storage with favorites, play counts, and filtering
8. **Advanced Audio Playback**:
   - Full-featured MP3 player with speed control (0.5x-2.0x)
   - Lock screen controls with Now Playing info
   - Previous/Next story navigation in queue mode
   - Skip forward/backward 15 seconds
   - Audio export with metadata
   - Background playback with interruption handling
9. **Theme Support**: Light, dark, and system theme preferences
10. **Accessibility**: VoiceOver support, dynamic type, and motion preferences
11. **Hero Management**: Create, edit, and delete multiple heroes
12. **Background Processing**: Continued audio playback and generation in background

## Development Commands

### Building and Testing
```bash
# Build (requires Xcode installation)
xcodebuild -project InfiniteStories.xcodeproj -scheme InfiniteStories build

# Run tests
xcodebuild -project InfiniteStories.xcodeproj -scheme InfiniteStories test

# Run on simulator
xcrun simctl boot "iPhone 15 Pro"
xcodebuild -project InfiniteStories.xcodeproj -scheme InfiniteStories \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' run
```

### API Configuration
The app requires OpenAI API configuration:
1. Configure OpenAI API key in Settings view (stored securely in Keychain)
2. The app uses OpenAI exclusively - no mock services or fallbacks
3. Audio generation uses gpt-4o-mini-tts model with voice-specific instructions
4. Multi-language support handled through prompt localization

## Key Technologies

- **SwiftUI**: Declarative UI with navigation, sheets, and animations
- **SwiftData**: Model persistence with relationships and migrations
- **AVFoundation**: MP3 audio playback and management
- **BackgroundTasks**: iOS background processing for long operations
- **Combine**: Reactive programming for ViewModels and state management
- **URLSession**: HTTP requests for AI APIs
- **Network**: Network connectivity monitoring
- **Security**: Keychain Services for secure API key storage

## File Structure

```
InfiniteStories/
├── Models/
│   ├── Hero.swift                  # Character model with traits
│   ├── Story.swift                 # Story model with audio management
│   ├── CustomStoryEvent.swift      # Custom event model with AI fields
│   └── CharacterTraits.swift       # Enums for traits/events
├── Views/
│   ├── HeroCreation/
│   │   └── HeroCreationView.swift  # Hero creation wizard
│   ├── HeroManagement/
│   │   └── HeroListView.swift      # Hero CRUD operations
│   ├── StoryGeneration/
│   │   ├── StoryGenerationView.swift      # Story creation
│   │   ├── HeroSelectionForStoryView.swift # Hero picker
│   │   └── EnhancedEventPickerView.swift  # Event selection
│   ├── CustomEvents/
│   │   └── CustomEventCreationView.swift  # Custom event wizard
│   ├── StoryEdit/
│   │   └── StoryEditView.swift     # Story content editor
│   ├── StoryLibrary/
│   │   └── ImprovedStoryLibraryView.swift # Enhanced library
│   ├── AudioPlayer/
│   │   └── AudioPlayerView.swift   # Audio playback UI
│   ├── HeroDisplay/
│   │   └── AdaptiveHeroGridView.swift # Responsive hero grid
│   ├── Settings/
│   │   └── SettingsView.swift      # App configuration
│   ├── ContentView.swift           # Original dashboard
│   └── ImprovedContentView.swift   # Enhanced magical UI
├── Services/
│   ├── AIService.swift             # OpenAI integration
│   ├── AudioService.swift          # Audio generation/playback
│   ├── CustomEventAIAssistant.swift # AI event enhancement
│   ├── IdleTimerManager.swift      # Screen sleep prevention
│   ├── BackgroundTaskManager.swift # Background processing
│   ├── NetworkService.swift        # Network monitoring
│   └── ThemeSettings.swift         # Theme management
├── ViewModels/
│   └── StoryViewModel.swift        # Core business logic
├── Utilities/
│   ├── KeychainHelper.swift        # Secure storage
│   ├── PromptLocalizer.swift       # Multi-language support
│   ├── AccessibilityEnhancements.swift # A11y utilities
│   ├── DataMigrationHelper.swift   # DB migrations
│   └── ColorExtensions.swift       # Color utilities
├── Theme/
│   └── ColorTheme.swift            # Color definitions
├── AppConfiguration.swift          # App feature flags
└── InfiniteStoriesApp.swift        # App entry point
```

## Configuration Options

### AppConfiguration.swift
- `useImprovedUI`: Toggle between original and enhanced magical UI
- `enableFloatingAnimations`: Control performance-heavy animations
- `maxRecentStories`: Number of stories shown on home screen
- `enableHapticFeedback`: Haptic feedback for interactions
- `showStatsDashboard`: Display statistics on home screen

### Theme Preferences
- System: Follow device appearance
- Light: Force light mode
- Dark: Force dark mode

### Language Support
- Story generation in 5 languages
- Localized AI prompts
- Language-specific voice synthesis

## Development Notes

### Model Management
- Models use SwiftData `@Model` and `@Relationship` for persistence
- Story model includes automatic audio regeneration triggers on content changes
- CustomStoryEvent supports AI enhancement and usage tracking
- Hero deletion preserves associated stories (nullify relationship)

### View Architecture
- Views follow SwiftUI patterns with `@State`, `@Query`, and `@Environment`
- Enhanced views (ImprovedContentView, ImprovedStoryLibraryView) offer magical UI
- Multi-step wizards for complex workflows (hero/event creation)
- Adaptive layouts for different screen sizes
- AudioPlayerView uses computed properties for reactive UI updates during navigation

### Service Layer
- Services implement protocols for clean architecture
- OpenAI integration centralized in AIService and CustomEventAIAssistant
- MP3 audio files stored in Documents directory with timestamp-based names
- Background processing enabled for audio playback and story generation
- AudioService implements MPNowPlayingInfoCenter and MPRemoteCommandCenter for media controls
- Navigation delegate pattern for story queue management

### Error Handling
- User-friendly error messages for API failures
- No silent fallbacks - explicit error reporting
- Network connectivity monitoring for optimal UX
- Graceful degradation for missing features
- Enhanced audio export error handling with typed errors

### Security
- API keys stored securely in iOS Keychain
- No hardcoded credentials or sensitive data
- Secure HTTPS connections for all API calls

### Performance
- Idle timer automatically disabled during audio playback
- Reference counting for idle timer management
- Background task registration for long operations
- Adaptive performance based on device capabilities
- Efficient story queue management with lazy loading

### Accessibility
- Full VoiceOver support with semantic labels
- Dynamic Type support for text scaling
- Motion preferences respected for animations
- WCAG AA color contrast compliance
- Minimum touch target sizes (44pt)

### Testing
- Unit tests for audio service and idle timer
- UI tests for core user flows
- Test coverage for critical paths

## Recent Updates

### Version Features
- **Custom Story Events**: Create personalized story scenarios with AI enhancement
- **Multi-Language Support**: Generate stories in 5 languages with localized audio
- **Story Editing**: Edit story content with automatic audio regeneration
- **Theme Support**: Light/dark mode with system preference following
- **Hero Management**: Complete CRUD operations for multiple heroes
- **Enhanced UI**: Optional magical interface with animations
- **Accessibility**: Comprehensive VoiceOver and Dynamic Type support
- **Background Processing**: Continued operation when app is in background
- **Advanced Audio Player**:
  - Lock screen controls with artwork and metadata
  - Story queue navigation (previous/next)
  - Dynamic UI updates when switching stories
  - Enhanced export with proper file handling
  - Media session management for interruptions

### App Info.plist Configuration
- Background modes: audio, processing, fetch
- Privacy descriptions for microphone (if needed)
- URL schemes for deep linking (if implemented)

### Known Limitations
- Audio generation requires OpenAI API - no local TTS fallback
- Network connection required for story and audio generation
- MP3 files stored locally may consume device storage
- Background tasks subject to iOS system scheduling

## Important Instructions for Development

- Models use SwiftData `@Model` and `@Relationship` for persistence
- Story model includes automatic audio regeneration triggers on content changes
- Views follow SwiftUI patterns with `@State`, `@Query`, and `@Environment`
- Services implement protocols for clean architecture
- MP3 audio files are stored in Documents directory with timestamp-based names
- Error handling includes user-friendly messages for API failures (no silent fallbacks)
- API keys are stored securely in iOS Keychain
- Audio playback requires OpenAI API - no local TTS fallback
- Background processing enabled for audio playback and story generation
- Idle timer automatically disabled during audio playback to prevent screen sleep
- Network connectivity monitored for optimal user experience
- App Info.plist configured with background modes (audio, processing, fetch)

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.