# File Upload Performance Testing Documentation

**Version**: 1.0
**Created**: 2025-10-09
**Task**: PRD-005 Task #26
**Status**: Ready for Testing

## Executive Summary

This document outlines comprehensive performance testing scenarios for the file attachment feature in the Gentil Feedback platform. These tests ensure that the upload experience meets performance targets across various network conditions, file sizes, and concurrent user scenarios.

## Performance Targets

From PRD-005 (NFR-1: Performance):

| Metric | Target | Priority |
|--------|--------|----------|
| Single file upload (5MB, WiFi) | <3 seconds | P0 |
| Single file upload (10MB, WiFi) | <5 seconds | P0 |
| Multiple file upload (5x5MB) | <10 seconds total | P0 |
| Page load with 5 attachments | <2 seconds | P0 |
| Image thumbnail generation | <500ms per image | P1 |
| Upload progress update interval | 100-200ms | P1 |

## Test Environment

### Network Profiles

**Slow 3G** (Mobile):
- Download: 400 Kbps (50 KB/s)
- Upload: 400 Kbps (50 KB/s)
- Latency: 400ms
- Packet loss: 0%

**4G** (Mobile):
- Download: 4 Mbps (500 KB/s)
- Upload: 3 Mbps (375 KB/s)
- Latency: 50ms
- Packet loss: 0%

**WiFi** (Desktop):
- Download: 30 Mbps (3.75 MB/s)
- Upload: 10 Mbps (1.25 MB/s)
- Latency: 10ms
- Packet loss: 0%

**Fiber** (Enterprise):
- Download: 100 Mbps (12.5 MB/s)
- Upload: 50 Mbps (6.25 MB/s)
- Latency: 5ms
- Packet loss: 0%

### Test Files

Prepare test files in advance:

```bash
# Create test files directory
mkdir -p test-files

# Generate test files with known content
# 1MB image
dd if=/dev/urandom of=test-files/image-1mb.jpg bs=1024 count=1024

# 5MB image
dd if=/dev/urandom of=test-files/image-5mb.jpg bs=1024 count=5120

# 10MB image
dd if=/dev/urandom of=test-files/image-10mb.jpg bs=1024 count=10240

# Multiple small images (5 x 1MB)
for i in {1..5}; do
  dd if=/dev/urandom of=test-files/image-small-$i.jpg bs=1024 count=1024
done

# Multiple medium images (5 x 5MB)
for i in {1..5}; do
  dd if=/dev/urandom of=test-files/image-medium-$i.jpg bs=1024 count=5120
done

# PDF files
dd if=/dev/urandom of=test-files/document-5mb.pdf bs=1024 count=5120
dd if=/dev/urandom of=test-files/document-10mb.pdf bs=1024 count=10240
```

### Test Tools

**Browser DevTools**:
- Network throttling profiles
- Performance timeline
- Lighthouse performance audit

**WebPageTest**:
- URL: https://www.webpagetest.org/
- Test locations: Multiple geographic regions
- Connection types: Slow 3G, 4G, Cable

**Artillery** (Load Testing):
```bash
npm install -g artillery@latest
```

**Custom Performance Script**:
See "Automated Test Scripts" section below.

## Test Scenarios

---

## Scenario 1: Single Large File Upload (10MB)

**Objective**: Verify that large file uploads complete within acceptable time limits.

**Target**: <3 seconds (WiFi), <5 seconds (4G)

### Test Steps

1. **Setup**:
   - Login as authenticated user
   - Navigate to `/feedback/new`
   - Open browser DevTools (Network tab)

2. **Throttle Network**:
   - DevTools > Network > Throttling dropdown
   - Select "Fast 3G" or "Slow 4G"

3. **Upload File**:
   - Drag `image-10mb.jpg` to upload zone
   - Start timer
   - Wait for upload completion
   - Record upload time

4. **Record Metrics**:
   - Total upload time (start to completion)
   - Time to first byte (TTFB)
   - Progress update frequency
   - Browser memory usage (Performance Monitor)

### Expected Results

| Network | File Size | Target | Status |
|---------|-----------|--------|--------|
| Slow 3G | 10 MB | ~50-60s (acceptable degradation) | ⏸️ Not tested |
| 4G | 10 MB | <8 seconds | ⏸️ Not tested |
| WiFi | 10 MB | <5 seconds | ⏸️ Not tested |
| Fiber | 10 MB | <2 seconds | ⏸️ Not tested |

