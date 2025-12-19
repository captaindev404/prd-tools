# Tasks: Prepare App Store Submission

## Phase 1: Technical Requirements

### Task 1.1: Create Privacy Manifest file
- [ ] Create `PrivacyInfo.xcprivacy` in the Xcode project
- [ ] Declare `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1`
- [ ] Review codebase for other privacy-sensitive APIs (file timestamps, disk space)
- [ ] Add any additional API declarations needed
- [ ] Set `NSPrivacyTracking` to `false`
- **Validation**: Build succeeds, no privacy manifest warnings

### Task 1.2: Configure Launch Screen
- [ ] Add background color to `UILaunchScreen` in Info.plist
- [ ] Optionally add launch screen image to Assets
- [ ] Test launch screen on multiple device sizes
- **Validation**: App shows branded launch screen on cold start

### Task 1.3: Review and fix build warnings
- [ ] Build in Release configuration
- [ ] Address all compiler warnings
- [ ] Remove any debug-only code paths
- [ ] Ensure no TODO/FIXME in critical paths
- **Validation**: Build completes with zero warnings

### Task 1.4: Verify app icons
- [ ] Confirm 1024x1024 icon exists for App Store
- [ ] Verify all icon sizes have correct dimensions
- [ ] Check icon has no transparency (not allowed)
- [ ] Ensure icon has no rounded corners (system adds them)
- **Validation**: `xcrun altool --validate-app` passes

---

## Phase 2: App Store Connect Setup

### Task 2.1: Create App Store Connect record
- [ ] Log into App Store Connect
- [ ] Create new app with bundle ID `com.captaindev.InfiniteStories`
- [ ] Select primary language
- [ ] Choose primary and secondary categories (Entertainment, Kids)
- **Validation**: App record created and visible in dashboard

### Task 2.2: Configure app information
- [ ] Set app name (max 30 characters)
- [ ] Set subtitle (max 30 characters)
- [ ] Write promotional text (max 170 characters)
- [ ] Write full description (max 4000 characters)
- [ ] Add keywords (max 100 characters, comma-separated)
- **Validation**: All text fields populated and within limits

### Task 2.3: Complete age rating questionnaire
- [ ] Answer all content rating questions
- [ ] Select "Made for Kids" if targeting Kids Category
- [ ] Review generated age rating (target: 4+)
- **Validation**: Age rating displays as expected

