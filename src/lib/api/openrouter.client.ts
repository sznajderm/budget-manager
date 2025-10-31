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

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
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

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw createErrorFromResponse(response.status, errorBody);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterNetworkError(`Request timeout after ${this.timeout}ms`);
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new OpenRouterNetworkError("Network request failed. Please check your connection.", error);
      }

      // Re-throw already transformed errors
      throw error;
    }
  }
}