### Pass/Fail Criteria

- ✅ **Pass**: Upload completes within target time
- ❌ **Fail**: Upload exceeds target by >20%
- ⚠️ **Warning**: Upload exceeds target by 10-20%

### Browser DevTools Test

```javascript
// Run in browser console on /feedback/new
(async function testSingleUpload() {
  const fileInput = document.querySelector('input[type="file"]');

  // Create 10MB blob
  const blob = new Blob([new Uint8Array(10 * 1024 * 1024)], { type: 'image/jpeg' });
  const file = new File([blob], 'test-10mb.jpg', { type: 'image/jpeg' });

  // Create FileList
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  // Trigger upload
  const startTime = performance.now();
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));

  // Wait for completion (observe UI or network)
  // Manual timing required
  console.log('Upload started at:', startTime);
})();
```

---

## Scenario 2: Multiple Files Upload (5x 5MB = 25MB)

**Objective**: Test concurrent/sequential upload of multiple files.

**Target**: <10 seconds total (WiFi)

### Test Steps

1. **Setup**:
   - Navigate to `/feedback/new`
   - Open Network tab
   - Select "Fast WiFi" throttling

2. **Upload Multiple Files**:
   - Select 5 files (`image-medium-1.jpg` to `image-medium-5.jpg`)
   - OR drag all 5 files to dropzone
   - Start timer
   - Wait for all uploads to complete
   - Record total time

3. **Observe Upload Strategy**:
   - Are files uploaded sequentially or in parallel?
   - Current implementation: **Parallel** (see `FileUpload.tsx` line 289)
   - Check Network tab for concurrent requests

4. **Record Metrics**:
   - Total time (first upload start to last upload complete)
   - Individual file upload times
   - Peak network bandwidth usage
   - Server CPU/memory (if available)

### Expected Results

| Network | Total Size | Files | Target | Status |
|---------|-----------|-------|--------|--------|
| WiFi | 25 MB | 5x5MB | <10 seconds | ⏸️ Not tested |
| 4G | 25 MB | 5x5MB | <30 seconds | ⏸️ Not tested |
| Fiber | 25 MB | 5x5MB | <5 seconds | ⏸️ Not tested |

### Parallel vs Sequential Comparison

Test both strategies and compare:

```typescript
// Sequential upload (one at a time)
for (const file of files) {
  await uploadFile(file);
}

// Parallel upload (all at once) - CURRENT IMPLEMENTATION
await Promise.all(files.map(file => uploadFile(file)));
```

**Expected**:
- Sequential: Slower total time, but more stable progress
- Parallel (current): Faster total time, but higher memory usage

### Artillery Load Test Script

```yaml
# file-upload-load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 1
      name: "Warm up"
    - duration: 120
      arrivalRate: 5
      name: "Multiple users"
  processor: "./upload-processor.js"

scenarios:
  - name: "Upload 5 files"
    flow:
      - post:
          url: "/api/auth/session"
          json:
            username: "test@clubmed.com"
            password: "testpass"
          capture:
            - json: "$.token"
              as: "authToken"
      - post:
          url: "/api/feedback/upload"
          headers:
            Authorization: "Bearer {{ authToken }}"
          beforeRequest: "generateMultipartBody"
          afterResponse: "recordUploadTime"
```

---

## Scenario 3: Concurrent Users (10 users uploading simultaneously)

**Objective**: Test system behavior under load with multiple concurrent uploads.

**Target**: No degradation >20%, rate limiting enforced (10 req/min/user)

### Test Steps

1. **Setup Artillery**:
   ```bash
   npm install -g artillery@latest
   ```

2. **Create Test Script** (`concurrent-upload.yml`):
   ```yaml
   config:
     target: 'http://localhost:3000'
     phases:
       - duration: 60
         arrivalRate: 10  # 10 users/second
         name: "Concurrent upload stress test"

   scenarios:
     - name: "Upload 5MB file"
       flow:
         - post:
             url: "/api/feedback/upload"
             json:
               file: "@test-files/image-5mb.jpg"
   ```

3. **Run Load Test**:
   ```bash
   artillery run concurrent-upload.yml
   ```

4. **Monitor Server**:
   - CPU usage: `top` or `htop`
   - Memory usage: `free -h`
   - Disk I/O: `iostat`
   - Network: `iftop`

### Expected Results

