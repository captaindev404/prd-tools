# feature-flags Specification

## Purpose
TBD - created by archiving change deactivate-story-illustrations. Update Purpose after archive.
## Requirements
### Requirement: Story Illustrations Feature Flag

The iOS app MUST include a feature flag `enableStoryIllustrations` that controls whether story illustration generation is available.

#### Scenario: Feature flag defaults to disabled

**Given** the iOS app is built
**When** `AppConfiguration.enableStoryIllustrations` is accessed
**Then** the value MUST be `false`
**And** illustration generation is unavailable by default

#### Scenario: Illustration generation skipped when flag disabled

**Given** `AppConfiguration.enableStoryIllustrations` is `false`
**When** a story is generated
**Then** story text generation proceeds normally
**And** audio generation proceeds normally
**And** illustration generation step is skipped
**And** the story is marked complete without illustrations

#### Scenario: Illustration UI hidden when flag disabled

**Given** `AppConfiguration.enableStoryIllustrations` is `false`
**When** the user views `StoryGenerationView`
**Then** the "Generate Illustrations" toggle is NOT displayed
**And** no option to enable illustrations is available

#### Scenario: Audio player works without illustrations

**Given** `AppConfiguration.enableStoryIllustrations` is `false`
**And** a story has been generated
**When** the user opens `AudioPlayerView`
**Then** the illustration carousel is NOT displayed
**And** audio playback controls function normally
**And** no placeholder or error shown for missing illustrations

#### Scenario: Avatar generation unaffected by flag

**Given** `AppConfiguration.enableStoryIllustrations` is `false`
**When** a user creates a new hero
**Then** avatar generation remains available
**And** the hero can have an AI-generated avatar
**And** avatar API calls proceed normally

#### Scenario: Flag can be enabled for V2

**Given** the V2 release is ready
**When** `AppConfiguration.enableStoryIllustrations` is set to `true`
**Then** all illustration generation functionality is restored
**And** illustration UI elements become visible
**And** the generation pipeline includes illustration step

### Requirement: No Breaking Changes When Disabled

The app MUST function correctly when illustration generation is disabled, with no crashes or error states.

#### Scenario: Empty illustrations array handled gracefully

**Given** `AppConfiguration.enableStoryIllustrations` is `false`
**And** a story has `illustrations = []`
**When** any view accesses `story.illustrations`
**Then** an empty array is returned
**And** no crash or exception occurs

#### Scenario: hasIllustrations returns false

**Given** `AppConfiguration.enableStoryIllustrations` is `false`
**And** a story was generated without illustrations
**When** `story.hasIllustrations` is checked
**Then** the value is `false`
**And** UI correctly hides illustration-dependent elements

#### Scenario: IllustrationSyncManager handles no illustrations

**Given** `AppConfiguration.enableStoryIllustrations` is `false`
**And** `IllustrationSyncManager` is configured with a story
**When** the story has no illustrations
**Then** sync manager operates in no-op mode
**And** no errors are logged
**And** audio playback proceeds normally

