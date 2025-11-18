# Legacy Code Deprecation Capability

**Capability**: Legacy Code Deprecation
**Status**: Not Started
**Owner**: iOS Engineering

## Overview

This capability defines the systematic deprecation and removal of legacy code that directly integrated with OpenAI APIs. The iOS app must transition fully to backend-proxied API calls, removing all direct OpenAI SDK usage.

---

## ADDED Requirements

### Requirement: AIService Must Be Deprecated and Removed

**Priority**: High
**Status**: Not Started

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

**Priority**: High
**Status**: Not Started

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

**Priority**: Medium
**Status**: Not Started

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

**Priority**: Medium
**Status**: Not Started

All deprecated code SHALL include clear documentation on how to migrate.

#### Scenario: Deprecation warnings include migration guidance

**Given** AIService is deprecated
**When** a developer views the deprecation warning
**Then** the message includes: "Use StoryRepository and HeroRepository instead"
**And** the AIService file has a comment block explaining:
- Why it's deprecated
- What to use instead
- Example migration code
**And** developers can easily update their code

---

## MODIFIED Requirements

*None*

---

## REMOVED Requirements

### Requirement: Direct OpenAI Integration in iOS

**Reason**: All AI operations now proxied through backend
**Date**: 2025-11-13

The iOS app no longer directly integrates with OpenAI APIs. All AI operations are handled by the backend.

**Files to Remove**:
- `Services/AIService.swift` (~1178 lines)
- OpenAI Swift package dependency
- API key Keychain storage logic
- SettingsView API key input section

**Code to Remove**:
```swift
// REMOVE: Direct OpenAI calls
let service = AIService()
service.generateStory(...)
service.generateAudio(...)
service.generateAvatar(...)

// REPLACE WITH: Repository pattern
let storyRepo = StoryRepository()
await storyRepo.generateStory(...)
await storyRepo.generateAudio(...)

let heroRepo = HeroRepository()
await heroRepo.generateAvatar(...)
```

### Requirement: OpenAI API Key Configuration in iOS

**Reason**: Backend manages API keys centrally
**Date**: 2025-11-13

Users no longer provide OpenAI API keys in the iOS app.

**Files to Update**:
- `Views/Settings/SettingsView.swift` - Remove API key section
- `Utilities/KeychainHelper.swift` - Remove OpenAI key methods (keep session token methods)
- Any onboarding/setup views that mention API keys

---

## Dependencies

- iOS backend integration must be complete (all features work via repositories)
- All ViewModels must use repositories exclusively
- No active code can reference AIService when it's deleted

## Related Capabilities

- `ios-integration`: Must complete before deprecation
- `testing`: Ensure no regressions when removing legacy code

## Migration Strategy

### Phase 1: Mark as Deprecated (Week 2, Day 1)
1. Add `@available(*, deprecated)` to AIService
2. Add deprecation comments with migration guidance
3. Run build to identify all usage locations
4. Create checklist of files to update

### Phase 2: Migrate Usages (Week 2, Days 2-4)
1. Update StoryViewModel to use only repositories
2. Update any other ViewModels/Views using AIService
3. Test each change thoroughly
4. Commit after each successful migration

### Phase 3: Remove Dependencies (Week 2, Day 5)
1. Remove OpenAI Swift package
2. Remove API key settings UI
3. Clear API key from Keychain
4. Update documentation

### Phase 4: Delete Legacy Code (Week 3, Day 1)
1. Delete AIService.swift
2. Delete OpenAI response models
3. Run full test suite
4. Verify no build errors

## File Inventory

**Files to Deprecate/Remove**:
- ✅ `Services/AIService.swift` - Main AI service (DELETE after migration)
- ✅ `Views/Settings/SettingsView.swift` - Remove API key section (MODIFY)
- ✅ Package dependencies - Remove OpenAI Swift package (MODIFY)
- ✅ Any OpenAI-specific models/structs (DELETE)

**Files to Update**:
- ✅ `ViewModels/StoryViewModel.swift` - Remove AIService references
- ✅ Any Views that directly use AIService - Migrate to repositories
- ✅ `CLAUDE.md` - Remove outdated AIService documentation

**Files to Keep**:
- ✅ `Network/APIClient.swift` - Core HTTP client
- ✅ `Repositories/*` - All repository files
- ✅ `Services/AuthStateManager.swift` - Authentication state
- ✅ `Utilities/KeychainHelper.swift` - Keep for session token storage

## Rollback Plan

If issues are discovered after removal:
1. **Phase 1-2**: Simply uncomment the `@available(*, deprecated)` - code still works
2. **Phase 3**: Re-add OpenAI package if needed (shouldn't be necessary)
3. **Phase 4**: Restore from git history if critical issues found

**Mitigation**: Comprehensive testing before deletion ensures no rollback needed.

## Open Questions

- ✅ Should we keep AIService in git history? → Yes, normal git workflow
- ✅ What if a feature only works with direct OpenAI? → None identified, all features backend-compatible
- ✅ Timeline for deprecation? → Week 2-3 of implementation

## Acceptance Criteria

- [ ] AIService marked with `@available(*, deprecated)`
- [ ] All AIService usages migrated to repositories
- [ ] OpenAI Swift package removed from dependencies
- [ ] No `import OpenAI` statements in codebase
- [ ] API key storage removed from Keychain
- [ ] SettingsView no longer shows API key input
- [ ] AIService.swift file deleted
- [ ] All tests pass after removal
- [ ] App builds successfully without any AIService references
- [ ] CLAUDE.md updated to reflect new architecture
- [ ] Code review confirms no remnants of direct OpenAI integration
