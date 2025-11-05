# PRD: InfiniteStories Backend API

**Version**: 1.0
**Status**: Draft
**Last Updated**: 2025-01-04
**Author**: Backend Engineering Team
**Stakeholders**: iOS Team, Product, DevOps

---

## Executive Summary

### Overview
This PRD outlines the development of a Next.js-based backend API for InfiniteStories, migrating from a local-only iOS app to a cloud-backed system. The API will handle user authentication, data persistence, AI-powered content generation (stories, audio, illustrations), and file storage.

### Goals
- **Enable multi-device access**: Users can access their stories from any device
- **Centralize data**: Single source of truth for heroes, stories, and media
- **Secure user data**: Authentication, authorization, and data privacy
- **Cost-effective AI**: Centralized OpenAI integration with rate limiting and usage tracking
- **Scalable architecture**: Support growth from beta to thousands of users

### Timeline
- **Phase 1** (Week 1): Foundation - Database, Auth, File Storage
- **Phase 2** (Week 2-3): Core API - Heroes, Stories, Audio, Illustrations
- **Phase 3** (Week 3-4): OpenAI Integration & Services
- **Phase 4** (Week 5-6): Testing & Production Deployment

**Total Duration**: 6 weeks

### Success Criteria
- ✅ Users can authenticate with email/password
- ✅ Full CRUD operations for heroes and stories
- ✅ AI-powered story generation with audio synthesis
- ✅ Multi-illustration generation with visual consistency
- ✅ All media files stored in cloud (Cloudflare R2)
- ✅ Rate limiting prevents abuse (<$1.50/user/month in AI costs)
- ✅ Production deployment with <200ms median API response time
- ✅ 99.9% uptime with monitoring and alerts

---

## 1. Background & Context

### Current State
InfiniteStories is currently an iOS-only app using:
- **SwiftData** for local persistence
- **Local file storage** for avatars, audio (MP3), and illustrations
- **Direct OpenAI API calls** from the iOS app
- **No user accounts** - data isolated per device

### Problems with Current Architecture
1. **Single-device limitation**: Users lose data if device is lost/replaced
2. **No backup or sync**: Stories exist only on one device
3. **API key exposure risk**: OpenAI API key embedded in iOS app
4. **Cost tracking difficulty**: No centralized usage monitoring
5. **Scalability issues**: Cannot support web app or other platforms
6. **Data migration complexity**: Manual export/import required

### Proposed Solution
Develop a centralized backend API that:
- Manages user authentication and authorization
- Stores all user data (heroes, stories, media) in the cloud
- Handles OpenAI API calls server-side with rate limiting
- Provides RESTful endpoints for iOS (and future platforms)
- Tracks usage and costs per user
- Enables data backup, sync, and migration

---

## 2. Goals & Objectives

### Primary Objectives

#### P0 (Must Have)
- User authentication with email/password via Better Auth
- Complete hero management (CRUD operations)
- Story generation, storage, and retrieval
- Audio synthesis and playback URL delivery
- Illustration generation with visual consistency
- File storage in Cloudflare R2
- Rate limiting to control costs
- Usage tracking and monitoring

#### P1 (Should Have)
- Custom story events API
- User profile and preferences management
- Usage statistics dashboard
- Error tracking and logging
- Content safety filtering

#### P2 (Nice to Have)
- Apple OAuth integration
- Story sharing between users
- Content caching for performance
- Premium tier with higher limits
- Admin dashboard

### Out of Scope (Future Work)
- Web application frontend
- Android app
- Social features (comments, likes)
- Payment processing and subscriptions
- Multi-language admin interface
- Real-time collaboration

### Key Performance Indicators (KPIs)
- **API Response Time**: P50 <200ms, P95 <1s
- **Uptime**: 99.9% (43min downtime/month)
- **AI Cost per User**: <$1.50/month for 10 stories
- **Rate Limit Violation Rate**: <1% of requests
- **Error Rate**: <0.5% of API requests
- **User Satisfaction**: NPS >50

---

## 3. User Stories

### Authentication
- **US-001**: As a new user, I can sign up with email and password so that I can create my account
- **US-002**: As a returning user, I can log in with my credentials so that I can access my data
- **US-003**: As a logged-in user, I can log out so that my session is terminated
- **US-004**: As a user, my session persists for 30 days so that I don't need to log in frequently
- **US-005**: As a user, I receive clear error messages if authentication fails

### Hero Management
- **US-006**: As a user, I can create a new hero with name, age, traits, and appearance
- **US-007**: As a user, I can view all my heroes with their avatar images
- **US-008**: As a user, I can edit a hero's attributes
- **US-009**: As a user, I can delete a hero (stories are preserved but disassociated)
- **US-010**: As a user, I can generate an AI avatar for my hero
- **US-011**: As a user, my hero's visual profile is created automatically for consistency

### Story Creation & Management
- **US-012**: As a user, I can generate a story for a hero with a selected event type
- **US-013**: As a user, I can specify the language for story generation (en, es, fr, de, it)
- **US-014**: As a user, I can edit a story's content after generation
- **US-015**: As a user, I can delete a story
- **US-016**: As a user, I can view all my stories filtered by hero
- **US-017**: As a user, I can mark stories as favorites
- **US-018**: As a user, I can see how many times I've listened to each story

### Audio & Illustrations
- **US-019**: As a user, when a story is generated, audio is automatically created
- **US-020**: As a user, I can regenerate audio if I edit the story content
- **US-021**: As a user, I can request illustrations for a story
- **US-022**: As a user, illustrations maintain visual consistency with the hero's avatar
- **US-023**: As a user, illustrations are synchronized with audio timestamps
- **US-024**: As a user, I see progress updates during illustration generation

### Usage & Limits
- **US-025**: As a user, I can view my monthly usage statistics
- **US-026**: As a user, I am notified when approaching my monthly limits
- **US-027**: As a user, I am rate-limited to prevent excessive costs
- **US-028**: As a user, I receive clear error messages when rate limits are hit

---

## 4. Technical Architecture

### Technology Stack

#### Backend Framework
- **Next.js 14+**: API routes with App Router
- **TypeScript**: Type-safe development
- **Node.js 20+**: Runtime environment

#### Database
- **PostgreSQL 15+**: Primary data store
- **Prisma 5+**: ORM and migration tool
- **Connection Pooling**: PgBouncer for production

#### Authentication
- **Better Auth**: Authentication framework
- **Email/Password**: Initial auth method
- **Apple OAuth**: Future enhancement

#### File Storage
- **Cloudflare R2**: S3-compatible object storage
- **Zero egress fees**: Cost-effective for media delivery
- **CDN integration**: Fast global delivery

#### AI Services
- **OpenAI API**: GPT-4o, TTS-1, DALL-E-3
- **Content filtering**: Child-safe content validation

#### Caching & Rate Limiting
- **Upstash Redis**: Serverless Redis for rate limiting
- **In-memory caching**: Node.js native for hot paths

#### Monitoring & Observability
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance monitoring
- **Custom logging**: Structured JSON logs

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         iOS App                              │
│  (SwiftUI, SwiftData → API Client)                          │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │   Heroes     │  │   Stories    │     │
│  │  /api/auth   │  │ /api/heroes  │  │ /api/stories │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                  ┌─────────▼─────────┐                      │
│                  │   Middleware      │                      │
│                  │ - Authentication  │                      │
│                  │ - Rate Limiting   │                      │
│                  │ - Validation      │                      │
│                  └─────────┬─────────┘                      │
└──────────────────────────┬─┬───────────────────────────────┘
                           │ │
        ┌──────────────────┘ └──────────────────┐
        │                                        │
        ▼                                        ▼
┌───────────────────┐                  ┌────────────────────┐
│   PostgreSQL      │                  │  OpenAI Services   │
│  (via Prisma)     │                  │  ┌──────────────┐  │
│  - Users          │                  │  │  GPT-4o      │  │
│  - Heroes         │                  │  │  (Stories)   │  │
│  - Stories        │                  │  └──────────────┘  │
│  - Illustrations  │                  │  ┌──────────────┐  │
│  - UsageMetrics   │                  │  │  TTS-1       │  │
│                   │                  │  │  (Audio)     │  │
└───────────────────┘                  │  └──────────────┘  │
                                       │  ┌──────────────┐  │
        ┌──────────────────────────────┤  │  DALL-E-3    │  │
        │                              │  │  (Images)    │  │
        ▼                              │  └──────────────┘  │
┌───────────────────┐                  └────────────────────┘
│  Cloudflare R2    │
│  - Avatars        │
│  - Audio (MP3)    │                  ┌────────────────────┐
│  - Illustrations  │                  │  Upstash Redis     │
│  - Pictograms     │◄─────────────────┤  (Rate Limiting)   │
└───────────────────┘                  └────────────────────┘
```

### Data Flow Examples

#### Story Generation Flow
```
1. iOS App → POST /api/stories
   {
     "heroId": "hero_123",
     "eventType": "bedtime",
     "language": "en"
   }

2. API validates request and checks rate limits

