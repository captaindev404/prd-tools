# Prisma ORM Setup - Complete Documentation

## Overview

This document describes the complete Prisma ORM setup for the Odyssey Feedback platform, including database schema, migrations, and seed data.

## Status: READY FOR DEPLOYMENT

All Prisma configuration files have been created and are ready to use once the Next.js project is initialized.

## Files Created

```
/Users/captaindev404/Code/club-med/gentil-feedback/
├── .env                          # Database connection string
├── .gitignore                    # Updated with Prisma ignores
├── setup-prisma.sh               # Automated setup script (executable)
└── prisma/
    ├── schema.prisma             # Complete database schema
    ├── seed.ts                   # Comprehensive seed script
    ├── types.ts                  # TypeScript type definitions
    ├── README.md                 # Detailed usage documentation
    └── package-additions.json    # NPM scripts to add to package.json
```

## Database Schema Summary

### Enums (8 total)
1. **Role**: USER, PM, PO, RESEARCHER, ADMIN, MODERATOR
2. **ProductArea**: Reservations, CheckIn, Payments, Housekeeping, Backoffice
3. **FeatureStatus**: idea, discovery, shaping, in_progress, released, generally_available, deprecated
4. **FeedbackState**: new, triaged, merged, in_roadmap, closed
5. **ModerationStatus**: auto_pending, approved, rejected, needs_info
6. **Source**: app, web, kiosk, support, import
7. **Visibility**: public, internal
8. **RoadmapStage**: now, next, later, under_consideration
9. **SessionType**: usability, interview, prototype_walkthrough, remote_test

### Models (11 total)

#### 1. Village
- Represents Club Med villages (resorts)
- Fields: id, name, createdAt, updatedAt
- Relations: users (one-to-many)

#### 2. User
- Global user identity with ULID-based IDs (usr_${ulid})
- Fields: id, employeeId, email, displayName, role, currentVillageId, villageHistory (JSON), consents (JSON)
- Indexes: employeeId, email
- Relations: feedbacks, votes, panelMemberships, questionnaireResponses, facilitatedSessions, events

#### 3. Feature
- Product features across different areas
- Fields: id, title, area, status, tags (JSON), description
- Relations: feedbacks, roadmapItems

#### 4. Feedback
- User-submitted feedback with moderation pipeline
- Fields: id (fb_${ulid}), authorId, title, body, villageId (optional), visibility, source, state, moderationStatus, moderationSignals (JSON), duplicateOfId, attachments (JSON), i18nData (JSON), editWindowEndsAt
- Indexes: authorId, state, createdAt, featureId
- Relations: author (User), feature (Feature), votes, roadmapItems, duplicateOf (self-relation)

#### 5. Vote
- Weighted voting system with decay support
- Fields: id, feedbackId, userId, weight, decayedWeight, createdAt
- Unique constraint: (feedbackId, userId) - one vote per user per feedback
- Indexes: feedbackId, userId
- Relations: feedback (Feedback), user (User)
- Cascade delete when feedback or user is deleted

#### 6. RoadmapItem
- Product roadmap with communications strategy
- Fields: id (rmp_${ulid}), title, stage, description, featureIds (JSON), feedbackIds (JSON), jiraTickets (JSON), figmaLinks (JSON), commsCadence, commsChannels (JSON), commsAudience (JSON), successCriteria (JSON), guardrails (JSON)
- Index: stage
- Relations: features, feedbacks

#### 7. Panel
- User research panels with eligibility rules
- Fields: id (pan_${ulid}), name, eligibilityRules (JSON), sizeTarget, quotas (JSON)
- Relations: memberships, questionnaires, sessions

#### 8. PanelMembership
- Many-to-many relationship between panels and users
- Fields: id, panelId, userId, joinedAt, active
- Unique constraint: (panelId, userId)
- Indexes: panelId, userId
- Cascade delete when panel or user is deleted

#### 9. Questionnaire
- Research questionnaires with versioning
- Fields: id (qnn_${ulid}), title, version (semver), questions (JSON), panelIds (JSON), adHocFilters (JSON), deliveryMode (JSON), startAt, endAt, maxResponses, aggregateExports (JSON), piiIncluded
- Relations: panels, responses

#### 10. QuestionnaireResponse
- User responses to questionnaires
- Fields: id, questionnaireId, respondentId, answers (JSON), scoreMap (JSON), completedAt
- Indexes: questionnaireId, respondentId
- Cascade delete when questionnaire or user is deleted

#### 11. Session
- Research sessions (usability tests, interviews, etc.)
- Fields: id (ses_${ulid}), type, prototypeLink, scheduledAt, durationMinutes, panelId, participantIds (JSON), facilitatorIds (JSON), minParticipants, maxParticipants, consentRequired, recordingEnabled, recordingStorageDays, notesSecure, notesUri, status
- Indexes: scheduledAt, type
- Relations: panel, facilitators

#### 12. Event
- Event-driven architecture support
- Fields: id, type, payload (JSON), userId, createdAt
- Indexes: type, createdAt
- Relations: user

## Key Design Decisions

### 1. ULID-based IDs
- User-facing entities use ULID format for sortability and uniqueness
- Format: `usr_${ulid}`, `fb_${ulid}`, `rmp_${ulid}`, etc.
- Provides chronological ordering without exposing internal auto-increment IDs

### 2. JSON Fields for Flexibility
- Used for complex, variable-length data structures
- Examples: consents, villageHistory, eligibilityRules, questions, answers
- SQLite stores as TEXT, PostgreSQL will use native JSON type in production

### 3. Global User Identity
- Users have a single global ID that persists across village changes
- Village history tracked in JSON array
- Current village is a foreign key for quick filtering

