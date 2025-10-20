# API Endpoint Implementation Plan: Update Transaction

## 1. Endpoint Overview

The Update Transaction endpoint allows authenticated users to modify existing transaction details including amount, description, and category assignment. It uses a PATCH HTTP method with PostgREST-style query syntax for transaction identification and supports partial updates while maintaining data integrity through database constraints.

## 2. Request Details

- **HTTP Method**: PATCH
- **URL Structure**: `/rest/v1/transactions?id=eq.{transaction_id}`
- **Parameters**:
  - Required: `transaction_id` (UUID in URL query parameter)
  - Request Body Fields:
    - `amount_cents` (number, required): Transaction amount in cents, must be positive integer
    - `description` (string, required): Transaction description, cannot be empty
    - `category_id` (string, optional): UUID of category, must be owned by user or null
- **Request Body**: JSON object with partial transaction update fields
- **Authentication**: Required - user must be authenticated via session

## 3. Used Types

### DTOs and Command Models

```typescript
// Existing types from src/types.ts
export type TransactionUpdateCommand = Partial<
  Pick<TablesUpdate<'transactions'>, 'amount_cents' | 'description' | 'category_id'>
>

export type TransactionDTO = Omit<Tables<'transactions'>, 'user_id'> & {
  accounts: AccountNameRef
  categories: CategoryNameRef | null
}
```

### New Validation Schema
```typescript
// In transaction.service.ts
export const TransactionUpdateSchema = z.object({
  amount_cents: z.number().int().positive("Amount must be a positive integer in cents").optional(),
  description: z.string().trim().min(1, "Description cannot be empty").optional(),
  category_id: z.string().uuid("Category ID must be a valid UUID").nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

export const TransactionIdSchema = z.string().uuid("Transaction ID must be a valid UUID");
```

## 4. Response Details

- **Success Response (200 OK)**:
  ```json
  {
    "id": "uuid",
    "amount_cents": 1500,
    "transaction_type": "expense",
    "description": "Updated description",
    "transaction_date": "2024-01-15T10:30:00Z",
    "account_id": "uuid",
    "category_id": "uuid",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
  ```
- **Error Responses**:
  - 400 Bad Request: Invalid UUID format, malformed JSON, validation errors
  - 401 Unauthorized: Not authenticated
  - 404 Not Found: Transaction not found or not owned by user, category not found
  - 422 Unprocessable Entity: Validation constraint violations
  - 500 Internal Server Error: Database errors, unexpected errors

## 5. Data Flow

1. **Request Processing**:
   - Extract transaction ID from URL query parameter `id=eq.{transaction_id}`
   - Parse and validate JSON request body
   - Authenticate user session and extract user ID

2. **Validation Layer**:
   - Validate transaction ID format (UUID)
   - Validate request body fields using Zod schema
   - Ensure at least one field is provided for update

3. **Service Layer**:
   - Verify transaction exists and belongs to authenticated user
   - If category_id provided, validate category exists and belongs to user
   - Perform database update with automatic `updated_at` timestamp
   - Return updated transaction with embedded account/category names

4. **Response Formation**:
   - Transform database response to match TransactionDTO format
   - Include embedded account and category names for frontend convenience
   - Return structured JSON response with appropriate HTTP status code

## 6. Security Considerations

- **Authentication**: All requests must include valid session authentication
- **Authorization**: Users can only update their own transactions (enforced by database constraints and service logic)
- **Input Validation**: Strict validation of all input parameters using Zod schemas
- **SQL Injection Prevention**: Use parameterized queries through Supabase client
- **Data Integrity**: Database constraints ensure:
  - Users can only reference their own accounts (`transactions_user_owns_account`)
  - Users can only reference their own categories (`transactions_user_owns_category`)
  - Description cannot be empty (`transactions_description_not_empty`)
- **CSRF Protection**: Stateless API design with session-based authentication

## 7. Error Handling

### Client Errors (4xx)
- **400 Bad Request**:
  - Invalid JSON in request body
  - Invalid UUID format for transaction_id or category_id
  - Missing required query parameter
  - No fields provided for update

- **401 Unauthorized**:
  - No authentication session
  - Invalid or expired session token

- **404 Not Found**:
  - Transaction does not exist
  - Transaction does not belong to authenticated user
  - Referenced category_id does not exist or belong to user

- **422 Unprocessable Entity**:
  - Amount must be positive integer
  - Description cannot be empty
  - Database constraint violations

### Server Errors (5xx)
- **500 Internal Server Error**:
  - Database connection issues
  - Unexpected database constraint violations
  - Service configuration errors

### Error Logging
- Log validation errors with sanitized input data
- Log authentication failures (without sensitive data)
- Log database errors with error codes and transaction context
- Log unexpected errors with full stack traces for debugging

## 8. Performance Considerations

- **Database Queries**: Single atomic update operation with immediate consistency
- **Query Optimization**: Use indexed lookups on `id` and `user_id` columns
- **Response Size**: Minimal payload with only necessary transaction data
- **Caching**: No caching required for update operations
- **Concurrency**: Database-level optimistic locking through `updated_at` timestamp
- **Rate Limiting**: Consider implementing per-user rate limits for update operations

## 9. Implementation Steps

### Step 1: Extend Transaction Service
- Add `TransactionUpdateSchema` validation schema
- Add `TransactionIdSchema` for URL parameter validation
- Implement `updateTransaction` function with:
  - Transaction ownership validation
  - Category ownership validation (if provided)
  - Database update operation with `updated_at` timestamp
  - Response formatting with embedded names

### Step 2: Create PATCH Endpoint Handler
- Create `/src/pages/api/rest/v1/transactions/[id].ts` file
- Implement PATCH method handler:
  - Extract and validate transaction ID from URL
  - Parse and validate request body
  - Authenticate user session
  - Call transaction service for update
  - Handle service errors appropriately
  - Return formatted JSON response

### Step 3: URL Parameter Extraction
- Parse PostgREST-style query parameter `id=eq.{transaction_id}`
- Extract transaction ID from URL using regex or string parsing
- Validate extracted ID format using `TransactionIdSchema`

### Step 4: Request Validation
- Validate JSON request body structure
- Apply Zod schema validation for update fields
- Ensure at least one field is provided for update
- Handle validation errors with detailed messages

### Step 5: Service Integration
- Call `updateTransaction` service function with validated data
- Handle service-level errors (ownership, constraints, database)
- Transform service response to match API specification
- Maintain consistent error response format

### Step 6: Error Response Standardization
- Implement consistent error response format across all error types
- Map service errors to appropriate HTTP status codes
- Provide clear, actionable error messages for clients
- Log errors appropriately without exposing sensitive information

### Step 7: Response Formatting
- Format successful response to match Create Transaction response structure
- Include embedded account and category names for frontend convenience
- Set appropriate HTTP headers (Content-Type, caching directives)
- Ensure response matches TransactionDTO interface

### Step 8: Testing and Validation
- Test with valid update scenarios (partial and full updates)
- Test authorization boundaries (cross-user access attempts)
- Test validation edge cases (invalid UUIDs, empty descriptions)
- Test database constraint violations
- Verify error response formats and status codes
- Performance testing for concurrent update operations