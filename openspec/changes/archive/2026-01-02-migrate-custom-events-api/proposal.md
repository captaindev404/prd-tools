# Proposal: Migrate Custom Events to API

## Summary

Migrate `CustomStoryEvent` from local SwiftData persistence to the backend API, making custom events sync across devices and follow the same API-only architecture as Heroes and Stories.

## Motivation

Currently, `CustomStoryEvent` is the only data model that uses local SwiftData persistence while Heroes and Stories are API-only. This creates:

1. **Inconsistent architecture** - Mixed persistence strategies complicate the codebase
2. **No cross-device sync** - Custom events created on one device aren't available on another
3. **Data loss risk** - Uninstalling the app loses custom events permanently
4. **Orphaned relationships** - Stories referencing custom events may have stale/missing references

The backend already has:
- `CustomStoryEvent` model in Prisma schema (lines 254-294)
- User relationship for ownership
- Story relationship for usage tracking
- iOS `Endpoint` enum with custom event routes defined (lines 40-46)

## Scope

### In Scope
- Implement backend CRUD endpoints for custom events (`/api/v1/custom-events`)
- Implement AI enhancement endpoint (`/api/v1/custom-events/:id/enhance`)
- Update iOS `CustomEventRepository` to use API instead of SwiftData stubs
- Update iOS views to handle network loading/error states
- Remove SwiftData `@Model` from `CustomStoryEvent` (make it a plain Codable struct)
- Add network connectivity checks before custom event operations

### Out of Scope
- Pictogram generation (separate feature, can remain local or be added later)
- Migration of existing local data (users will need to recreate events)
- Offline support / local caching (follows API-only architecture)

## Affected Capabilities

| Capability | Change Type | Description |
|------------|-------------|-------------|
| custom-events | NEW | Backend CRUD and AI enhancement for custom events |

## Dependencies

- Backend infrastructure already exists
- Prisma schema already defines `CustomStoryEvent` model
- iOS networking layer (`APIClient`, `Endpoint`) already configured

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users lose existing local events | Medium | Medium | Document in release notes; events are user-created so can be recreated |
| API latency affects UX | Low | Medium | Show loading states; existing pattern from Hero/Story |
