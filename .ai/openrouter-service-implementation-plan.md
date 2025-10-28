# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter service provides a type-safe interface for interacting with the OpenRouter API to complete LLM-based chat operations. This service will be used throughout the budget manager application to analyze transactions, categorize expenses, and provide AI-powered financial insights.

### Core Responsibilities

- Manage authentication with OpenRouter API
- Build and validate chat completion requests
- Handle system and user messages
- Support structured responses via JSON schema (response_format)
- Configure model selection and parameters
- Parse and validate API responses
- Implement comprehensive error handling and retry logic
- Ensure secure credential management

### Technology Stack Alignment

- **TypeScript 5**: Leverage advanced type features for type-safe API interactions
- **Service Architecture**: Place service in `src/lib/services/openrouter.service.ts`
- **Type Definitions**: Shared types in `src/types.ts` for entities and DTOs
- **API Client Layer**: Separate HTTP client in `src/lib/api/openrouter.client.ts`

## 2. Constructor Description

### `OpenRouterService`

The main service class that encapsulates all OpenRouter API interactions.

```typescript
constructor(config: OpenRouterConfig)
```

**Parameters:**
- `config: OpenRouterConfig` - Configuration object containing:
  - `apiKey: string` - OpenRouter API key (from environment variable)
  - `baseUrl?: string` - API base URL (default: 'https://openrouter.ai/api/v1')
  - `defaultModel?: string` - Default model to use (e.g., 'anthropic/claude-3.5-sonnet')
  - `timeout?: number` - Request timeout in milliseconds (default: 30000)
  - `maxRetries?: number` - Maximum retry attempts (default: 3)

**Validation Requirements:**
- API key must be non-empty string
- Base URL must be valid URL format
- Timeout must be positive number
- Max retries must be non-negative integer

**Example:**
```typescript
const service = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultModel: 'anthropic/claude-3.5-sonnet',
  timeout: 30000,
  maxRetries: 3
});
```

## 3. Public Methods and Fields

### 3.1 `chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>`

Main method for non-streaming chat completions.

**Parameters:**
- `request: ChatCompletionRequest` - Chat completion request containing:
  - `messages: ChatMessage[]` - Array of messages (system, user, assistant)
  - `model?: string` - Model name (overrides default)
  - `response_format?: ResponseFormat` - Structured output format
  - `temperature?: number` - Sampling temperature (0-2)
  - `max_tokens?: number` - Maximum tokens to generate
  - `top_p?: number` - Nucleus sampling parameter (0-1)
  - `frequency_penalty?: number` - Frequency penalty (-2 to 2)
  - `presence_penalty?: number` - Presence penalty (-2 to 2)

**Returns:**
- `Promise<ChatCompletionResponse>` - Parsed API response

**Error Handling:**
- Validates request structure before sending
- Retries on transient failures (rate limits, network errors)
- Throws typed errors for permanent failures

**Example:**
```typescript
const response = await service.chat({
  messages: [
    {
      role: 'system',
      content: 'You are a financial analysis assistant that categorizes transactions.'
    },
    {
      role: 'user',
      content: 'Categorize this transaction: "Starbucks Coffee Shop - $4.50"'
    }
  ],
  model: 'anthropic/claude-3.5-sonnet',
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'transaction_category',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          subcategory: { type: 'string' },
          confidence: { type: 'number' }
        },
        required: ['category', 'confidence'],
        additionalProperties: false
      }
    }
  },
  temperature: 0.3,
  max_tokens: 150
});
```

### 3.2 `chatStream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionChunk>`

Method for streaming chat completions (for future use).

**Parameters:**
- Same as `chat()` method

**Returns:**
- `AsyncIterable<ChatCompletionChunk>` - Async iterator of response chunks

**Example:**
```typescript
for await (const chunk of service.chatStream(request)) {
  if (chunk.choices[0]?.delta?.content) {
    console.log(chunk.choices[0].delta.content);
  }
}
```

### 3.3 `validateResponseFormat(format: ResponseFormat): boolean`

Validates response_format structure before sending to API.

**Parameters:**
- `format: ResponseFormat` - Response format to validate

**Returns:**
- `boolean` - True if valid

**Validation Rules:**
1. Must have `type: 'json_schema'`
2. Must have `json_schema` object
3. `json_schema` must have `name` property (string)
4. `json_schema` must have `strict: true`
5. `json_schema` must have valid JSON Schema in `schema` property
6. Schema must be of type 'object'
7. Schema should have `additionalProperties: false` for strict mode

