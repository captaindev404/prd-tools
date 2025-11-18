//
//  SyncEngine.swift
//  InfiniteStories
//
//  Bidirectional sync engine for cloud synchronization
//

import Foundation
import SwiftData

// MARK: - Protocol

protocol SyncEngineProtocol {
    func syncAll() async throws
    func syncHeroes() async throws
    func syncStories() async throws
    func syncCustomEvents() async throws
    func resolveConflicts() async throws
}

// MARK: - Implementation

actor SyncEngine: SyncEngineProtocol {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol
    private let conflictResolver: ConflictResolver

    private var isSyncing = false
    private var lastSyncAt: Date?

    init(
        apiClient: APIClientProtocol,
        cacheManager: CacheManagerProtocol,
        conflictResolver: ConflictResolver
    ) {
        self.apiClient = apiClient
        self.cacheManager = cacheManager
        self.conflictResolver = conflictResolver
    }

    // MARK: - Full Sync

    func syncAll() async throws {
        guard !isSyncing else {
            Logger.sync.info("Sync already in progress, skipping")
            return
        }

        isSyncing = true
        defer { isSyncing = false }

        Logger.sync.info("🔄 Starting full sync...")
        let startTime = Date()

        do {
            // 1. Push pending creates
            try await pushPendingCreates()

            // 2. Push pending updates
            try await pushPendingUpdates()

            // 3. Push pending deletes
            try await pushPendingDeletes()

            // 4. Pull server changes
            try await pullServerChanges()

            // 5. Resolve conflicts
            try await resolveConflicts()

            lastSyncAt = Date()

            let duration = Date().timeIntervalSince(startTime)
            Logger.sync.info("✅ Full sync completed in \(String(format: "%.1f", duration))s")

        } catch {
            Logger.sync.error("❌ Sync failed: \(error)")
            throw error
        }
    }

    // MARK: - Entity-Specific Sync

    func syncHeroes() async throws {
        try await pushPendingHeroes()
        try await pullHeroes()
    }

    func syncStories() async throws {
        try await pushPendingStories()
        try await pullStories()
    }

    func syncCustomEvents() async throws {
        try await pushPendingCustomEvents()
        try await pullCustomEvents()
    }

    // MARK: - Push Operations

    private func pushPendingCreates() async throws {
        try await pushPendingHeroes()
        try await pushPendingStories()
        try await pushPendingCustomEvents()
    }

    private func pushPendingHeroes() async throws {
        let pendingHeroes = try cacheManager.fetchPendingSync(Hero.self, status: .pendingCreate)

        guard !pendingHeroes.isEmpty else { return }

        Logger.sync.info("📤 Pushing \(pendingHeroes.count) pending hero creates")

        for hero in pendingHeroes {
            do {
                let request = HeroCreateRequest(
                    name: hero.name,
                    age: hero.age,
                    traits: hero.traits.map { $0.rawValue },
                    specialAbility: hero.specialAbility,
                    hairColor: nil,
                    eyeColor: nil,
                    skinTone: nil,
                    height: nil
                )

                let endpoint = Endpoint.createHero(data: request)
                let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

                guard let serverHero = response.data else {
                    throw APIError.unknown(NSError(domain: "No data", code: -1))
                }

                hero.serverId = serverHero.id.uuidString
                hero.serverSyncStatus = .synced
                hero.lastSyncedAt = Date()
                hero.serverUpdatedAt = serverHero.updatedAt
                try cacheManager.save(hero)

                Logger.sync.info("✅ Created hero on server: \(hero.name)")

            } catch {
                hero.serverSyncStatus = .failed
                hero.syncError = error.localizedDescription
                try cacheManager.save(hero)

                Logger.sync.error("❌ Failed to create hero: \(error)")
            }
        }
    }

    private func pushPendingStories() async throws {
        let pendingStories = try cacheManager.fetchPendingSync(Story.self, status: .pendingCreate)

        guard !pendingStories.isEmpty else { return }

        Logger.sync.info("📤 Pushing \(pendingStories.count) pending story creates")

        for story in pendingStories {
            guard let heroServerId = story.hero?.serverId,
                  let heroId = UUID(uuidString: heroServerId) else {
                Logger.sync.warning("⚠️ Story hero not synced: \(story.title)")
                continue
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

                Logger.sync.info("✅ Created story on server: \(story.title)")

            } catch {
                story.serverSyncStatus = .failed
                story.syncError = error.localizedDescription
                try cacheManager.save(story)

                Logger.sync.error("❌ Failed to create story: \(error)")
            }
        }
    }

    private func pushPendingCustomEvents() async throws {
        // Similar implementation for custom events
        Logger.sync.debug("Custom event sync not yet implemented")
    }

    private func pushPendingUpdates() async throws {
        let heroes = try cacheManager.fetchPendingSync(Hero.self, status: .pendingUpdate)
        let stories = try cacheManager.fetchPendingSync(Story.self, status: .pendingUpdate)

        Logger.sync.info("📤 Pushing \(heroes.count) hero updates, \(stories.count) story updates")

        // Push hero updates
        for hero in heroes {
            guard let serverId = hero.serverId else { continue }

            do {
                let request = HeroUpdateRequest(
                    name: hero.name,
                    age: hero.age,
                    traits: hero.traits.map { $0.rawValue },
                    specialAbility: hero.specialAbility,
                    avatarUrl: nil
                )

                let endpoint = Endpoint.updateHero(id: UUID(uuidString: serverId)!, data: request)
                let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

                guard let serverHero = response.data else {
                    throw APIError.unknown(NSError(domain: "No data", code: -1))
                }

                hero.serverSyncStatus = .synced
                hero.lastSyncedAt = Date()
                hero.serverUpdatedAt = serverHero.updatedAt
                try cacheManager.save(hero)

            } catch {
                hero.serverSyncStatus = .failed
                hero.syncError = error.localizedDescription
                try cacheManager.save(hero)
            }
        }

        // Similar for stories...
    }

    private func pushPendingDeletes() async throws {
        let heroes = try cacheManager.fetchPendingSync(Hero.self, status: .pendingDelete)
        let stories = try cacheManager.fetchPendingSync(Story.self, status: .pendingDelete)

        Logger.sync.info("📤 Pushing \(heroes.count) hero deletes, \(stories.count) story deletes")

        for hero in heroes {
            guard let serverId = hero.serverId else {
                try cacheManager.delete(hero)
                continue
            }

            do {
                let endpoint = Endpoint.deleteHero(id: UUID(uuidString: serverId)!)
                let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

                try cacheManager.delete(hero)

            } catch {
                hero.serverSyncStatus = .failed
                hero.syncError = error.localizedDescription
                try cacheManager.save(hero)
            }
        }

        // Similar for stories...
    }

    // MARK: - Pull Operations

    private func pullServerChanges() async throws {
        try await pullHeroes()
        try await pullStories()
        try await pullCustomEvents()
    }

    private func pullHeroes() async throws {
        Logger.sync.info("📥 Pulling heroes from server...")

        let endpoint = Endpoint.getHeroes(limit: 100, offset: 0, includeStories: false)
        let response: APIResponse<[HeroResponse]> = try await apiClient.request(endpoint)

        guard let serverHeroes = response.data else { return }

        Logger.sync.info("Received \(serverHeroes.count) heroes from server")

        for serverHero in serverHeroes {
            if let localHero = try cacheManager.fetch(Hero.self, serverId: serverHero.id.uuidString) {
                if localHero.needsSync {
                    localHero.serverSyncStatus = .conflict
                    try cacheManager.save(localHero)
                } else {
                    localHero.updateFrom(server: serverHero)
                    try cacheManager.save(localHero)
                }
            } else {
                let newHero = Hero(from: serverHero)
                try cacheManager.save(newHero)
            }
        }
    }

    private func pullStories() async throws {
        Logger.sync.info("📥 Pulling stories from server...")

        let endpoint = Endpoint.getStories(heroId: nil, limit: 100, offset: 0, includeIllustrations: false)
        let response: APIResponse<[StoryResponse]> = try await apiClient.request(endpoint)

        guard let serverStories = response.data else { return }

        for serverStory in serverStories {
            if let localStory = try cacheManager.fetch(Story.self, serverId: serverStory.id.uuidString) {
                if localStory.needsSync {
                    localStory.serverSyncStatus = .conflict
                    try cacheManager.save(localStory)
                } else {
                    localStory.updateFrom(server: serverStory)
                    try cacheManager.save(localStory)
                }
            } else {
                guard let heroServerId = serverStory.heroId.uuidString,
                      let hero = try cacheManager.fetch(Hero.self, serverId: heroServerId) else {
                    continue
                }

                let newStory = Story(from: serverStory, hero: hero)
                try cacheManager.save(newStory)
            }
        }
    }

    private func pullCustomEvents() async throws {
        Logger.sync.debug("Custom event pull not yet implemented")
    }

    // MARK: - Conflict Resolution

    func resolveConflicts() async throws {
        let conflictedHeroes = try cacheManager.fetchPendingSync(Hero.self, status: .conflict)
        let conflictedStories = try cacheManager.fetchPendingSync(Story.self, status: .conflict)

        let totalConflicts = conflictedHeroes.count + conflictedStories.count

        guard totalConflicts > 0 else { return }

        Logger.sync.info("⚠️ Resolving \(totalConflicts) conflicts")

        for hero in conflictedHeroes {
            guard let serverId = hero.serverId,
                  let heroId = UUID(uuidString: serverId) else { continue }

            let endpoint = Endpoint.getHero(id: heroId, includeStories: false)
            let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

            guard let serverHero = response.data else { continue }

            try await conflictResolver.resolveHeroConflict(local: hero, server: serverHero)
        }

        for story in conflictedStories {
            guard let serverId = story.serverId,
                  let storyId = UUID(uuidString: serverId) else { continue }

            let endpoint = Endpoint.getStory(id: storyId, includeIllustrations: false)
            let response: APIResponse<StoryResponse> = try await apiClient.request(endpoint)

            guard let serverStory = response.data else { continue }

            try await conflictResolver.resolveStoryConflict(local: story, server: serverStory)
        }

        Logger.sync.info("✅ Resolved \(totalConflicts) conflicts")
    }
}
