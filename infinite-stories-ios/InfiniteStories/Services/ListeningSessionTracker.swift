//
//  ListeningSessionTracker.swift
//  InfiniteStories
//
//  Tracks listening sessions for analytics reporting.
//  Handles pause/resume to track actual playback duration,
//  persists state for crash recovery, and reports sessions to backend.
//

import Foundation
import Combine
import UIKit

/// Tracks listening sessions for Reading Journey analytics
@MainActor
class ListeningSessionTracker: ObservableObject {

    // MARK: - Singleton

    static let shared = ListeningSessionTracker()

    // MARK: - Configuration

    /// Minimum session duration in seconds to report (ignore very short sessions)
    private let minimumSessionDuration: TimeInterval = 5.0

    /// UserDefaults keys for crash recovery
    private enum StorageKey {
        static let activeSession = "ListeningSessionTracker.activeSession"
        static let accumulatedDuration = "ListeningSessionTracker.accumulatedDuration"
        static let lastPauseTime = "ListeningSessionTracker.lastPauseTime"
    }

    // MARK: - Session State

    /// Currently active session data
    private(set) var activeSession: ActiveSession?

    /// Published state for UI observation
    @Published private(set) var isTracking: Bool = false
    @Published private(set) var currentStoryId: String?

    // MARK: - Dependencies

    private let readingJourneyRepository: ReadingJourneyRepositoryProtocol
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    private init() {
        self.readingJourneyRepository = ReadingJourneyRepository()

        // Restore any pending session from crash recovery
        restorePendingSession()

        // Setup app lifecycle observers
        setupNotificationObservers()

        Logger.audio.debug("ListeningSessionTracker initialized")
    }

    /// For testing purposes only
    init(readingJourneyRepository: ReadingJourneyRepositoryProtocol) {
        self.readingJourneyRepository = readingJourneyRepository

        // Restore any pending session from crash recovery
        restorePendingSession()

        // Setup app lifecycle observers
        setupNotificationObservers()

        Logger.audio.debug("ListeningSessionTracker initialized with custom repository")
    }

    // MARK: - Public API

    /// Start tracking a new listening session
    /// - Parameter storyId: The backend ID of the story being played
    func startSession(storyId: String) {
        Logger.audio.info("Starting listening session for story: \(storyId)")

        // If there's an existing session for a different story, end it first
        if let existingSession = activeSession, existingSession.storyId != storyId {
            Logger.audio.info("Ending previous session for story: \(existingSession.storyId)")
            Task {
                await endSession(completed: false)
            }
        }

        // Create new session or resume existing one for same story
        if activeSession?.storyId == storyId {
            // Same story, just resume tracking
            resumeSession()
        } else {
            // New story, create new session
            let session = ActiveSession(
                storyId: storyId,
                startedAt: Date(),
                accumulatedDuration: 0,
                isPlaying: true,
                lastResumeTime: Date()
            )
            activeSession = session
            isTracking = true
            currentStoryId = storyId

            // Persist for crash recovery
            persistSession()

            Logger.audio.success("New listening session started for story: \(storyId)")
        }
    }

    /// Pause the current session (user paused playback)
    func pauseSession() {
        guard var session = activeSession, session.isPlaying else {
            return
        }

        // Calculate duration since last resume
        if let lastResumeTime = session.lastResumeTime {
            let playedDuration = Date().timeIntervalSince(lastResumeTime)
            session.accumulatedDuration += playedDuration
            Logger.audio.debug("Paused session. Added \(String(format: "%.1f", playedDuration))s, total: \(String(format: "%.1f", session.accumulatedDuration))s")
        }

        session.isPlaying = false
        session.lastResumeTime = nil
        activeSession = session

        // Persist for crash recovery
        persistSession()
    }

    /// Resume the current session (user resumed playback)
    func resumeSession() {
        guard var session = activeSession, !session.isPlaying else {
            return
        }

        session.isPlaying = true
        session.lastResumeTime = Date()
        activeSession = session

        // Persist for crash recovery
        persistSession()

        Logger.audio.debug("Resumed listening session")
    }

