# Design: Implement Tab Bar Navigation with Liquid Glass

## Context

The current app architecture uses a single NavigationView with:
- Floating action buttons (FAB) for story/hero creation
- Toolbar buttons for Settings and Reading Journey access
- Sheet presentations for Library, Settings, and Journey views

This proposal converts to a TabView-based navigation that leverages iOS 26 Liquid Glass tab bars.

## Architecture Decision

### Tab Structure

```
MainTabView (TabView)
├── Home Tab (ImprovedContentView)
│   └── NavigationStack
│       ├── Hero section
│       ├── Recent stories
│       └── FABs (create story, custom events)
├── Library Tab (ImprovedStoryLibraryView)
│   └── NavigationStack
│       └── Story collection with filters
├── Journey Tab (ReadingJourneyView)
│   └── NavigationStack
│       └── Statistics and charts
└── Settings Tab (SettingsView)
    └── NavigationStack
        └── Form with preferences
```

### Tab Bar Design

| Tab | Icon | Label | Color |
|-----|------|-------|-------|
| Home | `house.fill` | Home | Accent |
| Library | `books.vertical.fill` | Library | Accent |
| Journey | `chart.line.uptrend.xyaxis` | Journey | Accent |
| Settings | `gearshape.fill` | Settings | Accent |

### Why 4 Tabs (Not 3 or 5)

- **3 tabs** would require Settings in a different location (toolbar, which is less discoverable)
- **5 tabs** would crowd the bar and violate Apple HIG (recommend 3-5 tabs, 4 is ideal)
- **4 tabs** provides balanced spacing and clear categorization

## Trade-offs Considered

### Option A: Keep Current Sheet-Based Navigation
**Pros:**
- No refactoring needed
- Familiar to existing users

**Cons:**
- Misses iOS 26 Liquid Glass tab bar styling
- More taps to access Library/Journey
- Modal presentations break user flow

### Option B: TabView with 3 Tabs (Settings in Toolbar) ❌
**Pros:**
- Cleaner tab bar
- Settings as secondary action

**Cons:**
- Settings less discoverable
- Inconsistent with iOS 26 design patterns (Settings is often a tab)

### Option C: TabView with 4 Tabs ✅ (Selected)
**Pros:**
- Native iOS 26 Liquid Glass styling automatic
- Single-tap access to all major sections
- Each section has dedicated space
- Matches Apple's own apps (Settings, Music, etc.)

**Cons:**
- Visual change for existing users
- Requires view refactoring

## Implementation Approach

### MainTabView Structure

```swift
struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeTabView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            LibraryTabView()
                .tabItem {
                    Label("Library", systemImage: "books.vertical.fill")
                }
                .tag(1)

            JourneyTabView()
                .tabItem {
                    Label("Journey", systemImage: "chart.line.uptrend.xyaxis")
                }
                .tag(2)

            SettingsTabView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(3)
        }
        .glassTabBar()
    }
}
```

### Glass Effect Application

On iOS 26+, the TabView automatically receives glass styling via:
1. `.glassTabBar()` modifier (existing in GlassNavigationStyle.swift)
2. System applies `.glassEffect()` to tab bar background
3. No additional configuration needed for basic glass appearance

### State Preservation

Each tab wraps its content in a NavigationStack. SwiftUI automatically preserves navigation state when switching tabs because:
- Each tab has its own NavigationStack instance
- TabView doesn't destroy tab content when switching
- Navigation paths are maintained independently

### Migration Path

1. Create `MainTabView.swift` with TabView structure
2. Update app entry point to use MainTabView
3. Refactor each view to work within tab context:
   - Remove redundant dismiss buttons
   - Add `.glassNavigation()` modifier
   - Adjust toolbar items
4. Remove deprecated sheet-based navigation code from ImprovedContentView

## Accessibility Considerations

- Tab bar items automatically get accessibility labels from Label text
- Selection state is announced by VoiceOver
- Tab order follows left-to-right reading order
- Keyboard navigation works via Tab key on iPadOS

## Fallback Strategy (iOS 17-25)

- TabView renders normally without glass effects
- `.glassTabBar()` modifier uses `#available` check internally
- Standard tab bar appearance applied
- No functionality loss
