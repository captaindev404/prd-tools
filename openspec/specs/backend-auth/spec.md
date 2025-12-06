# Spec: Backend Authentication

## Purpose

Define the authentication and session management system for the InfiniteStories backend API using Better Auth, including user registration, login, session validation, and token refresh.
## Requirements
### Requirement: Auth Endpoints Must Be Functional

The backend SHALL provide fully functional authentication endpoints for user registration, login, session management, and logout.

#### Scenario: User signs up successfully

**Given** a new user with email "test@example.com" and password "SecurePass123"
**When** the user POSTs to `/api/auth/sign-up` with valid credentials
**Then** a new user is created in the database
**And** a session token is generated and returned
**And** the response includes `{ user: {...}, session: {...} }` with status 201

#### Scenario: User signs in with valid credentials

**Given** an existing user in the database
**When** the user POSTs to `/api/auth/sign-in` with correct email and password
**Then** a session token is generated and returned
**And** the response includes `{ user: {...}, session: {...} }` with status 200
**And** the token is valid for 30 days

#### Scenario: User signs in with invalid credentials

**Given** a user attempts to sign in
**When** the password is incorrect
**Then** the API returns 401 Unauthorized
**And** the error message is "Invalid credentials"
**And** no session token is generated

#### Scenario: User session is validated

**Given** an authenticated user with a valid session token
**When** the user makes a request to a protected endpoint with `Authorization: Bearer <token>`
**Then** the middleware validates the token
**And** the request is allowed to proceed
**And** the user context is available in the route handler

### Requirement: Middleware Must Protect API Routes

All API routes except public ones SHALL require valid authentication via middleware.

#### Scenario: Protected endpoint requires auth

**Given** a user without a session token
**When** the user makes a GET request to `/api/heroes`
**Then** the middleware returns 401 Unauthorized
**And** the error message is "Authentication required"
**And** the request does not reach the route handler

#### Scenario: Protected endpoint accepts valid token

**Given** a user with a valid session token
**When** the user makes a GET request to `/api/heroes` with `Authorization: Bearer <token>`
**Then** the middleware validates the token
**And** the request proceeds to the route handler
**And** the user context contains the authenticated user ID

#### Scenario: Public endpoint allows unauthenticated access

**Given** any user (authenticated or not)
**When** the user makes a GET request to `/api/health`
**Then** the request is allowed without authentication
**And** the response is returned successfully

#### Scenario: Expired token is rejected

**Given** a user with an expired session token
**When** the user makes a request to `/api/heroes` with the expired token
**Then** the middleware returns 401 Unauthorized
**And** the error message is "Invalid or expired session"

### Requirement: Session Management Must Be Secure

Session tokens SHALL be securely generated, stored, and validated with proper expiration.

#### Scenario: Session token has appropriate expiration

**Given** a user signs in successfully
**When** the session token is generated
**Then** the token expires in 30 days
**And** the token includes a refresh policy to update every 24 hours
**And** the token is stored in the database with expiration timestamp

#### Scenario: Session token is invalidated on sign-out

**Given** a user is signed in with an active session
**When** the user POSTs to `/api/auth/sign-out`
**Then** the session is deleted from the database
**And** the token is no longer valid
**And** subsequent requests with that token return 401 Unauthorized

