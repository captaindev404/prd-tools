# Mobile App Implementation Plan - React Native

**Project**: Gentil Feedback Mobile Application
**Version**: 1.0.0
**Status**: PLANNING PHASE
**Date**: 2025-10-13
**Platform**: iOS & Android (React Native)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technical Architecture](#technical-architecture)
3. [Technology Stack](#technology-stack)
4. [Feature Definition](#feature-definition)
5. [Project Structure](#project-structure)
6. [API Integration Strategy](#api-integration-strategy)
7. [Authentication Flow](#authentication-flow)
8. [State Management](#state-management)
9. [Offline Support](#offline-support)
10. [Push Notifications](#push-notifications)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Dependencies](#dependencies)
13. [Development Environment Setup](#development-environment-setup)
14. [Testing Strategy](#testing-strategy)
15. [Performance Considerations](#performance-considerations)
16. [Security](#security)
17. [App Store Requirements](#app-store-requirements)
18. [Risk Assessment](#risk-assessment)
19. [Timeline Estimates](#timeline-estimates)
20. [Next Steps](#next-steps)

---

## Executive Summary

This document outlines the comprehensive plan for developing a cross-platform mobile application for the Gentil Feedback platform using React Native. The mobile app will provide Club Med employees with native iOS and Android experiences for submitting feedback, voting, viewing roadmaps, and participating in research activities.

### Key Objectives

- Provide seamless mobile access to core feedback features
- Enable photo capture and upload for feedback submissions
- Support offline usage with background synchronization
- Implement push notifications for real-time updates
- Maintain security and authentication standards
- Ensure optimal performance on both iOS and Android

### Recommendation: Expo (Managed Workflow)

After analyzing the project requirements and existing backend architecture, we recommend using **Expo** with the managed workflow for the following reasons:

1. **Faster Development**: Expo provides pre-built modules for camera, notifications, storage, and more
2. **OTA Updates**: Push updates without App Store review for non-native code changes
3. **Simplified Builds**: EAS Build handles iOS and Android builds in the cloud
4. **Easy Ejection Path**: Can eject to bare React Native if needed
5. **Better DX**: Expo Go for rapid development and testing
6. **Native Module Support**: Expo SDK includes most needed native modules

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Application                    │
│                    (React Native + Expo)                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Screens     │  │  Components  │  │  Navigation  │ │
│  │  - Feedback  │  │  - UI Kit    │  │  - Stacks    │ │
│  │  - Voting    │  │  - Forms     │  │  - Tabs      │ │
│  │  - Profile   │  │  - Cards     │  │  - Modals    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ State Mgmt   │  │  Services    │  │   Storage    │ │
│  │ - Zustand    │  │  - API       │  │  - AsyncStor │ │
│  │ - React      │  │  - Auth      │  │  - SQLite    │ │
│  │   Query      │  │  - Upload    │  │  - SecureStor│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                  Network Layer (Axios)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  REST API    │  │  Push Notif  │  │  File Upload │ │
│  │  (Next.js)   │  │  (FCM/APNs)  │  │  (S3/Local)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

#### 1. Navigation Structure

**React Navigation v6** - Stack, Tab, and Modal navigators

```
App
├── AuthStack (Unauthenticated)
│   ├── SignIn
│   └── Error
└── MainTabs (Authenticated)
    ├── FeedbackTab
    │   ├── FeedbackList
    │   ├── FeedbackDetail
    │   ├── CreateFeedback (Modal)
    │   └── EditFeedback (Modal)
    ├── RoadmapTab
    │   ├── RoadmapList
    │   └── RoadmapDetail
    ├── ResearchTab
    │   ├── Questionnaires
    │   ├── Panels
    │   └── Sessions
    └── ProfileTab
        ├── Profile
        ├── Settings
        ├── Panels
        └── Notifications
```

#### 2. State Management Strategy

**Combination Approach**:
- **Zustand**: Global app state (user, settings, offline queue)
- **React Query**: Server state (API data, caching, synchronization)
- **React Context**: Theme, localization, feature flags
- **Local State**: Component-specific UI state

#### 3. Data Flow Pattern

```
User Action → Component → React Query → API Service
                            ↓
                       Cache Update
                            ↓
                      UI Re-render
                            ↓
                   Persist to Storage (if needed)
```

---

## Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.72+ | Mobile framework |
| Expo SDK | 49+ | Development platform |
| TypeScript | 5.0+ | Type safety |
| Node.js | 18.18+ | Development environment |

### Navigation & Routing

| Package | Purpose |
|---------|---------|
| @react-navigation/native | Core navigation |
| @react-navigation/native-stack | Stack navigator |
| @react-navigation/bottom-tabs | Tab navigator |
| @react-navigation/material-top-tabs | Top tab navigator (for roadmap stages) |

### State Management & Data Fetching

| Package | Purpose |
|---------|---------|
| zustand | Global state management |
| @tanstack/react-query | Server state & caching |
| axios | HTTP client |
| react-hook-form | Form management |
| zod | Schema validation |

### UI Components & Styling

| Package | Purpose |
|---------|---------|
| @shopify/flash-list | Optimized lists |
| react-native-reanimated | Animations |
| react-native-gesture-handler | Touch gestures |
| react-native-svg | SVG support |
| expo-linear-gradient | Gradients |

### Native Features

| Package | Purpose |
|---------|---------|
| expo-camera | Camera access |
| expo-image-picker | Photo library |
| expo-image-manipulator | Image resize/compress |
| expo-notifications | Push notifications |
| expo-secure-store | Secure token storage |
| @react-native-async-storage/async-storage | Async storage |
| expo-sqlite | Local database |
| expo-file-system | File operations |

### Authentication & Security

| Package | Purpose |
|---------|---------|
| expo-auth-session | OAuth flows |
| expo-web-browser | In-app browser |
| expo-secure-store | Token encryption |
| react-native-keychain | Additional security |

### Developer Tools

| Package | Purpose |
|---------|---------|
| eslint | Code linting |
| prettier | Code formatting |
| jest | Unit testing |
| @testing-library/react-native | Component testing |
| detox | E2E testing |

---

## Feature Definition

### Phase 1: Core Features (MVP - Weeks 1-6)

#### 1.1 Authentication
- Azure AD / Keycloak SSO integration
- Secure token storage
- Automatic token refresh
- Biometric authentication (Face ID / Touch ID)
- Session management

**Screens**:
- Sign In
- Auth Loading
- Error Handling

**Acceptance Criteria**:
- Users can sign in with Club Med credentials
- Sessions persist across app restarts
- Secure token storage in Expo SecureStore
- Automatic logout on token expiration

#### 1.2 Feedback Submission
- Create new feedback with title and body
- Camera integration for photo capture
- Photo library access
- Image compression (max 2MB per image)
- Attach up to 5 photos
- Select product area
- Link to feature (optional)
- Draft auto-save
- Offline queue support

**Screens**:
- Create Feedback (Modal)
- Camera View
- Photo Preview

**Acceptance Criteria**:
- Users can create feedback with photos
- Photos compressed automatically
- Works offline (queued for sync)
- PII redaction warnings
- Character count validation

#### 1.3 Feedback Browsing
- List all public feedback
- Filter by state, area, village
- Search functionality
- Sort by date or votes
- Infinite scroll / pagination
- Pull-to-refresh
- Vote count display
- Feedback detail view

**Screens**:
- Feedback List
- Feedback Detail
- Filter Modal
- Search Screen

**Acceptance Criteria**:
- Fast, smooth scrolling (FlashList)
- Efficient pagination
- Real-time vote updates
- Cached data for offline viewing

#### 1.4 Voting
- Cast vote on feedback
- Remove vote
- Visual vote count
- Weighted voting calculation
- Vote animation
- Optimistic updates

**Screens**:
- (Integrated in Feedback Detail)

**Acceptance Criteria**:
- One-tap voting
- Immediate UI feedback
- Proper error handling
- Vote weight visible to PMs

### Phase 2: Research Features (Weeks 7-10)

#### 2.1 Questionnaires
- View available questionnaires
- Complete surveys in-app
- NPS, Likert, MCQ, text inputs
- Progress indicator
- Draft saving
- Submit responses
- View response confirmation

**Screens**:
- Questionnaires List
- Questionnaire Detail
- Question Screen (stepper)
- Completion Screen

**Acceptance Criteria**:
- Responsive form controls
- Validation before submission
- Works offline (queue submission)
- Progress saved locally

#### 2.2 Research Panels
- View panel invitations
- Accept/decline invitations
- View panel memberships
- Panel details and requirements

**Screens**:
- Panels List
- Panel Detail
- Invitation Modal

**Acceptance Criteria**:
- Push notifications for invitations
- Clear acceptance flow
- Status tracking

#### 2.3 Roadmap Viewing
- Browse roadmap items by stage
- Filter by product area
- Roadmap detail view
- Progress tracking
- Linked feedback
- Jira ticket references

**Screens**:
- Roadmap List (with stage tabs)
- Roadmap Detail

**Acceptance Criteria**:
- Visual stage indicators
- Smooth tab transitions
- Detailed progress view

### Phase 3: Notifications & Offline (Weeks 11-13)

#### 3.1 Push Notifications
- FCM setup (Android)
- APNs setup (iOS)
- Notification permissions
- Deep linking to content
- Notification settings
- Badge count management

**Types**:
- Feedback merged
- Vote milestone
- Roadmap update
- Panel invitation
- Questionnaire available

**Screens**:
- Notifications List
- Notification Settings

**Acceptance Criteria**:
- Reliable notification delivery
- Deep links work correctly
- User can customize preferences
- Badge updates accurately

#### 3.2 Offline Support
- Queue feedback submissions
- Queue votes
- Queue questionnaire responses
- Sync on reconnect
- Conflict resolution
- Sync status indicator
- Cached API responses
- Offline indicator banner

**Technical**:
- SQLite for offline data
- AsyncStorage for queue
- Network state monitoring
- Background sync

**Acceptance Criteria**:
- All writes work offline
- Automatic sync when online
- Clear sync status
- No data loss

#### 3.3 Profile Management
- View user profile
- Edit display name
- Avatar upload
- Village history
- Consent management
- Notification preferences
- Language selection
- Data export (GDPR)
- Account deletion

**Screens**:
- Profile View
- Edit Profile
- Settings
- Consents
- Data Privacy

**Acceptance Criteria**:
- Profile updates sync to backend
- Consent changes tracked
- Data export generates file
- Account deletion confirmed

### Phase 4: Polish & Performance (Weeks 14-16)

#### 4.1 Performance Optimization
- Image lazy loading
- List virtualization
- Bundle size optimization
- Memory leak detection
- Startup time optimization
- API response caching

#### 4.2 Error Handling
- Network error recovery
- API error messages
- Retry mechanisms
- Offline mode explanations
- User-friendly error UI

#### 4.3 Accessibility
- Screen reader support
- Font scaling
- High contrast mode
- Touch target sizes
- Focus management

#### 4.4 Testing & QA
- Unit test coverage (80%+)
- Component tests
- E2E tests (critical flows)
- Device testing matrix
- Performance testing
- Security audit

---

## Project Structure

```
mobile-app/
├── .expo/                      # Expo config
├── .github/                    # GitHub Actions CI/CD
├── android/                    # Android native code (if ejected)
├── ios/                        # iOS native code (if ejected)
├── assets/                     # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
├── src/
│   ├── api/                    # API integration
│   │   ├── client.ts           # Axios instance
│   │   ├── auth.ts             # Auth endpoints
│   │   ├── feedback.ts         # Feedback endpoints
│   │   ├── roadmap.ts          # Roadmap endpoints
│   │   ├── questionnaires.ts   # Questionnaire endpoints
│   │   └── users.ts            # User endpoints
│   ├── components/             # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── feedback/
│   │   │   ├── FeedbackCard.tsx
│   │   │   ├── FeedbackForm.tsx
│   │   │   ├── VoteButton.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── roadmap/
│   │   │   ├── RoadmapCard.tsx
│   │   │   └── StageIndicator.tsx
│   │   ├── questionnaires/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── NPSInput.tsx
│   │   │   ├── LikertScale.tsx
│   │   │   └── MCQOption.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── TabBar.tsx
│   │       └── OfflineBanner.tsx
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useFeedback.ts
│   │   ├── useVoting.ts
│   │   ├── useImagePicker.ts
│   │   ├── useOffline.ts
│   │   └── useNotifications.ts
│   ├── navigation/             # Navigation configuration
│   │   ├── AppNavigator.tsx    # Root navigator
│   │   ├── AuthStack.tsx       # Auth flow
│   │   ├── MainTabs.tsx        # Main tabs
│   │   ├── FeedbackStack.tsx   # Feedback screens
│   │   └── linking.ts          # Deep linking config
│   ├── screens/                # Screen components
│   │   ├── auth/
│   │   │   ├── SignInScreen.tsx
│   │   │   └── ErrorScreen.tsx
│   │   ├── feedback/
│   │   │   ├── FeedbackListScreen.tsx
│   │   │   ├── FeedbackDetailScreen.tsx
│   │   │   ├── CreateFeedbackScreen.tsx
│   │   │   └── EditFeedbackScreen.tsx
│   │   ├── roadmap/
│   │   │   ├── RoadmapListScreen.tsx
│   │   │   └── RoadmapDetailScreen.tsx
│   │   ├── research/
│   │   │   ├── QuestionnairesScreen.tsx
│   │   │   ├── QuestionnaireDetailScreen.tsx
│   │   │   ├── PanelsScreen.tsx
│   │   │   └── SessionsScreen.tsx
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       ├── SettingsScreen.tsx
│   │       ├── NotificationsScreen.tsx
│   │       └── DataPrivacyScreen.tsx
│   ├── services/               # Business logic services
│   │   ├── authService.ts      # Authentication logic
│   │   ├── storageService.ts   # Local storage
│   │   ├── syncService.ts      # Offline sync
│   │   ├── uploadService.ts    # File uploads
│   │   └── notificationService.ts # Push notifications
│   ├── store/                  # State management
│   │   ├── authStore.ts        # Auth state (Zustand)
│   │   ├── offlineStore.ts     # Offline queue (Zustand)
│   │   └── settingsStore.ts    # App settings (Zustand)
│   ├── types/                  # TypeScript types
│   │   ├── api.ts              # API response types
│   │   ├── feedback.ts         # Feedback types
│   │   ├── user.ts             # User types
│   │   └── navigation.ts       # Navigation types
│   ├── utils/                  # Utility functions
│   │   ├── validation.ts       # Input validation
│   │   ├── formatting.ts       # Date/number formatting
│   │   ├── imageCompression.ts # Image utilities
│   │   ├── piiDetection.ts     # PII warning
│   │   └── constants.ts        # App constants
│   ├── theme/                  # Theming
│   │   ├── colors.ts           # Color palette
│   │   ├── typography.ts       # Font styles
│   │   ├── spacing.ts          # Spacing scale
│   │   └── shadows.ts          # Shadow styles
│   └── App.tsx                 # App entry point
├── .env.development            # Dev environment
├── .env.production             # Prod environment
├── .eslintrc.js                # ESLint config
├── .prettierrc                 # Prettier config
├── app.json                    # Expo config
├── babel.config.js             # Babel config
├── eas.json                    # EAS Build config
├── jest.config.js              # Jest config
├── metro.config.js             # Metro bundler config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # Setup instructions
```

---

## API Integration Strategy

### Base Configuration

**API Base URL**:
- Development: `http://localhost:3000/api`
- Staging: `https://staging.gentil-feedback.com/api`
- Production: `https://gentil-feedback.com/api`

### Axios Client Setup

```typescript
// src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout
      await SecureStore.deleteItemAsync('session_token');
      // Trigger logout flow
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### React Query Integration

```typescript
// src/hooks/useFeedback.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeedback, createFeedback, voteFeedback } from '@/api/feedback';

export function useFeedbackList(filters: FeedbackFilters) {
  return useQuery({
    queryKey: ['feedback', filters],
    queryFn: () => getFeedback(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFeedback,
    onSuccess: () => {
      // Invalidate feedback queries to refetch
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

export function useVoteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedbackId }: { feedbackId: string }) =>
      voteFeedback(feedbackId),
    onMutate: async ({ feedbackId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['feedback', feedbackId] });

      const previousFeedback = queryClient.getQueryData(['feedback', feedbackId]);

      queryClient.setQueryData(['feedback', feedbackId], (old: any) => ({
        ...old,
        userHasVoted: true,
        voteCount: (old?.voteCount || 0) + 1,
      }));

      return { previousFeedback };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['feedback', variables.feedbackId],
        context?.previousFeedback
      );
    },
  });
}
```

### Offline Queue Implementation

```typescript
// src/services/syncService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedAction {
  id: string;
  type: 'CREATE_FEEDBACK' | 'VOTE' | 'SUBMIT_RESPONSE';
  payload: any;
  timestamp: number;
  retries: number;
}

class SyncService {
  private queue: QueuedAction[] = [];
  private isSyncing = false;

  async addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedAction);
    await this.persistQueue();

    // Try to sync immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.sync();
    }
  }

  async sync() {
    if (this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;

    const failures: QueuedAction[] = [];

    for (const action of this.queue) {
      try {
        await this.executeAction(action);
      } catch (error) {
        if (action.retries < 3) {
          failures.push({ ...action, retries: action.retries + 1 });
        }
      }
    }

    this.queue = failures;
    await this.persistQueue();
    this.isSyncing = false;
  }

  private async executeAction(action: QueuedAction) {
    switch (action.type) {
      case 'CREATE_FEEDBACK':
        return await createFeedback(action.payload);
      case 'VOTE':
        return await voteFeedback(action.payload.feedbackId);
      case 'SUBMIT_RESPONSE':
        return await submitQuestionnaireResponse(action.payload);
    }
  }

  private async persistQueue() {
    await AsyncStorage.setItem('sync_queue', JSON.stringify(this.queue));
  }

  async loadQueue() {
    const stored = await AsyncStorage.getItem('sync_queue');
    if (stored) {
      this.queue = JSON.parse(stored);
    }
  }
}

export const syncService = new SyncService();
```

---

## Authentication Flow

### OAuth 2.0 with Azure AD / Keycloak

```typescript
// src/services/authService.ts
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://login.microsoftonline.com/.../oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/.../oauth2/v2.0/token',
};

export async function signInWithAzureAD() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'gentilfeedback',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'YOUR_CLIENT_ID',
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri,
    },
    discovery
  );

  if (response?.type === 'success') {
    const { code } = response.params;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Store securely
    await SecureStore.setItemAsync('session_token', tokens.accessToken);
    await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);

    // Fetch user profile
    const user = await fetchUserProfile(tokens.accessToken);

    return user;
  }

  return null;
}

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const response = await fetch(discovery.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET',
    }),
  });

  return await response.json();
}
```

### Biometric Authentication

```typescript
// src/hooks/useBiometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';

export function useBiometrics() {
  const checkBiometricSupport = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  };

  const authenticate = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access Gentil Feedback',
      fallbackLabel: 'Use passcode',
    });

    return result.success;
  };

  return { checkBiometricSupport, authenticate };
}
```

---

## State Management

### Zustand Store Example

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## Offline Support

### Strategy

1. **Queue Write Operations**: Store feedback, votes, and responses locally
2. **Cache Read Operations**: Use React Query cache for API responses
3. **Background Sync**: Sync queue when connection restored
4. **Conflict Resolution**: Last-write-wins for most operations

### SQLite for Offline Data

```typescript
// src/services/storageService.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('gentil_feedback.db');