3. API fetches hero data from PostgreSQL

4. API calls OpenAI GPT-4o to generate story

5. API saves story to PostgreSQL

6. API queues audio generation job

7. API returns story immediately
   {
     "story": {
       "id": "story_456",
       "content": "Once upon a time...",
       "audioUrl": null,
       "audioGenerated": false
     }
   }

8. Background: Audio generation completes

9. Background: API uploads MP3 to R2

10. Background: API updates story.audioUrl in DB

11. iOS App polls or receives webhook for audio URL
```

---

## 5. Database Schema

### Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// Authentication & Users
// ============================================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  emailVerified Boolean  @default(false)
  appleId       String?  @unique
  name          String?
  image         String?

  // Preferences
  preferredLanguage String @default("en")
  themePreference   String @default("system")

  // Subscription
  subscriptionTier    String   @default("free")
  subscriptionExpiry  DateTime?
  monthlyStoriesUsed  Int      @default(0)
  monthlyStoriesLimit Int      @default(10)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastSeenAt DateTime @default(now())

  // Relations
  heroes        Hero[]
  customEvents  CustomStoryEvent[]
  sessions      Session[]
  apiKeys       ApiKey[]
  usageMetrics  UsageMetric[]

  @@index([email])
  @@index([appleId])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}

// ============================================
// Hero System
// ============================================

model Hero {
  id          String   @id @default(cuid())
  userId      String

  // Character attributes
  name        String
  age         Int
  traits      String[]
  appearance  String
  abilities   String[]

  // Avatar
  avatarUrl            String?
  avatarPrompt         String?
  avatarGenerationId   String?

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  visualProfile  HeroVisualProfile?
  stories        Story[]

  @@index([userId])
  @@index([createdAt])
}

model HeroVisualProfile {
  id       String @id @default(cuid())
  heroId   String @unique

  // Physical characteristics
  hairColor       String?
  hairStyle       String?
  eyeColor        String?
  skinTone        String?
  bodyType        String?
  height          String?

  // Clothing & style
  clothingStyle   String?
  colorPalette    String[]
  accessories     String[]

  // Art direction
  artStyle        String?
  canonicalPrompt String?
  simplifiedPrompt String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  hero Hero @relation(fields: [heroId], references: [id], onDelete: Cascade)

  @@index([heroId])
}

// ============================================
// Story System
// ============================================

model Story {
  id       String   @id @default(cuid())
  heroId   String

  // Content
  title    String
  content  String   @db.Text
  language String   @default("en")

  // Event
  eventType         String?
  customEventId     String?
  customEventPrompt String?

  // Audio
  audioUrl        String?
  audioGenerated  Boolean @default(false)
  audioDuration   Float?
  voiceType       String?

  // Stats
  listenCount     Int      @default(0)
  lastListenedAt  DateTime?
  isFavorite      Boolean  @default(false)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  hero           Hero               @relation(fields: [heroId], references: [id], onDelete: Cascade)
  customEvent    CustomStoryEvent?  @relation(fields: [customEventId], references: [id], onDelete: SetNull)
  illustrations  StoryIllustration[]

  @@index([heroId])
  @@index([customEventId])
  @@index([createdAt])
  @@index([isFavorite])
}

model StoryIllustration {
  id       String   @id @default(cuid())
  storyId  String

  // Illustration
  imageUrl         String
  dallePrompt      String  @db.Text
  generationId     String?

  // Timeline
  timestamp        Float
  duration         Float?
  displayOrder     Int

  // Status
  generationStatus String  @default("pending")
  errorMessage     String?
  retryCount       Int     @default(0)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@index([storyId])
  @@index([displayOrder])
}

// ============================================
// Custom Events
// ============================================

model CustomStoryEvent {
  id     String @id @default(cuid())
  userId String

  // Event
  title           String
  description     String  @db.Text
  promptSeed      String  @db.Text
  keywords        String[]

  // Categorization
  category        String
  ageRange        String?
  tone            String  @default("gentle")

  // Visual
  pictogramUrl    String?
  pictogramEmoji  String?

  // Usage
  usageCount      Int      @default(0)
  lastUsedAt      DateTime?
  isFavorite      Boolean  @default(false)

  // AI
  aiEnhanced      Boolean  @default(false)
  originalPrompt  String?  @db.Text

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  stories Story[]

  @@index([userId])
  @@index([category])
  @@index([isFavorite])
  @@index([usageCount])
}

// ============================================
// System & Monitoring
// ============================================

model ApiKey {
  id        String   @id @default(cuid())
  userId    String
  keyHash   String   @unique
  name      String
  lastUsed  DateTime?
  expiresAt DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([keyHash])
}

model UsageMetric {
  id        String   @id @default(cuid())
  userId    String

  operation String
  cost      Float
  tokensUsed Int?
  metadata  String?  @db.Text

  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([operation])
  @@index([createdAt])
}

model FileUpload {
  id         String   @id @default(cuid())
  userId     String

  fileName   String
  fileSize   Int
  mimeType   String
  storageKey String   @unique
  url        String

  category   String
  entityId   String?

  isPublic   Boolean  @default(false)
  expiresAt  DateTime?

  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([storageKey])
  @@index([category])
}
```

### Database Migrations

#### Initial Migration
```bash
npx prisma migrate dev --name init
```

#### Adding Indexes
```bash
npx prisma migrate dev --name add_performance_indexes
```

#### Data Migration Script
Located at `/scripts/migrate-local-data.ts` for migrating iOS local data to backend.

---

## 6. API Endpoints Specification

### Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.infinitestories.app/api`

### Authentication Header
All protected endpoints require:
```
Authorization: Bearer <session_token>
```

### Common Response Codes
- `200 OK`: Successful GET/PATCH/DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid auth
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific error details"
  }
}
```

---

### 6.1 Authentication Endpoints

#### POST /api/auth/signup
**Description**: Create new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "session_xyz789",
    "expiresAt": "2025-02-04T00:00:00Z"
  }
}
```

**Validation Rules**:
- Email: Valid email format, unique
- Password: Min 8 characters, 1 uppercase, 1 number
- Name: Optional, max 100 characters

**Rate Limit**: 5 requests/hour per IP

---

#### POST /api/auth/login
**Description**: Authenticate existing user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "subscriptionTier": "free",
    "monthlyStoriesUsed": 3,
    "monthlyStoriesLimit": 10
  },
  "session": {
    "token": "session_xyz789",
    "expiresAt": "2025-02-04T00:00:00Z"
  }
}
```

**Error Responses**:
- `401`: Invalid credentials
- `403`: Email not verified

**Rate Limit**: 10 requests/hour per IP

---

#### POST /api/auth/logout
**Description**: Terminate current session

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true
}
```

**Rate Limit**: No limit

---

