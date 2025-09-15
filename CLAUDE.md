# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InfiniteStories** is a SwiftUI iOS/macOS app that generates personalized audio bedtime stories for children. Parents create hero characters with customizable traits, then generate AI-powered stories for different daily events or custom scenarios. Each story is converted to high-quality audio for playback during bedtime, with support for multiple languages and themes.

## Architecture

### Core Data Models (SwiftData)
- **Hero**: Character with name, personality traits, appearance, special abilities, and AI-generated avatar
  - Avatar images stored in Documents directory with URL reference in model
  - Fallback to icon-based avatar when no image available
- **Story**: Generated story content linked to a hero with audio file reference
  - Auto-regenerates audio when content changes
  - Supports custom events and multi-language generation
  - Tracks play count, favorites, and listening time
- **CustomStoryEvent**: User-defined story scenarios with AI enhancement
  - Categories, age ranges, and tone settings
  - AI-powered prompt enhancement and keyword generation
- **CharacterTrait**: Enum defining personality options (brave, kind, curious, etc.)
- **StoryEvent**: Enum for story contexts (bedtime, school day, birthday, etc.)

### Services Layer

#### AI Integration (OpenAI Exclusive)
- **AIService**: Centralized OpenAI API integration
  - **Story Generation**: GPT-4o model (temperature: 0.8, max tokens: 2000)
  - **Audio Synthesis**: gpt-4o-mini-tts model with 7 specialized children's voices
  - **Avatar Generation**: DALL-E 3 (1024x1024, standard quality)
  - Multi-language support (English, Spanish, French, German, Italian)
  - Secure API key storage in iOS Keychain
  - No mock services or fallbacks - OpenAI API required

- **AudioService**: Advanced MP3 audio management
  - Lock screen integration via MPNowPlayingInfoCenter and MPRemoteCommandCenter
  - Background audio session management with interruption handling
  - Automatic idle timer management during playback
  - MP3 file management with timestamp-based naming
  - Playback speed control (0.5x to 2.0x) and seeking capabilities
  - Audio route change detection (headphones disconnection)
  - Navigation delegate for story queue management

- **CustomEventAIAssistant**: AI-powered helper for custom events
  - Title generation from descriptions
  - Prompt seed enhancement based on context
  - Keyword and similar event suggestions

- **AvatarPromptAssistant**: DALL-E prompt generation for hero avatars
  - Automatic prompt enhancement based on hero traits
  - Age-appropriate illustration styles

#### System Services
- **IdleTimerManager**: Prevents screen sleep during audio playback with reference counting
- **BackgroundTaskManager**: Manages iOS background tasks for audio and story processing
- **NetworkService**: Monitors network connectivity and handles network-dependent operations
- **ThemeSettings**: Manages dark/light/system theme preferences
- **AppSettings**: User preferences and API configuration with secure keychain storage

### View Architecture (MVVM)

#### Main Views
- **ImprovedContentView**: Enhanced magical UI with floating action button
  - **FloatingCreateStoryButton**: Bottom-right FAB (64x64pt) with animations
  - **ReadingJourneyTopButton**: Compact stats button in navigation bar
  - Removed Quick Actions section for cleaner layout
  - Bottom padding (100pt) for floating button clearance

- **ContentView**: Original dashboard (deprecated, use ImprovedContentView)

#### Hero Management
- **HeroCreationView**: Multi-step wizard for creating/editing heroes
- **HeroListView**: Complete hero management with edit/delete capabilities
- **HeroAvatarImageView**: Reusable avatar display with async loading
- **AvatarGenerationView**: AI-powered avatar creation workflow
- **AdaptiveHeroGridView**: Responsive hero display grid

#### Story Features
- **StoryGenerationView**: Event selection and story generation interface
- **StoryEditView**: In-app story editor with auto-formatting
  - Character/word count tracking
  - Automatic audio regeneration on save
- **ImprovedStoryLibraryView**: Enhanced story list with filtering and sorting
- **HeroSelectionForStoryView**: Hero picker for story generation
- **EnhancedEventPickerView**: Improved event selection with custom events

#### Reading Journey
- **ReadingJourneyView**: Comprehensive reading statistics and progress
  - Header stats cards (total stories, listening time, streak, favorites)
  - Activity charts with SwiftUI Charts framework
  - Hero performance analytics
  - Milestones and achievements system
  - Recent activity timeline
  - Reading insights and patterns

#### Audio Playback
- **AudioPlayerView**: Advanced story playback with comprehensive controls
  - Lock screen integration with artwork and metadata
  - Previous/Next story navigation with queue management
  - Dynamic UI updates when switching stories
  - Enhanced audio export with metadata
  - Playback speed control (0.5x to 2.0x)
  - Skip forward/backward 15 seconds