export function initDatabase() {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS feedback_drafts (
        id TEXT PRIMARY KEY,
        title TEXT,
        body TEXT,
        attachments TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );`
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT,
        payload TEXT,
        timestamp INTEGER,
        retries INTEGER
      );`
    );
  });
}

export function saveDraft(draft: FeedbackDraft) {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT OR REPLACE INTO feedback_drafts (id, title, body, attachments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          draft.id,
          draft.title,
          draft.body,
          JSON.stringify(draft.attachments),
          draft.createdAt,
          Date.now(),
        ],
        () => resolve(true),
        (_, error) => reject(error)
      );
    });
  });
}
```

---

## Push Notifications

### Firebase Cloud Messaging Setup

**Android**: Uses FCM directly
**iOS**: Uses APNs via FCM

```typescript
// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

export function setupNotificationListeners() {
  // Notification received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    notification => {
      console.log('Notification received:', notification);
    }
  );

  // User tapped notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    response => {
      const data = response.notification.request.content.data;
      // Navigate to relevant screen based on notification type
      handleNotificationPress(data);
    }
  );

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
```

### Deep Linking Configuration

```typescript
// src/navigation/linking.ts
import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['gentilfeedback://', 'https://gentil-feedback.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Feedback: {
            screens: {
              FeedbackDetail: 'feedback/:id',
            },
          },
          Roadmap: {
            screens: {
              RoadmapDetail: 'roadmap/:id',
            },
          },
          Research: {
            screens: {
              QuestionnaireDetail: 'questionnaires/:id',
            },
          },
        },
      },
    },
  },
};
```

---

## Implementation Roadmap

### Phase 1: Core Features (MVP) - 6 Weeks

#### Week 1: Project Setup & Authentication
- [ ] Initialize Expo project
- [ ] Setup TypeScript configuration
- [ ] Install core dependencies
- [ ] Configure ESLint and Prettier
- [ ] Setup EAS Build
- [ ] Implement Azure AD OAuth flow
- [ ] Secure token storage
- [ ] Auth navigation stack

**Deliverables**: Working authentication, project structure

#### Week 2: API Integration & State Management
- [ ] Setup Axios client
- [ ] Configure React Query
- [ ] Create Zustand stores
- [ ] Implement API services (feedback, users)
- [ ] Error handling utilities
- [ ] Network state monitoring

**Deliverables**: Complete API integration layer

#### Week 3: Feedback List & Detail
- [ ] Feedback list screen with FlashList
- [ ] Feedback card component
- [ ] Filters and search
- [ ] Pagination
- [ ] Pull-to-refresh
- [ ] Feedback detail screen
- [ ] Vote button component

**Deliverables**: Browse and view feedback

#### Week 4: Feedback Creation with Camera
- [ ] Create feedback modal
- [ ] Camera integration
- [ ] Photo picker
- [ ] Image compression
- [ ] Multi-image upload
- [ ] Form validation
- [ ] Draft auto-save

**Deliverables**: Create feedback with photos

#### Week 5: Voting & Offline Queue
- [ ] Voting functionality
- [ ] Optimistic updates
- [ ] Offline queue service
- [ ] SQLite setup
- [ ] Sync service
- [ ] Offline indicator

**Deliverables**: Voting works offline

#### Week 6: Testing & Polish
- [ ] Unit tests for services
- [ ] Component tests
- [ ] Fix bugs
- [ ] Performance optimization
- [ ] UI polish
- [ ] MVP ready for internal testing

**Deliverables**: MVP ready for testing

### Phase 2: Research Features - 4 Weeks

#### Week 7: Questionnaires UI
- [ ] Questionnaires list screen
- [ ] Questionnaire detail screen
- [ ] Question components (NPS, Likert, MCQ, text)
- [ ] Form validation
- [ ] Progress indicator
- [ ] Submit functionality

**Deliverables**: Complete questionnaires in-app

#### Week 8: Research Panels & Roadmap
- [ ] Panels list screen
- [ ] Panel invitations
- [ ] Accept/decline flow
- [ ] Roadmap list with stage tabs
- [ ] Roadmap detail screen
- [ ] Stage indicators

**Deliverables**: Research panels and roadmap viewing

#### Week 9: Profile & Settings
- [ ] Profile screen
- [ ] Edit profile
- [ ] Avatar upload
- [ ] Settings screen
- [ ] Consent management
- [ ] Language selection
- [ ] Data export

**Deliverables**: Complete profile management

#### Week 10: Integration & Testing
- [ ] End-to-end testing
- [ ] Integration tests
- [ ] Bug fixes
- [ ] Performance tuning

**Deliverables**: Phase 2 feature complete

### Phase 3: Notifications & Offline - 3 Weeks

#### Week 11: Push Notifications
- [ ] FCM/APNs setup
- [ ] Notification permissions
- [ ] Register device token
- [ ] Notification listeners
- [ ] Deep linking
- [ ] Badge management
- [ ] Notification settings

**Deliverables**: Push notifications working

#### Week 12: Enhanced Offline Support
- [ ] Improved offline queue
- [ ] Conflict resolution
- [ ] Background sync
- [ ] Sync status UI
- [ ] Cached data management

**Deliverables**: Robust offline support

#### Week 13: Testing & Refinement
- [ ] Notification testing
- [ ] Offline scenario testing
- [ ] Bug fixes
- [ ] UX improvements

**Deliverables**: Phase 3 complete

### Phase 4: Polish & Launch Prep - 3 Weeks

#### Week 14: Performance & Optimization
- [ ] Bundle size optimization
- [ ] Image optimization
- [ ] Memory leak detection
- [ ] Startup time improvement
- [ ] API caching strategies

**Deliverables**: Optimized app performance

#### Week 15: Accessibility & Testing
- [ ] Screen reader support
- [ ] Font scaling
- [ ] High contrast mode
- [ ] Touch target sizes
- [ ] E2E test coverage
- [ ] Device testing matrix

**Deliverables**: Accessible, well-tested app

#### Week 16: App Store Preparation
- [ ] App icons and splash screens
- [ ] App Store screenshots
- [ ] Privacy policy
- [ ] Terms of service
- [ ] App Store descriptions
- [ ] TestFlight beta testing
- [ ] Google Play internal testing
- [ ] Production builds

**Deliverables**: Ready for App Store submission

---

## Dependencies

### Production Dependencies

```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "react-native-reanimated": "~3.3.0",
    "react-native-gesture-handler": "~2.12.0",
    "react-native-safe-area-context": "4.6.3",
    "react-native-screens": "~3.22.0",

    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/material-top-tabs": "^6.6.5",

    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.8.4",
    "axios": "^1.6.2",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",

    "@shopify/flash-list": "^1.6.3",
    "react-native-svg": "13.9.0",
    "expo-linear-gradient": "~12.3.0",

    "expo-camera": "~13.4.4",
    "expo-image-picker": "~14.3.2",
    "expo-image-manipulator": "~11.3.0",
    "expo-notifications": "~0.20.1",
    "expo-secure-store": "~12.3.1",
    "@react-native-async-storage/async-storage": "1.18.2",
    "expo-sqlite": "~11.3.3",
    "expo-file-system": "~15.4.5",

    "expo-auth-session": "~5.0.2",
    "expo-web-browser": "~12.3.2",
    "expo-local-authentication": "~13.4.1",

    "@react-native-community/netinfo": "9.3.10",
    "expo-constants": "~14.4.2",
    "expo-device": "~5.4.0",
    "date-fns": "^3.0.6",
    "ulid": "^2.3.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.14",
    "@types/react-native": "~0.72.2",
    "typescript": "^5.1.3",

    "eslint": "^8.54.0",
    "eslint-config-expo": "^7.0.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.0",

    "jest": "^29.7.0",
    "jest-expo": "~49.0.0",
    "@testing-library/react-native": "^12.4.1",
    "@testing-library/jest-native": "^5.4.3",
    "detox": "^20.13.5"
  }
}
```

### Estimated Bundle Sizes

- **iOS**: ~45-50 MB (uncompressed)
- **Android**: ~35-40 MB (APK)
- **Over-the-Air Update**: ~2-5 MB (typical)

---

## Development Environment Setup

### Prerequisites

```bash
# Install Node.js 18.18+
node -v  # Should be 18.18.0 or higher

# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Install iOS simulator (macOS only)
xcode-select --install

# Install Android Studio (for Android emulator)
# Download from: https://developer.android.com/studio
```

### Project Initialization

```bash
# Create Expo project with TypeScript template
npx create-expo-app mobile-app --template expo-template-blank-typescript

cd mobile-app

# Install dependencies
npm install

# Start development server
npx expo start

# iOS simulator (macOS only)
npx expo start --ios

# Android emulator
npx expo start --android

# Physical device via Expo Go
# Scan QR code with camera (iOS) or Expo Go app (Android)
```

### Environment Configuration

Create `.env.development` and `.env.production`:

```bash
# .env.development
API_BASE_URL=http://localhost:3000/api
AZURE_AD_CLIENT_ID=your-dev-client-id
AZURE_AD_TENANT_ID=your-tenant-id
KEYCLOAK_ISSUER=https://keycloak.dev.com/realms/clubmed

# .env.production
API_BASE_URL=https://gentil-feedback.com/api
AZURE_AD_CLIENT_ID=your-prod-client-id
AZURE_AD_TENANT_ID=your-tenant-id
KEYCLOAK_ISSUER=https://keycloak.clubmed.com/realms/clubmed
```

### EAS Build Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 5.4.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "staging"
      }
    },
    "production": {
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Testing Strategy

### Unit Testing

**Framework**: Jest + React Native Testing Library

```typescript
// Example: FeedbackCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import FeedbackCard from '@/components/feedback/FeedbackCard';

