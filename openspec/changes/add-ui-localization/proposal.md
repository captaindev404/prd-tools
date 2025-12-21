# Change: Add UI Localization for 5 Languages

## Why

The app already generates AI story content in 5 languages (English, Spanish, French, German, Italian) via PromptLocalizer and ContentPolicyFilter, but all UI strings are hardcoded in English. Users selecting non-English story languages experience a jarring disconnect between the English interface and their native language content. Full localization will provide a cohesive experience for international users.

## What Changes

- Add iOS localization infrastructure with `.lproj` folders for 5 languages
- Create `Localizable.strings` files with all UI text translations
- Replace ~300+ hardcoded `Text()` and string literals with `LocalizedStringKey`
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
- Affected code:
  - All Views in `Views/` directory (~20 files)
  - `ImprovedContentView.swift`
  - `MainTabView.swift`
  - `InfiniteStoriesApp.swift`
  - `Models/CharacterTrait.swift`, `StoryEvent.swift` (enum display names)
  - `Utilities/` (add localization helpers)
  - Xcode project configuration
- New files:
  - `en.lproj/Localizable.strings`
  - `es.lproj/Localizable.strings`
  - `fr.lproj/Localizable.strings`
  - `de.lproj/Localizable.strings`
  - `it.lproj/Localizable.strings`
  - `en.lproj/InfoPlist.strings` (and for each language)
