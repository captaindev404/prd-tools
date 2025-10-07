# Next.js 15.5 Breaking Changes & Migration Strategy

**Project**: Gentil Feedback Platform
**Current Version**: Next.js 14.2.16
**Target Version**: Next.js 15.5
**Analysis Date**: 2025-10-06
**Task**: Phase 1, Task #3 - Architecture Documentation

---

## Executive Summary

This document outlines all breaking changes between Next.js 14.2.16 and Next.js 15.5, their impact on our codebase, and a comprehensive migration strategy.

### Impact Overview

| Area | Files Affected | Severity | Effort |
|------|---------------|----------|--------|
| Async Route Params | 48 route handlers | **HIGH** | High |
| Async Page Params | 42 dynamic pages | **HIGH** | Medium |
| Fetch Caching | 85 fetch calls | **MEDIUM** | Low |
| SearchParams | 30 pages | **MEDIUM** | Medium |
| TypeScript Types | 295 TS/TSX files | **LOW** | Low |
| GET Route Handlers | 52 route handlers | **LOW** | Low |

**Total Estimated Effort**: 16-24 hours

---

## 1. Async Request APIs (CRITICAL BREAKING CHANGE)

### What Changed

In Next.js 15, dynamic APIs that rely on runtime information are now **asynchronous**:
- `params` in route handlers and pages
- `searchParams` in pages
- `cookies()` from `next/headers`
- `headers()` from `next/headers`
- `draftMode()` from `next/headers`

### Impact on Our Codebase

#### Affected Route Handlers: **48 files**

**Files with `params` in route handlers:**
```
src/app/api/moderation/[id]/approve/route.ts
src/app/api/moderation/[id]/reject/route.ts
src/app/api/notifications/[id]/route.ts
src/app/api/sessions/[id]/route.ts
src/app/api/sessions/[id]/complete/route.ts
src/app/api/sessions/[id]/join/route.ts
src/app/api/sessions/[id]/participants/route.ts
src/app/api/feedback/[id]/duplicates/route.ts
src/app/api/feedback/[id]/link-feature/route.ts
src/app/api/feedback/[id]/route.ts
src/app/api/feedback/[id]/merge/route.ts
src/app/api/feedback/[id]/vote/route.ts
src/app/api/user/panels/[panelId]/decline/route.ts
src/app/api/user/panels/[panelId]/accept/route.ts
src/app/api/admin/users/[userId]/route.ts
src/app/api/admin/users/[userId]/activity/route.ts
src/app/api/features/[id]/route.ts
src/app/api/panels/[id]/members/[userId]/route.ts
src/app/api/panels/[id]/members/route.ts
src/app/api/panels/[id]/route.ts
src/app/api/panels/[id]/eligibility-preview/route.ts
src/app/api/roadmap/[id]/route.ts
src/app/api/roadmap/[id]/publish/route.ts
src/app/api/questionnaires/[id]/analytics/route.ts
src/app/api/questionnaires/[id]/export/route.ts
src/app/api/questionnaires/[id]/route.ts
src/app/api/questionnaires/[id]/publish/route.ts
src/app/api/questionnaires/[id]/responses/route.ts
... and 20 more
```

#### Affected Pages: **42 files**

**Files with `params` in page components:**
```
src/app/(authenticated)/admin/users/[userId]/page.tsx
src/app/(authenticated)/features/[id]/page.tsx
src/app/(authenticated)/features/[id]/edit/page.tsx
src/app/(authenticated)/roadmap/[id]/page.tsx
src/app/(authenticated)/roadmap/[id]/edit/page.tsx
src/app/(authenticated)/research/sessions/[id]/page.tsx
src/app/(authenticated)/research/sessions/[id]/edit/page.tsx
src/app/(authenticated)/research/panels/[id]/page.tsx
src/app/(authenticated)/research/panels/[id]/edit/page.tsx
src/app/(authenticated)/research/questionnaires/[id]/analytics/page.tsx
src/app/(authenticated)/research/questionnaires/[id]/respond/page.tsx
src/app/(authenticated)/research/questionnaires/[id]/edit/page.tsx
src/app/questionnaires/[id]/respond/page.tsx
... and 29 more
```

