# Proposal: Migrate Hero Visual Profile to API

## Summary

Migrate `HeroVisualProfile` from local SwiftData persistence to the backend API, making visual profiles sync across devices and follow the same API-only architecture as Heroes and Stories.

## Motivation

Currently, `HeroVisualProfile` uses local SwiftData persistence while Heroes and Stories are API-only. This creates:

1. **Inconsistent architecture** - Mixed persistence strategies complicate the codebase
2. **No cross-device sync** - Visual profiles created on one device aren't available on another
3. **Data loss risk** - Uninstalling the app loses visual profiles permanently
4. **Orphaned relationships** - Heroes referencing visual profiles may have stale/missing data after app reinstall

The backend already has:
- `HeroVisualProfile` model in Prisma schema (lines 133-170)
- One-to-one relationship with Hero (`heroId` unique constraint)
- Visual profile included in Hero queries (`visualProfile: true`)
- `HeroVisualProfileResponse` DTO already defined in iOS (APIResponse.swift:160-170)

## Scope

### In Scope
- Implement backend CRUD endpoints for visual profiles (`/api/v1/heroes/:heroId/visual-profile`)
- Implement AI extraction endpoint (`/api/v1/heroes/:heroId/visual-profile/extract`)
- Update iOS `HeroVisualProfileView` to use API instead of SwiftData
- Remove SwiftData `@Model` from `HeroVisualProfile` (make it a plain Codable struct)
- Add network connectivity checks before visual profile operations
- Update `HeroRepository` to include visual profile management methods

### Out of Scope
- Migration of existing local data (users will need to recreate profiles or regenerate via AI)
- Offline support / local caching (follows API-only architecture)
- Changes to illustration generation (already uses visual profile from backend)

## Affected Capabilities

| Capability | Change Type | Description |
|------------|-------------|-------------|
| visual-profile | NEW | Backend CRUD and AI extraction for hero visual profiles |

## Dependencies

- Backend infrastructure already exists
- Prisma schema already defines `HeroVisualProfile` model with all required fields
- iOS networking layer (`APIClient`, `Endpoint`) already configured
- `HeroVisualProfileResponse` DTO already exists in iOS

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users lose existing local profiles | Medium | Low | Visual profiles can be regenerated via AI extraction |
| API latency affects UX | Low | Medium | Show loading states; existing pattern from Hero/Story |
| Breaking change for existing users | Medium | Low | Document in release notes; profiles are auto-generated |
