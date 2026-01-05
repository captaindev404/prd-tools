# Change: Add UI Localization for 5 Languages

## Why

The app already generates AI story content in 5 languages (English, Spanish, French, German, Italian) via PromptLocalizer and ContentPolicyFilter, but all UI strings are hardcoded in English. Users selecting non-English story languages experience a jarring disconnect between the English interface and their native language content. Full localization will provide a cohesive experience for international users.

## What Changes

- Add iOS localization infrastructure with `.lproj` folders for 5 languages
- Create `Localizable.strings` files with all UI text translations
- Replace ~330 hardcoded `Text()` strings across 33 Swift files with `LocalizedStringKey`
- Add `String.localizedStringKey` extension for dynamic strings
- Configure Xcode project for localization exports (XLIFF support)
- Add language override option in Settings to match UI language with story language
- Localize Info.plist strings (app name, permission descriptions)

### Languages

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| es | Spanish | Espa??ol |
| fr | French | Fran??ais |
| de | German | Deutsch |
| it | Italian | Italiano |

## Impact

- Affected specs: `ios-design-system`, `ios-integration`
- Affected code (33 Swift files):
  - `MainTabView.swift` - AppTab enum titles
  - `ImprovedContentView.swift` - Home screen content
  - `InfiniteStoriesApp.swift` - Language override at launch
  - `Views/Components/` - ErrorView, NetworkRequiredView, StoryCard, Illustration views (7 files)
  - `Views/HeroCreation/` - HeroCreationView (1 file)
  - `Views/HeroManagement/` - HeroListView, HeroVisualProfileView (2 files)
  - `Views/HeroDisplay/` - AdaptiveHeroGridView (2 files)
  - `Views/AvatarGeneration/` - AvatarGenerationView (1 file)
  - `Views/StoryGeneration/` - StoryGenerationView, EnhancedEventPickerView, etc. (4 files)
  - `Views/StoryLibrary/` - ImprovedStoryLibraryView (1 file)
  - `Views/StoryEdit/` - StoryEditView (1 file)
  - `Views/AudioPlayer/` - AudioPlayerView (1 file)
  - `Views/AudioRegeneration/` - AudioRegenerationView (1 file)
  - `Views/CustomEvents/` - CustomEventCreationView, etc. (4 files)
  - `Views/Settings/` - SettingsView, SettingsTabContent (1 file)
  - `Views/ReadingJourney/` - ReadingJourneyView (1 file)
  - `Views/Auth/` - AuthenticationView (1 file)
  - `Models/CharacterTraits.swift` - CharacterTrait and StoryEvent enums
  - `Utilities/` - Add String+Localization.swift, LocalizationManager.swift
- New files:
  - `en.lproj/Localizable.strings`, `es.lproj/Localizable.strings`, `fr.lproj/Localizable.strings`, `de.lproj/Localizable.strings`, `it.lproj/Localizable.strings`
  - `en.lproj/InfoPlist.strings` (and for each language)
