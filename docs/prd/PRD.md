# Product Requirements Document (PRD)
# Gentil Feedback Platform v0.5.0

**Project**: Club Med Multi-Village Feedback & Research Platform
**Tech Stack**: Next.js 14, Shadcn UI, Prisma, SQLite
**Version**: 0.5.0
**Last Updated**: 2025-10-02

---

## 1. Executive Summary

### 1.1 Product Vision
Gentil Feedback is a comprehensive platform that enables Club Med employees across multiple villages to submit product feedback, vote on features, participate in user research, and track product roadmap progress. The platform maintains global user identities that persist across village transfers, ensuring continuity and data integrity.

### 1.2 Core Value Propositions
- **For End Users (Staff)**: Single platform to voice feedback, influence product direction, and stay informed about improvements
- **For Product Managers**: Centralized feedback collection, weighted voting insights, and roadmap communication tools
- **For Researchers**: Structured panel management, questionnaire deployment, and research session coordination
- **For Organization**: GDPR-compliant data handling, multi-village scalability, and actionable product metrics

### 1.3 Success Metrics
- Feedback submission rate: >5 items/user/month
- Vote participation: >60% of active users
- Research panel enrollment: 150+ members per panel
- Questionnaire completion rate: >70%
- Idea-to-delivery cycle time: <90 days

---

## 2. User Personas

### 2.1 Primary Personas

**P1: Marie - Front Desk Staff (USER)**
- Works at La Rosière village
- Submits feedback about check-in processes
- Votes on features that would improve her daily workflow
- Occasionally participates in usability testing

**P2: Thomas - Product Manager (PM)**
- Manages Reservations product area
- Reviews feedback, merges duplicates
- Publishes roadmap updates
- Recruits users for research panels

**P3: Sophie - UX Researcher (RESEARCHER)**
- Designs and deploys questionnaires
- Manages research panels across villages
- Schedules and conducts usability sessions
- Analyzes feedback patterns for product insights

**P4: Jean - Product Owner (PO)**
- Prioritizes features across product areas
- Links feedback to roadmap items
- Tracks success metrics and guardrails
- Makes go/no-go decisions on features

**P5: Claire - Content Moderator (MODERATOR)**
- Reviews flagged feedback for toxicity, spam, PII
- Ensures community guidelines compliance
- 48-hour SLA for moderation queue

---

## 3. Functional Requirements

### 3.1 Authentication & Identity Management

**FR-AUTH-001: Multi-IDP Authentication**
- Support Azure AD and Keycloak SSO
- Global user ID format: `usr_${ulid}`
- Never tie user identity to specific village

**FR-AUTH-002: Account Recovery**
- Email reclaim flow: verify old email/phone → set new email → confirm IDP link
- HRIS reclaim flow: match employee_id + DOB → verify SMS → confirm IDP link
- Secondary identifiers: employee_id, phone, personal_email

**FR-AUTH-003: User Attributes**
- Core attributes: employee_id (unique), primary_email (unique), display_name, current_village_id
- Village history tracking: array of {village_id, from_date, to_date}
- Session limit: 5 devices max (latest 5 only)

**FR-AUTH-004: GDPR Consent Management**
- Consent types: research_contact, usage_analytics, email_updates
- Explicit opt-in required before data collection
- Consent withdrawal triggers data deletion per retention policy

---

### 3.2 Feedback Collection & Management

**FR-FEED-001: Feedback Submission**
- Form fields:
  - Title (8-120 chars, required)
  - Body (20-5000 chars, required)
  - Feature references (optional, multi-select from catalog)
  - Attachments (optional, images/docs)
  - Village context (optional)
  - Source: app | web | kiosk | support | import
- Multi-language support (EN, FR)
- Auto-save draft functionality

**FR-FEED-002: Deduplication**
- Fuzzy title matching at 0.86 similarity threshold
- Show duplicate suggestions during submission
- Allow user to link as duplicate or proceed

**FR-FEED-003: Rate Limiting**
- 10 submissions per user per day
- Prevent spam while allowing legitimate bulk feedback

**FR-FEED-004: Edit Window**
- 15-minute edit window after submission
- After window: feedback locked (requires moderator to edit)

