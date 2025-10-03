-- Odyssey Feedback: Task Breakdown
-- Generated from PRD based on dsl/global.yaml

-- ============================================================================
-- PHASE 1: PROJECT SETUP & INFRASTRUCTURE (Priority 1-2, Epic: Foundation)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, acceptance_criteria) VALUES
('TASK-001', 'Initialize Next.js 14 project with TypeScript',
 'Create Next.js 14 project using App Router, configure TypeScript, ESLint, Prettier. Set up folder structure: app/, components/, lib/, types/.',
 'Setup', 'Foundation', 1, 2,
 'nextjs,typescript',
 'Next.js app runs on localhost:3000, TypeScript compiles without errors, ESLint passes'),

('TASK-002', 'Install and configure Shadcn UI',
 'Install Shadcn CLI, initialize with default config, set up Tailwind CSS theme with Club Med brand colors (if provided).',
 'Setup', 'Foundation', 1, 1.5,
 'shadcn,tailwind',
 'Shadcn components available via CLI, theme tokens configured in tailwind.config.ts'),

('TASK-003', 'Set up Prisma ORM with SQLite',
 'Install Prisma, initialize with SQLite provider, configure schema location at prisma/schema.prisma.',
 'Setup', 'Foundation', 1, 1,
 'prisma,sqlite',
 'Prisma CLI works, can generate client, migrations folder created'),

('TASK-004', 'Define Prisma schema: User, Village, Role enums',
 'Create User model (id, employeeId, email, displayName, currentVillageId, villageHistory JSON, consents JSON, role enum, timestamps). Create Village model. Define Role enum (USER, PM, PO, RESEARCHER, ADMIN, MODERATOR).',
 'Database', 'Foundation', 2, 3,
 'prisma',
 'Prisma schema compiles, unique constraints on employeeId and email, role enum matches DSL'),

('TASK-005', 'Define Prisma schema: Feature, ProductArea enum',
 'Create Feature model (id, title, area enum, tags String[], status enum, timestamps). Define ProductArea enum (Reservations, CheckIn, Payments, Housekeeping, Backoffice). Define FeatureStatus enum (idea, discovery, shaping, in_progress, released, generally_available, deprecated).',
 'Database', 'Foundation', 2, 2,
 'prisma',
 'Feature model created, enums match DSL specifications'),

('TASK-006', 'Define Prisma schema: Feedback, FeedbackState, ModerationStatus',
 'Create Feedback model (id, authorId FK, title, body, visibility enum, source enum, villageContext optional, featureRefs String[], duplicateOf optional, state enum, moderationStatus enum, moderationSignals String[], editableUntil DateTime, timestamps). Define enums.',
 'Database', 'Foundation', 2, 3,
 'prisma',
 'Feedback model with relations to User and Feature, enums match DSL'),

('TASK-007', 'Define Prisma schema: Vote',
 'Create Vote model (id, feedbackId FK, userId FK, weight Float, timestamps). Add unique constraint on (feedbackId, userId).',
 'Database', 'Foundation', 2, 1.5,
 'prisma',
 'Vote model with composite unique constraint, relations to Feedback and User'),

('TASK-008', 'Define Prisma schema: RoadmapItem',
 'Create RoadmapItem model (id, title, stage enum, featureIds String[], feedbackIds String[], jiraLinks String[], figmaLinks String[], successCriteria JSON, guardrails JSON, timestamps). Define RoadmapStage enum (now, next, later, under_consideration).',
 'Database', 'Foundation', 2, 2,
 'prisma',
 'RoadmapItem model created with JSON fields, stage enum matches DSL'),

('TASK-009', 'Define Prisma schema: Panel, PanelMembership',
 'Create Panel model (id, name, eligibilityRules JSON, sizeTarget Int, quotas JSON, timestamps). Create PanelMembership model (id, panelId FK, userId FK, joinedAt).',
 'Database', 'Foundation', 2, 2,
 'prisma',
 'Panel and PanelMembership models with relations'),

('TASK-010', 'Define Prisma schema: Questionnaire, QuestionnaireResponse',
 'Create Questionnaire model (id, title, version, questions JSON, targeting JSON, delivery JSON, startAt, endAt, maxResponses Int, timestamps). Create QuestionnaireResponse model (id, questionnaireId FK, respondentId FK, answers JSON, completedAt).',
 'Database', 'Foundation', 2, 2.5,
 'prisma',
 'Questionnaire and QuestionnaireResponse models with JSON fields for flexibility'),

('TASK-011', 'Define Prisma schema: Session, Event',
 'Create Session model (id, type enum, scheduledAt, durationMinutes Int, facilitatorIds String[], participantIds String[], prototypeLink optional, recordingUri optional, notesEncrypted Text, timestamps). Create Event model (id, type String, payload JSON, createdAt).',
 'Database', 'Foundation', 2, 2,
 'prisma',
 'Session and Event models created, SessionType enum defined'),

('TASK-012', 'Run Prisma migrations and seed basic data',
 'Create initial migration, seed villages (vlg-001: La Rosière), seed test users with different roles, seed sample features.',
 'Database', 'Foundation', 2, 2,
 'prisma',
 'Database migrated, seed script runs successfully, can query test data');

-- ============================================================================
-- PHASE 1: AUTHENTICATION (Priority 2-3, Epic: Auth)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-013', 'Install and configure NextAuth.js',
 'Install next-auth, create [...nextauth]/route.ts API route, configure session strategy (JWT), add NEXTAUTH_SECRET env var.',
 'Auth', 'Auth', 2, 2,
 'nextjs,nextauth',
 '["TASK-003"]',
 'NextAuth API route responds, session accessible via getServerSession'),

('TASK-014', 'Configure Azure AD provider in NextAuth',
 'Add Azure AD OAuth provider, configure client ID/secret, set up callback URLs, map Azure AD claims to User model fields (employeeId from AD claims).',
 'Auth', 'Auth', 3, 3,
 'nextjs,nextauth',
 '["TASK-013"]',
 'Can sign in with Azure AD test account, user created/updated in database'),

