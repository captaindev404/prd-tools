//
//  LocalDataExporterTests.swift
//  InfiniteStoriesTests
//
//  Unit tests for LocalDataExporter data export to JSON
//

import XCTest
import SwiftData
@testable import InfiniteStories

final class LocalDataExporterTests: XCTestCase {

    // MARK: - Properties

    var sut: LocalDataExporter!
    var mockModelContext: MockModelContext!
    var testFileURL: URL!

    // MARK: - Setup & Teardown

    override func setUp() async throws {
        try await super.setUp()

        mockModelContext = MockModelContext()
        sut = LocalDataExporter(modelContext: mockModelContext)

        // Setup test file URL
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        testFileURL = documentsPath.appendingPathComponent("test_export.json")
    }

    override func tearDown() async throws {
        // Clean up test file if it exists
        if FileManager.default.fileExists(atPath: testFileURL.path) {
            try FileManager.default.removeItem(at: testFileURL)
        }

        sut = nil
        mockModelContext = nil
        testFileURL = nil

        try await super.tearDown()
    }

    // MARK: - Export All Data Tests

    func testExportAllData_WithNoData_ReturnsEmptyExport() async throws {
        // Given - No data in context
        mockModelContext.heroes = []
        mockModelContext.stories = []
        mockModelContext.customEvents = []

        // When
        let exportedData = try await sut.exportAllData()

        // Then
        XCTAssertEqual(exportedData.version, "1.0")
        XCTAssertNotNil(exportedData.exportDate)
        XCTAssertEqual(exportedData.heroes.count, 0)
        XCTAssertEqual(exportedData.stories.count, 0)
        XCTAssertEqual(exportedData.customEvents.count, 0)
        XCTAssertEqual(exportedData.metadata.totalHeroes, 0)
        XCTAssertEqual(exportedData.metadata.totalStories, 0)
        XCTAssertEqual(exportedData.metadata.totalCustomEvents, 0)
    }

    func testExportAllData_WithHeroes_ExportsCorrectly() async throws {
        // Given
        let hero1 = MockHero(name: "Hero 1", serverId: nil, serverSyncStatus: .synced)
        hero1.age = 8
        hero1.specialAbility = "Flying"
        hero1.appearance = "Tall with brown hair"
        hero1.avatarPrompt = "A young hero"
        hero1.avatarImagePath = "Avatars/hero1.png"
        hero1.avatarGenerationId = "gen-123"

        let hero2 = MockHero(name: "Hero 2", serverId: nil, serverSyncStatus: .synced)
        hero2.age = 10
        hero2.specialAbility = "Super strength"

        mockModelContext.heroes = [hero1, hero2]

        // When
        let exportedData = try await sut.exportAllData()

        // Then
        XCTAssertEqual(exportedData.heroes.count, 2)
        XCTAssertEqual(exportedData.heroes[0].name, "Hero 1")
        XCTAssertEqual(exportedData.heroes[0].age, 8)
        XCTAssertEqual(exportedData.heroes[0].specialAbility, "Flying")
        XCTAssertEqual(exportedData.heroes[0].avatarPrompt, "A young hero")
        XCTAssertEqual(exportedData.heroes[0].avatarImagePath, "Avatars/hero1.png")
        XCTAssertEqual(exportedData.heroes[0].avatarGenerationId, "gen-123")
        XCTAssertEqual(exportedData.heroes[1].name, "Hero 2")
        XCTAssertEqual(exportedData.metadata.totalHeroes, 2)
    }

    func testExportAllData_WithStories_ExportsCorrectly() async throws {
        // Given
        let hero = MockHero(name: "Test Hero", serverId: nil, serverSyncStatus: .synced)
        let story1 = MockStory(title: "Story 1", serverId: nil, serverSyncStatus: .synced)
        story1.hero = hero
        story1.content = "Once upon a time..."
        story1.language = "en"
        story1.isFavorite = true
        story1.audioFilePath = "AudioStories/story1.mp3"
        story1.estimatedDuration = 180

        let story2 = MockStory(title: "Story 2", serverId: nil, serverSyncStatus: .synced)
        story2.hero = hero
        story2.content = "In a galaxy far away..."
        story2.language = "es"

        mockModelContext.stories = [story1, story2]
        mockModelContext.heroes = [hero]

        // When
        let exportedData = try await sut.exportAllData()

        // Then
        XCTAssertEqual(exportedData.stories.count, 2)
        XCTAssertEqual(exportedData.stories[0].title, "Story 1")
        XCTAssertEqual(exportedData.stories[0].content, "Once upon a time...")
        XCTAssertEqual(exportedData.stories[0].language, "en")
        XCTAssertTrue(exportedData.stories[0].isFavorite)
        XCTAssertEqual(exportedData.stories[0].audioFilePath, "AudioStories/story1.mp3")
        XCTAssertEqual(exportedData.stories[0].estimatedDuration, 180)
        XCTAssertEqual(exportedData.stories[1].title, "Story 2")
        XCTAssertEqual(exportedData.metadata.totalStories, 2)
    }

