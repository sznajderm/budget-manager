# OpenRouter Service Verification Guide

This guide will help you verify that the OpenRouter service integration is working correctly.

## Prerequisites

1. **Get an API key** from [OpenRouter](https://openrouter.ai/keys)
2. **Add the API key to your `.env` file**:
   ```bash
   OPENROUTER_API_KEY=your_api_key_here
   ```

## Verification Methods

### Method 1: Using the API Endpoint (Recommended)

This is the simplest way to verify the integration.

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser or use curl**:
   ```bash
   curl http://localhost:4321/api/verify-openrouter
   ```

   Or visit in browser: `http://localhost:4321/api/verify-openrouter`

3. **Check the results**:
   - ✅ If all tests pass, you'll see:
     ```json
     {
       "success": true,
       "results": [...],
       "summary": {
         "message": "✅ All tests passed! OpenRouter integration is working correctly."
       }
     }
     ```
   - ❌ If any test fails, check the error details in the response

### Method 2: Using the Verification Script

For more detailed testing and debugging.

1. **Import the verification function** in your code:
   ```typescript
   import { verifyOpenRouter } from './src/lib/services/__examples__/verify-openrouter'
   
   // With direct API key
   await verifyOpenRouter('your-api-key')
   
   // Or with provider
   import { verifyWithProvider } from './src/lib/services/__examples__/verify-openrouter'
   await verifyWithProvider()
   ```

2. **Run the tests** - you'll see detailed console output for each test

### Method 3: Manual Integration Test

Test the service directly in your application:

```typescript
import { getOpenRouterService } from './lib/services/openrouter.provider'

// Get service instance
const service = getOpenRouterService()

// Simple test
const response = await service.chat({
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
})

console.log(response.choices[0].message.content)
```

## What Gets Tested

The verification runs 4 tests:

### 1. **Service Initialization**
- Verifies the service can be created from environment variables
- Checks configuration validation

### 2. **Response Format Validation**
- Tests the JSON schema validation logic
- Ensures invalid formats are rejected

### 3. **Basic Chat Completion**
- Makes a real API call to OpenRouter
- Verifies response parsing
- Tests error handling

### 4. **Structured Output (JSON Schema)**
- Tests the `response_format` feature
- Verifies JSON parsing of structured responses
- Example: Transaction categorization

## Common Issues

### ❌ "OPENROUTER_API_KEY environment variable is not set"

**Solution**: Add your API key to `.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

Then restart your dev server.

### ❌ "Authentication failed. Invalid API key."

**Solution**: 
1. Check that your API key is correct
2. Visit [OpenRouter Keys](https://openrouter.ai/keys) to verify or regenerate
3. Ensure there are no extra spaces in your `.env` file

### ❌ "Rate limit exceeded"

**Solution**: 
- Wait a moment and try again
- The service has automatic retry logic with exponential backoff
- Check your OpenRouter account limits

### ❌ "Request timeout"

**Solution**:
- Check your internet connection
- Increase timeout in configuration (default: 30 seconds)
- Try again - network issues are automatically retried

## Next Steps

Once verification passes:

1. **Integrate into your application**:
   ```typescript
   import { getOpenRouterService } from '@/lib/services/openrouter.provider'
   
   const service = getOpenRouterService()
   ```

2. **Use for transaction categorization**:
   ```typescript
   const result = await service.chat({
     messages: [
       { role: 'system', content: 'Categorize transactions.' },
       { role: 'user', content: `Categorize: "${transaction.description}"` }
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
     }
   })
   ```

3. **Explore other features**:
   - Budget analysis
   - Spending insights
   - Financial recommendations

## Support

If you encounter issues:

1. Check the error details in the verification output
2. Review the [OpenRouter documentation](https://openrouter.ai/docs)
3. Check your API key permissions and credits
4. Verify your `.env` file is properly loaded

## Cost Monitoring

The verification tests use minimal tokens (typically < 500 total). Monitor your usage at [OpenRouter](https://openrouter.ai/activity).