('TASK-015', 'Configure Keycloak provider in NextAuth',
 'Add Keycloak OAuth provider, configure realm URL, client ID/secret, map Keycloak claims to User model.',
 'Auth', 'Auth', 3, 3,
 'nextjs,nextauth',
 '["TASK-013"]',
 'Can sign in with Keycloak test account, user created in database'),

('TASK-016', 'Implement user session middleware',
 'Create middleware.ts to protect routes, redirect unauthenticated users to sign-in, attach user session to request context.',
 'Auth', 'Auth', 2, 2,
 'nextjs,nextauth',
 '["TASK-014"]',
 'Protected routes redirect to /auth/signin, authenticated users can access app'),

('TASK-017', 'Build sign-in page UI',
 'Create /app/auth/signin/page.tsx with Shadcn Button components for Azure AD and Keycloak sign-in, Club Med branding.',
 'UI', 'Auth', 3, 2,
 'nextjs,shadcn',
 '["TASK-002", "TASK-014"]',
 'Sign-in page renders, buttons trigger OAuth flows'),

('TASK-018', 'Implement user profile sync on sign-in',
 'On successful auth, upsert User record: update displayName, email, currentVillageId from IDP claims, append to villageHistory if village changed.',
 'Backend', 'Auth', 3, 3,
 'nextjs,prisma',
 '["TASK-014", "TASK-004"]',
 'User attributes sync from IDP, villageHistory array grows on village transfer');

-- ============================================================================
-- PHASE 1: FEEDBACK CRUD (Priority 3-4, Epic: Feedback)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-019', 'Create API route: POST /api/feedback (create)',
 'Validate input (title 8-120 chars, body 20-5000 chars), generate fb_ULID, set state=new, moderationStatus=auto_pending, editableUntil=now+15min, save to DB. Apply rate limit (10/user/day).',
 'Backend', 'Feedback', 3, 4,
 'nextjs,prisma',
 '["TASK-006", "TASK-016"]',
 'Accepts JSON, returns created feedback, enforces rate limit, validation errors return 400'),

('TASK-020', 'Create API route: GET /api/feedback (list)',
 'Support query params: state, area, villageId, search (fuzzy title/body), page, limit. Return paginated results with vote counts.',
 'Backend', 'Feedback', 3, 3,
 'nextjs,prisma',
 '["TASK-006"]',
 'Returns filtered, paginated feedback list, includes total count for pagination'),

('TASK-021', 'Create API route: GET /api/feedback/:id (detail)',
 'Fetch feedback by ID, include author details, feature refs, vote count/weight, duplicate links.',
 'Backend', 'Feedback', 3, 2,
 'nextjs,prisma',
 '["TASK-006"]',
 'Returns single feedback with relations, 404 if not found'),

('TASK-022', 'Create API route: PATCH /api/feedback/:id (edit)',
 'Check: user is author AND within editableUntil window, OR user has PM/PO role. Update title/body, re-run PII redaction.',
 'Backend', 'Feedback', 3, 3,
 'nextjs,prisma',
 '["TASK-019"]',
 'Edits allowed within 15min or by PM/PO, returns 403 otherwise'),

('TASK-023', 'Implement PII auto-redaction helper',
 'Create lib/pii-redact.ts with regex patterns for phone, email, room_number, reservation_id. Mask with ***[last4]. Apply on feedback create/edit.',
 'Backend', 'Feedback', 4, 3,
 'typescript',
 '["TASK-019"]',
 'Function detects and redacts PII patterns, unit tests pass'),

('TASK-024', 'Implement fuzzy duplicate detection',
 'Create lib/fuzzy-match.ts using string similarity (e.g., dice coefficient). Threshold 0.86. API endpoint GET /api/feedback/:id/duplicates.',
 'Backend', 'Feedback', 4, 4,
 'typescript',
 '["TASK-019"]',
 'Returns similar feedback items, threshold configurable, unit tests pass'),

('TASK-025', 'Create API route: POST /api/feedback/:id/merge',
 'Merge feedback A into B: set A.duplicateOf=B.id, A.state=merged, transfer votes from A to B. PM/PO only.',
 'Backend', 'Feedback', 4, 3,
 'nextjs,prisma',
 '["TASK-021", "TASK-024"]',
 'Votes consolidated, merged feedback hidden from main list, transaction ensures atomicity'),

('TASK-026', 'Build feedback list page: /feedback',
 'Use Shadcn DataTable, Card components. Show title, author, vote count, state badge. Filters: state, area, search bar. Pagination.',
 'UI', 'Feedback', 3, 5,
 'nextjs,shadcn',
 '["TASK-020", "TASK-002"]',
 'Responsive table, filters work, pagination functional, links to detail page'),

('TASK-027', 'Build feedback detail page: /feedback/[id]',
 'Show full feedback (title, body, author, timestamps, state). Display vote button, vote count, linked features. Show duplicate suggestions.',
 'UI', 'Feedback', 3, 4,
 'nextjs,shadcn',
 '["TASK-021", "TASK-002"]',
 'Detail page renders, vote button visible, duplicate suggestions shown'),

('TASK-028', 'Build feedback submission form: /feedback/new',
 'Shadcn Form with Input (title), Textarea (body), Combobox (feature refs), file upload (attachments). Show duplicate suggestions on title blur. Multi-language toggle (EN/FR).',
 'UI', 'Feedback', 3, 6,
 'nextjs,shadcn',
 '["TASK-019", "TASK-024", "TASK-002"]',
 'Form validates client-side, shows real-time duplicate suggestions, submits to API, redirects to detail on success'),

('TASK-029', 'Implement feedback edit UI (within 15min window)',
 'On detail page, show Edit button if user is author and within editableUntil. Reuse submission form in edit mode.',
 'UI', 'Feedback', 4, 2,
 'nextjs,shadcn',
 '["TASK-027", "TASK-028"]',
 'Edit button visible if eligible, form pre-filled, saves via PATCH API');

