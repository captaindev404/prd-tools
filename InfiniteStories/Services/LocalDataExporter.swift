//
//  LocalDataExporter.swift
//  InfiniteStories
//
//  Export local SwiftData to JSON for backend migration
//

import Foundation
import SwiftData

// MARK: - Export Data Structures

struct ExportedData: Codable {
    let version: String
    let exportDate: Date
    let heroes: [ExportedHero]
    let stories: [ExportedStory]
    let customEvents: [ExportedCustomEvent]
    let metadata: ExportMetadata
}

struct ExportMetadata: Codable {
    let totalHeroes: Int
    let totalStories: Int
    let totalCustomEvents: Int
    let totalAudioFiles: Int
    let totalAvatarFiles: Int
    let totalIllustrationFiles: Int
    let estimatedDataSize: Int64 // bytes
}

struct ExportedHero: Codable {
    let id: UUID
    let name: String
    let age: Int
    let traits: [String]
    let specialAbility: String
    let appearance: String
    let avatarPrompt: String?
    let avatarImagePath: String?
    let avatarGenerationId: String?
    let createdAt: Date
    let visualProfile: ExportedVisualProfile?
}

struct ExportedVisualProfile: Codable {
    let hairColor: String?
    let hairStyle: String?
    let eyeColor: String?
    let skinTone: String?
    let height: String?
    let build: String?
    let clothingStyle: String?
    let distinctiveFeatures: String?
    let artStyle: String?
}

struct ExportedStory: Codable {
    let id: UUID
    let heroId: UUID
    let title: String
    let content: String
    let builtInEvent: String?
    let customEventId: UUID?
    let language: String
    let createdAt: Date
    let isFavorite: Bool
    let audioFilePath: String?
    let estimatedDuration: TimeInterval
    let illustrations: [ExportedIllustration]
}

struct ExportedIllustration: Codable {
    let id: UUID
    let sceneNumber: Int
    let displayOrder: Int
    let timestamp: TimeInterval
    let dallePrompt: String
    let imagePath: String?
    let generationId: String?
    let generationStatus: String
}

struct ExportedCustomEvent: Codable {
    let id: UUID
    let title: String
    let eventDescription: String
    let promptSeed: String
    let category: String?
    let ageRange: String?
    let tone: String?
    let keywords: [String]
    let usageCount: Int
    let isFavorite: Bool
    let pictogramPath: String?
}

// MARK: - Local Data Exporter

class LocalDataExporter {
    private let modelContext: ModelContext
    private let fileManager = FileManager.default

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    // MARK: - Main Export

    /// Export all local data to JSON
    /// - Returns: ExportedData containing all local entities
    /// - Throws: Error if export fails
    func exportAllData() async throws -> ExportedData {
        Logger.sync.info("📦 Starting local data export...")

        let startTime = Date()

        // Export all entities
        let heroes = try await exportHeroes()
        let stories = try await exportStories()
        let customEvents = try await exportCustomEvents()

        // Calculate metadata
        let metadata = try await calculateMetadata(
            heroCount: heroes.count,
            storyCount: stories.count,
            customEventCount: customEvents.count
        )

        let exportedData = ExportedData(
            version: "1.0",
            exportDate: Date(),
            heroes: heroes,
            stories: stories,
            customEvents: customEvents,
            metadata: metadata
        )

        let duration = Date().timeIntervalSince(startTime)
        Logger.sync.info("✅ Export completed in \(String(format: "%.1f", duration))s")
        Logger.sync.info("Exported: \(heroes.count) heroes, \(stories.count) stories, \(customEvents.count) custom events")

        return exportedData
    }

    /// Export data to JSON file
    /// - Parameter outputURL: File URL to write JSON
    /// - Returns: ExportedData that was written
    /// - Throws: Error if export or write fails
    func exportToFile(outputURL: URL) async throws -> ExportedData {
        let data = try await exportAllData()

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601

        let jsonData = try encoder.encode(data)
        try jsonData.write(to: outputURL)

        Logger.sync.info("✅ Exported data to: \(outputURL.path)")

        return data
    }