#### GET /api/auth/session
**Description**: Get current session info

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "preferredLanguage": "en",
    "subscriptionTier": "free"
  },
  "session": {
    "expiresAt": "2025-02-04T00:00:00Z"
  }
}
```

**Error Responses**:
- `401`: Session expired or invalid

**Rate Limit**: 100 requests/minute

---

### 6.2 Hero Endpoints

#### GET /api/heroes
**Description**: List user's heroes

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `limit` (optional): Max results, default 50
- `offset` (optional): Pagination offset
- `sortBy` (optional): `createdAt|name`, default `createdAt`
- `sortOrder` (optional): `asc|desc`, default `desc`

**Response** (200):
```json
{
  "heroes": [
    {
      "id": "hero_123",
      "name": "Alice",
      "age": 7,
      "traits": ["brave", "kind"],
      "appearance": "Curly blonde hair, blue eyes",
      "abilities": ["magic"],
      "avatarUrl": "https://files.infinitestories.app/avatars/abc.png",
      "createdAt": "2025-01-01T12:00:00Z",
      "storyCount": 5
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

**Rate Limit**: 100 requests/minute

---

#### POST /api/heroes
**Description**: Create new hero

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Bob",
  "age": 6,
  "traits": ["curious", "playful"],
  "appearance": "Short brown hair, green eyes",
  "abilities": ["super speed"]
}
```

**Validation Rules**:
- `name`: Required, 1-100 characters
- `age`: Required, 1-18
- `traits`: Required, 1-5 strings from valid list
- `appearance`: Required, max 500 characters
- `abilities`: Optional, max 3 strings

**Response** (201):
```json
{
  "hero": {
    "id": "hero_456",
    "name": "Bob",
    "age": 6,
    "traits": ["curious", "playful"],
    "appearance": "Short brown hair, green eyes",
    "abilities": ["super speed"],
    "avatarUrl": null,
    "createdAt": "2025-01-04T12:00:00Z"
  }
}
```

**Rate Limit**: 10 requests/minute

---

#### GET /api/heroes/[heroId]
**Description**: Get hero details

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `heroId`: Hero identifier

**Query Parameters**:
- `includeStories` (optional): Include recent stories, default `false`
- `storyLimit` (optional): Max stories to include, default 10

**Response** (200):
```json
{
  "hero": {
    "id": "hero_123",
    "name": "Alice",
    "age": 7,
    "traits": ["brave", "kind"],
    "appearance": "Curly blonde hair, blue eyes",
    "abilities": ["magic"],
    "avatarUrl": "https://files.infinitestories.app/avatars/abc.png",
    "avatarGenerationId": "gen_xyz",
    "visualProfile": {
      "hairColor": "blonde",
      "hairStyle": "curly",
      "eyeColor": "blue",
      "skinTone": "light",
      "clothingStyle": "wizard robes",
      "artStyle": "watercolor"
    },
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-02T10:00:00Z",
    "stories": [
      {
        "id": "story_789",
        "title": "Alice's Bedtime Adventure",
        "createdAt": "2025-01-03T20:00:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- `404`: Hero not found or not owned by user

**Rate Limit**: 100 requests/minute

---

#### PATCH /api/heroes/[heroId]
**Description**: Update hero

**Headers**: `Authorization: Bearer <token>`

**Request Body** (all fields optional):
```json
{
  "name": "Alice (Updated)",
  "age": 8,
  "traits": ["brave", "kind", "clever"],
  "appearance": "Long curly blonde hair, blue eyes, taller now",
  "abilities": ["magic", "healing"]
}
```

**Response** (200):
```json
{
  "hero": {
    "id": "hero_123",
    "name": "Alice (Updated)",
    ...
    "updatedAt": "2025-01-04T14:30:00Z"
  }
}
```

**Error Responses**:
- `404`: Hero not found
- `400`: Invalid input

**Rate Limit**: 20 requests/minute

---

#### DELETE /api/heroes/[heroId]
**Description**: Delete hero (stories preserved but unlinked)

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "storiesAffected": 5
}
```

**Side Effects**:
- Hero record deleted
- Stories set to `heroId: null`
- Avatar file deleted from R2 (async)
- Visual profile deleted (cascade)

**Rate Limit**: 10 requests/minute

---

#### POST /api/heroes/[heroId]/avatar
**Description**: Generate AI avatar for hero

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "customPrompt": "Optional custom DALL-E prompt override"
}
```

**Response** (200):
```json
{
  "hero": {
    "id": "hero_123",
    "avatarUrl": "https://files.infinitestories.app/avatars/new_abc.png",
    "avatarGenerationId": "gen_new123",
    "avatarPrompt": "A 7-year-old brave and kind girl with curly blonde hair...",
    "visualProfile": {
      "hairColor": "blonde",
      "hairStyle": "curly",
      "eyeColor": "blue",
      ...
    }
  }
}
```

**Process Flow**:
1. Build DALL-E prompt from hero attributes
2. Apply content safety filter
3. Generate image via OpenAI DALL-E-3
4. Upload PNG to R2
5. Extract visual characteristics with GPT-4o
6. Create/update HeroVisualProfile
7. Update hero record

**Rate Limit**: 5 requests/hour per user

**Cost**: ~$0.04 per generation

---

### 6.3 Story Endpoints

#### GET /api/stories
**Description**: List user's stories

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `heroId` (optional): Filter by hero
- `eventType` (optional): Filter by event type
- `language` (optional): Filter by language
- `isFavorite` (optional): Filter favorites
- `limit` (optional): Default 50, max 100
- `offset` (optional): Pagination
- `sortBy` (optional): `createdAt|listenCount`, default `createdAt`
- `sortOrder` (optional): `asc|desc`, default `desc`

**Response** (200):
```json
{
  "stories": [
    {
      "id": "story_789",
      "heroId": "hero_123",
      "heroName": "Alice",
      "title": "Alice's Magical Bedtime",
      "content": "Once upon a time...",
      "language": "en",
      "eventType": "bedtime",
      "audioUrl": "https://files.infinitestories.app/audio/story_789.mp3",
      "audioGenerated": true,
      "audioDuration": 180.5,
      "illustrationCount": 3,
      "listenCount": 5,
      "isFavorite": true,
      "createdAt": "2025-01-03T20:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

**Rate Limit**: 100 requests/minute

---

#### POST /api/stories
**Description**: Generate new story

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "heroId": "hero_123",
  "eventType": "bedtime",
  "language": "en",
  "customEventId": "event_456",
  "generateAudio": true,
  "generateIllustrations": false,
  "illustrationCount": 3
}
```

**Validation Rules**:
- `heroId`: Required, must exist and belong to user
- `eventType`: Optional if `customEventId` provided
- `language`: Optional, default "en", must be in [en, es, fr, de, it]
- `generateAudio`: Optional, default true
- `generateIllustrations`: Optional, default false
- `illustrationCount`: Optional, 1-5, default 3

**Response** (201):
```json
{
  "story": {
    "id": "story_new",
    "heroId": "hero_123",
    "title": "Alice's Bedtime Adventure",
    "content": "Once upon a time, in a magical forest...\n\n[Full story text]",
    "language": "en",
    "eventType": "bedtime",
    "audioUrl": null,
    "audioGenerated": false,
    "createdAt": "2025-01-04T15:00:00Z"
  },
  "jobs": {
    "audioGeneration": {
      "queued": true,
      "estimatedCompletionTime": "2025-01-04T15:02:00Z"
    }
  }
}
```

**Process Flow**:
1. Validate request and check rate limits
2. Fetch hero data and visual profile
3. Build story prompt with localization
4. Generate story with GPT-4o (~10-15s)
5. Save story to database
6. Queue audio generation job (if requested)
7. Return story immediately
8. Background: Generate audio (~30-60s)
9. Background: Upload audio to R2
10. Background: Update story.audioUrl

**Rate Limit**: 10 requests/hour per user

**Cost**: ~$0.02-0.03 per story

---

#### GET /api/stories/[storyId]
**Description**: Get story details

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `includeIllustrations` (optional): Include illustrations array, default false

**Response** (200):
```json
{
  "story": {
    "id": "story_789",
    "heroId": "hero_123",
    "hero": {
      "id": "hero_123",
      "name": "Alice",
      "avatarUrl": "..."
    },
    "title": "Alice's Magical Bedtime",
    "content": "Once upon a time...",
    "language": "en",
    "eventType": "bedtime",
    "audioUrl": "https://files.infinitestories.app/audio/story_789.mp3",
    "audioGenerated": true,
    "audioDuration": 180.5,
    "voiceType": "nova",
    "listenCount": 5,
    "lastListenedAt": "2025-01-03T21:00:00Z",
    "isFavorite": true,
    "createdAt": "2025-01-03T20:00:00Z",
    "updatedAt": "2025-01-03T20:05:00Z",
    "illustrations": [
      {
        "id": "ill_1",
        "imageUrl": "https://files.infinitestories.app/illustrations/ill_1.png",
        "timestamp": 30.0,
        "displayOrder": 0
      }
    ]
  }
}
```

**Rate Limit**: 100 requests/minute

---

#### PATCH /api/stories/[storyId]
**Description**: Update story content

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated story content...",
  "isFavorite": true,
  "regenerateAudio": true
}
```

**Response** (200):
```json
{
  "story": {
    "id": "story_789",
    ...
    "audioGenerated": false,
    "updatedAt": "2025-01-04T16:00:00Z"
  },
  "jobs": {
    "audioRegeneration": {
      "queued": true
    }
  }
}
```

**Side Effects**:
- If content changed and `regenerateAudio: true`, audio generation is queued
- Old audio file marked for deletion

**Rate Limit**: 20 requests/minute

---

#### DELETE /api/stories/[storyId]
**Description**: Delete story

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true
}
```

**Side Effects**:
- Story record deleted
- Audio file deleted from R2 (async)
- All illustrations deleted (cascade)
- Illustration files deleted from R2 (async)

**Rate Limit**: 10 requests/minute

---

#### POST /api/stories/[storyId]/listen
**Description**: Increment listen counter

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "listenCount": 6,
  "lastListenedAt": "2025-01-04T16:30:00Z"
}
```

**Rate Limit**: 100 requests/minute

---

### 6.4 Audio Endpoints

#### POST /api/stories/[storyId]/audio
**Description**: Generate or regenerate audio

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "voice": "nova",
  "priority": "normal"
}
```

**Validation Rules**:
- `voice`: Optional, must be in [nova, echo, alloy, fable, onyx, shimmer, coral]
- `priority`: Optional, [low, normal, high], default "normal"

**Response** (202):
```json
{
  "job": {
    "id": "job_abc",
    "status": "queued",
    "estimatedCompletionTime": "2025-01-04T16:35:00Z"
  }
}
```

**Process Flow**:
1. Validate story exists and user owns it
2. Queue audio generation job
3. Background: Generate MP3 with OpenAI TTS-1 (~30-60s)
4. Background: Upload to R2
5. Background: Update story.audioUrl
6. Background: Calculate and store duration

**Rate Limit**: 20 requests/hour per user

**Cost**: ~$0.01-0.02 per generation (based on character count)

---

#### GET /api/stories/[storyId]/audio/status
**Description**: Check audio generation status

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "audioGenerated": true,
  "audioUrl": "https://files.infinitestories.app/audio/story_789.mp3",
  "audioDuration": 180.5,
  "generatedAt": "2025-01-03T20:05:00Z"
}
```

or if still generating:

```json
{
  "audioGenerated": false,
  "job": {
    "status": "processing",
    "progress": 75,
    "estimatedCompletionTime": "2025-01-04T16:35:00Z"
  }
}
```

**Rate Limit**: 100 requests/minute

---

### 6.5 Illustration Endpoints

#### POST /api/stories/[storyId]/illustrations
**Description**: Generate illustrations for story

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "count": 3,
  "sceneTimestamps": [30.0, 90.0, 150.0],
  "priority": "normal"
}
```

**Validation Rules**:
- `count`: Optional, 1-5, default 3 (auto-detected from story length)
- `sceneTimestamps`: Optional, auto-generated if not provided
- `priority`: Optional, [low, normal, high]

**Response** (202):
```json
{
  "job": {
    "id": "job_xyz",
    "status": "queued",
    "illustrationCount": 3,
    "estimatedCompletionTime": "2025-01-04T16:40:00Z"
  }
}
```

**Process Flow**:
1. Extract scenes from story content using GPT-4o
2. Determine optimal timestamps for illustrations
3. Queue illustration generation job
4. Background: Generate first illustration with hero's generationId
5. Background: Generate subsequent illustrations with chaining
6. Background: Upload each to R2
7. Background: Create StoryIllustration records

**Rate Limit**: 5 requests/hour per user

**Cost**: ~$0.12-0.15 per story (3 illustrations × $0.04)

---

#### GET /api/stories/[storyId]/illustrations
**Description**: List story illustrations

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "illustrations": [
    {
      "id": "ill_1",
      "imageUrl": "https://files.infinitestories.app/illustrations/ill_1.png",
      "timestamp": 30.0,
      "duration": 60.0,
      "displayOrder": 0,
      "generationStatus": "completed",
      "createdAt": "2025-01-03T20:10:00Z"
    },
    {
      "id": "ill_2",
      "imageUrl": "https://files.infinitestories.app/illustrations/ill_2.png",
      "timestamp": 90.0,
      "duration": 60.0,
      "displayOrder": 1,
      "generationStatus": "completed",
      "createdAt": "2025-01-03T20:12:00Z"
    }
  ],
  "totalDuration": 180.5
}
```

**Rate Limit**: 100 requests/minute

---

#### GET /api/stories/[storyId]/illustrations/status
**Description**: Check illustration generation progress

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "status": "processing",
  "progress": {
    "completed": 2,
    "total": 3,
    "percentage": 66
  },
  "illustrations": [
    {
      "id": "ill_1",
      "generationStatus": "completed"
    },
    {
      "id": "ill_2",
      "generationStatus": "completed"
    },
    {
      "id": "ill_3",
      "generationStatus": "generating"
    }
  ],
  "estimatedCompletionTime": "2025-01-04T16:38:00Z"
}
```

**Rate Limit**: 60 requests/minute

---

#### DELETE /api/stories/[storyId]/illustrations/[illustrationId]
**Description**: Delete specific illustration

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true
}
```

**Side Effects**:
- Illustration record deleted
- Image file deleted from R2 (async)
- Display order of remaining illustrations adjusted

**Rate Limit**: 20 requests/minute

---

### 6.6 User Endpoints

#### GET /api/user/profile
**Description**: Get user profile and preferences

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "user": {
    "id": "user_abc",
    "email": "user@example.com",
    "name": "John Doe",
    "preferredLanguage": "en",
    "themePreference": "dark",
    "subscriptionTier": "free",
    "subscriptionExpiry": null,
    "monthlyStoriesUsed": 5,
    "monthlyStoriesLimit": 10,
    "createdAt": "2025-01-01T10:00:00Z",
    "lastSeenAt": "2025-01-04T16:00:00Z"
  }
}
```

