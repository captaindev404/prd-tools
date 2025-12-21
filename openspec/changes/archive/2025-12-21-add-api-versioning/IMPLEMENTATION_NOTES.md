# Implementation Notes: API Versioning

## Status: Partially Complete

### ✅ Completed
- Backend routes moved from `/api/*` to `/api/v1/*`
- iOS client updated to use `/api/v1/*` endpoints
- All non-auth endpoints working correctly with v1 prefix

### ⚠️ Known Issue: better-auth Path Compatibility

**Problem:**
The auth endpoints at `/api/v1/auth/*` return 404 errors. better-auth does not support custom path prefixes out of the box.

**Root Cause:**
- better-auth's internal routing expects `/api/auth/*`
- Even though the route handler is at `/app/api/v1/auth/[...all]/route.ts`, better-auth's handler doesn't recognize the `/api/v1` prefix
- The `baseURL` configuration in better-auth is for the full application URL, not for custom API path prefixes

**Verification:**
All other API endpoints work correctly with the v1 prefix:
- `/api/v1/health` - ✓ 200 OK
- `/api/v1/ping` - ✓ 200 OK
- `/api/v1/heroes` - ✓ 401 (routing works, auth required)
- `/api/v1/stories` - ✓ 401 (routing works, auth required)
- `/api/v1/ai-assistant/*` - ✓ 200 OK
- `/api/v1/images/*` - ✓ 401 (routing works, auth required)
- `/api/v1/auth/*` - ✗ 404 (better-auth doesn't recognize path)

## Recommended Solutions

### Option 1: Next.js Rewrite Rule (Recommended)
Add a rewrite rule in `next.config.js` to internally map `/api/v1/auth/*` to `/api/auth/*`:

```javascript
async rewrites() {
  return [
    {
      source: '/api/v1/auth/:path*',
      destination: '/api/auth/:path*',
    },
  ];
}
```

**Pros:**
- Simple configuration change
- Maintains `/api/v1/auth/*` externally
- No changes to better-auth setup

**Cons:**
- Auth endpoints use different internal path than other endpoints

### Option 2: Move Auth Back to `/api/auth/*`
Keep auth at `/api/auth/*` while other routes use `/api/v1/*`:

**Pros:**
- Works immediately with better-auth
- Clear separation of auth vs. data endpoints

**Cons:**
- Mixed versioning (auth not versioned)
- May confuse API consumers

### Option 3: Wait for better-auth Update
Check if better-auth supports custom base paths in newer versions or file a feature request.

## Implementation Status

### Phase 1: Backend ✅
- [x] Created `/api/v1/` directory structure
- [x] Moved all routes to v1 (except auth has issues)
- [x] Verified non-auth routes work

### Phase 2: iOS Client ✅
- [x] Updated `Endpoint.swift` with v1 paths
- [x] Updated `EventPictogramGenerator.swift`
- [x] Updated `CustomEventAIAssistant.swift`

### Phase 3: Testing ⚠️
- [x] Verified non-auth endpoints work with v1
- [ ] Auth flow blocked by better-auth path issue
- [x] Hero operations routing verified (401 responses)
- [x] Story operations routing verified (401 responses)
- [x] AI assistant features working

## Next Steps

1. Choose and implement one of the solutions above for auth endpoints
2. Complete auth flow testing
3. Deploy to production once auth issue is resolved
