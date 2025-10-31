//
//  IllustrationGenerator.swift
//  InfiniteStories
//
//  Simplified stub - illustration generation now handled by backend
//

import Foundation
import SwiftData

@MainActor
class IllustrationGenerator {
    private let aiService: AIServiceProtocol
    private weak var modelContext: ModelContext?

    enum GeneratorError: LocalizedError {
        case noHeroAvatar
        case textSegmentationFailed
        case imageGenerationFailed
        case fileSystemError

        var errorDescription: String? {
            switch self {
            case .noHeroAvatar: return "Hero avatar is required for visual consistency"
            case .textSegmentationFailed: return "Failed to segment story into scenes"
            case .imageGenerationFailed: return "Failed to generate illustration"
            case .fileSystemError: return "Failed to save illustration file"
            }
        }
    }

    init(aiService: AIServiceProtocol, modelContext: ModelContext) {
        self.aiService = aiService
        self.modelContext = modelContext
    }

    /// Generate illustrations for a story
    /// - Parameter story: The story to generate illustrations for
    func generateIllustrations(for story: Story) async throws {
        guard !story.illustrations.isEmpty else {
            return
        }

        guard let hero = story.hero else {
            throw GeneratorError.noHeroAvatar
        }

        let totalCount = story.illustrations.count
        var generatedCount = 0
        var lastGenerationId = hero.avatarGenerationId

        for (index, illustration) in story.illustrations.enumerated() {
            do {
                // Call backend to generate illustration
                let response = try await aiService.generateSceneIllustration(
                    prompt: illustration.imagePrompt,
                    hero: hero,
                    previousGenerationId: lastGenerationId
                )

                // Save image to disk
                let fileManager = FileManager.default
                let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
                let illustrationsPath = documentsPath.appendingPathComponent("StoryIllustrations")

                if !fileManager.fileExists(atPath: illustrationsPath.path) {
                    try fileManager.createDirectory(at: illustrationsPath, withIntermediateDirectories: true)
                }

                let filename = "illustration_\(story.id)_\(index)_\(Date().timeIntervalSince1970).png"
                let fileURL = illustrationsPath.appendingPathComponent(filename)

                try response.imageData.write(to: fileURL)

                // Update illustration model
                illustration.imagePath = fileURL.path
                illustration.isGenerated = true
                illustration.retryCount = 0
                illustration.lastError = nil
                illustration.generationId = response.generationId

                // Chain for next illustration
                if let generationId = response.generationId {
                    lastGenerationId = generationId
                }

                generatedCount += 1

                // Save context after each successful generation
                try modelContext?.save()

            } catch {
                illustration.retryCount += 1
                illustration.lastError = error.localizedDescription
                print("❌ Failed to generate illustration \(index + 1): \(error)")
            }
        }
    }

    /// Regenerate a single failed illustration
    func regenerateIllustration(_ illustration: StoryIllustration) async throws {
        guard let story = illustration.story else {
            throw GeneratorError.textSegmentationFailed
        }

        guard let hero = story.hero else {
            throw GeneratorError.noHeroAvatar
        }

        // Find previous illustration's generation ID if this isn't the first one
        let sortedIllustrations = story.illustrations.sorted { $0.displayOrder < $1.displayOrder }
        let currentIndex = sortedIllustrations.firstIndex(where: { $0.id == illustration.id }) ?? 0

        var previousGenerationId: String? = hero.avatarGenerationId
        if currentIndex > 0, let prevGenId = sortedIllustrations[currentIndex - 1].generationId {
            previousGenerationId = prevGenId
        }

        // Generate new illustration
        let response = try await aiService.generateSceneIllustration(
            prompt: illustration.imagePrompt,
            hero: hero,
            previousGenerationId: previousGenerationId
        )

        // Save to disk
        let fileManager = FileManager.default
        let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let illustrationsPath = documentsPath.appendingPathComponent("StoryIllustrations")

        if !fileManager.fileExists(atPath: illustrationsPath.path) {
            try fileManager.createDirectory(at: illustrationsPath, withIntermediateDirectories: true)
        }

        let filename = "illustration_\(story.id)_\(illustration.displayOrder)_\(Date().timeIntervalSince1970).png"
        let fileURL = illustrationsPath.appendingPathComponent(filename)

        try response.imageData.write(to: fileURL)

        // Update model
        illustration.imagePath = fileURL.path
        illustration.isGenerated = true
        illustration.retryCount = 0
        illustration.lastError = nil
        illustration.generationId = response.generationId

        try modelContext?.save()
    }

    /// Retry all failed illustrations for a story
    func retryFailedIllustrations(for story: Story) async {
        let failedIllustrations = story.illustrations.filter { !$0.isGenerated }

        for illustration in failedIllustrations {
            do {
                try await regenerateIllustration(illustration)
            } catch {
                print("Failed to retry illustration: \(error)")
            }
        }
    }
}
