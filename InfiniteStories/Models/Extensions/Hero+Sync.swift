//
//  Hero+Sync.swift
//  InfiniteStories
//
//  Sync metadata extension for Hero model
//

import Foundation
import SwiftData

extension Hero: Syncable {
    // Note: These properties should be added directly to Hero.swift model definition
    // This extension provides the Syncable protocol conformance

    /// Server-assigned unique identifier (UUID from backend)
    @Attribute(.unique) var serverId: String? { get set }

    /// Current synchronization status
    var serverSyncStatus: SyncStatus {
        get { SyncStatus(rawValue: _serverSyncStatus) ?? .synced }
        set { _serverSyncStatus = newValue.rawValue }
    }
    private var _serverSyncStatus: String = SyncStatus.synced.rawValue

    /// Last successful sync timestamp
    var lastSyncedAt: Date? { get set }

    /// Server's last updated timestamp (for conflict detection)
    var serverUpdatedAt: Date? { get set }

    /// Pending changes (JSON encoded) for conflict resolution
    var pendingChanges: Data? { get set }

    /// Last sync error message
    var syncError: String? { get set }

    /// Computed property: true if entity needs sync
    var needsSync: Bool {
        return serverSyncStatus != .synced
    }

    // MARK: - Sync Operations

    /// Update local hero with server data
    /// - Parameter server: Server response data
    func updateFrom(server: HeroResponse) {
        self.name = server.name
        self.age = server.age
        self.traits = server.traits.compactMap { CharacterTrait(rawValue: $0) }

        if let specialAbilities = server.specialAbilities {
            self.specialAbility = specialAbilities.first // iOS currently supports single ability
        }

        self.avatarImagePath = server.avatarUrl
        self.avatarGenerationId = server.avatarGenerationId

        // Update sync metadata
        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.syncError = nil
        self.pendingChanges = nil

        Logger.sync.info("✅ Updated hero from server: \(self.name)")
    }

    /// Record a pending change for conflict resolution
    /// - Parameters:
    ///   - field: Field name that changed
    ///   - newValue: New value for the field
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

    /// Initialize hero from server response
    /// - Parameter server: Server response data
    convenience init(from server: HeroResponse) {
        self.init(
            name: server.name,
            age: server.age,
            traits: server.traits.compactMap { CharacterTrait(rawValue: $0) }
        )

        if let specialAbilities = server.specialAbilities {
            self.specialAbility = specialAbilities.first
        }

        self.serverId = server.id.uuidString
        self.avatarImagePath = server.avatarUrl
        self.avatarGenerationId = server.avatarGenerationId
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.serverUpdatedAt = server.updatedAt
    }
}