**Rate Limit**: 100 requests/minute

---

#### PATCH /api/user/profile
**Description**: Update user preferences

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "John Updated",
  "preferredLanguage": "es",
  "themePreference": "light"
}
```

**Response** (200):
```json
{
  "user": {
    ...
    "name": "John Updated",
    "preferredLanguage": "es",
    "themePreference": "light",
    "updatedAt": "2025-01-04T17:00:00Z"
  }
}
```

**Rate Limit**: 20 requests/minute

---

#### GET /api/user/usage
**Description**: Get usage statistics and costs

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `period` (optional): `current_month|last_month|all_time`, default `current_month`

**Response** (200):
```json
{
  "period": "current_month",
  "summary": {
    "totalCost": 0.85,
    "storiesGenerated": 5,
    "audioGenerated": 5,
    "imagesGenerated": 8,
    "totalTokensUsed": 45000
  },
  "breakdown": [
    {
      "operation": "story_generation",
      "count": 5,
      "cost": 0.15,
      "tokensUsed": 10000
    },
    {
      "operation": "audio_synthesis",
      "count": 5,
      "cost": 0.08,
      "tokensUsed": null
    },
    {
      "operation": "image_generation",
      "count": 8,
      "cost": 0.32,
      "tokensUsed": null
    }
  ],
  "limits": {
    "storiesUsed": 5,
    "storiesLimit": 10,
    "percentage": 50
  }
}
```

**Rate Limit**: 60 requests/minute

---

### 6.7 File Upload Endpoints

#### POST /api/files/upload
**Description**: Get pre-signed URL for file upload

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "fileName": "avatar.png",
  "mimeType": "image/png",
  "fileSize": 524288,
  "category": "avatar"
}
```

**Validation Rules**:
- `fileName`: Required, max 255 chars
- `mimeType`: Required, must be allowed type
- `fileSize`: Required, max 10MB for images, 50MB for audio
- `category`: Required, must be in [avatar, illustration, audio, pictogram]

**Response** (200):
```json
{
  "uploadUrl": "https://infinite-stories.r2.cloudflarestorage.com/...",
  "storageKey": "avatars/abc123def456.png",
  "publicUrl": "https://files.infinitestories.app/avatars/abc123def456.png",
  "expiresAt": "2025-01-04T18:00:00Z"
}
```

**Upload Flow**:
1. Client calls `/api/files/upload` to get pre-signed URL
2. Client uploads file directly to R2 using pre-signed URL
3. Client confirms upload by calling the relevant endpoint (e.g., `/api/heroes/[id]/avatar`)

**Rate Limit**: 100 requests/minute

---

## 7. Authentication & Authorization

### Better Auth Setup

#### Installation
```bash
npm install better-auth @better-auth/prisma
```

#### Configuration (`/lib/auth.ts`)
```typescript
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    generateSessionToken: () => {
      return crypto.randomBytes(32).toString("hex")
    }
  }
})
```

### Session Management

#### Session Storage
- Sessions stored in `Session` table
- Token is randomly generated 32-byte hex string
- Sessions expire after 30 days of inactivity
- Session refresh on each request (if >24h since last update)

#### Session Validation Middleware
```typescript
// /middleware.ts
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", session.user.id)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"]
}
```

### Authorization Patterns

#### Row-Level Security
All queries must filter by `userId`:
```typescript
const heroes = await prisma.hero.findMany({
  where: { userId: session.user.id }
})
```

#### Resource Ownership Validation
```typescript
const hero = await prisma.hero.findFirst({
  where: {
    id: params.heroId,
    userId: session.user.id
  }
})

if (!hero) {
  return NextResponse.json(
    { error: "Hero not found" },
    { status: 404 }
  )
}
```

---

## 8. File Storage with Cloudflare R2

### R2 Setup

#### Bucket Configuration
- **Bucket Name**: `infinite-stories`
- **Public Access**: Enabled via custom domain
- **Custom Domain**: `files.infinitestories.app`
- **CORS**: Configured for direct uploads

#### Folder Structure
```
infinite-stories/
├── avatars/
│   └── {hash}.png
├── audio/
│   └── {hash}.mp3
├── illustrations/
│   ├── {hash}.png
│   └── {hash}.png
└── pictograms/
    └── {hash}.png
```

### Storage Service (`/lib/storage.ts`)

