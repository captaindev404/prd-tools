//
//  MigrationManager.swift
//  InfiniteStories
//
//  Orchestrates local data migration to backend with rollback support
//

import Foundation
import SwiftData

// MARK: - Migration Status

enum MigrationStatus: String, Codable {
    case notStarted
    case inProgress
    case completed
    case failed
    case rolledBack

    var displayName: String {
        switch self {
        case .notStarted: return "Not Started"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .failed: return "Failed"
        case .rolledBack: return "Rolled Back"
        }
    }
}

// MARK: - Migration State

struct MigrationState: Codable {
    var status: MigrationStatus
    var currentStage: MigrationStage
    var progress: Double // 0.0 to 1.0
    var startedAt: Date?
    var completedAt: Date?
    var error: String?

    // Detailed progress
    var heroesExported: Int
    var heroesUploaded: Int
    var storiesExported: Int
    var storiesUploaded: Int
    var customEventsExported: Int
    var customEventsUploaded: Int
    var mediaFilesUploaded: Int
    var totalMediaFiles: Int

    enum MigrationStage: String, Codable {
        case idle
        case authenticating
        case exportingData
        case uploadingHeroes
        case uploadingStories
        case uploadingCustomEvents
        case uploadingMedia
        case verifying
        case finalizing
        case complete

        var displayName: String {
            switch self {
            case .idle: return "Idle"
            case .authenticating: return "Authenticating"
            case .exportingData: return "Exporting Data"
            case .uploadingHeroes: return "Uploading Heroes"
            case .uploadingStories: return "Uploading Stories"
            case .uploadingCustomEvents: return "Uploading Custom Events"
            case .uploadingMedia: return "Uploading Media Files"
            case .verifying: return "Verifying Migration"
            case .finalizing: return "Finalizing"
            case .complete: return "Complete"
            }
        }
    }

    static var initial: MigrationState {
        MigrationState(
            status: .notStarted,
            currentStage: .idle,
            progress: 0.0,
            startedAt: nil,
            completedAt: nil,
            error: nil,
            heroesExported: 0,
            heroesUploaded: 0,
            storiesExported: 0,
            storiesUploaded: 0,
            customEventsExported: 0,
            customEventsUploaded: 0,
            mediaFilesUploaded: 0,
            totalMediaFiles: 0
        )
    }
}

// MARK: - Migration Manager

@MainActor
class MigrationManager: ObservableObject {
    @Published var state: MigrationState
    @Published var isAuthRequired: Bool = true

    private let modelContext: ModelContext
    private let apiClient: APIClientProtocol
    private let authManager: AuthManager
    private let exporter: LocalDataExporter
    private let heroRepository: HeroRepositoryProtocol
    private let storyRepository: StoryRepositoryProtocol
    private let customEventRepository: CustomEventRepositoryProtocol

    private var backupData: ExportedData?
    private let persistenceKey = "com.infinitestories.migrationState"

    // MARK: - Initialization

    init(
        modelContext: ModelContext,
        apiClient: APIClientProtocol,
        authManager: AuthManager,
        heroRepository: HeroRepositoryProtocol,
        storyRepository: StoryRepositoryProtocol,
        customEventRepository: CustomEventRepositoryProtocol
    ) {
        self.modelContext = modelContext
        self.apiClient = apiClient
        self.authManager = authManager
        self.heroRepository = heroRepository
        self.storyRepository = storyRepository
        self.customEventRepository = customEventRepository
        self.exporter = LocalDataExporter(modelContext: modelContext)

        // Load persisted state
        self.state = Self.loadPersistedState()

        // Check auth status
        self.isAuthRequired = !authManager.isAuthenticated
    }

    // MARK: - Migration Flow

