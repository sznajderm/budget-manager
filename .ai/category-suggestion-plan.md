# AI Category Suggestion Implementation Plan

## Overview

This document outlines the implementation plan for adding AI-powered category suggestions when users create new transactions. The AI suggestion process runs asynchronously in the background and does not block transaction creation.

## Feature Requirements

- **Trigger**: AI suggestions are generated immediately after transaction creation
- **Execution**: Fire-and-forget async pattern (non-blocking)
- **AI Provider**: OpenRouter API with configurable model
- **Context**: Transaction details (description, amount, type) + user's existing categories
- **Storage**: All suggestions stored in `ai_suggestions` table regardless of confidence score
- **Error Handling**: Errors logged but do not impact transaction creation

## Architecture Overview

```
Transaction Creation Flow:
1. User creates transaction via POST /api/rest/v1/transactions
2. Transaction is validated and inserted into database
3. Transaction response is returned to user immediately
4. Background job triggered (fire-and-forget):
   a. Fetch user's categories
   b. Call OpenRouter API with transaction context
   c. Parse AI response for category suggestion + confidence
   d. Insert suggestion into ai_suggestions table
5. Any errors in step 4 are logged but do not affect the user
```

## Implementation Tasks

### 1. Environment Configuration

**File**: `.env` (example in `.env.example`)

Add required environment variables:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.2-3b-instruct:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

**Validation**:
- Ensure `OPENROUTER_API_KEY` is validated at startup
- Model defaults to value from env or falls back to a sensible default

---

### 2. Create AI Suggestion Service

**File**: `src/lib/services/ai-suggestion.service.ts`

**Purpose**: Service layer for generating and storing AI category suggestions

**Exports**:
- `generateCategorySuggestion()` - Main function to generate AI suggestion
- `CategorySuggestionSchema` - Zod schema for AI response validation
- `AISuggestionCreateSchema` - Zod schema for database insert

**Key Functions**:

#### `generateCategorySuggestion()`
```typescript
async function generateCategorySuggestion(
  supabase: SupabaseClient,
  transaction: {
    id: string;
    description: string;
    amount_cents: number;
    transaction_type: TransactionType;
  },
  userId: string
): Promise<void>
```

**Logic**:
1. Fetch user's categories using `listCategories()` from `category.service.ts`
2. If no categories exist, log warning and return early
3. Build AI prompt with transaction details and category list
4. Call OpenRouter service with structured output format
5. Parse AI response to extract `suggested_category_id` and `confidence_score`
6. Validate that suggested category exists in user's categories
7. Insert record into `ai_suggestions` table
8. Handle all errors gracefully with detailed logging

**AI Prompt Structure**:
```typescript
const systemPrompt = `You are a financial transaction categorization assistant. 
Your task is to suggest the most appropriate category for a transaction based on 
its description, amount, and type.

Available categories:
${categories.map(c => `- ${c.name} (id: ${c.id})`).join('\n')}

Respond with the category ID that best matches the transaction and your confidence 
score (0.0 to 1.0).`;

const userPrompt = `Transaction Details:
- Description: ${transaction.description}
- Amount: $${(transaction.amount_cents / 100).toFixed(2)}
- Type: ${transaction.transaction_type}

Select the most appropriate category from the list.`;
```

**Response Format** (using OpenRouter structured output):
```typescript
const responseFormat: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "category_suggestion",
    strict: true,
    schema: {
      type: "object",
      properties: {
        suggested_category_id: { 
          type: "string",
          description: "UUID of the suggested category"
        },
        confidence_score: { 
          type: "number",
          description: "Confidence score between 0.0 and 1.0"
        },
        reasoning: {
          type: "string",
          description: "Brief explanation of why this category was chosen"
        }
      },
      required: ["suggested_category_id", "confidence_score"],
      additionalProperties: false
    }
  }
};
```

**Error Handling**:
- Wrap entire function in try-catch
- Log errors with context (transaction ID, user ID, error message)
- Never throw errors (fire-and-forget pattern)
- Handle specific cases:
  - No categories available
  - OpenRouter API failure
  - Invalid AI response format
  - Suggested category not in user's list
  - Database insert failure

**Database Insert**:
```typescript
await supabase
  .from("ai_suggestions")
  .insert({
    transaction_id: transaction.id,
    suggested_category_id: validatedCategoryId,
    confidence_score: confidenceScore,
    approved: null, // Initial state is pending
  });
```

---

### 3. Create OpenRouter Service Initialization Helper

**File**: `src/lib/services/openrouter.init.ts`

**Purpose**: Centralized initialization of OpenRouter service with environment config

