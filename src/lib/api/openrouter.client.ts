import { createErrorFromResponse, OpenRouterNetworkError } from "../services/openrouter.errors";

/**
 * HTTP client for OpenRouter API using native fetch.
 * Handles authentication, timeouts, and error transformation.
 */
export class OpenRouterClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly timeout: number
  ) {}

  /**
   * Sends a POST request to the OpenRouter API.
   *
   * @param endpoint - API endpoint (e.g., '/chat/completions')
   * @param body - Request payload
   * @returns Parsed JSON response
   * @throws OpenRouterError for API errors, OpenRouterNetworkError for network issues
   */
  async post(endpoint: string, body: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Log request details (without sensitive data)
    console.log("[OpenRouter] Initiating request:", {
      endpoint,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length,
      bodyKeys: body && typeof body === "object" ? Object.keys(body) : "not-an-object",
    });

    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log("[OpenRouter] Fetching URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://budget-manager.app",
          "X-Title": "Budget Manager",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      console.log("[OpenRouter] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error("[OpenRouter] API error response:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: JSON.stringify(errorBody, null, 2),
        });
        throw createErrorFromResponse(response.status, errorBody);
      }

      console.log("[OpenRouter] Request successful");
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      console.error("[OpenRouter] Request failed:", {
        errorName: error instanceof Error ? error.name : "unknown",
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        isTypeError: error instanceof TypeError,
        isAbortError: error instanceof Error && error.name === "AbortError",
      });

      // Handle timeout
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[OpenRouter] Request timed out after", this.timeout, "ms");
        throw new OpenRouterNetworkError(`Request timeout after ${this.timeout}ms`);
      }

      // Handle network errors
      if (error instanceof TypeError) {
        console.error("[OpenRouter] Network error (TypeError):", error.message);
        throw new OpenRouterNetworkError("Network request failed. Please check your connection.", error);
      }

      // Re-throw already transformed errors
      throw error;
    }
  }
}
