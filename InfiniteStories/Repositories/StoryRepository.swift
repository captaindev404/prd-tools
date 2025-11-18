//
//  StoryRepository.swift
//  InfiniteStories
//
//  Repository for Story data access with generation operations
//

import Foundation
import SwiftData

// MARK: - Protocol

protocol StoryRepositoryProtocol {
    func fetchAll() async throws -> [Story]
    func fetch(id: UUID) async throws -> Story?
    func fetchForHero(_ hero: Hero) async throws -> [Story]
    func create(_ story: Story) async throws -> Story
    func update(_ story: Story) async throws -> Story
    func delete(_ story: Story) async throws
    func generateStory(for hero: Hero, event: StoryEvent, language: String) async throws -> Story
    func generateAudio(for story: Story, language: String, voice: String) async throws -> Story
    func generateIllustrations(for story: Story) async throws -> Story
    func syncWithBackend() async throws
}

// MARK: - Implementation

class StoryRepository: StoryRepositoryProtocol {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol

    init(apiClient: APIClientProtocol, cacheManager: CacheManagerProtocol) {
        self.apiClient = apiClient
        self.cacheManager = cacheManager
    }

    // MARK: - Read Operations

    func fetchAll() async throws -> [Story] {
        let cached = try cacheManager.fetchAll(Story.self)

        if FeatureFlags.enableCloudSync {
            Task {
                try? await syncWithBackend()
            }
        }

        return cached
    }

    func fetch(id: UUID) async throws -> Story? {
        return try cacheManager.fetch(Story.self, id: id)
    }

    func fetchForHero(_ hero: Hero) async throws -> [Story] {
        let allStories = try cacheManager.fetchAll(Story.self)
        return allStories.filter { $0.hero?.id == hero.id }
    }

    // MARK: - Create Operation

    func create(_ story: Story) async throws -> Story {
        try cacheManager.save(story)
        story.serverSyncStatus = .pendingCreate

        Logger.repository.info("✅ Created story locally: \(story.title)")

        if FeatureFlags.useBackendAPI {
            Task {
                await syncStoryToBackend(story)
            }
        }

        return story
    }

    private func syncStoryToBackend(_ story: Story) async {
        guard let heroServerId = story.hero?.serverId,
              let heroId = UUID(uuidString: heroServerId) else {
            Logger.repository.warning("⚠️ Story hero not synced, skipping: \(story.title)")
            return
        }

        do {
            let request = StoryCreateRequest(
                heroId: heroId,
                title: story.title,
                eventType: story.builtInEvent?.rawValue,
                customEventId: story.customEvent?.id,
                language: story.language,
                generateAudio: false,
                generateIllustrations: false
            )

            let endpoint = Endpoint.createStory(data: request)
            let response: APIResponse<StoryResponse> = try await apiClient.request(endpoint)

            guard let serverStory = response.data else {
                throw APIError.unknown(NSError(domain: "No data", code: -1))
            }

            story.serverId = serverStory.id.uuidString
            story.serverSyncStatus = .synced
            story.lastSyncedAt = Date()
            story.serverUpdatedAt = serverStory.updatedAt
            try cacheManager.save(story)

            Logger.repository.info("✅ Synced story to backend: \(story.title)")

        } catch {
            story.serverSyncStatus = .failed
            story.syncError = error.localizedDescription
            try? cacheManager.save(story)

            Logger.repository.error("❌ Failed to sync story: \(error)")
        }
    }

    // MARK: - Update Operation

    func update(_ story: Story) async throws -> Story {
        try story.recordPendingChange(field: "title", newValue: story.title)
        try story.recordPendingChange(field: "content", newValue: story.content)

        try cacheManager.save(story)
        story.serverSyncStatus = .pendingUpdate

        Logger.repository.info("✅ Updated story locally: \(story.title)")

        if FeatureFlags.useBackendAPI {
            Task {
                await syncStoryUpdateToBackend(story)
            }
        }

        return story
    }

    private func syncStoryUpdateToBackend(_ story: Story) async {
        guard let serverId = story.serverId else {
            Logger.repository.warning("⚠️ Story has no serverId, skipping: \(story.title)")
            return
        }

        do {
            let request = StoryUpdateRequest(
                title: story.title,
                content: story.content,
                isFavorite: story.isFavorite
            )

            let endpoint = Endpoint.updateStory(id: UUID(uuidString: serverId)!, data: request)
            let response: APIResponse<StoryResponse> = try await apiClient.request(endpoint)

            guard let serverStory = response.data else {
                throw APIError.unknown(NSError(domain: "No data", code: -1))
            }

            story.serverSyncStatus = .synced
            story.lastSyncedAt = Date()
            story.serverUpdatedAt = serverStory.updatedAt
            story.pendingChanges = nil
            try cacheManager.save(story)

            Logger.repository.info("✅ Synced story update to backend: \(story.title)")

        } catch {
            story.serverSyncStatus = .failed
            story.syncError = error.localizedDescription
            try? cacheManager.save(story)

            Logger.repository.error("❌ Failed to sync story update: \(error)")
        }
    }

    // MARK: - Delete Operation

