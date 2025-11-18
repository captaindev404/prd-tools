//
//  CustomEventRepository.swift
//  InfiniteStories
//
//  Repository for CustomStoryEvent data access
//

import Foundation
import SwiftData

// MARK: - Protocol

protocol CustomEventRepositoryProtocol {
    func fetchAll() async throws -> [CustomStoryEvent]
    func fetch(id: UUID) async throws -> CustomStoryEvent?
    func create(_ event: CustomStoryEvent) async throws -> CustomStoryEvent
    func update(_ event: CustomStoryEvent) async throws -> CustomStoryEvent
    func delete(_ event: CustomStoryEvent) async throws
    func enhanceEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent
    func syncWithBackend() async throws
}

// MARK: - Implementation

class CustomEventRepository: CustomEventRepositoryProtocol {
    private let apiClient: APIClientProtocol
    private let cacheManager: CacheManagerProtocol

    init(apiClient: APIClientProtocol, cacheManager: CacheManagerProtocol) {
        self.apiClient = apiClient
        self.cacheManager = cacheManager
    }

    // MARK: - Read Operations

    func fetchAll() async throws -> [CustomStoryEvent] {
        let cached = try cacheManager.fetchAll(CustomStoryEvent.self)

        if FeatureFlags.enableCloudSync {
            Task {
                try? await syncWithBackend()
            }
        }

        return cached
    }

    func fetch(id: UUID) async throws -> CustomStoryEvent? {
        return try cacheManager.fetch(CustomStoryEvent.self, id: id)
    }

    // MARK: - Create Operation

    func create(_ event: CustomStoryEvent) async throws -> CustomStoryEvent {
        try cacheManager.save(event)
        event.serverSyncStatus = .pendingCreate

        Logger.repository.info("✅ Created custom event locally: \(event.title)")

        if FeatureFlags.useBackendAPI {
            Task {
                await syncEventToBackend(event)
            }
        }

        return event
    }

    private func syncEventToBackend(_ event: CustomStoryEvent) async {
        do {
            let request = CustomEventCreateRequest(
                title: event.title,
                description: event.eventDescription,
                promptSeed: event.promptSeed,
                category: event.category.rawValue,
                ageRange: event.ageRange.rawValue,
                tone: event.tone.rawValue
            )

            let endpoint = Endpoint.createCustomEvent(data: request)
            let response: APIResponse<CustomEventResponse> = try await apiClient.request(endpoint)

            guard let serverEvent = response.data else {
                throw APIError.unknown(NSError(domain: "No data", code: -1))
            }

            event.serverId = serverEvent.id.uuidString
            event.serverSyncStatus = .synced
            event.lastSyncedAt = Date()
            event.serverUpdatedAt = serverEvent.updatedAt
            try cacheManager.save(event)

            Logger.repository.info("✅ Synced custom event to backend: \(event.title)")

        } catch {
            event.serverSyncStatus = .failed
            event.syncError = error.localizedDescription
            try? cacheManager.save(event)

            Logger.repository.error("❌ Failed to sync custom event: \(error)")
        }
    }

    // MARK: - Update Operation

    func update(_ event: CustomStoryEvent) async throws -> CustomStoryEvent {
        try cacheManager.save(event)
        event.serverSyncStatus = .pendingUpdate

        Logger.repository.info("✅ Updated custom event locally: \(event.title)")

        if FeatureFlags.useBackendAPI {
            Task {
                await syncEventUpdateToBackend(event)
            }
        }

        return event
    }

