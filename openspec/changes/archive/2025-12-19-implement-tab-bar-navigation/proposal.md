# Change: Implement Tab Bar Navigation with Liquid Glass

## Why

The current app uses a single `NavigationView` with floating action buttons and sheets for accessing key features (Story Library, Reading Journey, Settings). This requires users to navigate through multiple taps and dismissals to switch between major sections.

iOS 26 introduces **Liquid Glass tab bars** that provide:
1. **Native glass background** - Tab bar automatically adopts translucent glass styling
2. **Unified navigation** - Primary sections accessible with single tap
3. **Persistent context** - Each tab maintains its own navigation state
4. **Platform consistency** - Matches Apple's design direction for iOS 26

The existing `GlassNavigationStyle.swift` already has `.glassTabBar()` modifier ready but unused. Converting to a TabView will:
- Simplify navigation (fewer sheets/modals)
- Leverage iOS 26's automatic glass tab bar styling
- Improve discoverability of Story Library and Reading Journey
- Reduce cognitive load when switching between app sections

## What Changes

### New Root Container
- **NEW: MainTabView.swift** - Root TabView with 4 tabs
  - Home (heroes + recent stories)
  - Library (story collection)
  - Journey (reading statistics)
  - Settings

### View Refactoring
- **ImprovedContentView.swift** - MODIFIED: Remove Settings button, Reading Journey button from toolbar; becomes Home tab content
- **ImprovedStoryLibraryView.swift** - MODIFIED: Remove sheet presentation wrapper; becomes Library tab content
- **ReadingJourneyView.swift** - MODIFIED: Remove fullScreenCover presentation; becomes Journey tab content
- **SettingsView.swift** - MODIFIED: Remove sheet presentation; becomes Settings tab content

### Glass Styling
- **GlassNavigationStyle.swift** - MODIFIED: Add tab bar selection styling and morphing transitions

### Navigation Updates
- Remove floating "Journey" button from home toolbar
- Remove settings gear button from home toolbar
- Keep floating action buttons for story/hero creation (contextual to Home tab)
- Each tab maintains independent NavigationStack

## Impact

### Affected Specs
- `ios-design-system` - MODIFIED: Add tab bar glass requirements

### Affected Code (8 files)
- `InfiniteStories/MainTabView.swift` - NEW
- `InfiniteStories/ImprovedContentView.swift` - MAJOR refactor
- `Views/StoryLibrary/ImprovedStoryLibraryView.swift` - MINOR refactor
- `Views/ReadingJourney/ReadingJourneyView.swift` - MINOR refactor
- `Views/Settings/SettingsView.swift` - MINOR refactor
- `Theme/GlassNavigationStyle.swift` - MINOR additions
- `InfiniteStoriesApp.swift` - Root view change
- `ContentView.swift` - Root view change (if used)

### Breaking Changes
- **NAVIGATION**: Users familiar with current sheet-based navigation will see new tab structure
- **VISUAL**: Tab bar appears at bottom (standard iOS pattern)

### Non-Breaking
- All functionality preserved
- Floating action buttons remain on Home tab
- Sheet-based flows (hero creation, story generation, audio player) unchanged
- Backend integration unchanged
- Accessibility features preserved