**FR-FEED-005: Feedback States**
- new → triaged → merged → in_roadmap → closed
- State transitions logged with timestamp and actor

**FR-FEED-006: Moderation Pipeline**
- Auto-screening on submit:
  - PII detection (phone, email, room_number, reservation_id) → redact with mask_keep_last4
  - Toxicity scoring (threshold-based flagging)
  - Spam detection
- Flagged items enter human review queue (48h SLA)
- Moderation statuses: auto_pending | approved | rejected | needs_info

**FR-FEED-007: Feedback Visibility**
- Public: visible to all authenticated users
- Internal: visible to PM, PO, ADMIN only

---

### 3.3 Voting System

**FR-VOTE-001: Weighted Voting**
- Vote sources:
  - Role weight (USER: 1x, PM: 3x, PO: 5x, RESEARCHER: 2x)
  - Village priority multiplier (configurable per village)
  - Panel member boost: +1.5x if user in active research panel
- No downvotes allowed (positive feedback only)

**FR-VOTE-002: Vote Decay**
- 180-day half-life: older votes gradually lose weight
- Favors recent interest over stale votes

**FR-VOTE-003: Vote Transparency**
- Show total vote count and weighted score
- Display weight calculation rules in UI (tooltip/modal)
- One vote per user per feedback item

---

### 3.4 Feature Catalog

**FR-FEAT-001: Product Area Taxonomy**
- Areas: Reservations, Check-in, Payments, Housekeeping, Backoffice
- Custom tags allowed (e.g., "rx", "guest-experience")

**FR-FEAT-002: Feature Lifecycle**
- States: idea → discovery → shaping → in_progress → released → generally_available → deprecated
- Each feature has unique ID (`feat-*`), title, area, tags, status

---

### 3.5 Roadmap & Communications

**FR-ROAD-001: Roadmap Items**
- Schema: `rmp_${ulid}`, title, stage (now | next | later | under_consideration)
- Links: features[], canonical_feedback[], jira[], figma[]

**FR-ROAD-002: Roadmap Updates (Changelog)**
- Scheduled cadence: monthly | ad_hoc
- Channels: in-app notification, email, inbox
- Audience filters: villages (specific | all), roles, languages

**FR-ROAD-003: Success Criteria & Guardrails**
- Define metrics: e.g., "reduce_checkin_time_lt_2min", "nps_area>=+30"
- Guardrails: "error_rate<0.5%", "perf_p95<800ms"
- Track against metrics post-release

---

### 3.6 Research: Panels, Questionnaires, Sessions

**FR-RES-001: Research Panels**
- Panel schema: `pan_${ulid}`, name, eligibility_rules, size_target, quotas
- Eligibility rules:
  - Role filters (e.g., USER only)
  - Village filters (specific villages or all)
  - Attribute predicates (e.g., department in ["FOH", "Reception"])
  - Required consents (e.g., research_contact)
- Quota management: proportional distribution by village_id or other attributes

**FR-RES-002: Questionnaires**
- Schema: `qnn_${ulid}`, title, version (semver), questions[]
- Question types: likert (1-5 scale), nps (0-10), mcq, checkbox, text, number
- Multi-language question text (EN, FR)
- Targeting: panels[] or ad-hoc filters (villages, features_interacted)
- Delivery modes: in-app, email
- Scheduling: start_at, end_at, max_responses
- Analytics: aggregate exports (CSV, Parquet), PII excluded by default

**FR-RES-003: Research Sessions**
- Schema: `ses_${ulid}`, type (usability | interview | prototype_walkthrough | remote_test)
- Scheduling: scheduled_at, duration_minutes (default 45)
- Facilitators: PM or RESEARCHER role
- Participants: 1-6 people, recruited from panels or custom invites
- Consent required before session start
- Recording: enabled by default, stored for 365 days
- Secure notes storage (encrypted at rest)

---

### 3.7 Access Control

**FR-AC-001: Role-Based Permissions**
- Roles: USER, PM, PO, RESEARCHER, ADMIN, MODERATOR
- Permissions matrix (see dsl/global.yaml lines 39-67):
  - feedback.create: USER, PM, PO
  - feedback.edit_own: USER (within 15min)
  - feedback.merge: PM, PO, MODERATOR
  - vote.cast: USER, PM, PO
  - roadmap.publish: PM, PO
  - questionnaire.publish: RESEARCHER, PM
  - panel.invite: RESEARCHER, PM
  - session.schedule: RESEARCHER
  - moderation.review: MODERATOR, PM, PO
  - export.research: RESEARCHER, PM (requires consent)
  - admin.*: ADMIN

