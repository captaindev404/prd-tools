## 1. Apple Developer Portal Setup

- [ ] 1.1 Create App ID with Sign in with Apple capability enabled
- [ ] 1.2 Create Service ID for backend OAuth callbacks (for future web support)
- [ ] 1.3 Generate and download `.p8` private key file
- [ ] 1.4 Record Team ID, Key ID, and Bundle ID
- [ ] 1.5 Document credential rotation schedule in DEPLOYMENT.md

## 2. Backend Configuration

- [ ] 2.1 Add Apple provider environment variables to `.env.example` and Dokploy secrets
- [ ] 2.2 Configure Better Auth with Apple social provider in `lib/auth/auth.ts`
- [ ] 2.3 Add `appBundleIdentifier` for native iOS ID Token validation
- [ ] 2.4 Add `appleid.apple.com` to trusted origins
- [ ] 2.5 Test Apple provider configuration with curl/Postman

## 3. iOS Xcode Project Setup

- [ ] 3.1 Add "Sign in with Apple" capability in Xcode project
- [ ] 3.2 Add `AuthenticationServices` framework import
- [ ] 3.3 Update entitlements file with Sign in with Apple entitlement

## 4. iOS Authentication Implementation

- [ ] 4.1 Create `AppleSignInManager` service for handling ASAuthorization
- [ ] 4.2 Implement `ASAuthorizationControllerDelegate` for credential handling
- [ ] 4.3 Add method to send Apple ID token to backend for verification
- [ ] 4.4 Handle Apple user info (email, name) from first-time authorization
- [ ] 4.5 Store Apple user identifier for subsequent sign-ins

## 5. iOS UI Integration

- [ ] 5.1 Add `SignInWithAppleButton` to AuthenticationView
- [ ] 5.2 Style button according to Apple Human Interface Guidelines
- [ ] 5.3 Add loading state during Apple authentication
- [ ] 5.4 Handle Apple sign-in errors with user-friendly messages
- [ ] 5.5 Add haptic feedback for Apple sign-in success/failure

## 6. Account Linking

- [ ] 6.1 Configure Better Auth account linking for Apple provider
- [ ] 6.2 Test linking Apple account to existing email account
- [ ] 6.3 Test creating new account via Apple when no email match exists

## 7. Testing

- [ ] 7.1 Test Apple sign-in with Apple Sandbox account
- [ ] 7.2 Test sign-in flow on physical iOS device (Simulator has limitations)
- [ ] 7.3 Test error handling (user cancellation, network errors)
- [ ] 7.4 Test session persistence after Apple sign-in
- [ ] 7.5 Verify auth token works for protected API endpoints
