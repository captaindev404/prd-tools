# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gentil Feedback** (v0.5.0) - A comprehensive product feedback and user research platform for Club Med with:
- Multi-village identity management with global user accounts
- Product feedback collection, voting, and roadmap communication
- User testing panels, questionnaires, and research sessions
- GDPR-compliant data handling

**Status**: In Development (23% Complete - 29/119 tasks completed)

## Tech Stack

### Core Framework
- **Next.js 15.5** - React framework with App Router and Turbopack dev server (server components by default)
- **TypeScript** - Type-safe development
- **React 18** - UI library with hooks

### UI & Styling
- **Shadcn UI** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Backend & Database
- **Prisma** - Type-safe ORM
- **SQLite** - Development database
- **PostgreSQL** - Production database (migration ready)

### Authentication
- **NextAuth.js v5** - Authentication framework
- **Azure AD** - Enterprise SSO for Club Med employees
- **Keycloak** - Alternative SSO provider

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Runtime type validation

### Utilities
- **ULID** - Sortable unique IDs for all entities
- **date-fns** - Date manipulation

## Architecture

This is a **domain-specific language (DSL) project** that defines the complete schema for the feedback platform in YAML format. The central artifact is `dsl/global.yaml`, which serves as the single source of truth for:

### Core Domain Models

1. **Tenancy & Identity** (`tenancy`, lines 9-36)
   - Global user IDs (`usr_${ulid}`) that persist across village changes
   - Multi-village support with identity recovery via AzureAD/Keycloak
   - Attributes: `employee_id`, `primary_email`, `current_village_id`, `village_history`
   - GDPR consent tracking for research contact, analytics, and email updates

2. **Access Control** (`access_control`, lines 39-67)
   - Roles: USER, PM, PO, RESEARCHER, ADMIN, MODERATOR
   - Fine-grained permissions matrix for feedback, voting, roadmap, research, and moderation actions
   - Conditional policies (e.g., `requires_consent` for research exports)

3. **Features** (`features`, lines 70-79)
   - Product areas: Reservations, Check-in, Payments, Housekeeping, Backoffice
   - Feature states: idea → discovery → shaping → in_progress → released → GA → deprecated

4. **Feedback** (`feedback`, lines 82-113)
   - IDs: `fb_${ulid}`
   - Village-agnostic by default (`village_context_optional: true`)
   - Moderation pipeline with signals: toxicity, spam, PII, off-topic
   - Deduplication (fuzzy title match at 0.86 threshold)
   - States: new → triaged → merged → in_roadmap → closed
   - 15-minute edit window, 10 submissions/user/day rate limit

5. **Voting** (`voting`, lines 116-126)
   - Weighted model using role, village priority, and panel membership
   - No downvotes allowed
   - Vote decay with 180-day half-life for recency bias

6. **Roadmap & Comms** (`roadmap`, lines 129-150)
   - IDs: `rmp_${ulid}`
   - Stages: now | next | later | under_consideration
   - Links to features, feedback, Jira tickets, Figma files
   - Multi-channel communications (in-app, email, inbox) with audience filtering
   - Success criteria and guardrail metrics

7. **Research** (`research`, lines 153-215)
   - **Panels** (`pan_${ulid}`): Eligibility-based user cohorts with consent requirements
   - **Questionnaires** (`qnn_${ulid}`): Versioned surveys (Likert, NPS, MCQ, text, etc.) with targeting
   - **Sessions** (`ses_${ulid}`): Usability tests, interviews, prototype walkthroughs with recording

8. **Moderation** (`moderation`, lines 230-239)
   - Auto-screening for PII redaction, toxicity, and spam
   - 48-hour SLA for human review by MODERATOR role
   - PII masking: keep last 4 characters

9. **Integrations** (`integrations`, lines 242-263)
   - Jira (ODYS, PMS projects), Figma, SendGrid, Kafka event bus
   - Analytics sinks: Kibana, BigQuery
   - HRIS daily sync for employee_id linking

10. **Events** (`events`, lines 266-280)
    - Event-driven architecture for pipelines
    - Key events: `feedback.created`, `feedback.merged`, `vote.cast`, `roadmap.published`, `questionnaire.response.recorded`, `session.completed`

### Key Constraints

- **Identity**: Global user IDs never tied to villages; recovery via email, HRIS, or secondary identifiers
- **Privacy**: Data retention: feedback (1825d), research records (1095d), PII backups (30d)
- **I18n**: Support for English and French (`en`, `fr`)
- **ID format**: ULID-based for all entities (users, feedback, roadmaps, panels, etc.)

## Development Notes

- This DSL is **declarative**—implementation would typically generate database schemas, API contracts, and UI scaffolding from `global.yaml`
- Seed data examples are provided at the end of `global.yaml` (lines 316-369)
- UI hints (lines 303-313) suggest frontend behavior (e.g., duplicate suggestions, minimum character counts)

## Development Workflow

### Task-Based Development

The project follows a structured task-based approach:

1. **Task Definitions**: All 119 tasks are defined in `tools/populate_tasks.sql`
   - Organized by Epic (Foundation, Auth, Feedback, Voting, Features, Moderation, Settings, Roadmap, Research Panels, Questionnaires, Sessions, Integrations, Analytics, Performance, Security, Testing, Documentation, Admin)
   - Each task includes: ID, title, description, category, priority, estimated hours, tech stack, dependencies, and acceptance criteria

2. **Task Selection**:
   - Pick tasks from the build dashboard or `populate_tasks.sql`
   - Check task dependencies (`depends_on` field)
   - Ensure prerequisite tasks are completed before starting

3. **Implementation Process**:
   - Read task description and acceptance criteria
   - Reference related DSL sections in `dsl/global.yaml`
   - Implement following code standards (see below)
   - Test locally
   - Document completion