**Exports**:
- `initOpenRouterService()` - Factory function that creates OpenRouterService instance

```typescript
export function initOpenRouterService(): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const defaultModel = import.meta.env.OPENROUTER_DEFAULT_MODEL || 
    "meta-llama/llama-3.2-3b-instruct:free";
  const baseUrl = import.meta.env.OPENROUTER_BASE_URL || 
    "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  return new OpenRouterService({
    apiKey,
    defaultModel,
    baseUrl,
    timeout: 30000, // 30 seconds
    maxRetries: 3,
  });
}
```

**Benefits**:
- Single source of truth for OpenRouter configuration
- Easy to test and mock
- Validates environment variables at initialization

---

### 4. Update Transaction Service

**File**: `src/lib/services/transaction.service.ts`

**Changes**:
1. Import AI suggestion service
2. No changes to `createTransaction()` return signature
3. Function remains synchronous from caller perspective

**Note**: The actual background job trigger happens in the API endpoint layer, not in the service layer. This maintains separation of concerns and makes the service easier to test.

---

### 5. Update Transaction API Endpoint

**File**: `src/pages/api/rest/v1/transactions/index.ts`

**Changes to `POST` handler**:

After successful transaction creation (line 113-118), add fire-and-forget call:

```typescript
// Create transaction using service
const newTransaction = await createTransaction(supabase, user.id, validatedData);

// Trigger AI suggestion generation asynchronously (fire-and-forget)
// This runs in the background and does not block the response
generateCategorySuggestion(
  supabase,
  {
    id: newTransaction.id,
    description: newTransaction.description,
    amount_cents: newTransaction.amount_cents,
    transaction_type: newTransaction.transaction_type,
  },
  user.id
).catch((error) => {
  // Log errors but don't propagate them
  console.error("Background AI suggestion generation failed:", {
    transactionId: newTransaction.id,
    userId: user.id,
    error: error instanceof Error ? error.message : String(error),
  });
});

// Return transaction response immediately (don't await AI suggestion)
return new Response(JSON.stringify(newTransaction), {
  status: 201,
  headers: { "Content-Type": "application/json" },
});
```

**Important**:
- Do NOT await the `generateCategorySuggestion()` call
- Add `.catch()` handler to prevent unhandled promise rejections
- Log any errors from background job
- Transaction response is returned before AI processing completes

---

### 6. Update Types

**File**: `src/types.ts`

**Changes**: Verify existing types are sufficient

Existing types that will be used:
- ✅ `AISuggestionDTO` - Already defined (lines 89-98)
- ✅ `ChatCompletionRequest` - Already defined (lines 152-161)
- ✅ `ResponseFormat` - Already defined (lines 142-149)
- ✅ `TransactionType` - Already defined (line 53)
- ✅ `CategoryDTO` - Already defined (line 31)

**New types to add** (if needed):

```typescript
/** Internal type for AI suggestion generation */
export interface TransactionForSuggestion {
  id: string;
  description: string;
  amount_cents: number;
  transaction_type: TransactionType;
}

/** Parsed AI response structure */
export interface AICategorySuggestion {
  suggested_category_id: string;
  confidence_score: number;
  reasoning?: string;
}
```

---

### 7. Database Schema Validation

**File**: `supabase/migrations/20251015151641_create_budget_manager_schema.sql`

**Verify existing schema** (lines 147-176):
- ✅ Table `ai_suggestions` exists
- ✅ Fields: `id`, `transaction_id`, `suggested_category_id`, `confidence_score`, `approved`
- ✅ Constraints: confidence_score between 0.000 and 1.000
- ✅ Unique constraint: one suggestion per transaction
- ✅ Foreign keys: transaction_id → transactions, suggested_category_id → categories
- ✅ RLS policies enabled

**Action**: No migration needed - schema is already correct

---

### 8. Row Level Security (RLS) Policies

**Verify RLS policies exist for `ai_suggestions` table**

The schema shows RLS is enabled (line 224), but we need to verify policies exist.

**Required policies**:

```sql
-- ai_suggestions select policy - users can see suggestions for their transactions
create policy ai_suggestions_select_authenticated on ai_suggestions
  for select
  to authenticated
  using (
    exists (
      select 1 from transactions
      where transactions.id = ai_suggestions.transaction_id
      and transactions.user_id = auth.uid()
    )
  );

-- ai_suggestions insert policy - service can insert suggestions
-- (Note: This should be handled by service role, not user sessions)
create policy ai_suggestions_insert_service on ai_suggestions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from transactions
      where transactions.id = ai_suggestions.transaction_id
      and transactions.user_id = auth.uid()
    )
  );

-- ai_suggestions update policy - users can update approval status
create policy ai_suggestions_update_authenticated on ai_suggestions
  for update
  to authenticated
  using (
    exists (
      select 1 from transactions
      where transactions.id = ai_suggestions.transaction_id
      and transactions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from transactions
      where transactions.id = ai_suggestions.transaction_id
      and transactions.user_id = auth.uid()
    )
  );
```

