## 1. Infrastructure Setup

- [x] 1.1 Create localization folder structure in Xcode project
  - Created `Localizable.xcstrings` String Catalog (Xcode 15+ modern approach) under `InfiniteStories/`
  - Added languages: en (base), es, fr, de, it
  - Configured Xcode project settings for localization (added languages in Project > Info > Localizations)
- [x] 1.2 Add InfoPlist.strings for each language
  - Created `InfoPlist.xcstrings` for `CFBundleDisplayName`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSMicrophoneUsageDescription`
- [x] 1.3 Create localization helper utilities
  - Added `Utilities/String+Localization.swift` extension for dynamic strings
  - Added `Utilities/LocalizationManager.swift` for language override logic

## 2. Extract and Replace UI Strings (~330 strings across 33 files)

### 2.1 Common Components (`Views/Components/`)
- [x] 2.1.1 `ErrorView.swift` - Error titles, messages, button labels (~15 strings)
  - "No Internet Connection", "Session Expired", "Access Denied", etc.
  - "Try Again", "Sign In Again" buttons
- [x] 2.1.2 `NetworkRequiredView.swift` - Offline message (~2 strings)
- [x] 2.1.3 `StoryCard.swift` - Story display labels (~6 strings)
  - Context menu actions, hero label, badge, date formatting, regenerating audio
  - Added 15+ localized strings for story card interactions
- [x] 2.1.4 `IllustrationLoadingView.swift` - Loading states (~9 strings)
  - Generating scene, creating illustration, error states, empty states, retry button
- [x] 2.1.5 `IllustrationPlaceholderView.swift` - Placeholder text (27 strings)
  - Error types (network, invalidPrompt, rateLimit, apiError, timeout, fileSystem, unknown)
  - User-friendly messages, short messages, scene indicators, retry button
- [x] 2.1.6 `IllustrationCarouselView.swift`, `IllustrationSyncView.swift` - Navigation (9 strings)
  - Tap to seek hint, jumping to timestamp, scene labels, empty states, next scene indicator

### 2.2 Navigation (`MainTabView.swift`, `ImprovedContentView.swift`)
- [x] 2.2.1 `MainTabView.swift` - Tab titles in `AppTab` enum
  - "Home", "Library", "Heroes", "Journey", "Settings"
- [x] 2.2.2 `ImprovedContentView.swift` (HomeContentView) - Home screen (37 strings)
  - Section titles, loading states, empty state messages, heroes section, journey button, settings, errors, favorites, library link

### 2.3 Hero Creation Flow (`Views/HeroCreation/`, `Views/HeroManagement/`, `Views/HeroDisplay/`)
- [x] 2.3.1 `HeroCreationView.swift` - Creation wizard (38 strings)
  - Navigation buttons, step titles, trait questions, appearance/special ability forms, preview card, avatar prompt dialog
- [x] 2.3.2 `HeroListView.swift` - Hero list (25 strings)
  - Loading states, navigation, delete confirmation, create button, empty state, story count, action buttons
- [ ] 2.3.3 `HeroVisualProfileView.swift` - Visual profile management (~45 strings) - NOT YET LOCALIZED
- [ ] 2.3.4 `AdaptiveHeroGridView.swift` - Hero grid display (~20 strings) - NOT YET LOCALIZED

### 2.4 Avatar Generation (`Views/AvatarGeneration/`)
- [ ] 2.4.1 `AvatarGenerationView.swift` - Avatar generation UI (~30 strings) - NOT YET LOCALIZED

### 2.5 Story Generation Flow (`Views/StoryGeneration/`)
- [x] 2.5.1 `StoryGenerationView.swift` - Generation progress (28 strings)
  - Title, subtitle, adventure prompt, visual options, step labels, progress indicators, buttons, status messages
- [x] 2.5.2 `EnhancedEventPickerView.swift` - Event selection (17 strings)
  - Search, custom event creation, category filters, loading states, empty states, delete confirmation
- [x] 2.5.3 `HeroSelectionForStoryView.swift` - Hero picker (6 strings)
  - Loading, navigation, header, subtitle, story count (singular/plural)
- [x] 2.5.4 `IllustrationGenerationProgressView.swift` - Illustration progress (13 strings)
  - Title, subtitle, progress percentage, count, completion messages, error states, action buttons

### 2.6 Story Library (`Views/StoryLibrary/`)
- [x] 2.6.1 `ImprovedStoryLibraryView.swift` - Library view (35+ strings)
  - Navigation, search, statistics, filters, loading states, selection/deletion prompts, empty states

### 2.7 Story Editing (`Views/StoryEdit/`)
- [x] 2.7.1 `StoryEditView.swift` - Edit story titles/content (18 strings)
  - Title/content labels and placeholders, formatting tips, auto-format button, save/cancel/discard buttons, alerts

### 2.8 Audio Playback (`Views/AudioPlayer/`, `Views/AudioRegeneration/`)
- [x] 2.8.1 `AudioPlayerView.swift` - Player controls (48+ strings)
  - Playback controls, speed settings, queue navigation, error messages, export functionality, accessibility labels, metadata
- [x] 2.8.2 `AudioRegenerationView.swift` - Regeneration UI (15 strings)
  - Status messages, progress indicators, action buttons, alert dialogs

### 2.9 Custom Events (`Views/CustomEvents/`)
- [x] 2.9.1 `CustomEventCreationView.swift` - Creation wizard (43 strings)
  - Navigation buttons, step titles, form labels/placeholders/hints, error messages, example descriptions
- [x] 2.9.2 `CustomEventManagementView.swift` - Event list (35 strings)
  - Navigation, search, filters, sort options, stats, swipe actions, context menus, toolbar items, empty state
- [x] 2.9.3 `CustomEventDetailView.swift` - Event details (26 strings)
  - Section headers, field labels, action buttons, alerts, toolbar items
- [x] 2.9.4 `PictogramGenerationView.swift` - Pictogram UI (4 strings)
  - Title, coming soon message, navigation title, close button

### 2.10 Settings (`Views/Settings/`)
- [x] 2.10.1 `SettingsView.swift` (SettingsTabContent + SettingsView) - Key settings (~80 strings)
  - Section headers: "Theme", "Story Preferences", "Illustrations", "Debug Controls", "Advanced", "App Info"
  - Labels: "Appearance", "Story Length", "Voice", "Language", etc.
  - Footer descriptions and button labels

### 2.11 Reading Journey (`Views/ReadingJourney/`)
- [x] 2.11.1 `ReadingJourneyView.swift` - Statistics dashboard (30 strings)
  - Navigation, loading, statistics cards, listening activity, hero performance, milestones, recent activity, favorite stories, reading insights, share text, date formatting

### 2.12 Authentication (`Views/Auth/`)
- [x] 2.12.1 `AuthenticationView.swift` - Sign in/up flow (~5 strings)
  - App title, sign in/up buttons, form field placeholders
  - Error messages (invalid credentials, network, user exists, etc.)
  - Added 15+ localized strings for authentication flow

## 3. Model Display Names (`Models/`)

- [x] 3.1 Localize `CharacterTrait` enum in `CharacterTraits.swift`
  - Added `localizedName` and `localizedDescription` properties
  - Trait names: Brave, Kind, Curious, Funny, Smart, Adventurous, Creative, Helpful, Gentle, Magical
  - Trait descriptions (10 strings) - translated to all 5 languages
- [x] 3.2 Localize `StoryEvent` enum in `CharacterTraits.swift`
  - Added `localizedName` property
  - Event names: Bedtime Adventure, School Day Fun, Birthday Celebration, etc. (10 strings) - translated to all 5 languages
- [ ] 3.3 Localize age range labels (if applicable)

## 4. Translation

- [x] 4.1 Complete English base strings file with translator comments
  - Created `Localizable.xcstrings` with ~650+ strings across all categories
  - Categories: common.*, tabs.*, error.*, network.*, settings.*, model.trait.*, model.event.*, auth.*, story.*, hero.*, illustration.*, library.*, audio.*, customEvent.*, home.*, journey.*, date.*
  - Added context comments for each string with clear descriptions
- [x] 4.2 Translate to Spanish (es) - Completed in xcstrings catalog
- [x] 4.3 Translate to French (fr) - Completed in xcstrings catalog
- [x] 4.4 Translate to German (de) - Completed in xcstrings catalog
- [x] 4.5 Translate to Italian (it) - Completed in xcstrings catalog

## 5. Settings Integration

- [x] 5.1 Add UI language override picker in Settings
  - Added new "App Language" section in `SettingsView.swift` / `SettingsTabContent`
  - Options: "System Default", English, Español, Français, Deutsch, Italiano
  - Store preference in UserDefaults via `LocalizationManager`
- [x] 5.2 Implement language override at app launch
  - Modified `InfiniteStoriesApp.swift` to call `LocalizationManager.shared.applyLanguageOverrideAtLaunch()`
  - Uses `UserDefaults.AppleLanguages` override technique
  - Shows restart prompt when user changes language

## 6. Testing & Validation

- [ ] 6.1 Test German language (longest strings) for layout truncation
- [ ] 6.2 Test with Dynamic Type (accessibility sizes) in all languages
- [ ] 6.3 Test VoiceOver with localized accessibility labels
- [ ] 6.4 Audit for remaining hardcoded strings
  - Run: `grep -r "Text(\"" infinite-stories-ios/InfiniteStories/ --include="*.swift"`
  - Exclude: Preview code, test files
- [ ] 6.5 Test language switching flow end-to-end
- [ ] 6.6 Verify pluralization rules work correctly (e.g., "1 hero" vs "3 heroes")

---

## Implementation Notes

### String Catalog Approach (Xcode 15+)
Instead of traditional `.strings` files with separate `.lproj` folders, this implementation uses modern **String Catalogs** (`.xcstrings`):
- `Localizable.xcstrings` - Main UI strings
- `InfoPlist.xcstrings` - Info.plist localization

Benefits:
- All translations in a single JSON file per catalog
- Built-in validation and export/import
- Auto-extraction support for `Text()` and `String(localized:)`
- Xcode provides visual editor with translation states

### Key Files Created/Modified
1. `Localizable.xcstrings` - ~650+ strings with 5 languages (MASSIVE expansion from parallel agent work)
2. `InfoPlist.xcstrings` - App name and permission strings
3. `String+Localization.swift` - Helper extension
4. `LocalizationManager.swift` - Language override manager
5. `CharacterTraits.swift` - Added `localizedName`/`localizedDescription`
6. `MainTabView.swift` - Tab bar localized
7. `ErrorView.swift` - Error messages localized
8. `NetworkRequiredView.swift` - Offline view localized
9. `SettingsView.swift` - Language picker section
10. `InfiniteStoriesApp.swift` - Language override at launch
11. `AuthenticationView.swift` - Auth flow localized (15 strings)
12. `StoryCard.swift` - Story cards localized (15 strings)
13. `IllustrationLoadingView.swift` - Illustration loading states (9 strings)
14. `IllustrationPlaceholderView.swift` - Error placeholders (27 strings)
15. `IllustrationCarouselView.swift` - Carousel UI (7 strings)
16. `IllustrationSyncView.swift` - Sync UI (2 strings)
17. `ImprovedContentView.swift` - Home screen (37 strings)
18. `HeroCreationView.swift` - Hero wizard (38 strings)
19. `HeroListView.swift` - Hero list (25 strings)
20. `StoryGenerationView.swift` - Story generation (28 strings)
21. `EnhancedEventPickerView.swift` - Event picker (17 strings)
22. `HeroSelectionForStoryView.swift` - Hero selection (6 strings)
23. `IllustrationGenerationProgressView.swift` - Illustration progress (13 strings)
24. `ImprovedStoryLibraryView.swift` - Story library (35+ strings)
25. `StoryEditView.swift` - Story editor (18 strings)
26. `AudioPlayerView.swift` - Audio player (48+ strings)
27. `AudioRegenerationView.swift` - Audio regeneration (15 strings)
28. `CustomEventCreationView.swift` - Event creation (43 strings)
29. `CustomEventManagementView.swift` - Event management (35 strings)
30. `CustomEventDetailView.swift` - Event details (26 strings)
31. `PictogramGenerationView.swift` - Pictogram (4 strings)
32. `ReadingJourneyView.swift` - Reading journey (30 strings)
