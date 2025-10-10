# PRD-005: File Attachments - Task Breakdown

**Epic**: PRD-005-File-Attachments
**Total Tasks**: 25
**Created**: 2025-10-09
**Status**: Ready for Development

## Overview

This document provides a comprehensive breakdown of PRD-005 (File Attachments for Feedback) into 25 developer-ready tasks organized by implementation phase. All tasks are stored in the PRD tool database and include dependencies, acceptance criteria, and priority levels.

## Task Summary

### By Priority
- **Critical**: 3 tasks
- **High**: 9 tasks
- **Medium**: 10 tasks
- **Low**: 3 tasks

### By Phase
- **Phase 1**: File Upload Utility & API (4 tasks)
- **Phase 2**: Frontend Components (6 tasks)
- **Phase 3**: Backend Integration (3 tasks)
- **Phase 4**: Edit Functionality (2 tasks)
- **Phase 5**: Testing & Security (6 tasks)
- **Additional**: Feature flags, mobile, GDPR (4 tasks)

## Phase 1: File Upload Utility & API (4-6 hours)

### #6: Create file validation utility with MIME type checking [HIGH]
**Dependencies**: None
**Acceptance Criteria**:
- ✅ Validates file types: jpg, png, gif, webp, pdf, docx, xlsx, txt
- ✅ Checks magic bytes for MIME type verification
- ✅ Enforces 10MB max file size limit
- ✅ Sanitizes filenames to prevent injection attacks

**Files**: `src/lib/file-upload.ts`
**Estimate**: 2 hours

---

### #7: Create file storage utilities (save, move, delete) [HIGH]
**Dependencies**: None
**Files**: `src/lib/file-upload.ts`
**Functions**: `saveUploadedFile()`, `moveFile()`, `deleteFile()`
**Estimate**: 1.5 hours

---

### #8: Create file upload API endpoint POST /api/feedback/upload [CRITICAL]
**Dependencies**: #6, #7
**Acceptance Criteria**:
- ✅ Handles multipart/form-data uploads
- ✅ Requires authentication for all uploads
- ✅ Returns file metadata (id, url, size, mimeType, uploadedAt)
- ✅ Returns proper error codes for validation failures

**Files**: `src/app/api/feedback/upload/route.ts`
**Estimate**: 2 hours

---

### #9: Add rate limiting for file uploads (10 req/min per user) [MEDIUM]
**Dependencies**: None
**Estimate**: 1 hour

---

## Phase 2: Frontend Components (4-5 hours)

### #10: Create FileUpload component with drag & drop interface [HIGH]
**Dependencies**: #8
**Acceptance Criteria**:
- ✅ Drag and drop interface works on desktop
- ✅ Click-to-browse file picker as fallback
- ✅ Shows upload progress indicator (0-100%)
- ✅ Displays thumbnails for images, icons for documents
- ✅ Allows removing files before submission
- ✅ Responsive design works on mobile, tablet, desktop

**Files**: `src/components/feedback/FileUpload.tsx`
**Estimate**: 2.5 hours

---

### #11: Create AttachmentList component for displaying attachments [HIGH]
**Dependencies**: None
**Files**: `src/components/feedback/AttachmentList.tsx`
**Estimate**: 1.5 hours

---

### #12: Create AttachmentPreview lightbox/modal component [MEDIUM]
**Dependencies**: None
**Files**: `src/components/feedback/AttachmentPreview.tsx`
**Estimate**: 1.5 hours

---

### #13: Integrate FileUpload in new feedback page [HIGH]
**Dependencies**: #10, #16
**Files**: `src/app/(authenticated)/feedback/new/page.tsx`
**Estimate**: 1 hour

---

### #14: Display attachments on feedback detail page [HIGH]
**Dependencies**: #11, #12
**Files**: `src/app/(authenticated)/feedback/[id]/page.tsx`
**Estimate**: 1 hour

---

### #15: Add attachment indicator icon to FeedbackCard [LOW]
**Dependencies**: None
**Files**: `src/components/feedback/FeedbackCard.tsx`
**Estimate**: 0.5 hours

---

## Phase 3: Backend Integration (3-4 hours)

