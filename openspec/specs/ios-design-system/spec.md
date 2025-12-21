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

The app SHALL maintain a minimum deployment target of iOS 17 while supporting iOS 26 Liquid Glass features using real iOS 26 APIs.

#### Scenario: iOS 17-25 uses standard styling

- **GIVEN** the app runs on iOS 17, 18, or 25
- **WHEN** system controls are rendered
- **THEN** standard iOS styling is applied
- **AND** cards use solid backgrounds with subtle shadows
- **AND** buttons use `.buttonStyle(.borderedProminent)` or `.bordered`

#### Scenario: iOS 26 uses real Liquid Glass APIs

- **GIVEN** the app is compiled with Xcode 26 SDK
- **AND** runs on iOS 26+
- **WHEN** system controls are rendered
- **THEN** `.glassEffect()` modifier is applied to glass elements
- **AND** multiple glass elements are wrapped in `GlassEffectContainer`
- **AND** buttons use `.glassEffect(.regular.interactive())` for haptic feedback
- **AND** the UI matches Apple's unified design vision

#### Scenario: Graceful fallback for unavailable APIs

- **GIVEN** code uses iOS 26+ APIs
- **WHEN** running on iOS 17-25
- **THEN** `#available(iOS 26, *)` checks prevent crashes
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

### Requirement: Use GlassEffectContainer for Grouped Glass Elements

The app SHALL wrap multiple glass elements within a `GlassEffectContainer` to prevent visual artifacts from glass sampling glass.

#### Scenario: Navigation bar with multiple glass buttons

- **GIVEN** a navigation bar contains multiple glass-styled buttons
- **WHEN** the view is rendered on iOS 26+
- **THEN** all buttons are wrapped in a single `GlassEffectContainer`
- **AND** each button renders correctly without sampling artifacts
- **AND** the container has no visual impact on iOS 17-25

#### Scenario: Card grid with glass elements

- **GIVEN** a grid displays multiple glass-styled cards
- **WHEN** cards may visually overlap or be adjacent
- **THEN** the grid content is wrapped in `GlassEffectContainer`
- **AND** glass effects render correctly on iOS 26+

### Requirement: Apply Interactive Glass to Buttons

Interactive buttons SHALL use `.glassEffect(.regular.interactive())` on iOS 26+ to provide native haptic feedback and visual response.

#### Scenario: Primary action button with interactive glass

- **WHEN** the user taps a primary action button on iOS 26+
- **THEN** the button uses `.glassEffect(.regular.tint(.accentColor).interactive())`
- **AND** the button provides bounce and shimmer feedback
- **AND** haptic feedback is generated automatically

#### Scenario: Secondary action button with interactive glass

- **WHEN** the user taps a secondary action button on iOS 26+
- **THEN** the button uses `.glassEffect(.regular.interactive())`
- **AND** the button provides visual feedback without tint

#### Scenario: Buttons respect accessibility settings

- **WHEN** the user has Reduce Motion enabled
- **THEN** interactive glass effects are minimized
- **AND** button state changes use cross-fade transitions

### Requirement: Apply Glass to Navigation Layer

Tab bars, toolbars, and navigation bars SHALL use glass effects on iOS 26+ following Apple's "glass floats on content" philosophy.

#### Scenario: Tab bar uses glass styling (MODIFIED)

- **GIVEN** the app displays a TabView as the root container on iOS 26+
- **WHEN** the tab bar is visible
- **THEN** the tab bar has a glass background via `.glassTabBar()` modifier
- **AND** tab items use SF Symbols with `.regular` weight
- **AND** the selected tab uses accent color tint
- **AND** unselected tabs use `.secondary` color
- **AND** tab bar content remains legible against any background

#### Scenario: Tab bar provides haptic feedback (ADDED)

