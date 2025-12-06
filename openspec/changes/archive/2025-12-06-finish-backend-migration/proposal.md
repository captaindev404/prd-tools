# Finish Backend Migration

**Change ID**: `finish-backend-migration`
**Status**: In Progress (Phase 1, 2 & 3 Complete)
**Created**: 2025-11-13
**Updated**: 2025-11-14
**Owner**: Development Team

## Summary

Complete the migration from local-only iOS app with direct OpenAI API calls to a cloud-backed, API-only architecture using the Next.js backend. The backend API infrastructure is already implemented but not fully integrated with the iOS app, which still contains legacy direct OpenAI code paths.

## Problem Statement

The iOS app is currently in a transitional state:

1. **Backend API exists but auth not fully wired** - Better Auth is configured, middleware is in place, but the iOS app doesn't properly authenticate with the backend
2. **Mixed code paths** - ViewModels reference both new repositories (HeroRepository, StoryRepository) and legacy AIService for direct OpenAI calls
3. **Legacy code not deprecated** - AIService (~1178 lines) and direct OpenAI integration still present
4. **No auth UI flow** - AuthenticationView exists but sign-up/sign-in flow incomplete
5. **Untested integration** - No end-to-end testing of auth + API calls
6. **Documentation outdated** - CLAUDE.md mentions "API-only" but implementation is incomplete

## Current State

### ✅ Implemented
- Backend API with all CRUD endpoints (heroes, stories, user, auth)
- Better Auth replacing Clerk (session-based auth with JWT)
- Middleware protecting API routes
- iOS networking layer (APIClient, Endpoint, APIError, RetryPolicy)
- iOS repository pattern (HeroRepository, StoryRepository, CustomEventRepository)
- iOS AuthStateManager for session token storage
- PostgreSQL database with Prisma ORM
- Cloudflare R2 for media storage

### ❌ Incomplete
- Auth flow not wired in iOS (sign-up, sign-in, token refresh)
- ViewModels still use legacy AIService alongside repositories
- No removal of direct OpenAI integration code
- No data migration from local SwiftData to backend
- No comprehensive error handling for auth failures
- No testing coverage for backend integration
- APIClient doesn't inject auth headers properly

## Proposed Changes

### 1. Complete iOS Auth Integration
- Wire up AuthenticationView to backend auth endpoints
- Implement sign-up flow with email validation
- Implement sign-in flow with error handling
- Add token refresh logic in APIClient
- Add biometric authentication option (Face ID/Touch ID)
- Handle auth errors gracefully with user-friendly messages

### 2. Remove Legacy OpenAI Integration
- Deprecate and remove AIService
- Remove direct OpenAI API key storage from iOS
- Update all ViewModels to use only repositories
- Remove OpenAI SDK dependencies from iOS
- Clean up unused networking code

### 3. Complete API Integration
- Ensure all features use backend API (no direct OpenAI)
- Add auth header injection in APIClient
- Implement proper error handling for 401 Unauthorized
- Add auto-retry with token refresh on auth errors
- Update repositories to handle all use cases

### 4. Data Migration
- Create migration tool to export local SwiftData
- Upload existing heroes/stories to backend
- Verify data integrity after migration
- Provide rollback mechanism if migration fails
- Clear local cache after successful migration

### 5. Testing & Validation
- Unit tests for repositories and auth logic
- Integration tests for API client with auth
- End-to-end tests for key user flows
- Manual testing of all CRUD operations
- Performance testing for API calls

### 6. Documentation & Cleanup
- Update CLAUDE.md with accurate architecture
- Remove outdated local-only references
- Document auth flow and token management
- Update README with backend setup instructions
- Create troubleshooting guide for common issues

## Success Criteria

### Functional
- ✅ User can sign up with email/password
- ✅ User can sign in and receive session token
- ✅ All API calls include valid Bearer token
- ✅ Token auto-refreshes before expiry
- ✅ App shows auth errors clearly
- ✅ All features work through backend API
- ✅ No direct OpenAI calls from iOS

### Technical
- ✅ Zero references to AIService in ViewModels
- ✅ All tests pass (unit, integration, E2E)
- ✅ No hardcoded API keys in iOS
- ✅ Auth headers automatically injected
- ✅ Proper 401 handling with token refresh
- ✅ Code coverage >80% for critical paths

### User Experience
- ✅ Smooth sign-up/sign-in flow
- ✅ Existing users can migrate data
- ✅ Clear error messages for auth failures
- ✅ No breaking changes for API-compatible users
- ✅ Performance unchanged or improved

## Implementation Progress

