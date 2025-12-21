# Capability: Apple Intelligence Integration

iOS-specific capability for integrating Apple Intelligence features into the InfiniteStories app.

## ADDED Requirements

### Requirement: Writing Tools Configuration

The app MUST configure Apple Intelligence Writing Tools appropriately for each text input component based on its purpose.

#### Scenario: Long-form text editing enables full Writing Tools
- **Given** a user is editing story content in StoryEditView on iOS 18.1+ with Apple Intelligence enabled
- **When** they select text in the content TextEditor
- **Then** Writing Tools options (Proofread, Rewrite, Friendly, Professional, Concise) appear
- **And** selecting an option replaces text in-place with animation

#### Scenario: Event description supports Writing Tools
- **Given** a user is creating a custom event in CustomEventCreationView on iOS 18.1+
- **When** they enter text in the description TextEditor
- **Then** Writing Tools are available to help improve the description

#### Scenario: Short inputs disable Writing Tools
- **Given** a user is entering a hero name in HeroCreationView on iOS 18.1+
- **When** they interact with the name TextField
- **Then** Writing Tools do NOT appear (names should remain as user intended)

#### Scenario: Image prompts use limited Writing Tools
- **Given** a user is entering a custom prompt in AvatarGenerationView on iOS 18.1+
- **When** they select text in the prompt TextEditor
- **Then** Writing Tools results appear in a pop-up (limited mode)
- **And** user can copy or replace the original text

#### Scenario: Graceful degradation on older devices
- **Given** a user is on iOS 17.x or a device without Apple Intelligence
- **When** they use any text input component
- **Then** the app functions normally without Writing Tools
- **And** no errors or crashes occur

### Requirement: Backward Compatibility

The app MUST maintain backward compatibility with iOS 17.6 minimum deployment target.

#### Scenario: Build succeeds for iOS 17.6
- **Given** the Xcode project targets iOS 17.6+
- **When** the app is built
- **Then** compilation succeeds without errors
- **And** Writing Tools modifiers are only applied on iOS 18.1+

#### Scenario: Runtime safety on older iOS
- **Given** the app is running on iOS 17.x
- **When** any view with Writing Tools configuration loads
- **Then** the app does not crash
- **And** text inputs function normally without the modifier
