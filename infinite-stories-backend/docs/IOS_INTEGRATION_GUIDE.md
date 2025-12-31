# iOS Integration Guide: Reading Journey Analytics

## Overview

This guide provides Swift code examples for integrating the Reading Journey Analytics API into the iOS app.

## Prerequisites

- Backend API running at base URL (e.g., `https://api.infinitestories.app`)
- Valid authentication token from Better Auth
- Story ID from backend API

## API Models

### Swift Data Models

```swift
import Foundation

// MARK: - Listening Session

struct ListeningSession: Codable, Identifiable {
    let id: String
    let userId: String
    let storyId: String
    let startedAt: Date
    let endedAt: Date?
    let duration: Int? // seconds
    let completed: Bool
    let createdAt: Date
    let updatedAt: Date
}

// MARK: - Analytics Cache

struct UserAnalytics: Codable {
    let totalStoriesListened: Int
    let totalListeningTimeSeconds: Int
    let currentStreak: Int
    let longestStreak: Int
    let lastListeningDate: Date?

    // Computed properties for UI
    var totalListeningTimeMinutes: Int {
        totalListeningTimeSeconds / 60
    }

    var totalListeningTimeHours: Double {
        Double(totalListeningTimeSeconds) / 3600.0
    }
}

// MARK: - API Responses

struct CreateSessionRequest: Codable {
    let storyId: String
    let startedAt: Date?
    let endedAt: Date?
    let duration: Int?
    let completed: Bool?
}

struct ApiResponse<T: Codable>: Codable {
    let data: T
    let message: String?
}

struct ApiError: Codable {
    let error: String
    let message: String
    let details: [String: String]?
}
```

## Repository Layer

### AnalyticsRepository.swift

```swift
import Foundation

class AnalyticsRepository {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    // MARK: - Create Session

    /// Records a listening session
    /// - Parameters:
    ///   - storyId: ID of the story listened to
    ///   - startedAt: When listening started (optional, defaults to now)
    ///   - endedAt: When listening ended (optional)
    ///   - duration: Duration in seconds (optional, auto-calculated if startedAt/endedAt provided)
    ///   - completed: Whether story was fully listened to
    /// - Returns: Created listening session
    func createSession(
        storyId: String,
        startedAt: Date? = nil,
        endedAt: Date? = nil,
        duration: Int? = nil,
        completed: Bool = false
    ) async throws -> ListeningSession {
        let request = CreateSessionRequest(
            storyId: storyId,
            startedAt: startedAt,
            endedAt: endedAt,
            duration: duration,
            completed: completed
        )

        let response: ApiResponse<ListeningSession> = try await apiClient.post(
            "/api/v1/analytics/sessions",
            body: request
        )

        return response.data
    }

    // MARK: - Get Sessions

    /// Retrieves user's listening sessions
    /// - Parameters:
    ///   - storyId: Filter by story ID (optional)
    ///   - startDate: Filter sessions starting on or after this date (optional)
    ///   - endDate: Filter sessions starting on or before this date (optional)
    ///   - completed: Filter by completion status (optional)
    ///   - limit: Number of results (default: 50, max: 100)
    ///   - offset: Pagination offset (default: 0)
    /// - Returns: Array of listening sessions and pagination info
    func getSessions(
        storyId: String? = nil,
        startDate: Date? = nil,
        endDate: Date? = nil,
        completed: Bool? = nil,
        limit: Int = 50,
        offset: Int = 0
    ) async throws -> (sessions: [ListeningSession], total: Int, hasMore: Bool) {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "limit", value: "\(limit)"),
            URLQueryItem(name: "offset", value: "\(offset)")
        ]

        if let storyId = storyId {
            queryItems.append(URLQueryItem(name: "storyId", value: storyId))
        }

        if let startDate = startDate {
            let iso8601 = ISO8601DateFormatter().string(from: startDate)
            queryItems.append(URLQueryItem(name: "startDate", value: iso8601))
        }

        if let endDate = endDate {
            let iso8601 = ISO8601DateFormatter().string(from: endDate)
            queryItems.append(URLQueryItem(name: "endDate", value: iso8601))
        }

        if let completed = completed {
            queryItems.append(URLQueryItem(name: "completed", value: "\(completed)"))
        }

        struct SessionsResponse: Codable {
            let sessions: [ListeningSession]
            let pagination: Pagination

            struct Pagination: Codable {
                let total: Int
                let limit: Int
                let offset: Int
                let hasMore: Bool
            }
        }

        let response: ApiResponse<SessionsResponse> = try await apiClient.get(
            "/api/v1/analytics/sessions",
            queryItems: queryItems
        )

        return (
            sessions: response.data.sessions,
            total: response.data.pagination.total,
            hasMore: response.data.pagination.hasMore
        )
    }

    // MARK: - Get Analytics

    /// Retrieves aggregated analytics for the user
    /// - Returns: User analytics with stats and streaks
    func getAnalytics() async throws -> UserAnalytics {
        let response: ApiResponse<UserAnalytics> = try await apiClient.get(
            "/api/v1/analytics"
        )

        return response.data
    }
}
```

