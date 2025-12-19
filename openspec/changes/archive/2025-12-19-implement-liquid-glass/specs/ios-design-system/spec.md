## MODIFIED Requirements

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

## ADDED Requirements

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

#### Scenario: Tab bar uses glass styling

- **GIVEN** the app displays a TabView on iOS 26+
- **WHEN** the tab bar is visible
- **THEN** the tab bar has a glass background
- **AND** tab items are clearly visible against the glass
- **AND** the selected tab indicator uses accent tint

#### Scenario: Navigation toolbar uses glass styling

- **GIVEN** a view has a `.toolbar` on iOS 26+
- **WHEN** the toolbar is rendered
- **THEN** toolbar buttons use glass effects
- **AND** multiple toolbar items are grouped in `GlassEffectContainer`

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
