# Tasks: Add Apple Intelligence Writing Tools

## Implementation Order

- [ ] **1. Create WritingToolsBehavior extension for backward compatibility**
  - Create helper extension that applies `.writingToolsBehavior` only on iOS 18.1+
  - Use `@available(iOS 18.1, *)` checks with graceful fallback
  - Location: `Utilities/WritingToolsModifier.swift`

- [ ] **2. Configure StoryEditView for complete Writing Tools**
  - Add `.writingToolsBehavior(.complete)` to story content TextEditor
  - Users can proofread, rewrite, or improve story text in-place
  - Keep title TextField as default (short input)

- [ ] **3. Configure CustomEventCreationView TextEditors**
  - Add `.complete` to description TextEditor (BasicInfoStepView)
  - Add `.complete` to promptSeed TextEditor (AIEnhancementStepView)
  - Disable for title TextField and keyword TextField

- [ ] **4. Configure AvatarGenerationView**
  - Add `.limited` to custom prompt TextEditor
  - Pop-up results appropriate for image generation prompts

- [ ] **5. Configure PictogramGenerationView**
  - Add `.limited` to custom prompt TextEditor
  - Consistent with avatar generation pattern

- [ ] **6. Configure HeroVisualProfileView**
  - Add `.limited` to character description TextEditor
  - Visual consistency descriptions benefit from suggestions

- [ ] **7. Disable Writing Tools for short input fields**
  - Add `.disabled` to MagicalTextField component
  - Add `.disabled` to hero name/appearance TextFields in HeroCreationView
  - Prevents disruptive AI suggestions for names, emails, passwords

- [ ] **8. Test on physical device**
  - Verify Writing Tools appear on supported devices (iPhone 15 Pro+)
  - Confirm graceful degradation on older devices
  - Test all configured views work as expected
  - Document any limitations or issues

## Validation

- Build succeeds on iOS 17.6+ targets
- Writing Tools appear on iOS 18.1+ devices with Apple Intelligence enabled
- App functions normally on devices without Apple Intelligence
- No runtime crashes from availability checks
