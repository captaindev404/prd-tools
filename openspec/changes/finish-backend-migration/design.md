# Backend Migration Design Document

**Change ID**: `finish-backend-migration`
**Author**: Development Team
**Date**: 2025-11-13
**Status**: Proposed

## Overview

This document explains the architectural decisions and design rationale for completing the migration from a local-only iOS app with direct OpenAI API calls to an API-only architecture using the Next.js backend.

## Context

### Current State
The iOS app is in a transitional state:
- **Backend API exists** with all CRUD endpoints, Better Auth, and OpenAI integration
- **iOS networking layer exists** with APIClient, repositories, and auth state management
- **Legacy code remains** - ViewModels still reference AIService for direct OpenAI calls
- **Auth not fully wired** - Sign-up/sign-in UI exists but not connected to backend
- **Mixed architecture** - Some features use repositories, others use direct OpenAI

### Problem
Users cannot benefit from multi-device sync, cloud backup, or centralized API key management because the iOS app doesn't fully use the backend. The transitional state creates confusion and technical debt.

## Goals

### Primary Goals
1. **Complete API integration** - All features use backend API exclusively
2. **Remove legacy code** - Eliminate direct OpenAI integration from iOS
3. **Working auth flow** - Users can sign up, sign in, and stay authenticated
4. **Zero regressions** - All existing features continue to work
5. **Maintainable codebase** - Clean architecture with clear patterns

### Non-Goals
- Offline-first architecture (app is API-only by design)
- Data migration from local to cloud (out of scope, separate feature)
- Social authentication (future enhancement)
- Email verification (future enhancement)

## Architecture Decisions

### Decision 1: API-Only (No Offline Mode)

**Context**: The PRD originally described an "offline-first" architecture with local caching. However, CLAUDE.md states the app is "API-only (online-only)".

**Decision**: Implement API-only architecture with no local data persistence for heroes/stories.

**Rationale**:
- ✅ Simpler architecture - no sync conflicts, no merge logic
- ✅ Always fresh data from server
- ✅ Lower device storage usage
- ✅ URLCache automatically handles media caching
- ❌ Requires internet connection to function
- ❌ No offline experience for users

**Alternatives Considered**:
1. **Offline-first with bidirectional sync** - Rejected due to complexity and PRD/CLAUDE.md mismatch
2. **Read-only cache** - Rejected to keep architecture simple
3. **Hybrid (online for writes, cached reads)** - Rejected for consistency

**Implementation**:
- Repositories call backend API directly
- Network errors block operations and show user-friendly messages
- URLCache handles automatic media caching (avatars, audio, illustrations)
- NetworkMonitor detects offline state and prevents API calls

### Decision 2: Session-Based Auth with JWT

**Context**: Need secure authentication for API calls.

**Decision**: Use Better Auth with session tokens stored in iOS Keychain.

**Rationale**:
- ✅ Better Auth handles complexity (token generation, validation, expiry)
- ✅ Keychain provides secure storage on iOS
- ✅ 30-day session with 24-hour refresh policy
- ✅ Middleware automatically protects API routes
- ❌ No biometric auth yet (future enhancement)

**Alternatives Considered**:
1. **OAuth 2.0** - Rejected as overkill for email/password auth
2. **Firebase Auth** - Rejected to avoid vendor lock-in
3. **Clerk** - Already migrated away due to cost

**Implementation**:
- AuthStateManager stores token in Keychain
- APIClient injects `Authorization: Bearer <token>` header
- 401 responses trigger automatic sign-out
- Token refresh logic prevents expiry (future enhancement)

### Decision 3: Repository Pattern for Data Access

**Context**: Need clean separation between UI and network layer.

**Decision**: Use repository pattern with protocol-based design.

**Rationale**:
- ✅ Testable - repositories can be mocked in tests
- ✅ Clean separation - ViewModels don't know about HTTP details
- ✅ Single responsibility - repositories handle data, ViewModels handle UI logic
- ✅ Flexibility - easy to swap backend implementation

**Alternatives Considered**:
1. **Direct API calls in ViewModels** - Rejected for poor testability
2. **MVVM with networking in ViewModels** - Rejected for tight coupling
3. **Redux/TCA architecture** - Rejected as overkill for this app

