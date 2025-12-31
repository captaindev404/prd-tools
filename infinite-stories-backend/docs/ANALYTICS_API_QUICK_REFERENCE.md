# Analytics API - Quick Reference

## Endpoints Overview

### Phase 1: Sessions Endpoint ✅
**Endpoint:** `POST /api/v1/analytics/sessions`
**Purpose:** Track individual listening sessions

### Phase 2: Summary Endpoint ✅
**Endpoint:** `GET /api/v1/analytics/summary`
**Purpose:** Get aggregated analytics summary

### Phase 3: Charts Endpoint (Planned)
**Endpoint:** `GET /api/v1/analytics/charts`
**Purpose:** Get historical data for visualizations

---

## GET /api/v1/analytics/summary

### Request

```bash
curl -X GET "https://api.infinitestories.com/api/v1/analytics/summary?timezone=America/New_York" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response (200 OK)

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

### Query Parameters

| Parameter | Type   | Required | Default | Description |
|-----------|--------|----------|---------|-------------|
| timezone  | string | No       | UTC     | IANA timezone (e.g., "America/New_York") |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| totalStoriesListened | number | Total unique stories listened to completion |
| totalListeningTimeMinutes | number | Total listening time in minutes (rounded) |
| currentStreak | number | Consecutive days with listening activity |
| longestStreak | number | Longest streak ever achieved |
| favoriteStoriesCount | number | Number of stories marked as favorite |
| lastListeningDate | string \| null | Last listening date (YYYY-MM-DD) |

### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | ValidationError | Invalid timezone parameter |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | NotFound | User not found |
| 500 | InternalServerError | Unexpected server error |

---

## Timezone Support

### Valid Timezones

**Americas:**
- America/New_York
- America/Los_Angeles
- America/Chicago
- America/Toronto
- America/Sao_Paulo

**Europe:**
- Europe/London
- Europe/Paris
- Europe/Berlin
- Europe/Madrid
- Europe/Rome

**Asia:**
- Asia/Tokyo
- Asia/Shanghai
- Asia/Dubai
- Asia/Kolkata
- Asia/Singapore

**Pacific:**
- Australia/Sydney
- Pacific/Auckland
- Pacific/Honolulu

**UTC:**
- UTC

### Why Timezone Matters

Streaks are calculated based on local dates, not UTC:

**Example:**
- User in Tokyo listens at `2024-01-01 00:30 JST`
- Stored as `2023-12-31 15:30 UTC`
- **Without timezone:** Counts as 2023-12-31
- **With timezone:** Counts as 2024-01-01 ✅

---

## Common Use Cases

### 1. Get User Summary (UTC)

```bash
curl -X GET "https://api.infinitestories.com/api/v1/analytics/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get User Summary (Specific Timezone)

```bash
curl -X GET "https://api.infinitestories.com/api/v1/analytics/summary?timezone=America/New_York" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. JavaScript/TypeScript Example

```typescript
interface AnalyticsSummary {
  totalStoriesListened: number;
  totalListeningTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  favoriteStoriesCount: number;
  lastListeningDate: string | null;
}

