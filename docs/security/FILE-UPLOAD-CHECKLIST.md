# File Upload Security Checklist

**Component**: File Upload Feature
**Version**: v0.5.0
**Last Updated**: 2025-10-09

This checklist provides pre-deployment security verification steps and ongoing monitoring requirements for the file upload feature in Gentil Feedback.

---

## Pre-Deployment Checklist

Use this checklist before deploying the file upload feature to any environment (staging, production).

### Critical Security Controls

- [ ] **Files stored outside public directory**
  - Location: Files should be in `/private/uploads/` NOT `/public/uploads/`
  - Verify: `UPLOAD_BASE_PATH` in `src/lib/file-upload.ts`
  - Risk if unchecked: CRITICAL - Unauthorized file access

- [ ] **Authenticated retrieval endpoint implemented**
  - Endpoint: `GET /api/feedback/[id]/attachments/[fileId]`
  - Verify: Authentication check, authorization check (can user view feedback?)
  - Risk if unchecked: CRITICAL - Data breach

- [ ] **HTTPS enforcement in production**
  - Verify: `middleware.ts` redirects HTTP to HTTPS
  - Test: `curl http://app.clubmed.com/api/feedback/upload` → 301 redirect
  - Risk if unchecked: HIGH - Man-in-the-middle attacks

- [ ] **Security headers configured**
  - Headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`
  - Verify: All API responses include security headers
  - Risk if unchecked: HIGH - XSS, clickjacking vulnerabilities

---

### Authentication & Authorization

- [ ] **Upload endpoint requires authentication**
  - Test: `curl -X POST /api/feedback/upload` → 401 Unauthorized
  - Code: `route.ts:88-99`

- [ ] **User session validation working**
  - Verify: `getCurrentUser()` returns valid user or null
  - Test: Upload with expired token → 401

- [ ] **Rate limiting active**
  - Test: Send 12 upload requests → 11th or 12th should return 429
  - Limits: 10 uploads/minute/user
  - Code: `route.ts:102-123`

- [ ] **Authorization for file retrieval**
  - Verify: Users can only access attachments on public feedback or their own
  - Test: User A tries to access User B's private feedback attachment → 403

---

### File Validation

- [ ] **File size limits enforced**
  - Per-file: 10MB max
  - Total: 50MB max per batch
  - File count: 5 files max
  - Test: Upload 11MB file → 400/413 error

- [ ] **File type whitelist active**
  - Allowed: `.jpg, .jpeg, .png, .gif, .webp, .pdf, .docx, .xlsx, .txt`
  - Test: Upload `.exe` file → 400 error with "INVALID_FILE_TYPE"

- [ ] **MIME type validation**
  - Verify: Server checks MIME type matches extension
  - Test: Upload text file as `file.jpg` with `type=image/jpeg` → 400 error

- [ ] **Magic byte signature verification**
  - Verify: `checkFileSignature()` validates first bytes of file
  - Test: File with wrong signature → "SIGNATURE_MISMATCH" error
  - Code: `file-upload.ts:216-232`

- [ ] **Text file validation (if enabled)**
  - Verify: `.txt` files checked for null bytes and UTF-8 validity
  - Recommendation from audit: M-TYPE-001

---

### Filename Security

- [ ] **Directory traversal prevention**
  - Verify: `sanitizeFilename()` removes `../` and `/` characters
  - Test: Upload file named `../../etc/passwd` → filename sanitized
  - Code: `file-upload.ts:178-180`

- [ ] **Special character sanitization**
  - Verify: Only `[a-zA-Z0-9_-]` allowed in filenames
  - Test: Upload `<script>alert('xss')</script>.txt` → sanitized filename

- [ ] **ULID-based storage names**
  - Verify: Files stored as `{ulid}.{extension}`, not original filename
  - Example: `01HQWER123456.jpg`

- [ ] **Filename length limits**
  - Verify: Basename limited to 100 characters
  - Full path limited to 255 characters

- [ ] **PII detection in filenames (RECOMMENDED)**
  - Verify: Filenames with emails/phone numbers flagged or anonymized
  - Test: Upload `john.doe@clubmed.com-report.pdf` → filename sanitized
  - Status: ⚠️ Not implemented (see H-FILE-001)

- [ ] **Unicode normalization (RECOMMENDED)**
  - Verify: Filenames normalized to NFC form
  - Non-ASCII characters handled properly

---

### Storage Security

- [ ] **Files NOT in public directory**
  - ❌ BAD: `public/uploads/feedback/`
  - ✅ GOOD: `private/uploads/feedback/` or external storage (S3)
  - Verify: `UPLOAD_BASE_PATH` setting

- [ ] **File permissions restrictive**
  - Verify: Files created with mode `0600` (owner read/write only)
  - Test: Check file permissions after upload

- [ ] **Temporary file cleanup scheduled**
  - Verify: Cron job or scheduled task calls `cleanupTempFiles()`
  - Frequency: Every 1-24 hours
  - Max age: 1-24 hours for temp files

- [ ] **Physical file deletion on feedback deletion**
  - Verify: When feedback deleted, associated files also deleted
  - Test: Delete feedback → verify files removed from disk
  - Status: ⚠️ Not implemented (see H-GDPR-001)

- [ ] **Symlink attack prevention (RECOMMENDED)**
  - Verify: `fs.lstat()` used instead of `fs.stat()` before file operations
  - Verify: No symlink following in `moveFile()`

---

### GDPR & Privacy

- [ ] **Data retention policy configured**
  - Feedback attachments: 1825 days (5 years)
  - Temp files: 24 hours
  - Research records: 1095 days (3 years)

- [ ] **User consent tracked for file storage (RECOMMENDED)**
  - Verify: User has `file_storage` consent before upload
  - Check: User's `consents` JSON array in database

- [ ] **PII detection in file content (LONG-TERM)**
  - Verify: OCR/text extraction for images/PDFs
  - Verify: PII scanning before accepting file
  - Status: ⚠️ Not implemented (see M-GDPR-002)

- [ ] **GDPR deletion workflow**
  - Verify: User deletion includes file deletion
  - Verify: "Right to erasure" request deletes all files

---

### Network Security

- [ ] **HTTPS enforced in production**
  - Verify: `X-Forwarded-Proto: https` required
  - Test: HTTP request → redirect to HTTPS

- [ ] **Security headers present**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: default-src 'self'`
  - `Strict-Transport-Security: max-age=31536000`

