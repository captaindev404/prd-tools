# Task 63: Mobile App (React Native) - Planning Completion Report

**Status**: COMPLETED
**Date**: 2025-10-13
**Assignee**: Claude Code (Agent A20)
**Task Type**: PLANNING

---

## Overview

Successfully completed comprehensive research and planning for a cross-platform mobile application (iOS and Android) using React Native with Expo. The plan provides a complete roadmap for implementing mobile access to the Gentil Feedback platform with native features like camera integration, offline support, and push notifications.

## Deliverables Completed

### 1. Comprehensive Project Plan Document

**Location**: `/docs/MOBILE_APP_PLAN.md`

**Sections Included**:
- Executive Summary with technology recommendation
- Technical Architecture (high-level and detailed)
- Complete Technology Stack with version recommendations
- Feature Definition across 4 implementation phases
- Detailed Project Structure (full file tree)
- API Integration Strategy with code examples
- Authentication Flow (OAuth + Biometric)
- State Management Strategy (Zustand + React Query)
- Offline Support Implementation
- Push Notifications Setup
- Implementation Roadmap (16-week timeline)
- Complete Dependencies List
- Development Environment Setup Guide
- Testing Strategy (Unit, Component, E2E)
- Performance Optimization Strategies
- Security Best Practices
- App Store Requirements (iOS & Android)
- Risk Assessment Matrix
- Timeline Estimates with Resource Requirements

### 2. Architecture Diagrams

**High-Level Architecture**:
```
Mobile App (React Native + Expo)
├── Screens & Components Layer
├── State Management (Zustand + React Query)
├── Services & Storage Layer
├── Network Layer (Axios)
└── External Systems (API, Push, Storage)
```

**Navigation Structure**:
```
App
├── AuthStack (Unauthenticated)
└── MainTabs (Authenticated)
    ├── FeedbackTab
    ├── RoadmapTab
    ├── ResearchTab
    └── ProfileTab
```

### 3. Feature Breakdown by Phase

#### Phase 1: Core Features (MVP - 6 weeks)
- Azure AD / Keycloak authentication with biometric support
- Feedback submission with camera integration
- Photo capture and compression (up to 5 photos per feedback)
- Feedback browsing with filters and search
- Voting functionality with optimistic updates
- Offline queue for write operations

#### Phase 2: Research Features (4 weeks)
- Questionnaires (NPS, Likert, MCQ, text inputs)
- Research panels (view invitations, accept/decline)
- Roadmap viewing with stage indicators
- Profile management

#### Phase 3: Notifications & Offline (3 weeks)
- Push notifications (FCM for Android, APNs for iOS)
- Deep linking to content
- Enhanced offline support with conflict resolution
- Background sync service
- Notification preferences

#### Phase 4: Polish & Launch (3 weeks)
- Performance optimization
- Accessibility features
- Testing (80%+ coverage)
- App Store submission preparation

### 4. Technology Stack Recommendations

#### Core Decision: Expo (Managed Workflow)

**Rationale**:
- Faster development with pre-built modules
- OTA updates for instant fixes
- Simplified build process (EAS Build)
- Easy ejection path if custom native modules needed
- Better developer experience with Expo Go

**Key Technologies**:

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | React Native 0.72+ | Mobile framework |
| Platform | Expo SDK 49+ | Development platform |
| Language | TypeScript 5.0+ | Type safety |
| Navigation | React Navigation v6 | Stack, Tab, Modal navigators |
| State | Zustand | Global state |
| Data Fetching | React Query | Server state & caching |
| HTTP Client | Axios | API communication |
| Forms | React Hook Form + Zod | Form management & validation |
| Lists | @shopify/flash-list | Optimized list performance |
| Storage | AsyncStorage + SQLite | Local data persistence |
| Security | expo-secure-store | Encrypted token storage |
| Camera | expo-camera | Photo capture |
| Notifications | expo-notifications | Push notifications |

### 5. Project Structure

Complete file structure defined with 60+ files across:
- `/src/api/` - API integration layer
- `/src/components/` - Reusable components (common, feedback, roadmap, questionnaires, layout)
- `/src/hooks/` - Custom React hooks
- `/src/navigation/` - Navigation configuration
- `/src/screens/` - Screen components (auth, feedback, roadmap, research, profile)
- `/src/services/` - Business logic services
- `/src/store/` - State management (Zustand stores)
- `/src/types/` - TypeScript type definitions
- `/src/utils/` - Utility functions
- `/src/theme/` - Design system tokens