    func delete(_ story: Story) async throws {
        story.serverSyncStatus = .pendingDelete
        try cacheManager.save(story)

        Logger.repository.info("🗑️ Marked story for deletion: \(story.title)")

        if FeatureFlags.useBackendAPI, let serverId = story.serverId {
            Task {
                await deleteStoryFromBackend(story, serverId: serverId)
            }
        } else {
            try cacheManager.delete(story)
        }
    }

    private func deleteStoryFromBackend(_ story: Story, serverId: String) async {
        do {
            let endpoint = Endpoint.deleteStory(id: UUID(uuidString: serverId)!)
            let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

            try cacheManager.delete(story)

            Logger.repository.info("✅ Deleted story from backend: \(story.title)")

        } catch {
            story.serverSyncStatus = .failed
            story.syncError = error.localizedDescription
            try? cacheManager.save(story)

            Logger.repository.error("❌ Failed to delete story: \(error)")
        }
    }

    // MARK: - Generation Operations

    func generateStory(for hero: Hero, event: StoryEvent, language: String) async throws -> Story {
        guard FeatureFlags.useBackendAPI else {
            throw RepositoryError.featureNotEnabled
        }

        guard let heroServerId = hero.serverId,
              let heroId = UUID(uuidString: heroServerId) else {
            throw RepositoryError.notSynced
        }

        Logger.repository.info("📝 Generating story for hero: \(hero.name)")

        let request = StoryCreateRequest(
            heroId: heroId,
            title: nil,
            eventType: event.rawValue,
            customEventId: nil,
            language: language,
            generateAudio: true,
            generateIllustrations: true
        )

        let endpoint = Endpoint.createStory(data: request)
        let response: APIResponse<StoryResponse> = try await apiClient.request(endpoint)

        guard let serverStory = response.data else {
            throw APIError.unknown(NSError(domain: "No data", code: -1))
        }

        // Create local story from server response
        let story = Story(from: serverStory, hero: hero)
        try cacheManager.save(story)

        Logger.repository.info("✅ Generated story: \(story.title)")

        return story
    }

    func generateAudio(for story: Story, language: String, voice: String) async throws -> Story {
        guard FeatureFlags.useBackendAPI else {
            throw RepositoryError.featureNotEnabled
        }

        guard let serverId = story.serverId,
              let storyId = UUID(uuidString: serverId) else {
            throw RepositoryError.notSynced
        }

        Logger.repository.info("🔊 Generating audio for story: \(story.title)")

        let endpoint = Endpoint.generateAudio(storyId: storyId, language: language, voice: voice)
        let response: APIResponse<StoryResponse> = try await apiClient.request(endpoint)

        guard let serverStory = response.data else {
            throw APIError.unknown(NSError(domain: "No data", code: -1))
        }

        // Update story with audio URL
        story.audioFileName = serverStory.audioUrl
        story.serverUpdatedAt = serverStory.updatedAt
        try cacheManager.save(story)

        Logger.repository.info("✅ Generated audio for story: \(story.title)")

        return story
    }

    func generateIllustrations(for story: Story) async throws -> Story {
        guard FeatureFlags.useBackendAPI else {
            throw RepositoryError.featureNotEnabled
        }

        guard let serverId = story.serverId,
              let storyId = UUID(uuidString: serverId) else {
            throw RepositoryError.notSynced
        }

        Logger.repository.info("🎨 Generating illustrations for story: \(story.title)")

        let endpoint = Endpoint.generateIllustrations(storyId: storyId)
        let response: APIResponse<StoryResponse> = try await apiClient.request(endpoint)

        guard let serverStory = response.data else {
            throw APIError.unknown(NSError(domain: "No data", code: -1))
        }

        // Update story with illustration status
        story.serverUpdatedAt = serverStory.updatedAt
        try cacheManager.save(story)

        Logger.repository.info("✅ Initiated illustration generation for: \(story.title)")

        return story
    }

    // MARK: - Sync Operations

    func syncWithBackend() async throws {
        Logger.repository.info("🔄 Syncing stories from backend...")

        let endpoint = Endpoint.getStories(heroId: nil, limit: 100, offset: 0, includeIllustrations: false)
        let response: APIResponse<[StoryResponse]> = try await apiClient.request(endpoint)

        guard let serverStories = response.data else {
            Logger.repository.warning("No stories data from server")
            return
        }

        Logger.repository.info("📥 Received \(serverStories.count) stories from server")

        for serverStory in serverStories {
            if let localStory = try cacheManager.fetch(Story.self, serverId: serverStory.id.uuidString) {
                if localStory.needsSync {
                    localStory.serverSyncStatus = .conflict
                    try cacheManager.save(localStory)
                    Logger.repository.warning("⚠️ Conflict detected for story: \(localStory.title)")
                } else {
                    localStory.updateFrom(server: serverStory)
                    try cacheManager.save(localStory)
                    Logger.repository.debug("Updated local story from server: \(localStory.title)")
                }
            } else {
                // Find hero for this story
                guard let heroServerId = serverStory.heroId.uuidString,
                      let hero = try cacheManager.fetch(Hero.self, serverId: heroServerId) else {
                    Logger.repository.warning("⚠️ Hero not found for story: \(serverStory.title)")
                    continue
                }

                let newStory = Story(from: serverStory, hero: hero)
                try cacheManager.save(newStory)
                Logger.repository.info("➕ Created new local story from server: \(newStory.title)")
            }
        }

        Logger.repository.info("✅ Story sync completed")
    }
}