    // MARK: - Entity Export

    private func exportHeroes() async throws -> [ExportedHero] {
        let descriptor = FetchDescriptor<Hero>()
        let heroes = try modelContext.fetch(descriptor)

        Logger.sync.info("Exporting \(heroes.count) heroes...")

        return heroes.map { hero in
            ExportedHero(
                id: hero.id,
                name: hero.name,
                age: hero.age,
                traits: hero.traits.map { $0.rawValue },
                specialAbility: hero.specialAbility,
                appearance: hero.appearance,
                avatarPrompt: hero.avatarPrompt,
                avatarImagePath: hero.avatarImagePath,
                avatarGenerationId: hero.avatarGenerationId,
                createdAt: hero.createdAt,
                visualProfile: hero.visualProfile.map { profile in
                    ExportedVisualProfile(
                        hairColor: profile.hairColor,
                        hairStyle: profile.hairStyle,
                        eyeColor: profile.eyeColor,
                        skinTone: profile.skinTone,
                        height: profile.height,
                        build: profile.build,
                        clothingStyle: profile.clothingStyle,
                        distinctiveFeatures: profile.distinctiveFeatures,
                        artStyle: profile.artStyle
                    )
                }
            )
        }
    }

    private func exportStories() async throws -> [ExportedStory] {
        let descriptor = FetchDescriptor<Story>()
        let stories = try modelContext.fetch(descriptor)

        Logger.sync.info("Exporting \(stories.count) stories...")

        return stories.compactMap { story in
            guard let hero = story.hero else {
                Logger.sync.warning("⚠️ Story has no hero, skipping: \(story.title)")
                return nil
            }

            return ExportedStory(
                id: story.id,
                heroId: hero.id,
                title: story.title,
                content: story.content,
                builtInEvent: story.builtInEvent?.rawValue,
                customEventId: story.customEvent?.id,
                language: story.language,
                createdAt: story.createdAt,
                isFavorite: story.isFavorite,
                audioFilePath: story.audioFilePath,
                estimatedDuration: story.estimatedDuration,
                illustrations: story.illustrations.map { illustration in
                    ExportedIllustration(
                        id: illustration.id,
                        sceneNumber: illustration.sceneNumber,
                        displayOrder: illustration.displayOrder,
                        timestamp: illustration.timestamp,
                        dallePrompt: illustration.dallePrompt,
                        imagePath: illustration.imagePath,
                        generationId: illustration.generationId,
                        generationStatus: illustration.generationStatus.rawValue
                    )
                }
            )
        }
    }

    private func exportCustomEvents() async throws -> [ExportedCustomEvent] {
        let descriptor = FetchDescriptor<CustomStoryEvent>()
        let events = try modelContext.fetch(descriptor)

        Logger.sync.info("Exporting \(events.count) custom events...")

        return events.map { event in
            ExportedCustomEvent(
                id: event.id,
                title: event.title,
                eventDescription: event.eventDescription,
                promptSeed: event.promptSeed,
                category: event.category?.rawValue,
                ageRange: event.ageRange?.rawValue,
                tone: event.tone?.rawValue,
                keywords: event.keywords,
                usageCount: event.usageCount,
                isFavorite: event.isFavorite,
                pictogramPath: event.pictogramPath
            )
        }
    }

    // MARK: - Metadata Calculation

    private func calculateMetadata(
        heroCount: Int,
        storyCount: Int,
        customEventCount: Int
    ) async throws -> ExportMetadata {
        Logger.sync.info("Calculating export metadata...")

        var totalSize: Int64 = 0

        // Count media files
        var audioFileCount = 0
        var avatarFileCount = 0
        var illustrationFileCount = 0

        guard let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw ExportError.fileSystemError("Documents directory not found")
        }