```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

export async function uploadFile({
  file,
  fileName,
  mimeType,
  category
}: {
  file: Buffer
  fileName: string
  mimeType: string
  category: string
}) {
  const hash = crypto.randomBytes(16).toString("hex")
  const extension = fileName.split(".").pop()
  const storageKey = `${category}/${hash}.${extension}`

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
      Body: file,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000"
    })
  )

  return {
    storageKey,
    url: `${PUBLIC_URL}/${storageKey}`,
    fileSize: file.length
  }
}

export async function deleteFile(storageKey: string) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey
    })
  )
}

export async function getUploadUrl(
  fileName: string,
  mimeType: string,
  category: string
): Promise<{ uploadUrl: string; storageKey: string; publicUrl: string }> {
  const hash = crypto.randomBytes(16).toString("hex")
  const extension = fileName.split(".").pop()
  const storageKey = `${category}/${hash}.${extension}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
    ContentType: mimeType
  })

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600
  })

  return {
    uploadUrl,
    storageKey,
    publicUrl: `${PUBLIC_URL}/${storageKey}`
  }
}
```

### Upload Flow

#### Direct Upload (Recommended)
1. Client requests pre-signed URL: `POST /api/files/upload`
2. Server generates pre-signed URL (expires in 1 hour)
3. Client uploads file directly to R2
4. Client confirms upload to relevant endpoint
5. Server creates FileUpload record

#### Server Upload (For Generated Content)
1. Server generates content (avatar, audio, illustration)
2. Server uploads directly to R2
3. Server stores URL in database

---

## 9. OpenAI Integration

### Service Layer (`/lib/openai-service.ts`)

```typescript
import OpenAI from "openai"
import { prisma } from "./prisma"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function generateStory({
  heroName,
  heroAge,
  heroTraits,
  heroAppearance,
  eventType,
  language,
  userId
}: {
  heroName: string
  heroAge: number
  heroTraits: string[]
  heroAppearance: string
  eventType: string
  language: string
  userId: string
}): Promise<{ content: string; title: string }> {
  const prompt = buildStoryPrompt({
    heroName,
    heroAge,
    heroTraits,
    heroAppearance,
    eventType,
    language
  })

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a master children's storyteller."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 2000
  })

  const content = response.choices[0].message.content!

  // Extract title (first line)
  const lines = content.split("\n")
  const title = lines[0].replace(/^#\s*/, "")
  const storyContent = lines.slice(1).join("\n").trim()

  // Log usage
  await logUsage({
    userId,
    operation: "story_generation",
    cost: calculateGPT4Cost(response.usage!),
    tokensUsed: response.usage!.total_tokens
  })

  return { content: storyContent, title }
}

export async function generateAudio({
  text,
  voice,
  userId
}: {
  text: string
  voice: string
  userId: string
}): Promise<Buffer> {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: voice as any,
    input: text,
    response_format: "mp3"
  })

  const buffer = Buffer.from(await mp3.arrayBuffer())

  await logUsage({
    userId,
    operation: "audio_synthesis",
    cost: (text.length / 1000) * 0.015,
    tokensUsed: null
  })

  return buffer
}

export async function generateImage({
  prompt,
  userId,
  previousGenerationId
}: {
  prompt: string
  userId: string
  previousGenerationId?: string
}): Promise<{ imageBuffer: Buffer; generationId: string }> {
  const filteredPrompt = await filterContentForSafety(prompt)

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: filteredPrompt,
    size: "1024x1024",
    quality: "standard",
    response_format: "b64_json",
    ...(previousGenerationId && {
      previous_generation_id: previousGenerationId
    })
  })

  const imageData = response.data[0]
  const imageBuffer = Buffer.from(imageData.b64_json!, "base64")
  const generationId = imageData.generation_id || crypto.randomUUID()

  await logUsage({
    userId,
    operation: "image_generation",
    cost: 0.04,
    tokensUsed: null
  })

  return { imageBuffer, generationId }
}

async function logUsage(data: {
  userId: string
  operation: string
  cost: number
  tokensUsed: number | null
}) {
  await prisma.usageMetric.create({
    data: {
      ...data,
      metadata: JSON.stringify({ timestamp: new Date().toISOString() })
    }
  })
}

function calculateGPT4Cost(usage: {
  prompt_tokens: number
  completion_tokens: number
}): number {
  const inputCost = (usage.prompt_tokens / 1_000_000) * 5.0
  const outputCost = (usage.completion_tokens / 1_000_000) * 15.0
  return inputCost + outputCost
}
```

### Content Safety Filter

```typescript
// /lib/content-filter.ts
const DANGEROUS_TERMS = {
  en: {
    alone: "with friends",
    isolated: "exploring",
    abandoned: "on an adventure",
    lost: "discovering",
    scared: "excited",
    violence: "challenge",
    weapon: "tool",
    hurt: "helped",
    danger: "excitement",
    nightmare: "dream"
  },
  es: {
    solo: "con amigos",
    abandonado: "en una aventura",
    perdido: "descubriendo",
    asustado: "emocionado"
  },
  // Add more languages...
}

export async function filterContentForSafety(
  prompt: string,
  language: string = "en"
): Promise<string> {
  let filtered = prompt
  const terms = DANGEROUS_TERMS[language] || DANGEROUS_TERMS.en

  for (const [dangerous, safe] of Object.entries(terms)) {
    const regex = new RegExp(`\\b${dangerous}\\b`, "gi")
    filtered = filtered.replace(regex, safe)
  }

  return filtered
}
```

### Multi-Turn Image Generation

```typescript
export async function generateStoryIllustrations({
  storyId,
  heroId,
  scenes,
  userId
}: {
  storyId: string
  heroId: string
  scenes: Array<{ description: string; timestamp: number }>
  userId: string
}): Promise<StoryIllustration[]> {
  const hero = await prisma.hero.findUnique({
    where: { id: heroId },
    include: { visualProfile: true }
  })

  if (!hero) throw new Error("Hero not found")

  const illustrations: StoryIllustration[] = []
  let previousGenerationId = hero.avatarGenerationId || undefined

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]

    // Build prompt with hero consistency
    const prompt = buildIllustrationPrompt({
      sceneDescription: scene.description,
      heroName: hero.name,
      visualProfile: hero.visualProfile
    })

    // Generate with chaining
    const { imageBuffer, generationId } = await generateImage({
      prompt,
      userId,
      previousGenerationId
    })

    // Upload to R2
    const { url, storageKey } = await uploadFile({
      file: imageBuffer,
      fileName: `illustration_${i}.png`,
      mimeType: "image/png",
      category: "illustrations"
    })

    // Create illustration record
    const illustration = await prisma.storyIllustration.create({
      data: {
        storyId,
        imageUrl: url,
        dallePrompt: prompt,
        generationId,
        timestamp: scene.timestamp,
        displayOrder: i,
        generationStatus: "completed"
      }
    })

    illustrations.push(illustration)
    previousGenerationId = generationId // Chain for next iteration
  }

  return illustrations
}
```

---

## 10. Rate Limiting & Cost Control

### Redis-Based Rate Limiting (`/lib/rate-limit.ts`)

```typescript
import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()

export async function checkRateLimit(
  userId: string,
  operation: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `ratelimit:${userId}:${operation}`
  const now = Date.now()
  const windowStart = now - windowMs

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart)

  // Count recent requests
  const count = await redis.zcard(key)

  const allowed = count < maxRequests
  const remaining = Math.max(0, maxRequests - count - 1)
  const resetAt = new Date(now + windowMs)

  if (allowed) {
    // Add current request
    await redis.zadd(key, {
      score: now,
      member: `${now}-${Math.random()}`
    })
    await redis.expire(key, Math.ceil(windowMs / 1000))
  }

  return { allowed, remaining, resetAt }
}
```

### Rate Limit Configuration

| Operation | Limit | Window | Annual Cost Impact |
|-----------|-------|--------|-------------------|
| Story Generation | 10 | 1 hour | $2.40/user (120/year) |
| Audio Synthesis | 20 | 1 hour | $2.40/user (240/year) |
| Image Generation | 5 | 1 hour | $2.40/user (60/year) |
| API Requests | 100 | 1 minute | N/A |

### Usage Monitoring

#### Monthly Reset Job
```typescript
// /jobs/reset-monthly-usage.ts
import { prisma } from "@/lib/prisma"

export async function resetMonthlyUsage() {
  await prisma.user.updateMany({
    data: {
      monthlyStoriesUsed: 0
    }
  })

  console.log("Monthly usage reset complete")
}

// Run via cron on 1st of each month
```

#### Usage Alert System
```typescript
export async function checkUsageAlerts(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) return

  const usagePercentage =
    (user.monthlyStoriesUsed / user.monthlyStoriesLimit) * 100

  if (usagePercentage >= 80 && usagePercentage < 100) {
    await sendEmail({
      to: user.email,
      subject: "Approaching story limit",
      body: `You've used ${user.monthlyStoriesUsed} of ${user.monthlyStoriesLimit} stories this month.`
    })
  } else if (usagePercentage >= 100) {
    await sendEmail({
      to: user.email,
      subject: "Monthly story limit reached",
      body: "You've reached your monthly story limit. Upgrade to continue generating stories."
    })
  }
}
```

---

## 11. Security Requirements

### Input Validation

#### Zod Schemas
```typescript
import { z } from "zod"

export const createHeroSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().min(1).max(18),
  traits: z.array(z.string()).min(1).max(5),
  appearance: z.string().max(500),
  abilities: z.array(z.string()).max(3)
})

export const createStorySchema = z.object({
  heroId: z.string().cuid(),
  eventType: z.string().optional(),
  customEventId: z.string().cuid().optional(),
  language: z.enum(["en", "es", "fr", "de", "it"]),
  generateAudio: z.boolean().default(true),
  generateIllustrations: z.boolean().default(false),
  illustrationCount: z.number().int().min(1).max(5).default(3)
})
```

### HTTPS & Secure Cookies

#### Production Configuration
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          }
        ]
      }
    ]
  }
}
```