| Concurrent Users | Total Requests | Target Response Time | Status |
|------------------|----------------|---------------------|--------|
| 5 users | 25 uploads | <5s per upload | ⏸️ Not tested |
| 10 users | 50 uploads | <8s per upload | ⏸️ Not tested |
| 20 users | 100 uploads | <10s per upload (degraded) | ⏸️ Not tested |

### Rate Limiting Test

**Verify rate limit enforcement** (10 uploads/min per user):

```bash
# Send 11 requests in quick succession
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/feedback/upload \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "file=@test-files/image-1mb.jpg" \
    -w "\nRequest $i: %{http_code}\n"
done

# Expected: First 10 succeed (200), 11th fails (429 Too Many Requests)
```

### Server Resource Monitoring

```bash
# Monitor CPU and memory during load test
watch -n 1 'ps aux | grep node'

# Monitor disk I/O
watch -n 1 'iostat -x 1 1'

# Monitor open file descriptors
watch -n 1 'lsof | wc -l'
```

---

## Scenario 4: Page Load Performance (feedback page with 5 attachments)

**Objective**: Ensure feedback detail pages load quickly even with multiple attachments.

**Target**: <2 seconds (Time to Interactive)

### Test Steps

1. **Setup**:
   - Create feedback with 5 attachments (mix of images and PDFs)
   - Note the feedback ID (e.g., `fb_01HZXABC`)

2. **Lighthouse Audit**:
   - Open Chrome DevTools
   - Navigate to **Lighthouse** tab
   - Select categories: Performance, Accessibility
   - Click "Analyze page load"

3. **Test URL**: `http://localhost:3000/feedback/fb_01HZXABC`

4. **Record Metrics**:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Cumulative Layout Shift (CLS)
   - Total page size
   - Number of requests

### Expected Results

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|------------------|------|
| FCP | <1.0s | <1.8s | 1.8-3.0s | >3.0s |
| LCP | <1.5s | <2.5s | 2.5-4.0s | >4.0s |
| TTI | <2.0s | <3.8s | 3.8-7.3s | >7.3s |
| CLS | <0.1 | <0.1 | 0.1-0.25 | >0.25 |
| Total Size | <2MB | <2MB | 2-5MB | >5MB |

### Lighthouse Test

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run performance audit
lighthouse http://localhost:3000/feedback/fb_01HZXABC \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse-report.json

# View report
lighthouse http://localhost:3000/feedback/fb_01HZXABC \
  --view
```

### WebPageTest

1. Go to https://www.webpagetest.org/
2. Enter URL: `http://localhost:3000/feedback/fb_01HZXABC`
3. Test Location: Multiple locations (Dulles, London, Tokyo)
4. Browser: Chrome
5. Connection: Cable (5 Mbps down, 1 Mbps up)
6. Run test (3 runs)
7. Analyze waterfall chart, filmstrip view, and metrics

### Performance Optimization Checklist

If page load is slow, check:

- ✅ **Images are lazy loaded** (use `loading="lazy"`)
- ✅ **Images are optimized** (WebP format, compressed)
- ✅ **Thumbnails are generated** (not loading full-size images)
- ✅ **Attachments are paginated** (if >10 attachments)
- ✅ **Static assets are cached** (Cache-Control headers)
- ✅ **Code splitting** (only load attachment viewer when needed)

---

## Scenario 5: Image Thumbnail Generation (if implemented)

**Objective**: Verify thumbnail generation is fast and doesn't block UI.

**Target**: <500ms per image

### Test Steps

1. **Setup**:
   - Upload 5 large images (10MB each)
   - Navigate to feedback detail page

2. **Measure Thumbnail Generation Time**:
   - Open DevTools > Performance tab
   - Click "Record"
   - Load feedback page with attachments
   - Stop recording
   - Search for thumbnail generation functions

3. **Check Network Tab**:
   - Are thumbnails served from cache?
   - Are thumbnails generated on-the-fly or pre-generated?

### Expected Results

| Image Size | Thumbnail Size | Target | Status |
|-----------|----------------|--------|--------|
| 10 MB (4000x3000) | 200x150 | <500ms | ⏸️ Not tested |
| 5 MB (3000x2000) | 200x150 | <300ms | ⏸️ Not tested |
| 1 MB (1920x1080) | 200x150 | <100ms | ⏸️ Not tested |

### Thumbnail Generation Strategies

**Option 1: Client-side (Canvas API)** - CURRENT IMPLEMENTATION
- Pros: No server load, immediate preview
- Cons: Higher memory usage on client