    func testExportAllData_WithOrphanedStories_ExcludesThem() async throws {
        // Given - Story without hero
        let orphanedStory = MockStory(title: "Orphaned Story", serverId: nil, serverSyncStatus: .synced)
        orphanedStory.hero = nil // No hero

        mockModelContext.stories = [orphanedStory]

        // When
        let exportedData = try await sut.exportAllData()

        // Then - Orphaned story should be excluded
        XCTAssertEqual(exportedData.stories.count, 0)
    }

    func testExportAllData_WithCustomEvents_ExportsCorrectly() async throws {
        // Given
        let event1 = MockCustomEvent(title: "Birthday Party")
        event1.eventDescription = "A fun birthday celebration"
        event1.promptSeed = "birthday cake and balloons"
        event1.category = .celebration
        event1.ageRange = .preschool
        event1.tone = .playful
        event1.keywords = ["birthday", "party", "cake"]
        event1.usageCount = 5
        event1.isFavorite = true

        let event2 = MockCustomEvent(title: "First Day of School")
        event2.eventDescription = "Starting a new school year"
        event2.promptSeed = "new classroom and friends"

        mockModelContext.customEvents = [event1, event2]

        // When
        let exportedData = try await sut.exportAllData()

        // Then
        XCTAssertEqual(exportedData.customEvents.count, 2)
        XCTAssertEqual(exportedData.customEvents[0].title, "Birthday Party")
        XCTAssertEqual(exportedData.customEvents[0].eventDescription, "A fun birthday celebration")
        XCTAssertEqual(exportedData.customEvents[0].category, "celebration")
        XCTAssertEqual(exportedData.customEvents[0].ageRange, "preschool")
        XCTAssertEqual(exportedData.customEvents[0].tone, "playful")
        XCTAssertEqual(exportedData.customEvents[0].keywords, ["birthday", "party", "cake"])
        XCTAssertEqual(exportedData.customEvents[0].usageCount, 5)
        XCTAssertTrue(exportedData.customEvents[0].isFavorite)
        XCTAssertEqual(exportedData.metadata.totalCustomEvents, 2)
    }

    func testExportAllData_WithVisualProfiles_ExportsCorrectly() async throws {
        // Given
        let hero = MockHero(name: "Hero with Profile", serverId: nil, serverSyncStatus: .synced)
        let visualProfile = MockHeroVisualProfile()
        visualProfile.hairColor = "brown"
        visualProfile.hairStyle = "short"
        visualProfile.eyeColor = "blue"
        visualProfile.skinTone = "fair"
        visualProfile.height = "tall"
        visualProfile.build = "athletic"
        visualProfile.clothingStyle = "casual"
        visualProfile.distinctiveFeatures = "scar on left cheek"
        visualProfile.artStyle = "cartoon"
        hero.visualProfile = visualProfile

        mockModelContext.heroes = [hero]

        // When
        let exportedData = try await sut.exportAllData()

        // Then
        XCTAssertNotNil(exportedData.heroes[0].visualProfile)
        XCTAssertEqual(exportedData.heroes[0].visualProfile?.hairColor, "brown")
        XCTAssertEqual(exportedData.heroes[0].visualProfile?.eyeColor, "blue")
        XCTAssertEqual(exportedData.heroes[0].visualProfile?.skinTone, "fair")
        XCTAssertEqual(exportedData.heroes[0].visualProfile?.artStyle, "cartoon")
    }

