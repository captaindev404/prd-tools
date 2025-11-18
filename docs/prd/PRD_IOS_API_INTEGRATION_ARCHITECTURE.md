# Technical Architecture - iOS Backend API Integration

**Parent Document**: [PRD_IOS_API_INTEGRATION.md](./PRD_IOS_API_INTEGRATION.md)
**Version**: 1.0
**Date**: 2025-01-06

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Layer Definitions](#layer-definitions)
3. [Component Design](#component-design)
4. [Data Flow](#data-flow)
5. [Authentication Architecture](#authentication-architecture)
6. [Sync Architecture](#sync-architecture)
7. [Error Handling](#error-handling)
8. [Performance Considerations](#performance-considerations)

---

## Architecture Overview

### High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         iOS Application                           │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Presentation Layer                       │  │
│  │         SwiftUI Views + ViewModels (MVVM Pattern)           │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                          │                                          │
│  ┌───────────────────────▼──────────────────────────────────────┐  │
│  │                    Business Logic Layer                       │  │
│  │                 ViewModels (ObservableObject)                 │  │
│  │       StoryViewModel, HeroViewModel, AuthViewModel          │  │
│  └──────────┬────────────────────────────────┬──────────────────┘  │
│             │                                 │                     │
│  ┌──────────▼────────────────┐    ┌─────────▼──────────────────┐  │
│  │   Repository Layer        │    │   Service Layer            │  │
│  │  (Data Access)            │    │  (Cross-cutting)           │  │
│  │  - HeroRepository         │    │  - AuthManager             │  │
│  │  - StoryRepository        │    │  - AudioService            │  │
│  │  - CustomEventRepository  │    │  - ThemeSettings           │  │
│  └──────────┬────────────────┘    └────────────────────────────┘  │
│             │                                                       │
│  ┌──────────▼────────────────┐                                     │
│  │   Data Layer              │                                     │
│  │  ┌──────────┐  ┌─────────┴────────┐                            │
│  │  │APIClient │  │  CacheManager    │                            │
│  │  │(Network) │  │  (SwiftData)     │                            │
│  │  └────┬─────┘  └─────────┬────────┘                            │
│  │       │                   │                                     │
│  │  ┌────▼───────────────────▼────────┐                            │
│  │  │       SyncEngine                │                            │
│  │  │  (Bidirectional Sync Logic)     │                            │
│  │  └─────────────────────────────────┘                            │
│  └─────────────────┬───────────────────────────────────────────────┘
│                    │                                                │
└────────────────────┼────────────────────────────────────────────────┘
                     │ HTTPS (TLS 1.3)
                     │ Bearer Token Authentication
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│                      Backend API (Vercel)                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     API Router (Next.js)                       │  │
│  │         Better Auth Middleware + Rate Limiting                │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                          │                                          │
│  ┌───────────────────────▼──────────────────────────────────────┐  │
│  │                   API Route Handlers                          │  │
│  │  /api/heroes, /api/stories, /api/auth, /api/user            │  │
│  └──────────┬────────────────────────────────┬──────────────────┘  │
│             │                                 │                     │
│  ┌──────────▼────────────────┐    ┌─────────▼──────────────────┐  │
│  │   PostgreSQL (Prisma)     │    │  Cloudflare R2             │  │
│  │   - Users, Heroes         │    │  - Avatars                 │  │
│  │   - Stories, Illustrations│    │  - Audio Files             │  │
│  │   - ApiUsage Tracking     │    │  - Illustrations           │  │
│  └───────────────────────────┘    └────────────────────────────┘  │
│             │                                                       │
│  ┌──────────▼────────────────────────────────────────────────────┐  │
│  │                    OpenAI API                                  │  │
│  │  GPT-4o, gpt-4o-mini-tts, GPT-Image-1                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Design Principles

#### 1. **Repository Pattern**
- **Single Source of Truth**: Repositories coordinate between API and cache
- **Abstraction**: Business logic independent of data source
- **Testability**: Protocol-based design enables mocking

#### 2. **Offline-First**
- **Local Cache**: SwiftData as intelligent cache, not just backup
- **Optimistic Updates**: UI updates immediately, sync in background
- **Queue System**: Failed operations queued for retry

#### 3. **Protocol-Oriented**
- **Dependency Injection**: All services injected via protocols
- **Testing**: Easy to mock dependencies
- **Flexibility**: Swap implementations without breaking code

#### 4. **Reactive**
- **Combine Publishers**: State changes propagate automatically
- **ObservableObject**: ViewModels publish updates
- **@Published Properties**: UI reacts to data changes

#### 5. **Error-Resilient**
- **Typed Errors**: Comprehensive error handling
- **Retry Logic**: Exponential backoff for transient failures
- **Graceful Degradation**: App works even when backend unavailable

---

## Layer Definitions

### 1. Presentation Layer

**Responsibility**: Display UI and handle user interactions

**Components**:
- **SwiftUI Views**: Declarative UI components
- **View Modifiers**: Reusable UI modifiers
- **View State**: @State, @Binding for local UI state

**Example**:
```swift
struct HeroListView: View {
    @StateObject private var viewModel = HeroViewModel()

    var body: some View {
        List(viewModel.heroes) { hero in
            HeroRow(hero: hero)
        }
        .task {
            await viewModel.loadHeroes()
        }
    }
}
```

**Dependencies**: ViewModels only (no direct data access)

---

### 2. Business Logic Layer

**Responsibility**: Business rules, state management, coordination

**Components**:
- **ViewModels**: ObservableObject with @Published properties
- **Use Cases**: Complex business operations
- **Validators**: Input validation logic

**Example**:
```swift
@MainActor
class HeroViewModel: ObservableObject {
    @Published var heroes: [Hero] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let heroRepository: HeroRepositoryProtocol

    init(heroRepository: HeroRepositoryProtocol) {
        self.heroRepository = heroRepository
    }

    func loadHeroes() async {
        isLoading = true
        defer { isLoading = false }

        do {
            heroes = try await heroRepository.fetchAll()
        } catch {
            self.error = error
        }
    }

    func createHero(_ hero: Hero) async throws {
        let created = try await heroRepository.create(hero)
        heroes.append(created)
    }
}
```

**Dependencies**: Repositories and Services

---

### 3. Repository Layer

**Responsibility**: Data access abstraction and coordination

**Components**:
- **HeroRepository**: Hero CRUD + avatar generation
- **StoryRepository**: Story CRUD + generation operations
- **CustomEventRepository**: Custom event management

**Example**:
```swift
protocol HeroRepositoryProtocol {
    func fetchAll() async throws -> [Hero]
    func fetch(id: UUID) async throws -> Hero
    func create(_ hero: Hero) async throws -> Hero
    func update(_ hero: Hero) async throws -> Hero
    func delete(_ hero: Hero) async throws
    func syncWithBackend() async throws
}

class HeroRepository: HeroRepositoryProtocol {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol
    private let syncEngine: SyncEngineProtocol

    init(
        apiClient: APIClientProtocol,
        cacheManager: CacheManagerProtocol,
        syncEngine: SyncEngineProtocol
    ) {
        self.apiClient = apiClient
        self.cacheManager = cacheManager
        self.syncEngine = syncEngine
    }

    func fetchAll() async throws -> [Hero] {
        // Try cache first
        let cached = try cacheManager.fetchAll(Hero.self)

        // Sync in background
        Task {
            try? await syncWithBackend()
        }

        return cached
    }

    func create(_ hero: Hero) async throws -> Hero {
        // 1. Save to cache (optimistic)
        try cacheManager.save(hero)
        hero.serverSyncStatus = .pendingCreate

        // 2. Sync to backend in background
        Task {
            do {
                let serverHero = try await apiClient.createHero(hero)
                hero.serverId = serverHero.id
                hero.serverSyncStatus = .synced
                hero.lastSyncedAt = Date()
                try cacheManager.save(hero)
            } catch {
                hero.serverSyncStatus = .failed
                hero.syncError = error.localizedDescription
                try? cacheManager.save(hero)
            }
        }

        return hero
    }
}
```

**Dependencies**: APIClient, CacheManager, SyncEngine

---

### 4. Data Layer

**Responsibility**: Network and database operations

#### 4.1 APIClient (Network)

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

    init(
        baseURL: URL,
        session: URLSession = .shared,
        authManager: AuthManager,
        retryPolicy: RetryPolicy = .default
    ) {
        self.baseURL = baseURL
        self.session = session
        self.authManager = authManager
        self.retryPolicy = retryPolicy
    }

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T> {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        request.httpMethod = endpoint.method.rawValue
        request.httpBody = endpoint.body

        // Add authentication
        if let token = try? authManager.getSessionToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Add headers
        for (key, value) in endpoint.headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        // Execute with retry
        return try await requestWithRetry(request)
    }

    private func requestWithRetry<T: Decodable>(
        _ request: URLRequest,
        attempt: Int = 0
    ) async throws -> APIResponse<T> {
        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.unknown(NSError(domain: "Invalid response", code: -1))
            }

            // Handle token refresh on 401
            if httpResponse.statusCode == 401 {
                try await authManager.refreshSession()
                return try await requestWithRetry(request, attempt: attempt + 1)
            }

            // Handle rate limiting
            if httpResponse.statusCode == 429 {
                let resetAt = parseRateLimitReset(from: httpResponse)
                throw APIError.rateLimitExceeded(resetAt: resetAt)
            }

            // Parse response
            let apiResponse = try JSONDecoder().decode(APIResponse<T>.self, from: data)
            return apiResponse

        } catch let error as APIError {
            if retryPolicy.shouldRetry(error, attempt: attempt) {
                let delay = retryPolicy.delay(for: attempt)
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                return try await requestWithRetry(request, attempt: attempt + 1)
            }
            throw error
        }
    }
}
```

#### 4.2 CacheManager (SwiftData)

```swift
protocol CacheManagerProtocol {
    func save<T: PersistentModel>(_ object: T) throws
    func fetch<T: PersistentModel>(_ type: T.Type, id: UUID) throws -> T?
    func fetchAll<T: PersistentModel>(_ type: T.Type) throws -> [T]
    func delete<T: PersistentModel>(_ object: T) throws
    func markForSync<T: PersistentModel>(_ object: T, status: SyncStatus) throws
    func fetchPendingSync<T: PersistentModel>(_ type: T.Type) throws -> [T]
}

class CacheManager: CacheManagerProtocol {
    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func save<T: PersistentModel>(_ object: T) throws {
        modelContext.insert(object)
        try modelContext.save()
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
    }

    func markForSync<T: PersistentModel & Syncable>(
        _ object: T,
        status: SyncStatus
    ) throws {
        object.serverSyncStatus = status
        try modelContext.save()
    }

    func fetchPendingSync<T: PersistentModel & Syncable>(_ type: T.Type) throws -> [T] {
        let predicate = #Predicate<T> { $0.serverSyncStatus != .synced }
        let descriptor = FetchDescriptor(predicate: predicate)
        return try modelContext.fetch(descriptor)
    }
}
```

---

### 5. Service Layer

**Responsibility**: Cross-cutting concerns and utilities

#### 5.1 AuthManager

```swift
protocol AuthManagerProtocol {
    var isAuthenticated: Bool { get }
    var currentUser: User? { get }

    func signUp(email: String, password: String, name: String?) async throws -> AuthResponse
    func signIn(email: String, password: String) async throws -> AuthResponse
    func signOut() async throws
    func refreshSession() async throws -> AuthResponse
    func getSessionToken() throws -> String?
}

@MainActor
class AuthManager: AuthManagerProtocol, ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?

    private let keychainHelper: KeychainHelper
    private let apiClient: APIClientProtocol
    private var refreshTask: Task<Void, Never>?

    init(keychainHelper: KeychainHelper, apiClient: APIClientProtocol) {
        self.keychainHelper = keychainHelper
        self.apiClient = apiClient

        // Check existing session
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

        // Store session token
        try keychainHelper.saveSessionToken(authResponse.session.token)

        // Update state
        self.isAuthenticated = true
        self.currentUser = authResponse.user

        // Schedule token refresh
        scheduleTokenRefresh(expiresAt: authResponse.session.expiresAt)

        return authResponse
    }

    func refreshSession() async throws -> AuthResponse {
        let endpoint = Endpoint.refreshSession
        let response: APIResponse<AuthResponse> = try await apiClient.request(endpoint)

        guard let authResponse = response.data else {
            throw APIError.unauthorized
        }

        try keychainHelper.saveSessionToken(authResponse.session.token)

        scheduleTokenRefresh(expiresAt: authResponse.session.expiresAt)

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
                try? await refreshSession()
            }
        }
    }

    func signOut() async throws {
        try await apiClient.request(.signOut)
        try keychainHelper.deleteSessionToken()

        isAuthenticated = false
        currentUser = nil
        refreshTask?.cancel()
    }
}
```

#### 5.2 SyncEngine

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
            Logger.sync.info("Sync already in progress, skipping")
            return
        }

        isSyncing = true
        defer { isSyncing = false }

        Logger.sync.info("Starting full sync")

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

        Logger.sync.info("Full sync completed")
    }

    private func pushPendingCreates() async throws {
        let heroes = try cacheManager.fetchPendingSync(Hero.self)
            .filter { $0.serverSyncStatus == .pendingCreate }

        for hero in heroes {
            do {
                let serverHero = try await apiClient.createHero(hero)
                hero.serverId = serverHero.id
                hero.serverSyncStatus = .synced
                hero.lastSyncedAt = Date()
                try cacheManager.save(hero)
            } catch {
                hero.serverSyncStatus = .failed
                hero.syncError = error.localizedDescription
                try cacheManager.save(hero)
            }
        }
    }

    private func pushPendingUpdates() async throws {
        // Similar to pushPendingCreates
    }

    private func pullServerChanges() async throws {
        // Fetch all server data and update local cache
        let serverHeroes = try await apiClient.getHeroes()

        for serverHero in serverHeroes {
            if let localHero = try cacheManager.fetch(Hero.self, serverId: serverHero.id) {
                // Check for conflicts
                if localHero.needsSync {
                    try await conflictResolver.resolveConflict(
                        local: localHero,
                        server: serverHero
                    )
                } else {
                    // Update local with server data
                    localHero.updateFrom(server: serverHero)
                    try cacheManager.save(localHero)
                }
            } else {
                // Create new local entity
                let newHero = Hero(from: serverHero)
                try cacheManager.save(newHero)
            }
        }
    }
}
```

---

## Component Design

### 1. Endpoint Enum

Type-safe API endpoint definitions:

```swift
enum Endpoint {
    // Authentication
    case signIn(email: String, password: String)
    case signUp(email: String, password: String, name: String?)
    case refreshSession
    case signOut

    // Heroes
    case getHeroes(limit: Int, offset: Int)
    case getHero(id: UUID)
    case createHero(data: HeroCreateRequest)
    case updateHero(id: UUID, data: HeroUpdateRequest)
    case deleteHero(id: UUID)
    case generateAvatar(heroId: UUID, prompt: String)

    // Stories
    case getStories(heroId: UUID?, limit: Int, offset: Int)
    case getStory(id: UUID)
    case createStory(data: StoryCreateRequest)
    case updateStory(id: UUID, data: StoryUpdateRequest)
    case deleteStory(id: UUID)
    case generateAudio(storyId: UUID, language: String, voice: String)
    case generateIllustrations(storyId: UUID)
    case getIllustrationStatus(storyId: UUID)

    // User
    case getUserProfile
    case updateUserProfile(data: UserProfileUpdateRequest)
    case getUserUsage

    var path: String {
        switch self {
        case .signIn: return "/api/auth/sign-in"
        case .signUp: return "/api/auth/sign-up"
        case .refreshSession: return "/api/auth/session/refresh"
        case .signOut: return "/api/auth/sign-out"

        case .getHeroes: return "/api/heroes"
        case .getHero(let id): return "/api/heroes/\(id.uuidString)"
        case .createHero: return "/api/heroes"
        case .updateHero(let id, _): return "/api/heroes/\(id.uuidString)"
        case .deleteHero(let id): return "/api/heroes/\(id.uuidString)"
        case .generateAvatar(let heroId, _): return "/api/heroes/\(heroId.uuidString)/avatar"

        case .getStories: return "/api/stories"
        case .getStory(let id): return "/api/stories/\(id.uuidString)"
        case .createStory: return "/api/stories"
        case .updateStory(let id, _): return "/api/stories/\(id.uuidString)"
        case .deleteStory(let id): return "/api/stories/\(id.uuidString)"
        case .generateAudio(let storyId, _, _): return "/api/stories/\(storyId.uuidString)/audio"
        case .generateIllustrations(let storyId): return "/api/stories/\(storyId.uuidString)/illustrations"
        case .getIllustrationStatus(let storyId): return "/api/stories/\(storyId.uuidString)/illustrations/status"

        case .getUserProfile: return "/api/user/profile"
        case .updateUserProfile: return "/api/user/profile"
        case .getUserUsage: return "/api/user/usage"
        }
    }

    var method: HTTPMethod {
        switch self {
        case .getHeroes, .getHero, .getStories, .getStory,
             .getUserProfile, .getUserUsage, .getIllustrationStatus:
            return .GET
        case .createHero, .createStory, .signIn, .signUp,
             .generateAvatar, .generateAudio, .generateIllustrations,
             .refreshSession, .signOut:
            return .POST
        case .updateHero, .updateStory, .updateUserProfile:
            return .PATCH
        case .deleteHero, .deleteStory:
            return .DELETE
        }
    }

    var headers: [String: String] {
        var headers = ["Content-Type": "application/json"]

        // Add query parameters for GET requests
        switch self {
        case .getHeroes(let limit, let offset):
            headers["X-Query-Limit"] = "\(limit)"
            headers["X-Query-Offset"] = "\(offset)"
        case .getStories(let heroId, let limit, let offset):
            if let heroId = heroId {
                headers["X-Query-Hero-Id"] = heroId.uuidString
            }
            headers["X-Query-Limit"] = "\(limit)"
            headers["X-Query-Offset"] = "\(offset)"
        default:
            break
        }

        return headers
    }

    var body: Data? {
        switch self {
        case .signIn(let email, let password):
            return try? JSONEncoder().encode(["email": email, "password": password])
        case .signUp(let email, let password, let name):
            return try? JSONEncoder().encode(["email": email, "password": password, "name": name])
        case .createHero(let data):
            return try? JSONEncoder().encode(data)
        case .updateHero(_, let data):
            return try? JSONEncoder().encode(data)
        case .createStory(let data):
            return try? JSONEncoder().encode(data)
        case .updateStory(_, let data):
            return try? JSONEncoder().encode(data)
        case .generateAvatar(_, let prompt):
            return try? JSONEncoder().encode(["prompt": prompt])
        case .generateAudio(_, let language, let voice):
            return try? JSONEncoder().encode(["language": language, "voice": voice])
        case .updateUserProfile(let data):
            return try? JSONEncoder().encode(data)
        default:
            return nil
        }
    }
}

enum HTTPMethod: String {
    case GET, POST, PATCH, DELETE, PUT
}
```

### 2. API Response Models

```swift
struct APIResponse<T: Decodable>: Decodable {
    let data: T?
    let error: APIErrorResponse?
    let pagination: Pagination?
}

struct APIErrorResponse: Decodable {
    let code: String
    let message: String
    let details: [String: String]?
}

struct Pagination: Decodable {
    let total: Int
    let limit: Int
    let offset: Int
    let hasMore: Bool
}

// Request/Response DTOs
struct HeroCreateRequest: Codable {
    let name: String
    let age: Int
    let traits: [String]
    let specialAbility: String?
}

struct HeroResponse: Codable {
    let id: UUID
    let name: String
    let age: Int
    let traits: [String]
    let specialAbility: String?
    let avatarUrl: String?
    let avatarGenerationId: String?
    let createdAt: Date
    let updatedAt: Date
}

struct StoryCreateRequest: Codable {
    let heroId: UUID
    let eventType: String?
    let customEventId: UUID?
    let language: String
    let generateAudio: Bool
    let generateIllustrations: Bool
}

struct StoryResponse: Codable {
    let id: UUID
    let title: String
    let content: String
    let heroId: UUID
    let eventType: String?
    let customEventId: UUID?
    let language: String
    let audioUrl: String?
    let audioGenerationStatus: String
    let illustrationStatus: String
    let illustrationCount: Int
    let isFavorite: Bool
    let playCount: Int
    let createdAt: Date
    let updatedAt: Date
}

struct AuthResponse: Codable {
    let user: User
    let session: Session
}

struct User: Codable {
    let id: UUID
    let email: String
    let name: String?
    let createdAt: Date
}

struct Session: Codable {
    let token: String
    let expiresAt: Date
}
```

### 3. Sync Metadata Protocol

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
    case synced        // Up-to-date with server
    case pendingCreate // Created locally, not on server
    case pendingUpdate // Modified locally, needs sync
    case pendingDelete // Deleted locally, needs server delete
    case failed        // Sync failed, needs retry
    case conflict      // Server has newer version
}

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
}

