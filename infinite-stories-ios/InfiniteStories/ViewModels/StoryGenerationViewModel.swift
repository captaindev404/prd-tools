//
//  StoryGenerationViewModel.swift
//  InfiniteStories
//
//  Created by Captain Dev on 22/12/2025.
//
//  Extracted from StoryViewModel as part of ViewModel architecture refactoring.
//  Focused responsibility: story, audio, and illustration generation pipeline.
//

import Foundation
import SwiftUI
import SwiftData

/// Represents the individual steps in the generation pipeline
enum GenerationStep: String, CaseIterable {
    case story = "Story"
    case audio = "Audio"
    case illustrations = "Illustrations"

    var icon: String {
        switch self {
        case .story: return "doc.text.fill"
        case .audio: return "speaker.wave.2.fill"
        case .illustrations: return "photo.fill"
        }
    }

    var displayName: String { rawValue }

    var retryButtonText: String {
        switch self {
        case .story: return "Retry Story"
        case .audio: return "Retry Audio"
        case .illustrations: return "Retry Images"
        }
    }
}

/// Represents the current stage of story generation
enum GenerationStage: Equatable {
    case idle
    case generatingStory
    case generatingAudio
    case generatingIllustrations
    case completed
    case failed(step: GenerationStep, error: String)

    var isInProgress: Bool {
        switch self {
        case .generatingStory, .generatingAudio, .generatingIllustrations:
            return true
        default:
            return false
        }
    }

    var isFailed: Bool {
        if case .failed = self { return true }
        return false
    }

    var failedStep: GenerationStep? {
        if case .failed(let step, _) = self { return step }
        return nil
    }

    var errorMessage: String? {
        if case .failed(_, let error) = self { return error }
        return nil
    }

    var displayText: String {
        switch self {
        case .idle: return "Ready"
        case .generatingStory: return "Creating your story..."
        case .generatingAudio: return "Generating audio..."
        case .generatingIllustrations: return "Creating illustrations..."
        case .completed: return "Complete!"
        case .failed(let step, _): return "\(step.displayName) failed"
        }
    }
}

/// ViewModel for managing the story generation pipeline
@Observable
@MainActor
final class StoryGenerationViewModel {

    // MARK: - Generation State

    /// Current stage of generation
    var generationStage: GenerationStage = .idle

    /// Overall progress (0.0 to 1.0) across all generation steps
    var overallProgress: Double = 0.0

    /// Whether illustrations are enabled for generation
    var enableIllustrations: Bool = false

    /// Stage description for illustration generation
    var illustrationGenerationStage: String = ""

    /// Errors that occurred during illustration generation (non-fatal)
    var illustrationErrors: [String] = []

    // MARK: - Result State

    /// The generated story (after successful generation)
    var currentStory: Story?

    /// Whether audio is currently being generated
    var isGeneratingAudio: Bool {
        generationStage == .generatingAudio
    }

    /// Whether illustrations are currently being generated
    var isGeneratingIllustrations: Bool {
        generationStage == .generatingIllustrations
    }

    /// Whether the failed step can be skipped
    var canSkipFailedStep: Bool {
        guard case .failed(let step, _) = generationStage else { return false }
        // Can skip audio or illustrations, but not story
        return step == .audio || step == .illustrations
    }

    // MARK: - Private Properties

    private let storyRepository: StoryRepositoryProtocol
    private let appSettings = AppSettings()
    private var modelContext: ModelContext?

    // MARK: - Initialization

    /// Convenience initializer with default repository
    convenience init() {
        self.init(storyRepository: StoryRepository())
    }

    /// Full initializer for dependency injection
    init(storyRepository: StoryRepositoryProtocol) {
        self.storyRepository = storyRepository
    }

    // MARK: - Setup

    /// Set the model context for SwiftData operations
    func setModelContext(_ context: ModelContext) {
        self.modelContext = context
    }

    // MARK: - Generation Pipeline

    /// Generate a complete story with optional audio and illustrations
    func generateStory(for hero: Hero, event: StoryEvent) async {
        await generateStory(for: hero, eventTitle: event.rawValue, eventPrompt: event.promptSeed)
    }

