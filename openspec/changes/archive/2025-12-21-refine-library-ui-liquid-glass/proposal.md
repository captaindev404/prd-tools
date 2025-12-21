# Change: Refine Library UI and Home Controls with Liquid Glass

## Why

The Story Library view and Home page controls have inconsistent styling compared to the liquid glass design system implemented for the tab bar and story cards. Specifically:

1. **Library view** uses mixed styling - some components use `liquidGlassCard` but others use legacy solid backgrounds
2. **Edit mode** in the Library uses plain `.ultraThinMaterial` instead of proper glass styling
3. **Home page navigation controls** (View All button, Manage heroes link) use old capsule styles instead of liquid glass

This creates visual inconsistency and doesn't follow the "glass floats on content" design philosophy established in the ios-design-system spec.

## What Changes

### Library View (`ImprovedStoryLibraryView.swift`)
- **Story cards**: Already use `liquidGlassCard` - verify consistency
- **Search bar**: Update background from `Color(.secondarySystemBackground)` to glass styling
- **Stats cards**: Already use `liquidGlassCard` - verify correct variant
- **Filter pills**: Already use `liquidGlassCapsule` - verify styling
- **Edit mode toolbar**: Replace `.ultraThinMaterial` with proper glass background
- **Selection circles**: Update to use accent color and glass styling
- **Delete button**: Replace solid red with glass tinted styling

### Home Page (`ImprovedContentView.swift`)
- **"View All" button**: Replace custom capsule with `liquidGlassCapsule`
- **"Manage heroes" link**: Add subtle glass styling
- **"Journey" button**: Already uses `liquidGlassCapsule` - verify consistency
- **Hero avatar row**: Add subtle glass container background

### Edit Mode Components
- **EditModeToolbar**: Apply glass background instead of `.ultraThinMaterial`
- **SelectionCircle**: Update colors to match accent and glass styling
- **Delete button**: Use `liquidGlassCapsule` with tinted red variant

### Hero Management View
- **Done button**: Remove redundant Done button - use back navigation instead

## Impact

### Affected Specs
- `ios-design-system` - MODIFIED: Add requirements for Library-specific glass styling and edit mode glass components

### Affected Code
- `Views/StoryLibrary/ImprovedStoryLibraryView.swift` - Update search bar, edit mode toolbar, selection circles
- `ImprovedContentView.swift` - Update View All button, Manage heroes link, hero section
- `Views/HeroList/HeroListView.swift` - Remove Done button from toolbar

### Non-Breaking
- Visual refinement only
- No functionality changes
- No data model changes
- Accessibility features preserved
