## 1. Backend: Analytics Collection

- [x] 1.1 Create `listening_sessions` table (storyId, userId, startedAt, endedAt, duration, completed)
- [x] 1.2 Create `user_analytics_cache` table for pre-computed aggregates
- [x] 1.3 Add `POST /api/v1/analytics/sessions` route with validation
- [x] 1.4 Implement session duration capping (1.5x estimated)
- [x] 1.5 Add database trigger/job to update aggregated stats on session insert

## 2. Backend: Summary Endpoint

- [x] 2.1 Create `GET /api/v1/analytics/summary` route
- [x] 2.2 Implement total stories count query
- [x] 2.3 Implement total listening time aggregation
- [x] 2.4 Implement streak calculation with timezone support
- [x] 2.5 Implement favorites count query
- [x] 2.6 Add integration tests for summary endpoint

## 3. Backend: Activity Endpoint

- [x] 3.1 Create `GET /api/v1/analytics/activity` route with range parameter
- [x] 3.2 Implement daily aggregation query for listening minutes
- [x] 3.3 Handle missing days (return 0 minutes)
- [x] 3.4 Add integration tests for week/month/year ranges

## 4. Backend: Heroes Endpoint

- [x] 4.1 Create `GET /api/v1/analytics/heroes` route
- [x] 4.2 Implement per-hero story count aggregation
- [x] 4.3 Implement per-hero listening time aggregation
- [x] 4.4 Add `isMostActive` flag computation
- [x] 4.5 Add integration tests for hero analytics

## 5. Backend: Milestones Endpoint

- [x] 5.1 Define milestone definitions (stories: 1,5,10,25,50; time: 1h,5h; streak: 7d,30d)
- [x] 5.2 Create `GET /api/v1/analytics/milestones` route
- [x] 5.3 Implement milestone unlock detection
- [x] 5.4 Store `unlockedAt` timestamps in database
- [x] 5.5 Add integration tests for milestone progression

## 6. Backend: Insights Endpoint

- [x] 6.1 Create `GET /api/v1/analytics/insights` route
- [x] 6.2 Implement average story length calculation
- [x] 6.3 Implement average listens per story
- [x] 6.4 Implement preferred listening hour analysis
- [x] 6.5 Implement most listened story query
- [x] 6.6 Add integration tests for insights

## 7. iOS: Network Layer

- [x] 7.1 Add `Endpoint` cases for all analytics routes
- [x] 7.2 Create `AnalyticsSummaryResponse` DTO
- [x] 7.3 Create `ListeningActivityResponse` DTO
- [x] 7.4 Create `HeroAnalyticsResponse` DTO
- [x] 7.5 Create `MilestoneResponse` DTO
- [x] 7.6 Create `InsightsResponse` DTO
- [x] 7.7 Create `ListeningSessionRequest` DTO

## 8. iOS: Repository

- [x] 8.1 Create `ReadingJourneyRepository` protocol
- [x] 8.2 Implement `fetchSummary()` method
- [x] 8.3 Implement `fetchActivity(range:)` method
- [x] 8.4 Implement `fetchHeroAnalytics()` method
- [x] 8.5 Implement `fetchMilestones()` method
- [x] 8.6 Implement `fetchInsights()` method
- [x] 8.7 Implement `reportSession(_:)` method
- [x] 8.8 Add response caching with 5-minute TTL
- [x] 8.9 Add force refresh capability

## 9. iOS: Session Tracking

- [x] 9.1 Add session start/end tracking in `AudioService`
- [x] 9.2 Track actual playback duration (handling pause/resume)
- [x] 9.3 Send session on playback completion
- [x] 9.4 Send session on user exit/dismiss
- [x] 9.5 Handle edge cases (app backgrounding, crash recovery)

## 10. iOS: View Migration

- [x] 10.1 Remove `@Query` from `ReadingJourneyTabContent`
- [x] 10.2 Remove `@Query` from `ReadingJourneyView`
- [x] 10.3 Add `@State` for loading/error/data states
- [x] 10.4 Inject `ReadingJourneyRepository` via init or environment
- [x] 10.5 Fetch data on `.task` modifier
- [x] 10.6 Add pull-to-refresh support
- [x] 10.7 Add loading indicators during fetch
- [x] 10.8 Add `ErrorView` for failure states
- [x] 10.9 Update `HeaderStatsSection` to accept DTO
- [x] 10.10 Update `ListeningActivityChart` to use API data
- [x] 10.11 Update `HeroPerformanceSection` to use API data
- [x] 10.12 Update `MilestonesSection` to use API data
- [x] 10.13 Update `RecentActivitySection` to use stories from `StoryRepository`
- [x] 10.14 Update `FavoriteStoriesSection` to use stories from `StoryRepository`
- [x] 10.15 Update `ReadingInsightsSection` to use API data

## 11. Testing

- [x] 11.1 Add unit tests for `ReadingJourneyRepository`
- [x] 11.2 Add unit tests for session tracking logic
- [x] 11.3 Add UI tests for loading states
- [x] 11.4 Add UI tests for error handling
- [x] 11.5 Test offline behavior (show error, block usage)

## 12. Cleanup

- [x] 12.1 Remove local `TimeRange` enum (use shared DTO)
- [x] 12.2 Remove local `Milestone` struct (use API response)
- [x] 12.3 Remove computed stats from views (streak calculation, etc.)
- [x] 12.4 Update `RelativeDateFormatter` usage if needed
- [x] 12.5 Verify no remaining `@Query` usage for stats