- [ ] **CORS properly configured**
  - Verify: `Access-Control-Allow-Origin` set to specific domain
  - Verify: Not set to `*` in production
  - Code: `route.ts:289-297`

- [ ] **No credentials in URLs**
  - Verify: Auth tokens in headers, not query params
  - Verify: No sensitive data in file URLs

---

### Error Handling

- [ ] **No sensitive data in error messages**
  - Verify: No file paths, system info, or internal details leaked
  - Test: Trigger various errors → check responses

- [ ] **No stack traces exposed**
  - Verify: Production mode doesn't return stack traces
  - Test: Upload invalid file → response has user-friendly message only

- [ ] **Proper error codes used**
  - 400: Invalid input (file too large, wrong type)
  - 401: Unauthenticated
  - 403: Unauthorized (no permission to access)
  - 413: Payload too large
  - 429: Rate limit exceeded
  - 500: Internal server error (generic)

---

### Denial of Service Prevention

- [ ] **Rate limiting active**
  - General API: 100 reads/min, 10 writes/min
  - Upload-specific: 10 uploads/min/user
  - Verify: 429 responses after limit exceeded

- [ ] **Request timeout configured**
  - Verify: Uploads timeout after reasonable duration (e.g., 30s)
  - Prevents slow-loris attacks

- [ ] **Per-user storage quota (RECOMMENDED)**
  - Verify: Users can't upload more than X MB total
  - Suggested: 100MB per user
  - Status: ⚠️ Not implemented (see M-DOS-001)

---

### Virus & Malware Protection

- [ ] **Antivirus scanning integrated (RECOMMENDED)**
  - Service: ClamAV, AWS GuardDuty, or VirusTotal API
  - Verify: Files scanned before storage
  - Action: Reject infected files, alert security team

- [ ] **Suspicious file pattern detection**
  - Monitor: High rejection rates from single user
  - Monitor: Unusual file types for user's role
  - Alert: Security team on suspicious patterns

---

### Monitoring & Logging

- [ ] **Audit logging enabled**
  - Events logged: `file.upload`, `file.delete`, `file.access`
  - Fields: userId, filename, size, mimeType, ipAddress, timestamp
  - Storage: `AuditLog` table in database

- [ ] **Upload metrics tracked**
  - Success rate
  - Rejection rate (by error type)
  - Average file size
  - Storage usage per user