**FR-AC-002: Conditional Policies**
- Research exports require user consent: `research_contact`
- Village-scoped data access (future: filter by current_village_id)

---

### 3.8 Integrations

**FR-INT-001: Jira Integration**
- Project keys: ODYS, PMS
- Manual link: feedback_id → customfield_12345
- No auto-issue creation (manual only)

**FR-INT-002: Figma Integration**
- Embed Figma links in roadmap items
- Allowed domains: figma.com

**FR-INT-003: Email (SendGrid)**
- Transactional emails: questionnaire invites, roadmap updates, research session reminders
- Email templates in EN/FR

**FR-INT-004: Analytics (Event Bus)**
- Kafka topic: `feedback-topic`
- Sinks: Kibana, BigQuery
- Events: feedback.created, vote.cast, roadmap.published, questionnaire.response.recorded, session.completed

**FR-INT-005: HRIS Sync**
- Daily sync: employee_id as key
- Update user attributes: display_name, current_village_id, department

---

### 3.9 Data Privacy & Retention

**FR-PRIV-001: GDPR Compliance**
- Data retention:
  - Feedback: 1825 days (5 years)
  - Research records: 1095 days (3 years)
  - PII backups: 30 days
- Right to be forgotten: delete all user data on request
- Data export: user can download all their data (JSON)

**FR-PRIV-002: PII Redaction**
- Auto-detect and redact: phone, email, room_number, reservation_id
- Masking strategy: keep last 4 characters (e.g., `***1234`)

---

### 3.10 Metrics & Analytics

**FR-METR-001: Feedback Metrics**
- feedback_volume_7d: count(feedback where created_at in last 7 days)
- vote_weight_sum: sum(votes.weight)
- merge_rate: count(merged) / count(total)

**FR-METR-002: Research Metrics**
- questionnaire_completion_rate: completed / invited
- recruitment_lead_time_days: avg(session.scheduled_at - invite.sent_at)

**FR-METR-003: Product Metrics**
- nps_area: NPS score grouped by product_area
- idea_to_delivery_days: avg(release_date - first_feedback_date)

---

## 4. Non-Functional Requirements

### 4.1 Performance
- NFR-PERF-001: Page load time <800ms (p95)
- NFR-PERF-002: API response time <200ms (p95) for read operations
- NFR-PERF-003: Support 1000 concurrent users

### 4.2 Scalability
- NFR-SCALE-001: SQLite suitable for MVP (<100k records); migrate to PostgreSQL if >500k records
- NFR-SCALE-002: Horizontal scaling for API layer (stateless Next.js)

### 4.3 Security
- NFR-SEC-001: HTTPS only
- NFR-SEC-002: CSP headers to prevent XSS
- NFR-SEC-003: Rate limiting on API endpoints (100 req/min per IP)
- NFR-SEC-004: Session tokens expire after 7 days
- NFR-SEC-005: Encrypted storage for PII (research notes, recordings)

### 4.4 Reliability
- NFR-REL-001: 99.5% uptime SLA
- NFR-REL-002: Automated backups every 6 hours
- NFR-REL-003: Point-in-time recovery (30 days)

### 4.5 Usability
- NFR-USE-001: WCAG 2.1 AA accessibility compliance
- NFR-USE-002: Mobile-responsive (works on tablets/phones)
- NFR-USE-003: Multi-language support (EN, FR) with i18n routing

### 4.6 Maintainability
- NFR-MAINT-001: TypeScript for type safety
- NFR-MAINT-002: 80%+ test coverage (unit + integration)
- NFR-MAINT-003: API documentation via OpenAPI/Swagger

---

## 5. Technical Architecture

### 5.1 Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, Shadcn UI, TailwindCSS
- **Backend**: Next.js API routes (serverless), Prisma ORM
- **Database**: SQLite (development/MVP), PostgreSQL (production migration path)
- **Auth**: NextAuth.js with Azure AD / Keycloak providers
- **Storage**: Local filesystem (MVP), S3-compatible (production)
- **Email**: SendGrid
- **Analytics**: Kafka + BigQuery (optional for MVP)