    /// Generate a complete story with a custom event
    func generateStory(for hero: Hero, customEvent: CustomStoryEvent) async {
        await generateStory(for: hero, eventTitle: customEvent.title, eventPrompt: customEvent.description)
    }

    /// Main generation pipeline
    private func generateStory(for hero: Hero, eventTitle: String, eventPrompt: String) async {
        // Reset state
        generationStage = .generatingStory
        overallProgress = 0.0
        illustrationErrors = []
        currentStory = nil

        do {
            // Step 1: Generate story content
            print("📱 📖 Generating story for hero: \(hero.name), event: \(eventTitle)")
            let story = try await storyRepository.generateStory(
                heroId: hero.backendId ?? "",
                eventType: eventTitle,
                customEventId: nil,
                language: appSettings.preferredLanguage,
                generateAudio: false, // We generate audio in step 2
                generateIllustrations: false // We generate illustrations in step 3
            )

            // Assign hero to story
            story.hero = hero
            currentStory = story

            overallProgress = 0.33
            print("📱 📖 Story created: \(story.title)")

            // Step 2: Generate audio
            generationStage = .generatingAudio
            print("📱 🎵 Generating audio for story...")

            guard let storyBackendId = story.backendId else {
                throw NSError(domain: "StoryGenerationViewModel", code: -1,
                              userInfo: [NSLocalizedDescriptionKey: "Story has no backend ID"])
            }

            let audioUrl = try await storyRepository.generateAudio(
                storyId: storyBackendId,
                language: appSettings.preferredLanguage,
                voice: appSettings.preferredVoice
            )

            story.audioFileName = audioUrl
            overallProgress = 0.66
            print("📱 🎵 Audio generated: \(audioUrl)")

            // Step 3: Generate illustrations (if enabled and hero has avatar)
            if enableIllustrations && hero.hasAvatar {
                generationStage = .generatingIllustrations
                illustrationGenerationStage = "Preparing illustration generation..."

                do {
                    try await generateIllustrationsForStory(story, hero: hero)
                    overallProgress = 1.0
                } catch {
                    // Illustrations are non-critical - log but continue
                    print("📱 🎨 Illustration generation failed: \(error)")
                    illustrationErrors.append(error.localizedDescription)
                    overallProgress = 1.0
                }
            } else {
                overallProgress = 1.0
            }

            generationStage = .completed
            print("📱 ✅ Story generation complete: \(story.title)")

        } catch {
            print("📱 ❌ Story generation failed: \(error)")
            let failedStep: GenerationStep
            switch generationStage {
            case .generatingStory: failedStep = .story
            case .generatingAudio: failedStep = .audio
            case .generatingIllustrations: failedStep = .illustrations
            default: failedStep = .story
            }
            generationStage = .failed(step: failedStep, error: error.localizedDescription)
        }
    }

    /// Continue from a failed step
    func continueFromFailedStep(hero: Hero) async {
        guard case .failed(let step, _) = generationStage,
              let story = currentStory else {
            return
        }

        switch step {
        case .story:
            // Need to restart entirely - no partial story to continue from
            break

        case .audio:
            // Retry audio generation
            generationStage = .generatingAudio
            do {
                guard let storyBackendId = story.backendId else {
                    throw NSError(domain: "StoryGenerationViewModel", code: -1,
                                  userInfo: [NSLocalizedDescriptionKey: "Story has no backend ID"])
                }

                let audioUrl = try await storyRepository.generateAudio(
                    storyId: storyBackendId,
                    language: appSettings.preferredLanguage,
                    voice: appSettings.preferredVoice
                )

                story.audioFileName = audioUrl
                overallProgress = 0.66

                // Continue to illustrations if enabled
                if enableIllustrations && hero.hasAvatar {
                    generationStage = .generatingIllustrations
                    try await generateIllustrationsForStory(story, hero: hero)
                }

                generationStage = .completed
                overallProgress = 1.0

            } catch {
                generationStage = .failed(step: .audio, error: error.localizedDescription)
            }

        case .illustrations:
            // Retry illustration generation
            generationStage = .generatingIllustrations
            do {
                try await generateIllustrationsForStory(story, hero: hero)
                generationStage = .completed
                overallProgress = 1.0
            } catch {
                generationStage = .failed(step: .illustrations, error: error.localizedDescription)
            }
        }
    }

