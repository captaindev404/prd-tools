# Tasks: Migrate Custom Events to API

## Backend Implementation

### Phase 1: CRUD Endpoints

- [ ] Create `app/api/v1/custom-events/route.ts` with GET (list) and POST (create)
- [ ] Create `app/api/v1/custom-events/[eventId]/route.ts` with GET, PATCH, DELETE
- [ ] Add user ownership validation (filter by userId from session)
- [ ] Add pagination support (limit, offset, hasMore)
- [ ] Add request validation for required fields (title, promptSeed)

### Phase 2: AI Enhancement

- [ ] Create `app/api/v1/custom-events/[eventId]/enhance/route.ts`
- [ ] Implement GPT-4o-mini prompt enhancement logic
- [ ] Implement keyword extraction from enhanced prompt
- [ ] Store enhancement metadata in `aiEnhancementMetadata` column

### Phase 3: Usage Tracking

- [ ] Update story creation endpoint to increment custom event `usageCount`
- [ ] Update story creation endpoint to set custom event `lastUsedAt`

## iOS Implementation

### Phase 4: Model Changes

- [ ] Convert `CustomStoryEvent` from `@Model` class to `Codable` struct
- [ ] Change `id` from `UUID` to `String` for server-assigned cuids
- [ ] Rename `eventDescription` to `description` for API consistency
- [ ] Remove pictogram-related properties (out of scope)
- [ ] Remove `@Relationship` to Story (handled by API)
- [ ] Create `CustomEventResponse` and `CustomEventsResponse` DTOs

### Phase 5: Repository Implementation

- [ ] Update `CustomEventRepository` to inject `APIClient`
- [ ] Implement `fetchCustomEvents()` using `GET /api/v1/custom-events`
- [ ] Implement `fetchCustomEvent(id:)` using `GET /api/v1/custom-events/:id`
- [ ] Implement `createCustomEvent(_:)` using `POST /api/v1/custom-events`
- [ ] Implement `updateCustomEvent(_:)` using `PATCH /api/v1/custom-events/:id`
- [ ] Implement `deleteCustomEvent(_:)` using `DELETE /api/v1/custom-events/:id`
- [ ] Implement `enhanceEvent(_:)` using `POST /api/v1/custom-events/:id/enhance`

### Phase 6: View Updates

- [ ] Update `CustomEventManagementView` to use `@State` instead of `@Query`
- [ ] Add loading state with `ProgressView` during fetch
- [ ] Add error state with `ErrorView` and retry button
- [ ] Update `CustomEventCreationView` for API-based creation
- [ ] Update `CustomEventDetailView` for API-based updates
- [ ] Add network availability checks before mutations

### Phase 7: Cleanup

- [ ] Remove SwiftData model container registration for `CustomStoryEvent`
- [ ] Remove `@Environment(\.modelContext)` usage in custom event views
- [ ] Update CLAUDE.md to reflect architecture change

## Testing

- [ ] Test backend CRUD endpoints with Postman/curl
- [ ] Test user ownership isolation (user A cannot see user B's events)
- [ ] Test AI enhancement endpoint
- [ ] Test iOS repository methods
- [ ] Test offline error handling in iOS views