        // Count audio files
        let audioPath = documentsPath.appendingPathComponent("AudioStories")
        if fileManager.fileExists(atPath: audioPath.path) {
            let audioFiles = try fileManager.contentsOfDirectory(at: audioPath, includingPropertiesForKeys: [.fileSizeKey])
            audioFileCount = audioFiles.count

            for file in audioFiles {
                if let resources = try? file.resourceValues(forKeys: [.fileSizeKey]),
                   let fileSize = resources.fileSize {
                    totalSize += Int64(fileSize)
                }
            }
        }

        // Count avatar files
        let avatarPath = documentsPath.appendingPathComponent("Avatars")
        if fileManager.fileExists(atPath: avatarPath.path) {
            let avatarFiles = try fileManager.contentsOfDirectory(at: avatarPath, includingPropertiesForKeys: [.fileSizeKey])
            avatarFileCount = avatarFiles.count

            for file in avatarFiles {
                if let resources = try? file.resourceValues(forKeys: [.fileSizeKey]),
                   let fileSize = resources.fileSize {
                    totalSize += Int64(fileSize)
                }
            }
        }

        // Count illustration files
        let illustrationPath = documentsPath.appendingPathComponent("StoryIllustrations")
        if fileManager.fileExists(atPath: illustrationPath.path) {
            let illustrationFiles = try fileManager.contentsOfDirectory(at: illustrationPath, includingPropertiesForKeys: [.fileSizeKey])
            illustrationFileCount = illustrationFiles.count

            for file in illustrationFiles {
                if let resources = try? file.resourceValues(forKeys: [.fileSizeKey]),
                   let fileSize = resources.fileSize {
                    totalSize += Int64(fileSize)
                }
            }
        }

        return ExportMetadata(
            totalHeroes: heroCount,
            totalStories: storyCount,
            totalCustomEvents: customEventCount,
            totalAudioFiles: audioFileCount,
            totalAvatarFiles: avatarFileCount,
            totalIllustrationFiles: illustrationFileCount,
            estimatedDataSize: totalSize
        )
    }

    // MARK: - Validation

    /// Validate exported data for completeness
    /// - Parameter data: ExportedData to validate
    /// - Returns: Validation result with warnings/errors
    func validateExport(_ data: ExportedData) -> ExportValidation {
        var warnings: [String] = []
        var errors: [String] = []

        // Check for orphaned stories
        let heroIds = Set(data.heroes.map { $0.id })
        let orphanedStories = data.stories.filter { !heroIds.contains($0.heroId) }

        if !orphanedStories.isEmpty {
            warnings.append("\(orphanedStories.count) stories reference missing heroes")
        }

        // Check for missing media files
        let storiesWithMissingAudio = data.stories.filter { story in
            guard let audioPath = story.audioFilePath else { return false }
            let fullPath = getDocumentsURL().appendingPathComponent(audioPath)
            return !fileManager.fileExists(atPath: fullPath.path)
        }

        if !storiesWithMissingAudio.isEmpty {
            warnings.append("\(storiesWithMissingAudio.count) stories have missing audio files")
        }

        // Check for missing avatars
        let heroesWithMissingAvatars = data.heroes.filter { hero in
            guard let avatarPath = hero.avatarImagePath else { return false }
            let fullPath = getDocumentsURL().appendingPathComponent(avatarPath)
            return !fileManager.fileExists(atPath: fullPath.path)
        }

        if !heroesWithMissingAvatars.isEmpty {
            warnings.append("\(heroesWithMissingAvatars.count) heroes have missing avatar files")
        }

        // Check data integrity
        if data.heroes.isEmpty && data.stories.isEmpty {
            warnings.append("No data to export")
        }

        return ExportValidation(
            isValid: errors.isEmpty,
            warnings: warnings,
            errors: errors
        )
    }

    // MARK: - Helpers

    private func getDocumentsURL() -> URL {
        return fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
}