### API Key Security

#### Environment Variables Only
```bash
# .env (NEVER commit this file)
OPENAI_API_KEY="sk-..."
DATABASE_URL="postgresql://..."
R2_SECRET_ACCESS_KEY="..."
```

#### Key Rotation Schedule
- OpenAI API key: Rotate every 90 days
- R2 credentials: Rotate every 180 days
- Better Auth secret: Rotate every 365 days

### Data Privacy (GDPR)

#### Data Export Endpoint
```typescript
// GET /api/user/export
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return unauthorized()

  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      heroes: {
        include: {
          stories: true,
          visualProfile: true
        }
      },
      customEvents: true,
      usageMetrics: true
    }
  })

  return NextResponse.json(userData, {
    headers: {
      "Content-Disposition": `attachment; filename="data-export-${Date.now()}.json"`
    }
  })
}
```

#### Data Deletion Endpoint
```typescript
// DELETE /api/user/account
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return unauthorized()

  // Delete user (cascades to all related data via Prisma)
  await prisma.user.delete({
    where: { id: session.user.id }
  })

  // Queue file deletion job (async)
  await queueFileCleanup(session.user.id)

  return NextResponse.json({ success: true })
}
```

---

## 12. Performance Requirements

### Response Time Targets

| Endpoint Category | P50 | P95 | P99 |
|------------------|-----|-----|-----|
| Authentication | <100ms | <200ms | <500ms |
| Hero/Story CRUD | <150ms | <300ms | <1s |
| AI Generation (Story) | <15s | <30s | <60s |
| AI Generation (Audio) | <45s | <90s | <180s |
| AI Generation (Illustrations) | <120s | <240s | <480s |

### Database Optimization

#### Connection Pooling
```typescript
// /lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

#### Query Optimization
- Use `select` to fetch only needed fields
- Implement pagination for list endpoints
- Add indexes for frequently queried fields
- Use database connection pooling (PgBouncer)

### Caching Strategy

#### In-Memory Caching
```typescript
// /lib/cache.ts
const cache = new Map<string, { value: any; expiresAt: number }>()

export function get<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() > cached.expiresAt) {
    cache.delete(key)
    return null
  }

  return cached.value as T
}

export function set<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  })
}
```

#### Cache Invalidation
- User profile: 5 minutes
- Hero list: 30 seconds
- Story list: 30 seconds
- Usage metrics: 1 minute

---

## 13. Testing Strategy

### Unit Tests (Jest)

#### Example: Hero Service Test
```typescript
// __tests__/services/hero.test.ts
import { createHero, getHero } from "@/services/hero"
import { prisma } from "@/lib/prisma"

jest.mock("@/lib/prisma")

describe("Hero Service", () => {
  describe("createHero", () => {
    it("creates a hero with valid data", async () => {
      const mockHero = {
        id: "hero_123",
        name: "Alice",
        age: 7,
        traits: ["brave"],
        appearance: "Curly hair",
        abilities: []
      }

      ;(prisma.hero.create as jest.Mock).mockResolvedValue(mockHero)

      const result = await createHero({
        userId: "user_123",
        ...mockHero
      })

      expect(result).toEqual(mockHero)
    })

    it("throws error with invalid age", async () => {
      await expect(
        createHero({
          userId: "user_123",
          name: "Bob",
          age: 25, // Invalid
          traits: ["brave"],
          appearance: "Tall",
          abilities: []
        })
      ).rejects.toThrow("Invalid age")
    })
  })
})
```

### Integration Tests

#### Example: Story Generation Flow
```typescript
// __tests__/integration/story-flow.test.ts
describe("Story Generation Flow", () => {
  it("generates story with audio and illustrations", async () => {
    // 1. Create user and hero
    const user = await createTestUser()
    const hero = await createTestHero(user.id)

    // 2. Generate story
    const storyResponse = await fetch("/api/stories", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.sessionToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        heroId: hero.id,
        eventType: "bedtime",
        language: "en",
        generateAudio: true,
        generateIllustrations: true,
        illustrationCount: 3
      })
    })

    expect(storyResponse.status).toBe(201)
    const { story } = await storyResponse.json()

    // 3. Wait for audio generation
    await waitForAudioGeneration(story.id, 60000)

    // 4. Verify audio URL exists
    const storyWithAudio = await fetch(`/api/stories/${story.id}`, {
      headers: {
        Authorization: `Bearer ${user.sessionToken}`
      }
    })
    const { story: finalStory } = await storyWithAudio.json()

    expect(finalStory.audioUrl).toBeTruthy()
    expect(finalStory.illustrations.length).toBe(3)
  }, 120000) // 2 minute timeout
})
```

### E2E Tests (Playwright)

#### Example: User Signup to Story Generation
```typescript
// e2e/user-flow.spec.ts
import { test, expect } from "@playwright/test"

test("complete user flow from signup to story", async ({ page }) => {
  // Signup
  await page.goto("/signup")
  await page.fill('input[name="email"]', "test@example.com")
  await page.fill('input[name="password"]', "Password123!")
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL("/dashboard")

  // Create hero
  await page.click('button:has-text("Create Hero")')
  await page.fill('input[name="name"]', "Alice")
  await page.fill('input[name="age"]', "7")
  await page.click('button:has-text("Next")')
  // ... continue flow

  // Generate story
  await page.click('button:has-text("Generate Story")')
  await expect(page.locator(".story-content")).toBeVisible({ timeout: 30000 })
})
```

### Load Testing (k6)

```javascript
// k6-load-test.js
import http from "k6/http"
import { check, sleep } from "k6"

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 0 }    // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests < 500ms
    http_req_failed: ["rate<0.01"]    // Error rate < 1%
  }
}

