# Proposal: Prepare App Store Submission

## Summary
Complete all requirements to successfully submit InfiniteStories to the Apple App Store and pass the App Review process.

## Motivation
- **Launch readiness**: Prepare the app for public release
- **Review compliance**: Meet all Apple App Store Review Guidelines
- **Privacy requirements**: Comply with Apple's privacy manifest requirements (mandatory since Spring 2024)
- **Children's app compliance**: Ensure adherence to Kids Category guidelines

## Current State Analysis

### What's Complete ✓
- App icon set with all required sizes (including 1024x1024 for App Store)
- Basic Info.plist configuration
- Bundle identifier configured: `com.captaindev.InfiniteStories`
- Background modes declared (audio, processing, fetch)
- Microphone usage description
- **Localization**: UI localized for 5 languages (en, es, fr, de, it) via String Catalogs
  - `Localizable.xcstrings` - ~330 UI strings translated
  - `InfoPlist.xcstrings` - App name and permission descriptions localized
- Beta build configuration available
- API-only architecture with proper error handling

### What's Missing

| Requirement | Status | Priority | Notes |
|------------|--------|----------|-------|
| Privacy Manifest (.xcprivacy) | Missing | Critical | Required for UserDefaults, file timestamps, etc. |
| Launch Screen | Using empty dict | High | Need branded launch screen |
| Sign in with Apple | Planned | High | Required if offering third-party auth (see add-sign-in-with-apple change) |
| Privacy Policy URL | Unknown | Critical | Must be hosted and accessible |
| Terms of Service | Unknown | High | Must be hosted and accessible |
| Support URL | Unknown | High | Required for App Store listing |
| App Store Screenshots | Not created | Critical | Need for 6.9", 6.7", 5.5" iPhone + iPad |
| App Store Description | Not created | Critical | Name, subtitle, description, keywords |
| Age Rating Questionnaire | Not completed | Critical | Target 4+ rating |
| Test Coverage | Minimal | Medium | Core services need unit tests |
| Archive/Distribution setup | Unknown | Critical | Signing, provisioning profiles |
| Export Compliance | Not documented | High | Encryption questions for App Review |

## Scope

### Phase 1: Technical Requirements
- Add Privacy Manifest file
- Create proper Launch Screen
- Configure archive/distribution settings
- Fix any build warnings

### Phase 2: App Store Connect Setup
- Create app record in App Store Connect
- Configure app metadata (name, description, keywords)
- Set up pricing and availability
- Complete age rating questionnaire
- Upload screenshots for all required device sizes

### Phase 3: Legal & Compliance
- Create/link Privacy Policy
- Create/link Terms of Service
- Ensure COPPA compliance (children's app)
- Review content filtering for Kids Category

### Phase 4: Quality Assurance
- Expand test coverage
- Test on multiple devices/iOS versions
- Test offline behavior
- Test edge cases and error handling
- Performance testing

### Phase 5: Submission
- Build and archive release version
- Submit for App Review
- Respond to any review feedback

## Success Criteria
- App builds without warnings in Release configuration
- All required metadata uploaded to App Store Connect
- Privacy manifest includes all required API declarations
- App passes Apple's automated validation checks
- App approved by App Review team

## Risks
- **Review rejection**: May require multiple submission attempts
- **Privacy manifest gaps**: Must declare all required reason APIs
- **Kids Category requirements**: Stricter requirements for children's apps
- **Content policy**: AI-generated content must comply with guidelines

## Related Specs
- `ios-integration` - iOS client configuration
- `backend-auth` - Authentication for review process
