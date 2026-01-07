# Tasks: Prepare App Store Submission

## Phase 1: Technical Requirements

### Task 1.1: Create Privacy Manifest file ⚡ HIGH PRIORITY
- [x] Create `PrivacyInfo.xcprivacy` in the InfiniteStories Xcode project root
- [x] Declare `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1` (app-specific data)
- [x] Review codebase for other privacy-sensitive APIs:
  - File timestamp APIs (URLCache for media) - Reason `C617.1` for file timestamp access (Logger cleanup)
  - System boot time (Logger) - Not used
  - Disk space APIs (cache management) - Not used
- [x] Add any additional required API declarations
- [x] Set `NSPrivacyTracking` to `false`
- [x] Set `NSPrivacyTrackingDomains` to empty array
- [x] Set `NSPrivacyCollectedDataTypes` appropriately (email, usage data, product interaction)
- **Validation**: Build succeeds, no privacy manifest warnings in Xcode ✅

### Task 1.2: Configure Launch Screen
- [x] Add background color to `UILaunchScreen` in Info.plist (use brand color from ColorTheme)
- [x] Add app icon image to `UILaunchScreen` configuration
- [ ] Test launch screen on multiple device sizes (iPhone SE, iPhone 16 Pro Max, iPad)
- **Validation**: App shows branded launch screen on cold start (configured ✅, testing pending)

### Task 1.3: Review and fix build warnings
- [x] Build in Release configuration (`xcodebuild -configuration Release`)
- [x] Address critical compiler warnings (deprecated `allowBluetooth` API removed)
- [ ] Remove any debug-only code paths or print statements (minor remaining warnings acceptable)
- [ ] Review TODO/FIXME comments - ensure none in critical paths
- **Validation**: Build completes successfully ✅ (some non-critical warnings remain for Swift 6 migration)

### Task 1.4: Verify app icons ✅ COMPLETED
- [x] Confirm 1024x1024 icon exists for App Store (appicon_1024x1024.png ✓)
- [x] Verify all icon sizes have correct dimensions (all sizes present ✓)
- [x] Check icon has no transparency (PNG format ✓)
- [x] Ensure icon has no rounded corners (system adds them ✓)
- **Validation**: Icons verified in Assets.xcassets/AppIcon.appiconset/

---

## Phase 2: App Store Connect Setup

