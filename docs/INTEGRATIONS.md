# Integrations Guide

This document provides setup and configuration instructions for all external integrations in the Odyssey Feedback platform.

## Table of Contents

1. [SendGrid Email Integration](#sendgrid-email-integration)
2. [HRIS Sync Integration](#hris-sync-integration)
3. [Jira Link Validation](#jira-link-validation)
4. [Figma Link Validation](#figma-link-validation)
5. [Environment Variables Reference](#environment-variables-reference)

---

## SendGrid Email Integration

The platform uses SendGrid for sending email notifications to users for questionnaires and roadmap updates.

### Setup Instructions

1. **Get SendGrid API Key**
   - Sign up at [SendGrid](https://sendgrid.com)
   - Navigate to Settings > API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the API key (you won't be able to see it again)

2. **Configure Environment Variables**

   Add to your `.env` file:
   ```env
   SENDGRID_API_KEY="your-sendgrid-api-key"
   SENDGRID_FROM_EMAIL="noreply@odyssey-feedback.com"
   SENDGRID_FROM_NAME="Odyssey Feedback"
   ```

3. **Verify Sender Email**
   - In SendGrid dashboard, go to Settings > Sender Authentication
   - Verify your sender email domain
   - Alternatively, verify a single sender email address

4. **Development Mode**
   - In `NODE_ENV=development`, emails are logged to console instead of being sent
   - This prevents accidental emails during development

### Email Templates

The platform includes bilingual (EN/FR) email templates:

- **Questionnaire Invitations** (`src/lib/email-templates/questionnaire-invite.ts`)
  - Sent when a questionnaire is published with email delivery mode
  - Includes questionnaire title, deadline, and CTA link

- **Roadmap Updates** (`src/lib/email-templates/roadmap-update.ts`)
  - Sent when a roadmap item is published with email channel
  - Includes stage badge, summary, and link to details

### Customizing Email Templates

To customize email templates:

1. Locate template files in `src/lib/email-templates/`
2. Modify HTML structure and styling (Club Med brand colors are used)
3. Update content for both English (`en`) and French (`fr`)
4. Test with `NODE_ENV=development` to verify output

### Email Consent

Users must have `email_updates` consent to receive emails:
- Controlled via user's `consents` field (JSON array)
- Users without consent are automatically filtered out
- Consent can be managed in user settings

### Monitoring Email Delivery

- Email send events are logged to the `Event` table:
  - `questionnaire.emails_sent` - After questionnaire publish
  - `roadmap.emails_sent` - After roadmap publish
- Track success/failure counts in event payload
- Monitor SendGrid dashboard for delivery metrics

---

## HRIS Sync Integration

Synchronizes employee data from your HR Information System to keep user records up-to-date.

### Setup Instructions

1. **Configure HRIS API Access**

   Add to `.env`:
   ```env
   HRIS_API_URL="https://your-hris-api.com/employees"
   HRIS_API_KEY="your-hris-api-key"
   ```

2. **Run HRIS Sync Script**

   ```bash
   npx tsx src/scripts/hris-sync.ts
   ```

3. **Schedule Sync (Recommended)**

   Set up a cron job for daily sync:
   ```bash
   # Run daily at 2 AM
   0 2 * * * cd /path/to/project && npx tsx src/scripts/hris-sync.ts >> /var/log/hris-sync.log 2>&1
   ```

### HRIS Data Format

The sync script expects employee data in this format:

```typescript
interface HRISEmployee {
  employee_id: string;      // Unique employee identifier
  display_name: string;     // Full name
  email: string;            // Email address
  village_id: string;       // Current village assignment
  department?: string;      // Optional department
  role?: string;            // Optional role (USER, PM, PO, etc.)
}
```

### What Gets Synced

- **Existing Users**: Updates `displayName`, `email`, `currentVillageId`
- **New Users**: Creates user record with initial village history
- **Village Transfers**: Detects changes in `village_id` and updates history

### Village Transfer Detection

When an employee's village changes:

1. Current village history entry is closed (sets `to` date)
2. New history entry is created with new village
3. `currentVillageId` is updated
4. Event is logged: `user.village_transfer`

Example village history after transfer:
```json
[
  { "village_id": "vlg-001", "from": "2024-01-01", "to": "2024-10-02" },
  { "village_id": "vlg-002", "from": "2024-10-02", "to": null }
]
```

### Mock Data Mode

If `HRIS_API_URL` is not configured, the script uses mock data for testing:
- Creates/updates 4 sample employees
- Simulates a village transfer for one employee
- Useful for development and testing

### Sync Monitoring

The script outputs:
- Total employees processed
- New users created
- Existing users updated
- Village transfers detected
- Errors encountered

---

## Jira Link Validation

Validates Jira ticket URLs for roadmap items to ensure they point to valid ODYS or PMS projects.

### Setup Instructions

1. **Configure Jira Base URL**

   Add to `.env`:
   ```env
   JIRA_BASE_URL="https://jira.company.com"
   ```

2. **Optional: Enable Issue Fetching**

   To fetch Jira issue details (title, status):
   ```env
   JIRA_API_USER="your-jira-email@company.com"
   JIRA_API_TOKEN="your-jira-api-token"
   ```

### Validation Rules

- **Allowed Project Keys**: `ODYS`, `PMS`
- **URL Format**: `https://jira.company.com/browse/(ODYS|PMS)-\d+`
- **Examples**:
  - ✅ Valid: `https://jira.company.com/browse/ODYS-123`
  - ✅ Valid: `https://jira.company.com/browse/PMS-456`
  - ❌ Invalid: `https://jira.company.com/browse/OTHER-789`
  - ❌ Invalid: `http://jira.company.com/browse/ODYS-123` (must be HTTPS)

### Usage in Code

```typescript
import { validateJiraUrl, parseJiraUrl, fetchJiraIssue } from '@/lib/validators/jira';

// Validate single URL
const isValid = validateJiraUrl('https://jira.company.com/browse/ODYS-123');

// Parse URL to extract details
const parsed = parseJiraUrl('https://jira.company.com/browse/ODYS-123');
// { projectKey: 'ODYS', issueNumber: '123', issueKey: 'ODYS-123' }

// Fetch issue details (requires API credentials)
const issue = await fetchJiraIssue('https://jira.company.com/browse/ODYS-123');
// { title: 'Feature title', status: 'In Progress', key: 'ODYS-123' }
```

### Integration Points

Jira validation should be used in:
- Roadmap form submission (`src/components/roadmap/roadmap-form.tsx`)
- API route validation when creating/updating roadmap items
- Bulk import/sync operations

---

## Figma Link Validation

Validates Figma URLs for roadmap items to ensure they point to valid Figma files, prototypes, or designs.

### Setup Instructions

No configuration required. Figma validation works out-of-the-box.

### Validation Rules

- **Allowed Domains**: `figma.com`, `www.figma.com`, `*.figma.com`
- **Allowed Types**: `file`, `proto`, `design`
- **URL Format**: `https://([a-z]+\.)?figma.com/(file|proto|design)/.+`
- **Examples**:
  - ✅ Valid: `https://www.figma.com/file/abc123/Project-Name`
  - ✅ Valid: `https://www.figma.com/proto/xyz789/Prototype`
  - ✅ Valid: `https://www.figma.com/design/def456/Design-File`
  - ❌ Invalid: `http://figma.com/file/abc123` (must be HTTPS)
  - ❌ Invalid: `https://figma.com/other/abc123` (invalid type)

### Usage in Code

```typescript
import {
  validateFigmaUrl,
  parseFigmaUrl,
  generateFigmaEmbed,
  isFigmaUrlEmbeddable
} from '@/lib/validators/figma';

// Validate single URL
const isValid = validateFigmaUrl('https://www.figma.com/file/abc123/Project');

// Parse URL to extract details
const parsed = parseFigmaUrl('https://www.figma.com/file/abc123/Project');
// { type: 'file', id: 'abc123', name: 'Project' }

// Check if embeddable (only 'file' and 'proto' types)
const canEmbed = isFigmaUrlEmbeddable('https://www.figma.com/file/abc123');

// Generate iframe embed code
const iframe = generateFigmaEmbed('https://www.figma.com/file/abc123', {
  width: '800',
  height: '600',
  allowFullscreen: true
});
```

### Embed Support

Only `file` and `proto` types support iframe embedding:
- **Files**: Design files can be embedded
- **Prototypes**: Interactive prototypes can be embedded
- **Designs**: Design links are view-only, no embed support

### Integration Points

Figma validation should be used in:
- Roadmap form submission
- API route validation when creating/updating roadmap items
- Roadmap detail pages (for embedding Figma files)

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database connection | `file:./dev.db` |
| `NEXTAUTH_URL` | App base URL for NextAuth | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | Generate with `openssl rand -base64 32` |

### Email Integration (SendGrid)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | Yes | - |
| `SENDGRID_FROM_EMAIL` | Sender email address | No | `noreply@odyssey-feedback.com` |
| `SENDGRID_FROM_NAME` | Sender display name | No | `Odyssey Feedback` |

### HRIS Integration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `HRIS_API_URL` | HRIS API endpoint | No | Uses mock data |
| `HRIS_API_KEY` | HRIS API authentication key | No | - |

### Jira Integration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `JIRA_BASE_URL` | Jira instance URL | No | `https://jira.company.com` |
| `JIRA_API_USER` | Jira API username/email | No (for fetching) | - |
| `JIRA_API_TOKEN` | Jira API token | No (for fetching) | - |

### App Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Public app URL for links | No | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | No | `development` |

### OAuth Providers (Optional)

| Variable | Description |
|----------|-------------|
| `AZURE_AD_CLIENT_ID` | Azure AD application client ID |
| `AZURE_AD_CLIENT_SECRET` | Azure AD client secret |
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret |
| `KEYCLOAK_ISSUER` | Keycloak issuer URL |

---

## Troubleshooting

### Email Not Sending

1. **Check environment variables** are set correctly
2. **Verify SendGrid API key** has Mail Send permissions
3. **Check sender verification** in SendGrid dashboard
4. **Review console logs** for error messages
5. **Check user consent** - users must have `email_updates` consent

### HRIS Sync Failures

1. **Verify HRIS API credentials** are correct
2. **Check HRIS API response format** matches expected structure
3. **Review sync logs** for specific error messages
4. **Test with mock data** by removing `HRIS_API_URL`

### Jira Validation Issues

1. **Check `JIRA_BASE_URL`** matches your Jira instance
2. **Verify URL format** follows the pattern
3. **Ensure project key** is ODYS or PMS
4. **For issue fetching**, verify API credentials

### Figma Validation Issues

1. **Ensure URL is HTTPS** (HTTP not allowed)
2. **Check URL type** is file, proto, or design
3. **Verify domain** is figma.com or subdomain
4. **For embedding**, ensure type is file or proto

---

## Best Practices

### Email Integration

- **Rate Limiting**: SendGrid free tier has sending limits. Monitor usage.
- **List Management**: Keep email lists clean to maintain good sender reputation
- **Testing**: Always test email templates in development before production
- **Personalization**: Use user's preferred language for better engagement

### HRIS Sync

- **Schedule**: Run daily during off-peak hours (e.g., 2 AM)
- **Monitoring**: Set up alerts for sync failures
- **Backup**: Keep logs of sync operations for audit trail
- **Validation**: Verify employee data quality before sync

### Link Validation

- **Client-side**: Validate on form submission for immediate feedback
- **Server-side**: Always validate in API routes for security
- **User Feedback**: Show clear error messages for invalid URLs
- **Documentation**: Provide URL format examples in UI

---

## Support

For integration issues:

1. Check this documentation first
2. Review error logs and event records
3. Verify environment configuration
4. Test with mock/development data
5. Contact platform maintainers if issues persist

## Related Documentation

- [DSL Specification](../dsl/global.yaml) - Platform data model
- [API Documentation](./API.md) - REST API endpoints
- [Development Guide](./DEVELOPMENT.md) - Local setup and development
