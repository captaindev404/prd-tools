//
//  CacheEvictionService.swift
//  InfiniteStories
//
//  Manages cache eviction policies for media files to prevent unbounded storage growth
//

import Foundation

// MARK: - Cache Eviction Policy

struct CacheEvictionPolicy {
    let audioRetentionDays: Int
    let illustrationRetentionDays: Int
    let avatarRetentionDays: Int
    let enableAutoEviction: Bool

    static let `default` = CacheEvictionPolicy(
        audioRetentionDays: 30,
        illustrationRetentionDays: 14,
        avatarRetentionDays: 90, // Keep avatars longer
        enableAutoEviction: true
    )

    static let conservative = CacheEvictionPolicy(
        audioRetentionDays: 60,
        illustrationRetentionDays: 30,
        avatarRetentionDays: 180,
        enableAutoEviction: true
    )

    static let aggressive = CacheEvictionPolicy(
        audioRetentionDays: 7,
        illustrationRetentionDays: 3,
        avatarRetentionDays: 30,
        enableAutoEviction: true
    )
}

// MARK: - Eviction Statistics

struct EvictionStatistics {
    let audioFilesRemoved: Int
    let illustrationFilesRemoved: Int
    let avatarFilesRemoved: Int
    let totalBytesFreed: Int64
    let executionTime: TimeInterval

    var totalFilesRemoved: Int {
        return audioFilesRemoved + illustrationFilesRemoved + avatarFilesRemoved
    }

    var humanReadableSize: String {
        return totalBytesFreed.humanReadableSize
    }

    var description: String {
        """
        Eviction Statistics:
        - Audio files removed: \(audioFilesRemoved)
        - Illustration files removed: \(illustrationFilesRemoved)
        - Avatar files removed: \(avatarFilesRemoved)
        - Total space freed: \(humanReadableSize)
        - Execution time: \(String(format: "%.2f", executionTime))s
        """
    }
}

// MARK: - Cache Eviction Service

class CacheEvictionService {
    private let fileManager = FileManager.default
    private let policy: CacheEvictionPolicy

    init(policy: CacheEvictionPolicy = .default) {
        self.policy = policy
    }

    // MARK: - Eviction

    /// Run cache eviction based on policy
    /// - Returns: Statistics about evicted files
    func evictExpiredCache() async throws -> EvictionStatistics {
        guard policy.enableAutoEviction else {
            Logger.cache.info("Auto-eviction disabled, skipping")
            return EvictionStatistics(
                audioFilesRemoved: 0,
                illustrationFilesRemoved: 0,
                avatarFilesRemoved: 0,
                totalBytesFreed: 0,
                executionTime: 0
            )
        }

        Logger.cache.info("🧹 Starting cache eviction...")
        let startTime = Date()

        var totalBytesFreed: Int64 = 0

        // Evict audio files
        let audioStats = try await evictAudioFiles()
        totalBytesFreed += audioStats.bytesFreed

        // Evict illustration files
        let illustrationStats = try await evictIllustrationFiles()
        totalBytesFreed += illustrationStats.bytesFreed

        // Evict avatar files
        let avatarStats = try await evictAvatarFiles()
        totalBytesFreed += avatarStats.bytesFreed

        let executionTime = Date().timeIntervalSince(startTime)

        let statistics = EvictionStatistics(
            audioFilesRemoved: audioStats.filesRemoved,
            illustrationFilesRemoved: illustrationStats.filesRemoved,
            avatarFilesRemoved: avatarStats.filesRemoved,
            totalBytesFreed: totalBytesFreed,
            executionTime: executionTime
        )

        Logger.cache.info("✅ Cache eviction complete: \(statistics.totalFilesRemoved) files, \(statistics.humanReadableSize) freed")

        return statistics
    }

    // MARK: - Audio Eviction

    private func evictAudioFiles() async throws -> (filesRemoved: Int, bytesFreed: Int64) {
        let cutoffDate = Date().addingTimeInterval(-TimeInterval(policy.audioRetentionDays * 24 * 60 * 60))

        guard let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw CacheEvictionError.documentsDirectoryNotFound
        }

        let audioPath = documentsPath.appendingPathComponent("AudioStories")

        guard fileManager.fileExists(atPath: audioPath.path) else {
            return (0, 0)
        }

