/**
 * Base error class for all OpenRouter-related errors.
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryable = false
  ) {
    super(message);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

/**
 * Authentication failures (HTTP 401).
 */
export class OpenRouterAuthenticationError extends OpenRouterError {
  constructor(message = "Authentication failed. Invalid API key.") {
    super(message, "AUTHENTICATION_ERROR", 401, false);
    this.name = "OpenRouterAuthenticationError";
    Object.setPrototypeOf(this, OpenRouterAuthenticationError.prototype);
  }
}

/**
 * Rate limiting (HTTP 429).
 */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message = "Rate limit exceeded.",
    public readonly retryAfter?: number
  ) {
    super(message, "RATE_LIMIT_ERROR", 429, true);
    this.name = "OpenRouterRateLimitError";
    Object.setPrototypeOf(this, OpenRouterRateLimitError.prototype);
  }
}

/**
 * Request validation failures (HTTP 400).
 */
export class OpenRouterValidationError extends OpenRouterError {
  constructor(
    message: string,
    public readonly validationErrors: string[] = []
  ) {
    super(message, "VALIDATION_ERROR", 400, false);
    this.name = "OpenRouterValidationError";
    Object.setPrototypeOf(this, OpenRouterValidationError.prototype);
  }
}

/**
 * Invalid model name (HTTP 404).
 */
export class OpenRouterModelNotFoundError extends OpenRouterError {
  constructor(
    message: string,
    public readonly modelName: string
  ) {
    super(message, "MODEL_NOT_FOUND", 404, false);
    this.name = "OpenRouterModelNotFoundError";
    Object.setPrototypeOf(this, OpenRouterModelNotFoundError.prototype);
  }
}

/**
 * Network and timeout errors.
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string, cause?: Error) {
    super(message, "NETWORK_ERROR", undefined, true);
    this.name = "OpenRouterNetworkError";
    this.cause = cause;
    Object.setPrototypeOf(this, OpenRouterNetworkError.prototype);
  }
}

/**
 * Response parsing and validation errors.
 */
export class OpenRouterResponseError extends OpenRouterError {
  constructor(
    message: string,
    public readonly rawResponse?: unknown
  ) {
    super(message, "RESPONSE_ERROR", undefined, false);
    this.name = "OpenRouterResponseError";
    Object.setPrototypeOf(this, OpenRouterResponseError.prototype);
  }
}

/**
 * Helper function to create appropriate error from HTTP response.
 */
export function createErrorFromResponse(status: number, body: unknown): OpenRouterError {
  const errorMessage = extractErrorMessage(body);

  switch (status) {
    case 401:
      return new OpenRouterAuthenticationError(errorMessage);

    case 429: {
      const retryAfter = extractRetryAfter(body);
      return new OpenRouterRateLimitError(errorMessage, retryAfter);
    }

    case 400: {
      const validationErrors = extractValidationErrors(body);
      return new OpenRouterValidationError(errorMessage, validationErrors);
    }

    case 404: {
      const modelName = extractModelName(body);
      return new OpenRouterModelNotFoundError(errorMessage || "Model not found", modelName);
    }

    default:
      return new OpenRouterError(
        errorMessage || `HTTP error ${status}`,
        "HTTP_ERROR",
        status,
        status >= 500 || status === 503
      );
  }
}

/**
 * Extract error message from response body.
 */
function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "Unknown error occurred";
  }

  const bodyObj = body as Record<string, unknown>;

  // Try common error message fields
  if (typeof bodyObj.error === "string") {
    return bodyObj.error;
  }

  if (typeof bodyObj.message === "string") {
    return bodyObj.message;
  }

  if (bodyObj.error && typeof bodyObj.error === "object") {
    const errorObj = bodyObj.error as Record<string, unknown>;
    if (typeof errorObj.message === "string") {
      return errorObj.message;
    }
  }

  return "Unknown error occurred";
}

/**
 * Extract retry-after value from response body.
 */
function extractRetryAfter(body: unknown): number | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const bodyObj = body as Record<string, unknown>;

  if (typeof bodyObj.retry_after === "number") {
    return bodyObj.retry_after;
  }

  if (typeof bodyObj.retryAfter === "number") {
    return bodyObj.retryAfter;
  }

  return undefined;
}

/**
 * Extract validation errors from response body.
 */
function extractValidationErrors(body: unknown): string[] {
  if (!body || typeof body !== "object") {
    return [];
  }

  const bodyObj = body as Record<string, unknown>;

  if (Array.isArray(bodyObj.errors)) {
    return bodyObj.errors.filter((e) => typeof e === "string").map((e) => e as string);
  }

  if (Array.isArray(bodyObj.validation_errors)) {
    return bodyObj.validation_errors.filter((e) => typeof e === "string").map((e) => e as string);
  }

  return [];
}

/**
 * Extract model name from error response.
 */
function extractModelName(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "unknown";
  }

  const bodyObj = body as Record<string, unknown>;

  if (typeof bodyObj.model === "string") {
    return bodyObj.model;
  }

  if (typeof bodyObj.model_name === "string") {
    return bodyObj.model_name;
  }

  return "unknown";
}