-- ============================================================================
-- PHASE 1: VOTING (Priority 3-4, Epic: Voting)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-030', 'Implement vote weight calculation logic',
 'Create lib/vote-weight.ts: calculate weight from user role (USER:1x, PM:3x, PO:5x, RESEARCHER:2x), village priority (from config), panel membership (+1.5x). Apply 180-day decay formula.',
 'Backend', 'Voting', 3, 4,
 'typescript',
 '["TASK-004"]',
 'Function returns weighted score, decay applied correctly, unit tests cover all roles and decay scenarios'),

('TASK-031', 'Create API route: POST /api/feedback/:id/vote',
 'Upsert vote (one per user per feedback). Calculate weight using lib/vote-weight. Return updated vote count and weight.',
 'Backend', 'Voting', 3, 3,
 'nextjs,prisma',
 '["TASK-030", "TASK-007"]',
 'Vote created/updated, weight calculated, unique constraint enforced'),

('TASK-032', 'Create API route: DELETE /api/feedback/:id/vote',
 'Remove user vote on feedback, recalculate vote count.',
 'Backend', 'Voting', 4, 1.5,
 'nextjs,prisma',
 '["TASK-031"]',
 'Vote deleted, 404 if no vote exists'),

('TASK-033', 'Add vote count/weight to feedback list API',
 'Aggregate votes on feedback query, return voteCount (number of votes) and voteWeight (sum of weights).',
 'Backend', 'Voting', 3, 2,
 'nextjs,prisma',
 '["TASK-020", "TASK-031"]',
 'Feedback list includes voteCount and voteWeight fields'),

('TASK-034', 'Build vote button component',
 'Shadcn Button with vote icon. Show vote count and weighted score. Toggle state if user has voted. Tooltip explaining weight calculation.',
 'UI', 'Voting', 3, 3,
 'nextjs,shadcn',
 '["TASK-031", "TASK-002"]',
 'Button toggles voted state, updates count optimistically, tooltip shows weight breakdown'),

('TASK-035', 'Add vote sorting to feedback list',
 'Allow sort by: newest, most votes, highest weight. Default: highest weight.',
 'UI', 'Voting', 4, 2,
 'nextjs,shadcn',
 '["TASK-026", "TASK-033"]',
 'Sorting dropdown works, updates URL params, persists across page reloads');

-- ============================================================================
-- PHASE 1: FEATURES CATALOG (Priority 4, Epic: Features)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-036', 'Create API route: GET /api/features (list)',
 'Return all features, filterable by area and status. Include id, title, area, tags, status.',
 'Backend', 'Features', 4, 2,
 'nextjs,prisma',
 '["TASK-005"]',
 'Returns features array, filters work, sorted by title'),

('TASK-037', 'Create API route: POST /api/features (create, PM/PO)',
 'Validate input, generate feat-* ID (or accept custom), save feature. Role check: PM, PO, ADMIN.',
 'Backend', 'Features', 4, 2.5,
 'nextjs,prisma',
 '["TASK-036", "TASK-016"]',
 'Feature created, 403 if not PM/PO, validation errors return 400'),

('TASK-038', 'Create API route: PATCH /api/features/:id (update, PM/PO)',
 'Update feature title, area, tags, status. Role check: PM, PO, ADMIN.',
 'Backend', 'Features', 4, 2,
 'nextjs,prisma',
 '["TASK-037"]',
 'Feature updated, 403 if unauthorized'),

('TASK-039', 'Build features catalog page: /features',
 'Shadcn Table or Card grid. Show feature title, area badge, status badge, tags. Filter by area and status.',
 'UI', 'Features', 4, 4,
 'nextjs,shadcn',
 '["TASK-036", "TASK-002"]',
 'Catalog renders, filters work, responsive layout'),

('TASK-040', 'Build feature create/edit form (PM/PO only)',
 'Form: title, area select, tags input (comma-separated), status select. Accessible from /features page.',
 'UI', 'Features', 4, 3,
 'nextjs,shadcn',
 '["TASK-037", "TASK-038", "TASK-002"]',
 'Form validates, submits to API, redirects to catalog, role-gated UI');

-- ============================================================================
-- PHASE 1: MODERATION (Priority 4, Epic: Moderation)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-041', 'Implement auto-screening on feedback submit',
 'On POST /api/feedback, run PII redaction, add toxicity/spam signals (stub for now, can integrate ML later). Set moderationStatus based on signals.',
 'Backend', 'Moderation', 4, 3,
 'nextjs',
 '["TASK-023", "TASK-019"]',
 'Feedback with high toxicity/spam score set to auto_pending, clean feedback set to approved'),

('TASK-042', 'Create API route: GET /api/moderation/queue',
 'Return feedback where moderationStatus=auto_pending, ordered by createdAt. MODERATOR, PM, PO only.',
 'Backend', 'Moderation', 4, 2,
 'nextjs,prisma',
 '["TASK-041", "TASK-016"]',
 'Returns moderation queue, role-gated'),

('TASK-043', 'Create API routes: POST /api/moderation/:id/approve, /reject',
 'Update moderationStatus to approved or rejected. Log moderator userId and timestamp.',
 'Backend', 'Moderation', 4, 2,
 'nextjs,prisma',
 '["TASK-042"]',
 'Status updated, audit trail saved, 403 if unauthorized'),

('TASK-044', 'Build moderation queue page: /moderation',
 'Shadcn DataTable with feedback title, author, signals, timestamps. Actions: Approve, Reject buttons. Show SLA timer (48h warning).',
 'UI', 'Moderation', 4, 5,
 'nextjs,shadcn',
 '["TASK-042", "TASK-043", "TASK-002"]',
 'Queue renders, actions work, SLA indicator shows time remaining, role-gated page');

-- ============================================================================
-- PHASE 1: USER SETTINGS (Priority 4, Epic: Settings)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-045', 'Create API route: GET /api/users/me',
 'Return current user profile: id, employeeId, email, displayName, currentVillageId, role, consents, villageHistory.',
 'Backend', 'Settings', 4, 1.5,
 'nextjs,prisma',
 '["TASK-016"]',
 'Returns user object, 401 if unauthenticated'),

