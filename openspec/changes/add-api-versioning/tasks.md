# Tasks: Add API Versioning

## Phase 1: Backend Route Migration

### Task 1.1: Create v1 directory structure
- [ ] Create `app/api/v1/` directory
- [ ] Move all route folders into v1:
  - `auth/` → `v1/auth/`
  - `heroes/` → `v1/heroes/`
  - `stories/` → `v1/stories/`
  - `images/` → `v1/images/`
  - `audio/` → `v1/audio/`
  - `ai-assistant/` → `v1/ai-assistant/`
  - `user/` → `v1/user/`
  - `custom-events/` → `v1/custom-events/`
  - `health/` → `v1/health/`
  - `ping/` → `v1/ping/`
- **Validation**: `ls app/api/v1/` shows all route folders

### Task 1.2: Verify backend routes work
- [ ] Start development server
- [ ] Test `/api/v1/health` returns 200
- [ ] Test `/api/v1/ping` returns 200
- [ ] Verify no routes remain at `/api/` (except v1 folder)
- **Validation**: `curl http://localhost:3000/api/v1/health` returns OK

---

## Phase 2: iOS Client Updates

### Task 2.1: Update Endpoint.swift paths
- [ ] Update all endpoint paths to include `/v1/` prefix
- [ ] File: `InfiniteStories/Network/Endpoint.swift`
- [ ] Update paths for:
  - Authentication endpoints (signIn, signUp, refreshSession, signOut, getSession)
  - Hero endpoints (getHeroes, getHero, createHero, updateHero, deleteHero, generateAvatar)
  - Story endpoints (getStories, getStory, createStory, updateStory, deleteStory, generateAudio, generateIllustrations, getIllustrationStatus)
  - Custom event endpoints
  - User endpoints
  - Health endpoint
- **Validation**: Build succeeds, grep shows all paths have `/v1/`

### Task 2.2: Update hardcoded URLs in EventPictogramGenerator
- [ ] File: `InfiniteStories/Services/EventPictogramGenerator.swift`
- [ ] Update: `/api/images/generate-pictogram` → `/api/v1/images/generate-pictogram`
- **Validation**: Build succeeds

### Task 2.3: Update hardcoded URLs in CustomEventAIAssistant
- [ ] File: `InfiniteStories/Services/CustomEventAIAssistant.swift`
- [ ] Update: `/api/ai-assistant/generate-title` → `/api/v1/ai-assistant/generate-title`
- [ ] Update: `/api/ai-assistant/enhance-prompt` → `/api/v1/ai-assistant/enhance-prompt`
- [ ] Update: `/api/ai-assistant/generate-keywords` → `/api/v1/ai-assistant/generate-keywords`
- [ ] Update: `/api/ai-assistant/suggest-similar-events` → `/api/v1/ai-assistant/suggest-similar-events`
- **Validation**: Build succeeds

### Task 2.4: Update hardcoded URLs in AuthenticationView
- [ ] File: `InfiniteStories/Views/Auth/AuthenticationView.swift`
- [ ] Update: `/api/auth/sign-in/email` → `/api/v1/auth/sign-in/email`
- [ ] Update: `/api/auth/sign-up/email` → `/api/v1/auth/sign-up/email`
- **Validation**: Build succeeds

---

## Phase 3: Integration Testing

### Task 3.1: Test authentication flow
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Verify session refresh works
- [ ] Test sign out
- **Validation**: Auth flows complete without errors

### Task 3.2: Test hero operations
- [ ] Create a hero
- [ ] List heroes
- [ ] Update a hero
- [ ] Generate avatar
- [ ] Delete a hero
- **Validation**: All hero CRUD operations work

### Task 3.3: Test story operations
- [ ] Create a story
- [ ] List stories
- [ ] Generate audio for story
- [ ] Generate illustrations
- [ ] Check illustration status
- [ ] Delete a story
- **Validation**: All story operations work

### Task 3.4: Test AI assistant features
- [ ] Generate title for custom event
- [ ] Enhance prompt
- [ ] Generate keywords
- [ ] Suggest similar events
- [ ] Generate pictogram
- **Validation**: All AI assistant features work

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
