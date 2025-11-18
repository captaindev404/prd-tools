# iOS Backend Integration Capability

**Capability**: iOS Backend Integration
**Status**: In Progress
**Owner**: iOS Engineering

## Overview

This capability ensures the iOS app fully integrates with the backend API for all operations, replacing direct OpenAI API calls with backend-proxied requests. The app must authenticate users, make authorized API calls, and handle all responses appropriately.

---

## ADDED Requirements

### Requirement: APIClient Must Inject Auth Headers

**Priority**: Critical
**Status**: Partially Implemented (Needs Auth Header Injection)

The APIClient SHALL automatically inject authentication headers for all API requests when the user is signed in.

#### Scenario: Authenticated request includes Bearer token

**Given** a user is signed in with session token "abc123xyz"
**When** the app makes any API request via APIClient
**Then** the request includes header `Authorization: Bearer abc123xyz`
**And** the token is retrieved from AuthStateManager.shared.sessionToken
**And** the request proceeds to the backend

#### Scenario: Unauthenticated request omits auth header

**Given** no user is signed in
**When** the app makes a request to a public endpoint `/api/health`
**Then** no `Authorization` header is included
**And** the request proceeds normally

#### Scenario: APIClient handles 401 Unauthorized

**Given** a user is signed in with an expired token
**When** the app makes an API request
**And** the backend returns 401 Unauthorized
**Then** APIClient calls `AuthStateManager.shared.signOut()`
**And** the app navigates to AuthenticationView
**And** a user-friendly alert is shown: "Session expired, please sign in again"

### Requirement: Repositories Must Use Backend API Only

**Priority**: Critical
**Status**: Partially Implemented (Mixed with AIService)

All repository operations SHALL use the backend API exclusively, with no direct OpenAI API calls.

#### Scenario: HeroRepository creates hero via backend

**Given** a user wants to create a new hero
**When** `HeroRepository.createHero()` is called
**Then** it POSTs to `/api/heroes` with hero data
**And** no direct OpenAI API calls are made
**And** the avatar generation is requested via `POST /api/heroes/[id]/avatar`
**And** the backend handles all OpenAI interactions

#### Scenario: StoryRepository generates story via backend

**Given** a user wants to generate a story
**When** `StoryRepository.generateStory()` is called
**Then** it POSTs to `/api/stories` with story parameters
**And** no direct OpenAI API calls are made
**And** the backend generates story content, audio, and illustrations
**And** the iOS app receives URLs for media files (R2 storage)

#### Scenario: StoryRepository handles async operations

**Given** a story generation is in progress
**When** `StoryRepository.generateIllustrations()` is called
**Then** it POSTs to `/api/stories/[id]/illustrations`
**And** it polls `/api/stories/[id]/illustrations/status` for progress
**And** the UI shows progress updates
**And** on completion, illustration URLs are returned

### Requirement: ViewModels Must Use Repositories Exclusively

**Priority**: High
**Status**: Not Implemented (Still References AIService)

ViewModels SHALL NOT directly reference AIService or OpenAI code. All AI operations MUST go through repositories.

#### Scenario: StoryViewModel generates story without AIService

**Given** StoryViewModel is initialized
**When** the user generates a story
**Then** `storyRepository.generateStory()` is called
**And** no `AIService` methods are invoked
**And** no direct OpenAI SDK calls are made
**And** the story is generated successfully via backend

#### Scenario: StoryViewModel generates audio without AIService

**Given** a story exists without audio
**When** the user requests audio generation
**Then** `storyRepository.generateAudio()` is called
**And** no `AIService.generateAudio()` is invoked
**And** the audio URL is fetched from backend
**And** the audio is downloaded and cached via URLCache

### Requirement: Auth Flow Must Be Complete

**Priority**: Critical
**Status**: Partially Implemented (UI Exists, Not Wired)

The iOS app SHALL provide a complete sign-up and sign-in flow with proper error handling.

#### Scenario: User signs up successfully

**Given** a new user on the AuthenticationView
**When** the user enters email "newuser@example.com" and password "SecurePass123"
**And** taps "Sign Up"
**Then** APIClient POSTs to `/api/auth/sign-up`
**And** on success, AuthStateManager stores the session token in Keychain
**And** the app navigates to ImprovedContentView
**And** the user can immediately use the app

#### Scenario: User signs in successfully