('TASK-046', 'Create API route: PATCH /api/users/me',
 'Update user profile: displayName, consents. Cannot change email or role (requires admin).',
 'Backend', 'Settings', 4, 2,
 'nextjs,prisma',
 '["TASK-045"]',
 'Profile updated, validation errors return 400'),

('TASK-047', 'Build user settings page: /settings',
 'Shadcn Form with Input (displayName), Checkbox group (consents: research_contact, usage_analytics, email_updates). Show current village, village history (read-only).',
 'UI', 'Settings', 4, 4,
 'nextjs,shadcn',
 '["TASK-045", "TASK-046", "TASK-002"]',
 'Settings page renders, form saves via API, consent checkboxes work');

-- ============================================================================
-- PHASE 1: BASIC ROADMAP (READ-ONLY) (Priority 5, Epic: Roadmap)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-048', 'Create API route: GET /api/roadmap',
 'Return roadmap items, filterable by stage, area. Include linked features and feedback.',
 'Backend', 'Roadmap', 5, 2.5,
 'nextjs,prisma',
 '["TASK-008"]',
 'Returns roadmap items with relations, filters work'),

('TASK-049', 'Build roadmap board page: /roadmap (read-only)',
 'Shadcn Card components in Kanban columns (Now, Next, Later, Under Consideration). Show title, linked features, vote count on linked feedback.',
 'UI', 'Roadmap', 5, 5,
 'nextjs,shadcn',
 '["TASK-048", "TASK-002"]',
 'Board renders, cards grouped by stage, responsive layout, links to feedback detail');

-- ============================================================================
-- PHASE 2: RESEARCH PANELS (Priority 5, Epic: Research Panels)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-050', 'Create API route: GET /api/panels',
 'Return panels list with member counts. Include eligibility rules summary.',
 'Backend', 'Research Panels', 5, 2,
 'nextjs,prisma',
 '["TASK-009"]',
 'Returns panels array with member counts'),

('TASK-051', 'Create API route: POST /api/panels (RESEARCHER/PM)',
 'Create panel with name, eligibilityRules JSON, sizeTarget, quotas JSON. Validate role.',
 'Backend', 'Research Panels', 5, 3,
 'nextjs,prisma',
 '["TASK-050", "TASK-016"]',
 'Panel created, 403 if unauthorized, validation enforced'),

('TASK-052', 'Create API route: GET /api/panels/:id',
 'Return panel details + current members list (userId, displayName, joinedAt).',
 'Backend', 'Research Panels', 5, 2,
 'nextjs,prisma',
 '["TASK-050"]',
 'Returns panel with members, 404 if not found'),

('TASK-053', 'Create API route: POST /api/panels/:id/members (invite)',
 'Add users to panel by userId array. Check eligibility rules (role, village, consents, attributes). RESEARCHER/PM only.',
 'Backend', 'Research Panels', 5, 4,
 'nextjs,prisma',
 '["TASK-052"]',
 'Members added if eligible, errors for ineligible users, quota enforcement'),

('TASK-054', 'Create API route: DELETE /api/panels/:id/members/:userId',
 'Remove user from panel. RESEARCHER/PM only.',
 'Backend', 'Research Panels', 5, 1.5,
 'nextjs,prisma',
 '["TASK-053"]',
 'Member removed, 404 if not in panel'),

('TASK-055', 'Build panels list page: /research/panels (RESEARCHER/PM)',
 'Shadcn Table: panel name, member count, size target, actions (view, edit). Create button.',
 'UI', 'Research Panels', 5, 3,
 'nextjs,shadcn',
 '["TASK-050", "TASK-002"]',
 'List renders, role-gated, create button navigates to form'),

('TASK-056', 'Build panel detail page: /research/panels/[id]',
 'Show panel info, eligibility rules (formatted JSON), members table with invite/remove buttons. Quota progress bar.',
 'UI', 'Research Panels', 5, 5,
 'nextjs,shadcn',
 '["TASK-052", "TASK-053", "TASK-002"]',
 'Detail page renders, invite modal works, remove button functional'),

('TASK-057', 'Build panel create form (RESEARCHER/PM)',
 'Form: name, eligibility rules builder (role multi-select, village multi-select, attribute filters), size target, quotas. Modal or dedicated page.',
 'UI', 'Research Panels', 5, 6,
 'nextjs,shadcn',
 '["TASK-051", "TASK-002"]',
 'Form submits eligibility rules as JSON, validation works, creates panel via API');

-- ============================================================================
-- PHASE 2: QUESTIONNAIRES (Priority 5-6, Epic: Questionnaires)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-058', 'Create API route: GET /api/questionnaires',
 'Return questionnaires list. Filter by status (draft, active, closed). Include response count.',
 'Backend', 'Questionnaires', 5, 2,
 'nextjs,prisma',
 '["TASK-010"]',
 'Returns questionnaires with response counts'),

('TASK-059', 'Create API route: POST /api/questionnaires (RESEARCHER/PM)',
 'Create questionnaire: title, version, questions JSON array (id, type, text i18n, required, scale/options). Status=draft.',
 'Backend', 'Questionnaires', 5, 4,
 'nextjs,prisma',
 '["TASK-058", "TASK-016"]',
 'Questionnaire created, validation on question types, 403 if unauthorized'),

('TASK-060', 'Create API route: GET /api/questionnaires/:id',
 'Return questionnaire details with questions. Include response count and completion rate.',
 'Backend', 'Questionnaires', 5, 2,
 'nextjs,prisma',
 '["TASK-058"]',
 'Returns questionnaire, 404 if not found'),

('TASK-061', 'Create API route: POST /api/questionnaires/:id/publish',
 'Set status=active, validate targeting (panels, villages, features), set startAt/endAt, maxResponses. RESEARCHER/PM only.',
 'Backend', 'Questionnaires', 5, 3,
 'nextjs,prisma',
 '["TASK-060"]',
 'Questionnaire activated, targeting validated, 403 if unauthorized'),

