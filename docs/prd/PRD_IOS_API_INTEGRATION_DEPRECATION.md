# Code Deprecation Strategy - iOS Backend API Integration

**Parent Document**: [PRD_IOS_API_INTEGRATION.md](./PRD_IOS_API_INTEGRATION.md)
**Version**: 1.0
**Date**: 2025-01-06

---

## Table of Contents

1. [Overview](#overview)
2. [Deprecation Principles](#deprecation-principles)
3. [Files to Deprecate](#files-to-deprecate)
4. [Files to Remove](#files-to-remove)
5. [Files to Create](#files-to-create)
6. [Deprecation Timeline](#deprecation-timeline)
7. [Backward Compatibility Strategy](#backward-compatibility-strategy)
8. [Feature Flags](#feature-flags)
9. [Migration Checklist](#migration-checklist)

---

## Overview

This document outlines the strategy for deprecating and removing old code during the migration from local-only architecture to cloud-backed with offline caching. The goal is to:

1. **Minimize disruption** to existing functionality during transition
2. **Enable gradual migration** with parallel code paths
3. **Provide rollback capability** via feature flags
4. **Clean up deprecated code** once migration is validated
5. **Maintain code quality** throughout the process

### Key Principles

- ✅ **Mark before removing**: All code marked `@available(*, deprecated)` before deletion
- ✅ **Parallel operation**: Old and new code paths work simultaneously during transition
- ✅ **Feature flags**: Enable/disable new features for testing and rollback
- ✅ **Gradual removal**: Phased removal over 7 weeks, not all at once
- ✅ **No breaking changes**: Existing functionality preserved until new code validated

---

## Deprecation Principles

### 1. Deprecation Attributes

Use Swift's `@available` attribute to mark deprecated code:

```swift
// Class-level deprecation
@available(*, deprecated, message: "Use APIClient instead. Will be removed in Phase 6.")
class AIService {
    // ...
}

// Method-level deprecation
@available(*, deprecated, message: "Use HeroRepository.generateAvatar() instead.")
func generateAvatar(for hero: Hero) async throws -> URL {
    // ...
}

// Property-level deprecation
@available(*, deprecated, message: "Use sessionToken from AuthManager.")
var apiKey: String? {
    // ...
}
```

### 2. Compiler Warnings

Deprecated code triggers compiler warnings to guide developers:

```swift
// Warning: 'AIService' is deprecated: Use APIClient instead. Will be removed in Phase 6.
let aiService = AIService()
```

### 3. Documentation Updates

All deprecated elements must have:
- Clear deprecation message
- Recommended replacement
- Expected removal timeline
- Migration guide reference

### 4. Graceful Degradation

Deprecated code continues working during transition:
- No crashes or failures
- Same functionality as before
- Logs warnings for monitoring
- Tracks usage metrics for safe removal

---

## Files to Deprecate

### Services Layer

#### 1. AIService.swift (Phase 1-6: Deprecate, then Remove)

**Current Role**: Direct OpenAI API integration from iOS
**Lines of Code**: ~1178 lines
**Reason for Deprecation**: OpenAI calls moving to backend

**What Changes**:
```swift
// OLD: Direct OpenAI calls
class AIService {
    func generateStory(...) async throws -> String
    func generateAudio(...) async throws -> URL
    func generateAvatar(...) async throws -> URL
    func generateIllustrations(...) async throws -> [StoryIllustration]
}

// NEW: Backend API calls via Repository
class StoryRepository {
    func generateStory(...) async throws -> Story // Calls /api/stories
    func generateAudio(...) async throws -> Story // Calls /api/stories/[id]/audio
}

class HeroRepository {
    func generateAvatar(...) async throws -> Hero // Calls /api/heroes/[id]/avatar
}
```

**Deprecation Timeline**:
- **Week 1-2 (Phase 1)**: Mark class as `@available(*, deprecated)`
- **Week 3-4 (Phase 3)**: All ViewModels use repositories instead
- **Week 5-6 (Phase 6)**: Remove class entirely

**Migration Path**:
```swift
// Phase 1: Add deprecation warnings
@available(*, deprecated, renamed: "StoryRepository.generateStory", message: "Use StoryRepository instead. Direct OpenAI calls will be removed in Phase 6.")
class AIService {
    // Keep implementation for backward compatibility
}

// Phase 3: Route through backend
extension AIService {
    func generateStory(...) async throws -> String {
        // Log usage for monitoring
        Logger.api.warning("AIService.generateStory() is deprecated. Use StoryRepository.")

        // Call new repository (if feature flag enabled)
        if FeatureFlags.useBackendAPI {
            let repository = StoryRepository()
            let story = try await repository.generateStory(...)
            return story.content
        }

        // Fall back to old implementation
        return try await legacyGenerateStory(...)
    }
}

// Phase 6: Remove entire class
// Delete AIService.swift
```

#### 2. NetworkService.swift (Phase 1: Enhance, not Remove)

**Current Role**: Basic URLSession wrapper for OpenAI calls
**Decision**: **Enhance** rather than deprecate

**What Changes**:
```swift
// OLD: Simple URLSession wrapper
class NetworkService {
    func request(...) async throws -> Data
}

// NEW: Enhanced with auth, retries, error handling
class NetworkService {
    func request(...) async throws -> Data
    func authenticatedRequest(...) async throws -> Data // New
    func uploadFile(...) async throws -> URL // New
    func downloadFile(...) async throws -> Data // New
}
```

**Why Keep**: Core networking functionality useful for both old and new code paths.

**Action**: Enhance with new features, mark old methods as deprecated where replaced.

#### 3. CustomEventAIAssistant.swift (Phase 1: Deprecate parts)

**Current Role**: AI-powered custom event enhancement
**Decision**: **Partial deprecation** - some methods move to backend

**What Changes**:
```swift
// OLD: Client-side AI calls
class CustomEventAIAssistant {
    @available(*, deprecated, message: "Use CustomEventRepository.enhanceEvent()")
    func enhancePrompt(...) async throws -> String

    @available(*, deprecated, message: "Use CustomEventRepository.generateKeywords()")
    func generateKeywords(...) async throws -> [String]
}

// NEW: Backend API calls
class CustomEventRepository {
    func enhanceEvent(...) async throws -> CustomStoryEvent
    func generateKeywords(...) async throws -> [String]
}
```

#### 4. EventPictogramGenerator.swift (Keep, but enhance)

**Current Role**: Generate pictograms for custom events
**Decision**: **Keep** - pictogram generation stays client-side

**Action**: Update to use backend API for AI suggestions, but keep local generation logic.

### UI Components

#### 5. OpenAI Settings UI (Phase 5: Remove)

**Files to Remove**:
- Any views for OpenAI API key configuration
- Settings sections for OpenAI models/voices (move to backend)

**What Changes**:
```swift
// OLD: User enters OpenAI API key
struct SettingsView: View {
    @State private var apiKey: String = ""

    var body: some View {
        TextField("OpenAI API Key", text: $apiKey)
        // ...
    }
}

// NEW: No API key needed, just authentication
struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        if authManager.isAuthenticated {
            Text("Signed in as \(authManager.currentUser?.email ?? "")")
            Button("Sign Out") { /* ... */ }
        } else {
            NavigationLink("Sign In") { SignInView() }
        }
    }
}
```

### Utilities

#### 6. KeychainHelper.swift (Phase 1: Enhance)

**Current Role**: Store OpenAI API key
**Decision**: **Enhance** to store session tokens instead

**What Changes**:
```swift
// OLD: API key storage
extension KeychainHelper {
    func saveAPIKey(_ key: String) throws
    func getAPIKey() throws -> String?
    func deleteAPIKey() throws
}

// NEW: Session token storage
extension KeychainHelper {
    @available(*, deprecated, message: "Use saveSessionToken() instead")
    func saveAPIKey(_ key: String) throws

    func saveSessionToken(_ token: String) throws
    func getSessionToken() throws -> String?
    func deleteSessionToken() throws
}

// REMOVE in Phase 5: API key methods deleted
```

---

## Files to Remove

### Phase 5-6: Complete Removal

#### 1. Direct OpenAI Integration Code

**Files**:
- `AIService.swift` - Entire file removed (moved to backend)
- Any helper files specific to OpenAI client-side integration

**Reason**: All OpenAI operations now server-side.

#### 2. API Key Management

**Code to Remove**:
```swift
// Remove from KeychainHelper.swift
func saveAPIKey(_ key: String) throws { /* DELETE */ }
func getAPIKey() throws -> String? { /* DELETE */ }
func deleteAPIKey() throws { /* DELETE */ }

// Remove from Settings
var apiKeySection: some View { /* DELETE */ }
```

**Reason**: No more client-side API keys, only session tokens.

#### 3. Local-Only Storage Logic

**Code to Remove**:
- Any code that treats local storage as "source of truth"
- Direct `modelContext.save()` calls without sync metadata updates

**What Changes**:
```swift
// OLD: Direct save
func saveHero(_ hero: Hero) {
    modelContext.insert(hero)
    try? modelContext.save()
}

// NEW: Save through repository with sync
func saveHero(_ hero: Hero) async throws {
    try await heroRepository.create(hero)
    // Repository handles local cache + backend sync
}
```

#### 4. Unused ViewModels (if any)

**Review and Remove**:
- ViewModels that directly access `modelContext` (should use repositories)
- ViewModels with duplicate business logic

---

## Files to Create

### Services Layer

#### 1. APIClient.swift (Phase 1)

**Purpose**: HTTP client for backend API communication
**Lines of Code**: ~300-400 lines

```swift
protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T>
    func upload(_ data: Data, to endpoint: Endpoint) async throws -> URL
    func download(from url: URL) async throws -> Data
}

class APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let authManager: AuthManager
    private let retryPolicy: RetryPolicy

    // Implementation...
}
```

#### 2. AuthManager.swift (Phase 1)

**Purpose**: Better Auth session management
**Lines of Code**: ~200-300 lines

```swift
protocol AuthManagerProtocol {
    var isAuthenticated: Bool { get }
    var currentUser: User? { get }

    func signUp(email: String, password: String, name: String?) async throws -> AuthResponse
    func signIn(email: String, password: String) async throws -> AuthResponse
    func signOut() async throws
    func refreshSession() async throws -> AuthResponse
}

class AuthManager: AuthManagerProtocol, ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?

    private let keychainHelper: KeychainHelper
    private let apiClient: APIClientProtocol

    // Implementation...
}
```

#### 3. CacheManager.swift (Phase 1)

**Purpose**: SwiftData wrapper with sync metadata management
**Lines of Code**: ~250-350 lines

```swift
protocol CacheManagerProtocol {
    func save<T: PersistentModel>(_ object: T) throws
    func fetch<T: PersistentModel>(_ type: T.Type, id: UUID) throws -> T?
    func fetchAll<T: PersistentModel>(_ type: T.Type) throws -> [T]
    func delete<T: PersistentModel>(_ object: T) throws
    func markForSync<T: PersistentModel>(_ object: T, status: SyncStatus) throws
}

class CacheManager: CacheManagerProtocol {
    private let modelContext: ModelContext

    // Implementation...
}
```

#### 4. SyncEngine.swift (Phase 3)

**Purpose**: Bidirectional synchronization logic
**Lines of Code**: ~400-500 lines

```swift
protocol SyncEngineProtocol {
    func syncAll() async throws
    func syncHeroes() async throws
    func syncStories() async throws
    func syncMediaFiles() async throws
    func resolveConflicts() async throws
}

class SyncEngine: SyncEngineProtocol {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol
    private let conflictResolver: ConflictResolver

    // Implementation...
}
```

#### 5. BackgroundSyncManager.swift (Phase 3)

**Purpose**: Scheduled background sync operations
**Lines of Code**: ~200-250 lines

```swift
class BackgroundSyncManager {
    private let syncEngine: SyncEngineProtocol

    func scheduleSync()
    func performSync() async
    func cancelSync()
}
```

#### 6. MediaCacheManager.swift (Phase 4)

**Purpose**: R2 file caching with eviction policies
**Lines of Code**: ~300-350 lines

```swift
class MediaCacheManager {
    func cacheFile(_ data: Data, key: String, policy: CachePolicy) async throws
    func getCachedFile(key: String) async throws -> Data?
    func evictExpired() async throws
    func clearCache(olderThan days: Int) async throws
}
```

### Repository Layer

#### 7. HeroRepository.swift (Phase 2)

**Purpose**: Hero data access with API + cache coordination
**Lines of Code**: ~350-450 lines

```swift
protocol HeroRepositoryProtocol {
    func fetchAll() async throws -> [Hero]
    func fetch(id: UUID) async throws -> Hero
    func create(_ hero: Hero) async throws -> Hero
    func update(_ hero: Hero) async throws -> Hero
    func delete(_ hero: Hero) async throws
    func generateAvatar(for hero: Hero, prompt: String) async throws -> Hero
    func syncWithBackend() async throws
}

class HeroRepository: HeroRepositoryProtocol {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol
    private let syncEngine: SyncEngineProtocol

    // Implementation...
}
```

#### 8. StoryRepository.swift (Phase 2)

**Purpose**: Story data access with API + cache coordination
**Lines of Code**: ~450-550 lines

```swift
protocol StoryRepositoryProtocol {
    func fetchAll() async throws -> [Story]
    func fetch(id: UUID) async throws -> Story
    func create(_ story: Story) async throws -> Story
    func update(_ story: Story) async throws -> Story
    func delete(_ story: Story) async throws
    func generateStory(for hero: Hero, event: StoryEvent) async throws -> Story
    func generateAudio(for story: Story) async throws -> Story
    func generateIllustrations(for story: Story) async throws -> Story
    func syncWithBackend() async throws
}

class StoryRepository: StoryRepositoryProtocol {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol
    private let syncEngine: SyncEngineProtocol

    // Implementation...
}
```

#### 9. CustomEventRepository.swift (Phase 2)

**Purpose**: Custom event data access
**Lines of Code**: ~250-350 lines

```swift
protocol CustomEventRepositoryProtocol {
    func fetchAll() async throws -> [CustomStoryEvent]
    func fetch(id: UUID) async throws -> CustomStoryEvent
    func create(_ event: CustomStoryEvent) async throws -> CustomStoryEvent
    func update(_ event: CustomStoryEvent) async throws -> CustomStoryEvent
    func delete(_ event: CustomStoryEvent) async throws
    func enhanceEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent
    func syncWithBackend() async throws
}

class CustomEventRepository: CustomEventRepositoryProtocol {
    // Implementation...
}
```

### Network Layer

#### 10. Endpoint.swift (Phase 1)

**Purpose**: Type-safe API endpoint definitions
**Lines of Code**: ~200-250 lines

```swift
enum Endpoint {
    case signIn(email: String, password: String)
    case signUp(email: String, password: String, name: String?)
    case getHeroes(limit: Int, offset: Int)
    case createHero(data: HeroCreateRequest)
    case updateHero(id: UUID, data: HeroUpdateRequest)
    case deleteHero(id: UUID)
    // ... all other endpoints

    var path: String { /* ... */ }
    var method: HTTPMethod { /* ... */ }
    var headers: [String: String] { /* ... */ }
    var body: Data? { /* ... */ }
}
```

#### 11. APIError.swift (Phase 1)

**Purpose**: Typed API errors with localization
**Lines of Code**: ~150-200 lines

```swift
enum APIError: Error {
    case unauthorized
    case forbidden
    case notFound
    case rateLimitExceeded(resetAt: Date)
    case validationError(fields: [String: String])
    case serverError
    case networkError(Error)
    case decodingError(Error)
    case unknown(Error)
}

extension APIError: LocalizedError {
    var errorDescription: String? { /* ... */ }
}
```

#### 12. APIResponse.swift (Phase 1)

**Purpose**: Generic API response wrapper
**Lines of Code**: ~50-100 lines

```swift
struct APIResponse<T: Decodable>: Decodable {
    let data: T?
    let error: APIError?
    let pagination: Pagination?
}

struct Pagination: Decodable {
    let total: Int
    let limit: Int
    let offset: Int
    let hasMore: Bool
}
```

#### 13. RetryPolicy.swift (Phase 1)

**Purpose**: Exponential backoff retry logic
**Lines of Code**: ~100-150 lines

```swift
struct RetryPolicy {
    let maxRetries: Int
    let baseDelay: TimeInterval
    let maxDelay: TimeInterval
    let retryableErrors: Set<APIError>

    func shouldRetry(_ error: APIError, attempt: Int) -> Bool
    func delay(for attempt: Int) -> TimeInterval
}
```

### Model Extensions

#### 14. Hero+Sync.swift (Phase 1)

**Purpose**: Add sync metadata to Hero model
**Lines of Code**: ~100-150 lines

```swift
extension Hero {
    @Attribute(.unique) var serverId: String?
    var serverSyncStatus: SyncStatus = .synced
    var lastSyncedAt: Date?
    var serverUpdatedAt: Date?
    var pendingChanges: Data? // JSON encoded

    var needsSync: Bool {
        return serverSyncStatus != .synced
    }
}
```

#### 15. Story+Sync.swift (Phase 1)

**Purpose**: Add sync metadata to Story model
**Lines of Code**: ~100-150 lines

```swift
extension Story {
    @Attribute(.unique) var serverId: String?
    var serverSyncStatus: SyncStatus = .synced
    var lastSyncedAt: Date?
    var serverUpdatedAt: Date?
    var pendingChanges: Data?

    var needsSync: Bool {
        return serverSyncStatus != .synced
    }
}
```

#### 16. StoryIllustration+Sync.swift (Phase 1)

**Purpose**: Add sync metadata to StoryIllustration model

#### 17. CustomStoryEvent+Sync.swift (Phase 1)

**Purpose**: Add sync metadata to CustomStoryEvent model

### Migration

#### 18. DataMigrationManager.swift (Phase 6)

**Purpose**: Orchestrate local data migration to backend
**Lines of Code**: ~300-400 lines

```swift
class DataMigrationManager {
    func exportLocalData() throws -> LocalDataExport
    func uploadToBackend(_ export: LocalDataExport) async throws
    func markAllAsSynced() throws
    func rollbackMigration() async
}
```

#### 19. LocalDataExporter.swift (Phase 6)

**Purpose**: Export local SwiftData to JSON
**Lines of Code**: ~200-250 lines

```swift
struct LocalDataExport: Codable {
    let heroes: [HeroExport]
    let stories: [StoryExport]
    let customEvents: [CustomEventExport]
    let mediaFiles: [MediaFileReference]
}

class LocalDataExporter {
    func exportHeroes() throws -> [HeroExport]
    func exportStories() throws -> [StoryExport]
    func collectMediaFiles() throws -> [MediaFileReference]
}
```

#### 20. MigrationView.swift (Phase 6)

**Purpose**: UI for data migration workflow
**Lines of Code**: ~200-300 lines

```swift
struct MigrationView: View {
    @StateObject private var migrationManager: DataMigrationManager
    @State private var progress: Double = 0.0
    @State private var currentStep: String = ""

    var body: some View {
        // Migration UI with progress tracking
    }
}
```

### Utilities

#### 21. SyncStatus.swift (Phase 1)

**Purpose**: Enum for sync state tracking
**Lines of Code**: ~50-75 lines

```swift
enum SyncStatus: String, Codable {
    case synced        // Up-to-date with server
    case pendingCreate // Created locally, not on server
    case pendingUpdate // Modified locally, needs sync
    case pendingDelete // Deleted locally, needs server delete
    case failed        // Sync failed, needs retry
    case conflict      // Server has newer version
}
```

#### 22. ConflictResolver.swift (Phase 3)

**Purpose**: Conflict resolution strategies
**Lines of Code**: ~200-250 lines

```swift
enum ConflictResolution {
    case serverWins
    case localWins
    case userPrompt
    case merge
}

class ConflictResolver {
    func resolveConflict<T>(local: T, server: T, strategy: ConflictResolution) async throws
}
```

#### 23. RateLimitManager.swift (Phase 1)

**Purpose**: Client-side rate limit awareness
**Lines of Code**: ~100-150 lines

```swift
class RateLimitManager {
    private var limits: [String: RateLimit] = [:]

    func checkLimit(for operation: String) throws
    func updateLimit(from headers: [String: String])
}
```

#### 24. PerformanceMonitor.swift (Phase 7)

**Purpose**: Track API performance metrics
**Lines of Code**: ~150-200 lines

```swift
class PerformanceMonitor {
    func measureAPIRequest<T>(_ request: @escaping () async throws -> T) async rethrows -> T
    func logSlowRequest(duration: TimeInterval, endpoint: String)
}
```

---

## Deprecation Timeline

### Phase 1: Week 1-2 (Foundation)

**Actions**:
- ✅ Mark `AIService` class as deprecated
- ✅ Mark `AIService` methods with replacement guidance
- ✅ Add deprecation warnings to Keychain API key methods
- ✅ Keep all functionality working (no removal yet)

**Code Changes**:
```swift
@available(*, deprecated, message: "Use APIClient and repositories instead. Will be removed in Phase 6.")
class AIService {
    @available(*, deprecated, renamed: "HeroRepository.generateAvatar")
    func generateAvatar(for hero: Hero) async throws -> URL { /* ... */ }

    @available(*, deprecated, renamed: "StoryRepository.generateStory")
    func generateStory(...) async throws -> String { /* ... */ }
}
```

**Compiler Output**:
```
⚠️ 'AIService' is deprecated: Use APIClient and repositories instead. Will be removed in Phase 6.
⚠️ 'generateAvatar(for:)' is deprecated: renamed to 'HeroRepository.generateAvatar'
```

### Phase 2: Week 2-3 (Repository Layer)

**Actions**:
- ✅ Update all ViewModels to use repositories
- ✅ No direct `modelContext` access from ViewModels
- ✅ Old code paths still functional (feature flag)

**Code Changes**:
```swift
// OLD: StoryViewModel uses AIService directly
class StoryViewModel {
    func generateStory() async {
        let content = try await aiService.generateStory(...)
    }
}

// NEW: StoryViewModel uses StoryRepository
class StoryViewModel {
    func generateStory() async {
        let story = try await storyRepository.generateStory(...)
    }
}
```

### Phase 3: Week 3-4 (Sync Engine)

**Actions**:
- ✅ Route all AIService calls through backend (if feature flag enabled)
- ✅ Log usage of deprecated methods for monitoring
- ✅ Prepare for removal in Phase 6

**Code Changes**:
```swift
extension AIService {
    func generateStory(...) async throws -> String {
        Logger.api.warning("AIService.generateStory() deprecated - using StoryRepository")

        if FeatureFlags.useBackendAPI {
            let repository = StoryRepository()
            let story = try await repository.generateStory(...)
            return story.content
        }

        // Fallback to old implementation
        return try await legacyGenerateStory(...)
    }
}
```

### Phase 4: Week 4-5 (Media Management)

**Actions**:
- ✅ Local files become cache, not source of truth
- ✅ R2 URLs stored in models
- ✅ Cache eviction policies active

**No Deprecations This Phase** - Focus on media infrastructure

### Phase 5: Week 5-6 (Offline Mode)

**Actions**:
- ✅ Remove OpenAI API key from iOS Settings UI
- ✅ Delete Keychain API key methods
- ✅ Session token only authentication
- ✅ Direct OpenAI calls fully removed (feature flag removed)

**Code Removal**:
```swift
// DELETE from KeychainHelper.swift
func saveAPIKey(_ key: String) throws { /* DELETE */ }
func getAPIKey() throws -> String? { /* DELETE */ }

// DELETE from SettingsView.swift
var apiKeySection: some View { /* DELETE */ }

// DELETE feature flag
enum FeatureFlags {
    // static let useBackendAPI = true/false // DELETE - always true now
}
```

### Phase 6: Week 6 (Migration Tool)

**Actions**:
- ✅ **Remove AIService.swift entirely**
- ✅ Remove all deprecated methods from other classes
- ✅ Clean up unused imports
- ✅ Remove feature flags

**Files Deleted**:
```bash
rm Services/AIService.swift
rm Views/Settings/OpenAIConfigurationView.swift # If exists
# Remove any OpenAI-specific helper files
```

### Phase 7: Week 7 (Testing & Polish)

**Actions**:
- ✅ Final cleanup of deprecated code
- ✅ Remove temporary migration code (if any)
- ✅ Update documentation to reflect new architecture
- ✅ Verify no deprecation warnings remain

---

## Backward Compatibility Strategy

### Parallel Code Paths (Week 1-5)

During Phases 1-5, both old and new code paths work simultaneously:

```swift
class StoryViewModel: ObservableObject {
    private let storyRepository: StoryRepositoryProtocol
    private let aiService: AIService // Legacy

    func generateStory() async throws {
        if FeatureFlags.useBackendAPI {
            // New path: Backend API via repository
            let story = try await storyRepository.generateStory(
                for: hero,
                event: event,
                language: language
            )
            self.currentStory = story
        } else {
            // Old path: Direct OpenAI call (deprecated)
            let content = try await aiService.generateStory(
                for: hero,
                event: event,
                language: language
            )
            let story = Story(content: content, hero: hero)
            self.currentStory = story
        }
    }
}
```

### Feature Flags

#### Definition

```swift
enum FeatureFlags {
    /// Use backend API for story generation (vs direct OpenAI)
    static let useBackendAPI: Bool = {
        #if DEBUG
        return UserDefaults.standard.bool(forKey: "useBackendAPI")
        #else
        return true // Always enabled in production after Phase 5
        #endif
    }()

    /// Enable cloud sync (vs local-only)
    static let enableCloudSync: Bool = {
        return UserDefaults.standard.bool(forKey: "enableCloudSync")
    }()
}
```

#### Debug Settings UI

```swift
#if DEBUG
struct DeveloperSettingsView: View {
    @AppStorage("useBackendAPI") private var useBackendAPI = false
    @AppStorage("enableCloudSync") private var enableCloudSync = false

    var body: some View {
        Form {
            Section("Feature Flags (DEBUG ONLY)") {
                Toggle("Use Backend API", isOn: $useBackendAPI)
                Toggle("Enable Cloud Sync", isOn: $enableCloudSync)
            }
        }
    }
}
#endif
```

### Rollback Procedure

If critical issues discovered during migration:

1. **Disable Feature Flag** (Phases 1-4):
   ```swift
   UserDefaults.standard.set(false, forKey: "useBackendAPI")
   // App reverts to old code path
   ```

2. **Preserve Local Data**:
   - SwiftData cache always kept
   - No destructive operations on local storage
   - Can continue using app offline

3. **Backend Rollback** (if needed):
   - Revert API changes
   - Keep database intact (no data loss)
   - iOS app can reconnect later

4. **Communication**:
   - Notify users of temporary issue
   - Explain rollback to local-only mode
   - Provide timeline for fix

---

## Feature Flags

### Flag Lifecycle

#### Phase 1-2: Development Flags
```swift
enum FeatureFlags {
    static let useBackendAPI = false // Testing new code
    static let enableCloudSync = false
}
```

#### Phase 3-4: Gradual Rollout
```swift
enum FeatureFlags {
    static let useBackendAPI = true // Enabled by default
    static let enableCloudSync = false // Still testing
}
```

#### Phase 5-6: Full Rollout
```swift
enum FeatureFlags {
    static let useBackendAPI = true // Always enabled
    static let enableCloudSync = true // Enabled by default
}
```

#### Phase 7: Flag Removal
```swift
// Delete FeatureFlags enum entirely
// All code assumes backend API and cloud sync
```

### Usage Example

```swift
func saveHero(_ hero: Hero) async throws {
    if FeatureFlags.enableCloudSync {
        // New: Save through repository with sync
        try await heroRepository.create(hero)
    } else {
        // Old: Direct save to SwiftData
        modelContext.insert(hero)
        try modelContext.save()
    }
}
```

---

## Migration Checklist

### Phase 1: Foundation

- [ ] Mark `AIService` as deprecated
- [ ] Mark `AIService` methods with replacement guidance
- [ ] Add deprecation to Keychain API key methods
- [ ] Create `APIClient` service
- [ ] Create `AuthManager` service
- [ ] Create `CacheManager` service
- [ ] Add sync metadata to all models
- [ ] Define feature flags
- [ ] Update documentation

### Phase 2: Repository Layer

- [ ] Create `HeroRepository`
- [ ] Create `StoryRepository`
- [ ] Create `CustomEventRepository`
- [ ] Update `StoryViewModel` to use repositories
- [ ] Update `HeroCreationView` to use repositories
- [ ] Remove direct `modelContext` access from ViewModels
- [ ] Test parallel code paths work

### Phase 3: Sync Engine

- [ ] Create `SyncEngine` service
- [ ] Create `BackgroundSyncManager` service
- [ ] Route AIService calls through backend (feature flag)
- [ ] Log usage of deprecated methods
- [ ] Test conflict resolution
- [ ] Verify background sync works

### Phase 4: Media Management

- [ ] Create `MediaCacheManager`
- [ ] Implement R2 upload/download
- [ ] Update models to store R2 URLs
- [ ] Implement cache eviction
- [ ] Test media sync

### Phase 5: Offline Mode

- [ ] Remove OpenAI API key from Settings UI
- [ ] Delete Keychain API key methods
- [ ] Remove direct OpenAI calls (keep backend only)
- [ ] Remove `useBackendAPI` feature flag (always true)
- [ ] Test offline functionality thoroughly

### Phase 6: Migration Tool

- [ ] **Delete `AIService.swift`**
- [ ] Delete deprecated Keychain methods
- [ ] Delete OpenAI Settings UI components
- [ ] Remove all deprecation warnings
- [ ] Create migration tool UI
- [ ] Test migration with real user data

### Phase 7: Testing & Polish

- [ ] Remove remaining feature flags
- [ ] Clean up unused imports
- [ ] Update all documentation
- [ ] Verify no deprecation warnings
- [ ] Performance testing
- [ ] Final code review

---

## Summary

This deprecation strategy ensures:

1. ✅ **Gradual Migration**: 7-week phased approach prevents big-bang changes
2. ✅ **Backward Compatibility**: Old code works during transition via feature flags
3. ✅ **Safe Rollback**: Can revert to old code path if issues discovered
4. ✅ **Clear Guidance**: Deprecation warnings guide developers to new APIs
5. ✅ **Clean Result**: All deprecated code removed by Phase 7, clean codebase

**Next Steps**:
1. Review and approve deprecation timeline
2. Begin Phase 1 implementation
3. Monitor usage of deprecated methods
4. Validate new code paths before removal

---

**For implementation details, see**: [PRD_IOS_API_INTEGRATION_IMPLEMENTATION.md](./PRD_IOS_API_INTEGRATION_IMPLEMENTATION.md)