4. **Completion Documentation**:
   - Create completion report (e.g., `TASK-XXX-COMPLETION.md`)
   - Document what was built, files created/modified, dependencies added
   - Include testing notes and next steps

5. **Progress Tracking**:
   - Use build dashboard: `cd tools && npm run dashboard`
   - View real-time progress at http://localhost:3001
   - Track completed tasks, active work, and statistics

### Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack (http://localhost:3000)
npm run build            # Build for production
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed with test data
npm run db:studio        # Open Prisma Studio GUI

# Tools
cd tools
npm run dashboard        # Build progress dashboard
npm run update-task      # Update task status
```

### Next.js 15.5 Important Notes

- **Turbopack Dev Server**: The dev server now uses Turbopack for faster builds and Hot Module Replacement (HMR)
- **Async Request APIs**: Route handlers must handle async `params` and `searchParams` in Next.js 15+
- **Caching Changes**: Fetch requests are no longer cached by default - use explicit `cache` or `revalidate` options
- **Node.js Requirement**: Requires Node.js 18.18.0 or higher

## Task Management

### Project Structure (119 Tasks)

**Completed (29 tasks)**:
- Foundation: 12/12 ✅
- Authentication: 6/6 ✅
- Feedback System: 11/11 ✅

**In Progress**:
- Voting System
- Feature Catalog
- Moderation Queue

**Planned**:
- Roadmap Communications
- Research Panels & Questionnaires
- User Testing Sessions
- Email Integrations
- Analytics Dashboard
- Admin Panel
- Security & Performance
- Testing & Documentation

### Task Dependencies

Tasks follow a dependency graph defined in `depends_on` field:
- Example: TASK-019 (Feedback API) depends on TASK-006 (Prisma schema) and TASK-016 (Auth middleware)
- Always check dependencies before starting a task
- Completed tasks unlock dependent tasks

## Code Standards & Practices

### File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (backend)
│   │   ├── feedback/       # Feedback CRUD + voting
│   │   ├── features/       # Feature catalog
│   │   └── ...
│   ├── feedback/           # Feedback pages (frontend)
│   └── dashboard/          # Dashboard pages
├── components/             # React components
│   ├── ui/                 # Shadcn UI base components
│   ├── feedback/           # Feature-specific components
│   └── layout/             # Layout components
├── lib/                    # Utilities & helpers
│   ├── prisma.ts           # Prisma client singleton
│   ├── pii-redact.ts       # PII redaction logic
│   └── vote-weight.ts      # Vote weight calculation
└── types/                  # TypeScript type definitions
```

### Component Patterns

**Server Components (Default)**:
```tsx
// app/feedback/page.tsx
import { getFeedback } from '@/lib/feedback-service';

export default async function FeedbackPage() {
  const feedback = await getFeedback();
  return <FeedbackList items={feedback} />;
}
```

**Client Components (Interactive)**:
```tsx
// components/feedback/vote-button.tsx
'use client';

import { useState } from 'react';

export function VoteButton({ feedbackId }: { feedbackId: string }) {
  const [voted, setVoted] = useState(false);
  // ... interactive logic
}
```

### API Route Patterns

```typescript
// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate input
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state');

  // 3. Query database
  const feedback = await prisma.feedback.findMany({
    where: { state: state || undefined },
  });

  // 4. Return response
  return NextResponse.json({ feedback });
}

// For dynamic routes with params (Next.js 15+)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params; // Await params in Next.js 15+

  const feedback = await prisma.feedback.findUnique({
    where: { id },
  });

  return NextResponse.json({ feedback });
}
```

### Validation with Zod

```typescript
import { z } from 'zod';

const feedbackSchema = z.object({
  title: z.string().min(8).max(120),
  body: z.string().min(20).max(5000),
  featureRefs: z.array(z.string()).optional(),
});

const data = feedbackSchema.parse(input); // Throws on validation error
```

### Database Queries

Always use Prisma for type-safe queries:

```typescript
import { prisma } from '@/lib/prisma';

// Include relations
const feedback = await prisma.feedback.findUnique({
  where: { id },
  include: {
    author: true,
    votes: true,
  },
});

// Aggregations
const voteCount = await prisma.vote.count({
  where: { feedbackId },
});
```

### Error Handling

```typescript
try {
  // ... operation
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Testing (When Implemented)

- **Unit tests**: Co-locate with source (`lib/vote-weight.test.ts`)
- **Component tests**: Use Testing Library
- **API tests**: See `docs/API_TESTING.md`
- **E2E tests**: Use Playwright

## Reference Documentation

### Key Documents

- **[dsl/global.yaml](docs/dsl/global.yaml)** - Single source of truth for domain models
- **[README.md](./README.md)** - Project overview and setup
- **[docs/API.md](./docs/API.md)** - Complete API reference
- **[docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)** - Auth setup and configuration
- **[docs/INTEGRATIONS.md](./docs/INTEGRATIONS.md)** - Email, HRIS, Jira, Figma integrations
- **[docs/USER_GUIDE.md](./docs/USER_GUIDE.md)** - User guide for PMs, Researchers, Moderators
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Production deployment guide
- **[docs/PRD.md](docs/prd/PRD.md)** - Product requirements document

### Task Definitions

- **[tools/populate_tasks.sql](./tools/populate_tasks.sql)** - All 119 tasks with acceptance criteria

### Completion Reports

Task completion is documented in files like in docs/tasks folder:
- `TASK-002-COMPLETION.md`
- `TASK-003-012-COMPLETE.md`
- `TASK-013-018-AUTHENTICATION-COMPLETE.md`
- `IMPLEMENTATION_SUMMARY.md`

These provide context on what was built and how it works.