### #17: Create Attachment TypeScript type definition [HIGH]
**Dependencies**: None
**Files**: `src/types/feedback.ts`
**Types**: `Attachment`, update `CreateFeedbackInput`
**Estimate**: 0.5 hours

---

### #16: Update POST /api/feedback to accept attachments array [CRITICAL]
**Dependencies**: #17
**Acceptance Criteria**:
- ✅ Accepts attachments array in request body
- ✅ Moves files from temp/ to feedback/{id}/ directory
- ✅ Updates attachment URLs in database
- ✅ Stores attachments in Feedback.attachments JSON field
- ✅ Cleans up temp files on failure

**Files**: `src/app/api/feedback/route.ts`
**Estimate**: 2 hours

---

### #18: Create orphan file cleanup utility [MEDIUM]
**Dependencies**: None
**Description**: Cron job to delete temp files older than 1 hour
**Estimate**: 1 hour

---

## Phase 4: Edit Functionality (2-3 hours)

### #19: Update feedback edit page to manage attachments [MEDIUM]
**Dependencies**: #10, #20
**Files**: `src/app/(authenticated)/feedback/[id]/edit/page.tsx`
**Estimate**: 1.5 hours

---

### #20: Update PATCH /api/feedback/[id] to handle attachment updates [MEDIUM]
**Dependencies**: None
**Files**: `src/app/api/feedback/[id]/route.ts`
**Estimate**: 1.5 hours

---

## Phase 5: Testing & Security (3-4 hours)

### #21: Write unit tests for file validation logic [HIGH]
**Dependencies**: #6
**Files**: `src/lib/file-upload.test.ts`
**Test Cases**: Valid files, oversized, invalid MIME, filename injection, magic bytes
**Estimate**: 1 hour

---

### #22: Write API integration tests for upload endpoint [HIGH]
**Dependencies**: #8
**Test Cases**: Auth, validation, rate limiting, multipart parsing
**Estimate**: 1 hour

---

### #23: Write E2E tests for complete attachment flow [MEDIUM]
**Dependencies**: #13, #14
**Tool**: Playwright
**Test Cases**: Upload → create → view → edit, drag-drop, mobile
**Estimate**: 1.5 hours

---

### #24: Perform security audit for file upload feature [CRITICAL]
**Dependencies**: None (can run after core implementation)
**Acceptance Criteria**:
- ✅ No filename injection vulnerabilities
- ✅ No MIME type spoofing possible
- ✅ No directory traversal attacks
- ✅ No XSS via filenames or file content
- ✅ Proper access control on all file operations

**Estimate**: 1.5 hours

---

### #25: Test accessibility features for file upload UI [MEDIUM]
**Dependencies**: None
**Standard**: WCAG 2.1 AA
**Tests**: Keyboard navigation, screen readers, ARIA labels
**Estimate**: 1 hour

---

### #26: Perform performance testing for large file uploads [MEDIUM]
**Dependencies**: None
**Targets**: <3s for 5MB, <2s page load, <500ms thumbnails
**Estimate**: 1 hour

---

## Additional Features (Optional)

### #30: Create feature flag for attachments rollout [HIGH]
**Dependencies**: None
**Environment Variable**: `ENABLE_ATTACHMENTS`
**Default**: `false`
**Estimate**: 0.5 hours

---

### #29: Add GDPR compliance: cascade delete attachments on feedback deletion [MEDIUM]
**Dependencies**: None
**Estimate**: 1 hour

---

### #27: Add mobile camera integration for photo capture [LOW]
**Dependencies**: None
**Estimate**: 1 hour

---

### #28: Implement image auto-compression for files >2MB [LOW]
**Dependencies**: None
**Max Size**: 1920px width
**Estimate**: 1.5 hours

---

## Task Dependency Graph

