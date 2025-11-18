//
//  ConflictResolverTests.swift
//  InfiniteStoriesTests
//
//  Unit tests for ConflictResolver sync conflict resolution
//

import XCTest
@testable import InfiniteStories

final class ConflictResolverTests: XCTestCase {

    // MARK: - Properties

    var sut: ConflictResolver!
    var mockAPIClient: MockAPIClient!
    var mockCacheManager: MockCacheManager!

    // MARK: - Setup & Teardown

    override func setUp() async throws {
        try await super.setUp()

        mockAPIClient = MockAPIClient()
        mockCacheManager = MockCacheManager()
        sut = ConflictResolver(apiClient: mockAPIClient, cacheManager: mockCacheManager)
    }

    override func tearDown() async throws {
        sut = nil
        mockAPIClient = nil
        mockCacheManager = nil

        try await super.tearDown()
    }

    // MARK: - Hero Conflict Tests

    func testResolveHeroConflict_ServerWins_UpdatesLocalWithServer() async throws {
        // Given
        let localHero = MockHero(name: "Local Hero", serverId: UUID().uuidString, serverSyncStatus: .conflict)
        localHero.age = 8
        localHero.specialAbility = "Flying"

        let serverHero = HeroResponse(
            id: UUID(uuidString: localHero.serverId!)!,
            name: "Server Hero",
            age: 10,
            traits: ["brave", "kind"],
            specialAbility: "Super strength",
            hairColor: "brown",
            eyeColor: "blue",
            skinTone: "fair",
            height: "tall",
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        // When
        try await sut.resolveHeroConflict(local: localHero, server: serverHero, strategy: .serverWins)

        // Then
        XCTAssertEqual(localHero.serverSyncStatus, .synced)
        XCTAssertNotNil(localHero.lastSyncedAt)
        XCTAssertNil(localHero.pendingChanges)
        XCTAssertNil(localHero.syncError)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testResolveHeroConflict_LocalWins_PushesLocalToServer() async throws {
        // Given
        let localHero = MockHero(name: "Local Hero", serverId: UUID().uuidString, serverSyncStatus: .conflict)
        localHero.age = 8
        localHero.specialAbility = "Flying"

        let serverHero = HeroResponse(
            id: UUID(uuidString: localHero.serverId!)!,
            name: "Server Hero",
            age: 10,
            traits: [],
            specialAbility: "Super strength",
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        let updatedServerHero = HeroResponse(
            id: UUID(uuidString: localHero.serverId!)!,
            name: "Local Hero",
            age: 8,
            traits: [],
            specialAbility: "Flying",
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.heroResponse = updatedServerHero

        // When
        try await sut.resolveHeroConflict(local: localHero, server: serverHero, strategy: .localWins)

        // Then
        XCTAssertEqual(localHero.serverSyncStatus, .synced)
        XCTAssertNotNil(localHero.lastSyncedAt)
        XCTAssertNil(localHero.pendingChanges)
        XCTAssertTrue(mockAPIClient.requestCalled)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testResolveHeroConflict_LocalWins_WithoutServerId_ThrowsError() async throws {
        // Given
        let localHero = MockHero(name: "Local Hero", serverId: nil, serverSyncStatus: .conflict)
        let serverHero = HeroResponse(
            id: UUID(),
            name: "Server Hero",
            age: 10,
            traits: [],
            specialAbility: "Super strength",
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        // When/Then
        do {
            try await sut.resolveHeroConflict(local: localHero, server: serverHero, strategy: .localWins)
            XCTFail("Should throw error when serverId is nil")
        } catch {
            XCTAssertEqual(error as? RepositoryError, RepositoryError.notSynced)
        }
    }

    func testResolveHeroConflict_Merge_DefaultsToServerWins() async throws {
        // Given
        let localHero = MockHero(name: "Local Hero", serverId: UUID().uuidString, serverSyncStatus: .conflict)
        let serverHero = HeroResponse(
            id: UUID(uuidString: localHero.serverId!)!,
            name: "Server Hero",
            age: 10,
            traits: [],
            specialAbility: "Super strength",
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        // When
        try await sut.resolveHeroConflict(local: localHero, server: serverHero, strategy: .merge)

        // Then - Should default to server wins for now
        XCTAssertEqual(localHero.serverSyncStatus, .synced)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testResolveHeroConflict_UserPrompt_DefaultsToServerWins() async throws {
        // Given
        let localHero = MockHero(name: "Local Hero", serverId: UUID().uuidString, serverSyncStatus: .conflict)
        let serverHero = HeroResponse(
            id: UUID(uuidString: localHero.serverId!)!,
            name: "Server Hero",
            age: 10,
            traits: [],
            specialAbility: "Super strength",
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        // When
        try await sut.resolveHeroConflict(local: localHero, server: serverHero, strategy: .userPrompt)

        // Then - Should default to server wins since UI not implemented
        XCTAssertEqual(localHero.serverSyncStatus, .synced)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    // MARK: - Story Conflict Tests

    func testResolveStoryConflict_ServerWins_UpdatesLocalWithServer() async throws {
        // Given
        let localStory = MockStory(title: "Local Story", serverId: UUID().uuidString, serverSyncStatus: .conflict)
        localStory.content = "Local content"
        localStory.isFavorite = true

        let serverStory = StoryResponse(
            id: UUID(uuidString: localStory.serverId!)!,
            heroId: UUID(),
            title: "Server Story",
            content: "Server content",
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            isFavorite: false,
            audioUrl: nil,
            audioStatus: "pending",
            hasAudio: false,
            illustrations: [],
            hasIllustrations: false,
            estimatedDuration: 0,
            createdAt: Date(),
            updatedAt: Date()
        )

        // When
        try await sut.resolveStoryConflict(local: localStory, server: serverStory, strategy: .serverWins)

        // Then
        XCTAssertEqual(localStory.serverSyncStatus, .synced)
        XCTAssertNotNil(localStory.lastSyncedAt)
        XCTAssertNil(localStory.pendingChanges)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testResolveStoryConflict_LocalWins_PushesLocalToServer() async throws {
        // Given
        let localStory = MockStory(title: "Local Story", serverId: UUID().uuidString, serverSyncStatus: .conflict)
        localStory.content = "Local content"
        localStory.isFavorite = true

        let serverStory = StoryResponse(
            id: UUID(uuidString: localStory.serverId!)!,
            heroId: UUID(),
            title: "Server Story",
            content: "Server content",
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            isFavorite: false,
            audioUrl: nil,
            audioStatus: "pending",
            hasAudio: false,
            illustrations: [],
            hasIllustrations: false,
            estimatedDuration: 0,
            createdAt: Date(),
            updatedAt: Date()
        )

        let updatedServerStory = StoryResponse(
            id: UUID(uuidString: localStory.serverId!)!,
            heroId: UUID(),
            title: "Local Story",
            content: "Local content",
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            isFavorite: true,
            audioUrl: nil,
            audioStatus: "pending",
            hasAudio: false,
            illustrations: [],
            hasIllustrations: false,
            estimatedDuration: 0,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.storyResponse = updatedServerStory

        // When
        try await sut.resolveStoryConflict(local: localStory, server: serverStory, strategy: .localWins)

        // Then
        XCTAssertEqual(localStory.serverSyncStatus, .synced)
        XCTAssertNotNil(localStory.lastSyncedAt)
        XCTAssertNil(localStory.pendingChanges)
        XCTAssertTrue(mockAPIClient.requestCalled)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testResolveStoryConflict_WithoutServerId_ThrowsError() async throws {
        // Given
        let localStory = MockStory(title: "Local Story", serverId: nil, serverSyncStatus: .conflict)
        let serverStory = StoryResponse(
            id: UUID(),
            heroId: UUID(),
            title: "Server Story",
            content: "Server content",
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            isFavorite: false,
            audioUrl: nil,
            audioStatus: "pending",
            hasAudio: false,
            illustrations: [],
            hasIllustrations: false,
            estimatedDuration: 0,
            createdAt: Date(),
            updatedAt: Date()
        )

        // When/Then
        do {
            try await sut.resolveStoryConflict(local: localStory, server: serverStory, strategy: .localWins)
            XCTFail("Should throw error when serverId is nil")
        } catch {
            XCTAssertEqual(error as? RepositoryError, RepositoryError.notSynced)
        }
    }

    // MARK: - Default Strategy Tests

    func testGetDefaultStrategy_ForHero_ReturnsServerWins() {
        // When
        let strategy = sut.getDefaultStrategy(for: Hero.self)

        // Then
        XCTAssertEqual(strategy, .serverWins)
    }

    func testGetDefaultStrategy_ForStory_ReturnsUserPrompt() {
        // When
        let strategy = sut.getDefaultStrategy(for: Story.self)

        // Then
        XCTAssertEqual(strategy, .userPrompt)
    }

    func testGetDefaultStrategy_ForCustomStoryEvent_ReturnsLocalWins() {
        // When
        let strategy = sut.getDefaultStrategy(for: CustomStoryEvent.self)

        // Then
        XCTAssertEqual(strategy, .localWins)
    }

    func testGetDefaultStrategy_ForStoryIllustration_ReturnsServerWins() {
        // When
        let strategy = sut.getDefaultStrategy(for: StoryIllustration.self)

        // Then
        XCTAssertEqual(strategy, .serverWins)
    }

    func testGetDefaultStrategy_ForUnknownType_ReturnsServerWins() {
        // When
        let strategy = sut.getDefaultStrategy(for: String.self)

        // Then
        XCTAssertEqual(strategy, .serverWins)
    }

    // MARK: - Edge Cases

    func testResolveHeroConflict_WhenAPIFails_ThrowsError() async throws {
        // Given
        let localHero = MockHero(name: "Local Hero", serverId: UUID().uuidString, serverSyncStatus: .conflict)
        let serverHero = HeroResponse(
            id: UUID(uuidString: localHero.serverId!)!,
            name: "Server Hero",
            age: 10,
            traits: [],
            specialAbility: "Super strength",
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.networkError(URLError(.notConnectedToInternet))

        // When/Then
        do {
            try await sut.resolveHeroConflict(local: localHero, server: serverHero, strategy: .localWins)
            XCTFail("Should throw network error")
        } catch {
            XCTAssertNotNil(error as? APIError)
        }
    }

    func testResolveStoryConflict_WhenAPIFails_ThrowsError() async throws {
        // Given
        let localStory = MockStory(title: "Local Story", serverId: UUID().uuidString, serverSyncStatus: .conflict)
        let serverStory = StoryResponse(
            id: UUID(uuidString: localStory.serverId!)!,
            heroId: UUID(),
            title: "Server Story",
            content: "Server content",
            eventType: "bedtime",
            customEventId: nil,
            language: "en",
            isFavorite: false,
            audioUrl: nil,
            audioStatus: "pending",
            hasAudio: false,
            illustrations: [],
            hasIllustrations: false,
            estimatedDuration: 0,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.serverError

        // When/Then
        do {
            try await sut.resolveStoryConflict(local: localStory, server: serverStory, strategy: .localWins)
            XCTFail("Should throw server error")
        } catch {
            XCTAssertNotNil(error as? APIError)
        }
    }

    // MARK: - Performance Tests

    func testResolveMultipleConflicts_Performance() throws {
        // Given - Multiple conflicts to resolve
        var heroes: [MockHero] = []
        for i in 0..<50 {
            heroes.append(MockHero(name: "Hero \(i)", serverId: UUID().uuidString, serverSyncStatus: .conflict))
        }

        let serverHero = HeroResponse(
            id: UUID(),
            name: "Server Hero",
            age: 10,
            traits: [],
            specialAbility: "Super strength",
            hairColor: nil,
            eyeColor: nil,
            skinTone: nil,
            height: nil,
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        // Measure
        measure {
            let expectation = self.expectation(description: "Conflicts resolved")

            Task {
                for hero in heroes {
                    try await sut.resolveHeroConflict(local: hero, server: serverHero, strategy: .serverWins)
                }
                expectation.fulfill()
            }

            wait(for: [expectation], timeout: 5.0)
        }
    }
}