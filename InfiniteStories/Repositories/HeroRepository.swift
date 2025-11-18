//
//  HeroRepository.swift
//  InfiniteStories
//
//  Repository for Hero data access with API and cache coordination
//

import Foundation
import SwiftData

// MARK: - Protocol

protocol HeroRepositoryProtocol {
    func fetchAll() async throws -> [Hero]
    func fetch(id: UUID) async throws -> Hero?
    func create(_ hero: Hero) async throws -> Hero
    func update(_ hero: Hero) async throws -> Hero
    func delete(_ hero: Hero) async throws
    func generateAvatar(for hero: Hero, prompt: String) async throws -> Hero
    func syncWithBackend() async throws
}

// MARK: - Implementation

class HeroRepository: HeroRepositoryProtocol {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol

    init(apiClient: APIClientProtocol, cacheManager: CacheManagerProtocol) {
        self.apiClient = apiClient
        self.cacheManager = cacheManager
    }

    // MARK: - Read Operations

    /// Fetch all heroes (cache-first with background sync)
    func fetchAll() async throws -> [Hero] {
        // Return cached data immediately
        let cached = try cacheManager.fetchAll(Hero.self)

        // Sync in background if cloud sync enabled
        if FeatureFlags.enableCloudSync {
            Task {
                try? await syncWithBackend()
            }
        }

        return cached
    }

    /// Fetch single hero by ID
    func fetch(id: UUID) async throws -> Hero? {
        return try cacheManager.fetch(Hero.self, id: id)
    }

    // MARK: - Create Operation

    /// Create new hero (optimistic update with background sync)
    func create(_ hero: Hero) async throws -> Hero {
        // 1. Save to cache immediately (optimistic)
        try cacheManager.save(hero)
        hero.serverSyncStatus = .pendingCreate

        Logger.repository.info("✅ Created hero locally: \(hero.name)")

        // 2. Sync to backend if enabled
        if FeatureFlags.useBackendAPI {
            Task {
                await syncHeroToBackend(hero)
            }
        }

        return hero
    }

