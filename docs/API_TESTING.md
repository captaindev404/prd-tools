# Feedback API Testing Guide

This document provides examples for testing the Feedback API endpoints using curl or other HTTP clients.

## Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Ensure you have a valid authentication session (for authenticated endpoints)

## API Endpoints

### 1. Create Feedback

**POST** `/api/feedback`

Creates a new feedback item with PII redaction and rate limiting.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Check-in kiosk is not working properly",
  "body": "I tried to check in using the kiosk but it kept freezing. Had to wait 20 minutes for staff assistance. This needs to be fixed urgently.",
  "featureId": "feat-checkin-mobile",
  "villageId": "vlg-001",
  "source": "app",
  "visibility": "public"
}
```

**Validation Rules:**
- `title`: 8-120 characters (required)
- `body`: 20-5000 characters (required)
- `featureId`: Optional feature reference
- `villageId`: Optional village context
- Rate limit: 10 submissions per user per day

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Check-in process is too slow",
    "body": "The check-in process takes way too long. I had to wait 45 minutes just to get my room key. Please improve this."
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "fb_01HXYZ...",
    "title": "Check-in process is too slow",
    "body": "The check-in process takes way too long...",
    "author": {
      "id": "usr_01HXYZ...",
      "displayName": "John Doe",
      "email": "john.doe@clubmed.com"
    },
    "state": "new",
    "moderationStatus": "auto_pending",
    "createdAt": "2025-10-02T17:00:00Z",
    "editWindowEndsAt": "2025-10-02T17:15:00Z"
  },
  "message": "Feedback submitted successfully"
}
```

**PII Redaction Examples:**
- Input: "Call me at +33 1 23 45 67 89"
- Output: "Call me at ***67 89"
- Input: "My email is user@example.com"
- Output: "My email is ***.com"
- Input: "Room 1234 needs cleaning"
- Output: "***1234 needs cleaning"

---

### 2. List Feedback

**GET** `/api/feedback`

Lists feedback items with pagination and filtering.

**Authentication:** Optional (public endpoint)

**Query Parameters:**
- `state`: Filter by state (new, triaged, merged, in_roadmap, closed)
- `area`: Filter by feature area (Reservations, CheckIn, Payments, etc.)
- `villageId`: Filter by village
- `featureId`: Filter by feature
- `authorId`: Filter by author
- `search`: Search in title and body
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Sort field (createdAt, updatedAt, voteCount, voteWeight)
- `sortOrder`: Sort order (asc, desc)

**Examples:**

Get first 20 feedback items:
```bash
curl http://localhost:3000/api/feedback
```

Filter by state and search:
```bash
curl "http://localhost:3000/api/feedback?state=new&search=check-in&limit=10"
```

