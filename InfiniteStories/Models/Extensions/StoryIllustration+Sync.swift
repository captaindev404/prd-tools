//
//  StoryIllustration+Sync.swift
//  InfiniteStories
//
//  Sync metadata extension for StoryIllustration model
//

import Foundation
import SwiftData

extension StoryIllustration: Syncable {
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

    func updateFrom(server: StoryIllustrationResponse) {
        self.imagePath = server.imageUrl
        self.imagePrompt = server.imagePrompt
        self.displayOrder = server.displayOrder
        self.timestamp = server.audioTimestamp
        self.generationId = server.generationId
        self.previousGenerationId = server.previousGenerationId
        self.generationStatus = server.generationStatus

        self.serverUpdatedAt = server.updatedAt
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.syncError = nil

        Logger.sync.info("✅ Updated illustration from server: order \(self.displayOrder)")
    }

    convenience init(from server: StoryIllustrationResponse, story: Story) {
        self.init(
            timestamp: server.audioTimestamp,
            imagePrompt: server.imagePrompt,
            story: story
        )

        self.serverId = server.id.uuidString
        self.imagePath = server.imageUrl
        self.displayOrder = server.displayOrder
        self.generationId = server.generationId
        self.previousGenerationId = server.previousGenerationId
        self.generationStatus = server.generationStatus
        self.serverSyncStatus = .synced
        self.lastSyncedAt = Date()
        self.serverUpdatedAt = server.updatedAt
    }
}