### 4. Weighted Voting
- Each vote has a base weight and a decayed weight
- Allows for role-based weighting and time-based decay (180-day half-life)
- Composite unique constraint prevents duplicate votes

### 5. Moderation Pipeline
- Feedback starts as "auto_pending" and requires approval
- Moderation signals stored as JSON array for flexibility
- 15-minute edit window tracked explicitly

### 6. Deduplication Support
- Feedback can be marked as duplicate of another
- Self-referencing relation with NoAction to prevent cascading deletes
- Fuzzy matching threshold: 0.86 (implemented at application level)

### 7. Research Consent Tracking
- GDPR-compliant consent tracking in User model
- Panel eligibility can require specific consents
- Research exports can filter by consent status

### 8. Cascade Deletes
- Votes cascade when feedback or user is deleted
- Panel memberships cascade when panel or user is deleted
- Questionnaire responses cascade when questionnaire or user is deleted
- Intentional to maintain referential integrity

## Seed Data

The seed script (`prisma/seed.ts`) creates a complete test dataset:

### Villages
- **vlg-001**: La Rosière

### Users (5)
1. **Alex R.** (alex@clubmed.com) - ADMIN - Full consents
2. **Marie L.** (marie@clubmed.com) - PM - Email + analytics
3. **Thomas B.** (thomas@clubmed.com) - RESEARCHER - Full consents
4. **Sophie D.** (sophie@clubmed.com) - USER - Research + analytics
5. **Julien M.** (julien@clubmed.com) - USER - Email only

### Features (5)
1. **feat-checkin-mobile** - Mobile Check-in (CheckIn, GA)
2. **feat-kiosk-passport-scan** - Kiosk Passport Scanner (CheckIn, In Progress)
3. **feat-payment-split** - Split Payment Support (Payments, Discovery)
4. **feat-housekeeping-schedule** - Housekeeping Schedule Preferences (Housekeeping, Shaping)
5. **feat-reservation-modify** - Self-Service Reservation Modifications (Reservations, Idea)

### Feedback (6)
1. Add passport scan at kiosk → in_roadmap
2. Mobile check-in not working on iOS 17 → triaged
3. Split payment between credit cards → new
4. Guest feedback: need flexible housekeeping times → triaged (internal)
5. Allow date changes without calling support → new
6. Passport scanner would be great → merged (duplicate of #1)

### Votes (6)
- Multiple votes on passport scanner feedback with different weights
- PM vote has 2x weight
- Demonstrates weighted voting system

### Roadmap Items (2)
1. **Faster Arrival Flow** (next) - Links to check-in features
2. **Flexible Payment Options** (later) - Links to payment feature

### Research
- **Panel**: Reception Core Panel with 3 members
- **Questionnaire**: Check-in Satisfaction Survey with 2 responses
- **Session**: Usability test scheduled for 2025-10-15

### Events (3)
- feedback.created
- vote.cast
- roadmap.published

## Setup Instructions

### Option 1: Automated Setup (Recommended)

Once Next.js is initialized, run:

```bash
./setup-prisma.sh
```

This will:
1. Install Prisma dependencies
2. Generate Prisma client
3. Create and apply migrations
4. Seed the database

### Option 2: Manual Setup

1. Install dependencies:
```bash
npm install -D prisma tsx ulid
npm install @prisma/client
```

2. Generate Prisma client:
```bash
npx prisma generate
```

3. Create migration:
```bash
npx prisma migrate dev --name init
```

4. Seed database:
```bash
npx prisma db seed
```

### Add NPM Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Verification

After setup, verify the database:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- Browse all tables
- View seeded data
- Edit records
- Run queries

## Next Steps

1. **API Integration**: Create Next.js API routes using Prisma Client
2. **Repository Pattern**: Implement data access layer
3. **Validation**: Add Zod schemas for runtime validation
4. **Migrations**: Set up migration strategy for production
5. **Monitoring**: Add Prisma query logging and metrics
6. **Testing**: Create integration tests with test database
7. **Production**: Migrate from SQLite to PostgreSQL

## Production Considerations

### Database Migration
- Current setup uses SQLite for development
- For production, switch to PostgreSQL:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```

### JSON Field Optimization
- PostgreSQL has native JSON support with indexing
- Can add GIN indexes on JSON fields for better query performance

### Connection Pooling
- Use PgBouncer or built-in Prisma connection pooling
- Configure appropriate pool size based on traffic

### Backup Strategy
- Implement automated backups
- GDPR compliance: respect data retention periods
- Separate backups for PII vs. analytics data

### Monitoring
- Enable Prisma query logging in production
- Monitor slow queries and add indexes as needed
- Track database growth and plan capacity

## Troubleshooting

### Migration Issues
```bash
npx prisma migrate reset
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### Type Generation Issues
```bash
npx prisma generate
```

### Database Locked (SQLite)
Stop all processes using the database:
```bash
# Stop Prisma Studio if running
# Kill any Node processes holding the database
```

## Reference

- **DSL Specification**: `/dsl/global.yaml`
- **Project Context**: `/CLAUDE.md`
- **Prisma Documentation**: https://www.prisma.io/docs
- **Prisma Schema Reference**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference

## Compliance

This schema is designed to be:
- **GDPR-compliant**: Consent tracking, data retention, PII handling
- **Auditable**: Event log for all significant actions
- **Recoverable**: Global user IDs with multiple recovery paths
- **Scalable**: Indexed for performance, ready for PostgreSQL migration

## Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "tsx": "^4.19.2",
    "ulid": "^2.3.0"
  }
}
```

---

**Task Completion**: TASK-003-012 - Prisma ORM setup complete and ready for deployment.

**Created by**: Agent-003
**Date**: 2025-10-02
**Version**: 0.5.0