export default function() {
  // Test hero list endpoint
  const res = http.get("https://api.infinitestories.app/api/heroes", {
    headers: {
      Authorization: `Bearer ${__ENV.TEST_TOKEN}`
    }
  })

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500
  })

  sleep(1)
}
```

---

## 14. Implementation Phases

### Phase 1: Foundation (Week 1)

#### Tasks
1. **Database Setup**
   - [ ] Install Prisma and PostgreSQL adapter
   - [ ] Create initial Prisma schema
   - [ ] Run first migration: `npx prisma migrate dev --name init`
   - [ ] Generate Prisma Client
   - [ ] Test database connection

2. **Better Auth Configuration**
   - [ ] Install Better Auth packages
   - [ ] Configure email/password authentication
   - [ ] Create auth routes: `/api/auth/[...all]`
   - [ ] Implement middleware for protected routes
   - [ ] Test signup, login, logout flows

3. **Cloudflare R2 Setup**
   - [ ] Create R2 bucket
   - [ ] Configure custom domain and CORS
   - [ ] Implement storage utilities (upload, delete, getSignedUrl)
   - [ ] Test file upload and access

4. **Environment Configuration**
   - [ ] Set up development `.env`
   - [ ] Document all required environment variables
   - [ ] Create `.env.example` template

**Deliverables**:
- Working database with all tables
- Functional authentication system
- File upload/download working
- Environment properly configured

---

### Phase 2: Core API Implementation (Week 2-3)

#### Week 2: Hero & Story Endpoints

**Tasks**:
1. **Hero CRUD**
   - [ ] `GET /api/heroes` - List heroes
   - [ ] `POST /api/heroes` - Create hero
   - [ ] `GET /api/heroes/[heroId]` - Get hero
   - [ ] `PATCH /api/heroes/[heroId]` - Update hero
   - [ ] `DELETE /api/heroes/[heroId]` - Delete hero
   - [ ] Add input validation with Zod
   - [ ] Implement ownership checks
   - [ ] Write unit tests

2. **Story CRUD**
   - [ ] `GET /api/stories` - List stories
   - [ ] `POST /api/stories` - Create story (without AI for now)
   - [ ] `GET /api/stories/[storyId]` - Get story
   - [ ] `PATCH /api/stories/[storyId]` - Update story
   - [ ] `DELETE /api/stories/[storyId]` - Delete story
   - [ ] Add filtering and pagination
   - [ ] Write unit tests

**Deliverables**:
- Full CRUD for heroes and stories
- Input validation on all endpoints
- Unit test coverage >80%

#### Week 3: Audio & Illustrations

**Tasks**:
1. **Audio Endpoints**
   - [ ] `POST /api/stories/[storyId]/audio` - Generate audio
   - [ ] `GET /api/stories/[storyId]/audio/status` - Check status
   - [ ] Implement background job queue
   - [ ] Test audio generation flow

2. **Illustration Endpoints**
   - [ ] `POST /api/stories/[storyId]/illustrations` - Generate
   - [ ] `GET /api/stories/[storyId]/illustrations` - List
   - [ ] `GET /api/stories/[storyId]/illustrations/status` - Check progress
   - [ ] `DELETE /api/stories/[storyId]/illustrations/[id]` - Delete
   - [ ] Test illustration generation

3. **User Management**
   - [ ] `GET /api/user/profile` - Get profile
   - [ ] `PATCH /api/user/profile` - Update preferences
   - [ ] `GET /api/user/usage` - Usage statistics

**Deliverables**:
- Audio generation working end-to-end
- Illustration generation with multi-turn
- User profile management

---

### Phase 3: OpenAI Integration & Services (Week 3-4)

#### Tasks

1. **OpenAI Service Layer**
   - [ ] Implement `generateStory()` with GPT-4o
   - [ ] Port story prompt builder from iOS
   - [ ] Implement scene extraction
   - [ ] Implement `generateAudio()` with TTS-1
   - [ ] Implement `generateImage()` with DALL-E-3
   - [ ] Add multi-turn image generation logic
   - [ ] Test all OpenAI integrations

2. **Content Safety**
   - [ ] Port ContentPolicyFilter from iOS
   - [ ] Implement multi-language filtering
   - [ ] Test with various prompts
   - [ ] Add logging for filtered content

3. **Rate Limiting**
   - [ ] Set up Upstash Redis
   - [ ] Implement rate limit checker
   - [ ] Add rate limiting to all AI endpoints
   - [ ] Test rate limit enforcement
   - [ ] Add rate limit headers to responses

4. **Usage Tracking**
   - [ ] Log all OpenAI API calls
   - [ ] Calculate and store costs
   - [ ] Implement usage dashboard
   - [ ] Add monthly reset job
   - [ ] Implement usage alerts

5. **Background Jobs**
   - [ ] Set up job queue system
   - [ ] Implement audio generation job
   - [ ] Implement illustration generation job
   - [ ] Add job monitoring and retries

**Deliverables**:
- Full OpenAI integration working
- Content safety filtering active
- Rate limiting enforced
- Usage tracking and alerts

---

### Phase 4: Testing & Deployment (Week 5-6)

#### Week 5: Testing

**Tasks**:
1. **Unit Tests**
   - [ ] Services layer (>90% coverage)
   - [ ] Utilities (>90% coverage)
   - [ ] API route handlers (>80% coverage)

2. **Integration Tests**
   - [ ] Complete user flows
   - [ ] Story generation pipeline
   - [ ] Audio + illustration generation
   - [ ] Error scenarios

3. **E2E Tests**
   - [ ] Signup to first story
   - [ ] Hero management
   - [ ] Story library browsing
   - [ ] Profile management

4. **Load Testing**
   - [ ] k6 scripts for all endpoints
   - [ ] Test with 100 concurrent users
   - [ ] Identify bottlenecks
   - [ ] Optimize slow queries

**Deliverables**:
- Test coverage >85%
- All critical flows tested
- Performance benchmarks documented

#### Week 6: Deployment

**Tasks**:
1. **Production Setup**
   - [ ] Deploy to Vercel
   - [ ] Configure production PostgreSQL (Supabase/Neon)
   - [ ] Set up production R2 bucket
   - [ ] Configure production environment variables
   - [ ] Set up custom domain

2. **Monitoring & Alerts**
   - [ ] Configure Sentry error tracking
   - [ ] Set up Vercel Analytics
   - [ ] Create cost monitoring dashboard
   - [ ] Configure Slack/email alerts

3. **Security Hardening**
   - [ ] Enable HTTPS-only cookies
   - [ ] Configure CORS for iOS app
   - [ ] Add security headers
   - [ ] Enable database connection pooling
   - [ ] Review and rotate secrets

4. **Documentation**
   - [ ] API documentation (Swagger)
   - [ ] iOS SDK integration guide
   - [ ] Deployment runbook
   - [ ] Incident response playbook

**Deliverables**:
- Production deployment live
- Monitoring and alerts active
- Documentation complete
- Ready for iOS integration

---

## 15. Task Breakdown for Agents

### Epic 1: Database & Authentication

#### Task 1.1: Prisma Schema Setup
**Acceptance Criteria**:
- [ ] Prisma schema created with all models
- [ ] Relationships defined correctly
- [ ] Indexes added for performance
- [ ] Initial migration runs successfully
- [ ] Prisma Client generates without errors

**Estimated Effort**: 4 hours

---

#### Task 1.2: Better Auth Implementation
**Acceptance Criteria**:
- [ ] Better Auth installed and configured
- [ ] Email/password auth working
- [ ] Session management functional
- [ ] Middleware protects API routes
- [ ] Auth endpoints return correct responses

**Estimated Effort**: 6 hours

---

#### Task 1.3: Authentication Middleware
**Acceptance Criteria**:
- [ ] Middleware validates sessions
- [ ] User ID injected into request headers
- [ ] Unauthorized requests return 401
- [ ] Public routes bypassed correctly

**Estimated Effort**: 3 hours

---

### Epic 2: File Storage

#### Task 2.1: R2 Setup & Configuration
**Acceptance Criteria**:
- [ ] R2 bucket created
- [ ] Custom domain configured
- [ ] CORS policy set up
- [ ] Connection tested successfully

**Estimated Effort**: 2 hours

---

#### Task 2.2: Storage Utilities
**Acceptance Criteria**:
- [ ] `uploadFile()` function implemented
- [ ] `deleteFile()` function implemented
- [ ] `getUploadUrl()` function implemented
- [ ] All functions handle errors gracefully
- [ ] Unit tests written

**Estimated Effort**: 4 hours

---

### Epic 3: Hero Management

#### Task 3.1: Hero List Endpoint
**Acceptance Criteria**:
- [ ] `GET /api/heroes` returns user's heroes
- [ ] Pagination implemented
- [ ] Sorting works correctly
- [ ] Response includes story counts
- [ ] Rate limiting applied

**Estimated Effort**: 3 hours

---

#### Task 3.2: Hero Creation Endpoint
**Acceptance Criteria**:
- [ ] `POST /api/heroes` creates hero
- [ ] Input validation with Zod
- [ ] User ownership established
- [ ] Returns created hero with correct status
- [ ] Unit tests written

**Estimated Effort**: 4 hours

---

#### Task 3.3: Hero Detail/Update/Delete
**Acceptance Criteria**:
- [ ] `GET /api/heroes/[heroId]` works
- [ ] `PATCH /api/heroes/[heroId]` updates hero
- [ ] `DELETE /api/heroes/[heroId]` deletes with cascade
- [ ] Ownership validation on all operations
- [ ] Unit tests written

**Estimated Effort**: 5 hours

---

#### Task 3.4: Avatar Generation
**Acceptance Criteria**:
- [ ] `POST /api/heroes/[heroId]/avatar` generates avatar
- [ ] DALL-E prompt built from hero attributes
- [ ] Content filtering applied
- [ ] Image uploaded to R2
- [ ] Visual profile extracted and saved
- [ ] Generation ID stored for consistency

**Estimated Effort**: 8 hours

---

### Epic 4: Story Management

#### Task 4.1: Story List Endpoint
**Acceptance Criteria**:
- [ ] `GET /api/stories` returns stories
- [ ] Filtering by hero, event, language works
- [ ] Pagination and sorting implemented
- [ ] Response includes audio/illustration status

**Estimated Effort**: 4 hours

---

#### Task 4.2: Story Generation Endpoint
**Acceptance Criteria**:
- [ ] `POST /api/stories` creates story
- [ ] Hero data fetched correctly
- [ ] GPT-4o generates story content
- [ ] Story saved to database
- [ ] Audio generation queued if requested
- [ ] Rate limiting enforced
- [ ] Usage logged

**Estimated Effort**: 8 hours

---

#### Task 4.3: Story Detail/Update/Delete
**Acceptance Criteria**:
- [ ] `GET /api/stories/[storyId]` works
- [ ] `PATCH /api/stories/[storyId]` updates
- [ ] `DELETE /api/stories/[storyId]` deletes with cascade
- [ ] Audio regeneration queued on content change
- [ ] Ownership validation

**Estimated Effort**: 5 hours

---

### Epic 5: Audio Generation

#### Task 5.1: Audio Generation Service
**Acceptance Criteria**:
- [ ] `generateAudio()` function implemented
- [ ] OpenAI TTS-1 integration working
- [ ] Voice selection supported
- [ ] MP3 buffer returned correctly
- [ ] Usage logged

**Estimated Effort**: 4 hours

---

#### Task 5.2: Audio Generation Endpoint
**Acceptance Criteria**:
- [ ] `POST /api/stories/[storyId]/audio` queues job
- [ ] Background job generates audio
- [ ] Audio uploaded to R2
- [ ] Story.audioUrl updated
- [ ] Duration calculated and stored
- [ ] Error handling for failures

**Estimated Effort**: 6 hours

---

#### Task 5.3: Audio Status Endpoint
**Acceptance Criteria**:
- [ ] `GET /api/stories/[storyId]/audio/status` works
- [ ] Returns correct status (queued/processing/completed/failed)
- [ ] Progress percentage included
- [ ] Estimated completion time calculated

**Estimated Effort**: 3 hours

---

### Epic 6: Illustration Generation

#### Task 6.1: Illustration Generation Service
**Acceptance Criteria**:
- [ ] `generateImage()` function implemented
- [ ] DALL-E-3 integration working
- [ ] Multi-turn chaining with generation IDs
- [ ] Content filtering applied
- [ ] Image buffer returned
- [ ] Usage logged

**Estimated Effort**: 6 hours

---

#### Task 6.2: Scene Extraction
**Acceptance Criteria**:
- [ ] GPT-4o extracts scenes from story
- [ ] Timestamps calculated based on word count
- [ ] Scene descriptions optimized for DALL-E
- [ ] Hero visual profile included in prompts

**Estimated Effort**: 5 hours

---

#### Task 6.3: Illustration Generation Endpoint
**Acceptance Criteria**:
- [ ] `POST /api/stories/[storyId]/illustrations` works
- [ ] Scenes extracted or timestamps provided
- [ ] Sequential generation with chaining
- [ ] Images uploaded to R2
- [ ] StoryIllustration records created
- [ ] Error handling and retries

**Estimated Effort**: 10 hours

---

#### Task 6.4: Illustration Status Endpoint
**Acceptance Criteria**:
- [ ] `GET /api/stories/[storyId]/illustrations/status` works
- [ ] Returns progress (completed/total)
- [ ] Individual illustration statuses included
- [ ] Estimated completion time calculated

**Estimated Effort**: 3 hours

---

### Epic 7: Rate Limiting & Usage

#### Task 7.1: Redis Rate Limiting
**Acceptance Criteria**:
- [ ] Upstash Redis configured
- [ ] `checkRateLimit()` function implemented
- [ ] Sliding window algorithm working
- [ ] Rate limit info in response headers
- [ ] 429 status returned when exceeded

**Estimated Effort**: 5 hours

---

#### Task 7.2: Usage Tracking
**Acceptance Criteria**:
- [ ] UsageMetric records created for all AI calls
- [ ] Costs calculated correctly
- [ ] Token usage stored
- [ ] Metadata includes relevant context

**Estimated Effort**: 4 hours

---

#### Task 7.3: Usage Dashboard
**Acceptance Criteria**:
- [ ] `GET /api/user/usage` returns statistics
- [ ] Breakdown by operation type
- [ ] Current month vs historical data
- [ ] Cost calculations accurate
- [ ] Limits and remaining quota shown

**Estimated Effort**: 5 hours

---

### Epic 8: Testing

#### Task 8.1: Unit Tests - Services
**Acceptance Criteria**:
- [ ] OpenAI service tests (>90% coverage)
- [ ] Storage service tests (>90% coverage)
- [ ] Rate limiting tests (>90% coverage)
- [ ] Auth service tests (>90% coverage)

**Estimated Effort**: 12 hours

---

#### Task 8.2: Integration Tests
**Acceptance Criteria**:
- [ ] Hero creation flow test
- [ ] Story generation flow test
- [ ] Audio generation flow test
- [ ] Illustration generation flow test
- [ ] All tests pass consistently

**Estimated Effort**: 10 hours

---

#### Task 8.3: Load Testing
**Acceptance Criteria**:
- [ ] k6 scripts for all endpoints
- [ ] 100 concurrent users tested
- [ ] Performance targets met (P95 <1s)
- [ ] Bottlenecks identified and documented

**Estimated Effort**: 8 hours

---

### Epic 9: Deployment

#### Task 9.1: Production Environment
**Acceptance Criteria**:
- [ ] Vercel deployment configured
- [ ] Production database set up
- [ ] Production R2 bucket configured
- [ ] All environment variables set
- [ ] Custom domain configured with SSL

**Estimated Effort**: 6 hours

---

#### Task 9.2: Monitoring Setup
**Acceptance Criteria**:
- [ ] Sentry error tracking configured
- [ ] Vercel Analytics enabled
- [ ] Cost monitoring dashboard created
- [ ] Alerts configured for critical metrics

**Estimated Effort**: 5 hours

---

#### Task 9.3: Documentation
**Acceptance Criteria**:
- [ ] API documentation (Swagger/OpenAPI)
- [ ] iOS integration guide
- [ ] Deployment runbook
- [ ] Incident response playbook

**Estimated Effort**: 8 hours

---

## 16. Deployment Strategy

### Development Environment
```bash
# Local development
npm run dev