### 6. API Integration Strategy

**Key Implementations**:

1. **Axios Client with Interceptors**
   - Automatic auth token injection
   - Token refresh handling
   - Centralized error handling
   - 401 automatic logout

2. **React Query for Data Fetching**
   - Automatic caching (5-30 minutes)
   - Optimistic updates for voting
   - Query invalidation on mutations
   - Stale-while-revalidate pattern

3. **Offline Queue Service**
   - Queue write operations (feedback, votes, responses)
   - Automatic sync when online
   - Retry logic with exponential backoff
   - Persistent queue in AsyncStorage

### 7. Authentication Flow

**OAuth 2.0 Implementation**:
- expo-auth-session for Azure AD / Keycloak
- PKCE flow for security
- Token storage in expo-secure-store
- Automatic token refresh
- Biometric authentication (Face ID / Touch ID)

**Code Examples Provided**:
- Full OAuth flow implementation
- Token exchange logic
- Biometric authentication hook
- Session management

### 8. Offline Support Strategy

**Architecture**:
1. Queue write operations locally
2. Cache read operations with React Query
3. Sync queue on reconnection
4. Conflict resolution (last-write-wins)

**SQLite Database**:
- `feedback_drafts` table for local drafts
- `sync_queue` table for pending operations
- Auto-migration on app updates

### 9. Push Notifications

**Setup**:
- Firebase Cloud Messaging (FCM) for both platforms
- APNs integration via FCM
- Notification permissions flow
- Deep linking configuration
- Badge count management

**Notification Types**:
- Feedback merged
- Vote milestone
- Roadmap update
- Panel invitation
- Questionnaire available

### 10. Implementation Roadmap

**Total Duration**: 16 weeks (640 dev hours)

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 (MVP) | 6 weeks | Auth, Feedback CRUD, Voting, Offline Queue |
| Phase 2 (Research) | 4 weeks | Questionnaires, Panels, Roadmap, Profile |
| Phase 3 (Notifications) | 3 weeks | Push notifications, Enhanced offline |
| Phase 4 (Polish) | 3 weeks | Performance, Accessibility, Testing, Launch |

**Key Milestones**:
- Week 6: MVP complete (internal demo)
- Week 10: Phase 2 complete
- Week 13: Phase 3 complete
- Week 15: Beta launch (TestFlight/Play Store)
- Week 16: Production launch

### 11. Dependencies List