#### Affected Files with `searchParams`: **30 files**

Pages using searchParams for filtering, pagination, etc.

### Current Pattern (Next.js 14)

```typescript
// Route Handler
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const feedbackId = params.id;
  // ... rest of code
}

// Page Component
export default async function FeedbackPage({
  params,
}: {
  params: { id: string };
}) {
  const feedback = await getFeedback(params.id);
  // ... rest of code
}
```

### Required Pattern (Next.js 15)

```typescript
// Route Handler
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedbackId } = await params;
  // ... rest of code
}

// Page Component
export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feedback = await getFeedback(id);
  // ... rest of code
}

// Client Component (using React.use())
'use client';
import { use } from 'react';

export default function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // ... rest of code
}
```

### Migration Strategy

1. **Automated Migration (Codemod)**
   ```bash
   npx @next/codemod@canary next-async-request-api .
   ```
   - This will automatically update most params and searchParams usage
   - Review all changes manually after running

2. **Manual Updates Required**
   - Complex destructuring patterns
   - Params used in multiple locations
   - Client components (need to use `React.use()`)

3. **Type Updates**
   ```typescript
   // Before
   type PageProps = {
     params: { id: string };
     searchParams: { [key: string]: string | string[] | undefined };
   }

   // After
   type PageProps = {
     params: Promise<{ id: string }>;
     searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
   }
   ```

---

## 2. Fetch Request Caching Changes (IMPORTANT)

### What Changed

**Next.js 14**: `fetch()` requests were cached by default (`cache: 'force-cache'`)
**Next.js 15**: `fetch()` requests are NOT cached by default (`cache: 'no-store'`)

### Impact on Our Codebase

**Affected Files**: 85 fetch calls across 55 files

Key files with fetch():
```
src/lib/validators/jira.ts - External API validation
src/scripts/hris-sync.ts - Employee data sync
src/components/**/fetch calls - Client-side data fetching
```

### Migration Strategy

1. **Audit All Fetch Calls**
   - Identify which should be cached vs. dynamic
   - External API calls (Jira, HRIS) → likely should cache with revalidation
   - User-specific data → likely should NOT cache

2. **Update Fetch Calls**
   ```typescript
   // For data that should be cached
   fetch(url, { cache: 'force-cache' })

   // For data that should be cached with revalidation
   fetch(url, { next: { revalidate: 3600 } }) // 1 hour

   // For dynamic data (default, no change needed)
   fetch(url) // Will use no-store by default
   ```

3. **No Action Needed If:**
   - Fetch is already using `cache: 'no-store'`
   - Fetch is for user-specific data
   - Fetch is in client components with React Query

---

## 3. GET Route Handler Caching Changes

### What Changed

**Next.js 14**: GET route handlers were cached by default
**Next.js 15**: GET route handlers are NOT cached by default

### Impact on Our Codebase

**Affected Files**: 52 GET route handlers in `src/app/api/`

All routes are currently dynamic (database queries, authentication checks), so this change is **BENEFICIAL** for our use case.

### Migration Strategy

**No action required** - Our API routes should remain dynamic:
- All routes query database in real-time
- All routes check authentication
- Caching would cause stale data issues

If we need to cache specific routes later:
```typescript
export const dynamic = 'force-static';
export async function GET() {
  // ...
}
```

---

## 4. TypeScript Configuration Updates

### What Changed

- Support for `next.config.ts` (TypeScript config)
- Updated type definitions for React 19
- New `@types/react` and `@types/react-dom` versions

### Impact on Our Codebase

**Current Config**: `next.config.js` (JavaScript)
**Affected Files**: All 295 TypeScript files (indirect impact)

### Migration Strategy

1. **Update Dependencies**
   ```bash
   npm install --save-dev @types/react@latest @types/react-dom@latest
   ```

2. **Optional: Convert to TypeScript Config**
   ```bash
   mv next.config.js next.config.ts
   ```
   Update to:
   ```typescript
   import type { NextConfig } from 'next';

   const nextConfig: NextConfig = {
     // ... existing config
   };

   export default nextConfig;
   ```

