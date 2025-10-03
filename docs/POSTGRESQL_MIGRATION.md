# PostgreSQL Migration Guide

This guide provides a comprehensive path for migrating the Odyssey Feedback platform from SQLite to PostgreSQL for production deployment.

## Table of Contents

1. [Why PostgreSQL?](#why-postgresql)
2. [Prerequisites](#prerequisites)
3. [Migration Steps](#migration-steps)
4. [Testing the Migration](#testing-the-migration)
5. [Rollback Strategy](#rollback-strategy)
6. [Production Deployment](#production-deployment)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)

## Why PostgreSQL?

PostgreSQL offers significant advantages for production deployments:

- **Concurrency**: Better handling of concurrent writes and reads
- **Scalability**: Handles larger datasets more efficiently
- **Features**: Advanced indexing (GiST, GIN), full-text search, JSON operations
- **Reliability**: ACID compliance with robust transaction management
- **Performance**: Query optimizer and execution planner for complex queries
- **Ecosystem**: Rich tooling for monitoring, backups, and replication

SQLite is excellent for development but has limitations:

- Single writer at a time (lock contention issues)
- No built-in replication or clustering
- Limited concurrent connection handling
- File-based storage not ideal for distributed systems

## Prerequisites

Before starting the migration, ensure you have:

- [x] PostgreSQL 14+ installed (locally and on production server)
- [x] Database backup tools (`pg_dump`, `pg_restore`)
- [x] Admin access to production database
- [x] Downtime window scheduled (recommended: 1-2 hours)
- [x] Rollback plan documented and tested

### Required Tools

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16

# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Install PostgreSQL (Docker - recommended for local testing)
docker run --name odyssey-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=odyssey_feedback \
  -p 5432:5432 \
  -d postgres:16
```

## Migration Steps

### Step 1: Export SQLite Data

First, create a backup of your current SQLite database:

```bash
# Create backups directory
mkdir -p backups

# Copy SQLite database
cp prisma/dev.db backups/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Export schema
sqlite3 prisma/dev.db .schema > backups/sqlite_schema.sql

# Export data as SQL dumps (if needed)
sqlite3 prisma/dev.db .dump > backups/sqlite_dump.sql
```

### Step 2: Set Up PostgreSQL (Local)

Create a local PostgreSQL database for testing:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE odyssey_feedback;
CREATE USER odyssey_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE odyssey_feedback TO odyssey_user;

# For PostgreSQL 15+, also grant schema privileges
\c odyssey_feedback
GRANT ALL ON SCHEMA public TO odyssey_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO odyssey_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO odyssey_user;

# Exit psql
\q
```

### Step 3: Update Prisma Schema

Update `prisma/schema.prisma` to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

**Important Changes for PostgreSQL:**

1. **Text Search**: SQLite uses `contains` with mode `insensitive`, PostgreSQL natively supports case-insensitive search
2. **JSON Fields**: PostgreSQL has native JSON support vs string storage
3. **Index Types**: PostgreSQL supports more advanced index types

Optional: Add PostgreSQL-specific optimizations:

```prisma
model Feedback {
  // ... existing fields ...

  // Add full-text search index (PostgreSQL-specific)
  @@index([title, body], type: Gin)  // For full-text search
}
```

### Step 4: Update Environment Variables

Create separate environment configurations:

**`.env.local` (SQLite - development):**
```env
DATABASE_URL="file:./dev.db"
```

**`.env.postgres` (PostgreSQL - testing):**
```env
DATABASE_URL="postgresql://odyssey_user:your_secure_password@localhost:5432/odyssey_feedback?schema=public"
```

**`.env.production` (PostgreSQL - production):**
```env
DATABASE_URL="postgresql://user:password@your-production-host:5432/odyssey_feedback?schema=public&sslmode=require"
```

### Step 5: Run Prisma Migrations

Generate and apply migrations for PostgreSQL:

```bash
# Use PostgreSQL connection string
export DATABASE_URL="postgresql://odyssey_user:your_secure_password@localhost:5432/odyssey_feedback?schema=public"

# Generate Prisma Client for PostgreSQL
npx prisma generate

# Create initial migration (this will create the schema from scratch)
npx prisma migrate deploy

# Or reset the database and apply all migrations
npx prisma migrate reset --skip-seed

# Verify the schema
npx prisma db pull
```

### Step 6: Migrate Data

**Option A: Using Prisma (Recommended for small datasets)**

Create a migration script `scripts/migrate-sqlite-to-postgres.ts`:

```typescript
import { PrismaClient as SQLitePrisma } from '@prisma/client';
import { PrismaClient as PostgresPrisma } from '@prisma/client';

// SQLite connection
const sqlite = new SQLitePrisma({
  datasources: {
    db: {
      url: 'file:./dev.db',
    },
  },
});

// PostgreSQL connection
const postgres = new PostgresPrisma({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL!,
    },
  },
});

async function migrate() {
  console.log('Starting migration...');

  try {
    // Migrate Villages
    console.log('Migrating villages...');
    const villages = await sqlite.village.findMany();
    for (const village of villages) {
      await postgres.village.upsert({
        where: { id: village.id },
        update: village,
        create: village,
      });
    }
    console.log(`Migrated ${villages.length} villages`);

    // Migrate Users
    console.log('Migrating users...');
    const users = await sqlite.user.findMany();
    for (const user of users) {
      await postgres.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log(`Migrated ${users.length} users`);

    // Migrate Features
    console.log('Migrating features...');
    const features = await sqlite.feature.findMany();
    for (const feature of features) {
      await postgres.feature.upsert({
        where: { id: feature.id },
        update: feature,
        create: feature,
      });
    }
    console.log(`Migrated ${features.length} features`);

    // Migrate Feedback
    console.log('Migrating feedback...');
    const feedbacks = await sqlite.feedback.findMany();
    for (const feedback of feedbacks) {
      await postgres.feedback.upsert({
        where: { id: feedback.id },
        update: feedback,
        create: feedback,
      });
    }
    console.log(`Migrated ${feedbacks.length} feedback items`);

    // Migrate Votes
    console.log('Migrating votes...');
    const votes = await sqlite.vote.findMany();
    for (const vote of votes) {
      await postgres.vote.upsert({
        where: { id: vote.id },
        update: vote,
        create: vote,
      });
    }
    console.log(`Migrated ${votes.length} votes`);

    // Continue with other tables...
    // RoadmapItems, Panels, Questionnaires, Sessions, Events, Notifications, etc.

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

migrate()
  .catch(console.error)
  .finally(() => process.exit());
```

Run the migration:

```bash
# Set PostgreSQL connection
export POSTGRES_URL="postgresql://odyssey_user:your_secure_password@localhost:5432/odyssey_feedback"

# Run migration script
npx tsx scripts/migrate-sqlite-to-postgres.ts
```

**Option B: Using pgloader (For larger datasets)**

Install pgloader:

```bash
# macOS
brew install pgloader

# Ubuntu/Debian
sudo apt-get install pgloader
```

Create migration config `migration.load`:

```
LOAD DATABASE
  FROM sqlite:///path/to/prisma/dev.db
  INTO postgresql://odyssey_user:password@localhost/odyssey_feedback

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '256MB', maintenance_work_mem to '512MB'

CAST type datetime to timestamptz drop default drop not null using zero-dates-to-null;
```

Run pgloader:

```bash
pgloader migration.load
```

### Step 7: Verify Data Integrity

After migration, verify data integrity:

```bash
# Connect to PostgreSQL
psql -U odyssey_user -d odyssey_feedback

# Check record counts
SELECT 'Villages' as table_name, COUNT(*) FROM "Village"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'Features', COUNT(*) FROM "Feature"
UNION ALL
SELECT 'Feedback', COUNT(*) FROM "Feedback"
UNION ALL
SELECT 'Votes', COUNT(*) FROM "Vote"
UNION ALL
SELECT 'RoadmapItems', COUNT(*) FROM "RoadmapItem"
UNION ALL
SELECT 'Panels', COUNT(*) FROM "Panel"
UNION ALL
SELECT 'Questionnaires', COUNT(*) FROM "Questionnaire"
UNION ALL
SELECT 'Sessions', COUNT(*) FROM "Session"
UNION ALL
SELECT 'Events', COUNT(*) FROM "Event"
UNION ALL
SELECT 'Notifications', COUNT(*) FROM "Notification";

# Verify foreign key relationships
SELECT table_name, constraint_name
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';

# Check for any NULL values in required fields
SELECT 'User' as table_name, COUNT(*) as null_emails
FROM "User" WHERE email IS NULL;
```

## Testing the Migration

### Local Testing

1. **Start PostgreSQL locally**
2. **Run migrations**: `npx prisma migrate deploy`
3. **Seed database**: `npm run db:seed`
4. **Start development server**: `npm run dev`
5. **Test all features**:
   - Create feedback
   - Vote on feedback
   - Create roadmap items
   - Run questionnaires
   - Check analytics

### Integration Tests

Run your test suite against PostgreSQL:

```bash
# Use PostgreSQL for tests
export DATABASE_URL="postgresql://odyssey_user:test_password@localhost:5432/odyssey_feedback_test"

# Run tests
npm run test
npm run test:e2e
```

### Load Testing

Test performance under load:

```bash
# Install k6 (load testing tool)
brew install k6  # macOS

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  let response = http.get('http://localhost:3000/api/feedback');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
EOF

# Run load test
k6 run load-test.js
```

## Rollback Strategy

### Scenario 1: Migration Fails During Data Transfer

If the migration fails before completion:

1. **Stop the migration script**
2. **Keep SQLite database intact**
3. **Drop PostgreSQL database and recreate**:
   ```bash
   psql -U postgres
   DROP DATABASE odyssey_feedback;
   CREATE DATABASE odyssey_feedback;
   ```
4. **Fix issues and retry migration**

### Scenario 2: Issues Found After Migration

If issues are discovered after switching to PostgreSQL:

1. **Switch back to SQLite**:
   ```bash
   # Update .env
   DATABASE_URL="file:./dev.db"

   # Restart application
   npm run build
   npm run start
   ```

2. **Investigate PostgreSQL issues**:
   - Check application logs
   - Review PostgreSQL logs: `/var/log/postgresql/`
   - Verify connection pooling settings

3. **Fix and re-migrate**

### Scenario 3: Data Loss or Corruption

Emergency recovery procedure:

1. **Restore from SQLite backup**:
   ```bash
   cp backups/dev.db.backup.TIMESTAMP prisma/dev.db
   ```

2. **Verify backup integrity**:
   ```bash
   sqlite3 prisma/dev.db "PRAGMA integrity_check;"
   ```

3. **Switch application back to SQLite**

4. **Conduct post-mortem and fix issues**

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing on PostgreSQL
- [ ] Load testing completed successfully
- [ ] Database backups configured and tested
- [ ] Connection pooling configured (PgBouncer or Prisma connection pooling)
- [ ] Monitoring and alerting set up (CloudWatch, Datadog, etc.)
- [ ] SSL/TLS enabled for database connections
- [ ] Database credentials secured (AWS Secrets Manager, Vault, etc.)
- [ ] Rollback plan documented and communicated
- [ ] Maintenance window scheduled and users notified

### Deployment Steps

1. **Enable maintenance mode**
   - Display maintenance page to users
   - Stop background workers

2. **Create final SQLite backup**
   ```bash
   sqlite3 prisma/dev.db .dump > final_backup_before_postgres.sql
   ```

3. **Deploy PostgreSQL database**
   - Provision PostgreSQL instance (AWS RDS, Google Cloud SQL, etc.)
   - Configure security groups and network access
   - Enable automated backups

4. **Run migration**
   ```bash
   export DATABASE_URL="postgresql://user:password@prod-host:5432/odyssey_feedback?sslmode=require"
   npx prisma migrate deploy
   npx tsx scripts/migrate-sqlite-to-postgres.ts
   ```

5. **Verify data integrity**
   - Run verification queries
   - Check record counts match source database

6. **Update application configuration**
   - Deploy new environment variables
   - Restart application servers

7. **Smoke testing**
   - Test critical user flows
   - Verify API responses
   - Check background jobs

8. **Disable maintenance mode**
   - Enable user access
   - Monitor logs and metrics closely

9. **Post-deployment monitoring** (24-48 hours)
   - Watch error rates
   - Monitor query performance
   - Track database metrics (CPU, memory, connections)

## Performance Optimization

### Connection Pooling

Configure Prisma connection pooling in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pooling settings
  connectionLimit = 20
  poolTimeout = 30
}
```

Or use PgBouncer for advanced connection pooling:

```ini
# pgbouncer.ini
[databases]
odyssey_feedback = host=localhost port=5432 dbname=odyssey_feedback

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

### Query Optimization

Add PostgreSQL-specific indexes:

```sql
-- Full-text search on feedback
CREATE INDEX idx_feedback_fulltext ON "Feedback"
USING GIN (to_tsvector('english', title || ' ' || body));

-- Partial index for active feedback
CREATE INDEX idx_feedback_active ON "Feedback" (state, "createdAt")
WHERE state NOT IN ('closed', 'merged');

-- Index for vote aggregation
CREATE INDEX idx_vote_weight ON "Vote" (feedbackId, decayedWeight);
```

### Vacuum and Analyze

Schedule regular maintenance:

```bash
# Add to cron
0 2 * * * psql -U odyssey_user -d odyssey_feedback -c "VACUUM ANALYZE;"
```

### Monitor Query Performance

Enable query logging:

```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1 second
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();
```

## Troubleshooting

### Common Issues

#### Issue 1: Connection Pool Exhausted

**Symptoms**: "Too many connections" error

**Solution**:
```typescript
// Increase connection pool in Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error'],
});

// Or use PgBouncer
```

#### Issue 2: Slow Queries

**Symptoms**: API timeouts, slow page loads

**Solution**:
```sql
-- Identify slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing indexes
EXPLAIN ANALYZE SELECT * FROM "Feedback" WHERE state = 'new';
```

#### Issue 3: Encoding Issues

**Symptoms**: Special characters display incorrectly

**Solution**:
```sql
-- Verify database encoding
SHOW SERVER_ENCODING;  -- Should be UTF8

-- Set client encoding
SET CLIENT_ENCODING TO 'UTF8';
```

#### Issue 4: JSON Field Queries

**Symptoms**: JSON queries fail or return unexpected results

**Solution**:
```typescript
// SQLite stores JSON as strings, PostgreSQL as native JSON
// Update queries to use JSON operators

// Before (SQLite)
where: {
  consents: { contains: 'research_contact' }
}

// After (PostgreSQL)
where: {
  consents: { path: '$', array_contains: 'research_contact' }
}
```

## Additional Resources

- [Prisma PostgreSQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [AWS RDS PostgreSQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

## Support

For migration assistance:

- **Technical Lead**: Contact via project Slack channel
- **Database Team**: DBA team for production database provisioning
- **DevOps**: For infrastructure and deployment support

---

**Document Version**: 1.0
**Last Updated**: 2025-10-02
**Maintained By**: Odyssey Feedback Platform Team