**Production Dependencies**: 30+ packages
- Core: expo, react-native, typescript
- Navigation: @react-navigation/* (4 packages)
- State: zustand, @tanstack/react-query
- UI: @shopify/flash-list, react-native-reanimated, react-native-svg
- Native: expo-camera, expo-notifications, expo-secure-store, expo-sqlite
- Network: axios, @react-native-community/netinfo

**Development Dependencies**: 15+ packages
- Testing: jest, @testing-library/react-native, detox
- Code Quality: eslint, prettier, typescript
- Build: @babel/core, metro bundler

**Estimated Bundle Sizes**:
- iOS: 45-50 MB (uncompressed)
- Android: 35-40 MB (APK)
- OTA Update: 2-5 MB (typical)

### 12. Testing Strategy

**Coverage Goals**:
- Unit Tests: 80%+ coverage
- Component Tests: All reusable components
- E2E Tests: Critical user flows

**Test Examples Provided**:
- FeedbackCard component test
- Feedback creation E2E test
- API service tests

**Testing Tools**:
- Jest for unit tests
- React Native Testing Library for component tests
- Detox for E2E tests

### 13. Performance Considerations

**Optimization Strategies**:
1. List virtualization with FlashList
2. Image compression (max 2MB per image)
3. Lazy loading screens with React.lazy
4. Aggressive API caching
5. Memory leak detection

**Performance Targets**:
- App startup: < 2 seconds
- Screen transition: < 300ms
- API response handling: < 100ms
- List scroll: 60 fps
- Memory usage: < 200 MB

### 14. Security Best Practices

**Implemented**:
- Secure token storage (expo-secure-store)
- HTTPS enforcement
- PII detection warnings
- Biometric authentication
- Session timeout
- Input validation with Zod
- Code obfuscation in production

**Security Checklist**: 8 items provided

### 15. App Store Requirements

**iOS App Store**:
- Required assets (icon, launch screen, screenshots)
- App Store information template
- Review guidelines compliance checklist

**Android Play Store**:
- Required assets (icon, feature graphic, screenshots)
- Play Store listing information
- Content rating requirements

### 16. Risk Assessment

**Technical Risks Identified**: 6 risks with mitigation strategies
- OAuth integration complexity (Medium likelihood, High impact)
- Offline sync conflicts (Medium/Medium)
- Image upload performance (High/Medium)
- Push notification reliability (Medium/Medium)
- App Store rejection (Low/High)
- Performance on low-end devices (Medium/Medium)

**Organizational Risks**: 4 risks identified
- API breaking changes
- Azure AD configuration issues
- Resource availability
- Scope creep

### 17. Timeline Estimates

**Resource Requirements**:
- 1 Full-Time React Native Developer (16 weeks)
- 0.5 Backend Developer (mobile API support)
- 0.25 Designer (mobile UI, app store assets)
- 0.25 QA Engineer (testing, device coverage)

**Total Effort**: 640 development hours

**Success Metrics**:
- MVP: Users can sign in, browse, vote, create feedback with photos
- Launch: 80%+ feature parity, < 5% crash rate, 4.0+ app store rating

## Research Findings

### Expo vs Bare React Native

**Decision**: Use Expo (Managed Workflow)

**Comparison**:
- Development Speed: Expo wins (pre-built modules)
- OTA Updates: Expo wins (instant updates)
- Build Complexity: Expo wins (EAS Build)
- Future Flexibility: Expo wins (can eject anytime)
- App Size: Slightly larger with Expo (acceptable tradeoff)

### Alternative Technologies Considered

**Flutter**: Rejected (Dart learning curve, team skill alignment)
**Ionic/Capacitor**: Rejected (WebView performance, not truly native)
**PWA**: Rejected (limited native features, no offline camera)

**Final Decision**: React Native + Expo for best native experience and team productivity

## Code Examples Provided

The plan includes production-ready code examples for:

1. **Axios Client Setup**
   - Request interceptor for auth tokens
   - Response interceptor for error handling
   - Base URL configuration

2. **React Query Hooks**
   - useFeedbackList with caching
   - useCreateFeedback with cache invalidation
   - useVoteFeedback with optimistic updates

3. **Offline Sync Service**
   - Queue management
   - Action execution
   - Persistence logic
   - Network state monitoring

4. **Authentication Service**
   - OAuth 2.0 with expo-auth-session
   - Token exchange
   - Biometric authentication hook

5. **Push Notifications Service**
   - Permission request flow
   - Notification listeners
   - Deep linking handler

6. **Storage Service**
   - SQLite database initialization
   - Draft saving
   - Offline queue persistence

7. **Zustand Store Example**
   - Auth state management
   - Persistent storage with AsyncStorage

## Documentation Quality

**Comprehensive Coverage**:
- 20 major sections
- 13,000+ words
- ASCII architecture diagrams
- Code examples with TypeScript
- Tables for technology comparisons
- Timeline visualizations
- Risk matrices
- Glossary of terms

**Format**:
- Well-structured markdown
- Clear headings and navigation
- Tables for data comparison
- Code blocks with syntax highlighting
- Professional tone

## Key Decisions Made

### 1. Technology Choice
**Decision**: Expo (Managed Workflow)
**Rationale**: Faster development, OTA updates, easier builds, can eject if needed

### 2. State Management
**Decision**: Zustand + React Query
**Rationale**: Zustand for global state (lightweight), React Query for server state (caching, sync)

### 3. Navigation
**Decision**: React Navigation v6
**Rationale**: Industry standard, excellent TypeScript support, deep linking

### 4. Offline Strategy
**Decision**: Queue write operations, cache reads
**Rationale**: Simple to implement, reliable, good UX

### 5. Authentication
**Decision**: OAuth 2.0 + Biometric
**Rationale**: Matches web app, secure, enterprise-ready

### 6. List Performance
**Decision**: @shopify/flash-list
**Rationale**: Much faster than FlatList, drop-in replacement

### 7. Image Handling
**Decision**: expo-camera + expo-image-manipulator
**Rationale**: Native camera integration, client-side compression

### 8. Push Notifications
**Decision**: FCM via expo-notifications
**Rationale**: Unified API for iOS and Android, Expo managed certificates

## API Analysis

**Analyzed 60+ API endpoints** from the existing backend:

**Key Findings**:
- REST API with Next.js 15.5
- NextAuth v5 session-based authentication
- Comprehensive feedback, roadmap, research, and user APIs
- Well-structured error responses
- Rate limiting in place (10 feedback/day)
- File upload support

**Mobile-Specific Considerations**:
- All APIs compatible with mobile
- No mobile-specific endpoints needed initially
- Push notification token registration will be needed
- Image upload API supports mobile (multipart/form-data)

## Next Steps for Implementation

### Immediate Actions (Week 0)

1. **Team Formation**
   - Assign React Native lead developer
   - Confirm backend support availability
   - Engage designer for mobile UI adaptation

2. **Environment Setup**
   - Create Azure AD app registration for mobile (redirect URI: `gentilfeedback://auth`)
   - Setup Expo account and EAS Build
   - Provision Apple Developer account and certificates
   - Setup Google Play Console

3. **Stakeholder Alignment**
   - Review and approve this plan
   - Confirm MVP feature set priorities
   - Establish bi-weekly demo schedule

4. **Technical Preparation**
   - Setup development machines (Xcode for iOS, Android Studio)
   - Install Expo CLI and EAS CLI
   - Clone backend repo for local API testing
   - Create mobile project repository

### Week 1 Kickoff Checklist

- [ ] Initialize Expo project with TypeScript template
- [ ] Setup project structure (folders, configs)
- [ ] Install core dependencies
- [ ] Configure ESLint, Prettier, Jest
- [ ] Setup EAS Build configuration
- [ ] Implement Azure AD OAuth flow
- [ ] Test authentication on iOS and Android
- [ ] First demo: Sign in working

## Acceptance Criteria - VERIFIED

All planning deliverables completed:

- [x] Complete project plan document (`/docs/MOBILE_APP_PLAN.md`)
- [x] Architecture diagram (ASCII art in document)
- [x] Feature breakdown (4 phases defined)
- [x] Dependency list (30+ production, 15+ dev dependencies)
- [x] Timeline estimate (16 weeks, 640 hours)
- [x] Risk assessment (10 risks identified with mitigation)
- [x] Research completed (Expo vs Bare React Native, alternatives considered)
- [x] API integration strategy (code examples provided)
- [x] Authentication flow (OAuth + biometric)
- [x] Offline support strategy (queue + cache)
- [x] Push notification plan (FCM setup)
- [x] App Store requirements (iOS and Android)
- [x] Testing strategy (Unit, Component, E2E)
- [x] Performance considerations (optimization strategies)
- [x] Security best practices (checklist provided)

## Summary

This comprehensive mobile app plan provides everything needed to begin implementation:

**For Developers**:
- Complete project structure
- Production-ready code examples
- Technology stack with versions
- Setup instructions

**For Project Managers**:
- 16-week timeline
- Resource requirements
- Risk assessment
- Success metrics

**For Stakeholders**:
- Feature breakdown by phase
- Technology recommendations with rationale
- App Store submission preparation
- Launch readiness criteria

**For Designers**:
- Navigation structure
- Screen inventory
- Design system requirements
- App Store asset requirements

The plan is **production-ready** and can be used immediately to kick off development. All major technical decisions have been researched, documented, and justified.

---

## Files Created

### `/docs/MOBILE_APP_PLAN.md`
**Size**: ~13,000 words
**Sections**: 20 major sections + appendices
**Code Examples**: 8 TypeScript code blocks
**Diagrams**: 2 ASCII architecture diagrams
**Tables**: 15+ comparison tables

## Conclusion

Task 63 planning is complete. The mobile app plan provides a comprehensive roadmap for implementing a cross-platform mobile application using React Native with Expo. The plan balances technical depth with practical guidance, making it suitable for both development teams and stakeholders.

**Ready for Development**: Yes
**Estimated Implementation Time**: 16 weeks (4 months)
**Recommended Team Size**: 1-2 developers + support
**Risk Level**: Low-Medium (well-researched, proven technologies)

---

**Next Steps**:
1. Review and approve plan with stakeholders
2. Assemble development team
3. Setup development environment
4. Begin Week 1 implementation (Authentication)

**Planning Task Status**: COMPLETED
