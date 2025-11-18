# Spec: Response API Migration

## ADDED Requirements

### Requirement: Use Response API for All OpenAI Calls

All OpenAI API interactions MUST use the Response API format (`openai.responses.create`) instead of legacy endpoints (Chat Completions, Images, Audio).

#### Scenario: Generate story using Response API

**Given** a story generation request with hero parameters
**When** calling the story generator service
**Then** the service uses `openai.responses.create` with model `gpt-5-mini`
**And** the request includes `input` parameter instead of `messages`
**And** structured output is configured via `text.format` parameter
**And** the response is parsed from `response.output` array

#### Scenario: Handle Response API errors

**Given** an API call that fails
**When** the Response API returns an error
**Then** the service checks `response.status === 'failed'`
**And** extracts error details from `response.error.message`
**And** throws a descriptive error with the OpenAI error message

#### Scenario: Track token usage from Response API

**Given** a successful API call
**When** the Response API returns usage data
**Then** the service logs `input_tokens`, `output_tokens`, `reasoning_tokens`, and `cached_tokens`
**And** calculates total cost based on token counts
**And** stores usage metrics for monitoring

### Requirement: Parse Response API Output Format

Services MUST correctly parse the Response API output structure to extract model-generated content.

#### Scenario: Extract text content from response

**Given** a Response API response with output items
**When** parsing the response
**Then** find the item with `type === 'message'`
**And** verify item `status === 'completed'`
**And** extract text from `content[].text` where `content[].type === 'output_text'`
**And** handle missing or malformed output gracefully

#### Scenario: Extract structured JSON output

**Given** a Response API response with JSON schema output
**When** parsing the response for structured data
**Then** extract the text content from the message item
**And** parse the text as JSON
**And** validate against the expected schema
**And** throw an error if JSON is invalid

### Requirement: Support Conversation Chaining

Services MUST support multi-turn conversations using `previous_response_id` for character consistency.

#### Scenario: Generate sequential illustrations with consistency

**Given** an initial illustration generation request
**When** generating the first illustration
**Then** store the `response.id` for future reference
**And** when generating subsequent illustrations
**Then** include `previous_response_id` in the request
**And** ensure character visual consistency across generations

## MODIFIED Requirements

### Requirement: Error Handling for OpenAI API Calls

Services MUST handle Response API-specific error formats with status checking instead of only Chat Completions API try-catch.

**Previous:** Handle errors from Chat Completions API with standard try-catch
**Modified:** Handle Response API-specific error formats with status checking

#### Scenario: Detect and handle failed responses

**Given** a Response API call
**When** checking the response
**Then** verify `response.status !== 'failed'` before processing
**And** if status is 'failed', extract error from `response.error`
**And** log error type, code, and message
**And** throw an appropriate error for the application layer

### Requirement: Model Configuration for Text Generation

Services MUST use `gpt-5-mini` with Response API and verbosity/reasoning controls instead of `gpt-4o-2024-08-06` with Chat Completions API.

**Previous:** Use `gpt-4o-2024-08-06` with Chat Completions API
**Modified:** Use `gpt-5-mini` with Response API and verbosity/reasoning controls

#### Scenario: Configure text generation with appropriate settings

**Given** a text generation request
**When** configuring the API call
**Then** set model to `gpt-5-mini`
**And** configure `text.verbosity` to 'medium' for balanced output length
**And** configure `text.reasoning` to 'low' for creative content
**And** include `text.format` for structured JSON outputs

## REMOVED Requirements

None - This is an additive migration that maintains backward compatibility at the service interface level.
