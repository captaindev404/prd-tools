# Spec: Text Generation with gpt-5-mini

## ADDED Requirements

### Requirement: Use gpt-5-mini for Story Generation

Story generation MUST use the `gpt-5-mini` model with appropriate reasoning and verbosity configuration.

#### Scenario: Generate bedtime story with gpt-5-mini

**Given** hero parameters (name, age, traits) and story event
**When** generating a story
**Then** use model `gpt-5-mini`
**And** set `text.verbosity` to 'medium' for 300-500 word stories
**And** set `text.reasoning` to 'low' for creative storytelling
**And** include system prompt for children's storyteller persona
**And** return structured JSON with title and content fields

#### Scenario: Configure reasoning level for story quality

**Given** a story generation request
**When** setting model parameters
**Then** use reasoning level 'low' to minimize overhead
**And** ensure response latency remains under 5 seconds for typical stories
**And** validate that story quality meets child-safety and engagement standards

### Requirement: Extract Scenes Using gpt-5-mini

Scene extraction for illustration synchronization MUST use `gpt-5-mini` with low temperature for consistency.

#### Scenario: Extract visual scenes from story content

**Given** a generated story content
**When** extracting scenes for illustrations
**Then** use model `gpt-5-mini`
**And** set temperature to 0.3 for consistent scene identification
**And** request 3-8 scenes with scene descriptions, timestamps, and durations
**And** return structured JSON array of scene objects
**And** validate that scenes cover the entire story timeline

### Requirement: Extract Visual Characteristics Using gpt-5-mini

Visual characteristic extraction for character consistency MUST use `gpt-5-mini` with structured output.

#### Scenario: Extract hero visual profile from avatar prompt

**Given** an avatar generation prompt with hero description
**When** extracting visual characteristics
**Then** use model `gpt-5-mini`
**And** set temperature to 0.3 for stable extraction
**And** return structured JSON with hair, eyes, skin, clothing, and art style
**And** generate canonical prompt for character consistency
**And** store visual profile for future illustration consistency

## MODIFIED Requirements

### Requirement: Story Generation Model

Story generation MUST use `gpt-5-mini` via Response API with verbosity control instead of `gpt-4o-2024-08-06`.

**Previous:** Use `gpt-4o-2024-08-06` via Chat Completions API
**Modified:** Use `gpt-5-mini` via Response API with verbosity control

#### Scenario: Maintain story quality with new model

**Given** the same hero and event parameters
**When** generating a story with gpt-5-mini
**Then** story length is comparable to gpt-4o output (300-500 words)
**And** story quality meets child-safety standards
**And** content filtering still applies correctly
**And** generated title is creative and appropriate
**And** response time is equal or faster than gpt-4o

### Requirement: Scene Extraction Performance

Scene extraction MUST use `gpt-5-mini` with similar or better performance compared to `gpt-4o-2024-08-06`.

**Previous:** Use `gpt-4o-2024-08-06` for scene analysis
**Modified:** Use `gpt-5-mini` with similar or better performance

#### Scenario: Extract scenes with improved speed

**Given** a 400-word story
**When** extracting scenes with gpt-5-mini
**Then** extraction completes in under 3 seconds
**And** identifies 3-8 meaningful scenes
**And** scene descriptions are detailed enough for image generation
**And** timestamp estimates are reasonable for audio synchronization

### Requirement: Visual Characteristics Extraction

Visual characteristics extraction MUST use `gpt-5-mini` with same structured output quality as `gpt-4o-2024-08-06`.

**Previous:** Use `gpt-4o-2024-08-06` for characteristic extraction
**Modified:** Use `gpt-5-mini` with same structured output quality

#### Scenario: Extract consistent visual profile

**Given** an avatar description prompt
**When** extracting visual characteristics with gpt-5-mini
**Then** all relevant fields are populated (hair, eyes, skin, clothing)
**And** canonical prompt is generated for consistency
**And** simplified prompt is available for quick reference
**And** extraction completes in under 2 seconds

## REMOVED Requirements

None - All previous text generation requirements are maintained with model upgrade.
