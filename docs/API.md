# API Documentation

**Odyssey Feedback Platform API Reference**
Version: 0.5.0

This document provides comprehensive API documentation for all endpoints in the Odyssey Feedback platform.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Feedback API](#feedback-api)
3. [Voting API](#voting-api)
4. [Features API](#features-api)
5. [Roadmap API](#roadmap-api)
6. [Research Panels API](#research-panels-api)
7. [Questionnaires API](#questionnaires-api)
8. [Sessions API](#sessions-api)
9. [Notifications API](#notifications-api)
10. [Admin API](#admin-api)
11. [User Profile API](#user-profile-api)
12. [Moderation API](#moderation-api)
13. [Metrics API](#metrics-api)
14. [Error Codes](#error-codes)

---

## Authentication

All API endpoints (except public reads) require authentication using NextAuth.js session-based authentication.

### How Authentication Works

1. User signs in via `/api/auth/signin`
2. Session cookie is set automatically
3. All subsequent requests include session cookie
4. Use `getCurrentUser()` helper to get authenticated user

### Auth Endpoints

#### POST `/api/auth/signin`
Sign in with Azure AD or Keycloak

**Providers:**
- `azure-ad` - Azure Active Directory (for Club Med employees)
- `keycloak` - Keycloak SSO

**Example:**
```typescript
// Redirect to sign-in page
window.location.href = '/api/auth/signin';
```

#### POST `/api/auth/signout`
Sign out current user

**Example:**
```typescript
// Redirect to sign-out
window.location.href = '/api/auth/signout';
```

---

## Feedback API

### POST `/api/feedback`
Create new feedback

**Authorization:** Authenticated users with USER, PM, or PO role

**Request Body:**
```json
{
  "title": "Add passport scan at kiosk",
  "body": "Would reduce queue time at check-in. Current process takes too long.",
  "featureId": "feat-checkin-mobile",
  "villageId": "vlg-001",
  "source": "app",
  "visibility": "public"
}
```

**Request Schema:**
- `title` (required): string, 8-120 characters
- `body` (required): string, 20-5000 characters
- `featureId` (optional): string, must be valid feature ID
- `villageId` (optional): string, defaults to user's current village
- `source` (optional): enum `app|web|kiosk|support|import`, defaults to `app`
- `visibility` (optional): enum `public|internal`, defaults to `public`

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "fb_01J0ABC123",
    "authorId": "usr_01HZX...",
    "title": "Add passport scan at kiosk",
    "body": "Would reduce queue time at check-in...",
    "featureId": "feat-checkin-mobile",
    "villageId": "vlg-001",
    "visibility": "public",
    "source": "app",
    "state": "new",
    "moderationStatus": "approved",
    "toxicityScore": 0.1,
    "spamScore": 0.05,
    "needsReview": false,
    "editWindowEndsAt": "2025-10-02T12:15:00Z",
    "createdAt": "2025-10-02T12:00:00Z",
    "author": {
      "id": "usr_01HZX...",
      "displayName": "Alex R.",
      "email": "alex@clubmed.com",
      "role": "USER"
    },
    "feature": {
      "id": "feat-checkin-mobile",
      "title": "Mobile Check-in",
      "area": "Check-in"
    }
  },
  "message": "Feedback submitted successfully"
}
```

**Features:**
- Automatic PII redaction (emails, phone numbers, etc.)
- Rate limiting: 10 submissions per user per day
- 15-minute edit window
- Auto-moderation with toxicity/spam detection
- Fuzzy duplicate detection at 86% threshold

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `400 Validation failed` - Invalid input
- `429 Rate limit exceeded` - Too many submissions
- `500 Internal server error`

---

### GET `/api/feedback`
List feedback with pagination and filters

**Authorization:** Public (no auth required for public feedback)

**Query Parameters:**
- `state` (optional): FeedbackState - `new|triaged|merged|in_roadmap|closed`
- `area` (optional): ProductArea - `Reservations|Check-in|Payments|Housekeeping|Backoffice`
- `villageId` (optional): string - filter by village
- `featureId` (optional): string - filter by feature
- `authorId` (optional): string - filter by author
- `search` (optional): string - search in title and body
- `page` (optional): number - page number (default: 1)
- `limit` (optional): number - items per page (default: 20, max: 100)
- `sortBy` (optional): enum `createdAt|updatedAt|votes` (default: `createdAt`)
- `sortOrder` (optional): enum `asc|desc` (default: `desc`)

**Example Request:**
```
GET /api/feedback?area=Check-in&state=new&sortBy=votes&limit=10
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "fb_01J0ABC123",
      "title": "Add passport scan at kiosk",
      "body": "Would reduce queue time...",
      "state": "new",
      "voteCount": 42,
      "totalWeight": 68.5,
      "userHasVoted": true,
      "author": {
        "id": "usr_01HZX...",
        "displayName": "Alex R.",
        "email": "alex@clubmed.com"
      },
      "feature": {
        "id": "feat-checkin-mobile",
        "title": "Mobile Check-in",
        "area": "Check-in"
      },
      "createdAt": "2025-10-02T12:00:00Z",
      "updatedAt": "2025-10-02T12:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 10,
  "hasMore": true
}
```

---

### GET `/api/feedback/[id]`
Get feedback details by ID

**Authorization:** Public (no auth required for public feedback)

**Response:** `200 OK`
```json
{
  "id": "fb_01J0ABC123",
  "title": "Add passport scan at kiosk",
  "body": "Would reduce queue time at check-in...",
  "state": "new",
  "visibility": "public",
  "source": "app",
  "moderationStatus": "approved",
  "voteCount": 42,
  "totalWeight": 68.5,
  "userHasVoted": true,
  "canEdit": false,
  "editWindowEndsAt": "2025-10-02T12:15:00Z",
  "author": {
    "id": "usr_01HZX...",
    "displayName": "Alex R.",
    "email": "alex@clubmed.com",
    "role": "USER"
  },
  "feature": {
    "id": "feat-checkin-mobile",
    "title": "Mobile Check-in",
    "area": "Check-in",
    "status": "discovery"
  },
  "village": {
    "id": "vlg-001",
    "name": "La Rosière"
  },
  "duplicateOf": null,
  "createdAt": "2025-10-02T12:00:00Z",
  "updatedAt": "2025-10-02T12:00:00Z"
}
```

**Error Responses:**
- `404 Not found` - Feedback not found

---

### PATCH `/api/feedback/[id]`
Update feedback (within 15-minute edit window)

**Authorization:** Author only, within edit window

**Request Body:**
```json
{
  "title": "Updated title",
  "body": "Updated body text..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "fb_01J0ABC123",
    "title": "Updated title",
    "body": "Updated body text...",
    "updatedAt": "2025-10-02T12:05:00Z"
  },
  "message": "Feedback updated successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not the author or edit window expired
- `400 Validation failed` - Invalid input

---

### DELETE `/api/feedback/[id]`
Delete feedback (author only, within edit window)

**Authorization:** Author only, within edit window, or ADMIN

**Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not the author or edit window expired
- `404 Not found` - Feedback not found

---

### GET `/api/feedback/[id]/duplicates`
Find potential duplicate feedback

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "duplicates": [
    {
      "id": "fb_01J0XYZ789",
      "title": "Add passport scanning to kiosks",
      "similarity": 0.89,
      "voteCount": 15,
      "state": "triaged",
      "createdAt": "2025-09-28T10:00:00Z"
    }
  ],
  "threshold": 0.86
}
```

---

### POST `/api/feedback/[id]/merge`
Merge duplicate feedback into canonical item

**Authorization:** PM, PO, or MODERATOR role

**Request Body:**
```json
{
  "targetId": "fb_01J0XYZ789",
  "reason": "Duplicate: same feature request"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "mergedId": "fb_01J0ABC123",
    "targetId": "fb_01J0XYZ789",
    "votesTransferred": 42,
    "newTotalVotes": 57
  },
  "message": "Feedback merged successfully"
}
```

**Features:**
- Consolidates votes into target feedback
- Updates state to "merged"
- Sets `duplicateOf` pointer
- Logs merge event

---

### POST `/api/feedback/[id]/link-feature`
Link feedback to a feature

**Authorization:** PM or PO role

**Request Body:**
```json
{
  "featureId": "feat-checkin-mobile"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Feature linked successfully"
}
```

---

## Voting API

### POST `/api/feedback/[id]/vote`
Cast a vote on feedback

**Authorization:** Authenticated users

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "vote": {
      "id": "01J0ABC123",
      "feedbackId": "fb_01J0ABC123",
      "userId": "usr_01HZX...",
      "weight": 2.5,
      "decayedWeight": 2.5,
      "createdAt": "2025-10-02T12:00:00Z",
      "user": {
        "id": "usr_01HZX...",
        "displayName": "Alex R.",
        "role": "PM"
      }
    },
    "stats": {
      "count": 43,
      "totalWeight": 71.0,
      "totalDecayedWeight": 68.5
    }
  },
  "message": "Vote cast successfully"
}
```

**Vote Weight Calculation:**
- Base weight factors:
  - Role weight: USER=1.0, PM=2.0, PO=2.5, RESEARCHER=1.5
  - Panel membership boost: +0.5 if user is in relevant panel
  - Village priority: varies by village settings
- Decay: 180-day half-life for recency bias

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `404 Not found` - Feedback not found
- `409 Conflict` - Already voted on this feedback

---

### DELETE `/api/feedback/[id]/vote`
Remove vote from feedback

**Authorization:** Authenticated users (own vote only)

**Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized` - Not logged in
- `404 Not found` - Vote not found or feedback not found

---

### GET `/api/feedback/[id]/vote`
Get current user's vote status

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "hasVoted": true,
  "vote": {
    "id": "01J0ABC123",
    "weight": 2.5,
    "decayedWeight": 2.48,
    "currentDecayedWeight": 2.45,
    "createdAt": "2025-09-15T10:00:00Z"
  }
}
```

---

## Features API

### POST `/api/features`
Create new feature in catalog

**Authorization:** PM, PO, or ADMIN role

**Request Body:**
```json
{
  "title": "Mobile Check-in",
  "description": "Allow guests to check in via mobile app",
  "area": "Check-in",
  "tags": ["rx", "guest-experience"],
  "status": "discovery"
}
```

**Request Schema:**
- `title` (required): string, 3-200 characters
- `description` (optional): string
- `area` (required): enum `Reservations|Check-in|Payments|Housekeeping|Backoffice`
- `tags` (optional): string array
- `status` (optional): enum `idea|discovery|shaping|in_progress|released|GA|deprecated` (default: `idea`)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "feat-checkin-mobile-01J0ABC",
    "title": "Mobile Check-in",
    "description": "Allow guests to check in via mobile app",
    "area": "Check-in",
    "tags": ["rx", "guest-experience"],
    "status": "discovery",
    "createdAt": "2025-10-02T12:00:00Z"
  },
  "message": "Feature created successfully"
}
```

---

### GET `/api/features`
List all features

**Authorization:** Public (no auth required)

**Query Parameters:**
- `area` (optional): ProductArea - filter by area
- `status` (optional): FeatureStatus - filter by status
- `search` (optional): string - search in title and description

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "feat-checkin-mobile",
      "title": "Mobile Check-in",
      "area": "Check-in",
      "status": "discovery",
      "tags": ["rx", "guest-experience"],
      "feedbackCount": 23,
      "createdAt": "2025-10-02T12:00:00Z"
    }
  ],
  "total": 15
}
```

---

### GET `/api/features/[id]`
Get feature details

**Authorization:** Public (no auth required)

**Response:** `200 OK`
```json
{
  "id": "feat-checkin-mobile",
  "title": "Mobile Check-in",
  "description": "Allow guests to check in via mobile app",
  "area": "Check-in",
  "status": "discovery",
  "tags": ["rx", "guest-experience"],
  "feedbackCount": 23,
  "roadmapCount": 2,
  "createdAt": "2025-10-02T12:00:00Z",
  "updatedAt": "2025-10-02T14:00:00Z"
}
```

---

### PATCH `/api/features/[id]`
Update feature

**Authorization:** PM, PO, or ADMIN role

**Request Body:**
```json
{
  "status": "in_progress",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "feat-checkin-mobile",
    "status": "in_progress",
    "updatedAt": "2025-10-02T15:00:00Z"
  },
  "message": "Feature updated successfully"
}
```

---

## Roadmap API

### POST `/api/roadmap`
Create new roadmap item

**Authorization:** PM, PO, or ADMIN role

**Request Body:**
```json
{
  "title": "Faster Arrival Flow",
  "description": "Reduce check-in time to under 2 minutes",
  "stage": "next",
  "targetDate": "2025-12-01T00:00:00Z",
  "progress": 0,
  "visibility": "public",
  "featureIds": ["feat-checkin-mobile"],
  "feedbackIds": ["fb_01J0ABC123"],
  "jiraTickets": ["ODYS-2142"],
  "figmaLinks": ["https://figma.com/file/..."],
  "successCriteria": ["reduce_checkin_time_lt_2min", "nps_area>=+30"],
  "guardrails": ["error_rate<0.5%", "perf_p95<800ms"],
  "commsCadence": "monthly",
  "commsChannels": ["in-app", "email"],
  "commsAudience": {
    "villages": ["all"],
    "roles": ["USER"],
    "languages": ["fr", "en"]
  }
}
```

**Request Schema:**
- `title` (required): string, 3-200 characters
- `description` (optional): string
- `stage` (required): enum `now|next|later|under_consideration`
- `targetDate` (optional): ISO date string
- `progress` (optional): number 0-100 (default: 0)
- `visibility` (optional): enum `public|internal` (default: `public`)
- `featureIds` (optional): string array
- `feedbackIds` (optional): string array
- `jiraTickets` (optional): string array
- `figmaLinks` (optional): string array (validated URLs)
- `successCriteria` (optional): string array
- `guardrails` (optional): string array
- `commsCadence` (optional): enum `monthly|ad_hoc`
- `commsChannels` (optional): enum array `in-app|email|inbox`
- `commsAudience` (optional): object with `villages`, `roles`, `languages` arrays

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "rmp_01J0ABC123",
    "title": "Faster Arrival Flow",
    "stage": "next",
    "targetDate": "2025-12-01T00:00:00Z",
    "progress": 0,
    "visibility": "public",
    "createdBy": {
      "id": "usr_01HZX...",
      "displayName": "Product Manager",
      "role": "PM"
    },
    "createdAt": "2025-10-02T12:00:00Z"
  },
  "message": "Roadmap item created successfully"
}
```

---

### GET `/api/roadmap`
List roadmap items

**Authorization:** Public for public items, authenticated for internal items

**Query Parameters:**
- `stage` (optional): RoadmapStage - filter by stage
- `visibility` (optional): `public|internal` - filter by visibility
- `search` (optional): string - search in title and description
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 20, max: 100)
- `sortBy` (optional): enum `targetDate|createdAt` (default: `targetDate`)
- `sortOrder` (optional): enum `asc|desc` (default: `asc` for targetDate)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "rmp_01J0ABC123",
      "title": "Faster Arrival Flow",
      "stage": "next",
      "targetDate": "2025-12-01T00:00:00Z",
      "progress": 25,
      "visibility": "public",
      "createdBy": {
        "id": "usr_01HZX...",
        "displayName": "Product Manager",
        "avatarUrl": "https://..."
      },
      "featureCount": 1,
      "feedbackCount": 3,
      "createdAt": "2025-10-02T12:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20,
  "hasMore": false
}
```

---

### GET `/api/roadmap/[id]`
Get roadmap item details

**Authorization:** Public for public items, PM/PO/ADMIN for internal items

**Response:** `200 OK`
```json
{
  "id": "rmp_01J0ABC123",
  "title": "Faster Arrival Flow",
  "description": "Reduce check-in time to under 2 minutes",
  "stage": "next",
  "targetDate": "2025-12-01T00:00:00Z",
  "progress": 25,
  "visibility": "public",
  "createdBy": {
    "id": "usr_01HZX...",
    "displayName": "Product Manager",
    "role": "PM"
  },
  "features": [
    {
      "id": "feat-checkin-mobile",
      "title": "Mobile Check-in",
      "area": "Check-in",
      "status": "in_progress"
    }
  ],
  "feedbacks": [
    {
      "id": "fb_01J0ABC123",
      "title": "Add passport scan at kiosk",
      "state": "in_roadmap"
    }
  ],
  "jiraTickets": ["ODYS-2142"],
  "figmaLinks": ["https://figma.com/file/..."],
  "successCriteria": ["reduce_checkin_time_lt_2min"],
  "guardrails": ["error_rate<0.5%"],
  "commsCadence": "monthly",
  "commsChannels": ["in-app", "email"],
  "createdAt": "2025-10-02T12:00:00Z",
  "updatedAt": "2025-10-02T14:00:00Z"
}
```

---

### PATCH `/api/roadmap/[id]`
Update roadmap item

**Authorization:** PM, PO, or ADMIN role

**Request Body:**
```json
{
  "progress": 50,
  "stage": "now",
  "targetDate": "2025-11-15T00:00:00Z"
}
```

**Response:** `200 OK`

---

### POST `/api/roadmap/[id]/publish`
Publish roadmap communications

**Authorization:** PM or PO role

**Request Body:**
```json
{
  "message": "We're making great progress on the Faster Arrival Flow!",
  "channels": ["in-app", "email"],
  "audience": {
    "villages": ["all"],
    "roles": ["USER"],
    "languages": ["fr", "en"]
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "notificationsSent": 245,
    "emailsSent": 180,
    "channels": ["in-app", "email"]
  },
  "message": "Roadmap communication published successfully"
}
```

---

## Research Panels API

### POST `/api/panels`
Create research panel

**Authorization:** RESEARCHER, PM, or ADMIN role

**Request Body:**
```json
{
  "name": "Reception Core Panel",
  "description": "Panel for reception staff feedback",
  "sizeTarget": 150,
  "eligibilityRules": {
    "includeRoles": ["USER"],
    "includeVillages": ["all"],
    "attributesPredicates": [
      {
        "key": "department",
        "op": "in",
        "value": ["FOH", "Reception"]
      }
    ],
    "requiredConsents": ["research_contact"]
  },
  "quotas": [
    {
      "key": "village_id",
      "distribution": "proportional"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "pan_01J0ABC123",
    "name": "Reception Core Panel",
    "sizeTarget": 150,
    "currentSize": 0,
    "status": "recruiting",
    "createdAt": "2025-10-02T12:00:00Z"
  },
  "message": "Panel created successfully"
}
```

---

### GET `/api/panels`
List research panels

**Authorization:** RESEARCHER, PM, or ADMIN role

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "pan_01J0ABC123",
      "name": "Reception Core Panel",
      "sizeTarget": 150,
      "currentSize": 42,
      "status": "recruiting",
      "createdAt": "2025-10-02T12:00:00Z"
    }
  ],
  "total": 5
}
```

---

### GET `/api/panels/[id]`
Get panel details

**Authorization:** RESEARCHER, PM, or ADMIN role

**Response:** `200 OK`
```json
{
  "id": "pan_01J0ABC123",
  "name": "Reception Core Panel",
  "description": "Panel for reception staff feedback",
  "sizeTarget": 150,
  "currentSize": 42,
  "status": "recruiting",
  "eligibilityRules": {
    "includeRoles": ["USER"],
    "requiredConsents": ["research_contact"]
  },
  "memberCount": 42,
  "createdAt": "2025-10-02T12:00:00Z"
}
```

---

### POST `/api/panels/[id]/members`
Invite users to panel

**Authorization:** RESEARCHER or PM role

**Request Body:**
```json
{
  "userIds": ["usr_01HZX...", "usr_02ABC..."],
  "inviteMessage": "Join our research panel!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "invitesSent": 2,
    "notificationsSent": 2
  },
  "message": "Panel invitations sent successfully"
}
```

---

### GET `/api/panels/[id]/members`
List panel members

**Authorization:** RESEARCHER, PM, or ADMIN role

**Response:** `200 OK`
```json
{
  "members": [
    {
      "userId": "usr_01HZX...",
      "displayName": "Alex R.",
      "email": "alex@clubmed.com",
      "status": "accepted",
      "joinedAt": "2025-10-01T10:00:00Z"
    }
  ],
  "total": 42
}
```

---

### DELETE `/api/panels/[id]/members/[userId]`
Remove user from panel

**Authorization:** RESEARCHER, PM, or ADMIN role

**Response:** `204 No Content`

---

## Questionnaires API

### POST `/api/questionnaires`
Create questionnaire

**Authorization:** RESEARCHER or PM role

**Request Body:**
```json
{
  "title": "Check-in Satisfaction",
  "version": "1.0.0",
  "questions": [
    {
      "id": "nps",
      "type": "nps",
      "text": {
        "en": "How likely are you to recommend our check-in?",
        "fr": "Recommanderiez-vous notre check-in ?"
      },
      "required": true
    },
    {
      "id": "feedback",
      "type": "text",
      "text": {
        "en": "Any additional comments?",
        "fr": "Commentaires additionnels ?"
      },
      "required": false
    }
  ],
  "targeting": {
    "panels": ["pan_01J0ABC123"],
    "adHocFilters": {
      "villages": ["all"],
      "featuresInteracted": ["feat-checkin-mobile"]
    }
  },
  "delivery": {
    "mode": ["in-app", "email"],
    "startAt": "2025-10-10T09:00:00Z",
    "endAt": "2025-11-10T17:00:00Z",
    "maxResponses": 1000
  }
}
```

**Question Types:**
- `nps` - Net Promoter Score (0-10)
- `likert` - Likert scale (1-5 or custom)
- `mcq` - Multiple choice (single answer)
- `checkbox` - Multiple choice (multiple answers)
- `text` - Free text
- `number` - Numeric input

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "qnn_01J0ABC123",
    "title": "Check-in Satisfaction",
    "version": "1.0.0",
    "status": "draft",
    "questionCount": 2,
    "createdAt": "2025-10-02T12:00:00Z"
  },
  "message": "Questionnaire created successfully"
}
```

