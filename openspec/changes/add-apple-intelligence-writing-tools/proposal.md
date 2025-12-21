# Change: Add Apple Intelligence Writing Tools

## Why

Apple Intelligence Writing Tools provide AI-powered text assistance (proofreading, rewriting, summarization) that enhances the user experience for parents creating custom story events and editing story content. The app already uses TextEditor and TextField components that automatically gain Writing Tools support on iOS 18.1+, but explicit configuration ensures optimal behavior for the app's specific use cases.

## What Changes

- **Explicit Writing Tools Configuration**: Add `.writingToolsBehavior(.complete)` to TextEditor views where AI-assisted writing is beneficial (story editing, custom event descriptions, prompt seeds)
- **Disabled for Short Inputs**: Add `.writingToolsBehavior(.disabled)` to TextFields meant for short, specific inputs (hero names, event titles, keywords) where Writing Tools would be disruptive
- **iOS Version Handling**: Use `@available` checks to apply modifiers only on iOS 18.1+, maintaining backward compatibility with iOS 17.6

## Impact

- Affected specs: `ios-integration` (new capability for Apple Intelligence)
- Affected code:
  - `CustomEventCreationView.swift` - Configure Writing Tools for description and promptSeed TextEditors
  - `StoryEditView.swift` - Enable full Writing Tools for story content editing
  - `HeroVisualProfileView.swift` - Configure for custom prompts
  - `AvatarGenerationView.swift` - Configure for custom avatar prompts
  - `PictogramGenerationView.swift` - Configure for custom pictogram prompts
  - `MagicalTextField.swift` - Disable Writing Tools (short inputs)
  - `HeroCreationView.swift` - Disable for name/appearance fields

## Use Cases

| View | Component | Behavior | Rationale |
|------|-----------|----------|-----------|
| StoryEditView | Content TextEditor | `.complete` | Users benefit from proofreading/rewriting story content |
| CustomEventCreationView | Description TextEditor | `.complete` | Help parents write better event descriptions |
| CustomEventCreationView | PromptSeed TextEditor | `.complete` | AI enhancement aligns with existing AI-enhance feature |
| AvatarGenerationView | Custom prompt | `.limited` | Pop-up results for image prompts |
| MagicalTextField | All instances | `.disabled` | Short inputs (email, password) |
| HeroCreationView | Name/appearance | `.disabled` | Names should remain as user intended |

## Device Requirements

- iOS 18.1 or later
- iPhone 15 Pro or newer (Apple Silicon)
- Apple Intelligence enabled in Settings
- Testing requires physical device (not supported in Simulator)
