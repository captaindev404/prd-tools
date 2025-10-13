# TASK-066: Session Recording - Testing Guide

## Prerequisites

Before testing, ensure:

1. **Development Environment**
   ```bash
   npm run dev
   # Server running on http://localhost:3000
   ```

2. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed  # Optional: seed test data
   ```

3. **Browser Requirements**
   - Chrome 80+ (recommended)
   - Firefox 90+ (alternative)
   - Microphone/camera permissions granted

4. **Environment Variables** (Optional for full testing)
   ```bash
   # Minimum for development
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-dev-secret"

   # For transcription testing
   OPENAI_API_KEY="sk-..."
   RECORDING_TRANSCRIPTION_ENABLED=true

   # For storage testing (optional, defaults to mock)
   RECORDING_STORAGE_ENDPOINT=""
   RECORDING_STORAGE_ACCESS_KEY=""
   RECORDING_STORAGE_SECRET_KEY=""
   ```

---

## Test Scenarios

### Scenario 1: Camera Recording (Basic)

**Objective**: Record a simple camera video

**Steps**:
1. Log in as researcher/facilitator
2. Navigate to Research > Sessions
3. Create new session or open existing "in_progress" session
4. Verify "Recording Controls" card appears
5. Click "Camera" mode button
6. Select camera device from dropdown
7. Select microphone device from dropdown
8. Click "Start Recording"
9. Grant camera/microphone permissions if prompted
10. Verify live preview appears
11. Speak into microphone for 10 seconds
12. Verify REC indicator and timer
13. Click "Stop Recording"
14. Wait for upload completion
15. Verify "Uploading..." message
16. Refresh page
17. Verify recording appears in playback section

**Expected Results**:
- ✅ Recording starts without errors
- ✅ Live preview shows camera feed
- ✅ Timer increments every second
- ✅ Recording stops and uploads
- ✅ Playback available after refresh

**Common Issues**:
- Permission denied → Grant browser permissions
- No devices found → Check OS privacy settings
- Upload fails → Check network/storage config

---

### Scenario 2: Screen Recording

**Objective**: Record screen capture

**Steps**:
1. Open session detail page (in_progress session)
2. Click "Screen" mode button
3. Click "Start Recording"
4. Select window/screen in browser dialog
5. Click "Share" to allow capture
6. Open another application (browser tab, text editor)
7. Perform some actions for 15 seconds
8. Click "Stop Recording"
9. Wait for upload
10. Refresh page and view playback

**Expected Results**:
- ✅ Screen capture dialog appears
- ✅ Selected screen/window captured
- ✅ Recording includes screen content
- ✅ Playback shows screen activity

**Common Issues**:
- Capture dialog doesn't appear → Check browser support
- Wrong screen captured → User selected wrong option
- Poor quality → Increase recording bitrate (config)

---

### Scenario 3: Combined Recording (Camera + Screen)

**Objective**: Record both camera and screen

**Steps**:
1. Open session detail page
2. Click "Both" mode button
3. Click "Start Recording"
4. Grant camera permissions
5. Select screen/window to share
6. Record for 20 seconds showing both feeds
7. Stop recording
8. Verify playback shows screen with audio

**Expected Results**:
- ✅ Both streams start
- ✅ Camera audio captured
- ✅ Screen video captured
- ✅ Combined recording playable

**Note**: Picture-in-picture not implemented yet; camera video may not be visible in final recording depending on browser.

---

### Scenario 4: Pause and Resume

**Objective**: Test pause/resume functionality

**Steps**:
1. Start camera recording
2. Record for 5 seconds
3. Click "Pause"
4. Verify "Paused" badge appears
5. Wait 3 seconds
6. Click "Resume"
7. Record for 5 more seconds
8. Click "Stop"
9. Check playback duration

**Expected Results**:
- ✅ Recording pauses
- ✅ Timer stops during pause
- ✅ Resume continues recording
- ✅ Total duration = recording time only (excludes pause)

---

### Scenario 5: Video Playback

**Objective**: Test video player controls

**Steps**:
1. Navigate to session with completed recording
2. Verify video player appears
3. Click play button
4. Test controls:
   - Pause/play
   - Volume slider
   - Mute/unmute
   - Seek bar (drag to different timestamp)
   - Skip back 10s
   - Skip forward 10s
   - Fullscreen
5. Test timeline interaction:
   - Click on timeline to jump
   - Hover to see timestamp
6. Let video play to completion

**Expected Results**:
- ✅ All controls responsive
- ✅ Seeking works smoothly
- ✅ Volume control works
- ✅ Fullscreen expands player
- ✅ Video plays without stuttering

---

### Scenario 6: Annotations

**Objective**: Add and view annotations

**Steps**:
1. Open session with completed recording
2. Play video to 0:10
3. Click "Add Note" button
4. Select "note" type
5. Enter text: "User confused here"
6. Click "Add Annotation"
7. Verify annotation appears at 0:10
8. Play video past 0:10
9. Verify annotation displays at timestamp
10. Click annotation in list
11. Verify video jumps to 0:10

**Expected Results**:
- ✅ Annotation dialog opens
- ✅ Annotation saved successfully
- ✅ Annotation appears at correct timestamp
- ✅ Clicking jumps to timestamp
- ✅ Multiple annotations supported

---

### Scenario 7: Highlights

**Objective**: Add highlight regions to timeline

**Steps**:
1. Open session with recording
2. Identify interesting section (e.g., 0:15 to 0:25)
3. Use API to add highlight:
   ```javascript
   fetch('/api/recording/playback/RECORDING_ID', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       type: 'highlight',
       start: 15,
       end: 25,
       label: 'Key moment',
       color: '#FFD700'
     })
   })
   ```
4. Refresh page
5. Verify colored bar appears on timeline
6. Hover over highlight
7. Verify tooltip shows label

**Expected Results**:
- ✅ Highlight appears on timeline
- ✅ Correct position and width
- ✅ Color matches specified
- ✅ Tooltip shows label

---

### Scenario 8: Transcription (Requires OpenAI)

**Objective**: Generate and view transcript

**Prerequisites**:
- OpenAI API key configured
- RECORDING_TRANSCRIPTION_ENABLED=true

**Steps**:
1. Complete a recording with speech
2. Wait for transcription processing (~30s per minute)
3. Check transcription status in database:
   ```sql
   SELECT transcriptionStatus FROM SessionRecording WHERE id = 'rec_...';
   ```
4. Once completed, refresh session page
5. Verify TranscriptViewer appears
6. Test transcript features:
   - Scroll through segments
   - Click timestamp to jump
   - Search for keyword
   - Export as SRT
   - Export as VTT
   - Export as TXT
   - Copy full text

**Expected Results**:
- ✅ Transcription completes
- ✅ Segments have timestamps
- ✅ Search highlights matches
- ✅ All export formats work
- ✅ Timestamp navigation works

**Common Issues**:
- Transcription fails → Check API key
- Wrong language → Set language in config
- Low quality → Check audio input

---

### Scenario 9: Permissions (Access Control)

**Objective**: Verify permission enforcement

**Test Cases**:

**A. Non-Facilitator Cannot Record**
1. Log in as USER role
2. Navigate to session
3. Verify RecordingControls NOT visible
4. Try direct API call:
   ```bash
   curl -X POST http://localhost:3000/api/recording/start \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "ses_..."}}'
   ```
5. Verify 403 Forbidden

**B. Non-Facilitator Cannot Annotate**
1. Log in as USER role (participant)
2. View session with recording
3. Verify VideoPlayer visible (can view)
4. Verify "Add Note" button NOT visible
5. Try direct API call to add annotation
6. Verify 403 Forbidden

**C. Researcher Can Access Any Recording**
1. Log in as RESEARCHER role
2. Navigate to any session
3. Verify can view all recordings
4. Verify can add annotations
5. Verify can delete recordings

**Expected Results**:
- ✅ Access control enforced at API level
- ✅ UI respects permissions
- ✅ Researcher has full access
- ✅ Participants can view only

---

### Scenario 10: GDPR Compliance

**Objective**: Test data retention and deletion

**Steps**:

**A. Check Expiry Date**
1. Create recording
2. Check database:
   ```sql
   SELECT expiresAt, recordingStorageDays FROM SessionRecording
   JOIN Session ON SessionRecording.sessionId = Session.id
   WHERE SessionRecording.id = 'rec_...';
   ```
3. Verify expiresAt = createdAt + recordingStorageDays

**B. Soft Delete**
1. Open session with recording
2. Click delete button (facilitator only)
3. Confirm deletion
4. Verify recording disappears
5. Check database:
   ```sql
   SELECT deletedAt, deletedBy FROM SessionRecording WHERE id = 'rec_...';
   ```
6. Verify soft delete fields populated

**C. Access Deleted Recording**
1. Try accessing deleted recording via API
2. Verify 410 Gone status
3. Verify appropriate error message

**Expected Results**:
- ✅ Expiry dates calculated correctly
- ✅ Soft delete preserves data
- ✅ Deleted recordings inaccessible
- ✅ Audit trail maintained

---

## Performance Testing

### Test 1: Large File Upload

**Objective**: Verify chunked upload handles large files

**Steps**:
1. Record for 5 minutes (camera + screen)
2. Monitor network tab in DevTools
3. Verify chunks uploaded every 10 seconds
4. Note upload speed and reliability
5. Check final file size
6. Verify playback starts quickly

**Expected Results**:
- ✅ Chunks upload progressively
- ✅ No memory issues
- ✅ Upload completes successfully
- ✅ Playback works immediately

**Metrics**:
- Chunk size: ~2-5 MB (10 seconds)
- Total file size: ~60-150 MB (5 minutes)
- Upload time: Variable by network
- Processing time: < 10 seconds

---

### Test 2: Concurrent Recordings

**Objective**: Test multiple simultaneous recordings

**Steps**:
1. Open 3 browser windows
2. Log in as different researchers
3. Open different sessions
4. Start recording in all 3 windows
5. Record for 30 seconds each
6. Stop all recordings
7. Verify all uploads succeed
8. Check server logs for errors

**Expected Results**:
- ✅ All recordings start
- ✅ No conflicts or errors
- ✅ All uploads complete
- ✅ No performance degradation

---

## Browser Compatibility Matrix

| Feature | Chrome 80+ | Firefox 90+ | Safari 14+ | Edge 80+ |
|---------|-----------|-----------|----------|---------|
| Camera Recording | ✅ | ✅ | ✅ | ✅ |
| Screen Capture | ✅ | ✅ | ⚠️ | ✅ |
| System Audio | ✅ (105+) | ❌ | ❌ | ✅ (105+) |
| Video Playback | ✅ | ✅ | ✅ | ✅ |
| Fullscreen | ✅ | ✅ | ✅ | ✅ |
| Annotations | ✅ | ✅ | ✅ | ✅ |

Legend:
- ✅ Full support
- ⚠️ Partial support
- ❌ Not supported

---

## Troubleshooting

### Recording Won't Start

**Symptoms**: Error message or nothing happens

**Checks**:
1. Browser permissions granted?
   - Chrome: chrome://settings/content/camera
   - Firefox: about:preferences#privacy
2. Devices connected?
   - Check OS device manager
   - Test in system settings
3. HTTPS required?
   - Use localhost or HTTPS URL
   - HTTP won't work for media
4. Browser console errors?
   - Open DevTools > Console
   - Look for MediaRecorder errors

**Solutions**:
- Grant permissions in browser
- Reconnect devices
- Use HTTPS or localhost
- Update browser to latest

---

### Upload Fails

**Symptoms**: "Upload failed" error

**Checks**:
1. Storage configured?
   - Check .env variables
   - Verify credentials valid
2. Network connection?
   - Check internet connectivity
   - Test with curl
3. Storage bucket exists?
   - Verify bucket created
   - Check permissions
4. CORS configured?
   - Add localhost to CORS policy

**Solutions**:
- Configure storage properly
- Use mock mode for dev
- Check network/firewall
- Update CORS settings

---

### Playback Not Working

**Symptoms**: Video won't load or play

**Checks**:
1. Recording completed?
   - Check status in database
   - Verify not still uploading
2. Signed URL expired?
   - Check signedUrlExpiry
   - Refresh page to regenerate
3. Storage accessible?
   - Verify storage endpoint
   - Check credentials
4. Browser codec support?
   - Check video MIME type
   - Try different browser

**Solutions**:
- Wait for upload completion
- Refresh to get new signed URL
- Verify storage configuration
- Use modern browser

---

### Transcription Not Working

**Symptoms**: No transcript or "pending" forever

**Checks**:
1. OpenAI API key valid?
   - Test key with curl
   - Check billing/limits
2. Audio in recording?
   - Play video and check audio
   - Verify microphone worked
3. Background job running?
   - Check for errors in logs
   - Verify transcription enabled

**Solutions**:
- Add/verify API key
- Enable transcription in config
- Manually trigger transcription
- Check audio input during recording

---

## Test Data Setup

### Create Test Session

```typescript
// Using Prisma Studio or seed script
await prisma.session.create({
  data: {
    id: 'ses_test123',
    type: 'usability',
    scheduledAt: new Date(),
    durationMinutes: 60,
    facilitatorIds: JSON.stringify(['usr_facilitator1']),
    participantIds: JSON.stringify(['usr_participant1']),
    recordingEnabled: true,
    recordingStorageDays: 365,
    status: 'in_progress',
  }
});
```

### Create Test Recording

```typescript
await prisma.sessionRecording.create({
  data: {
    id: 'rec_test123',
    sessionId: 'ses_test123',
    recordedBy: 'usr_facilitator1',
    type: 'camera',
    status: 'completed',
    storageUrl: 'mock://test-recording.webm',
    signedUrl: '/api/recording/playback/rec_test123',
    durationSeconds: 120,
    annotations: JSON.stringify([
      {
        id: 'ann_1',
        timestamp: 30,
        text: 'Test annotation',
        author: 'Facilitator',
        authorId: 'usr_facilitator1',
        type: 'note',
        createdAt: new Date().toISOString(),
      }
    ]),
  }
});
```

---

## Automated Testing (Future)

### Unit Tests Needed

```typescript
// /src/lib/recording/__tests__/storage-client.test.ts
describe('StorageClient', () => {
  test('uploads file successfully');
  test('generates valid signed URL');
  test('handles upload errors');
});

