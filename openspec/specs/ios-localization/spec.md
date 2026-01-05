# ios-localization Specification

## Purpose
TBD - created by archiving change add-ui-localization. Update Purpose after archive.
## Requirements
### Requirement: UI Localization Support

The iOS app MUST support full UI localization in 5 languages: English, Spanish, French, German, and Italian.

#### Scenario: Display localized UI strings based on device language

- **WHEN** user's device language is set to Spanish
- **THEN** all UI text displays in Spanish
- **AND** navigation titles are localized
- **AND** button labels are localized
- **AND** error messages are localized
- **AND** accessibility labels are localized

#### Scenario: Display localized UI for French-speaking user

- **WHEN** user's device language is French
- **THEN** home screen displays French text
- **AND** hero creation wizard shows French instructions
- **AND** story generation shows French prompts
- **AND** settings screen shows French labels

#### Scenario: Fallback to English for unsupported language

- **WHEN** user's device language is not one of the 5 supported languages
- **THEN** all UI text displays in English as fallback
- **AND** app functions normally without crashes

### Requirement: Language Override Setting

The app MUST allow users to override UI language independently of device settings.

#### Scenario: User selects specific UI language

- **WHEN** user opens Settings
- **AND** selects "UI Language" option
- **THEN** picker shows "System Default" and 5 language options
- **AND** selecting a specific language stores the preference
- **AND** app prompts user to restart for changes to take effect

#### Scenario: Match UI language with story language

- **WHEN** user has story language set to German
- **AND** user wants consistent experience
- **THEN** user can set UI language to German via Settings
- **AND** both UI and generated stories appear in German

### Requirement: Localized Strings File Structure

The app MUST use Apple's standard localization system with .lproj folders.

#### Scenario: Proper localization file organization

- **WHEN** the app is built
- **THEN** project contains en.lproj, es.lproj, fr.lproj, de.lproj, it.lproj folders
- **AND** each folder contains Localizable.strings
- **AND** each folder contains InfoPlist.strings
- **AND** strings use category-prefixed keys (e.g., "home.title")

#### Scenario: Translator comments for context

- **WHEN** translator reviews Localizable.strings
- **THEN** each string group has a comment explaining context
- **AND** placeholder strings document expected values
- **AND** character limit warnings are included where relevant

### Requirement: Dynamic String Localization

The app MUST properly localize dynamically constructed strings.

#### Scenario: Localize strings with interpolation

- **WHEN** displaying "You have 3 heroes"
- **THEN** use proper localization with format specifiers
- **AND** handle pluralization correctly per language
- **AND** string order adapts to language grammar

#### Scenario: Localize enum display names

- **WHEN** displaying CharacterTrait options (Brave, Kind, etc.)
- **THEN** each trait name is localized
- **AND** trait descriptions are localized
- **AND** StoryEvent names are localized

### Requirement: Localized Info.plist

The app MUST localize system-facing strings in Info.plist.

#### Scenario: Localized permission descriptions

- **WHEN** app requests camera permission on Spanish device
- **THEN** permission dialog shows Spanish explanation
- **AND** photo library permission shows Spanish text
- **AND** app display name shows in device language

### Requirement: Accessibility Localization

All accessibility labels and hints MUST be localized.

#### Scenario: VoiceOver reads localized content

- **WHEN** VoiceOver user navigates the app in German
- **THEN** all accessibility labels are spoken in German
- **AND** button actions are described in German
- **AND** image descriptions are localized

