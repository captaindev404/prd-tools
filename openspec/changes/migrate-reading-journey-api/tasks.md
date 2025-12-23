## 1. Backend: Analytics Collection

- [ ] 1.1 Create `listening_sessions` table (storyId, userId, startedAt, endedAt, duration, completed)
- [ ] 1.2 Create `user_analytics_cache` table for pre-computed aggregates
- [ ] 1.3 Add `POST /api/v1/analytics/sessions` route with validation
- [ ] 1.4 Implement session duration capping (1.5x estimated)
- [ ] 1.5 Add database trigger/job to update aggregated stats on session insert

## 2. Backend: Summary Endpoint

- [ ] 2.1 Create `GET /api/v1/analytics/summary` route
- [ ] 2.2 Implement total stories count query
- [ ] 2.3 Implement total listening time aggregation
- [ ] 2.4 Implement streak calculation with timezone support
- [ ] 2.5 Implement favorites count query
- [ ] 2.6 Add integration tests for summary endpoint

## 3. Backend: Activity Endpoint

- [ ] 3.1 Create `GET /api/v1/analytics/activity` route with range parameter
- [ ] 3.2 Implement daily aggregation query for listening minutes
- [ ] 3.3 Handle missing days (return 0 minutes)
- [ ] 3.4 Add integration tests for week/month/year ranges

## 4. Backend: Heroes Endpoint

- [ ] 4.1 Create `GET /api/v1/analytics/heroes` route
- [ ] 4.2 Implement per-hero story count aggregation
- [ ] 4.3 Implement per-hero listening time aggregation
- [ ] 4.4 Add `isMostActive` flag computation
- [ ] 4.5 Add integration tests for hero analytics

## 5. Backend: Milestones Endpoint

- [ ] 5.1 Define milestone definitions (stories: 1,5,10,25,50; time: 1h,5h; streak: 7d,30d)
- [ ] 5.2 Create `GET /api/v1/analytics/milestones` route
- [ ] 5.3 Implement milestone unlock detection
- [ ] 5.4 Store `unlockedAt` timestamps in database
- [ ] 5.5 Add integration tests for milestone progression

## 6. Backend: Insights Endpoint

- [ ] 6.1 Create `GET /api/v1/analytics/insights` route
- [ ] 6.2 Implement average story length calculation
- [ ] 6.3 Implement average listens per story
- [ ] 6.4 Implement preferred listening hour analysis
- [ ] 6.5 Implement most listened story query
- [ ] 6.6 Add integration tests for insights

## 7. iOS: Network Layer

- [ ] 7.1 Add `Endpoint` cases for all analytics routes
- [ ] 7.2 Create `AnalyticsSummaryResponse` DTO
- [ ] 7.3 Create `ListeningActivityResponse` DTO
- [ ] 7.4 Create `HeroAnalyticsResponse` DTO
- [ ] 7.5 Create `MilestoneResponse` DTO
- [ ] 7.6 Create `InsightsResponse` DTO
- [ ] 7.7 Create `ListeningSessionRequest` DTO

## 8. iOS: Repository

- [ ] 8.1 Create `ReadingJourneyRepository` protocol
- [ ] 8.2 Implement `fetchSummary()` method
- [ ] 8.3 Implement `fetchActivity(range:)` method
- [ ] 8.4 Implement `fetchHeroAnalytics()` method
- [ ] 8.5 Implement `fetchMilestones()` method
- [ ] 8.6 Implement `fetchInsights()` method
- [ ] 8.7 Implement `reportSession(_:)` method
- [ ] 8.8 Add response caching with 5-minute TTL
- [ ] 8.9 Add force refresh capability

## 9. iOS: Session Tracking

- [ ] 9.1 Add session start/end tracking in `AudioService`
- [ ] 9.2 Track actual playback duration (handling pause/resume)
- [ ] 9.3 Send session on playback completion
- [ ] 9.4 Send session on user exit/dismiss
- [ ] 9.5 Handle edge cases (app backgrounding, crash recovery)

## 10. iOS: View Migration

- [ ] 10.1 Remove `@Query` from `ReadingJourneyTabContent`
- [ ] 10.2 Remove `@Query` from `ReadingJourneyView`
- [ ] 10.3 Add `@State` for loading/error/data states
- [ ] 10.4 Inject `ReadingJourneyRepository` via init or environment
- [ ] 10.5 Fetch data on `.task` modifier
- [ ] 10.6 Add pull-to-refresh support
- [ ] 10.7 Add loading indicators during fetch
- [ ] 10.8 Add `ErrorView` for failure states
- [ ] 10.9 Update `HeaderStatsSection` to accept DTO
- [ ] 10.10 Update `ListeningActivityChart` to use API data
- [ ] 10.11 Update `HeroPerformanceSection` to use API data
- [ ] 10.12 Update `MilestonesSection` to use API data
- [ ] 10.13 Update `RecentActivitySection` to use stories from `StoryRepository`
- [ ] 10.14 Update `FavoriteStoriesSection` to use stories from `StoryRepository`
- [ ] 10.15 Update `ReadingInsightsSection` to use API data

## 11. Testing

- [ ] 11.1 Add unit tests for `ReadingJourneyRepository`
- [ ] 11.2 Add unit tests for session tracking logic
- [ ] 11.3 Add UI tests for loading states
- [ ] 11.4 Add UI tests for error handling
- [ ] 11.5 Test offline behavior (show error, block usage)

## 12. Cleanup

- [ ] 12.1 Remove local `TimeRange` enum (use shared DTO)
- [ ] 12.2 Remove local `Milestone` struct (use API response)
- [ ] 12.3 Remove computed stats from views (streak calculation, etc.)
- [ ] 12.4 Update `RelativeDateFormatter` usage if needed
- [ ] 12.5 Verify no remaining `@Query` usage for stats
