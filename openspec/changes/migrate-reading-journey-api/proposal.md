# Change: Migrate Reading Journey to Backend API

## Why

The Reading Journey feature currently calculates statistics (total stories, listening time, streak, favorites, hero performance, milestones, insights) client-side from SwiftData queries. This is inconsistent with the API-only architecture and prevents cross-device sync of user progress.

## What Changes

- **BREAKING**: Remove SwiftData `@Query` usage for statistics in `ReadingJourneyView`/`ReadingJourneyTabContent`
- Add new `/api/v1/analytics/summary` endpoint for aggregated reading statistics
- Add new `/api/v1/analytics/activity` endpoint for time-series listening data
- Add new `/api/v1/analytics/milestones` endpoint for achievement tracking
- Create `ReadingJourneyRepository` to fetch analytics from backend API
- Update views to fetch from repository with loading/error states
- Backend tracks: total stories, listening time, play counts, streaks, favorites, per-hero performance
- Track listening sessions for accurate time tracking (not just estimated duration)

## Impact

- Affected specs: `ios-integration` (new repository pattern)
- Affected code:
  - `Views/ReadingJourney/ReadingJourneyView.swift` - remove @Query, use repository
  - `Repositories/` - new `ReadingJourneyRepository.swift`
  - `Network/Endpoint.swift` - new analytics endpoints
  - `Models/` - new DTOs for analytics responses
  - Backend: New analytics collection and aggregation routes