```
Phase 1:
  #6 [File Validation] ──┐
  #7 [File Storage] ─────┼──> #8 [Upload API] ──┐
                         │                       │
Phase 2:                 │                       │
                         └──────────────────────┬┴──> #10 [FileUpload Component]
  #11 [AttachmentList] ──┐                      │
  #12 [AttachmentPreview]┴──> #14 [Display]     │
                                                 │
Phase 3:                                         │
  #17 [TypeScript Types] ──> #16 [Feedback API] ┘
                              ↓
Phase 2 (continued):          │
  #13 [Integrate New Page] ←──┤
                              │
Phase 4:                      │
  #20 [PATCH API] ──┐         │
  #10 [FileUpload] ─┴──> #19 [Edit Page]

Phase 5:
  #6 ──> #21 [Unit Tests]
  #8 ──> #22 [API Tests]
  #13, #14 ──> #23 [E2E Tests]
  #24 [Security Audit] (independent)
```

## Ready to Start (No Dependencies)

These 16 tasks can be started immediately:

**Critical**:
- #24: Security audit planning

**High**:
- #6: File validation utility
- #7: File storage utilities
- #11: AttachmentList component
- #17: TypeScript types
- #30: Feature flag

**Medium**:
- #9: Rate limiting
- #12: AttachmentPreview component
- #18: Orphan cleanup
- #20: PATCH API
- #25: Accessibility testing
- #26: Performance testing
- #29: GDPR compliance

**Low**:
- #15: FeedbackCard indicator
- #27: Mobile camera
- #28: Image compression

## Recommended Development Order

### Week 1: Core Infrastructure
1. **Day 1-2**: #6, #7, #17 → #8 (File utilities + Upload API)
2. **Day 3**: #9, #30 (Rate limiting + Feature flag)

### Week 2: Frontend Components
3. **Day 1-2**: #10, #11, #12 (FileUpload, AttachmentList, Preview)
4. **Day 3**: #13, #14, #15 (Integration + Display)

### Week 3: Backend Integration + Edit
5. **Day 1**: #16 (Update Feedback API)
6. **Day 2**: #20, #19 (Edit functionality)
7. **Day 3**: #18, #29 (Cleanup + GDPR)

### Week 4: Testing & Polish
8. **Day 1**: #21, #22 (Unit + API tests)
9. **Day 2**: #23, #25, #26 (E2E + Accessibility + Performance)
10. **Day 3**: #24 (Security audit)

### Optional: Week 5
11. **Day 1**: #27, #28 (Mobile camera + Compression)

## Using the PRD Tool

All tasks are tracked in the PRD tool database. Common commands:

```bash
# View all tasks
prd list --epic "PRD-005-File-Attachments"

# Get next task to work on
prd next --epic "PRD-005-File-Attachments" --priority high

# Start work on a task
prd sync <agent-name> "#6"

# View task details with acceptance criteria
prd show "#6"
prd ac "#6" list

# Mark acceptance criteria complete
prd ac "#6" check 1

# Complete a task
prd complete "#6"

# View progress
prd epics
prd stats
```

## Success Metrics

From PRD-005, the feature is considered successful when:

**Launch Metrics** (First 30 days):
- ✅ 20%+ of feedback submissions include at least 1 attachment
- ✅ Zero security incidents related to file uploads
- ✅ <0.5% upload failure rate
- ✅ Upload time <3 seconds for 5MB file

**Quality Metrics**:
- ✅ 95%+ of uploaded files successfully display in UI
- ✅ No PII leakage via filenames or metadata
- ✅ Zero GDPR compliance violations

## Total Effort Estimate

- **Phase 1**: 4-6 hours
- **Phase 2**: 4-5 hours
- **Phase 3**: 3-4 hours
- **Phase 4**: 2-3 hours
- **Phase 5**: 3-4 hours
- **Additional**: 4-5 hours (optional)

**Total Core**: ~16-22 hours (2-3 days)
**Total with Optional**: ~20-27 hours (3-4 days)

## References

- **PRD Document**: `/docs/prd/PRD-005.md`
- **DSL Specification**: `/dsl/global.yaml` (lines 82-113 - feedback.attachments)
- **Prisma Schema**: `Feedback.attachments` field (JSON array)
- **Task Database**: `tools/prd/prd.db`

---

**Generated**: 2025-10-09
**Tool**: PRD Task Management Tool
**Tasks Stored**: ✅ All 25 tasks in database
