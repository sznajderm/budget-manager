import type { OpenRouterConfig } from '../../types'

/**
 * Default configuration values for OpenRouter service.
 */
const DEFAULTS = {
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'anthropic/claude-3.5-sonnet',
  timeout: 30000,
  maxRetries: 3
} as const

/**
 * Validates and normalizes OpenRouter configuration.
 * Applies default values for optional fields.
 * 
 * @param config - User-provided configuration
 * @returns Fully populated configuration with all required fields
 * @throws Error if API key is missing or invalid
 */
export function validateConfig(config: OpenRouterConfig): Required<OpenRouterConfig> {
  // Validate API key
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error(
      'OpenRouter API key is required. ' +
      'Please provide a valid API key in the configuration.'
    )
  }

  // Validate base URL if provided
  if (config.baseUrl !== undefined) {
    try {
      new URL(config.baseUrl)
    } catch {
      throw new Error(
        `Invalid base URL: ${config.baseUrl}. ` +
        'Base URL must be a valid URL format.'
      )
    }
  }

  // Validate timeout if provided
  if (config.timeout !== undefined && config.timeout <= 0) {
    throw new Error(
      `Invalid timeout: ${config.timeout}. ` +
      'Timeout must be a positive number in milliseconds.'
    )
  }

  // Validate max retries if provided
  if (config.maxRetries !== undefined) {
    if (!Number.isInteger(config.maxRetries) || config.maxRetries < 0) {
      throw new Error(
        `Invalid maxRetries: ${config.maxRetries}. ` +
        'maxRetries must be a non-negative integer.'
      )
    }
  }

  return {
    apiKey: config.apiKey.trim(),
    baseUrl: config.baseUrl || DEFAULTS.baseUrl,
    defaultModel: config.defaultModel || DEFAULTS.defaultModel,
    timeout: config.timeout ?? DEFAULTS.timeout,
    maxRetries: config.maxRetries ?? DEFAULTS.maxRetries
  }
}

/**
 * Preset configurations for different use cases.
 */
export const OPENROUTER_PRESETS = {
  /**
   * Fast responses with lower cost.
   * Good for simple categorization tasks.
   */
  fast: {
    defaultModel: 'openai/gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 500
  },
  
  /**
   * High accuracy with detailed analysis.
   * Best for complex financial insights.
   */
  accurate: {
    defaultModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.3,
    max_tokens: 1500
  },
  
  /**
   * Balanced cost and performance.
   * Suitable for most use cases.
   */
  balanced: {
    defaultModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.5,
    max_tokens: 1000
  }
} as const
