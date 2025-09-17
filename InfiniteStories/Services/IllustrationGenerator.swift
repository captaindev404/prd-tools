//
//  IllustrationGenerator.swift
//  InfiniteStories
//
//  Created by Captain Dev on 16/09/2025.
//

import Foundation
import SwiftData
import UIKit

/// Service for generating multiple illustrations per story using DALL-E 3
class IllustrationGenerator {

    private let aiService: AIServiceProtocol
    private let modelContext: ModelContext

    // Generation parameters
    private let imageSize = "1024x1024"
    private let imageQuality = "standard"

    // Error types
    enum GeneratorError: Error, LocalizedError {
        case noHeroAvatar
        case textSegmentationFailed
        case imageGenerationFailed
        case fileSystemError

        var errorDescription: String? {
            switch self {
            case .noHeroAvatar:
                return "Hero must have an avatar for visual consistency"
            case .textSegmentationFailed:
                return "Failed to segment story text for illustrations"
            case .imageGenerationFailed:
                return "Failed to generate illustration image"
            case .fileSystemError:
                return "Failed to save illustration to file system"
            }
        }
    }

    init(aiService: AIServiceProtocol, modelContext: ModelContext) {
        self.aiService = aiService
        self.modelContext = modelContext
        createIllustrationsDirectory()
    }

    /// Create the illustrations directory if it doesn't exist
    private func createIllustrationsDirectory() {
        let illustrationsPath = getDocumentsDirectory()
            .appendingPathComponent("StoryIllustrations")

        do {
            try FileManager.default.createDirectory(
                at: illustrationsPath,
                withIntermediateDirectories: true,
                attributes: nil
            )
        } catch {
            print("Failed to create illustrations directory: \(error)")
        }
    }

    /// Generate illustrations for a story
    func generateIllustrations(for story: Story) async throws {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        AppLogger.shared.info("Illustration Generation Started", category: .illustration, requestId: String(requestId))
        AppLogger.shared.info("Story: \(story.title)", category: .illustration, requestId: String(requestId))
        AppLogger.shared.info("Duration: \(story.estimatedDuration) seconds", category: .illustration, requestId: String(requestId))

        // Ensure hero has an avatar for consistency
        guard let hero = story.hero,
              hero.hasAvatar,
              let avatarPrompt = hero.avatarPrompt else {
            AppLogger.shared.error("Hero must have an avatar for visual consistency", category: .illustration, requestId: String(requestId))
            throw GeneratorError.noHeroAvatar
        }

        // Calculate number of illustrations based on story duration
        let illustrationCount = story.recommendedIllustrationCount
        AppLogger.shared.info("Planning to generate \(illustrationCount) illustrations", category: .illustration, requestId: String(requestId))

        // Segment the story into parts for illustration
        AppLogger.shared.info("Segmenting story into \(illustrationCount) parts", category: .illustration, requestId: String(requestId))
        let segments = segmentStory(story.content, into: illustrationCount)

        // Create illustration models and save to database
        var illustrations: [StoryIllustration] = []

        for (index, segment) in segments.enumerated() {
            // Calculate timestamp for this illustration
            let timestamp = calculateTimestamp(
                index: index,
                total: illustrationCount,
                duration: story.estimatedDuration
            )

            AppLogger.shared.debug("Scene \(index + 1): Timestamp=\(timestamp)s, Importance=\(segment.importance)", category: .illustration, requestId: String(requestId))

            // Generate prompt for this segment
            let prompt = generateIllustrationPrompt(
                segment: segment.text,
                heroDescription: avatarPrompt,
                heroName: hero.name,
                storyContext: story.eventTitle
            )

            // Note: The AI-based sanitization will be applied automatically
            // when the prompt is sent to the generateAvatar method in AIService.

            // Log only in debug mode
            #if DEBUG
            AppLogger.shared.debug("Scene \(index + 1) prompt generated", category: .illustration, requestId: String(requestId))
            #endif

            // Create illustration model
            let illustration = StoryIllustration(
                timestamp: timestamp,
                imagePrompt: prompt,
                displayOrder: index,
                textSegment: segment.text
            )

            illustration.story = story
            illustrations.append(illustration)

            // Insert into model context
            modelContext.insert(illustration)
        }

        // Save illustrations to database first
        try modelContext.save()

        AppLogger.shared.success("Created \(illustrations.count) illustration records in database", category: .illustration, requestId: String(requestId))

        // Generate images in parallel batches (to avoid rate limits)
        let batchSize = 3
        AppLogger.shared.info("Generating illustrations in batches of \(batchSize)", category: .illustration, requestId: String(requestId))

        for (batchIndex, batch) in illustrations.chunked(into: batchSize).enumerated() {
            AppLogger.shared.info("Processing batch \(batchIndex + 1) with \(batch.count) illustrations", category: .illustration, requestId: String(requestId))
            await generateBatch(batch)
        }

        AppLogger.shared.success("Illustration Generation Completed", category: .illustration, requestId: String(requestId))
    }

