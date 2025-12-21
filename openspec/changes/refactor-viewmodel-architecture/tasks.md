# Tasks: ViewModel Architecture Refactoring

## Phase 1: Extract AudioPlaybackViewModel (Low Risk)

- [ ] 1.1 Create `ViewModels/AudioPlaybackViewModel.swift` with `@Observable` macro
- [ ] 1.2 Move audio playback methods from `StoryViewModel`:
  - `playStory(_:)` → `play(story:)`
  - `pauseAudio()` → `pause()`
  - `resumeAudio()` → `resume()`
  - `stopAudio()` → `stop()`
  - `seek(to:)`
  - `setPlaybackSpeed(_:)` → `setSpeed(_:)`
  - `togglePlayPause()`
  - `skipForward(_:)` / `skipBackward(_:)`
- [ ] 1.3 Move audio state properties:
  - `isPlaying`, `isPaused`, `currentTime`, `duration`, `playbackSpeed`
  - `currentStory`, `storyQueue`, `currentStoryIndex`, `isQueueMode`
- [ ] 1.4 Move audio timer management methods:
  - `startAudioUpdateTimer()` / `stopAudioUpdateTimer()`
  - `updateAudioState()`
- [ ] 1.5 Move queue navigation and Now Playing methods:
  - `setupStoryQueue(stories:startIndex:)`
  - `clearQueue()`
  - `updateNowPlayingForStory(_:)`
  - `createArtworkForStory(_:)`
- [ ] 1.6 Move `AudioNavigationDelegate` conformance to new ViewModel
- [ ] 1.7 Move `IllustrationSyncManager` usage to `AudioPlaybackViewModel`
- [ ] 1.8 Update `AudioPlayerView.swift` to use `@Environment(AudioPlaybackViewModel.self)`
- [ ] 1.9 Update `AudioRegenerationView.swift` if it uses audio playback
- [ ] 1.10 Write unit tests for `AudioPlaybackViewModel`
- [ ] 1.11 Verify audio playback works end-to-end (play, pause, seek, speed, queue)

## Phase 2: Extract StoryLibraryViewModel (Medium Risk)

- [ ] 2.1 Create `ViewModels/StoryLibraryViewModel.swift` with `@Observable` macro
- [ ] 2.2 Add library state properties:
  - `stories: [Story]`
  - `heroes: [Hero]`
  - `isLoading: Bool`
  - `error: String?`
  - `selectedHero: Hero?`
  - `filteredStories: [Story]`
- [ ] 2.3 Add library management methods:
  - `loadContent()` - Fetch stories and heroes from repositories
  - `filterByHero(_:)` - Filter stories by hero
  - `clearFilter()` - Reset filter
- [ ] 2.4 Move `deleteStoryWithCleanup(_:)` from `StoryViewModel`
- [ ] 2.5 Add refresh capability for pull-to-refresh
- [ ] 2.6 Update `ImprovedStoryLibraryView.swift`:
  - Remove direct repository instantiation
  - Use `@Environment(StoryLibraryViewModel.self)`
  - Bind to ViewModel state
- [ ] 2.7 Update `ImprovedContentView.swift`:
  - Remove `@State private var heroes: [Hero]` and `@State private var stories: [Story]`
  - Use `@Environment(StoryLibraryViewModel.self)` for data
- [ ] 2.8 Write unit tests for `StoryLibraryViewModel`
- [ ] 2.9 Verify library browsing, filtering, and deletion work

## Phase 3: Refactor StoryGenerationViewModel (Medium Risk)

- [ ] 3.1 Rename `StoryViewModel.swift` to `StoryGenerationViewModel.swift`
- [ ] 3.2 Apply `@Observable` macro, remove `ObservableObject` conformance
- [ ] 3.3 Remove `@Published` property wrappers
- [ ] 3.4 Remove methods extracted in Phase 1 (audio playback)
- [ ] 3.5 Remove methods extracted in Phase 2 (library management)
- [ ] 3.6 Remove properties extracted in Phases 1 & 2
- [ ] 3.7 Keep generation-focused methods:
  - `generateStory(for:event:)`
  - `generateStory(for:customEvent:)`
  - `retryAudioGeneration()`
  - `retryIllustrationGeneration()`
  - `continueFromFailedStep(hero:)`
  - `skipFailedStep()`
  - `cancelGeneration()` (new, consolidate cancellation logic)
  - `clearError()`