// Similar extensions for Story, StoryIllustration, CustomStoryEvent
```

---

## Data Flow

### Create Operation Flow

```
User Action: Create Hero
       │
       ▼
┌──────────────────┐
│  HeroListView    │ Button tap
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  HeroViewModel   │ createHero(_:)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ HeroRepository   │ create(_:)
└────────┬─────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
┌──────────────────┐         ┌──────────────────┐
│  CacheManager    │         │   APIClient      │
│  (Optimistic)    │         │  (Background)    │
└────────┬─────────┘         └────────┬─────────┘
         │                             │
         ▼                             ▼
┌──────────────────┐         ┌──────────────────┐
│   SwiftData      │         │   Backend API    │
│   (Immediate)    │         │   POST /heroes   │
└────────┬─────────┘         └────────┬─────────┘
         │                             │
         │                             ▼
         │                   ┌──────────────────┐
         │                   │   PostgreSQL     │
         │                   │ (Persist Server) │
         │                   └────────┬─────────┘
         │                             │
         │◄────────────────────────────┘
         │     Update with serverId
         ▼
┌──────────────────┐
│   SwiftData      │
│ (serverId saved) │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│  HeroViewModel   │ @Published heroes updated
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  HeroListView    │ UI refreshes automatically
└──────────────────┘
```

### Read Operation Flow (Cache-First)

```
User Action: View Heroes
       │
       ▼