---

### GET `/api/questionnaires`
List questionnaires

**Authorization:** RESEARCHER, PM, or ADMIN role

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "qnn_01J0ABC123",
      "title": "Check-in Satisfaction",
      "version": "1.0.0",
      "status": "published",
      "responseCount": 245,
      "targetResponses": 1000,
      "createdAt": "2025-10-02T12:00:00Z"
    }
  ],
  "total": 8
}
```

---

### GET `/api/questionnaires/[id]`
Get questionnaire details

**Authorization:** RESEARCHER, PM, or ADMIN role (or public if published)

**Response:** `200 OK`
```json
{
  "id": "qnn_01J0ABC123",
  "title": "Check-in Satisfaction",
  "version": "1.0.0",
  "status": "published",
  "questions": [
    {
      "id": "nps",
      "type": "nps",
      "text": {
        "en": "How likely are you to recommend our check-in?"
      },
      "required": true
    }
  ],
  "delivery": {
    "mode": ["in-app", "email"],
    "startAt": "2025-10-10T09:00:00Z",
    "endAt": "2025-11-10T17:00:00Z",
    "maxResponses": 1000
  },
  "responseCount": 245,
  "createdAt": "2025-10-02T12:00:00Z"
}
```

---

### POST `/api/questionnaires/[id]/publish`
Publish questionnaire

**Authorization:** RESEARCHER or PM role

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "qnn_01J0ABC123",
    "status": "published",
    "publishedAt": "2025-10-02T12:00:00Z"
  },
  "message": "Questionnaire published successfully"
}
```

