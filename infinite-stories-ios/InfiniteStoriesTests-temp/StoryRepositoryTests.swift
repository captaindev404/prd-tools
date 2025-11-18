//
//  StoryRepositoryTests.swift
//  InfiniteStoriesTests
//
//  Unit tests for StoryRepository with >80% code coverage
//

import XCTest
@testable import InfiniteStories

@MainActor
final class StoryRepositoryTests: XCTestCase {

    // MARK: - Properties

    var sut: StoryRepository!
    var mockAPIClient: MockAPIClientForStory!
    var mockCacheManager: MockCacheManagerForStory!

    // MARK: - Setup & Teardown

    override func setUp() async throws {
        try await super.setUp()

        mockAPIClient = MockAPIClientForStory()
        mockCacheManager = MockCacheManagerForStory()
        sut = StoryRepository(apiClient: mockAPIClient, cacheManager: mockCacheManager)
    }

    override func tearDown() async throws {
        sut = nil
        mockAPIClient = nil
        mockCacheManager = nil

        try await super.tearDown()
    }

    // MARK: - FetchAll Tests

    func testFetchAll_ReturnsAllStoriesFromCache_Success() async throws {
        // Given
        let story1 = createTestStory(title: "Story 1")
        let story2 = createTestStory(title: "Story 2")
        mockCacheManager.stories = [story1, story2]

        // When
        let stories = try await sut.fetchAll()

        // Then
        XCTAssertEqual(stories.count, 2)
        XCTAssertEqual(stories[0].title, "Story 1")
        XCTAssertEqual(stories[1].title, "Story 2")
        XCTAssertTrue(mockCacheManager.fetchAllCalled)
    }

    func testFetchAll_WithCloudSyncEnabled_TriggersBackgroundSync() async throws {
        // Given
        let story = createTestStory(title: "Test Story")
        mockCacheManager.stories = [story]
        FeatureFlags.setEnableCloudSync(true)
        defer { FeatureFlags.setEnableCloudSync(false) }

        // When
        let stories = try await sut.fetchAll()

        // Then
        XCTAssertEqual(stories.count, 1)
        XCTAssertTrue(mockCacheManager.fetchAllCalled)
    }

    // MARK: - Fetch by ID Tests

    func testFetch_ExistingStory_ReturnsStory() async throws {
        // Given
        let storyId = UUID()
        let story = createTestStory(id: storyId, title: "Test Story")
        mockCacheManager.stories = [story]

        // When
        let fetchedStory = try await sut.fetch(id: storyId)

        // Then
        XCTAssertNotNil(fetchedStory)
        XCTAssertEqual(fetchedStory?.id, storyId)
        XCTAssertEqual(fetchedStory?.title, "Test Story")
        XCTAssertTrue(mockCacheManager.fetchByIdCalled)
    }

    func testFetch_NonExistingStory_ReturnsNil() async throws {
        // Given
        let nonExistingId = UUID()
        mockCacheManager.stories = []

        // When
        let fetchedStory = try await sut.fetch(id: nonExistingId)

        // Then
        XCTAssertNil(fetchedStory)
        XCTAssertTrue(mockCacheManager.fetchByIdCalled)
    }

    // MARK: - FetchForHero Tests

    func testFetchForHero_ReturnsStoriesForSpecificHero() async throws {
        // Given
        let hero = createTestHero(name: "Test Hero")
        let story1 = createTestStory(title: "Hero's Story 1", hero: hero)
        let story2 = createTestStory(title: "Hero's Story 2", hero: hero)
        let otherStory = createTestStory(title: "Other Hero's Story", hero: nil)

        mockCacheManager.stories = [story1, story2, otherStory]

        // When
        let heroStories = try await sut.fetchForHero(hero)

        // Then
        XCTAssertEqual(heroStories.count, 2)
        XCTAssertTrue(heroStories.contains { $0.title == "Hero's Story 1" })
        XCTAssertTrue(heroStories.contains { $0.title == "Hero's Story 2" })
        XCTAssertFalse(heroStories.contains { $0.title == "Other Hero's Story" })
    }

    // MARK: - Create Tests

