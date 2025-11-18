//
//  CustomStoryEvent+Sync.swift
//  InfiniteStories
//
//  Sync metadata extension for CustomStoryEvent model
//

import Foundation
import SwiftData

extension CustomStoryEvent: Syncable {
    @Attribute(.unique) var serverId: String? { get set }

    var serverSyncStatus: SyncStatus {
        get { SyncStatus(rawValue: _serverSyncStatus) ?? .synced }
        set { _serverSyncStatus = newValue.rawValue }
    }
    private var _serverSyncStatus: String = SyncStatus.synced.rawValue

    var lastSyncedAt: Date? { get set }
    var serverUpdatedAt: Date? { get set }
    var pendingChanges: Data? { get set }
    var syncError: String? { get set }

    var needsSync: Bool {
        return serverSyncStatus != .synced
    }

    func updateFrom(server: CustomEventResponse) {
        self.title = server.title
        self.eventDescription = server.description
        self.promptSeed = server.promptSeed
        self.usageCount = server.usageCount
        self.isFavorite = server.isFavorite

        // Update category, ageRange, tone
        if let category = EventCategory(rawValue: server.category) {
            self.category = category
        }
        if let ageRange = server.ageRange, let range = AgeRange(rawValue: ageRange) {
            self.ageRange = range
        }
        if let tone = EventTone(rawValue: server.tone) {
            self.tone = tone
        }

        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.syncError = nil

        Logger.sync.info("✅ Updated custom event from server: \(self.title)")
    }

    convenience init(from server: CustomEventResponse) {
        self.init(
            title: server.title,
            eventDescription: server.description,
            promptSeed: server.promptSeed
        )

        self.serverId = server.id.uuidString
        self.usageCount = server.usageCount
        self.isFavorite = server.isFavorite

        if let category = EventCategory(rawValue: server.category) {
            self.category = category
        }
        if let ageRange = server.ageRange, let range = AgeRange(rawValue: ageRange) {
            self.ageRange = range
        }
        if let tone = EventTone(rawValue: server.tone) {
            self.tone = tone
        }

        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.serverUpdatedAt = server.updatedAt
    }
}
