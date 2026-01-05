# Tasks: Add Apple Intelligence Writing Tools

## Implementation Order

- [ ] **1. Update iOS deployment target to 18.1**
  - Update `IPHONEOS_DEPLOYMENT_TARGET` from 17.6 to 18.1 in project.pbxproj
  - Verify all build configurations updated (Debug, Release, TestFlight, etc.)
  - Clean build folder and rebuild to confirm no compatibility issues

- [ ] **2. Configure StoryEditView for complete Writing Tools**
  - Add `.writingToolsBehavior(.complete)` to story content TextEditor (line ~77)
  - Users can proofread, rewrite, or improve story text in-place
  - Leave title TextField at default behavior (short input, no explicit config needed)

- [ ] **3. Configure CustomEventCreationView - BasicInfoStepView**
  - Add `.writingToolsBehavior(.complete)` to description TextEditor (line ~325)
  - Add `.writingToolsBehavior(.disabled)` to title TextField (line ~304)
  - Help parents write better event descriptions while keeping titles concise

- [ ] **4. Configure CustomEventCreationView - AIEnhancementStepView**
  - Add `.writingToolsBehavior(.complete)` to promptSeed TextEditor (line ~501)
  - Add `.writingToolsBehavior(.disabled)` to keyword TextField (line ~533)
  - AI writing assistance aligns with existing AI-enhance feature

- [ ] **5. Configure AvatarGenerationView**
  - Add `.writingToolsBehavior(.complete)` to customPrompt TextEditor (line ~136)
  - Help users refine avatar generation prompts with AI assistance

- [ ] **6. Configure HeroVisualProfileView (if editor contains TextEditor)**
  - Locate VisualProfileEditorView and identify character description TextEditor
  - Add `.writingToolsBehavior(.complete)` if TextEditor exists
  - Skip if no editable text fields found

- [ ] **7. Disable Writing Tools for MagicalTextField**
  - Add `.writingToolsBehavior(.disabled)` to both TextField and SecureField (lines ~33, ~27)
  - Prevents AI suggestions for email, password, and other short authentication fields

- [ ] **8. Disable Writing Tools for HeroCreationView**
  - Locate name, appearance, and specialAbility TextFields in step views
  - Add `.writingToolsBehavior(.disabled)` to preserve user's exact creative input
  - Names and character traits should remain as user intended

- [ ] **9. Test on physical device with Apple Intelligence**
  - Verify Writing Tools appear on iPhone 15 Pro+ with iOS 18.1+ and Apple Intelligence enabled
  - Test all TextEditors show full Writing Tools menu (Proofread, Rewrite, Friendly, Professional, Concise)
  - Test all disabled TextFields do NOT show Writing Tools
  - Test on device without Apple Intelligence to confirm graceful degradation
  - Document behavior and capture screenshots for validation

## Validation

- Build succeeds with iOS 18.1+ deployment target
- Writing Tools appear correctly on supported devices with Apple Intelligence
- Disabled fields do NOT show Writing Tools
- App functions normally on devices without Apple Intelligence (no UI/behavior changes)
- No compile-time or runtime errors