**Implementation**:
```swift
// Protocol for testing
protocol HeroRepositoryProtocol {
    func fetchHeroes() async throws -> [Hero]
    func createHero(_ hero: Hero) async throws -> Hero
    func generateAvatar(for heroId: String) async throws -> String
}

// Concrete implementation
class HeroRepository: HeroRepositoryProtocol {
    private let apiClient: APIClient

    func fetchHeroes() async throws -> [Hero] {
        return try await apiClient.request(.heroes)
    }
}

// ViewModel uses protocol
class HeroListViewModel {
    private let repository: HeroRepositoryProtocol

    func loadHeroes() async {
        do {
            heroes = try await repository.fetchHeroes()
        } catch {
            // Handle error
        }
    }
}
```

### Decision 4: Deprecate AIService Instead of Immediate Deletion

**Context**: AIService has 1178 lines of code and is referenced in multiple places.

**Decision**: Mark as deprecated first, then remove after migration is complete.

**Rationale**:
- ✅ Incremental migration - less risky than big-bang deletion
- ✅ Easy rollback - code still exists if issues found
- ✅ Clear migration path - deprecation warnings guide developers
- ❌ Temporary code duplication - both AIService and repositories exist

**Alternatives Considered**:
1. **Immediate deletion** - Rejected as too risky
2. **Keep both indefinitely** - Rejected to avoid confusion
3. **Feature flag** - Rejected as unnecessary for this migration

**Implementation**:
1. Add `@available(*, deprecated)` to AIService
2. Update all usages to use repositories
3. Verify all features work
4. Delete AIService.swift
5. Remove OpenAI SDK dependency

### Decision 5: URLCache for Media Caching

**Context**: Need to cache images and audio without implementing custom cache logic.

**Decision**: Use iOS URLCache for automatic media caching.

**Rationale**:
- ✅ Built into iOS - no custom implementation needed
- ✅ Respects HTTP cache headers from backend
- ✅ Automatic eviction based on LRU policy
- ✅ Works with async/await URLSession
- ❌ Limited control over eviction policy

**Alternatives Considered**:
1. **Custom file cache** - Rejected to avoid reinventing the wheel
2. **SwiftData for media** - Rejected as inappropriate for binary data
3. **No caching** - Rejected due to poor user experience

**Implementation**:
```swift
// Configure URLCache in app init
let cache = URLCache(
    memoryCapacity: 50 * 1024 * 1024,   // 50 MB
    diskCapacity: 200 * 1024 * 1024,     // 200 MB
    directory: nil
)
URLCache.shared = cache

// URLSession automatically uses URLCache
let (data, _) = try await URLSession.shared.data(from: avatarURL)
// Cached automatically on subsequent requests
```

## Data Flow

### Authentication Flow
```
User enters email/password
    ↓
AuthenticationView
    ↓
APIClient.request(.signIn)
    ↓
POST /api/auth/sign-in
    ↓
Backend validates credentials
    ↓
Session token generated
    ↓
Token returned to iOS
    ↓
AuthStateManager.signIn(token, userId)
    ↓
Token stored in Keychain
    ↓
App navigates to ImprovedContentView
    ↓
Subsequent API calls include Bearer token
```

### Story Generation Flow (Backend-Proxied)
```
User selects hero + event
    ↓
StoryGenerationView
    ↓
StoryViewModel.generateStory()
    ↓
StoryRepository.generateStory(heroId, event)
    ↓
APIClient.request(.generateStory)
    ↓
POST /api/stories (with auth token)
    ↓
Backend validates token
    ↓
Backend calls OpenAI GPT-4o (story text)
    ↓
Backend calls OpenAI TTS (audio)
    ↓
Backend uploads audio to R2
    ↓
Backend generates illustrations (DALL-E)
    ↓
Backend uploads illustrations to R2
    ↓
Backend returns story + URLs
    ↓
iOS downloads and caches media via URLCache
    ↓
Story displayed in UI
```

## Error Handling Strategy

### Network Errors
- **Offline**: Show "Network error. Please check your connection." with retry button
- **Timeout**: Retry with exponential backoff (default: 3 retries)
- **DNS failure**: Same as offline

### API Errors
- **400 Bad Request**: Show "Invalid data. Please check your input."
- **401 Unauthorized**: Automatic sign-out → navigate to AuthenticationView
- **404 Not Found**: Show "Resource not found."
- **429 Rate Limited**: Show "Too many requests. Please try again later."
- **500 Server Error**: Show "Server error. Please try again later."