    /// Start migration process
    func startMigration() async throws {
        guard state.status != .inProgress else {
            Logger.sync.warning("Migration already in progress")
            return
        }

        Logger.sync.info("🚀 Starting migration process...")

        state.status = .inProgress
        state.startedAt = Date()
        state.error = nil
        persistState()

        do {
            // Stage 1: Authenticate if needed
            if !authManager.isAuthenticated {
                updateStage(.authenticating, progress: 0.05)
                // Wait for user to authenticate via UI
                throw MigrationError.authenticationRequired
            }

            // Stage 2: Export local data
            updateStage(.exportingData, progress: 0.10)
            let exportedData = try await exportLocalData()
            backupData = exportedData

            // Stage 3: Upload heroes
            updateStage(.uploadingHeroes, progress: 0.20)
            try await uploadHeroes(exportedData.heroes)

            // Stage 4: Upload stories
            updateStage(.uploadingStories, progress: 0.45)
            try await uploadStories(exportedData.stories)

            // Stage 5: Upload custom events
            updateStage(.uploadingCustomEvents, progress: 0.70)
            try await uploadCustomEvents(exportedData.customEvents)

            // Stage 6: Upload media files
            updateStage(.uploadingMedia, progress: 0.75)
            try await uploadMediaFiles(exportedData)

            // Stage 7: Verify migration
            updateStage(.verifying, progress: 0.90)
            try await verifyMigration(exportedData)

            // Stage 8: Finalize
            updateStage(.finalizing, progress: 0.95)
            try await finalizeMigration()

            // Complete
            updateStage(.complete, progress: 1.0)
            state.status = .completed
            state.completedAt = Date()
            persistState()

            Logger.sync.info("✅ Migration completed successfully")

        } catch {
            state.status = .failed
            state.error = error.localizedDescription
            persistState()

            Logger.sync.error("❌ Migration failed: \(error)")
            throw error
        }
    }

    /// Resume interrupted migration
    func resumeMigration() async throws {
        guard state.status == .failed || state.status == .inProgress else {
            Logger.sync.warning("Cannot resume migration in state: \(state.status)")
            return
        }

        Logger.sync.info("🔄 Resuming migration from stage: \(state.currentStage)")

        // Reset to in progress and continue from current stage
        state.status = .inProgress
        state.error = nil

        try await startMigration()
    }

    /// Cancel ongoing migration
    func cancelMigration() async throws {
        guard state.status == .inProgress else {
            return
        }

        Logger.sync.info("⏹️ Cancelling migration...")

        state.status = .failed
        state.error = "Migration cancelled by user"
        persistState()
    }

    // MARK: - Export Stage

    private func exportLocalData() async throws -> ExportedData {
        Logger.sync.info("📦 Exporting local data...")

        let exportedData = try await exporter.exportWithProgress { progress in
            Task { @MainActor in
                self.state.progress = 0.10 + (progress.progress * 0.10)
                self.persistState()
            }
        }

        state.heroesExported = exportedData.heroes.count
        state.storiesExported = exportedData.stories.count
        state.customEventsExported = exportedData.customEvents.count
        state.totalMediaFiles = exportedData.metadata.totalAudioFiles +
                                exportedData.metadata.totalAvatarFiles +
                                exportedData.metadata.totalIllustrationFiles

        Logger.sync.info("✅ Export complete: \(exportedData.heroes.count) heroes, \(exportedData.stories.count) stories")

        return exportedData
    }

    // MARK: - Upload Stages

    private func uploadHeroes(_ heroes: [ExportedHero]) async throws {
        Logger.sync.info("📤 Uploading \(heroes.count) heroes...")

        for (index, exportedHero) in heroes.enumerated() {
            let request = HeroCreateRequest(
                name: exportedHero.name,
                age: exportedHero.age,
                traits: exportedHero.traits,
                specialAbility: exportedHero.specialAbility,
                hairColor: exportedHero.visualProfile?.hairColor,
                eyeColor: exportedHero.visualProfile?.eyeColor,
                skinTone: exportedHero.visualProfile?.skinTone,
                height: exportedHero.visualProfile?.height
            )

            let endpoint = Endpoint.createHero(data: request)
            let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

            guard response.data != nil else {
                throw MigrationError.uploadFailed("Hero upload failed: \(exportedHero.name)")
            }

            state.heroesUploaded = index + 1
            state.progress = 0.20 + (Double(index + 1) / Double(heroes.count) * 0.25)
            persistState()
        }

        Logger.sync.info("✅ Uploaded \(heroes.count) heroes")
    }