    func testExportAllData_WithIllustrations_ExportsCorrectly() async throws {
        // Given
        let hero = MockHero(name: "Test Hero", serverId: nil, serverSyncStatus: .synced)
        let story = MockStory(title: "Story with Illustrations", serverId: nil, serverSyncStatus: .synced)
        story.hero = hero

        let illustration1 = MockStoryIllustration()
        illustration1.sceneNumber = 1
        illustration1.displayOrder = 0
        illustration1.timestamp = 0.0
        illustration1.dallePrompt = "A hero standing tall"
        illustration1.imagePath = "StoryIllustrations/scene1.png"
        illustration1.generationId = "gen-456"
        illustration1.generationStatus = .completed

        let illustration2 = MockStoryIllustration()
        illustration2.sceneNumber = 2
        illustration2.displayOrder = 1
        illustration2.timestamp = 30.0
        illustration2.dallePrompt = "The hero saves the day"
        illustration2.generationStatus = .generating

        story.illustrations = [illustration1, illustration2]
        mockModelContext.stories = [story]
        mockModelContext.heroes = [hero]

        // When
        let exportedData = try await sut.exportAllData()

        // Then
        XCTAssertEqual(exportedData.stories[0].illustrations.count, 2)
        XCTAssertEqual(exportedData.stories[0].illustrations[0].sceneNumber, 1)
        XCTAssertEqual(exportedData.stories[0].illustrations[0].timestamp, 0.0)
        XCTAssertEqual(exportedData.stories[0].illustrations[0].dallePrompt, "A hero standing tall")
        XCTAssertEqual(exportedData.stories[0].illustrations[0].generationStatus, "completed")
        XCTAssertEqual(exportedData.stories[0].illustrations[1].sceneNumber, 2)
        XCTAssertEqual(exportedData.stories[0].illustrations[1].generationStatus, "generating")
    }

    // MARK: - Export to File Tests