#### Custom Events
- **CustomEventCreationView**: Multi-step wizard for custom scenarios
  - AI-powered enhancement options
  - Category and tone customization

#### Settings
- **SettingsView**: API configuration, theme selection, and language preferences

### ViewModels
- **StoryViewModel**: Core business logic and state management
  - Story generation and audio playback coordination
  - Custom events and AI enhancement integration
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

1. **Hero Creation**: Step-by-step character building with AI-generated avatars
2. **Story Generation**: AI-powered stories using OpenAI GPT-4o
3. **Custom Events**: User-defined scenarios with AI enhancement
4. **Multi-Language Support**: 5 languages with localized prompts and voices
5. **Audio Generation**: High-quality MP3 synthesis via gpt-4o-mini-tts
6. **Story Editing**: In-app editing with automatic audio regeneration
7. **Reading Journey**: Comprehensive statistics and progress tracking
8. **Advanced Audio Playback**: Full-featured player with lock screen controls
9. **Theme Support**: Light, dark, and system theme preferences
10. **Accessibility**: Full VoiceOver and Dynamic Type support
11. **Hero Management**: Complete CRUD operations with avatar support
12. **Background Processing**: Continued operation when app is backgrounded

## Recent UI Changes

### Floating Action Button (FAB)
- **Position**: Bottom-right corner (20pt right, 30pt bottom from safe area)
- **Design**: Orange gradient circle (64x64pt) with shadow
- **Animation**: Continuous rotation and scale feedback on press
- **Visibility**: Only shown when heroes exist

### Navigation Updates
- **Reading Journey Button**: Moved to top navigation bar (right side)
  - Compact capsule design with chart icon and streak display
  - Opens full-screen Reading Journey view
- **Story Library**: Moved to Recent Adventures section header
  - Inline button placement for better context

### Layout Improvements
- Removed Quick Actions section entirely
- Removed Compact Journey Card from main view
- Increased bottom padding (100pt) for FAB clearance
- Expanded Recent Stories to show 6 items (up from 3)

## OpenAI API Integration Details

### API Endpoints and Models

#### Story Generation (GPT-4o)
- **Temperature**: 0.8 for creative but coherent output
- **Max Tokens**: 2000 for stories, varies for other uses
- **Use Cases**:
  - Main story generation with character traits
  - Custom event story generation
  - AI-powered content enhancement

#### Audio Synthesis (gpt-4o-mini-tts)
- **Format**: MP3 exclusively (no fallback TTS)
- **Voices**: 7 specialized children's storytelling voices
- **Features**:
  - Voice-specific narration instructions
  - Multi-language support (5 languages)
  - Background generation support

#### Avatar Generation (DALL-E 3)
- **Resolution**: 1024x1024 pixels
- **Quality**: Standard
- **Response**: Base64 encoded
- **Storage**: Documents directory with URL reference

### Security and Best Practices
- API keys stored in iOS Keychain (never hardcoded)
- All communications over HTTPS
- Comprehensive error handling with user-friendly messages
- No silent failures - explicit error reporting
- Rate limit detection (HTTP 429) - needs retry logic implementation

### Cost Optimization
- **Average Monthly Cost**: ~$0.50-0.60 per user (10 stories)
- **Story Generation**: ~$0.02-0.03 per story
- **Audio Generation**: ~$0.01-0.02 per story
- **Avatar Generation**: $0.04 per image

### Areas for Improvement
- Implement exponential backoff for rate limiting
- Add request queuing and batching
- Implement usage monitoring and cost tracking
- Develop content caching strategy

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
1. Configure OpenAI API key in Settings view (stored in Keychain)
2. OpenAI API is mandatory - no mock services or fallbacks
3. Audio uses gpt-4o-mini-tts with voice-specific instructions
4. Multi-language support via prompt localization

## Key Technologies

- **SwiftUI**: Declarative UI with navigation, sheets, and animations
- **SwiftData**: Model persistence with relationships and migrations
- **AVFoundation**: MP3 audio playback and management
- **MediaPlayer**: Lock screen and remote control integration
- **BackgroundTasks**: iOS background processing for long operations
- **Combine**: Reactive programming for ViewModels
- **URLSession**: HTTP requests for OpenAI APIs
- **Network**: Connectivity monitoring
- **Security**: Keychain Services for secure storage
- **Charts**: Native SwiftUI charts for Reading Journey

## File Structure