- [ ] 3.8 Keep generation-focused properties:
  - `generationStage`, `overallProgress`, `generationError`
  - `isGeneratingStory`, `isGeneratingAudio`, `isGeneratingIllustrations`
  - `illustrationGenerationProgress`, `illustrationGenerationStage`
  - `enableIllustrations`, `currentStory`
- [ ] 3.9 Add callback for story generation completion (for cross-VM communication)
- [ ] 3.10 Remove background task setup from init (move to app lifecycle)
- [ ] 3.11 Update `StoryGenerationView.swift` to use `@Environment(StoryGenerationViewModel.self)`
- [ ] 3.12 Update `IllustrationGenerationProgressView.swift` if needed
- [ ] 3.13 Write unit tests for `StoryGenerationViewModel`
- [ ] 3.14 Verify story generation pipeline works (story → audio → illustrations)

## Phase 4: Extract AppSettings (Low Risk)

- [ ] 4.1 Create `Settings/AppSettings.swift`
- [ ] 4.2 Move `AppSettings` class from `StoryViewModel.swift`
- [ ] 4.3 Apply `@Observable` macro
- [ ] 4.4 Update imports in files using `AppSettings`
- [ ] 4.5 Verify settings persistence works (voice, language, story length)

## Phase 5: Create ViewModelFactory (Low Risk)

- [ ] 5.1 Create `ViewModels/ViewModelFactory.swift`
- [ ] 5.2 Add factory properties for all ViewModels
- [ ] 5.3 Inject repositories via initializer parameters
- [ ] 5.4 Setup cross-VM communication callbacks
- [ ] 5.5 Create protocol `ViewModelFactoryProtocol` for testing
- [ ] 5.6 Create `MockViewModelFactory` for tests

## Phase 6: Environment Integration (Medium Risk)

- [ ] 6.1 Create environment keys in `ViewModels/EnvironmentKeys.swift`:
  - `StoryGenerationViewModel`
  - `AudioPlaybackViewModel`
  - `StoryLibraryViewModel`
  - `AppSettings`
- [ ] 6.2 Update `InfiniteStoriesApp.swift`:
  - Create `@State private var factory = ViewModelFactory()`
  - Inject ViewModels into environment
- [ ] 6.3 Update all views to use `@Environment` instead of `@StateObject`:
  - `ImprovedContentView`
  - `StoryGenerationView`
  - `AudioPlayerView`
  - `ImprovedStoryLibraryView`
  - `CustomEventManagementView` (if applicable)
- [ ] 6.4 Update SwiftUI previews to provide environment ViewModels
- [ ] 6.5 Add DEBUG assertions for missing environment objects

## Phase 7: Cleanup and Testing (Low Risk)

- [ ] 7.1 Delete backup `StoryViewModel.swift` after validation
- [ ] 7.2 Remove any unused imports from updated files
- [ ] 7.3 Run full test suite and fix failures
- [ ] 7.4 Test on device: generation → playback → library flow
- [ ] 7.5 Test background task handling
- [ ] 7.6 Test memory usage (no ViewModel leaks)
- [ ] 7.7 Update CLAUDE.md with new ViewModel architecture notes
- [ ] 7.8 Final code review for consistency

## Validation Checkpoints

After each phase, verify:
- [ ] App launches without crashes
- [ ] Core functionality works (generation, playback, library)
- [ ] No memory leaks (check Instruments)
- [ ] Unit tests pass
- [ ] No compiler warnings

## Dependencies

- Phase 2 depends on Phase 1 (audio methods removed first)
- Phase 3 depends on Phases 1 & 2 (all extractions complete)
- Phase 4 can run in parallel with Phases 1-3
- Phase 5 depends on Phases 1-4 (all ViewModels created)
- Phase 6 depends on Phase 5 (factory exists)
- Phase 7 depends on Phase 6 (integration complete)

## Parallelizable Work

- Phases 1 and 4 can be done in parallel
- Unit tests can be written alongside extraction
- Preview updates can be done as views are updated