**Example:**
```typescript
const isValid = service.validateResponseFormat({
  type: 'json_schema',
  json_schema: {
    name: 'expense_analysis',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        category: { type: 'string' }
      },
      required: ['amount', 'category'],
      additionalProperties: false
    }
  }
});
```

### 3.4 `getAvailableModels(): Promise<ModelInfo[]>`

Retrieves list of available models from OpenRouter (optional utility method).

**Returns:**
- `Promise<ModelInfo[]>` - Array of model information

## 4. Private Methods and Fields

### 4.1 Private Fields

```typescript
private readonly apiKey: string;
private readonly baseUrl: string;
private readonly defaultModel: string;
private readonly timeout: number;
private readonly maxRetries: number;
private readonly httpClient: OpenRouterClient;
```

### 4.2 `private buildRequestPayload(request: ChatCompletionRequest): object`

Constructs the final API request payload with all parameters.

**Responsibilities:**
- Apply default model if not specified
- Validate message array is not empty
- Ensure system message is first if present
- Merge model parameters with defaults
- Add response_format if provided

**Implementation Notes:**
- Use early returns for validation failures
- Apply guard clauses for invalid states
- Validate response_format structure if present

### 4.3 `private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T>`

Implements exponential backoff retry logic for transient failures.

**Parameters:**
- `fn: () => Promise<T>` - Async function to execute

**Returns:**
- `Promise<T>` - Result from successful execution

**Retry Strategy:**
1. Attempt 1: Immediate
2. Attempt 2: Wait 1 second
3. Attempt 3: Wait 2 seconds
4. Attempt 4: Wait 4 seconds

**Retryable Errors:**
- HTTP 429 (Rate Limit)
- HTTP 503 (Service Unavailable)
- Network timeout errors
- Connection refused errors

**Non-Retryable Errors:**
- HTTP 401 (Authentication)
- HTTP 400 (Bad Request)
- HTTP 404 (Model Not Found)

### 4.4 `private parseResponse(rawResponse: unknown): ChatCompletionResponse`

Parses and validates API response structure.

**Responsibilities:**
- Validate response has expected structure
- Extract message content
- Parse JSON content if response_format was used
- Validate against expected schema if provided

**Error Conditions:**
- Missing required fields
- Invalid JSON in content (when JSON schema expected)
- Schema validation failures

### 4.5 `private validateMessages(messages: ChatMessage[]): void`

Validates message array structure and content.

**Validation Rules:**
1. Array must not be empty
2. Each message must have valid role ('system', 'user', 'assistant')
3. Each message must have non-empty content
4. Only one system message allowed
5. System message must be first if present
6. Must have at least one user message

### 4.6 `private sanitizeForLogging(data: unknown): unknown`

Removes sensitive information before logging.

**Removes:**
- API keys
- Full message content (keep only length/summary)
- User data

**Keeps:**
- Model name
- Message count
- Parameter values
- Error messages

## 5. Error Handling

### 5.1 Custom Error Classes

#### `OpenRouterError`
Base error class for all OpenRouter-related errors.

```typescript
class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  )
}
```

#### `OpenRouterAuthenticationError`
Authentication failures (HTTP 401).

```typescript
class OpenRouterAuthenticationError extends OpenRouterError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401, false);
  }
}
```

#### `OpenRouterRateLimitError`
Rate limiting (HTTP 429).

```typescript
class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, true);
  }
}
```

#### `OpenRouterValidationError`
Request validation failures (HTTP 400).

```typescript
class OpenRouterValidationError extends OpenRouterError {
  constructor(
    message: string,
    public readonly validationErrors: string[]
  ) {
    super(message, 'VALIDATION_ERROR', 400, false);
  }
}
```

#### `OpenRouterModelNotFoundError`
Invalid model name (HTTP 404).

```typescript
class OpenRouterModelNotFoundError extends OpenRouterError {
  constructor(
    message: string,
    public readonly modelName: string
  ) {
    super(message, 'MODEL_NOT_FOUND', 404, false);
  }
}
```

#### `OpenRouterNetworkError`
Network and timeout errors.

```typescript
class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', undefined, true);
    this.cause = cause;
  }
}
```

