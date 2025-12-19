# Change: Implement iOS 26 Liquid Glass Design System

## Why

The current `LiquidGlassModifier.swift` is a placeholder using `.regularMaterial` that does not utilize the actual iOS 26 Liquid Glass APIs introduced at WWDC 2025. Apple's Liquid Glass is a comprehensive design system featuring:

1. **New `.glassEffect()` modifier** - Translucent, dynamic material with light refraction
2. **`GlassEffectContainer`** - Groups glass elements for proper rendering (glass cannot sample glass)
3. **Glass variants** - `.regular`, `.clear`, `.identity` with `.tint()` and `.interactive()` modifiers
4. **Shape options** - `.capsule` (default), `.circle`, custom `RoundedRectangle`
5. **Morphing transitions** - `.glassEffectID()` for fluid animations between glass elements

The app currently has 27+ view files that could benefit from Liquid Glass effects on navigation, tab bars, cards, buttons, and sheets.

## What Changes

### Core Glass Infrastructure
- **LiquidGlassModifier.swift** - Replace placeholder with real iOS 26 APIs (`.glassEffect()`, variants, shapes)
- **NEW: GlassContainerView** - Wrapper for `GlassEffectContainer` with iOS 17+ fallback
- **NEW: GlassNavigationStyle** - Tab bar and navigation bar glass effects

### Glass Variants Implementation
- `.glassEffect(.regular)` - Primary glass for cards, sheets
- `.glassEffect(.clear)` - Subtle glass for overlays
- `.glassEffect(.regular.interactive())` - Buttons with bounce/shimmer effects
- `.glassEffect(.regular.tint(.accentColor))` - Tinted glass for primary actions

### View Updates (27+ files)
- **Navigation Layer**: TabView, NavigationStack toolbars
- **Cards**: MiniStoryCard, HeroCard, EventCard, StoryCard
- **Buttons**: FloatingCreateStoryButton, FAB buttons, action buttons
- **Sheets**: Settings, HeroCreation steps, StoryGeneration modals
- **Overlays**: Audio player controls, loading indicators

### iOS Version Strategy
- **iOS 17-25**: Current fallback (system backgrounds, subtle shadows)
- **iOS 26+**: Full Liquid Glass with `.glassEffect()` API

## Impact

### Affected Specs
- `ios-design-system` - MODIFIED: Add Liquid Glass API requirements

### Affected Code (30+ files)
- `Theme/LiquidGlassModifier.swift` - MAJOR refactor
- `Theme/GlassContainerView.swift` - NEW
- `Theme/GlassNavigationStyle.swift` - NEW
- `ImprovedContentView.swift` - Add GlassEffectContainer, tab bar glass
- `Views/Components/*.swift` - Apply glass effects to cards
- `Views/HeroCreation/*.swift` - Sheet glass styling
- `Views/StoryGeneration/*.swift` - Modal glass styling
- `Views/AudioPlayer/*.swift` - Control bar glass
- `Views/Settings/SettingsView.swift` - Navigation bar glass

### Breaking Changes
- **VISUAL**: Appearance changes on iOS 26+ (intentional)
- **BUILD**: Requires Xcode 26 beta to see full effects

### Non-Breaking
- All functionality unchanged
- iOS 17-25 appearance unchanged
- Backend integration unchanged
- Accessibility features preserved
