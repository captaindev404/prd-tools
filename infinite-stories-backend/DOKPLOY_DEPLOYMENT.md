# Dokploy Deployment Guide

This guide explains how to deploy the InfiniteStories backend to production using dokploy.

## Prerequisites

- Dokploy instance running
- PostgreSQL database (RDS, Dokploy managed, or external)
- Environment variables configured
- Docker image repository (Docker Hub, GitHub Container Registry, or Dokploy's built-in registry)

## Environment Variables

Before deploying, set up the following environment variables in your dokploy application:

### Required Variables

**Database:**
```env
DATABASE_URL=postgresql://user:password@host:5432/infinite_stories?schema=public
```

**Authentication (Better Auth):**
```env
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=https://your-api-domain.com
```

**OpenAI:**
```env
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-... # Optional
```

**Redis (Upstash):**
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

**Cloudflare R2 (File Storage):**
```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=infinite-stories
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
```

**Application:**
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-api-domain.com
ENABLE_RATE_LIMITING=true
ENABLE_CONTENT_FILTERING=true
```

**Rate Limiting (optional):**
```env
RATE_LIMIT_STORY_GENERATION=5
RATE_LIMIT_AUDIO_GENERATION=10
RATE_LIMIT_AVATAR_GENERATION=3
RATE_LIMIT_ILLUSTRATION_GENERATION=20
```

## Deployment Steps

### Option 1: Build and Deploy with Docker

1. **Push code to your repository:**
   ```bash
   git push origin feat/api-backend
   ```

2. **In Dokploy:**
   - Go to Applications → Create New Application
   - Select "Docker" as the deployment type
   - Choose your Git repository
   - Set the Docker context path to `infinite-stories-backend/`
   - Set the Dockerfile path to `infinite-stories-backend/Dockerfile`

3. **Configure the application:**
   - Set the port to `3000`
   - Add all environment variables from the "Environment Variables" section above
   - Disable auto-deploy or configure webhook for automatic updates

4. **Deploy:**
   - Click "Deploy"
   - Monitor logs in the Dokploy dashboard

### Option 2: Build Locally and Push Image

1. **Build the Docker image:**
   ```bash
   cd infinite-stories-backend
   docker build -t your-registry/infinite-stories-backend:latest .
   ```

2. **Push to your registry:**
   ```bash
   docker push your-registry/infinite-stories-backend:latest
   ```

3. **In Dokploy:**
   - Create application from existing image
   - Specify the image: `your-registry/infinite-stories-backend:latest`
   - Add environment variables
   - Deploy

## Post-Deployment

### Database Migrations

After the first deployment, run database migrations:

```bash
# Option 1: SSH into the running container
dokploy exec <app-id> npx prisma migrate deploy

# Option 2: Add this to a pre-deployment script in dokploy
# Environment: DATABASE_URL must be set
npx prisma migrate deploy
```

### Health Check

The Dockerfile includes a health check endpoint at `/api/health`. You can verify deployment:

```bash
curl https://your-api-domain.com/api/health
```

Expected response:
```json
{ "status": "ok" }
```

### Monitoring

1. **View logs:**
   - Dokploy dashboard → Application → Logs
   - Monitor for errors in the first few minutes

2. **Check the application:**
   ```bash
   curl https://your-api-domain.com/api/auth/session
   ```

## Scaling & Performance

### Memory & CPU

Recommended settings for dokploy:
- **CPU**: 0.5-2 cores (start with 0.5, increase if needed)
- **Memory**: 512MB-2GB (start with 512MB, monitor usage)
- **Port**: 3000 (built-in to the application)

### Auto-scaling

If using Dokploy's auto-scaling feature:
- Set minimum replicas: 2
- Set maximum replicas: 5
- Target CPU utilization: 70%

## Troubleshooting

### Application fails to start

1. Check environment variables are all set correctly
2. Verify DATABASE_URL connection string
3. Check logs: `dokploy logs <app-id>`

### Health check fails

1. Ensure `/api/health` endpoint exists
2. Check if the application is actually listening on port 3000
3. Verify no networking issues between dokploy and the application

### Database migration errors

1. Ensure the PostgreSQL database is running and accessible
2. Check DATABASE_URL is correct
3. Run migrations manually:
   ```bash
   npx prisma migrate deploy
   ```

### High memory usage

1. Check if Node.js processes are accumulating
2. Enable garbage collection monitoring
3. Consider increasing memory limits
4. Check for memory leaks in the application logs

## Docker Image Details

- **Base Image**: `node:22.21.1-alpine` (lightweight, secure)
- **Size**: Approximately 200-300MB (final image)
- **Non-root User**: `nextjs` (UID 1001) for security
- **Health Check**: Built-in, runs every 30 seconds
- **Signal Handling**: Uses `dumb-init` for proper signal propagation

## Rollback

To rollback to a previous version in dokploy:

1. Go to Applications → Deployments
2. Click on a previous successful deployment
3. Select "Redeploy"
4. Confirm the rollback

## Continuous Deployment

To enable automatic deployments on git push:

1. In Dokploy: Settings → Webhooks
2. Configure webhook from your Git provider (GitHub, GitLab, etc.)
3. Set the branch to deploy from (e.g., `main`)
4. Each push to that branch will trigger a new deployment

## Security Considerations

- ✅ Non-root user for container execution
- ✅ Minimal alpine image for reduced attack surface
- ✅ Environment variables injected at runtime (not baked into image)
- ✅ No secrets in .dockerignore or version control
- ✅ Health check to ensure container is serving traffic
- ✅ Read-only file system recommended (optional dokploy setting)

## Next Steps

1. Create a PostgreSQL database (if not already done)
2. Set up Upstash Redis instance for rate limiting
3. Create Cloudflare R2 bucket for file storage
4. Configure OpenAI API access
5. Deploy using dokploy
6. Test the API endpoints
7. Monitor logs and metrics
