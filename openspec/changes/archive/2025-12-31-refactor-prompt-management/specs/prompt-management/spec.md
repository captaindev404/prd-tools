## ADDED Requirements

### Requirement: Structured Prompt Builder
The backend SHALL use a PromptBuilder pattern that separates prompts into distinct layers: system prompts, context, and user input.

#### Scenario: Build avatar generation prompt with separation
- **WHEN** generating an avatar prompt
- **THEN** the system prompt SHALL be loaded from configuration (not inline string)
- **AND** the hero context (name, age, traits) SHALL be in a separate context layer
- **AND** any custom user description SHALL be in the user input layer
- **AND** the final prompt SHALL combine layers without mixing user data into system instructions

#### Scenario: Build story generation prompt with separation
- **WHEN** generating a story prompt
- **THEN** the storyteller persona and rules SHALL be in the system prompt layer
- **AND** the hero profile and event context SHALL be in the context layer
- **AND** custom prompt seeds SHALL be in the user input layer
- **AND** language-specific instructions SHALL be in the system prompt configuration

#### Scenario: Build illustration prompt with separation
- **WHEN** generating an illustration prompt
- **THEN** the illustration style guidelines SHALL be in the system prompt
- **AND** the hero visual profile and canonical prompt SHALL be in the context layer
- **AND** the scene description SHALL be in the user input layer
- **AND** character consistency references SHALL be in the context layer

### Requirement: Centralized Sanitization Service
The backend SHALL have a single SanitizationService that handles all prompt sanitization with centralized rules.

#### Scenario: Sanitize user input before prompt inclusion
- **WHEN** user-provided text is included in a prompt
- **THEN** the text SHALL be passed through SanitizationService
- **AND** term replacements SHALL use centralized rules (not duplicated per route)
- **AND** dangerous patterns (prompt injection attempts) SHALL be removed
- **AND** the sanitized text SHALL preserve user intent while being safe

#### Scenario: Apply language-specific sanitization rules
- **WHEN** processing non-English content
- **THEN** the SanitizationService SHALL apply language-specific term mappings
- **AND** French terms like "gargouille" SHALL be replaced with safe equivalents
- **AND** safety terms SHALL be checked in the appropriate language

#### Scenario: Detect and block prompt injection attempts
- **WHEN** user input contains prompt injection patterns
- **THEN** patterns like "ignore previous instructions" SHALL be removed
- **AND** system prompt override attempts SHALL be blocked
- **AND** the service SHALL log the injection attempt
- **AND** a safe version of the input SHALL be returned

### Requirement: Externalized Prompt Configuration
Prompt templates and system prompts SHALL be stored in configuration files, not inline code strings.

#### Scenario: Load avatar system prompt from configuration
- **WHEN** the avatar generator needs a system prompt
- **THEN** it SHALL load from `lib/prompts/system/avatar-generation.ts`
- **AND** the prompt SHALL include style requirements and output format
- **AND** changes to the prompt SHALL not require code changes in the generator

#### Scenario: Load story system prompts for multiple languages
- **WHEN** generating a story in a specific language
- **THEN** the appropriate system prompt SHALL be loaded from configuration
- **AND** all 5 supported languages SHALL have corresponding prompts
- **AND** language-specific phrasing and cultural context SHALL be included

#### Scenario: Load sanitization rules from centralized configuration
- **WHEN** the SanitizationService initializes
- **THEN** term replacements SHALL be loaded from `lib/prompts/sanitization/rules.ts`
- **AND** there SHALL be a single source of truth for all 40+ term replacements
- **AND** language-specific rules SHALL be organized by language code

### Requirement: Input Validation Before Prompt Injection
User inputs SHALL be validated at API boundaries before being included in prompts.

#### Scenario: Validate hero name before prompt inclusion
- **WHEN** a hero name is provided for prompt generation
- **THEN** the name SHALL be validated for maximum length (50 characters)
- **AND** the name SHALL contain only allowed characters (alphanumeric, spaces, basic punctuation)
- **AND** invalid names SHALL be rejected with a clear error message

#### Scenario: Validate hero age before prompt inclusion
- **WHEN** a hero age is provided for prompt generation
- **THEN** the age SHALL be validated as a number between 2 and 12
- **AND** non-numeric values SHALL be rejected
- **AND** out-of-range ages SHALL return an error

#### Scenario: Validate trait selections before prompt inclusion
- **WHEN** hero traits are provided for prompt generation
- **THEN** traits SHALL be validated against the allowed enum values
- **AND** unknown traits SHALL be rejected
- **AND** the maximum number of traits SHALL be enforced

### Requirement: Immutable System Prompts
System prompts SHALL NOT contain user-provided data or dynamic content.

#### Scenario: System prompt contains only configuration
- **WHEN** a system prompt is constructed
- **THEN** it SHALL contain only static persona definitions and rules
- **AND** user names, traits, or descriptions SHALL NOT appear in system prompts
- **AND** dynamic content SHALL be placed in context or user layers

#### Scenario: Context layer contains validated user data
- **WHEN** user data is included in prompts
- **THEN** it SHALL be placed in the context layer after validation
- **AND** the context layer SHALL be clearly separated from system instructions
- **AND** the AI model SHALL receive structured input with clear boundaries