    /// Skip the failed step and complete generation
    func skipFailedStep() {
        guard case .failed(let step, _) = generationStage else { return }

        switch step {
        case .story:
            // Cannot skip story - it's required
            break

        case .audio:
            // Skip audio - continue to illustrations or complete
            if enableIllustrations {
                // Illustrations already done or not enabled
                generationStage = .completed
            } else {
                generationStage = .completed
            }
            overallProgress = 1.0

        case .illustrations:
            // Skip illustrations - complete without them
            generationStage = .completed
            overallProgress = 1.0
        }
    }

    /// Clear any error state
    func clearError() {
        generationStage = .idle
        overallProgress = 0.0
    }

    // MARK: - Illustration Generation

    private func generateIllustrationsForStory(_ story: Story, hero: Hero) async throws {
        guard let storyBackendId = story.backendId else {
            throw NSError(domain: "StoryGenerationViewModel", code: -1,
                          userInfo: [NSLocalizedDescriptionKey: "Story has no backend ID"])
        }

        illustrationGenerationStage = "Generating illustrations..."

        // Generate illustrations via repository - returns updated story with illustrations
        let updatedStory = try await storyRepository.generateIllustrations(storyId: storyBackendId)

        // Update the current story's illustrations from the response
        story.illustrations = updatedStory.illustrations

        // Save to model context if available
        if let modelContext = modelContext {
            for illustration in story.illustrations {
                illustration.story = story
                modelContext.insert(illustration)
            }
            try modelContext.save()
        }

        illustrationGenerationStage = "Illustrations complete"
        print("📱 🎨 Illustrations generated: \(story.illustrations.count)")
    }

    // MARK: - Audio Regeneration

    /// Regenerate audio for an existing story
    func regenerateAudioForStory(_ story: Story) async {
        guard let storyBackendId = story.backendId else {
            print("📱 ❌ Story has no backend ID")
            return
        }

        do {
            let audioUrl = try await storyRepository.generateAudio(
                storyId: storyBackendId,
                language: appSettings.preferredLanguage,
                voice: appSettings.preferredVoice
            )

            story.audioFileName = audioUrl
            story.clearAudioRegenerationFlag()
            print("📱 🎵 Audio regenerated: \(audioUrl)")
        } catch {
            print("📱 ❌ Audio regeneration failed: \(error)")
        }
    }

    // MARK: - Illustration Retry

    /// Retry failed illustrations for a story
    /// Note: This triggers a full regeneration of illustrations via the API
    func retryAllFailedIllustrations(for story: Story) async {
        guard let storyBackendId = story.backendId else {
            print("📱 ❌ Story has no backend ID")
            return
        }

        do {
            // Regenerate all illustrations via repository
            let updatedStory = try await storyRepository.generateIllustrations(storyId: storyBackendId)

            // Update story's illustrations
            story.illustrations = updatedStory.illustrations

            // Save to model context if available
            if let modelContext = modelContext {
                for illustration in story.illustrations {
                    illustration.story = story
                    modelContext.insert(illustration)
                }
                try modelContext.save()
            }

            print("📱 🎨 Illustrations regenerated: \(story.illustrations.count)")
        } catch {
            print("📱 ❌ Illustration regeneration failed: \(error)")
        }
    }

    // MARK: - Helper Methods

    /// Check if a story has retryable failed illustrations
    func hasRetryableFailedIllustrations(_ story: Story) -> Bool {
        return story.illustrations.contains { $0.isPlaceholder && !$0.hasReachedRetryLimit }
    }

    /// Get count of failed illustrations for a story
    func failedIllustrationCount(for story: Story) -> Int {
        return story.illustrations.filter { $0.isPlaceholder }.count
    }
}
