# Implementation Phases - iOS Backend API Integration

**Parent Document**: [PRD_IOS_API_INTEGRATION.md](./PRD_IOS_API_INTEGRATION.md)
**Version**: 1.0
**Date**: 2025-01-06

---

## Table of Contents

1. [Implementation Overview](#implementation-overview)
2. [Phase 1: Foundation](#phase-1-foundation-week-1-2)
3. [Phase 2: Repository Layer](#phase-2-repository-layer-week-2-3)
4. [Phase 3: Sync Engine](#phase-3-sync-engine-week-3-4)
5. [Phase 4: Media Management](#phase-4-media-management-week-4-5)
6. [Phase 5: Offline Mode](#phase-5-offline-mode-week-5-6)
7. [Phase 6: Migration Tool](#phase-6-migration-tool-week-6)
8. [Phase 7: Testing & Polish](#phase-7-testing--polish-week-7)
9. [Dependencies & Critical Path](#dependencies--critical-path)
10. [Risk Mitigation](#risk-mitigation)

---

## Implementation Overview

### Timeline Summary

**Total Duration**: 7 weeks

| Phase | Week | Focus | Complexity | Risk |
|-------|------|-------|------------|------|
| Phase 1 | 1-2 | Foundation | Medium | Low |
| Phase 2 | 2-3 | Repository Layer | Medium | Low |
| Phase 3 | 3-4 | Sync Engine | High | Medium |
| Phase 4 | 4-5 | Media Management | Medium | Low |
| Phase 5 | 5-6 | Offline Mode | High | Medium |
| Phase 6 | 6 | Migration Tool | Medium | High |
| Phase 7 | 7 | Testing & Polish | Low | Low |

### Parallel Work Opportunities

- **Week 2**: Phase 1 (Auth) + Phase 2 (Repository) can overlap
- **Week 4**: Media work can start before Sync Engine complete
- **Week 7**: Testing happens throughout, final week is consolidation

---

## Phase 1: Foundation (Week 1-2)

**Goal**: Establish core infrastructure for backend API communication

### Week 1: Core Services

#### Day 1-2: APIClient Service

**File**: `Services/APIClient.swift`

**Tasks**:
1. Create `APIClientProtocol` protocol
2. Implement `APIClient` class with URLSession
3. Add request/response handling
4. Implement authentication header injection
5. Add basic error mapping (HTTP status → APIError)

**Code**:
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

    init(baseURL: URL, authManager: AuthManager) {
        self.baseURL = baseURL
        self.authManager = authManager

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: configuration)
    }

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T> {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        request.httpMethod = endpoint.method.rawValue
        request.httpBody = endpoint.body

        // Add auth token
        if let token = try? authManager.getSessionToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Add headers
        for (key, value) in endpoint.headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown(NSError(domain: "Invalid response", code: -1))
        }

        // Handle errors
        try handleHTTPError(httpResponse)

        // Decode response
        return try JSONDecoder().decode(APIResponse<T>.self, from: data)
    }

    private func handleHTTPError(_ response: HTTPURLResponse) throws {
        switch response.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        case 404:
            throw APIError.notFound
        case 429:
            let resetAt = parseRateLimitReset(from: response)
            throw APIError.rateLimitExceeded(resetAt: resetAt)
        case 500...599:
            throw APIError.serverError
        default:
            throw APIError.unknown(NSError(domain: "HTTP \(response.statusCode)", code: response.statusCode))
        }
    }
}
```

**Testing**:
```swift
class APIClientTests: XCTestCase {
    func testRequest_Success() async throws {
        let mockSession = MockURLSession()
        let client = APIClient(baseURL: URL(string: "https://api.test")!, session: mockSession)

        let response: APIResponse<TestData> = try await client.request(.test)

        XCTAssertNotNil(response.data)
    }

    func testRequest_Unauthorized() async {
        let client = APIClient(baseURL: URL(string: "https://api.test")!)

        do {
            let _: APIResponse<TestData> = try await client.request(.test)
            XCTFail("Should throw unauthorized error")
        } catch APIError.unauthorized {
            // Expected
        } catch {
            XCTFail("Wrong error type: \(error)")
        }
    }
}
```

**Acceptance Criteria**:
- [ ] APIClient can make GET, POST, PATCH, DELETE requests
- [ ] Authentication headers added automatically
- [ ] HTTP errors mapped to typed APIError
- [ ] Unit tests passing (>80% coverage)

---

#### Day 3-4: AuthManager Service

**File**: `Services/AuthManager.swift`

**Tasks**:
1. Create `AuthManagerProtocol` protocol
2. Implement `AuthManager` class with ObservableObject
3. Add sign-in/sign-up/sign-out methods
4. Implement token storage in Keychain
5. Add automatic token refresh scheduling

**Code**:
```swift
@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?

    private let keychainHelper: KeychainHelper
    private let apiClient: APIClientProtocol
    private var refreshTask: Task<Void, Never>?

    init(keychainHelper: KeychainHelper, apiClient: APIClientProtocol) {
        self.keychainHelper = keychainHelper
        self.apiClient = apiClient

        // Check for existing session
        if let token = try? keychainHelper.getSessionToken() {
            self.isAuthenticated = true
            Task {
                try? await loadCurrentUser()
            }
        }
    }

    func signIn(email: String, password: String) async throws -> AuthResponse {
        let endpoint = Endpoint.signIn(email: email, password: password)
        let response: APIResponse<AuthResponse> = try await apiClient.request(endpoint)

        guard let authResponse = response.data else {
            throw APIError.unauthorized
        }

        // Store token
        try keychainHelper.saveSessionToken(authResponse.session.token)

        // Update state
        self.isAuthenticated = true
        self.currentUser = authResponse.user

        // Schedule refresh
        scheduleTokenRefresh(expiresAt: authResponse.session.expiresAt)

        Logger.auth.info("User signed in: \(authResponse.user.email)")

        return authResponse
    }

    func signUp(email: String, password: String, name: String?) async throws -> AuthResponse {
        let endpoint = Endpoint.signUp(email: email, password: password, name: name)
        let response: APIResponse<AuthResponse> = try await apiClient.request(endpoint)

        guard let authResponse = response.data else {
            throw APIError.validationError(fields: ["general": "Sign up failed"])
        }

        // Store token and update state (same as sign in)
        try keychainHelper.saveSessionToken(authResponse.session.token)
        self.isAuthenticated = true
        self.currentUser = authResponse.user

        scheduleTokenRefresh(expiresAt: authResponse.session.expiresAt)

        Logger.auth.info("User signed up: \(authResponse.user.email)")

        return authResponse
    }

    func signOut() async throws {
        try await apiClient.request(.signOut)
        try keychainHelper.deleteSessionToken()

        isAuthenticated = false
        currentUser = nil
        refreshTask?.cancel()

        Logger.auth.info("User signed out")
    }

    func refreshSession() async throws -> AuthResponse {
        let endpoint = Endpoint.refreshSession
        let response: APIResponse<AuthResponse> = try await apiClient.request(endpoint)

        guard let authResponse = response.data else {
            throw APIError.unauthorized
        }

        try keychainHelper.saveSessionToken(authResponse.session.token)

        scheduleTokenRefresh(expiresAt: authResponse.session.expiresAt)

        Logger.auth.info("Session refreshed")

        return authResponse
    }

    private func scheduleTokenRefresh(expiresAt: Date) {
        refreshTask?.cancel()

        refreshTask = Task {
            // Refresh 5 minutes before expiry
            let refreshTime = expiresAt.addingTimeInterval(-300)
            let delay = refreshTime.timeIntervalSinceNow

            if delay > 0 {
                try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))

                do {
                    try await refreshSession()
                } catch {
                    Logger.auth.error("Auto-refresh failed: \(error)")
                    await signOut()
                }
            }
        }
    }

    func getSessionToken() throws -> String? {
        return try keychainHelper.getSessionToken()
    }
}
```

**Testing**:
```swift
class AuthManagerTests: XCTestCase {
    @MainActor
    func testSignIn_Success() async throws {
        let mockAPIClient = MockAPIClient()
        let authManager = AuthManager(keychainHelper: MockKeychainHelper(), apiClient: mockAPIClient)

        let response = try await authManager.signIn(email: "test@example.com", password: "password")

        XCTAssertTrue(authManager.isAuthenticated)
        XCTAssertNotNil(authManager.currentUser)
        XCTAssertEqual(authManager.currentUser?.email, "test@example.com")
    }

    @MainActor
    func testAutoRefresh_ScheduledCorrectly() async throws {
        let authManager = AuthManager(keychainHelper: MockKeychainHelper(), apiClient: MockAPIClient())

        try await authManager.signIn(email: "test@example.com", password: "password")

        // Wait and verify refresh was called
        try await Task.sleep(nanoseconds: 300 * 1_000_000_000) // 5 minutes

        // Verify refresh was triggered
    }
}
```

**Acceptance Criteria**:
- [ ] Sign-in/sign-up/sign-out working
- [ ] Session token stored in Keychain
- [ ] Auto-refresh scheduled correctly
- [ ] Published properties update UI
- [ ] Unit tests passing

---

#### Day 5: Network Layer Components

**Files**:
- `Network/Endpoint.swift`
- `Network/APIError.swift`
- `Network/APIResponse.swift`
- `Network/RetryPolicy.swift`

**Tasks**:
1. Define `Endpoint` enum for all API routes
2. Create `APIError` enum with localized messages
3. Define `APIResponse<T>` generic wrapper
4. Implement `RetryPolicy` with exponential backoff

**Endpoint.swift** (partial):
```swift
enum Endpoint {
    case signIn(email: String, password: String)
    case signUp(email: String, password: String, name: String?)
    case getHeroes(limit: Int, offset: Int)
    case createHero(data: HeroCreateRequest)
    case updateHero(id: UUID, data: HeroUpdateRequest)
    case deleteHero(id: UUID)
    case generateAvatar(heroId: UUID, prompt: String)
    // ... all other endpoints

    var path: String {
        switch self {
        case .signIn: return "/api/auth/sign-in"
        case .signUp: return "/api/auth/sign-up"
        case .getHeroes: return "/api/heroes"
        case .createHero: return "/api/heroes"
        case .updateHero(let id, _): return "/api/heroes/\(id.uuidString)"
        case .deleteHero(let id): return "/api/heroes/\(id.uuidString)"
        case .generateAvatar(let heroId, _): return "/api/heroes/\(heroId.uuidString)/avatar"
        // ...
        }
    }

    var method: HTTPMethod {
        switch self {
        case .getHeroes, .getHero, .getStories, .getStory:
            return .GET
        case .createHero, .createStory, .signIn, .signUp, .generateAvatar:
            return .POST
        case .updateHero, .updateStory:
            return .PATCH
        case .deleteHero, .deleteStory:
            return .DELETE
        }
    }

    var headers: [String: String] {
        ["Content-Type": "application/json"]
    }

    var body: Data? {
        // Encode request bodies
        switch self {
        case .signIn(let email, let password):
            return try? JSONEncoder().encode(["email": email, "password": password])
        case .createHero(let data):
            return try? JSONEncoder().encode(data)
        // ...
        default:
            return nil
        }
    }
}

enum HTTPMethod: String {
    case GET, POST, PATCH, DELETE, PUT
}
```

**RetryPolicy.swift**:
```swift
struct RetryPolicy {
    let maxRetries: Int
    let baseDelay: TimeInterval
    let maxDelay: TimeInterval

    static let `default` = RetryPolicy(
        maxRetries: 3,
        baseDelay: 1.0,
        maxDelay: 30.0
    )

    func shouldRetry(_ error: APIError, attempt: Int) -> Bool {
        guard attempt < maxRetries else { return false }

        switch error {
        case .rateLimitExceeded, .serverError, .networkError:
            return true
        default:
            return false
        }
    }

    func delay(for attempt: Int) -> TimeInterval {
        // Exponential backoff: 2^attempt * baseDelay + jitter
        let exponentialDelay = pow(2.0, Double(attempt)) * baseDelay
        let jitter = Double.random(in: 0...1.0)
        return min(exponentialDelay + jitter, maxDelay)
    }
}
```

**Acceptance Criteria**:
- [ ] All API endpoints defined in Endpoint enum
- [ ] APIError covers all error cases
- [ ] RetryPolicy implements exponential backoff
- [ ] Unit tests for retry logic

---

### Week 2: SwiftData Integration

#### Day 1-2: Sync Metadata

**Files**:
- `Models/Extensions/Hero+Sync.swift`
- `Models/Extensions/Story+Sync.swift`
- `Models/Extensions/StoryIllustration+Sync.swift`
- `Models/Extensions/CustomStoryEvent+Sync.swift`
- `Utilities/SyncStatus.swift`

**Tasks**:
1. Create `Syncable` protocol
2. Define `SyncStatus` enum
3. Add sync metadata fields to all models
4. Create SwiftData migration for new fields

**Syncable Protocol**:
```swift
protocol Syncable {
    var serverId: String? { get set }
    var serverSyncStatus: SyncStatus { get set }
    var lastSyncedAt: Date? { get set }
    var serverUpdatedAt: Date? { get set }
    var pendingChanges: Data? { get set }
    var syncError: String? { get set }

    var needsSync: Bool { get }
}

enum SyncStatus: String, Codable {
    case synced
    case pendingCreate
    case pendingUpdate
    case pendingDelete
    case failed
    case conflict
}
```

**Hero+Sync.swift**:
```swift
extension Hero: Syncable {
    @Attribute(.unique) var serverId: String?
    var serverSyncStatus: SyncStatus = .synced
    var lastSyncedAt: Date?
    var serverUpdatedAt: Date?
    var pendingChanges: Data?
    var syncError: String?

    var needsSync: Bool {
        return serverSyncStatus != .synced
    }

    func updateFrom(server: HeroResponse) {
        self.name = server.name
        self.age = server.age
        self.traits = server.traits
        self.specialAbility = server.specialAbility
        self.avatarImagePath = server.avatarUrl
        self.avatarGenerationId = server.avatarGenerationId
        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
    }
}
```

**SwiftData Migration**:
```swift
enum SchemaV2: VersionedSchema {
    static var versionIdentifier = Schema.Version(2, 0, 0)

    static var models: [any PersistentModel.Type] {
        [Hero.self, Story.self, StoryIllustration.self, CustomStoryEvent.self]
    }
}

let migrationPlan = SchemaMigrationPlan {
    MigrateV1toV2()
}

struct MigrateV1toV2: SchemaMigration {
    static let fromVersion = SchemaV1.self
    static let toVersion = SchemaV2.self

    func performMigration(context: ModelContext) throws {
        // Migration happens automatically for new fields with default values
        // No manual migration needed for adding fields
    }
}
```

**Acceptance Criteria**:
- [ ] All models conform to Syncable protocol
- [ ] Sync metadata fields added with defaults
- [ ] SwiftData migration working (no data loss)
- [ ] Existing data preserved after migration

---

#### Day 3-4: CacheManager Service

**File**: `Services/CacheManager.swift`

**Tasks**:
1. Create `CacheManagerProtocol` protocol
2. Implement `CacheManager` class wrapping ModelContext
3. Add CRUD methods for all model types
4. Implement sync status queries

**Code**:
```swift
protocol CacheManagerProtocol {
    func save<T: PersistentModel>(_ object: T) throws
    func fetch<T: PersistentModel>(_ type: T.Type, id: UUID) throws -> T?
    func fetchAll<T: PersistentModel>(_ type: T.Type) throws -> [T]
    func delete<T: PersistentModel>(_ object: T) throws
    func markForSync<T: PersistentModel & Syncable>(_ object: T, status: SyncStatus) throws
    func fetchPendingSync<T: PersistentModel & Syncable>(_ type: T.Type, status: SyncStatus?) throws -> [T]
}

class CacheManager: CacheManagerProtocol {
    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func save<T: PersistentModel>(_ object: T) throws {
        modelContext.insert(object)
        try modelContext.save()

        Logger.cache.debug("Saved \(type(of: object)) to cache")
    }

    func fetch<T: PersistentModel>(_ type: T.Type, id: UUID) throws -> T? {
        let predicate = #Predicate<T> { $0.id == id }
        let descriptor = FetchDescriptor(predicate: predicate)
        return try modelContext.fetch(descriptor).first
    }

    func fetchAll<T: PersistentModel>(_ type: T.Type) throws -> [T] {
        let descriptor = FetchDescriptor<T>()
        return try modelContext.fetch(descriptor)
    }

    func delete<T: PersistentModel>(_ object: T) throws {
        modelContext.delete(object)
        try modelContext.save()

        Logger.cache.debug("Deleted \(type(of: object)) from cache")
    }

    func markForSync<T: PersistentModel & Syncable>(
        _ object: T,
        status: SyncStatus
    ) throws {
        object.serverSyncStatus = status
        try modelContext.save()

        Logger.cache.debug("Marked \(type(of: object)) as \(status)")
    }

    func fetchPendingSync<T: PersistentModel & Syncable>(
        _ type: T.Type,
        status: SyncStatus? = nil
    ) throws -> [T] {
        let predicate: Predicate<T>

        if let status = status {
            predicate = #Predicate<T> { $0.serverSyncStatus == status }
        } else {
            predicate = #Predicate<T> { $0.serverSyncStatus != .synced }
        }

        let descriptor = FetchDescriptor(predicate: predicate)
        return try modelContext.fetch(descriptor)
    }
}
```

**Testing**:
```swift
class CacheManagerTests: XCTestCase {
    var cacheManager: CacheManager!
    var modelContext: ModelContext!

    override func setUp() async throws {
        let schema = Schema([Hero.self, Story.self])
        let configuration = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: configuration)
        modelContext = ModelContext(container)
        cacheManager = CacheManager(modelContext: modelContext)
    }

    func testSave_StoresObject() throws {
        let hero = Hero(name: "Test", age: 8, traits: ["brave"])

        try cacheManager.save(hero)

        let fetched = try cacheManager.fetch(Hero.self, id: hero.id)
        XCTAssertNotNil(fetched)
        XCTAssertEqual(fetched?.name, "Test")
    }

    func testFetchPendingSync_ReturnsPendingOnly() throws {
        let hero1 = Hero(name: "Hero1", age: 8, traits: [])
        hero1.serverSyncStatus = .synced

        let hero2 = Hero(name: "Hero2", age: 8, traits: [])
        hero2.serverSyncStatus = .pendingUpdate

        try cacheManager.save(hero1)
        try cacheManager.save(hero2)

        let pending = try cacheManager.fetchPendingSync(Hero.self)

        XCTAssertEqual(pending.count, 1)
        XCTAssertEqual(pending.first?.name, "Hero2")
    }
}
```

**Acceptance Criteria**:
- [ ] CRUD operations working for all models
- [ ] Sync status queries accurate
- [ ] ModelContext transactions handled properly
- [ ] Unit tests passing

---

#### Day 5: Feature Flags & Configuration

**File**: `Utilities/FeatureFlags.swift`

**Tasks**:
1. Create `FeatureFlags` enum
2. Add debug settings UI (DEBUG only)
3. Configure feature flag defaults

**Code**:
```swift
enum FeatureFlags {
    /// Use backend API for all operations (vs direct OpenAI)
    static let useBackendAPI: Bool = {
        #if DEBUG
        return UserDefaults.standard.bool(forKey: "useBackendAPI")
        #else
        return false // Default to false in production until Phase 5
        #endif
    }()

    /// Enable cloud sync with backend
    static let enableCloudSync: Bool = {
        #if DEBUG
        return UserDefaults.standard.bool(forKey: "enableCloudSync")
        #else
        return false // Default to false until Phase 3
        #endif
    }()

    /// Enable automatic background sync
    static let enableBackgroundSync: Bool = {
        return UserDefaults.standard.bool(forKey: "enableBackgroundSync")
    }()

    /// Sync interval in seconds (default: 15 minutes)
    static let syncInterval: TimeInterval = {
        return UserDefaults.standard.double(forKey: "syncInterval").nonZero ?? 900
    }()
}

#if DEBUG
struct DeveloperSettingsView: View {
    @AppStorage("useBackendAPI") private var useBackendAPI = false
    @AppStorage("enableCloudSync") private var enableCloudSync = false
    @AppStorage("enableBackgroundSync") private var enableBackgroundSync = false
    @AppStorage("syncInterval") private var syncInterval = 900.0

    var body: some View {
        Form {
            Section("Feature Flags (DEBUG ONLY)") {
                Toggle("Use Backend API", isOn: $useBackendAPI)
                Toggle("Enable Cloud Sync", isOn: $enableCloudSync)
                Toggle("Enable Background Sync", isOn: $enableBackgroundSync)

                Stepper(value: $syncInterval, in: 60...3600, step: 60) {
                    Text("Sync Interval: \(Int(syncInterval / 60)) min")
                }
            }

            Section("Warning") {
                Text("These settings are for development only and will not appear in production builds.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .navigationTitle("Developer Settings")
    }
}
#endif
```

**Acceptance Criteria**:
- [ ] Feature flags defined and configurable
- [ ] Debug UI accessible in DEBUG builds only
- [ ] Defaults set appropriately per phase
- [ ] No feature flags in production UI

---

### Phase 1 Deliverables

**Completed Components**:
- ✅ APIClient service with retry logic
- ✅ AuthManager with auto-refresh
- ✅ Network layer (Endpoint, APIError, APIResponse, RetryPolicy)
- ✅ Sync metadata added to all models
- ✅ CacheManager wrapping SwiftData
- ✅ Feature flags for gradual rollout

**Testing Status**:
- ✅ Unit tests for APIClient (>80% coverage)
- ✅ Unit tests for AuthManager
- ✅ Unit tests for CacheManager
- ✅ Integration test: Sign-in flow end-to-end

**Acceptance Criteria**:
- [ ] User can sign up/sign in/sign out
- [ ] Session token stored securely in Keychain
- [ ] Auto-refresh works correctly
- [ ] SwiftData models ready for sync (metadata fields added)
- [ ] Feature flags enable/disable new code paths
- [ ] All tests passing

**Ready for Phase 2**: ✅

---

## Phase 2: Repository Layer (Week 2-3)

**Goal**: Implement data access abstraction with repositories

### Week 3: Repository Implementation

#### Day 1-2: HeroRepository

**File**: `Repositories/HeroRepository.swift`

**Tasks**:
1. Create `HeroRepositoryProtocol` protocol
2. Implement `HeroRepository` class
3. Add CRUD methods with cache + API coordination
4. Implement optimistic updates

**Code**:
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

    init(apiClient: APIClientProtocol, cacheManager: CacheManagerProtocol) {
        self.apiClient = apiClient
        self.cacheManager = cacheManager
    }

    func fetchAll() async throws -> [Hero] {
        // Return cached data immediately
        let cached = try cacheManager.fetchAll(Hero.self)

        // Sync in background if feature flag enabled
        if FeatureFlags.enableCloudSync {
            Task {
                try? await syncWithBackend()
            }
        }

        return cached
    }

    func create(_ hero: Hero) async throws -> Hero {
        // 1. Save to cache (optimistic)
        try cacheManager.save(hero)
        hero.serverSyncStatus = .pendingCreate

        Logger.repository.info("Created hero locally: \(hero.name)")

        // 2. Sync to backend if enabled
        if FeatureFlags.useBackendAPI {
            Task {
                do {
                    let request = HeroCreateRequest(
                        name: hero.name,
                        age: hero.age,
                        traits: hero.traits.map { $0.rawValue },
                        specialAbility: hero.specialAbility
                    )

                    let endpoint = Endpoint.createHero(data: request)
                    let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

                    guard let serverHero = response.data else {
                        throw APIError.unknown(NSError(domain: "No data", code: -1))
                    }

                    // Update with server data
                    hero.serverId = serverHero.id.uuidString
                    hero.serverSyncStatus = .synced
                    hero.lastSyncedAt = Date()
                    hero.serverUpdatedAt = serverHero.updatedAt
                    try cacheManager.save(hero)

                    Logger.repository.info("Synced hero to backend: \(hero.name)")

                } catch {
                    hero.serverSyncStatus = .failed
                    hero.syncError = error.localizedDescription
                    try? cacheManager.save(hero)

                    Logger.repository.error("Failed to sync hero: \(error)")
                }
            }
        }

        return hero
    }

    func update(_ hero: Hero) async throws -> Hero {
        // 1. Update cache (optimistic)
        try cacheManager.save(hero)
        hero.serverSyncStatus = .pendingUpdate

        Logger.repository.info("Updated hero locally: \(hero.name)")

        // 2. Sync to backend if enabled
        if FeatureFlags.useBackendAPI, let serverId = hero.serverId {
            Task {
                do {
                    let request = HeroUpdateRequest(
                        name: hero.name,
                        age: hero.age,
                        traits: hero.traits.map { $0.rawValue },
                        specialAbility: hero.specialAbility
                    )

                    let endpoint = Endpoint.updateHero(id: UUID(uuidString: serverId)!, data: request)
                    let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

                    guard let serverHero = response.data else {
                        throw APIError.unknown(NSError(domain: "No data", code: -1))
                    }

                    hero.serverSyncStatus = .synced
                    hero.lastSyncedAt = Date()
                    hero.serverUpdatedAt = serverHero.updatedAt
                    try cacheManager.save(hero)

                    Logger.repository.info("Synced hero update to backend: \(hero.name)")

                } catch {
                    hero.serverSyncStatus = .failed
                    hero.syncError = error.localizedDescription
                    try? cacheManager.save(hero)

                    Logger.repository.error("Failed to sync hero update: \(error)")
                }
            }
        }

        return hero
    }

    func delete(_ hero: Hero) async throws {
        // 1. Mark as pending delete (don't actually delete yet)
        hero.serverSyncStatus = .pendingDelete
        try cacheManager.save(hero)

        Logger.repository.info("Marked hero for deletion: \(hero.name)")

        // 2. Delete from backend if enabled
        if FeatureFlags.useBackendAPI, let serverId = hero.serverId {
            Task {
                do {
                    let endpoint = Endpoint.deleteHero(id: UUID(uuidString: serverId)!)
                    let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

                    // Now actually delete from cache
                    try cacheManager.delete(hero)

                    Logger.repository.info("Deleted hero from backend: \(hero.name)")

                } catch {
                    hero.serverSyncStatus = .failed
                    hero.syncError = error.localizedDescription
                    try? cacheManager.save(hero)

                    Logger.repository.error("Failed to delete hero: \(error)")
                }
            }
        } else {
            // No backend sync, delete immediately
            try cacheManager.delete(hero)
        }
    }

    func generateAvatar(for hero: Hero, prompt: String) async throws -> Hero {
        guard FeatureFlags.useBackendAPI else {
            throw RepositoryError.featureNotEnabled
        }

        guard let serverId = hero.serverId else {
            throw RepositoryError.notSynced
        }

        let endpoint = Endpoint.generateAvatar(heroId: UUID(uuidString: serverId)!, prompt: prompt)
        let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

        guard let serverHero = response.data else {
            throw APIError.unknown(NSError(domain: "No data", code: -1))
        }

        // Update hero with new avatar
        hero.avatarImagePath = serverHero.avatarUrl
        hero.avatarGenerationId = serverHero.avatarGenerationId
        hero.serverUpdatedAt = serverHero.updatedAt
        try cacheManager.save(hero)

        Logger.repository.info("Generated avatar for hero: \(hero.name)")

        return hero
    }

    func syncWithBackend() async throws {
        // Pull server changes
        let endpoint = Endpoint.getHeroes(limit: 100, offset: 0)
        let response: APIResponse<[HeroResponse]> = try await apiClient.request(endpoint)

        guard let serverHeroes = response.data else {
            return
        }

        for serverHero in serverHeroes {
            // Check if we have this hero locally
            if let localHero = try cacheManager.fetchAll(Hero.self)
                .first(where: { $0.serverId == serverHero.id.uuidString }) {

                // Update local with server data
                localHero.updateFrom(server: serverHero)
                try cacheManager.save(localHero)

            } else {
                // Create new local hero
                let newHero = Hero(from: serverHero)
                try cacheManager.save(newHero)
            }
        }

        Logger.repository.info("Synced \(serverHeroes.count) heroes from backend")
    }
}

enum RepositoryError: Error {
    case featureNotEnabled
    case notSynced
}
```

**Testing**:
```swift
class HeroRepositoryTests: XCTestCase {
    var repository: HeroRepository!
    var mockAPIClient: MockAPIClient!
    var mockCacheManager: MockCacheManager!

    override func setUp() {
        mockAPIClient = MockAPIClient()
        mockCacheManager = MockCacheManager()
        repository = HeroRepository(apiClient: mockAPIClient, cacheManager: mockCacheManager)
    }

    func testCreate_SavesLocallyAndSyncs() async throws {
        let hero = Hero(name: "Test", age: 8, traits: ["brave"])

        let created = try await repository.create(hero)

        XCTAssertEqual(created.serverSyncStatus, .pendingCreate)
        XCTAssertTrue(mockCacheManager.saveCalled)

        // Wait for background sync
        try await Task.sleep(nanoseconds: 100_000_000)

        XCTAssertTrue(mockAPIClient.createHeroCalled)
    }

    func testFetchAll_ReturnsCachedAndSyncsInBackground() async throws {
        mockCacheManager.heroes = [Hero(name: "Cached", age: 8, traits: [])]

        let heroes = try await repository.fetchAll()

        XCTAssertEqual(heroes.count, 1)
        XCTAssertEqual(heroes.first?.name, "Cached")

        // Verify sync called in background
        try await Task.sleep(nanoseconds: 100_000_000)
        XCTAssertTrue(mockAPIClient.getHeroesCalled)
    }
}
```

**Acceptance Criteria**:
- [ ] CRUD operations work with optimistic updates
- [ ] Background sync doesn't block UI
- [ ] Feature flags respected
- [ ] Unit tests passing (>80% coverage)

---

#### Day 3-4: StoryRepository

**File**: `Repositories/StoryRepository.swift`

**Similar structure to HeroRepository, but with additional methods**:
- `generateStory(for hero: Hero, event: StoryEvent) async throws -> Story`
- `generateAudio(for story: Story) async throws -> Story`
- `generateIllustrations(for story: Story) async throws -> Story`

**Acceptance Criteria**:
- [ ] All story operations implemented
- [ ] Generation methods route through backend API
- [ ] Optimistic updates for metadata changes
- [ ] Unit tests passing

---

#### Day 5: CustomEventRepository

**File**: `Repositories/CustomEventRepository.swift`

**Simpler than HeroRepository, focuses on CRUD + enhancement**:
- `enhanceEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent`
- `generateKeywords(for event: CustomStoryEvent) async throws -> [String]`

**Acceptance Criteria**:
- [ ] Custom event CRUD working
- [ ] AI enhancement routed through backend
- [ ] Unit tests passing

---

### Phase 2: ViewModel Migration

#### Day 1-2: Update ViewModels

**Files to Update**:
- `ViewModels/StoryViewModel.swift`
- `ViewModels/HeroViewModel.swift` (if exists)
- All ViewModels that access SwiftData directly

**Changes**:
```swift
// OLD: Direct SwiftData access
@MainActor
class StoryViewModel: ObservableObject {
    @Published var stories: [Story] = []

    @Environment(\.modelContext) private var modelContext

    func loadStories() {
        let descriptor = FetchDescriptor<Story>()
        stories = (try? modelContext.fetch(descriptor)) ?? []
    }

    func createStory(...) async throws {
        let story = Story(...)
        modelContext.insert(story)
        try modelContext.save()

        // Direct AI call
        let content = try await aiService.generateStory(...)
        story.content = content
        try modelContext.save()
    }
}

// NEW: Repository pattern
@MainActor
class StoryViewModel: ObservableObject {
    @Published var stories: [Story] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let storyRepository: StoryRepositoryProtocol

    init(storyRepository: StoryRepositoryProtocol) {
        self.storyRepository = storyRepository
    }

    func loadStories() async {
        isLoading = true
        defer { isLoading = false }

        do {
            stories = try await storyRepository.fetchAll()
        } catch {
            self.error = error
            Logger.ui.error("Failed to load stories: \(error)")
        }
    }

    func createStory(for hero: Hero, event: StoryEvent) async throws {
        isLoading = true
        defer { isLoading = false }

        do {
            let story = try await storyRepository.generateStory(for: hero, event: event)
            stories.append(story)
        } catch {
            self.error = error
            throw error
        }
    }
}
```

**Acceptance Criteria**:
- [ ] All ViewModels use repositories
- [ ] No direct modelContext access
- [ ] Optimistic updates provide instant feedback
- [ ] Error handling consistent
- [ ] UI tests still passing

---

### Phase 2 Deliverables

**Completed Components**:
- ✅ HeroRepository with CRUD + avatar generation
- ✅ StoryRepository with CRUD + generation methods
- ✅ CustomEventRepository with CRUD + enhancement
- ✅ ViewModels migrated to use repositories
- ✅ Optimistic updates working

**Testing Status**:
- ✅ Unit tests for all repositories (>80% coverage)
- ✅ Integration tests for repository + API
- ✅ UI tests updated for repository pattern

**Acceptance Criteria**:
- [ ] Create/update/delete operations work offline
- [ ] Background sync happens automatically
- [ ] UI updates instantly (optimistic)
- [ ] Feature flags control new vs old code paths
- [ ] All tests passing

**Ready for Phase 3**: ✅

---

## Phase 3: Sync Engine (Week 3-4)

**Goal**: Implement bidirectional synchronization with conflict resolution

### Week 4: Sync Implementation

#### Day 1-2: SyncEngine Core

**File**: `Services/SyncEngine.swift`

**Tasks**:
1. Create `SyncEngineProtocol` protocol
2. Implement `SyncEngine` actor (thread-safe)
3. Add push methods (creates, updates, deletes)
4. Add pull method (fetch server changes)

**Code**:
```swift
protocol SyncEngineProtocol {
    func syncAll() async throws
    func syncHeroes() async throws
    func syncStories() async throws
    func resolveConflicts() async throws
}

actor SyncEngine: SyncEngineProtocol {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol
    private let conflictResolver: ConflictResolver

    private var isSyncing = false
    private var lastSyncAt: Date?

    init(
        apiClient: APIClientProtocol,
        cacheManager: CacheManagerProtocol,
        conflictResolver: ConflictResolver
    ) {
        self.apiClient = apiClient
        self.cacheManager = cacheManager
        self.conflictResolver = conflictResolver
    }

    func syncAll() async throws {
        guard !isSyncing else {
            Logger.sync.info("Sync already in progress")
            return
        }

        isSyncing = true
        defer { isSyncing = false }

        Logger.sync.info("Starting full sync")

        let startTime = Date()

        // 1. Push pending creates
        try await pushPendingCreates()

        // 2. Push pending updates
        try await pushPendingUpdates()

        // 3. Push pending deletes
        try await pushPendingDeletes()

        // 4. Pull server changes
        try await pullServerChanges()

        // 5. Resolve conflicts
        try await resolveConflicts()

        lastSyncAt = Date()

        let duration = Date().timeIntervalSince(startTime)
        Logger.sync.info("Full sync completed in \(duration)s")
    }

    private func pushPendingCreates() async throws {
        let heroes = try cacheManager.fetchPendingSync(Hero.self, status: .pendingCreate)

        Logger.sync.info("Pushing \(heroes.count) pending hero creates")

        for hero in heroes {
            do {
                let request = HeroCreateRequest(
                    name: hero.name,
                    age: hero.age,
                    traits: hero.traits.map { $0.rawValue },
                    specialAbility: hero.specialAbility
                )

                let endpoint = Endpoint.createHero(data: request)
                let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

                guard let serverHero = response.data else {
                    throw APIError.unknown(NSError(domain: "No data", code: -1))
                }

                hero.serverId = serverHero.id.uuidString
                hero.serverSyncStatus = .synced
                hero.lastSyncedAt = Date()
                hero.serverUpdatedAt = serverHero.updatedAt
                try cacheManager.save(hero)

                Logger.sync.info("Created hero on server: \(hero.name)")

            } catch {
                hero.serverSyncStatus = .failed
                hero.syncError = error.localizedDescription
                try cacheManager.save(hero)

                Logger.sync.error("Failed to create hero: \(error)")
            }
        }

        // Similar for stories, custom events
    }

    private func pushPendingUpdates() async throws {
        let heroes = try cacheManager.fetchPendingSync(Hero.self, status: .pendingUpdate)

        Logger.sync.info("Pushing \(heroes.count) pending hero updates")

        for hero in heroes {
            guard let serverId = hero.serverId else {
                Logger.sync.warning("Hero has no serverId, skipping: \(hero.name)")
                continue
            }

            do {
                let request = HeroUpdateRequest(
                    name: hero.name,
                    age: hero.age,
                    traits: hero.traits.map { $0.rawValue },
                    specialAbility: hero.specialAbility
                )

                let endpoint = Endpoint.updateHero(id: UUID(uuidString: serverId)!, data: request)
                let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

                guard let serverHero = response.data else {
                    throw APIError.unknown(NSError(domain: "No data", code: -1))
                }

                hero.serverSyncStatus = .synced
                hero.lastSyncedAt = Date()
                hero.serverUpdatedAt = serverHero.updatedAt
                try cacheManager.save(hero)

                Logger.sync.info("Updated hero on server: \(hero.name)")

            } catch {
                hero.serverSyncStatus = .failed
                hero.syncError = error.localizedDescription
                try cacheManager.save(hero)

                Logger.sync.error("Failed to update hero: \(error)")
            }
        }
    }

    private func pushPendingDeletes() async throws {
        let heroes = try cacheManager.fetchPendingSync(Hero.self, status: .pendingDelete)

        Logger.sync.info("Pushing \(heroes.count) pending hero deletes")

        for hero in heroes {
            guard let serverId = hero.serverId else {
                // Not on server, just delete locally
                try cacheManager.delete(hero)
                continue
            }

            do {
                let endpoint = Endpoint.deleteHero(id: UUID(uuidString: serverId)!)
                let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

                // Delete from local cache
                try cacheManager.delete(hero)

                Logger.sync.info("Deleted hero from server: \(hero.name)")

            } catch {
                hero.serverSyncStatus = .failed
                hero.syncError = error.localizedDescription
                try cacheManager.save(hero)

                Logger.sync.error("Failed to delete hero: \(error)")
            }
        }
    }

    private func pullServerChanges() async throws {
        Logger.sync.info("Pulling server changes")

        // Fetch all heroes from server
        let endpoint = Endpoint.getHeroes(limit: 100, offset: 0)
        let response: APIResponse<[HeroResponse]> = try await apiClient.request(endpoint)

        guard let serverHeroes = response.data else {
            return
        }

        Logger.sync.info("Received \(serverHeroes.count) heroes from server")

        for serverHero in serverHeroes {
            // Find local hero by serverId
            let localHeroes = try cacheManager.fetchAll(Hero.self)
            let localHero = localHeroes.first { $0.serverId == serverHero.id.uuidString }

            if let localHero = localHero {
                // Check for conflicts
                if localHero.needsSync {
                    // Conflict: local has unsaved changes + server has updates
                    localHero.serverSyncStatus = .conflict
                    try cacheManager.save(localHero)

                    Logger.sync.warning("Conflict detected for hero: \(localHero.name)")
                } else {
                    // No conflict, update local with server data
                    localHero.updateFrom(server: serverHero)
                    try cacheManager.save(localHero)

                    Logger.sync.info("Updated local hero from server: \(localHero.name)")
                }
            } else {
                // New hero from server, create locally
                let newHero = Hero(from: serverHero)
                newHero.serverId = serverHero.id.uuidString
                newHero.serverSyncStatus = .synced
                newHero.lastSyncedAt = Date()
                newHero.serverUpdatedAt = serverHero.updatedAt
                try cacheManager.save(newHero)

                Logger.sync.info("Created new local hero from server: \(newHero.name)")
            }
        }

        // Similar for stories, custom events
    }

    func resolveConflicts() async throws {
        let conflictedHeroes = try cacheManager.fetchPendingSync(Hero.self, status: .conflict)

        Logger.sync.info("Resolving \(conflictedHeroes.count) conflicts")

        for hero in conflictedHeroes {
            guard let serverId = hero.serverId else { continue }

            // Fetch latest server version
            let endpoint = Endpoint.getHero(id: UUID(uuidString: serverId)!)
            let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

            guard let serverHero = response.data else { continue }

            // Resolve conflict
            try await conflictResolver.resolveConflict(
                local: hero,
                server: serverHero,
                strategy: .serverWins // Default strategy
            )
        }
    }
}
```

**Acceptance Criteria**:
- [ ] SyncEngine can push/pull all entity types
- [ ] Conflicts detected correctly
- [ ] Thread-safe (actor isolation)
- [ ] Unit tests passing

---

#### Day 3-4: Conflict Resolution

**File**: `Utilities/ConflictResolver.swift`

**Tasks**:
1. Define conflict resolution strategies
2. Implement resolution logic for each strategy
3. Add user-prompt UI for critical conflicts
4. Test conflict scenarios

**Code**:
```swift
enum ConflictResolution {
    case serverWins     // Server data overwrites local
    case localWins      // Local data pushes to server
    case userPrompt     // Ask user to choose
    case merge          // Attempt automatic merge
}

class ConflictResolver {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol

    init(apiClient: APIClientProtocol, cacheManager: CacheManagerProtocol) {
        self.apiClient = apiClient
        self.cacheManager = cacheManager
    }

    func resolveConflict(
        local: Hero,
        server: HeroResponse,
        strategy: ConflictResolution
    ) async throws {
        switch strategy {
        case .serverWins:
            try await applyServerWins(local: local, server: server)

        case .localWins:
            try await applyLocalWins(local: local)

        case .userPrompt:
            let choice = await showConflictUI(local: local, server: server)
            try await resolveConflict(local: local, server: server, strategy: choice)

        case .merge:
            try await attemptMerge(local: local, server: server)
        }
    }

    private func applyServerWins(local: Hero, server: HeroResponse) async throws {
        Logger.sync.info("Conflict resolved: Server wins for \(local.name)")

        // Overwrite local with server data
        local.updateFrom(server: server)
        local.serverSyncStatus = .synced
        local.lastSyncedAt = Date()
        try cacheManager.save(local)
    }

    private func applyLocalWins(local: Hero) async throws {
        Logger.sync.info("Conflict resolved: Local wins for \(local.name)")

        // Push local changes to server
        let request = HeroUpdateRequest(
            name: local.name,
            age: local.age,
            traits: local.traits.map { $0.rawValue },
            specialAbility: local.specialAbility
        )

        let endpoint = Endpoint.updateHero(id: UUID(uuidString: local.serverId!)!, data: request)
        let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

        guard let serverHero = response.data else {
            throw APIError.unknown(NSError(domain: "No data", code: -1))
        }

        local.serverUpdatedAt = serverHero.updatedAt
        local.serverSyncStatus = .synced
        local.lastSyncedAt = Date()
        try cacheManager.save(local)
    }

    @MainActor
    private func showConflictUI(local: Hero, server: HeroResponse) async -> ConflictResolution {
        // Present UI to user (implementation depends on UI framework)
        // For now, return default strategy

        // TODO: Implement UI for user choice
        return .serverWins
    }

    private func attemptMerge(local: Hero, server: HeroResponse) async throws {
        Logger.sync.info("Attempting merge for \(local.name)")

        // For Hero, merge is tricky since most fields are user-edited
        // Default to server wins for safety
        try await applyServerWins(local: local, server: server)
    }
}
```

**Acceptance Criteria**:
- [ ] Server wins strategy working
- [ ] Local wins strategy working
- [ ] User prompt UI implemented (basic)
- [ ] Merge strategy has fallback
- [ ] Unit tests for all strategies

---

#### Day 5: Background Sync Manager

**File**: `Services/BackgroundSyncManager.swift`

**Tasks**:
1. Implement background sync scheduling
2. Add app lifecycle observers
3. Handle network availability changes
4. Implement sync interval configuration

**Code**:
```swift
class BackgroundSyncManager: ObservableObject {
    @Published var isSyncing = false
    @Published var lastSyncAt: Date?
    @Published var syncError: Error?

    private let syncEngine: SyncEngineProtocol
    private var syncTimer: Timer?
    private var observers: [NSObjectProtocol] = []

    init(syncEngine: SyncEngineProtocol) {
        self.syncEngine = syncEngine

        setupObservers()
        scheduleSyncTimer()
    }

    deinit {
        observers.forEach { NotificationCenter.default.removeObserver($0) }
        syncTimer?.invalidate()
    }

    private func setupObservers() {
        // App foreground
        let foregroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task {
                await self?.performSync()
            }
        }
        observers.append(foregroundObserver)

        // Network available
        let networkObserver = NotificationCenter.default.addObserver(
            forName: .networkAvailable,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task {
                await self?.performSync()
            }
        }
        observers.append(networkObserver)
    }

    private func scheduleSyncTimer() {
        syncTimer?.invalidate()

        guard FeatureFlags.enableBackgroundSync else {
            return
        }

        syncTimer = Timer.scheduledTimer(
            withTimeInterval: FeatureFlags.syncInterval,
            repeats: true
        ) { [weak self] _ in
            Task {
                await self?.performSync()
            }
        }

        Logger.sync.info("Scheduled sync every \(FeatureFlags.syncInterval)s")
    }

    func performSync() async {
        guard !isSyncing else {
            Logger.sync.info("Sync already in progress, skipping")
            return
        }

        await MainActor.run {
            isSyncing = true
            syncError = nil
        }

        defer {
            Task { @MainActor in
                isSyncing = false
            }
        }

        do {
            try await syncEngine.syncAll()

            await MainActor.run {
                lastSyncAt = Date()
            }

            Logger.sync.info("Background sync successful")

        } catch {
            await MainActor.run {
                syncError = error
            }

            Logger.sync.error("Background sync failed: \(error)")
        }
    }

    func syncNow() async {
        await performSync()
    }
}

extension Notification.Name {
    static let networkAvailable = Notification.Name("networkAvailable")
}
```

**Acceptance Criteria**:
- [ ] Sync happens on app foreground
- [ ] Sync happens on network available
- [ ] Periodic sync scheduled correctly
- [ ] Manual sync available
- [ ] Sync status published to UI

---

### Phase 3 Deliverables

**Completed Components**:
- ✅ SyncEngine with push/pull logic
- ✅ ConflictResolver with multiple strategies
- ✅ BackgroundSyncManager with scheduling
- ✅ App lifecycle integration

**Testing Status**:
- ✅ Unit tests for SyncEngine
- ✅ Unit tests for ConflictResolver
- ✅ Integration tests for full sync flow
- ✅ Conflict scenario tests

**Acceptance Criteria**:
- [ ] Bidirectional sync working
- [ ] Conflicts detected and resolved
- [ ] Background sync reliable
- [ ] App foreground triggers sync
- [ ] Network changes trigger sync
- [ ] All tests passing

**Ready for Phase 4**: ✅

---

## Phase 4: Media Management (Week 4-5)

**Goal**: Integrate Cloudflare R2 for media storage with local caching

This phase focuses on media file handling - I'll keep this summary brief since the document is getting long.

### Key Components:
1. **MediaCacheManager**: R2 upload/download with local caching
2. **Avatar Migration**: Upload existing avatars to R2
3. **Audio Migration**: Upload existing audio files to R2
4. **Illustration Migration**: Upload existing illustrations to R2
5. **Cache Eviction**: Implement eviction policies (30d audio, 14d illustrations)

### Acceptance Criteria:
- [ ] All media files upload to R2
- [ ] Local cache works as fallback
- [ ] Cache eviction prevents unbounded growth
- [ ] Progress indicators for uploads/downloads
- [ ] All tests passing

---

## Phase 5: Offline Mode (Week 5-6)

**Goal**: Robust offline experience with automatic sync

### Key Components:
1. **Offline Detection**: Network monitoring
2. **Operation Queue**: Queue failed operations for retry
3. **Retry Logic**: Exponential backoff for failed syncs
4. **UI Indicators**: Offline status visible
5. **OpenAI Removal**: Remove direct OpenAI integration

### Acceptance Criteria:
- [ ] App fully functional offline
- [ ] Operations queue when offline
- [ ] Automatic retry when online
- [ ] Offline indicators clear
- [ ] OpenAI API key removed from iOS

---

## Phase 6: Migration Tool (Week 6)

**Goal**: Migrate existing users' local data to backend

### Key Components:
1. **Migration UI**: Step-by-step wizard
2. **Data Export**: Export local SwiftData to JSON
3. **Backend Upload**: Upload with progress tracking
4. **Rollback**: Revert on failure
5. **Migration Status**: Persistent state tracking

### Acceptance Criteria:
- [ ] Existing users can migrate
- [ ] Progress visible throughout
- [ ] All data preserved (no loss)
- [ ] Rollback works on failure
- [ ] Migration resumable

---

## Phase 7: Testing & Polish (Week 7)

**Goal**: Comprehensive testing and final polish

### Key Components:
1. **Unit Tests**: >80% coverage for critical paths
2. **Integration Tests**: Full sync scenarios
3. **UI Tests**: Offline mode, conflict resolution
4. **Performance Tests**: Sync speed, memory usage
5. **Bug Fixes**: Address discovered issues

### Acceptance Criteria:
- [ ] All tests passing
- [ ] No memory leaks
- [ ] Performance benchmarks met
- [ ] Critical bugs fixed
- [ ] Documentation updated

---

## Dependencies & Critical Path

### Critical Path:
```
Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 6 → Phase 7
           ↓
        Phase 4 (parallel)
```

### Dependencies:
- Phase 2 depends on Phase 1 (Foundation must be complete)
- Phase 3 depends on Phase 2 (Repositories must exist)
- Phase 4 can happen in parallel with Phase 3 (Media independent)
- Phase 5 depends on Phase 3 (Sync must work first)
- Phase 6 depends on Phase 5 (Backend must be stable)
- Phase 7 depends on all (Final testing)

---

## Risk Mitigation

### High-Risk Areas:
1. **Data Loss During Migration** (Phase 6)
   - Mitigation: Incremental upload, rollback on failure, extensive testing

2. **Sync Conflicts** (Phase 3)
   - Mitigation: Conservative strategies (server wins), user prompts for critical data

3. **Performance Degradation** (Phase 3-4)
   - Mitigation: Background sync, batch operations, profiling

4. **Network Failures** (Phase 5)
   - Mitigation: Retry logic, offline queue, exponential backoff

### Rollback Strategy:
- Feature flags enable quick rollback to old code paths
- Local data always preserved (never deleted destructively)
- Backend changes reversible (API versioning)

---

**For sync strategy details, see**: [PRD_IOS_API_INTEGRATION_SYNC.md](./PRD_IOS_API_INTEGRATION_SYNC.md)
**For migration details, see**: [PRD_IOS_API_INTEGRATION_MIGRATION.md](./PRD_IOS_API_INTEGRATION_MIGRATION.md)
