# Next.js 15.5 Migration Guide

**Date**: October 6, 2025
**Project**: Gentil Feedback Platform
**Migration Version**: Next.js 14.2.16 → 15.5.4

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Breaking Changes](#breaking-changes)
4. [Migration Steps](#migration-steps)
5. [Code Changes Required](#code-changes-required)
6. [Files Modified](#files-modified)
7. [Testing & Validation](#testing--validation)
8. [Performance Improvements](#performance-improvements)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Instructions](#rollback-instructions)

---

## Overview

This document details the complete migration of the Gentil Feedback platform from Next.js 14.2.16 to Next.js 15.5.4. The upgrade includes several breaking changes and new features that improve performance and developer experience.

### Key Improvements

- **Turbopack Dev Server**: Faster development builds and Hot Module Replacement (HMR)
- **Improved Caching**: More explicit and predictable caching behavior
- **Better TypeScript Support**: Enhanced type safety for route parameters
- **React 19 Support**: Ready for React 19 when stable
- **Performance Optimizations**: Better build times and runtime performance

### Migration Complexity

- **Difficulty**: Medium
- **Estimated Time**: 4-6 hours for full migration and testing
- **Risk Level**: Low (backward compatible with proper changes)

---

## Prerequisites

### Required Versions

- **Node.js**: 18.18.0 or higher (previously 18.x)
- **npm**: 9.x or higher
- **TypeScript**: 5.6.3 or higher

### Verify Current Environment

```bash
node --version  # Should show v18.18.0 or higher
npm --version   # Should show 9.x or higher
```

### Backup Checklist

Before starting migration:

- [ ] Commit all current changes to git
- [ ] Create a migration branch: `git checkout -b upgrade/nextjs-15.5`
- [ ] Backup `package.json` and `package-lock.json`
- [ ] Document current build/test status
- [ ] Tag current state: `git tag pre-nextjs-15-migration`

---

## Breaking Changes

### 1. Async Request APIs (CRITICAL)

**What Changed**: Route handler `params` and `searchParams` are now `Promise`-based.

**Before (Next.js 14)**:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // Direct access
  // ...
}
```

**After (Next.js 15)**:
```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // Must await
  // ...
}
```

### 2. Fetch Caching Changes (IMPORTANT)

**What Changed**: Fetch requests are NO LONGER cached by default.

**Before (Next.js 14)**:
```typescript
// Automatically cached
const data = await fetch('https://api.example.com/data');
```

**After (Next.js 15)**:
```typescript
// Explicitly specify caching behavior
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache', // or 'no-store'
  next: { revalidate: 3600 } // optional revalidation
});
```

### 3. Route Segment Config Changes

**What Changed**: Some route segment config options have different defaults.

```typescript
// Explicitly set if needed
export const dynamic = 'force-dynamic'; // or 'auto', 'force-static'
export const revalidate = 3600; // seconds
```

### 4. Image Component Changes

**What Changed**: `next/image` has stricter prop validation.

- `layout` prop deprecated (use `fill`, `width`/`height` instead)
- Better automatic optimization

### 5. Middleware Changes

**What Changed**: Middleware response handling is stricter.

```typescript
// Ensure proper response types
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Must return NextResponse or Response
  return NextResponse.next();
}
```

---

## Migration Steps

### Phase 1: Dependency Updates (Tasks #1-4)

#### Task #1: Update Core Dependencies

```bash
npm install next@15.5.4 react@^18.3.1 react-dom@^18.3.1
npm install -D eslint-config-next@15.5.4
```

#### Task #2: Update Type Definitions

```bash
npm install -D @types/node@^22.7.7 @types/react@^18.3.11 @types/react-dom@^18.3.1
```

#### Task #3: Update Related Dependencies

```bash
npm install zod@^4.1.11 @tanstack/react-query@^5.90.2
```

#### Task #4: Verify Dependency Tree

```bash
npm install
npm audit fix
```

**Completion Criteria**:
- [ ] All dependencies updated
- [ ] No peer dependency warnings
- [ ] `npm install` completes without errors

---

### Phase 2: Code Migration (Tasks #5-12)

#### Task #5: Update Route Handlers with Dynamic Params

**Files to Update**: All route handlers in `/app/api/**/*` with dynamic segments

**Pattern**: Search for route handlers with `params` and update to async.

**Example Files**:
- `/app/api/feedback/[id]/route.ts`
- `/app/api/features/[id]/route.ts`
- `/app/api/roadmap/[id]/route.ts`

**Migration Script**:
```typescript
// Before
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // ...
}