```
InfiniteStories/
├── Models/
│   ├── Hero.swift                  # Character model with avatar support
│   ├── Story.swift                 # Story model with audio management
│   ├── CustomStoryEvent.swift      # Custom event model with AI fields
│   └── CharacterTraits.swift       # Enums for traits/events
├── Views/
│   ├── HeroCreation/
│   │   └── HeroCreationView.swift  # Hero creation wizard
│   ├── HeroManagement/
│   │   └── HeroListView.swift      # Hero CRUD operations
│   ├── AvatarGeneration/
│   │   └── AvatarGenerationView.swift # AI avatar creation
│   ├── Components/
│   │   ├── HeroAvatarImageView.swift  # Avatar display component
│   │   ├── FloatingCreateStoryButton.swift # FAB component
│   │   └── ReadingJourneyTopButton.swift   # Journey nav button
│   ├── ReadingJourney/
│   │   └── ReadingJourneyView.swift   # Statistics and progress
│   ├── StoryGeneration/
│   │   ├── StoryGenerationView.swift  # Story creation
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
│   ├── ContentView.swift           # Original dashboard (deprecated)
│   └── ImprovedContentView.swift   # Enhanced magical UI with FAB
├── Services/
│   ├── AIService.swift             # OpenAI integration
│   ├── AudioService.swift          # Audio generation/playback
│   ├── CustomEventAIAssistant.swift # AI event enhancement
│   ├── AvatarPromptAssistant.swift # Avatar prompt generation
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
- `useImprovedUI`: Toggle between original and enhanced magical UI (default: true)
- `enableFloatingAnimations`: Control performance-heavy animations
- `maxRecentStories`: Number of stories on home screen (default: 6)
- `enableHapticFeedback`: Haptic feedback for interactions
- `showStatsDashboard`: Display statistics on home screen

### Theme Preferences
- System: Follow device appearance
- Light: Force light mode
- Dark: Force dark mode

### Language Support
- English, Spanish, French, German, Italian
- Localized AI prompts
- Language-specific voice synthesis

## Development Notes

### Model Management
- SwiftData `@Model` and `@Relationship` for persistence
- Automatic audio regeneration on content changes
- AI enhancement and usage tracking for custom events
- Hero deletion preserves stories (nullify relationship)
- Avatar images stored separately with URL reference

### View Architecture
- SwiftUI patterns with `@State`, `@Query`, `@Environment`
- Enhanced views for magical UI experience
- Multi-step wizards for complex workflows
- Adaptive layouts for all screen sizes
- Floating action button pattern for primary CTA
- Computed properties for reactive UI updates

### Service Layer
- Protocol-based clean architecture
- Centralized OpenAI integration
- MP3 files in Documents with timestamp naming
- Background processing for long operations
- Media controls via MPNowPlayingInfoCenter
- Navigation delegate for queue management

### Error Handling
- User-friendly API failure messages
- No silent fallbacks - explicit errors
- Network monitoring for optimal UX
- Graceful feature degradation
- Typed errors for audio export

### Security
- Keychain storage for API keys
- No hardcoded credentials
- HTTPS for all API calls
- Encrypted storage at rest

### Performance
- Idle timer disabled during playback
- Reference counting for resources
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
- Test coverage for core paths

## Recent Updates

### Latest Features
- **Floating Action Button**: Primary CTA at bottom-right
- **Reading Journey**: Comprehensive statistics dashboard
- **AI Avatars**: DALL-E generated hero illustrations
- **Enhanced UI**: Magical interface with animations
- **Navigation Updates**: Streamlined button placement
- **Multi-Language**: 5 language support
- **Custom Events**: AI-enhanced story scenarios
- **Story Editing**: In-app editor with auto-audio
- **Advanced Audio**: Lock screen controls and queue

### App Info.plist Configuration
- Background modes: audio, processing, fetch
- Privacy descriptions for microphone (if needed)
- URL schemes for deep linking (if implemented)

### Known Limitations
- OpenAI API required (no offline mode)
- Network required for generation
- Local MP3 storage consumption
- iOS scheduling for background tasks
- No retry logic for rate limits (TODO)
- Limited caching strategy (TODO)

## Important Instructions for Development

- **Always** use SwiftData for model persistence
- **Never** use mock services - OpenAI API only
- **Store** API keys in Keychain, never hardcode
- **Handle** errors explicitly with user messages
- **Disable** idle timer during audio playback
- **Enable** background modes for audio/processing
- **Follow** SwiftUI patterns and best practices
- **Maintain** 44pt minimum touch targets
- **Support** VoiceOver and Dynamic Type
- **Test** on both iPhone and iPad devices

## Cost and Usage Guidelines

- Monitor API usage to control costs
- Implement caching where appropriate
- Consider batch operations for efficiency
- Track user usage patterns for optimization
- Plan for ~$0.50-0.60 per active user monthly

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.