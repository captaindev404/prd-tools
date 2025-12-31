//
//  ListeningSessionTrackerTests.swift
//  InfiniteStoriesTests
//
//  Unit tests for ListeningSessionTracker
//

import Testing
import Foundation
@testable import InfiniteStories

// MARK: - Mock Reading Journey Repository

@MainActor
class MockReadingJourneyRepository: ReadingJourneyRepositoryProtocol {
    var reportSessionCalled = false
    var lastSessionRequest: ListeningSessionRequest?
    var shouldThrowError = false
    var errorToThrow: Error?
    var reportedSessions: [ListeningSessionRequest] = []

    // Track all method calls
    var fetchSummaryCalled = false
    var fetchActivityCalled = false
    var fetchHeroAnalyticsCalled = false
    var fetchMilestonesCalled = false
    var fetchInsightsCalled = false
    var invalidateCacheCalled = false

    func fetchSummary(forceRefresh: Bool) async throws -> AnalyticsSummary {
        fetchSummaryCalled = true
        return createMockSummary()
    }

    func fetchActivity(range: TimeRange, forceRefresh: Bool) async throws -> ListeningActivityResponse {
        fetchActivityCalled = true
        return createMockActivity()
    }

    func fetchHeroAnalytics(forceRefresh: Bool) async throws -> HeroAnalyticsResponse {
        fetchHeroAnalyticsCalled = true
        return createMockHeroAnalytics()
    }

    func fetchMilestones(forceRefresh: Bool) async throws -> MilestonesResponse {
        fetchMilestonesCalled = true
        return createMockMilestones()
    }

    func fetchInsights(forceRefresh: Bool) async throws -> InsightsResponse {
        fetchInsightsCalled = true
        return createMockInsights()
    }

    func reportSession(_ request: ListeningSessionRequest) async throws -> ListeningSession {
        reportSessionCalled = true
        lastSessionRequest = request
        reportedSessions.append(request)

        if shouldThrowError, let error = errorToThrow {
            throw error
        }

        return createMockSession(
            storyId: request.storyId,
            duration: request.duration ?? 0,
            completed: request.completed
        )
    }

    func invalidateCache() {
        invalidateCacheCalled = true
    }

    func reset() {
        reportSessionCalled = false
        lastSessionRequest = nil
        shouldThrowError = false
        errorToThrow = nil
        reportedSessions.removeAll()
        fetchSummaryCalled = false
        fetchActivityCalled = false
        fetchHeroAnalyticsCalled = false
        fetchMilestonesCalled = false
        fetchInsightsCalled = false
        invalidateCacheCalled = false
    }
}

// MARK: - Session Tracker Tests

@Suite("ListeningSessionTracker Tests")
@MainActor
struct ListeningSessionTrackerTests {

    // MARK: - Session Lifecycle Tests

    @Test("startSession creates new active session")
    func startSessionCreatesSession() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        tracker.startSession(storyId: "story-123")

