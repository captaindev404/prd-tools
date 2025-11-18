# Offline Caching & Sync Strategy - iOS Backend API Integration

**Parent Document**: [PRD_IOS_API_INTEGRATION.md](./PRD_IOS_API_INTEGRATION.md)
**Version**: 1.0
**Date**: 2025-01-06

---

## Table of Contents

1. [Sync Strategy Overview](#sync-strategy-overview)
2. [Cache Policies](#cache-policies)
3. [Sync Metadata Schema](#sync-metadata-schema)
4. [Optimistic Updates](#optimistic-updates)
5. [Conflict Resolution](#conflict-resolution)
6. [Sync Triggers](#sync-triggers)
7. [Background Sync](#background-sync)
8. [Media File Sync](#media-file-sync)
9. [Network Handling](#network-handling)
10. [Performance Optimization](#performance-optimization)

---

## Sync Strategy Overview

### Core Principles

#### 1. **Offline-First Architecture**
The app treats local SwiftData storage as the source of truth for the user interface. Network operations happen asynchronously in the background without blocking UI interactions.

```
┌─────────────────────────────────────────────────────────┐
│                  Offline-First Flow                      │
└─────────────────────────────────────────────────────────┘

User Action (Create Hero)
       │
       ▼
┌──────────────────┐
│ Save to Cache    │ ← IMMEDIATE (UI updates)
│ (SwiftData)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Mark as Pending  │ ← serverSyncStatus = .pendingCreate
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Return to UI     │ ← Hero visible immediately
└────────┬─────────┘
         │
         │ Background Task
         ▼
┌──────────────────┐
│ Sync to Backend  │ ← Async, doesn't block UI
└────────┬─────────┘
         │
         ├─── Success ────▶ Mark as .synced
         │
         └─── Failure ────▶ Mark as .failed, retry later
```

#### 2. **Optimistic Updates**
Changes are applied immediately to local cache and reflected in the UI. Background sync happens after the user sees the result.

**Benefits**:
- ✅ Instant UI feedback (<100ms)
- ✅ Works offline without degradation
- ✅ Smooth user experience
- ✅ Network latency hidden from user

**Challenges**:
- ⚠️ Must handle sync failures gracefully
- ⚠️ Conflict resolution required
- ⚠️ UI must show sync status

#### 3. **Eventual Consistency**
Local and server data may temporarily diverge but will eventually converge through bidirectional sync.

```
Time: T0              T1                T2                T3
Local:  [A]    →    [A, B*]      →    [A, B]       →    [A, B, C]
                      ↑                  ↓                  ↑
Server: [A]    →    [A]          →    [A, B]       →    [A, B, C]
                                        ↓
                    (*pending)    (synced)         (new from server)
```

---

## Cache Policies

### Cache Policy Types

```swift
enum CachePolicy {
    case cacheOnly          // Never fetch from network
    case networkOnly        // Never use cache
    case cacheFirst         // Try cache, fallback to network
    case networkFirst       // Try network, fallback to cache
    case cacheAndNetwork    // Return cache, update from network
}
```

### Policy Application by Entity

| Entity | Default Policy | Reason |
|--------|---------------|--------|
| **Hero** | `cacheFirst` | User-created, rarely changes from server |
| **Story** | `cacheFirst` | User-created content, local is source of truth |
| **StoryIllustration** | `cacheAndNetwork` | May regenerate on server, stay current |
| **CustomStoryEvent** | `cacheFirst` | User-created, local priority |
| **User Profile** | `networkFirst` | Server has authoritative data |
| **Usage Stats** | `networkFirst` | Server tracks across devices |

### Cache-First Implementation

```swift
class HeroRepository: HeroRepositoryProtocol {
    func fetchAll() async throws -> [Hero] {
        // 1. Return cached data immediately (instant UI)
        let cached = try cacheManager.fetchAll(Hero.self)

        // 2. Sync in background (no await - don't block)
        if FeatureFlags.enableCloudSync {
            Task {
                try? await syncWithBackend()
            }
        }

        return cached
    }

    private func syncWithBackend() async throws {
        // Fetch from server
        let endpoint = Endpoint.getHeroes(limit: 100, offset: 0)
        let response: APIResponse<[HeroResponse]> = try await apiClient.request(endpoint)

        guard let serverHeroes = response.data else { return }

        // Update cache with server data
        for serverHero in serverHeroes {
            if let localHero = try findLocalHero(serverId: serverHero.id.uuidString) {
                // Update existing
                if !localHero.needsSync {
                    localHero.updateFrom(server: serverHero)
                    try cacheManager.save(localHero)
                }
            } else {
                // Create new from server
                let newHero = Hero(from: serverHero)
                try cacheManager.save(newHero)
            }
        }

        // UI automatically updates via @Published in ViewModel
    }
}
```

### Network-First Implementation

```swift
class UserRepository: UserRepositoryProtocol {
    func fetchProfile() async throws -> User {
        do {
            // 1. Try network first
            let endpoint = Endpoint.getUserProfile
            let response: APIResponse<UserResponse> = try await apiClient.request(endpoint)

            guard let userData = response.data else {
                throw APIError.unknown(NSError(domain: "No data", code: -1))
            }

            // 2. Update cache
            let user = User(from: userData)
            try cacheManager.save(user)

            return user

        } catch {
            // 3. Fallback to cache if network fails
            if let cached = try cacheManager.fetch(User.self, id: currentUserId) {
                Logger.cache.info("Using cached user profile (network unavailable)")
                return cached
            }

            throw error
        }
    }
}
```

### Cache-And-Network Implementation

```swift
class StoryRepository: StoryRepositoryProtocol {
    func fetch(id: UUID) async throws -> Story {
        // 1. Return cached immediately if available
        if let cached = try cacheManager.fetch(Story.self, id: id) {
            // 2. Refresh from network in background
            Task {
                try? await refreshFromNetwork(id: id)
            }

            return cached
        }

        // 3. No cache, must fetch from network
        return try await fetchFromNetwork(id: id)
    }

    private func refreshFromNetwork(id: UUID) async throws {
        let endpoint = Endpoint.getStory(id: id)
        let response: APIResponse<StoryResponse> = try await apiClient.request(endpoint)

        guard let storyData = response.data else { return }

        // Update cache
        if let localStory = try cacheManager.fetch(Story.self, id: id) {
            localStory.updateFrom(server: storyData)
            try cacheManager.save(localStory)
        }
    }
}
```

---

## Sync Metadata Schema

### Syncable Protocol

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
```

### Sync Status States

```swift
enum SyncStatus: String, Codable {
    case synced        // ✅ Up-to-date with server
    case pendingCreate // 🔄 Created locally, not on server yet
    case pendingUpdate // 🔄 Modified locally, needs sync to server
    case pendingDelete // 🗑️ Deleted locally, needs server delete
    case failed        // ❌ Sync failed, will retry
    case conflict      // ⚠️ Server has newer version, needs resolution
}
```

### State Transitions

```
┌─────────────────────────────────────────────────────────┐
│              Sync Status State Machine                   │
└─────────────────────────────────────────────────────────┘

    [New Object]
         │
         ▼
  pendingCreate ──────┐
         │            │
         │ (sync)     │ (fail)
         ▼            ▼
      synced       failed ──────┐
         │            │         │
         │ (edit)     │ (retry) │
         ▼            ▼         │
  pendingUpdate ──────┘         │
         │                      │
         │ (sync)               │ (max retries)
         ▼                      ▼
      synced              [Give Up]
         │
         │ (server newer)
         ▼
     conflict ───────────────────┐
         │                       │
         │ (resolve)             │ (user choice)
         ▼                       ▼
      synced            [Apply Resolution]
```

### Model Extensions

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
        self.traits = server.traits.map { CharacterTrait(rawValue: $0) ?? .brave }
        self.specialAbility = server.specialAbility
        self.avatarImagePath = server.avatarUrl
        self.avatarGenerationId = server.avatarGenerationId

        // Update sync metadata
        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.syncError = nil
    }
}

extension Story: Syncable {
    @Attribute(.unique) var serverId: String?
    var serverSyncStatus: SyncStatus = .synced
    var lastSyncedAt: Date?
    var serverUpdatedAt: Date?
    var pendingChanges: Data?
    var syncError: String?

    var needsSync: Bool {
        return serverSyncStatus != .synced
    }

    func updateFrom(server: StoryResponse) {
        self.title = server.title
        self.content = server.content
        self.language = server.language
        self.isFavorite = server.isFavorite
        self.playCount = server.playCount
        self.audioFileName = server.audioUrl // Will be cached locally

        // Update sync metadata
        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.syncError = nil
    }
}
```

### Pending Changes Storage

For complex conflict resolution, store the specific fields that changed:

```swift
struct PendingChanges: Codable {
    var changedFields: [String: Any]
    var timestamp: Date

    enum CodingKeys: String, CodingKey {
        case changedFields, timestamp
    }
}

extension Hero {
    func recordPendingChange(field: String, newValue: Any) throws {
        var changes = (try? JSONDecoder().decode(PendingChanges.self, from: pendingChanges ?? Data()))
            ?? PendingChanges(changedFields: [:], timestamp: Date())

        changes.changedFields[field] = newValue
        changes.timestamp = Date()

        self.pendingChanges = try JSONEncoder().encode(changes)
    }
}
```

---

## Optimistic Updates

### Create Operation

```swift
func createHero(_ hero: Hero) async throws -> Hero {
    // 1. Save to cache immediately (optimistic)
    try cacheManager.save(hero)
    hero.serverSyncStatus = .pendingCreate

    Logger.repository.info("✅ Created hero locally: \(hero.name)")

    // 2. UI can access hero immediately
    // ViewModel's @Published property updates automatically

    // 3. Sync to backend in background
    if FeatureFlags.useBackendAPI {
        Task {
            await syncHeroToBackend(hero)
        }
    }

    return hero
}

private func syncHeroToBackend(_ hero: Hero) async {
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

        // 4. Update with server-assigned ID
        hero.serverId = serverHero.id.uuidString
        hero.serverSyncStatus = .synced
        hero.lastSyncedAt = Date()
        hero.serverUpdatedAt = serverHero.updatedAt
        try cacheManager.save(hero)

        Logger.repository.info("✅ Synced hero to backend: \(hero.name)")

    } catch {
        // 5. Mark as failed, will retry later
        hero.serverSyncStatus = .failed
        hero.syncError = error.localizedDescription
        try? cacheManager.save(hero)

        Logger.repository.error("❌ Failed to sync hero: \(error)")
    }
}
```

### Update Operation

```swift
func updateHero(_ hero: Hero) async throws -> Hero {
    // 1. Record what changed (for conflict resolution)
    try hero.recordPendingChange(field: "name", newValue: hero.name)

    // 2. Save to cache (optimistic)
    try cacheManager.save(hero)
    hero.serverSyncStatus = .pendingUpdate

    Logger.repository.info("✅ Updated hero locally: \(hero.name)")

    // 3. Sync to backend in background
    if FeatureFlags.useBackendAPI {
        Task {
            await syncHeroUpdateToBackend(hero)
        }
    }

    return hero
}

private func syncHeroUpdateToBackend(_ hero: Hero) async {
    guard let serverId = hero.serverId else {
        Logger.repository.warning("⚠️ Hero has no serverId, skipping: \(hero.name)")
        return
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

        // Check for conflicts
        if let localUpdatedAt = hero.serverUpdatedAt,
           serverHero.updatedAt > localUpdatedAt {
            // Server has newer version - conflict!
            hero.serverSyncStatus = .conflict
            try cacheManager.save(hero)

            Logger.repository.warning("⚠️ Conflict detected for hero: \(hero.name)")
            return
        }

        // No conflict, mark as synced
        hero.serverSyncStatus = .synced
        hero.lastSyncedAt = Date()
        hero.serverUpdatedAt = serverHero.updatedAt
        hero.pendingChanges = nil // Clear pending changes
        try cacheManager.save(hero)

        Logger.repository.info("✅ Synced hero update to backend: \(hero.name)")

    } catch {
        hero.serverSyncStatus = .failed
        hero.syncError = error.localizedDescription
        try? cacheManager.save(hero)

        Logger.repository.error("❌ Failed to sync hero update: \(error)")
    }
}
```

### Delete Operation

```swift
func deleteHero(_ hero: Hero) async throws {
    // 1. Mark as pending delete (don't actually delete yet)
    hero.serverSyncStatus = .pendingDelete
    try cacheManager.save(hero)

    Logger.repository.info("🗑️ Marked hero for deletion: \(hero.name)")

    // 2. Hide from UI (filter out in ViewModel)
    // ViewModels should filter: heroes.filter { $0.serverSyncStatus != .pendingDelete }

    // 3. Delete from backend
    if FeatureFlags.useBackendAPI, let serverId = hero.serverId {
        Task {
            await deleteHeroFromBackend(hero, serverId: serverId)
        }
    } else {
        // No backend sync, delete immediately
        try cacheManager.delete(hero)
    }
}

private func deleteHeroFromBackend(_ hero: Hero, serverId: String) async {
    do {
        let endpoint = Endpoint.deleteHero(id: UUID(uuidString: serverId)!)
        let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

        // Now actually delete from cache
        try cacheManager.delete(hero)

        Logger.repository.info("✅ Deleted hero from backend: \(hero.name)")

    } catch {
        hero.serverSyncStatus = .failed
        hero.syncError = error.localizedDescription
        try? cacheManager.save(hero)

        Logger.repository.error("❌ Failed to delete hero: \(error)")
    }
}
```

### UI Integration

```swift
@MainActor
class HeroViewModel: ObservableObject {
    @Published var heroes: [Hero] = []
    @Published var isSyncing = false
    @Published var syncError: Error?

    private let heroRepository: HeroRepositoryProtocol

    // Computed property: filter out pending deletes
    var visibleHeroes: [Hero] {
        return heroes.filter { $0.serverSyncStatus != .pendingDelete }
    }

    // Computed property: pending sync count (for UI indicator)
    var pendingSyncCount: Int {
        return heroes.filter { $0.needsSync }.count
    }

    func createHero(name: String, age: Int, traits: [CharacterTrait]) async {
        let hero = Hero(name: name, age: age, traits: traits)

        do {
            let created = try await heroRepository.create(hero)
            heroes.append(created)

            // UI updates immediately with local data
            // Background sync happens automatically

        } catch {
            syncError = error
        }
    }

    func updateHero(_ hero: Hero, newName: String) async {
        hero.name = newName

        do {
            _ = try await heroRepository.update(hero)

            // UI already shows new name (optimistic)
            // Background sync confirms with server

        } catch {
            syncError = error
        }
    }
}
```

---

## Conflict Resolution

### Conflict Detection

Conflicts occur when:
1. Local entity has unsaved changes (`needsSync == true`)
2. Server has a newer version (`serverUpdatedAt > localUpdatedAt`)

```swift
func detectConflict(local: Hero, server: HeroResponse) -> Bool {
    // No conflict if local is synced
    guard local.needsSync else {
        return false
    }

    // No conflict if server hasn't changed
    guard let localUpdatedAt = local.serverUpdatedAt else {
        return false // Local never synced, no conflict
    }

    // Conflict if server is newer
    return server.updatedAt > localUpdatedAt
}
```

### Resolution Strategies

#### 1. Last-Write-Wins (LWW) with Timestamp

Compare `serverUpdatedAt` timestamps to determine winner:

```swift
func resolveLastWriteWins(local: Hero, server: HeroResponse) throws {
    guard let localUpdatedAt = local.serverUpdatedAt else {
        // Local never synced, server wins
        local.updateFrom(server: server)
        try cacheManager.save(local)
        return
    }

    if server.updatedAt > localUpdatedAt {
        // Server is newer, server wins
        Logger.sync.info("Conflict: Server wins for \(local.name)")
        local.updateFrom(server: server)
        try cacheManager.save(local)
    } else {
        // Local is newer or same, local wins
        Logger.sync.info("Conflict: Local wins for \(local.name)")
        // Push local changes to server (already pending)
    }
}
```

#### 2. Server Always Wins

Conservative strategy for safety:

```swift
func resolveServerWins(local: Hero, server: HeroResponse) throws {
    Logger.sync.info("Conflict: Server wins for \(local.name) (policy)")

    local.updateFrom(server: server)
    local.serverSyncStatus = .synced
    local.lastSyncedAt = Date()
    local.pendingChanges = nil
    try cacheManager.save(local)
}
```

#### 3. Local Always Wins

Push local changes, overwrite server:

```swift
func resolveLocalWins(local: Hero) async throws {
    Logger.sync.info("Conflict: Local wins for \(local.name) (policy)")

    guard let serverId = local.serverId else {
        throw ConflictError.noServerId
    }

    let request = HeroUpdateRequest(
        name: local.name,
        age: local.age,
        traits: local.traits.map { $0.rawValue },
        specialAbility: local.specialAbility
    )

    let endpoint = Endpoint.updateHero(id: UUID(uuidString: serverId)!, data: request)
    let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

    guard let serverHero = response.data else {
        throw APIError.unknown(NSError(domain: "No data", code: -1))
    }

    local.serverUpdatedAt = serverHero.updatedAt
    local.serverSyncStatus = .synced
    local.lastSyncedAt = Date()
    local.pendingChanges = nil
    try cacheManager.save(local)
}
```

#### 4. User Prompt (UI-based Resolution)

For critical data, ask the user:

```swift
@MainActor
func resolveUserPrompt(local: Hero, server: HeroResponse) async throws {
    // Show conflict resolution UI
    let choice = await showConflictResolutionUI(local: local, server: server)

    switch choice {
    case .keepLocal:
        try await resolveLocalWins(local: local)

    case .keepServer:
        try resolveServerWins(local: local, server: server)

    case .merge:
        try await attemptMerge(local: local, server: server)
    }
}

enum ConflictChoice {
    case keepLocal
    case keepServer
    case merge
}
```

**Conflict Resolution UI**:

```swift
struct ConflictResolutionView: View {
    let local: Hero
    let server: HeroResponse
    let onResolve: (ConflictChoice) -> Void

    var body: some View {
        VStack(spacing: 20) {
            Text("Conflict Detected")
                .font(.title)

            Text("'\(local.name)' was modified on another device while you had local changes.")
                .multilineTextAlignment(.center)

            HStack(spacing: 20) {
                VStack {
                    Text("Your Version")
                        .font(.headline)
                    Text("Name: \(local.name)")
                    Text("Age: \(local.age)")
                    Text("Traits: \(local.traits.map { $0.rawValue }.joined(separator: ", "))")
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)

                VStack {
                    Text("Server Version")
                        .font(.headline)
                    Text("Name: \(server.name)")
                    Text("Age: \(server.age)")
                    Text("Traits: \(server.traits.joined(separator: ", "))")
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)
            }

            HStack(spacing: 16) {
                Button("Keep Mine") {
                    onResolve(.keepLocal)
                }
                .buttonStyle(.borderedProminent)

                Button("Use Server") {
                    onResolve(.keepServer)
                }
                .buttonStyle(.bordered)

                Button("Merge") {
                    onResolve(.merge)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
    }
}
```

#### 5. Merge Strategy

Attempt automatic merge for compatible changes:

```swift
func attemptMerge(local: Hero, server: HeroResponse) async throws {
    Logger.sync.info("Conflict: Attempting merge for \(local.name)")

    // Parse pending changes to see what fields changed locally
    guard let pendingData = local.pendingChanges,
          let pending = try? JSONDecoder().decode(PendingChanges.self, from: pendingData) else {
        // Can't determine what changed, default to server wins
        try resolveServerWins(local: local, server: server)
        return
    }

    // Merge logic: apply non-conflicting changes
    var merged = local

    // If name changed locally, keep local name
    if pending.changedFields["name"] == nil {
        merged.name = server.name
    }

    // If age changed locally, keep local age
    if pending.changedFields["age"] == nil {
        merged.age = server.age
    }

    // Traits: union of local and server
    let serverTraits = server.traits.compactMap { CharacterTrait(rawValue: $0) }
    merged.traits = Array(Set(merged.traits + serverTraits))

    // Push merged version to server
    try await resolveLocalWins(local: merged)
}
```

### Resolution Policy by Entity

| Entity | Default Strategy | Reason |
|--------|------------------|--------|
| **Hero** | Server Wins | Avatar may regenerate, safer to use server |
| **Story Content** | User Prompt | User-created, preserve choice |
| **Story Metadata** | Merge (numeric) | Can sum playCount, merge flags |
| **CustomEvent** | Local Wins | User-created, local priority |
| **Illustrations** | Server Wins | Regenerated from server |

```swift
func resolveConflict<T: Syncable>(local: T, server: T) async throws {
    switch T.self {
    case is Hero.Type:
        try resolveServerWins(local: local as! Hero, server: server as! HeroResponse)

    case is Story.Type:
        try await resolveUserPrompt(local: local as! Story, server: server as! StoryResponse)

    case is CustomStoryEvent.Type:
        try await resolveLocalWins(local: local as! CustomStoryEvent)

    default:
        try resolveServerWins(local: local, server: server)
    }
}
```

---

## Sync Triggers

### 1. App Launch

Perform initial sync when app starts:

```swift
@main
struct InfiniteStoriesApp: App {
    @StateObject private var syncManager = BackgroundSyncManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .task {
                    await syncManager.performSync()
                }
        }
    }
}
```

### 2. App Foreground

Sync when app returns from background:

```swift
class BackgroundSyncManager: ObservableObject {
    init() {
        setupObservers()
    }

    private func setupObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    @objc private func appDidBecomeActive() {
        Task {
            await performSync()
        }
    }
}
```

### 3. User Action (Immediate)

Sync specific entity after user creates/updates:

```swift
func createHero(_ hero: Hero) async throws -> Hero {
    // Save locally
    try cacheManager.save(hero)

    // Trigger immediate sync for this entity
    Task {
        await syncHeroToBackend(hero)
    }

    return hero
}
```

### 4. Network Available

Sync when network connection restored:

```swift
class NetworkMonitor: ObservableObject {
    @Published var isConnected = false

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                let wasDisconnected = !(self?.isConnected ?? false)
                self?.isConnected = path.status == .satisfied

                if wasDisconnected && self?.isConnected == true {
                    // Network restored, trigger sync
                    NotificationCenter.default.post(name: .networkAvailable, object: nil)
                }
            }
        }
        monitor.start(queue: queue)
    }
}
```

### 5. Periodic Background Sync

Scheduled sync every N minutes:

```swift
class BackgroundSyncManager: ObservableObject {
    private var syncTimer: Timer?

    func scheduleSyncTimer() {
        syncTimer?.invalidate()

        guard FeatureFlags.enableBackgroundSync else { return }

        let interval = FeatureFlags.syncInterval // Default: 900s (15min)

        syncTimer = Timer.scheduledTimer(
            withTimeInterval: interval,
            repeats: true
        ) { [weak self] _ in
            Task {
                await self?.performSync()
            }
        }

        Logger.sync.info("📅 Scheduled sync every \(interval)s")
    }
}
```

### 6. Manual Sync (Pull-to-Refresh)

User-initiated sync:

```swift
struct HeroListView: View {
    @StateObject private var viewModel = HeroViewModel()

    var body: some View {
        List(viewModel.visibleHeroes) { hero in
            HeroRow(hero: hero)
        }
        .refreshable {
            await viewModel.syncNow()
        }
    }
}

class HeroViewModel: ObservableObject {
    func syncNow() async {
        await syncManager.performSync()
    }
}
```

---

## Background Sync

### BGTaskScheduler Integration

Register background task for periodic sync:

```swift
import BackgroundTasks

class BackgroundSyncManager {
    static let taskIdentifier = "com.infinitestories.sync"

    func registerBackgroundTask() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.taskIdentifier,
            using: nil
        ) { task in
            self.handleBackgroundSync(task: task as! BGAppRefreshTask)
        }
    }

    func scheduleBackgroundSync() {
        let request = BGAppRefreshTaskRequest(identifier: Self.taskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes

        do {
            try BGTaskScheduler.shared.submit(request)
            Logger.sync.info("📅 Scheduled background sync")
        } catch {
            Logger.sync.error("Failed to schedule background sync: \(error)")
        }
    }

    private func handleBackgroundSync(task: BGAppRefreshTask) {
        // Schedule next background sync
        scheduleBackgroundSync()

        // Create expiration handler
        task.expirationHandler = {
            Logger.sync.warning("⏰ Background sync expired")
            task.setTaskCompleted(success: false)
        }

        // Perform sync
        Task {
            do {
                try await syncEngine.syncAll()
                task.setTaskCompleted(success: true)
                Logger.sync.info("✅ Background sync completed")
            } catch {
                task.setTaskCompleted(success: false)
                Logger.sync.error("❌ Background sync failed: \(error)")
            }
        }
    }
}
```

### Info.plist Configuration

```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.infinitestories.sync</string>
</array>
```

### App Delegate Setup

```swift
class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Register background sync
        BackgroundSyncManager.shared.registerBackgroundTask()
        BackgroundSyncManager.shared.scheduleBackgroundSync()

        return true
    }
}
```

---

## Media File Sync

### Avatar Sync Strategy

```swift
class MediaCacheManager {
    func syncAvatar(for hero: Hero) async throws {
        guard let avatarUrl = hero.avatarImagePath else { return }

        // Check if cached locally
        let cacheKey = "avatar_\(hero.id.uuidString)"

        if let cached = try? getCachedFile(key: cacheKey) {
            Logger.cache.debug("Using cached avatar for \(hero.name)")
            return
        }

        // Download from R2
        Logger.cache.info("Downloading avatar for \(hero.name)")

        let data = try await apiClient.download(from: URL(string: avatarUrl)!)

        // Cache locally (indefinitely for avatars)
        try await cacheFile(data, key: cacheKey, policy: .avatars)

        Logger.cache.info("✅ Cached avatar for \(hero.name)")
    }
}
```

### Audio Sync Strategy

```swift
func syncAudio(for story: Story) async throws {
    guard let audioUrl = story.audioFileName else { return }

    let cacheKey = "audio_\(story.id.uuidString)"

    if let cached = try? getCachedFile(key: cacheKey) {
        Logger.cache.debug("Using cached audio for \(story.title)")
        return
    }

    // Download with progress tracking
    Logger.cache.info("Downloading audio for \(story.title)")

    let data = try await apiClient.downloadWithProgress(
        from: URL(string: audioUrl)!
    ) { progress in
        // Update UI progress indicator
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: .audioDownloadProgress,
                object: nil,
                userInfo: ["progress": progress, "storyId": story.id]
            )
        }
    }

    // Cache for 30 days
    try await cacheFile(data, key: cacheKey, policy: .audio)

    Logger.cache.info("✅ Cached audio for \(story.title)")
}
```

### Illustration Sync Strategy

```swift
func syncIllustrations(for story: Story) async throws {
    guard let illustrations = story.illustrations else { return }

    for illustration in illustrations {
        let cacheKey = "illustration_\(illustration.id.uuidString)"

        if try? getCachedFile(key: cacheKey) != nil {
            continue // Already cached
        }

        guard let imageUrl = illustration.imagePath else { continue }

        let data = try await apiClient.download(from: URL(string: imageUrl)!)

        // Cache for 14 days
        try await cacheFile(data, key: cacheKey, policy: .illustrations)
    }

    Logger.cache.info("✅ Cached \(illustrations.count) illustrations for \(story.title)")
}
```

### Cache Eviction

```swift
func evictExpiredFiles() async throws {
    let now = Date()

    // Evict audio files older than 30 days
    let audioFiles = try fileManager.contentsOfDirectory(at: audioCacheDirectory)
    for file in audioFiles {
        let attributes = try fileManager.attributesOfItem(atPath: file.path)
        if let createdAt = attributes[.creationDate] as? Date,
           now.timeIntervalSince(createdAt) > 30 * 24 * 3600 {
            try fileManager.removeItem(at: file)
            Logger.cache.info("🗑️ Evicted audio file: \(file.lastPathComponent)")
        }
    }

    // Evict illustration files older than 14 days
    let illustrationFiles = try fileManager.contentsOfDirectory(at: illustrationCacheDirectory)
    for file in illustrationFiles {
        let attributes = try fileManager.attributesOfItem(atPath: file.path)
        if let createdAt = attributes[.creationDate] as? Date,
           now.timeIntervalSince(createdAt) > 14 * 24 * 3600 {
            try fileManager.removeItem(at: file)
            Logger.cache.info("🗑️ Evicted illustration file: \(file.lastPathComponent)")
        }
    }

    // Never evict avatars (cached indefinitely)
}
```

---

## Network Handling

### Offline Detection

```swift
class NetworkMonitor: ObservableObject {
    @Published var isConnected = false
    @Published var connectionType: NWInterface.InterfaceType?

    private let monitor = NWPathMonitor()

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
                self?.connectionType = path.availableInterfaces.first?.type

                if path.status == .satisfied {
                    Logger.network.info("✅ Network available: \(path.availableInterfaces.first?.type.rawValue ?? "unknown")")
                } else {
                    Logger.network.warning("⚠️ Network unavailable")
                }
            }
        }

        monitor.start(queue: DispatchQueue.global(qos: .background))
    }
}
```

### Retry Logic with Exponential Backoff

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

    func delay(for attempt: Int) -> TimeInterval {
        // 2^attempt * baseDelay + random jitter
        let exponential = pow(2.0, Double(attempt)) * baseDelay
        let jitter = Double.random(in: 0...1.0)
        return min(exponential + jitter, maxDelay)
    }
}

func requestWithRetry<T: Decodable>(
    _ endpoint: Endpoint,
    policy: RetryPolicy = .default
) async throws -> APIResponse<T> {
    var attempt = 0
    var lastError: Error?

    while attempt <= policy.maxRetries {
        do {
            return try await apiClient.request(endpoint)
        } catch let error as APIError {
            lastError = error

            // Don't retry certain errors
            if case .unauthorized = error { throw error }
            if case .forbidden = error { throw error }
            if case .validationError = error { throw error }

            // Check if we should retry
            if attempt < policy.maxRetries {
                let delay = policy.delay(for: attempt)
                Logger.network.info("Retrying in \(delay)s (attempt \(attempt + 1))")

                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                attempt += 1
            } else {
                throw error
            }
        }
    }

    throw lastError ?? APIError.unknown(NSError(domain: "Retry failed", code: -1))
}
```

---

## Performance Optimization

### Batch Operations

```swift
func batchUpdateHeroes(_ heroes: [Hero]) async throws {
    // Instead of individual requests
    // for hero in heroes { try await apiClient.updateHero(...) }

    // Use batch endpoint
    let requests = heroes.map { hero in
        HeroUpdateRequest(
            id: UUID(uuidString: hero.serverId!)!,
            name: hero.name,
            age: hero.age,
            traits: hero.traits.map { $0.rawValue },
            specialAbility: hero.specialAbility
        )
    }

    let endpoint = Endpoint.batchUpdateHeroes(data: requests)
    let response: APIResponse<[HeroResponse]> = try await apiClient.request(endpoint)

    guard let serverHeroes = response.data else { return }

    // Update local cache
    for (hero, serverHero) in zip(heroes, serverHeroes) {
        hero.updateFrom(server: serverHero)
        try cacheManager.save(hero)
    }

    Logger.sync.info("✅ Batch updated \(heroes.count) heroes")
}
```

### Pagination

```swift
func fetchAllStories() async throws -> [Story] {
    var allStories: [Story] = []
    var offset = 0
    let limit = 50
    var hasMore = true

    while hasMore {
        let endpoint = Endpoint.getStories(heroId: nil, limit: limit, offset: offset)
        let response: APIResponse<[StoryResponse]> = try await apiClient.request(endpoint)

        guard let stories = response.data else { break }

        allStories.append(contentsOf: stories.map { Story(from: $0) })

        hasMore = response.pagination?.hasMore ?? false
        offset += limit
    }

    return allStories
}
```

### Incremental Sync

Only sync changes since last sync:

```swift
func incrementalSync() async throws {
    guard let lastSyncAt = lastSyncAt else {
        // First sync, fetch all
        return try await fullSync()
    }

    // Only fetch changes since lastSyncAt
    let endpoint = Endpoint.getHeroes(
        limit: 100,
        offset: 0,
        updatedAfter: lastSyncAt
    )

    let response: APIResponse<[HeroResponse]> = try await apiClient.request(endpoint)

    guard let serverHeroes = response.data else { return }

    Logger.sync.info("📥 Incremental sync: \(serverHeroes.count) updated heroes")

    for serverHero in serverHeroes {
        // Update or create locally
        if let localHero = try findLocalHero(serverId: serverHero.id.uuidString) {
            localHero.updateFrom(server: serverHero)
            try cacheManager.save(localHero)
        } else {
            let newHero = Hero(from: serverHero)
            try cacheManager.save(newHero)
        }
    }

    self.lastSyncAt = Date()
}
```

---

## Summary

This offline caching and sync strategy provides:

1. ✅ **Instant UI Updates**: Optimistic updates provide <100ms feedback
2. ✅ **Robust Offline Mode**: Full functionality without network
3. ✅ **Conflict Resolution**: Multiple strategies for different scenarios
4. ✅ **Efficient Sync**: Incremental, batched, background sync
5. ✅ **Media Caching**: Smart caching with eviction policies
6. ✅ **Error Resilience**: Retry logic, exponential backoff, graceful degradation

**Next Steps**:
1. Implement core sync infrastructure (Phase 3)
2. Add media caching layer (Phase 4)
3. Test offline scenarios extensively
4. Monitor sync performance in production

---

**For migration details, see**: [PRD_IOS_API_INTEGRATION_MIGRATION.md](./PRD_IOS_API_INTEGRATION_MIGRATION.md)