┌──────────────────┐
│  HeroListView    │ .task { loadHeroes() }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  HeroViewModel   │ loadHeroes()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ HeroRepository   │ fetchAll()
└────────┬─────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
┌──────────────────┐         ┌──────────────────┐
│  CacheManager    │         │   SyncEngine     │
│  (Immediate)     │         │  (Background)    │
└────────┬─────────┘         └────────┬─────────┘
         │                             │
         ▼                             ▼
┌──────────────────┐         ┌──────────────────┐
│   SwiftData      │         │   APIClient      │
│   Return cached  │         │   GET /heroes    │
└────────┬─────────┘         └────────┬─────────┘
         │                             │
         │                             ▼
         │                   ┌──────────────────┐
         │                   │   Backend API    │
         │                   │ (Fetch Updated)  │
         │                   └────────┬─────────┘
         │                             │
         │◄────────────────────────────┘
         │     Merge server updates
         ▼
┌──────────────────┐
│   SwiftData      │
│ (Updated cache)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  HeroViewModel   │ @Published heroes updated
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  HeroListView    │ UI refreshes with latest
└──────────────────┘
```

### Sync Operation Flow (Background)

```
Timer/App Foreground
       │
       ▼
┌──────────────────────┐
│ BackgroundSyncManager│ performSync()
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    SyncEngine        │ syncAll()
└──────────┬───────────┘
           │
           ├─────────────────┬─────────────────┬─────────────────┐
           │                 │                 │                 │
           ▼                 ▼                 ▼                 ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Push Creates   │  │ Push Updates   │  │ Push Deletes   │  │ Pull Changes   │