describe('FeedbackCard', () => {
  it('renders feedback title and body', () => {
    const feedback = {
      id: 'fb_123',
      title: 'Test Feedback',
      body: 'Test body',
      voteCount: 10,
      userHasVoted: false,
    };

    render(<FeedbackCard feedback={feedback} />);

    expect(screen.getByText('Test Feedback')).toBeOnTheScreen();
    expect(screen.getByText('Test body')).toBeOnTheScreen();
  });

  it('calls onVote when vote button pressed', () => {
    const onVote = jest.fn();
    const feedback = {
      id: 'fb_123',
      title: 'Test',
      body: 'Test',
      voteCount: 0,
      userHasVoted: false,
    };

    render(<FeedbackCard feedback={feedback} onVote={onVote} />);

    fireEvent.press(screen.getByTestId('vote-button'));

    expect(onVote).toHaveBeenCalledWith('fb_123');
  });
});
```

### Component Testing

Focus on testing:
- Component rendering with different props
- User interactions (button presses, form inputs)
- Conditional rendering
- Loading and error states

### E2E Testing

**Framework**: Detox

```typescript
// e2e/feedbackFlow.test.ts
describe('Feedback Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should create feedback with photo', async () => {
    // Sign in
    await element(by.id('sign-in-button')).tap();

    // Navigate to create feedback
    await element(by.id('create-feedback-button')).tap();

    // Fill form
    await element(by.id('feedback-title-input')).typeText('Test Feedback');
    await element(by.id('feedback-body-input')).typeText('This is a test');

    // Add photo
    await element(by.id('add-photo-button')).tap();
    await element(by.id('camera-capture-button')).tap();
    await element(by.id('photo-use-button')).tap();

    // Submit
    await element(by.id('submit-feedback-button')).tap();

    // Verify success
    await expect(element(by.text('Feedback submitted successfully'))).toBeVisible();
  });
});
```

### Testing Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Component Tests**: All reusable components
- **E2E Tests**: Critical user flows (auth, create feedback, vote, submit questionnaire)

---

## Performance Considerations

### Optimization Strategies

#### 1. List Virtualization

Use `@shopify/flash-list` instead of FlatList:

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={feedbackItems}
  renderItem={({ item }) => <FeedbackCard feedback={item} />}
  estimatedItemSize={120}
  keyExtractor={(item) => item.id}
/>
```

