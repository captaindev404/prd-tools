//
//  BackgroundSyncManager.swift
//  InfiniteStories
//
//  Background sync manager with BGTaskScheduler integration
//

import Foundation
import BackgroundTasks
import Combine

// MARK: - Background Sync Manager

@MainActor
class BackgroundSyncManager: ObservableObject {
    static let taskIdentifier = "com.infinitestories.sync"
    static let shared = BackgroundSyncManager()

    @Published var isSyncing = false
    @Published var lastSyncAt: Date?
    @Published var syncError: Error?

    private let syncEngine: SyncEngineProtocol
    private var syncTimer: Timer?
    private var observers: [NSObjectProtocol] = []

    init(syncEngine: SyncEngineProtocol? = nil) {
        // Use provided sync engine or create default
        if let engine = syncEngine {
            self.syncEngine = engine
        } else {
            let apiClient = APIClient.shared
            let cacheManager = CacheManager(modelContext: /* default context */)
            let conflictResolver = ConflictResolver(apiClient: apiClient, cacheManager: cacheManager)
            self.syncEngine = SyncEngine(apiClient: apiClient, cacheManager: cacheManager, conflictResolver: conflictResolver)
        }

        setupObservers()
        registerBackgroundTask()
    }

    deinit {
        observers.forEach { NotificationCenter.default.removeObserver($0) }
        syncTimer?.invalidate()
    }

    // MARK: - Observers Setup

    private func setupObservers() {
        // App foreground
        let foregroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Logger.sync.info("📱 App entered foreground, triggering sync")
            Task {
                await self?.performSync()
            }
        }
        observers.append(foregroundObserver)

        // Network available
        let networkObserver = NotificationCenter.default.addObserver(
            forName: .networkAvailable,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Logger.sync.info("📶 Network available, triggering sync")
            Task {
                await self?.performSync()
            }
        }
        observers.append(networkObserver)

        // App background
        let backgroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didEnterBackgroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.scheduleBackgroundSync()
        }
        observers.append(backgroundObserver)
    }

    // MARK: - Background Task

    func registerBackgroundTask() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.taskIdentifier,
            using: nil
        ) { [weak self] task in
            guard let self = self else { return }
            Task {
                await self.handleBackgroundSync(task: task as! BGAppRefreshTask)
            }
        }

        Logger.sync.info("✅ Registered background task: \(Self.taskIdentifier)")
    }

    func scheduleBackgroundSync() {
        guard FeatureFlags.enableBackgroundSync else {
            Logger.sync.debug("Background sync disabled")
            return
        }

        let request = BGAppRefreshTaskRequest(identifier: Self.taskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: FeatureFlags.syncInterval)

        do {
            try BGTaskScheduler.shared.submit(request)
            Logger.sync.info("📅 Scheduled background sync in \(FeatureFlags.syncInterval)s")
        } catch {
            Logger.sync.error("❌ Failed to schedule background sync: \(error)")
        }
    }

    private func handleBackgroundSync(task: BGAppRefreshTask) async {
        // Schedule next background sync
        scheduleBackgroundSync()

        // Set expiration handler
        task.expirationHandler = {
            Logger.sync.warning("⏰ Background sync task expired")
            task.setTaskCompleted(success: false)
        }

        // Perform sync
        do {
            try await syncEngine.syncAll()
            task.setTaskCompleted(success: true)
            Logger.sync.info("✅ Background sync completed successfully")

        } catch {
            Logger.sync.error("❌ Background sync failed: \(error)")
            task.setTaskCompleted(success: false)
        }
    }

    // MARK: - Foreground Sync

    func performSync() async {
        guard !isSyncing else {
            Logger.sync.info("Sync already in progress")
            return
        }

        isSyncing = true
        syncError = nil

        defer {
            Task { @MainActor in
                isSyncing = false
            }
        }

        do {
            try await syncEngine.syncAll()

            await MainActor.run {
                lastSyncAt = Date()
            }

            Logger.sync.info("✅ Foreground sync successful")

        } catch {
            await MainActor.run {
                syncError = error
            }

            Logger.sync.error("❌ Foreground sync failed: \(error)")
        }
    }

    func syncNow() async {
        await performSync()
    }

    // MARK: - Periodic Sync

    func startPeriodicSync() {
        stopPeriodicSync()

        guard FeatureFlags.enableBackgroundSync else {
            Logger.sync.debug("Periodic sync disabled")
            return
        }

        let interval = FeatureFlags.syncInterval

        syncTimer = Timer.scheduledTimer(
            withTimeInterval: interval,
            repeats: true
        ) { [weak self] _ in
            Task {
                await self?.performSync()
            }
        }

        Logger.sync.info("📅 Started periodic sync (interval: \(interval)s)")
    }

    func stopPeriodicSync() {
        syncTimer?.invalidate()
        syncTimer = nil
        Logger.sync.debug("Stopped periodic sync")
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let networkAvailable = Notification.Name("networkAvailable")
    static let syncCompleted = Notification.Name("syncCompleted")
    static let syncFailed = Notification.Name("syncFailed")
}
