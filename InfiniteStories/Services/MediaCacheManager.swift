//
//  MediaCacheManager.swift
//  InfiniteStories
//
//  Media file caching with R2 upload/download and eviction policies
//

import Foundation

// MARK: - Cache Policy

enum MediaCachePolicy {
    case avatars        // Cache indefinitely (~50-100KB per file)
    case audio          // Cache 30 days (~1-2MB per file)
    case illustrations  // Cache 14 days (~200-500KB per file)

    var maxAge: TimeInterval {
        switch self {
        case .avatars:
            return .infinity // Never evict
        case .audio:
            return 30 * 24 * 3600 // 30 days
        case .illustrations:
            return 14 * 24 * 3600 // 14 days
        }
    }

    var subdirectory: String {
        switch self {
        case .avatars:
            return "Avatars"
        case .audio:
            return "Audio"
        case .illustrations:
            return "StoryIllustrations"
        }
    }
}

// MARK: - Protocol

protocol MediaCacheManagerProtocol {
    func cacheFile(_ data: Data, key: String, policy: MediaCachePolicy) async throws
    func getCachedFile(key: String, policy: MediaCachePolicy) async throws -> Data?
    func downloadAndCache(from url: URL, key: String, policy: MediaCachePolicy) async throws -> Data
    func downloadWithProgress(from url: URL, key: String, policy: MediaCachePolicy, progressHandler: @escaping (Double) -> Void) async throws -> Data
    func evictExpired() async throws
    func clearCache(policy: MediaCachePolicy) async throws
    func getCacheSize() async throws -> Int64
}

// MARK: - Implementation

class MediaCacheManager: MediaCacheManagerProtocol {
    private let fileManager = FileManager.default
    private let apiClient: APIClientProtocol
    private let cacheDirectory: URL

    init(apiClient: APIClientProtocol) {
        self.apiClient = apiClient

        // Initialize cache directory
        let documentsDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.cacheDirectory = documentsDirectory.appendingPathComponent("MediaCache")

        // Create cache directories
        try? createCacheDirectories()
    }

    private func createCacheDirectories() throws {
        let policies: [MediaCachePolicy] = [.avatars, .audio, .illustrations]

        for policy in policies {
            let directory = cacheDirectory.appendingPathComponent(policy.subdirectory)
            try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        }

        Logger.cache.info("✅ Created media cache directories")
    }

    // MARK: - Cache Operations

    /// Cache file data locally
    func cacheFile(_ data: Data, key: String, policy: MediaCachePolicy) async throws {
        let fileURL = getCacheFileURL(key: key, policy: policy)

        try data.write(to: fileURL)

        Logger.cache.debug("✅ Cached file: \(key) (\(data.count) bytes)")
    }

    /// Get cached file if exists
    func getCachedFile(key: String, policy: MediaCachePolicy) async throws -> Data? {
        let fileURL = getCacheFileURL(key: key, policy: policy)

        guard fileManager.fileExists(atPath: fileURL.path) else {
            return nil
        }

        // Check if expired
        if try isFileExpired(fileURL, policy: policy) {
            try? fileManager.removeItem(at: fileURL)
            Logger.cache.debug("🗑️ Evicted expired file: \(key)")
            return nil
        }

        let data = try Data(contentsOf: fileURL)
        Logger.cache.debug("✅ Cache hit: \(key) (\(data.count) bytes)")

        return data
    }

    /// Download from R2 and cache locally
    func downloadAndCache(from url: URL, key: String, policy: MediaCachePolicy) async throws -> Data {
        // Check cache first
        if let cached = try await getCachedFile(key: key, policy: policy) {
            return cached
        }

        // Download from R2
        Logger.cache.info("📥 Downloading: \(url.lastPathComponent)")

        let data = try await apiClient.download(from: url)

        // Cache locally
        try await cacheFile(data, key: key, policy: policy)

        return data
    }

    /// Download with progress tracking
    func downloadWithProgress(
        from url: URL,
        key: String,
        policy: MediaCachePolicy,
        progressHandler: @escaping (Double) -> Void
    ) async throws -> Data {
        // Check cache first
        if let cached = try await getCachedFile(key: key, policy: policy) {
            progressHandler(1.0)
            return cached
        }

        // Download with progress
        Logger.cache.info("📥 Downloading with progress: \(url.lastPathComponent)")

        let data = try await apiClient.downloadWithProgress(from: url, progressHandler: progressHandler)

        // Cache locally
        try await cacheFile(data, key: key, policy: policy)

        return data
    }

    // MARK: - Eviction

