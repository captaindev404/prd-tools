# Analytics Summary Endpoint Implementation

## Overview

This document describes the implementation of Phase 2 of the "Migrate Reading Journey to Backend API" project: the Analytics Summary Endpoint.

**Endpoint:** `GET /api/v1/analytics/summary`

**Purpose:** Provide aggregated analytics data for the authenticated user's listening activity, including stories listened, total listening time, streaks, and favorites.

---

## Implementation Details

### File Location

- **Route Handler:** `/app/api/v1/analytics/summary/route.ts`
- **Tests:** `/app/api/v1/analytics/summary/__tests__/route.test.ts`

### Response Schema

```typescript
interface AnalyticsSummary {
  totalStoriesListened: number;        // Total unique stories listened to completion
  totalListeningTimeMinutes: number;   // Total listening time in minutes (rounded)
  currentStreak: number;                // Consecutive days with listening activity
  longestStreak: number;                // Longest streak ever achieved
  favoriteStoriesCount: number;         // Number of stories marked as favorite
  lastListeningDate: string | null;     // Last listening date (ISO8601: YYYY-MM-DD)
}
```

### Query Parameters

| Parameter | Type   | Required | Default | Description |
|-----------|--------|----------|---------|-------------|
| timezone  | string | No       | UTC     | IANA timezone identifier (e.g., "America/New_York") |

---

## Task Breakdown

### 2.1: Create GET /api/v1/analytics/summary Route ✓

**Implementation:**
- Created route handler at `/app/api/v1/analytics/summary/route.ts`
- Implements standard authentication flow using `requireAuth()`
- Returns structured JSON response using `successResponse()` helper
- Follows existing API patterns from Phase 1 (sessions endpoint)

**Key Features:**
- Authentication validation
- User lookup and verification
- Query parameter parsing (timezone support)
- Comprehensive error handling

---

### 2.2: Implement Total Stories Count Query ✓

**Implementation Strategy:**

1. **Primary Source:** `UserAnalyticsCache.totalStoriesListened`
   - Pre-computed value for optimal performance
   - Updated automatically by database triggers

2. **Fallback (Empty Cache):** Real-time query
   ```typescript
   const sessionsData = await prisma.listeningSession.groupBy({
     by: ['storyId'],
     where: { userId, completed: true },
     _count: { storyId: true }
   });
   totalStoriesListened = sessionsData.length; // Count unique story IDs
   ```

**Behavior:**
- Only counts completed listening sessions
- Counts unique stories (deduplicated by `storyId`)
- Updates cache after computing real-time values

**Test Coverage:**
- Cached value retrieval
- Real-time computation for empty cache
- Unique story counting logic

---

### 2.3: Implement Total Listening Time Aggregation ✓

**Implementation Strategy:**

1. **Primary Source:** `UserAnalyticsCache.totalListeningTimeSeconds`
   - Stored in seconds for precision
   - Converted to minutes in response

2. **Fallback (Empty Cache):** Real-time aggregation
   ```typescript
   const durationSum = await prisma.listeningSession.aggregate({
     where: {
       userId,
       completed: true,
       duration: { not: null }
     },
     _sum: { duration: true }
   });
   totalListeningTimeSeconds = durationSum._sum.duration || 0;
   ```

**Conversion Logic:**
```typescript
const totalListeningTimeMinutes = Math.round(totalListeningTimeSeconds / 60);
```

**Behavior:**
- Only sums completed sessions with non-null duration
- Rounds to nearest minute for user-friendly display
- Handles null aggregation results gracefully

**Test Coverage:**
- Cached value retrieval and conversion
- Real-time aggregation for empty cache
- Rounding behavior (e.g., 3650s → 61 minutes)
- Null duration handling

---

### 2.4: Implement Streak Calculation with Timezone Support ✓

**Algorithm:**

```typescript
async function calculateStreaks(userId: string, timezone: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastListeningDate: Date | null;
}>
```

**Steps:**

1. **Fetch Completed Sessions:**
   ```typescript
   const sessions = await prisma.listeningSession.findMany({
     where: { userId, completed: true },
     select: { startedAt: true },
     orderBy: { startedAt: 'desc' }
   });
   ```