# Database migrations
npx prisma migrate dev

# Seed test data
npm run db:seed
```

### Staging Environment
- **Platform**: Vercel (preview deployments)
- **Database**: Supabase (staging project)
- **R2**: Separate staging bucket
- **Domain**: `staging-api.infinitestories.app`

### Production Environment
- **Platform**: Vercel (production deployment)
- **Database**: Supabase (production project) or Neon
- **R2**: Production bucket with CDN
- **Domain**: `api.infinitestories.app`

### Production Checklist

#### Pre-Deployment
- [ ] All tests passing
- [ ] Load testing completed
- [ ] Security audit done
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Monitoring configured

#### Deployment
- [ ] Deploy to production
- [ ] Run database migrations
- [ ] Verify health check endpoint
- [ ] Test critical flows manually
- [ ] Monitor error rates for 1 hour

#### Post-Deployment
- [ ] Smoke tests pass
- [ ] No increase in error rates
- [ ] Performance metrics stable
- [ ] Update status page
- [ ] Notify team

### Rollback Plan
```bash
# Rollback to previous deployment
vercel rollback

# Rollback database migration
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 17. Success Metrics

### Technical Metrics

#### API Performance
- **P50 Response Time**: <200ms
- **P95 Response Time**: <1s
- **P99 Response Time**: <5s
- **Error Rate**: <0.5%
- **Uptime**: 99.9%

#### AI Generation
- **Story Generation Success Rate**: >98%
- **Audio Generation Success Rate**: >99%
- **Illustration Generation Success Rate**: >95%
- **Average Story Generation Time**: <15s
- **Average Audio Generation Time**: <45s
- **Average Illustration Set Time**: <120s

#### Cost Control
- **Average Cost per User**: <$1.50/month
- **Rate Limit Violation Rate**: <1%
- **Failed Generations**: <2%

### Business Metrics

#### User Engagement
- **Stories Generated per User**: 10/month (target)
- **Audio Playback Rate**: >80%
- **Illustration Request Rate**: >50%
- **User Retention (30-day)**: >60%

#### Growth Metrics
- **New Users per Week**: Track growth
- **Active Users**: Weekly/monthly active
- **Premium Conversion**: Track if/when implemented

---

## 18. Future Enhancements

### Priority 1 (Q2 2025)
- **Apple OAuth**: Seamless iOS authentication
- **Custom Events API**: User-defined story scenarios
- **Story Sharing**: Share stories between users
- **Premium Tier**: Higher limits and features

### Priority 2 (Q3 2025)
- **Web Application**: React/Next.js frontend
- **Advanced Caching**: Redis caching for frequently accessed data
- **Content Recommendations**: AI-powered story suggestions
- **Multi-language Expansion**: Additional languages

### Priority 3 (Q4 2025)
- **Android App**: Cross-platform support
- **Real-time Collaboration**: Co-create stories
- **Social Features**: Comments, likes, follows
- **Admin Dashboard**: User management and analytics

---

## 19. Appendices

### A. Environment Variables Reference

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
DATABASE_DIRECT_URL="postgresql://user:pass@host:5432/db" # For migrations

# Better Auth
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="https://api.infinitestories.app"
NEXT_PUBLIC_APP_URL="https://infinitestories.app"

# OpenAI
OPENAI_API_KEY="sk-..."

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="infinite-stories"
R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://files.infinitestories.app"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Monitoring
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="your-auth-token"

# Email (Future)
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@infinitestories.app"
```

### B. API Testing with curl

#### Authentication
```bash
# Signup
curl -X POST https://api.infinitestories.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'

# Login
curl -X POST https://api.infinitestories.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

#### Hero Operations
```bash
# Create Hero
curl -X POST https://api.infinitestories.app/api/heroes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "age": 7,
    "traits": ["brave", "kind"],
    "appearance": "Curly blonde hair, blue eyes",
    "abilities": ["magic"]
  }'

# List Heroes
curl -X GET https://api.infinitestories.app/api/heroes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Story Generation
```bash
# Generate Story
curl -X POST https://api.infinitestories.app/api/stories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heroId": "hero_123",
    "eventType": "bedtime",
    "language": "en",
    "generateAudio": true,
    "generateIllustrations": true,
    "illustrationCount": 3
  }'
```

### C. References

#### Documentation
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth](https://www.better-auth.com/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [OpenAI API](https://platform.openai.com/docs)
- [Upstash Redis](https://docs.upstash.com/redis)

#### Tools
- [Vercel](https://vercel.com/docs)
- [Supabase](https://supabase.com/docs)
- [Sentry](https://docs.sentry.io/)
- [k6 Load Testing](https://k6.io/docs/)

---

**Document End**

**Total Pages**: ~70 (estimated when printed)
**Total Sections**: 19
**Total Tasks**: ~50
**Estimated Total Implementation Time**: 6 weeks