#### `OpenRouterResponseError`
Response parsing and validation errors.

```typescript
class OpenRouterResponseError extends OpenRouterError {
  constructor(message: string, public readonly rawResponse?: unknown) {
    super(message, 'RESPONSE_ERROR', undefined, false);
  }
}
```

### 5.2 Error Handling Pattern

All public methods follow this pattern:

```typescript
async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  // 1. Validate input (early returns)
  if (!request.messages || request.messages.length === 0) {
    throw new OpenRouterValidationError(
      'Messages array cannot be empty',
      ['messages: array must contain at least one message']
    );
  }

  // 2. Additional validation
  this.validateMessages(request.messages);
  
  if (request.response_format) {
    if (!this.validateResponseFormat(request.response_format)) {
      throw new OpenRouterValidationError(
        'Invalid response_format structure',
        ['response_format must follow json_schema pattern']
      );
    }
  }

  // 3. Execute with error handling
  try {
    return await this.executeWithRetry(async () => {
      const payload = this.buildRequestPayload(request);
      const rawResponse = await this.httpClient.post('/chat/completions', payload);
      return this.parseResponse(rawResponse);
    });
  } catch (error) {
    // 4. Transform errors to typed errors
    if (error instanceof OpenRouterError) {
      throw error;
    }
    
    throw new OpenRouterError(
      'Unexpected error during chat completion',
      'UNKNOWN_ERROR',
      undefined,
      false
    );
  }
}
```

### 5.3 Error Scenarios

| Scenario | Error Type | Retryable | Recovery Action |
|----------|-----------|-----------|-----------------|
| 1. Invalid API key | `OpenRouterAuthenticationError` | No | Fix API key configuration |
| 2. Rate limit exceeded | `OpenRouterRateLimitError` | Yes | Automatic retry with backoff |
| 3. Malformed request | `OpenRouterValidationError` | No | Fix request structure |
| 4. Invalid model name | `OpenRouterModelNotFoundError` | No | Use valid model name |
| 5. Server error (500) | `OpenRouterError` | Yes | Automatic retry |
| 6. Network timeout | `OpenRouterNetworkError` | Yes | Automatic retry |
| 7. Invalid response JSON | `OpenRouterResponseError` | No | Log and report issue |
| 8. Schema validation failure | `OpenRouterResponseError` | No | Review schema definition |

## 6. Security Considerations

### 6.1 API Key Management

**Requirements:**
1. Never hardcode API keys in source code
2. Load from environment variables only
3. Validate presence at service initialization
4. Never log API keys in any form
5. Use readonly property to prevent modification

**Implementation:**
```typescript
constructor(config: OpenRouterConfig) {
  // Validate API key presence
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error('OpenRouter API key is required');
  }
  
  // Store as readonly
  this.apiKey = config.apiKey;
}
```

### 6.2 Request/Response Logging

**Safe Logging Pattern:**
```typescript
private log(level: 'info' | 'error', message: string, data?: unknown) {
  const sanitized = this.sanitizeForLogging(data);
  console[level](message, sanitized);
}

private sanitizeForLogging(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  // Remove sensitive fields
  delete sanitized.apiKey;
  delete sanitized.authorization;
  
  // Truncate message content
  if ('messages' in sanitized && Array.isArray(sanitized.messages)) {
    sanitized.messages = sanitized.messages.map(msg => ({
      role: msg.role,
      contentLength: msg.content?.length || 0
    }));
  }
  
  return sanitized;
}
```

### 6.3 Input Validation

**Prevent Injection Attacks:**
1. Validate all user inputs before including in messages
2. Sanitize special characters in JSON schema names
3. Validate schema structure to prevent malformed JSON
4. Set maximum message length limits
5. Validate model names against allowed list

### 6.4 Rate Limiting

**Client-Side Protection:**
1. Implement request queuing for high-volume scenarios
2. Track request count per minute
3. Respect `Retry-After` headers from API
4. Configure sensible timeout values

## 7. Step-by-Step Implementation Plan

### Step 1: Define Type Definitions

**File:** `src/types.ts`

**Actions:**
1. Define message roles enum
2. Define `ChatMessage` interface
3. Define `ResponseFormat` interface with JSON schema structure
4. Define `ChatCompletionRequest` interface
5. Define `ChatCompletionResponse` interface
6. Define `ChatCompletionChunk` interface (for streaming)
7. Define `OpenRouterConfig` interface
8. Define `ModelInfo` interface

