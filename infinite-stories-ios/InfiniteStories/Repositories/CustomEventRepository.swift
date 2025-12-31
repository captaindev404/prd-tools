//
//  CustomEventRepository.swift
//  InfiniteStories
//
//  Custom event data access - API-only (no local persistence)
//

import Foundation

// MARK: - Custom Event Repository Protocol

protocol CustomEventRepositoryProtocol {
    func fetchCustomEvents() async throws -> [CustomStoryEvent]
    func fetchCustomEvent(id: String) async throws -> CustomStoryEvent
    func createCustomEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent
    func updateCustomEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent
    func deleteCustomEvent(_ event: CustomStoryEvent) async throws
    func enhanceEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent
}

// MARK: - Custom Event Repository Implementation

@MainActor
class CustomEventRepository: CustomEventRepositoryProtocol {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    // MARK: - Fetch Operations

    func fetchCustomEvents() async throws -> [CustomStoryEvent] {
        // Check network first
        guard NetworkMonitor.shared.isConnected else {
            throw APIError.networkUnavailable
        }

        Logger.api.info("Fetching custom events from backend")

        // Call API - backend wraps response in { data: { customEvents: [...] } }
        let wrapper: CustomEventsListWrapper = try await apiClient.request(
            .getCustomEvents(limit: 100, offset: 0)
        )

        // Convert API response to CustomStoryEvent models
        let events = wrapper.data.customEvents.map { $0.toCustomStoryEvent() }
        Logger.api.success("Fetched \(events.count) custom events")

        return events
    }

    func fetchCustomEvent(id: String) async throws -> CustomStoryEvent {
        guard NetworkMonitor.shared.isConnected else {
            throw APIError.networkUnavailable
        }

        Logger.api.info("Fetching custom event \(id)")

        let response: APIResponse<CustomEventResponse> = try await apiClient.request(
            .getCustomEvent(id: id)
        )

        guard let data = response.data else {
            throw APIError.notFound
        }

        let event = data.toCustomStoryEvent()
        Logger.api.success("Fetched custom event: \(event.title)")

        return event
    }

    // MARK: - Create Operation

    func createCustomEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent {
        guard NetworkMonitor.shared.isConnected else {
            throw APIError.networkUnavailable
        }

        Logger.api.info("Creating custom event: \(event.title)")

        // Build request
        let request = CustomEventCreateRequest(
            title: event.title,
            description: event.description,
            promptSeed: event.promptSeed,
            category: event.category,
            ageRange: event.ageRange,
            tone: event.tone
        )

        // Call API
        let response: APIResponse<CustomEventResponse> = try await apiClient.request(
            .createCustomEvent(data: request)
        )

        guard let data = response.data else {
            throw APIError.unknown(NSError(
                domain: "CustomEventRepository",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "No data in create response"]
            ))
        }

        let createdEvent = data.toCustomStoryEvent()
        Logger.api.success("Created custom event: \(createdEvent.title) (ID: \(createdEvent.id))")

        return createdEvent
    }

    // MARK: - Update Operation

    func updateCustomEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent {
        guard NetworkMonitor.shared.isConnected else {
            throw APIError.networkUnavailable
        }

        Logger.api.info("Updating custom event \(event.id)")

        // Build request with only the fields we want to update
        let request = CustomEventUpdateRequest(
            title: event.title,
            description: event.description,
            promptSeed: event.promptSeed,
            usageCount: event.usageCount,
            isFavorite: event.isFavorite
        )

        // Call API
        let response: APIResponse<CustomEventResponse> = try await apiClient.request(
            .updateCustomEvent(id: event.id, data: request)
        )

        guard let data = response.data else {
            throw APIError.unknown(NSError(
                domain: "CustomEventRepository",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "No data in update response"]
            ))
        }

        let updatedEvent = data.toCustomStoryEvent()
        Logger.api.success("Updated custom event: \(updatedEvent.title)")

        return updatedEvent
    }

    // MARK: - Delete Operation

    func deleteCustomEvent(_ event: CustomStoryEvent) async throws {
        guard NetworkMonitor.shared.isConnected else {
            throw APIError.networkUnavailable
        }

        Logger.api.info("Deleting custom event \(event.id)")

        // Call API
        try await apiClient.requestVoid(.deleteCustomEvent(id: event.id))

        Logger.api.success("Deleted custom event \(event.id)")
    }

    // MARK: - AI Enhancement

    func enhanceEvent(_ event: CustomStoryEvent) async throws -> CustomStoryEvent {
        guard NetworkMonitor.shared.isConnected else {
            throw APIError.networkUnavailable
        }

        Logger.api.info("Enhancing custom event \(event.id)")

        // Call API
        let response: APIResponse<CustomEventResponse> = try await apiClient.request(
            .enhanceCustomEvent(id: event.id),
            retryPolicy: .aggressive // Enhancement is a longer operation
        )

        guard let data = response.data else {
            throw APIError.unknown(NSError(
                domain: "CustomEventRepository",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "No data in enhance response"]
            ))
        }

        let enhancedEvent = data.toCustomStoryEvent()
        Logger.api.success("Enhanced custom event: \(enhancedEvent.title)")

        return enhancedEvent
    }
}