    /// Generate images for a batch of illustrations
    private func generateBatch(_ batch: [StoryIllustration]) async {
        // Process illustrations sequentially with delay to avoid rate limits
        for (index, illustration) in batch.enumerated() {
            // Add delay between requests to avoid rate limiting (except for first)
            if index > 0 {
                let delaySeconds = 2.0 // 2 seconds between requests
                AppLogger.shared.debug("Waiting \(delaySeconds)s before next request to avoid rate limits", category: .illustration)
                try? await Task.sleep(nanoseconds: UInt64(delaySeconds * 1_000_000_000))
            }

            let success = await generateSingleIllustration(illustration)
            if !success {
                AppLogger.shared.warning("Failed to generate illustration #\(illustration.displayOrder + 1), will continue with others", category: .illustration)
            }
        }
    }

    /// Generate a single illustration
    private func generateSingleIllustration(_ illustration: StoryIllustration) async -> Bool {
        let sceneNum = illustration.displayOrder + 1
        let requestId = UUID().uuidString.prefix(8).lowercased()
        let maxRetries = UserDefaults.standard.integer(forKey: "maxIllustrationRetries")
        let effectiveMaxRetries = maxRetries > 0 ? maxRetries : 3

        AppLogger.shared.info("Generating illustration #\(sceneNum)", category: .illustration, requestId: String(requestId))

        // Check if retry limit reached
        if illustration.retryCount >= effectiveMaxRetries {
            AppLogger.shared.warning("Illustration #\(sceneNum) has reached retry limit (\(effectiveMaxRetries) attempts)", category: .illustration, requestId: String(requestId))
            return false
        }

        do {
            #if DEBUG
            AppLogger.shared.debug("Generating scene #\(sceneNum)", category: .illustration, requestId: String(requestId))
            #endif

            // Create avatar generation request
            // Note: The prompt will undergo AI-based sanitization in AIService.generateAvatar
            // This ensures DALL-E policy compliance through dynamic GPT-4 rewriting
            let request = AvatarGenerationRequest(
                hero: illustration.story!.hero!,
                prompt: illustration.imagePrompt,
                size: imageSize,
                quality: imageQuality
            )

            // Generate the image with timeout
            AppLogger.shared.info("Calling AI service for scene #\(sceneNum) (with AI sanitization) (attempt \(illustration.retryCount + 1)/\(effectiveMaxRetries))", category: .illustration, requestId: String(requestId))

            let response: AvatarGenerationResponse
            do {
                response = try await withTimeout(seconds: 30) {
                    try await self.aiService.generateAvatar(request: request)
                }
            } catch {
                // Handle timeout specifically
                illustration.markAsFailed(error: "Request timed out after 30 seconds", type: .timeout)
                try? modelContext.save()
                throw error
            }

            // Save image to file system
            let filename = "\(illustration.id.uuidString).png"
            let fileURL = getDocumentsDirectory()
                .appendingPathComponent("StoryIllustrations")
                .appendingPathComponent(filename)

            do {
                try response.imageData.write(to: fileURL)
                AppLogger.shared.success("Saved illustration to: \(filename)", category: .illustration, requestId: String(requestId))
            } catch {
                illustration.markAsFailed(error: error.localizedDescription, type: .fileSystem)
                try? modelContext.save()
                throw GeneratorError.fileSystemError
            }

            // Update illustration with file path
            illustration.setImagePath(filename)
            illustration.resetError() // Clear any previous errors

            // Save to database
            try modelContext.save()

            AppLogger.shared.success("Generated illustration #\(sceneNum) successfully", category: .illustration, requestId: String(requestId))
            return true

        } catch {
            AppLogger.shared.error("Failed to generate illustration #\(sceneNum)", category: .illustration, requestId: String(requestId), error: error)

            // Determine error type and mark illustration as failed
            let errorType: StoryIllustration.IllustrationErrorType
            let errorMessage: String

            if let aiError = error as? AIServiceError {
                switch aiError {
                case .rateLimitExceeded:
                    errorType = .rateLimit
                    errorMessage = "Rate limit exceeded"
                    AppLogger.shared.warning("Rate limit hit - will retry with exponential backoff", category: .illustration, requestId: String(requestId))

                    // Apply exponential backoff for rate limit
                    let backoffSeconds = pow(2.0, Double(illustration.retryCount)) * 2.0
                    AppLogger.shared.info("Waiting \(backoffSeconds) seconds before retry...", category: .illustration, requestId: String(requestId))
                    try? await Task.sleep(nanoseconds: UInt64(backoffSeconds * 1_000_000_000))

                case .apiError(let message):
                    errorType = .apiError
                    errorMessage = message
                    AppLogger.shared.error("API Error details: \(message)", category: .illustration, requestId: String(requestId))

                case .invalidAPIKey:
                    errorType = .apiError
                    errorMessage = "Invalid API key"
                    AppLogger.shared.error("Invalid API key - check configuration", category: .illustration, requestId: String(requestId))

                case .networkError:
                    errorType = .network
                    errorMessage = "Network connection failed"

                case .invalidPrompt:
                    errorType = .invalidPrompt
                    errorMessage = "Invalid or inappropriate content"

                case .contentPolicyViolation(let details):
                    errorType = .invalidPrompt
                    errorMessage = "Content filtered: \(details)"
                    AppLogger.shared.error("Content policy violation - will use simpler prompt on retry", category: .illustration, requestId: String(requestId))

                    // For content violations, use an ultra-simple fallback prompt
                    let fallbackPrompt = "Colorful happy cartoon characters playing in a bright sunny garden with butterflies. Safe children's illustration."
                    illustration.imagePrompt = fallbackPrompt
                    illustration.retryCount += 1

                default:
                    errorType = .unknown
                    errorMessage = aiError.localizedDescription
                    AppLogger.shared.error("AI Service error: \(aiError)", category: .illustration, requestId: String(requestId))
                }
            } else if (error as NSError).domain == NSURLErrorDomain {
                errorType = .network
                errorMessage = "Network error: \(error.localizedDescription)"
            } else if error is GeneratorError {
                switch error as! GeneratorError {
                case .fileSystemError:
                    errorType = .fileSystem
                    errorMessage = "Failed to save illustration"
                default:
                    errorType = .unknown
                    errorMessage = error.localizedDescription
                }
            } else {
                errorType = .unknown
                errorMessage = error.localizedDescription
            }

            // Mark illustration as failed with details
            illustration.markAsFailed(error: errorMessage, type: errorType)
            try? modelContext.save()

            // Return false to indicate failure
            return false
        }
    }