    /// End the current session and report to backend
    /// - Parameter completed: Whether the story was played to completion
    func endSession(completed: Bool) async {
        guard var session = activeSession else {
            Logger.audio.debug("No active session to end")
            return
        }

        // If currently playing, accumulate final duration
        if session.isPlaying, let lastResumeTime = session.lastResumeTime {
            let playedDuration = Date().timeIntervalSince(lastResumeTime)
            session.accumulatedDuration += playedDuration
        }

        let totalDuration = session.accumulatedDuration
        let endedAt = Date()

        Logger.audio.info("Ending session for story: \(session.storyId), duration: \(String(format: "%.1f", totalDuration))s, completed: \(completed)")

        // Clear active session
        activeSession = nil
        isTracking = false
        currentStoryId = nil
        clearPersistedSession()

        // Only report if session meets minimum duration threshold
        guard totalDuration >= minimumSessionDuration else {
            Logger.audio.debug("Session too short (\(String(format: "%.1f", totalDuration))s < \(minimumSessionDuration)s), not reporting")
            return
        }

        // Report to backend
        await reportSession(
            storyId: session.storyId,
            startedAt: session.startedAt,
            endedAt: endedAt,
            duration: Int(totalDuration),
            completed: completed
        )
    }

    /// End session synchronously (for use in deinit or when async is not available)
    func endSessionSync(completed: Bool) {
        guard var session = activeSession else {
            return
        }

        // If currently playing, accumulate final duration
        if session.isPlaying, let lastResumeTime = session.lastResumeTime {
            let playedDuration = Date().timeIntervalSince(lastResumeTime)
            session.accumulatedDuration += playedDuration
        }

        let totalDuration = session.accumulatedDuration
        let endedAt = Date()

        // Clear active session
        activeSession = nil
        isTracking = false
        currentStoryId = nil

        // Store session data for later reporting (crash recovery pattern)
        if totalDuration >= minimumSessionDuration {
            let pendingReport = PendingSessionReport(
                storyId: session.storyId,
                startedAt: session.startedAt,
                endedAt: endedAt,
                duration: Int(totalDuration),
                completed: completed
            )
            persistPendingReport(pendingReport)
            Logger.audio.info("Stored pending session report for later submission")
        }

        clearPersistedSession()
    }

    /// Update accumulated duration based on current playback time
    /// Call this periodically during playback for more accurate tracking
    func updatePlaybackProgress(currentTime: TimeInterval) {
        // This method can be called to sync with AudioService's currentTime
        // For now, we rely on pause/resume tracking which is more accurate
    }

    // MARK: - Private Methods

    private func reportSession(storyId: String, startedAt: Date, endedAt: Date, duration: Int, completed: Bool) async {
        // Check network availability
        guard NetworkMonitor.shared.isConnected else {
            Logger.audio.warning("Network unavailable, storing session for later reporting")
            let pendingReport = PendingSessionReport(
                storyId: storyId,
                startedAt: startedAt,
                endedAt: endedAt,
                duration: duration,
                completed: completed
            )
            persistPendingReport(pendingReport)
            return
        }

        let request = ListeningSessionRequest(
            storyId: storyId,
            startedAt: startedAt,
            endedAt: endedAt,
            duration: duration,
            completed: completed
        )

        do {
            let session = try await readingJourneyRepository.reportSession(request)
            Logger.audio.success("Reported listening session: \(session.id), duration: \(duration)s, completed: \(completed)")
        } catch {
            Logger.audio.error("Failed to report session: \(error.localizedDescription)")

            // Store for retry later
            let pendingReport = PendingSessionReport(
                storyId: storyId,
                startedAt: startedAt,
                endedAt: endedAt,
                duration: duration,
                completed: completed
            )
            persistPendingReport(pendingReport)
        }
    }

    // MARK: - Persistence for Crash Recovery

    private func persistSession() {
        guard let session = activeSession else {
            clearPersistedSession()
            return
        }

        let data: [String: Any] = [
            "storyId": session.storyId,
            "startedAt": session.startedAt.timeIntervalSince1970,
            "accumulatedDuration": session.accumulatedDuration,
            "isPlaying": session.isPlaying,
            "lastResumeTime": session.lastResumeTime?.timeIntervalSince1970 ?? 0
        ]

        UserDefaults.standard.set(data, forKey: StorageKey.activeSession)
    }

    private func clearPersistedSession() {
        UserDefaults.standard.removeObject(forKey: StorageKey.activeSession)
    }

    private func restorePendingSession() {
        // First, try to report any pending reports from previous crashes
        Task {
            await reportPendingReports()
        }

        // Then restore any active session
        guard let data = UserDefaults.standard.dictionary(forKey: StorageKey.activeSession),
              let storyId = data["storyId"] as? String,
              let startedAtInterval = data["startedAt"] as? TimeInterval,
              let accumulatedDuration = data["accumulatedDuration"] as? TimeInterval else {
            return
        }

        let startedAt = Date(timeIntervalSince1970: startedAtInterval)

        // If the session was from more than 24 hours ago, discard it
        if Date().timeIntervalSince(startedAt) > 86400 {
            Logger.audio.debug("Discarding stale session from crash recovery")
            clearPersistedSession()
            return
        }

        Logger.audio.info("Restored session from crash recovery for story: \(storyId)")

        // End the recovered session (app was terminated, so it wasn't completed)
        let endedAt = Date()
        let duration = Int(accumulatedDuration)

        clearPersistedSession()

        // Report if it meets minimum duration
        if duration >= Int(minimumSessionDuration) {
            Task {
                await reportSession(
                    storyId: storyId,
                    startedAt: startedAt,
                    endedAt: endedAt,
                    duration: duration,
                    completed: false
                )
            }
        }
    }