└────────┬───────┘  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  POST /heroes  │  │ PATCH /heroes  │  │DELETE /heroes  │  │  GET /heroes   │
└────────┬───────┘  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘
         │                   │                   │                   │
         └───────────────────┴───────────────────┴───────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │ Update SwiftData │
                            │ (Mark as synced) │
                            └──────────┬───────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │ Resolve Conflicts│
                            └──────────┬───────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  Notify ViewModels│
                            └──────────────────┘
```

---

## Authentication Architecture

### Token Management

```
┌──────────────────────────────────────────────────────────┐
│                    Authentication Flow                    │
└──────────────────────────────────────────────────────────┘

1. Sign In
   ┌──────────┐         POST /api/auth/sign-in         ┌──────────┐
   │   iOS    │────────────────────────────────────────▶│ Backend  │
   │  App     │  email, password                        │   API    │
   └──────────┘         ◀────────────────────────────────└──────────┘
                      { user, session: { token, expiresAt } }
       │
       ▼
   ┌──────────┐
   │ Keychain │ Store session token
   └──────────┘

2. Authenticated Requests
   ┌──────────┐         GET /api/heroes                ┌──────────┐
   │   iOS    │────────────────────────────────────────▶│ Backend  │
   │  App     │  Authorization: Bearer <token>         │   API    │
   └──────────┘         ◀────────────────────────────────└──────────┘
                      { data: [...heroes] }