---

### POST `/api/questionnaires/[id]/responses`
Submit questionnaire response

**Authorization:** Authenticated users (if targeted)

**Request Body:**
```json
{
  "answers": {
    "nps": 9,
    "feedback": "Great experience, very smooth!"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "qnr_01J0ABC123",
    "questionnaireId": "qnn_01J0ABC123",
    "submittedAt": "2025-10-02T12:00:00Z"
  },
  "message": "Response submitted successfully"
}
```

---

### GET `/api/questionnaires/[id]/analytics`
Get questionnaire analytics

**Authorization:** RESEARCHER, PM, or ADMIN role

**Response:** `200 OK`
```json
{
  "questionnaireId": "qnn_01J0ABC123",
  "totalResponses": 245,
  "completionRate": 0.82,
  "npsScore": 42,
  "questionStats": {
    "nps": {
      "avg": 8.2,
      "distribution": {
        "0-6": 15,
        "7-8": 80,
        "9-10": 150
      }
    }
  },
  "exportLinks": {
    "csv": "/api/questionnaires/qnn_01J0ABC123/export?format=csv",
    "parquet": "/api/questionnaires/qnn_01J0ABC123/export?format=parquet"
  }
}
```

---

## Sessions API

### POST `/api/sessions`
Schedule research session

