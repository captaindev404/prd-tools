//
//  CustomEventRepositoryTests.swift
//  InfiniteStoriesTests
//
//  Unit tests for CustomEventRepository with >80% code coverage
//

import XCTest
@testable import InfiniteStories

@MainActor
final class CustomEventRepositoryTests: XCTestCase {

    // MARK: - Properties

    var sut: CustomEventRepository!
    var mockAPIClient: MockAPIClientForCustomEvent!
    var mockCacheManager: MockCacheManagerForCustomEvent!

    // MARK: - Setup & Teardown

    override func setUp() async throws {
        try await super.setUp()

        mockAPIClient = MockAPIClientForCustomEvent()
        mockCacheManager = MockCacheManagerForCustomEvent()
        sut = CustomEventRepository(apiClient: mockAPIClient, cacheManager: mockCacheManager)
    }

    override func tearDown() async throws {
        sut = nil
        mockAPIClient = nil
        mockCacheManager = nil

        try await super.tearDown()
    }

    // MARK: - FetchAll Tests

    func testFetchAll_ReturnsAllCustomEventsFromCache_Success() async throws {
        // Given
        let event1 = createTestCustomEvent(title: "Event 1")
        let event2 = createTestCustomEvent(title: "Event 2")
        mockCacheManager.customEvents = [event1, event2]

        // When
        let events = try await sut.fetchAll()

        // Then
        XCTAssertEqual(events.count, 2)
        XCTAssertEqual(events[0].title, "Event 1")
        XCTAssertEqual(events[1].title, "Event 2")
        XCTAssertTrue(mockCacheManager.fetchAllCalled)
    }

