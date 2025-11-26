# R2 Bucket Security Configuration

This document describes how to configure Cloudflare R2 for secure file access in InfiniteStories.

## Overview

All user files (audio, avatars, illustrations) are stored in Cloudflare R2. To ensure users can only access their own files, we use:

1. **Private bucket** - No public access to files
2. **Presigned URLs** - Time-limited access URLs generated per-request
3. **API-level authorization** - Ownership verification before generating signed URLs

## Architecture

```
User Request → API (auth + ownership check) → Generate Signed URL (15min) → Return
                                                    ↓
                               URL expires automatically ✓
```

## Setup Instructions

### 1. Create R2 Bucket (if not exists)

```bash
# Using Wrangler CLI
wrangler r2 bucket create infinite-stories
wrangler r2 bucket create infinite-stories-dev  # For development
```

### 2. Configure Bucket as Private

By default, R2 buckets are private. Ensure you have NOT enabled public access:

1. Go to Cloudflare Dashboard → R2
2. Select your bucket
3. Under "Settings", ensure "Public Access" is **disabled**
4. Do NOT add any public access rules

### 3. Create API Token

Create an R2 API token with read/write access:

1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Click "Create API Token"
3. Select permissions:
   - Object Read
   - Object Write
   - Object Delete (optional, for cleanup)
4. Scope to your bucket(s)
5. Save the Access Key ID and Secret Access Key

### 4. Environment Variables

Add these to your `.env` file:

```bash
# R2 Configuration
R2_ACCOUNT_ID=your_account_id          # From Cloudflare dashboard
R2_ACCESS_KEY_ID=your_access_key       # From API token
R2_SECRET_ACCESS_KEY=your_secret_key   # From API token
R2_BUCKET_NAME=infinite-stories        # Bucket name
R2_PUBLIC_URL=                         # Leave empty for private buckets
```

**Important**: `R2_PUBLIC_URL` should be empty or unset for private buckets. The system will use presigned URLs instead.

### 5. Verify Private Access

Test that direct URLs don't work:

```bash
# This should return 403 Forbidden
curl -I "https://<account_id>.r2.cloudflarestorage.com/<bucket>/audio/test.mp3"
```

## How Signed URLs Work

### URL Generation

When a user requests a file through the API:

```typescript
// 1. User requests story with audio
GET /api/stories/123

// 2. API verifies ownership
if (story.userId !== user.id) {
  return 403 Forbidden;
}

// 3. Generate signed URL
const signedUrl = await generateSignedUrl(story.audioUrl, 15 * 60);
// Valid for 15 minutes

// 4. Return signed URL to client
return { audioUrl: signedUrl };
```

### URL Format

Signed URLs look like:

```
https://<account>.r2.cloudflarestorage.com/<bucket>/audio/user-123/file.mp3
  ?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=...
  &X-Amz-Date=20231124T120000Z
  &X-Amz-Expires=900
  &X-Amz-SignedHeaders=host
  &X-Amz-Signature=...
```

### Expiration

- Default: 15 minutes
- Maximum: 1 hour
- After expiration: Returns 403 Forbidden

## File Organization

Files are organized by user and type:

```
bucket/
├── audio/{userId}/{timestamp}-{filename}.mp3
├── avatar/{userId}/{timestamp}-{filename}.png
└── illustration/{userId}/{timestamp}-{storyId}-{index}.png
```

This structure:
- Groups files by user for easy management
- Includes timestamp for uniqueness
- Enables user data deletion (cascade)

## Security Considerations

### What This Protects Against

1. **URL Guessing**: Even if someone guesses a file path, they can't access it without a valid signature
2. **URL Sharing**: Shared URLs expire after 15 minutes
3. **Enumeration**: Cannot list bucket contents without credentials
4. **Direct Access**: All files require authentication through API

### What This Does NOT Protect Against

1. **Active Sessions**: Users with valid signed URLs can access files for 15 minutes
2. **Screen Capture**: Users can screenshot/record their own content
3. **API Compromise**: If API credentials are leaked, files could be accessed

## Monitoring

### Check for Unauthorized Access

Monitor R2 analytics for:
- High 403 error rates (potential enumeration attempts)
- Unusual access patterns
- Access from unexpected regions

### Audit Trail

All file access goes through API, logged via:
- Request logs (user ID, resource ID, timestamp)
- Rate limiting (prevents bulk download)
- API usage tracking

## Migration Notes

If migrating from public URLs:

1. Update bucket to private
2. Deploy backend with signed URL support
3. URLs in database don't need to change (signing extracts key from URL)
4. Monitor for 403 errors from clients using cached old URLs

## Troubleshooting

### "Could not extract R2 key from URL"

The URL format is not recognized. Check that stored URLs match expected patterns.

### Signed URLs Returning 403

1. Check R2 credentials are valid
2. Verify bucket name is correct
3. Check file exists at expected path
4. Ensure URL hasn't expired

### Performance

Signing URLs adds minimal latency (~1-5ms per URL). For lists with many items, URLs are signed in parallel.
