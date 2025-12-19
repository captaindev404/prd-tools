# Tasks: Implement Liquid Glass

## 1. Core Infrastructure

- [x] 1.1 Update `LiquidGlassModifier.swift` with real iOS 26 `.glassEffect()` API
- [x] 1.2 Add glass variant modifiers (`.regular`, `.clear`, `.identity`)
- [x] 1.3 Add `.tint()` and `.interactive()` modifier support
- [x] 1.4 Create `GlassContainerView.swift` wrapper for `GlassEffectContainer`
- [x] 1.5 Create `GlassNavigationStyle.swift` for tab bar and toolbar styling
- [x] 1.6 Add `.glassEffectID()` support for morphing transitions

## 2. Navigation Layer

- [x] 2.1 Apply glass styling to NavigationView in `ImprovedContentView.swift`
- [x] 2.2 Apply glass styling to NavigationStack toolbars
- [x] 2.3 Wrap navigation elements in `GlassEffectContainer` where needed
- [ ] 2.4 Test tab bar glass on iOS 26 simulator (requires Xcode 26)

## 3. Interactive Elements (Buttons)

- [x] 3.1 Update `FloatingCreateStoryButton` with `.buttonStyle(.glassFloating)`
- [x] 3.2 Update `FloatingCustomEventButton` with glass styling
- [x] 3.3 Update `ReadingJourneyTopButton` with `.liquidGlassCapsule()`
- [x] 3.4 Apply glass to primary action buttons across views
- [x] 3.5 Apply glass to secondary/bordered buttons

## 4. Content Cards

- [x] 4.1 Update story cards with `.liquidGlassCard()` modifier
- [x] 4.2 Update hero cards in `AdaptiveHeroGridView.swift`
- [x] 4.3 Update event cards in `EnhancedEventPickerView.swift`
- [x] 4.4 Update story cards in `ImprovedStoryLibraryView.swift`
- [x] 4.5 Apply glass to custom event cards

## 5. Sheets and Modals

- [x] 5.1 Apply glass background to `SettingsView.swift` sheet
- [x] 5.2 Apply glass to `HeroCreationView.swift` sheets
- [x] 5.3 Apply glass to `StoryGenerationView.swift` modals
- [x] 5.4 Apply glass to `AudioPlayerView.swift` navigation
- [x] 5.5 Apply glass to `ReadingJourneyView.swift` fullscreen cover

## 6. Component Updates

- [x] 6.1 Update `ErrorView.swift` with glass styling
- [x] 6.2 Update `NetworkRequiredView.swift` with glass styling
- [x] 6.3 Update `IllustrationCarouselView.swift` controls with glass
- [x] 6.4 Update `IllustrationSyncView.swift` timeline with glass
- [x] 6.5 Update loading indicators with glass backgrounds

## 7. Polish and Transitions

- [x] 7.1 Add `GlassEffectContainer` to views with multiple glass elements
- [ ] 7.2 Implement glass morphing transitions between related elements
- [x] 7.3 Ensure glass tinting uses `.accentColor` consistently
- [x] 7.4 Review and adjust corner radii for glass shapes

## 8. Testing and Validation

- [x] 8.1 Build succeeds with current Xcode (iOS 17+ fallback verified)
- [ ] 8.2 Test on iOS 17 simulator (fallback behavior)
- [ ] 8.3 Test on iOS 18 simulator (fallback behavior)
- [ ] 8.4 Test on iOS 26 simulator (full glass effects - requires Xcode 26)
- [ ] 8.5 Verify VoiceOver accessibility with glass elements
- [ ] 8.6 Verify Dynamic Type scaling with glass elements
- [ ] 8.7 Verify Reduce Motion respects glass transitions

## Dependencies

- **1.x** must complete before 2.x-6.x (infrastructure first) - DONE
- **2.x** (navigation) can run in parallel with 3.x-6.x
- **8.x** (testing) requires all implementation complete

## Implementation Summary

### Files Created
- `Theme/GlassContainerView.swift` - Wrapper for GlassEffectContainer
- `Theme/GlassNavigationStyle.swift` - Navigation bar and tab bar glass styles

### Files Modified
- `Theme/LiquidGlassModifier.swift` - Updated with iOS 26 .glassEffect() API, glass variants, shapes
- `ImprovedContentView.swift` - Glass buttons, cards, navigation, sheets
- `Views/Settings/SettingsView.swift` - Glass navigation
- `Views/AudioPlayer/AudioPlayerView.swift` - Glass navigation
- `Views/Components/ErrorView.swift` - Glass cards and buttons
- `Views/Components/NetworkRequiredView.swift` - Glass icon, status badges, retry button
- `Views/HeroDisplay/AdaptiveHeroGridView.swift` - Glass hero cards and add hero button
- `Views/StoryGeneration/EnhancedEventPickerView.swift` - Glass event cards and filter chips
- `Views/StoryLibrary/ImprovedStoryLibraryView.swift` - Glass stat cards, filter pills, badges
- `Views/Components/IllustrationCarouselView.swift` - Glass seek feedback and hints
- `Views/Components/IllustrationSyncView.swift` - Glass timing badges and progress bar