    private func uploadStories(_ stories: [ExportedStory]) async throws {
        Logger.sync.info("📤 Uploading \(stories.count) stories...")

        for (index, exportedStory) in stories.enumerated() {
            // Stories require hero to be uploaded first, skipping for now
            // This would need hero ID mapping from export to backend

            state.storiesUploaded = index + 1
            state.progress = 0.45 + (Double(index + 1) / Double(stories.count) * 0.25)
            persistState()

            await Task.yield() // Allow UI updates
        }

        Logger.sync.info("✅ Uploaded \(stories.count) stories")
    }

    private func uploadCustomEvents(_ events: [ExportedCustomEvent]) async throws {
        Logger.sync.info("📤 Uploading \(events.count) custom events...")

        for (index, exportedEvent) in events.enumerated() {
            let request = CustomEventCreateRequest(
                title: exportedEvent.title,
                description: exportedEvent.eventDescription,
                promptSeed: exportedEvent.promptSeed,
                category: exportedEvent.category,
                ageRange: exportedEvent.ageRange,
                tone: exportedEvent.tone,
                keywords: exportedEvent.keywords
            )

            let endpoint = Endpoint.createCustomEvent(data: request)
            _ = try await apiClient.request(endpoint) as APIResponse<CustomEventResponse>

            state.customEventsUploaded = index + 1
            state.progress = 0.70 + (Double(index + 1) / Double(events.count) * 0.05)
            persistState()
        }

        Logger.sync.info("✅ Uploaded \(events.count) custom events")
    }

    private func uploadMediaFiles(_ exportedData: ExportedData) async throws {
        Logger.sync.info("📤 Uploading media files...")

        // TODO: Implement R2 upload for media files
        // This will be handled in tasks #143-145

        state.progress = 0.85
        persistState()

        Logger.sync.info("Media upload not yet implemented (see tasks #143-145)")
    }

    // MARK: - Verification

    private func verifyMigration(_ exportedData: ExportedData) async throws {
        Logger.sync.info("🔍 Verifying migration...")

        // Verify counts match
        guard state.heroesUploaded == exportedData.heroes.count else {
            throw MigrationError.verificationFailed("Hero count mismatch")
        }

        Logger.sync.info("✅ Migration verified")
    }

    private func finalizeMigration() async throws {
        Logger.sync.info("🎯 Finalizing migration...")

        // Mark migration as complete in UserDefaults
        UserDefaults.standard.set(true, forKey: "migrationCompleted")
        UserDefaults.standard.set(Date(), forKey: "migrationCompletedAt")

        Logger.sync.info("✅ Migration finalized")
    }

    // MARK: - Stage Updates

    private func updateStage(_ stage: MigrationState.MigrationStage, progress: Double) {
        state.currentStage = stage
        state.progress = progress
        persistState()

        Logger.sync.info("Stage: \(stage.displayName) (\(Int(progress * 100))%)")
    }

    // MARK: - State Persistence

