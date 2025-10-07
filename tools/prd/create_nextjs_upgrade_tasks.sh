#!/bin/bash
# Script to populate Next.js 15.5 Upgrade tasks into PRD database
# Based on PRD-004: Next.js 15.5 Upgrade

PRD="./target/release/prd"
DB="--database prd.db"

echo "=== Creating Next.js 15.5 Upgrade Tasks ==="
echo ""

# ===== PHASE 1: PREPARATION =====
echo "Creating Phase 1: Preparation tasks..."

TASK1=$($PRD $DB create "Create upgrade branch and baseline metrics" \
  --epic "Next.js 15.5 Upgrade" \
  --priority high \
  --description "Create feature branch 'upgrade/nextjs-15.5', run baseline build and test metrics, document current state for comparison" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK1: Create upgrade branch and baseline metrics"

$PRD $DB ac "$TASK1" add "Feature branch 'upgrade/nextjs-15.5' created"
$PRD $DB ac "$TASK1" add "Baseline build time recorded"
$PRD $DB ac "$TASK1" add "All current tests passing"
$PRD $DB ac "$TASK1" add "Current lint warnings documented"

TASK2=$($PRD $DB create "Audit dependencies for Next.js 15.5 compatibility" \
  --epic "Next.js 15.5 Upgrade" \
  --priority high \
  --description "Verify compatibility of Next-Auth v5, Prisma, Radix UI, TanStack Query, and other dependencies with Next.js 15.5. Check release notes and GitHub issues" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK2: Audit dependencies"

$PRD $DB ac "$TASK2" add "Next-Auth v5 compatibility verified"
$PRD $DB ac "$TASK2" add "Prisma compatibility verified"
$PRD $DB ac "$TASK2" add "Radix UI components compatibility verified"
$PRD $DB ac "$TASK2" add "TanStack Query compatibility verified"
$PRD $DB ac "$TASK2" add "Node.js version requirements documented (18.18.0+)"

TASK3=$($PRD $DB create "Document current architecture and breaking changes" \
  --epic "Next.js 15.5 Upgrade" \
  --priority medium \
  --description "Review Next.js 15 release notes, identify breaking changes that affect our codebase, document current patterns to be migrated" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK3: Document architecture"

$PRD $DB ac "$TASK3" add "Breaking changes list documented"
$PRD $DB ac "$TASK3" add "Fetch API migration strategy defined"
$PRD $DB ac "$TASK3" add "Route params migration strategy defined"
$PRD $DB ac "$TASK3" add "Files requiring changes identified"

$PRD $DB depends "$TASK2" --on "$TASK1"
$PRD $DB depends "$TASK3" --on "$TASK1"

# ===== PHASE 2: PACKAGE UPGRADE =====
echo ""
echo "Creating Phase 2: Package Upgrade tasks..."

TASK4=$($PRD $DB create "Update package.json dependencies to Next.js 15.5" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Update next to 15.5.0, eslint-config-next to 15.5.0, verify Next-Auth version, and update any other affected dependencies" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK4: Update package.json"

$PRD $DB ac "$TASK4" add "next updated to 15.5.0"
$PRD $DB ac "$TASK4" add "eslint-config-next updated to 15.5.0"
$PRD $DB ac "$TASK4" add "next-auth version verified/updated"
$PRD $DB ac "$TASK4" add "package.json committed to branch"

$PRD $DB depends "$TASK4" --on "$TASK3"

TASK5=$($PRD $DB create "Reinstall dependencies and regenerate Prisma client" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Remove node_modules and package-lock.json, run npm install, regenerate Prisma client with npm run db:generate" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK5: Reinstall dependencies"

$PRD $DB ac "$TASK5" add "node_modules cleaned and reinstalled"
$PRD $DB ac "$TASK5" add "package-lock.json updated"
$PRD $DB ac "$TASK5" add "Prisma client regenerated successfully"
$PRD $DB ac "$TASK5" add "No installation errors"

$PRD $DB depends "$TASK5" --on "$TASK4"

# ===== PHASE 3: CODE MIGRATION =====
echo ""
echo "Creating Phase 3: Code Migration tasks..."

TASK6=$($PRD $DB create "Migrate fetch API calls with explicit cache directives" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Update all fetch() calls in API routes, server components, and utility functions to explicitly define cache behavior (cache: 'force-cache' or cache: 'no-store')" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK6: Migrate fetch API calls"

$PRD $DB ac "$TASK6" add "All fetch calls in src/app/api/** updated"
$PRD $DB ac "$TASK6" add "All fetch calls in page.tsx files updated"
$PRD $DB ac "$TASK6" add "All fetch calls in src/lib/** updated"
$PRD $DB ac "$TASK6" add "Cache strategy documented for each endpoint"

$PRD $DB depends "$TASK6" --on "$TASK5"

TASK7=$($PRD $DB create "Update route handler params to async/await syntax" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Update all dynamic API route handlers to await destructured params. Convert params from { params: { id: string } } to { params: Promise<{ id: string }> }" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK7: Update route params"

$PRD $DB ac "$TASK7" add "All routes in src/app/api/feedback/[id]/** updated"
$PRD $DB ac "$TASK7" add "All routes in src/app/api/research/panels/[id]/** updated"
$PRD $DB ac "$TASK7" add "All dynamic API routes identified and updated"
$PRD $DB ac "$TASK7" add "TypeScript compilation successful"

$PRD $DB depends "$TASK7" --on "$TASK5"

TASK8=$($PRD $DB create "Update middleware configuration for Next.js 15" \
  --epic "Next.js 15.5 Upgrade" \
  --priority high \
  --description "Review and update src/middleware.ts for Next.js 15 compatibility. Consider Node.js runtime option now that it's stable. Verify authentication middleware works correctly" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK8: Update middleware"

$PRD $DB ac "$TASK8" add "Middleware config reviewed and updated"
$PRD $DB ac "$TASK8" add "Runtime config decision documented"
$PRD $DB ac "$TASK8" add "Middleware matcher patterns verified"
$PRD $DB ac "$TASK8" add "Auth middleware functionality tested"

$PRD $DB depends "$TASK8" --on "$TASK5"

TASK9=$($PRD $DB create "Update TypeScript configuration for Next.js 15" \
  --epic "Next.js 15.5 Upgrade" \
  --priority medium \
  --description "Update tsconfig.json with Next.js 15 recommended settings. Add noUncheckedIndexedAccess if recommended. Verify TypeScript plugin configuration" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK9: Update TypeScript config"

$PRD $DB ac "$TASK9" add "tsconfig.json updated with recommended settings"
$PRD $DB ac "$TASK9" add "TypeScript plugin configured correctly"
$PRD $DB ac "$TASK9" add "New type errors identified and documented"
$PRD $DB ac "$TASK9" add "Stricter type checking enabled"

$PRD $DB depends "$TASK9" --on "$TASK5"

TASK10=$($PRD $DB create "Update Next.js configuration file" \
  --epic "Next.js 15.5 Upgrade" \
  --priority medium \
  --description "Update next.config.js/mjs for Next.js 15. Remove deprecated options, consider enabling experimental features like typedRoutes, verify build configuration" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK10: Update Next.js config"

$PRD $DB ac "$TASK10" add "Deprecated options removed"
$PRD $DB ac "$TASK10" add "Experimental features evaluated"
$PRD $DB ac "$TASK10" add "Build configuration verified"
$PRD $DB ac "$TASK10" add "Config file syntax valid"

$PRD $DB depends "$TASK10" --on "$TASK5"

TASK11=$($PRD $DB create "Fix TypeScript compilation errors from stricter checking" \
  --epic "Next.js 15.5 Upgrade" \
  --priority high \
  --description "Resolve all TypeScript errors introduced by Next.js 15's stricter type checking. Fix route export signatures, type validation errors, and any breaking changes" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK11: Fix TypeScript errors"

$PRD $DB ac "$TASK11" add "All TypeScript compilation errors resolved"
$PRD $DB ac "$TASK11" add "Route export signatures corrected"
$PRD $DB ac "$TASK11" add "Type validation errors fixed"
$PRD $DB ac "$TASK11" add "npm run build succeeds with no type errors"

$PRD $DB depends "$TASK11" --on "$TASK6"
$PRD $DB depends "$TASK11" --on "$TASK7"
$PRD $DB depends "$TASK11" --on "$TASK9"

# ===== PHASE 4: TESTING =====
echo ""
echo "Creating Phase 4: Testing tasks..."

TASK12=$($PRD $DB create "Run unit tests and verify all pass" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Run npm run test to execute all unit tests. Verify no new failures. Fix any test failures related to Next.js 15 changes" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK12: Run unit tests"

$PRD $DB ac "$TASK12" add "All unit tests pass"
$PRD $DB ac "$TASK12" add "No test failures from upgrade"
$PRD $DB ac "$TASK12" add "Test coverage maintained"
$PRD $DB ac "$TASK12" add "Any test updates documented"

$PRD $DB depends "$TASK12" --on "$TASK11"

TASK13=$($PRD $DB create "Validate production build completes successfully" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Run npm run build to create production build. Verify no build errors, measure build time improvement, validate static/dynamic route classification" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK13: Validate production build"

$PRD $DB ac "$TASK13" add "Production build completes without errors"
$PRD $DB ac "$TASK13" add "Build time improvement measured and documented"
$PRD $DB ac "$TASK13" add "Static/dynamic routes correctly classified"
$PRD $DB ac "$TASK13" add "Build output size compared with baseline"

$PRD $DB depends "$TASK13" --on "$TASK11"

TASK14=$($PRD $DB create "Perform comprehensive local development testing" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Start dev server with npm run dev. Manually test: homepage, Azure AD auth, feedback creation, voting, roadmap, research panels, settings, admin panel, API routes" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK14: Local development testing"

$PRD $DB ac "$TASK14" add "Dev server starts successfully"
$PRD $DB ac "$TASK14" add "Homepage loads correctly"
$PRD $DB ac "$TASK14" add "Azure AD authentication works"
$PRD $DB ac "$TASK14" add "Feedback creation and voting work"
$PRD $DB ac "$TASK14" add "Roadmap and research panels accessible"
$PRD $DB ac "$TASK14" add "Settings and admin panel functional"
$PRD $DB ac "$TASK14" add "API routes return correct responses"
$PRD $DB ac "$TASK14" add "Dev server startup time measured"

$PRD $DB depends "$TASK14" --on "$TASK13"

TASK15=$($PRD $DB create "Run E2E tests with Playwright" \
  --epic "Next.js 15.5 Upgrade" \
  --priority high \
  --description "Execute npm run test:e2e to run all Playwright end-to-end tests. Verify no regressions, fix any E2E test failures" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK15: Run E2E tests"

$PRD $DB ac "$TASK15" add "All E2E tests pass"
$PRD $DB ac "$TASK15" add "No test regressions"
$PRD $DB ac "$TASK15" add "Critical user flows verified"
$PRD $DB ac "$TASK15" add "Test results documented"

$PRD $DB depends "$TASK15" --on "$TASK14"

TASK16=$($PRD $DB create "Run accessibility audit with Lighthouse" \
  --epic "Next.js 15.5 Upgrade" \
  --priority medium \
  --description "Run Lighthouse accessibility audit on key pages. Verify no new accessibility regressions, ensure scores maintained or improved" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK16: Accessibility audit"

$PRD $DB ac "$TASK16" add "Lighthouse audit completed on key pages"
$PRD $DB ac "$TASK16" add "No new accessibility regressions"
$PRD $DB ac "$TASK16" add "Accessibility scores documented"
$PRD $DB ac "$TASK16" add "Any improvements noted"

$PRD $DB depends "$TASK16" --on "$TASK14"

# ===== PHASE 5: DOCUMENTATION =====
echo ""
echo "Creating Phase 5: Documentation tasks..."

TASK17=$($PRD $DB create "Update README.md with Next.js 15.5 information" \
  --epic "Next.js 15.5 Upgrade" \
  --priority high \
  --description "Update README with Next.js version badge, installation requirements, Node.js version requirement (18.18.0+), and any new setup instructions" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK17: Update README.md"

$PRD $DB ac "$TASK17" add "Next.js version badge updated to 15.5"
$PRD $DB ac "$TASK17" add "Node.js requirements updated (18.18.0+)"
$PRD $DB ac "$TASK17" add "Installation instructions verified"
$PRD $DB ac "$TASK17" add "Any new features documented"

$PRD $DB depends "$TASK17" --on "$TASK15"

TASK18=$($PRD $DB create "Update CLAUDE.md project instructions" \
  --epic "Next.js 15.5 Upgrade" \
  --priority high \
  --description "Update CLAUDE.md tech stack section: change 'Next.js 14' to 'Next.js 15.5', add notes about Turbopack dev mode, update any relevant coding guidelines" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK18: Update CLAUDE.md"

$PRD $DB ac "$TASK18" add "Tech stack section updated"
$PRD $DB ac "$TASK18" add "Next.js 15.5 features documented"
$PRD $DB ac "$TASK18" add "Coding guidelines updated if needed"
$PRD $DB ac "$TASK18" add "Breaking changes noted"

$PRD $DB depends "$TASK18" --on "$TASK15"

TASK19=$($PRD $DB create "Create NEXTJS_15_MIGRATION.md guide" \
  --epic "Next.js 15.5 Upgrade" \
  --priority medium \
  --description "Document all breaking changes encountered, code changes made, troubleshooting tips, and rollback instructions in docs/NEXTJS_15_MIGRATION.md" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK19: Create migration guide"

$PRD $DB ac "$TASK19" add "Migration guide created in docs/"
$PRD $DB ac "$TASK19" add "Breaking changes documented"
$PRD $DB ac "$TASK19" add "Code changes listed"
$PRD $DB ac "$TASK19" add "Troubleshooting section added"
$PRD $DB ac "$TASK19" add "Rollback instructions included"

$PRD $DB depends "$TASK19" --on "$TASK15"

TASK20=$($PRD $DB create "Update API documentation with Next.js 15 changes" \
  --epic "Next.js 15.5 Upgrade" \
  --priority low \
  --description "Review and update docs/API.md if any API patterns changed. Update code examples to reflect fetch cache directives and new route param syntax" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK20: Update API docs"

$PRD $DB ac "$TASK20" add "API docs reviewed"
$PRD $DB ac "$TASK20" add "Code examples updated"
$PRD $DB ac "$TASK20" add "New patterns documented"
$PRD $DB ac "$TASK20" add "Examples tested and verified"

$PRD $DB depends "$TASK20" --on "$TASK15"

# ===== PHASE 6: DEPLOYMENT =====
echo ""
echo "Creating Phase 6: Deployment tasks..."

TASK21=$($PRD $DB create "Deploy to staging environment and run smoke tests" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Deploy upgrade branch to staging environment. Run smoke tests, validate auth flow, test critical features, verify analytics and logging" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK21: Deploy to staging"

$PRD $DB ac "$TASK21" add "Deployed to staging successfully"
$PRD $DB ac "$TASK21" add "Smoke tests passed"
$PRD $DB ac "$TASK21" add "Authentication flow verified"
$PRD $DB ac "$TASK21" add "Critical features tested"
$PRD $DB ac "$TASK21" add "Analytics and logging validated"
$PRD $DB ac "$TASK21" add "No critical issues found"

$PRD $DB depends "$TASK21" --on "$TASK17"
$PRD $DB depends "$TASK21" --on "$TASK18"
$PRD $DB depends "$TASK21" --on "$TASK19"

TASK22=$($PRD $DB create "Deploy to production environment" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Create deployment checklist, deploy to production following approved process. Have rollback plan ready. Monitor initial deployment closely" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK22: Deploy to production"

$PRD $DB ac "$TASK22" add "Deployment checklist created"
$PRD $DB ac "$TASK22" add "Rollback plan documented and ready"
$PRD $DB ac "$TASK22" add "Production deployment successful"
$PRD $DB ac "$TASK22" add "No deployment errors"
$PRD $DB ac "$TASK22" add "Initial monitoring shows no issues"

$PRD $DB depends "$TASK22" --on "$TASK21"

TASK23=$($PRD $DB create "Post-deployment monitoring and validation" \
  --epic "Next.js 15.5 Upgrade" \
  --priority critical \
  --description "Monitor application for 24-48 hours post-deployment. Check error rates, performance metrics, authentication success rates. Document any issues and improvements" \
  | grep -oE '#[0-9]+' | head -1)
echo "Created $TASK23: Post-deployment monitoring"

$PRD $DB ac "$TASK23" add "Error rates monitored (first 24h)"
$PRD $DB ac "$TASK23" add "Performance metrics validated"
$PRD $DB ac "$TASK23" add "Authentication success rate verified"
$PRD $DB ac "$TASK23" add "Build time improvements confirmed"
$PRD $DB ac "$TASK23" add "Dev server startup improvements confirmed"
$PRD $DB ac "$TASK23" add "Final report created"

$PRD $DB depends "$TASK23" --on "$TASK22"

echo ""
echo "=== Task Creation Complete ==="
echo ""
echo "Summary:"
echo "  - Phase 1 (Preparation): 3 tasks"
echo "  - Phase 2 (Package Upgrade): 2 tasks"
echo "  - Phase 3 (Code Migration): 6 tasks"
echo "  - Phase 4 (Testing): 5 tasks"
echo "  - Phase 5 (Documentation): 4 tasks"
echo "  - Phase 6 (Deployment): 3 tasks"
echo "  Total: 23 tasks"
echo ""
echo "Run './target/release/prd --database prd.db epics' to see epic progress"
echo "Run './target/release/prd --database prd.db ready' to see tasks ready to work on"