    func testExportToFile_WritesJSONSuccessfully() async throws {
        // Given
        let hero = MockHero(name: "Test Hero", serverId: nil, serverSyncStatus: .synced)
        mockModelContext.heroes = [hero]

        // When
        let exportedData = try await sut.exportToFile(outputURL: testFileURL)

        // Then
        XCTAssertTrue(FileManager.default.fileExists(atPath: testFileURL.path))

        // Verify JSON content
        let data = try Data(contentsOf: testFileURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let loadedData = try decoder.decode(ExportedData.self, from: data)

        XCTAssertEqual(loadedData.heroes.count, 1)
        XCTAssertEqual(loadedData.heroes[0].name, "Test Hero")
    }

    // MARK: - Validation Tests

    func testValidateExport_WithCompleteData_ReturnsValid() {
        // Given
        let hero = ExportedHero(
            id: UUID(),
            name: "Test Hero",
            age: 8,
            traits: ["brave"],
            specialAbility: "Flying",
            appearance: "Tall",
            avatarPrompt: nil,
            avatarImagePath: nil,
            avatarGenerationId: nil,
            createdAt: Date(),
            visualProfile: nil
        )

        let story = ExportedStory(
            id: UUID(),
            heroId: hero.id,
            title: "Test Story",
            content: "Once upon a time...",
            builtInEvent: "bedtime",
            customEventId: nil,
            language: "en",
            createdAt: Date(),
            isFavorite: false,
            audioFilePath: nil,
            estimatedDuration: 180,
            illustrations: []
        )

        let exportedData = ExportedData(
            version: "1.0",
            exportDate: Date(),
            heroes: [hero],
            stories: [story],
            customEvents: [],
            metadata: ExportMetadata(
                totalHeroes: 1,
                totalStories: 1,
                totalCustomEvents: 0,
                totalAudioFiles: 0,
                totalAvatarFiles: 0,
                totalIllustrationFiles: 0,
                estimatedDataSize: 0
            )
        )

        // When
        let validation = sut.validateExport(exportedData)

        // Then
        XCTAssertTrue(validation.isValid)
        XCTAssertFalse(validation.hasErrors)
    }

    func testValidateExport_WithOrphanedStories_ReturnsWarning() {
        // Given - Story with non-existent hero
        let orphanedStory = ExportedStory(
            id: UUID(),
            heroId: UUID(), // Hero that doesn't exist
            title: "Orphaned Story",
            content: "Content",
            builtInEvent: nil,
            customEventId: nil,
            language: "en",
            createdAt: Date(),
            isFavorite: false,
            audioFilePath: nil,
            estimatedDuration: 0,
            illustrations: []
        )

        let exportedData = ExportedData(
            version: "1.0",
            exportDate: Date(),
            heroes: [],
            stories: [orphanedStory],
            customEvents: [],
            metadata: ExportMetadata(
                totalHeroes: 0,
                totalStories: 1,
                totalCustomEvents: 0,
                totalAudioFiles: 0,
                totalAvatarFiles: 0,
                totalIllustrationFiles: 0,
                estimatedDataSize: 0
            )
        )

        // When
        let validation = sut.validateExport(exportedData)

        // Then
        XCTAssertTrue(validation.isValid) // Still valid but with warnings
        XCTAssertTrue(validation.hasWarnings)
        XCTAssertTrue(validation.warnings.contains { $0.contains("orphaned stories") })
    }

    func testValidateExport_WithNoData_ReturnsWarning() {
        // Given - Empty export
        let exportedData = ExportedData(
            version: "1.0",
            exportDate: Date(),
            heroes: [],
            stories: [],
            customEvents: [],
            metadata: ExportMetadata(
                totalHeroes: 0,
                totalStories: 0,
                totalCustomEvents: 0,
                totalAudioFiles: 0,
                totalAvatarFiles: 0,
                totalIllustrationFiles: 0,
                estimatedDataSize: 0
            )
        )

        // When
        let validation = sut.validateExport(exportedData)

        // Then
        XCTAssertTrue(validation.isValid)
        XCTAssertTrue(validation.hasWarnings)
        XCTAssertTrue(validation.warnings.contains("No data to export"))
    }

    // MARK: - Progress Tracking Tests

    func testExportWithProgress_ReportsProgressCorrectly() async throws {
        // Given
        let hero = MockHero(name: "Test Hero", serverId: nil, serverSyncStatus: .synced)
        mockModelContext.heroes = [hero]

        var progressUpdates: [ExportProgress] = []

        // When
        let exportedData = try await sut.exportWithProgress { progress in
            progressUpdates.append(progress)
        }

        // Then
        XCTAssertEqual(exportedData.heroes.count, 1)
        XCTAssertGreaterThan(progressUpdates.count, 0)

        // Verify progress stages
        let stages = progressUpdates.map { $0.stage }
        XCTAssertTrue(stages.contains(.preparing))
        XCTAssertTrue(stages.contains(.exportingHeroes))
        XCTAssertTrue(stages.contains(.complete))

        // Verify progress increases
        if progressUpdates.count > 1 {
            for i in 1..<progressUpdates.count {
                XCTAssertGreaterThanOrEqual(progressUpdates[i].progress, progressUpdates[i-1].progress)
            }
        }

        // Verify final progress
        XCTAssertEqual(progressUpdates.last?.progress, 1.0)
        XCTAssertEqual(progressUpdates.last?.stage, .complete)
    }

    // MARK: - Performance Tests

    func testExportLargeDataset_Performance() throws {
        // Given - Large dataset
        var heroes: [MockHero] = []
        var stories: [MockStory] = []

        for i in 0..<100 {
            let hero = MockHero(name: "Hero \(i)", serverId: nil, serverSyncStatus: .synced)
            heroes.append(hero)

            for j in 0..<5 {
                let story = MockStory(title: "Story \(i)-\(j)", serverId: nil, serverSyncStatus: .synced)
                story.hero = hero
                stories.append(story)
            }
        }

        mockModelContext.heroes = heroes
        mockModelContext.stories = stories

        // Measure
        measure {
            let expectation = self.expectation(description: "Export completes")

            Task {
                _ = try await sut.exportAllData()
                expectation.fulfill()
            }

            wait(for: [expectation], timeout: 10.0)
        }
    }
}

// MARK: - Mock Helpers

class MockModelContext: ModelContext {
    var heroes: [Hero] = []
    var stories: [Story] = []
    var customEvents: [CustomStoryEvent] = []

    func fetch<T>(_ descriptor: FetchDescriptor<T>) throws -> [T] where T: PersistentModel {
        if T.self == Hero.self {
            return heroes as! [T]
        } else if T.self == Story.self {
            return stories as! [T]
        } else if T.self == CustomStoryEvent.self {
            return customEvents as! [T]
        }
        return []
    }

    func save() throws {
        // Mock save
    }
}

class MockCustomEvent: CustomStoryEvent {
    override init() {
        super.init()
    }

    convenience init(title: String) {
        self.init()
        self.title = title
    }
}

class MockHeroVisualProfile: HeroVisualProfile {
    override init() {
        super.init()
    }
}

class MockStoryIllustration: StoryIllustration {
    override init() {
        super.init()
    }
}