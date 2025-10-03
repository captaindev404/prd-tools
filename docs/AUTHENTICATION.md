# Authentication System Documentation

## Overview

The Odyssey Feedback platform uses **NextAuth.js v5** for authentication, providing a secure, scalable, and flexible authentication system that supports multiple identity providers.

## Features

- Multi-provider authentication (Azure AD, Keycloak, Credentials)
- JWT-based sessions for performance
- Global user IDs that persist across village changes
- Automatic user profile synchronization
- Protected routes via middleware
- Role-based access control (RBAC)
- GDPR-compliant user management

## Architecture

### Components

1. **NextAuth Configuration** (`src/lib/auth.ts`)
   - Provider configuration
   - Session callbacks
   - User synchronization logic
   - Event handlers

2. **API Route** (`src/app/api/auth/[...nextauth]/route.ts`)
   - Handles all authentication requests
   - Exposes NextAuth endpoints

3. **Middleware** (`src/middleware.ts`)
   - Protects routes requiring authentication
   - Redirects unauthenticated users

4. **Session Utilities** (`src/lib/session.ts`)
   - Helper functions for server components
   - Type-safe session access
   - Role-based access checks

5. **UI Components**
   - Sign-in page (`src/app/auth/signin/page.tsx`)
   - Error page (`src/app/auth/error/page.tsx`)
   - Unauthorized page (`src/app/unauthorized/page.tsx`)
   - Sign-out button (`src/components/auth/sign-out-button.tsx`)

## Authentication Providers

### Azure AD (Primary)

Used for Club Med employees with Azure AD accounts.

**Environment Variables:**
```bash
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"
```

**Setup:**
1. Register app in Azure Portal
2. Configure redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
3. Add API permissions: `openid`, `profile`, `email`, `User.Read`
4. Generate client secret
5. Add credentials to `.env`

### Keycloak (Alternative SSO)

Alternative SSO provider for flexibility.

**Environment Variables:**
```bash
KEYCLOAK_CLIENT_ID="your-client-id"
KEYCLOAK_CLIENT_SECRET="your-client-secret"
KEYCLOAK_ISSUER="https://your-keycloak-domain/realms/your-realm"
```

**Setup:**
1. Create client in Keycloak admin console
2. Set redirect URI: `http://localhost:3000/api/auth/callback/keycloak`
3. Enable client authentication
4. Configure client scopes
5. Add credentials to `.env`

### Credentials (Development Only)

Simple email/employee ID authentication for development and testing.

**⚠️ WARNING:** Only available in `NODE_ENV=development`

**Usage:**
```tsx
// Automatically available on sign-in page in development mode
// Enter any email and employee ID to create/login as a test user
```

## User Data Model

### Database Schema

```prisma
model User {
  id               String   @id // usr_${ulid}
  employeeId       String   @unique
  email            String   @unique
  displayName      String?
  role             Role     @default(USER)
  currentVillageId String?
  villageHistory   String   @default("[]") // JSON array
  consents         String   @default("[]") // JSON array
  // ... relations
}
```

### Session Data

```typescript
type SessionUser = {
  id: string;
  email: string;
  displayName?: string | null;
  employeeId: string;
  role: Role;
  currentVillageId?: string | null;
};
```

## Usage Examples

### Protecting Server Components

```tsx
import { requireAuth } from "@/lib/session";

export default async function ProtectedPage() {
  const session = await requireAuth();

  return <div>Welcome {session.user.displayName}!</div>;
}
```

### Checking Session in Server Components

```tsx
import { getSession } from "@/lib/session";

export default async function ConditionalPage() {
  const session = await getSession();

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <div>Authenticated content</div>;
}
```

### Role-Based Access Control