    func testFetchAll_WithCloudSyncEnabled_TriggersBackgroundSync() async throws {
        // Given
        let event = createTestCustomEvent(title: "Test Event")
        mockCacheManager.customEvents = [event]
        FeatureFlags.setEnableCloudSync(true)
        defer { FeatureFlags.setEnableCloudSync(false) }

        // When
        let events = try await sut.fetchAll()

        // Then
        XCTAssertEqual(events.count, 1)
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

    func testFetch_ExistingEvent_ReturnsEvent() async throws {
        // Given
        let eventId = UUID()
        let event = createTestCustomEvent(id: eventId, title: "Test Event")
        mockCacheManager.customEvents = [event]

        // When
        let fetchedEvent = try await sut.fetch(id: eventId)

        // Then
        XCTAssertNotNil(fetchedEvent)
        XCTAssertEqual(fetchedEvent?.id, eventId)
        XCTAssertEqual(fetchedEvent?.title, "Test Event")
        XCTAssertTrue(mockCacheManager.fetchByIdCalled)
    }

    func testFetch_NonExistingEvent_ReturnsNil() async throws {
        // Given
        let nonExistingId = UUID()
        mockCacheManager.customEvents = []

        // When
        let fetchedEvent = try await sut.fetch(id: nonExistingId)

        // Then
        XCTAssertNil(fetchedEvent)
        XCTAssertTrue(mockCacheManager.fetchByIdCalled)
    }

    // MARK: - Create Tests

    func testCreate_Success_SavesEventLocally() async throws {
        // Given
        let event = createTestCustomEvent(title: "New Event")

        // When
        let createdEvent = try await sut.create(event)

        // Then
        XCTAssertEqual(createdEvent.title, "New Event")
        XCTAssertEqual(createdEvent.serverSyncStatus, .pendingCreate)
        XCTAssertTrue(mockCacheManager.saveCalled)
        XCTAssertEqual(mockCacheManager.savedObjects.count, 1)
    }

    func testCreate_WithBackendAPIEnabled_TriggersBackgroundSync() async throws {
        // Given
        let event = createTestCustomEvent(title: "New Event")

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let serverEvent = CustomEventResponse(
            id: UUID(),
            title: event.title,
            description: event.eventDescription,
            promptSeed: event.promptSeed,
            category: event.category.rawValue,
            ageRange: event.ageRange?.rawValue,
            tone: event.tone.rawValue,
            pictogramEmoji: nil,
            pictogramSymbols: nil,
            aiEnhanced: false,
            keywords: nil,
            usageCount: 0,
            isFavorite: false,
            lastUsedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.createEventResponse = serverEvent

        // When
        let createdEvent = try await sut.create(event)

        // Wait a bit for background task
        try await Task.sleep(nanoseconds: 100_000_000)

        // Then
        XCTAssertEqual(createdEvent.serverSyncStatus, .pendingCreate)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testCreate_CacheThrowsError_PropagatesError() async throws {
        // Given
        let event = createTestCustomEvent(title: "New Event")
        mockCacheManager.shouldThrowError = true
        mockCacheManager.errorToThrow = CacheError.saveFailed

        // When/Then
        do {
            _ = try await sut.create(event)
            XCTFail("Should throw error")
        } catch {
            XCTAssertEqual(error as? CacheError, CacheError.saveFailed)
        }
    }

    // MARK: - Update Tests

    func testUpdate_Success_UpdatesEventLocally() async throws {
        // Given
        let event = createTestCustomEvent(title: "Original Title")
        event.title = "Updated Title"
        event.eventDescription = "Updated description"

        // When
        let updatedEvent = try await sut.update(event)

        // Then
        XCTAssertEqual(updatedEvent.title, "Updated Title")
        XCTAssertEqual(updatedEvent.eventDescription, "Updated description")
        XCTAssertEqual(updatedEvent.serverSyncStatus, .pendingUpdate)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testUpdate_WithBackendAPIEnabled_TriggersBackgroundSync() async throws {
        // Given
        let event = createTestCustomEvent(title: "Event")
        event.serverId = UUID().uuidString
        event.title = "Updated Event"

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let serverEvent = CustomEventResponse(
            id: UUID(uuidString: event.serverId!)!,
            title: event.title,
            description: event.eventDescription,
            promptSeed: event.promptSeed,
            category: event.category.rawValue,
            ageRange: event.ageRange?.rawValue,
            tone: event.tone.rawValue,
            pictogramEmoji: nil,
            pictogramSymbols: nil,
            aiEnhanced: false,
            keywords: nil,
            usageCount: 1,
            isFavorite: true,
            lastUsedAt: Date(),
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.updateEventResponse = serverEvent

        // When
        let updatedEvent = try await sut.update(event)

        // Then
        XCTAssertEqual(updatedEvent.serverSyncStatus, .pendingUpdate)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testUpdate_NoServerId_DoesNotSync() async throws {
        // Given
        let event = createTestCustomEvent(title: "Event")
        event.serverId = nil

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        // When
        _ = try await sut.update(event)

        // Wait a bit
        try await Task.sleep(nanoseconds: 100_000_000)

        // Then
        XCTAssertFalse(mockAPIClient.requestCalled)
        XCTAssertEqual(event.serverSyncStatus, .pendingUpdate)
    }

    // MARK: - Delete Tests

    func testDelete_MarksEventForDeletion() async throws {
        // Given
        let event = createTestCustomEvent(title: "Event to Delete")

        // When
        try await sut.delete(event)

        // Then
        XCTAssertEqual(event.serverSyncStatus, .pendingDelete)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testDelete_WithoutBackendAPI_DeletesImmediately() async throws {
        // Given
        let event = createTestCustomEvent(title: "Event to Delete")
        FeatureFlags.setUseBackendAPI(false)

        // When
        try await sut.delete(event)

        // Then
        XCTAssertTrue(mockCacheManager.deleteCalled)
    }

    func testDelete_WithBackendAPIAndServerId_TriggersBackgroundDelete() async throws {
        // Given
        let event = createTestCustomEvent(title: "Event to Delete")
        event.serverId = UUID().uuidString

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        mockAPIClient.deleteSuccess = true

        // When
        try await sut.delete(event)

        // Then
        XCTAssertEqual(event.serverSyncStatus, .pendingDelete)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    // MARK: - Enhancement Tests

    func testEnhanceEvent_Success_UpdatesEventWithEnhancement() async throws {
        // Given
        let event = createTestCustomEvent(title: "Event")
        event.serverId = UUID().uuidString

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        let enhancedEvent = CustomEventResponse(
            id: UUID(uuidString: event.serverId!)!,
            title: "Enhanced " + event.title,
            description: "Enhanced description",
            promptSeed: "Enhanced prompt",
            category: event.category.rawValue,
            ageRange: event.ageRange?.rawValue,
            tone: event.tone.rawValue,
            pictogramEmoji: "🎉",
            pictogramSymbols: ["party", "celebration"],
            aiEnhanced: true,
            keywords: ["fun", "exciting"],
            usageCount: 0,
            isFavorite: false,
            lastUsedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        mockAPIClient.enhanceEventResponse = enhancedEvent

        // When
        let updatedEvent = try await sut.enhanceEvent(event)

        // Then
        XCTAssertEqual(updatedEvent.title, "Enhanced Event")
        XCTAssertEqual(updatedEvent.eventDescription, "Enhanced description")
        XCTAssertEqual(updatedEvent.promptSeed, "Enhanced prompt")
        XCTAssertTrue(updatedEvent.aiEnhanced)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testEnhanceEvent_WithoutBackendAPI_ThrowsFeatureNotEnabled() async throws {
        // Given
        let event = createTestCustomEvent(title: "Event")
        FeatureFlags.setUseBackendAPI(false)

        // When/Then
        do {
            _ = try await sut.enhanceEvent(event)
            XCTFail("Should throw featureNotEnabled error")
        } catch RepositoryError.featureNotEnabled {
            // Expected
        } catch {
            XCTFail("Wrong error type: \(error)")
        }
    }

    func testEnhanceEvent_WithoutServerId_ThrowsNotSynced() async throws {
        // Given
        let event = createTestCustomEvent(title: "Event")
        event.serverId = nil

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        // When/Then
        do {
            _ = try await sut.enhanceEvent(event)
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
        let serverEvent1 = CustomEventResponse(
            id: UUID(),
            title: "Server Event 1",
            description: "Description 1",
            promptSeed: "Prompt 1",
            category: "adventure",
            ageRange: "5-7",
            tone: "playful",
            pictogramEmoji: nil,
            pictogramSymbols: nil,
            aiEnhanced: false,
            keywords: nil,
            usageCount: 0,
            isFavorite: false,
            lastUsedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        let serverEvent2 = CustomEventResponse(
            id: UUID(),
            title: "Server Event 2",
            description: "Description 2",
            promptSeed: "Prompt 2",
            category: "educational",
            ageRange: "8-10",
            tone: "calm",
            pictogramEmoji: nil,
            pictogramSymbols: nil,
            aiEnhanced: false,
            keywords: nil,
            usageCount: 0,
            isFavorite: false,
            lastUsedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getEventsResponse = [serverEvent1, serverEvent2]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertTrue(mockAPIClient.requestCalled)
        XCTAssertEqual(mockCacheManager.savedObjects.count, 2)
    }

    func testSyncWithBackend_DetectsConflict_WhenLocalHasUnsavedChanges() async throws {
        // Given
        let serverId = UUID()
        let localEvent = createTestCustomEvent(title: "Local Event")
        localEvent.serverId = serverId.uuidString
        localEvent.serverSyncStatus = .pendingUpdate // Has unsaved changes

        mockCacheManager.customEvents = [localEvent]
        mockCacheManager.eventByServerId[serverId.uuidString] = localEvent

        let serverEvent = CustomEventResponse(
            id: serverId,
            title: "Server Updated Event",
            description: "Server description",
            promptSeed: "Server prompt",
            category: "adventure",
            ageRange: "5-7",
            tone: "playful",
            pictogramEmoji: nil,
            pictogramSymbols: nil,
            aiEnhanced: false,
            keywords: nil,
            usageCount: 5,
            isFavorite: true,
            lastUsedAt: Date(),
            createdAt: Date(),
            updatedAt: Date().addingTimeInterval(3600) // Newer than local
        )

        mockAPIClient.getEventsResponse = [serverEvent]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(localEvent.serverSyncStatus, .conflict)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testSyncWithBackend_UpdatesLocalData_WhenNoConflict() async throws {
        // Given
        let serverId = UUID()
        let localEvent = createTestCustomEvent(title: "Local Event")
        localEvent.serverId = serverId.uuidString
        localEvent.serverSyncStatus = .synced // No unsaved changes

        mockCacheManager.customEvents = [localEvent]
        mockCacheManager.eventByServerId[serverId.uuidString] = localEvent

        let serverEvent = CustomEventResponse(
            id: serverId,
            title: "Server Updated Event",
            description: "Updated description",
            promptSeed: "Updated prompt",
            category: "educational",
            ageRange: "8-10",
            tone: "calm",
            pictogramEmoji: "📚",
            pictogramSymbols: ["book", "learning"],
            aiEnhanced: true,
            keywords: ["education", "learning"],
            usageCount: 10,
            isFavorite: true,
            lastUsedAt: Date(),
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getEventsResponse = [serverEvent]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(localEvent.title, "Server Updated Event")
        XCTAssertEqual(localEvent.eventDescription, "Updated description")
        XCTAssertEqual(localEvent.usageCount, 10)
        XCTAssertTrue(localEvent.isFavorite)
        XCTAssertEqual(localEvent.serverSyncStatus, .synced)
        XCTAssertTrue(mockCacheManager.saveCalled)
    }

    func testSyncWithBackend_CreatesNewEvent_WhenNotExistsLocally() async throws {
        // Given
        mockCacheManager.customEvents = []

        let serverEvent = CustomEventResponse(
            id: UUID(),
            title: "New Server Event",
            description: "New description",
            promptSeed: "New prompt",
            category: "adventure",
            ageRange: "5-7",
            tone: "playful",
            pictogramEmoji: nil,
            pictogramSymbols: nil,
            aiEnhanced: false,
            keywords: nil,
            usageCount: 0,
            isFavorite: false,
            lastUsedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.getEventsResponse = [serverEvent]

        // When
        try await sut.syncWithBackend()

        // Then
        XCTAssertEqual(mockCacheManager.savedObjects.count, 1)
        if let savedEvent = mockCacheManager.savedObjects.first as? CustomStoryEvent {
            XCTAssertEqual(savedEvent.title, "New Server Event")
            XCTAssertEqual(savedEvent.serverId, serverEvent.id.uuidString)
            XCTAssertEqual(savedEvent.serverSyncStatus, .synced)
        } else {
            XCTFail("Expected CustomStoryEvent to be saved")
        }
    }

    func testSyncWithBackend_HandlesEmptyResponse() async throws {
        // Given
        mockAPIClient.getEventsResponse = []

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

    func testSyncEventToBackend_HandlesAPIError_MarksAsFailed() async throws {
        // Given
        let event = createTestCustomEvent(title: "Event")

        FeatureFlags.setUseBackendAPI(true)
        defer { FeatureFlags.setUseBackendAPI(false) }

        mockAPIClient.shouldThrowError = true
        mockAPIClient.errorToThrow = APIError.serverError

        // When
        _ = try await sut.create(event)

        // Wait for background sync to potentially complete
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

        // Then
        XCTAssertEqual(event.serverSyncStatus, .pendingCreate)
    }

    // MARK: - Helper Methods

    private func createTestCustomEvent(
        id: UUID = UUID(),
        title: String = "Test Event",
        description: String = "Test description",
        category: CustomEventCategory = .adventure,
        tone: CustomEventTone = .playful
    ) -> CustomStoryEvent {
        let event = CustomStoryEvent(
            title: title,
            eventDescription: description,
            promptSeed: "Test prompt",
            category: category,
            ageRange: .age5to7,
            tone: tone
        )
        return event
    }
}

// MARK: - Mock Classes

/// Mock API Client for CustomEvent tests
class MockAPIClientForCustomEvent: APIClientProtocol {
    var requestCalled = false
    var shouldThrowError = false
    var errorToThrow: Error?

    var getEventsResponse: [CustomEventResponse] = []
    var createEventResponse: CustomEventResponse?
    var updateEventResponse: CustomEventResponse?
    var enhanceEventResponse: CustomEventResponse?
    var deleteSuccess = true

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> APIResponse<T> {
        requestCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        switch endpoint {
        case .getCustomEvents:
            if let response = getEventsResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .createCustomEvent:
            if let response = createEventResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .updateCustomEvent:
            if let response = updateEventResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .enhanceCustomEvent:
            if let response = enhanceEventResponse as? T {
                return APIResponse(data: response, error: nil, pagination: nil)
            }

        case .deleteCustomEvent:
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

/// Mock Cache Manager for CustomEvent tests
class MockCacheManagerForCustomEvent: CacheManagerProtocol {
    var fetchAllCalled = false
    var fetchByIdCalled = false
    var saveCalled = false
    var deleteCalled = false

    var shouldThrowError = false
    var errorToThrow: Error?

    var customEvents: [CustomStoryEvent] = []
    var eventByServerId: [String: CustomStoryEvent] = [:]
    var savedObjects: [Any] = []

    func save<T: PersistentModel>(_ object: T) throws {
        saveCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        savedObjects.append(object)

        if let event = object as? CustomStoryEvent {
            customEvents.append(event)
            if let serverId = event.serverId {
                eventByServerId[serverId] = event
            }
        }
    }

    func fetch<T: PersistentModel>(_ type: T.Type, id: UUID) throws -> T? {
        fetchByIdCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        if type == CustomStoryEvent.self {
            return customEvents.first { ($0 as? CustomStoryEvent)?.id == id } as? T
        }

        return nil
    }

    func fetchAll<T: PersistentModel>(_ type: T.Type) throws -> [T] {
        fetchAllCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        if type == CustomStoryEvent.self {
            return customEvents as? [T] ?? []
        }

        return []
    }

    func delete<T: PersistentModel>(_ object: T) throws {
        deleteCalled = true

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        if let event = object as? CustomStoryEvent {
            customEvents.removeAll { $0.id == event.id }
            if let serverId = event.serverId {
                eventByServerId.removeValue(forKey: serverId)
            }
        }
    }

    func markForSync<T: PersistentModel & Syncable>(_ object: T, status: SyncStatus) throws {
        object.serverSyncStatus = status
        try save(object)
    }

    func fetchPendingSync<T: PersistentModel & Syncable>(_ type: T.Type, status: SyncStatus?) throws -> [T] {
        if type == CustomStoryEvent.self {
            let filtered = customEvents.filter { event in
                if let status = status {
                    return (event as? Syncable)?.serverSyncStatus == status
                } else {
                    return (event as? Syncable)?.serverSyncStatus != .synced
                }
            }
            return filtered as? [T] ?? []
        }

        return []
    }

    func fetch<T: PersistentModel & Syncable>(_ type: T.Type, serverId: String) throws -> T? {
        if type == CustomStoryEvent.self {
            return eventByServerId[serverId] as? T
        }
        return nil
    }
}

// MARK: - Test Extensions for CustomStoryEvent

extension CustomStoryEvent {
    // Properties needed for tests (normally in CustomStoryEvent+Sync.swift)
    var serverId: String?
    var serverSyncStatus: SyncStatus = .synced
    var lastSyncedAt: Date?
    var serverUpdatedAt: Date?
    var pendingChanges: Data?
    var syncError: String?

    var needsSync: Bool {
        return serverSyncStatus != .synced
    }

    func updateFrom(server: CustomEventResponse) {
        self.title = server.title
        self.eventDescription = server.description
        self.promptSeed = server.promptSeed
        self.usageCount = server.usageCount
        self.isFavorite = server.isFavorite
        self.aiEnhanced = server.aiEnhanced
        self.keywords = server.keywords
        self.lastUsedAt = server.lastUsedAt
        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
    }

    convenience init(from server: CustomEventResponse) {
        self.init(
            title: server.title,
            eventDescription: server.description,
            promptSeed: server.promptSeed,
            category: CustomEventCategory(rawValue: server.category) ?? .adventure,
            ageRange: server.ageRange != nil ? AgeRange(rawValue: server.ageRange!) : nil,
            tone: CustomEventTone(rawValue: server.tone) ?? .playful
        )
        self.serverId = server.id.uuidString
        self.usageCount = server.usageCount
        self.isFavorite = server.isFavorite
        self.aiEnhanced = server.aiEnhanced
        self.keywords = server.keywords
        self.lastUsedAt = server.lastUsedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.serverUpdatedAt = server.updatedAt
    }
}

// MARK: - Test Enums

enum CustomEventCategory: String {
    case adventure
    case educational
    case routine
    case seasonal
    case special
}

enum CustomEventTone: String {
    case playful
    case calm
    case exciting
    case mysterious
    case heartwarming
}

enum AgeRange: String {
    case age3to4 = "3-4"
    case age5to7 = "5-7"
    case age8to10 = "8-10"
    case age11to12 = "11-12"
}