// /src/lib/recording/__tests__/media-recorder.test.ts
describe('MediaRecorderWrapper', () => {
  test('starts camera recording');
  test('pauses and resumes');
  test('generates chunks');
});
```

### Integration Tests Needed

```typescript
// /src/app/api/recording/__tests__/start.test.ts
describe('POST /api/recording/start', () => {
  test('creates recording for facilitator');
  test('rejects unauthorized user');
  test('validates session exists');
});
```

### E2E Tests Needed (Playwright)

```typescript
// /e2e/recording.spec.ts
test('complete recording flow', async ({ page }) => {
  await page.goto('/research/sessions/ses_test123');
  await page.click('text=Start Recording');
  await page.waitForTimeout(5000);
  await page.click('text=Stop');
  await expect(page.locator('.video-player')).toBeVisible();
});
```

---

## Test Report Template

```markdown
## Recording Test Report

**Date**: YYYY-MM-DD
**Tester**: Name
**Environment**: Development / Staging / Production
**Browser**: Chrome 120.0 / Firefox 115.0 / etc.

### Results

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| Camera Recording | ✅ / ❌ | |
| Screen Recording | ✅ / ❌ | |
| Combined Recording | ✅ / ❌ | |
| Pause/Resume | ✅ / ❌ | |
| Video Playback | ✅ / ❌ | |
| Annotations | ✅ / ❌ | |
| Transcription | ✅ / ❌ | |
| Permissions | ✅ / ❌ | |
| GDPR Compliance | ✅ / ❌ | |

### Issues Found

1. **Issue Title**
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce:
   - Expected behavior:
   - Actual behavior:
   - Screenshot/video:

### Performance Metrics

- Recording start time: X seconds
- Upload speed: X MB/s
- Playback load time: X seconds
- Transcription time: X seconds

### Recommendations

- Item 1
- Item 2
```

---

## Next Steps After Testing

1. **Document Issues**
   - Create bug reports
   - Prioritize fixes
   - Assign to developers

2. **Production Readiness**
   - Set up real storage (MinIO/R2/S3)
   - Configure transcription
   - Enable HTTPS
   - Test in production-like environment

3. **User Training**
   - Create user guide
   - Record demo video
   - Conduct training session
   - Gather feedback

4. **Monitoring**
   - Set up error tracking
   - Monitor storage usage
   - Track API performance
   - Review security logs

---

## Support Resources

- **Recording Library**: `/src/lib/recording/`
- **API Documentation**: `/docs/API.md`
- **Completion Report**: `/docs/tasks/TASK-066-COMPLETION.md`
- **Schema**: `/prisma/schema.prisma` (SessionRecording model)

For questions or issues, refer to completion report or create a GitHub issue.
