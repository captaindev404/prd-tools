# visual-profile Specification

## Purpose
TBD - created by archiving change migrate-hero-visual-profile-api. Update Purpose after archive.
## Requirements
### Requirement: Visual Profile CRUD via API

The system SHALL provide API endpoints for managing hero visual profiles through the backend.

#### Scenario: Create visual profile for hero
- **WHEN** a user creates a visual profile for a hero via POST `/api/v1/heroes/:heroId/visual-profile`
- **THEN** the system creates the profile in the database linked to the hero
- **AND** returns the created profile with all visual attributes

#### Scenario: Get visual profile for hero
- **WHEN** a user requests a hero's visual profile via GET `/api/v1/heroes/:heroId/visual-profile`
- **THEN** the system returns the profile if it exists
- **OR** returns a 404 if no profile exists

#### Scenario: Update visual profile
- **WHEN** a user updates a visual profile via PATCH `/api/v1/heroes/:heroId/visual-profile`
- **THEN** the system updates only the provided fields
- **AND** returns the updated profile

#### Scenario: Delete visual profile
- **WHEN** a user deletes a visual profile via DELETE `/api/v1/heroes/:heroId/visual-profile`
- **THEN** the system removes the profile from the database
- **AND** returns a success response

#### Scenario: Unauthorized access
- **WHEN** a user attempts to access a visual profile for a hero they don't own
- **THEN** the system returns a 403 Forbidden error

### Requirement: AI Visual Profile Extraction

The system SHALL provide an endpoint to extract visual attributes from a hero's avatar using AI.

#### Scenario: Extract visual attributes from avatar
- **WHEN** a user requests visual profile extraction via POST `/api/v1/heroes/:heroId/visual-profile/extract`
- **AND** the hero has a valid avatar image
- **THEN** the system analyzes the avatar using AI
- **AND** extracts visual attributes (hair color, eye color, skin tone, clothing, etc.)
- **AND** generates canonical and simplified prompts
- **AND** creates or updates the visual profile

#### Scenario: Extract without avatar
- **WHEN** a user requests visual profile extraction
- **AND** the hero does not have an avatar image
- **THEN** the system returns a 400 error with message "Hero must have an avatar for AI extraction"

### Requirement: iOS Visual Profile API Integration

The iOS app SHALL manage visual profiles exclusively through the backend API.

#### Scenario: Load visual profile
- **WHEN** the user views a hero's visual profile
- **THEN** the app fetches the profile from the API
- **AND** displays a loading indicator during fetch
- **AND** handles network errors with retry option

#### Scenario: Create visual profile locally disabled
- **WHEN** the user creates a visual profile
- **THEN** the app sends the profile to the API
- **AND** displays a loading indicator during creation
- **AND** updates the UI only after API confirms success

#### Scenario: Offline visual profile operations blocked
- **WHEN** the user attempts to create, edit, or delete a visual profile
- **AND** there is no network connection
- **THEN** the app displays a "No Connection" message
- **AND** blocks the operation until connection is restored

### Requirement: Visual Profile Included in Hero Response

The backend SHALL include visual profile data when returning hero details.

#### Scenario: Hero response includes visual profile
- **WHEN** a hero is fetched via GET `/api/v1/heroes/:heroId`
- **THEN** the response includes the `visualProfile` object if it exists
- **OR** `visualProfile` is null if no profile exists

#### Scenario: Hero list includes visual profiles
- **WHEN** heroes are listed via GET `/api/v1/heroes`
- **THEN** each hero in the response includes its `visualProfile` if it exists