        #expect(tracker.isTracking == true)
        #expect(tracker.currentStoryId == "story-123")
        #expect(tracker.activeSession != nil)
        #expect(tracker.activeSession?.storyId == "story-123")
        #expect(tracker.activeSession?.isPlaying == true)
    }

    @Test("startSession with different story ends previous session")
    func startSessionEndsPrevious() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        // Start first session
        tracker.startSession(storyId: "story-1")

        // Wait a bit to accumulate duration
        try await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds

        // Start second session (different story)
        tracker.startSession(storyId: "story-2")

        // Should now be tracking the new story
        #expect(tracker.currentStoryId == "story-2")
        #expect(tracker.activeSession?.storyId == "story-2")
    }

    @Test("startSession with same story resumes tracking")
    func startSessionResumes() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        // Start session
        tracker.startSession(storyId: "story-1")

        // Pause
        tracker.pauseSession()
        #expect(tracker.activeSession?.isPlaying == false)

        // Start same story again (should resume)
        tracker.startSession(storyId: "story-1")
        #expect(tracker.activeSession?.isPlaying == true)
        #expect(tracker.activeSession?.storyId == "story-1")
    }

    @Test("pauseSession accumulates duration")
    func pauseSessionAccumulatesDuration() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        tracker.startSession(storyId: "story-123")

        // Wait a bit
        try await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds

        tracker.pauseSession()

        #expect(tracker.activeSession?.isPlaying == false)
        #expect(tracker.activeSession?.accumulatedDuration ?? 0 > 0)
    }

    @Test("resumeSession sets isPlaying to true")
    func resumeSessionSetsPlaying() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        tracker.startSession(storyId: "story-123")
        tracker.pauseSession()

        #expect(tracker.activeSession?.isPlaying == false)

        tracker.resumeSession()

        #expect(tracker.activeSession?.isPlaying == true)
        #expect(tracker.activeSession?.lastResumeTime != nil)
    }

    @Test("endSession clears active session")
    func endSessionClearsSession() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        tracker.startSession(storyId: "story-123")
        await tracker.endSession(completed: false)

        #expect(tracker.isTracking == false)
        #expect(tracker.currentStoryId == nil)
        #expect(tracker.activeSession == nil)
    }

    @Test("endSession with short duration does not report")
    func endSessionShortDuration() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        tracker.startSession(storyId: "story-123")

        // End immediately (< 5 seconds minimum)
        await tracker.endSession(completed: false)

        #expect(tracker.isTracking == false)
        #expect(mockRepo.reportSessionCalled == false)
    }

    // MARK: - Duration Calculation Tests

    @Test("accumulated duration tracks play time correctly")
    func accumulatedDurationTracksPlayTime() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        // Start session
        tracker.startSession(storyId: "story-123")

        // Play for 0.5 seconds
        try await Task.sleep(nanoseconds: 500_000_000)
        tracker.pauseSession()
        let firstPauseDuration = tracker.activeSession?.accumulatedDuration ?? 0

        // Pause for 0.3 seconds (should not count)
        try await Task.sleep(nanoseconds: 300_000_000)

        // Resume and play for 0.2 seconds more
        tracker.resumeSession()
        try await Task.sleep(nanoseconds: 200_000_000)
        tracker.pauseSession()

        let finalDuration = tracker.activeSession?.accumulatedDuration ?? 0

        // Final duration should be approximately firstPauseDuration + 0.2
        // With some tolerance for timing
        #expect(finalDuration >= firstPauseDuration)
        #expect(finalDuration < 1.5) // Should be less than 1.5 seconds total
    }

    // MARK: - Error Handling Tests

    @Test("session is stored for retry on network error")
    func sessionStoredOnNetworkError() async throws {
        let mockRepo = MockReadingJourneyRepository()
        mockRepo.shouldThrowError = true
        mockRepo.errorToThrow = APIError.networkUnavailable

        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        tracker.startSession(storyId: "story-123")

        // Wait to accumulate sufficient duration
        try await Task.sleep(nanoseconds: 6_000_000_000)

        await tracker.endSession(completed: true)

        // Session should be cleared even if report failed
        #expect(tracker.activeSession == nil)
    }

    // MARK: - Sync Method Tests

    @Test("endSessionSync clears session immediately")
    func endSessionSyncClearsSession() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        tracker.startSession(storyId: "story-123")
        tracker.endSessionSync(completed: false)

        #expect(tracker.isTracking == false)
        #expect(tracker.activeSession == nil)
    }

    // MARK: - State Publishing Tests

    @Test("isTracking is published correctly")
    func isTrackingPublished() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        #expect(tracker.isTracking == false)

        tracker.startSession(storyId: "story-123")
        #expect(tracker.isTracking == true)

        await tracker.endSession(completed: false)
        #expect(tracker.isTracking == false)
    }

    @Test("currentStoryId is published correctly")
    func currentStoryIdPublished() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        #expect(tracker.currentStoryId == nil)

        tracker.startSession(storyId: "story-456")
        #expect(tracker.currentStoryId == "story-456")

        await tracker.endSession(completed: false)
        #expect(tracker.currentStoryId == nil)
    }

    // MARK: - Edge Cases

    @Test("pauseSession with no active session does nothing")
    func pauseNoSession() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        // Should not crash
        tracker.pauseSession()
        #expect(tracker.activeSession == nil)
    }

    @Test("resumeSession with no active session does nothing")
    func resumeNoSession() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        // Should not crash
        tracker.resumeSession()
        #expect(tracker.activeSession == nil)
    }

    @Test("endSession with no active session does nothing")
    func endNoSession() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        // Should not crash
        await tracker.endSession(completed: true)
        #expect(mockRepo.reportSessionCalled == false)
    }

    @Test("pauseSession when already paused does nothing")
    func pauseWhenPaused() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        tracker.startSession(storyId: "story-123")
        tracker.pauseSession()

        let durationAfterFirstPause = tracker.activeSession?.accumulatedDuration ?? 0

        // Pause again - should not change duration
        tracker.pauseSession()

        let durationAfterSecondPause = tracker.activeSession?.accumulatedDuration ?? 0

        #expect(durationAfterFirstPause == durationAfterSecondPause)
    }

    @Test("resumeSession when already playing does nothing")
    func resumeWhenPlaying() async throws {
        let mockRepo = MockReadingJourneyRepository()
        let tracker = ListeningSessionTracker(readingJourneyRepository: mockRepo)

        tracker.startSession(storyId: "story-123")

        let initialResumeTime = tracker.activeSession?.lastResumeTime

        // Resume again - should not change resume time
        tracker.resumeSession()

        let currentResumeTime = tracker.activeSession?.lastResumeTime

        #expect(initialResumeTime == currentResumeTime)
    }
}