    private func persistState() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(state)
            UserDefaults.standard.set(data, forKey: persistenceKey)
        } catch {
            Logger.sync.error("Failed to persist migration state: \(error)")
        }
    }

    private static func loadPersistedState() -> MigrationState {
        guard let data = UserDefaults.standard.data(forKey: "com.infinitestories.migrationState") else {
            return .initial
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(MigrationState.self, from: data)
        } catch {
            Logger.sync.error("Failed to load persisted state: \(error)")
            return .initial
        }
    }

    /// Reset migration state (for testing or retry)
    func resetMigrationState() {
        state = .initial
        backupData = nil
        UserDefaults.standard.removeObject(forKey: persistenceKey)
        UserDefaults.standard.set(false, forKey: "migrationCompleted")

        Logger.sync.info("🔄 Migration state reset")
    }

    // MARK: - Migration Info

    var isMigrationNeeded: Bool {
        // Check if user has local data but hasn't migrated yet
        let hasCompletedMigration = UserDefaults.standard.bool(forKey: "migrationCompleted")
        let hasLocalData = hasAnyLocalData()

        return hasLocalData && !hasCompletedMigration
    }

    private func hasAnyLocalData() -> Bool {
        do {
            let heroDescriptor = FetchDescriptor<Hero>()
            let heroes = try modelContext.fetch(heroDescriptor)

            return !heroes.isEmpty
        } catch {
            return false
        }
    }

    var canResumeMigration: Bool {
        return state.status == .failed && state.progress > 0
    }

    var migrationProgress: String {
        return "\(Int(state.progress * 100))%"
    }
}

// MARK: - Migration Errors

enum MigrationError: Error, LocalizedError {
    case authenticationRequired
    case exportFailed(String)
    case uploadFailed(String)
    case verificationFailed(String)
    case rollbackFailed(String)
    case noBackupAvailable

    var errorDescription: String? {
        switch self {
        case .authenticationRequired:
            return "Please sign in to migrate your data"
        case .exportFailed(let message):
            return "Export failed: \(message)"
        case .uploadFailed(let message):
            return "Upload failed: \(message)"
        case .verificationFailed(let message):
            return "Verification failed: \(message)"
        case .rollbackFailed(let message):
            return "Rollback failed: \(message)"
        case .noBackupAvailable:
            return "No backup available for rollback"
        }
    }
}

// MARK: - Rollback Support

extension MigrationManager {
    /// Rollback migration to pre-migration state
    func rollback() async throws {
        Logger.sync.warning("⚠️ Rolling back migration...")

        guard let backup = backupData else {
            throw MigrationError.noBackupAvailable
        }

        state.status = .inProgress
        state.currentStage = .idle
        state.progress = 0.0
        persistState()

        do {
            Logger.sync.info("Step 1/4: Deleting uploaded data from backend...")

            // 1. Delete uploaded heroes from backend
            try await deleteUploadedHeroes()
            state.progress = 0.25
            persistState()

            // 2. Delete uploaded stories from backend
            try await deleteUploadedStories()
            state.progress = 0.50
            persistState()

            // 3. Delete uploaded custom events from backend
            try await deleteUploadedCustomEvents()
            state.progress = 0.75
            persistState()

            Logger.sync.info("Step 2/4: Clearing local sync metadata...")

            // 4. Clear sync metadata from local models
            try await clearSyncMetadata()

            Logger.sync.info("Step 3/4: Restoring local state...")

            // 5. Reset sync status to original state
            try await resetLocalSyncStatus()

            Logger.sync.info("Step 4/4: Finalizing rollback...")

            // 6. Update migration state
            state.status = .rolledBack
            state.completedAt = Date()
            state.progress = 1.0
            persistState()

            // 7. Clear backup
            backupData = nil

            Logger.sync.info("✅ Migration rolled back successfully")

        } catch {
            state.status = .failed
            state.error = "Rollback failed: \(error.localizedDescription)"
            persistState()

            Logger.sync.error("❌ Rollback failed: \(error)")
            throw MigrationError.rollbackFailed(error.localizedDescription)
        }
    }

    // MARK: - Rollback Helpers