## Usage Examples

### 1. Track Story Playback

```swift
class AudioPlayerViewModel: ObservableObject {
    @Published var story: Story
    private let analyticsRepository: AnalyticsRepository

    private var playbackStartTime: Date?

    func onPlaybackStarted() {
        playbackStartTime = Date()
    }

    func onPlaybackCompleted() async {
        guard let startTime = playbackStartTime else { return }

        let endTime = Date()
        let duration = Int(endTime.timeIntervalSince(startTime))

        do {
            _ = try await analyticsRepository.createSession(
                storyId: story.id,
                startedAt: startTime,
                endedAt: endTime,
                duration: duration,
                completed: true
            )

            Logger.shared.info("Listening session recorded successfully")
        } catch {
            Logger.shared.error("Failed to record session: \(error)")
        }
    }

    func onPlaybackStopped() async {
        guard let startTime = playbackStartTime else { return }

        let endTime = Date()
        let duration = Int(endTime.timeIntervalSince(startTime))

        do {
            _ = try await analyticsRepository.createSession(
                storyId: story.id,
                startedAt: startTime,
                endedAt: endTime,
                duration: duration,
                completed: false // User stopped before completion
            )
        } catch {
            Logger.shared.error("Failed to record partial session: \(error)")
        }
    }
}
```

### 2. Display Reading Journey Stats

```swift
struct ReadingJourneyView: View {
    @StateObject private var viewModel = ReadingJourneyViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Streak Card
                StatsCard(
                    title: "Current Streak",
                    value: "\(viewModel.analytics?.currentStreak ?? 0)",
                    subtitle: "days",
                    icon: "flame.fill"
                )

                // Total Stories
                StatsCard(
                    title: "Stories Listened",
                    value: "\(viewModel.analytics?.totalStoriesListened ?? 0)",
                    subtitle: "total",
                    icon: "book.fill"
                )

                // Listening Time
                StatsCard(
                    title: "Listening Time",
                    value: String(format: "%.1f", viewModel.analytics?.totalListeningTimeHours ?? 0),
                    subtitle: "hours",
                    icon: "headphones"
                )

                // Longest Streak
                StatsCard(
                    title: "Longest Streak",
                    value: "\(viewModel.analytics?.longestStreak ?? 0)",
                    subtitle: "days",
                    icon: "star.fill"
                )
            }
            .padding()
        }
        .task {
            await viewModel.loadAnalytics()
        }
    }
}

@MainActor
class ReadingJourneyViewModel: ObservableObject {
    @Published var analytics: UserAnalytics?
    @Published var sessions: [ListeningSession] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let analyticsRepository: AnalyticsRepository

    init(analyticsRepository: AnalyticsRepository = AnalyticsRepository()) {
        self.analyticsRepository = analyticsRepository
    }

    func loadAnalytics() async {
        isLoading = true
        defer { isLoading = false }

        do {
            analytics = try await analyticsRepository.getAnalytics()
        } catch {
            self.error = error
            Logger.shared.error("Failed to load analytics: \(error)")
        }
    }

    func loadRecentSessions(limit: Int = 20) async {
        do {
            let result = try await analyticsRepository.getSessions(
                completed: true,
                limit: limit,
                offset: 0
            )
            sessions = result.sessions
        } catch {
            self.error = error
            Logger.shared.error("Failed to load sessions: \(error)")
        }
    }
}
```

### 3. Background Session Tracking

```swift
import BackgroundTasks

class SessionTracker: ObservableObject {
    private let analyticsRepository: AnalyticsRepository
    private var currentSession: (storyId: String, startTime: Date)?

    init(analyticsRepository: AnalyticsRepository = AnalyticsRepository()) {
        self.analyticsRepository = analyticsRepository
    }

    /// Call when audio playback starts
    func startTracking(storyId: String) {
        currentSession = (storyId, Date())
        Logger.shared.debug("Started tracking session for story: \(storyId)")
    }

    /// Call when audio playback completes
    func endTracking(completed: Bool) {
        guard let session = currentSession else {
            Logger.shared.warning("No active session to end")
            return
        }

        Task {
            do {
                let duration = Int(Date().timeIntervalSince(session.startTime))

                _ = try await analyticsRepository.createSession(
                    storyId: session.storyId,
                    startedAt: session.startTime,
                    endedAt: Date(),
                    duration: duration,
                    completed: completed
                )

                Logger.shared.info("Session recorded: \(duration)s, completed: \(completed)")
            } catch {
                Logger.shared.error("Failed to record session: \(error)")
            }
        }

        currentSession = nil
    }

    /// Call when app enters background (save partial session)
    func pauseTracking() {
        guard let session = currentSession else { return }

        Task {
            do {
                let duration = Int(Date().timeIntervalSince(session.startTime))

                _ = try await analyticsRepository.createSession(
                    storyId: session.storyId,
                    startedAt: session.startTime,
                    endedAt: Date(),
                    duration: duration,
                    completed: false
                )

                Logger.shared.debug("Partial session saved: \(duration)s")
            } catch {
                Logger.shared.error("Failed to save partial session: \(error)")
            }
        }
    }
}
```