**Action**: Check if these policies exist, create migration if needed

---

### 9. Testing Strategy

#### Unit Tests

**File**: `src/lib/services/ai-suggestion.service.test.ts`

Test cases:
- ✅ Successfully generates suggestion with valid transaction and categories
- ✅ Returns early when user has no categories
- ✅ Handles OpenRouter API errors gracefully
- ✅ Validates AI response format
- ✅ Rejects suggestions for non-existent categories
- ✅ Handles database insert failures
- ✅ Logs all errors appropriately

Mock dependencies:
- Supabase client
- OpenRouter service
- Category service

#### Integration Tests

**File**: `src/pages/api/rest/v1/transactions/index.test.ts`

Test cases:
- ✅ Transaction creation returns 201 immediately
- ✅ AI suggestion job is triggered (verify function called)
- ✅ Transaction creation succeeds even if AI suggestion fails
- ✅ Verify fire-and-forget pattern (no await)


---

### 10. Logging and Monitoring

**Logging Strategy**:

All logs should include context for debugging:

```typescript
// Success logging
console.log("AI category suggestion generated", {
  transactionId: transaction.id,
  userId: userId,
  suggestedCategoryId: suggestion.suggested_category_id,
  confidenceScore: suggestion.confidence_score,
  processingTimeMs: endTime - startTime,
});

// Error logging
console.error("AI suggestion generation failed", {
  transactionId: transaction.id,
  userId: userId,
  error: error.message,
  errorType: error.constructor.name,
  stage: "openrouter_call", // or "category_fetch", "db_insert", etc.
});

// Warning logging
console.warn("No categories available for AI suggestion", {
  transactionId: transaction.id,
  userId: userId,
});
```

**Monitoring Metrics** (future consideration):
- Success rate of AI suggestions
- Average confidence scores
- AI API response times
- Failure reasons breakdown

---

### 11. Documentation

#### API Documentation

No changes to public API - this is an internal background job

---

## Implementation Order

1. **Environment Setup** (5 min)
   - Add environment variables
   - Update `.env.example`

2. **OpenRouter Initialization Helper** (15 min)
   - Create `openrouter.init.ts`
   - Write initialization function
   - Add error handling for missing env vars

3. **AI Suggestion Service** (60 min)
   - Create `ai-suggestion.service.ts`
   - Implement `generateCategorySuggestion()` function
   - Build AI prompt structure
   - Define response format schema
   - Add comprehensive error handling

4. **Update Transaction API Endpoint** (15 min)
   - Import AI suggestion service
   - Add fire-and-forget call after transaction creation
   - Add catch block for error logging

5. **Verify RLS Policies** (20 min)
   - Check existing policies in database
   - Create migration if policies are missing

6. **Type Updates** (10 min)
   - Add new types to `src/types.ts`
   - Ensure all types are exported correctly

7. **Unit Tests** (45 min)
   - Write tests for AI suggestion service
   - Mock dependencies
   - Test error scenarios

8. **Integration Tests** (30 min)
   - Test transaction creation flow
   - Verify fire-and-forget pattern
   - Ensure failures don't block transaction creation

9. **Manual Testing** (30 min)
   - Create transactions with various descriptions
   - Verify suggestions are created in database
   - Test with and without categories
   - Verify error handling

10. **Documentation** (20 min)
    - Add JSDoc comments
    - Update README if needed
    - Document configuration

**Total Estimated Time**: ~4 hours

---

## Risk Mitigation

### Risk 1: OpenRouter API Rate Limits
**Mitigation**: 
- Implement exponential backoff (already in OpenRouterService)
- Consider adding a queue system in future for high-volume scenarios
- Monitor rate limit errors

### Risk 2: AI Suggests Non-Existent Category
**Mitigation**:
- Validate suggested category ID against user's actual categories
- Reject invalid suggestions and log error
- Include category list in prompt with explicit IDs

### Risk 3: Background Job Memory Leaks
**Mitigation**:
- Ensure all async operations complete or timeout
- Use proper error handling to prevent hanging promises
- Monitor server memory usage