    // MARK: - Pending Reports Storage

    private let pendingReportsKey = "ListeningSessionTracker.pendingReports"

    private func persistPendingReport(_ report: PendingSessionReport) {
        var reports = loadPendingReports()
        reports.append(report)

        // Keep only last 50 pending reports to prevent unbounded growth
        if reports.count > 50 {
            reports = Array(reports.suffix(50))
        }

        if let data = try? JSONEncoder().encode(reports) {
            UserDefaults.standard.set(data, forKey: pendingReportsKey)
        }
    }

    private func loadPendingReports() -> [PendingSessionReport] {
        guard let data = UserDefaults.standard.data(forKey: pendingReportsKey),
              let reports = try? JSONDecoder().decode([PendingSessionReport].self, from: data) else {
            return []
        }
        return reports
    }

    private func clearPendingReports() {
        UserDefaults.standard.removeObject(forKey: pendingReportsKey)
    }

    private func reportPendingReports() async {
        let reports = loadPendingReports()
        guard !reports.isEmpty else { return }

        Logger.audio.info("Found \(reports.count) pending session reports to submit")

        guard NetworkMonitor.shared.isConnected else {
            Logger.audio.debug("Network unavailable, will retry pending reports later")
            return
        }

        var failedReports: [PendingSessionReport] = []

        for report in reports {
            // Skip reports older than 7 days
            if Date().timeIntervalSince(report.startedAt) > 604800 {
                Logger.audio.debug("Discarding stale pending report from \(report.startedAt)")
                continue
            }

            let request = ListeningSessionRequest(
                storyId: report.storyId,
                startedAt: report.startedAt,
                endedAt: report.endedAt,
                duration: report.duration,
                completed: report.completed
            )

            do {
                _ = try await readingJourneyRepository.reportSession(request)
                Logger.audio.success("Reported pending session for story: \(report.storyId)")
            } catch {
                Logger.audio.error("Failed to report pending session: \(error.localizedDescription)")
                failedReports.append(report)
            }
        }

        // Clear all pending reports and re-save only failed ones
        clearPendingReports()
        for report in failedReports {
            persistPendingReport(report)
        }
    }

    // MARK: - Notification Observers

    private func setupNotificationObservers() {
        // App will terminate
        NotificationCenter.default.addObserver(
            forName: UIApplication.willTerminateNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleAppTermination()
        }

        // App will resign active (going to background)
        NotificationCenter.default.addObserver(
            forName: UIApplication.willResignActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleAppWillResignActive()
        }

        // App did become active (coming to foreground)
        NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleAppDidBecomeActive()
        }

        // Network became available - try to report pending sessions
        NotificationCenter.default.addObserver(
            forName: .networkStatusChanged,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            if let isConnected = notification.userInfo?["isConnected"] as? Bool, isConnected {
                Task { @MainActor in
                    await self?.reportPendingReports()
                }
            }
        }
    }

    private func handleAppTermination() {
        Logger.audio.info("App terminating, saving session state")

        // The session is already persisted, but make sure we mark it as not playing
        if var session = activeSession {
            // Accumulate any remaining duration
            if session.isPlaying, let lastResumeTime = session.lastResumeTime {
                let playedDuration = Date().timeIntervalSince(lastResumeTime)
                session.accumulatedDuration += playedDuration
            }
            session.isPlaying = false
            session.lastResumeTime = nil
            activeSession = session
            persistSession()
        }
    }

    private func handleAppWillResignActive() {
        Logger.audio.debug("App will resign active, persisting session")
        persistSession()
    }

    private func handleAppDidBecomeActive() {
        Logger.audio.debug("App did become active")

        // Try to report any pending reports
        Task {
            await reportPendingReports()
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - Supporting Types

extension ListeningSessionTracker {

    /// Represents an active listening session
    struct ActiveSession {
        let storyId: String
        let startedAt: Date
        var accumulatedDuration: TimeInterval
        var isPlaying: Bool
        var lastResumeTime: Date?
    }

    /// Represents a session report that failed to send and needs retry
    struct PendingSessionReport: Codable {
        let storyId: String
        let startedAt: Date
        let endedAt: Date
        let duration: Int
        let completed: Bool
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let networkStatusChanged = Notification.Name("networkStatusChanged")
}
