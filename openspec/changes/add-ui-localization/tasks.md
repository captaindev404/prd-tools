## 1. Infrastructure Setup

- [ ] 1.1 Create localization folder structure in Xcode project
  - Add `en.lproj/`, `es.lproj/`, `fr.lproj/`, `de.lproj/`, `it.lproj/` folders
  - Create empty `Localizable.strings` in each folder
  - Configure Xcode project settings for localization
- [ ] 1.2 Add InfoPlist.strings for each language
  - Localize `CFBundleDisplayName`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- [ ] 1.3 Create localization helper utilities
  - Add `String+Localization.swift` extension for dynamic strings
  - Add `LocalizationManager.swift` for language override logic

## 2. Extract and Replace UI Strings

- [ ] 2.1 Common strings extraction
  - Extract common button labels (OK, Cancel, Done, Save, Delete, etc.)
  - Extract common states (Loading, Error, Empty, etc.)
- [ ] 2.2 Home screen localization (`ImprovedContentView.swift`, `MainTabView.swift`)
  - Hero section titles and labels
  - Story section titles
  - Tab bar labels
  - Empty state messages
- [ ] 2.3 Hero creation flow localization (`HeroCreationView.swift`)
  - Step titles and instructions
  - Trait names and descriptions
  - Appearance options
  - Validation messages
- [ ] 2.4 Story generation flow localization
  - `EnhancedEventPickerView.swift` - event names and categories
  - `HeroSelectionForStoryView.swift` - selection prompts
  - `StoryGenerationView.swift` - progress messages
- [ ] 2.5 Audio player localization (`AudioPlayerView.swift`)
  - Playback controls accessibility labels
  - Queue navigation
  - Speed settings
- [ ] 2.6 Custom events localization (`CustomEventCreationView.swift`, `CustomEventManagementView.swift`)
  - Creation wizard steps
  - Category names
  - AI enhancement prompts
- [ ] 2.7 Settings screen localization (`SettingsView.swift`)
  - Section headers
  - Option labels
  - Footer descriptions
- [ ] 2.8 Reading Journey localization (`ReadingJourneyView.swift`)
  - Statistics labels
  - Chart titles
  - Streak messages
- [ ] 2.9 Authentication flow localization (`AuthenticationView.swift`)
  - Sign in/up prompts
  - Error messages
  - Validation messages
- [ ] 2.10 Error views localization (`ErrorView.swift`, network errors)
  - Error titles and descriptions
  - Retry button labels

## 3. Model Display Names

- [ ] 3.1 Localize CharacterTrait enum display names
- [ ] 3.2 Localize StoryEvent enum display names
- [ ] 3.3 Localize age range labels

## 4. Translation

- [ ] 4.1 Complete English base strings file with translator comments
- [ ] 4.2 Translate to Spanish (es)
- [ ] 4.3 Translate to French (fr)
- [ ] 4.4 Translate to German (de)
- [ ] 4.5 Translate to Italian (it)

## 5. Settings Integration

- [ ] 5.1 Add UI language override picker in Settings
  - Options: "System Default", English, Spanish, French, German, Italian
  - Store preference in UserDefaults
- [ ] 5.2 Implement language override at app launch
  - Use `UserDefaults.appleLanguages` override technique
  - Require app restart for changes

## 6. Testing & Validation

- [ ] 6.1 Test German language (longest strings) for layout issues
- [ ] 6.2 Test with Dynamic Type (accessibility sizes)
- [ ] 6.3 Test VoiceOver with localized strings
- [ ] 6.4 Verify no hardcoded strings remain (grep audit)
- [ ] 6.5 Test language switching flow
