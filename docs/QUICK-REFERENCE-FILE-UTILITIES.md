# File Attachment Utilities - Quick Reference

## Table of Contents
1. [File Cleanup](#file-cleanup)
2. [Rate Limiting](#rate-limiting)
3. [Feature Flags](#feature-flags)
4. [Attachment Indicator](#attachment-indicator)
5. [Cascade Delete](#cascade-delete)

---

## File Cleanup

### Import
```typescript
import { cleanupOrphanedFiles, formatBytes, logCleanupResult } from '@/lib/file-cleanup';
```

### Usage
```typescript
// Basic cleanup (24 hours)
const result = await cleanupOrphanedFiles();

// Custom age threshold
const result = await cleanupOrphanedFiles({ maxAgeHours: 1 });

// Dry run (preview)
const result = await cleanupOrphanedFiles({ dryRun: true });

// Verbose logging
const result = await cleanupOrphanedFiles({ verbose: true });
```

### API Endpoint
```bash
GET /api/admin/cleanup-files?maxAgeHours=24&dryRun=false
```

### Response
```typescript
interface CleanupResult {
  success: boolean;
  filesScanned: number;
  filesDeleted: number;
  totalBytesFreed: number;
  errors: Array<{ file: string; error: string }>;
  deletedFiles: string[];
  duration: number;
}
```

---

## Rate Limiting

### Import
```typescript
import {
  checkUploadRateLimit,
  incrementUploadRateLimit,
  getRateLimitHeaders,
  logRateLimitViolation
} from '@/lib/rate-limit';
```

### Usage
```typescript
// Check rate limit
const result = checkUploadRateLimit(userId);

if (result.isExceeded) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    {
      status: 429,
      headers: getRateLimitHeaders(result)
    }
  );
}

// Process request...

// Increment counter
incrementUploadRateLimit(userId);
```

### Rate Limits
- **Feedback**: 10 per day per user
- **Uploads**: 10 per minute per user

### Response Headers
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1704758400
```

### Result Type
```typescript
interface RateLimitResult {
  isExceeded: boolean;
  count: number;
  limit: number;
  resetAt: Date;
  remaining: number;
}
```

---

## Feature Flags

### Import
```typescript
import {
  isFeatureEnabled,
  requireFeature,
  withFeatureFlag,
  getFeatureFlagSummary
} from '@/lib/feature-flags';
```

### Available Flags
```typescript
'ENABLE_ATTACHMENTS'          // File uploads
'ENABLE_IMAGE_COMPRESSION'    // Image optimization
'ENABLE_VIRUS_SCAN'           // Virus scanning
'ENABLE_DUPLICATE_DETECTION'  // Duplicate detection
'ENABLE_EMAIL_NOTIFICATIONS'  // Email notifications
'ENABLE_RESEARCH_PANELS'      // Research features
'ENABLE_MODERATION'           // Content moderation
'ENABLE_ANALYTICS'            // Analytics tracking
```

### Usage in Components
```tsx
import { isFeatureEnabled } from '@/lib/feature-flags';

export function MyComponent() {
  return (
    <>
      {/* Always visible */}
      <StandardFeature />

      {/* Conditional */}
      {isFeatureEnabled('ENABLE_ATTACHMENTS') && (
        <FileUploadFeature />
      )}
    </>
  );
}
```

### Usage in API Routes
```typescript
import { withFeatureFlag } from '@/lib/feature-flags';

export const POST = withFeatureFlag(
  'ENABLE_ATTACHMENTS',
  async (request) => {
    // Handler only runs if flag enabled
    // Returns 403 if disabled
  }
);
```

### Require Feature
```typescript
import { requireFeature } from '@/lib/feature-flags';

async function uploadFile(file: File) {
  requireFeature('ENABLE_ATTACHMENTS', 'Uploads disabled');
  // Throws error if feature disabled

  // Process upload...
}
```

### Environment Variables
```bash
# .env
ENABLE_ATTACHMENTS=true
ENABLE_MODERATION=true
# ... etc
```

---

## Attachment Indicator

### Component
Automatically displays in `FeedbackCard` component when attachments exist.

### Visual
```
[Vote: ⬆ 23]    📎 3
```

### Implementation
```tsx
{feedback.attachments && feedback.attachments.length > 0 && (
  <div className="flex items-center gap-1.5 text-muted-foreground"
       title={`${feedback.attachments.length} attachments`}>
    <Paperclip className="h-3.5 w-3.5" />
    <span className="text-xs">{feedback.attachments.length}</span>
  </div>
)}
```

### Type
```typescript
interface FeedbackListItem {
  // ... other fields
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  originalName: string;
  storedName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}
```

---

## Cascade Delete

### Endpoint
```bash
DELETE /api/feedback/[id]
```

### Authorization
- Author within 15-minute edit window, OR
- ADMIN role

### What Gets Deleted
1. Feedback record (database)
2. All attachment files (filesystem)
3. Votes (database cascade)
4. Event log created

### Usage
```bash
# As author
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/feedback/fb_01HQWER123"

# As admin
curl -X DELETE \
  -H "Authorization: Bearer <admin-token>" \
  "http://localhost:3000/api/feedback/fb_01HQWER123"
```

### Response
```json
{
  "success": true,
  "message": "Feedback deleted successfully",
  "data": {
    "id": "fb_01HQWER123",
    "attachmentsDeleted": 3,
    "attachmentsFailed": 0
  }
}
```

---

## Common Patterns

### Check Feature + Rate Limit
```typescript
// In API route
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  // 1. Check feature flag
  if (!isFeatureEnabled('ENABLE_ATTACHMENTS')) {
    return NextResponse.json(
      { error: 'Feature disabled' },
      { status: 403 }
    );
  }

  // 2. Check rate limit
  const rateLimitResult = checkUploadRateLimit(user.id);
  if (rateLimitResult.isExceeded) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult)
      }
    );
  }

  // 3. Process request
  // ...

  // 4. Increment rate limit
  incrementUploadRateLimit(user.id);

  return NextResponse.json({ success: true });
}
```

### Scheduled Cleanup
```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/admin/cleanup-files?maxAgeHours=24",
      "schedule": "0 */6 * * *"  // Every 6 hours
    }
  ]
}
```

### Feature Flag Wrapper Component
```tsx
interface FeatureGateProps {
  flag: FeatureFlagKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

function FeatureGate({ flag, fallback, children }: FeatureGateProps) {
  if (!isFeatureEnabled(flag)) {
    return fallback || null;
  }
  return <>{children}</>;
}

// Usage
<FeatureGate flag="ENABLE_ATTACHMENTS">
  <FileUpload />
</FeatureGate>
```

---

## Error Handling

### Rate Limit Exceeded
```typescript
{
  "error": "Rate limit exceeded",
  "message": "Too many uploads. Try again in 1 minute.",
  "statusCode": 429
}
```

### Feature Disabled
```typescript
{
  "error": "Feature disabled",
  "message": "The feature ENABLE_ATTACHMENTS is currently disabled",
  "statusCode": 403
}
```

### Cleanup Errors
```typescript
{
  "success": false,
  "errors": [
    {
      "file": "file.jpg",
      "error": "Permission denied"
    }
  ]
}
```

---

## Testing

### Run Tests
```bash
# All tests
npm test

# Specific test file
npm test file-cleanup.test.ts
npm test rate-limit.test.ts
npm test feature-flags.test.ts

# With coverage
npm test -- --coverage
```

### Example Test
```typescript
import { checkUploadRateLimit, incrementUploadRateLimit } from '@/lib/rate-limit';

it('should block after limit exceeded', () => {
  const userId = 'test-user';

  // Simulate 10 uploads
  for (let i = 0; i < 10; i++) {
    incrementUploadRateLimit(userId);
  }

  const result = checkUploadRateLimit(userId);
  expect(result.isExceeded).toBe(true);
  expect(result.remaining).toBe(0);
});
```

---

## Monitoring

### Cleanup Metrics
```typescript
const result = await cleanupOrphanedFiles();
console.log({
  filesDeleted: result.filesDeleted,
  bytesFreed: result.totalBytesFreed,
  duration: result.duration,
  errors: result.errors.length,
});
```

### Rate Limit Violations
```typescript
logRateLimitViolation(userId, 'upload', count, limit);
// Logs: [RATE_LIMIT_VIOLATION] 2025-01-09T... - User usr_123 exceeded upload rate limit: 11/10
```

### Feature Flag Status
```typescript
const summary = getFeatureFlagSummary();
console.log({
  total: summary.total,
  enabled: summary.enabled,
  disabled: summary.disabled,
});
```

---

## Troubleshooting

### Files Not Being Deleted
1. Check directory permissions
2. Verify `TEMP_UPLOAD_PATH` exists
3. Check `maxAgeHours` setting
4. Run with `verbose: true` for detailed logs

### Rate Limit Not Working
1. Verify user ID is consistent
2. Check time/clock skew
3. Consider migrating to Redis for distributed systems

### Feature Flag Not Taking Effect
1. Verify environment variable is set
2. Restart application after changing `.env`
3. Check for typos in flag name
4. Verify value is exactly `"true"` (string)

---

## Production Checklist

- [ ] Set up scheduled cleanup (cron job)
- [ ] Configure feature flags in `.env`
- [ ] Integrate rate limiting in upload API
- [ ] Set up monitoring/alerting
- [ ] Consider Redis for rate limiting
- [ ] Test cascade delete thoroughly
- [ ] Document enabled features for team

---

**Quick Links**:
- [Full Documentation](./FILE-ATTACHMENT-UTILITIES.md)
- [Completion Report](./tasks/FILE-ATTACHMENT-UTILITIES-COMPLETE.md)
- [PRD-005 Spec](./prd/PRD-005.md)