### Task 2.4: Create and upload screenshots
- [ ] Take screenshots on iPhone 16 Pro Max (6.9")
- [ ] Take screenshots on iPhone 15 Pro Max (6.7")
- [ ] Take screenshots on iPad Pro 12.9" (if iPad supported)
- [ ] Create at least 3 screenshots per device size
- [ ] Add optional promotional text to screenshots
- **Validation**: All required screenshot slots filled

### Task 2.5: Create app preview video (optional)
- [ ] Record 15-30 second app preview
- [ ] Show key features: hero creation, story generation, audio playback
- [ ] Export in required format and resolution
- [ ] Upload to App Store Connect
- **Validation**: Preview plays correctly in App Store listing preview

---

## Phase 3: Legal & Compliance

### Task 3.1: Create Privacy Policy
- [ ] Draft privacy policy covering:
  - Data collected (email, usage data, AI-generated content)
  - How data is used
  - Data sharing practices (OpenAI API)
  - Data retention policy
  - User rights (deletion, access)
- [ ] Host privacy policy on public URL
- [ ] Add URL to App Store Connect
- [ ] Add URL to app Settings screen
- **Validation**: URL accessible and content complete

### Task 3.2: Create Terms of Service
- [ ] Draft terms covering:
  - Acceptable use
  - Content ownership (user-generated heroes, AI-generated stories)
  - Service limitations
  - Liability disclaimers
- [ ] Host terms on public URL
- [ ] Add URL to App Store Connect
- **Validation**: URL accessible and content complete

### Task 3.3: Review COPPA compliance
- [ ] Verify no personal data collected from children without consent
- [ ] Review parental consent flow if required
- [ ] Ensure no behavioral advertising
- [ ] Document compliance measures
- **Validation**: Compliance checklist completed

### Task 3.4: Review content guidelines
- [ ] Verify content filtering is active for AI-generated content
- [ ] Test content policy with edge cases
- [ ] Document content moderation approach
- **Validation**: No inappropriate content can be generated

---

## Phase 4: Quality Assurance

### Task 4.1: Expand unit test coverage
- [ ] Add tests for HeroRepository
- [ ] Add tests for StoryRepository
- [ ] Add tests for AudioService
- [ ] Add tests for NetworkMonitor
- [ ] Achieve >60% coverage on core services
- **Validation**: All tests pass, coverage report generated

### Task 4.2: Add UI tests for critical flows
- [ ] Test hero creation flow
- [ ] Test story generation flow
- [ ] Test audio playback controls
- [ ] Test sign in/sign up flow
- **Validation**: All UI tests pass on simulator

### Task 4.3: Device testing
- [ ] Test on iPhone SE (smallest screen)
- [ ] Test on iPhone 16 Pro Max (largest screen)
- [ ] Test on iPad if supported
- [ ] Test on oldest supported iOS version
- [ ] Test on latest iOS version
- **Validation**: App functions correctly on all tested devices

### Task 4.4: Offline testing
- [ ] Test app launch without network
- [ ] Verify offline state is properly communicated
- [ ] Test network recovery behavior
- [ ] Verify cached content is accessible
- **Validation**: App handles offline state gracefully

### Task 4.5: Performance testing
- [ ] Profile memory usage during story generation
- [ ] Check for memory leaks during audio playback
- [ ] Verify smooth scrolling in story library
- [ ] Test cold launch time (<2 seconds target)
- **Validation**: No performance regressions identified

---

## Phase 5: Submission

### Task 5.1: Configure signing for distribution
- [ ] Select Apple Developer Team in Xcode
- [ ] Enable automatic signing for Release
- [ ] Verify App ID has required capabilities
- [ ] Generate distribution certificate if needed
- **Validation**: Signing identity valid for distribution

### Task 5.2: Increment version numbers
- [ ] Set `MARKETING_VERSION` (e.g., 1.0.0)
- [ ] Set `CURRENT_PROJECT_VERSION` (e.g., 1)
- [ ] Update version in App Store Connect
- **Validation**: Version numbers match across project and App Store Connect

### Task 5.3: Build and archive
- [ ] Select "Any iOS Device (arm64)" destination
- [ ] Clean build folder
- [ ] Archive (Product > Archive)
- [ ] Validate archive in Organizer
- **Validation**: Archive validates without errors

### Task 5.4: Upload to App Store Connect
- [ ] Distribute archive to App Store Connect
- [ ] Wait for processing to complete
- [ ] Verify build appears in App Store Connect
- **Validation**: Build visible and ready for submission

### Task 5.5: Submit for review
- [ ] Select build for submission
- [ ] Add review notes (test account credentials if needed)
- [ ] Answer export compliance questions
- [ ] Answer content rights questions
- [ ] Submit for App Review
- **Validation**: Status changes to "Waiting for Review"

### Task 5.6: Monitor and respond to review
- [ ] Check status daily for updates
- [ ] Respond promptly to any reviewer questions
- [ ] If rejected, address issues and resubmit
- **Validation**: App status changes to "Ready for Sale"

---

## Dependencies
- Phase 2 depends on Apple Developer Program membership
- Phase 3 requires legal review (external)
- Phase 5 depends on all previous phases
- Task 5.4 depends on Task 5.3

## Parallelizable Work
- Phase 1 tasks can run in parallel
- Phase 2 and Phase 3 can run in parallel
- Phase 4 can run in parallel with Phase 2 and 3
- Screenshot creation (Task 2.4) can parallelize across team members
