import { OpenRouterService } from "./openrouter.service";

/**
 * Initializes and returns a configured OpenRouterService instance.
 * Reads configuration from environment variables.
 *
 * @returns Configured OpenRouterService instance
 * @throws Error if OPENROUTER_API_KEY is not set
 */
export function initOpenRouterService(): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  const defaultModel = import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini";

  const baseUrl = import.meta.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  return new OpenRouterService({
    apiKey,
    defaultModel,
    baseUrl,
    timeout: 30000, // 30 seconds
    maxRetries: 3,
  });
}