// MARK: - Export Validation

struct ExportValidation {
    let isValid: Bool
    let warnings: [String]
    let errors: [String]

    var hasWarnings: Bool {
        return !warnings.isEmpty
    }

    var hasErrors: Bool {
        return !errors.isEmpty
    }

    var description: String {
        var result = "Export Validation: \(isValid ? "✅ Valid" : "❌ Invalid")\n"

        if !errors.isEmpty {
            result += "\nErrors:\n"
            errors.forEach { result += "  - \($0)\n" }
        }

        if !warnings.isEmpty {
            result += "\nWarnings:\n"
            warnings.forEach { result += "  - \($0)\n" }
        }

        return result
    }
}

// MARK: - Export Errors

enum ExportError: Error, LocalizedError {
    case fileSystemError(String)
    case encodingError(String)
    case noDataToExport
    case validationFailed([String])

    var errorDescription: String? {
        switch self {
        case .fileSystemError(let message):
            return "File system error: \(message)"
        case .encodingError(let message):
            return "Encoding error: \(message)"
        case .noDataToExport:
            return "No data available to export"
        case .validationFailed(let errors):
            return "Export validation failed: \(errors.joined(separator: ", "))"
        }
    }
}

// MARK: - Export Progress

/// Progress tracking for export operation
struct ExportProgress {
    let stage: ExportStage
    let progress: Double // 0.0 to 1.0
    let message: String

    enum ExportStage {
        case preparing
        case exportingHeroes
        case exportingStories
        case exportingCustomEvents
        case calculatingMetadata
        case validating
        case writing
        case complete
    }
}

// MARK: - Export with Progress

extension LocalDataExporter {
    /// Export data with progress reporting
    /// - Parameter progressHandler: Callback for progress updates
    /// - Returns: ExportedData
    func exportWithProgress(
        progressHandler: @escaping (ExportProgress) -> Void
    ) async throws -> ExportedData {
        // Stage 1: Preparing
        progressHandler(ExportProgress(stage: .preparing, progress: 0.0, message: "Preparing export..."))
        await Task.yield()

        // Stage 2: Export heroes
        progressHandler(ExportProgress(stage: .exportingHeroes, progress: 0.15, message: "Exporting heroes..."))
        let heroes = try await exportHeroes()
        await Task.yield()

        // Stage 3: Export stories
        progressHandler(ExportProgress(stage: .exportingStories, progress: 0.40, message: "Exporting stories..."))
        let stories = try await exportStories()
        await Task.yield()

        // Stage 4: Export custom events
        progressHandler(ExportProgress(stage: .exportingCustomEvents, progress: 0.65, message: "Exporting custom events..."))
        let customEvents = try await exportCustomEvents()
        await Task.yield()

        // Stage 5: Calculate metadata
        progressHandler(ExportProgress(stage: .calculatingMetadata, progress: 0.80, message: "Calculating metadata..."))
        let metadata = try await calculateMetadata(
            heroCount: heroes.count,
            storyCount: stories.count,
            customEventCount: customEvents.count
        )
        await Task.yield()

        // Stage 6: Validating
        progressHandler(ExportProgress(stage: .validating, progress: 0.90, message: "Validating export..."))
        let exportedData = ExportedData(
            version: "1.0",
            exportDate: Date(),
            heroes: heroes,
            stories: stories,
            customEvents: customEvents,
            metadata: metadata
        )

        let validation = validateExport(exportedData)
        if !validation.isValid {
            throw ExportError.validationFailed(validation.errors)
        }

        // Stage 7: Complete
        progressHandler(ExportProgress(stage: .complete, progress: 1.0, message: "Export complete!"))

        return exportedData
    }
}

// MARK: - File Size Helpers

extension Int64 {
    var humanReadableSize: String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: self)
    }
}