- [ ] **Security alerts configured**
  - Alert on: Rate limit exceeded 5+ times
  - Alert on: 10+ file rejections in 1 minute
  - Alert on: Unusual file types uploaded
  - Alert on: Storage quota near limit

- [ ] **Log retention policy**
  - Upload logs: 90 days minimum
  - Security events: 365 days
  - GDPR compliance: User data deletion from logs

---

## Post-Deployment Monitoring

### Daily Checks

- [ ] Review security alerts (if any)
- [ ] Check upload success/failure rates
- [ ] Verify temp file cleanup ran successfully

### Weekly Checks

- [ ] Review audit logs for suspicious patterns
- [ ] Check storage usage growth rate
- [ ] Verify rate limiting working as expected

### Monthly Checks

- [ ] Review and update security headers
- [ ] Check for dependency vulnerabilities (`npm audit`)
- [ ] Review GDPR deletion requests and verify file cleanup
- [ ] Penetration testing with updated threats

### Quarterly Checks

- [ ] Full security audit (re-run this checklist)
- [ ] Review and update file type whitelist
- [ ] Review storage retention policies
- [ ] Update virus scanning definitions (if applicable)

---

## Incident Response

### If Security Incident Detected

1. **Immediate Actions**
   - [ ] Identify scope (which files/users affected)
   - [ ] Disable upload endpoint if necessary (`UPLOAD_ENABLED=false`)
   - [ ] Preserve logs and evidence
   - [ ] Notify security team and stakeholders

2. **Investigation**
   - [ ] Review audit logs for incident timeline
   - [ ] Identify attack vector (how did it happen?)
   - [ ] Identify compromised files/accounts
   - [ ] Assess data exposure (GDPR breach notification required?)

3. **Remediation**
   - [ ] Remove malicious files
   - [ ] Block attacker IPs/accounts
   - [ ] Apply security patches
   - [ ] Re-run penetration tests
   - [ ] Document lessons learned

4. **Post-Incident**
   - [ ] Update security controls
   - [ ] Retrain team on secure upload handling
   - [ ] Update this checklist with new checks
   - [ ] GDPR breach notification (if applicable, within 72 hours)

---

## Testing Commands

### Manual Testing

```bash
# 1. Test authentication
curl -X POST http://localhost:3000/api/feedback/upload
# Expected: 401 Unauthorized

# 2. Test file size limit (requires valid token)
dd if=/dev/zero of=large.bin bs=1M count=11
curl -X POST http://localhost:3000/api/feedback/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@large.bin"
# Expected: 400 "FILE_TOO_LARGE"

# 3. Test executable rejection
echo "#!/bin/bash" > malware.sh
curl -X POST http://localhost:3000/api/feedback/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@malware.sh"
# Expected: 400 "INVALID_FILE_TYPE"

# 4. Test rate limiting (run 12 times quickly)
for i in {1..12}; do
  curl -X POST http://localhost:3000/api/feedback/upload \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -F "file=@test.txt"
done
# Expected: 11th or 12th request returns 429
```

### Automated Testing

```bash
# Run full penetration test suite
./scripts/security/file-upload-pentest.sh http://localhost:3000 "Bearer YOUR_TOKEN"

# Run unit tests
npm test -- file-upload.test.ts

# Run integration tests
npm test -- api/upload.test.ts
```

---

## Compliance Sign-Off

Before deploying to production, the following stakeholders must review and approve:

- [ ] **Security Team**: Reviewed audit report, no critical issues
- [ ] **GDPR Officer**: Confirmed GDPR compliance (deletion, consent, PII)
- [ ] **DevOps**: Confirmed infrastructure security (HTTPS, storage, backups)
- [ ] **Product Manager**: Approved feature for production release
- [ ] **QA Team**: Passed all security tests

**Sign-Off Date**: _________________

**Approved By**: _________________

---

## References

- [FILE-UPLOAD-SECURITY-AUDIT.md](./FILE-UPLOAD-SECURITY-AUDIT.md) - Full security audit report
- [file-upload-pentest.sh](../../scripts/security/file-upload-pentest.sh) - Penetration test script
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [GDPR Article 17 - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)

---

## Changelog

| Date       | Version | Changes                                      | Author |
|------------|---------|----------------------------------------------|--------|
| 2025-10-09 | 1.0     | Initial checklist created from audit report  | A4     |

---

**Last Review**: 2025-10-09
**Next Review**: 2025-11-09
