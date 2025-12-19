## ADDED Requirements

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