('TASK-062', 'Create API route: POST /api/questionnaires/:id/responses',
 'Submit questionnaire response: answers JSON (keyed by question id). Check: user eligible (panel membership, targeting filters), not already responded, within start/end dates.',
 'Backend', 'Questionnaires', 5, 4,
 'nextjs,prisma',
 '["TASK-061", "TASK-010"]',
 'Response saved, one per user enforced, validation on answers, maxResponses limit'),

('TASK-063', 'Create API route: GET /api/questionnaires/:id/analytics (RESEARCHER/PM)',
 'Aggregate responses: NPS score, Likert averages, MCQ distribution, text responses (redacted PII). Export as JSON, CSV, or Parquet.',
 'Backend', 'Questionnaires', 6, 5,
 'nextjs,prisma',
 '["TASK-062"]',
 'Returns aggregate stats, export formats work, PII excluded, 403 if unauthorized'),

('TASK-064', 'Build questionnaires list page: /research/questionnaires',
 'Shadcn Table: title, version, status badge, response count, completion rate. Create button (RESEARCHER/PM).',
 'UI', 'Questionnaires', 5, 3,
 'nextjs,shadcn',
 '["TASK-058", "TASK-002"]',
 'List renders, role-gated create, links to detail/analytics'),

('TASK-065', 'Build questionnaire create/edit form (RESEARCHER/PM)',
 'Multi-step form: 1) Title, version. 2) Question builder (add question modal: type select, text i18n, scale/options, required checkbox). 3) Targeting (panels multi-select, village/feature filters). 4) Delivery (mode, dates, maxResponses). Save as draft.',
 'UI', 'Questionnaires', 5, 8,
 'nextjs,shadcn',
 '["TASK-059", "TASK-002"]',
 'Form creates questionnaire, question builder works, targeting saves as JSON, validation passes'),

('TASK-066', 'Build questionnaire response form (in-app)',
 'Dynamic form rendering based on questions JSON. Support Likert (radio 1-5), NPS (radio 0-10), MCQ (radio), checkbox, text, number. Multi-language display (EN/FR). Submit button.',
 'UI', 'Questionnaires', 5, 6,
 'nextjs,shadcn',
 '["TASK-062", "TASK-002"]',
 'Form renders dynamically, all question types work, i18n text displays, submits to API, one response per user'),

('TASK-067', 'Build questionnaire analytics page: /research/questionnaires/[id]/analytics',
 'Show aggregate stats: NPS score, Likert charts (bar/line), MCQ pie charts, text response list (redacted). Export buttons (CSV, JSON). RESEARCHER/PM only.',
 'UI', 'Questionnaires', 6, 6,
 'nextjs,shadcn,recharts',
 '["TASK-063", "TASK-002"]',
 'Charts render, export works, role-gated, PII excluded from text responses');

-- ============================================================================
-- PHASE 2: IN-APP QUESTIONNAIRE DELIVERY (Priority 6, Epic: Questionnaires)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-068', 'Build user questionnaire inbox: /research/my-questionnaires',
 'List active questionnaires targeted to current user (check panel membership, targeting filters). Show: title, deadline, completed status. Link to response form.',
 'UI', 'Questionnaires', 6, 4,
 'nextjs,shadcn',
 '["TASK-062", "TASK-002"]',
 'Inbox renders questionnaires eligible for user, completion status shown, links to response form'),

('TASK-069', 'Add in-app notification for new questionnaires',
 'On user login or dashboard visit, show badge/toast if new questionnaires available. Use Shadcn Toast component.',
 'UI', 'Questionnaires', 6, 3,
 'nextjs,shadcn',
 '["TASK-068", "TASK-002"]',
 'Notification appears for new questionnaires, links to inbox');

-- ============================================================================
-- PHASE 3: RESEARCH SESSIONS (Priority 6, Epic: Sessions)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-070', 'Create API route: GET /api/sessions',
 'Return sessions list. Filter by type, date range, facilitator. Include participant count. RESEARCHER only (or participants can see their own).',
 'Backend', 'Sessions', 6, 2.5,
 'nextjs,prisma',
 '["TASK-011"]',
 'Returns sessions, filters work, role-gated or scoped to user'),

('TASK-071', 'Create API route: POST /api/sessions (RESEARCHER)',
 'Create session: type, scheduledAt, durationMinutes, facilitatorIds, participantIds (from panel or custom), prototypeLink. Status=scheduled.',
 'Backend', 'Sessions', 6, 3.5,
 'nextjs,prisma',
 '["TASK-070", "TASK-016"]',
 'Session created, 403 if not RESEARCHER, validation on participant limits (1-6)'),

('TASK-072', 'Create API route: PATCH /api/sessions/:id (update)',
 'Update session details (date, participants, etc.). RESEARCHER only.',
 'Backend', 'Sessions', 6, 2,
 'nextjs,prisma',
 '["TASK-071"]',
 'Session updated, 403 if unauthorized'),

('TASK-073', 'Create API route: POST /api/sessions/:id/complete',
 'Mark session as completed, upload recordingUri and encrypted notes. RESEARCHER only.',
 'Backend', 'Sessions', 6, 3,
 'nextjs,prisma',
 '["TASK-072"]',
 'Session marked complete, notes encrypted, 403 if unauthorized'),

('TASK-074', 'Build sessions calendar page: /research/sessions (RESEARCHER)',
 'Shadcn Calendar component showing scheduled sessions. Click date to view sessions that day. Create session button.',
 'UI', 'Sessions', 6, 5,
 'nextjs,shadcn',
 '["TASK-070", "TASK-002"]',
 'Calendar renders, sessions appear on dates, create button navigates to form'),

('TASK-075', 'Build session create/edit form (RESEARCHER)',
 'Form: type select, date/time picker (Shadcn Calendar + time input), duration, facilitators multi-select, participants (from panel or manual IDs), prototype link. Consent checkbox.',
 'UI', 'Sessions', 6, 6,
 'nextjs,shadcn',
 '["TASK-071", "TASK-002"]',
 'Form creates session, date/time picker works, participant selection validates (1-6), submits to API'),

