# Change: Refactor ViewModel Architecture with SwiftUI Best Practices

## Why

The current `StoryViewModel` is a 1,500+ line "god object" that violates the Single Responsibility Principle by handling:
- Story generation orchestration (3-step pipeline)
- Audio playback controls (play/pause/seek/speed)
- Illustration generation and sync
- Story queue management
- Background task lifecycle
- Error handling for multiple domains

This creates several problems:
1. **Difficult to test** - Too many responsibilities in one class
2. **Poor state management** - 26+ `@Published` properties with unclear relationships
3. **Inconsistent consumption** - Views create isolated instances instead of sharing state
4. **Memory inefficiency** - Multiple `StoryViewModel` instances in different screens
5. **Maintenance burden** - Hard to modify one feature without affecting others

Refactoring to focused, composable ViewModels using SwiftUI best practices will:
- Improve testability through single-responsibility classes
- Reduce memory usage via shared state management
- Enable parallel development on different features
- Simplify debugging by isolating concerns

## What Changes

### Architecture Changes

**Split StoryViewModel into 3 focused ViewModels:**
1. `StoryGenerationViewModel` - Story/audio/illustration generation pipeline
2. `AudioPlaybackViewModel` - Playback controls, progress, queue navigation
3. `StoryLibraryViewModel` - Library browsing, filtering, story management

**Introduce ViewModelFactory for dependency injection:**
- Centralized ViewModel creation with proper dependencies
- Protocol-based abstraction for testing
- Environment injection pattern for shared state

**Migrate to @Observable macro (iOS 17+):**
- Replace `@ObservableObject` + `@Published` pattern
- Reduce boilerplate and improve performance
- Cleaner observation semantics

### Removed Components
- `StoryViewModel.swift` (1,523 lines) - Split into 3 focused files
- `AppSettings` class from StoryViewModel.swift - Extract to `Settings/AppSettings.swift`

### Added Components
- `ViewModels/StoryGenerationViewModel.swift` - Generation orchestration (~400 lines)
- `ViewModels/AudioPlaybackViewModel.swift` - Audio controls (~250 lines)
- `ViewModels/StoryLibraryViewModel.swift` - Library management (~200 lines)
- `ViewModels/ViewModelFactory.swift` - DI container (~100 lines)
- `ViewModels/Protocols/` - ViewModel protocols for testing
- `Settings/AppSettings.swift` - User preferences (extracted, ~100 lines)

### Modified Components
- `ImprovedContentView.swift` - Use `@Environment` for shared ViewModels
- `StoryGenerationView.swift` - Receive ViewModel via environment
- `AudioPlayerView.swift` - Receive ViewModel via environment
- `ImprovedStoryLibraryView.swift` - Receive ViewModel via environment
- `InfiniteStoriesApp.swift` - Setup ViewModelFactory and inject into environment

## Impact

### Affected Specs
- `ios-integration` - ViewModel usage patterns change
- **NEW**: `ios-viewmodel-architecture` - ViewModel design requirements

### Affected Code (15+ files)
- `ViewModels/StoryViewModel.swift` - **DELETE** (split into 3 files)
- `ViewModels/StoryGenerationViewModel.swift` - **CREATE**
- `ViewModels/AudioPlaybackViewModel.swift` - **CREATE**
- `ViewModels/StoryLibraryViewModel.swift` - **CREATE**
- `ViewModels/ViewModelFactory.swift` - **CREATE**
- `Settings/AppSettings.swift` - **CREATE** (extracted)
- `ImprovedContentView.swift` - **MODIFY** (environment injection)
- `Views/StoryGeneration/StoryGenerationView.swift` - **MODIFY**
- `Views/AudioPlayer/AudioPlayerView.swift` - **MODIFY**
- `Views/StoryLibrary/ImprovedStoryLibraryView.swift` - **MODIFY**
- `InfiniteStoriesApp.swift` - **MODIFY** (factory setup)
- Test files - **CREATE/MODIFY** for new ViewModels

### Breaking Changes
- **INTERNAL**: Views must use `@Environment` instead of `@StateObject` for shared ViewModels
- **INTERNAL**: `StoryViewModel` class removed (callers must update to new VMs)

### Non-Breaking
- All user-facing functionality unchanged
- Backend integration unchanged
- Audio playback behavior unchanged
- Story generation pipeline unchanged
- Accessibility features preserved