**Authorization:** RESEARCHER role

**Request Body:**
```json
{
  "type": "usability",
  "title": "Mobile Check-in Prototype Test",
  "description": "Testing new mobile check-in flow",
  "scheduledAt": "2025-10-15T14:00:00Z",
  "durationMinutes": 45,
  "facilitators": ["usr_researcher_01"],
  "minParticipants": 3,
  "maxParticipants": 6,
  "prototypeLink": "https://figma.com/proto/...",
  "recruitmentPanels": ["pan_01J0ABC123"],
  "recordingEnabled": true
}
```

**Session Types:**
- `usability` - Usability testing
- `interview` - User interview
- `prototype_walkthrough` - Prototype demonstration
- `remote_test` - Remote testing session

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "ses_01J0ABC123",
    "type": "usability",
    "scheduledAt": "2025-10-15T14:00:00Z",
    "status": "scheduled",
    "participantCount": 0,
    "maxParticipants": 6,
    "createdAt": "2025-10-02T12:00:00Z"
  },
  "message": "Session scheduled successfully"
}
```

---

### GET `/api/sessions`
List research sessions

**Authorization:** RESEARCHER or PM role

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "ses_01J0ABC123",
      "type": "usability",
      "title": "Mobile Check-in Prototype Test",
      "scheduledAt": "2025-10-15T14:00:00Z",
      "status": "scheduled",
      "participantCount": 4,
      "maxParticipants": 6,
      "createdAt": "2025-10-02T12:00:00Z"
    }
  ],
  "total": 12
}
```