#### 2. Image Optimization

```typescript
// Compress images before upload
import * as ImageManipulator from 'expo-image-manipulator';

async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  return result.uri;
}
```

#### 3. Lazy Loading & Code Splitting

```typescript
// Lazy load screens
const FeedbackDetailScreen = lazy(() => import('@/screens/feedback/FeedbackDetailScreen'));

<Suspense fallback={<LoadingSpinner />}>
  <FeedbackDetailScreen />
</Suspense>
```

#### 4. React Query Caching

```typescript
// Aggressive caching for static data
useQuery({
  queryKey: ['features'],
  queryFn: getFeatures,
  staleTime: 24 * 60 * 60 * 1000, // 24 hours
  cacheTime: 48 * 60 * 60 * 1000, // 48 hours
});
```

### Performance Metrics Targets

- **App Startup Time**: < 2 seconds
- **Screen Transition**: < 300ms
- **API Response Handling**: < 100ms
- **List Scroll FPS**: 60 fps
- **Memory Usage**: < 200 MB (typical)

---

## Security

### Security Best Practices

#### 1. Secure Token Storage

```typescript
// Always use SecureStore for sensitive data
import * as SecureStore from 'expo-secure-store';

// Store
await SecureStore.setItemAsync('session_token', token);

// Retrieve
const token = await SecureStore.getItemAsync('session_token');

// Delete
await SecureStore.deleteItemAsync('session_token');
```