### User Experience
- All errors show user-friendly messages (no raw HTTP errors)
- Retry buttons available for transient failures
- Loading indicators during operations
- No silent failures - all errors reported

## Security Considerations

### Authentication
- Session tokens stored in iOS Keychain (encrypted by iOS)
- Tokens transmitted over HTTPS only
- Automatic sign-out on 401 (token expired/invalid)
- No plaintext passwords in logs or analytics

### API Communication
- All requests use HTTPS
- Backend validates all inputs
- Rate limiting prevents abuse
- CORS configured for iOS app

### Data Privacy
- No user data stored locally (API-only)
- Media files cached temporarily (URLCache)
- User can sign out to clear session

## Testing Strategy

### Unit Tests (Fast, No External Dependencies)
- AuthStateManager: token storage, sign-in/sign-out
- APIClient: request building, auth header injection, error handling
- Repositories: API call logic, response parsing

### Integration Tests (Requires Test Backend)
- Auth flow: sign-up → sign-in → authenticated API call
- Hero CRUD: create → read → update → delete
- Story generation: generate story → download audio → cache media

### UI Tests (Slow, End-to-End)
- Sign-up flow: enter credentials → create account → land in main app
- Hero creation: tap FAB → create hero → see in list
- Story generation: select hero → generate story → play audio

### Performance Tests
- API latency: P50 <1s, P95 <5s
- Retry logic under poor network
- Memory usage during media download

## Rollout Plan

### Phase 1: Auth Integration (Week 1)
- Wire up sign-up/sign-in UI
- Add auth header injection
- Test auth end-to-end

### Phase 2: Repository Completion (Week 2)
- Ensure all features use repositories
- Remove AIService references
- Update ViewModels

### Phase 3: Code Cleanup (Week 2-3)
- Remove direct OpenAI code
- Delete unused files
- Update documentation

### Phase 4: Testing (Week 3)
- Comprehensive testing
- Bug fixes
- Performance validation

## Rollback Strategy

### Phase 1-2: Easy Rollback
- Uncommit changes
- AIService still exists (just deprecated)
- No data migration yet

### Phase 3: Moderate Rollback
- Re-add OpenAI SDK if needed
- Restore AIService from git
- May require code changes

### Phase 4: Hard Rollback
- Should not be necessary (testing phase)
- If needed, revert entire change

**Mitigation**: Comprehensive testing before Phase 4 reduces rollback risk.

## Open Questions & Risks

### Q: What if backend is down?
**A**: App shows network error and blocks operations. No offline fallback (by design).

### Q: How to handle token refresh?
**A**: Planned for future enhancement. Current tokens last 30 days.

### Q: What about existing local data?
**A**: Out of scope for this change. Separate migration tool needed.

### Q: Performance degradation?
**A**: URLCache mitigates this. Backend latency acceptable (<5s P95).

### Risks
1. **Backend downtime breaks app** - Mitigated by API health checks and monitoring
2. **Auth token security** - Mitigated by Keychain storage and HTTPS
3. **Breaking existing users** - Mitigated by comprehensive testing
4. **Performance issues** - Mitigated by URLCache and batch operations

## Success Metrics

### Functional
- ✅ User can sign up and sign in
- ✅ All features work via backend API
- ✅ No direct OpenAI calls from iOS
- ✅ Auth errors handled gracefully

### Technical
- ✅ Code coverage >80%
- ✅ Zero AIService references
- ✅ All tests passing
- ✅ Build succeeds

### User Experience
- ✅ Sign-up/sign-in smooth
- ✅ Error messages clear
- ✅ Performance unchanged

## Future Enhancements

### Short-term (Next 1-3 months)
- Token auto-refresh before expiry
- Biometric authentication (Face ID/Touch ID)
- Email verification
- Password reset flow

### Long-term (Next 6-12 months)
- Offline mode with read-only cache
- Data migration tool for existing users
- Social authentication (Apple, Google)
- Multi-device sync notifications

## Conclusion

This design completes the backend migration by:
1. Fully integrating iOS with backend API
2. Removing all direct OpenAI code
3. Providing working authentication
4. Maintaining code quality and testability

The API-only approach simplifies the architecture and enables future enhancements like multi-device sync and cloud backup.
