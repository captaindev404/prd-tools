# Change: Add Apple Intelligence Writing Tools

## Why

Apple Intelligence Writing Tools provide AI-powered text assistance (proofreading, rewriting, summarization) that enhances the user experience for parents creating custom story events and editing story content. With iOS 18.2 released and iOS 18.1+ now widely adopted, the app can leverage Writing Tools natively. Explicit configuration ensures optimal behavior for each text input type.

## What Changes

- **Explicit Writing Tools Configuration**: Add `.writingToolsBehavior(.complete)` to TextEditor views where AI-assisted writing is beneficial (story editing, custom event descriptions, prompt seeds)
- **Disabled for Short Inputs**: Add `.writingToolsBehavior(.disabled)` to TextFields meant for short, specific inputs (hero names, event titles, keywords, authentication) where Writing Tools would be disruptive
- **iOS 18.1+ Minimum Target**: Update deployment target from iOS 17.6 to iOS 18.1 to support Writing Tools and other modern iOS features

## Impact

- Affected specs: New `apple-intelligence` capability added to project
- Deployment target: iOS 18.1+ (up from iOS 17.6)
- Affected code:
  - `StoryEditView.swift` - Enable full Writing Tools for story content TextEditor
  - `CustomEventCreationView.swift` (BasicInfoStepView) - Configure description TextEditor
  - `CustomEventCreationView.swift` (AIEnhancementStepView) - Configure promptSeed TextEditor
  - `AvatarGenerationView.swift` - Configure custom avatar prompt TextEditor
  - `HeroVisualProfileView.swift` - Configure character description TextEditor (if present in editor)
  - `MagicalTextField.swift` - Disable for short inputs (email, password)
  - `HeroCreationView.swift` - Disable for name/appearance/ability TextFields
  - `InfiniteStories.xcodeproj/project.pbxproj` - Update IPHONEOS_DEPLOYMENT_TARGET to 18.1

## Use Cases

| View | Component | Behavior | Rationale |
|------|-----------|----------|-----------|
| StoryEditView | Content TextEditor | `.complete` | Parents benefit from proofreading/rewriting story content |
| BasicInfoStepView | Description TextEditor | `.complete` | Help parents write better event descriptions |
| AIEnhancementStepView | PromptSeed TextEditor | `.complete` | AI enhancement aligns with existing AI-enhance feature |
| AvatarGenerationView | Custom prompt TextEditor | `.complete` | Help refine avatar generation prompts |
| HeroVisualProfileView | Character description | `.complete` | Improve visual consistency descriptions |
| MagicalTextField | All TextField instances | `.disabled` | Short inputs (email, password) don't need AI |
| HeroCreationView | Name/appearance fields | `.disabled` | Preserve user's exact creative choices |
| BasicInfoStepView | Title TextField | `.disabled` | Short event titles don't need AI assistance |
| AIEnhancementStepView | Keyword TextField | `.disabled` | Keywords are brief, specific terms |

## Requirements

- **Minimum iOS Version**: iOS 18.1+
- **Apple Intelligence**: Available on iPhone 15 Pro/Pro Max, iPhone 16 series with Apple Intelligence enabled
- **Testing**: Requires physical device (Writing Tools not supported in iOS Simulator)
- **Fallback**: On devices without Apple Intelligence, text inputs function normally without Writing Tools UI