#### 2. Certificate Pinning (Optional)

For enhanced security in production:

```typescript
// In bare workflow, add certificate pinning
// iOS: TrustKit
// Android: OkHttp CertificatePinner
```

#### 3. PII Detection

Warn users before submitting potential PII:

```typescript
function detectPII(text: string): boolean {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;

  return emailRegex.test(text) || phoneRegex.test(text);
}
```

#### 4. HTTPS Only

Enforce HTTPS for all API calls:

```typescript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  httpsAgent: new https.Agent({
    rejectUnauthorized: true,
  }),
});
```

### Security Checklist

- [ ] All tokens stored in SecureStore
- [ ] HTTPS enforced for all API calls
- [ ] No sensitive data in logs
- [ ] Biometric authentication available
- [ ] Session timeout implemented
- [ ] Input validation on all forms
- [ ] PII detection warnings
- [ ] Code obfuscation in production builds

---

## App Store Requirements

### iOS App Store

#### Required Assets

- **App Icon**: 1024x1024px (PNG, no alpha)
- **Launch Screen**: Storyboard or static image
- **Screenshots**:
  - iPhone 6.7" (1290x2796px) - Required
  - iPhone 6.5" (1242x2688px) - Required
  - iPad Pro 12.9" (2048x2732px) - Optional

