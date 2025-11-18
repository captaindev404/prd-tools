//
//  SyncQueue.swift
//  InfiniteStories
//
//  Manages queued sync operations with retry logic and priority handling
//

import Foundation

// MARK: - Sync Operation

struct SyncOperation: Identifiable, Codable {
    let id: UUID
    let entityType: EntityType
    let entityId: UUID
    let operationType: OperationType
    let priority: Priority
    let createdAt: Date
    var attemptCount: Int
    var lastAttemptAt: Date?
    var error: String?

    enum EntityType: String, Codable {
        case hero
        case story
        case storyIllustration
        case customEvent
    }

    enum OperationType: String, Codable {
        case create
        case update
        case delete
    }

    enum Priority: Int, Codable, Comparable {
        case low = 0
        case medium = 1
        case high = 2
        case critical = 3

        static func < (lhs: Priority, rhs: Priority) -> Bool {
            return lhs.rawValue < rhs.rawValue
        }
    }

    init(
        entityType: EntityType,
        entityId: UUID,
        operationType: OperationType,
        priority: Priority = .medium
    ) {
        self.id = UUID()
        self.entityType = entityType
        self.entityId = entityId
        self.operationType = operationType
        self.priority = priority
        self.createdAt = Date()
        self.attemptCount = 0
        self.lastAttemptAt = nil
        self.error = nil
    }
}

// MARK: - Sync Queue

actor SyncQueue {
    private var operations: [SyncOperation] = []
    private var isProcessing = false
    private let maxRetries = 5
    private let persistenceKey = "com.infinitestories.syncqueue"

    // MARK: - Initialization

    init() {
        Task {
            await loadPersistedOperations()
        }
    }

    // MARK: - Queue Management

    /// Add operation to the queue
    func enqueue(_ operation: SyncOperation) {
        // Check if operation already exists
        if operations.contains(where: {
            $0.entityType == operation.entityType &&
            $0.entityId == operation.entityId &&
            $0.operationType == operation.operationType
        }) {
            Logger.sync.debug("Operation already queued: \(operation.entityType) \(operation.operationType)")
            return
        }

        operations.append(operation)
        operations.sort { $0.priority > $1.priority }

        Logger.sync.info("📝 Queued \(operation.operationType) for \(operation.entityType): \(operation.entityId)")

        Task {
            await persistOperations()
        }
    }

    /// Remove operation from queue
    func dequeue(_ operationId: UUID) {
        operations.removeAll { $0.id == operationId }

        Task {
            await persistOperations()
        }
    }

    /// Get all queued operations
    func getAllOperations() -> [SyncOperation] {
        return operations
    }

    /// Get operations ready for processing (not recently failed)
    func getReadyOperations() -> [SyncOperation] {
        let now = Date()

        return operations.filter { operation in
            // Skip if max retries exceeded
            guard operation.attemptCount < maxRetries else { return false }

            // Skip if recently attempted (exponential backoff)
            if let lastAttempt = operation.lastAttemptAt {
                let backoffDelay = calculateBackoffDelay(attemptCount: operation.attemptCount)
                let nextAttemptTime = lastAttempt.addingTimeInterval(backoffDelay)

                if now < nextAttemptTime {
                    return false
                }
            }

            return true
        }
    }

    /// Get count of operations by entity type
    func getOperationCount(for entityType: SyncOperation.EntityType) -> Int {
        return operations.filter { $0.entityType == entityType }.count
    }

    /// Get total operation count
    func getTotalCount() -> Int {
        return operations.count
    }

    /// Mark operation as attempted
    func markAttempted(_ operationId: UUID, error: String?) {
        if let index = operations.firstIndex(where: { $0.id == operationId }) {
            operations[index].attemptCount += 1
            operations[index].lastAttemptAt = Date()
            operations[index].error = error

            if operations[index].attemptCount >= maxRetries {
                Logger.sync.error("❌ Operation exceeded max retries: \(operations[index].entityType) \(operations[index].operationType)")
            }

            Task {
                await persistOperations()
            }
        }
    }

    /// Clear all operations (e.g., after successful full sync)
    func clearAll() {
        operations.removeAll()

        Task {
            await persistOperations()
        }

        Logger.sync.info("🧹 Cleared all queued operations")
    }

    /// Clear operations that exceeded max retries
    func clearFailedOperations() {
        let failedCount = operations.filter { $0.attemptCount >= maxRetries }.count
        operations.removeAll { $0.attemptCount >= maxRetries }

        if failedCount > 0 {
            Logger.sync.info("🧹 Cleared \(failedCount) failed operations")

            Task {
                await persistOperations()
            }
        }
    }

    // MARK: - Processing State

    func setProcessing(_ processing: Bool) {
        isProcessing = processing
    }

    func getIsProcessing() -> Bool {
        return isProcessing
    }

    // MARK: - Backoff Calculation

    private func calculateBackoffDelay(attemptCount: Int) -> TimeInterval {
        // Exponential backoff: 2^n seconds, capped at 5 minutes
        let baseDelay: TimeInterval = 2.0
        let maxDelay: TimeInterval = 300.0 // 5 minutes

        let delay = min(pow(baseDelay, Double(attemptCount)), maxDelay)

        // Add jitter (±20%)
        let jitter = delay * Double.random(in: 0.8...1.2)

        return jitter
    }

    // MARK: - Persistence

    private func persistOperations() async {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(operations)

            UserDefaults.standard.set(data, forKey: persistenceKey)

            Logger.sync.debug("💾 Persisted \(operations.count) queued operations")

        } catch {
            Logger.sync.error("❌ Failed to persist operations: \(error)")
        }
    }

    private func loadPersistedOperations() async {
        guard let data = UserDefaults.standard.data(forKey: persistenceKey) else {
            Logger.sync.debug("No persisted operations found")
            return
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            operations = try decoder.decode([SyncOperation].self, from: data)

            // Sort by priority
            operations.sort { $0.priority > $1.priority }

            Logger.sync.info("📂 Loaded \(operations.count) persisted operations")

        } catch {
            Logger.sync.error("❌ Failed to load persisted operations: \(error)")
        }
    }

    // MARK: - Statistics

    func getStatistics() -> QueueStatistics {
        let total = operations.count
        let ready = getReadyOperations().count
        let failed = operations.filter { $0.attemptCount >= maxRetries }.count
        let pending = total - ready - failed

        let byType = Dictionary(grouping: operations) { $0.entityType }
            .mapValues { $0.count }

        let byOperation = Dictionary(grouping: operations) { $0.operationType }
            .mapValues { $0.count }

        return QueueStatistics(
            total: total,
            ready: ready,
            pending: pending,
            failed: failed,
            byType: byType,
            byOperation: byOperation
        )
    }
}

// MARK: - Queue Statistics

struct QueueStatistics {
    let total: Int
    let ready: Int
    let pending: Int
    let failed: Int
    let byType: [SyncOperation.EntityType: Int]
    let byOperation: [SyncOperation.OperationType: Int]

    var description: String {
        """
        Queue Statistics:
        - Total: \(total)
        - Ready: \(ready)
        - Pending: \(pending)
        - Failed: \(failed)
        By Type: \(byType)
        By Operation: \(byOperation)
        """
    }
}

// MARK: - Shared Instance

extension SyncQueue {
    static let shared = SyncQueue()
}
