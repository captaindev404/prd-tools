# Capability: API Versioning

## Overview
All API routes are versioned with a `/v1/` prefix in the URL path to support future API evolution and backward compatibility.

---

## ADDED Requirements

### Requirement: Versioned API Route Structure
All API endpoints MUST include a version prefix in the URL path.

#### Scenario: Authentication endpoints use v1 prefix
- **Given** a client makes a request to authenticate
- **When** the request is sent to `/api/v1/auth/sign-in`
- **Then** the server processes the authentication request
- **And** returns the appropriate auth response

#### Scenario: Resource endpoints use v1 prefix
- **Given** a client requests hero data
- **When** the request is sent to `/api/v1/heroes`
- **Then** the server returns the list of heroes
- **And** the response format is unchanged from pre-versioning

#### Scenario: Nested resource endpoints use v1 prefix
- **Given** a client requests story audio generation
- **When** the request is sent to `/api/v1/stories/{storyId}/audio`
- **Then** the server generates audio for the story
- **And** returns the audio URL in the response

---

### Requirement: iOS Client Version Prefix
The iOS client MUST include the version prefix in all API requests.

#### Scenario: Endpoint enum returns versioned paths
- **Given** the iOS app uses the Endpoint enum for API paths
- **When** any endpoint case returns its path
- **Then** the path includes `/api/v1/` prefix

#### Scenario: Hardcoded URLs include version prefix
- **Given** a service makes a direct API call with a hardcoded URL
- **When** the URL is constructed
- **Then** it includes the `/api/v1/` prefix

---

## MODIFIED Requirements

### Requirement: Health Check Endpoint Location
The health check endpoint MUST be available at the versioned path.

#### Scenario: Health check responds on v1 path
- **Given** a monitoring system checks API health
- **When** a GET request is sent to `/api/v1/health`
- **Then** the server returns a 200 OK response
- **And** the response body indicates healthy status

#### Scenario: Ping endpoint responds on v1 path
- **Given** a client checks API availability
- **When** a GET request is sent to `/api/v1/ping`
- **Then** the server returns a 200 OK response

---

## Cross-References
- `backend-auth` - Authentication endpoints affected
- `ios-integration` - Client integration patterns
- `image-generation` - Image generation endpoints affected
- `audio-generation` - Audio generation endpoints affected
- `text-generation` - Story generation endpoints affected
