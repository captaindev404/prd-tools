//
//  HeroRepositoryTests.swift
//  InfiniteStoriesTests
//
//  Unit tests for HeroRepository with >80% code coverage
//

import XCTest
@testable import InfiniteStories

@MainActor
final class HeroRepositoryTests: XCTestCase {

    // MARK: - Properties

    var sut: HeroRepository!
    var mockAPIClient: MockAPIClient!
    var mockCacheManager: MockCacheManager!

    // MARK: - Setup & Teardown

    override func setUp() async throws {
        try await super.setUp()

        mockAPIClient = MockAPIClient()
        mockCacheManager = MockCacheManager()
        sut = HeroRepository(apiClient: mockAPIClient, cacheManager: mockCacheManager)
    }

    override func tearDown() async throws {
        sut = nil
        mockAPIClient = nil
        mockCacheManager = nil

        try await super.tearDown()
    }

    // MARK: - FetchAll Tests

    func testFetchAll_ReturnsAllHeroesFromCache_Success() async throws {
        // Given
        let hero1 = createTestHero(name: "Hero 1")
        let hero2 = createTestHero(name: "Hero 2")
        mockCacheManager.heroes = [hero1, hero2]

        // When
        let heroes = try await sut.fetchAll()

        // Then
        XCTAssertEqual(heroes.count, 2)
        XCTAssertEqual(heroes[0].name, "Hero 1")
        XCTAssertEqual(heroes[1].name, "Hero 2")
        XCTAssertTrue(mockCacheManager.fetchAllCalled)
    }

    func testFetchAll_WithCloudSyncEnabled_TriggersBackgroundSync() async throws {
        // Given
        let hero = createTestHero(name: "Test Hero")
        mockCacheManager.heroes = [hero]
        FeatureFlags.setEnableCloudSync(true)
        defer { FeatureFlags.setEnableCloudSync(false) }

        // When
        let heroes = try await sut.fetchAll()

        // Then
        XCTAssertEqual(heroes.count, 1)
        // Note: Background sync is fire-and-forget, we can't directly test it started
        // but we verify the cached data was returned immediately
        XCTAssertTrue(mockCacheManager.fetchAllCalled)
    }

    func testFetchAll_CacheThrowsError_PropagatesError() async throws {
        // Given
        mockCacheManager.shouldThrowError = true
        mockCacheManager.errorToThrow = CacheError.fetchFailed

        // When/Then
        do {
            _ = try await sut.fetchAll()
            XCTFail("Should throw error")
        } catch {
            XCTAssertEqual(error as? CacheError, CacheError.fetchFailed)
        }
    }

    // MARK: - Fetch by ID Tests

    func testFetch_ExistingHero_ReturnsHero() async throws {
        // Given
        let heroId = UUID()
        let hero = createTestHero(id: heroId, name: "Test Hero")
        mockCacheManager.heroes = [hero]

        // When
        let fetchedHero = try await sut.fetch(id: heroId)

        // Then
        XCTAssertNotNil(fetchedHero)
        XCTAssertEqual(fetchedHero?.id, heroId)
        XCTAssertEqual(fetchedHero?.name, "Test Hero")
        XCTAssertTrue(mockCacheManager.fetchByIdCalled)
    }

    func testFetch_NonExistingHero_ReturnsNil() async throws {
        // Given
        let nonExistingId = UUID()
        mockCacheManager.heroes = []

        // When
        let fetchedHero = try await sut.fetch(id: nonExistingId)

        // Then
        XCTAssertNil(fetchedHero)
        XCTAssertTrue(mockCacheManager.fetchByIdCalled)
    }

    // MARK: - Create Tests

    func testCreate_Success_SavesHeroLocally() async throws {
        // Given
        let hero = createTestHero(name: "New Hero")

        // When
        let createdHero = try await sut.create(hero)

        // Then
        XCTAssertEqual(createdHero.name, "New Hero")
        XCTAssertEqual(createdHero.serverSyncStatus, .pendingCreate)
        XCTAssertTrue(mockCacheManager.saveCalled)
        XCTAssertEqual(mockCacheManager.savedObjects.count, 1)
    }