```tsx
import { requireRole, requireAnyRole } from "@/lib/session";
import { Role } from "@prisma/client";

// Require specific role
export default async function AdminPage() {
  const session = await requireRole(Role.ADMIN);
  // Only admins can access this page
}

// Require one of multiple roles
export default async function ModeratorPage() {
  const session = await requireAnyRole([Role.ADMIN, Role.MODERATOR]);
  // Admins and moderators can access this page
}
```

### Conditional Rendering Based on Role

```tsx
import { hasRole, hasAnyRole } from "@/lib/session";
import { Role } from "@prisma/client";

export default async function DashboardPage() {
  const canModerate = await hasRole(Role.MODERATOR);
  const canEditRoadmap = await hasAnyRole([Role.PM, Role.PO, Role.ADMIN]);

  return (
    <div>
      {canModerate && <ModerationTools />}
      {canEditRoadmap && <RoadmapEditor />}
      <MainContent />
    </div>
  );
}
```

### Client Component Authentication

```tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <button onClick={() => signIn()}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome {session.user.displayName}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

## Route Protection

### Public Routes

The following routes are accessible without authentication:
- `/` - Landing page
- `/auth/signin` - Sign-in page
- `/auth/signout` - Sign-out page
- `/auth/error` - Error page
- `/unauthorized` - Unauthorized access page

### Protected Routes

All other routes require authentication. Unauthenticated users are redirected to `/auth/signin` with a callback URL.

### Customizing Protected Routes

Edit `src/middleware.ts` to modify route protection:

```typescript
const publicRoutes = [
  "/",
  "/auth/signin",
  "/your-new-public-route",
];

const publicPrefixes = [
  "/api/auth",
  "/public",
];
```

## User Synchronization

### On Sign-In

When a user signs in, the following happens:

1. **Identity Provider Authentication**: User authenticates with Azure AD or Keycloak
2. **Claim Mapping**: IDP claims are mapped to our user model
3. **User Upsert**: User record is created or updated in database
4. **Village History**: If village context changes, history is updated
5. **Event Logging**: Sign-in event is recorded
6. **Session Creation**: JWT token is generated with user data

### Profile Updates

User profile is automatically synced on every sign-in:
- Display name
- Email (if changed)
- Employee ID

### Village Context

Village assignments are tracked in `villageHistory`:

```json
[
  {
    "village_id": "vlg-001",
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-06-30T23:59:59Z"
  },
  {
    "village_id": "vlg-002",
    "from": "2024-07-01T00:00:00Z",
    "to": null
  }
]
```

## Security Best Practices

### Environment Variables

- **Never commit `.env` to version control**
- Use strong, random values for `NEXTAUTH_SECRET`
- Rotate secrets regularly
- Use different secrets for development and production

### Session Management

- Sessions expire after 30 days
- JWT tokens are signed and encrypted
- Session tokens are HTTP-only cookies
- CSRF protection is enabled by default

### Password Policies

When using credentials provider:
- Implement strong password requirements
- Use bcrypt for password hashing
- Enforce password rotation policies
- Enable multi-factor authentication (MFA) when available

### API Security

- Validate all inputs
- Sanitize user data before storing
- Use parameterized queries (Prisma handles this)
- Rate limit authentication endpoints
- Monitor for suspicious activity

## Troubleshooting

### Common Issues

#### 1. "Configuration Error"

**Problem:** NextAuth not properly configured

**Solution:**
- Verify all required environment variables are set
- Check `NEXTAUTH_URL` matches your application URL
- Ensure `NEXTAUTH_SECRET` is generated (use `openssl rand -base64 32`)

#### 2. "OAuthCallback Error"

**Problem:** OAuth callback failed

**Solution:**
- Verify redirect URIs in Azure AD/Keycloak match your application
- Check client ID and secret are correct
- Ensure network connectivity to IDP
- Clear browser cookies and try again

#### 3. User Not Created in Database

**Problem:** User authenticated but not in database

**Solution:**
- Check database connection
- Verify Prisma schema is migrated
- Check JWT callback in `src/lib/auth.ts`
- Review server logs for errors

#### 4. Middleware Not Working

**Problem:** Routes not being protected

**Solution:**
- Verify middleware is in `src/middleware.ts`
- Check matcher configuration
- Ensure route is not in public routes list
- Clear Next.js cache (`rm -rf .next`)

### Debug Mode

Enable debug logging in development:

```typescript
// In src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ... other config
  debug: true, // Already enabled in development
};
```

Check logs for detailed authentication flow information.

## Testing

### Development Testing

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Access the sign-in page:**
   ```
   http://localhost:3000/auth/signin
   ```

3. **Use credentials provider:**
   - Email: `alice.manager@clubmed.com`
   - Employee ID: `EMP001`

4. **Test protected route:**
   ```
   http://localhost:3000/dashboard
   ```

### Creating Test Users

Use the seed data or create users via credentials provider:

```bash
# Run seed script
npm run db:seed

