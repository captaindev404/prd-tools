# Proposal: Add API Versioning

## Summary
Add version prefixes to all API routes. All current routes will be prefixed with `/v1/` to establish a versioning pattern for future API evolution.

## Motivation
- **Future-proofing**: Enable breaking API changes in future versions without disrupting existing clients
- **Backward compatibility**: Older app versions can continue using their known API version
- **Clear deprecation path**: Provides a structured way to deprecate old API versions
- **Industry standard**: Follows RESTful API best practices

## Scope

### Backend (Next.js)
Move all API routes from `/api/*` to `/api/v1/*`:

| Current Route | New Route |
|--------------|-----------|
| `/api/auth/*` | `/api/v1/auth/*` |
| `/api/heroes/*` | `/api/v1/heroes/*` |
| `/api/stories/*` | `/api/v1/stories/*` |
| `/api/images/*` | `/api/v1/images/*` |
| `/api/audio/*` | `/api/v1/audio/*` |
| `/api/ai-assistant/*` | `/api/v1/ai-assistant/*` |
| `/api/user/*` | `/api/v1/user/*` |
| `/api/custom-events/*` | `/api/v1/custom-events/*` |
| `/api/health` | `/api/v1/health` |
| `/api/ping` | `/api/v1/ping` |

### iOS Client
Update all endpoint paths in:
- `Network/Endpoint.swift` - Central endpoint definitions
- `Services/EventPictogramGenerator.swift` - Hardcoded URL
- `Services/CustomEventAIAssistant.swift` - Hardcoded URLs
- `Views/Auth/AuthenticationView.swift` - Hardcoded auth URLs

## Out of Scope
- Version negotiation via headers (Accept-Version)
- Multiple concurrent API versions (only v1 for now)
- Automatic version migration

## Success Criteria
- All API routes respond under `/api/v1/*`
- iOS app successfully communicates with versioned endpoints
- Health checks pass on versioned routes
- No breaking changes to request/response formats

## Risks
- **Deployment coordination**: Backend and iOS must be deployed together
- **Hardcoded URLs**: Some URLs are hardcoded in services and need updating

## Related Specs
- `backend-auth` - Authentication endpoints
- `ios-integration` - iOS client integration