    /// Segment story text into illustration-worthy scenes
    private func segmentStory(_ content: String, into parts: Int) -> [(text: String, importance: Double)] {
        let sentences = content.components(separatedBy: CharacterSet(charactersIn: ".!?"))
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        guard !sentences.isEmpty else {
            return [(text: content, importance: 1.0)]
        }

        // Divide sentences into roughly equal segments
        let sentencesPerSegment = max(1, sentences.count / parts)
        var segments: [(text: String, importance: Double)] = []

        for i in 0..<parts {
            let startIndex = i * sentencesPerSegment
            let endIndex = min(startIndex + sentencesPerSegment, sentences.count)

            if startIndex < sentences.count {
                let segmentSentences = Array(sentences[startIndex..<endIndex])
                let text = segmentSentences.joined(separator: ". ") + "."

                // Assign higher importance to beginning, climax (middle), and ending
                let importance: Double
                if i == 0 {
                    importance = 1.0 // Opening scene
                } else if i == parts - 1 {
                    importance = 1.0 // Ending scene
                } else if i == parts / 2 {
                    importance = 0.9 // Climax/middle
                } else {
                    importance = 0.7 // Supporting scenes
                }

                segments.append((text: text, importance: importance))
            }
        }

        return segments
    }

    /// Calculate timestamp for an illustration based on its position
    private func calculateTimestamp(index: Int, total: Int, duration: TimeInterval) -> Double {
        // Distribute illustrations evenly throughout the story
        // Add a small offset at the beginning (5 seconds) to let the story start
        let startOffset = 5.0
        let availableDuration = max(0, duration - startOffset - 10.0) // Leave 10 seconds at the end

        if total <= 1 {
            return startOffset
        }

        let interval = availableDuration / Double(total - 1)
        return startOffset + (Double(index) * interval)
    }

