# Spec: Legacy Code Deprecation

## ADDED Requirements

### Requirement: AIService Must Be Deprecated and Removed

The AIService class (~1178 lines) SHALL be marked as deprecated, usage removed, and file deleted.

#### Scenario: AIService is marked deprecated

**Given** the codebase contains AIService
**When** a deprecation marker is added
**Then** the class is annotated with `@available(*, deprecated, message: "Use StoryRepository and HeroRepository instead")`
**And** Xcode shows warnings for any usage
**And** a comment explains the migration path
**And** the file remains temporarily for reference

#### Scenario: All AIService usages are migrated

**Given** AIService is marked deprecated
**When** a codebase search is performed
**Then** no active code references AIService
**And** StoryViewModel uses only storyRepository
**And** HeroCreationView uses only heroRepository
**And** all ViewModels use repositories exclusively

#### Scenario: AIService file is deleted

**Given** all AIService usages have been migrated
**And** all features work through repositories
**When** the migration is verified complete
**Then** `Services/AIService.swift` is deleted
**And** the Xcode project file is updated
**And** the app builds successfully without AIService
**And** all tests pass

### Requirement: OpenAI SDK Must Be Removed from iOS

The OpenAI Swift package SHALL be removed from iOS dependencies.

#### Scenario: OpenAI package removed from dependencies

**Given** the iOS project uses Swift Package Manager
**When** OpenAI package is removed
**Then** `Package.swift` no longer lists OpenAI
**And** no `import OpenAI` statements exist in the codebase
**And** the project builds successfully
**And** no OpenAI-related types are used

#### Scenario: OpenAI response models removed

**Given** the codebase contains OpenAI-specific response models
**When** backend integration is complete
**Then** all OpenAI response structs are deleted
**And** backend API response models are used instead
**And** no OpenAI-specific code remains

### Requirement: API Key Storage Must Be Removed from iOS

All OpenAI API key storage and configuration SHALL be removed from the iOS app.

#### Scenario: API key Keychain storage is removed

**Given** the iOS app stores OpenAI API key in Keychain
**When** the migration to backend is complete
**Then** the Keychain entry for "openai_api_key" is deleted
**And** no code reads/writes OpenAI API keys
**And** only session tokens are stored in Keychain

#### Scenario: API key settings UI is removed

**Given** SettingsView contains an API key input field
**When** the backend handles all OpenAI integration
**Then** the API key section is removed from SettingsView
**And** users cannot enter or view API keys
**And** the settings view is simplified

### Requirement: Deprecated Code Must Have Clear Migration Path

All deprecated code SHALL include clear documentation on how to migrate.

#### Scenario: Deprecation warnings include migration guidance

**Given** AIService is deprecated
**When** a developer views the deprecation warning
**Then** the message includes: "Use StoryRepository and HeroRepository instead"
**And** developers can easily update their code

## REMOVED Requirements

### Requirement: Direct OpenAI Integration in iOS

The iOS app no longer directly integrates with OpenAI APIs. All AI operations are handled by the backend.

### Requirement: OpenAI API Key Configuration in iOS

Users no longer provide OpenAI API keys in the iOS app. Backend manages API keys centrally.
