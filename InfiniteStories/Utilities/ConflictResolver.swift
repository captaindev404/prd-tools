//
//  ConflictResolver.swift
//  InfiniteStories
//
//  Conflict resolution strategies for sync conflicts
//

import Foundation

// MARK: - Conflict Resolution Strategy

enum ConflictResolution {
    case serverWins     // Server data overwrites local
    case localWins      // Local data pushes to server
    case userPrompt     // Ask user to choose
    case merge          // Attempt automatic merge
}

// MARK: - Conflict Resolver

class ConflictResolver {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol

    init(apiClient: APIClientProtocol, cacheManager: CacheManagerProtocol) {
        self.apiClient = apiClient
        self.cacheManager = cacheManager
    }

    // MARK: - Hero Conflicts

    func resolveHeroConflict(
        local: Hero,
        server: HeroResponse,
        strategy: ConflictResolution = .serverWins
    ) async throws {
        Logger.sync.info("🔄 Resolving conflict for hero: \(local.name)")

        switch strategy {
        case .serverWins:
            try resolveHeroServerWins(local: local, server: server)

        case .localWins:
            try await resolveHeroLocalWins(local: local)

        case .userPrompt:
            let choice = await showHeroConflictUI(local: local, server: server)
            try await resolveHeroConflict(local: local, server: server, strategy: choice)

        case .merge:
            try await attemptHeroMerge(local: local, server: server)
        }
    }

    private func resolveHeroServerWins(local: Hero, server: HeroResponse) throws {
        Logger.sync.info("Conflict resolved: Server wins for \(local.name)")

        local.updateFrom(server: server)
        local.serverSyncStatus = .synced
        local.lastSyncedAt = Date()
        local.pendingChanges = nil
        local.syncError = nil

        try cacheManager.save(local)
    }

    private func resolveHeroLocalWins(local: Hero) async throws {
        Logger.sync.info("Conflict resolved: Local wins for \(local.name)")

        guard let serverId = local.serverId else {
            throw RepositoryError.notSynced
        }

        let request = HeroUpdateRequest(
            name: local.name,
            age: local.age,
            traits: local.traits.map { $0.rawValue },
            specialAbility: local.specialAbility,
            avatarUrl: nil
        )

        let endpoint = Endpoint.updateHero(id: UUID(uuidString: serverId)!, data: request)
        let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

        guard let serverHero = response.data else {
            throw APIError.unknown(NSError(domain: "No data", code: -1))
        }

        local.serverUpdatedAt = serverHero.updatedAt
        local.serverSyncStatus = .synced
        local.lastSyncedAt = Date()
        local.pendingChanges = nil

        try cacheManager.save(local)
    }

    @MainActor
    private func showHeroConflictUI(local: Hero, server: HeroResponse) async -> ConflictResolution {
        // TODO: Implement UI for user choice
        // For now, default to server wins
        Logger.sync.info("⚠️ User conflict resolution UI not implemented, defaulting to serverWins")
        return .serverWins
    }

    private func attemptHeroMerge(local: Hero, server: HeroResponse) async throws {
        Logger.sync.info("Attempting merge for hero: \(local.name)")

        // For Hero, merge is complex since most fields are user-edited
        // Default to server wins for safety
        try resolveHeroServerWins(local: local, server: server)
    }

    // MARK: - Story Conflicts

    func resolveStoryConflict(
        local: Story,
        server: StoryResponse,
        strategy: ConflictResolution = .userPrompt
    ) async throws {
        Logger.sync.info("🔄 Resolving conflict for story: \(local.title)")

        switch strategy {
        case .serverWins:
            try resolveStoryServerWins(local: local, server: server)

        case .localWins:
            try await resolveStoryLocalWins(local: local)

        case .userPrompt:
            let choice = await showStoryConflictUI(local: local, server: server)
            try await resolveStoryConflict(local: local, server: server, strategy: choice)

        case .merge:
            try await attemptStoryMerge(local: local, server: server)
        }
    }

    private func resolveStoryServerWins(local: Story, server: StoryResponse) throws {
        Logger.sync.info("Conflict resolved: Server wins for \(local.title)")

        local.updateFrom(server: server)
        local.serverSyncStatus = .synced
        local.lastSyncedAt = Date()
        local.pendingChanges = nil

        try cacheManager.save(local)
    }

    private func resolveStoryLocalWins(local: Story) async throws {
        Logger.sync.info("Conflict resolved: Local wins for \(local.title)")

        guard let serverId = local.serverId else {
            throw RepositoryError.notSynced
        }

        let request = StoryUpdateRequest(
            title: local.title,
            content: local.content,
            isFavorite: local.isFavorite
        )

        let endpoint = Endpoint.updateStory(id: UUID(uuidString: serverId)!, data: request)
        let response: APIResponse<StoryResponse> = try await apiClient.request(endpoint)

        guard let serverStory = response.data else {
            throw APIError.unknown(NSError(domain: "No data", code: -1))
        }

        local.serverUpdatedAt = serverStory.updatedAt
        local.serverSyncStatus = .synced
        local.lastSyncedAt = Date()
        local.pendingChanges = nil

        try cacheManager.save(local)
    }

    @MainActor
    private func showStoryConflictUI(local: Story, server: StoryResponse) async -> ConflictResolution {
        // TODO: Implement UI for user choice
        Logger.sync.info("⚠️ User conflict resolution UI not implemented, defaulting to serverWins")
        return .serverWins
    }

    private func attemptStoryMerge(local: Story, server: StoryResponse) async throws {
        Logger.sync.info("Attempting merge for story: \(local.title)")

        // For story content, merging is risky - default to user prompt
        // But since UI not implemented, default to server wins
        try resolveStoryServerWins(local: local, server: server)
    }

    // MARK: - Default Resolution by Entity Type

    func getDefaultStrategy(for entityType: Any.Type) -> ConflictResolution {
        switch entityType {
        case is Hero.Type:
            return .serverWins // Avatar may regenerate, server is source of truth

        case is Story.Type:
            return .userPrompt // User-created content, should ask user

        case is CustomStoryEvent.Type:
            return .localWins // User-created, local has priority

        case is StoryIllustration.Type:
            return .serverWins // Server generates, server is source

        default:
            return .serverWins // Conservative default
        }
    }
}