- **GIVEN** the user taps a tab bar item on iOS 26+
- **WHEN** switching between tabs
- **THEN** light haptic feedback is provided via `UIImpactFeedbackGenerator(.light)`
- **AND** the feedback respects system haptic settings

#### Scenario: Tab bar falls back on older iOS (ADDED)

- **GIVEN** the app runs on iOS 17-25
- **WHEN** the tab bar is rendered
- **THEN** standard system tab bar styling is used
- **AND** no glass-specific modifiers cause errors
- **AND** all tabs remain functional

### Requirement: Apply Glass to Content Cards

Card components SHALL use `.glassEffect()` with appropriate shapes on iOS 26+ for visual consistency.

#### Scenario: Story cards use glass styling

- **GIVEN** the story library displays story cards on iOS 26+
- **WHEN** cards are rendered
- **THEN** each card uses `.glassEffect()` with `RoundedRectangle(cornerRadius: 16, style: .continuous)`
- **AND** card content remains legible against the glass

#### Scenario: Hero cards use glass styling

- **GIVEN** the hero grid displays hero cards on iOS 26+
- **WHEN** cards are rendered
- **THEN** each card uses `.glassEffect()` with consistent corner radius
- **AND** the hero avatar is visible through the glass

#### Scenario: Cards in grid use container

- **GIVEN** multiple glass cards are displayed in a grid
- **WHEN** the grid is rendered on iOS 26+
- **THEN** the grid is wrapped in `GlassEffectContainer`
- **AND** adjacent cards render without visual artifacts

### Requirement: Support Glass Morphing Transitions

Related glass elements SHALL use `.glassEffectID()` to enable smooth morphing transitions on iOS 26+.

#### Scenario: Navigation transitions morph glass

- **GIVEN** the user navigates from a list item to a detail view on iOS 26+
- **WHEN** both views have glass elements with matching `.glassEffectID()`
- **THEN** the glass effect morphs smoothly between views
- **AND** the transition feels fluid and connected

#### Scenario: Morphing respects Reduce Motion

- **WHEN** the user has Reduce Motion enabled
- **THEN** glass morphing transitions are disabled
- **AND** standard cross-fade transitions are used instead

### Requirement: Use Tab Bar for Primary Navigation

The app SHALL use a TabView as the root container for primary section navigation.

#### Scenario: App displays four primary tabs

- **WHEN** the app launches successfully
- **THEN** a tab bar is visible at the bottom of the screen
- **AND** the tab bar contains exactly four tabs:
  - Home (house icon) - heroes and recent stories
  - Library (books icon) - story collection
  - Journey (chart icon) - reading statistics
  - Settings (gear icon) - app preferences
- **AND** the Home tab is selected by default

#### Scenario: Each tab maintains independent navigation

- **GIVEN** the user has navigated to a detail view within a tab
- **WHEN** the user switches to a different tab and back
- **THEN** the original tab's navigation state is preserved
- **AND** the user returns to the same detail view

#### Scenario: Tab selection respects accessibility

- **WHEN** VoiceOver is enabled
- **THEN** each tab bar item has an accessibility label describing its purpose
- **AND** the selected state is announced (e.g., "Home tab, selected")
- **AND** tab switching is announced

### Requirement: Floating Actions Remain on Home Tab

The Home tab SHALL retain floating action buttons for primary creation actions.

#### Scenario: Story creation FAB on Home tab

- **GIVEN** the user is viewing the Home tab
- **WHEN** at least one hero exists
- **THEN** a floating action button for story creation is visible in the bottom-right corner
- **AND** tapping the button opens the story generation flow
- **AND** the button uses `.glassFloating` style on iOS 26+

#### Scenario: Custom event button on Home tab

- **GIVEN** the user is viewing the Home tab
- **WHEN** the view is rendered
- **THEN** a secondary floating button for custom events is visible in the bottom-left corner
- **AND** tapping the button opens custom event management

#### Scenario: FABs hidden on other tabs