#### App Store Information

- **App Name**: Gentil Feedback
- **Subtitle**: Product Feedback for Club Med
- **Description**: 170-character description + full description
- **Keywords**: Comma-separated, max 100 characters
- **Category**: Business / Productivity
- **Age Rating**: 4+
- **Privacy Policy URL**: Required
- **Support URL**: Required

#### Review Guidelines Compliance

- No private API usage
- Follows Human Interface Guidelines
- App must function as described
- No crashes or major bugs

### Android Play Store

#### Required Assets

- **App Icon**: 512x512px (PNG, 32-bit with alpha)
- **Feature Graphic**: 1024x500px
- **Screenshots**:
  - Phone: 1080x1920px (min 2, max 8)
  - Tablet: 1200x1920px (optional)

#### Play Store Information

- **App Name**: Gentil Feedback
- **Short Description**: Max 80 characters
- **Full Description**: Max 4000 characters
- **Category**: Business
- **Content Rating**: Everyone
- **Privacy Policy URL**: Required
- **App Access**: Public or restricted (Club Med employees)

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **OAuth Integration Complexity** | High | Medium | Start with well-tested libraries (expo-auth-session), allocate extra time |
| **Offline Sync Conflicts** | Medium | Medium | Implement last-write-wins, clear conflict UI |
| **Image Upload Performance** | Medium | High | Aggressive compression, background upload queue |
| **Push Notification Reliability** | Medium | Medium | FCM testing, fallback to polling |
| **App Store Rejection** | High | Low | Follow guidelines strictly, thorough testing |
| **Performance on Low-End Devices** | Medium | Medium | Test on older devices, optimize early |

### Organizational Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **API Breaking Changes** | High | Low | Versioned API, maintain backward compatibility |
| **Azure AD Config Issues** | High | Low | Early setup, thorough documentation |
| **Resource Availability** | Medium | Medium | Clear timeline, buffer time |
| **Scope Creep** | Medium | Medium | Strict phasing, clear MVP definition |

### Recommended Risk Controls

