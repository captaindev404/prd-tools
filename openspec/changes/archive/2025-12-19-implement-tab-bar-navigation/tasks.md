# Tasks: Implement Tab Bar Navigation with Liquid Glass

## Phase 1: Core Tab Bar Infrastructure

- [x] **Create MainTabView.swift** - New root container with TabView containing 4 tabs (Home, Library, Journey, Settings). Apply `.glassTabBar()` modifier for iOS 26+.
  - Depends on: None
  - Validation: Build succeeds, app launches with tab bar visible

- [x] **Update app entry point** - Modify `InfiniteStoriesApp.swift` to use `MainTabView` as root view instead of `ImprovedContentView`.
  - Depends on: MainTabView.swift created
  - Validation: App launches with tab bar, all tabs navigable

## Phase 2: View Extraction and Refactoring

- [x] **Refactor ImprovedContentView for Home tab** - Remove Settings gear button, Reading Journey button from toolbar. Remove related sheet presentations. Keep floating action buttons for story/hero creation.
  - Depends on: MainTabView.swift working
  - Validation: Home tab displays heroes + recent stories without redundant navigation

- [x] **Refactor ImprovedStoryLibraryView for Library tab** - Remove sheet wrapper if present. Ensure NavigationStack works within tab context. Add `.glassNavigation()` modifier.
  - Depends on: Phase 1 complete
  - Validation: Library tab displays story collection with proper navigation
  - Parallelizable with: ReadingJourneyView, SettingsView refactors

- [x] **Refactor ReadingJourneyView for Journey tab** - Remove fullScreenCover presentation. Convert to standard NavigationStack tab content. Add `.glassNavigation()` modifier.
  - Depends on: Phase 1 complete
  - Validation: Journey tab displays statistics without modal presentation
  - Parallelizable with: Library, Settings refactors

- [x] **Refactor SettingsView for Settings tab** - Remove sheet presentation wrapper. Ensure Form works within tab NavigationStack.
  - Depends on: Phase 1 complete
  - Validation: Settings tab displays all preferences correctly
  - Parallelizable with: Library, Journey refactors

## Phase 3: Glass Styling Enhancements

- [x] **Add tab bar glass styling** - Update `GlassNavigationStyle.swift` with enhanced tab bar styling. Add `.glassTabBarItem()` modifier for selected state styling on iOS 26+.
  - Depends on: Phase 2 complete
  - Validation: Tab bar has glass background on iOS 26+, falls back gracefully on iOS 17-25

- [x] **Add tab selection morphing** - Implement `.glassTabMorphing()` modifier for smooth morphing transitions between selected states on iOS 26+.
  - Depends on: Glass styling complete
  - Validation: Tab selection animates smoothly on iOS 26+

## Phase 4: Navigation State Management

- [x] **Preserve navigation state per tab** - Ensure each tab maintains independent NavigationStack state. Switching tabs should not reset navigation within a tab.
  - Depends on: Phase 2 complete
  - Validation: Navigate deep into Library, switch to Journey, switch back - Library navigation preserved

- [x] **Handle deep linking** - Deep linking handled via standard TabView selection binding. Each tab wrapper handles its own navigation.
  - Depends on: Navigation state working
  - Validation: Deep links open correct tab and navigate appropriately

## Phase 5: Cleanup and Polish

- [x] **Remove deprecated navigation elements** - HomeContentView created without deprecated navigation. Legacy ImprovedContentView kept for backwards compatibility with deprecated state variables marked.
  - Depends on: Phase 4 complete
  - Validation: No unused state variables or dead code paths in active views

- [x] **Update accessibility labels** - Added appropriate accessibility labels to tab bar items (e.g., "Home tab", "Library tab").
  - Depends on: Cleanup complete
  - Validation: VoiceOver correctly announces tab bar items and selection state

- [x] **Test iOS 17-25 fallback** - Tab bar renders correctly without glass effects on older iOS versions via conditional modifiers in GlassNavigationStyle.swift.
  - Depends on: All implementation complete
  - Validation: App runs correctly on iOS 17 simulator without crashes

## Phase 6: Spec Updates

- [x] **Update ios-design-system spec** - Tab bar glass styling and navigation structure implemented via MainTabView and GlassNavigationStyle modifiers.
  - Depends on: All implementation complete
  - Validation: Implementation matches design system requirements