2. **Convert to User's Timezone:**
   ```typescript
   function formatDateInTimezone(date: Date, timezone: string): string {
     const formatter = new Intl.DateTimeFormat('en-CA', {
       timeZone: timezone,
       year: 'numeric', month: '2-digit', day: '2-digit'
     });
     return formatter.format(date); // Returns YYYY-MM-DD
   }
   ```

3. **Extract Unique Dates:**
   - Convert all session timestamps to dates in user's timezone
   - Use `Set<string>` to deduplicate dates
   - Sort dates in descending order

4. **Calculate Current Streak:**
   - Start from today (in user's timezone)
   - Count consecutive days backwards
   - Stop at first gap

5. **Calculate Longest Streak:**
   - Iterate through all dates
   - Track consecutive sequences
   - Return maximum streak found

**Timezone Support:**
- Validates timezone using `Intl.DateTimeFormat`
- Returns 400 error for invalid timezones
- Critical for international users (e.g., session at 23:00 UTC might be next day in Asia)

**Edge Cases:**
- No sessions: Returns `{ currentStreak: 0, longestStreak: 0, lastListeningDate: null }`
- Single session: Returns `{ currentStreak: 1, longestStreak: 1, lastListeningDate: <date> }`
- Multiple sessions same day: Counts as single day

**Test Coverage:**
- Consecutive day streak calculation
- Longest streak across gaps
- Timezone parameter support (America/New_York, Europe/Paris, UTC)
- Invalid timezone validation
- Empty session list handling

---

### 2.5: Implement Favorites Count Query ✓

**Implementation:**

```typescript
const favoriteStoriesCount = await prisma.story.count({
  where: {
    userId: user.id,
    isFavorite: true
  }
});
```

**Behavior:**
- Always queries in real-time (not cached)
- Counts stories marked with `isFavorite: true`
- Returns 0 for users with no favorites

**Rationale for Real-Time Query:**
- Favorites can change frequently (user toggles)
- Query is lightweight (single index scan)
- Ensures data freshness without cache invalidation complexity

**Test Coverage:**
- Users with multiple favorites
- Users with no favorites
- Correct query parameters

---

### 2.6: Add Integration Tests for Summary Endpoint ✓

**Test File:** `/app/api/v1/analytics/summary/__tests__/route.test.ts`

**Test Categories:**

1. **Authentication & Authorization (2 tests)**
   - Unauthenticated user (401)
   - User not found in database (404)

2. **Total Stories Count (2 tests)**
   - Cached value retrieval
   - Real-time computation for empty cache

3. **Total Listening Time (3 tests)**
   - Cached value conversion to minutes
   - Real-time aggregation for empty cache
   - Rounding behavior

4. **Streak Calculation (5 tests)**
   - Consecutive day streak calculation (UTC)
   - Longest streak across gaps
   - Timezone parameter support
   - Invalid timezone validation
   - Empty session list

5. **Favorites Count (2 tests)**
   - Users with favorites
   - Users with no favorites

6. **Integration Tests (4 tests)**
   - Complete summary response structure
   - Cache creation for new users
   - Null duration aggregation handling
   - ISO8601 date formatting

**Total Tests:** 18 (All passing ✓)

**Test Execution:**
```bash
npm run test -- app/api/v1/analytics/summary/__tests__/route.test.ts
```

**Result:**
```
✓ app/api/v1/analytics/summary/__tests__/route.test.ts (18 tests) 37ms

Test Files  1 passed (1)
Tests       18 passed (18)
```

---

## Performance Optimization

### Cache Strategy

**Primary Data Source:**
- `UserAnalyticsCache` table provides O(1) lookups for:
  - `totalStoriesListened`
  - `totalListeningTimeSeconds`

**Real-Time Queries (Fallback & Required):**
- Streak calculation: Always real-time (timezone-dependent)
- Favorites count: Always real-time (data freshness)
- Cache initialization: One-time computation for new users

### Query Optimization

**Indexed Fields Used:**
- `ListeningSession.userId` (B-tree index)
- `ListeningSession.completed` (B-tree index)
- `ListeningSession.startedAt` (B-tree index for ordering)
- `Story.userId + isFavorite` (composite index recommended)

**Query Complexity:**
- Cache hit: O(1) for stories/time, O(n) for streaks (where n = unique listening dates)
- Cache miss: O(m) aggregation (where m = total sessions)

### Recommended Index

```sql
-- Composite index for favorites query
CREATE INDEX idx_story_user_favorite ON Story(userId, isFavorite);
```

---

## Error Handling

### HTTP Status Codes

| Code | Error Type        | Description |
|------|-------------------|-------------|
| 200  | Success           | Summary retrieved successfully |
| 400  | ValidationError   | Invalid timezone parameter |
| 401  | Unauthorized      | Authentication required |
| 404  | NotFound          | User not found |
| 500  | InternalServerError | Unexpected server error |

### Error Response Format

```json
{
  "error": "ValidationError",
  "message": "Invalid timezone: Invalid/Timezone. Must be a valid IANA timezone identifier (e.g., \"America/New_York\", \"Europe/Paris\", \"UTC\")"
}
```

---

## Usage Examples

### Basic Request (UTC)

```bash
curl -X GET https://api.infinitestories.com/api/v1/analytics/summary \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "data": {
    "totalStoriesListened": 25,
    "totalListeningTimeMinutes": 150,
    "currentStreak": 7,
    "longestStreak": 14,
    "favoriteStoriesCount": 12,
    "lastListeningDate": "2024-12-31"
  },
  "message": "Analytics summary retrieved successfully"
}
```

### With Timezone (America/New_York)

```bash
curl -X GET "https://api.infinitestories.com/api/v1/analytics/summary?timezone=America/New_York" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "data": {
    "totalStoriesListened": 25,
    "totalListeningTimeMinutes": 150,
    "currentStreak": 8,
    "longestStreak": 15,
    "favoriteStoriesCount": 12,
    "lastListeningDate": "2024-12-31"
  },
  "message": "Analytics summary retrieved successfully"
}
```

**Note:** Streak values may differ based on timezone (session at 2024-01-01 00:30 UTC is 2023-12-31 in America/New_York).

---

## Timezone Support

### Valid Timezone Examples

- **Americas:** `America/New_York`, `America/Los_Angeles`, `America/Chicago`, `America/Denver`, `America/Toronto`, `America/Sao_Paulo`
- **Europe:** `Europe/London`, `Europe/Paris`, `Europe/Berlin`, `Europe/Madrid`, `Europe/Rome`
- **Asia:** `Asia/Tokyo`, `Asia/Shanghai`, `Asia/Dubai`, `Asia/Kolkata`, `Asia/Singapore`
- **Pacific:** `Australia/Sydney`, `Pacific/Auckland`, `Pacific/Honolulu`
- **UTC:** `UTC`, `Etc/UTC`

### Validation

```typescript
function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}
```

### Why Timezone Matters

**Example Scenario:**
- User in Tokyo (UTC+9) listens to story at 2024-01-01 00:30 JST
- Session stored with `startedAt: 2023-12-31 15:30 UTC`
- **Without timezone:** Streak counts 2023-12-31
- **With timezone:** Streak counts 2024-01-01 (correct for user)

**Impact:**
- Current streak calculations can be off by 1 day
- Longest streak calculations can miss or overcount streaks
- Critical for users near midnight in their timezone

---

## Future Enhancements

### Potential Optimizations

1. **Cache Streak Values:**
   - Store `currentStreakUTC`, `longestStreakUTC` in `UserAnalyticsCache`
   - Only recalculate for non-UTC timezones
   - Trade-off: Storage vs. computation

2. **Materialized Views:**
   - Pre-compute unique listening dates per user
   - Update incrementally on session insert
   - Trade-off: Complexity vs. performance

3. **Response Caching:**
   - Cache-Control headers for summary responses
   - Invalidate on new session creation
   - Trade-off: Data freshness vs. API response time

4. **Batch Timezone Support:**
   - Return streak data for multiple timezones in single request
   - Useful for users traveling across timezones
   - Trade-off: Response size vs. additional requests

---

## Database Schema Dependencies

### Required Tables

1. **UserAnalyticsCache**
   - `totalStoriesListened: Int`
   - `totalListeningTimeSeconds: Int`
   - `currentStreak: Int`
   - `longestStreak: Int`
   - `lastListeningDate: DateTime?`

2. **ListeningSession**
   - `userId: String`
   - `storyId: String`
   - `startedAt: DateTime`
   - `completed: Boolean`
   - `duration: Int?`

3. **Story**
   - `userId: String`
   - `isFavorite: Boolean`

### Triggers (Phase 1)

- **On ListeningSession Insert/Update:** Auto-update `UserAnalyticsCache`
- **Ensures:** Cache stays synchronized with session data

---

## Security Considerations

### Authentication
- All requests require valid JWT token
- User can only access their own analytics
- No cross-user data leakage

### Input Validation
- Timezone parameter validated against IANA timezone database
- Prevents injection attacks via malformed timezone strings
- Error messages don't expose internal system details

### Rate Limiting
- Endpoint should be included in rate limiting strategy
- Recommended: 100 requests/minute per user
- Prevents abuse and ensures fair resource allocation

---

## Monitoring & Observability

### Key Metrics to Track

1. **Performance:**
   - Response time (p50, p95, p99)
   - Cache hit rate
   - Real-time query execution time

2. **Usage:**
   - Requests per user per day
   - Timezone distribution
   - Cache miss rate

3. **Errors:**
   - 401/404 error rate
   - 400 error rate (invalid timezones)
   - 500 error rate

### Logging

**Structured Logs:**
```typescript
console.log({
  level: 'info',
  event: 'analytics_summary_request',
  userId: user.id,
  timezone: timezone,
  cacheHit: cache.totalStoriesListened > 0,
  responseTime: Date.now() - startTime
});
```

---

## Testing

### Unit Tests
- ✓ Timezone validation
- ✓ Date formatting in timezones
- ✓ Streak calculation logic

### Integration Tests
- ✓ End-to-end API flow
- ✓ Database queries
- ✓ Error handling

### Manual Testing Checklist

- [ ] New user with no sessions
- [ ] User with single session
- [ ] User with consecutive daily sessions
- [ ] User with gaps in sessions
- [ ] User in different timezones (America/New_York, Asia/Tokyo, Europe/Paris)
- [ ] Invalid timezone parameter
- [ ] Unauthenticated request
- [ ] Very large datasets (1000+ sessions)

---

## Deployment Checklist

- [x] Route handler implemented
- [x] Integration tests written (18 tests)
- [x] All tests passing
- [x] Error handling implemented
- [x] Authentication validated
- [x] Timezone support verified
- [x] Documentation complete
- [ ] Code review completed
- [ ] Performance testing (load testing)
- [ ] Monitoring/logging configured
- [ ] API documentation updated

---

## API Documentation Update

**Add to API Documentation:**

```markdown
### GET /api/v1/analytics/summary

**Description:** Get analytics summary for authenticated user.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `timezone` (optional, string): IANA timezone identifier. Default: UTC

**Response (200):**
```json
{
  "data": {
    "totalStoriesListened": 25,
    "totalListeningTimeMinutes": 150,
    "currentStreak": 7,
    "longestStreak": 14,
    "favoriteStoriesCount": 12,
    "lastListeningDate": "2024-12-31"
  },
  "message": "Analytics summary retrieved successfully"
}
```

**Errors:**
- 400: Invalid timezone parameter
- 401: Unauthorized
- 404: User not found
- 500: Internal server error
```

---

## Related Documentation

- **Phase 1:** [Analytics Sessions Endpoint](./ANALYTICS_SESSIONS_IMPLEMENTATION.md)
- **Database Schema:** [Prisma Schema](/prisma/schema.prisma)
- **API Documentation:** [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)

---

## Changelog

**2024-12-31:**
- ✓ Implemented GET /api/v1/analytics/summary route
- ✓ Added total stories count query with cache fallback
- ✓ Added total listening time aggregation with cache fallback
- ✓ Implemented streak calculation with timezone support
- ✓ Added favorites count query
- ✓ Created 18 integration tests (all passing)
- ✓ Documentation completed

---

**Implementation Status:** ✅ Complete (Phase 2 of 4)
**Next Phase:** Phase 3 - Charts Endpoint (History data for visualizations)
