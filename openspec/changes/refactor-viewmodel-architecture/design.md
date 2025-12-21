# Design: ViewModel Architecture Refactoring

## Context

The app currently uses a single 1,500+ line `StoryViewModel` that handles story generation, audio playback, illustration management, queue navigation, and background tasks. Views create isolated instances of this ViewModel using `@StateObject`, leading to duplicated state and memory waste.

**Stakeholders:**
- iOS developers (maintainability)
- QA team (testability)
- Users (performance, reliability)

**Constraints:**
- Must maintain iOS 17+ compatibility
- Cannot break existing user-facing functionality
- Must preserve existing repository pattern
- Backend API integration must remain unchanged

## Goals / Non-Goals

**Goals:**
- Split god object into focused, single-responsibility ViewModels
- Enable shared state across views using SwiftUI environment
- Improve testability through protocol-based abstractions
- Reduce memory usage by eliminating duplicate ViewModel instances
- Adopt iOS 17+ `@Observable` macro for cleaner observation

**Non-Goals:**
- Changing backend API contracts
- Modifying data models (Hero, Story, etc.)
- Adding new user-facing features
- Changing audio/illustration generation algorithms

## Decisions

### Decision 1: Split into Three Domain-Focused ViewModels

**What:** Replace `StoryViewModel` with:
- `StoryGenerationViewModel` - Story/audio/illustration generation pipeline
- `AudioPlaybackViewModel` - Audio controls, progress tracking, queue navigation
- `StoryLibraryViewModel` - Library management, filtering, CRUD operations

**Why:**
- Single Responsibility Principle - each ViewModel handles one domain
- Enables parallel development on different features
- Simplifies testing - mock one concern at a time
- Reduces cognitive load - developers only need to understand relevant ViewModel

**Alternatives considered:**
1. **Keep single ViewModel, refactor internally** - Still violates SRP, testing remains difficult
2. **Use Swift actors for isolation** - Adds complexity, not needed for UI state
3. **Use Combine-based state stores** - Over-engineering for current scale

### Decision 2: Use @Observable Macro (iOS 17+)

**What:** Migrate from `@ObservableObject` + `@Published` to `@Observable` macro.

**Why:**
- Reduces boilerplate (no `@Published` annotations needed)
- Better performance (granular observation, not whole-object)
- Cleaner syntax aligned with modern SwiftUI
- Already targeting iOS 17+ per existing codebase

**Migration pattern:**
```swift
// Before
class StoryViewModel: ObservableObject {
    @Published var isGenerating = false
    @Published var progress: Double = 0.0
}

// After
@Observable
class StoryGenerationViewModel {
    var isGenerating = false
    var progress: Double = 0.0
}
```

### Decision 3: Environment-Based Dependency Injection

**What:** Use `@Environment` to inject shared ViewModels into views.

**Why:**
- SwiftUI-native pattern (no third-party DI frameworks)
- Automatic propagation through view hierarchy
- Easy to override in previews and tests
- Consistent with Apple's recommended practices

**Pattern:**
```swift
// Environment key
@Observable
class StoryGenerationViewModel { ... }

extension EnvironmentValues {
    @Entry var storyGenerationViewModel = StoryGenerationViewModel()
}

// App setup
@main
struct InfiniteStoriesApp: App {
    @State private var generationVM = StoryGenerationViewModel(...)

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(generationVM)
        }
    }
}

// View consumption
struct StoryGenerationView: View {
    @Environment(StoryGenerationViewModel.self) private var viewModel
}
```

### Decision 4: ViewModelFactory for Complex Initialization

**What:** Create a `ViewModelFactory` to handle ViewModel creation with dependencies.

**Why:**
- Centralizes dependency injection logic
- Repositories are injected once, not in every view
- Enables protocol-based mocking for tests
- Simplifies app initialization

**Pattern:**
```swift
@Observable
class ViewModelFactory {
    let storyGeneration: StoryGenerationViewModel
    let audioPlayback: AudioPlaybackViewModel
    let storyLibrary: StoryLibraryViewModel

    init(
        heroRepository: HeroRepositoryProtocol = HeroRepository(),
        storyRepository: StoryRepositoryProtocol = StoryRepository(),
        customEventRepository: CustomEventRepositoryProtocol = CustomEventRepository(),
        audioService: AudioServiceProtocol = AudioService()
    ) {
        self.storyGeneration = StoryGenerationViewModel(
            storyRepository: storyRepository,
            heroRepository: heroRepository
        )
        self.audioPlayback = AudioPlaybackViewModel(
            audioService: audioService
        )
        self.storyLibrary = StoryLibraryViewModel(
            storyRepository: storyRepository,
            heroRepository: heroRepository
        )
    }
}
```

### Decision 5: State Grouping with Nested Observables

**What:** Group related state into sub-objects within ViewModels.

**Why:**
- Reduces property count per ViewModel (target: 5-10 max)
- Semantic grouping improves code readability
- Enables fine-grained observation

