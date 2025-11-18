//
//  MigrationManagerTests.swift
//  InfiniteStoriesTests
//
//  Unit tests for MigrationManager migration orchestration with rollback
//

import XCTest
import SwiftData
@testable import InfiniteStories

@MainActor
final class MigrationManagerTests: XCTestCase {

    // MARK: - Properties

    var sut: MigrationManager!
    var mockModelContext: MockModelContext!
    var mockAPIClient: MockAPIClient!
    var mockAuthManager: MockAuthManager!
    var mockHeroRepository: MockHeroRepository!
    var mockStoryRepository: MockStoryRepository!
    var mockCustomEventRepository: MockCustomEventRepository!

    // MARK: - Setup & Teardown

    override func setUp() async throws {
        try await super.setUp()

        mockModelContext = MockModelContext()
        mockAPIClient = MockAPIClient()
        mockAuthManager = MockAuthManager()
        mockHeroRepository = MockHeroRepository()
        mockStoryRepository = MockStoryRepository()
        mockCustomEventRepository = MockCustomEventRepository()

        sut = MigrationManager(
            modelContext: mockModelContext,
            apiClient: mockAPIClient,
            authManager: mockAuthManager,
            heroRepository: mockHeroRepository,
            storyRepository: mockStoryRepository,
            customEventRepository: mockCustomEventRepository
        )

        // Reset migration state
        sut.resetMigrationState()
    }

    override func tearDown() async throws {
        sut.resetMigrationState()
        sut = nil
        mockModelContext = nil
        mockAPIClient = nil
        mockAuthManager = nil
        mockHeroRepository = nil
        mockStoryRepository = nil
        mockCustomEventRepository = nil

        try await super.tearDown()
    }

    // MARK: - Initialization Tests

    func testInit_LoadsPersistedState() {
        // Given/When - Created in setUp

        // Then
        XCTAssertEqual(sut.state.status, .notStarted)
        XCTAssertEqual(sut.state.currentStage, .idle)
        XCTAssertEqual(sut.state.progress, 0.0)
        XCTAssertNil(sut.state.startedAt)
        XCTAssertNil(sut.state.completedAt)
        XCTAssertNil(sut.state.error)
    }

    func testInit_ChecksAuthStatus() {
        // Given
        mockAuthManager.isAuthenticated = false

        // When
        let manager = MigrationManager(
            modelContext: mockModelContext,
            apiClient: mockAPIClient,
            authManager: mockAuthManager,
            heroRepository: mockHeroRepository,
            storyRepository: mockStoryRepository,
            customEventRepository: mockCustomEventRepository
        )

        // Then
        XCTAssertTrue(manager.isAuthRequired)
    }

    // MARK: - Migration Start Tests

    func testStartMigration_WhenNotAuthenticated_ThrowsAuthError() async {
        // Given
        mockAuthManager.isAuthenticated = false

        // When/Then
        do {
            try await sut.startMigration()
            XCTFail("Should throw authentication error")
        } catch {
            XCTAssertEqual(error as? MigrationError, .authenticationRequired)
        }

        // Verify state
        XCTAssertEqual(sut.state.status, .failed)
        XCTAssertEqual(sut.state.currentStage, .authenticating)
    }

    func testStartMigration_WhenAlreadyInProgress_Skips() async throws {
        // Given
        sut.state.status = .inProgress
        mockAuthManager.isAuthenticated = true

        // When
        try await sut.startMigration()

        // Then - Should skip without error
        XCTAssertEqual(sut.state.status, .inProgress)
    }

    func testStartMigration_WithNoData_CompletesSuccessfully() async throws {
        // Given
        mockAuthManager.isAuthenticated = true
        mockModelContext.heroes = []
        mockModelContext.stories = []
        mockModelContext.customEvents = []

        // When
        try await sut.startMigration()

        // Then
        XCTAssertEqual(sut.state.status, .completed)
        XCTAssertEqual(sut.state.currentStage, .complete)
        XCTAssertEqual(sut.state.progress, 1.0)
        XCTAssertNotNil(sut.state.completedAt)
    }