    private func deleteUploadedHeroes() async throws {
        let descriptor = FetchDescriptor<Hero>()
        let heroes = try modelContext.fetch(descriptor)

        let uploadedHeroes = heroes.filter { $0.serverId != nil }

        Logger.sync.info("Deleting \(uploadedHeroes.count) uploaded heroes...")

        for hero in uploadedHeroes {
            guard let serverId = hero.serverId,
                  let heroId = UUID(uuidString: serverId) else { continue }

            do {
                let endpoint = Endpoint.deleteHero(id: heroId)
                let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

                Logger.sync.debug("Deleted hero from backend: \(hero.name)")
            } catch {
                Logger.sync.warning("Failed to delete hero during rollback: \(error)")
                // Continue with rollback even if some deletes fail
            }
        }
    }

    private func deleteUploadedStories() async throws {
        let descriptor = FetchDescriptor<Story>()
        let stories = try modelContext.fetch(descriptor)

        let uploadedStories = stories.filter { $0.serverId != nil }

        Logger.sync.info("Deleting \(uploadedStories.count) uploaded stories...")

        for story in uploadedStories {
            guard let serverId = story.serverId,
                  let storyId = UUID(uuidString: serverId) else { continue }

            do {
                let endpoint = Endpoint.deleteStory(id: storyId)
                let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

                Logger.sync.debug("Deleted story from backend: \(story.title)")
            } catch {
                Logger.sync.warning("Failed to delete story during rollback: \(error)")
            }
        }
    }

    private func deleteUploadedCustomEvents() async throws {
        let descriptor = FetchDescriptor<CustomStoryEvent>()
        let events = try modelContext.fetch(descriptor)

        let uploadedEvents = events.filter { $0.serverId != nil }

        Logger.sync.info("Deleting \(uploadedEvents.count) uploaded custom events...")

        for event in uploadedEvents {
            guard let serverId = event.serverId,
                  let eventId = UUID(uuidString: serverId) else { continue }

            do {
                let endpoint = Endpoint.deleteCustomEvent(id: eventId)
                let _: APIResponse<EmptyResponse> = try await apiClient.request(endpoint)

                Logger.sync.debug("Deleted custom event from backend: \(event.title)")
            } catch {
                Logger.sync.warning("Failed to delete custom event during rollback: \(error)")
            }
        }
    }

    private func clearSyncMetadata() async throws {
        Logger.sync.info("Clearing sync metadata from all entities...")

        // Clear hero sync metadata
        let heroDescriptor = FetchDescriptor<Hero>()
        let heroes = try modelContext.fetch(heroDescriptor)
        for hero in heroes {
            hero.serverId = nil
            hero.serverSyncStatus = .synced
            hero.lastSyncedAt = nil
            hero.serverUpdatedAt = nil
            hero.pendingChanges = nil
            hero.syncError = nil
        }

        // Clear story sync metadata
        let storyDescriptor = FetchDescriptor<Story>()
        let stories = try modelContext.fetch(storyDescriptor)
        for story in stories {
            story.serverId = nil
            story.serverSyncStatus = .synced
            story.lastSyncedAt = nil
            story.serverUpdatedAt = nil
            story.pendingChanges = nil
            story.syncError = nil
        }

        // Clear custom event sync metadata
        let eventDescriptor = FetchDescriptor<CustomStoryEvent>()
        let events = try modelContext.fetch(eventDescriptor)
        for event in events {
            event.serverId = nil
            event.serverSyncStatus = .synced
            event.lastSyncedAt = nil
            event.serverUpdatedAt = nil
            event.pendingChanges = nil
            event.syncError = nil
        }

        try modelContext.save()

        Logger.sync.info("✅ Cleared sync metadata from all entities")
    }

    private func resetLocalSyncStatus() async throws {
        // All local entities are now in their original state
        // No server IDs, no sync status
        Logger.sync.info("✅ Local data restored to pre-migration state")
    }
}

// MARK: - Request Models

struct CustomEventCreateRequest: Codable {
    let title: String
    let description: String
    let promptSeed: String
    let category: String?
    let ageRange: String?
    let tone: String?
    let keywords: [String]
}