**Example Types:**
```typescript
// Message types
export type ChatMessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

// Response format with JSON schema
export interface JsonSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: JsonSchema;
  };
}

// Request
export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Response
export interface ChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Configuration
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}
```

### Step 2: Create Error Classes

**File:** `src/lib/services/openrouter.errors.ts`

**Actions:**
1. Create base `OpenRouterError` class extending `Error`
2. Create specific error classes for each error scenario
3. Add helper method to create error from HTTP response
4. Export all error classes

**Implementation Order:**
1. `OpenRouterError` (base)
2. `OpenRouterAuthenticationError`
3. `OpenRouterRateLimitError`
4. `OpenRouterValidationError`
5. `OpenRouterModelNotFoundError`
6. `OpenRouterNetworkError`
7. `OpenRouterResponseError`
8. `createErrorFromResponse(status: number, body: unknown)` helper

### Step 3: Implement HTTP Client

**File:** `src/lib/api/openrouter.client.ts`

**Actions:**
1. Create `OpenRouterClient` class
2. Implement `post()` method using `fetch` API
3. Add request headers (Authorization, Content-Type)
4. Implement timeout handling
5. Transform HTTP errors to custom error types
6. Add response status code checking

**Key Implementation Details:**
```typescript
export class OpenRouterClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly timeout: number
  ) {}

  async post(endpoint: string, body: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://budget-manager.app', // Optional
          'X-Title': 'Budget Manager' // Optional
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw createErrorFromResponse(response.status, errorBody);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new OpenRouterNetworkError('Request timeout');
      }
      
      throw error;
    }
  }
}
```

### Step 4: Implement Configuration Validation

**File:** `src/lib/services/openrouter.config.ts`

**Actions:**
1. Create configuration validation function
2. Define default values
3. Create configuration builder with presets
4. Export validated configuration type

**Example:**
```typescript
export function validateConfig(config: OpenRouterConfig): Required<OpenRouterConfig> {
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error('OpenRouter API key is required');
  }

  return {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
    defaultModel: config.defaultModel || 'anthropic/claude-3.5-sonnet',
    timeout: config.timeout || 30000,
    maxRetries: config.maxRetries ?? 3
  };
}

// Preset configurations
export const OPENROUTER_PRESETS = {
  fast: {
    defaultModel: 'openai/gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 500
  },
  accurate: {
    defaultModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.3,
    max_tokens: 1500
  },
  balanced: {
    defaultModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.5,
    max_tokens: 1000
  }
};
```

### Step 5: Implement Core Service Class

**File:** `src/lib/services/openrouter.service.ts`

**Actions:**
1. Create `OpenRouterService` class
2. Implement constructor with config validation
3. Implement private validation methods
4. Implement `buildRequestPayload()` private method
5. Implement `validateResponseFormat()` public method
6. Implement `executeWithRetry()` private method
7. Implement `parseResponse()` private method
8. Implement `sanitizeForLogging()` private method
9. Implement `chat()` public method
10. Add JSDoc documentation for all public methods

**Implementation Order:**
```typescript
export class OpenRouterService {
  // 1. Private fields
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly httpClient: OpenRouterClient;

  // 2. Constructor
  constructor(config: OpenRouterConfig) {
    const validated = validateConfig(config);
    this.apiKey = validated.apiKey;
    this.baseUrl = validated.baseUrl;
    this.defaultModel = validated.defaultModel;
    this.timeout = validated.timeout;
    this.maxRetries = validated.maxRetries;
    this.httpClient = new OpenRouterClient(
      this.apiKey,
      this.baseUrl,
      this.timeout
    );
  }

  // 3. Implement private methods first (bottom-up approach)
  // 4. Implement public methods last
}
```

### Step 6: Add Response Format Validation

**Actions:**
1. Implement comprehensive validation for response_format structure
2. Validate JSON schema structure
3. Check for required properties
4. Validate schema type constraints

