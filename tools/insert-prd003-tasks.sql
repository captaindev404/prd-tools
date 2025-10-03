-- PRD-003 Task Breakdown: Sidebar Navigation, Research Features, and Feedback Enhancements
-- Total: 77 tasks across 5 epics
-- Generated: 2025-10-03

-- ============================================================================
-- EPIC 1: SIDEBAR_NAVIGATION (15 tasks)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-001',
  'Install shadcn sidebar and tooltip components',
  'Install required shadcn/ui components for sidebar navigation: sidebar, tooltip, scroll-area, separator. These are the foundation components needed for the collapsible sidebar architecture.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  10,
  0.25,
  '[]',
  'shadcn,nextjs',
  '[]',
  '- [ ] shadcn sidebar component installed via npx shadcn@latest add sidebar
- [ ] tooltip component installed
- [ ] scroll-area component installed
- [ ] separator component installed
- [ ] Components accessible in @/components/ui/*
- [ ] No TypeScript errors'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-002',
  'Create app-sidebar.tsx component',
  'Build the main AppSidebar client component with role-based filtering, three sections (PRODUCT, INSIGHTS, ADMIN), and Research submenu expansion. This is the core navigation component.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  10,
  2,
  '["PRD003-NAV-001"]',
  'shadcn,nextjs,typescript,react',
  '["src/components/layout/app-sidebar.tsx"]',
  '- [ ] Component created as client component ("use client")
- [ ] Three sections: PRODUCT, INSIGHTS, ADMIN
- [ ] Research item expandable with Sessions, Panels, Questionnaires sub-items
- [ ] Role-based filtering (allowedRoles array per item)
- [ ] Active state highlighting using usePathname()
- [ ] Collapse/expand state managed
- [ ] Icons from lucide-react
- [ ] TypeScript types for navigation config'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-003',
  'Create app-header.tsx with breadcrumbs',
  'Build the AppHeader component for the top bar with breadcrumbs, notification bell, and sidebar trigger. Uses dynamic breadcrumbs based on current pathname.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  9,
  1.5,
  '["PRD003-NAV-001"]',
  'shadcn,nextjs,typescript,react',
  '["src/components/layout/app-header.tsx"]',
  '- [ ] Component created as client component
- [ ] Breadcrumbs generated from pathname
- [ ] SidebarTrigger button included
- [ ] Integrates NotificationBell component
- [ ] Responsive layout (hide breadcrumbs on mobile)
- [ ] Max 4 breadcrumb items (truncate with ...)
- [ ] Chevron separator between items'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-004',
  'Create app-layout.tsx with SidebarProvider',
  'Build the root layout wrapper component that provides sidebar context and manages collapsed state with localStorage persistence.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  9,
  1.5,
  '["PRD003-NAV-002", "PRD003-NAV-003"]',
  'shadcn,nextjs,typescript,react',
  '["src/components/layout/app-layout.tsx"]',
  '- [ ] Client component with SidebarProvider
- [ ] useState for collapsed state
- [ ] useEffect to load state from localStorage
- [ ] Handler to save state to localStorage
- [ ] Wraps AppSidebar and SidebarInset
- [ ] Props: user session data
- [ ] Mobile drawer behavior (<768px)
- [ ] Desktop sidebar behavior (≥768px)'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-005',
  'Update (authenticated)/layout.tsx to use AppLayout',
  'Integrate the new sidebar layout into the authenticated route group. Fetch session server-side and pass to AppLayout.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  10,
  1,
  '["PRD003-NAV-004"]',
  'nextjs,typescript,nextauth',
  '["src/app/(authenticated)/layout.tsx"]',
  '- [ ] Import AppLayout from @/components/layout/app-layout
- [ ] Fetch session using await auth()
- [ ] Pass user session to AppLayout
- [ ] Remove old MainNav/MobileNav imports
- [ ] Children wrapped correctly
- [ ] Server component pattern maintained'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-006',
  'Implement Research submenu expandable behavior',
  'Add expand/collapse logic for Research nav item with localStorage persistence. Show Sessions, Panels, Questionnaires as sub-items.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  8,
  1,
  '["PRD003-NAV-002"]',
  'typescript,react',
  '["src/components/layout/app-sidebar.tsx"]',
  '- [ ] Research item has chevron icon (ChevronDown/ChevronRight)
- [ ] onClick toggles expanded state
- [ ] Expanded state persists in localStorage
- [ ] Sub-items render with indentation when expanded
- [ ] Sub-items highlight when active
- [ ] Clicking Research navigates to /research/sessions
- [ ] Smooth transition animation'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-007',
  'Change Research link from /research to /research/sessions',
  'Update the Research navigation item href to point to /research/sessions as the default route.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  7,
  0.25,
  '["PRD003-NAV-002"]',
  'typescript',
  '["src/components/layout/app-sidebar.tsx"]',
  '- [ ] Research item href changed to /research/sessions
- [ ] Sessions sub-item also points to /research/sessions
- [ ] Active state highlights correctly
- [ ] Navigation works from all pages'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-008',
  'Remove Profile link from user dropdown',
  'Remove the redundant Profile link from UserNav dropdown, keeping only Settings and Sign Out.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  6,
  0.25,
  '[]',
  'typescript,react',
  '["src/components/navigation/user-nav.tsx"]',
  '- [ ] Profile DropdownMenuItem removed (lines 156-164)
- [ ] Settings link remains
- [ ] Sign Out link remains
- [ ] User info header remains
- [ ] No navigation errors'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-009',
  'Remove dashboard page sub-header',
  'Remove NotificationBell, UserNav, and MobileNav from dashboard page level. These are now in AppHeader.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  6,
  0.5,
  '["PRD003-NAV-005"]',
  'typescript,react',
  '["src/app/(authenticated)/dashboard/page.tsx"]',
  '- [ ] NotificationBell import removed
- [ ] UserNav import removed
- [ ] MobileNav import removed
- [ ] No sub-header div rendered
- [ ] Dashboard shows only content sections
- [ ] No visual regression'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-010',
  'Add keyboard shortcut (Ctrl+B) to toggle sidebar',
  'Implement keyboard shortcut handler for Ctrl+B to toggle sidebar collapse state.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  5,
  0.5,
  '["PRD003-NAV-004"]',
  'typescript,react',
  '["src/components/layout/app-layout.tsx"]',
  '- [ ] useEffect with keydown listener
- [ ] Detects Ctrl+B (Cmd+B on Mac)
- [ ] Toggles collapsed state
- [ ] Cleanup on unmount
- [ ] Works across all authenticated pages'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-011',
  'Implement mobile drawer behavior',
  'Ensure sidebar converts to Sheet drawer on mobile (<768px) with hamburger menu and overlay backdrop.',
  'frontend',
  'SIDEBAR_NAVIGATION',
  8,
  1.5,
  '["PRD003-NAV-004"]',
  'shadcn,typescript,react,tailwind',
  '["src/components/layout/app-layout.tsx", "src/components/layout/app-header.tsx"]',
  '- [ ] Sheet component wraps sidebar on mobile
- [ ] Hamburger trigger in header (<768px)
- [ ] Overlay backdrop with click-to-close
- [ ] Swipe gesture support (if available)
- [ ] Drawer slides in from left
- [ ] Same navigation hierarchy as desktop
- [ ] No localStorage persistence on mobile'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-012',
  'Add tooltips for collapsed sidebar icons',
  'Show tooltips when hovering over sidebar icons in collapsed state (64px width).',
  'frontend',
  'SIDEBAR_NAVIGATION',
  5,
  0.75,
  '["PRD003-NAV-002"]',
  'shadcn,typescript,react',
  '["src/components/layout/app-sidebar.tsx"]',
  '- [ ] Tooltip component wraps each nav item
- [ ] Only shows in collapsed state
- [ ] Displays full item title
- [ ] Position: right side
- [ ] Delay: 200ms
- [ ] Accessible with aria-describedby'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-013',
  'Implement accessibility features for sidebar',
  'Add ARIA labels, keyboard navigation, focus management, and skip links for sidebar accessibility (WCAG 2.1 AA).',
  'frontend',
  'SIDEBAR_NAVIGATION',
  7,
  1.5,
  '["PRD003-NAV-002", "PRD003-NAV-011"]',
  'typescript,react,aria',
  '["src/components/layout/app-sidebar.tsx", "src/components/layout/app-header.tsx"]',
  '- [ ] <aside aria-label="Main navigation">
- [ ] Active link: aria-current="page"
- [ ] Expandable item: aria-expanded="true/false"
- [ ] Collapse toggle: aria-label descriptive
- [ ] Focus trap in mobile drawer
- [ ] Skip to main content link
- [ ] Visible focus rings (2px, ring-primary)
- [ ] Color contrast ≥4.5:1'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-014',
  'Test sidebar with all roles (USER, PM, PO, RESEARCHER, MODERATOR, ADMIN)',
  'Verify role-based filtering works correctly for all 6 roles, hiding/showing appropriate nav items.',
  'testing',
  'SIDEBAR_NAVIGATION',
  6,
  1,
  '["PRD003-NAV-005"]',
  'testing,playwright',
  '[]',
  '- [ ] USER: See Dashboard, Feedback, Features, Roadmap only
- [ ] PM: See + Research, Analytics
- [ ] PO: See + Research, Analytics
- [ ] RESEARCHER: See + Research
- [ ] MODERATOR: See + Moderation
- [ ] ADMIN: See all items
- [ ] Manual testing with each role
- [ ] Screenshots for documentation'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-NAV-015',
  'Test sidebar responsive behavior and state persistence',
  'Test mobile drawer, desktop collapse, and localStorage persistence across all breakpoints.',
  'testing',
  'SIDEBAR_NAVIGATION',
  6,
  1,
  '["PRD003-NAV-011", "PRD003-NAV-010"]',
  'testing,playwright',
  '[]',
  '- [ ] Mobile (<768px): Drawer opens/closes
- [ ] Desktop (≥768px): Sidebar expands/collapses
- [ ] Collapse state persists on page reload
- [ ] Research expanded state persists
- [ ] Ctrl+B keyboard shortcut works
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on iOS Safari, Android Chrome'
);

-- ============================================================================
-- EPIC 2: RESEARCH_PANELS (Backend/API) (12 tasks)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-001',
  'Update Prisma schema for Panel enhancements',
  'Add description, createdById, and archived fields to Panel model. Add User relation for panel creator.',
  'backend',
  'RESEARCH_PANELS',
  10,
  0.5,
  '[]',
  'prisma,typescript',
  '["prisma/schema.prisma"]',
  '- [ ] description String? field added
- [ ] createdById String field added
- [ ] archived Boolean @default(false) added
- [ ] createdBy User relation added
- [ ] User.createdPanels Panel[] relation added
- [ ] @@index([createdById])
- [ ] @@index([archived])
- [ ] No schema errors'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-002',
  'Run Prisma migration for Panel schema changes',
  'Generate and run Prisma migration to apply Panel schema changes to database.',
  'backend',
  'RESEARCH_PANELS',
  10,
  0.25,
  '["PRD003-PANEL-API-001"]',
  'prisma',
  '[]',
  '- [ ] npm run db:generate executed successfully
- [ ] npm run db:migrate executed successfully
- [ ] Migration file created in prisma/migrations/
- [ ] Database schema updated
- [ ] Prisma client regenerated
- [ ] No migration errors'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-003',
  'Implement PATCH /api/panels/[id] endpoint',
  'Create API endpoint to update panel configuration (name, description, eligibility rules). Requires RESEARCHER/PM/ADMIN role or creator ownership.',
  'backend',
  'RESEARCH_PANELS',
  9,
  2,
  '["PRD003-PANEL-API-002"]',
  'nextjs,typescript,prisma,zod',
  '["src/app/api/panels/[id]/route.ts"]',
  '- [ ] PATCH method implemented
- [ ] Auth check: session required
- [ ] Permission check: creator OR RESEARCHER/PM/ADMIN
- [ ] Zod validation schema for panel updates
- [ ] Updates name, description, eligibilityRules fields
- [ ] Returns updated panel with 200
- [ ] Returns 401 if not authenticated
- [ ] Returns 403 if not authorized
- [ ] Returns 404 if panel not found'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-004',
  'Implement DELETE /api/panels/[id] endpoint (soft delete)',
  'Create API endpoint to archive (soft delete) a panel. Sets archived=true instead of hard delete.',
  'backend',
  'RESEARCH_PANELS',
  8,
  1.5,
  '["PRD003-PANEL-API-002"]',
  'nextjs,typescript,prisma',
  '["src/app/api/panels/[id]/route.ts"]',
  '- [ ] DELETE method implemented
- [ ] Auth check: session required
- [ ] Permission check: creator OR ADMIN
- [ ] Soft delete: sets archived=true
- [ ] Returns 204 No Content on success
- [ ] Returns 401 if not authenticated
- [ ] Returns 403 if not authorized (not creator or ADMIN)
- [ ] Returns 404 if panel not found'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-005',
  'Implement POST /api/panels/[id]/members endpoint (bulk invite)',
  'Create API endpoint to invite multiple users to a panel with eligibility validation and consent checking.',
  'backend',
  'RESEARCH_PANELS',
  9,
  2.5,
  '["PRD003-PANEL-API-002"]',
  'nextjs,typescript,prisma,zod',
  '["src/app/api/panels/[id]/members/route.ts"]',
  '- [ ] POST method implemented
- [ ] Auth check: RESEARCHER/PM/ADMIN
- [ ] Accepts array of user IDs
- [ ] Validates each user against panel eligibility rules
- [ ] Checks required consents for each user
- [ ] Skips users who fail eligibility/consent
- [ ] Creates PanelMember records for valid users
- [ ] Returns summary: {added: number, skipped: Array<{userId, reason}>}
- [ ] Transaction ensures atomicity'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-006',
  'Implement DELETE /api/panels/[id]/members/[userId] endpoint',
  'Create API endpoint to remove a specific user from a panel.',
  'backend',
  'RESEARCH_PANELS',
  7,
  1,
  '["PRD003-PANEL-API-002"]',
  'nextjs,typescript,prisma',
  '["src/app/api/panels/[id]/members/[userId]/route.ts"]',
  '- [ ] DELETE method implemented
- [ ] Auth check: RESEARCHER/PM/ADMIN
- [ ] Deletes PanelMember record
- [ ] Returns 204 No Content on success
- [ ] Returns 401 if not authenticated
- [ ] Returns 403 if not authorized
- [ ] Returns 404 if member not found'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-007',
  'Implement GET /api/panels/[id]/eligibility-preview endpoint',
  'Create API endpoint to preview users matching panel eligibility rules. Returns count and sample users.',
  'backend',
  'RESEARCH_PANELS',
  8,
  2,
  '["PRD003-PANEL-API-002"]',
  'nextjs,typescript,prisma',
  '["src/app/api/panels/[id]/eligibility-preview/route.ts"]',
  '- [ ] GET method implemented
- [ ] Auth check: RESEARCHER/PM/ADMIN
- [ ] Parses eligibilityRules JSON
- [ ] Builds Prisma where clause from rules
- [ ] Returns {count: number, sample: User[]} (first 10 users)
- [ ] Returns quota projections if configured
- [ ] Handles complex attribute predicates
- [ ] Efficient query with proper indices'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-008',
  'Update GET /api/panels endpoint with filters',
  'Enhance existing panels list endpoint with search, creator filter, and archived filter.',
  'backend',
  'RESEARCH_PANELS',
  7,
  1.5,
  '["PRD003-PANEL-API-002"]',
  'nextjs,typescript,prisma',
  '["src/app/api/panels/route.ts"]',
  '- [ ] Query params: search, createdById, includeArchived
- [ ] Search filters name field (case-insensitive)
- [ ] createdById filters by creator
- [ ] includeArchived=false by default (exclude archived)
- [ ] Returns panels with creator info
- [ ] Pagination support
- [ ] Proper WHERE clause building'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-009',
  'Update POST /api/panels endpoint with new fields',
  'Enhance panel creation to accept and store description and createdById fields.',
  'backend',
  'RESEARCH_PANELS',
  8,
  1,
  '["PRD003-PANEL-API-002"]',
  'nextjs,typescript,prisma,zod',
  '["src/app/api/panels/route.ts"]',
  '- [ ] Zod schema updated with description? field
- [ ] createdById automatically set from session.user.id
- [ ] Panel created with all new fields
- [ ] Returns created panel with 201
- [ ] Validation errors return 400'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-010',
  'Create eligibility checking service',
  'Create reusable service function to check if a user matches panel eligibility rules. Used by multiple endpoints.',
  'backend',
  'RESEARCH_PANELS',
  8,
  2,
  '["PRD003-PANEL-API-002"]',
  'typescript,prisma',
  '["src/lib/panel-eligibility.ts"]',
  '- [ ] Function: checkEligibility(user: User, rules: EligibilityRules): boolean
- [ ] Checks include_roles array
- [ ] Checks include_villages (all or specific)
- [ ] Checks attributes_predicates (in, eq, contains)
- [ ] Checks required_consents
- [ ] Returns true only if ALL conditions match
- [ ] TypeScript types for EligibilityRules
- [ ] Unit tests for common scenarios'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-011',
  'Create quota tracking utility',
  'Create utility functions to track and visualize panel quota fulfillment (e.g., 50% Reception, 30% FOH).',
  'backend',
  'RESEARCH_PANELS',
  6,
  1.5,
  '["PRD003-PANEL-API-002"]',
  'typescript,prisma',
  '["src/lib/panel-quota.ts"]',
  '- [ ] Function: calculateQuotaProgress(panel: Panel): QuotaProgress
- [ ] Groups panel members by quota key (department, role, village)
- [ ] Calculates current distribution percentages
- [ ] Compares to target quotas
- [ ] Returns progress for each quota segment
- [ ] TypeScript types for QuotaProgress
- [ ] Handles missing quotas gracefully'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-API-012',
  'Write API tests for panel endpoints',
  'Create integration tests for all panel API endpoints covering auth, permissions, and business logic.',
  'testing',
  'RESEARCH_PANELS',
  7,
  2,
  '["PRD003-PANEL-API-003", "PRD003-PANEL-API-004", "PRD003-PANEL-API-005", "PRD003-PANEL-API-006", "PRD003-PANEL-API-007"]',
  'testing,jest',
  '["src/app/api/panels/__tests__/"]',
  '- [ ] Test PATCH /api/panels/[id] success and errors
- [ ] Test DELETE /api/panels/[id] soft delete
- [ ] Test POST /api/panels/[id]/members bulk invite
- [ ] Test DELETE /api/panels/[id]/members/[userId]
- [ ] Test GET /api/panels/[id]/eligibility-preview
- [ ] Test permission checks (401, 403)
- [ ] Test ownership checks for edit/delete
- [ ] Test eligibility validation
- [ ] All tests passing'
);

-- ============================================================================
-- EPIC 3: QUESTIONNAIRES (15 tasks)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-001',
  'Implement PATCH /api/questionnaires/[id] endpoint',
  'Create API endpoint to update draft questionnaires (title, questions, targeting). Only draft status allowed.',
  'backend',
  'QUESTIONNAIRES',
  9,
  2,
  '[]',
  'nextjs,typescript,prisma,zod',
  '["src/app/api/questionnaires/[id]/route.ts"]',
  '- [ ] PATCH method implemented
- [ ] Auth check: RESEARCHER/PM/ADMIN
- [ ] Status check: only draft allowed
- [ ] Zod validation for questionnaire updates
- [ ] Updates title, questions, panelIds, adHocFilters, startAt, endAt
- [ ] Returns updated questionnaire with 200
- [ ] Returns 400 if not draft status
- [ ] Returns 403 if not authorized'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-002',
  'Enhance POST /api/questionnaires/[id]/publish endpoint with validation',
  'Add comprehensive validation for publishing: require both EN/FR translations, validate question structure, check targeting.',
  'backend',
  'QUESTIONNAIRES',
  9,
  2,
  '[]',
  'nextjs,typescript,prisma,zod',
  '["src/app/api/questionnaires/[id]/publish/route.ts"]',
  '- [ ] Validates all questions have EN and FR text
- [ ] Validates question types are valid
- [ ] Validates targeting (panelIds or adHocFilters)
- [ ] Validates startAt < endAt if both provided
- [ ] Changes status from draft to published
- [ ] Returns 400 with specific validation errors
- [ ] Returns 200 with published questionnaire
- [ ] Cannot publish already published questionnaire'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-003',
  'Implement GET /api/questionnaires/[id]/analytics endpoint',
  'Create API endpoint to compute and return comprehensive analytics for questionnaire responses.',
  'backend',
  'QUESTIONNAIRES',
  9,
  3,
  '[]',
  'nextjs,typescript,prisma',
  '["src/app/api/questionnaires/[id]/analytics/route.ts"]',
  '- [ ] Auth check: RESEARCHER/PM/PO/ADMIN
- [ ] Fetches all responses for questionnaire
- [ ] Returns overview: total responses, completion rate
- [ ] Returns per-question analytics
- [ ] Supports segmentation query param (village, role, panel)
- [ ] Uses questionnaire-analytics service
- [ ] Returns 200 with analytics data
- [ ] Handles empty responses gracefully'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-004',
  'Implement GET /api/questionnaires/[id]/export endpoint',
  'Create API endpoint to export questionnaire responses as CSV or JSON with PII options.',
  'backend',
  'QUESTIONNAIRES',
  8,
  2.5,
  '[]',
  'nextjs,typescript,prisma',
  '["src/app/api/questionnaires/[id]/export/route.ts"]',
  '- [ ] Auth check: RESEARCHER/PM/ADMIN
- [ ] Query params: format (csv|json), includePII (boolean), segment (village|role|panel)
- [ ] Fetches responses with optional segmentation
- [ ] CSV: headers + data rows
- [ ] JSON: array of response objects
- [ ] PII handling: omit email if includePII=false
- [ ] Returns file with proper Content-Type header
- [ ] Filename: questionnaire-{id}-export-{timestamp}.{ext}'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-005',
  'Create questionnaire-analytics.ts service',
  'Create service module for computing NPS, Likert distributions, MCQ distributions, and segmentation.',
  'backend',
  'QUESTIONNAIRES',
  9,
  3,
  '[]',
  'typescript',
  '["src/lib/questionnaire-analytics.ts"]',
  '- [ ] Function: computeNPS(scores: number[]): NPSResult
- [ ] Function: computeLikertDistribution(scores: number[]): Distribution
- [ ] Function: computeMCQDistribution(responses: string[]): Distribution
- [ ] Function: segmentByVillage(responses: Response[]): Record<string, Response[]>
- [ ] Function: segmentByRole(responses: Response[]): Record<string, Response[]>
- [ ] TypeScript types for all analytics structures
- [ ] Unit tests for NPS calculation
- [ ] Unit tests for distributions'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-006',
  'Create CSV export utility',
  'Create utility function to convert questionnaire responses to CSV format with proper escaping.',
  'backend',
  'QUESTIONNAIRES',
  7,
  1.5,
  '[]',
  'typescript',
  '["src/lib/csv-export.ts"]',
  '- [ ] Function: exportToCSV(responses: Response[], includePII: boolean): string
- [ ] Header row with column names
- [ ] Data rows with proper escaping (commas, quotes)
- [ ] PII handling: conditional email/name inclusion
- [ ] Question answers as columns (q1, q2, q3, ...)
- [ ] Handles missing values (empty string)
- [ ] Handles special characters
- [ ] Unit tests'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-007',
  'Build QuestionnaireList component with status filters',
  'Create client component to list questionnaires with filters for status (draft/published/closed).',
  'frontend',
  'QUESTIONNAIRES',
  8,
  2,
  '[]',
  'nextjs,typescript,react,shadcn',
  '["src/app/(authenticated)/research/questionnaires/page.tsx"]',
  '- [ ] Client component with useState for filters
- [ ] Status filter dropdown (all, draft, published, closed)
- [ ] Grid layout of QuestionnaireCard components
- [ ] Fetches from GET /api/questionnaires with filters
- [ ] Loading state with skeletons
- [ ] Empty state for no questionnaires
- [ ] Link to create new questionnaire'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-008',
  'Build QuestionBuilder component',
  'Create complex client component for visual question builder with 6 question types and EN/FR translations.',
  'frontend',
  'QUESTIONNAIRES',
  10,
  4,
  '[]',
  'nextjs,typescript,react,shadcn,zod',
  '["src/components/questionnaires/question-builder.tsx"]',
  '- [ ] Client component with useState for questions array
- [ ] Add question button with type selector
- [ ] 6 question type forms: Likert, NPS, MCQ Single, MCQ Multiple, Text, Number
- [ ] EN/FR translation fields for each question
- [ ] Reorder questions (↑↓ buttons or drag-and-drop)
- [ ] Remove question button
- [ ] Duplicate question button
- [ ] Required checkbox per question
- [ ] Type-specific config (scale, options, limits)
- [ ] Zod validation before save'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-009',
  'Build TargetingConfig component',
  'Create component for configuring questionnaire targeting (panels, ad-hoc filters, delivery settings).',
  'frontend',
  'QUESTIONNAIRES',
  7,
  2,
  '[]',
  'nextjs,typescript,react,shadcn',
  '["src/components/questionnaires/targeting-config.tsx"]',
  '- [ ] Panel multi-select dropdown
- [ ] Ad-hoc filter section (village, role, feature interactions)
- [ ] Delivery mode checkboxes (in-app, email)
- [ ] Start date picker (optional)
- [ ] End date picker (optional)
- [ ] Max responses number input
- [ ] Validation: at least one targeting method
- [ ] Preview audience count button'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-010',
  'Build AnalyticsDashboard component',
  'Create comprehensive analytics dashboard with charts for NPS, Likert, MCQ, and text responses.',
  'frontend',
  'QUESTIONNAIRES',
  10,
  4,
  '["PRD003-QUEST-003"]',
  'nextjs,typescript,react,shadcn,recharts',
  '["src/components/questionnaires/analytics-dashboard.tsx"]',
  '- [ ] Fetches from GET /api/questionnaires/[id]/analytics
- [ ] Overview cards: total responses, completion rate, avg NPS
- [ ] NPS question: pie chart with promoters/passives/detractors
- [ ] Likert question: bar chart with distribution
- [ ] MCQ question: bar chart with option percentages
- [ ] Text question: response count + first 10 samples
- [ ] Segmentation selector (village, role, panel)
- [ ] Export button (links to ExportDialog)
- [ ] Loading states
- [ ] Recharts for visualizations'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-011',
  'Build ExportDialog component',
  'Create modal dialog for exporting questionnaire responses with format and PII options.',
  'frontend',
  'QUESTIONNAIRES',
  6,
  1.5,
  '["PRD003-QUEST-004"]',
  'nextjs,typescript,react,shadcn',
  '["src/components/questionnaires/export-dialog.tsx"]',
  '- [ ] Dialog component from shadcn
- [ ] Format radio buttons (CSV, JSON)
- [ ] Include PII checkbox (RESEARCHER only)
- [ ] Segment selector (all, village, role, panel)
- [ ] Export button triggers download from API
- [ ] Loading state during export
- [ ] Success toast message
- [ ] Error handling with toast'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-012',
  'Build language toggle for question preview',
  'Create toggle component to switch between EN and FR preview of questionnaire questions.',
  'frontend',
  'QUESTIONNAIRES',
  5,
  1,
  '[]',
  'nextjs,typescript,react,shadcn',
  '["src/components/questionnaires/language-toggle.tsx"]',
  '- [ ] Toggle component (EN | FR)
- [ ] useState for current language
- [ ] Passes language to parent via callback
- [ ] Visual indicator of active language
- [ ] Accessible with ARIA labels
- [ ] Keyboard navigation support'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-013',
  'Build QuestionRenderer component',
  'Create component to render questions in response form based on question type (Likert, NPS, MCQ, etc.).',
  'frontend',
  'QUESTIONNAIRES',
  8,
  2.5,
  '[]',
  'nextjs,typescript,react,shadcn',
  '["src/components/questionnaires/question-renderer.tsx"]',
  '- [ ] Props: question, language, value, onChange
- [ ] Renders Likert: radio buttons with scale
- [ ] Renders NPS: radio buttons 0-10
- [ ] Renders MCQ Single: radio buttons
- [ ] Renders MCQ Multiple: checkboxes
- [ ] Renders Text: textarea
- [ ] Renders Number: number input
- [ ] Displays question text in selected language
- [ ] Required field validation
- [ ] Accessible form controls'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-014',
  'Create questionnaire response form page',
  'Create page for users to respond to questionnaires (/research/questionnaires/[id]).',
  'frontend',
  'QUESTIONNAIRES',
  8,
  3,
  '["PRD003-QUEST-013"]',
  'nextjs,typescript,react,shadcn,zod',
  '["src/app/(authenticated)/research/questionnaires/[id]/page.tsx"]',
  '- [ ] Fetches questionnaire by ID
- [ ] Checks user eligibility (panels, ad-hoc filters)
- [ ] Renders all questions using QuestionRenderer
- [ ] Language selector from user session
- [ ] Form validation with Zod
- [ ] Submit button with loading state
- [ ] POST to /api/questionnaires/[id]/responses
- [ ] Success message on submit
- [ ] Redirects to thank you page
- [ ] Shows error if already responded'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-QUEST-015',
  'Write E2E tests for questionnaire flow',
  'Create Playwright tests for creating questionnaire, responding, and viewing analytics.',
  'testing',
  'QUESTIONNAIRES',
  7,
  2.5,
  '["PRD003-QUEST-008", "PRD003-QUEST-010", "PRD003-QUEST-014"]',
  'testing,playwright',
  '["tests/e2e/questionnaires.spec.ts"]',
  '- [ ] Test: RESEARCHER creates questionnaire with QuestionBuilder
- [ ] Test: Publish validation (missing translations fails)
- [ ] Test: USER responds to questionnaire
- [ ] Test: RESEARCHER views analytics dashboard
- [ ] Test: Export CSV with PII (RESEARCHER only)
- [ ] Test: Language toggle switches EN/FR
- [ ] All tests passing
- [ ] Screenshots on failure'
);

-- ============================================================================
-- EPIC 4: RESEARCH_PANELS_UI (Frontend) (23 tasks)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-001',
  'Build PanelList page with search and filters',
  'Create panels list page with search, creator filter, and archived filter.',
  'frontend',
  'RESEARCH_PANELS_UI',
  8,
  2,
  '["PRD003-PANEL-API-008"]',
  'nextjs,typescript,react,shadcn',
  '["src/app/(authenticated)/research/panels/page.tsx"]',
  '- [ ] Client component with search input
- [ ] Creator filter dropdown
- [ ] Include archived checkbox
- [ ] Fetches from GET /api/panels with query params
- [ ] Grid layout of PanelCard components
- [ ] Pagination support
- [ ] Loading state with skeletons
- [ ] Empty state for no panels
- [ ] Link to create new panel'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-002',
  'Build PanelCard component',
  'Create card component for panel summary in list view.',
  'frontend',
  'RESEARCH_PANELS_UI',
  6,
  1,
  '[]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/panel-card.tsx"]',
  '- [ ] Card shows panel name
- [ ] Shows description (truncated)
- [ ] Shows creator name
- [ ] Shows member count
- [ ] Shows archived badge if archived
- [ ] Link to panel detail page
- [ ] Edit button (if authorized)
- [ ] Archive button (if authorized)
- [ ] Responsive design'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-003',
  'Build EligibilityRulesBuilder component',
  'Create complex visual UI for building panel eligibility rules with 4 sections.',
  'frontend',
  'RESEARCH_PANELS_UI',
  10,
  4,
  '[]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/eligibility-rules-builder.tsx"]',
  '- [ ] Section 1: Role checkboxes (USER, PM, PO, RESEARCHER, MODERATOR, ADMIN)
- [ ] Section 2: Village selector (all or multi-select)
- [ ] Section 3: Attribute predicates (+ Add Rule button)
  - [ ] Key input (department, job_title, etc.)
  - [ ] Op selector (in, eq, contains)
  - [ ] Value input (string or array)
  - [ ] Remove rule button
- [ ] Section 4: Required consent checkboxes
- [ ] Preview button
- [ ] Returns rules object via onChange callback
- [ ] Validation before preview'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-004',
  'Build EligibilityPreview modal',
  'Create modal to show preview of users matching eligibility rules.',
  'frontend',
  'RESEARCH_PANELS_UI',
  7,
  2,
  '["PRD003-PANEL-API-007"]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/eligibility-preview.tsx"]',
  '- [ ] Dialog component from shadcn
- [ ] Fetches from GET /api/panels/[id]/eligibility-preview
- [ ] Shows total count (e.g., "45 users match")
- [ ] Shows sample user list (first 10)
  - [ ] User name, email, role, village
- [ ] Shows quota projections if configured
- [ ] Loading state
- [ ] Error handling
- [ ] Close button'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-005',
  'Build QuotaManager component',
  'Create component for configuring and visualizing panel quotas.',
  'frontend',
  'RESEARCH_PANELS_UI',
  7,
  2,
  '[]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/quota-manager.tsx"]',
  '- [ ] Add quota button
- [ ] Quota form: key (department, role, village), target percentage
- [ ] List of configured quotas
- [ ] Remove quota button
- [ ] Progress bars showing current vs target
- [ ] Validation: percentages sum to 100%
- [ ] Returns quotas array via onChange'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-006',
  'Build InviteMembersDialog component',
  'Create modal for bulk inviting users to panel with eligibility checking.',
  'frontend',
  'RESEARCH_PANELS_UI',
  8,
  3,
  '["PRD003-PANEL-API-005"]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/invite-members-dialog.tsx"]',
  '- [ ] Dialog with user search input
- [ ] Fetches eligible users from API
- [ ] Multi-select with checkboxes
- [ ] Shows eligibility status per user
- [ ] Shows consent status
- [ ] Invite button
- [ ] POST to /api/panels/[id]/members with user IDs
- [ ] Shows summary: added X, skipped Y
- [ ] Displays skip reasons
- [ ] Closes on success
- [ ] Updates parent component'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-007',
  'Build MemberList component',
  'Create table component to display panel members with search and actions.',
  'frontend',
  'RESEARCH_PANELS_UI',
  7,
  2,
  '["PRD003-PANEL-API-006"]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/member-list.tsx"]',
  '- [ ] Table with columns: name, email, role, village, consent status
- [ ] Search input (filters locally or via API)
- [ ] Remove button per member (with confirmation)
- [ ] Pagination if >50 members
- [ ] Loading state
- [ ] Empty state
- [ ] Delete confirmation dialog
- [ ] Calls DELETE /api/panels/[id]/members/[userId]
- [ ] Updates list on delete'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-008',
  'Create panel creation wizard page',
  'Create multi-step form page for creating new panels (/research/panels/new).',
  'frontend',
  'RESEARCH_PANELS_UI',
  9,
  3,
  '["PRD003-PANEL-UI-003", "PRD003-PANEL-UI-005"]',
  'nextjs,typescript,react,shadcn,zod',
  '["src/app/(authenticated)/research/panels/new/page.tsx"]',
  '- [ ] Step 1: Name and description
- [ ] Step 2: Eligibility rules (EligibilityRulesBuilder)
- [ ] Step 3: Quotas (QuotaManager) - optional
- [ ] Preview button shows EligibilityPreview
- [ ] Zod validation per step
- [ ] Next/Back buttons
- [ ] Submit creates panel via POST /api/panels
- [ ] Success redirects to panel detail page
- [ ] Error handling with toast'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-009',
  'Create panel detail page',
  'Create page to display panel details, members, and actions (/research/panels/[id]).',
  'frontend',
  'RESEARCH_PANELS_UI',
  8,
  2.5,
  '["PRD003-PANEL-UI-007"]',
  'nextjs,typescript,react,shadcn',
  '["src/app/(authenticated)/research/panels/[id]/page.tsx"]',
  '- [ ] Fetches panel by ID from GET /api/panels/[id]
- [ ] Shows panel name, description, creator
- [ ] Shows eligibility rules summary
- [ ] Shows quota progress (if configured)
- [ ] Tabs: Members, Settings
- [ ] Members tab: MemberList component
- [ ] Invite Members button (opens InviteMembersDialog)
- [ ] Edit button (if authorized) - links to edit page
- [ ] Archive button (if authorized) - confirmation dialog
- [ ] Archived badge if archived'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-010',
  'Create panel edit page',
  'Create page to edit panel configuration (/research/panels/[id]/edit).',
  'frontend',
  'RESEARCH_PANELS_UI',
  7,
  2,
  '["PRD003-PANEL-UI-003", "PRD003-PANEL-API-003"]',
  'nextjs,typescript,react,shadcn,zod',
  '["src/app/(authenticated)/research/panels/[id]/edit/page.tsx"]',
  '- [ ] Fetches panel by ID
- [ ] Pre-fills form with current values
- [ ] Name and description fields
- [ ] EligibilityRulesBuilder with current rules
- [ ] QuotaManager with current quotas
- [ ] Preview button
- [ ] Save button
- [ ] PATCH to /api/panels/[id]
- [ ] Success redirects to detail page
- [ ] Cancel button
- [ ] Permission check: creator OR RESEARCHER/PM/ADMIN'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-011',
  'Build panel archive confirmation dialog',
  'Create reusable confirmation dialog for archiving panels.',
  'frontend',
  'RESEARCH_PANELS_UI',
  5,
  0.75,
  '["PRD003-PANEL-API-004"]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/archive-panel-dialog.tsx"]',
  '- [ ] AlertDialog component from shadcn
- [ ] Warning message about archiving
- [ ] Cancel and Archive buttons
- [ ] Calls DELETE /api/panels/[id]
- [ ] Loading state on Archive button
- [ ] Success toast message
- [ ] Redirects to panels list
- [ ] Error handling'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-012',
  'Add eligibility rules validation',
  'Add client-side validation for eligibility rules before API submission.',
  'frontend',
  'RESEARCH_PANELS_UI',
  6,
  1,
  '["PRD003-PANEL-UI-003"]',
  'typescript,zod',
  '["src/components/panels/eligibility-rules-builder.tsx"]',
  '- [ ] Zod schema for EligibilityRules
- [ ] Validates include_roles array not empty
- [ ] Validates include_villages format
- [ ] Validates attribute predicates structure
- [ ] Validates required_consents array
- [ ] Shows validation errors inline
- [ ] Prevents preview/submit if invalid'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-013',
  'Add quota progress visualization',
  'Create visual component to display quota progress with progress bars or pie chart.',
  'frontend',
  'RESEARCH_PANELS_UI',
  6,
  1.5,
  '["PRD003-PANEL-API-011"]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/quota-progress.tsx"]',
  '- [ ] Props: quotas, current distribution
- [ ] Progress bar for each quota segment
- [ ] Shows current % vs target %
- [ ] Color coding: green (on target), yellow (close), red (off target)
- [ ] Tooltip with exact numbers
- [ ] Alternative: pie chart visualization
- [ ] Responsive design'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-014',
  'Add member consent status indicators',
  'Display consent badges in member list showing which consents user has granted.',
  'frontend',
  'RESEARCH_PANELS_UI',
  5,
  1,
  '["PRD003-PANEL-UI-007"]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/member-list.tsx"]',
  '- [ ] Consent column in member table
- [ ] Badge for each required consent
- [ ] Green badge: granted
- [ ] Red badge: not granted
- [ ] Tooltip with consent name
- [ ] Shows warning if missing required consent'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-015',
  'Implement panel search functionality',
  'Add debounced search input to panels list page with client-side filtering.',
  'frontend',
  'RESEARCH_PANELS_UI',
  6,
  1,
  '["PRD003-PANEL-UI-001"]',
  'typescript,react',
  '["src/app/(authenticated)/research/panels/page.tsx"]',
  '- [ ] Search input component
- [ ] Debounce search input (300ms)
- [ ] Filters panels by name (case-insensitive)
- [ ] Updates URL query param ?search=...
- [ ] Shows result count
- [ ] Clear search button
- [ ] Loading state during search'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-016',
  'Add permission checks to panel UI',
  'Add client-side permission checks to show/hide Edit, Archive, Invite buttons.',
  'frontend',
  'RESEARCH_PANELS_UI',
  7,
  1.5,
  '["PRD003-PANEL-UI-009"]',
  'typescript,react',
  '["src/components/panels/panel-detail.tsx", "src/lib/permissions.ts"]',
  '- [ ] Create canEditPanel(user, panel) helper
- [ ] Create canDeletePanel(user, panel) helper
- [ ] Create canInviteToPanel(user) helper
- [ ] Conditionally render Edit button
- [ ] Conditionally render Archive button
- [ ] Conditionally render Invite Members button
- [ ] Disable buttons if no permission
- [ ] Tooltip explains why disabled'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-017',
  'Add loading states to all panel components',
  'Add skeleton loaders and loading spinners to all panel-related components.',
  'frontend',
  'RESEARCH_PANELS_UI',
  5,
  1.5,
  '["PRD003-PANEL-UI-001", "PRD003-PANEL-UI-009"]',
  'nextjs,typescript,react,shadcn',
  '["src/app/(authenticated)/research/panels/page.tsx", "src/app/(authenticated)/research/panels/[id]/page.tsx"]',
  '- [ ] Skeleton loader for panel list
- [ ] Skeleton loader for panel detail
- [ ] Loading spinner for Invite Members
- [ ] Loading spinner for Preview
- [ ] Loading spinner for Archive
- [ ] Disabled state for buttons during loading
- [ ] Smooth transitions'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-018',
  'Add empty states to panel pages',
  'Create empty state components for no panels, no members, etc.',
  'frontend',
  'RESEARCH_PANELS_UI',
  4,
  1,
  '["PRD003-PANEL-UI-001", "PRD003-PANEL-UI-009"]',
  'nextjs,typescript,react,shadcn',
  '["src/components/panels/empty-state.tsx"]',
  '- [ ] Empty state for no panels: "Create your first panel"
- [ ] Empty state for no members: "Invite members to get started"
- [ ] Empty state for no search results
- [ ] Friendly illustration or icon
- [ ] Call-to-action button
- [ ] Help text'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-019',
  'Implement panel accessibility features',
  'Add ARIA labels, keyboard navigation, and focus management to panel components.',
  'frontend',
  'RESEARCH_PANELS_UI',
  7,
  2,
  '["PRD003-PANEL-UI-003", "PRD003-PANEL-UI-006"]',
  'typescript,react,aria',
  '["src/components/panels/"]',
  '- [ ] ARIA labels for all interactive elements
- [ ] Fieldset/legend for EligibilityRulesBuilder sections
- [ ] Keyboard navigation for dialogs (Tab, Escape)
- [ ] Focus management in modals
- [ ] Error messages with aria-describedby
- [ ] Required fields with aria-required
- [ ] Live regions for dynamic updates
- [ ] Color contrast ≥4.5:1'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-020',
  'Add error handling to panel API calls',
  'Implement comprehensive error handling with user-friendly toast messages.',
  'frontend',
  'RESEARCH_PANELS_UI',
  6,
  1.5,
  '["PRD003-PANEL-UI-001", "PRD003-PANEL-UI-009"]',
  'typescript,react',
  '["src/app/(authenticated)/research/panels/"]',
  '- [ ] Try-catch blocks for all API calls
- [ ] Toast error messages for 4xx/5xx
- [ ] Specific messages for common errors (401, 403, 404)
- [ ] Network error handling
- [ ] Retry button for transient errors
- [ ] Log errors to console for debugging'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-021',
  'Optimize panel list pagination',
  'Add pagination to panel list to handle large numbers of panels efficiently.',
  'frontend',
  'RESEARCH_PANELS_UI',
  6,
  1.5,
  '["PRD003-PANEL-UI-001"]',
  'nextjs,typescript,react,shadcn',
  '["src/app/(authenticated)/research/panels/page.tsx"]',
  '- [ ] Pagination component from shadcn
- [ ] Page size: 20 panels per page
- [ ] Query params: ?page=1&pageSize=20
- [ ] Previous/Next buttons
- [ ] Page number display
- [ ] Total count display
- [ ] Maintains filters across pages
- [ ] Updates URL query params'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-022',
  'Add drag-and-drop for quota reordering',
  'Implement drag-and-drop functionality for reordering quota rules in QuotaManager.',
  'frontend',
  'RESEARCH_PANELS_UI',
  4,
  1.5,
  '["PRD003-PANEL-UI-005"]',
  'typescript,react,dnd-kit',
  '["src/components/panels/quota-manager.tsx"]',
  '- [ ] Install @dnd-kit/core and @dnd-kit/sortable
- [ ] Wrap quotas in SortableContext
- [ ] Drag handle icon per quota
- [ ] Reorder on drop
- [ ] Visual feedback during drag
- [ ] Alternative: ↑↓ buttons for keyboard users
- [ ] Updates quota order in state'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-PANEL-UI-023',
  'Write E2E tests for panel flows',
  'Create Playwright tests for creating panel, inviting members, and editing.',
  'testing',
  'RESEARCH_PANELS_UI',
  7,
  3,
  '["PRD003-PANEL-UI-008", "PRD003-PANEL-UI-009", "PRD003-PANEL-UI-010"]',
  'testing,playwright',
  '["tests/e2e/panels.spec.ts"]',
  '- [ ] Test: RESEARCHER creates panel with eligibility rules
- [ ] Test: Preview shows matching users
- [ ] Test: Invite members with eligibility check
- [ ] Test: Edit panel configuration
- [ ] Test: Archive panel (soft delete)
- [ ] Test: Permission checks (USER cannot create panel)
- [ ] All tests passing
- [ ] Screenshots on failure'
);

-- ============================================================================
-- EPIC 5: FEEDBACK_ENHANCEMENT (12 tasks)
-- ============================================================================

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-001',
  'Add ProductArea enum to Prisma schema',
  'Add ProductArea enum with values: Reservations, CheckIn, Payments, Housekeeping, Backoffice.',
  'backend',
  'FEEDBACK_ENHANCEMENT',
  10,
  0.5,
  '[]',
  'prisma,typescript',
  '["prisma/schema.prisma"]',
  '- [ ] ProductArea enum created with 5 values
- [ ] Feedback model has productArea ProductArea? field
- [ ] @@index([productArea]) added
- [ ] No schema errors
- [ ] Enum values match DSL global.yaml'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-002',
  'Run Prisma migration for ProductArea',
  'Generate and run migration to add productArea field to Feedback table.',
  'backend',
  'FEEDBACK_ENHANCEMENT',
  10,
  0.25,
  '["PRD003-FEED-001"]',
  'prisma',
  '[]',
  '- [ ] npm run db:generate executed
- [ ] npm run db:migrate executed
- [ ] Migration file created
- [ ] Database updated
- [ ] Prisma client regenerated
- [ ] No migration errors'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-003',
  'Update POST /api/feedback to accept productArea',
  'Enhance feedback creation endpoint to accept and validate productArea field.',
  'backend',
  'FEEDBACK_ENHANCEMENT',
  9,
  1,
  '["PRD003-FEED-002"]',
  'nextjs,typescript,prisma,zod',
  '["src/app/api/feedback/route.ts"]',
  '- [ ] Zod schema updated with productArea? enum field
- [ ] productArea validated against ProductArea enum
- [ ] productArea saved to database
- [ ] Returns created feedback with productArea
- [ ] Optional field (can be null)
- [ ] Validation error if invalid value'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-004',
  'Update GET /api/feedback to filter by productArea',
  'Add productArea query parameter to feedback list endpoint for filtering.',
  'backend',
  'FEEDBACK_ENHANCEMENT',
  8,
  1,
  '["PRD003-FEED-002"]',
  'nextjs,typescript,prisma',
  '["src/app/api/feedback/route.ts"]',
  '- [ ] Query param: ?productArea=CheckIn
- [ ] Adds productArea to WHERE clause if provided
- [ ] Validates productArea value against enum
- [ ] Returns filtered feedback list
- [ ] Can combine with other filters (state, village, search)
- [ ] Returns 400 if invalid productArea'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-005',
  'Update GET /api/feedback to filter by villageId',
  'Add villageId query parameter to feedback list endpoint for filtering.',
  'backend',
  'FEEDBACK_ENHANCEMENT',
  7,
  0.75,
  '[]',
  'nextjs,typescript,prisma',
  '["src/app/api/feedback/route.ts"]',
  '- [ ] Query param: ?villageId=vlg-001
- [ ] Adds villageId to WHERE clause if provided
- [ ] Returns filtered feedback list
- [ ] Can combine with other filters
- [ ] Handles null villageId (no village context)'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-006',
  'Add villageContext dropdown to feedback form',
  'Add village selector dropdown to feedback creation form with auto-population.',
  'frontend',
  'FEEDBACK_ENHANCEMENT',
  8,
  1.5,
  '[]',
  'nextjs,typescript,react,shadcn',
  '["src/app/(authenticated)/feedback/new/page.tsx"]',
  '- [ ] Village dropdown using Select component
- [ ] Fetches villages from API or hardcoded list
- [ ] Default value: session.user.currentVillageId
- [ ] Option: "No specific village" (null value)
- [ ] Label: "Village Context (Optional)"
- [ ] FormDescription explains purpose
- [ ] Included in form submission
- [ ] Zod validation (optional field)'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-007',
  'Add productArea dropdown to feedback form',
  'Add product area selector dropdown to feedback creation form.',
  'frontend',
  'FEEDBACK_ENHANCEMENT',
  9,
  1.5,
  '["PRD003-FEED-001"]',
  'nextjs,typescript,react,shadcn',
  '["src/app/(authenticated)/feedback/new/page.tsx"]',
  '- [ ] Product Area dropdown using Select component
- [ ] Options: Reservations, Check-in, Payments, Housekeeping, Backoffice
- [ ] Option: "No specific area" (null value)
- [ ] Label: "Product Area (Optional)"
- [ ] FormDescription explains purpose
- [ ] Included in form submission
- [ ] Zod validation (optional ProductArea enum)
- [ ] Maps to backend enum values'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-008',
  'Add productArea filter to feedback list page',
  'Add product area filter dropdown to feedback list page.',
  'frontend',
  'FEEDBACK_ENHANCEMENT',
  7,
  1.5,
  '["PRD003-FEED-004"]',
  'nextjs,typescript,react,shadcn',
  '["src/app/(authenticated)/feedback/page.tsx"]',
  '- [ ] Product Area filter dropdown
- [ ] Options: All, Reservations, Check-in, Payments, Housekeeping, Backoffice
- [ ] Updates URL query param ?productArea=...
- [ ] Fetches filtered feedback from API
- [ ] Can combine with other filters
- [ ] Filter state persists across navigation
- [ ] Clear filter button'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-009',
  'Add village filter to feedback list page',
  'Add village filter dropdown to feedback list page.',
  'frontend',
  'FEEDBACK_ENHANCEMENT',
  6,
  1,
  '["PRD003-FEED-005"]',
  'nextjs,typescript,react,shadcn',
  '["src/app/(authenticated)/feedback/page.tsx"]',
  '- [ ] Village filter dropdown
- [ ] Fetches villages from API or hardcoded list
- [ ] Updates URL query param ?villageId=...
- [ ] Fetches filtered feedback from API
- [ ] Option: "All villages"
- [ ] Can combine with other filters
- [ ] Filter state persists'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-010',
  'Display productArea badge on feedback cards',
  'Show product area badge on feedback cards in list and detail views.',
  'frontend',
  'FEEDBACK_ENHANCEMENT',
  5,
  1,
  '["PRD003-FEED-001"]',
  'nextjs,typescript,react,shadcn',
  '["src/components/feedback/feedback-card.tsx", "src/app/(authenticated)/feedback/[id]/page.tsx"]',
  '- [ ] Badge component shows productArea
- [ ] Color coding per area (optional)
- [ ] Shows only if productArea is set
- [ ] Displays in card header/metadata
- [ ] Displays on detail page
- [ ] Accessible with aria-label'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-011',
  'Display village name on feedback cards',
  'Show village name on feedback cards in list and detail views.',
  'frontend',
  'FEEDBACK_ENHANCEMENT',
  5,
  1,
  '[]',
  'nextjs,typescript,react,shadcn',
  '["src/components/feedback/feedback-card.tsx", "src/app/(authenticated)/feedback/[id]/page.tsx"]',
  '- [ ] Fetch village name from villageId
- [ ] Display with MapPin icon
- [ ] Shows only if villageId is set
- [ ] Displays in card metadata
- [ ] Displays on detail page
- [ ] Accessible with aria-label'
);

INSERT INTO tasks (task_id, title, description, category, epic, priority, estimated_hours, depends_on, tech_stack, files_to_modify, acceptance_criteria)
VALUES (
  'PRD003-FEED-012',
  'Write tests for feedback enhancement',
  'Create tests for productArea and villageContext functionality.',
  'testing',
  'FEEDBACK_ENHANCEMENT',
  6,
  2,
  '["PRD003-FEED-003", "PRD003-FEED-004", "PRD003-FEED-007", "PRD003-FEED-008"]',
  'testing,jest,playwright',
  '["src/app/api/feedback/__tests__/", "tests/e2e/feedback.spec.ts"]',
  '- [ ] API test: POST with productArea
- [ ] API test: GET filter by productArea
- [ ] API test: GET filter by villageId
- [ ] E2E test: Create feedback with productArea and village
- [ ] E2E test: Filter feedback by productArea
- [ ] E2E test: Filter feedback by village
- [ ] Test auto-population of villageContext
- [ ] All tests passing'
);

-- ============================================================================
-- Summary
-- ============================================================================
-- Total tasks inserted: 77
-- Epics:
--   - SIDEBAR_NAVIGATION: 15 tasks
--   - RESEARCH_PANELS (API): 12 tasks
--   - QUESTIONNAIRES: 15 tasks
--   - RESEARCH_PANELS_UI: 23 tasks
--   - FEEDBACK_ENHANCEMENT: 12 tasks
-- ============================================================================