('TASK-076', 'Build session detail page: /research/sessions/[id]',
 'Show session info, participants list, prototype link, facilitator notes (encrypted text area on complete), recording link. Complete button (RESEARCHER).',
 'UI', 'Sessions', 6, 4,
 'nextjs,shadcn',
 '["TASK-073", "TASK-002"]',
 'Detail page renders, complete action works, notes encrypted before save');

-- ============================================================================
-- PHASE 3: ROADMAP COMMUNICATIONS (Priority 6, Epic: Roadmap)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-077', 'Create API route: POST /api/roadmap (create, PM/PO)',
 'Create roadmap item: title, stage, featureIds, feedbackIds, jiraLinks, figmaLinks, successCriteria, guardrails. Status=draft.',
 'Backend', 'Roadmap', 6, 3,
 'nextjs,prisma',
 '["TASK-048", "TASK-016"]',
 'Roadmap item created, 403 if not PM/PO, validation passes'),

('TASK-078', 'Create API route: PATCH /api/roadmap/:id (update, PM/PO)',
 'Update roadmap item fields. PM/PO only.',
 'Backend', 'Roadmap', 6, 2,
 'nextjs,prisma',
 '["TASK-077"]',
 'Roadmap item updated, 403 if unauthorized'),

('TASK-079', 'Create API route: POST /api/roadmap/:id/publish (PM/PO)',
 'Publish roadmap update: send in-app notifications and emails to users matching audience filters (villages, roles, languages). Create changelog entry.',
 'Backend', 'Roadmap', 6, 5,
 'nextjs,prisma,sendgrid',
 '["TASK-078"]',
 'Notifications sent, emails queued, audience filters applied, 403 if unauthorized'),

('TASK-080', 'Build roadmap create/edit form (PM/PO)',
 'Form: title, stage, feature/feedback multi-select (Combobox), Jira/Figma links (text input), success criteria (key-value pairs), guardrails (key-value pairs). Modal or page.',
 'UI', 'Roadmap', 6, 6,
 'nextjs,shadcn',
 '["TASK-077", "TASK-078", "TASK-002"]',
 'Form creates/updates roadmap, multi-selects work, JSON fields saved correctly'),

('TASK-081', 'Build roadmap publish modal (PM/PO)',
 'Modal: cadence (monthly/ad-hoc), channels (checkboxes: in-app, email), audience filters (village multi-select, role multi-select, language multi-select). Publish button.',
 'UI', 'Roadmap', 6, 4,
 'nextjs,shadcn',
 '["TASK-079", "TASK-002"]',
 'Modal renders, filters work, publish action calls API, success toast shown'),

('TASK-082', 'Build in-app notification system',
 'Create Notification model (id, userId, type, title, body, link, readAt). API routes: GET /api/notifications (user inbox), PATCH /api/notifications/:id/read. Shadcn Toast or Bell icon with dropdown.',
 'Full Stack', 'Roadmap', 6, 8,
 'nextjs,prisma,shadcn',
 '["TASK-079", "TASK-002"]',
 'Notifications appear in UI, mark as read works, bell icon shows unread count');

-- ============================================================================
-- PHASE 3: EMAIL INTEGRATION (Priority 7, Epic: Integrations)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-083', 'Set up SendGrid API integration',
 'Install @sendgrid/mail, configure API key in env, create lib/email.ts with send function (to, subject, html, text).',
 'Backend', 'Integrations', 7, 2,
 'typescript,sendgrid',
 '["TASK-003"]',
 'SendGrid client configured, test email sends successfully'),

('TASK-084', 'Create email templates: Questionnaire invite (EN/FR)',
 'HTML email template with questionnaire title, deadline, link to response form. Text fallback. Use i18n for EN/FR versions.',
 'Backend', 'Integrations', 7, 3,
 'typescript',
 '["TASK-083"]',
 'Templates render correctly in both languages, variables interpolate'),

('TASK-085', 'Create email templates: Roadmap update (EN/FR)',
 'HTML template with roadmap item title, stage, summary, link to roadmap page. Text fallback. i18n.',
 'Backend', 'Integrations', 7, 3,
 'typescript',
 '["TASK-083"]',
 'Templates render, i18n works'),

('TASK-086', 'Integrate email sending in questionnaire publish',
 'On POST /api/questionnaires/:id/publish, if delivery.mode includes "email", send invite emails to eligible users (check consents: email_updates). Use template from TASK-084.',
 'Backend', 'Integrations', 7, 3,
 'typescript,sendgrid',
 '["TASK-084", "TASK-061"]',
 'Emails sent to eligible users, consent checked, rate-limited (batch sending if >100 users)'),

('TASK-087', 'Integrate email sending in roadmap publish',
 'On POST /api/roadmap/:id/publish, if channels include "email", send update emails to audience (filter by village, role, language, email_updates consent). Use template from TASK-085.',
 'Backend', 'Integrations', 7, 3,
 'typescript,sendgrid',
 '["TASK-085", "TASK-079"]',
 'Emails sent to filtered audience, consent enforced, batch sending works');

-- ============================================================================
-- PHASE 3: ANALYTICS DASHBOARDS (Priority 7, Epic: Analytics)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-088', 'Create API route: GET /api/metrics/feedback',
 'Return feedback metrics: feedback_volume_7d, vote_weight_sum, merge_rate. PM/PO only.',
 'Backend', 'Analytics', 7, 3,
 'nextjs,prisma',
 '["TASK-033", "TASK-016"]',
 'Returns metrics JSON, calculations correct, 403 if unauthorized'),

('TASK-089', 'Create API route: GET /api/metrics/research',
 'Return research metrics: questionnaire_completion_rate, recruitment_lead_time_days. RESEARCHER/PM only.',
 'Backend', 'Analytics', 7, 3,
 'nextjs,prisma',
 '["TASK-062", "TASK-016"]',
 'Returns metrics JSON, calculations correct, 403 if unauthorized'),

('TASK-090', 'Create API route: GET /api/metrics/product',
 'Return product metrics: nps_area (NPS by product area), idea_to_delivery_days. PM/PO only.',
 'Backend', 'Analytics', 7, 4,
 'nextjs,prisma',
 '["TASK-062", "TASK-016"]',
 'Returns metrics JSON, NPS grouped by area, 403 if unauthorized'),