### Risk 4: Database Unique Constraint Violation
**Scenario**: Multiple suggestions for same transaction (race condition)
**Mitigation**:
- Database has unique constraint on transaction_id
- Catch constraint violation error (code 23505)
- Log as warning, not error (acceptable scenario)

---

## Future Enhancements

1. **User Feedback Loop**
   - Track approval/rejection rates
   - Use feedback to improve prompts
   - Fine-tune confidence thresholds

2. **Historical Pattern Learning**
   - Include user's past categorization patterns in prompt
   - "You previously categorized similar transactions as X"

3. **Queue System**
   - Replace fire-and-forget with proper job queue (BullMQ, pg-boss)
   - Enable retry logic
   - Better monitoring and observability

4. **Batch Processing**
   - Process multiple transactions in single AI call
   - Reduce API costs
   - Improve throughput

5. **Confidence Threshold UI**
   - Show suggestions only above certain confidence
   - Let users configure their threshold

6. **Auto-Apply High-Confidence Suggestions**
   - Automatically categorize transactions with confidence > 0.9
   - User can still override

---

## Rollback Plan

If issues arise in production:

1. **Quick Disable**: Comment out fire-and-forget call in transaction endpoint
2. **Full Rollback**: Remove background job trigger, keep database schema
3. **Data Cleanup**: Optionally delete ai_suggestions records

**Note**: Transaction creation is never affected since this is a background job

---

## Success Criteria

✅ Transaction creation response time unchanged (< 500ms)  
✅ AI suggestions generated for 95%+ of transactions with categories  
✅ Zero transaction creation failures due to AI suggestion errors  
✅ Confidence scores distributed reasonably (not all 0.0 or 1.0)  
✅ Suggested categories are valid user categories 100% of time  
✅ All errors logged with sufficient context for debugging  

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | - | OpenRouter API authentication key |
| `OPENROUTER_DEFAULT_MODEL` | No | `meta-llama/llama-3.2-3b-instruct:free` | Model to use for category suggestions |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter API base URL |

### Database Tables

**ai_suggestions**:
- `id` (uuid, primary key)
- `transaction_id` (uuid, foreign key to transactions)
- `suggested_category_id` (uuid, foreign key to categories)
- `confidence_score` (numeric 0.000-1.000)
- `approved` (boolean, nullable - null=pending, true=approved, false=rejected)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

## Appendix: Code Examples

### Example AI Prompt

```
System: You are a financial transaction categorization assistant. Your task is to suggest the most appropriate category for a transaction based on its description, amount, and type.

Available categories:
- Groceries (id: 550e8400-e29b-41d4-a716-446655440001)
- Transportation (id: 550e8400-e29b-41d4-a716-446655440002)
- Utilities (id: 550e8400-e29b-41d4-a716-446655440003)
- Entertainment (id: 550e8400-e29b-41d4-a716-446655440004)

Respond with the category ID that best matches the transaction and your confidence score (0.0 to 1.0).

User: Transaction Details:
- Description: Uber to airport
- Amount: $35.50
- Type: expense

Select the most appropriate category from the list.
```

### Example AI Response

```json
{
  "suggested_category_id": "550e8400-e29b-41d4-a716-446655440002",
  "confidence_score": 0.92,
  "reasoning": "Transportation category is the most appropriate for ride-sharing services like Uber"
}
```

---

## Questions & Answers

**Q: What happens if the user has no categories?**  
A: The function returns early with a warning log. No suggestion is created.

**Q: What happens if OpenRouter API is down?**  
A: Error is logged, but transaction creation succeeds. User doesn't see any error.

**Q: Can users see suggestions immediately after creating a transaction?**  
A: No, there's a slight delay (1-5 seconds typically) before suggestion appears.

**Q: What if AI suggests a category that doesn't exist?**  
A: Validation step rejects the suggestion and logs an error. No record is inserted.

**Q: How do users approve/reject suggestions?**  
A: That's a future feature. This implementation only creates suggestions.

---

## Compliance & Security

- ✅ No PII sent to OpenRouter (only transaction description, amount, type)
- ✅ User categories are not stored by OpenRouter (ephemeral in prompt)
- ✅ RLS policies ensure users only see their own suggestions
- ✅ Service uses authenticated Supabase client with user context
- ✅ No sensitive data logged (category IDs and scores only)

---

## References

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Astro API Routes](https://docs.astro.build/en/core-concepts/endpoints/)
- Project types: `src/types.ts`
- Database schema: `supabase/migrations/20251015151641_create_budget_manager_schema.sql`
- OpenRouter service: `src/lib/services/openrouter.service.ts`

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-04  
**Author**: Implementation Plan  
**Status**: Ready for Implementation