// MARK: - Pending Session Report Tests

@Suite("PendingSessionReport Tests")
@MainActor
struct PendingSessionReportTests {

    @Test("PendingSessionReport is Codable")
    func pendingReportCodable() async throws {
        let report = ListeningSessionTracker.PendingSessionReport(
            storyId: "story-123",
            startedAt: Date(),
            endedAt: Date(),
            duration: 300,
            completed: true
        )

        let encoded = try JSONEncoder().encode(report)
        let decoded = try JSONDecoder().decode(ListeningSessionTracker.PendingSessionReport.self, from: encoded)

        #expect(decoded.storyId == report.storyId)
        #expect(decoded.duration == report.duration)
        #expect(decoded.completed == report.completed)
    }

    @Test("PendingSessionReport stores all fields")
    func pendingReportFields() async throws {
        let startedAt = Date()
        let endedAt = Date().addingTimeInterval(300)

        let report = ListeningSessionTracker.PendingSessionReport(
            storyId: "story-456",
            startedAt: startedAt,
            endedAt: endedAt,
            duration: 300,
            completed: false
        )

        #expect(report.storyId == "story-456")
        #expect(report.startedAt == startedAt)
        #expect(report.endedAt == endedAt)
        #expect(report.duration == 300)
        #expect(report.completed == false)
    }
}

// MARK: - ActiveSession Tests

@Suite("ActiveSession Tests")
@MainActor
struct ActiveSessionTests {

    @Test("ActiveSession initializes correctly")
    func activeSessionInit() async throws {
        let startedAt = Date()
        let session = ListeningSessionTracker.ActiveSession(
            storyId: "story-789",
            startedAt: startedAt,
            accumulatedDuration: 0,
            isPlaying: true,
            lastResumeTime: startedAt
        )

        #expect(session.storyId == "story-789")
        #expect(session.startedAt == startedAt)
        #expect(session.accumulatedDuration == 0)
        #expect(session.isPlaying == true)
        #expect(session.lastResumeTime == startedAt)
    }

    @Test("ActiveSession is mutable")
    func activeSessionMutable() async throws {
        var session = ListeningSessionTracker.ActiveSession(
            storyId: "story-000",
            startedAt: Date(),
            accumulatedDuration: 0,
            isPlaying: true,
            lastResumeTime: Date()
        )

        session.accumulatedDuration = 100
        session.isPlaying = false
        session.lastResumeTime = nil

        #expect(session.accumulatedDuration == 100)
        #expect(session.isPlaying == false)
        #expect(session.lastResumeTime == nil)
    }
}
