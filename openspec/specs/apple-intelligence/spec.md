# apple-intelligence Specification

## Purpose
TBD - created by archiving change add-apple-intelligence-writing-tools. Update Purpose after archive.
## Requirements
### Requirement: Writing Tools Configuration

The app MUST configure Apple Intelligence Writing Tools appropriately for each text input component based on its purpose.

#### Scenario: Story content editing enables full Writing Tools
- **Given** a user is editing story content in StoryEditView on iOS 18.1+
- **When** they select text in the content TextEditor
- **Then** Writing Tools options (Proofread, Rewrite, Friendly, Professional, Concise) appear
- **And** selecting an option replaces text in-place with animation

#### Scenario: Event description supports Writing Tools
- **Given** a user is creating a custom event in CustomEventCreationView BasicInfoStepView
- **When** they enter text in the description TextEditor
- **Then** Writing Tools are available to help improve the description
- **And** full Writing Tools menu appears on text selection

#### Scenario: AI enhancement prompt supports Writing Tools
- **Given** a user is in CustomEventCreationView AIEnhancementStepView
- **When** they enter text in the promptSeed TextEditor
- **Then** Writing Tools are available to refine the AI enhancement prompt
- **And** full Writing Tools menu appears on text selection

#### Scenario: Avatar prompts support Writing Tools
- **Given** a user is customizing an avatar prompt in AvatarGenerationView
- **When** they select text in the customPrompt TextEditor
- **Then** Writing Tools options appear to help refine the prompt
- **And** improved prompts lead to better avatar generation results

#### Scenario: Short inputs disable Writing Tools
- **Given** a user is entering a hero name, title, or keyword in any view
- **When** they interact with disabled TextField components
- **Then** Writing Tools do NOT appear
- **And** text input behaves as standard TextField

#### Scenario: Authentication fields disable Writing Tools
- **Given** a user is entering email or password in MagicalTextField
- **When** they interact with the TextField or SecureField
- **Then** Writing Tools do NOT appear
- **And** no AI suggestions interrupt authentication flow

#### Scenario: Graceful degradation without Apple Intelligence
- **Given** a user has iOS 18.1+ but Apple Intelligence is not enabled or unavailable
- **When** they use any text input component
- **Then** the app functions normally without Writing Tools UI
- **And** text inputs behave as standard TextEditor/TextField
- **And** no errors or crashes occur

### Requirement: iOS 18.1+ Deployment Target

The app MUST target iOS 18.1+ as the minimum deployment version to support Apple Intelligence Writing Tools and other modern iOS features.

#### Scenario: Build configuration targets iOS 18.1+
- **Given** the Xcode project has deployment target settings
- **When** the project is configured
- **Then** IPHONEOS_DEPLOYMENT_TARGET is set to 18.1 for all configurations
- **And** compilation succeeds without errors

#### Scenario: App Store metadata reflects iOS 18.1+ requirement
- **Given** the app is prepared for App Store submission
- **When** Info.plist and project settings are reviewed
- **Then** MinimumOSVersion reflects iOS 18.1
- **And** App Store listing correctly shows iOS 18.1+ requirement

