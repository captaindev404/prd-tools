//
//  Story+Sync.swift
//  InfiniteStories
//
//  Sync metadata extension for Story model
//

import Foundation
import SwiftData

extension Story: Syncable {
    // Note: These properties should be added directly to Story.swift model definition
    // This extension provides the Syncable protocol conformance

    /// Server-assigned unique identifier
    @Attribute(.unique) var serverId: String? { get set }

    /// Current synchronization status
    var serverSyncStatus: SyncStatus {
        get { SyncStatus(rawValue: _serverSyncStatus) ?? .synced }
        set { _serverSyncStatus = newValue.rawValue }
    }
    private var _serverSyncStatus: String = SyncStatus.synced.rawValue

    /// Last successful sync timestamp
    var lastSyncedAt: Date? { get set }

    /// Server's last updated timestamp
    var serverUpdatedAt: Date? { get set }

    /// Pending changes for conflict resolution
    var pendingChanges: Data? { get set }

    /// Last sync error message
    var syncError: String? { get set }

    /// Computed property: true if needs sync
    var needsSync: Bool {
        return serverSyncStatus != .synced
    }

    // MARK: - Sync Operations

    /// Update local story with server data
    /// - Parameter server: Server response data
    func updateFrom(server: StoryResponse) {
        self.title = server.title
        self.content = server.content
        self.language = server.language
        self.isFavorite = server.isFavorite
        self.playCount = server.playCount

        // Update audio URL (R2 URL, not local path)
        self.audioFileName = server.audioUrl

        // Update sync metadata
        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.syncError = nil
        self.pendingChanges = nil

        Logger.sync.info("✅ Updated story from server: \(self.title)")
    }

    /// Record a pending change
    /// - Parameters:
    ///   - field: Field name
    ///   - newValue: New value
    func recordPendingChange(field: String, newValue: Any) throws {
        let encoder = JSONEncoder()
        let decoder = JSONDecoder()

        var changes: PendingChanges

        if let existingData = pendingChanges,
           let existing = try? decoder.decode(PendingChanges.self, from: existingData) {
            changes = existing
        } else {
            changes = PendingChanges()
        }

        changes.changedFields[field] = AnyCodable(newValue)
        changes.timestamp = Date()

        self.pendingChanges = try encoder.encode(changes)
    }

    /// Initialize story from server response
    /// - Parameters:
    ///   - server: Server response data
    ///   - hero: Associated hero (must be fetched separately)
    convenience init(from server: StoryResponse, hero: Hero) {
        self.init(
            title: server.title,
            content: server.content,
            hero: hero
        )

        self.serverId = server.id.uuidString
        self.language = server.language
        self.audioFileName = server.audioUrl
        self.isFavorite = server.isFavorite
        self.playCount = server.playCount
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.serverUpdatedAt = server.updatedAt

        // Set event type if exists
        if let eventType = server.eventType,
           let event = StoryEvent(rawValue: eventType) {
            self.builtInEvent = event
        }
    }
}