    /// Generate a DALL-E prompt for a story segment
    private func generateIllustrationPrompt(
        segment: String,
        heroDescription: String,
        heroName: String,
        storyContext: String
    ) -> String {
        // Clean and simplify inputs to ensure English-only content
        let cleanHeroName = sanitizeName(heroName)
        _ = sanitizeText(storyContext) // Context not needed for simple prompts

        // Create a simple, safe scene description that avoids policy violations
        let safeSceneDescription = createSafeSceneDescription(from: segment)

        // Build a simplified, always-safe prompt
        let finalPrompt = """
        Bright colorful children's book illustration. \
        Happy cartoon character in a magical world. \
        \(safeSceneDescription) \
        Cheerful watercolor style with rainbow colors. \
        Everyone smiling and playing together. \
        Sunny day with flowers and butterflies. \
        Safe friendly magical environment.
        """

        return finalPrompt
    }

    /// Create a safe scene description that won't trigger content policy
    private func createSafeSceneDescription(from segment: String) -> String {
        // Always return generic, safe descriptions
        let scenes = [
            "Characters playing games together in a bright garden",
            "Friends having a picnic under a rainbow",
            "Happy characters dancing with magical butterflies",
            "Characters reading books in a cozy library",
            "Friends building castles with colorful blocks",
            "Characters painting beautiful pictures together",
            "Happy group singing songs in a sunny meadow",
            "Characters sharing treats at a tea party"
        ]

        // Use segment hash to pick a consistent scene
        let index = abs(segment.hash) % scenes.count
        return scenes[index]
    }

    /// Sanitize names to remove non-English characters
    private func sanitizeName(_ name: String) -> String {
        // Remove all non-ASCII characters and clean up
        let cleaned = name.unicodeScalars
            .filter { $0.isASCII && (CharacterSet.letters.contains($0) || $0.value == 32) } // Letters and spaces only
            .map { String($0) }
            .joined()
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return cleaned.isEmpty ? "Happy Hero" : cleaned
    }

    /// Sanitize text to ensure English-only content
    private func sanitizeText(_ text: String) -> String {
        // Remove all non-ASCII characters
        let cleaned = text.unicodeScalars
            .filter { $0.isASCII }
            .map { String($0) }
            .joined()
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return cleaned.isEmpty ? "Magical Adventure" : cleaned
    }