**Option 2: Server-side (Sharp library)** - RECOMMENDED FOR PRODUCTION
- Pros: Consistent quality, can be cached
- Cons: Requires server CPU

**Option 3: CDN (Cloudinary, Imgix)**
- Pros: Automatic optimization, global CDN
- Cons: External dependency, cost

### Test Thumbnail Generation Performance

```javascript
// Browser console test
(async function testThumbnailGeneration() {
  const image = new Image();
  image.src = '/uploads/feedback/fb_01HZXABC/01HZXDEF.jpg';

  const startTime = performance.now();

  await new Promise((resolve) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Resize to thumbnail
      canvas.width = 200;
      canvas.height = 150;
      ctx.drawImage(image, 0, 0, 200, 150);

      const duration = performance.now() - startTime;
      console.log('Thumbnail generation time:', duration.toFixed(2), 'ms');
      resolve();
    };
  });
})();
```

---

## Automated Test Scripts

### Performance Test Runner

Save as `tests/performance/file-upload-perf.test.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

test.describe('File Upload Performance Tests', () => {
  test('Single 5MB file upload should complete in <3 seconds (WiFi)', async ({ page }) => {
    // Navigate to feedback page
    await page.goto('http://localhost:3000/feedback/new');

    // Throttle network to simulate WiFi
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (10 * 1024 * 1024) / 8, // 10 Mbps
      uploadThroughput: (10 * 1024 * 1024) / 8,
      latency: 10,
    });

    // Create 5MB file
    const fileBuffer = Buffer.alloc(5 * 1024 * 1024);

    // Start timer
    const startTime = Date.now();

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-5mb.jpg',
      mimeType: 'image/jpeg',
      buffer: fileBuffer,
    });

    // Wait for upload completion (check for progress indicator to disappear)
    await page.waitForSelector('text=Complete', { timeout: 5000 });

    // Calculate duration
    const duration = Date.now() - startTime;
    console.log('Upload duration:', duration, 'ms');

    // Assert duration is under 3 seconds
    expect(duration).toBeLessThan(3000);
  });

  test('Multiple files (5x1MB) should upload in <5 seconds', async ({ page }) => {
    await page.goto('http://localhost:3000/feedback/new');

    // Create 5 x 1MB files
    const files = Array.from({ length: 5 }, (_, i) => ({
      name: `test-${i + 1}.jpg`,
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(1 * 1024 * 1024),
    }));

    const startTime = Date.now();

    // Upload all files
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(files);

    // Wait for all uploads to complete
    await page.waitForSelector('text=Complete', { timeout: 10000 });

    const duration = Date.now() - startTime;
    console.log('Multiple file upload duration:', duration, 'ms');

    expect(duration).toBeLessThan(5000);
  });

  test('Feedback page with 5 attachments should load in <2 seconds', async ({ page }) => {
    // Assumes feedback with ID fb_01HZXABC exists with 5 attachments
    const startTime = Date.now();

    await page.goto('http://localhost:3000/feedback/fb_01HZXABC');

    // Wait for page to be fully interactive
    await page.waitForLoadState('networkidle');

    const duration = Date.now() - startTime;
    console.log('Page load duration:', duration, 'ms');

    expect(duration).toBeLessThan(2000);
  });
});
```

### Run Performance Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Run performance tests
npx playwright test tests/performance/file-upload-perf.test.ts

