# ios-design-system Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
