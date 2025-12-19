# Tasks: Refine Library UI and Home Controls

## 1. Library Search Bar
- [x] 1.1 Update search bar background from `Color(.secondarySystemBackground)` to `liquidGlassCard(cornerRadius: 12)`
- [x] 1.2 Remove manual shadow styling (glass effect provides visual depth)
- [x] 1.3 Test search bar appearance in both light and dark modes

## 2. Library Edit Mode Toolbar
- [x] 2.1 Replace `.ultraThinMaterial` background with glass styling using `liquidGlassBackground()`
- [x] 2.2 Update toolbar padding and spacing for glass container
- [x] 2.3 Apply `.liquidGlassCapsule(variant: .tintedInteractive(.red))` to delete button
- [x] 2.4 Update "Select All/Deselect All" button with glass styling

## 3. Selection Circle Component
- [x] 3.1 Update unselected state border to use `Color.accentColor.opacity(0.3)` instead of gray
- [x] 3.2 Update selected state to use accent color (or purple) with subtle glass overlay
- [x] 3.3 Add subtle glass background to the selection circle frame

## 4. Home Page Navigation Controls
- [x] 4.1 Update "View All" button to use `liquidGlassCapsule()` instead of custom capsule fill/stroke
- [x] 4.2 Update "Manage heroes" link to use subtle glass styling
- [x] 4.3 Wrap hero avatar horizontal scroll in subtle glass container (optional enhancement)

## 5. Hero Management View
- [x] 5.1 Remove Done button from HeroListView toolbar
- [x] 5.2 Ensure back navigation still works correctly via NavigationStack

## 6. Verification and Testing
- [x] 6.1 Verify all stat cards use consistent `liquidGlassCard` variant
- [x] 6.2 Verify filter pills use consistent `liquidGlassCapsule` styling
- [x] 6.3 Test Library view in light mode
- [x] 6.4 Test Library view in dark mode
- [x] 6.5 Test edit mode selection and deletion flow
- [x] 6.6 Test Home page controls navigation
- [x] 6.7 Test Hero Management view back navigation (no Done button)
- [x] 6.8 Verify accessibility (VoiceOver, Dynamic Type) not impacted
