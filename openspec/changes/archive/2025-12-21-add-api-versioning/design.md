# Design: API Versioning

## Architecture Decision

### Approach: URL Path Versioning
We chose URL path versioning (`/api/v1/...`) over alternatives:

| Approach | Pros | Cons |
|----------|------|------|
| **URL Path** (`/api/v1/`) | Simple, visible, cacheable, easy routing | URLs change between versions |
| Header-based (`Accept-Version`) | Clean URLs | Hidden versioning, harder to debug |
| Query param (`?version=1`) | Flexible | Not RESTful, cache issues |

**Decision**: URL path versioning is the most explicit and maintainable approach for this project's scale.

## Implementation Strategy

### Backend Changes (Next.js File-Based Routing)

Next.js uses the filesystem for routing. To add `/v1/` prefix:

```
app/api/               →  app/api/v1/
├── auth/              →  ├── auth/
├── heroes/            →  ├── heroes/
├── stories/           →  ├── stories/
├── images/            →  ├── images/
├── audio/             →  ├── audio/
├── ai-assistant/      →  ├── ai-assistant/
├── user/              →  ├── user/
├── custom-events/     →  ├── custom-events/
├── health/            →  ├── health/
└── ping/              →  └── ping/
```

This is a simple directory restructure - no code changes to route handlers required.

### iOS Client Changes

#### Centralized Endpoints (`Endpoint.swift`)
Update the `path` computed property to prefix all paths with `/v1/`:

```swift
var path: String {
    switch self {
    case .signIn:
        return "/api/v1/auth/sign-in"  // was /api/auth/sign-in
    // ... etc
    }
}
```

#### Hardcoded URLs
Several services have hardcoded API URLs that must be updated:
- `EventPictogramGenerator.swift` - 1 URL
- `CustomEventAIAssistant.swift` - 4 URLs
- `AuthenticationView.swift` - 2 URLs

**Recommendation**: Consider extracting these to use the centralized `Endpoint` enum in a future refactor.

## Deployment Strategy

### Coordinated Release
Backend and iOS must be deployed together:
1. Deploy backend with new `/api/v1/*` routes
2. Submit iOS app update with updated endpoints
3. Both go live simultaneously

### Rollback Plan
If issues arise:
1. Backend can add redirect middleware: `/api/*` → `/api/v1/*`
2. Or revert both deployments

## Future Considerations

### Adding v2
When breaking changes are needed:
1. Create `app/api/v2/` directory
2. Copy/modify affected routes
3. v1 routes continue to work
4. Deprecate v1 after migration period

### Version Sunset Policy
Recommended policy:
- Announce deprecation 6 months before removal
- Support at least 2 major versions concurrently
- Monitor v1 usage before removal
