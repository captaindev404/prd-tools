# Changelog

All notable changes to the Gentil Feedback Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- English-only questionnaire creation workflow
- Simplified question builder UI (removed language tabs)
- Backward compatibility for existing bilingual questionnaires
- Automatic normalization of old bilingual format to English

### Changed
- Question text format: `text: { en: string; fr: string }` → `text: string`
- MCQ options format: `{ label: { en, fr }, value }` → `{ label: string, value: string }`
- API validation schemas updated to accept string instead of bilingual object
- Question Builder component: Single text input per question (removed EN/FR tabs)

### Deprecated
- Bilingual questionnaire format (will be removed in v1.0.0)
- `BilingualTextField` component for questionnaires (may be removed in future releases)

---

## [0.6.0] - TBD

### Breaking Changes

#### 🚨 Questionnaires Now English-Only

**What Changed:**
- Questionnaires now support **English only** to accelerate MVP development
- Question text format changed from bilingual object to simple string
- Question builder UI simplified (removed language tabs)

**Old Format (Deprecated):**
```json
{
  "questions": [
    {
      "id": "q1",
      "type": "text",
      "text": {
        "en": "How satisfied are you?",
        "fr": "Êtes-vous satisfait?"
      }
    }
  ]
}
```

**New Format (Required):**
```json
{
  "questions": [
    {
      "id": "q1",
      "type": "text",
      "text": "How satisfied are you?"
    }
  ]
}
```

**Backward Compatibility:**
- Existing bilingual questionnaires will continue to work
- Old bilingual format is automatically normalized to English
- French translations are preserved in database but not displayed
- No data loss for existing questionnaires

**Migration:**
- No action required for existing questionnaires
- New questionnaires must use English-only format
- See [docs/prd/PRD-008.md](docs/prd/PRD-008.md) for detailed migration guide

**Why This Change?**
- 30% faster development velocity for MVP features
- Simpler UI and reduced translation overhead
- Focus on core functionality before adding i18n complexity
- 95% of Club Med employees are English-proficient

**Phase 2 Plan:**
- Bilingual support (English/French) will be reintroduced in **v0.8.0+**
- Future implementation will be opt-in (not required by default)

**Impact:**
- Researchers creating new questionnaires must use English
- Existing questionnaires display English text only
- API accepts both old and new formats (with automatic conversion)

---

## [0.5.0] - 2025-10-02

### Added
- Feedback submission with file attachments
- File upload component with drag-and-drop support
- Attachment preview (images, PDFs, documents)
- File type validation and size limits
- Image compression for large uploads
- Automatic file cleanup for orphaned attachments
- Security scanning for uploaded files
- Questionnaire creation interface with bilingual support (EN/FR)
- Question builder with multiple question types (NPS, Likert, MCQ, text, number, rating)
- Bilingual text fields for questions and options
- Questionnaire preview mode
- Audience size calculation for targeting
- Validation checklist for questionnaire publishing
- Responsive design improvements
- Accessibility enhancements (WCAG 2.1 AA compliance)
- Loading states for async operations
- Error boundaries for graceful error handling

### Changed
- Upgraded to Next.js 15.5 with Turbopack dev server
- Improved form validation with better error messages
- Enhanced audit logging for security events
- Updated rate limiting with Redis support

### Fixed
- File upload race conditions
- Memory leaks in image compression
- Accessibility issues in form components
- Loading state flickering in questionnaire forms

### Security
- Added file type validation to prevent malicious uploads
- Implemented virus scanning for uploaded files
- Enhanced PII detection in file metadata
- Added rate limiting for file upload endpoints

---

## [0.4.0] - 2025-09-15

### Added
- Feedback voting system with weighted votes
- Vote weight calculation based on role, panel membership, and village priority
- Vote decay mechanism (180-day half-life)
- Feature catalog with status tracking
- Roadmap items with progress tracking
- Multi-channel roadmap communications (in-app, email)
- Feedback merging for duplicates
- Duplicate detection with 86% similarity threshold

### Changed
- Enhanced feedback moderation with auto-screening
- Improved PII redaction algorithm
- Updated feedback state machine

---

## [0.3.0] - 2025-08-30

### Added
- Research panels with eligibility rules
- Panel recruitment workflow
- Panel member management
- User testing sessions scheduling
- Session participant management
- Session recording support

---

## [0.2.0] - 2025-08-15

### Added
- Feedback submission with PII redaction
- Feedback listing with filters and pagination
- Feedback detail view
- Feedback editing (15-minute window)
- Automatic toxicity and spam detection
- Moderation queue for flagged content
- Moderator tools (approve/reject)

---

## [0.1.0] - 2025-08-01

### Added
- Project initialization
- Next.js 15 setup with TypeScript
- Prisma ORM with SQLite (dev) / PostgreSQL (prod) support
- NextAuth.js v5 authentication
- Azure AD SSO integration
- Keycloak SSO integration
- User profile management
- GDPR consent management
- Multi-village user identity system
- Global user IDs with village history tracking
- Basic UI components (Shadcn UI)
- Tailwind CSS styling
- Role-based access control (USER, PM, PO, RESEARCHER, ADMIN, MODERATOR)

---

## Migration Guides

### Migrating from v0.5.0 to v0.6.0

**For Developers:**
1. Update questionnaire types: Change `text: { en, fr }` to `text: string`
2. Update validation schemas to accept string instead of object
3. Remove language state management from questionnaire components
4. Use normalization helper for backward compatibility:
   ```typescript
   const displayText = typeof question.text === 'string'
     ? question.text
     : question.text?.en || '';
   ```

**For Researchers:**
1. Create new questionnaires in English only
2. Existing bilingual questionnaires will display English text
3. French translations are preserved but not shown
4. Wait for Phase 2 (v0.8.0+) for bilingual support reintroduction

**For Product Managers:**
1. Communicate change to research team
2. Update internal documentation
3. Monitor user feedback about language limitation
4. Plan Phase 2 rollout based on user requests

---

## Support & Feedback

For questions, issues, or feedback about these changes:
- **Technical Issues**: Create a support ticket
- **Product Questions**: Contact Product team
- **Security Concerns**: Report immediately to Security team
- **Platform Feedback**: Submit through the platform itself

---

**Last Updated:** 2025-10-09
**Current Version:** 0.6.0 (unreleased)
