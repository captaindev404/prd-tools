## Context

InfiniteStories targets international families with children. The app already supports 5 languages for AI-generated story content (via PromptLocalizer), but the UI remains English-only. This creates a fragmented user experience where parents selecting Spanish stories still navigate an English interface.

### Stakeholders
- International users (parents with children)
- Translators/localization team
- iOS development team

### Constraints
- Must use Apple's standard localization system for App Store compliance
- Story language setting must remain independent from device/UI language
- Translations must be child-friendly and family-appropriate
- Must support Dynamic Type and accessibility

## Goals / Non-Goals

### Goals
- Localize all user-facing UI strings into 5 languages
- Allow UI language to follow device language OR match story language preference
- Maintain consistency with existing AI content localization (same terminology)
- Support future language additions with minimal code changes
- Enable XLIFF export for professional translation workflows

### Non-Goals
- RTL language support (Arabic, Hebrew) - out of scope for V1
- Localized images or illustrations
- Server-side localization (backend already handles this)
- Voice-over audio localization (handled by TTS model)

## Decisions

### Decision 1: Use SwiftUI LocalizedStringKey
- SwiftUI's `Text()` automatically uses `LocalizedStringKey` for string literals
- Use `String(localized:)` for dynamic/computed strings
- Avoid NSLocalizedString for new code (SwiftUI-first approach)

### Decision 2: Flat Localizable.strings Structure
- Use flat key structure with category prefixes: `"home.heroSection.title" = "Your Heroes";`
- Avoids complexity of stringsdict for most strings
- Use stringsdict only for pluralization cases

### Decision 3: Language Override Setting
- Add "UI Language" option in Settings: "System Default" or specific language
- Store in UserDefaults as `uiLanguageOverride`
- When set, override `Bundle.main` language at app launch
- This allows matching UI language with story language preference

### Alternatives Considered
1. **Bundle.localizedString only**: Simpler but loses SwiftUI automatic localization benefits
2. **Separate localization framework (Lokalise SDK)**: Adds dependency, overkill for 5 languages
3. **Inline translations in code**: Unmaintainable, rejected

## String Categories

| Category Prefix | Description | Estimated Count |
|-----------------|-------------|-----------------|
| `common.*` | Buttons, labels (OK, Cancel, Done, Loading, etc.) | ~25 |
| `home.*` | Home screen, hero section, stories (ImprovedContentView) | ~16 |
| `hero.*` | Hero creation, traits, appearance, visual profile | ~49 |
| `story.*` | Story generation, events, library, edit | ~45 |
| `audio.*` | Audio player, controls, regeneration | ~19 |
| `settings.*` | Settings screen (SettingsView, SettingsTabContent) | ~80 |
| `custom.*` | Custom events creation, management, pictograms | ~21 |
| `journey.*` | Reading journey, statistics, charts | ~15 |
| `auth.*` | Authentication, sign in/up | ~5 |
| `error.*` | Error messages, network errors | ~17 |
| `illustration.*` | Illustration loading, placeholders, carousel | ~24 |
| `tabs.*` | Tab bar titles (Home, Library, Heroes, Journey, Settings) | ~5 |
| `model.*` | CharacterTrait names/descriptions, StoryEvent names | ~30 |
| **Total** | | ~330 |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Translation quality varies | Use professional translators familiar with children's apps |
| Context missing for translators | Add translator comments in .strings files |
| String length varies by language | Test UI in German (typically longest) to ensure no truncation |
| Dynamic strings miss localization | Code review checklist item, unit tests for localized strings |

## Migration Plan

### Phase 1: Infrastructure
1. Add .lproj folders to Xcode project
2. Create Localizable.strings with English base
3. Add localization helper extensions

### Phase 2: String Extraction
1. Extract strings by view category
2. Replace hardcoded strings with localized keys
3. Add translator comments for context

### Phase 3: Translation
1. Export XLIFF files
2. Translate (or provide to translation service)
3. Import translated XLIFF files
4. Review in-app

### Phase 4: Testing & Polish
1. Test each language for truncation/layout issues
2. Verify accessibility with VoiceOver
3. Test Dynamic Type with localized strings

### Rollback
- Feature flag `enableUILocalization` to show English-only if issues discovered
- Translations are additive, can revert to English strings

## Open Questions

1. ~~Should UI language follow device language or story language?~~ **Resolved**: User choice via Settings
2. ~~Professional translation or community translation?~~ **Resolved**: Professional for launch, community for updates
