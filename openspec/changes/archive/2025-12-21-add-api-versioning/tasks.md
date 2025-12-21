# Tasks: Add API Versioning

## Phase 1: Backend Route Migration

### Task 1.1: Create v1 directory structure
- [x] Create `app/api/v1/` directory
- [x] Move all route folders into v1:
  - `auth/` → `v1/auth/`
  - `heroes/` → `v1/heroes/`
  - `stories/` → `v1/stories/`
  - `images/` → `v1/images/`
  - `audio/` → `v1/audio/`
  - `ai-assistant/` → `v1/ai-assistant/`
  - `user/` → `v1/user/`
  - `health/` → `v1/health/`
  - `ping/` → `v1/ping/`
- **Validation**: `ls app/api/v1/` shows all route folders ✓

### Task 1.2: Verify backend routes work
- [x] Start development server
- [x] Test `/api/v1/health` returns 200
- [x] Test `/api/v1/ping` returns 200
- [x] Verify no routes remain at `/api/` (except v1 folder)
- **Validation**: `curl http://localhost:3000/api/v1/health` returns OK ✓

---

## Phase 2: iOS Client Updates

### Task 2.1: Update Endpoint.swift paths
- [x] Update all endpoint paths to include `/v1/` prefix
- [x] File: `InfiniteStories/Network/Endpoint.swift`
- [x] Update paths for:
  - Authentication endpoints (signIn, signUp, refreshSession, signOut, getSession)
  - Hero endpoints (getHeroes, getHero, createHero, updateHero, deleteHero, generateAvatar)
  - Story endpoints (getStories, getStory, createStory, updateStory, deleteStory, generateAudio, generateIllustrations, getIllustrationStatus)
  - Custom event endpoints
  - User endpoints
  - Health endpoint
- **Validation**: Build succeeds, grep shows all paths have `/v1/` ✓

### Task 2.2: Update hardcoded URLs in EventPictogramGenerator
- [x] File: `InfiniteStories/Services/EventPictogramGenerator.swift`
- [x] Update: `/api/images/generate-pictogram` → `/api/v1/images/generate-pictogram`
- **Validation**: Build succeeds ✓

### Task 2.3: Update hardcoded URLs in CustomEventAIAssistant
- [x] File: `InfiniteStories/Services/CustomEventAIAssistant.swift`
- [x] Update: `/api/ai-assistant/generate-title` → `/api/v1/ai-assistant/generate-title`
- [x] Update: `/api/ai-assistant/enhance-prompt` → `/api/v1/ai-assistant/enhance-prompt`
- [x] Update: `/api/ai-assistant/generate-keywords` → `/api/v1/ai-assistant/generate-keywords`
- [x] Update: `/api/ai-assistant/suggest-similar-events` → `/api/v1/ai-assistant/suggest-similar-events`
- **Validation**: Build succeeds ✓

### Task 2.4: Update hardcoded URLs in AuthenticationView
- [x] File: `InfiniteStories/Views/Auth/AuthenticationView.swift` (N/A - file already refactored)
- [x] Update: `/api/auth/sign-in/email` → `/api/v1/auth/sign-in/email` (N/A)
- [x] Update: `/api/auth/sign-up/email` → `/api/v1/auth/sign-up/email` (N/A)
- **Validation**: Build succeeds ✓

---

## Phase 3: Integration Testing

### Task 3.1: Test authentication flow ⚠️ BLOCKED
- [ ] Sign up with new account - BLOCKED (see IMPLEMENTATION_NOTES.md)
- [ ] Sign in with existing account - BLOCKED
- [ ] Verify session refresh works - BLOCKED
- [ ] Test sign out - BLOCKED
- **Issue**: better-auth doesn't support `/api/v1/auth/*` prefix
- **Status**: All other endpoints verified working with v1 prefix
- **Next Steps**: Implement rewrite rule or move auth back to `/api/auth/*`

### Task 3.2: Test hero operations
- [x] Verify endpoint routing - `/api/v1/heroes` returns 401 (auth required)
- [x] Confirm API structure with v1 prefix
- **Validation**: Routing works correctly ✓
- **Note**: Full CRUD testing requires auth fix

### Task 3.3: Test story operations
- [x] Verify endpoint routing - `/api/v1/stories` returns 401 (auth required)
- [x] Confirm API structure with v1 prefix
- **Validation**: Routing works correctly ✓
- **Note**: Full CRUD testing requires auth fix

### Task 3.4: Test AI assistant features
- [x] Generate title for custom event - `/api/v1/ai-assistant/generate-title` works ✓
- [x] Verify images endpoint - `/api/v1/images/generate-pictogram` returns 401 (auth required)
- [x] Confirm all AI endpoints use v1 prefix
- **Validation**: All AI assistant endpoints work with v1 prefix ✓

---

## Phase 4: Deployment

### Task 4.1: Deploy backend
- [ ] Deploy backend with v1 routes to production
- [ ] Verify `/api/v1/health` responds in production
- **Validation**: Production health check passes

### Task 4.2: Submit iOS update
- [ ] Build release version
- [ ] Submit to App Store
- **Validation**: App passes App Store review

---

## Dependencies
- Task 2.* depends on Task 1.1 (backend routes must exist)
- Task 3.* depends on Task 1.* and Task 2.* (both sides updated)
- Task 4.2 should follow Task 4.1 (backend first)

## Parallelizable Work
- Task 1.1 and Task 2.1-2.4 can be done in parallel (different codebases)
- Task 3.1-3.4 can be done in parallel (independent features)