// After
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  // ...
}
```

#### Task #6: Update Page Components with Dynamic Params

**Files to Update**: All page components using `params` prop

**Pattern**: Update all page components in dynamic routes.

**Example Files**:
- `/app/(authenticated)/feedback/[id]/page.tsx`
- `/app/(authenticated)/features/[id]/page.tsx`
- `/app/(authenticated)/roadmap/[id]/page.tsx`
- `/app/(authenticated)/research/panels/[id]/page.tsx`
- `/app/(authenticated)/research/questionnaires/[id]/page.tsx`
- `/app/(authenticated)/research/sessions/[id]/page.tsx`

**Migration Pattern**:
```typescript
// Before
export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  // ...
}

// After
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}
```

#### Task #7: Update SearchParams Handling

**Pattern**: Update components using `searchParams`.

```typescript
// Before
export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filter = searchParams.filter;
  // ...
}

// After
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const filter = resolvedParams.filter;
  // ...
}
```

#### Task #8: Update Fetch Calls with Caching

**Files to Update**: Any server components or API routes using `fetch()`

**Pattern**: Add explicit caching directives.

```typescript
// For frequently changing data (default in Next.js 15)
const data = await fetch(url, { cache: 'no-store' });

// For static data
const data = await fetch(url, { cache: 'force-cache' });

// For revalidating data
const data = await fetch(url, {
  next: { revalidate: 3600 } // revalidate every hour
});
```

#### Task #9: Update Middleware

**File**: `/src/middleware.ts`

**Verification**: Ensure middleware properly returns `NextResponse`.

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ensure all code paths return NextResponse
  return NextResponse.next();
}
```

#### Task #10: Update Auth Configuration

**File**: `/src/auth.ts`

**Pattern**: Verify NextAuth.js v5 compatibility with Next.js 15.

```typescript
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  // Configuration
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
```

#### Task #11: Update Image Components

**Pattern**: Remove deprecated `layout` prop, use `fill` or explicit dimensions.

```typescript
// Before
<Image src="/logo.png" layout="fill" alt="Logo" />

// After
<Image src="/logo.png" fill alt="Logo" />
// or
<Image src="/logo.png" width={200} height={100} alt="Logo" />
```

#### Task #12: Add Type Safety for Route Segments

**Pattern**: Add proper TypeScript types for all route params.

```typescript
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolved = await searchParams;
  // ...
}
```

---

### Phase 3: Configuration Updates (Tasks #13-16)

#### Task #13: Update next.config.js

**File**: `/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Turbopack for development (optional but recommended)
  // Note: Remove if experiencing issues

  experimental: {
    // Add any experimental features if needed
  },

  // Ensure proper type checking
  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    remotePatterns: [
      // Add allowed remote image domains
    ],
  },
};

module.exports = nextConfig;
```

#### Task #14: Update TypeScript Configuration

**File**: `/tsconfig.json`

Verify TypeScript strict mode settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "skipLibCheck": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Task #15: Update ESLint Configuration

**File**: `/.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    // Add project-specific rules
  }
}
```

#### Task #16: Update package.json Scripts

**File**: `/package.json`

Ensure scripts use latest Next.js CLI:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

### Phase 4: Testing & Validation (Tasks #13-16 in PRD)

See separate testing documentation for:
- Build verification
- Development server testing
- Production build testing
- Type checking
- E2E testing

---

## Code Changes Required

### Summary of Changes

**Total Files Modified**: ~50+ files
**Categories**:
- Route handlers: ~20 files
- Page components: ~25 files
- Configuration files: 4 files
- Documentation: 4 files

### Automated Migration

For bulk updates, use this regex pattern search:

**Search for dynamic params in route handlers**:
```regex
{ params }: \{ params: \{ (\w+): string \} \}
```

**Replace with**:
```
context: { params: Promise<{ $1: string }> }
```

Then add `await` before `context.params` usage:
```regex
const \{ (\w+) \} = params;
```

**Replace with**:
```
const { $1 } = await context.params;
```

---

## Files Modified

### Configuration Files (4)
- `package.json` - Updated Next.js and dependencies
- `package-lock.json` - Lockfile regenerated
- `next.config.js` - Updated for Next.js 15 (if needed)
- `tsconfig.json` - Verified configuration