- **GIVEN** the user is viewing Library, Journey, or Settings tab
- **WHEN** the view is rendered
- **THEN** floating action buttons are NOT visible
- **AND** tab-specific actions use toolbar or inline buttons instead

### Requirement: Library View Glass Consistency

The Story Library view SHALL use consistent liquid glass styling for all UI elements including search, filters, and toolbars.

#### Scenario: Search bar uses glass styling

- **WHEN** the Library search bar is rendered
- **THEN** it uses `liquidGlassCard(cornerRadius: 12)` instead of solid background
- **AND** the search field text remains legible against the glass
- **AND** the clear button is visible when text is entered

#### Scenario: Filter pills match design system

- **WHEN** filter pills (All, New, Favorites, Recent) are displayed
- **THEN** each pill uses `liquidGlassCapsule()` with appropriate variant
- **AND** selected pill uses `liquidGlassCapsule(variant: .tinted(.purple))`
- **AND** unselected pills use `liquidGlassCapsule(variant: .regular)`

#### Scenario: Stats cards use glass styling

- **WHEN** the stats section (New, Reading, Completed, Favorites) is displayed
- **THEN** each stat card uses `liquidGlassCard(cornerRadius: 12, variant: .tinted(color))`
- **AND** the tint color matches the stat category (mint, orange, green, red)

### Requirement: Edit Mode Glass Styling

Edit mode components in the Library SHALL use liquid glass styling consistent with the design system.

#### Scenario: Edit mode toolbar uses glass background

- **WHEN** edit mode is activated in the Library
- **THEN** the bottom toolbar uses glass background styling
- **AND** the toolbar does NOT use `.ultraThinMaterial` directly
- **AND** toolbar content remains legible against the glass

#### Scenario: Selection circles use accent colors

- **WHEN** selection circles are displayed in edit mode
- **THEN** unselected circles use `Color.accentColor.opacity(0.3)` border
- **AND** selected circles use accent color (purple) fill with white checkmark
- **AND** selection circle tap targets maintain 44pt minimum

#### Scenario: Delete button uses glass styling

- **WHEN** the delete button is displayed in edit mode
- **THEN** the button uses `liquidGlassCapsule(variant: .tintedInteractive(.red))`
- **AND** the button is disabled when no stories are selected
- **AND** disabled state shows reduced opacity (0.5)

### Requirement: Home Navigation Controls Glass Styling

Navigation controls on the Home tab SHALL use liquid glass styling for visual consistency.

#### Scenario: View All button uses glass capsule

- **WHEN** the "View All" button is displayed in Recent Adventures section
- **THEN** it uses `liquidGlassCapsule()` instead of custom capsule fill/stroke
- **AND** the button text and icon use accent color
- **AND** the button navigates to the Story Library

#### Scenario: Manage heroes link uses glass styling

- **WHEN** the "Manage heroes" link is displayed
- **THEN** it uses subtle glass styling or remains a text link with accent color
- **AND** the link navigates to the Hero List view

#### Scenario: Hero section maintains clean styling

- **WHEN** the hero avatar horizontal scroll is displayed
- **THEN** avatars are clearly visible without excessive glass effects
- **AND** hero names remain legible below avatars
- **AND** the section integrates visually with glass-styled cards below

### Requirement: Hero Management View Navigation

The Hero Management (Hero List) view SHALL use standard iOS navigation patterns without redundant dismiss buttons.

#### Scenario: Hero List uses back navigation only

- **WHEN** the Hero List view is displayed via NavigationLink
- **THEN** the view does NOT display a "Done" button in the toolbar
- **AND** the standard back button (chevron) is used for navigation
- **AND** users can return to Home via the back button or tab bar

#### Scenario: Hero List maintains edit functionality

- **WHEN** the Hero List is displayed
- **THEN** users can still add, edit, and delete heroes
- **AND** navigation to hero editing works correctly
- **AND** returning from hero editing returns to the Hero List