    func testStartMigration_WithHeroes_UploadsSuccessfully() async throws {
        // Given
        mockAuthManager.isAuthenticated = true

        let hero = MockHero(name: "Test Hero", serverId: nil, serverSyncStatus: .synced)
        hero.age = 8
        hero.specialAbility = "Flying"
        mockModelContext.heroes = [hero]

        let heroResponse = HeroResponse(
            id: UUID(),
            name: "Test Hero",
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
        mockAPIClient.heroResponse = heroResponse

        // When
        try await sut.startMigration()

        // Then
        XCTAssertEqual(sut.state.status, .completed)
        XCTAssertEqual(sut.state.heroesExported, 1)
        XCTAssertEqual(sut.state.heroesUploaded, 1)
    }

    func testStartMigration_WhenUploadFails_SetsFailedState() async throws {
        // Given
        mockAuthManager.isAuthenticated = true

        let hero = MockHero(name: "Test Hero", serverId: nil, serverSyncStatus: .synced)
        mockModelContext.heroes = [hero]

        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.networkError(URLError(.notConnectedToInternet))

        // When/Then
        do {
            try await sut.startMigration()
            XCTFail("Should throw network error")
        } catch {
            // Expected error
        }

        // Verify state
        XCTAssertEqual(sut.state.status, .failed)
        XCTAssertNotNil(sut.state.error)
    }

    // MARK: - Resume Migration Tests

    func testResumeMigration_WhenFailed_ResumesFromLastStage() async throws {
        // Given
        sut.state.status = .failed
        sut.state.currentStage = .uploadingHeroes
        sut.state.progress = 0.3
        mockAuthManager.isAuthenticated = true
        mockModelContext.heroes = []

        // When
        try await sut.resumeMigration()

        // Then
        XCTAssertEqual(sut.state.status, .completed)
    }

    func testResumeMigration_WhenNotFailedOrInProgress_DoesNothing() async throws {
        // Given
        sut.state.status = .completed
        mockAuthManager.isAuthenticated = true

        // When
        try await sut.resumeMigration()

        // Then - Should not change status
        XCTAssertEqual(sut.state.status, .completed)
    }

    func testCanResumeMigration_WhenFailedWithProgress_ReturnsTrue() {
        // Given
        sut.state.status = .failed
        sut.state.progress = 0.5

        // When/Then
        XCTAssertTrue(sut.canResumeMigration)
    }

    func testCanResumeMigration_WhenNotFailed_ReturnsFalse() {
        // Given
        sut.state.status = .completed

        // When/Then
        XCTAssertFalse(sut.canResumeMigration)
    }

    // MARK: - Cancel Migration Tests

    func testCancelMigration_WhenInProgress_SetsFailedState() async throws {
        // Given
        sut.state.status = .inProgress

        // When
        try await sut.cancelMigration()

        // Then
        XCTAssertEqual(sut.state.status, .failed)
        XCTAssertEqual(sut.state.error, "Migration cancelled by user")
    }

    func testCancelMigration_WhenNotInProgress_DoesNothing() async throws {
        // Given
        sut.state.status = .completed

        // When
        try await sut.cancelMigration()

        // Then
        XCTAssertEqual(sut.state.status, .completed)
    }

    // MARK: - Rollback Tests

    func testRollback_WithoutBackup_ThrowsError() async {
        // Given - No backup data

        // When/Then
        do {
            try await sut.rollback()
            XCTFail("Should throw no backup error")
        } catch {
            XCTAssertEqual(error as? MigrationError, .noBackupAvailable)
        }
    }

    func testRollback_WithBackup_DeletesUploadedData() async throws {
        // Given - Set up backup data
        mockAuthManager.isAuthenticated = true

        // First perform a migration to create backup
        let hero = MockHero(name: "Test Hero", serverId: UUID().uuidString, serverSyncStatus: .synced)
        mockModelContext.heroes = [hero]

        // Mock successful upload
        mockAPIClient.heroResponse = HeroResponse(
            id: UUID(),
            name: "Test Hero",
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

        // Perform migration to create backup
        try await sut.startMigration()

        // Setup for rollback
        mockAPIClient.emptyResponse = EmptyResponse()
        mockAPIClient.shouldThrowError = false

        // When
        try await sut.rollback()

        // Then
        XCTAssertEqual(sut.state.status, .rolledBack)
        XCTAssertEqual(sut.state.progress, 1.0)
        XCTAssertNotNil(sut.state.completedAt)
    }

    func testRollback_WhenDeleteFails_StillContinues() async throws {
        // Given - Set up backup data
        mockAuthManager.isAuthenticated = true

        let hero = MockHero(name: "Test Hero", serverId: UUID().uuidString, serverSyncStatus: .synced)
        mockModelContext.heroes = [hero]

        // Create backup by starting migration
        mockAPIClient.heroResponse = HeroResponse(
            id: UUID(),
            name: "Test Hero",
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
        try await sut.startMigration()

        // Setup delete to fail
        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.networkError(URLError(.notConnectedToInternet))

        // When
        try await sut.rollback()

        // Then - Should still mark as rolled back
        XCTAssertEqual(sut.state.status, .rolledBack)
    }

    // MARK: - State Management Tests

    func testResetMigrationState_ClearsAllState() {
        // Given
        sut.state.status = .completed
        sut.state.progress = 1.0
        sut.state.heroesUploaded = 10

        // When
        sut.resetMigrationState()

        // Then
        XCTAssertEqual(sut.state.status, .notStarted)
        XCTAssertEqual(sut.state.currentStage, .idle)
        XCTAssertEqual(sut.state.progress, 0.0)
        XCTAssertEqual(sut.state.heroesUploaded, 0)
        XCTAssertFalse(UserDefaults.standard.bool(forKey: "migrationCompleted"))
    }

    func testMigrationProgress_ReturnsCorrectPercentage() {
        // Given
        sut.state.progress = 0.75

        // When/Then
        XCTAssertEqual(sut.migrationProgress, "75%")
    }

    func testIsMigrationNeeded_WithLocalDataAndNoMigration_ReturnsTrue() {
        // Given
        mockModelContext.heroes = [MockHero(name: "Test", serverId: nil, serverSyncStatus: .synced)]
        UserDefaults.standard.set(false, forKey: "migrationCompleted")

        // When/Then
        XCTAssertTrue(sut.isMigrationNeeded)
    }

    func testIsMigrationNeeded_WithCompletedMigration_ReturnsFalse() {
        // Given
        mockModelContext.heroes = [MockHero(name: "Test", serverId: nil, serverSyncStatus: .synced)]
        UserDefaults.standard.set(true, forKey: "migrationCompleted")

        // When/Then
        XCTAssertFalse(sut.isMigrationNeeded)
    }

    func testIsMigrationNeeded_WithNoLocalData_ReturnsFalse() {
        // Given
        mockModelContext.heroes = []
        UserDefaults.standard.set(false, forKey: "migrationCompleted")

        // When/Then
        XCTAssertFalse(sut.isMigrationNeeded)
    }

    // MARK: - Stage Update Tests

    func testStageUpdates_TrackProgressCorrectly() async throws {
        // Given
        mockAuthManager.isAuthenticated = true
        mockModelContext.heroes = []

        // When
        try await sut.startMigration()

        // Then - Check that stages progressed
        XCTAssertEqual(sut.state.currentStage, .complete)
        XCTAssertEqual(sut.state.progress, 1.0)
    }

    // MARK: - Performance Tests

    func testMigration_LargeDataset_Performance() throws {
        // Given
        mockAuthManager.isAuthenticated = true

        var heroes: [MockHero] = []
        for i in 0..<50 {
            heroes.append(MockHero(name: "Hero \(i)", serverId: nil, serverSyncStatus: .synced))
        }
        mockModelContext.heroes = heroes

        mockAPIClient.heroResponse = HeroResponse(
            id: UUID(),
            name: "Hero",
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

        // Measure
        measure {
            let expectation = self.expectation(description: "Migration completes")

            Task { @MainActor in
                try await sut.startMigration()
                expectation.fulfill()
            }

            wait(for: [expectation], timeout: 10.0)
        }
    }
}

// MARK: - Mock Helpers

class MockAuthManager: AuthManager {
    override var isAuthenticated: Bool {
        get { _isAuthenticated }
        set { _isAuthenticated = newValue }
    }

    private var _isAuthenticated = true

    init() {
        super.init(keychainHelper: MockKeychainHelper(), apiClient: MockAPIClient())
    }
}

class MockHeroRepository: HeroRepositoryProtocol {
    func create(_ request: HeroCreateRequest) async throws -> Hero {
        let hero = MockHero(name: request.name, serverId: UUID().uuidString, serverSyncStatus: .synced)
        return hero
    }

    func getAll(limit: Int, offset: Int, includeStories: Bool) async throws -> [Hero] {
        return []
    }

    func get(id: UUID, includeStories: Bool) async throws -> Hero? {
        return nil
    }

    func update(id: UUID, request: HeroUpdateRequest) async throws -> Hero {
        let hero = MockHero(name: request.name, serverId: id.uuidString, serverSyncStatus: .synced)
        return hero
    }

    func delete(id: UUID) async throws {
        // Mock delete
    }

    func uploadAvatar(heroId: UUID, imageData: Data) async throws -> String {
        return "https://example.com/avatar.png"
    }
}

class MockStoryRepository: StoryRepositoryProtocol {
    func create(_ request: StoryCreateRequest) async throws -> Story {
        let story = MockStory(title: "Test", serverId: UUID().uuidString, serverSyncStatus: .synced)
        return story
    }

    func getAll(heroId: UUID?, limit: Int, offset: Int, includeIllustrations: Bool) async throws -> [Story] {
        return []
    }

    func get(id: UUID, includeIllustrations: Bool) async throws -> Story? {
        return nil
    }

    func update(id: UUID, request: StoryUpdateRequest) async throws -> Story {
        let story = MockStory(title: request.title ?? "Test", serverId: id.uuidString, serverSyncStatus: .synced)
        return story
    }

    func delete(id: UUID) async throws {
        // Mock delete
    }

    func regenerateAudio(storyId: UUID) async throws -> String {
        return "https://example.com/audio.mp3"
    }

    func generateIllustrations(storyId: UUID) async throws -> [StoryIllustration] {
        return []
    }
}

class MockCustomEventRepository: CustomEventRepositoryProtocol {
    func create(_ request: CustomEventCreateRequest) async throws -> CustomStoryEvent {
        let event = MockCustomEvent(title: request.title)
        return event
    }

    func getAll(limit: Int, offset: Int) async throws -> [CustomStoryEvent] {
        return []
    }

    func get(id: UUID) async throws -> CustomStoryEvent? {
        return nil
    }

    func update(id: UUID, request: CustomEventUpdateRequest) async throws -> CustomStoryEvent {
        let event = MockCustomEvent(title: request.title ?? "Test")
        return event
    }

    func delete(id: UUID) async throws {
        // Mock delete
    }
}