**Success Response (200):**
```json
{
  "items": [
    {
      "id": "fb_01HXYZ...",
      "title": "Check-in process is too slow",
      "body": "The check-in process takes way too long...",
      "author": {
        "id": "usr_01HXYZ...",
        "displayName": "John Doe",
        "email": "john.doe@clubmed.com"
      },
      "feature": {
        "id": "feat-checkin-mobile",
        "title": "Mobile Check-in",
        "area": "CheckIn"
      },
      "state": "new",
      "voteCount": 5,
      "voteWeight": 7.5,
      "createdAt": "2025-10-02T17:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

---

### 3. Get Single Feedback

**GET** `/api/feedback/[id]`

Retrieves a single feedback item with full details.

**Authentication:** Optional

**Example:**
```bash
curl http://localhost:3000/api/feedback/fb_01HXYZ123456
```

**Success Response (200):**
```json
{
  "id": "fb_01HXYZ...",
  "title": "Check-in process is too slow",
  "body": "The check-in process takes way too long...",
  "author": {
    "id": "usr_01HXYZ...",
    "displayName": "John Doe",
    "email": "john.doe@clubmed.com",
    "role": "USER"
  },
  "feature": {
    "id": "feat-checkin-mobile",
    "title": "Mobile Check-in",
    "area": "CheckIn",
    "status": "in_progress"
  },
  "state": "triaged",
  "moderationStatus": "approved",
  "voteCount": 5,
  "voteWeight": 7.5,
  "userHasVoted": false,
  "duplicateOf": null,
  "duplicates": [],
  "votes": [
    {
      "id": "clxyz...",
      "userId": "usr_01HXYZ...",
      "weight": 1.5,
      "createdAt": "2025-10-02T17:05:00Z",
      "user": {
        "id": "usr_01HXYZ...",
        "displayName": "Jane Smith"
      }
    }
  ],
  "createdAt": "2025-10-02T17:00:00Z",
  "editWindowEndsAt": "2025-10-02T17:15:00Z"
}
```

**Error Response (404):**
```json
{
  "error": "Not found",
  "message": "Feedback item not found"
}
```

---

### 4. Edit Feedback

**PATCH** `/api/feedback/[id]`

Edits an existing feedback item.

**Authentication:** Required

**Authorization:**
- Author within 15-minute edit window, OR
- User with PM/PO/ADMIN role

**Request Body:**
```json
{
  "title": "Updated title here",
  "body": "Updated body text here with at least 20 characters"
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/feedback/fb_01HXYZ123456 \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Updated: The check-in process takes extremely long. I waited 45 minutes and this is unacceptable."
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "fb_01HXYZ...",
    "title": "Check-in process is too slow",
    "body": "Updated: The check-in process takes extremely long...",
    "updatedAt": "2025-10-02T17:10:00Z"
  },
  "message": "Feedback updated successfully"
}
```

**Error Response (403):**
```json
{
  "error": "Forbidden",
  "message": "The edit window for this feedback has expired"
}
```

---

### 5. Find Duplicates

**GET** `/api/feedback/[id]/duplicates`

Finds similar feedback items using fuzzy matching (0.86 threshold).

**Authentication:** Optional

**Example:**
```bash
curl http://localhost:3000/api/feedback/fb_01HXYZ123456/duplicates
```

**Success Response (200):**
```json
{
  "hasDuplicates": true,
  "count": 2,
  "duplicates": [
    {
      "id": "fb_01HXYZ789...",
      "title": "Check in process is too slow",
      "body": "Same issue with slow check-in...",
      "state": "new",
      "similarity": 0.94,
      "voteCount": 3,
      "voteWeight": 4.5,
      "createdAt": "2025-10-02T16:45:00Z"
    },
    {
      "id": "fb_01HXYZABC...",
      "title": "Check-in takes too long",
      "body": "Another similar complaint...",
      "state": "triaged",
      "similarity": 0.87,
      "voteCount": 2,
      "voteWeight": 3.0,
      "createdAt": "2025-10-02T16:30:00Z"
    }
  ]
}
```

**Similarity Algorithm:**
- Uses Dice coefficient (Sørensen-Dice)
- Threshold: 0.86 (86% similarity)
- Only matches on feedback title
- Excludes already merged items

---

### 6. Merge Feedback

**POST** `/api/feedback/[id]/merge`

Merges a feedback item into another (canonical) item.

**Authentication:** Required

**Authorization:** PM, PO, MODERATOR, or ADMIN role only

**Request Body:**
```json
{
  "targetId": "fb_01HXYZTARGET"
}
```

**Process:**
1. Validates both items exist
2. Prevents circular merges
3. Sets source state to "merged"
4. Sets duplicateOfId on source
5. Transfers all votes to target
6. Uses database transaction for atomicity

**Example:**
```bash
curl -X POST http://localhost:3000/api/feedback/fb_01HXYZSOURCE/merge \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": "fb_01HXYZTARGET"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "mergedId": "fb_01HXYZSOURCE",
  "targetId": "fb_01HXYZTARGET",
  "votesMigrated": 5,
  "message": "Successfully merged feedback into fb_01HXYZTARGET. 5 vote(s) migrated."
}
```

**Error Responses:**

Unauthorized (403):
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to merge feedback items"
}
```

Already merged (400):
```json
{
  "error": "Validation failed",
  "message": "Source feedback has already been merged"
}
```

Circular merge (400):
```json
{
  "error": "Validation failed",
  "message": "Circular merge detected. Target is already marked as duplicate of source."
}
```

---

## Rate Limiting

The API implements rate limiting on feedback creation:

- **Limit:** 10 feedback submissions per user per day
- **Window:** 24 hours (sliding window)
- **Storage:** In-memory (for production, consider Redis)

**Rate Limit Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have reached the maximum of 10 feedback submissions per day. Please try again after 2025-10-03T17:00:00Z",
  "resetAt": "2025-10-03T17:00:00Z"
}
```

---

## Testing Utilities

You can test the core utilities directly:

```bash
# Test PII redaction and fuzzy matching
npm run tsx scripts/test-utilities.ts
```

This will test:
- PII detection and redaction (email, phone, room, reservation)
- Fuzzy matching with Dice coefficient
- Similarity threshold validation (0.86)

---

## Common Error Responses

### Authentication Required (401)
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to submit feedback"
}
```

### Forbidden (403)
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

### Validation Failed (400)
```json
{
  "error": "Validation failed",
  "message": "Please check your input and try again",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 8 characters"
    },
    {
      "field": "body",
      "message": "Body must be at least 20 characters"
    }
  ]
}
```

### Internal Server Error (500)
```json
{
  "error": "Internal server error",
  "message": "Failed to process request. Please try again later."
}
```

---

## Next Steps

1. Start development server: `npm run dev`
2. Run database migrations: `npm run db:migrate`
3. Seed test data: `npm run db:seed`
4. Test endpoints using curl or Postman
5. Check API logs for errors

For integration with the frontend, see the example React components in the codebase.
