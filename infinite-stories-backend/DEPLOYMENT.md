# Deployment Guide

## Prerequisites

- Vercel account
- PostgreSQL database (Vercel Postgres, Supabase, or other)
- Cloudflare R2 bucket
- Clerk application
- OpenAI API key

## Environment Variables

Configure these in Vercel dashboard or `.env.local`:

```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
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

## Clerk Webhook Setup

1. Go to Clerk Dashboard > Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

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
- Check Clerk webhook signature
- Verify OpenAI API key permissions

### File upload issues
- Verify R2 credentials
- Check bucket permissions
- Verify public URL configuration