**Given** an existing user on the AuthenticationView
**When** the user enters valid credentials and taps "Sign In"
**Then** APIClient POSTs to `/api/auth/sign-in`
**And** on success, the session token is stored
**And** the app navigates to the main interface
**And** all subsequent API calls include the auth token

#### Scenario: Sign-in fails with invalid credentials

**Given** a user on the AuthenticationView
**When** the user enters incorrect password and taps "Sign In"
**Then** the API returns 401 Unauthorized
**And** the app shows an alert: "Invalid email or password"
**And** the user remains on AuthenticationView
**And** the user can retry

#### Scenario: Sign-in fails due to network error

**Given** a user on AuthenticationView
**And** the device has no internet connection
**When** the user taps "Sign In"
**Then** APIClient throws a network error
**And** the app shows an alert: "Network error. Please check your connection."
**And** the user can retry when connection is restored

### Requirement: App Entry Must Check Auth State

**Priority**: High
**Status**: Implemented

The app SHALL show AuthenticationView for unauthenticated users and ImprovedContentView for authenticated users.

#### Scenario: First launch shows auth view

**Given** the app is launched for the first time
**And** no session token exists in Keychain
**When** InfiniteStoriesApp initializes
**Then** AuthStateManager.isAuthenticated is false
**And** AuthenticationView is displayed
**And** the user cannot access the main app

#### Scenario: Subsequent launch with valid session

**Given** the app was previously used
**And** a valid session token exists in Keychain
**When** InfiniteStoriesApp initializes
**Then** AuthStateManager.isAuthenticated is true
**And** ImprovedContentView is displayed
**And** the user can immediately use the app

#### Scenario: Session expiry requires re-authentication

**Given** the app is running with an active session
**When** the session token expires
**And** the next API call returns 401 Unauthorized
**Then** AuthStateManager.signOut() is called
**And** the app navigates back to AuthenticationView
**And** the user must sign in again

---

## MODIFIED Requirements

*None*

---

## REMOVED Requirements

### Requirement: Direct OpenAI API Calls

**Reason**: All AI operations now proxied through backend
**Date**: 2025-11-13

The iOS app no longer makes direct calls to OpenAI APIs. All AI operations (story generation, audio synthesis, image generation) are handled by the backend.

**Migration Notes**:
- AIService marked for deprecation
- OpenAI SDK to be removed from iOS dependencies
- API keys no longer stored in iOS Keychain
- All AI operations use repositories → backend API → OpenAI

### Requirement: OpenAI API Key Configuration

**Reason**: Backend handles API keys
**Date**: 2025-11-13

Users no longer provide or manage OpenAI API keys in the iOS app.

**Migration Notes**:
- Settings view no longer shows API key input
- Keychain storage for OpenAI API key removed
- Backend manages API keys centrally

---

## Dependencies

- Backend API must be deployed and accessible
- Better Auth endpoints functional
- HeroRepository, StoryRepository, CustomEventRepository implemented
- APIClient with retry logic implemented
- AuthStateManager for session token storage

## Related Capabilities

- `backend-auth`: iOS app depends on auth endpoints
- `deprecation`: AIService removal required
- `testing`: Integration tests for repository + backend

## Non-Functional Requirements

### Performance
- API calls must complete within 5 seconds (P95)
- Retry logic must handle transient failures
- URLCache must reduce redundant media downloads

### User Experience
- Loading states must show during API calls
- Error messages must be user-friendly and actionable
- Network offline must be clearly indicated
- Retry buttons must be available for failed operations

### Security
- Session tokens must be stored in iOS Keychain (not UserDefaults)
- Tokens must be transmitted over HTTPS only
- No sensitive data in logs or analytics

## Open Questions

- ✅ Should we cache API responses locally? → No, API-only architecture per CLAUDE.md
- ✅ What's the offline experience? → Show network error, block operations
- ✅ How to handle token refresh? → Automatic refresh before expiry

## Acceptance Criteria

- [ ] All API requests include Authorization header when authenticated
- [ ] 401 responses trigger automatic sign-out
- [ ] Sign-up flow creates account and signs user in
- [ ] Sign-in flow stores token and navigates to main app
- [ ] All repositories use backend API exclusively
- [ ] No AIService references in ViewModels
- [ ] No direct OpenAI API calls
- [ ] Network errors show user-friendly messages
- [ ] App shows auth view for unauthenticated users
- [ ] App shows main interface for authenticated users
