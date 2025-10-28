/**
 * Verification script for OpenRouter service integration.
 * Run this to test the service with your API key.
 * 
 * Usage:
 *   1. Make sure OPENROUTER_API_KEY is set in your .env file
 *   2. Run: npm run dev (or your dev command)
 *   3. Import and call verifyOpenRouter() from a test page/API endpoint
 * 
 * Or create a standalone test file and run with ts-node or similar.
 */

import { OpenRouterService } from '../openrouter.service'
import type { ChatCompletionRequest } from '../../../types'

/**
 * Basic connectivity test - simple chat completion
 */
async function testBasicChat(service: OpenRouterService): Promise<void> {
  console.log('\n✓ Test 1: Basic Chat Completion')
  console.log('═'.repeat(50))

  try {
    const response = await service.chat({
      messages: [
        { role: 'user', content: 'Say "Hello from OpenRouter!" and nothing else.' }
      ],
      temperature: 0.3,
      max_tokens: 50
    })

    console.log('✅ Success!')
    console.log('Response:', response.choices[0].message.content)
    console.log('Model:', response.model)
    console.log('Tokens used:', response.usage.total_tokens)
  } catch (error) {
    console.error('❌ Failed:', error instanceof Error ? error.message : error)
    throw error
  }
}

/**
 * Test structured output with JSON schema
 */
async function testStructuredOutput(service: OpenRouterService): Promise<void> {
  console.log('\n✓ Test 2: Structured Output (JSON Schema)')
  console.log('═'.repeat(50))

  try {
    const request: ChatCompletionRequest = {
      messages: [
        {
          role: 'system',
          content: 'You are a financial categorization assistant.'
        },
        {
          role: 'user',
          content: 'Categorize this transaction: "Starbucks Coffee - $4.50"'
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
                enum: ['groceries', 'dining', 'transport', 'entertainment', 'other']
              },
              confidence: { type: 'number' }
            },
            required: ['category', 'confidence'],
            additionalProperties: false
          }
        }
      },
      temperature: 0.2,
      max_tokens: 100
    }

    const response = await service.chat(request)
    const result = JSON.parse(response.choices[0].message.content)

    console.log('✅ Success!')
    console.log('Parsed result:', result)
    console.log('Category:', result.category)
    console.log('Confidence:', result.confidence)
  } catch (error) {
    console.error('❌ Failed:', error instanceof Error ? error.message : error)
    throw error
  }
}

/**
 * Test validation errors
 */
async function testValidation(service: OpenRouterService): Promise<void> {
  console.log('\n✓ Test 3: Validation Errors')
  console.log('═'.repeat(50))

  try {
    // This should throw a validation error
    await service.chat({
      messages: [] // Empty messages array
    })

    console.error('❌ Failed: Should have thrown validation error')
  } catch (error) {
    if (error instanceof Error && error.message.includes('Messages array cannot be empty')) {
      console.log('✅ Success! Validation error caught correctly:', error.message)
    } else {
      console.error('❌ Unexpected error:', error)
      throw error
    }
  }
}

/**
 * Test response format validation
 */
function testResponseFormatValidation(service: OpenRouterService): void {
  console.log('\n✓ Test 4: Response Format Validation')
  console.log('═'.repeat(50))

  // Valid format
  const validFormat = {
    type: 'json_schema' as const,
    json_schema: {
      name: 'test',
      strict: true as const,
      schema: {
        type: 'object' as const,
        properties: {
          field: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  }

  const isValid = service.validateResponseFormat(validFormat)
  if (isValid) {
    console.log('✅ Success! Valid format accepted')
  } else {
    console.error('❌ Failed: Valid format rejected')
    throw new Error('Response format validation failed')
  }

  // Invalid format (missing strict)
  const invalidFormat = {
    type: 'json_schema' as const,
    json_schema: {
      name: 'test',
      strict: false as any, // Invalid: must be true
      schema: {
        type: 'object' as const,
        properties: {},
        additionalProperties: false
      }
    }
  }

  const isInvalid = service.validateResponseFormat(invalidFormat as any)
  if (!isInvalid) {
    console.log('✅ Success! Invalid format rejected')
  } else {
    console.error('❌ Failed: Invalid format accepted')
    throw new Error('Response format validation failed')
  }
}

/**
 * Main verification function
 */
export async function verifyOpenRouter(apiKey: string): Promise<void> {
  console.log('\n' + '═'.repeat(50))
  console.log('OpenRouter Service Integration Verification')
  console.log('═'.repeat(50))

  try {
    // Create service instance
    const service = new OpenRouterService({
      apiKey,
      timeout: 30000,
      maxRetries: 2 // Reduce retries for faster testing
    })

    console.log('✅ Service instance created successfully')

    // Run tests
    testResponseFormatValidation(service)
    await testValidation(service)
    await testBasicChat(service)
    await testStructuredOutput(service)

    console.log('\n' + '═'.repeat(50))
    console.log('🎉 All tests passed!')
    console.log('═'.repeat(50))
    console.log('\nYour OpenRouter integration is working correctly.')
    console.log('You can now use the service in your application.')
  } catch (error) {
    console.log('\n' + '═'.repeat(50))
    console.log('❌ Verification failed')
    console.log('═'.repeat(50))
    console.error('\nError details:', error)
    throw error
  }
}

/**
 * Example: Run verification with provider
 */
export async function verifyWithProvider(): Promise<void> {
  const { getOpenRouterService } = await import('../openrouter.provider')
  
  try {
    const service = getOpenRouterService()
    console.log('✅ Service loaded from provider successfully')
    
    // Run a quick test
    const response = await service.chat({
      messages: [
        { role: 'user', content: 'Respond with just "OK"' }
      ],
      max_tokens: 10
    })
    
    console.log('✅ Provider test successful!')
    console.log('Response:', response.choices[0].message.content)
  } catch (error) {
    console.error('❌ Provider test failed:', error)
    throw error
  }
}

// If running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable not set')
    console.error('Please set it in your .env file or export it:')
    console.error('  export OPENROUTER_API_KEY="your-api-key"')
    process.exit(1)
  }
  
  verifyOpenRouter(apiKey).catch(() => process.exit(1))
}