### ✅ Phase 1: Authentication Integration (COMPLETED 2025-11-14)
- [x] Backend auth endpoints verified (`/api/auth/sign-up`, `/api/auth/sign-in`)
- [x] Better Auth Bearer plugin added for mobile authentication
- [x] Route-level authentication implemented (moved from middleware due to Edge Runtime constraints)
- [x] iOS APIClient auth header injection verified
- [x] AuthStateManager complete with Keychain storage
- [x] AuthenticationView sign-up/sign-in flows complete
- [x] App routing based on auth state implemented
- [x] Automatic 401 sign-out handling working

**Key Changes:**
- Moved auth from middleware to route handlers (Edge Runtime + Prisma limitation)
- All protected routes now check `requireAuth()` at handler level
- Bearer tokens returned in both `set-auth-token` header and JSON body
- 30-day session expiry configured

### ✅ Phase 2: Repository Integration (COMPLETED 2025-11-14)
- [x] HeroRepository verified - all operations use backend API
- [x] StoryRepository verified - all operations use backend API
- [x] Removed AIService from StoryViewModel
- [x] Removed AIService from all Views (Avatar, Audio, Story generation)
- [x] Updated all Services to use backend API:
  - CustomEventAIAssistant - removed unused aiService
  - IllustrationGenerator - retry methods use StoryRepository
  - EventPictogramGenerator - calls `/api/images/generate-pictogram`
  - AudioService - deprecated generateAudioFile()
- [x] Updated error handling from AIServiceError to APIError
- [x] iOS project builds successfully with zero errors

**Key Changes:**
- All AI operations now go through backend API (no direct OpenAI calls)
- Network connectivity checks in place
- Proper error handling with user-friendly messages
- Authentication integrated into all API calls

### ✅ Phase 3: Legacy Code Removal (COMPLETED 2025-11-14)
- [x] Mark AIService as deprecated
- [x] Remove OpenAI SDK dependencies from iOS
- [x] Delete AIService.swift file
- [x] Delete IllustrationGenerator.swift file
- [x] Clean up unused code
- [x] SwiftLint code review
- [x] iOS project builds successfully with zero errors

**Key Changes:**
- Deleted AIService.swift (~59KB, 1178 lines)
- Deleted IllustrationGenerator.swift (unused after Phase 2 migration)
- No OpenAI SDK dependencies remain in iOS project
- Build succeeds with zero errors, only Swift 6 concurrency warnings
- All AI operations confirmed to go through backend API only

### ⏳ Phase 4: Testing & Validation (PENDING)
- [ ] Unit tests for repositories
- [ ] Integration tests for auth flow
- [ ] Manual testing on device
- [ ] Performance testing
- [ ] Error scenario testing

### ⏳ Phase 5: Documentation & Deployment (PENDING)
- [ ] Update CLAUDE.md
- [ ] Update README
- [ ] Deploy backend to production
- [ ] Configure R2 storage
- [ ] Submit iOS app

## Implementation Phases

### Phase 1: Auth Flow (Week 1) ✅ COMPLETE
- Wire up sign-up/sign-in UI
- Implement token storage and refresh
- Add auth header injection
- Test auth end-to-end

### Phase 2: Repository Completion (Week 2) ✅ COMPLETE
- Ensure all features use repositories
- Remove AIService references
- Update ViewModels
- Test all CRUD operations

### Phase 3: Code Cleanup (Week 2-3) ✅ COMPLETE
- Remove direct OpenAI code
- Delete unused files
- Update documentation
- Code review

### Phase 4: Migration & Testing (Week 3) ⏳ PENDING
- Build data migration tool
- Test migration flow
- Comprehensive testing
- Bug fixes

## Related Specs

- `backend-auth`: Authentication and session management
- `ios-integration`: iOS app backend integration
- `deprecation`: Legacy code removal
- `testing`: Test coverage and validation

## Dependencies

- Backend API must be deployed and accessible
- Better Auth configuration complete
- Database migrations applied
- R2 storage configured

## Risks & Mitigations

### Risk: Breaking existing users
**Mitigation**: Feature flag to enable/disable backend mode, migration tool with rollback

### Risk: Auth token security
**Mitigation**: Store in iOS Keychain, use HTTPS only, implement token rotation

### Risk: API downtime breaks app
**Mitigation**: Already mitigated - app is API-only by design, not offline-first

### Risk: Performance degradation
**Mitigation**: Use URLCache for media, batch API calls, monitor performance

## Open Questions

1. Should we support offline mode with local caching? (Answer: No, per CLAUDE.md API-only architecture)
2. What's the migration strategy for existing users? (Answer: One-time migration tool with progress tracking)
3. Do we need API versioning? (Answer: Not yet, but prepare for v2 if needed)
4. Should we add analytics for API usage? (Answer: Yes, but separate change)

## Approval

- [ ] iOS Engineering Team
- [ ] Backend Engineering Team
- [ ] Product Owner
- [ ] QA Team
