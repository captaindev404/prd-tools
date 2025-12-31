# Tasks: Migrate Custom Events to API

## Backend Implementation

### Phase 1: CRUD Endpoints

- [x] Create `app/api/v1/custom-events/route.ts` with GET (list) and POST (create)
- [x] Create `app/api/v1/custom-events/[eventId]/route.ts` with GET, PATCH, DELETE
- [x] Add user ownership validation (filter by userId from session)
- [x] Add pagination support (limit, offset, hasMore)
- [x] Add request validation for required fields (title, promptSeed)

### Phase 2: AI Enhancement

- [x] Create `app/api/v1/custom-events/[eventId]/enhance/route.ts`
- [x] Implement GPT-4o-mini prompt enhancement logic
- [x] Implement keyword extraction from enhanced prompt
- [x] Store enhancement metadata in `aiEnhancementMetadata` column

### Phase 3: Usage Tracking

- [x] Update story creation endpoint to increment custom event `usageCount`
- [x] Update story creation endpoint to set custom event `lastUsedAt`

## iOS Implementation

### Phase 4: Model Changes

- [x] Convert `CustomStoryEvent` from `@Model` class to `Codable` struct
- [x] Change `id` from `UUID` to `String` for server-assigned cuids
- [x] Rename `eventDescription` to `description` for API consistency
- [x] Remove pictogram-related properties (out of scope)
- [x] Remove `@Relationship` to Story (handled by API)
- [x] Create `CustomEventResponse` and `CustomEventsResponse` DTOs

### Phase 5: Repository Implementation

- [x] Update `CustomEventRepository` to inject `APIClient`
- [x] Implement `fetchCustomEvents()` using `GET /api/v1/custom-events`
- [x] Implement `fetchCustomEvent(id:)` using `GET /api/v1/custom-events/:id`
- [x] Implement `createCustomEvent(_:)` using `POST /api/v1/custom-events`
- [x] Implement `updateCustomEvent(_:)` using `PATCH /api/v1/custom-events/:id`
- [x] Implement `deleteCustomEvent(_:)` using `DELETE /api/v1/custom-events/:id`
- [x] Implement `enhanceEvent(_:)` using `POST /api/v1/custom-events/:id/enhance`

### Phase 6: View Updates

- [x] Update `CustomEventManagementView` to use `@State` instead of `@Query`
- [x] Add loading state with `ProgressView` during fetch
- [x] Add error state with `ErrorView` and retry button
- [x] Update `CustomEventCreationView` for API-based creation
- [x] Update `CustomEventDetailView` for API-based updates
- [x] Add network availability checks before mutations

### Phase 7: Cleanup

- [x] Remove SwiftData model container registration for `CustomStoryEvent`
- [x] Remove `@Environment(\.modelContext)` usage in custom event views
- [x] Update CLAUDE.md to reflect architecture change

## Testing

- [ ] Test backend CRUD endpoints with Postman/curl
- [ ] Test user ownership isolation (user A cannot see user B's events)
- [ ] Test AI enhancement endpoint
- [ ] Test iOS repository methods
- [ ] Test offline error handling in iOS views