3. **Run React 19 Type Codemod** (if upgrading to React 19)
   ```bash
   npx types-react-codemod@latest preset-19 ./src
   ```

---

## 5. Middleware Runtime Changes

### What Changed

- Middleware edge runtime improvements
- Better support for `next/headers` in middleware

### Impact on Our Codebase

**Affected File**: `src/middleware.ts`

**Current Implementation**:
- Using `getToken()` from `next-auth/jwt`
- Checking public routes
- Redirecting unauthorized users

### Migration Strategy

**Review and Test** - No immediate changes needed, but:
1. Test middleware after upgrade
2. Verify authentication flow works
3. Check rate limiting middleware in `src/middleware/rate-limit.ts`

---

## 6. ESLint Plugin Updates

### What Changed

- `eslint-plugin-react-hooks` upgraded to v5.0.0
- New rules for React Hooks usage

### Impact on Our Codebase

**Affected Files**: All components using hooks (estimated 100+ files)

Key areas:
- Custom hooks in `src/hooks/`
- Component hooks throughout `src/components/`

### Migration Strategy

1. **Run ESLint After Upgrade**
   ```bash
   npm run lint
   ```

2. **Fix Any New Hook Violations**
   - Dependency array issues
   - Conditional hook calls
   - Hook ordering problems

---

## Migration Checklist

### Phase 1: Preparation (Task #1 - #4)
- [x] Create backup of current codebase
- [x] Review Next.js 15 release notes
- [x] Document current architecture (this document)
- [ ] Create feature branch for upgrade

### Phase 2: Update Dependencies
- [ ] Update Next.js: `npm install next@15.5`
- [ ] Update React types: `npm install --save-dev @types/react@latest @types/react-dom@latest`
- [ ] Update ESLint plugin: `npm install --save-dev eslint-plugin-react-hooks@5`

### Phase 3: Code Migration
- [ ] Run async request API codemod
- [ ] Manually review and fix route handlers (48 files)
- [ ] Manually review and fix page components (42 files)
- [ ] Update searchParams usage (30 files)
- [ ] Review and update fetch() calls (85 calls)
- [ ] Fix ESLint violations

### Phase 4: Testing
- [ ] Run type checking: `npm run type-check`
- [ ] Run linting: `npm run lint`
- [ ] Test authentication flow
- [ ] Test all dynamic routes
- [ ] Test API endpoints
- [ ] Run unit tests
- [ ] Run E2E tests
- [ ] Manual QA of critical flows

### Phase 5: Deployment
- [ ] Deploy to staging
- [ ] Smoke test in staging
- [ ] Monitor performance metrics
- [ ] Deploy to production
- [ ] Monitor error logs

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Preparation | 2 hours | None |
| Update Dependencies | 1 hour | Phase 1 |
| Code Migration | 12-16 hours | Phase 2 |
| Testing | 4-6 hours | Phase 3 |
| Deployment | 2 hours | Phase 4 |
| **Total** | **21-27 hours** | Sequential |

---

## Risk Assessment

### High Risk Areas

1. **Authentication Flow** (CRITICAL)
   - Middleware changes could break auth
   - Test thoroughly before deploying

2. **API Route Params** (HIGH)
   - 48 route handlers need updates
   - Missing `await` will cause runtime errors

3. **Dynamic Pages** (HIGH)
   - 42 pages with dynamic params
   - Type mismatches will cause build errors

### Medium Risk Areas

1. **Fetch Caching** (MEDIUM)
   - Changed defaults could affect performance
   - Need to identify which should cache

2. **Client Components** (MEDIUM)
   - Need to use `React.use()` for params
   - Different pattern from server components

### Low Risk Areas

1. **TypeScript Types** (LOW)
   - Mostly automated updates
   - Well-documented migration path

2. **GET Route Handlers** (LOW)
   - Default behavior change is beneficial
   - No action needed

---

## Rollback Plan

If critical issues are discovered after deployment:

1. **Immediate Rollback**
   ```bash
   git revert <upgrade-commit>
   npm install
   npm run build
   ```

