# Spec: Image Generation with gpt-5-mini

## ADDED Requirements

### Requirement: Use gpt-5-mini for Illustration Generation

Illustration generation MUST use `gpt-5-mini` model with character consistency via `previous_response_id`.

#### Scenario: Generate story illustration with gpt-5-mini

**Given** a scene description and hero visual profile
**When** generating an illustration
**Then** use model `gpt-5-mini`
**And** include scene description in prompt
**And** include hero visual characteristics for consistency
**And** apply content filtering before generation
**And** return image URL and generation metadata
**And** store generation ID for multi-turn consistency

#### Scenario: Maintain character consistency across illustrations

**Given** a story with multiple scenes
**When** generating sequential illustrations
**Then** store the first generation's response ID
**And** include `previous_response_id` in subsequent requests
**And** verify character appearance remains consistent
**And** validate that art style matches across all illustrations
**And** track generation IDs for all illustrations

### Requirement: Generate Avatar with gpt-5-mini

Avatar generation MUST use `gpt-5-mini` for hero character portraits.

#### Scenario: Generate hero avatar with child-appropriate style

**Given** hero parameters (name, age, traits, physical characteristics)
**When** generating an avatar
**Then** use model `gpt-5-mini`
**And** build prompt with child-friendly cartoon style
**And** include personality trait visual cues
**And** include special ability visual elements
**And** apply content filtering before generation
**And** return image URL and revised prompt
**And** extract visual characteristics for future consistency

### Requirement: Upload Generated Images to R2 Storage

Generated images MUST be downloaded from OpenAI and uploaded to Cloudflare R2 for permanent storage.

#### Scenario: Store illustration in R2 after generation

**Given** a successful image generation response
**When** processing the generated image
**Then** download image from temporary OpenAI URL
**And** convert to buffer
**And** generate unique R2 file key with userId, storyId, illustrationId
**And** upload to R2 with appropriate metadata
**And** return permanent R2 URL
**And** update database with image URL and prompt

## MODIFIED Requirements

### Requirement: Illustration Generation Model

Illustration generation MUST use `gpt-5-mini` via Response API instead of `dall-e-3` via Images API.

**Previous:** Use `dall-e-3` via Images API
**Modified:** Use `gpt-5-mini` via Response API

#### Scenario: Generate illustration with equivalent or better quality

**Given** a scene requiring illustration
**When** generating with gpt-5-mini
**Then** image quality is suitable for children's storybook
**And** style is child-friendly cartoon
**And** colors are bright and cheerful
**And** resolution is at least 1024x1024
**And** generation completes in reasonable time (< 15 seconds)
**And** character consistency is maintained

### Requirement: Avatar Generation Model

Avatar generation MUST use `gpt-5-mini` via Response API instead of `dall-e-3` via Images API.

**Previous:** Use `dall-e-3` via Images API
**Modified:** Use `gpt-5-mini` via Response API

#### Scenario: Generate avatar with consistent quality

**Given** hero creation parameters
**When** generating avatar with gpt-5-mini
**Then** avatar style matches illustration style
**And** personality traits are visually represented
**And** special abilities have visual indicators
**And** image is high-quality and kid-friendly
**And** generation completes in under 15 seconds

### Requirement: Multi-Turn Consistency Mechanism

Illustration consistency MUST use Response API `previous_response_id` for native consistency instead of only canonical prompts.

**Previous:** Maintain consistency through detailed canonical prompts
**Modified:** Use Response API `previous_response_id` for native consistency

#### Scenario: Sequential illustrations maintain character appearance

**Given** multiple scenes in a story
**When** generating illustrations sequentially
**Then** first illustration establishes character appearance
**And** subsequent illustrations reference previous response ID
**And** character hair, eyes, clothing remain consistent
**And** art style and color palette stay uniform
**And** scene-specific elements change while character remains constant

## REMOVED Requirements

### Requirement: Multi-Turn Consistency via External Generation ID

**Previous:** Store and reference external generation IDs from DALL-E
**Reason:** Response API provides native `previous_response_id` mechanism

This external ID tracking is no longer needed as the Response API handles consistency internally.