    /// Sync newly created hero to backend
    private func syncHeroToBackend(_ hero: Hero) async {
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

            // Update with server-assigned ID
            hero.serverId = serverHero.id.uuidString
            hero.serverSyncStatus = .synced
            hero.lastSyncedAt = Date()
            hero.serverUpdatedAt = serverHero.updatedAt
            try cacheManager.save(hero)

            Logger.repository.info("✅ Synced hero to backend: \(hero.name)")

        } catch {
            // Mark as failed, will retry later
            hero.serverSyncStatus = .failed
            hero.syncError = error.localizedDescription
            try? cacheManager.save(hero)

            Logger.repository.error("❌ Failed to sync hero: \(error)")
        }
    }

    // MARK: - Update Operation

    /// Update hero (optimistic update with background sync)
    func update(_ hero: Hero) async throws -> Hero {
        // 1. Record pending changes for conflict resolution
        try hero.recordPendingChange(field: "name", newValue: hero.name)
        try hero.recordPendingChange(field: "age", newValue: hero.age)

        // 2. Save to cache (optimistic)
        try cacheManager.save(hero)
        hero.serverSyncStatus = .pendingUpdate

        Logger.repository.info("✅ Updated hero locally: \(hero.name)")

        // 3. Sync to backend if enabled
        if FeatureFlags.useBackendAPI {
            Task {
                await syncHeroUpdateToBackend(hero)
            }
        }

        return hero
    }

    /// Sync hero update to backend
    private func syncHeroUpdateToBackend(_ hero: Hero) async {
        guard let serverId = hero.serverId else {
            Logger.repository.warning("⚠️ Hero has no serverId, skipping: \(hero.name)")
            return
        }

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

            // Check for conflicts
            if let localUpdatedAt = hero.serverUpdatedAt,
               serverHero.updatedAt > localUpdatedAt {
                // Server has newer version - conflict!
                hero.serverSyncStatus = .conflict
                try cacheManager.save(hero)
                Logger.repository.warning("⚠️ Conflict detected for hero: \(hero.name)")
                return
            }

            // No conflict, mark as synced
            hero.serverSyncStatus = .synced
            hero.lastSyncedAt = Date()
            hero.serverUpdatedAt = serverHero.updatedAt
            hero.pendingChanges = nil
            try cacheManager.save(hero)

            Logger.repository.info("✅ Synced hero update to backend: \(hero.name)")

        } catch {
            hero.serverSyncStatus = .failed
            hero.syncError = error.localizedDescription
            try? cacheManager.save(hero)

            Logger.repository.error("❌ Failed to sync hero update: \(error)")
        }
    }

    // MARK: - Delete Operation

    /// Delete hero (mark as pending delete with background sync)
    func delete(_ hero: Hero) async throws {
        // 1. Mark as pending delete (don't actually delete yet)
        hero.serverSyncStatus = .pendingDelete
        try cacheManager.save(hero)

        Logger.repository.info("🗑️ Marked hero for deletion: \(hero.name)")

        // 2. Delete from backend if enabled
        if FeatureFlags.useBackendAPI, let serverId = hero.serverId {
            Task {
                await deleteHeroFromBackend(hero, serverId: serverId)
            }
        } else {
            // No backend sync, delete immediately
            try cacheManager.delete(hero)
        }
    }

    /// Delete hero from backend
    private func deleteHeroFromBackend(_ hero: Hero, serverId: String) async {
        do {
            let endpoint = Endpoint.deleteHero(id: UUID(uuidString: serverId)!)
            let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

            // Now actually delete from cache
            try cacheManager.delete(hero)

            Logger.repository.info("✅ Deleted hero from backend: \(hero.name)")

        } catch {
            hero.serverSyncStatus = .failed
            hero.syncError = error.localizedDescription
            try? cacheManager.save(hero)

            Logger.repository.error("❌ Failed to delete hero: \(error)")
        }
    }

    // MARK: - Avatar Generation

    /// Generate avatar for hero via backend API
    func generateAvatar(for hero: Hero, prompt: String) async throws -> Hero {
        guard FeatureFlags.useBackendAPI else {
            throw RepositoryError.featureNotEnabled
        }

        guard let serverId = hero.serverId else {
            throw RepositoryError.notSynced
        }

        Logger.repository.info("🎨 Generating avatar for hero: \(hero.name)")

        let endpoint = Endpoint.generateAvatar(heroId: UUID(uuidString: serverId)!, prompt: prompt)
        let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

        guard let serverHero = response.data else {
            throw APIError.unknown(NSError(domain: "No data", code: -1))
        }

        // Update hero with new avatar
        hero.avatarImagePath = serverHero.avatarUrl
        hero.avatarGenerationId = serverHero.avatarGenerationId
        hero.serverUpdatedAt = serverHero.updatedAt
        try cacheManager.save(hero)

        Logger.repository.info("✅ Generated avatar for hero: \(hero.name)")

        return hero
    }

    // MARK: - Sync Operations

    /// Sync all heroes with backend (pull server changes)
    func syncWithBackend() async throws {
        Logger.repository.info("🔄 Syncing heroes from backend...")

        let endpoint = Endpoint.getHeroes(limit: 100, offset: 0, includeStories: false)
        let response: APIResponse<[HeroResponse]> = try await apiClient.request(endpoint)

        guard let serverHeroes = response.data else {
            Logger.repository.warning("No heroes data from server")
            return
        }

        Logger.repository.info("📥 Received \(serverHeroes.count) heroes from server")

        for serverHero in serverHeroes {
            // Find local hero by serverId
            if let localHero = try cacheManager.fetch(Hero.self, serverId: serverHero.id.uuidString) {
                // Check for conflicts
                if localHero.needsSync {
                    // Conflict: local has unsaved changes + server has updates
                    localHero.serverSyncStatus = .conflict
                    try cacheManager.save(localHero)
                    Logger.repository.warning("⚠️ Conflict detected for hero: \(localHero.name)")
                } else {
                    // No conflict, update local with server data
                    localHero.updateFrom(server: serverHero)
                    try cacheManager.save(localHero)
                    Logger.repository.debug("Updated local hero from server: \(localHero.name)")
                }
            } else {
                // New hero from server, create locally
                let newHero = Hero(from: serverHero)
                try cacheManager.save(newHero)
                Logger.repository.info("➕ Created new local hero from server: \(newHero.name)")
            }
        }

        Logger.repository.info("✅ Hero sync completed")
    }
}

// MARK: - Repository Errors

enum RepositoryError: Error, LocalizedError {
    case featureNotEnabled
    case notSynced
    case syncFailed(String)

    var errorDescription: String? {
        switch self {
        case .featureNotEnabled:
            return "This feature requires backend API to be enabled"
        case .notSynced:
            return "Entity must be synced to backend first"
        case .syncFailed(let message):
            return "Sync failed: \(message)"
        }
    }
}