---

### GET `/api/sessions/[id]`
Get session details

**Authorization:** RESEARCHER, PM, or invited participants

**Response:** `200 OK`
```json
{
  "id": "ses_01J0ABC123",
  "type": "usability",
  "title": "Mobile Check-in Prototype Test",
  "description": "Testing new mobile check-in flow",
  "scheduledAt": "2025-10-15T14:00:00Z",
  "durationMinutes": 45,
  "status": "scheduled",
  "prototypeLink": "https://figma.com/proto/...",
  "facilitators": [
    {
      "id": "usr_researcher_01",
      "displayName": "Research Lead",
      "email": "researcher@clubmed.com"
    }
  ],
  "participants": [
    {
      "id": "usr_01HZX...",
      "displayName": "Alex R.",
      "status": "accepted"
    }
  ],
  "recordingEnabled": true,
  "createdAt": "2025-10-02T12:00:00Z"
}
```

---

### POST `/api/sessions/[id]/join`
Join research session (participant)

**Authorization:** Invited users only

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "You have joined the session"
}
```

---

### POST `/api/sessions/[id]/complete`
Mark session as completed

**Authorization:** RESEARCHER (facilitator only)

**Request Body:**
```json
{
  "notes": "Great insights on the check-in flow. Participants suggested...",
  "recordingUrl": "https://storage.example.com/recordings/ses_01J0ABC123.mp4"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "ses_01J0ABC123",
    "status": "completed",
    "completedAt": "2025-10-15T15:00:00Z"
  },
  "message": "Session marked as completed"
}
```

---

## Notifications API

### GET `/api/notifications`
List notifications for current user

**Authorization:** Authenticated users

**Query Parameters:**
- `unreadOnly` (optional): boolean - filter unread notifications
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 20)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "ntf_01J0ABC123",
      "type": "feedback_merged",
      "title": "Your feedback was merged",
      "message": "Your feedback 'Add passport scan' was merged into a similar item",
      "read": false,
      "linkUrl": "/feedback/fb_01J0XYZ789",
      "createdAt": "2025-10-02T12:00:00Z"
    }
  ],
  "total": 15,
  "unreadCount": 3
}
```

