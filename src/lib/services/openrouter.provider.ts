import { OpenRouterService } from "./openrouter.service";

/**
 * Singleton instance of OpenRouter service.
 */
let instance: OpenRouterService | null = null;

/**
 * Gets or creates the OpenRouter service singleton instance.
 * Reads API key and configuration from environment variables.
 *
 * @returns OpenRouter service instance
 * @throws Error if OPENROUTER_API_KEY environment variable is not set
 */
export function getOpenRouterService(): OpenRouterService {
  if (!instance) {
    // Log all available environment variables (without sensitive values)
    console.log("[OpenRouterProvider] Environment check:", {
      hasApiKey: !!import.meta.env.OPENROUTER_API_KEY,
      apiKeyLength: import.meta.env.OPENROUTER_API_KEY?.length,
      defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL,
      baseUrl: import.meta.env.OPENROUTER_BASE_URL,
      timeout: import.meta.env.OPENROUTER_TIMEOUT,
      maxRetries: import.meta.env.OPENROUTER_MAX_RETRIES,
      allEnvKeys: Object.keys(import.meta.env),
    });

    // Check for API key in environment
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("[OpenRouterProvider] OPENROUTER_API_KEY is missing!");
      throw new Error(
        "OPENROUTER_API_KEY environment variable is not set. " +
          "Please add it to your .env file. " +
          "Get your API key from: https://openrouter.ai/keys"
      );
    }

    // Create service with environment configuration
    instance = new OpenRouterService({
      apiKey,
      defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL,
      baseUrl: import.meta.env.OPENROUTER_BASE_URL,
      timeout: import.meta.env.OPENROUTER_TIMEOUT ? parseInt(import.meta.env.OPENROUTER_TIMEOUT, 10) : undefined,
      maxRetries: import.meta.env.OPENROUTER_MAX_RETRIES
        ? parseInt(import.meta.env.OPENROUTER_MAX_RETRIES, 10)
        : undefined,
    });
  }

  return instance;
}

/**
 * Resets the OpenRouter service singleton.
 * Useful for testing or when configuration changes.
 */
export function resetOpenRouterService(): void {
  instance = null;
}
