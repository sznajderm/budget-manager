import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  OpenRouterConfig,
  ResponseFormat,
} from "../../types";
import { OpenRouterClient } from "../api/openrouter.client";
import { validateConfig } from "./openrouter.config";
import { OpenRouterError, OpenRouterValidationError, OpenRouterResponseError } from "./openrouter.errors";

/**
 * Service for interacting with OpenRouter API to complete LLM-based chat operations.
 * Provides type-safe interface for chat completions with structured output support.
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly httpClient: OpenRouterClient;

  /**
   * Creates a new OpenRouter service instance.
   *
   * @param config - Service configuration including API key and optional settings
   * @throws Error if configuration is invalid
   */
  constructor(config: OpenRouterConfig) {
    const validated = validateConfig(config);

    this.apiKey = validated.apiKey;
    this.baseUrl = validated.baseUrl;
    this.defaultModel = validated.defaultModel;
    this.timeout = validated.timeout;
    this.maxRetries = validated.maxRetries;

    this.httpClient = new OpenRouterClient(this.apiKey, this.baseUrl, this.timeout);
  }

  /**
   * Main method for non-streaming chat completions.
   * Validates request, sends to API, and returns parsed response.
   *
   * @param request - Chat completion request configuration
   * @returns Parsed API response
   * @throws OpenRouterValidationError for invalid requests
   * @throws OpenRouterError for API errors
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Validate messages
    if (!request.messages || request.messages.length === 0) {
      throw new OpenRouterValidationError("Messages array cannot be empty", [
        "messages: array must contain at least one message",
      ]);
    }

    this.validateMessages(request.messages);

    // Validate response_format if provided
    if (request.response_format) {
      if (!this.validateResponseFormat(request.response_format)) {
        throw new OpenRouterValidationError("Invalid response_format structure", [
          "response_format must follow json_schema pattern with strict: true",
        ]);
      }
    }

    // Execute with retry logic
    try {
      return await this.executeWithRetry(async () => {
        const payload = this.buildRequestPayload(request);
        const rawResponse = await this.httpClient.post("/chat/completions", payload);
        return this.parseResponse(rawResponse);
      });
    } catch (error) {
      // Transform unknown errors to OpenRouterError
      if (error instanceof OpenRouterError) {
        throw error;
      }

      throw new OpenRouterError("Unexpected error during chat completion", "UNKNOWN_ERROR", undefined, false);
    }
  }

  /**
   * Validates response_format structure before sending to API.
   *
   * @param format - Response format to validate
   * @returns True if valid, false otherwise
   */
  validateResponseFormat(format: ResponseFormat): boolean {
    // Check top-level structure
    if (format.type !== "json_schema") {
      return false;
    }

    // Check json_schema object exists
    if (!format.json_schema) {
      return false;
    }

    const { name, strict, schema } = format.json_schema;

    // Validate required properties
    if (!name || typeof name !== "string") {
      return false;
    }

    if (strict !== true) {
      return false;
    }

    // Validate schema structure
    if (!schema || typeof schema !== "object") {
      return false;
    }

    if (schema.type !== "object") {
      return false;
    }

    if (!schema.properties || typeof schema.properties !== "object") {
      return false;
    }

    // Recommend additionalProperties: false for strict mode
    if (schema.additionalProperties !== false) {
      console.warn("Consider setting additionalProperties: false for strict schema validation");
    }

    return true;
  }

  /**
   * Constructs the final API request payload with all parameters.
   * Applies default model if not specified and merges all request parameters.
   *
   * @param request - Chat completion request
   * @returns API request payload ready to send
   */
  private buildRequestPayload(request: ChatCompletionRequest): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      messages: request.messages,
      model: request.model || this.defaultModel,
    };

    // Add optional parameters if provided
    if (request.response_format !== undefined) {
      payload.response_format = request.response_format;
    }

    if (request.temperature !== undefined) {
      payload.temperature = request.temperature;
    }

    if (request.max_tokens !== undefined) {
      payload.max_tokens = request.max_tokens;
    }

    if (request.top_p !== undefined) {
      payload.top_p = request.top_p;
    }

    if (request.frequency_penalty !== undefined) {
      payload.frequency_penalty = request.frequency_penalty;
    }

    if (request.presence_penalty !== undefined) {
      payload.presence_penalty = request.presence_penalty;
    }

    return payload;
  }

  /**
   * Parses and validates API response structure.
   * Extracts message content and validates expected fields.
   *
   * @param rawResponse - Raw response from API
   * @returns Parsed and validated chat completion response
   * @throws OpenRouterResponseError if response structure is invalid
   */
  private parseResponse(rawResponse: unknown): ChatCompletionResponse {
    if (!rawResponse || typeof rawResponse !== "object") {
      throw new OpenRouterResponseError("Invalid response: expected object", rawResponse);
    }

    const response = rawResponse as Record<string, unknown>;

    // Validate required fields
    if (typeof response.id !== "string") {
      throw new OpenRouterResponseError("Invalid response: missing or invalid id field", rawResponse);
    }

    if (typeof response.model !== "string") {
      throw new OpenRouterResponseError("Invalid response: missing or invalid model field", rawResponse);
    }

    if (typeof response.created !== "number") {
      throw new OpenRouterResponseError("Invalid response: missing or invalid created field", rawResponse);
    }

    if (!Array.isArray(response.choices) || response.choices.length === 0) {
      throw new OpenRouterResponseError("Invalid response: missing or empty choices array", rawResponse);
    }

    // Validate usage field
    if (!response.usage || typeof response.usage !== "object") {
      throw new OpenRouterResponseError("Invalid response: missing or invalid usage field", rawResponse);
    }

    const usage = response.usage as Record<string, unknown>;
    if (
      typeof usage.prompt_tokens !== "number" ||
      typeof usage.completion_tokens !== "number" ||
      typeof usage.total_tokens !== "number"
    ) {
      throw new OpenRouterResponseError("Invalid response: invalid usage token counts", rawResponse);
    }

    // Validate first choice
    const firstChoice = response.choices[0] as Record<string, unknown>;
    if (typeof firstChoice.index !== "number" || !firstChoice.message || typeof firstChoice.message !== "object") {
      throw new OpenRouterResponseError("Invalid response: invalid choice structure", rawResponse);
    }

    const message = firstChoice.message as Record<string, unknown>;
    if (typeof message.role !== "string" || typeof message.content !== "string") {
      throw new OpenRouterResponseError("Invalid response: invalid message structure", rawResponse);
    }

    // Return typed response
    return response as ChatCompletionResponse;
  }

  /**
   * Validates message array structure and content.
   *
   * @param messages - Array of chat messages to validate
   * @throws OpenRouterValidationError if validation fails
   */
  private validateMessages(messages: ChatMessage[]): void {
    // Check array is not empty
    if (!messages || messages.length === 0) {
      throw new OpenRouterValidationError("Messages array cannot be empty", [
        "messages: array must contain at least one message",
      ]);
    }

    const validRoles = ["system", "user", "assistant"];
    let systemMessageCount = 0;
    let userMessageCount = 0;

    messages.forEach((message, index) => {
      // Validate role
      if (!message.role || !validRoles.includes(message.role)) {
        throw new OpenRouterValidationError(`Invalid message role at index ${index}`, [
          `message[${index}].role must be one of: ${validRoles.join(", ")}`,
        ]);
      }

      // Validate content
      if (!message.content || message.content.trim().length === 0) {
        throw new OpenRouterValidationError(`Empty message content at index ${index}`, [
          `message[${index}].content cannot be empty`,
        ]);
      }

      // Count message types
      if (message.role === "system") {
        systemMessageCount++;
      }
      if (message.role === "user") {
        userMessageCount++;
      }
    });

    // Only one system message allowed
    if (systemMessageCount > 1) {
      throw new OpenRouterValidationError("Multiple system messages not allowed", [
        "Only one system message is allowed per request",
      ]);
    }

    // System message must be first if present
    if (systemMessageCount === 1 && messages[0].role !== "system") {
      throw new OpenRouterValidationError("System message must be first", [
        "If a system message is present, it must be the first message",
      ]);
    }

    // Must have at least one user message
    if (userMessageCount === 0) {
      throw new OpenRouterValidationError("At least one user message required", [
        "Request must contain at least one user message",
      ]);
    }
  }

  /**
   * Removes sensitive information before logging.
   *
   * @param data - Data to sanitize
   * @returns Sanitized data safe for logging
   */
  private sanitizeForLogging(data: unknown): unknown {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sanitized = { ...data } as Record<string, unknown>;

    // Remove sensitive fields
    delete sanitized.apiKey;
    delete sanitized.authorization;

    // Truncate message content
    if ("messages" in sanitized && Array.isArray(sanitized.messages)) {
      sanitized.messages = sanitized.messages.map((msg) => ({
        role: msg.role,
        contentLength: msg.content?.length || 0,
      }));
    }

    return sanitized;
  }

  /**
   * Executes a function with exponential backoff retry logic.
   * Only retries on transient failures (rate limits, network errors, server errors).
   *
   * @param fn - Async function to execute with retry logic
   * @returns Result from successful execution
   * @throws OpenRouterError if all retry attempts fail or error is not retryable
   */
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

        // Calculate exponential backoff delay: 2^attempt * 1000ms
        const delay = Math.pow(2, attempt) * 1000;

        console.warn(`Request failed (attempt ${attempt + 1}/${this.maxRetries}), ` + `retrying in ${delay}ms...`, {
          error: error instanceof Error ? error.message : String(error),
        });

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error("All retry attempts failed");
  }
}
