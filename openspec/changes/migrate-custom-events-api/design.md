# Design: Migrate Custom Events to API

## Overview

This document describes the technical design for migrating `CustomStoryEvent` from local SwiftData storage to the backend API.

## Architecture Decision

### Current State

```
iOS App                          Backend
+------------------+             +------------------+
| CustomStoryEvent |             | CustomStoryEvent |
| (@Model SwiftData) |           | (Prisma model)   |
| - Local only      |            | - Unused         |
| - Stubbed repo    |            | - No routes      |
+------------------+             +------------------+
```

### Target State

```
iOS App                          Backend
+------------------+             +------------------+
| CustomStoryEvent |  <--API-->  | CustomStoryEvent |
| (Codable struct) |             | (Prisma model)   |
| - API only       |             | /api/v1/custom-  |
| - Repository     |             |   events/*       |
+------------------+             +------------------+
```

## Backend API Design

### Endpoints

Following the existing Heroes/Stories pattern:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/custom-events` | List user's custom events |
| GET | `/api/v1/custom-events/:id` | Get single event |
| POST | `/api/v1/custom-events` | Create new event |
| PATCH | `/api/v1/custom-events/:id` | Update event |
| DELETE | `/api/v1/custom-events/:id` | Delete event |
| POST | `/api/v1/custom-events/:id/enhance` | AI-enhance event |

### Response Format

```json
{
  "id": "cuid",
  "userId": "cuid",
  "title": "First Day at School",
  "description": "A story about...",
  "promptSeed": "an adventure about...",
  "category": "learning",
  "ageRange": "4-6",
  "tone": "inspiring",
  "keywords": ["school", "friends", "courage"],
  "aiEnhanced": true,
  "usageCount": 5,
  "isFavorite": false,
  "lastUsedAt": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### AI Enhancement Endpoint

The `/enhance` endpoint will:
1. Accept the event ID
2. Use GPT-4o-mini to enhance the prompt seed
3. Generate relevant keywords
4. Mark the event as AI-enhanced
5. Return the updated event

## iOS Changes

### Model Changes

Transform `CustomStoryEvent` from SwiftData `@Model` to plain `Codable`:

```swift
// Before: @Model class
@Model
final class CustomStoryEvent { ... }

// After: Codable struct
struct CustomStoryEvent: Codable, Identifiable {
    let id: String  // Server-assigned cuid
    var title: String
    var description: String
    // ... same properties minus SwiftData-specific ones
}
```

### Remove Local-Only Properties

- `pictogramPath` - Local file path (out of scope)
- `pictogramGeneratedAt` - Local generation (out of scope)
- `pictogramFailureCount` - Local retry tracking (out of scope)
- `lastPictogramError` - Local error (out of scope)

### Repository Pattern

Update `CustomEventRepository` to match `HeroRepository` pattern:

```swift
@MainActor
class CustomEventRepository: CustomEventRepositoryProtocol {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func fetchCustomEvents() async throws -> [CustomStoryEvent] {
        let response: CustomEventsResponse = try await apiClient.request(
            .getCustomEvents(limit: 100, offset: 0)
        )
        return response.customEvents
    }

    // ... other methods
}
```

### View Updates

Views using `@Query` and `@Environment(\.modelContext)` must change to:
- Use `@State` for loading/error/data states
- Call repository methods in `.task` modifier
- Show loading indicators during fetch
- Show error views with retry on failure

## Data Model Mapping

| iOS Property | Backend Column | Notes |
|--------------|----------------|-------|
| id (UUID) | id (cuid) | Change to String |
| title | title | - |
| eventDescription | description | Rename for clarity |
| promptSeed | promptSeed | - |
| category | category | Store as raw string |
| ageRange | ageRange | Store as raw string |
| tone | tone | Store as raw string |
| keywords | keywords | JSON array |
| iconName | - | Derived from category |
| colorHex | - | Derived from category |
| isAIEnhanced | aiEnhanced | - |
| isFavorite | isFavorite | - |
| usageCount | usageCount | - |
| lastUsed | lastUsedAt | - |
| createdAt | createdAt | - |

## Migration Strategy

No automatic migration of existing local data:
- Users must recreate custom events after update
- Simple events can be recreated quickly
- Document in release notes

This is acceptable because:
1. Custom events are user preferences, not critical data
2. Most users have few custom events
3. Implementing migration would require temporary hybrid storage
