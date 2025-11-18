//
//  SyncStatus.swift
//  InfiniteStories
//
//  Sync status tracking for offline-first architecture
//

import Foundation

/// Sync status for entities that synchronize with backend
enum SyncStatus: String, Codable {
    case synced        // ✅ Up-to-date with server
    case pendingCreate // 🔄 Created locally, not on server yet
    case pendingUpdate // 🔄 Modified locally, needs sync to server
    case pendingDelete // 🗑️ Deleted locally, needs server delete
    case failed        // ❌ Sync failed, will retry
    case conflict      // ⚠️ Server has newer version, needs resolution

    var displayName: String {
        switch self {
        case .synced:
            return "Synced"
        case .pendingCreate:
            return "Creating..."
        case .pendingUpdate:
            return "Updating..."
        case .pendingDelete:
            return "Deleting..."
        case .failed:
            return "Sync Failed"
        case .conflict:
            return "Conflict"
        }
    }

    var iconName: String {
        switch self {
        case .synced:
            return "checkmark.circle.fill"
        case .pendingCreate, .pendingUpdate:
            return "arrow.triangle.2.circlepath"
        case .pendingDelete:
            return "trash"
        case .failed:
            return "exclamationmark.triangle.fill"
        case .conflict:
            return "exclamationmark.arrow.triangle.2.circlepath"
        }
    }

    var needsSync: Bool {
        return self != .synced
    }
}

/// Protocol for entities that can sync with backend
protocol Syncable {
    var serverId: String? { get set }
    var serverSyncStatus: SyncStatus { get set }
    var lastSyncedAt: Date? { get set }
    var serverUpdatedAt: Date? { get set }
    var pendingChanges: Data? { get set }
    var syncError: String? { get set }

    var needsSync: Bool { get }
}

/// Pending changes storage for conflict resolution
struct PendingChanges: Codable {
    var changedFields: [String: AnyCodable]
    var timestamp: Date

    init(changedFields: [String: AnyCodable] = [:], timestamp: Date = Date()) {
        self.changedFields = changedFields
        self.timestamp = timestamp
    }
}

/// Type-erased Codable wrapper for heterogeneous dictionaries
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch value {
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let bool as Bool:
            try container.encode(bool)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        default:
            try container.encodeNil()
        }
    }
}