3. Token Refresh (Before Expiry)
   ┌──────────┐      POST /api/auth/session/refresh    ┌──────────┐
   │   iOS    │────────────────────────────────────────▶│ Backend  │
   │  App     │  Authorization: Bearer <old_token>     │   API    │
   └──────────┘         ◀────────────────────────────────└──────────┘
                      { session: { token, expiresAt } }
       │
       ▼
   ┌──────────┐
   │ Keychain │ Update session token
   └──────────┘

4. Token Expired (401 Response)
   ┌──────────┐         GET /api/heroes                ┌──────────┐
   │   iOS    │────────────────────────────────────────▶│ Backend  │
   │  App     │  Authorization: Bearer <expired>       │   API    │
   └──────────┘         ◀────────────────────────────────└──────────┘
                      401 Unauthorized
       │
       ▼
   Auto-refresh (attempt once)
       │
       ▼ (success)
   Retry original request
       │
       ▼ (failure)
   Sign out user, show sign-in screen
```

### Session Management

```swift
@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?

    private var refreshTask: Task<Void, Never>?
    private var sessionExpiresAt: Date?

    func signIn(email: String, password: String) async throws {
        let authResponse = try await apiClient.signIn(email, password)

        // Store token securely
        try keychainHelper.saveSessionToken(authResponse.session.token)

        // Update state
        isAuthenticated = true
        currentUser = authResponse.user
        sessionExpiresAt = authResponse.session.expiresAt

        // Schedule automatic refresh 5 minutes before expiry
        scheduleTokenRefresh()
    }

    private func scheduleTokenRefresh() {
        guard let expiresAt = sessionExpiresAt else { return }

        refreshTask?.cancel()

        refreshTask = Task {
            // Refresh 5 minutes before expiry
            let refreshTime = expiresAt.addingTimeInterval(-300)
            let delay = refreshTime.timeIntervalSinceNow

            if delay > 0 {
                try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))

                do {
                    try await refreshSession()
                    Logger.auth.info("Session refreshed automatically")
                } catch {
                    Logger.auth.error("Failed to refresh session: \(error)")
                    await signOut()
                }
            }
        }
    }

    func refreshSession() async throws {
        let authResponse = try await apiClient.refreshSession()

        try keychainHelper.saveSessionToken(authResponse.session.token)

        sessionExpiresAt = authResponse.session.expiresAt
        scheduleTokenRefresh()
    }
}
```

---

## Sync Architecture

### Sync State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    Sync Status States                        │
└─────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  synced  │ ◀─── Confirmed with server
    └────┬─────┘
         │ (User Edit)
         ▼
┌─────────────────┐
│ pendingUpdate   │ ─── Waiting to sync
└────┬────────────┘
     │ (Sync Success)
     │
     ├─────────▶ synced
     │
     │ (Sync Failure)
     ▼
┌──────────┐
│  failed  │ ─── Retry scheduled
└──────────┘
     │
     │ (Retry Success)
     ▼
   synced

     │ (Conflict Detected)
     ▼
┌──────────┐
│ conflict │ ─── Needs resolution
└──────────┘
     │ (Resolved)
     ▼
   synced
```