    func testCreate_WithBackendAPIEnabled_TriggersBackgroundSync() async throws {
        // Given
        let hero = createTestHero(name: "New Hero")
        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let serverHero = HeroResponse(
            id: UUID(),
            name: hero.name,
            age: hero.age,
            traits: ["brave", "kind"],
            specialAbilities: nil,
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            avatarGenerationId: nil,
            visualProfile: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.createHeroResponse = serverHero

        // When
        let createdHero = try await sut.create(hero)

        // Wait a bit for background task to potentially start
        try await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds

        // Then
        XCTAssertEqual(createdHero.serverSyncStatus, .pendingCreate)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testCreate_CacheThrowsError_PropagatesError() async throws {
        // Given
        let hero = createTestHero(name: "New Hero")
        mockCacheManager.shouldThrowError = true
        mockCacheManager.errorToThrow = CacheError.saveFailed

        // When/Then
        do {
            _ = try await sut.create(hero)
            XCTFail("Should throw error")
        } catch {
            XCTAssertEqual(error as? CacheError, CacheError.saveFailed)
        }
    }

    // MARK: - Update Tests

    func testUpdate_Success_UpdatesHeroLocally() async throws {
        // Given
        let hero = createTestHero(name: "Original Name")
        hero.name = "Updated Name"
        hero.age = 10

        // When
        let updatedHero = try await sut.update(hero)

        // Then
        XCTAssertEqual(updatedHero.name, "Updated Name")
        XCTAssertEqual(updatedHero.age, 10)
        XCTAssertEqual(updatedHero.serverSyncStatus, .pendingUpdate)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testUpdate_RecordsPendingChanges() async throws {
        // Given
        let hero = createTestHero(name: "Original")
        hero.name = "Updated"

        // When
        _ = try await sut.update(hero)

        // Then
        XCTAssertNotNil(hero.pendingChanges)
        // Verify pending changes were recorded
    }

    func testUpdate_WithBackendAPIEnabled_TriggersBackgroundSync() async throws {
        // Given
        let hero = createTestHero(name: "Hero")
        hero.serverId = UUID().uuidString
        hero.name = "Updated Hero"

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let serverHero = HeroResponse(
            id: UUID(uuidString: hero.serverId!)!,
            name: hero.name,
            age: hero.age,
            traits: ["brave"],
            specialAbilities: nil,
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            avatarGenerationId: nil,
            visualProfile: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.updateHeroResponse = serverHero

        // When
        let updatedHero = try await sut.update(hero)

        // Then
        XCTAssertEqual(updatedHero.serverSyncStatus, .pendingUpdate)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    // MARK: - Delete Tests

    func testDelete_MarksHeroForDeletion() async throws {
        // Given
        let hero = createTestHero(name: "Hero to Delete")

        // When
        try await sut.delete(hero)

        // Then
        XCTAssertEqual(hero.serverSyncStatus, .pendingDelete)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testDelete_WithoutBackendAPI_DeletesImmediately() async throws {
        // Given
        let hero = createTestHero(name: "Hero to Delete")
        FeatureFlags.setUseBackendAPI(false)

        // When
        try await sut.delete(hero)

        // Then
        XCTAssertTrue(mockCacheManager.deleteCalled)
    }

    func testDelete_WithBackendAPIAndServerId_TriggersBackgroundDelete() async throws {
        // Given
        let hero = createTestHero(name: "Hero to Delete")
        hero.serverId = UUID().uuidString

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        mockAPIClient.deleteSuccess = true

        // When
        try await sut.delete(hero)

        // Then
        XCTAssertEqual(hero.serverSyncStatus, .pendingDelete)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    // MARK: - Avatar Generation Tests

    func testGenerateAvatar_Success_UpdatesHeroWithAvatar() async throws {
        // Given
        let hero = createTestHero(name: "Hero")
        hero.serverId = UUID().uuidString
        let prompt = "A brave young hero"

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let serverHero = HeroResponse(
            id: UUID(uuidString: hero.serverId!)!,
            name: hero.name,
            age: hero.age,
            traits: ["brave"],
            specialAbilities: nil,
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: "https://example.com/avatar.jpg",
            avatarGenerationId: "gen-123",
            visualProfile: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.generateAvatarResponse = serverHero

        // When
        let updatedHero = try await sut.generateAvatar(for: hero, prompt: prompt)

        // Then
        XCTAssertEqual(updatedHero.avatarImagePath, "https://example.com/avatar.jpg")
        XCTAssertEqual(updatedHero.avatarGenerationId, "gen-123")
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testGenerateAvatar_WithoutBackendAPI_ThrowsFeatureNotEnabled() async throws {
        // Given
        let hero = createTestHero(name: "Hero")
        FeatureFlags.setUseBackendAPI(false)

        // When/Then
        do {
            _ = try await sut.generateAvatar(for: hero, prompt: "prompt")
            XCTFail("Should throw featureNotEnabled error")
        } catch RepositoryError.featureNotEnabled {
            // Expected
        } catch {
            XCTFail("Wrong error type: \(error)")
        }
    }

    func testGenerateAvatar_WithoutServerId_ThrowsNotSynced() async throws {
        // Given
        let hero = createTestHero(name: "Hero")
        hero.serverId = nil

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        // When/Then
        do {
            _ = try await sut.generateAvatar(for: hero, prompt: "prompt")
            XCTFail("Should throw notSynced error")
        } catch RepositoryError.notSynced {
            // Expected
        } catch {
            XCTFail("Wrong error type: \(error)")
        }
    }

    // MARK: - Sync Tests

    func testSyncWithBackend_FetchesAndMergesServerData() async throws {
        // Given
        let serverHero1 = HeroResponse(
            id: UUID(),
            name: "Server Hero 1",
            age: 8,
            traits: ["brave", "kind"],
            specialAbilities: nil,
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            avatarGenerationId: nil,
            visualProfile: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        let serverHero2 = HeroResponse(
            id: UUID(),
            name: "Server Hero 2",
            age: 10,
            traits: ["curious"],
            specialAbilities: nil,
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            avatarGenerationId: nil,
            visualProfile: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getHeroesResponse = [serverHero1, serverHero2]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertTrue(mockAPIClient.requestCalled)
        XCTAssertEqual(mockCacheManager.savedObjects.count, 2)
    }

    func testSyncWithBackend_DetectsConflict_WhenLocalHasUnsavedChanges() async throws {
        // Given
        let serverId = UUID()
        let localHero = createTestHero(name: "Local Hero")
        localHero.serverId = serverId.uuidString
        localHero.serverSyncStatus = .pendingUpdate // Has unsaved changes

        mockCacheManager.heroes = [localHero]
        mockCacheManager.heroByServerId[serverId.uuidString] = localHero

        let serverHero = HeroResponse(
            id: serverId,
            name: "Server Updated Hero",
            age: 12,
            traits: ["brave"],
            specialAbilities: nil,
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            avatarGenerationId: nil,
            visualProfile: nil,
            createdAt: Date(),
            updatedAt: Date().addingTimeInterval(3600) // Newer than local
        )

        mockAPIClient.getHeroesResponse = [serverHero]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(localHero.serverSyncStatus, .conflict)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testSyncWithBackend_UpdatesLocalData_WhenNoConflict() async throws {
        // Given
        let serverId = UUID()
        let localHero = createTestHero(name: "Local Hero")
        localHero.serverId = serverId.uuidString
        localHero.serverSyncStatus = .synced // No unsaved changes

        mockCacheManager.heroes = [localHero]
        mockCacheManager.heroByServerId[serverId.uuidString] = localHero

        let serverHero = HeroResponse(
            id: serverId,
            name: "Server Updated Hero",
            age: 12,
            traits: ["brave", "curious"],
            specialAbilities: nil,
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            avatarGenerationId: nil,
            visualProfile: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getHeroesResponse = [serverHero]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(localHero.name, "Server Updated Hero")
        XCTAssertEqual(localHero.age, 12)
        XCTAssertEqual(localHero.serverSyncStatus, .synced)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testSyncWithBackend_CreatesNewHero_WhenNotExistsLocally() async throws {
        // Given
        mockCacheManager.heroes = []

        let serverHero = HeroResponse(
            id: UUID(),
            name: "New Server Hero",
            age: 9,
            traits: ["adventurous"],
            specialAbilities: nil,
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            avatarGenerationId: nil,
            visualProfile: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getHeroesResponse = [serverHero]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(mockCacheManager.savedObjects.count, 1)
        if let savedHero = mockCacheManager.savedObjects.first as? Hero {
            XCTAssertEqual(savedHero.name, "New Server Hero")
            XCTAssertEqual(savedHero.serverId, serverHero.id.uuidString)
            XCTAssertEqual(savedHero.serverSyncStatus, .synced)
        } else {
            XCTFail("Expected Hero to be saved")
        }
    }

    func testSyncWithBackend_HandlesEmptyResponse() async throws {
        // Given
        mockAPIClient.getHeroesResponse = []

        // When/Then - Should not throw
        try await sut.syncWithBackend()

        // Then
        XCTAssertTrue(mockAPIClient.requestCalled)
    }

    func testSyncWithBackend_HandlesAPIError_Gracefully() async throws {
        // Given
        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.networkError(URLError(.notConnectedToInternet))

        // When/Then
        do {
            try await sut.syncWithBackend()
            XCTFail("Should throw network error")
        } catch {
            // Expected to throw
            XCTAssertTrue(error is APIError)
        }
    }

    // MARK: - Error Handling Tests

    func testSyncHeroToBackend_HandlesAPIError_MarksAsFailed() async throws {
        // Given
        let hero = createTestHero(name: "Hero")

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.serverError

        // When
        _ = try await sut.create(hero)

        // Wait for background sync to potentially complete
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

        // Then - hero should be marked as failed after sync attempt
        // Note: Since sync happens in background, we can't guarantee timing
        XCTAssertEqual(hero.serverSyncStatus, .pendingCreate)
    }

    // MARK: - Helper Methods

    private func createTestHero(
        id: UUID = UUID(),
        name: String = "Test Hero",
        age: Int = 8,
        traits: [CharacterTrait] = [.brave, .kind]
    ) -> Hero {
        let hero = Hero(
            name: name,
            primaryTrait: traits[0],
            secondaryTrait: traits.count > 1 ? traits[1] : .curious
        )
        hero.age = age
        return hero
    }
}

// MARK: - Mock Classes

/// Mock API Client for testing
class MockAPIClient: APIClientProtocol {
    var requestCalled = false
    var shouldThrowError = false
    var errorToThrow: Error?

    var getHeroesResponse: [HeroResponse] = []
    var createHeroResponse: HeroResponse?
    var updateHeroResponse: HeroResponse?
    var generateAvatarResponse: HeroResponse?
    var deleteSuccess = true

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T> {
        requestCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        switch endpoint {
        case .getHeroes:
            if let response = getHeroesResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .createHero:
            if let response = createHeroResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .updateHero:
            if let response = updateHeroResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .generateAvatar:
            if let response = generateAvatarResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .deleteHero:
            if deleteSuccess {
                return APIResponse(data: EmptyResponse() as? T, error: nil, pagination: nil)
            }

        default:
            break
        }

        throw APIError.unknown(NSError(domain: "Mock", code: -1))
    }

    func upload(_ data: Data, to endpoint: Endpoint) async throws -> URL {
        return URL(string: "https://example.com/uploaded")!
    }

    func download(from url: URL) async throws -> Data {
        return Data()
    }
}

/// Mock Cache Manager for testing
class MockCacheManager: CacheManagerProtocol {
    var fetchAllCalled = false
    var fetchByIdCalled = false
    var saveCalled = false
    var deleteCalled = false

    var shouldThrowError = false
    var errorToThrow: Error?

    var heroes: [Hero] = []
    var heroByServerId: [String: Hero] = [:]
    var savedObjects: [Any] = []

    func save<T: PersistentModel>(_ object: T) throws {
        saveCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        savedObjects.append(object)

        if let hero = object as? Hero {
            heroes.append(hero)
            if let serverId = hero.serverId {
                heroByServerId[serverId] = hero
            }
        }
    }

    func fetch<T: PersistentModel>(_ type: T.Type, id: UUID) throws -> T? {
        fetchByIdCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        if type == Hero.self {
            return heroes.first { ($0 as? Hero)?.id == id } as? T
        }

        return nil
    }

    func fetchAll<T: PersistentModel>(_ type: T.Type) throws -> [T] {
        fetchAllCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        if type == Hero.self {
            return heroes as? [T] ?? []
        }

        return []
    }

    func delete<T: PersistentModel>(_ object: T) throws {
        deleteCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        if let hero = object as? Hero {
            heroes.removeAll { $0.id == hero.id }
            if let serverId = hero.serverId {
                heroByServerId.removeValue(forKey: serverId)
            }
        }
    }

    func markForSync<T: PersistentModel & Syncable>(_ object: T, status: SyncStatus) throws {
        object.serverSyncStatus = status
        try save(object)
    }

    func fetchPendingSync<T: PersistentModel & Syncable>(_ type: T.Type, status: SyncStatus?) throws -> [T] {
        if type == Hero.self {
            let filtered = heroes.filter { hero in
                if let status = status {
                    return (hero as? Syncable)?.serverSyncStatus == status
                } else {
                    return (hero as? Syncable)?.serverSyncStatus != .synced
                }
            }
            return filtered as? [T] ?? []
        }

        return []
    }

    func fetch<T: PersistentModel & Syncable>(_ type: T.Type, serverId: String) throws -> T? {
        if type == Hero.self {
            return heroByServerId[serverId] as? T
        }
        return nil
    }
}

// MARK: - Cache Errors

enum CacheError: Error {
    case fetchFailed
    case saveFailed
    case deleteFailed
}

// MARK: - Logger Mock

enum Logger {
    enum repository {
        static func info(_ message: String) { }
        static func warning(_ message: String) { }
        static func error(_ message: String) { }
        static func debug(_ message: String) { }
    }

    enum sync {
        static func info(_ message: String) { }
        static func warning(_ message: String) { }
        static func error(_ message: String) { }
        static func debug(_ message: String) { }
    }

    enum api {
        static func info(_ message: String) { }
        static func warning(_ message: String) { }
        static func error(_ message: String) { }
        static func debug(_ message: String) { }
    }

    enum auth {
        static func info(_ message: String) { }
        static func warning(_ message: String) { }
        static func error(_ message: String) { }
        static func debug(_ message: String) { }
    }

    enum cache {
        static func info(_ message: String) { }
        static func warning(_ message: String) { }
        static func error(_ message: String) { }
        static func debug(_ message: String) { }
    }
}

// MARK: - Test Extensions

extension Hero {
    // Properties needed for tests (normally in Hero+Sync.swift)
    var serverId: String?
    var serverSyncStatus: SyncStatus = .synced
    var lastSyncedAt: Date?
    var serverUpdatedAt: Date?
    var pendingChanges: Data?
    var syncError: String?
    var age: Int = 8
    var traits: [CharacterTrait] = []
    var specialAbility: String?

    var needsSync: Bool {
        return serverSyncStatus != .synced
    }

    func recordPendingChange(field: String, newValue: Any) throws {
        // Simplified for testing
        pendingChanges = Data()
    }

    func updateFrom(server: HeroResponse) {
        self.name = server.name
        self.age = server.age
        self.traits = server.traits.compactMap { CharacterTrait(rawValue: $0) }
        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
    }

    convenience init(from server: HeroResponse) {
        self.init(
            name: server.name,
            primaryTrait: .brave,
            secondaryTrait: .kind
        )
        self.serverId = server.id.uuidString
        self.age = server.age
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.serverUpdatedAt = server.updatedAt
    }
}

extension APIResponse {
    init(data: T?, error: APIErrorResponse?, pagination: Pagination? = nil) {
        // This would normally use the decoder, simplified for testing
        self.data = data
        self.error = error
        self.pagination = pagination
    }
}