    func testCreate_Success_SavesStoryLocally() async throws {
        // Given
        let story = createTestStory(title: "New Story")

        // When
        let createdStory = try await sut.create(story)

        // Then
        XCTAssertEqual(createdStory.title, "New Story")
        XCTAssertEqual(createdStory.serverSyncStatus, .pendingCreate)
        XCTAssertTrue(mockCacheManager.saveCalled)
        XCTAssertEqual(mockCacheManager.savedObjects.count, 1)
    }

    func testCreate_WithBackendAPIEnabled_TriggersBackgroundSync() async throws {
        // Given
        let hero = createTestHero(name: "Hero")
        hero.serverId = UUID().uuidString
        let story = createTestStory(title: "New Story", hero: hero)

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let serverStory = StoryResponse(
            id: UUID(),
            title: story.title,
            content: story.content,
            heroId: UUID(uuidString: hero.serverId!)!,
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            audioUrl: nil,
            audioGenerationStatus: "pending",
            audioDuration: nil,
            illustrationStatus: "pending",
            illustrationCount: 0,
            illustrations: nil,
            isFavorite: false,
            playCount: 0,
            lastPlayedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.createStoryResponse = serverStory

        // When
        let createdStory = try await sut.create(story)

        // Wait a bit for background task
        try await Task.sleep(nanoseconds: 100_000_000)

        // Then
        XCTAssertEqual(createdStory.serverSyncStatus, .pendingCreate)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    // MARK: - Update Tests

    func testUpdate_Success_UpdatesStoryLocally() async throws {
        // Given
        let story = createTestStory(title: "Original Title")
        story.title = "Updated Title"
        story.content = "Updated content"

        // When
        let updatedStory = try await sut.update(story)

        // Then
        XCTAssertEqual(updatedStory.title, "Updated Title")
        XCTAssertEqual(updatedStory.content, "Updated content")
        XCTAssertEqual(updatedStory.serverSyncStatus, .pendingUpdate)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testUpdate_RecordsPendingChanges() async throws {
        // Given
        let story = createTestStory(title: "Original")
        story.title = "Updated"

        // When
        _ = try await sut.update(story)

        // Then
        XCTAssertNotNil(story.pendingChanges)
    }

    // MARK: - Delete Tests

    func testDelete_MarksStoryForDeletion() async throws {
        // Given
        let story = createTestStory(title: "Story to Delete")

        // When
        try await sut.delete(story)

        // Then
        XCTAssertEqual(story.serverSyncStatus, .pendingDelete)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testDelete_WithoutBackendAPI_DeletesImmediately() async throws {
        // Given
        let story = createTestStory(title: "Story to Delete")
        FeatureFlags.setUseBackendAPI(false)

        // When
        try await sut.delete(story)

        // Then
        XCTAssertTrue(mockCacheManager.deleteCalled)
    }

    // MARK: - Story Generation Tests

    func testGenerateStory_Success_CreatesAndReturnsStory() async throws {
        // Given
        let hero = createTestHero(name: "Hero")
        hero.serverId = UUID().uuidString
        let event = StoryEvent.bedtime
        let language = "en"

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let serverStory = StoryResponse(
            id: UUID(),
            title: "Bedtime Story",
            content: "Once upon a time...",
            heroId: UUID(uuidString: hero.serverId!)!,
            eventType: event.rawValue,
            customEventId: nil,
            language: language,
            audioUrl: "https://example.com/audio.mp3",
            audioGenerationStatus: "completed",
            audioDuration: 180.0,
            illustrationStatus: "pending",
            illustrationCount: 0,
            illustrations: nil,
            isFavorite: false,
            playCount: 0,
            lastPlayedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.createStoryResponse = serverStory

        // When
        let generatedStory = try await sut.generateStory(for: hero, event: event, language: language)

        // Then
        XCTAssertEqual(generatedStory.title, "Bedtime Story")
        XCTAssertEqual(generatedStory.content, "Once upon a time...")
        XCTAssertEqual(generatedStory.audioFileName, "https://example.com/audio.mp3")
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testGenerateStory_WithoutBackendAPI_ThrowsFeatureNotEnabled() async throws {
        // Given
        let hero = createTestHero(name: "Hero")
        FeatureFlags.setUseBackendAPI(false)

        // When/Then
        do {
            _ = try await sut.generateStory(for: hero, event: .bedtime, language: "en")
            XCTFail("Should throw featureNotEnabled error")
        } catch RepositoryError.featureNotEnabled {
            // Expected
        } catch {
            XCTFail("Wrong error type: \(error)")
        }
    }

    func testGenerateStory_HeroNotSynced_ThrowsNotSynced() async throws {
        // Given
        let hero = createTestHero(name: "Hero")
        hero.serverId = nil

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        // When/Then
        do {
            _ = try await sut.generateStory(for: hero, event: .bedtime, language: "en")
            XCTFail("Should throw notSynced error")
        } catch RepositoryError.notSynced {
            // Expected
        } catch {
            XCTFail("Wrong error type: \(error)")
        }
    }

    // MARK: - Audio Generation Tests

    func testGenerateAudio_Success_UpdatesStoryWithAudio() async throws {
        // Given
        let story = createTestStory(title: "Story")
        story.serverId = UUID().uuidString

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let serverStory = StoryResponse(
            id: UUID(uuidString: story.serverId!)!,
            title: story.title,
            content: story.content,
            heroId: UUID(),
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            audioUrl: "https://example.com/audio.mp3",
            audioGenerationStatus: "completed",
            audioDuration: 120.0,
            illustrationStatus: "pending",
            illustrationCount: 0,
            illustrations: nil,
            isFavorite: false,
            playCount: 0,
            lastPlayedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.generateAudioResponse = serverStory

        // When
        let updatedStory = try await sut.generateAudio(for: story, language: "en", voice: "echo")

        // Then
        XCTAssertEqual(updatedStory.audioFileName, "https://example.com/audio.mp3")
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    // MARK: - Illustration Generation Tests

    func testGenerateIllustrations_Success_InitiatesIllustrationGeneration() async throws {
        // Given
        let story = createTestStory(title: "Story")
        story.serverId = UUID().uuidString

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let serverStory = StoryResponse(
            id: UUID(uuidString: story.serverId!)!,
            title: story.title,
            content: story.content,
            heroId: UUID(),
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            audioUrl: nil,
            audioGenerationStatus: "pending",
            audioDuration: nil,
            illustrationStatus: "processing",
            illustrationCount: 3,
            illustrations: nil,
            isFavorite: false,
            playCount: 0,
            lastPlayedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.generateIllustrationsResponse = serverStory

        // When
        let updatedStory = try await sut.generateIllustrations(for: story)

        // Then
        XCTAssertNotNil(updatedStory.serverUpdatedAt)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    // MARK: - Sync Tests

    func testSyncWithBackend_FetchesAndMergesServerData() async throws {
        // Given
        let serverStory = StoryResponse(
            id: UUID(),
            title: "Server Story",
            content: "Server content",
            heroId: UUID(),
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            audioUrl: nil,
            audioGenerationStatus: "pending",
            audioDuration: nil,
            illustrationStatus: "pending",
            illustrationCount: 0,
            illustrations: nil,
            isFavorite: false,
            playCount: 0,
            lastPlayedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getStoriesResponse = [serverStory]

        let hero = createTestHero(name: "Hero")
        hero.serverId = serverStory.heroId.uuidString
        mockCacheManager.heroByServerId[hero.serverId!] = hero

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertTrue(mockAPIClient.requestCalled)
        XCTAssertEqual(mockCacheManager.savedObjects.count, 1)
    }

    func testSyncWithBackend_DetectsConflict_WhenLocalHasUnsavedChanges() async throws {
        // Given
        let serverId = UUID()
        let localStory = createTestStory(title: "Local Story")
        localStory.serverId = serverId.uuidString
        localStory.serverSyncStatus = .pendingUpdate

        mockCacheManager.stories = [localStory]
        mockCacheManager.storyByServerId[serverId.uuidString] = localStory

        let serverStory = StoryResponse(
            id: serverId,
            title: "Server Updated Story",
            content: "Server content",
            heroId: UUID(),
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            audioUrl: nil,
            audioGenerationStatus: "pending",
            audioDuration: nil,
            illustrationStatus: "pending",
            illustrationCount: 0,
            illustrations: nil,
            isFavorite: false,
            playCount: 0,
            lastPlayedAt: nil,
            createdAt: Date(),
            updatedAt: Date().addingTimeInterval(3600)
        )

        mockAPIClient.getStoriesResponse = [serverStory]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(localStory.serverSyncStatus, .conflict)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testSyncWithBackend_UpdatesLocalData_WhenNoConflict() async throws {
        // Given
        let serverId = UUID()
        let localStory = createTestStory(title: "Local Story")
        localStory.serverId = serverId.uuidString
        localStory.serverSyncStatus = .synced

        mockCacheManager.stories = [localStory]
        mockCacheManager.storyByServerId[serverId.uuidString] = localStory

        let serverStory = StoryResponse(
            id: serverId,
            title: "Server Updated Story",
            content: "Updated content",
            heroId: UUID(),
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            audioUrl: nil,
            audioGenerationStatus: "pending",
            audioDuration: nil,
            illustrationStatus: "pending",
            illustrationCount: 0,
            illustrations: nil,
            isFavorite: true,
            playCount: 5,
            lastPlayedAt: Date(),
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getStoriesResponse = [serverStory]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(localStory.title, "Server Updated Story")
        XCTAssertEqual(localStory.content, "Updated content")
        XCTAssertEqual(localStory.serverSyncStatus, .synced)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testSyncWithBackend_CreatesNewStory_WhenNotExistsLocally() async throws {
        // Given
        mockCacheManager.stories = []

        let heroId = UUID()
        let hero = createTestHero(name: "Hero")
        hero.serverId = heroId.uuidString
        mockCacheManager.heroByServerId[hero.serverId!] = hero

        let serverStory = StoryResponse(
            id: UUID(),
            title: "New Server Story",
            content: "New content",
            heroId: heroId,
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            audioUrl: nil,
            audioGenerationStatus: "pending",
            audioDuration: nil,
            illustrationStatus: "pending",
            illustrationCount: 0,
            illustrations: nil,
            isFavorite: false,
            playCount: 0,
            lastPlayedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getStoriesResponse = [serverStory]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(mockCacheManager.savedObjects.count, 1)
        if let savedStory = mockCacheManager.savedObjects.first as? Story {
            XCTAssertEqual(savedStory.title, "New Server Story")
            XCTAssertEqual(savedStory.serverId, serverStory.id.uuidString)
            XCTAssertEqual(savedStory.serverSyncStatus, .synced)
        } else {
            XCTFail("Expected Story to be saved")
        }
    }

    func testSyncWithBackend_SkipsStory_WhenHeroNotFound() async throws {
        // Given
        mockCacheManager.stories = []

        let serverStory = StoryResponse(
            id: UUID(),
            title: "Orphan Story",
            content: "Content",
            heroId: UUID(), // Hero doesn't exist locally
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            audioUrl: nil,
            audioGenerationStatus: "pending",
            audioDuration: nil,
            illustrationStatus: "pending",
            illustrationCount: 0,
            illustrations: nil,
            isFavorite: false,
            playCount: 0,
            lastPlayedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getStoriesResponse = [serverStory]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(mockCacheManager.savedObjects.count, 0)
    }

    // MARK: - Error Handling Tests

    func testSyncStoryToBackend_HeroNotSynced_SkipsSync() async throws {
        // Given
        let hero = createTestHero(name: "Hero")
        hero.serverId = nil // Hero not synced
        let story = createTestStory(title: "Story", hero: hero)

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        // When
        _ = try await sut.create(story)

        // Wait for background sync attempt
        try await Task.sleep(nanoseconds: 100_000_000)

        // Then
        XCTAssertEqual(story.serverSyncStatus, .pendingCreate)
        XCTAssertFalse(mockAPIClient.requestCalled)
    }

    // MARK: - Helper Methods

    private func createTestStory(
        id: UUID = UUID(),
        title: String = "Test Story",
        content: String = "Test content",
        hero: Hero? = nil
    ) -> Story {
        let story = Story(
            title: title,
            content: content,
            hero: hero,
            builtInEvent: .bedtime,
            customEvent: nil,
            language: "en"
        )
        return story
    }

    private func createTestHero(name: String) -> Hero {
        return Hero(
            name: name,
            primaryTrait: .brave,
            secondaryTrait: .kind
        )
    }
}

// MARK: - Mock Classes

/// Mock API Client for Story tests
class MockAPIClientForStory: APIClientProtocol {
    var requestCalled = false
    var shouldThrowError = false
    var errorToThrow: Error?

    var getStoriesResponse: [StoryResponse] = []
    var createStoryResponse: StoryResponse?
    var updateStoryResponse: StoryResponse?
    var generateAudioResponse: StoryResponse?
    var generateIllustrationsResponse: StoryResponse?
    var deleteSuccess = true

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T> {
        requestCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        switch endpoint {
        case .getStories:
            if let response = getStoriesResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .createStory:
            if let response = createStoryResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .updateStory:
            if let response = updateStoryResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .generateAudio:
            if let response = generateAudioResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .generateIllustrations:
            if let response = generateIllustrationsResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .deleteStory:
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

/// Mock Cache Manager for Story tests
class MockCacheManagerForStory: CacheManagerProtocol {
    var fetchAllCalled = false
    var fetchByIdCalled = false
    var saveCalled = false
    var deleteCalled = false

    var shouldThrowError = false
    var errorToThrow: Error?

    var stories: [Story] = []
    var storyByServerId: [String: Story] = [:]
    var heroByServerId: [String: Hero] = [:]
    var savedObjects: [Any] = []

    func save<T: PersistentModel>(_ object: T) throws {
        saveCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        savedObjects.append(object)

        if let story = object as? Story {
            stories.append(story)
            if let serverId = story.serverId {
                storyByServerId[serverId] = story
            }
        }
    }

    func fetch<T: PersistentModel>(_ type: T.Type, id: UUID) throws -> T? {
        fetchByIdCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        if type == Story.self {
            return stories.first { ($0 as? Story)?.id == id } as? T
        } else if type == Hero.self {
            return heroByServerId.values.first { ($0 as? Hero)?.id == id } as? T
        }

        return nil
    }

    func fetchAll<T: PersistentModel>(_ type: T.Type) throws -> [T] {
        fetchAllCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        if type == Story.self {
            return stories as? [T] ?? []
        }

        return []
    }

    func delete<T: PersistentModel>(_ object: T) throws {
        deleteCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        if let story = object as? Story {
            stories.removeAll { $0.id == story.id }
            if let serverId = story.serverId {
                storyByServerId.removeValue(forKey: serverId)
            }
        }
    }

    func markForSync<T: PersistentModel & Syncable>(_ object: T, status: SyncStatus) throws {
        object.serverSyncStatus = status
        try save(object)
    }

    func fetchPendingSync<T: PersistentModel & Syncable>(_ type: T.Type, status: SyncStatus?) throws -> [T] {
        if type == Story.self {
            let filtered = stories.filter { story in
                if let status = status {
                    return (story as? Syncable)?.serverSyncStatus == status
                } else {
                    return (story as? Syncable)?.serverSyncStatus != .synced
                }
            }
            return filtered as? [T] ?? []
        }

        return []
    }

    func fetch<T: PersistentModel & Syncable>(_ type: T.Type, serverId: String) throws -> T? {
        if type == Story.self {
            return storyByServerId[serverId] as? T
        } else if type == Hero.self {
            return heroByServerId[serverId] as? T
        }
        return nil
    }
}

// MARK: - Test Extensions for Story

extension Story {
    // Properties needed for tests (normally in Story+Sync.swift)
    var serverId: String?
    var serverSyncStatus: SyncStatus = .synced
    var lastSyncedAt: Date?
    var serverUpdatedAt: Date?
    var pendingChanges: Data?
    var syncError: String?

    var needsSync: Bool {
        return serverSyncStatus != .synced
    }

    func recordPendingChange(field: String, newValue: Any) throws {
        // Simplified for testing
        pendingChanges = Data()
    }

    func updateFrom(server: StoryResponse) {
        self.title = server.title
        self.content = server.content
        self.audioFileName = server.audioUrl
        self.isFavorite = server.isFavorite
        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
    }

    convenience init(from server: StoryResponse, hero: Hero) {
        self.init(
            title: server.title,
            content: server.content,
            hero: hero,
            builtInEvent: server.eventType != nil ? StoryEvent(rawValue: server.eventType!) : nil,
            customEvent: nil,
            language: server.language
        )
        self.serverId = server.id.uuidString
        self.audioFileName = server.audioUrl
        self.isFavorite = server.isFavorite
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.serverUpdatedAt = server.updatedAt
    }
}