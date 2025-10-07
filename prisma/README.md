# Prisma Database Setup

This directory contains the complete database schema and seed data for the Gentil Feedback platform.

## Overview

The database schema is designed based on the DSL specification in `/dsl/global.yaml` and includes:

- **10 core models**: User, Village, Feature, Feedback, Vote, RoadmapItem, Panel, PanelMembership, Questionnaire, QuestionnaireResponse, Session, Event
- **8 enums**: Role, ProductArea, FeatureStatus, FeedbackState, ModerationStatus, Source, Visibility, RoadmapStage, SessionType
- **Complete relations** between models with proper foreign keys and cascades
- **Performance indexes** on frequently queried fields
- **GDPR-compliant** data structures with consent tracking

## Setup Instructions

### 1. Install Dependencies

First, ensure the Next.js project is initialized, then install Prisma:

```bash
npm install -D prisma tsx ulid
npm install @prisma/client
```

### 2. Initialize Prisma (Already done)

The Prisma configuration is already set up with SQLite:

```bash
npx prisma init --datasource-provider sqlite
```

The `.env` file should contain:
```
DATABASE_URL="file:./dev.db"
```

### 3. Generate Prisma Client

Generate the TypeScript client from the schema:

```bash
npx prisma generate
```

### 4. Create and Run Migrations

Create the initial migration:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the SQLite database file
- Apply all schema changes
- Generate the Prisma Client

### 5. Seed the Database

Populate the database with test data:

```bash
npx prisma db seed
```

Or manually:
```bash
tsx prisma/seed.ts
```

The seed script creates:
- 1 village (La Rosière)
- 5 users with different roles (Admin, PM, Researcher, 2 Regular users)
- 5 features across different product areas
- 6 feedback items (including 1 duplicate)
- 6 votes with weighted scoring
- 2 roadmap items
- 1 research panel with 3 members
- 1 questionnaire with 2 responses
- 1 research session
- 3 events

### 6. Explore the Database

Launch Prisma Studio to view and edit data:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555`

## Schema Highlights

### User Model
- Global user IDs (`usr_${ulid}`) that persist across village changes
- Role-based access control (USER, PM, PO, RESEARCHER, ADMIN, MODERATOR)
- GDPR consent tracking in JSON field
- Village history tracking

### Feedback Model
- Unique IDs (`fb_${ulid}`)
- Village-optional context
- Moderation pipeline with status and signals
- Self-referencing relation for duplicates
- 15-minute edit window tracking
- Multiple visibility and source options

### Voting Model
- Weighted voting system (role-based weights)
- Vote decay support (180-day half-life)
- Composite unique constraint: one vote per user per feedback

### Research Models
- **Panel**: Eligibility-based user cohorts with JSON rules
- **Questionnaire**: Versioned surveys with multiple question types
- **Session**: Usability tests with consent and recording tracking

### Event Model
- Event-driven architecture support
- Stores all significant platform events
- JSON payload for flexibility

## Available Scripts

Add these to your `package.json`:

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

## Usage in Code

### Import Prisma Client

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

### Example Queries

#### Get all feedback with votes
```typescript
const feedbacks = await prisma.feedback.findMany({
  include: {
    author: true,
    votes: true,
    feature: true,
  },
  where: {
    state: 'new',
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

#### Create new feedback
```typescript
const feedback = await prisma.feedback.create({
  data: {
    id: `fb_${ulid()}`,
    authorId: userId,
    title: 'My feedback title',
    body: 'Detailed feedback description',
    featureId: 'feat-checkin-mobile',
    state: 'new',
    moderationStatus: 'auto_pending',
    visibility: 'public',
    source: 'app',
  },
});
```

#### Cast a vote
```typescript
const vote = await prisma.vote.create({
  data: {
    feedbackId: feedbackId,
    userId: userId,
    weight: 1.0,
    decayedWeight: 1.0,
  },
});
```

#### Get user with all relations
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    feedbacks: true,
    votes: true,
    panelMemberships: {
      include: {
        panel: true,
      },
    },
  },
});
```

## Migration Strategy

### Development
Use `prisma migrate dev` to create and apply migrations during development.

### Production
Use `prisma migrate deploy` to apply migrations in production (no prompts).

### Reset Database
To completely reset the database and re-seed:
```bash
npx prisma migrate reset
```

## Important Notes

1. **JSON Fields**: Several fields use JSON for flexibility (consents, villageHistory, eligibilityRules, etc.). These are stored as strings in SQLite but should be parsed as JSON in your application.

2. **ULID IDs**: User-facing IDs use ULID format for sortability and uniqueness. Install the `ulid` package: `npm install ulid`

3. **Indexes**: Performance indexes are defined on frequently queried fields. Monitor query performance and add indexes as needed.

4. **Cascading Deletes**: Some relations use `onDelete: Cascade` to maintain referential integrity. Be careful when deleting entities.

5. **SQLite Limitations**: This schema uses SQLite for development. For production, consider PostgreSQL which better supports JSON fields and has more robust concurrent access.

## Troubleshooting

### Migration Issues
If migrations fail:
```bash
npx prisma migrate reset
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### Type Generation Issues
If TypeScript types are outdated:
```bash
npx prisma generate
```

### Database Locked (SQLite)
Stop all processes using the database:
```bash
npx prisma studio # Stop if running
# Kill any Node processes
```

## Next Steps

1. Integrate Prisma Client into Next.js API routes
2. Create repository pattern for data access
3. Add validation middleware for Prisma operations
4. Implement soft deletes for GDPR compliance
5. Set up automated backups
6. Configure production database (PostgreSQL)

## Reference

- Prisma Documentation: https://www.prisma.io/docs
- DSL Specification: `/dsl/global.yaml`
- Project Context: `/CLAUDE.md`