async function getAnalyticsSummary(
  token: string,
  timezone: string = 'UTC'
): Promise<AnalyticsSummary> {
  const response = await fetch(
    `https://api.infinitestories.com/api/v1/analytics/summary?timezone=${encodeURIComponent(timezone)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

// Usage
const summary = await getAnalyticsSummary(userToken, 'America/New_York');
console.log(`Current streak: ${summary.currentStreak} days`);
```

### 4. Swift Example (iOS)

```swift
struct AnalyticsSummary: Codable {
    let totalStoriesListened: Int
    let totalListeningTimeMinutes: Int
    let currentStreak: Int
    let longestStreak: Int
    let favoriteStoriesCount: Int
    let lastListeningDate: String?
}

struct SummaryResponse: Codable {
    let data: AnalyticsSummary
    let message: String?
}

func fetchAnalyticsSummary(timezone: String = "UTC") async throws -> AnalyticsSummary {
    let baseURL = "https://api.infinitestories.com/api/v1/analytics/summary"
    let urlString = "\(baseURL)?timezone=\(timezone.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? timezone)"

    guard let url = URL(string: urlString) else {
        throw URLError(.badURL)
    }

    var request = URLRequest(url: url)
    request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

    let (data, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw URLError(.badServerResponse)
    }

    let summaryResponse = try JSONDecoder().decode(SummaryResponse.self, from: data)
    return summaryResponse.data
}

// Usage
let summary = try await fetchAnalyticsSummary(timezone: "America/New_York")
print("Current streak: \(summary.currentStreak) days")
```

---

## Performance Tips

### Cache Behavior

**First Request (New User):**
- Takes 100-500ms (computes from sessions)
- Creates cache entry
- Subsequent requests are fast

**Subsequent Requests:**
- Takes 10-50ms (cache hit)
- Real-time streak calculation
- Real-time favorites count

### Optimization

1. **Client-Side Caching:**
   - Cache summary for 5-10 minutes
   - Invalidate on new session creation
   - Reduces API calls

2. **Timezone Detection:**
   ```typescript
   const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
   // Use this for all requests
   ```

3. **Error Handling:**
   - Implement retry logic for 5xx errors
   - Show cached data on network errors
   - Validate timezone before sending

---

## Error Handling Examples

### JavaScript/TypeScript

```typescript
async function getAnalyticsSummaryWithRetry(
  token: string,
  timezone: string = 'UTC',
  maxRetries: number = 3
): Promise<AnalyticsSummary> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(
        `https://api.infinitestories.com/api/v1/analytics/summary?timezone=${encodeURIComponent(timezone)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          throw new Error('Authentication required');
        }

        if (response.status === 400) {
          throw new Error(`Invalid timezone: ${timezone}`);
        }

        if (response.status >= 500 && i < maxRetries - 1) {
          // Retry on server errors
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          continue;
        }

        throw new Error(errorData.message || 'Unknown error');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      lastError = error as Error;
      if (i === maxRetries - 1) {
        throw lastError;
      }
    }
  }

  throw lastError!;
}
```

### Swift

```swift
enum AnalyticsError: Error {
    case unauthorized
    case invalidTimezone
    case networkError
    case serverError
    case decodingError
}

func fetchAnalyticsSummary(
    timezone: String = "UTC",
    maxRetries: Int = 3
) async throws -> AnalyticsSummary {
    var lastError: Error?

    for attempt in 0..<maxRetries {
        do {
            let summary = try await _fetchAnalyticsSummary(timezone: timezone)
            return summary
        } catch {
            lastError = error

            // Don't retry on client errors
            if let urlError = error as? URLError {
                if urlError.code == .badServerResponse {
                    // Retry server errors
                    try? await Task.sleep(nanoseconds: UInt64(pow(2.0, Double(attempt)) * 1_000_000_000))
                    continue
                }
            }

            // Don't retry on other errors
            throw error
        }
    }

    throw lastError ?? AnalyticsError.networkError
}
```

---

## Testing

### Test the Endpoint

```bash
# Test with valid token
curl -X GET "https://api.infinitestories.com/api/v1/analytics/summary" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Test with timezone
curl -X GET "https://api.infinitestories.com/api/v1/analytics/summary?timezone=America/New_York" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test invalid timezone (should return 400)
curl -X GET "https://api.infinitestories.com/api/v1/analytics/summary?timezone=Invalid/Timezone" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test without auth (should return 401)
curl -X GET "https://api.infinitestories.com/api/v1/analytics/summary"
```

---

## Rate Limits

**Recommended:**
- 100 requests/minute per user
- Implement client-side caching to reduce calls

**Best Practices:**
- Cache summary for 5-10 minutes
- Invalidate cache on new session creation
- Use exponential backoff on errors

---

## Database Schema

### UserAnalyticsCache

```typescript
model UserAnalyticsCache {
  id                       String    @id @default(cuid())
  userId                   String    @unique
  totalStoriesListened     Int       @default(0)
  totalListeningTimeSeconds Int      @default(0)
  currentStreak            Int       @default(0)
  longestStreak            Int       @default(0)
  lastListeningDate        DateTime?
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt
}
```

### ListeningSession

```typescript
model ListeningSession {
  id         String    @id @default(cuid())
  userId     String
  storyId    String
  startedAt  DateTime  @default(now())
  endedAt    DateTime?
  duration   Int?      // in seconds
  completed  Boolean   @default(false)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

### Story

```typescript
model Story {
  id          String    @id @default(cuid())
  userId      String
  isFavorite  Boolean   @default(false)
  // ... other fields
}
```

---

## Support

**Documentation:**
- [Analytics Summary Implementation](./ANALYTICS_SUMMARY_IMPLEMENTATION.md)
- [Phase 2 Summary](./PHASE_2_SUMMARY.md)
- [API Documentation](../API_DOCUMENTATION.md)

**Issues:**
- Check error response messages
- Validate timezone parameter
- Ensure authentication token is valid
- Verify user exists in database

---

**Last Updated:** 2024-12-31
**Version:** 1.0.0
**Status:** Production Ready ✅