('TASK-091', 'Build analytics dashboard page: /analytics (PM/PO/RESEARCHER)',
 'Use Shadcn + recharts. Show cards with key metrics (feedback volume, completion rates, NPS). Line chart for feedback volume over time. Bar chart for NPS by area. Table for top voted feedback.',
 'UI', 'Analytics', 7, 8,
 'nextjs,shadcn,recharts',
 '["TASK-088", "TASK-089", "TASK-090", "TASK-002"]',
 'Dashboard renders, charts display data, role-gated, responsive');

-- ============================================================================
-- PHASE 3: HRIS SYNC (Priority 8, Epic: Integrations)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-092', 'Create HRIS sync script (cron job)',
 'Script to fetch employee data from HRIS API (stub for now), match by employee_id, update User.displayName, currentVillageId, department. Run daily via cron or serverless function.',
 'Backend', 'Integrations', 8, 5,
 'typescript,prisma',
 '["TASK-004"]',
 'Script runs, users updated if changed, village transfers logged in villageHistory, error handling for missing employees'),

('TASK-093', 'Implement village transfer detection',
 'In HRIS sync, if currentVillageId changes, append to villageHistory: {village_id, from_date, to_date}. Update currentVillageId.',
 'Backend', 'Integrations', 8, 2,
 'typescript',
 '["TASK-092"]',
 'villageHistory array grows on transfer, timestamps accurate');

-- ============================================================================
-- PHASE 4: ADVANCED MODERATION (Priority 8, Epic: Moderation)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-094', 'Integrate toxicity detection API (optional)',
 'Call external toxicity API (e.g., Perspective API) on feedback.create, score text, add signal if score > threshold. Store score in moderationSignals.',
 'Backend', 'Moderation', 8, 4,
 'typescript',
 '["TASK-041"]',
 'Toxicity score added to feedback, high scores flag for review'),

('TASK-095', 'Implement spam detection heuristics',
 'Detect spam: short repetitive text, excessive caps, URL patterns, rate limit violations. Add spam signal if detected.',
 'Backend', 'Moderation', 8, 3,
 'typescript',
 '["TASK-041"]',
 'Spam detection works, signals added, unit tests pass');

-- ============================================================================
-- PHASE 4: JIRA & FIGMA INTEGRATIONS (Priority 8, Epic: Integrations)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-096', 'Create Jira link validation',
 'Validate Jira URLs (allowed project keys: ODYS, PMS). Display Jira issue title via API (optional).',
 'Backend', 'Integrations', 8, 3,
 'typescript',
 '["TASK-077"]',
 'Jira links validated, invalid links rejected, issue title fetched if API available'),

('TASK-097', 'Create Figma link validation',
 'Validate Figma URLs (allowed domain: figma.com). Embed Figma preview in roadmap detail (optional).',
 'Backend', 'Integrations', 8, 2,
 'typescript',
 '["TASK-077"]',
 'Figma links validated, preview embeds if URL is valid');

-- ============================================================================
-- PHASE 4: PERFORMANCE & SCALABILITY (Priority 9, Epic: Performance)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-098', 'Add database indexes for performance',
 'Prisma: index on Feedback.state, Feedback.createdAt, Vote.feedbackId, QuestionnaireResponse.questionnaireId. Run migration.',
 'Database', 'Performance', 9, 2,
 'prisma',
 '["TASK-012"]',
 'Indexes created, query performance improved (test with EXPLAIN)'),

('TASK-099', 'Implement API response caching (SWR/React Query)',
 'Use React Query or SWR for client-side caching of GET requests (feedback list, roadmap, features). Set staleTime appropriately.',
 'Frontend', 'Performance', 9, 3,
 'nextjs,react-query',
 '["TASK-026"]',
 'Cached requests reduce API calls, stale data refetches on focus'),

('TASK-100', 'Add rate limiting middleware',
 'Use next-rate-limit or similar. Limit: 100 req/min per IP for read endpoints, 10 req/min for write endpoints. Return 429 on exceed.',
 'Backend', 'Performance', 9, 3,
 'nextjs',
 '["TASK-016"]',
 'Rate limits enforced, 429 responses include Retry-After header'),

('TASK-101', 'Optimize feedback list query with pagination',
 'Ensure efficient cursor-based or offset pagination. Load max 50 items per page. Add indexes on sort columns.',
 'Backend', 'Performance', 9, 2,
 'nextjs,prisma',
 '["TASK-020", "TASK-098"]',
 'Pagination efficient even with 10k+ feedback items, response time <200ms'),

('TASK-102', 'Plan PostgreSQL migration path (documentation)',
 'Document migration steps: export SQLite data, set up PostgreSQL, update Prisma provider, run migrations, import data. Create migration guide.',
 'Documentation', 'Performance', 9, 3,
 'markdown',
 '["TASK-003"]',
 'Migration guide complete, tested with sample data export/import');

-- ============================================================================
-- PHASE 4: SECURITY & COMPLIANCE (Priority 9, Epic: Security)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-103', 'Add CSP headers to Next.js',
 'Configure Content-Security-Policy in next.config.js. Restrict script-src, style-src, img-src to trusted domains.',
 'Backend', 'Security', 9, 2,
 'nextjs',
 '["TASK-001"]',
 'CSP headers set, no inline scripts allowed, external resources whitelisted'),

('TASK-104', 'Implement GDPR data export API',
 'Create API route: GET /api/users/me/export. Return all user data (feedback, votes, responses, sessions) as JSON. User only.',
 'Backend', 'Security', 9, 4,
 'nextjs,prisma',
 '["TASK-045"]',
 'Export returns complete user data, JSON format, 401 if unauthenticated'),

('TASK-105', 'Implement GDPR account deletion API',
 'Create API route: DELETE /api/users/me. Soft delete or hard delete user + all related data (feedback, votes, responses). Requires confirmation token.',
 'Backend', 'Security', 9, 5,
 'nextjs,prisma',
 '["TASK-104"]',
 'Account deleted, related data removed, confirmation required, audit log created'),

