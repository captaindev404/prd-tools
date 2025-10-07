# Deployment Guide

**Gentil Feedback Platform**
Version: 0.5.0

This guide covers deployment options and configurations for the Gentil Feedback platform in production environments.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Deployment Platforms](#deployment-platforms)
6. [Post-Deployment](#post-deployment)
7. [CI/CD](#cicd)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Architecture Overview

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Next.js App   │
                    │   (Vercel/VPS)  │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌─────▼─────┐
    │ PostgreSQL  │   │    Redis    │   │  SendGrid │
    │  Database   │   │  (Optional) │   │   Email   │
    └─────────────┘   └─────────────┘   └───────────┘
```

### Deployment Options

| Platform | Difficulty | Cost | Best For |
|----------|-----------|------|----------|
| **Vercel** | Easy | $$ | Quick deployment, serverless |
| **Netlify** | Easy | $$ | Alternative to Vercel |
| **Railway** | Medium | $$ | Full-stack with database |
| **AWS ECS** | Hard | $$$ | Enterprise, full control |
| **Self-hosted** | Hard | $ | On-premise requirements |

**Recommended**: Vercel for production (easiest, most reliable)

---

## Prerequisites

### Required Services

1. **PostgreSQL Database** (production)
   - Vercel Postgres (recommended)
   - Supabase
   - Railway
   - AWS RDS
   - Self-hosted PostgreSQL 14+

2. **Email Service**
   - SendGrid (recommended)
   - AWS SES
   - Mailgun

3. **Identity Providers**
   - Azure Active Directory (for Club Med employees)
   - Keycloak (alternative SSO)

### Optional Services

4. **Redis** (session storage, recommended for production)
   - Upstash Redis (serverless)
   - Redis Cloud
   - Self-hosted Redis

5. **Monitoring**
   - Sentry (error tracking)
   - Vercel Analytics
   - DataDog or New Relic

---

## Environment Variables

### Required Variables

Create a `.env.production` file with these variables:

```env
# Database (PostgreSQL for production)
DATABASE_URL="postgresql://user:password@host:5432/odyssey_feedback?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="https://feedback.clubmed.com"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# Azure AD Provider
AZURE_AD_CLIENT_ID="your-azure-ad-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-ad-client-secret"
AZURE_AD_TENANT_ID="your-azure-ad-tenant-id"

# Keycloak Provider (if used)
KEYCLOAK_CLIENT_ID="your-keycloak-client-id"
KEYCLOAK_CLIENT_SECRET="your-keycloak-client-secret"
KEYCLOAK_ISSUER="https://keycloak.clubmed.com/realms/clubmed"

# SendGrid Email
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@clubmed.com"
SENDGRID_FROM_NAME="Gentil Feedback"

# App URLs
NEXT_PUBLIC_APP_URL="https://feedback.clubmed.com"
```

### Optional Variables

```env
# Redis (recommended for production)
REDIS_URL="redis://default:password@host:6379"

# HRIS Integration
HRIS_API_URL="https://hris.clubmed.com/api"
HRIS_API_KEY="your-hris-api-key"

# Jira Integration
JIRA_BASE_URL="https://jira.clubmed.com"
JIRA_API_USER="bot@clubmed.com"
JIRA_API_TOKEN="your-jira-token"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# Node Environment
NODE_ENV="production"
```

### Generating Secrets

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Example output: `xK8Qm3n9Lp2Rv4Hw7Gj1Nq5Ts6Yz0Ax=`

---

## Database Setup

### Option 1: Vercel Postgres (Recommended)

1. **Create Database**
   ```bash
   # In Vercel dashboard
   # Go to Storage > Create Database > Postgres
   # Or use Vercel CLI:
   vercel postgres create gentil-feedback-db
   ```

2. **Get Connection String**
   ```bash
   # Copy DATABASE_URL from Vercel dashboard
   # Format: postgres://user:pass@host/db?sslmode=require
   ```

3. **Add to Environment**
   - In Vercel dashboard > Settings > Environment Variables
   - Add `DATABASE_URL` with the connection string

### Option 2: Supabase

1. **Create Project**
   - Go to [Supabase](https://supabase.com)
   - Create new project
   - Note the connection string

2. **Configure Connection**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

3. **Enable Connection Pooling**
   ```env
   # Use Supabase connection pooler for serverless
   DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

### Option 3: Railway

1. **Create Database**
   ```bash
   # In Railway dashboard
   # New > Database > PostgreSQL
   ```

2. **Copy Connection String**
   - Railway provides `DATABASE_URL` automatically
   - Format: `postgresql://postgres:password@host:5432/railway`

### Option 4: AWS RDS

1. **Create PostgreSQL Instance**
   - Go to AWS RDS Console
   - Create database > PostgreSQL
   - Choose instance size (t3.micro for dev, t3.medium+ for production)
   - Enable automated backups
   - Set up security groups

2. **Configure Connection**
   ```env
   DATABASE_URL="postgresql://admin:password@instance.region.rds.amazonaws.com:5432/odyssey"
   ```

### Run Migrations

After setting up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional, for first-time setup)
npx prisma db seed
```

### Verify Database

```bash
# Open Prisma Studio to check tables
npx prisma studio
```

Expected tables:
- User, Village, Feature, Feedback, Vote
- RoadmapItem, Panel, Questionnaire, Session
- Notification, Event, PanelMember, QuestionnaireResponse

---

## Deployment Platforms

### Option 1: Vercel (Recommended)

#### Why Vercel?

- Native Next.js support
- Automatic HTTPS
- Global CDN
- Easy environment management
- Automatic preview deployments
- Built-in analytics

#### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import Project**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

4. **Set Environment Variables**
   - Go to Settings > Environment Variables
   - Add all required variables from `.env.production`
   - Select environment: Production, Preview, Development

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)
   - Get deployment URL: `https://your-project.vercel.app`

6. **Custom Domain** (optional)
   - Go to Settings > Domains
   - Add `feedback.clubmed.com`
   - Configure DNS:
     ```
     Type: CNAME
     Name: feedback
     Value: cname.vercel-dns.com
     ```

#### Vercel CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

### Option 2: Netlify

#### Deploy to Netlify

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create Site**
   - Go to [Netlify](https://netlify.com)
   - "Add new site" > "Import an existing project"
   - Connect to GitHub
   - Select repository

3. **Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Functions directory**: `netlify/functions` (leave empty for Next.js)

4. **Environment Variables**
   - Go to Site settings > Environment variables
   - Add all production variables

5. **Deploy**
   - Click "Deploy site"
   - Get URL: `https://your-site.netlify.app`

---

### Option 3: Railway

#### Why Railway?

- All-in-one: app + database + Redis
- Simple pricing
- Automatic SSL
- Easy GitHub integration

#### Deploy to Railway

1. **Create Account**
   - Go to [Railway](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**
   - "New Project"
   - "Deploy from GitHub repo"
   - Select your repository

3. **Add Database**
   - "New" > "Database" > "PostgreSQL"
   - Railway automatically sets `DATABASE_URL`

4. **Add Redis** (optional)
   - "New" > "Database" > "Redis"
   - Sets `REDIS_URL` automatically

5. **Configure Environment**
   - Click on your app service
   - "Variables" tab
   - Add all required environment variables

6. **Deploy**
   - Railway deploys automatically on push
   - Get URL: `https://your-app.up.railway.app`

---

### Option 4: Self-Hosted (Docker)

#### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/odyssey
      REDIS_URL: redis://redis:6379
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      AZURE_AD_CLIENT_ID: ${AZURE_AD_CLIENT_ID}
      AZURE_AD_CLIENT_SECRET: ${AZURE_AD_CLIENT_SECRET}
      AZURE_AD_TENANT_ID: ${AZURE_AD_TENANT_ID}
    depends_on:
      - db
      - redis

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: odyssey
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Deploy

```bash
# Build and run
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# View logs
docker-compose logs -f app
```

---

## Post-Deployment

### 1. Health Checks

Verify deployment is working:

```bash
# Check app health
curl https://your-app.com/api/health

# Expected response:
# { "status": "ok", "timestamp": "2025-10-02T12:00:00Z" }
```

### 2. Database Verification

```bash
# Connect to production database
npx prisma studio --browser none

# Or check via psql
psql $DATABASE_URL

# Verify tables exist
\dt
```

### 3. Run Initial Seeds

For first-time deployment:

```bash
# Seed villages, features, sample data
npx prisma db seed
```

### 4. Create Admin User

```bash
# Manual method: Update user role in database
# Find user ID after first sign-in
psql $DATABASE_URL

UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@clubmed.com';
```

Or create a seed script:

```typescript
// prisma/seed-admin.ts
import { prisma } from '../src/lib/prisma';

async function main() {
  await prisma.user.update({
    where: { email: 'admin@clubmed.com' },
    data: { role: 'ADMIN' },
  });
}

main();
```

### 5. Test Authentication

1. Go to `https://your-app.com/auth/signin`
2. Sign in with Azure AD or Keycloak
3. Verify redirect to dashboard
4. Check user profile in database

### 6. Test Critical Flows

- Submit feedback
- Vote on feedback
- Create feature (as PM)
- Create roadmap item (as PM)
- View moderation queue (as MODERATOR)

### 7. Configure Monitoring

#### Sentry (Error Tracking)

1. **Install Sentry**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Initialize**
   ```bash
   npx @sentry/wizard -i nextjs
   ```

3. **Configure**
   Add `SENTRY_DSN` to environment variables

4. **Test**
   ```typescript
   // Trigger test error
   Sentry.captureException(new Error('Test error'));
   ```

#### Vercel Analytics

1. Go to Vercel dashboard > Analytics
2. Enable "Audience" and "Web Vitals"
3. View metrics after 24 hours

---

## CI/CD

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: "file:./test.db"

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Preview Deployments

For pull requests:

```yaml
name: Preview Deployment

on:
  pull_request:
    branches:
      - main

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true
```

---

## Monitoring & Maintenance

### Database Backups

#### Vercel Postgres

- Automatic daily backups (last 7 days)
- Point-in-time recovery available

#### Manual Backup

```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20251002.sql
```

#### Automated Backups (Cron)

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/odyssey-$(date +\%Y\%m\%d).sql.gz
```

### Log Management

#### Vercel Logs

```bash
# View production logs
vercel logs

# Tail logs
vercel logs --follow

# Filter by function
vercel logs --since 1h
```

#### Self-Hosted Logs

```bash
# Docker logs
docker-compose logs -f app

# Save logs to file
docker-compose logs app > app.log
```

### Performance Monitoring

#### Key Metrics to Track

- **Response Time**: API endpoints < 200ms
- **Database Queries**: < 50ms average
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%

#### Alerts

Set up alerts for:
- Error rate > 1%
- Response time > 500ms
- Database connections > 80%
- Disk usage > 85%

### Security Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Major updates (review breaking changes)
npx npm-check-updates -u
npm install
```

### Database Maintenance

```bash
# Optimize database
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('odyssey'));"

# Monitor slow queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## Troubleshooting

### Build Fails

**Error**: `Prisma generate failed`
```bash
# Solution: Ensure DATABASE_URL is set
export DATABASE_URL="postgresql://..."
npx prisma generate
```

**Error**: `Module not found`
```bash
# Solution: Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Authentication Issues

**Error**: `NEXTAUTH_URL is not set`
```bash
# Solution: Set in environment variables
NEXTAUTH_URL="https://your-app.com"
```

**Error**: `Azure AD redirect URI mismatch`
```
# Solution: Add redirect URI in Azure Portal
Redirect URI: https://your-app.com/api/auth/callback/azure-ad
```

### Database Connection Issues

**Error**: `Can't reach database server`
```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1;"

# Verify SSL requirement
DATABASE_URL="postgresql://...?sslmode=require"
```

**Error**: `Too many connections`
```bash
# Use connection pooling
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=10"
```

### Performance Issues

**Slow API responses**
- Enable Redis for session storage
- Add database indexes
- Optimize database queries
- Use CDN for static assets

**High memory usage**
- Reduce Next.js build cache
- Optimize image sizes
- Limit concurrent database connections

### Monitoring Errors

Check error logs:
```bash
# Vercel
vercel logs --since 1h

# Docker
docker-compose logs app

# Sentry
# Go to Sentry dashboard > Issues
```

---

## Best Practices

### Security

1. **Use HTTPS Only**
   - Enforce SSL/TLS
   - Set `NEXTAUTH_URL` to https://

2. **Secure Environment Variables**
   - Never commit `.env` to Git
   - Use platform secret management
   - Rotate secrets regularly

3. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict IP access
   - Regular backups

4. **Rate Limiting**
   - Already implemented (10 feedback/day per user)
   - Monitor for abuse
   - Adjust limits as needed

### Performance

1. **Enable Caching**
   - Use Redis for sessions
   - Cache API responses
   - CDN for static assets

2. **Optimize Database**
   - Regular VACUUM ANALYZE
   - Monitor slow queries
   - Add indexes for common queries

3. **Monitor Resource Usage**
   - Set up alerts
   - Track trends
   - Scale proactively

### Reliability

1. **Automated Backups**
   - Daily database backups
   - Test restore procedures
   - Off-site backup storage

2. **Error Tracking**
   - Sentry for exceptions
   - Log aggregation
   - Alert on critical errors

3. **Uptime Monitoring**
   - Use UptimeRobot or Pingdom
   - Health check endpoints
   - Status page for users

---

## Rollback Procedure

If deployment fails:

```bash
# Vercel: Rollback to previous deployment
vercel rollback

# Docker: Use previous image
docker-compose down
docker-compose up -d --build

# Database: Restore from backup
psql $DATABASE_URL < backup-previous.sql
```

---

## Support

For deployment issues:
- **Vercel**: [Vercel Support](https://vercel.com/support)
- **Database**: Check provider documentation
- **Platform Issues**: Create GitHub issue
- **Security Concerns**: Contact Security team immediately

---

**Last Updated**: 2025-10-02
**Version**: 0.5.0

Good luck with your deployment!