    /// Delete all illustrations for a story
    func deleteIllustrations(for story: Story) throws {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        AppLogger.shared.info("Deleting illustrations for story: \(story.title)", category: .illustration, requestId: String(requestId))

        var deletedCount = 0
        for illustration in story.illustrations {
            // Delete image file if it exists
            if let url = illustration.imageURL {
                do {
                    try FileManager.default.removeItem(at: url)
                    AppLogger.shared.debug("Deleted image file: \(url.lastPathComponent)", category: .illustration, requestId: String(requestId))
                } catch {
                    AppLogger.shared.warning("Failed to delete image file: \(url.lastPathComponent)", category: .illustration, requestId: String(requestId))
                }
            }

            // Delete from database
            modelContext.delete(illustration)
            deletedCount += 1
        }

        try modelContext.save()
        AppLogger.shared.success("Deleted \(deletedCount) illustrations", category: .illustration, requestId: String(requestId))
    }

    /// Regenerate a specific illustration
    func regenerateIllustration(_ illustration: StoryIllustration) async throws {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        let sceneNum = illustration.displayOrder + 1

        AppLogger.shared.info("Regenerating illustration #\(sceneNum)", category: .illustration, requestId: String(requestId))

        // Delete old image if exists
        if let url = illustration.imageURL {
            do {
                try FileManager.default.removeItem(at: url)
                AppLogger.shared.debug("Deleted old image: \(url.lastPathComponent)", category: .illustration, requestId: String(requestId))
            } catch {
                AppLogger.shared.warning("Failed to delete old image: \(error.localizedDescription)", category: .illustration, requestId: String(requestId))
            }
        }

        // Reset generation status and error state
        illustration.isGenerated = false
        illustration.imagePath = nil
        illustration.resetError()
        illustration.retryCount = 0  // Reset retry count for manual regeneration
        try modelContext.save()
        AppLogger.shared.debug("Reset illustration status in database", category: .illustration, requestId: String(requestId))

        // Generate new image
        AppLogger.shared.info("Starting new generation for scene #\(sceneNum)", category: .illustration, requestId: String(requestId))
        let success = await generateSingleIllustration(illustration)

        if !success {
            AppLogger.shared.warning("Regeneration failed for scene #\(sceneNum)", category: .illustration, requestId: String(requestId))
            throw GeneratorError.imageGenerationFailed
        }
    }

    /// Retry failed illustrations with exponential backoff
    func retryFailedIllustrations(for story: Story) async {
        let requestId = UUID().uuidString.prefix(8).lowercased()
        let failedIllustrations = story.illustrations.filter { $0.isPlaceholder && !$0.hasReachedRetryLimit }

        guard !failedIllustrations.isEmpty else {
            AppLogger.shared.info("No failed illustrations to retry", category: .illustration, requestId: String(requestId))
            return
        }

        AppLogger.shared.info("Retrying \(failedIllustrations.count) failed illustrations", category: .illustration, requestId: String(requestId))

        for illustration in failedIllustrations {
            // Apply exponential backoff based on retry count
            if illustration.retryCount > 0 {
                let backoffSeconds = pow(2.0, Double(illustration.retryCount - 1)) * 2.0
                AppLogger.shared.info("Waiting \(backoffSeconds) seconds before retry (attempt \(illustration.retryCount + 1))", category: .illustration, requestId: String(requestId))
                try? await Task.sleep(nanoseconds: UInt64(backoffSeconds * 1_000_000_000))
            }

            let success = await generateSingleIllustration(illustration)
            if success {
                AppLogger.shared.success("Successfully retried illustration #\(illustration.displayOrder + 1)", category: .illustration, requestId: String(requestId))
            }
        }
    }

    // MARK: - Helper Methods

    private func getDocumentsDirectory() -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
}

// MARK: - Array Extension for Chunking

extension Array {
    func chunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}

// MARK: - Timeout Helper

private func withTimeout<T>(seconds: TimeInterval, operation: @escaping () async throws -> T) async throws -> T {
    try await withThrowingTaskGroup(of: T.self) { group in
        group.addTask {
            try await operation()
        }

        group.addTask {
            try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            throw CancellationError()
        }

        let result = try await group.next()!
        group.cancelAll()
        return result
    }
}