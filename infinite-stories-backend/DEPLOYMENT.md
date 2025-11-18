# Deployment Guide

## Prerequisites

- Vercel account
- PostgreSQL database (Vercel Postgres, Supabase, or other)
- Cloudflare R2 bucket
- OpenAI API key

## Environment Variables

Configure these in Vercel dashboard or `.env.local`:

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=... # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=https://your-domain.vercel.app
OPENAI_API_KEY=sk-...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=infinite-stories
R2_PUBLIC_URL=https://...
```

## Database Setup

1. Run Prisma migrations:
```bash
npx prisma migrate deploy
```

2. Generate Prisma client:
```bash
npx prisma generate
```

## Better Auth Setup

Better Auth is self-contained and doesn't require external webhook configuration. Authentication endpoints are automatically available at `/api/auth/*`.

### Available Auth Endpoints

- POST `/api/auth/sign-up/email` - Email/password signup
- POST `/api/auth/sign-in/email` - Email/password login
- POST `/api/auth/sign-out` - Logout
- GET `/api/auth/session` - Get current session

## Deployment

### Vercel

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy:
```bash
vercel --prod
```

### Manual Deployment

1. Build:
```bash
npm run build
```

2. Start:
```bash
npm start
```

## Health Check

Verify deployment:
```bash
curl https://your-domain/api/health
```

## Monitoring

- Enable Vercel Analytics
- Configure Sentry (optional)
- Monitor health endpoint

## Database Migrations

Production migrations:
```bash
DATABASE_URL="production-url" npx prisma migrate deploy
```

## Troubleshooting

### Database connection issues
- Check DATABASE_URL format
- Verify SSL mode if required
- Check connection pooling limits

### API errors
- Verify all environment variables are set
- Check BETTER_AUTH_SECRET is properly configured
- Verify OpenAI API key permissions
- Ensure BETTER_AUTH_URL matches your deployment URL

### File upload issues
- Verify R2 credentials
- Check bucket permissions
- Verify public URL configuration