('TASK-106', 'Add session encryption for research notes',
 'Encrypt Session.notesEncrypted using crypto library (AES-256). Decrypt only on view by RESEARCHER.',
 'Backend', 'Security', 9, 3,
 'typescript,crypto',
 '["TASK-073"]',
 'Notes encrypted at rest, decrypted on retrieval, key stored securely in env'),

('TASK-107', 'Implement audit logging for sensitive actions',
 'Log user actions: feedback.create, vote.cast, moderation.approve/reject, user.delete, roadmap.publish. Store in AuditLog table (userId, action, resourceId, timestamp).',
 'Backend', 'Security', 9, 4,
 'nextjs,prisma',
 '["TASK-016"]',
 'Audit logs created for all sensitive actions, queryable by ADMIN');

-- ============================================================================
-- PHASE 4: TESTING (Priority 10, Epic: Testing)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-108', 'Set up Jest and React Testing Library',
 'Install Jest, @testing-library/react, configure next.config.js for test env. Create sample component test.',
 'Testing', 'Testing', 10, 2,
 'jest,react-testing-library',
 '["TASK-001"]',
 'Jest runs, sample test passes, coverage report generated'),

('TASK-109', 'Write unit tests for vote weight calculation',
 'Test lib/vote-weight.ts: role weights, village priority, panel boost, decay formula. Cover edge cases.',
 'Testing', 'Testing', 10, 3,
 'jest',
 '["TASK-030"]',
 'All vote weight scenarios tested, 100% coverage for lib/vote-weight.ts'),

('TASK-110', 'Write unit tests for PII redaction',
 'Test lib/pii-redact.ts: phone, email, room_number, reservation_id patterns. Test masking strategy.',
 'Testing', 'Testing', 10, 2,
 'jest',
 '["TASK-023"]',
 'All PII patterns detected and redacted, edge cases covered'),

('TASK-111', 'Write integration tests for feedback API',
 'Test POST /api/feedback (create, validation, rate limit), GET /api/feedback (filters, pagination), PATCH /api/feedback/:id (edit window, permissions).',
 'Testing', 'Testing', 10, 5,
 'jest,supertest',
 '["TASK-019", "TASK-020", "TASK-022"]',
 'All feedback endpoints tested, happy path and error cases covered'),

('TASK-112', 'Write integration tests for voting API',
 'Test POST /api/feedback/:id/vote (create, update, weight calculation), DELETE (remove vote). Test unique constraint.',
 'Testing', 'Testing', 10, 3,
 'jest,supertest',
 '["TASK-031", "TASK-032"]',
 'Voting endpoints tested, unique constraint validated'),

('TASK-113', 'Write E2E tests for critical user flows',
 'Use Playwright or Cypress. Test: sign-in, submit feedback, vote, view roadmap, complete questionnaire. Run in CI.',
 'Testing', 'Testing', 10, 8,
 'playwright',
 '["TASK-028", "TASK-034", "TASK-049", "TASK-066"]',
 'E2E tests pass for all critical flows, runs in CI pipeline');

-- ============================================================================
-- PHASE 4: DOCUMENTATION (Priority 10, Epic: Documentation)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-114', 'Write API documentation (OpenAPI/Swagger)',
 'Generate OpenAPI spec for all API routes. Use @nestjs/swagger or manual YAML. Host at /api-docs.',
 'Documentation', 'Documentation', 10, 6,
 'openapi',
 '["TASK-019"]',
 'API docs accessible, all endpoints documented with schemas, examples provided'),

('TASK-115', 'Write developer README',
 'Create README.md: project overview, setup instructions, env vars, run commands, folder structure, tech stack.',
 'Documentation', 'Documentation', 10, 3,
 'markdown',
 '["TASK-001"]',
 'README complete, new developer can set up and run project from README alone'),

('TASK-116', 'Write user guide for PMs/Researchers',
 'Create docs/USER_GUIDE.md: how to create feedback, use roadmap, create panels, deploy questionnaires, schedule sessions.',
 'Documentation', 'Documentation', 10, 4,
 'markdown',
 '["TASK-049", "TASK-057", "TASK-065", "TASK-075"]',
 'User guide covers all major features, includes screenshots/examples'),

('TASK-117', 'Write deployment guide',
 'Create docs/DEPLOYMENT.md: how to deploy to Vercel/Netlify, configure env vars (NextAuth, Prisma, SendGrid, Redis), set up PostgreSQL.',
 'Documentation', 'Documentation', 10, 3,
 'markdown',
 '["TASK-001"]',
 'Deployment guide tested, app successfully deployed following guide');

-- ============================================================================
-- PHASE 4: ADMIN PANEL (Priority 10, Epic: Admin)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, tech_stack, depends_on, acceptance_criteria) VALUES
('TASK-118', 'Create API routes for user management (ADMIN)',
 'GET /api/admin/users (list all), PATCH /api/admin/users/:id (update role, consents), DELETE /api/admin/users/:id (hard delete). ADMIN only.',
 'Backend', 'Admin', 10, 4,
 'nextjs,prisma',
 '["TASK-045", "TASK-016"]',
 'Admin can list, update roles, delete users, 403 if not ADMIN'),

('TASK-119', 'Build admin panel page: /admin (ADMIN)',
 'Shadcn DataTable: user list with email, role, village, consents. Actions: change role (select), delete (confirm dialog).',
 'UI', 'Admin', 10, 5,
 'nextjs,shadcn',
 '["TASK-118", "TASK-002"]',
 'Admin panel renders, role change works, delete requires confirmation, role-gated');

-- ==========================================================================
-- Summary stats (for reference, not inserted)
-- ==========================================================================
-- Total tasks: 119 (TASK-001 to TASK-119)
-- Estimated hours: ~380 hours (rough estimate)
-- Epics: Foundation, Auth, Feedback, Voting, Features, Moderation, Settings, Roadmap, Research Panels, Questionnaires, Sessions, Integrations, Analytics, Performance, Security, Testing, Documentation, Admin
