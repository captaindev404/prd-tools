## 1. Remove Custom Color Infrastructure

- [ ] 1.1 Delete `Theme/ColorTheme.swift`
- [ ] 1.2 Delete `Utilities/ColorExtensions.swift` (hex utility)
- [ ] 1.3 Simplify `Services/ThemeSettings.swift` - keep only theme preference logic
- [ ] 1.4 Update `AccentColor` asset in asset catalog to purple (#8B5CF6)
- [ ] 1.5 Remove unused color assets from `Assets.xcassets` (keep only AccentColor)

## 2. Remove MagicalColors and Custom Color References

- [ ] 2.1 Delete `MagicalColors` struct from `ImprovedContentView.swift`
- [ ] 2.2 Replace all `MagicalColors.primary` with `Color.accentColor`
- [ ] 2.3 Replace all `MagicalColors.secondary` with `Color.secondary`
- [ ] 2.4 Replace all `MagicalColors.accent` with `Color.accentColor`
- [ ] 2.5 Replace all `MagicalColors.text` with `Color.primary`
- [ ] 2.6 Replace all `MagicalColors.heroCardStart/End` with `Color.accentColor.opacity()`

## 3. Remove Background Gradients

- [ ] 3.1 Delete `MagicalBackgroundView` struct from `ImprovedContentView.swift`
- [ ] 3.2 Replace with `Color(.systemBackground).ignoresSafeArea()`
- [ ] 3.3 Update all views using `LinearGradient` backgrounds to use solid colors
- [ ] 3.4 Update all views using `RadialGradient` to use solid colors or remove
- [ ] 3.5 Simplify `AccessibleCardStyle.cardBackground()` to use `Color(.secondarySystemBackground)`

## 4. Remove Continuous Animations

- [ ] 4.1 Delete `FloatingElementsView` struct
- [ ] 4.2 Delete `Cloud` shape struct
- [ ] 4.3 Delete `SparkleView` struct
- [ ] 4.4 Remove `startAnimations()` method from `ImprovedContentView`
- [ ] 4.5 Remove animation state variables: `cloudOffset`, `starRotation`, `animateHero`, `sparkleAnimation`
- [ ] 4.6 Remove `isAnimating` state from `MagicalLogoView`, `ReadingJourneyTopButton`
- [ ] 4.7 Remove `isPulsing` state from `FloatingCustomEventButton`
- [ ] 4.8 Remove `.repeatForever()` animations from `EmptyStateView`
- [ ] 4.9 Update all 25 files with animation patterns to use static or user-triggered animations only

## 5. Convert Custom Buttons to System Styles

- [ ] 5.1 Refactor `FloatingCreateStoryButton` to use `.buttonStyle(.borderedProminent)`
- [ ] 5.2 Refactor `FloatingCustomEventButton` to use `.buttonStyle(.bordered)`
- [ ] 5.3 Remove custom gradient/shadow layers from button implementations
- [ ] 5.4 Keep haptic feedback (`UIImpactFeedbackGenerator`)
- [ ] 5.5 Update button positioning (may use toolbar or standard placement)
- [ ] 5.6 Simplify `MagicalLogoView` to static Text + Image without rotation

## 6. Update Card Components

- [ ] 6.1 Refactor `MiniStoryCard` to use system backgrounds
- [ ] 6.2 Refactor `storyCardLabel` in `ImprovedContentView` to use semantic colors
- [ ] 6.3 Update `HeroSectionView` styling
- [ ] 6.4 Update `RecentStoriesView` styling
- [ ] 6.5 Update `EmptyStateView` - remove radial gradients, use static icon
- [ ] 6.6 Simplify `ReadingJourneyTopButton` styling

## 7. Update Remaining Views

- [ ] 7.1 `Views/HeroCreation/HeroCreationView.swift` - replace color references
- [ ] 7.2 `Views/StoryGeneration/StoryGenerationView.swift` - replace gradients
- [ ] 7.3 `Views/AudioPlayer/AudioPlayerView.swift` - simplify styling
- [ ] 7.4 `Views/Components/IllustrationCarouselView.swift` - update overlays
- [ ] 7.5 `Views/Components/IllustrationLoadingView.swift` - simplify gradients
- [ ] 7.6 `Views/Components/IllustrationPlaceholderView.swift` - update styling
- [ ] 7.7 `Views/Components/IllustrationSyncView.swift` - update colors
- [ ] 7.8 `Views/Components/IllustrationThumbnailStrip.swift` - update styling
- [ ] 7.9 `Views/Components/MagicalTextField.swift` - convert to standard TextField style
- [ ] 7.10 `Views/CustomEvents/CustomEventCreationView.swift` - update colors
- [ ] 7.11 `Views/CustomEvents/CustomEventDetailView.swift` - update styling
- [ ] 7.12 `Views/CustomEvents/CustomEventManagementView.swift` - update colors
- [ ] 7.13 `Views/CustomEvents/PictogramGenerationView.swift` - simplify
- [ ] 7.14 `Views/HeroManagement/HeroListView.swift` - update styling
- [ ] 7.15 `Views/HeroDisplay/AdaptiveHeroGridView.swift` - update colors
- [ ] 7.16 `Views/StoryLibrary/ImprovedStoryLibraryView.swift` - update styling
- [ ] 7.17 `Views/ReadingJourney/ReadingJourneyView.swift` - update colors
- [ ] 7.18 `Views/Auth/AuthenticationView.swift` - update styling
- [ ] 7.19 `Views/AudioRegeneration/AudioRegenerationView.swift` - update colors
- [ ] 7.20 `Views/AvatarGeneration/AvatarGenerationView.swift` - update styling

## 8. Simplify Accessibility Code

- [ ] 8.1 Update `AccessibleColors` struct to reference system colors
- [ ] 8.2 Simplify `AccessibleCardStyle.cardBackground()`
- [ ] 8.3 Remove redundant color contrast calculations (system handles this)
- [ ] 8.4 Verify VoiceOver labels still work
- [ ] 8.5 Verify Dynamic Type scaling works
- [ ] 8.6 Test Reduce Motion compliance

## 9. Add iOS 26 Liquid Glass Support

- [ ] 9.1 Create `LiquidGlassModifier.swift` with `#available(iOS 26, *)` checks
- [ ] 9.2 Apply `.glassEffect()` to cards when available
- [ ] 9.3 Ensure fallback styling for iOS 17-25 is clean
- [ ] 9.4 Test on iOS 26 simulator when Xcode 26 is available

## 10. Testing and Validation

- [ ] 10.1 Build project and fix all compilation errors
- [ ] 10.2 Run app on iOS 17 simulator - verify no crashes
- [ ] 10.3 Run app on iOS 18 simulator - verify styling
- [ ] 10.4 Test light mode appearance
- [ ] 10.5 Test dark mode appearance
- [ ] 10.6 Test high contrast mode
- [ ] 10.7 Test VoiceOver navigation
- [ ] 10.8 Test Dynamic Type (extra large sizes)
- [ ] 10.9 Test Reduce Motion setting
- [ ] 10.10 Take screenshots for visual comparison
- [ ] 10.11 Performance test - verify no animation-related CPU usage

## 11. Cleanup

- [ ] 11.1 Remove any dead code or unused imports
- [ ] 11.2 Update `CLAUDE.md` if design conventions changed
- [ ] 11.3 Update preview providers if needed
- [ ] 11.4 Remove `TestThemeView.swift` if no longer needed