1. **Early Authentication Testing**: Test OAuth flows in Week 1
2. **Performance Testing**: Weekly performance checks
3. **Regular Stakeholder Demos**: Bi-weekly progress reviews
4. **Beta Testing Program**: Internal testing before launch
5. **Rollback Plan**: Keep web app as fallback

---

## Timeline Estimates

### Summary

| Phase | Duration | Effort (Dev Hours) |
|-------|----------|-------------------|
| **Phase 1: Core Features (MVP)** | 6 weeks | 240 hours |
| **Phase 2: Research Features** | 4 weeks | 160 hours |
| **Phase 3: Notifications & Offline** | 3 weeks | 120 hours |
| **Phase 4: Polish & Launch Prep** | 3 weeks | 120 hours |
| **Total** | **16 weeks** | **640 hours** |

### Resource Requirements

- **1 Full-Time React Native Developer** (16 weeks)
- **0.5 Backend Developer** (support for mobile-specific APIs)
- **0.25 Designer** (mobile UI design, app store assets)
- **0.25 QA Engineer** (testing, device coverage)

### Key Milestones

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| **Project Kickoff** | Week 0 | Team assembled, requirements confirmed |
| **MVP Complete** | Week 6 | Core features working, internal demo |
| **Phase 2 Complete** | Week 10 | Research features ready |
| **Phase 3 Complete** | Week 13 | Notifications & offline working |
| **Beta Launch** | Week 15 | TestFlight/Play Store beta |
| **Production Launch** | Week 16 | Public release |

### Dependencies & Assumptions

**Dependencies**:
- Backend API stable and documented
- Azure AD credentials provided early
- Design assets available by Week 2
- Physical devices for testing

**Assumptions**:
- No major scope changes during development
- Backend API doesn't require mobile-specific changes
- Team has React Native experience
- Standard 40-hour work weeks

---

## Next Steps

### Immediate Actions (Week 0)

1. **Team Formation**
   - Assign React Native lead developer
   - Confirm backend support availability
   - Engage designer for mobile UI

2. **Environment Setup**
   - Create Azure AD app registration for mobile
   - Setup Expo account and EAS Build
   - Provision development certificates (iOS)

3. **Stakeholder Alignment**
   - Review and approve this plan
   - Confirm MVP feature set
   - Establish demo schedule

4. **Technical Preparation**
   - Clone backend repo for local testing
   - Review API documentation
   - Setup development machines

### Week 1 Deliverables

- Project initialized with Expo
- TypeScript configured
- Core dependencies installed
- CI/CD pipeline setup
- OAuth flow implemented
- First internal demo (authentication working)

### Success Criteria

**MVP Success Metrics**:
- Users can sign in with Club Med SSO
- Users can browse and vote on feedback
- Users can create feedback with photos
- App works offline (queued submissions)
- No critical bugs

**Launch Success Metrics**:
- 80%+ feature parity with web app (for mobile-relevant features)
- < 5% crash rate
- App Store rating > 4.0
- 50%+ of active users adopt mobile app within 3 months

---

## Appendix

### A. Expo vs Bare React Native Comparison

| Criterion | Expo (Managed) | Bare React Native | Decision |
|-----------|---------------|-------------------|----------|
| **Development Speed** | Fast - pre-built modules | Slower - manual setup | ✅ Expo |
| **OTA Updates** | Yes - instant updates | No - requires release | ✅ Expo |
| **Custom Native Modules** | Limited (SDK only) | Full control | Bare |
| **Build Complexity** | Simple - EAS Build | Complex - Xcode/Android Studio | ✅ Expo |
| **App Size** | Larger (~40-50MB) | Smaller (~20-30MB) | Neutral |
| **Future Flexibility** | Can eject anytime | N/A | ✅ Expo |

**Recommendation**: Start with Expo, eject only if custom native modules needed.

### B. Alternative Technology Considerations

#### Flutter
**Pros**: Fast performance, single codebase, growing ecosystem
**Cons**: New language (Dart), smaller community than React Native
**Decision**: Stick with React Native for team skill alignment

#### Ionic / Capacitor
**Pros**: Web technologies, code sharing with web app
**Cons**: WebView performance, not truly native
**Decision**: React Native for better native experience

#### Progressive Web App (PWA)
**Pros**: No app store approval, instant updates, code sharing
**Cons**: Limited native features, no offline camera access
**Decision**: Native app for better UX and offline support

### C. Glossary

- **EAS Build**: Expo Application Services - cloud build infrastructure
- **OTA Update**: Over-The-Air update - push updates without App Store review
- **SecureStore**: Encrypted storage for sensitive data (keychain on iOS, keystore on Android)
- **React Query**: Data synchronization library for server state
- **Zustand**: Lightweight state management library
- **FlashList**: High-performance list component (Shopify)
- **FCM**: Firebase Cloud Messaging - push notification service
- **APNs**: Apple Push Notification service

---

## Document Control

**Version**: 1.0.0
**Status**: DRAFT
**Last Updated**: 2025-10-13
**Author**: Claude Code (Agent A20)
**Reviewers**: TBD
**Approval**: Pending

### Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-13 | Claude Code | Initial plan document |

---

**Ready for Review**: This comprehensive mobile app plan is ready for stakeholder review and approval. Upon approval, development can begin immediately with Week 1 activities.