### Conflict Resolution Strategy

```swift
enum ConflictResolution {
    case serverWins     // Server data overwrites local
    case localWins      // Local data pushes to server
    case userPrompt     // Ask user to choose
    case merge          // Attempt automatic merge
}

class ConflictResolver {
    func resolveConflict<T: Syncable>(
        local: T,
        server: T,
        strategy: ConflictResolution
    ) async throws {
        switch strategy {
        case .serverWins:
            try await applyServerWins(local: local, server: server)

        case .localWins:
            try await applyLocalWins(local: local, server: server)

        case .userPrompt:
            let choice = await showConflictUI(local: local, server: server)
            try await resolveConflict(local: local, server: server, strategy: choice)

        case .merge:
            try await attemptMerge(local: local, server: server)
        }
    }

    private func applyServerWins<T: Syncable>(local: T, server: T) async throws {
        // Overwrite local with server data
        local.updateFrom(server: server)
        local.serverSyncStatus = .synced
        local.lastSyncedAt = Date()
        try cacheManager.save(local)

        Logger.sync.info("Conflict resolved: Server wins for \(type(of: local))")
    }

    private func applyLocalWins<T: Syncable>(local: T, server: T) async throws {
        // Push local changes to server
        let updated = try await apiClient.update(local)
        local.serverUpdatedAt = updated.updatedAt
        local.serverSyncStatus = .synced
        local.lastSyncedAt = Date()
        try cacheManager.save(local)

        Logger.sync.info("Conflict resolved: Local wins for \(type(of: local))")
    }
}
```

