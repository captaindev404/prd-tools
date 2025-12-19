## Context

InfiniteStories currently uses a custom "magical" design system with:
- 15+ custom color assets in ColorTheme.swift
- MagicalColors struct with hardcoded purple/orange theme
- 74 gradient usages across 25 files
- Continuous animations (floating clouds, stars, sparkles)
- Custom card backgrounds with shadows and gradients

Apple announced Liquid Glass at WWDC 2025 for iOS 26, representing the biggest UI overhaul since iOS 7. Apps compiled with Xcode 26 automatically get Liquid Glass for system controls. Custom components need updates to match.

## Goals / Non-Goals

### Goals
- Remove all custom colors in favor of semantic system colors
- Eliminate continuous background animations for performance
- Prepare for iOS 26 Liquid Glass with graceful iOS 17+ fallback
- Reduce design code by ~40 components
- Maintain accessibility (VoiceOver, Dynamic Type, Reduce Motion)

### Non-Goals
- Redesigning the app's information architecture
- Changing navigation patterns
- Modifying data models or backend integration
- Adding new features

## Decisions

### Decision 1: Use SwiftUI Semantic Colors Exclusively

**Choice**: Replace all custom colors with SwiftUI semantic colors.

| Custom Color | Replacement |
|--------------|-------------|
| `MagicalColors.primary` | `Color.accentColor` (purple tint) |
| `MagicalColors.secondary` | `Color.secondary` |
| `MagicalColors.accent` | `Color.accentColor` |
| `MagicalColors.text` | `Color.primary` |
| `ColorTheme.background` | `Color(.systemBackground)` |
| `ColorTheme.cardBackground` | `Color(.secondarySystemBackground)` |
| `ColorTheme.primaryText` | `Color.primary` |
| `ColorTheme.secondaryText` | `Color.secondary` |

**Rationale**: System colors automatically adapt to:
- Light/dark mode
- High contrast accessibility settings
- iOS 26 Liquid Glass material treatments
- Future Apple design changes

### Decision 2: iOS Version Conditional Compilation

**Choice**: Use `#available(iOS 26, *)` for Liquid Glass-specific code.

```swift
struct LiquidGlassCard: View {
    var body: some View {
        if #available(iOS 26, *) {
            content
                .glassEffect()  // iOS 26 Liquid Glass
                .hoverEffect(.highlight)
        } else {
            content
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}
```

**Rationale**:
- Maintains iOS 17 minimum deployment target
- Automatic Liquid Glass when compiled with Xcode 26
- Clean separation of version-specific code

### Decision 3: Remove All Continuous Animations

**Choice**: Delete all `.repeatForever()` animations except loading indicators.

**Removed patterns**:
- `withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true))`
- Floating clouds, rotating stars, bouncing buttons
- `cloudOffset`, `starRotation`, `sparkleAnimation` state

**Kept patterns**:
- `ProgressView()` loading spinners
- Explicit user-triggered animations (button presses)
- Navigation transitions

**Rationale**:
- Reduces battery consumption
- Eliminates constant re-rendering
- Respects `accessibilityReduceMotion` by default
- Aligns with iOS platform behavior

### Decision 4: Button Styling Strategy

**Choice**: Use system button styles instead of custom floating buttons.

| Current | Replacement |
|---------|-------------|
| `FloatingCreateStoryButton` | `Button { } .buttonStyle(.borderedProminent)` |
| `FloatingCustomEventButton` | `Button { } .buttonStyle(.bordered)` |
| Custom gradient background | `.tint(.purple)` modifier |

**Rationale**:
- System button styles get Liquid Glass automatically
- Consistent with iOS HIG
- Reduced custom code

### Decision 5: Keep ThemeSettings for User Preference

**Choice**: Retain `ThemeSettings.swift` for light/dark/system preference but remove custom color definitions.

```swift
class ThemeSettings: ObservableObject {
    @AppStorage("themePreference") var themePreferenceString: String = "system"
    // Remove: static color references
    // Keep: theme preference enum and logic
}
```

**Rationale**:
- Users may still want to force light or dark mode
- Works with system color scheme override
- Minimal code, high value

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Visual regression | Screenshot tests before/after for key screens |
| Accessibility breakage | Verify VoiceOver, Dynamic Type, High Contrast still work |
| iOS 17-25 looks too plain | Use subtle shadows and materials where appropriate |
| Xcode 26 not yet released | Design for graceful fallback; test on iOS 18 beta |
| User expectation mismatch | Consider announcement in release notes |

## Migration Plan

1. **Phase 1**: Delete ColorTheme.swift, ColorExtensions.swift
2. **Phase 2**: Replace all `MagicalColors.*` with semantic colors
3. **Phase 3**: Remove animation state variables and `startAnimations()` methods
4. **Phase 4**: Simplify button components to system styles
5. **Phase 5**: Add `#available(iOS 26, *)` Liquid Glass conditionals
6. **Phase 6**: Update AccessibilityEnhancements.swift to use system colors
7. **Rollback**: Revert commits if visual testing fails

## Open Questions

1. **App Icon**: Should we update the app icon to match Liquid Glass aesthetic? (Deferred - not part of this change)
2. **Accent Color**: Keep purple as tint, or use system blue? (Recommendation: Keep purple via `AccentColor` asset)
3. **Launch Screen**: Should the launch screen also be simplified? (Recommendation: Yes, use solid background)