### 5.2 Database Schema (Prisma)

**Core Models**:
- User: id (usr_ULID), employeeId, email, displayName, currentVillageId, villageHistory (JSON), consents (JSON), role (enum), createdAt, updatedAt
- Village: id (vlg-*), name
- Feature: id (feat-*), title, area, tags[], status, createdAt, updatedAt
- Feedback: id (fb_ULID), authorId, title, body, visibility, source, villageContext, featureRefs[], duplicateOf, state, moderationStatus, moderationSignals[], createdAt, updatedAt, editableUntil
- Vote: id, feedbackId, userId, weight, createdAt
- RoadmapItem: id (rmp_ULID), title, stage, featureIds[], feedbackIds[], jiraLinks[], figmaLinks[], successCriteria (JSON), guardrails (JSON), createdAt, updatedAt
- Panel: id (pan_ULID), name, eligibilityRules (JSON), sizeTarget, quotas (JSON), createdAt, updatedAt
- PanelMembership: id, panelId, userId, joinedAt
- Questionnaire: id (qnn_ULID), title, version, questions (JSON), targeting (JSON), delivery (JSON), startAt, endAt, maxResponses, createdAt, updatedAt
- QuestionnaireResponse: id, questionnaireId, respondentId, answers (JSON), completedAt
- Session: id (ses_ULID), type, scheduledAt, durationMinutes, facilitatorIds[], participantIds[], prototypeLink, recordingUri, notes (encrypted), createdAt, updatedAt
- Event: id, type, payload (JSON), createdAt

**Indexes**:
- User: employeeId (unique), email (unique)
- Feedback: authorId, state, createdAt, featureRefs (array index)
- Vote: feedbackId, userId (composite unique)
- QuestionnaireResponse: questionnaireId, respondentId

### 5.3 API Design

**RESTful Endpoints** (Next.js API routes):

**Auth**:
- POST /api/auth/signin → NextAuth.js
- POST /api/auth/signout
- GET /api/auth/session

**Users**:
- GET /api/users/me → current user profile
- PATCH /api/users/me → update profile
- GET /api/users/:id → user profile (public fields)

**Feedback**:
- GET /api/feedback → list (filters: state, area, village, search)
- POST /api/feedback → create
- GET /api/feedback/:id → detail
- PATCH /api/feedback/:id → edit (within 15min or PM/PO)
- DELETE /api/feedback/:id → soft delete (ADMIN only)
- POST /api/feedback/:id/merge → merge into another (PM/PO)
- GET /api/feedback/:id/duplicates → fuzzy matches

**Votes**:
- POST /api/feedback/:id/vote → cast/update vote
- DELETE /api/feedback/:id/vote → remove vote

**Features**:
- GET /api/features → list catalog
- POST /api/features → create (PM/PO)
- PATCH /api/features/:id → update (PM/PO)

**Roadmap**:
- GET /api/roadmap → list items (filters: stage, area)
- POST /api/roadmap → create (PM/PO)
- PATCH /api/roadmap/:id → update (PM/PO)
- POST /api/roadmap/:id/publish → send comms (PM/PO)

**Panels**:
- GET /api/panels → list
- POST /api/panels → create (RESEARCHER/PM)
- GET /api/panels/:id → detail
- POST /api/panels/:id/members → invite users
- DELETE /api/panels/:id/members/:userId → remove member

**Questionnaires**:
- GET /api/questionnaires → list
- POST /api/questionnaires → create (RESEARCHER/PM)
- GET /api/questionnaires/:id → detail
- POST /api/questionnaires/:id/publish → activate
- POST /api/questionnaires/:id/responses → submit response
- GET /api/questionnaires/:id/analytics → aggregate results (RESEARCHER/PM)

**Sessions**:
- GET /api/sessions → list
- POST /api/sessions → schedule (RESEARCHER)
- PATCH /api/sessions/:id → update
- POST /api/sessions/:id/participants → add participants
- POST /api/sessions/:id/complete → mark complete + upload notes

**Moderation**:
- GET /api/moderation/queue → pending items (MODERATOR/PM/PO)
- POST /api/moderation/:feedbackId/approve
- POST /api/moderation/:feedbackId/reject