**Notification Types:**
- `feedback_merged` - User's feedback was merged
- `vote_milestone` - Feedback reached vote milestone
- `roadmap_published` - New roadmap communication
- `panel_invitation` - Invited to research panel
- `questionnaire_available` - New questionnaire available
- `session_invitation` - Invited to research session

---

### PATCH `/api/notifications/[id]`
Mark notification as read

**Authorization:** Authenticated users (own notifications only)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### POST `/api/notifications/mark-all-read`
Mark all notifications as read

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markedCount": 12
  },
  "message": "All notifications marked as read"
}
```

---

## Admin API

### GET `/api/admin/users`
List all users (admin view)

**Authorization:** ADMIN role

**Query Parameters:**
- `role` (optional): filter by role
- `village` (optional): filter by current village
- `search` (optional): search by name or email
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 50)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "usr_01HZX...",
      "displayName": "Alex R.",
      "email": "alex@clubmed.com",
      "role": "USER",
      "currentVillageId": "vlg-001",
      "consents": ["research_contact", "email_updates"],
      "createdAt": "2025-09-01T10:00:00Z",
      "lastSignIn": "2025-10-02T08:00:00Z"
    }
  ],
  "total": 456,
  "page": 1,
  "limit": 50
}
```

---

### GET `/api/admin/users/[userId]`
Get user details (admin view)