    /// Evict expired files based on cache policies
    func evictExpired() async throws {
        Logger.cache.info("🗑️ Starting cache eviction...")

        var totalEvicted = 0
        let policies: [MediaCachePolicy] = [.audio, .illustrations] // Don't evict avatars

        for policy in policies {
            let directory = cacheDirectory.appendingPathComponent(policy.subdirectory)
            let files = try fileManager.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.creationDateKey])

            for file in files {
                if try isFileExpired(file, policy: policy) {
                    try fileManager.removeItem(at: file)
                    totalEvicted += 1
                    Logger.cache.debug("Evicted expired: \(file.lastPathComponent)")
                }
            }
        }

        Logger.cache.info("✅ Evicted \(totalEvicted) expired files")
    }

    /// Clear all files for a specific cache policy
    func clearCache(policy: MediaCachePolicy) async throws {
        let directory = cacheDirectory.appendingPathComponent(policy.subdirectory)
        let files = try fileManager.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)

        for file in files {
            try fileManager.removeItem(at: file)
        }

        Logger.cache.info("✅ Cleared \(files.count) files from \(policy.subdirectory) cache")
    }

    /// Get total cache size in bytes
    func getCacheSize() async throws -> Int64 {
        var totalSize: Int64 = 0
        let policies: [MediaCachePolicy] = [.avatars, .audio, .illustrations]

        for policy in policies {
            let directory = cacheDirectory.appendingPathComponent(policy.subdirectory)
            let files = try fileManager.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.fileSizeKey])

            for file in files {
                let attributes = try fileManager.attributesOfItem(atPath: file.path)
                if let size = attributes[.size] as? Int64 {
                    totalSize += size
                }
            }
        }

        Logger.cache.debug("Cache size: \(formatBytes(totalSize))")

        return totalSize
    }

    // MARK: - Helper Methods

    private func getCacheFileURL(key: String, policy: MediaCachePolicy) -> URL {
        return cacheDirectory
            .appendingPathComponent(policy.subdirectory)
            .appendingPathComponent(key)
    }

    private func isFileExpired(_ fileURL: URL, policy: MediaCachePolicy) throws -> Bool {
        guard policy.maxAge != .infinity else {
            return false // Never expires
        }

        let attributes = try fileManager.attributesOfItem(atPath: fileURL.path)
        guard let creationDate = attributes[.creationDate] as? Date else {
            return false
        }

        let age = Date().timeIntervalSince(creationDate)
        return age > policy.maxAge
    }

    private func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
}

// MARK: - Cache Key Generation

extension MediaCacheManager {
    /// Generate cache key for avatar
    static func avatarCacheKey(heroId: UUID) -> String {
        return "avatar_\(heroId.uuidString).png"
    }

    /// Generate cache key for audio
    static func audioCacheKey(storyId: UUID) -> String {
        return "audio_\(storyId.uuidString).mp3"
    }

    /// Generate cache key for illustration
    static func illustrationCacheKey(illustrationId: UUID) -> String {
        return "illustration_\(illustrationId.uuidString).png"
    }
}

// MARK: - Convenience Methods

extension MediaCacheManager {
    /// Cache avatar for hero
    func cacheAvatar(_ data: Data, for heroId: UUID) async throws {
        let key = Self.avatarCacheKey(heroId: heroId)
        try await cacheFile(data, key: key, policy: .avatars)
    }

    /// Get cached avatar for hero
    func getCachedAvatar(for heroId: UUID) async throws -> Data? {
        let key = Self.avatarCacheKey(heroId: heroId)
        return try await getCachedFile(key: key, policy: .avatars)
    }

    /// Cache audio for story
    func cacheAudio(_ data: Data, for storyId: UUID) async throws {
        let key = Self.audioCacheKey(storyId: storyId)
        try await cacheFile(data, key: key, policy: .audio)
    }

    /// Get cached audio for story
    func getCachedAudio(for storyId: UUID) async throws -> Data? {
        let key = Self.audioCacheKey(storyId: storyId)
        return try await getCachedFile(key: key, policy: .audio)
    }

    /// Cache illustration
    func cacheIllustration(_ data: Data, for illustrationId: UUID) async throws {
        let key = Self.illustrationCacheKey(illustrationId: illustrationId)
        try await cacheFile(data, key: key, policy: .illustrations)
    }

    /// Get cached illustration
    func getCachedIllustration(for illustrationId: UUID) async throws -> Data? {
        let key = Self.illustrationCacheKey(illustrationId: illustrationId)
        return try await getCachedFile(key: key, policy: .illustrations)
    }
}