### Conflict Resolution Rules

| Entity | Default Strategy | Reason |
|--------|------------------|--------|
| **Hero** | Server Wins | Avatar may be regenerated, safer to use server |
| **Story Content** | User Prompt | User-created content, important to preserve choice |
| **Story Metadata** (playCount) | Merge (sum) | Can merge numeric values |
| **CustomEvent** | Local Wins | User-created, local has priority |
| **Illustrations** | Server Wins | Regenerated from server, expensive to recreate |

---

## Error Handling

### Error Hierarchy

```swift
enum APIError: Error {
    case unauthorized           // 401 - Token expired/invalid
    case forbidden             // 403 - No access to resource
    case notFound              // 404 - Resource doesn't exist
    case rateLimitExceeded(resetAt: Date) // 429 - Too many requests
    case validationError(fields: [String: String]) // 400 - Invalid input
    case serverError           // 500 - Backend error
    case networkError(Error)   // Network connectivity issues
    case decodingError(Error)  // JSON parsing failed
    case unknown(Error)        // Unexpected error
}

extension APIError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "Your session has expired. Please sign in again."

        case .forbidden:
            return "You don't have permission to access this resource."

        case .notFound:
            return "The requested resource was not found."

        case .rateLimitExceeded(let resetAt):
            let formatter = DateFormatter()
            formatter.timeStyle = .short
            return "Rate limit exceeded. Try again at \(formatter.string(from: resetAt))."

        case .validationError(let fields):
            let messages = fields.values.joined(separator: ", ")
            return "Validation error: \(messages)"

        case .serverError:
            return "A server error occurred. Please try again later."

        case .networkError:
            return "Network connection failed. Check your internet."

        case .decodingError:
            return "Failed to process server response. Please try again."

        case .unknown(let error):
            return "An unexpected error occurred: \(error.localizedDescription)"
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .unauthorized:
            return "Sign in again to continue."

        case .rateLimitExceeded:
            return "Wait a few minutes before trying again."

        case .networkError:
            return "Check your internet connection and try again."

        case .serverError:
            return "Wait a few moments and try again."

        default:
            return "Try again or contact support if the problem persists."
        }
    }
}
```

