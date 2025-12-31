# Analytics API Documentation

## Overview

The Analytics API provides endpoints for tracking user listening sessions and retrieving aggregated statistics for the Reading Journey feature. This API automatically maintains pre-computed analytics using database triggers for optimal performance.

## Architecture

### Database Schema

#### ListeningSession Table
Tracks individual story listening sessions with the following fields:

- `id` (string): Unique session identifier
- `userId` (string): User who listened to the story
- `storyId` (string): Story that was listened to
- `startedAt` (datetime): When listening started
- `endedAt` (datetime, nullable): When listening ended
- `duration` (int, nullable): Listening duration in seconds (capped at 1.5x story's `audioDuration`)
- `completed` (boolean): Whether the story was listened to completion
- `createdAt` (datetime): Record creation timestamp
- `updatedAt` (datetime): Record update timestamp

**Indexes:**
- `userId` - Fast lookups by user
- `storyId` - Fast lookups by story
- `startedAt` - Date range queries
- `completed` - Filter completed sessions

#### UserAnalyticsCache Table
Pre-computed aggregated statistics for each user:

- `id` (string): Unique cache entry identifier
- `userId` (string, unique): User this cache belongs to
- `totalStoriesListened` (int): Total number of stories listened to completion
- `totalListeningTimeSeconds` (int): Total listening time in seconds
- `currentStreak` (int): Current consecutive days streak
- `longestStreak` (int): All-time longest streak
- `lastListeningDate` (datetime, nullable): Last date user listened (date only, no time)
- `createdAt` (datetime): Record creation timestamp
- `updatedAt` (datetime): Record update timestamp

**Indexes:**
- `userId` - Fast user lookups (unique constraint)
- `lastListeningDate` - Streak calculations

### Automatic Cache Updates

The analytics cache is automatically updated by a PostgreSQL trigger (`trigger_update_analytics_on_session_insert`) when a listening session is created with `completed=true` and a non-null `duration`.

**Trigger Logic:**
1. When a completed session is inserted, extract the session date (ignoring time)
2. Create analytics cache entry if it doesn't exist
3. Increment `totalStoriesListened` by 1
4. Add session `duration` to `totalListeningTimeSeconds`
5. Update `lastListeningDate` to session date
6. Calculate streaks:
   - If first session ever: `currentStreak = 1`
   - If same day as previous: keep `currentStreak` (don't increment)
   - If consecutive day: `currentStreak += 1`
   - If streak broken: `currentStreak = 1`
7. Update `longestStreak` if `currentStreak` exceeds it

### Duration Capping

To prevent abuse and ensure realistic analytics, session durations are capped at **1.5x the story's `audioDuration`**:

- If user reports `duration = 600s` but story's `audioDuration = 300s`, the session duration is capped at `450s` (300 * 1.5)
- This allows for reasonable pauses/rewinds while preventing inflated statistics
- Capping is applied server-side during session creation

## Endpoints

### POST /api/v1/analytics/sessions

Create a new listening session.

#### Authentication
Required. Bearer token or session cookie.

#### Request Body

```json
{
  "storyId": "string (required)",
  "startedAt": "string (optional, ISO8601 timestamp)",
  "endedAt": "string (optional, ISO8601 timestamp)",
  "duration": "number (optional, seconds)",
  "completed": "boolean (optional)"
}
```

**Field Descriptions:**
- `storyId`: ID of the story being listened to (must exist and belong to authenticated user)
- `startedAt`: When listening started (defaults to current time if not provided)
- `endedAt`: When listening ended (optional)
- `duration`: Duration in seconds (auto-calculated from `startedAt`/`endedAt` if not provided)
- `completed`: Whether the story was fully listened to (defaults to `false`)

**Validation Rules:**
- `storyId` is required
- If `startedAt` is provided, must be valid ISO8601 timestamp
- If `endedAt` is provided:
  - Must be valid ISO8601 timestamp
  - Must be after `startedAt`
- `duration` must be a non-negative number
- Duration is automatically capped at 1.5x story's `audioDuration`
- Story must exist and belong to the authenticated user

#### Response

**Success (201 Created):**
```json
{
  "data": {
    "id": "session_abc123",
    "userId": "user_xyz789",
    "storyId": "story_def456",
    "startedAt": "2025-12-31T10:00:00Z",
    "endedAt": "2025-12-31T10:15:30Z",
    "duration": 930,
    "completed": true,
    "createdAt": "2025-12-31T10:15:31Z",
    "updatedAt": "2025-12-31T10:15:31Z"
  },
  "message": "Listening session created successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error (missing fields, invalid timestamps, etc.)
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Story doesn't belong to user
- `404 Not Found`: Story not found

#### Example Requests

**Minimal (auto-calculated duration):**
```bash
curl -X POST https://api.example.com/api/v1/analytics/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storyId": "story_123",
    "startedAt": "2025-12-31T10:00:00Z",
    "endedAt": "2025-12-31T10:15:30Z",
    "completed": true
  }'
```

**With explicit duration:**
```bash
curl -X POST https://api.example.com/api/v1/analytics/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storyId": "story_123",
    "duration": 930,
    "completed": true
  }'
```

**In-progress session:**
```bash
curl -X POST https://api.example.com/api/v1/analytics/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storyId": "story_123",
    "startedAt": "2025-12-31T10:00:00Z"
  }'
