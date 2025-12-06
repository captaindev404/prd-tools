# Spec: Audio Generation

## Purpose

Define the requirements for AI-powered audio narration generation, including voice selection, customization, and storage integration for children's bedtime stories.
## Requirements
### Requirement: Audio Generation Model

Audio generation MUST use `gpt-4o-mini-tts` with instructions parameter instead of `tts-1` model.

**Previous:** Use `tts-1` model
**Modified:** Use `gpt-4o-mini-tts` with instructions parameter

#### Scenario: Generate audio with improved quality

**Given** story text for narration
**When** generating audio with gpt-4o-mini-tts
**Then** audio quality is clear and high-fidelity
**And** voice characteristics match language
**And** instructions for bedtime tone are applied
**And** pacing is appropriate for children
**And** generation completes in reasonable time

### Requirement: Voice Configuration

Voice configuration MUST support instruction-based customization instead of only simple voice selection.

**Previous:** Simple voice selection from predefined list
**Modified:** Voice selection with instruction-based customization

#### Scenario: Customize voice with instructions

**Given** a narration request
**When** configuring voice settings
**Then** select from 10 available voices (alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer)
**And** include instructions for accent, emotional range, and tone
**And** specify pacing and intonation requirements
**And** configure speed setting (default 1.0)
**And** verify instructions are properly formatted

### Requirement: Audio Duration Estimation

Audio duration estimation MUST account for instruction-based pacing adjustments instead of only rough word count.

**Previous:** Rough estimate based on word count
**Modified:** More accurate estimation considering instructions and pacing

#### Scenario: Estimate audio duration for slow bedtime pacing

**Given** story text with word count
**When** estimating duration
**Then** account for slow pacing instruction
**And** estimate ~120 words per minute (slower than standard 150 wpm)
**And** add buffer for emotional emphasis
**And** return duration estimate in seconds
**And** store estimate for UI progress indication

### Requirement: Use gpt-4o-mini-tts for Audio Generation

Audio generation MUST use the `gpt-4o-mini-tts` model with instruction-based voice control.

#### Scenario: Generate story audio with enhanced voice instructions

**Given** story content and language
**When** generating audio narration
**Then** use model `gpt-4o-mini-tts`
**And** select appropriate voice for language and hero traits
**And** include instructions for warm, gentle storytelling tone
**And** set instructions for slow pacing suitable for bedtime
**And** configure response format as MP3
**And** return audio buffer for storage

#### Scenario: Apply voice instructions for emotional storytelling

**Given** a bedtime story requiring narration
**When** configuring audio generation
**Then** include instruction: "Speak in a warm, gentle, storytelling tone suitable for bedtime"
**And** include instruction: "Pace slowly and emphasize emotional moments"
**And** include instruction: "Use a soothing voice that helps children relax"
**And** verify instructions are applied in generated audio
**And** validate audio quality meets standards

### Requirement: Voice Recommendations Based on Hero Traits

Voice selection MUST consider hero personality traits and language for optimal narration quality.

#### Scenario: Select voice matching energetic hero

**Given** a hero with 'energetic' or 'adventurous' traits
**When** selecting voice for narration
**Then** prefer 'shimmer' or 'nova' voices
**And** include instruction for upbeat delivery
**And** ensure voice matches hero personality

#### Scenario: Select voice matching gentle hero

**Given** a hero with 'gentle' or 'kind' traits
**When** selecting voice for narration
**Then** prefer 'nova' or 'alloy' voices
**And** include instruction for soft, calm delivery
**And** ensure soothing tone suitable for bedtime

### Requirement: Upload Generated Audio to R2 Storage

Generated audio MUST be uploaded to Cloudflare R2 for permanent storage with appropriate metadata.

#### Scenario: Store audio in R2 after generation

**Given** a successful audio generation
**When** processing the generated audio
**Then** convert audio stream to buffer
**And** generate unique R2 file key with userId and storyId
**And** upload to R2 with content-type audio/mpeg
**And** include metadata (storyId, voice, language)
**And** return permanent R2 URL
**And** estimate duration based on word count