    private func syncEventUpdateToBackend(_ event: CustomStoryEvent) async {
        guard let serverId = event.serverId else {
            Logger.repository.warning("⚠️ Custom event has no serverId: \(event.title)")
            return
        }

        do {
            let request = CustomEventUpdateRequest(
                title: event.title,
                description: event.eventDescription,
                promptSeed: event.promptSeed,
                usageCount: event.usageCount,
                isFavorite: event.isFavorite
            )

            let endpoint = Endpoint.updateCustomEvent(id: UUID(uuidString: serverId)!, data: request)
            let response: APIResponse<CustomEventResponse> = try await apiClient.request(endpoint)

            guard let serverEvent = response.data else {
                throw APIError.unknown(NSError(domain: "No data", code: -1))
            }

            event.serverSyncStatus = .synced
            event.lastSyncedAt = Date()
            event.serverUpdatedAt = serverEvent.updatedAt
            try cacheManager.save(event)

            Logger.repository.info("✅ Synced custom event update: \(event.title)")

        } catch {
            event.serverSyncStatus = .failed
            event.syncError = error.localizedDescription
            try? cacheManager.save(event)

            Logger.repository.error("❌ Failed to sync custom event: \(error)")
        }
    }

    // MARK: - Delete Operation

    func delete(_ event: CustomStoryEvent) async throws {
        event.serverSyncStatus = .pendingDelete
        try cacheManager.save(event)

        Logger.repository.info("🗑️ Marked custom event for deletion: \(event.title)")

        if FeatureFlags.useBackendAPI, let serverId = event.serverId {
            Task {
                await deleteEventFromBackend(event, serverId: serverId)
            }
        } else {
            try cacheManager.delete(event)
        }
    }

    private func deleteEventFromBackend(_ event: CustomStoryEvent, serverId: String) async {
        do {
            let endpoint = Endpoint.deleteCustomEvent(id: UUID(uuidString: serverId)!)
            let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

            try cacheManager.delete(event)

            Logger.repository.info("✅ Deleted custom event from backend: \(event.title)")

        } catch {
            event.serverSyncStatus = .failed
            event.syncError = error.localizedDescription
            try? cacheManager.save(event)

            Logger.repository.error("❌ Failed to delete custom event: \(error)")
        }
    }

    // MARK: - Enhancement Operations

    func enhanceEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent {
        guard FeatureFlags.useBackendAPI else {
            throw RepositoryError.featureNotEnabled
        }

        guard let serverId = event.serverId,
              let eventId = UUID(uuidString: serverId) else {
            throw RepositoryError.notSynced
        }

        Logger.repository.info("✨ Enhancing custom event: \(event.title)")

        let endpoint = Endpoint.enhanceCustomEvent(id: eventId)
        let response: APIResponse<CustomEventResponse> = try await apiClient.request(endpoint)

        guard let serverEvent = response.data else {
            throw APIError.unknown(NSError(domain: "No data", code: -1))
        }

        // Update with enhanced data
        event.updateFrom(server: serverEvent)
        try cacheManager.save(event)

        Logger.repository.info("✅ Enhanced custom event: \(event.title)")

        return event
    }

    // MARK: - Sync Operations

    func syncWithBackend() async throws {
        Logger.repository.info("🔄 Syncing custom events from backend...")

        let endpoint = Endpoint.getCustomEvents(limit: 100, offset: 0)
        let response: APIResponse<[CustomEventResponse]> = try await apiClient.request(endpoint)

        guard let serverEvents = response.data else {
            Logger.repository.warning("No custom events from server")
            return
        }

        Logger.repository.info("📥 Received \(serverEvents.count) custom events")

        for serverEvent in serverEvents {
            if let localEvent = try cacheManager.fetch(CustomStoryEvent.self, serverId: serverEvent.id.uuidString) {
                if localEvent.needsSync {
                    localEvent.serverSyncStatus = .conflict
                    try cacheManager.save(localEvent)
                } else {
                    localEvent.updateFrom(server: serverEvent)
                    try cacheManager.save(localEvent)
                }
            } else {
                let newEvent = CustomStoryEvent(from: serverEvent)
                try cacheManager.save(newEvent)
            }
        }

        Logger.repository.info("✅ Custom event sync completed")
    }
}