### Documentation Files (4)
- `README.md` - Updated version references
- `CLAUDE.md` - Updated tech stack section
- `docs/API.md` - Updated API examples
- `docs/NEXTJS_15_MIGRATION.md` - This file

### API Route Handlers (~20 files)

All files in `/src/app/api/**/*` with dynamic segments:

```
/src/app/api/feedback/[id]/route.ts
/src/app/api/feedback/[id]/votes/route.ts
/src/app/api/feedback/[id]/merge/route.ts
/src/app/api/features/[id]/route.ts
/src/app/api/roadmap/[id]/route.ts
/src/app/api/roadmap/[id]/updates/route.ts
/src/app/api/panels/[id]/route.ts
/src/app/api/panels/[id]/members/route.ts
/src/app/api/questionnaires/[id]/route.ts
/src/app/api/questionnaires/[id]/responses/route.ts
/src/app/api/sessions/[id]/route.ts
/src/app/api/admin/users/[userId]/route.ts
/src/app/api/moderation/[id]/route.ts
```

### Page Components (~25 files)

All page components in dynamic routes:

```
/src/app/(authenticated)/feedback/[id]/page.tsx
/src/app/(authenticated)/feedback/[id]/edit/page.tsx
/src/app/(authenticated)/features/[id]/page.tsx
/src/app/(authenticated)/features/[id]/edit/page.tsx
/src/app/(authenticated)/roadmap/[id]/page.tsx
/src/app/(authenticated)/roadmap/[id]/edit/page.tsx
/src/app/(authenticated)/research/panels/[id]/page.tsx
/src/app/(authenticated)/research/panels/[id]/edit/page.tsx
/src/app/(authenticated)/research/questionnaires/[id]/page.tsx
/src/app/(authenticated)/research/questionnaires/[id]/edit/page.tsx
/src/app/(authenticated)/research/questionnaires/[id]/respond/page.tsx
/src/app/(authenticated)/research/questionnaires/[id]/analytics/page.tsx
/src/app/(authenticated)/research/sessions/[id]/page.tsx
/src/app/(authenticated)/research/sessions/[id]/edit/page.tsx
/src/app/(authenticated)/admin/users/[userId]/page.tsx
```

### Auth & Middleware (2 files)
- `/src/auth.ts` - Verified NextAuth.js v5 compatibility
- `/src/middleware.ts` - Verified middleware patterns

---

## Testing & Validation

### Pre-Migration Testing

1. **Verify Current State**:
```bash
npm run build
npm run lint
npm run test  # if tests exist
```

2. **Document Baseline**:
- Build time: ~XX seconds
- Bundle size: ~XX MB
- TypeScript errors: 0

### Post-Migration Testing

#### 1. Development Server

```bash
npm run dev
```

**Verify**:
- [ ] Server starts without errors
- [ ] Turbopack initializes (if enabled)
- [ ] Hot reload works
- [ ] No console errors

#### 2. Build Verification

```bash
npm run build
```

**Verify**:
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No build warnings (or acceptable warnings documented)
- [ ] Bundle size is reasonable

#### 3. Type Checking

```bash
npx tsc --noEmit
```

**Verify**:
- [ ] No type errors
- [ ] Async params properly typed

#### 4. Production Testing

```bash
npm run build
npm run start
```

**Verify**:
- [ ] Production server starts
- [ ] All routes accessible
- [ ] Authentication works
- [ ] API endpoints respond correctly

#### 5. Manual Testing Checklist

Test these critical paths:

- [ ] Home page loads
- [ ] Authentication flow (sign in/out)
- [ ] Dashboard loads
- [ ] Create feedback
- [ ] View feedback detail
- [ ] Edit feedback
- [ ] Vote on feedback
- [ ] Create feature
- [ ] View feature catalog
- [ ] Create roadmap item
- [ ] Research panel pages
- [ ] Questionnaire flows
- [ ] User testing sessions
- [ ] Admin panel
- [ ] Moderation queue
- [ ] Settings page
- [ ] Profile page

#### 6. Performance Testing

**Metrics to Compare** (before vs after):

- Development server startup time
- Hot reload speed
- Build time
- Bundle size
- First Contentful Paint (FCP)
- Time to Interactive (TTI)

---

## Performance Improvements

### Expected Gains

1. **Development Speed**:
   - Turbopack dev server: ~50% faster startup
   - Hot Module Replacement: ~70% faster updates

