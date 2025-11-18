//
//  CacheManager.swift
//  InfiniteStories
//
//  SwiftData cache manager with sync metadata support
//

import Foundation
import SwiftData

// MARK: - Protocol

protocol CacheManagerProtocol {
    func save<T: PersistentModel>(_ object: T) throws
    func fetch<T: PersistentModel>(_ type: T.Type, id: UUID) throws -> T?
    func fetchAll<T: PersistentModel>(_ type: T.Type) throws -> [T]
    func delete<T: PersistentModel>(_ object: T) throws
    func markForSync<T: PersistentModel & Syncable>(_ object: T, status: SyncStatus) throws
    func fetchPendingSync<T: PersistentModel & Syncable>(_ type: T.Type, status: SyncStatus?) throws -> [T]
}

// MARK: - Implementation

class CacheManager: CacheManagerProtocol {
    private let modelContext: ModelContext

    /// Shared singleton instance (will be initialized with app's model context)
    static var shared: CacheManager!

    /// Initialize cache manager
    /// - Parameter modelContext: SwiftData model context
    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    // MARK: - CRUD Operations

    /// Save object to cache
    /// - Parameter object: Object to save
    /// - Throws: Error if save fails
    func save<T: PersistentModel>(_ object: T) throws {
        modelContext.insert(object)
        try modelContext.save()

        Logger.cache.debug("✅ Saved \(type(of: object)) to cache")
    }

    /// Fetch object by ID
    /// - Parameters:
    ///   - type: Object type
    ///   - id: Object ID
    /// - Returns: Object if found, nil otherwise
    /// - Throws: Error if fetch fails
    func fetch<T: PersistentModel>(_ type: T.Type, id: UUID) throws -> T? {
        // Note: This implementation assumes all PersistentModels have an 'id' property
        // For now, we'll use a generic approach
        let descriptor = FetchDescriptor<T>()
        let results = try modelContext.fetch(descriptor)

        // Filter by ID manually since we can't use #Predicate generically
        return results.first { object in
            if let identifiable = object as? any Identifiable,
               let objectId = identifiable.id as? UUID {
                return objectId == id
            }
            return false
        }
    }

    /// Fetch all objects of type
    /// - Parameter type: Object type
    /// - Returns: Array of objects
    /// - Throws: Error if fetch fails
    func fetchAll<T: PersistentModel>(_ type: T.Type) throws -> [T] {
        let descriptor = FetchDescriptor<T>()
        return try modelContext.fetch(descriptor)
    }

    /// Delete object from cache
    /// - Parameter object: Object to delete
    /// - Throws: Error if delete fails
    func delete<T: PersistentModel>(_ object: T) throws {
        modelContext.delete(object)
        try modelContext.save()

        Logger.cache.debug("🗑️ Deleted \(type(of: object)) from cache")
    }

    // MARK: - Sync Operations

    /// Mark object for sync with specific status
    /// - Parameters:
    ///   - object: Object to mark
    ///   - status: Sync status to set
    /// - Throws: Error if save fails
    func markForSync<T: PersistentModel & Syncable>(
        _ object: T,
        status: SyncStatus
    ) throws {
        object.serverSyncStatus = status
        try modelContext.save()

        Logger.cache.debug("Marked \(type(of: object)) as \(status.displayName)")
    }

    /// Fetch objects with specific sync status
    /// - Parameters:
    ///   - type: Object type
    ///   - status: Sync status to filter by (nil = all non-synced)
    /// - Returns: Array of objects with matching sync status
    /// - Throws: Error if fetch fails
    func fetchPendingSync<T: PersistentModel & Syncable>(
        _ type: T.Type,
        status: SyncStatus? = nil
    ) throws -> [T] {
        let descriptor = FetchDescriptor<T>()
        let results = try modelContext.fetch(descriptor)

        // Filter by sync status manually
        let filtered = results.filter { object in
            if let status = status {
                return object.serverSyncStatus == status
            } else {
                return object.serverSyncStatus != .synced
            }
        }

        Logger.cache.debug("Found \(filtered.count) \(type) with status \(status?.displayName ?? "pending")")

        return filtered
    }

    /// Fetch object by server ID
    /// - Parameters:
    ///   - type: Object type
    ///   - serverId: Server-assigned ID
    /// - Returns: Object if found, nil otherwise
    /// - Throws: Error if fetch fails
    func fetch<T: PersistentModel & Syncable>(
        _ type: T.Type,
        serverId: String
    ) throws -> T? {
        let descriptor = FetchDescriptor<T>()
        let results = try modelContext.fetch(descriptor)

        // Filter by server ID manually
        return results.first { object in
            return object.serverId == serverId
        }
    }

    // MARK: - Batch Operations

    /// Save multiple objects in a single transaction
    /// - Parameter objects: Objects to save
    /// - Throws: Error if save fails
    func saveBatch<T: PersistentModel>(_ objects: [T]) throws {
        for object in objects {
            modelContext.insert(object)
        }
        try modelContext.save()

        Logger.cache.debug("✅ Batch saved \(objects.count) \(type(of: objects.first!))")
    }

    /// Delete multiple objects in a single transaction
    /// - Parameter objects: Objects to delete
    /// - Throws: Error if delete fails
    func deleteBatch<T: PersistentModel>(_ objects: [T]) throws {
        for object in objects {
            modelContext.delete(object)
        }
        try modelContext.save()

        Logger.cache.debug("🗑️ Batch deleted \(objects.count) \(type(of: objects.first!))")
    }

    // MARK: - Cache Policies

    /// Fetch with specific cache policy
    /// - Parameters:
    ///   - type: Object type
    ///   - policy: Cache policy
    ///   - networkFetch: Network fetch closure for cache-miss scenarios
    /// - Returns: Array of objects
    func fetch<T: PersistentModel>(
        _ type: T.Type,
        policy: CachePolicy,
        networkFetch: @escaping () async throws -> [T]
    ) async throws -> [T] {
        switch policy {
        case .cacheOnly:
            return try fetchAll(type)

        case .networkOnly:
            return try await networkFetch()

        case .cacheFirst:
            let cached = try fetchAll(type)
            if !cached.isEmpty {
                return cached
            }
            return try await networkFetch()

        case .networkFirst:
            do {
                return try await networkFetch()
            } catch {
                Logger.cache.info("Network fetch failed, using cache: \(error)")
                return try fetchAll(type)
            }

        case .cacheAndNetwork:
            let cached = try fetchAll(type)

            // Fetch from network in background
            Task {
                _ = try? await networkFetch()
            }

            return cached
        }
    }
}

// MARK: - Cache Policy

enum CachePolicy {
    case cacheOnly          // Never fetch from network
    case networkOnly        // Never use cache
    case cacheFirst         // Try cache, fallback to network
    case networkFirst       // Try network, fallback to cache
    case cacheAndNetwork    // Return cache, update from network in background
}