**Example Implementation:**
```typescript
validateResponseFormat(format: ResponseFormat): boolean {
  // Check top-level structure
  if (format.type !== 'json_schema') {
    return false;
  }

  // Check json_schema object
  if (!format.json_schema) {
    return false;
  }

  const { name, strict, schema } = format.json_schema;

  // Validate required properties
  if (!name || typeof name !== 'string') {
    return false;
  }

  if (strict !== true) {
    return false;
  }

  // Validate schema structure
  if (!schema || typeof schema !== 'object') {
    return false;
  }

  if (schema.type !== 'object') {
    return false;
  }

  if (!schema.properties || typeof schema.properties !== 'object') {
    return false;
  }

  // Recommend additionalProperties: false for strict mode
  if (schema.additionalProperties !== false) {
    console.warn(
      'Consider setting additionalProperties: false for strict schema validation'
    );
  }

  return true;
}
```

### Step 7: Implement Retry Logic

**Actions:**
1. Implement exponential backoff
2. Check error retryability
3. Add maximum retry limit
4. Log retry attempts

**Example:**
```typescript
private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < this.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      if (error instanceof OpenRouterError && !error.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === this.maxRetries - 1) {
        break;
      }
      
      // Calculate backoff delay
      const delay = Math.pow(2, attempt) * 1000;
      
      console.warn(
        `Request failed (attempt ${attempt + 1}/${this.maxRetries}), ` +
        `retrying in ${delay}ms...`,
        { error: error.message }
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

### Step 8: Add Comprehensive Testing

**File:** `src/lib/services/__tests__/openrouter.service.test.ts`

**Test Cases:**
1. Constructor validation
   - Should throw error for missing API key
   - Should apply default values
   - Should accept custom configuration
2. Message validation
   - Should reject empty message array
   - Should reject invalid message roles
   - Should reject multiple system messages
   - Should require at least one user message
3. Response format validation
   - Should accept valid json_schema format
   - Should reject invalid type
   - Should reject missing name
   - Should reject strict: false
   - Should reject non-object schema
4. Request building
   - Should apply default model
   - Should merge request parameters
   - Should include response_format when provided
5. Error handling
   - Should throw OpenRouterAuthenticationError for 401
   - Should throw OpenRouterRateLimitError for 429
   - Should throw OpenRouterValidationError for 400
   - Should retry on network errors
   - Should not retry on validation errors
6. Successful requests
   - Should return parsed response
   - Should parse JSON content when response_format used
   - Should include usage information

**Testing Tools:**
- Use Vitest (Astro default) or Jest
- Mock `fetch` for HTTP requests
- Use test fixtures for API responses

### Step 9: Create Usage Examples

**File:** `src/lib/services/__examples__/openrouter.examples.ts`

**Examples to Create:**

1. **Basic chat completion:**
```typescript
const service = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!
});

const response = await service.chat({
  messages: [
    { role: 'user', content: 'What is 2+2?' }
  ]
});
```

2. **With system message:**
```typescript
const response = await service.chat({
  messages: [
    { role: 'system', content: 'You are a helpful math tutor.' },
    { role: 'user', content: 'Explain calculus' }
  ],
  temperature: 0.7
});
```

3. **Structured response (transaction categorization):**
```typescript
const response = await service.chat({
  messages: [
    {
      role: 'system',
      content: 'Categorize financial transactions accurately.'
    },
    {
      role: 'user',
      content: 'Transaction: "Whole Foods Market - $127.45"'
    }
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'transaction_category',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['groceries', 'dining', 'transport', 'entertainment', 'utilities', 'other']
          },
          subcategory: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          reasoning: { type: 'string' }
        },
        required: ['category', 'confidence'],
        additionalProperties: false
      }
    }
  },
  temperature: 0.2,
  max_tokens: 200
});