2. **Package Lock Restoration**
   ```bash
   git checkout main -- package-lock.json
   npm ci
   ```

3. **Redeploy Previous Version**
   - Deploy last known good commit
   - Monitor error logs

---

## Additional Resources

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Upgrading to Next.js 15 Guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Async Request APIs Documentation](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [Next.js Codemod CLI](https://nextjs.org/docs/app/building-your-application/upgrading/codemods)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

---

## Appendix A: File Inventory

### Route Handlers with Params (48 files)
```
src/app/api/moderation/[id]/approve/route.ts
src/app/api/moderation/[id]/reject/route.ts
src/app/api/notifications/[id]/route.ts
src/app/api/sessions/[id]/route.ts
src/app/api/sessions/[id]/complete/route.ts
src/app/api/sessions/[id]/join/route.ts
src/app/api/sessions/[id]/participants/route.ts
src/app/api/feedback/[id]/duplicates/route.ts
src/app/api/feedback/[id]/link-feature/route.ts
src/app/api/feedback/[id]/route.ts
src/app/api/feedback/[id]/merge/route.ts
src/app/api/feedback/[id]/vote/route.ts
src/app/api/user/panels/[panelId]/decline/route.ts
src/app/api/user/panels/[panelId]/accept/route.ts
src/app/api/admin/users/[userId]/route.ts
src/app/api/admin/users/[userId]/activity/route.ts
src/app/api/features/[id]/route.ts
src/app/api/panels/[id]/members/[userId]/route.ts
src/app/api/panels/[id]/members/route.ts
src/app/api/panels/[id]/route.ts
src/app/api/panels/[id]/eligibility-preview/route.ts
src/app/api/roadmap/[id]/route.ts
src/app/api/roadmap/[id]/publish/route.ts
src/app/api/questionnaires/[id]/analytics/route.ts
src/app/api/questionnaires/[id]/export/route.ts
src/app/api/questionnaires/[id]/route.ts
src/app/api/questionnaires/[id]/publish/route.ts
src/app/api/questionnaires/[id]/responses/route.ts
(+ 20 more route handlers)
```

### Pages with Dynamic Params (42 files)
```
src/app/(authenticated)/admin/users/[userId]/page.tsx
src/app/(authenticated)/features/[id]/page.tsx
src/app/(authenticated)/features/[id]/edit/page.tsx
src/app/(authenticated)/feedback/[id]/page.tsx
src/app/(authenticated)/feedback/[id]/edit/page.tsx
src/app/(authenticated)/roadmap/[id]/page.tsx
src/app/(authenticated)/roadmap/[id]/edit/page.tsx
src/app/(authenticated)/research/sessions/[id]/page.tsx
src/app/(authenticated)/research/sessions/[id]/edit/page.tsx
src/app/(authenticated)/research/panels/[id]/page.tsx
src/app/(authenticated)/research/panels/[id]/edit/page.tsx
src/app/(authenticated)/research/questionnaires/[id]/analytics/page.tsx
src/app/(authenticated)/research/questionnaires/[id]/respond/page.tsx
src/app/(authenticated)/research/questionnaires/[id]/edit/page.tsx
src/app/questionnaires/[id]/respond/page.tsx
(+ 27 more dynamic pages)
```

### Files with Fetch Calls (55 files, 85 total calls)
```
src/lib/api-error-handler.ts
src/lib/validators/jira.ts
src/lib/query-client.ts
src/scripts/hris-sync.ts
src/components/moderation/moderation-actions.tsx
src/components/notifications/notification-bell.tsx
src/components/sessions/complete-session-dialog.tsx
src/components/feedback/vote-button.tsx
src/components/feedback/FeedbackFilters.tsx
src/components/admin/create-village-dialog.tsx
src/components/admin/edit-village-dialog.tsx
src/components/admin/edit-role-dialog.tsx
src/components/features/link-feature-dialog.tsx
src/components/features/feature-form.tsx
src/components/panels/panels-list.tsx
(+ 40 more files with fetch calls)
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Author**: AI Agent - Task #3
**Status**: Ready for Review