### Task 2.1: Create App Store Connect record
- [ ] Log into App Store Connect (https://appstoreconnect.apple.com)
- [ ] Navigate to "My Apps" and click "+" to create new app
- [ ] Create new app with bundle ID `com.captaindev.InfiniteStories`
- [ ] Select primary language: English (U.S.)
- [ ] Configure localized info for all 5 supported languages (en, es, fr, de, it)
- [ ] Choose primary category: **Entertainment** (or Education)
- [ ] Choose secondary category: **Kids** (consider carefully - stricter requirements)
- **Validation**: App record created and visible in dashboard

### Task 2.2: Configure app information (all 5 languages)
- [ ] **App Name** (max 30 chars): "InfiniteStories" or "Infinite Stories"
- [ ] **Subtitle** (max 30 chars): "AI Bedtime Stories for Kids" or similar
- [ ] **Promotional Text** (max 170 chars): Highlight key features - personalized heroes, AI stories, audio playback
- [ ] **Description** (max 4000 chars): Full feature list:
  - Create custom heroes with personality traits
  - AI-generated personalized bedtime stories
  - Professional audio narration in 5 languages
  - Beautiful AI-illustrated scenes
  - Reading Journey statistics
  - Custom story events
- [ ] **Keywords** (max 100 chars): bedtime,stories,kids,children,AI,audio,personalized,heroes,fairytales,reading
- [ ] **Support URL**: Add support email or website
- [ ] **Marketing URL** (optional): App website or landing page
- **Validation**: All text fields populated for all 5 languages and within limits

### Task 2.3: Complete age rating questionnaire ⚡ IMPORTANT
- [ ] Navigate to Age Rating section in App Store Connect
- [ ] Answer all content rating questions honestly:
  - Violence: None (bedtime stories are child-safe)
  - Sexual Content: None
  - Profanity: None (content filtered)
  - Medical/Treatment Info: None
  - Realistic Violence: None
  - Mature/Suggestive Themes: None
  - Horror/Fear Themes: None (bedtime stories only)
  - Gambling: None
  - Unrestricted Web Access: None
  - User-Generated Content: **YES** (custom heroes, events)
- [ ] Review generated age rating (target: **4+** or **9+**)
- [ ] Consider Kids Category requirements if targeting children
- **Validation**: Age rating displays as expected (4+ or 9+)

### Task 2.4: Create and upload screenshots ⚡ HIGH PRIORITY
Required device sizes:
- [ ] **6.9" iPhone (2868 x 1320 px or 1320 x 2868 px)** - iPhone 16 Pro Max
- [ ] **6.7" iPhone (2796 x 1290 px or 1290 x 2796 px)** - iPhone 15 Pro Max
- [ ] **5.5" iPhone (2208 x 1242 px or 1242 x 2208 px)** - iPhone 8 Plus (if supporting older devices)
- [ ] **12.9" iPad Pro (2732 x 2048 px or 2048 x 2732 px)** - if iPad supported

Screenshot content (5-10 screenshots per device):
1. Hero creation flow with personality traits
2. Story event selection screen
3. Story generation with AI-illustrated scenes
4. Audio player with lock screen controls
5. Story library with saved stories
6. Reading Journey statistics dashboard
7. Custom event creation (optional)

- [ ] Capture screenshots in all 5 languages (or at least English, Spanish, French)
- [ ] Add optional promotional text overlays
- [ ] Ensure screenshots show diverse content and features
- **Validation**: All required screenshot slots filled for primary device sizes

### Task 2.5: Create app preview video (optional but recommended)
- [ ] Record 15-30 second app preview video showing:
  - Hero creation: User creates a brave princess character
  - Story generation: App generates a personalized bedtime story
  - Audio playback: User plays the story with audio and illustrations
- [ ] Export in required format: H.264 or HEVC, resolution matching device
- [ ] Add to App Store Connect for primary device size
- [ ] Consider creating previews for multiple languages
- **Validation**: Preview plays correctly in App Store listing preview

---

## Phase 3: Legal & Compliance ⚡ CRITICAL

### Task 3.1: Create Privacy Policy ⚡ REQUIRED
- [ ] Draft comprehensive privacy policy covering:
  - **Data Collected**:
    - Account: Email address, Sign in with Apple ID (if implemented)
    - User-Generated Content: Hero characters (name, traits, appearance)
    - Usage Data: Story generation preferences, reading statistics
    - Technical Data: Device type, iOS version, app version
    - AI-Generated Content: Stories, audio files, illustrations
  - **How Data is Used**:
    - Provide core app functionality (story generation)
    - Improve personalization and recommendations
    - Analytics and app improvement
  - **Data Sharing**:
    - OpenAI API: Story text, hero descriptions sent for generation (no personal data)
    - Cloudflare R2: Media storage (illustrations, audio)
    - Backend API: User data stored securely
  - **Data Retention**: User data retained until account deletion
  - **User Rights**: Access, deletion, export (GDPR compliance)
  - **Children's Privacy**: COPPA compliance statement
  - **Security Measures**: Encryption, secure storage
  - **Third-Party Services**: List all services (OpenAI, Cloudflare)
- [ ] Host privacy policy on public URL (GitHub Pages, Vercel, or dedicated domain)
- [ ] Add privacy policy URL to App Store Connect > App Privacy section
- [ ] Add "Privacy Policy" link in app Settings screen
- [ ] Translate privacy policy for all 5 supported languages (or link to English version)
- **Validation**: URL accessible, content complete, legally reviewed (recommended)

### Task 3.2: Create Terms of Service ⚡ REQUIRED
- [ ] Draft terms of service covering:
  - **Account Requirements**: Age restrictions (13+ or with parental consent)
  - **Acceptable Use**: No abuse, harassment, or harmful content generation attempts
  - **Content Ownership**:
    - User owns custom heroes and events
    - AI-generated stories: Joint ownership (user + app)
    - OpenAI usage rights apply to AI content
  - **Service Limitations**: No guarantee of uptime, content quality
  - **Liability Disclaimers**: Not responsible for AI-generated content accuracy
  - **Termination**: Right to terminate accounts for TOS violations
  - **Changes to Terms**: Right to update terms with notice
  - **Governing Law**: Jurisdiction and dispute resolution
- [ ] Host terms on public URL
- [ ] Add terms URL to App Store Connect
- [ ] Add "Terms of Service" link in app Settings screen
- [ ] Require acceptance of terms during first-time signup
- **Validation**: URL accessible, content complete, legally reviewed (recommended)

### Task 3.3: Review COPPA Compliance (Children's Online Privacy Protection Act)
- [ ] **Age Gate**: Verify app requires parent/guardian supervision for children under 13
- [ ] **Parental Consent**: Implement parental consent mechanism if collecting personal data from kids
- [ ] **Data Collection**: Review what data is collected from children:
  - Email: Only from parent/guardian account
  - Usage data: Anonymized and aggregated
  - No location data, photos, or contacts
- [ ] **No Behavioral Advertising**: Confirm no ads or behavioral tracking
- [ ] **Third-Party Services**: Ensure OpenAI doesn't use child data for training
- [ ] **Data Deletion**: Easy process for parents to delete child data
- [ ] **Security**: Strong encryption for all user data
- [ ] Document COPPA compliance measures for App Review notes
- **Validation**: Compliance checklist completed and documented

### Task 3.4: Review Content Guidelines & Content Filtering
- [ ] Verify `ContentPolicyFilter` is active for all AI-generated content (stories, events)
- [ ] Test content filtering with edge cases:
  - Violence-related prompts
  - Inappropriate language
  - Scary/horror themes
  - Sexual content
  - Discriminatory content
- [ ] Review multi-language content filtering (all 5 languages)
- [ ] Test custom event AI enhancement filtering
- [ ] Document content moderation approach for App Review
- [ ] Prepare content moderation policy for App Store Connect
- **Validation**: No inappropriate content can be generated; all edge cases blocked

### Task 3.5: Export Compliance & Encryption Declaration
- [ ] Answer export compliance questions in App Store Connect:
  - Does app use encryption? **YES** (HTTPS, TLS for API calls)
  - Does app use standard encryption? **YES** (iOS-provided encryption APIs)
  - Is encryption exempt? **YES** (using Apple's built-in encryption, no custom crypto)
- [ ] If not exempt, provide export compliance documentation
- **Validation**: Export compliance section completed

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

## Phase 5: Submission ⚡ FINAL PHASE

### Task 5.1: Configure signing for distribution ⚡ CRITICAL
- [ ] Open Xcode project settings (select project in navigator)
- [ ] Select **InfiniteStories** target > Signing & Capabilities tab
- [ ] Select Apple Developer Team (personal or organization)
- [ ] Enable **Automatically manage signing** (recommended)
- [ ] Verify Bundle Identifier: `com.captaindev.InfiniteStories`
- [ ] Verify App ID has required capabilities:
  - Sign in with Apple (if implemented)
  - Background Modes (audio, processing, fetch)
  - Push Notifications (if used)
- [ ] If manual signing: Download and install Distribution Certificate and Provisioning Profile
- [ ] Test signing by archiving (Product > Archive)
- **Validation**: Signing identity valid, archive succeeds without signing errors

### Task 5.2: Set version numbers for release
- [ ] Open Xcode project settings > InfiniteStories target > General tab
- [ ] Set **Version** (`MARKETING_VERSION`): `1.0` or `1.0.0` (semantic versioning)
- [ ] Set **Build** (`CURRENT_PROJECT_VERSION`): `1` (increment for each submission)
- [ ] Ensure version is consistent across all build configurations (Debug, Beta, Release)
- [ ] Update version in App Store Connect to match
- **Validation**: Version numbers consistent across Xcode and App Store Connect

### Task 5.3: Build and archive release version
- [ ] Select scheme: **InfiniteStories**
- [ ] Select destination: **Any iOS Device (arm64)**
- [ ] Select **Release** configuration (or use Product > Archive which auto-selects Release)
- [ ] Clean build folder: Product > Clean Build Folder (⇧⌘K)
- [ ] Archive: Product > Archive (⌃⇧⌘A)
- [ ] Wait for archive to complete (may take 2-5 minutes)
- [ ] Organizer window opens automatically with new archive
- [ ] Click **Validate App** button to run pre-flight checks:
  - App size validation
  - Privacy manifest validation
  - Icon validation
  - Capability validation
- [ ] Fix any validation errors before proceeding
- **Validation**: Archive validates without errors, ready for distribution

### Task 5.4: Upload to App Store Connect
- [ ] In Organizer, select the validated archive
- [ ] Click **Distribute App** button
- [ ] Select **App Store Connect** as distribution method
- [ ] Select **Upload** (not Export)
- [ ] Choose distribution options:
  - Strip Swift symbols: **YES** (reduces size)
  - Upload symbols: **YES** (for crash reports)
  - Manage version and build number: **Automatically** (recommended)
- [ ] Click **Upload**
- [ ] Wait for upload to complete (may take 5-15 minutes depending on size)
- [ ] Receive email notification when processing completes (up to 30 minutes)
- [ ] Log into App Store Connect > My Apps > InfiniteStories
- [ ] Verify build appears under **TestFlight** > **iOS Builds**
- [ ] Wait for build to finish processing (status changes to "Ready to Submit")
- **Validation**: Build visible in App Store Connect with status "Ready to Submit"

### Task 5.5: Submit for App Review ⚡ FINAL STEP
- [ ] In App Store Connect, navigate to InfiniteStories > App Store tab
- [ ] Click **+ Version** or select existing version (1.0)
- [ ] Fill in "What's New in This Version" (release notes):
  - First release: "Welcome to InfiniteStories! Create personalized AI bedtime stories for kids."
- [ ] Click **Build** and select the uploaded build
- [ ] Fill in **App Review Information**:
  - **Sign-in required**: YES (provide test account)
    - Demo email: demo@infinitestories.app
    - Demo password: [create test account password]
  - **Contact Information**: Your email and phone
  - **Notes**: Provide context for reviewers:
    - "App generates AI-powered bedtime stories using OpenAI API"
    - "Content is filtered for child safety using ContentPolicyFilter"
    - "Test account has sample heroes and stories"
    - "Audio playback works in background with lock screen controls"
- [ ] Upload demo account credentials or instructions
- [ ] Answer **Export Compliance**: YES, uses standard encryption (iOS built-in)
- [ ] Answer **Content Rights**: You own or have rights to all content
- [ ] Answer **Advertising Identifier**: NO (not using ads)
- [ ] Review all information for accuracy
- [ ] Click **Submit for Review**
- [ ] Confirm submission in dialog
- **Validation**: App status changes to "Waiting for Review"

### Task 5.6: Monitor review process and respond
- [ ] Check App Store Connect daily for status updates:
  - "Waiting for Review" → "In Review" → "Pending Developer Release" or "Ready for Sale"
- [ ] Respond to Apple emails within 24 hours if reviewer contacts you
- [ ] If status changes to **"Metadata Rejected"** or **"Rejected"**:
  - Read rejection reason carefully in Resolution Center
  - Address all issues mentioned (metadata, content, functionality)
  - Update metadata or submit new build if code changes needed
  - Respond to reviewer with explanation of fixes
  - Resubmit for review
- [ ] If status changes to **"Pending Developer Release"**:
  - Review is approved! App is ready to go live
  - Click **Release This Version** to make live immediately
  - Or schedule release for specific date/time
- [ ] If status changes to **"Ready for Sale"**:
  - Congratulations! App is live on the App Store
  - Monitor user reviews and ratings
  - Prepare for post-launch support
- **Validation**: App status "Ready for Sale" and visible in App Store

### Task 5.7: Post-Submission Checklist
- [ ] Set up App Store Connect notifications (email alerts for status changes)
- [ ] Prepare customer support channels (email, website)
- [ ] Monitor crash reports in Xcode Organizer and App Store Connect
- [ ] Plan for first update based on user feedback
- [ ] Consider submitting to Product Hunt, tech blogs for launch publicity
- **Validation**: Support infrastructure in place

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