// Parse JSON response
const result = JSON.parse(response.choices[0].message.content);
console.log(result); // { category: 'groceries', confidence: 0.95, ... }
```

4. **Budget analysis with structured output:**
```typescript
const response = await service.chat({
  messages: [
    {
      role: 'system',
      content: 'You are a financial advisor analyzing spending patterns.'
    },
    {
      role: 'user',
      content: `Analyze this monthly spending: 
        Groceries: $650
        Dining: $380
        Transport: $220
        Entertainment: $150
        Total Income: $4000`
    }
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'budget_analysis',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          total_spending: { type: 'number' },
          savings_rate: { type: 'number' },
          recommendations: {
            type: 'array',
            items: { type: 'string' }
          },
          risk_areas: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['total_spending', 'savings_rate', 'recommendations'],
        additionalProperties: false
      }
    }
  },
  model: 'anthropic/claude-3.5-sonnet',
  temperature: 0.3
});
```

5. **Error handling:**
```typescript
try {
  const response = await service.chat({
    messages: [
      { role: 'user', content: 'Hello' }
    ],
    model: 'invalid-model-name'
  });
} catch (error) {
  if (error instanceof OpenRouterModelNotFoundError) {
    console.error(`Model not found: ${error.modelName}`);
  } else if (error instanceof OpenRouterRateLimitError) {
    console.error(`Rate limited, retry after: ${error.retryAfter}s`);
  } else if (error instanceof OpenRouterAuthenticationError) {
    console.error('Invalid API key');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Step 10: Add Environment Configuration

**File:** `.env.example`

**Actions:**
1. Add OpenRouter API key placeholder
2. Add optional configuration variables
3. Document where to get API key

**Example:**
```bash
# OpenRouter API Configuration
# Get your API key from: https://openrouter.ai/keys
OPENROUTER_API_KEY=your_api_key_here

# Optional: Override default model
# OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# Optional: Override API base URL
# OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Step 11: Create Service Factory/Provider

**File:** `src/lib/services/openrouter.provider.ts`

**Actions:**
1. Create singleton instance management
2. Add lazy initialization
3. Validate environment variables
4. Export getter function

**Example:**
```typescript
let instance: OpenRouterService | null = null;

export function getOpenRouterService(): OpenRouterService {
  if (!instance) {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY environment variable is not set. ' +
        'Please add it to your .env file.'
      );
    }
    
    instance = new OpenRouterService({
      apiKey,
      defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL,
      baseUrl: import.meta.env.OPENROUTER_BASE_URL
    });
  }
  
  return instance;
}

// For testing: reset singleton
export function resetOpenRouterService(): void {
  instance = null;
}
```

### Step 12: Add Documentation

**File:** `docs/openrouter-service.md` (or README section)

**Sections:**
1. Installation and setup
2. Configuration
3. Basic usage
4. Advanced features (response_format)
5. Error handling
6. Best practices
7. API reference
8. Examples

### Step 13: Integration Points

**Actions:**
1. Create transaction categorization service using OpenRouter
2. Add budget analysis endpoint
3. Create hooks for React components
4. Add API routes in `src/pages/api`

**Example Integration - Transaction Service:**

**File:** `src/lib/services/transaction-ai.service.ts`

```typescript
import { getOpenRouterService } from './openrouter.provider';
import type { Transaction } from '../types';

export class TransactionAIService {
  private openRouter = getOpenRouterService();

  async categorizeTransaction(transaction: Transaction) {
    const response = await this.openRouter.chat({
      messages: [
        {
          role: 'system',
          content: 'You categorize financial transactions accurately.'
        },
        {
          role: 'user',
          content: `Categorize: "${transaction.description} - $${transaction.amount}"`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'category',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              confidence: { type: 'number' }
            },
            required: ['category', 'confidence'],
            additionalProperties: false
          }
        }
      },
      temperature: 0.2
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

---

## Implementation Checklist

- [ ] Step 1: Define all TypeScript types in `src/types.ts`
- [ ] Step 2: Create error classes in `src/lib/services/openrouter.errors.ts`
- [ ] Step 3: Implement HTTP client in `src/lib/api/openrouter.client.ts`
- [ ] Step 4: Add configuration validation in `src/lib/services/openrouter.config.ts`
- [ ] Step 5: Implement main service in `src/lib/services/openrouter.service.ts`
- [ ] Step 6: Add response_format validation method
- [ ] Step 7: Implement retry logic with exponential backoff
- [ ] Step 8: Write comprehensive unit tests
- [ ] Step 9: Create usage examples file
- [ ] Step 10: Add environment variables to `.env.example`
- [ ] Step 11: Create service provider/factory
- [ ] Step 12: Write documentation
- [ ] Step 13: Create integration services

## Success Criteria

1. ✅ All types are properly defined with TypeScript 5
2. ✅ Error handling covers all scenarios with typed errors
3. ✅ response_format correctly implements json_schema pattern
4. ✅ Retry logic handles transient failures
5. ✅ API keys are never exposed in logs or errors
6. ✅ All public methods have JSDoc documentation
7. ✅ Unit tests achieve >80% code coverage
8. ✅ Service follows project structure guidelines
9. ✅ Early returns and guard clauses used throughout
10. ✅ Integration examples demonstrate real-world usage
