# Proposal: Deactivate Story Illustrations

## Change ID
`deactivate-story-illustrations`

## Summary
Add a feature flag to deactivate story illustration generation in the iOS app. The flag will be set to `false` by default, disabling illustration generation until Version 2 of the app. Avatar generation for heroes remains unaffected.

## Motivation
Story illustrations are being deferred to Version 2 of the app. A feature flag provides a clean way to disable the feature without removing code, allowing easy re-enablement when ready.

## Scope

### In Scope
- Add `enableStoryIllustrations` feature flag to `AppConfiguration.swift`, defaulting to `false`
- Guard all illustration generation code paths with the feature flag
- Hide illustration-related UI elements when flag is disabled
- Ensure graceful handling when illustrations are disabled (no crashes, clear UX)
- Skip illustration generation step in story pipeline
- Hide illustration toggle in `StoryGenerationView`
- Hide illustration carousel/sync views in `AudioPlayerView`
- Ensure stories without illustrations display correctly

### Out of Scope
- Avatar generation (remains enabled)
- Removing any illustration-related code (preserved for V2)
- Backend changes (iOS-only change)
- Image generation spec modifications (capabilities preserved)

## Impact Analysis

### Files to Modify
1. `AppConfiguration.swift` - Add feature flag
2. `StoryViewModel.swift` - Check flag before illustration generation
3. `StoryGenerationView.swift` - Conditionally show illustration toggle
4. `AudioPlayerView.swift` - Hide illustration carousel when disabled

### Dependencies
- No external dependencies
- Self-contained iOS change

### Risks
- Low risk: Feature flag pattern already established in `AppConfiguration.swift`
- Code paths preserved for easy re-enablement