        return try await evictFilesInDirectory(
            audioPath,
            olderThan: cutoffDate,
            fileExtensions: ["mp3"],
            categoryName: "audio"
        )
    }

    // MARK: - Illustration Eviction

    private func evictIllustrationFiles() async throws -> (filesRemoved: Int, bytesFreed: Int64) {
        let cutoffDate = Date().addingTimeInterval(-TimeInterval(policy.illustrationRetentionDays * 24 * 60 * 60))

        guard let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw CacheEvictionError.documentsDirectoryNotFound
        }

        let illustrationPath = documentsPath.appendingPathComponent("StoryIllustrations")

        guard fileManager.fileExists(atPath: illustrationPath.path) else {
            return (0, 0)
        }

        return try await evictFilesInDirectory(
            illustrationPath,
            olderThan: cutoffDate,
            fileExtensions: ["png", "jpg", "jpeg"],
            categoryName: "illustration"
        )
    }

    // MARK: - Avatar Eviction

    private func evictAvatarFiles() async throws -> (filesRemoved: Int, bytesFreed: Int64) {
        let cutoffDate = Date().addingTimeInterval(-TimeInterval(policy.avatarRetentionDays * 24 * 60 * 60))

        guard let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw CacheEvictionError.documentsDirectoryNotFound
        }

        let avatarPath = documentsPath.appendingPathComponent("Avatars")

        guard fileManager.fileExists(atPath: avatarPath.path) else {
            return (0, 0)
        }

        return try await evictFilesInDirectory(
            avatarPath,
            olderThan: cutoffDate,
            fileExtensions: ["png", "jpg", "jpeg"],
            categoryName: "avatar"
        )
    }

    // MARK: - File Eviction Helper

    private func evictFilesInDirectory(
        _ directoryURL: URL,
        olderThan cutoffDate: Date,
        fileExtensions: [String],
        categoryName: String
    ) async throws -> (filesRemoved: Int, bytesFreed: Int64) {
        let files = try fileManager.contentsOfDirectory(
            at: directoryURL,
            includingPropertiesForKeys: [.contentModificationDateKey, .fileSizeKey],
            options: [.skipsHiddenFiles]
        )

        var filesRemoved = 0
        var bytesFreed: Int64 = 0

        for fileURL in files {
            // Check file extension
            guard fileExtensions.contains(fileURL.pathExtension.lowercased()) else {
                continue
            }

            // Get file modification date
            guard let resourceValues = try? fileURL.resourceValues(forKeys: [.contentModificationDateKey, .fileSizeKey]),
                  let modificationDate = resourceValues.contentModificationDate else {
                continue
            }

            // Check if file is older than cutoff
            if modificationDate < cutoffDate {
                let fileSize = resourceValues.fileSize ?? 0

                do {
                    try fileManager.removeItem(at: fileURL)
                    filesRemoved += 1
                    bytesFreed += Int64(fileSize)

                    Logger.cache.debug("Evicted \(categoryName) file: \(fileURL.lastPathComponent)")
                } catch {
                    Logger.cache.error("Failed to evict file: \(error)")
                }
            }
        }

        if filesRemoved > 0 {
            Logger.cache.info("Evicted \(filesRemoved) \(categoryName) files (\(bytesFreed.humanReadableSize))")
        }

        return (filesRemoved, bytesFreed)
    }

    // MARK: - Cache Size Calculation

    /// Get current cache size for all media types
    func getCacheSize() async throws -> CacheSizeInfo {
        guard let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw CacheEvictionError.documentsDirectoryNotFound
        }

        let audioSize = try await getDirectorySize(documentsPath.appendingPathComponent("AudioStories"))
        let illustrationSize = try await getDirectorySize(documentsPath.appendingPathComponent("StoryIllustrations"))
        let avatarSize = try await getDirectorySize(documentsPath.appendingPathComponent("Avatars"))

        return CacheSizeInfo(
            audioBytes: audioSize.bytes,
            audioFiles: audioSize.fileCount,
            illustrationBytes: illustrationSize.bytes,
            illustrationFiles: illustrationSize.fileCount,
            avatarBytes: avatarSize.bytes,
            avatarFiles: avatarSize.fileCount
        )
    }

    private func getDirectorySize(_ directoryURL: URL) async throws -> (bytes: Int64, fileCount: Int) {
        guard fileManager.fileExists(atPath: directoryURL.path) else {
            return (0, 0)
        }

        let files = try fileManager.contentsOfDirectory(
            at: directoryURL,
            includingPropertiesForKeys: [.fileSizeKey],
            options: [.skipsHiddenFiles]
        )

        var totalBytes: Int64 = 0
        var fileCount = 0

        for fileURL in files {
            if let resourceValues = try? fileURL.resourceValues(forKeys: [.fileSizeKey]),
               let fileSize = resourceValues.fileSize {
                totalBytes += Int64(fileSize)
                fileCount += 1
            }
        }

        return (totalBytes, fileCount)
    }
}

// MARK: - Cache Size Info

struct CacheSizeInfo {
    let audioBytes: Int64
    let audioFiles: Int
    let illustrationBytes: Int64
    let illustrationFiles: Int
    let avatarBytes: Int64
    let avatarFiles: Int

    var totalBytes: Int64 {
        return audioBytes + illustrationBytes + avatarBytes
    }

    var totalFiles: Int {
        return audioFiles + illustrationFiles + avatarFiles
    }

    var humanReadableTotal: String {
        return totalBytes.humanReadableSize
    }

    var description: String {
        """
        Cache Size:
        - Audio: \(audioFiles) files (\(audioBytes.humanReadableSize))
        - Illustrations: \(illustrationFiles) files (\(illustrationBytes.humanReadableSize))
        - Avatars: \(avatarFiles) files (\(avatarBytes.humanReadableSize))
        - Total: \(totalFiles) files (\(humanReadableTotal))
        """
    }
}

// MARK: - Cache Eviction Errors

enum CacheEvictionError: Error, LocalizedError {
    case documentsDirectoryNotFound
    case evictionFailed(String)

    var errorDescription: String? {
        switch self {
        case .documentsDirectoryNotFound:
            return "Documents directory not found"
        case .evictionFailed(let message):
            return "Cache eviction failed: \(message)"
        }
    }
}

// MARK: - Shared Instance

extension CacheEvictionService {
    static let shared = CacheEvictionService(policy: .default)
}

// MARK: - Background Task Support

extension CacheEvictionService {
    /// Run cache eviction as a background task
    func runBackgroundEviction() {
        Task {
            do {
                let stats = try await evictExpiredCache()
                Logger.cache.info("Background eviction completed: \(stats.description)")
            } catch {
                Logger.cache.error("Background eviction failed: \(error)")
            }
        }
    }

    /// Schedule periodic cache eviction (call on app launch)
    func schedulePeriodicEviction(interval: TimeInterval = 86400) { // Default: 24 hours
        Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            self?.runBackgroundEviction()
        }

        Logger.cache.info("Scheduled periodic cache eviction every \(interval/3600)h")
    }
}
