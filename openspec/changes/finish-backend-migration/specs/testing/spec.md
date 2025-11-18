# Testing & Validation Capability

**Capability**: Testing & Validation
**Status**: Not Started
**Owner**: QA + Engineering Teams

## Overview

This capability ensures comprehensive testing coverage for the backend migration, including unit tests, integration tests, and end-to-end tests. All critical paths must be tested to prevent regressions and ensure reliability.

---

## ADDED Requirements

### Requirement: Unit Test Coverage Must Exceed 80%

**Priority**: High
**Status**: Not Started

All new and modified code SHALL have unit tests with >80% code coverage.

#### Scenario: AuthStateManager has comprehensive tests

**Given** AuthStateManager handles authentication state
**When** unit tests are written
**Then** the following scenarios are covered:
- `signIn()` stores token and userId in Keychain
- `signOut()` clears token and userId from Keychain
- `getAuthorizationHeader()` returns correct Bearer format
- `checkAuthenticationStatus()` loads token from Keychain on init
- Token persistence across app restarts
**And** code coverage for AuthStateManager is >90%

#### Scenario: Repositories have comprehensive tests

**Given** HeroRepository and StoryRepository exist
**When** unit tests are written
**Then** the following scenarios are covered:
- Successful API calls return expected data
- Network errors are handled gracefully
- 401 errors trigger sign-out
- Retry logic works for transient failures
- Loading states are managed correctly
**And** code coverage for repositories is >80%

#### Scenario: APIClient has comprehensive tests

**Given** APIClient handles all HTTP communication
**When** unit tests are written
**Then** the following scenarios are covered:
- Auth headers injected when authenticated
- 401 responses trigger sign-out callback
- Retry logic with exponential backoff
- Request/response serialization
- Error handling for all HTTP status codes
**And** code coverage for APIClient is >85%

### Requirement: Integration Tests Must Cover Critical Paths

**Priority**: Critical
**Status**: Not Started

End-to-end integration tests SHALL verify that the iOS app and backend work together correctly.

#### Scenario: Sign-up flow works end-to-end

**Given** a test backend is running
**When** the integration test runs sign-up flow
**Then** it creates a test user via APIClient
**And** the backend creates the user in the database
**And** a session token is returned
**And** the token is stored in Keychain
**And** the test verifies the user can make authenticated requests

#### Scenario: Hero creation works end-to-end

**Given** a test user is authenticated
**When** the integration test creates a hero
**Then** it calls `HeroRepository.createHero()`
**And** the repository POSTs to `/api/heroes`
**And** the backend creates the hero in the database
**And** the hero is returned with an ID
**And** the test verifies the hero exists in the database

#### Scenario: Story generation works end-to-end

**Given** a test user with a test hero
**When** the integration test generates a story
**Then** it calls `StoryRepository.generateStory()`
**And** the backend calls OpenAI to generate story content
**And** the backend calls OpenAI to generate audio
**And** the backend uploads audio to R2
**And** the story and audio URL are returned
**And** the test verifies the story exists and audio is accessible

#### Scenario: Avatar generation works end-to-end

**Given** a test user with a test hero
**When** the integration test generates an avatar
**Then** it calls `HeroRepository.generateAvatar()`
**And** the backend calls OpenAI DALL-E
**And** the backend uploads image to R2
**And** the avatar URL is returned
**And** the test verifies the image is accessible

### Requirement: Error Handling Must Be Tested

**Priority**: High
**Status**: Not Started

All error scenarios SHALL be tested to ensure graceful degradation and user-friendly messages.

#### Scenario: Network offline is handled gracefully

**Given** the device has no network connection
**When** the user attempts any API operation
**Then** the APIClient throws a network error
**And** the UI shows: "Network error. Please check your connection."
**And** a retry button is available
**And** no crash occurs

#### Scenario: Invalid credentials show appropriate error

**Given** a user attempts to sign in
**When** the password is incorrect
**Then** the backend returns 401 Unauthorized
**And** the UI shows: "Invalid email or password"
**And** the user can retry
**And** no crash occurs

#### Scenario: Expired token triggers re-authentication

**Given** a user with an expired session token
**When** any API call is made
**Then** the backend returns 401 Unauthorized
**And** APIClient calls `AuthStateManager.signOut()`
**And** the UI navigates to AuthenticationView
**And** the user sees: "Session expired, please sign in again"
**And** no crash occurs

#### Scenario: Backend error shows user-friendly message

**Given** the backend encounters an error
**When** an API call is made
**Then** the backend returns 500 Internal Server Error
**And** the UI shows: "Server error. Please try again later."
**And** the error is logged for debugging
**And** no crash occurs