**Analytics**:
- GET /api/metrics/feedback → aggregates
- GET /api/metrics/research → aggregates
- GET /api/metrics/product → NPS, idea-to-delivery

### 5.4 UI/UX Structure (Shadcn Components)

**Pages** (App Router):
- `/` → Home (dashboard with recent feedback, top votes, roadmap highlights)
- `/feedback` → Feedback list (filterable, sortable)
- `/feedback/new` → Submit feedback
- `/feedback/[id]` → Feedback detail + voting + comments
- `/roadmap` → Roadmap board (now/next/later columns)
- `/features` → Feature catalog
- `/research/panels` → Panel list (RESEARCHER/PM)
- `/research/panels/[id]` → Panel detail + members
- `/research/questionnaires` → Questionnaire list
- `/research/questionnaires/new` → Create questionnaire (RESEARCHER/PM)
- `/research/questionnaires/[id]` → Questionnaire detail + responses
- `/research/sessions` → Session calendar (RESEARCHER)
- `/research/sessions/[id]` → Session detail + notes
- `/moderation` → Moderation queue (MODERATOR/PM/PO)
- `/settings` → User settings (profile, consents, notifications)
- `/admin` → Admin panel (user management, roles, system config) (ADMIN only)

**Shadcn Components**:
- Button, Input, Textarea, Select, Checkbox, RadioGroup → forms
- Card, Badge, Avatar → feedback/roadmap items
- Table, DataTable → lists
- Dialog, Sheet → modals, sidebars
- Toast → notifications
- Tabs → section navigation
- Calendar → session scheduling
- Chart (via recharts) → analytics dashboards
- Accordion → FAQ, settings
- Combobox → multi-select (features, tags)

---

## 6. User Stories (Epics)

### Epic 1: Feedback Collection
- US-1.1: As a USER, I want to submit feedback about my village's check-in process so that PMs can improve it
- US-1.2: As a USER, I want to see if similar feedback already exists to avoid duplicates
- US-1.3: As a USER, I want to edit my feedback within 15 minutes if I made a mistake
- US-1.4: As a PM, I want to merge duplicate feedback to consolidate votes and discussions

### Epic 2: Voting & Prioritization
- US-2.1: As a USER, I want to vote on feedback to signal importance
- US-2.2: As a PM, I want to see weighted vote scores to understand true priority (considering roles, villages, panel membership)
- US-2.3: As a PO, I want votes to decay over time so recent interest is prioritized

### Epic 3: Roadmap & Communications
- US-3.1: As a PM, I want to create roadmap items linked to feedback and features
- US-3.2: As a USER, I want to receive in-app notifications when roadmap items I voted on are shipped
- US-3.3: As a PO, I want to publish monthly roadmap updates filtered by village and language

### Epic 4: Research Panels
- US-4.1: As a RESEARCHER, I want to create a panel of FOH staff who consented to research
- US-4.2: As a USER, I want to opt into research panels to help shape products
- US-4.3: As a RESEARCHER, I want to set quotas to ensure proportional village representation

### Epic 5: Questionnaires
- US-5.1: As a RESEARCHER, I want to deploy an NPS questionnaire to a specific panel
- US-5.2: As a USER, I want to complete a questionnaire in-app in my preferred language
- US-5.3: As a RESEARCHER, I want to export aggregate results to CSV (without PII)

### Epic 6: Research Sessions
- US-6.1: As a RESEARCHER, I want to schedule a usability test with 5 panel members
- US-6.2: As a USER, I want to receive a session invite with calendar link
- US-6.3: As a RESEARCHER, I want to record the session and store encrypted notes

### Epic 7: Moderation
- US-7.1: As a MODERATOR, I want to review flagged feedback for toxicity/spam
- US-7.2: As a SYSTEM, I want to auto-redact PII from feedback before it's published
- US-7.3: As a MODERATOR, I want to approve/reject feedback within 48 hours

### Epic 8: Multi-Village Identity
- US-8.1: As a USER, I want my feedback history to persist when I transfer villages
- US-8.2: As an ADMIN, I want to link user accounts to HRIS via employee_id
- US-8.3: As a USER, I want to recover my account if I change my email