### Retry Policy

```swift
struct RetryPolicy {
    let maxRetries: Int
    let baseDelay: TimeInterval
    let maxDelay: TimeInterval
    let retryableErrors: Set<HTTPStatusCode>

    static let `default` = RetryPolicy(
        maxRetries: 3,
        baseDelay: 1.0,      // 1 second
        maxDelay: 30.0,      // 30 seconds
        retryableErrors: [408, 429, 500, 502, 503, 504]
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
        // Exponential backoff: 2^attempt * baseDelay
        let exponentialDelay = pow(2.0, Double(attempt)) * baseDelay

        // Add jitter (0-1 second random)
        let jitter = Double.random(in: 0...1.0)

        // Cap at maxDelay
        return min(exponentialDelay + jitter, maxDelay)
    }
}

// Example delays:
// Attempt 0: 1-2 seconds
// Attempt 1: 2-3 seconds
// Attempt 2: 4-5 seconds
// Attempt 3: 8-9 seconds (capped at maxDelay if configured)
```

---

## Performance Considerations

### 1. Batch Operations

```swift
// Bad: Individual requests
for hero in heroes {
    try await apiClient.updateHero(hero.id, data: hero)
}

// Good: Batch request
try await apiClient.batchUpdateHeroes(heroes)
```

### 2. Pagination

```swift
func fetchStories(limit: Int = 20, offset: Int = 0) async throws -> [Story] {
    let endpoint = Endpoint.getStories(heroId: nil, limit: limit, offset: offset)
    let response: APIResponse<[StoryResponse]> = try await apiClient.request(endpoint)
    return response.data?.map { Story(from: $0) } ?? []
}
```

### 3. Lazy Loading

```swift
class Story {
    var illustrations: [StoryIllustration]? // Not loaded by default

    func loadIllustrations() async throws {
        guard illustrations == nil else { return }

        let endpoint = Endpoint.getIllustrations(storyId: id)
        let response: APIResponse<[IllustrationResponse]> = try await apiClient.request(endpoint)
        illustrations = response.data?.map { StoryIllustration(from: $0) } ?? []
    }
}
```

### 4. Cache Eviction

```swift
class MediaCacheManager {
    enum CachePolicy {
        case avatars    // Cache indefinitely (~50-100KB)
        case audio      // Cache 30 days (~1-2MB)
        case illustrations // Cache 14 days (~200-500KB)
    }

    func evictExpired() async throws {
        let now = Date()

        // Evict audio files older than 30 days
        let audioFiles = try fileManager.contentsOfDirectory(at: audioDirectory)
        for file in audioFiles {
            let attributes = try fileManager.attributesOfItem(atPath: file.path)
            if let createdAt = attributes[.creationDate] as? Date,
               now.timeIntervalSince(createdAt) > 30 * 24 * 3600 {
                try fileManager.removeItem(at: file)
                Logger.cache.info("Evicted audio file: \(file.lastPathComponent)")
            }
        }

        // Similar for illustrations (14 days)
    }
}
```

### 5. Background Queue

```swift
actor SyncQueue {
    private var pendingOperations: [SyncOperation] = []
    private var isProcessing = false

    func enqueue(_ operation: SyncOperation) {
        pendingOperations.append(operation)

        if !isProcessing {
            Task {
                await processQueue()
            }
        }
    }

    private func processQueue() async {
        isProcessing = true
        defer { isProcessing = false }

        while !pendingOperations.isEmpty {
            let operation = pendingOperations.removeFirst()

            do {
                try await operation.execute()
                Logger.sync.info("Completed operation: \(operation.description)")
            } catch {
                Logger.sync.error("Failed operation: \(operation.description) - \(error)")

                // Re-enqueue if retryable
                if operation.canRetry {
                    pendingOperations.append(operation)
                }
            }
        }
    }
}
```

---

## Summary

This technical architecture provides:

1. **Clean Separation of Concerns**: Layer-based architecture with clear boundaries
2. **Testability**: Protocol-based design enables comprehensive testing
3. **Offline-First**: Cache-first approach with optimistic updates
4. **Scalability**: Repository pattern and sync engine support growth
5. **Resilience**: Comprehensive error handling and retry logic
6. **Performance**: Batch operations, pagination, lazy loading, caching

**Next Steps**:
1. Review architecture with team
2. Begin Phase 1 implementation (Foundation)
3. Create unit tests for core components
4. Monitor performance metrics in production

---

**For implementation details, see**: [PRD_IOS_API_INTEGRATION_IMPLEMENTATION.md](./PRD_IOS_API_INTEGRATION_IMPLEMENTATION.md)
