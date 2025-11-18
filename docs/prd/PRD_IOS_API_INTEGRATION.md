# PRD: iOS Backend API Integration with Offline Caching

**Version**: 1.0
**Date**: 2025-01-06
**Status**: Draft
**Owner**: iOS Engineering Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Background & Context](#background--context)
3. [Goals & Success Criteria](#goals--success-criteria)
4. [Related Documents](#related-documents)

---

## Executive Summary

### Overview

This PRD outlines the transition of the InfiniteStories iOS app from a **local-only architecture** to a **cloud-backed, offline-first architecture**. The app currently stores all data locally using SwiftData and makes direct OpenAI API calls. This migration will integrate the app with the existing Next.js backend API, implement robust offline caching with SwiftData, and enable multi-device synchronization.

### Key Changes

1. **Backend API Integration**: Replace direct OpenAI calls with backend API endpoints
2. **Authentication**: Implement Better Auth session management with Keychain storage
3. **Offline-First Caching**: SwiftData as intelligent cache with bidirectional sync
4. **Repository Pattern**: Clean data access layer separating business logic from data sources
5. **Media Storage**: Migrate from local files to Cloudflare R2 with local caching
6. **Code Deprecation**: Remove direct OpenAI integration and migrate to backend-proxied calls

### Timeline

**Total Duration**: 7 weeks (phased implementation)

| Phase | Duration | Focus Area |
|-------|----------|------------|
| Phase 1 | Week 1-2 | Foundation - Auth & Core Infrastructure |
| Phase 2 | Week 2-3 | Repository Layer - Data Access Abstraction |
| Phase 3 | Week 3-4 | Sync Engine - Bidirectional Synchronization |
| Phase 4 | Week 4-5 | Media Management - Cloud Storage Integration |
| Phase 5 | Week 5-6 | Offline Mode - Robust Offline Experience |
| Phase 6 | Week 6 | Migration Tool - Local Data Migration |
| Phase 7 | Week 7 | Testing & Polish - Quality Assurance |

### Success Criteria

#### User Experience
- ✅ Users can access their stories from multiple devices
- ✅ App works fully offline with automatic sync when online
- ✅ Existing users can migrate local data without loss
- ✅ UI updates instantly with optimistic updates
- ✅ Sync status clearly visible to users

#### Technical
- ✅ Zero data loss during migration
- ✅ Conflict resolution handles edge cases gracefully
- ✅ Background sync reliable and efficient
- ✅ API authentication secure with token refresh
- ✅ Media files cached intelligently with eviction policies

#### Performance
- ✅ Sync operations complete in background without blocking UI
- ✅ Optimistic updates provide instant feedback (<100ms)
- ✅ Media download progressive with loading indicators
- ✅ App startup time unchanged (<2 seconds)
- ✅ Memory usage stays within limits (cache eviction working)

#### Quality
- ✅ Test coverage >80% for critical sync paths
- ✅ No crashes or data corruption
- ✅ Error messages user-friendly and actionable
- ✅ Logging comprehensive for debugging
- ✅ Code follows iOS best practices

---

## Background & Context

### Current Architecture

#### iOS App (Local-Only)

**Data Storage**:
- **SwiftData Models**: Hero, Story, StoryIllustration, HeroVisualProfile, CustomStoryEvent
- **Local Database**: SQLite via SwiftData ModelContainer
- **Media Files**: Documents directory (Avatars, Audio, Illustrations)
- **Device-Specific**: No cloud sync, single device only

**AI Integration**:
- **Direct OpenAI API Calls**: From iOS app to OpenAI servers
- **API Key Storage**: iOS Keychain (user-provided)
- **Models Used**: GPT-4o, gpt-4o-mini-tts, GPT-Image-1
- **Services**: AIService (~1178 lines) handles all OpenAI operations

**Limitations**:
1. **Single Device**: Data locked to one device, no multi-device access
2. **No Backup**: Data loss if device lost/damaged
3. **API Key Exposure**: Users must provide and manage OpenAI API keys
4. **No User Accounts**: No authentication or personalization
5. **No Collaboration**: Cannot share heroes/stories with others
6. **Rate Limiting**: Client-side only, no centralized enforcement

#### Backend API (Existing)

**Technology Stack**:
- **Framework**: Next.js 14+ with App Router, TypeScript
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: Better Auth (migrated from Clerk)
- **Storage**: Cloudflare R2 (S3-compatible)
- **AI Integration**: Server-side OpenAI API calls
- **Rate Limiting**: Database-based tracking (ApiUsage table)

**Implemented Features**:
- User authentication with session management
- Hero CRUD with avatar generation
- Story generation with async audio/illustration processing
- Custom events management
- Rate limiting and usage tracking
- Media file upload/download via R2

**API Endpoints**:
```
Authentication:
  POST   /api/auth/sign-in
  POST   /api/auth/sign-up
  GET    /api/auth/session
  POST   /api/auth/sign-out

Heroes:
  GET    /api/heroes (list with pagination)
  POST   /api/heroes (create)
  GET    /api/heroes/[heroId]
  PATCH  /api/heroes/[heroId]
  DELETE /api/heroes/[heroId]
  POST   /api/heroes/[heroId]/avatar (generate)

Stories:
  GET    /api/stories (list with filters)
  POST   /api/stories (generate)
  GET    /api/stories/[storyId]
  PATCH  /api/stories/[storyId]
  DELETE /api/stories/[storyId]
  POST   /api/stories/[storyId]/audio
  POST   /api/stories/[storyId]/illustrations
  GET    /api/stories/[storyId]/illustrations/status

User:
  GET    /api/user/profile
  PATCH  /api/user/profile
  GET    /api/user/usage (rate limits)

Health:
  GET    /api/health
```

### Problems to Solve

#### 1. Single-Device Limitation
**Problem**: Users lose all data if they switch devices or lose their device.
**Impact**: Poor user experience, no backup safety net.
**Solution**: Cloud-backed storage with multi-device sync.

#### 2. API Key Management
**Problem**: Users must obtain and manage their own OpenAI API keys.
**Impact**: Friction in onboarding, security risks, cost unpredictability.
**Solution**: Server-side API key management, included in app subscription.

#### 3. No User Accounts
**Problem**: No personalization, no usage tracking, no social features.
**Impact**: Limited product capabilities, no monetization path.
**Solution**: Better Auth authentication with user profiles.

#### 4. Data Loss Risk
**Problem**: Local-only storage with no cloud backup.
**Impact**: Catastrophic data loss if device fails.
**Solution**: Automatic cloud sync with conflict resolution.

#### 5. Rate Limiting Challenges
**Problem**: Client-side rate limiting ineffective, no centralized control.
**Impact**: Users can abuse OpenAI API, cost overruns.
**Solution**: Backend rate limiting with database tracking.

### Proposed Solution

#### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    iOS App (SwiftUI)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              ViewModels (Business Logic)         │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │          Repository Layer (Data Access)          │   │
│  │  HeroRepository, StoryRepository, EventRepository│   │
│  └─────────┬─────────────────────────┬──────────────┘   │
│            │                         │                   │
│  ┌─────────▼─────────┐    ┌─────────▼──────────┐       │
│  │   APIClient       │    │  CacheManager      │       │
│  │ (Network Layer)   │    │ (SwiftData Layer)  │       │
│  └─────────┬─────────┘    └─────────┬──────────┘       │
│            │                         │                   │
│  ┌─────────▼─────────┐    ┌─────────▼──────────┐       │
│  │  AuthManager      │    │  SyncEngine        │       │
│  │ (Session Tokens)  │    │ (Bidirectional)    │       │
│  └───────────────────┘    └────────────────────┘       │
└─────────────┬───────────────────────────────────────────┘
              │ HTTPS (Bearer Token)
              │
┌─────────────▼───────────────────────────────────────────┐
│              Next.js Backend API (Vercel)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Better Auth (Authentication)           │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │         API Routes (RESTful Endpoints)           │   │
│  │  Heroes, Stories, Auth, User Profile, Usage     │   │
│  └─────────┬─────────────────────────┬──────────────┘   │
│            │                         │                   │
│  ┌─────────▼─────────┐    ┌─────────▼──────────┐       │
│  │   PostgreSQL      │    │  Cloudflare R2     │       │
│  │  (Prisma ORM)     │    │ (Media Storage)    │       │
│  └───────────────────┘    └────────────────────┘       │
│            │                         │                   │
│  ┌─────────▼─────────────────────────▼──────────┐       │
│  │         OpenAI API (Server-Side)             │       │
│  │  GPT-4o, gpt-4o-mini-tts, GPT-Image-1       │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

#### Key Components

**iOS App**:
1. **APIClient**: HTTP client with auth, retries, error handling
2. **AuthManager**: Better Auth integration, session token management
3. **Repository Layer**: HeroRepository, StoryRepository, CustomEventRepository
4. **CacheManager**: SwiftData wrapper with sync metadata
5. **SyncEngine**: Bidirectional sync with conflict resolution
6. **MediaCacheManager**: R2 file caching with eviction policies

**Backend API** (Already Implemented):
1. **Better Auth**: User authentication with session management
2. **API Routes**: RESTful endpoints for all operations
3. **Prisma ORM**: Database access with type safety
4. **R2 Client**: Media file upload/download
5. **Rate Limiter**: Usage tracking and enforcement
6. **OpenAI Service**: Server-side AI operations

---

## Goals & Success Criteria

### Primary Goals

#### Goal 1: Multi-Device Access
**Description**: Users can access their heroes and stories from any iOS device.
**Success Criteria**:
- User signs in on Device A, creates hero
- User signs in on Device B, sees same hero
- Changes on either device sync within 30 seconds
- Media files (avatars, audio) download on demand

#### Goal 2: Robust Offline Mode
**Description**: App fully functional offline with automatic sync when online.
**Success Criteria**:
- All CRUD operations work offline
- Changes queued and synced when network available
- Offline indicator visible to user
- No data loss during network transitions
- Sync conflicts resolved gracefully

#### Goal 3: Secure Authentication
**Description**: User accounts with secure session management.
**Success Criteria**:
- Sign up/sign in with email + password
- Session token stored in Keychain
- Automatic token refresh before expiry
- Sign out clears all sensitive data
- No API keys exposed in iOS app

#### Goal 4: Zero Data Loss Migration
**Description**: Existing users can migrate local data to cloud without loss.
**Success Criteria**:
- Migration tool exports all local data
- Upload to backend with progress tracking
- All heroes, stories, media files preserved
- Rollback on failure (keep local data)
- Migration resumable after interruption

#### Goal 5: Improved Performance
**Description**: Cloud-backed architecture doesn't degrade performance.
**Success Criteria**:
- Optimistic updates provide instant feedback
- Background sync doesn't block UI
- Media files cached for quick access
- App startup time unchanged
- Memory usage within limits

### Secondary Goals

#### Goal 6: Code Quality
**Description**: Clean, maintainable, testable architecture.
**Success Criteria**:
- Repository pattern for data access
- Protocol-based design for testing
- Test coverage >80% for sync paths
- Clear separation of concerns
- Comprehensive logging for debugging

#### Goal 7: User Experience
**Description**: Transparent sync with clear status indicators.
**Success Criteria**:
- Sync status visible in UI
- Progress indicators for long operations
- User-friendly error messages
- Conflict resolution UI when needed
- Settings to control sync behavior

#### Goal 8: Cost Optimization
**Description**: Efficient use of backend resources and OpenAI API.
**Success Criteria**:
- Rate limiting prevents abuse
- Media files cached to reduce bandwidth
- Batch operations for efficiency
- Incremental sync (not full sync every time)
- Usage tracking for monitoring

---

## Related Documents

This PRD is part of a comprehensive documentation set. Please refer to the following documents for detailed implementation guidance:

### Core Documentation

1. **[Code Deprecation Strategy](./PRD_IOS_API_INTEGRATION_DEPRECATION.md)**
   - Files to deprecate/remove/replace
   - Deprecation timeline with phases
   - Backward compatibility strategy
   - Feature flag approach
   - Migration path for old code

2. **[Technical Architecture](./PRD_IOS_API_INTEGRATION_ARCHITECTURE.md)**
   - Detailed architecture diagrams
   - Component design and interactions
   - Protocol definitions
   - Data flow documentation
   - Error handling patterns

3. **[Implementation Phases](./PRD_IOS_API_INTEGRATION_IMPLEMENTATION.md)**
   - 7-week phased rollout plan
   - Week-by-week tasks and deliverables
   - Dependencies and milestones
   - Acceptance criteria per phase
   - Rollback strategies

4. **[Offline Caching & Sync Strategy](./PRD_IOS_API_INTEGRATION_SYNC.md)**
   - SwiftData sync metadata schema
   - Cache policies and invalidation
   - Conflict resolution strategies
   - Optimistic update patterns
   - Background sync implementation

5. **[Migration & Testing](./PRD_IOS_API_INTEGRATION_MIGRATION.md)**
   - Local data migration workflow
   - Migration UI design
   - Rollback mechanisms
   - Testing strategy (unit, integration, UI)
   - Performance benchmarks

### Supporting Documentation

6. **Backend API Documentation** (in `infinite-stories-backend/`)
   - API endpoint specifications
   - Request/response schemas
   - Authentication flow
   - Rate limiting policies
   - Error codes and handling

7. **Data Model Mapping** (in Architecture doc)
   - SwiftData ↔ Prisma schema mapping
   - Schema gaps and required changes
   - Migration scripts for model updates
   - Relationship preservation

### Quick Reference

| Need | See Document |
|------|--------------|
| What code to remove? | Code Deprecation Strategy |
| How does sync work? | Offline Caching & Sync Strategy |
| What's the implementation timeline? | Implementation Phases |
| How to migrate existing users? | Migration & Testing |
| What's the overall architecture? | Technical Architecture |
| API endpoint details? | Backend API Documentation |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-06 | iOS Engineering | Initial PRD creation with modular structure |

---

## Next Steps

1. **Review**: Stakeholders review this PRD and all related documents
2. **Schema Updates**: Fix backend Prisma schema gaps (previousGenerationId, specialAbilities)
3. **Phase 1 Start**: Begin Foundation phase (Auth & Core Infrastructure)
4. **Weekly Check-ins**: Monitor progress and adjust timeline as needed
5. **User Testing**: Beta test with existing users during Phase 6 (Migration)

---

## Questions & Answers

### Q: Will the app work without internet?
**A**: Yes, fully functional offline. All operations work locally and sync when online.

### Q: What happens to existing users' data?
**A**: A migration tool will export local data and upload to the backend. No data loss.

### Q: Do users need OpenAI API keys anymore?
**A**: No, the backend handles all OpenAI API calls. Users just sign in.

### Q: How long does sync take?
**A**: Background sync every 15 minutes, or immediate on user actions. Typically <5 seconds.

### Q: What if sync conflicts occur?
**A**: Last-Write-Wins for most data. User prompted for critical conflicts (stories).

### Q: How much will cloud storage cost?
**A**: Cloudflare R2 pricing: $0.015/GB/month storage, $0.01/GB download. Estimated ~$0.10-0.20/user/month.

### Q: Can users disable cloud sync?
**A**: No, cloud sync is core to the new architecture. Offline mode always available.

### Q: What happens if backend is down?
**A**: App continues working offline. Sync resumes automatically when backend recovers.

---

**For detailed implementation guidance, please refer to the related documents listed above.**
