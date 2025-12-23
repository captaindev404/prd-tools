# Tasks: Migrate Hero Visual Profile to API

## 1. Backend Implementation

- [ ] 1.1 Create visual profile route handler (`app/api/v1/heroes/[heroId]/visual-profile/route.ts`)
  - GET: Fetch visual profile for hero
  - POST: Create visual profile for hero
  - PATCH: Update visual profile
  - DELETE: Delete visual profile
- [ ] 1.2 Create AI extraction endpoint (`app/api/v1/heroes/[heroId]/visual-profile/extract/route.ts`)
  - POST: Extract visual attributes from hero avatar using AI
  - Generate canonical and simplified prompts
- [ ] 1.3 Add input validation with Zod schemas for visual profile requests
- [ ] 1.4 Write backend unit tests for visual profile endpoints

## 2. iOS Model Updates

- [ ] 2.1 Remove `@Model` decorator from `HeroVisualProfile.swift`
- [ ] 2.2 Make `HeroVisualProfile` a plain Codable struct
- [ ] 2.3 Remove `@Relationship var hero: Hero?` (API handles relationship)
- [ ] 2.4 Update `Hero.swift` to remove SwiftData relationship to `HeroVisualProfile`
- [ ] 2.5 Update `InfiniteStoriesApp.swift` to remove `HeroVisualProfile` from SwiftData schema

## 3. iOS Network Layer

- [ ] 3.1 Add visual profile endpoints to `Endpoint.swift`
  - `getVisualProfile(heroId: String)`
  - `createVisualProfile(heroId: String, data: VisualProfileCreateRequest)`
  - `updateVisualProfile(heroId: String, data: VisualProfileUpdateRequest)`
  - `deleteVisualProfile(heroId: String)`
  - `extractVisualProfile(heroId: String)`
- [ ] 3.2 Add request DTOs: `VisualProfileCreateRequest`, `VisualProfileUpdateRequest`
- [ ] 3.3 Extend `HeroVisualProfileResponse` if needed for full CRUD response

## 4. iOS Repository Layer

- [ ] 4.1 Add visual profile methods to `HeroRepository`
  - `getVisualProfile(heroId: String) async throws -> HeroVisualProfile?`
  - `createVisualProfile(heroId: String, profile: HeroVisualProfile) async throws -> HeroVisualProfile`
  - `updateVisualProfile(heroId: String, profile: HeroVisualProfile) async throws -> HeroVisualProfile`
  - `deleteVisualProfile(heroId: String) async throws`
  - `extractVisualProfile(heroId: String) async throws -> HeroVisualProfile`

## 5. iOS View Updates

- [ ] 5.1 Update `HeroVisualProfileView.swift` to use API instead of SwiftData
  - Remove `@Environment(\.modelContext)` usage
  - Add loading states for API operations
  - Add error handling with retry
  - Use `HeroRepository` for all CRUD operations
- [ ] 5.2 Update `VisualProfileEditorView` to save via API
- [ ] 5.3 Add network connectivity check before operations
- [ ] 5.4 Update any other views that reference `HeroVisualProfile` SwiftData

## 6. Testing

- [ ] 6.1 Write iOS unit tests for visual profile repository methods
- [ ] 6.2 Write iOS integration tests for visual profile API flow
- [ ] 6.3 Manual testing: create, edit, delete visual profiles
- [ ] 6.4 Manual testing: AI extraction flow
- [ ] 6.5 Manual testing: cross-device sync verification

## 7. Cleanup

- [ ] 7.1 Remove unused SwiftData-related code from visual profile components
- [ ] 7.2 Update documentation if needed