**Pattern:**
```swift
@Observable
class StoryGenerationViewModel {
    // Grouped state
    var stage: StoryGenerationStage = .idle
    var progress: Double = 0.0
    var currentStory: Story?
    var error: GenerationError?

    // Instead of 15+ flat properties
}
```

### Decision 6: Preserve Existing Enum-Based State Pattern

**What:** Keep `StoryGenerationStage` and `FailedGenerationStep` enums for state representation.

**Why:**
- Already well-designed and type-safe
- Prevents invalid state combinations
- Computed properties provide clean UI binding
- No reason to change working pattern

## ViewModel Responsibilities

### StoryGenerationViewModel
- `generateStory(for:event:)` - Full generation pipeline
- `generateStory(for:customEvent:)` - Custom event generation
- `retryAudioGeneration()` - Retry failed audio step
- `retryIllustrationGeneration()` - Retry failed illustration step
- `cancelGeneration()` - Cancel in-progress generation

**State:**
- `stage: StoryGenerationStage`
- `progress: Double`
- `currentStory: Story?`
- `enableIllustrations: Bool`

### AudioPlaybackViewModel
- `play(story:)` - Start playback
- `pause()` / `resume()` - Toggle playback
- `seek(to:)` - Seek to time
- `setSpeed(_:)` - Adjust playback speed
- `next()` / `previous()` - Queue navigation

**State:**
- `isPlaying: Bool`
- `isPaused: Bool`
- `currentTime: TimeInterval`
- `duration: TimeInterval`
- `playbackSpeed: Float`
- `currentStory: Story?`
- `queue: [Story]`

### StoryLibraryViewModel
- `loadStories()` - Fetch from repository
- `loadHeroes()` - Fetch from repository
- `deleteStory(_:)` - Delete with cleanup
- `filterStories(by:)` - Apply filters

**State:**
- `stories: [Story]`
- `heroes: [Hero]`
- `isLoading: Bool`
- `error: String?`
- `selectedHero: Hero?`

## Communication Between ViewModels

ViewModels may need to communicate:
1. **StoryGeneration → AudioPlayback**: After generation, auto-play new story
2. **StoryGeneration → StoryLibrary**: Refresh library after new story

**Pattern:** Callback closures injected via factory
```swift
storyGeneration.onStoryGenerated = { [weak audioPlayback] story in
    audioPlayback?.play(story: story)
}
```

## Risks / Trade-offs

### Risk 1: Migration Complexity
**Risk:** Refactoring 1,500+ lines across 15+ files risks introducing bugs.
**Mitigation:**
- Implement incrementally (one ViewModel at a time)
- Keep old ViewModel until new one is validated
- Add unit tests before removing old code

### Risk 2: Environment Propagation Gaps
**Risk:** Forgetting to inject ViewModel in some view hierarchy paths.
**Mitigation:**
- Add `@Entry` with sensible defaults
- Use `#Preview` macros to catch missing environment
- Add runtime assertions in DEBUG builds

### Risk 3: State Synchronization
**Risk:** Multiple ViewModels may have stale references to same Story.
**Mitigation:**
- ViewModels share repositories (single source of truth)
- Use callbacks for cross-VM communication
- Avoid duplicating model data across VMs

## Migration Plan

### Phase 1: Extract AudioPlaybackViewModel (Low Risk)
1. Create `AudioPlaybackViewModel` with audio-related methods
2. Update `AudioPlayerView` to use new ViewModel
3. Validate audio playback still works
4. Remove audio methods from `StoryViewModel`

### Phase 2: Extract StoryLibraryViewModel (Medium Risk)
1. Create `StoryLibraryViewModel` with library methods
2. Update library views to use new ViewModel
3. Validate library browsing/filtering works
4. Remove library methods from `StoryViewModel`

### Phase 3: Refactor to StoryGenerationViewModel (Medium Risk)
1. Rename remaining `StoryViewModel` to `StoryGenerationViewModel`
2. Remove extracted methods
3. Apply `@Observable` macro
4. Update all remaining views

### Phase 4: Add ViewModelFactory (Low Risk)
1. Create `ViewModelFactory`
2. Setup in `InfiniteStoriesApp`
3. Inject via environment
4. Remove direct ViewModel instantiation from views

### Rollback Strategy
- Keep `StoryViewModel.swift.backup` until refactor is complete
- Feature flag to switch between old/new architecture (optional)
- Each phase can be reverted independently

## Open Questions

1. **Should `AppSettings` be a ViewModel or just `@Observable`?**
   - Current preference: Simple `@Observable` class, not a full ViewModel
   - No repository dependency, just UserDefaults wrapper

2. **Should illustration sync logic stay in AudioPlaybackViewModel?**
   - Current preference: Yes, illustration sync is tied to playback time
   - Alternative: Separate `IllustrationSyncViewModel`

3. **Should we add ViewModel unit tests in this PR or follow-up?**
   - Recommendation: Include basic tests in this PR to validate refactor