# Or sign in via credentials provider (dev only)
# This will create a new user automatically
```

### Testing Different Roles

Manually update user role in database:

```sql
UPDATE User SET role = 'ADMIN' WHERE email = 'alice.manager@clubmed.com';
```

Or use Prisma Studio:

```bash
npm run db:studio
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Configure production OAuth apps in Azure AD/Keycloak
- [ ] Set production redirect URIs
- [ ] Generate secure `NEXTAUTH_SECRET` for production
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Disable credentials provider (development only)
- [ ] Enable HTTPS
- [ ] Configure session expiration policies
- [ ] Set up monitoring and alerting
- [ ] Review and test all protected routes
- [ ] Verify GDPR compliance settings

### Environment Variables

Production `.env`:

```bash
NEXTAUTH_URL="https://feedback.clubmed.com"
NEXTAUTH_SECRET="<secure-random-secret>"
AZURE_AD_CLIENT_ID="<production-client-id>"
AZURE_AD_CLIENT_SECRET="<production-client-secret>"
AZURE_AD_TENANT_ID="<production-tenant-id>"
KEYCLOAK_CLIENT_ID="<production-client-id>"
KEYCLOAK_CLIENT_SECRET="<production-client-secret>"
KEYCLOAK_ISSUER="<production-issuer>"
```

### Monitoring

Monitor the following metrics:

- Sign-in success/failure rates
- Session creation errors
- OAuth callback failures
- User profile sync errors
- Database connection issues

## API Reference

### Session Utilities

#### `getSession()`
Returns the current session or null.

```typescript
async function getSession(): Promise<AuthSession | null>
```

#### `requireAuth(redirectTo?)`
Requires authentication, redirects if not authenticated.

```typescript
async function requireAuth(redirectTo?: string): Promise<AuthSession>
```

#### `requireRole(role)`
Requires specific role.

```typescript
async function requireRole(role: Role): Promise<AuthSession>
```

#### `requireAnyRole(roles)`
Requires one of multiple roles.

```typescript
async function requireAnyRole(roles: Role[]): Promise<AuthSession>
```

#### `hasRole(role)`
Checks if user has role (non-throwing).

```typescript
async function hasRole(role: Role): Promise<boolean>
```

#### `hasAnyRole(roles)`
Checks if user has any of the roles (non-throwing).

```typescript
async function hasAnyRole(roles: Role[]): Promise<boolean>
```

#### `getCurrentUserId()`
Gets current user ID.

```typescript
async function getCurrentUserId(): Promise<string | null>
```

#### `getCurrentVillageId()`
Gets current user's village ID.

```typescript
async function getCurrentVillageId(): Promise<string | null>
```

## Support

For issues or questions:

- Check this documentation
- Review [NextAuth.js documentation](https://next-auth.js.org/)
- Contact the development team
- Submit an issue in the project repository

---

**Last Updated:** October 2, 2025
**Version:** 1.0.0
**Maintainer:** Odyssey Feedback Team