**Authorization:** ADMIN role

**Response:** `200 OK`
```json
{
  "id": "usr_01HZX...",
  "displayName": "Alex R.",
  "email": "alex@clubmed.com",
  "employeeId": "E123456",
  "role": "USER",
  "currentVillageId": "vlg-001",
  "villageHistory": [
    {
      "villageId": "vlg-001",
      "from": "2025-09-01",
      "to": null
    }
  ],
  "consents": ["research_contact", "email_updates"],
  "feedbackCount": 12,
  "voteCount": 45,
  "panelMemberships": 2,
  "createdAt": "2025-09-01T10:00:00Z",
  "lastSignIn": "2025-10-02T08:00:00Z"
}
```

---

### PATCH `/api/admin/users/[userId]`
Update user (admin)

**Authorization:** ADMIN role

**Request Body:**
```json
{
  "role": "PM",
  "currentVillageId": "vlg-002"
}
```

**Response:** `200 OK`

---

### GET `/api/admin/users/[userId]/activity`
Get user activity log

**Authorization:** ADMIN role

**Response:** `200 OK`
```json
{
  "userId": "usr_01HZX...",
  "activities": [
    {
      "type": "feedback.created",
      "timestamp": "2025-10-02T12:00:00Z",
      "details": {
        "feedbackId": "fb_01J0ABC123",
        "title": "Add passport scan"
      }
    }
  ],
  "total": 87
}
```

---

### GET `/api/admin/villages`
List villages

**Authorization:** ADMIN role

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "vlg-001",
      "name": "La Rosière",
      "country": "France",
      "userCount": 234,
      "feedbackCount": 567,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 15
}
```

---

## User Profile API

### GET `/api/user/profile`
Get current user profile

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "id": "usr_01HZX...",
  "displayName": "Alex R.",
  "email": "alex@clubmed.com",
  "employeeId": "E123456",
  "role": "USER",
  "currentVillageId": "vlg-001",
  "villageHistory": [
    {
      "villageId": "vlg-001",
      "from": "2025-09-01",
      "to": null
    }
  ],
  "consents": ["research_contact", "email_updates"],
  "avatarUrl": "https://...",
  "createdAt": "2025-09-01T10:00:00Z"
}
```

---

### PATCH `/api/user/profile`
Update current user profile

**Authorization:** Authenticated users

**Request Body:**
```json
{
  "displayName": "Alex Rodriguez",
  "avatarUrl": "https://..."
}
```

**Response:** `200 OK`

---

### GET `/api/user/consent`
Get user consent preferences

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "consents": {
    "research_contact": true,
    "usage_analytics": true,
    "email_updates": false
  },
  "updatedAt": "2025-09-01T10:00:00Z"
}
```

---

### PATCH `/api/user/consent`
Update consent preferences

**Authorization:** Authenticated users

**Request Body:**
```json
{
  "research_contact": true,
  "usage_analytics": true,
  "email_updates": true
}
```

**Response:** `200 OK`

---

### GET `/api/user/panels`
Get user's panel memberships

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "panels": [
    {
      "id": "pan_01J0ABC123",
      "name": "Reception Core Panel",
      "status": "accepted",
      "joinedAt": "2025-10-01T10:00:00Z"
    }
  ],
  "total": 2
}
```

---

### POST `/api/user/panels/[panelId]/accept`
Accept panel invitation

**Authorization:** Authenticated users

**Response:** `200 OK`

---

### POST `/api/user/panels/[panelId]/decline`
Decline panel invitation

**Authorization:** Authenticated users

**Response:** `200 OK`

---

### GET `/api/user/data-export`
Export user data (GDPR compliance)

**Authorization:** Authenticated users

**Response:** `200 OK` (JSON file download)
```json
{
  "user": {
    "id": "usr_01HZX...",
    "displayName": "Alex R.",
    "email": "alex@clubmed.com"
  },
  "feedback": [...],
  "votes": [...],
  "questionnaireResponses": [...],
  "consents": {...},
  "exportedAt": "2025-10-02T12:00:00Z"
}
```

---

## Moderation API

### GET `/api/moderation/queue`
Get moderation queue

**Authorization:** MODERATOR, PM, PO, or ADMIN role

