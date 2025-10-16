# API Endpoint Implementation Plan: Create Transaction

## 1. Endpoint Overview

Create a new financial transaction record for the authenticated user. This endpoint allows users to record both income and expense transactions with optional categorization.

**Purpose**: Enable users to create transaction records that track financial activity across their accounts
**Functionality**: Validates input, ensures data integrity, and stores transaction with proper user ownership

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/rest/v1/transactions`
- **Parameters**:
  - **Required**:
    - `amount_cents`: Integer (positive number representing amount in cents)
    - `transaction_type`: Enum (`"expense"` | `"income"`)
    - `description`: String (non-empty description of transaction)
    - `transaction_date`: String (ISO 8601 timestamp)
    - `account_id`: String (UUID of account that belongs to user)
  - **Optional**:
    - `category_id`: String (UUID of category that belongs to user, nullable)
- **Request Body**: JSON payload matching `TransactionCreateCommand` type

```json
{
  "amount_cents": 1250,
  "transaction_type": "expense",
  "description": "Coffee shop",
  "transaction_date": "2024-01-01T10:30:00.000Z",
  "account_id": "uuid",
  "category_id": "uuid"
}
```

## 3. Used Types

### DTOs and Command Models
- **Input**: `TransactionCreateCommand` (already defined in `src/types.ts`)
- **Output**: Simplified transaction object with generated fields
- **Validation Schema**: New Zod schema `TransactionCreateSchema` for input validation

### Response Type Structure
```typescript
{
  id: string
  amount_cents: number
  transaction_type: "expense" | "income"
  description: string
  transaction_date: string
  account_id: string
  category_id: string | null
  created_at: string
  updated_at: string
}
```

## 4. Response Details

**Success Response (201 Created)**:
- Returns created transaction with all fields including generated `id`, `created_at`, `updated_at`
- Content-Type: `application/json`

**Error Responses**:
- **400 Bad Request**: Malformed JSON, invalid data types, validation failures
- **401 Unauthorized**: Missing or invalid authentication
- **422 Unprocessable Entity**: Valid format but business rule violations (non-existent account/category, ownership violations)
- **500 Internal Server Error**: Database errors, unexpected server issues

## 5. Data Flow

1. **Request Reception**: POST request received at `/rest/v1/transactions`
2. **Authentication Check**: Extract user session from `context.locals.supabase`
3. **Input Validation**: Validate request body using Zod schema
4. **Business Logic**: Call `createTransaction` service function
5. **Database Operations**: 
   - Validate account/category ownership through database constraints
   - Insert transaction record with `user_id` from session
6. **Response Formation**: Return created transaction with 201 status

### Service Layer Interaction
- **Service**: `src/lib/services/transaction.service.ts`
- **Function**: `createTransaction(supabase, userId, validatedData)`
- **Database Table**: `transactions`
- **Related Tables**: `accounts`, `categories` (for constraint validation)

## 6. Security Considerations

### Authentication & Authorization
- **Session Validation**: Ensure user is authenticated via Supabase session
- **Ownership Verification**: Database constraints ensure user owns referenced account/category
- **User Context**: All transactions automatically assigned to authenticated user

### Input Validation & Sanitization
- **Type Safety**: Zod schema validates all input types
- **String Sanitization**: Trim whitespace from description
- **UUID Validation**: Validate UUID format for account_id and category_id
- **Amount Validation**: Ensure positive integer for amount_cents
- **Date Validation**: Validate ISO 8601 timestamp format

### Data Integrity
- **Database Constraints**: Leverage existing constraints for business rule enforcement
- **Foreign Key Relationships**: Maintain referential integrity with accounts/categories
- **SQL Injection Protection**: Supabase client provides parameterized queries

## 7. Error Handling

### Input Validation Errors (400 Bad Request)
- Invalid JSON format
- Missing required fields
- Invalid data types (non-integer amount, invalid enum values)
- Invalid UUID format
- Invalid ISO timestamp
- Empty or whitespace-only description
- Negative or zero amount

### Authentication Errors (401 Unauthorized)
- Missing Authorization header
- Invalid or expired JWT token
- No active user session

### Business Logic Errors (422 Unprocessable Entity)
- Account ID doesn't exist or doesn't belong to user
- Category ID doesn't exist or doesn't belong to user
- Database constraint violations

### Server Errors (500 Internal Server Error)
- Database connection failures
- Unexpected database errors
- Service unavailability

### Error Response Format
```json
{
  "error": "Descriptive error message",
  "details": "Additional context when appropriate"
}
```

## 8. Performance Considerations

### Database Performance
- **Single Insert Query**: Efficient single-operation transaction creation
- **Index Usage**: Foreign key indexes on `account_id`, `category_id` for constraint validation
- **Constraint Validation**: Database-level validation is efficient
- **No N+1 Queries**: Single database operation

### Optimization Strategies
- **Connection Pooling**: Leverage Supabase connection pooling
- **Constraint Efficiency**: Database constraints prevent unnecessary service-layer validation
- **Minimal Data Transfer**: Return only necessary fields in response

## 9. Implementation Steps

### Step 1: Create Transaction Service
- Create `src/lib/services/transaction.service.ts`
- Define `TransactionCreateSchema` with Zod validation:
  ```typescript
  const TransactionCreateSchema = z.object({
    amount_cents: z.number().int().positive(),
    transaction_type: z.enum(['expense', 'income']),
    description: z.string().trim().min(1),
    transaction_date: z.string().datetime(),
    account_id: z.string().uuid(),
    category_id: z.string().uuid().nullable().optional()
  })
  ```
- Implement `createTransaction` function with error handling

### Step 2: Create API Endpoint
- Create `src/pages/api/rest/v1/transactions.ts`
- Add `export const prerender = false`
- Implement POST handler with:
  - Authentication check
  - Input validation
  - Service layer call
  - Error handling and appropriate status codes

### Step 3: Update Service Exports
- Add transaction service export to `src/lib/services/index.ts`

### Step 4: Error Handling Implementation
- Follow existing patterns from account/category services
- Implement specific database error code handling
- Provide meaningful error messages for client

### Step 5: Testing Strategy
- Unit tests for validation schema
- Integration tests for service function
- API endpoint tests for success and error cases
- Database constraint testing

### Step 6: Validation and Deployment
- Test all error scenarios
- Verify authentication and authorization
- Confirm response format matches API specification
- Performance testing with realistic data volumes