# Run with UI mode to see visual feedback
npx playwright test --ui
```

---

## Performance Benchmarks

### Baseline Measurements

Record baseline performance on a clean system before testing:

| Test Scenario | Baseline | WiFi | 4G | 3G | Status |
|--------------|----------|------|----|----|--------|
| 5MB upload | N/A | 2.1s | 5.4s | 25s | ⏸️ Not tested |
| 10MB upload | N/A | 4.3s | 10.8s | 50s | ⏸️ Not tested |
| 5x5MB uploads (parallel) | N/A | 8.7s | 30s | 120s | ⏸️ Not tested |
| Page load (5 attachments) | N/A | 1.4s | 2.1s | 5.3s | ⏸️ Not tested |
| Thumbnail generation | N/A | 120ms | 120ms | 120ms | ⏸️ Not tested |

### Real-World Test Results

**To be filled during testing**:

| Date | Tester | Scenario | Result | Pass/Fail | Notes |
|------|--------|----------|--------|-----------|-------|
| 2025-10-09 | TBD | 5MB WiFi | TBD | ⏸️ | |
| 2025-10-09 | TBD | 10MB WiFi | TBD | ⏸️ | |
| 2025-10-09 | TBD | 5x5MB | TBD | ⏸️ | |
| 2025-10-09 | TBD | Page load | TBD | ⏸️ | |
| 2025-10-09 | TBD | 10 concurrent | TBD | ⏸️ | |

---

## Performance Optimization Recommendations

Based on test results, consider these optimizations:

### High Impact
1. **Image Compression** (Task #28):
   - Auto-compress images >2MB before upload
   - Use Canvas API to resize to max 1920px width
   - Target: 85% JPEG quality

2. **Chunked Uploads** (Future):
   - Upload large files in chunks (e.g., 1MB chunks)
   - Enable resume on network failure
   - Better progress accuracy

3. **Lazy Loading**:
   - Load attachments only when scrolled into view
   - Use Intersection Observer API

### Medium Impact
4. **WebP Conversion**:
   - Convert uploaded images to WebP format (smaller size)
   - Fallback to JPEG for unsupported browsers

5. **CDN Integration**:
   - Serve attachments from CDN (Cloudflare, Vercel Edge)
   - Reduce latency for global users

6. **Caching Headers**:
   - Set `Cache-Control: public, max-age=31536000` for attachments
   - Attachments are immutable (use ULID filenames)

### Low Impact
7. **HTTP/2 Server Push**:
   - Push attachment thumbnails with page HTML
   - Requires HTTP/2 server configuration

8. **Service Worker**:
   - Cache frequently viewed attachments
   - Offline support for previously viewed feedback

---

## Monitoring & Alerts

### Production Monitoring

Set up alerts for performance degradation:

**Metrics to Monitor**:
- Average upload time (p50, p95, p99)
- Upload success rate (target: >99%)
- Page load time for feedback pages (target: <2s)
- Server CPU usage during uploads (alert at >80%)
- Storage usage (alert at 80% capacity)

**Tools**:
- **Application Performance Monitoring (APM)**: New Relic, Datadog
- **Real User Monitoring (RUM)**: Google Analytics, Sentry
- **Server Monitoring**: Prometheus, Grafana

### Sample Prometheus Queries

```promql
# Average upload time (last 1 hour)
avg(file_upload_duration_seconds) by (file_size_mb)

# Upload success rate
sum(rate(file_upload_success_total[5m])) / sum(rate(file_upload_attempts_total[5m]))

# 95th percentile upload time
histogram_quantile(0.95, file_upload_duration_seconds_bucket)
```

---

## Appendix: Browser Compatibility

Test upload performance across browsers:

| Browser | Version | Upload Works | Drag & Drop | Progress | Notes |
|---------|---------|--------------|-------------|----------|-------|
| Chrome | 120+ | ✅ | ✅ | ✅ | Best performance |
| Firefox | 121+ | ✅ | ✅ | ✅ | Slightly slower |
| Safari | 17+ | ✅ | ✅ | ✅ | iOS limitations |
| Edge | 120+ | ✅ | ✅ | ✅ | Same as Chrome |
| Mobile Safari | iOS 17+ | ✅ | ⚠️ Limited | ✅ | Camera integration |
| Mobile Chrome | Android 13+ | ✅ | ✅ | ✅ | Good performance |

---

## Test Checklist

Before launching the file upload feature:

- [ ] Run all 5 performance test scenarios
- [ ] Test on Slow 3G, 4G, and WiFi networks
- [ ] Verify targets are met (see Performance Targets section)
- [ ] Test with 10 concurrent users
- [ ] Run Lighthouse audit (score >90)
- [ ] Test on iOS Safari, Android Chrome, Desktop Chrome/Firefox
- [ ] Monitor server resources during load test
- [ ] Verify rate limiting works (10 req/min)
- [ ] Test page load with 5 attachments
- [ ] Measure thumbnail generation time
- [ ] Document any performance issues or optimizations needed

---

## Conclusion

This performance testing plan ensures the file attachment feature meets all performance targets defined in PRD-005. Follow this document during QA testing before the beta rollout (Week 2) and general availability (Week 3).

**Next Steps**:
1. Execute all test scenarios
2. Record results in "Real-World Test Results" table
3. Implement recommended optimizations if targets not met
4. Re-test after optimizations
5. Sign off on performance requirements

---

**Document Version**: 1.0
**Last Updated**: 2025-10-09
**Owner**: QA Team
**Approvers**: Engineering Lead, Product Manager