### Requirement: UI Tests Must Cover Key User Flows

**Priority**: Medium
**Status**: Not Started

Automated UI tests SHALL verify that key user flows work correctly from the UI perspective.

#### Scenario: UI test for sign-up flow

**Given** the app is launched
**When** the UI test taps "Sign Up"
**And** enters email "uitest@example.com" and password "TestPass123"
**And** taps "Create Account"
**Then** the app navigates to ImprovedContentView
**And** the user is signed in
**And** the hero list is visible

#### Scenario: UI test for hero creation

**Given** a user is signed in
**When** the UI test taps the floating action button
**And** navigates through hero creation wizard
**And** enters hero name "Test Hero"
**And** selects traits and completes the flow
**Then** the hero is created
**And** appears in the hero list

#### Scenario: UI test for story generation

**Given** a user has a hero
**When** the UI test selects the hero
**And** taps "Generate Story"
**And** selects an event
**Then** the story generation begins
**And** the loading indicator appears
**And** the story is generated and displayed

### Requirement: Performance Testing Must Validate Latency

**Priority**: Medium
**Status**: Not Started

API calls SHALL meet performance targets under normal and degraded network conditions.

#### Scenario: API calls complete within acceptable time

**Given** a user makes an API request
**When** performance is measured
**Then** P50 latency is <1 second
**And** P95 latency is <5 seconds
**And** P99 latency is <10 seconds
**And** no timeout errors under normal network

#### Scenario: Retry logic handles slow network

**Given** network latency is 2 seconds per request
**When** an API call is made
**Then** the retry logic waits appropriately
**And** the request completes successfully
**And** the user sees a loading indicator
**And** no timeout occurs

---

## MODIFIED Requirements

*None*

---

## REMOVED Requirements

*None*

---

## Dependencies

- Backend API deployed to test environment
- Test database with sample data
- iOS app compiled in test mode
- XCTest framework configured

## Related Capabilities

- `backend-auth`: Auth endpoints must be tested
- `ios-integration`: Repositories and APIClient must be tested
- `deprecation`: No legacy code should be tested

## Test Environment Requirements

### Test Backend
- Separate test instance of backend API
- Test database (PostgreSQL) with clean slate per test run
- Test R2 bucket for media files
- Mock OpenAI API or use test API key with low rate limits

### Test iOS App
- Test configuration with test backend URL
- Test Keychain storage (cleared between tests)
- Test URLCache (cleared between tests)
- UI testing enabled in scheme

### CI/CD Integration
- Tests run on every pull request
- Tests run on merge to main branch
- Test results published and tracked
- Failed tests block deployment

## Test Data Management

### Test Users
- Create test users with known credentials
- Clean up test users after each test run
- Isolate test data from production

### Test Heroes/Stories
- Generate test heroes with predictable data
- Clean up test data after each test run
- Use deterministic test data (no randomness)

## Code Coverage Targets

| Component | Target | Current |
|-----------|--------|---------|
| AuthStateManager | 90% | 0% |
| APIClient | 85% | 0% |
| HeroRepository | 80% | 0% |
| StoryRepository | 80% | 0% |
| CustomEventRepository | 75% | 0% |
| ViewModels | 70% | 0% |
| Overall | 80% | ~20% |

## Test Execution Strategy

### Unit Tests
- Run locally before commit
- Run in CI on every PR
- Fast execution (<5 minutes total)
- No external dependencies (mocked)

### Integration Tests
- Run in CI on every PR
- Require test backend running
- Moderate execution time (<15 minutes)
- Use real backend, mock OpenAI

### UI Tests
- Run in CI on main branch only
- Require test backend + test device
- Slow execution (<30 minutes)
- Use real backend + real iOS simulator

### Manual Testing
- Run before each release
- Test on physical devices (iPhone, iPad)
- Test different iOS versions
- Test edge cases not covered by automation

## Open Questions

- ✅ Should we mock OpenAI API in tests? → Yes, for speed and cost
- ✅ How to handle test data cleanup? → Automated cleanup after each test run
- ✅ What's the CI/CD pipeline? → GitHub Actions with test reporting

## Acceptance Criteria

- [ ] Unit test coverage >80% for all new code
- [ ] Integration tests cover sign-up, sign-in, hero CRUD, story generation
- [ ] UI tests cover key user flows (sign-up, hero creation, story generation)
- [ ] All error scenarios tested (network, auth, API errors)
- [ ] Performance tests validate latency targets
- [ ] Tests run in CI/CD pipeline
- [ ] Failed tests block merges to main
- [ ] Code coverage report published
- [ ] No flaky tests (>95% pass rate)
- [ ] Test documentation complete