```

### GET /api/v1/analytics/sessions

Retrieve listening sessions for the authenticated user.

#### Authentication
Required. Bearer token or session cookie.

#### Query Parameters

- `storyId` (string, optional): Filter sessions by story ID
- `startDate` (string, optional): Filter sessions starting on or after this date (ISO8601)
- `endDate` (string, optional): Filter sessions starting on or before this date (ISO8601)
- `completed` (boolean, optional): Filter by completion status
- `limit` (number, optional): Number of results to return (default: 50, max: 100)
- `offset` (number, optional): Offset for pagination (default: 0)

#### Response

**Success (200 OK):**
```json
{
  "data": {
    "sessions": [
      {
        "id": "session_abc123",
        "userId": "user_xyz789",
        "storyId": "story_def456",
        "startedAt": "2025-12-31T10:00:00Z",
        "endedAt": "2025-12-31T10:15:30Z",
        "duration": 930,
        "completed": true,
        "createdAt": "2025-12-31T10:15:31Z",
        "updatedAt": "2025-12-31T10:15:31Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Authentication required
- `404 Not Found`: User not found

#### Example Requests

**Get all sessions:**
```bash
curl -X GET https://api.example.com/api/v1/analytics/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Filter by story:**
```bash
curl -X GET "https://api.example.com/api/v1/analytics/sessions?storyId=story_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Filter by date range:**
```bash
curl -X GET "https://api.example.com/api/v1/analytics/sessions?startDate=2025-12-01T00:00:00Z&endDate=2025-12-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get completed sessions with pagination:**
```bash
curl -X GET "https://api.example.com/api/v1/analytics/sessions?completed=true&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /api/v1/analytics

Retrieve aggregated analytics for the authenticated user.

#### Authentication
Required. Bearer token or session cookie.

#### Response

**Success (200 OK):**
```json
{
  "data": {
    "totalStoriesListened": 42,
    "totalListeningTimeSeconds": 25200,
    "currentStreak": 7,
    "longestStreak": 14,
    "lastListeningDate": "2025-12-31T00:00:00Z"
  }
}
```

**Field Descriptions:**
- `totalStoriesListened`: Total number of stories listened to completion
- `totalListeningTimeSeconds`: Total listening time in seconds
- `currentStreak`: Current consecutive days streak
- `longestStreak`: All-time longest streak
- `lastListeningDate`: Last date user listened (date only, time is always 00:00:00)

**Error Responses:**
- `401 Unauthorized`: Authentication required
- `404 Not Found`: User not found

#### Example Request

```bash
curl -X GET https://api.example.com/api/v1/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Implementation Notes

### Performance Considerations

1. **Pre-computed Analytics**: The `UserAnalyticsCache` table stores pre-aggregated statistics, eliminating the need for expensive aggregation queries on every request.

2. **Database Trigger**: Statistics are updated automatically via PostgreSQL trigger, ensuring real-time accuracy without application-level overhead.

3. **Indexes**: Strategic indexes on `userId`, `storyId`, `startedAt`, and `completed` fields ensure fast queries.

4. **Pagination**: Session listing supports pagination to handle large datasets efficiently.

### Streak Calculation Logic

Streaks are calculated based on **consecutive calendar days** with listening activity:

- **Same Day**: Multiple sessions on the same day don't increment the streak
- **Consecutive Days**: Listening on consecutive days increments the streak
- **Broken Streak**: Missing a day resets the streak to 1
- **Longest Streak**: Automatically tracked and updated when current streak exceeds it

**Example:**
- Day 1: Listen to story → `currentStreak = 1`, `longestStreak = 1`
- Day 2: Listen to story → `currentStreak = 2`, `longestStreak = 2`
- Day 2 (again): Listen to another story → `currentStreak = 2` (no change)
- Day 3: Listen to story → `currentStreak = 3`, `longestStreak = 3`
- Day 5: Listen to story → `currentStreak = 1`, `longestStreak = 3` (streak broken)

### Error Handling

All endpoints follow standard error response format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description",
  "details": {} // Optional additional details
}
```

### Security

- All endpoints require authentication
- Story ownership is verified before session creation
- User can only access their own sessions and analytics
- Input validation prevents injection attacks
- Duration capping prevents abuse

## Migration

The database migration file is located at:
```
prisma/migrations/20251231122328_add_listening_sessions_and_analytics_cache/migration.sql
```

To apply the migration:
```bash
npx prisma migrate deploy
```

## Testing

### Manual Testing

1. **Create a session:**
```bash
# Replace with actual storyId from your database
curl -X POST http://localhost:3000/api/v1/analytics/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storyId": "YOUR_STORY_ID",
    "duration": 300,
    "completed": true
  }'
```

2. **Verify analytics updated:**
```bash
curl -X GET http://localhost:3000/api/v1/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **List sessions:**
```bash
curl -X GET http://localhost:3000/api/v1/analytics/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Behavior

1. Creating a completed session with duration should:
   - Insert record in `ListeningSession` table
   - Trigger auto-update of `UserAnalyticsCache`
   - Increment `totalStoriesListened` by 1
   - Add `duration` to `totalListeningTimeSeconds`
   - Update streak counters correctly

2. Duration capping should:
   - Cap duration at 1.5x story's `audioDuration`
   - Apply cap before database insertion
   - Prevent abuse of statistics

3. Streak calculation should:
   - Increment on consecutive days
   - Maintain on same day multiple sessions
   - Reset on missed days
   - Track longest streak

## Future Enhancements

Potential improvements for Phase 2+:

1. **Batch Session Creation**: POST endpoint accepting array of sessions
2. **Session Updates**: PUT endpoint to update in-progress sessions
3. **Advanced Analytics**: GET endpoints for charts data (daily/weekly/monthly)
4. **Achievements**: Track milestones and badges
5. **Comparison**: Compare stats with friends or global averages
6. **Export**: Export session data to CSV/JSON
7. **Webhook**: Notify external services on milestones
