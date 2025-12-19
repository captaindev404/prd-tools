# Design: Liquid Glass Implementation

## Context

Apple introduced Liquid Glass at WWDC 2025 as the most significant design evolution since iOS 7. The design philosophy is:
- **Content at the bottom**: Main content uses solid backgrounds
- **Glass on top**: Navigation controls float with glass effects
- **Morphing transitions**: Glass elements can smoothly transform between each other

Key constraint: Glass cannot sample other glass. Multiple glass elements must be wrapped in `GlassEffectContainer` to render correctly.

## Goals / Non-Goals

### Goals
- Implement real iOS 26 `.glassEffect()` API replacing placeholder code
- Apply glass effects to navigation layer (tab bars, toolbars, sheets)
- Apply glass effects to interactive elements (buttons, cards)
- Maintain graceful iOS 17-25 fallback
- Follow Apple's design guidelines (glass for navigation, not content)

### Non-Goals
- Glass effects on main content areas (against Apple guidelines)
- Custom glass rendering for iOS 17-25 (use system materials)
- Glass on every view (selective application)

## Decisions

### Decision 1: GlassEffectContainer Wrapper
Create `GlassContainerView` that wraps `GlassEffectContainer` for iOS 26+ with passthrough for earlier versions.

**Rationale**: Prevents accidental glass-sampling-glass issues and provides consistent API.

```swift
struct GlassContainerView<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        if #available(iOS 26, *) {
            GlassEffectContainer {
                content
            }
        } else {
            content
        }
    }
}
```

### Decision 2: Glass Variant Selection
| Use Case | Variant | Modifier |
|----------|---------|----------|
| Cards, sheets | `.regular` | `.glassEffect()` |
| Primary buttons | `.regular` | `.glassEffect(.regular.tint(.accentColor).interactive())` |
| Secondary buttons | `.regular` | `.glassEffect(.regular.interactive())` |
| Overlays | `.clear` | `.glassEffect(.clear)` |
| Tab bar | Default | System handles automatically |

**Rationale**: Follow Apple's guidance - regular for most UI, clear for subtle overlays, interactive for buttons.

### Decision 3: Shape Strategy
- **Buttons**: `.capsule` (default, Apple recommended)
- **Cards**: `RoundedRectangle(cornerRadius: 16, style: .continuous)`
- **Sheets**: System default (no custom shape)

**Rationale**: Capsule is Apple's default for good reason. Cards need custom corners to match existing design language.

### Decision 4: Phased Implementation
1. **Phase 1**: Core infrastructure (modifiers, container, navigation style)
2. **Phase 2**: Navigation layer (tab bar, toolbars)
3. **Phase 3**: Interactive elements (buttons)
4. **Phase 4**: Content cards and sheets
5. **Phase 5**: Polish and transitions

**Rationale**: Start with infrastructure, then apply top-down following Apple's "glass floats on content" philosophy.

## Risks / Trade-offs

### Risk: Xcode 26 Beta Required
- **Impact**: Cannot fully test until Xcode 26 is available
- **Mitigation**: Use `#available(iOS 26, *)` checks; fallback code testable on current Xcode

### Risk: Glass Sampling Glass
- **Impact**: Visual artifacts if glass elements overlap without container
- **Mitigation**: `GlassContainerView` wrapper enforces correct usage

### Trade-off: Code Complexity vs Visual Consistency
- Adding iOS version checks increases code complexity
- **Decision**: Accept complexity for proper iOS 26 experience; clean abstraction via modifiers

## Migration Plan

1. Update `LiquidGlassModifier.swift` with iOS 26 APIs (backward compatible)
2. Add new files (`GlassContainerView`, `GlassNavigationStyle`)
3. Apply to navigation layer first (safest, most impact)
4. Roll out to remaining views in phases
5. Test on iOS 17, 18, 26 simulators

### Rollback
- All changes use `#available` checks
- Removing `.glassEffect()` calls reverts to fallback
- No data model or backend changes

## Open Questions

1. **Tab bar behavior**: Does SwiftUI TabView automatically get glass on iOS 26, or do we need explicit styling?
2. **NavigationStack toolbar**: Same question for navigation bar glass
3. **Custom sheet backgrounds**: Will `.presentationBackground()` accept glass materials?

These will be answered during implementation with Xcode 26 beta.