**Query Parameters:**
- `status` (optional): `pending_review|approved|rejected`
- `signal` (optional): `toxicity|spam|pii|off_topic`
- `page` (optional): number (default: 1)
- `limit` (optional): number (default: 20)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "fb_01J0ABC123",
      "title": "Feedback title",
      "body": "Feedback body...",
      "moderationStatus": "pending_review",
      "moderationSignals": ["toxicity", "pii"],
      "toxicityScore": 0.75,
      "spamScore": 0.2,
      "hasPii": true,
      "author": {
        "id": "usr_01HZX...",
        "displayName": "User Name"
      },
      "createdAt": "2025-10-02T10:00:00Z",
      "slaDeadline": "2025-10-04T10:00:00Z"
    }
  ],
  "total": 12,
  "pendingCount": 8,
  "overdueCount": 2
}
```

---

### POST `/api/moderation/[id]/approve`
Approve flagged feedback

**Authorization:** MODERATOR, PM, PO, or ADMIN role

**Request Body:**
```json
{
  "notes": "Reviewed - acceptable content"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "fb_01J0ABC123",
    "moderationStatus": "approved",
    "reviewedAt": "2025-10-02T12:00:00Z"
  },
  "message": "Feedback approved"
}
```

---

### POST `/api/moderation/[id]/reject`
Reject flagged feedback

**Authorization:** MODERATOR, PM, PO, or ADMIN role

**Request Body:**
```json
{
  "reason": "Contains inappropriate content",
  "notes": "Violates community guidelines"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "fb_01J0ABC123",
    "moderationStatus": "rejected",
    "reviewedAt": "2025-10-02T12:00:00Z"
  },
  "message": "Feedback rejected"
}
```

---

## Metrics API

### GET `/api/metrics/feedback`
Get feedback metrics

**Authorization:** PM, PO, or ADMIN role

**Query Parameters:**
- `period` (optional): `7d|30d|90d|all` (default: `30d`)
- `villageId` (optional): filter by village
- `area` (optional): filter by product area

**Response:** `200 OK`
```json
{
  "period": "30d",
  "feedbackVolume": 234,
  "feedbackVolume7d": 45,
  "avgFeedbackPerDay": 7.8,
  "mergeRate": 0.12,
  "stateDistribution": {
    "new": 120,
    "triaged": 60,
    "merged": 28,
    "in_roadmap": 15,
    "closed": 11
  },
  "topAreas": [
    {
      "area": "Check-in",
      "count": 89
    }
  ],
  "voteWeightSum": 4567.8
}
```

---

### GET `/api/metrics/research`
Get research metrics

**Authorization:** RESEARCHER, PM, or ADMIN role

**Response:** `200 OK`
```json
{
  "period": "30d",
  "questionnairesPublished": 5,
  "totalResponses": 1234,
  "avgCompletionRate": 0.78,
  "panelCount": 8,
  "panelMembersTotal": 456,
  "sessionsCompleted": 12,
  "avgRecruitmentLeadTimeDays": 5.2
}
```

---

### GET `/api/metrics/product`
Get product metrics

**Authorization:** PM, PO, or ADMIN role

**Response:** `200 OK`
```json
{
  "period": "90d",
  "npsScoreByArea": {
    "Check-in": 42,
    "Reservations": 38,
    "Payments": 51
  },
  "avgIdeaToDeliveryDays": 87,
  "featuresReleased": 8,
  "activeRoadmapItems": 12
}
```

---

## Error Codes

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": []
}
```

### HTTP Status Codes

- **200 OK** - Request succeeded
- **201 Created** - Resource created successfully
- **204 No Content** - Request succeeded, no response body
- **400 Bad Request** - Validation failed or invalid input
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (e.g., duplicate vote)
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

### Common Error Types

#### Validation Errors
```json
{
  "error": "Validation failed",
  "message": "Please check your input and try again",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 8 characters"
    }
  ]
}
```

#### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to perform this action"
}
```

#### Permission Errors
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

#### Rate Limit Errors
```json
{
  "error": "Rate limit exceeded",
  "message": "You have reached the maximum of 10 feedback submissions per day",
  "resetAt": "2025-10-03T00:00:00Z"
}
```

#### Not Found Errors
```json
{
  "error": "Not found",
  "message": "Feedback item not found"
}
```

---

## Best Practices

### Authentication
- Always check user authentication before accessing protected endpoints
- Use the session cookie automatically managed by NextAuth.js
- Handle 401 errors by redirecting to sign-in page

### Pagination
- Always use pagination for list endpoints
- Default limit is 20, maximum is 100
- Check `hasMore` field to determine if more pages exist

### Error Handling
- Always check HTTP status codes
- Parse error responses for detailed information
- Display user-friendly error messages

### Data Validation
- Validate input on client-side before sending requests
- Handle validation errors gracefully
- Show field-specific error messages to users

### PII Protection
- Never send raw PII in feedback submissions
- Use redacted fields when displaying user data
- Request data exports through proper channels

### Rate Limiting
- Respect rate limits (10 feedback/day)
- Handle 429 errors by showing wait time
- Don't retry immediately after rate limit errors

---

**Last Updated:** 2025-10-02
**API Version:** 0.5.0