### Epic 9: GDPR Compliance
- US-9.1: As a USER, I want to grant/revoke consent for research, analytics, and emails
- US-9.2: As a USER, I want to export all my data
- US-9.3: As a USER, I want to request account deletion (right to be forgotten)

### Epic 10: Analytics & Metrics
- US-10.1: As a PM, I want to see feedback volume trends over the last 7 days
- US-10.2: As a PO, I want to track idea-to-delivery time per product area
- US-10.3: As a RESEARCHER, I want to see questionnaire completion rates

---

## 7. Acceptance Criteria

### AC-FEED-001: Feedback Submission
- GIVEN a logged-in USER
- WHEN they submit feedback with title "Add passport scan" and body "Would reduce queue time"
- THEN a new feedback item is created with id `fb_${ulid}`, state=new, moderation_status=auto_pending
- AND PII is auto-redacted if present
- AND duplicate suggestions are shown if title matches existing feedback >0.86 similarity

### AC-VOTE-001: Weighted Voting
- GIVEN a USER (role weight 1x) and a PM (role weight 3x)
- WHEN both vote on the same feedback item
- THEN the total weighted score is 4
- AND the vote count display shows "2 votes (weight: 4)"

### AC-ROAD-001: Roadmap Publication
- GIVEN a PM creates a roadmap item with stage=next
- WHEN they publish it with audience filter: villages=[all], languages=[en, fr]
- THEN all users receive an in-app notification in their language
- AND an email is sent to users who opted into email_updates consent

### AC-RES-001: Questionnaire Completion
- GIVEN a questionnaire with 2 questions (NPS + text)
- WHEN a USER completes and submits it
- THEN a QuestionnaireResponse is created
- AND the completion rate metric increments
- AND the user cannot submit again (one response per user per questionnaire)

---

## 8. Out of Scope (v0.5.0)

- Mobile native apps (iOS/Android) → web-responsive only
- Real-time collaboration (e.g., live comments) → async only
- Advanced analytics (ML-based clustering, sentiment analysis) → manual tagging only
- Multi-tenancy beyond villages → single Club Med org only
- Public API for third-party integrations → internal use only
- Video recording upload → external link only

---

## 9. Dependencies & Risks

### Dependencies
- Azure AD / Keycloak availability for SSO
- SendGrid account for email delivery
- HRIS API for employee_id sync

### Risks
- **Risk 1**: SQLite performance degrades beyond 100k records → **Mitigation**: Plan PostgreSQL migration path
- **Risk 2**: Low user adoption → **Mitigation**: Onboarding campaign, in-village ambassadors
- **Risk 3**: PII leakage in feedback → **Mitigation**: Auto-redaction + moderation SLA
- **Risk 4**: Vote manipulation → **Mitigation**: Rate limiting, role-based weights, audit logs

---

## 10. Release Plan

### Phase 1: MVP (Weeks 1-8)
- Auth (Azure AD/Keycloak)
- Feedback CRUD + voting
- Feature catalog
- Basic roadmap (read-only)
- User settings (consents)
- Moderation queue

### Phase 2: Research Tools (Weeks 9-12)
- Panels management
- Questionnaires (Likert, NPS, text)
- In-app questionnaire delivery

### Phase 3: Advanced Features (Weeks 13-16)
- Research sessions scheduling
- Roadmap communications (email, in-app)
- Analytics dashboards
- HRIS sync

### Phase 4: Polish & Scale (Weeks 17-20)
- Performance optimization
- PostgreSQL migration
- Advanced moderation (toxicity ML)
- Jira/Figma integrations

---

## 11. Appendices

### Appendix A: Glossary
- **ULID**: Universally Unique Lexicographically Sortable Identifier
- **NPS**: Net Promoter Score (0-10 scale)
- **PII**: Personally Identifiable Information
- **HRIS**: Human Resources Information System
- **FOH**: Front of House (guest-facing staff)

### Appendix B: Design References
- Shadcn UI: https://ui.shadcn.com
- Next.js 14 Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

### Appendix C: DSL Source
- Full specification: `dsl/global.yaml`
- Schema version: 0.5.0

---

**Document Owner**: Product Team
**Approval Required**: PO, Engineering Lead, UX Lead
**Next Review**: After Phase 1 completion
