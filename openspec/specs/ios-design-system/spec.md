# ios-design-system Specification

## Purpose
TBD - created by archiving change adopt-native-ios-design. Update Purpose after archive.
## Requirements
### Requirement: Use Semantic System Colors

The app SHALL use SwiftUI semantic colors exclusively for all UI elements, avoiding custom color definitions.

#### Scenario: Text uses system semantic colors

- **WHEN** displaying primary text (titles, headings)
- **THEN** the text uses `Color.primary`
- **AND** the text automatically adapts to light/dark mode
- **AND** the text respects high contrast accessibility settings

#### Scenario: Backgrounds use system backgrounds

- **WHEN** rendering view backgrounds
- **THEN** primary backgrounds use `Color(.systemBackground)`
- **AND** card/grouped backgrounds use `Color(.secondarySystemBackground)`
- **AND** backgrounds automatically adapt to color scheme changes

#### Scenario: Accent color uses system tint

- **WHEN** displaying interactive elements or highlights
- **THEN** the element uses `Color.accentColor`
- **AND** the accent color is defined in the asset catalog as `AccentColor`
- **AND** the color propagates correctly to child views

### Requirement: Support iOS 17 Through iOS 26

The app SHALL maintain a minimum deployment target of iOS 17 while supporting iOS 26 Liquid Glass features.

#### Scenario: iOS 17-25 uses standard styling

- **GIVEN** the app runs on iOS 17, 18, or 25
- **WHEN** system controls are rendered
- **THEN** standard iOS styling is applied
- **AND** cards use solid backgrounds with subtle shadows
- **AND** buttons use `.buttonStyle(.borderedProminent)` or `.bordered`

#### Scenario: iOS 26 uses Liquid Glass styling

- **GIVEN** the app is compiled with Xcode 26 SDK
- **AND** runs on iOS 26+
- **WHEN** system controls are rendered
- **THEN** Liquid Glass material is automatically applied
- **AND** custom views use `#available(iOS 26, *)` for glass effects
- **AND** the UI matches Apple's unified design vision

#### Scenario: Graceful fallback for unavailable APIs

- **GIVEN** code uses iOS 26+ APIs
- **WHEN** running on iOS 17-25
- **THEN** `#available` checks prevent crashes
- **AND** fallback styling is visually appropriate
- **AND** no functionality is lost

### Requirement: Eliminate Continuous Background Animations

The app SHALL NOT use continuously repeating animations except for explicit loading indicators.

#### Scenario: No floating element animations

- **WHEN** the main content view is displayed
- **THEN** no floating clouds, stars, or sparkles animate
- **AND** no `withAnimation(.repeatForever())` patterns exist in view code
- **AND** static decorative elements may be used instead

#### Scenario: Loading indicators use standard patterns

- **WHEN** content is loading
- **THEN** `ProgressView()` or similar standard indicators are used
- **AND** animations stop when loading completes
- **AND** no custom continuous animation code is written

#### Scenario: User-triggered animations are allowed

- **WHEN** the user presses a button
- **THEN** brief feedback animations (scale, highlight) are permitted
- **AND** animations complete within 0.3 seconds
- **AND** `accessibilityReduceMotion` is respected

### Requirement: Use System Button Styles

Interactive buttons SHALL use SwiftUI system button styles instead of custom gradient implementations.

#### Scenario: Primary action buttons use borderedProminent

- **WHEN** displaying a primary call-to-action (Create Story, Create Hero)
- **THEN** the button uses `.buttonStyle(.borderedProminent)`
- **AND** the button automatically gets Liquid Glass on iOS 26
- **AND** the button uses `.tint()` for custom accent color

#### Scenario: Secondary action buttons use bordered

- **WHEN** displaying secondary actions
- **THEN** the button uses `.buttonStyle(.bordered)`
- **AND** the button has consistent styling with primary buttons
- **AND** hover effects work correctly on iPadOS

#### Scenario: Buttons provide haptic feedback

- **WHEN** the user taps a button
- **THEN** `UIImpactFeedbackGenerator` provides appropriate feedback
- **AND** feedback intensity matches action importance
- **AND** haptics are disabled when system settings require it

### Requirement: Preserve Accessibility Features

All accessibility features SHALL continue to function correctly with the new design system.

#### Scenario: VoiceOver works correctly

- **WHEN** VoiceOver is enabled
- **THEN** all interactive elements have accessibility labels
- **AND** element focus order is logical
- **AND** custom actions are available via rotor

#### Scenario: Dynamic Type scales correctly

- **WHEN** the user changes text size in Settings
- **THEN** all text respects Dynamic Type scaling
- **AND** layouts accommodate larger text sizes
- **AND** minimum touch targets (44pt) are maintained

#### Scenario: Reduce Motion is respected

- **WHEN** the user enables Reduce Motion
- **THEN** all animations are disabled or minimized
- **AND** transitions use cross-fade instead of movement
- **AND** `@Environment(\.accessibilityReduceMotion)` is checked

#### Scenario: High Contrast mode works

- **WHEN** the user enables Increase Contrast
- **THEN** text and UI elements have higher contrast ratios
- **AND** semantic colors automatically adjust
- **AND** WCAG AA compliance is maintained

### Requirement: Theme Preference Persists

Users SHALL be able to override system appearance with app-specific light/dark preference.

#### Scenario: User selects light mode

- **GIVEN** the system is in dark mode
- **WHEN** the user selects "Light" in app settings
- **THEN** the app displays in light mode
- **AND** the preference is stored in UserDefaults
- **AND** the preference persists across app restarts

#### Scenario: User selects system mode

- **WHEN** the user selects "System" in app settings
- **THEN** the app follows the system appearance
- **AND** changes when system appearance changes
- **AND** no color scheme override is applied

#### Scenario: Theme preference applies immediately

- **WHEN** the user changes theme preference
- **THEN** the app appearance updates immediately
- **AND** no restart is required
- **AND** all views reflect the new scheme