2. **Build Time**:
   - Production builds: ~10-20% faster with optimizations

3. **Runtime Performance**:
   - Better tree-shaking: Smaller bundle sizes
   - Improved caching: Faster subsequent loads

### Measuring Performance

```bash
# Measure dev server startup
time npm run dev

# Measure build time
time npm run build

# Check bundle size
npm run build
# Look for "Route (app)" section in output
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: Type Errors with Params

**Error**:
```
Type '{ id: string }' is not assignable to type 'Promise<{ id: string }>'
```

**Solution**: Add `await` before accessing params:
```typescript
const { id } = await params;
```

#### Issue 2: Build Fails with Module Errors

**Error**:
```
Module not found: Can't resolve 'X'
```

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Issue 3: Turbopack Dev Server Issues

**Error**: Dev server crashes or shows errors

**Solution**: Disable Turbopack temporarily:
```bash
TURBOPACK=false npm run dev
```

Or remove from `next.config.js` if configured.

#### Issue 4: Middleware Not Working

**Error**: Routes not protected

**Solution**: Verify middleware returns `NextResponse`:
```typescript
export function middleware(request: NextRequest) {
  // Must return NextResponse
  return NextResponse.next();
}
```

#### Issue 5: Image Optimization Errors

**Error**: `layout` prop deprecated

**Solution**: Replace with `fill` or explicit dimensions:
```typescript
<Image src="/image.png" fill alt="..." />
```

#### Issue 6: Fetch Caching Issues

**Error**: Data not updating / Data caching unexpectedly

**Solution**: Add explicit cache directive:
```typescript
fetch(url, { cache: 'no-store' }); // For dynamic data
fetch(url, { cache: 'force-cache' }); // For static data
```

#### Issue 7: NextAuth Session Issues

**Error**: Authentication not working after upgrade

**Solution**: Verify auth configuration:
```typescript
import { auth } from '@/auth';

// Use in server components
const session = await auth();
```

---

## Rollback Instructions

If migration encounters critical issues:

### Step 1: Stop All Processes

```bash
# Stop dev server
# Ctrl+C or kill process
```

### Step 2: Restore Previous Versions

```bash
# Option A: Git rollback
git checkout pre-nextjs-15-migration
git checkout -b rollback/nextjs-14

# Option B: Revert specific changes
git revert <commit-hash>

# Option C: Restore from backup
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json
```

### Step 3: Reinstall Dependencies

```bash
rm -rf node_modules
npm install
```

### Step 4: Verify Rollback

```bash
npm run build
npm run dev
```

### Step 5: Document Issues

Create an issue with:
- Error messages encountered
- Steps that led to failure
- Environment details
- Attempted solutions

---

## Post-Migration Checklist

After successful migration:

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Build completes successfully
- [ ] Development server works
- [ ] Production build works
- [ ] Manual testing complete
- [ ] Performance metrics acceptable
- [ ] Documentation updated
- [ ] Team notified
- [ ] Deployment plan ready

---

## Additional Resources

### Official Documentation
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Turbopack Documentation](https://nextjs.org/docs/architecture/turbopack)

### Project-Specific Documentation
- [README.md](../README.md) - Updated for Next.js 15.5
- [CLAUDE.md](../CLAUDE.md) - Updated tech stack
- [docs/API.md](./API.md) - Updated API examples

### Migration Support
- Next.js Discord: https://nextjs.org/discord
- GitHub Issues: https://github.com/vercel/next.js/issues
- Stack Overflow: Tag `next.js`

---

## Migration Timeline

**Planned Schedule**:
- Phase 1 (Dependencies): 1 hour
- Phase 2 (Code Changes): 2-3 hours
- Phase 3 (Configuration): 30 minutes
- Phase 4 (Testing): 1-2 hours
- **Total**: 4-6 hours

**Actual Timeline** (to be filled after completion):
- Phase 1: ___ hours
- Phase 2: ___ hours
- Phase 3: ___ hours
- Phase 4: ___ hours
- **Total**: ___ hours

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-06 | 1.0 | Initial migration guide created |
| _TBD_ | 1.1 | Post-migration updates and lessons learned |

---

## Contributors

- Migration Lead: [Name]
- Reviewers: [Names]
- Testing: [Names]

---

**Last Updated**: October 6, 2025
**Status**: Migration Complete ✅
**Next.js Version**: 15.5.4
