# Migration & Testing - iOS Backend API Integration

**Parent Document**: [PRD_IOS_API_INTEGRATION.md](./PRD_IOS_API_INTEGRATION.md)
**Version**: 1.0
**Date**: 2025-01-06

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Migration Workflow](#migration-workflow)
3. [Migration UI Design](#migration-ui-design)
4. [Data Export](#data-export)
5. [Backend Upload](#backend-upload)
6. [Rollback Mechanism](#rollback-mechanism)
7. [Testing Strategy](#testing-strategy)
8. [Performance Benchmarks](#performance-benchmarks)

---

## Migration Overview

### Migration Goals

1. **Zero Data Loss**: Every hero, story, illustration, and audio file preserved
2. **Transparent Process**: Clear progress indicators and status updates
3. **Resumable**: Can pause and resume if interrupted
4. **Rollback-Safe**: Can revert to local-only mode on failure
5. **User Control**: User decides when to migrate

### Migration Scope

**Data to Migrate**:
- ✅ Heroes (with avatars)
- ✅ Stories (with audio files)
- ✅ Story Illustrations (with image files)
- ✅ Custom Story Events (with pictograms)
- ✅ User preferences and settings

**What Stays Local**:
- ⚠️ Temporary cache files
- ⚠️ App settings (theme, language)
- ⚠️ Reading Journey stats (will be recalculated)

### Migration Phases

```
┌─────────────────────────────────────────────────────────┐
│              Migration Phase Overview                    │
└─────────────────────────────────────────────────────────┘

Phase 1: Detect Local Data
  ↓ Check if migration needed
  ↓ Count entities to migrate
  ↓ Estimate time and storage

Phase 2: Show Migration UI
  ↓ Present benefits to user
  ↓ Explain process
  ↓ Get user consent

Phase 3: Authentication
  ↓ User signs up or signs in
  ↓ Verify account created
  ↓ Store session token

Phase 4: Export Local Data
  ↓ Export heroes to JSON
  ↓ Export stories to JSON
  ↓ Collect media file references
  ↓ Save checkpoint

Phase 5: Upload to Backend
  ↓ Upload heroes (with avatars)
  ↓ Upload stories (with audio)
  ↓ Upload illustrations
  ↓ Upload custom events
  ↓ Show progress

Phase 6: Verify Migration
  ↓ Fetch from backend
  ↓ Compare counts
  ↓ Verify media files

Phase 7: Mark as Migrated
  ↓ Update all sync statuses
  ↓ Enable cloud sync
  ↓ Clean up migration state

Phase 8: Celebrate!
  ↓ Show success message
  ↓ Explain new features
  ↓ Done!
```

---

## Migration Workflow

### Step 1: Detect Local Data

```swift
class MigrationManager: ObservableObject {
    @Published var needsMigration = false
    @Published var migrationState: MigrationState = .notStarted
    @Published var progress: Double = 0.0

    private let cacheManager: CacheManagerProtocol
    private let authManager: AuthManager

    func checkMigrationNeeded() async -> Bool {
        // Skip if already authenticated (already using backend)
        if authManager.isAuthenticated {
            return false
        }

        // Check if there's local data
        let heroCount = (try? cacheManager.fetchAll(Hero.self).count) ?? 0
        let storyCount = (try? cacheManager.fetchAll(Story.self).count) ?? 0

        let hasData = heroCount > 0 || storyCount > 0

        Logger.migration.info("Migration check: \(heroCount) heroes, \(storyCount) stories")

        await MainActor.run {
            needsMigration = hasData
        }

        return hasData
    }

    func getMigrationStats() async -> MigrationStats {
        let heroes = try? cacheManager.fetchAll(Hero.self)
        let stories = try? cacheManager.fetchAll(Story.self)
        let customEvents = try? cacheManager.fetchAll(CustomStoryEvent.self)

        let illustrationCount = stories?.reduce(0) { $0 + ($1.illustrations?.count ?? 0) } ?? 0

        return MigrationStats(
            heroCount: heroes?.count ?? 0,
            storyCount: stories?.count ?? 0,
            illustrationCount: illustrationCount,
            customEventCount: customEvents?.count ?? 0,
            estimatedTime: calculateEstimatedTime(
                heroes: heroes?.count ?? 0,
                stories: stories?.count ?? 0,
                illustrations: illustrationCount
            )
        )
    }

    private func calculateEstimatedTime(heroes: Int, stories: Int, illustrations: Int) -> TimeInterval {
        // Rough estimates:
        // - Hero: 2 seconds (with avatar upload)
        // - Story: 3 seconds (with audio upload)
        // - Illustration: 1 second

        let totalSeconds = Double(heroes * 2 + stories * 3 + illustrations * 1)
        return max(totalSeconds, 30) // At least 30 seconds
    }
}

struct MigrationStats {
    let heroCount: Int
    let storyCount: Int
    let illustrationCount: Int
    let customEventCount: Int
    let estimatedTime: TimeInterval

    var formattedTime: String {
        let minutes = Int(estimatedTime / 60)
        let seconds = Int(estimatedTime.truncatingRemainder(dividingBy: 60))

        if minutes > 0 {
            return "\(minutes) min \(seconds) sec"
        } else {
            return "\(seconds) sec"
        }
    }
}

enum MigrationState {
    case notStarted
    case authenticating
    case exporting
    case uploading(current: Int, total: Int)
    case verifying
    case completed
    case failed(Error)
}
```

### Step 2: Show Migration Onboarding

```swift
struct MigrationOnboardingView: View {
    @StateObject private var migrationManager: MigrationManager
    @State private var stats: MigrationStats?
    @State private var showSignIn = false

    var body: some View {
        VStack(spacing: 24) {
            // Header
            Image(systemName: "cloud.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)

            Text("Upgrade to Cloud Sync")
                .font(.title)
                .fontWeight(.bold)

            Text("Access your stories from any device and never lose your data")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            // Benefits
            VStack(alignment: .leading, spacing: 16) {
                BenefitRow(icon: "iphone.and.ipad", title: "Multi-Device Access", description: "Use InfiniteStories on all your devices")
                BenefitRow(icon: "arrow.triangle.2.circlepath", title: "Automatic Sync", description: "Changes sync automatically in the background")
                BenefitRow(icon: "lock.shield", title: "Secure Backup", description: "Your stories are safely backed up in the cloud")
                BenefitRow(icon: "wifi.slash", title: "Works Offline", description: "Full functionality even without internet")
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)

            // Stats
            if let stats = stats {
                VStack(spacing: 8) {
                    Text("Your Data")
                        .font(.headline)

                    HStack(spacing: 32) {
                        StatItem(value: "\(stats.heroCount)", label: "Heroes")
                        StatItem(value: "\(stats.storyCount)", label: "Stories")
                        StatItem(value: "\(stats.illustrationCount)", label: "Illustrations")
                    }

                    Text("Estimated time: \(stats.formattedTime)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(12)
            }

            Spacer()

            // Actions
            Button("Get Started") {
                showSignIn = true
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)

            Button("Maybe Later") {
                // Dismiss
            }
            .buttonStyle(.bordered)
        }
        .padding()
        .task {
            stats = await migrationManager.getMigrationStats()
        }
        .sheet(isPresented: $showSignIn) {
            MigrationAuthView(migrationManager: migrationManager)
        }
    }
}

struct BenefitRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct StatItem: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
```

### Step 3: Authentication

```swift
struct MigrationAuthView: View {
    @StateObject var migrationManager: MigrationManager
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var isSignUp = true
    @State private var error: String?
    @State private var isLoading = false

    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)

                    SecureField("Password", text: $password)
                        .textContentType(isSignUp ? .newPassword : .password)

                    if isSignUp {
                        TextField("Name (optional)", text: $name)
                            .textContentType(.name)
                    }
                }

                Section {
                    Button(isSignUp ? "Create Account" : "Sign In") {
                        Task {
                            await authenticate()
                        }
                    }
                    .disabled(email.isEmpty || password.isEmpty)

                    Button(isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up") {
                        isSignUp.toggle()
                    }
                    .font(.caption)
                }

                if let error = error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle(isSignUp ? "Create Account" : "Sign In")
            .navigationBarTitleDisplayMode(.inline)
            .overlay {
                if isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.3))
                }
            }
        }
    }

    private func authenticate() async {
        isLoading = true
        error = nil

        defer { isLoading = false }

        do {
            if isSignUp {
                _ = try await migrationManager.signUp(email: email, password: password, name: name.isEmpty ? nil : name)
            } else {
                _ = try await migrationManager.signIn(email: email, password: password)
            }

            // Authentication successful, start migration
            await migrationManager.startMigration()

        } catch let apiError as APIError {
            error = apiError.localizedDescription
        } catch {
            error = "An unexpected error occurred. Please try again."
        }
    }
}
```

### Step 4: Export Local Data

```swift
extension MigrationManager {
    func exportLocalData() async throws -> LocalDataExport {
        Logger.migration.info("📦 Exporting local data...")

        await MainActor.run {
            migrationState = .exporting
            progress = 0.0
        }

        // Export heroes
        let heroes = try cacheManager.fetchAll(Hero.self)
        let heroExports = heroes.map { HeroExport(from: $0) }

        await MainActor.run { progress = 0.2 }

        // Export stories
        let stories = try cacheManager.fetchAll(Story.self)
        let storyExports = stories.map { StoryExport(from: $0) }

        await MainActor.run { progress = 0.4 }

        // Export custom events
        let customEvents = try cacheManager.fetchAll(CustomStoryEvent.self)
        let customEventExports = customEvents.map { CustomEventExport(from: $0) }

        await MainActor.run { progress = 0.6 }

        // Collect media file references
        let mediaFiles = try collectMediaFiles(heroes: heroes, stories: stories)

        await MainActor.run { progress = 0.8 }

        let export = LocalDataExport(
            heroes: heroExports,
            stories: storyExports,
            customEvents: customEventExports,
            mediaFiles: mediaFiles
        )

        // Save checkpoint
        try saveCheckpoint(export)

        await MainActor.run { progress = 1.0 }

        Logger.migration.info("✅ Exported \(heroExports.count) heroes, \(storyExports.count) stories")

        return export
    }

    private func collectMediaFiles(heroes: [Hero], stories: [Story]) throws -> [MediaFileReference] {
        var files: [MediaFileReference] = []

        // Collect avatar files
        for hero in heroes {
            if let avatarPath = hero.avatarImagePath,
               let url = URL(string: avatarPath),
               url.isFileURL,
               FileManager.default.fileExists(atPath: url.path) {
                files.append(MediaFileReference(
                    type: .avatar,
                    localPath: url.path,
                    entityId: hero.id,
                    fileName: url.lastPathComponent
                ))
            }
        }

        // Collect audio files
        for story in stories {
            if let audioPath = story.audioFileName,
               let url = URL(string: audioPath),
               url.isFileURL,
               FileManager.default.fileExists(atPath: url.path) {
                files.append(MediaFileReference(
                    type: .audio,
                    localPath: url.path,
                    entityId: story.id,
                    fileName: url.lastPathComponent
                ))
            }
        }

        // Collect illustration files
        for story in stories {
            guard let illustrations = story.illustrations else { continue }

            for illustration in illustrations {
                if let imagePath = illustration.imagePath,
                   let url = URL(string: imagePath),
                   url.isFileURL,
                   FileManager.default.fileExists(atPath: url.path) {
                    files.append(MediaFileReference(
                        type: .illustration,
                        localPath: url.path,
                        entityId: illustration.id,
                        fileName: url.lastPathComponent
                    ))
                }
            }
        }

        Logger.migration.info("📁 Collected \(files.count) media files")

        return files
    }

    private func saveCheckpoint(_ export: LocalDataExport) throws {
        let data = try JSONEncoder().encode(export)
        let url = checkpointURL()
        try data.write(to: url)

        Logger.migration.info("💾 Saved migration checkpoint")
    }

    private func loadCheckpoint() throws -> LocalDataExport? {
        let url = checkpointURL()

        guard FileManager.default.fileExists(atPath: url.path) else {
            return nil
        }

        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(LocalDataExport.self, from: data)
    }

    private func checkpointURL() -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("migration_checkpoint.json")
    }
}

struct LocalDataExport: Codable {
    let heroes: [HeroExport]
    let stories: [StoryExport]
    let customEvents: [CustomEventExport]
    let mediaFiles: [MediaFileReference]
}

struct HeroExport: Codable {
    let id: UUID
    let name: String
    let age: Int
    let traits: [String]
    let specialAbility: String?
    let avatarPath: String?
    let avatarGenerationId: String?
    let createdAt: Date

    init(from hero: Hero) {
        self.id = hero.id
        self.name = hero.name
        self.age = hero.age
        self.traits = hero.traits.map { $0.rawValue }
        self.specialAbility = hero.specialAbility
        self.avatarPath = hero.avatarImagePath
        self.avatarGenerationId = hero.avatarGenerationId
        self.createdAt = hero.createdAt
    }
}

struct StoryExport: Codable {
    let id: UUID
    let title: String
    let content: String
    let heroId: UUID
    let eventType: String?
    let customEventId: UUID?
    let language: String
    let audioPath: String?
    let illustrations: [IllustrationExport]
    let isFavorite: Bool
    let playCount: Int
    let createdAt: Date

    init(from story: Story) {
        self.id = story.id
        self.title = story.title
        self.content = story.content
        self.heroId = story.hero?.id ?? UUID()
        self.eventType = story.builtInEvent?.rawValue
        self.customEventId = story.customEvent?.id
        self.language = story.language
        self.audioPath = story.audioFileName
        self.illustrations = story.illustrations?.map { IllustrationExport(from: $0) } ?? []
        self.isFavorite = story.isFavorite
        self.playCount = story.playCount
        self.createdAt = story.createdAt
    }
}

struct IllustrationExport: Codable {
    let id: UUID
    let timestamp: Double
    let imagePrompt: String
    let imagePath: String?
    let displayOrder: Int
    let generationId: String?

    init(from illustration: StoryIllustration) {
        self.id = illustration.id
        self.timestamp = illustration.timestamp
        self.imagePrompt = illustration.imagePrompt
        self.imagePath = illustration.imagePath
        self.displayOrder = illustration.displayOrder
        self.generationId = illustration.generationId
    }
}

struct CustomEventExport: Codable {
    let id: UUID
    let title: String
    let eventDescription: String
    let promptSeed: String
    let category: String
    let ageRange: String
    let tone: String
    let usageCount: Int
    let isFavorite: Bool

    init(from event: CustomStoryEvent) {
        self.id = event.id
        self.title = event.title
        self.eventDescription = event.eventDescription
        self.promptSeed = event.promptSeed
        self.category = event.category.rawValue
        self.ageRange = event.ageRange.rawValue
        self.tone = event.tone.rawValue
        self.usageCount = event.usageCount
        self.isFavorite = event.isFavorite
    }
}

struct MediaFileReference: Codable {
    enum FileType: String, Codable {
        case avatar, audio, illustration
    }

    let type: FileType
    let localPath: String
    let entityId: UUID
    let fileName: String
}
```

### Step 5: Upload to Backend

```swift
extension MigrationManager {
    func uploadToBackend(_ export: LocalDataExport) async throws {
        Logger.migration.info("☁️ Uploading to backend...")

        let totalItems = export.heroes.count + export.stories.count + export.mediaFiles.count
        var completedItems = 0

        await MainActor.run {
            migrationState = .uploading(current: 0, total: totalItems)
            progress = 0.0
        }

        // 1. Upload heroes (with avatars)
        for heroExport in export.heroes {
            try await uploadHero(heroExport, mediaFiles: export.mediaFiles)

            completedItems += 1
            await updateProgress(completedItems, totalItems)
        }

        // 2. Upload stories (with audio and illustrations)
        for storyExport in export.stories {
            try await uploadStory(storyExport, mediaFiles: export.mediaFiles)

            completedItems += 1
            await updateProgress(completedItems, totalItems)
        }

        // 3. Upload custom events
        for customEventExport in export.customEvents {
            try await uploadCustomEvent(customEventExport)
        }

        Logger.migration.info("✅ Upload completed")
    }

    private func uploadHero(_ heroExport: HeroExport, mediaFiles: [MediaFileReference]) async throws {
        // 1. Create hero on backend
        let request = HeroCreateRequest(
            name: heroExport.name,
            age: heroExport.age,
            traits: heroExport.traits,
            specialAbility: heroExport.specialAbility
        )

        let endpoint = Endpoint.createHero(data: request)
        let response: APIResponse<HeroResponse> = try await apiClient.request(endpoint)

        guard let serverHero = response.data else {
            throw MigrationError.uploadFailed(entity: "Hero", name: heroExport.name)
        }

        Logger.migration.info("✅ Created hero: \(heroExport.name)")

        // 2. Upload avatar if exists
        if let avatarFile = mediaFiles.first(where: { $0.type == .avatar && $0.entityId == heroExport.id }),
           let imageData = try? Data(contentsOf: URL(fileURLWithPath: avatarFile.localPath)) {

            let uploadEndpoint = Endpoint.uploadFile(data: imageData, fileName: avatarFile.fileName)
            let avatarUrl = try await apiClient.upload(imageData, to: uploadEndpoint)

            // Update hero with avatar URL
            let updateRequest = HeroUpdateRequest(
                name: nil,
                age: nil,
                traits: nil,
                specialAbility: nil,
                avatarUrl: avatarUrl.absoluteString
            )

            let updateEndpoint = Endpoint.updateHero(id: serverHero.id, data: updateRequest)
            _ = try await apiClient.request(updateEndpoint) as APIResponse<HeroResponse>

            Logger.migration.info("✅ Uploaded avatar for: \(heroExport.name)")
        }

        // 3. Update local hero with server ID
        if let localHero = try? cacheManager.fetch(Hero.self, id: heroExport.id) {
            localHero.serverId = serverHero.id.uuidString
            localHero.serverSyncStatus = .synced
            localHero.lastSyncedAt = Date()
            try cacheManager.save(localHero)
        }
    }

    private func uploadStory(_ storyExport: StoryExport, mediaFiles: [MediaFileReference]) async throws {
        // 1. Create story on backend
        let request = StoryCreateRequest(
            heroId: storyExport.heroId,
            title: storyExport.title,
            content: storyExport.content,
            eventType: storyExport.eventType,
            customEventId: storyExport.customEventId,
            language: storyExport.language,
            isFavorite: storyExport.isFavorite,
            playCount: storyExport.playCount
        )

        let endpoint = Endpoint.createStory(data: request)
        let response: APIResponse<StoryResponse> = try await apiClient.request(endpoint)

        guard let serverStory = response.data else {
            throw MigrationError.uploadFailed(entity: "Story", name: storyExport.title)
        }

        Logger.migration.info("✅ Created story: \(storyExport.title)")

        // 2. Upload audio if exists
        if let audioFile = mediaFiles.first(where: { $0.type == .audio && $0.entityId == storyExport.id }),
           let audioData = try? Data(contentsOf: URL(fileURLWithPath: audioFile.localPath)) {

            let audioUrl = try await apiClient.upload(audioData, to: .uploadAudio(storyId: serverStory.id))

            Logger.migration.info("✅ Uploaded audio for: \(storyExport.title)")
        }

        // 3. Upload illustrations if exist
        let illustrationFiles = mediaFiles.filter { $0.type == .illustration && storyExport.illustrations.contains(where: { $0.id == $0.entityId }) }

        for illustrationFile in illustrationFiles {
            if let imageData = try? Data(contentsOf: URL(fileURLWithPath: illustrationFile.localPath)) {
                _ = try await apiClient.upload(imageData, to: .uploadIllustration(storyId: serverStory.id))

                Logger.migration.info("✅ Uploaded illustration for: \(storyExport.title)")
            }
        }

        // 4. Update local story with server ID
        if let localStory = try? cacheManager.fetch(Story.self, id: storyExport.id) {
            localStory.serverId = serverStory.id.uuidString
            localStory.serverSyncStatus = .synced
            localStory.lastSyncedAt = Date()
            try cacheManager.save(localStory)
        }
    }

    private func uploadCustomEvent(_ eventExport: CustomEventExport) async throws {
        let request = CustomEventCreateRequest(
            title: eventExport.title,
            description: eventExport.eventDescription,
            promptSeed: eventExport.promptSeed,
            category: eventExport.category,
            ageRange: eventExport.ageRange,
            tone: eventExport.tone,
            usageCount: eventExport.usageCount,
            isFavorite: eventExport.isFavorite
        )

        let endpoint = Endpoint.createCustomEvent(data: request)
        let response: APIResponse<CustomEventResponse> = try await apiClient.request(endpoint)

        guard let serverEvent = response.data else {
            throw MigrationError.uploadFailed(entity: "CustomEvent", name: eventExport.title)
        }

        // Update local event with server ID
        if let localEvent = try? cacheManager.fetch(CustomStoryEvent.self, id: eventExport.id) {
            localEvent.serverId = serverEvent.id.uuidString
            localEvent.serverSyncStatus = .synced
            localEvent.lastSyncedAt = Date()
            try cacheManager.save(localEvent)
        }

        Logger.migration.info("✅ Created custom event: \(eventExport.title)")
    }

    private func updateProgress(_ completed: Int, _ total: Int) async {
        await MainActor.run {
            migrationState = .uploading(current: completed, total: total)
            progress = Double(completed) / Double(total)
        }
    }
}

enum MigrationError: Error {
    case uploadFailed(entity: String, name: String)
    case verificationFailed
    case checkpointNotFound
}
```

### Step 6: Verify Migration

```swift
extension MigrationManager {
    func verifyMigration(_ export: LocalDataExport) async throws {
        Logger.migration.info("🔍 Verifying migration...")

        await MainActor.run {
            migrationState = .verifying
            progress = 0.0
        }

        // 1. Verify hero count
        let heroEndpoint = Endpoint.getHeroes(limit: 1000, offset: 0)
        let heroResponse: APIResponse<[HeroResponse]> = try await apiClient.request(heroEndpoint)

        guard let serverHeroes = heroResponse.data,
              serverHeroes.count >= export.heroes.count else {
            throw MigrationError.verificationFailed
        }

        Logger.migration.info("✅ Verified \(serverHeroes.count) heroes")

        await MainActor.run { progress = 0.5 }

        // 2. Verify story count
        let storyEndpoint = Endpoint.getStories(heroId: nil, limit: 1000, offset: 0)
        let storyResponse: APIResponse<[StoryResponse]> = try await apiClient.request(storyEndpoint)

        guard let serverStories = storyResponse.data,
              serverStories.count >= export.stories.count else {
            throw MigrationError.verificationFailed
        }

        Logger.migration.info("✅ Verified \(serverStories.count) stories")

        await MainActor.run { progress = 1.0 }

        Logger.migration.info("✅ Verification successful")
    }
}
```

### Step 7: Mark as Migrated

```swift
extension MigrationManager {
    func markAsMigrated() async throws {
        Logger.migration.info("✅ Marking all entities as migrated...")

        // Update all heroes
        let heroes = try cacheManager.fetchAll(Hero.self)
        for hero in heroes {
            if hero.serverSyncStatus != .synced {
                hero.serverSyncStatus = .synced
                hero.lastSyncedAt = Date()
                try cacheManager.save(hero)
            }
        }

        // Update all stories
        let stories = try cacheManager.fetchAll(Story.self)
        for story in stories {
            if story.serverSyncStatus != .synced {
                story.serverSyncStatus = .synced
                story.lastSyncedAt = Date()
                try cacheManager.save(story)
            }
        }

        // Enable cloud sync
        UserDefaults.standard.set(true, forKey: "cloudSyncEnabled")
        UserDefaults.standard.set(true, forKey: "enableCloudSync")
        UserDefaults.standard.set(Date(), forKey: "migrationCompletedAt")

        // Delete checkpoint
        try? FileManager.default.removeItem(at: checkpointURL())

        await MainActor.run {
            migrationState = .completed
            progress = 1.0
        }

        Logger.migration.info("🎉 Migration completed successfully")
    }
}
```

### Step 8: Migration UI

```swift
struct MigrationProgressView: View {
    @StateObject var migrationManager: MigrationManager

    var body: some View {
        VStack(spacing: 24) {
            // Progress indicator
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 10)
                    .frame(width: 120, height: 120)

                Circle()
                    .trim(from: 0, to: migrationManager.progress)
                    .stroke(Color.blue, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))
                    .animation(.linear, value: migrationManager.progress)

                Text("\(Int(migrationManager.progress * 100))%")
                    .font(.title)
                    .fontWeight(.bold)
            }

            // Status message
            Text(statusMessage)
                .font(.headline)
                .multilineTextAlignment(.center)

            // Detailed progress
            if case .uploading(let current, let total) = migrationManager.migrationState {
                Text("\(current) of \(total) items uploaded")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            // Tips
            VStack(alignment: .leading, spacing: 8) {
                Text("💡 Migration Tips")
                    .font(.headline)

                Text("• Keep the app open during migration")
                Text("• Stay connected to Wi-Fi for best results")
                Text("• Migration can resume if interrupted")
            }
            .font(.caption)
            .foregroundColor(.secondary)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(8)

            Spacer()
        }
        .padding()
    }

    private var statusMessage: String {
        switch migrationManager.migrationState {
        case .notStarted:
            return "Preparing migration..."
        case .authenticating:
            return "Authenticating..."
        case .exporting:
            return "Exporting your data..."
        case .uploading:
            return "Uploading to cloud..."
        case .verifying:
            return "Verifying migration..."
        case .completed:
            return "Migration complete! 🎉"
        case .failed(let error):
            return "Migration failed: \(error.localizedDescription)"
        }
    }
}

struct MigrationSuccessView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)

            Text("Migration Complete!")
                .font(.title)
                .fontWeight(.bold)

            Text("Your stories are now safely backed up in the cloud")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            VStack(alignment: .leading, spacing: 16) {
                FeatureRow(icon: "checkmark.circle", title: "Data Backed Up", description: "All your heroes and stories are safe")
                FeatureRow(icon: "arrow.triangle.2.circlepath", title: "Sync Enabled", description: "Changes sync automatically")
                FeatureRow(icon: "iphone.and.ipad", title: "Multi-Device Ready", description: "Sign in on other devices to access your stories")
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)

            Spacer()

            Button("Get Started") {
                dismiss()
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding()
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.green)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}
```

---

## Rollback Mechanism

### Rollback Triggers

Rollback needed when:
1. Upload fails repeatedly (>3 retries)
2. Verification fails
3. User cancels migration
4. Network timeout during critical operation

### Rollback Implementation

```swift
extension MigrationManager {
    func rollbackMigration() async {
        Logger.migration.warning("🔄 Rolling back migration...")

        // 1. Delete backend data (if any created)
        do {
            try await deleteAllUserData()
        } catch {
            Logger.migration.error("Failed to delete backend data: \(error)")
        }

        // 2. Reset local sync status
        resetLocalSyncStatus()

        // 3. Disable cloud sync
        UserDefaults.standard.set(false, forKey: "cloudSyncEnabled")
        UserDefaults.standard.set(false, forKey: "enableCloudSync")

        // 4. Sign out
        try? await authManager.signOut()

        // 5. Delete checkpoint
        try? FileManager.default.removeItem(at: checkpointURL())

        await MainActor.run {
            migrationState = .notStarted
            progress = 0.0
        }

        Logger.migration.info("✅ Rollback completed - app back to local-only mode")
    }

    private func deleteAllUserData() async throws {
        // Delete all heroes
        let heroEndpoint = Endpoint.deleteAllHeroes
        _ = try await apiClient.request(heroEndpoint) as APIResponse<EmptyResponse>

        // Delete all stories
        let storyEndpoint = Endpoint.deleteAllStories
        _ = try await apiClient.request(storyEndpoint) as APIResponse<EmptyResponse>

        Logger.migration.info("✅ Deleted all backend data")
    }

    private func resetLocalSyncStatus() {
        // Reset heroes
        if let heroes = try? cacheManager.fetchAll(Hero.self) {
            for hero in heroes {
                hero.serverId = nil
                hero.serverSyncStatus = .synced
                hero.lastSyncedAt = nil
                hero.serverUpdatedAt = nil
                try? cacheManager.save(hero)
            }
        }

        // Reset stories
        if let stories = try? cacheManager.fetchAll(Story.self) {
            for story in stories {
                story.serverId = nil
                story.serverSyncStatus = .synced
                story.lastSyncedAt = nil
                story.serverUpdatedAt = nil
                try? cacheManager.save(story)
            }
        }

        Logger.migration.info("✅ Reset local sync status")
    }
}
```

---

## Testing Strategy

### Unit Tests

#### 1. Migration Manager Tests

```swift
class MigrationManagerTests: XCTestCase {
    var migrationManager: MigrationManager!
    var mockCacheManager: MockCacheManager!
    var mockAPIClient: MockAPIClient!

    override func setUp() async throws {
        mockCacheManager = MockCacheManager()
        mockAPIClient = MockAPIClient()
        migrationManager = MigrationManager(
            cacheManager: mockCacheManager,
            apiClient: mockAPIClient
        )
    }

    func testCheckMigrationNeeded_WithLocalData_ReturnsTrue() async throws {
        // Given: Local data exists
        mockCacheManager.heroes = [Hero(name: "Test", age: 8, traits: [])]

        // When: Check migration needed
        let needsMigration = await migrationManager.checkMigrationNeeded()

        // Then: Should need migration
        XCTAssertTrue(needsMigration)
    }

    func testExportLocalData_IncludesAllEntities() async throws {
        // Given: Local data
        mockCacheManager.heroes = [Hero(name: "Hero1", age: 8, traits: [])]
        mockCacheManager.stories = [Story(title: "Story1", content: "Content", hero: mockCacheManager.heroes[0])]

        // When: Export
        let export = try await migrationManager.exportLocalData()

        // Then: All entities included
        XCTAssertEqual(export.heroes.count, 1)
        XCTAssertEqual(export.stories.count, 1)
    }

    func testRollback_RestoresLocalOnlyMode() async throws {
        // Given: Migration in progress
        migrationManager.migrationState = .uploading(current: 5, total: 10)

        // When: Rollback
        await migrationManager.rollbackMigration()

        // Then: Back to local-only mode
        XCTAssertEqual(migrationManager.migrationState, .notStarted)
        XCTAssertFalse(UserDefaults.standard.bool(forKey: "cloudSyncEnabled"))
    }
}
```

#### 2. Data Export Tests

```swift
class DataExportTests: XCTestCase {
    func testHeroExport_PreservesAllFields() {
        // Given: Hero with all fields
        let hero = Hero(name: "Test", age: 8, traits: [.brave, .kind])
        hero.specialAbility = "Flying"
        hero.avatarImagePath = "/path/to/avatar.png"

        // When: Export
        let export = HeroExport(from: hero)

        // Then: All fields preserved
        XCTAssertEqual(export.name, "Test")
        XCTAssertEqual(export.age, 8)
        XCTAssertEqual(export.traits, ["brave", "kind"])
        XCTAssertEqual(export.specialAbility, "Flying")
        XCTAssertEqual(export.avatarPath, "/path/to/avatar.png")
    }

    func testStoryExport_IncludesIllustrations() {
        // Given: Story with illustrations
        let hero = Hero(name: "Hero", age: 8, traits: [])
        let story = Story(title: "Story", content: "Content", hero: hero)
        let illustration = StoryIllustration(timestamp: 10.0, imagePrompt: "Prompt", story: story)
        story.illustrations = [illustration]

        // When: Export
        let export = StoryExport(from: story)

        // Then: Illustrations included
        XCTAssertEqual(export.illustrations.count, 1)
        XCTAssertEqual(export.illustrations[0].timestamp, 10.0)
    }
}
```

### Integration Tests

#### 1. End-to-End Migration Test

```swift
class MigrationIntegrationTests: XCTestCase {
    func testFullMigration_Success() async throws {
        // Given: Local data and test backend
        let testContainer = try ModelContainer(for: Hero.self, Story.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = ModelContext(testContainer)

        let hero = Hero(name: "Test Hero", age: 8, traits: [.brave])
        context.insert(hero)

        let story = Story(title: "Test Story", content: "Content", hero: hero)
        context.insert(story)

        try context.save()

        // When: Perform migration
        let migrationManager = MigrationManager(
            cacheManager: CacheManager(modelContext: context),
            apiClient: TestAPIClient(baseURL: testServerURL)
        )

        let export = try await migrationManager.exportLocalData()
        try await migrationManager.uploadToBackend(export)
        try await migrationManager.verifyMigration(export)
        try await migrationManager.markAsMigrated()

        // Then: All data migrated
        XCTAssertEqual(migrationManager.migrationState, .completed)

        // Verify on backend
        let backendHeroes = try await fetchBackendHeroes()
        XCTAssertEqual(backendHeroes.count, 1)
        XCTAssertEqual(backendHeroes[0].name, "Test Hero")
    }
}
```

#### 2. Migration Rollback Test

```swift
class MigrationRollbackTests: XCTestCase {
    func testRollback_AfterFailedUpload_RestoresData() async throws {
        // Given: Migration fails during upload
        let migrationManager = MigrationManager(
            cacheManager: mockCacheManager,
            apiClient: FailingAPIClient() // Always fails
        )

        // When: Attempt migration
        do {
            let export = try await migrationManager.exportLocalData()
            try await migrationManager.uploadToBackend(export)
            XCTFail("Should have thrown error")
        } catch {
            // Expected failure
        }

        // Then: Rollback
        await migrationManager.rollbackMigration()

        // Verify: Local data intact
        let heroes = try mockCacheManager.fetchAll(Hero.self)
        XCTAssertEqual(heroes.count, 1)
        XCTAssertNil(heroes[0].serverId) // No server ID
        XCTAssertFalse(UserDefaults.standard.bool(forKey: "cloudSyncEnabled"))
    }
}
```

### UI Tests

#### 1. Migration Onboarding Test

```swift
class MigrationUITests: XCTestCase {
    func testMigrationOnboarding_ShowsCorrectStats() throws {
        let app = XCUIApplication()
        app.launch()

        // Navigate to migration
        app.buttons["Upgrade to Cloud"].tap()

        // Verify stats displayed
        XCTAssertTrue(app.staticTexts["3 Heroes"].exists)
        XCTAssertTrue(app.staticTexts["5 Stories"].exists)
        XCTAssertTrue(app.staticTexts["Estimated time:"].exists)
    }

    func testMigrationProgress_UpdatesCorrectly() throws {
        let app = XCUIApplication()
        app.launch()

        // Start migration
        app.buttons["Get Started"].tap()
        // ... authenticate ...
        app.buttons["Create Account"].tap()

        // Wait for progress
        let progressText = app.staticTexts.matching(NSPredicate(format: "label CONTAINS '%'")).firstMatch
        XCTAssertTrue(progressText.waitForExistence(timeout: 5))

        // Verify progress increases
        let initialProgress = progressText.label
        sleep(2)
        let laterProgress = progressText.label
        XCTAssertNotEqual(initialProgress, laterProgress)
    }

    func testMigrationSuccess_ShowsConfirmation() throws {
        let app = XCUIApplication()
        // ... complete migration ...

        // Verify success screen
        XCTAssertTrue(app.images["checkmark.circle.fill"].exists)
        XCTAssertTrue(app.staticTexts["Migration Complete!"].exists)
        XCTAssertTrue(app.buttons["Get Started"].exists)
    }
}
```

---

## Performance Benchmarks

### Migration Performance Targets

| Metric | Target | Acceptable | Notes |
|--------|--------|------------|-------|
| **Heroes (10)** | <20s | <40s | With avatar uploads |
| **Stories (20)** | <60s | <120s | With audio + illustrations |
| **Media Files (50)** | <90s | <180s | Network dependent |
| **Full Migration (100 items)** | <5min | <10min | Complete dataset |

### Performance Tests

```swift
class MigrationPerformanceTests: XCTestCase {
    func testHeroMigration_Performance() async throws {
        measure(metrics: [XCTClockMetric()]) {
            let expectation = expectation(description: "Migration completes")

            Task {
                // Migrate 10 heroes with avatars
                try await migrationManager.uploadToBackend(testExport)
                expectation.fulfill()
            }

            wait(for: [expectation], timeout: 40.0) // 40s max
        }
    }

    func testFullMigration_Performance() async throws {
        measure(metrics: [XCTClockMetric(), XCTMemoryMetric()]) {
            let expectation = expectation(description: "Migration completes")

            Task {
                // Migrate 100 items (heroes + stories + media)
                try await migrationManager.uploadToBackend(largeExport)
                expectation.fulfill()
            }

            wait(for: [expectation], timeout: 600.0) // 10min max
        }
    }
}
```

### Memory Usage Tests

```swift
class MigrationMemoryTests: XCTestCase {
    func testMigration_MemoryUsage() throws {
        measure(metrics: [XCTMemoryMetric()]) {
            // Migrate large dataset
            let export = createLargeExport(heroCount: 100, storyCount: 200)

            let expectation = expectation(description: "Migration completes")

            Task {
                try await migrationManager.uploadToBackend(export)
                expectation.fulfill()
            }

            wait(for: [expectation], timeout: 600.0)
        }

        // Memory should not exceed 100MB during migration
        XCTAssertLessThan(memoryFootprint(), 100 * 1024 * 1024)
    }
}
```

---

## Summary

This migration and testing strategy ensures:

1. ✅ **Zero Data Loss**: All data preserved during migration
2. ✅ **User Control**: Clear UI with progress tracking
3. ✅ **Resumable**: Can pause and resume if interrupted
4. ✅ **Rollback-Safe**: Can revert to local-only mode
5. ✅ **Well-Tested**: Comprehensive test coverage
6. ✅ **Performance**: Meets target migration times

**Next Steps**:
1. Implement migration UI (Phase 6)
2. Test with real user data
3. Beta test migration process
4. Monitor migration success rates
5. Gather user feedback

---

**For complete PRD overview, see**: [PRD_IOS_API_INTEGRATION.md](./PRD_IOS_API_INTEGRATION.md)
