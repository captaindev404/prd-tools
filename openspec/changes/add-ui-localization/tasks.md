## 1. Infrastructure Setup

- [ ] 1.1 Create localization folder structure in Xcode project
  - Add `en.lproj/`, `es.lproj/`, `fr.lproj/`, `de.lproj/`, `it.lproj/` folders under `InfiniteStories/`
  - Create empty `Localizable.strings` in each folder
  - Configure Xcode project settings for localization (add languages in Project > Info > Localizations)
- [ ] 1.2 Add InfoPlist.strings for each language
  - Localize `CFBundleDisplayName`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- [ ] 1.3 Create localization helper utilities
  - Add `Utilities/String+Localization.swift` extension for dynamic strings
  - Add `Utilities/LocalizationManager.swift` for language override logic

## 2. Extract and Replace UI Strings (~330 strings across 33 files)

### 2.1 Common Components (`Views/Components/`)
- [ ] 2.1.1 `ErrorView.swift` - Error titles, messages, button labels (~15 strings)
  - "No Internet Connection", "Session Expired", "Access Denied", etc.
  - "Try Again", "Sign In Again" buttons
- [ ] 2.1.2 `NetworkRequiredView.swift` - Offline message (~2 strings)
- [ ] 2.1.3 `StoryCard.swift` - Story display labels (~6 strings)
- [ ] 2.1.4 `IllustrationLoadingView.swift` - Loading states (~9 strings)
- [ ] 2.1.5 `IllustrationPlaceholderView.swift` - Placeholder text (~4 strings)
- [ ] 2.1.6 `IllustrationCarouselView.swift`, `IllustrationSyncView.swift` - Navigation (~11 strings)

### 2.2 Navigation (`MainTabView.swift`, `ImprovedContentView.swift`)
- [ ] 2.2.1 `MainTabView.swift` - Tab titles in `AppTab` enum
  - "Home", "Library", "Heroes", "Journey", "Settings"
- [ ] 2.2.2 `ImprovedContentView.swift` (HomeContentView) - Home screen (~16 strings)
  - Section titles, loading states, empty state messages

### 2.3 Hero Creation Flow (`Views/HeroCreation/`, `Views/HeroManagement/`, `Views/HeroDisplay/`)
- [ ] 2.3.1 `HeroCreationView.swift` - Creation wizard (~21 strings)
  - Step titles, trait descriptions, appearance options, validation messages
- [ ] 2.3.2 `HeroListView.swift` - Hero list (~9 strings)
- [ ] 2.3.3 `HeroVisualProfileView.swift` - Visual profile management (~11 strings)
- [ ] 2.3.4 `AdaptiveHeroGridView.swift` - Hero grid display (~8 strings)

### 2.4 Avatar Generation (`Views/AvatarGeneration/`)
- [ ] 2.4.1 `AvatarGenerationView.swift` - Avatar generation UI (~9 strings)

### 2.5 Story Generation Flow (`Views/StoryGeneration/`)
- [ ] 2.5.1 `StoryGenerationView.swift` - Generation progress (~17 strings)
- [ ] 2.5.2 `EnhancedEventPickerView.swift` - Event selection (~10 strings)
- [ ] 2.5.3 `HeroSelectionForStoryView.swift` - Hero picker (~3 strings)
- [ ] 2.5.4 `IllustrationGenerationProgressView.swift` - Illustration progress (~13 strings)

### 2.6 Story Library (`Views/StoryLibrary/`)
- [ ] 2.6.1 `ImprovedStoryLibraryView.swift` - Library view (~9 strings)

### 2.7 Story Editing (`Views/StoryEdit/`)
- [ ] 2.7.1 `StoryEditView.swift` - Edit story titles/content (~6 strings)

### 2.8 Audio Playback (`Views/AudioPlayer/`, `Views/AudioRegeneration/`)
- [ ] 2.8.1 `AudioPlayerView.swift` - Player controls (~16 strings)
  - Playback controls, speed settings, queue navigation
- [ ] 2.8.2 `AudioRegenerationView.swift` - Regeneration UI (~3 strings)

### 2.9 Custom Events (`Views/CustomEvents/`)
- [ ] 2.9.1 `CustomEventCreationView.swift` - Creation wizard (~13 strings)
- [ ] 2.9.2 `CustomEventManagementView.swift` - Event list (~4 strings)
- [ ] 2.9.3 `CustomEventDetailView.swift` - Event details (~2 strings)
- [ ] 2.9.4 `PictogramGenerationView.swift` - Pictogram UI (~2 strings)

### 2.10 Settings (`Views/Settings/`)
- [ ] 2.10.1 `SettingsView.swift` (SettingsTabContent + SettingsView) - All settings (~80 strings)
  - Section headers: "Theme", "Story Preferences", "Illustrations", "Debug Controls", "Advanced", "App Info"
  - Labels: "Appearance", "Story Length", "Voice", "Language", etc.
  - Footer descriptions and button labels

### 2.11 Reading Journey (`Views/ReadingJourney/`)
- [ ] 2.11.1 `ReadingJourneyView.swift` - Statistics dashboard (~15 strings)
  - Chart titles, streak messages, statistics labels

### 2.12 Authentication (`Views/Auth/`)
- [ ] 2.12.1 `AuthenticationView.swift` - Sign in/up flow (~5 strings)

## 3. Model Display Names (`Models/`)

- [ ] 3.1 Localize `CharacterTrait` enum in `CharacterTraits.swift`
  - Trait names: Brave, Kind, Curious, Funny, Smart, Adventurous, Creative, Helpful, Gentle, Magical
  - Trait descriptions (10 strings)
- [ ] 3.2 Localize `StoryEvent` enum in `CharacterTraits.swift`
  - Event names: Bedtime Adventure, School Day Fun, Birthday Celebration, etc. (10 strings)
- [ ] 3.3 Localize age range labels (if applicable)

## 4. Translation

- [ ] 4.1 Complete English base strings file with translator comments
  - Group strings by category prefix (common.*, home.*, hero.*, story.*, audio.*, settings.*, custom.*, journey.*, auth.*, error.*)
  - Add context comments for each string group
- [ ] 4.2 Translate to Spanish (es) - ~330 strings
- [ ] 4.3 Translate to French (fr) - ~330 strings
- [ ] 4.4 Translate to German (de) - ~330 strings
- [ ] 4.5 Translate to Italian (it) - ~330 strings

## 5. Settings Integration

- [ ] 5.1 Add UI language override picker in Settings
  - Add new section in `SettingsView.swift` / `SettingsTabContent`
  - Options: "System Default", English, Spanish, French, German, Italian
  - Store preference in UserDefaults as `uiLanguageOverride`
- [ ] 5.2 Implement language override at app launch
  - Modify `InfiniteStoriesApp.swift` to check and apply override
  - Use `UserDefaults.appleLanguages` override technique
  - Show restart prompt when user changes language

## 6. Testing & Validation

- [ ] 6.1 Test German language (longest strings) for layout truncation
- [ ] 6.2 Test with Dynamic Type (accessibility sizes) in all languages
- [ ] 6.3 Test VoiceOver with localized accessibility labels
- [ ] 6.4 Audit for remaining hardcoded strings
  - Run: `grep -r "Text(\"" infinite-stories-ios/InfiniteStories/ --include="*.swift"`
  - Exclude: Preview code, test files
- [ ] 6.5 Test language switching flow end-to-end
- [ ] 6.6 Verify pluralization rules work correctly (e.g., "1 hero" vs "3 heroes")