## Error Handling

```swift
enum AnalyticsError: LocalizedError {
    case networkError(Error)
    case unauthorized
    case storyNotFound
    case validationError(String)
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .unauthorized:
            return "You must be signed in to track listening sessions"
        case .storyNotFound:
            return "Story not found"
        case .validationError(let message):
            return "Validation error: \(message)"
        case .serverError(let message):
            return "Server error: \(message)"
        }
    }
}

extension APIClient {
    func handleAnalyticsError(_ error: Error) -> AnalyticsError {
        if let apiError = error as? APIError {
            switch apiError {
            case .unauthorized:
                return .unauthorized
            case .notFound:
                return .storyNotFound
            case .validationError(let message):
                return .validationError(message)
            case .serverError(let message):
                return .serverError(message)
            default:
                return .networkError(error)
            }
        }
        return .networkError(error)
    }
}
```

## Testing

### Unit Tests

```swift
import XCTest
@testable import InfiniteStories

class AnalyticsRepositoryTests: XCTestCase {
    var sut: AnalyticsRepository!
    var mockAPIClient: MockAPIClient!

    override func setUp() {
        super.setUp()
        mockAPIClient = MockAPIClient()
        sut = AnalyticsRepository(apiClient: mockAPIClient)
    }

    func testCreateSession_Success() async throws {
        // Given
        let storyId = "story_123"
        let duration = 300
        let expectedSession = ListeningSession(
            id: "session_abc",
            userId: "user_xyz",
            storyId: storyId,
            startedAt: Date(),
            endedAt: nil,
            duration: duration,
            completed: true,
            createdAt: Date(),
            updatedAt: Date()
        )

        mockAPIClient.mockResponse = ApiResponse(
            data: expectedSession,
            message: "Session created"
        )

        // When
        let session = try await sut.createSession(
            storyId: storyId,
            duration: duration,
            completed: true
        )

        // Then
        XCTAssertEqual(session.id, expectedSession.id)
        XCTAssertEqual(session.storyId, storyId)
        XCTAssertEqual(session.duration, duration)
        XCTAssertTrue(session.completed)
    }

    func testGetAnalytics_Success() async throws {
        // Given
        let expectedAnalytics = UserAnalytics(
            totalStoriesListened: 42,
            totalListeningTimeSeconds: 25200,
            currentStreak: 7,
            longestStreak: 14,
            lastListeningDate: Date()
        )

        mockAPIClient.mockResponse = ApiResponse(
            data: expectedAnalytics,
            message: nil
        )

        // When
        let analytics = try await sut.getAnalytics()

        // Then
        XCTAssertEqual(analytics.totalStoriesListened, 42)
        XCTAssertEqual(analytics.currentStreak, 7)
        XCTAssertEqual(analytics.longestStreak, 14)
    }
}
```

## Best Practices

### 1. Track Sessions Reliably

- Start tracking when audio begins playing
- End tracking when audio completes or user stops
- Save partial sessions when app enters background
- Handle network failures gracefully (retry logic)

### 2. Optimize Network Calls

- Batch session creation when possible
- Cache analytics data locally
- Refresh analytics only when needed (e.g., on view appearance)
- Use background tasks for non-critical updates

### 3. Handle Edge Cases

- User skips through story quickly → Duration capped by backend
- App crashes during playback → Save sessions periodically
- No network connection → Queue sessions for later upload
- Multiple rapid plays → Each session tracked separately

### 4. Privacy & Security

- Only track authenticated users
- Never track sensitive story content
- Respect user's analytics preferences
- Clear sessions on logout

## Migration from SwiftData

If migrating from local SwiftData storage:

1. **Keep SwiftData for UI-only data** (temporary states, preferences)
2. **Use API for source of truth** (sessions, analytics)
3. **Remove local aggregation logic** (backend handles it)
4. **Update ViewModels** to fetch from repository instead of SwiftData

Example migration:

```swift
// OLD (SwiftData)
@Query var sessions: [LocalListeningSession]
var totalStories: Int { sessions.filter { $0.completed }.count }

// NEW (API)
@Published var analytics: UserAnalytics?
var totalStories: Int { analytics?.totalStoriesListened ?? 0 }
```

## Performance Tips

- **Cache analytics**: Store in `@AppStorage` or UserDefaults
- **Lazy loading**: Load sessions on-demand, not all at once
- **Pagination**: Use limit/offset for large session lists
- **Background refresh**: Update analytics in background periodically

## Support

For issues or questions:
- Backend API: `/Users/captaindev404/Code/Github/infinite-stories/infinite-stories-backend`
- API Documentation: `docs/API_ANALYTICS.md`
- OpenSpec changes: `openspec/` directory
