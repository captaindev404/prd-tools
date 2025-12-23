## Context

The Reading Journey view currently uses SwiftData `@Query` to calculate statistics from local `Story` and `Hero` models. However, per the API-only architecture documented in `CLAUDE.md`:

> **CRITICAL**: App requires active internet connection. Hero/Story data are NOT persisted locally.

This means the current implementation violates the architecture. Statistics need to be:
1. Calculated server-side where the data lives
2. Fetched via API like all other data
3. Synced across devices for the same user

## Goals / Non-Goals

**Goals:**
- Migrate all reading statistics to backend API
- Track accurate listening time (not just estimates)
- Enable cross-device streak/progress sync
- Maintain current UI/UX with loading states
- Follow existing repository pattern

**Non-Goals:**
- Offline analytics (conflicts with API-only architecture)
- Real-time analytics streaming (use periodic refresh)
- Push notifications for milestones (separate feature)
- Gamification/rewards system (separate feature)

## Decisions

### Decision: Single Summary Endpoint vs Multiple Endpoints

**Chosen: Multiple specialized endpoints**

Endpoints:
- `GET /api/v1/analytics/summary` - Overview stats (stories, time, streak, favorites)
- `GET /api/v1/analytics/activity?range=week|month|year` - Time-series listening data
- `GET /api/v1/analytics/milestones` - Achievement status
- `GET /api/v1/analytics/heroes` - Per-hero performance

**Rationale:**
- Enables incremental loading (show summary first, charts load async)
- Smaller payloads for partial refreshes
- Follows REST resource patterns
- Charts only load when visible

**Alternatives considered:**
- Single monolithic endpoint: Simpler but larger payloads, no partial refresh
- GraphQL: Overkill for this use case, adds complexity

### Decision: Listening Time Tracking

**Chosen: Backend tracks session-based listening time**

The app will send listening session events:
- `POST /api/v1/analytics/sessions` with `{ storyId, startTime, endTime, completed }`
- Backend aggregates actual listening time, not estimated duration

**Rationale:**
- Accurate metrics (user may pause, skip, replay)
- Supports streak calculation based on actual listening
- Enables future analytics (drop-off points, completion rates)

**Alternatives considered:**
- Use `estimatedDuration * playCount`: Inaccurate, overestimates
- Client-side tracking with periodic sync: Complex, offline issues

### Decision: Streak Calculation

**Chosen: Server-side streak with timezone support**

Backend calculates streak based on:
- Days with at least one completed listening session
- User's timezone (stored in profile)
- Streak breaks after 24h without activity

**Rationale:**
- Consistent across devices
- Handles timezone edge cases
- Single source of truth

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Statistics unavailable offline | Show cached last-known values with "offline" indicator |
| Increased API calls | Batch endpoints, cache responses, refresh on-demand |
| Backend aggregation cost | Pre-compute daily aggregates, limit time range |
| Session tracking accuracy | Debounce events, validate timestamps |

## Migration Plan

1. **Phase 1: Backend Endpoints** - Add analytics collection and aggregation
2. **Phase 2: iOS Repository** - Create `ReadingJourneyRepository` with new endpoints
3. **Phase 3: View Migration** - Update views to use repository, add loading states
4. **Phase 4: Session Tracking** - Add listening session events for accurate time
5. **Phase 5: Cleanup** - Remove SwiftData `@Query` usage from journey views

**Rollback:** Keep existing `@Query` code commented until v2 stable release.

## Open Questions

1. Should milestones be user-configurable or fixed? (Recommend: fixed for v1)
2. Cache duration for analytics data? (Recommend: 5 minutes TTL)
3. Include privacy settings for analytics? (Recommend: defer to separate proposal)
