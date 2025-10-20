# API Endpoint Implementation Plan: List Transactions

## 1. Endpoint Overview

This endpoint retrieves a paginated list of transactions for the authenticated user, including related account and category names. The endpoint supports pagination through limit/offset parameters and returns transactions ordered by creation date (descending). It serves as the primary data source for transaction listing interfaces in the budget management application.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/rest/v1/transactions`
- **Parameters**:
  - **Required**: None (all parameters have defaults)
  - **Optional**: 
    - `limit` (integer): Number of transactions to return (default: 20, max: 50)
    - `offset` (integer): Number of transactions to skip for pagination (default: 0, min: 0)
- **Request Body**: None (GET request)
- **Authentication**: Required (JWT token via Supabase auth)

## 3. Used Types

### Input Validation Schema
```typescript
const TransactionListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
```

### Response Types
- **TransactionDTO**: Already defined in `src/types.ts` with embedded account/category relations
- **PaginationMeta**: Already defined in `src/types.ts` for pagination metadata
- **TransactionListResponse**: New wrapper type combining data array and meta information

### Service Function Type
```typescript
interface TransactionListParams {
  limit: number;
  offset: number;
}

interface TransactionListResult {
  data: TransactionDTO[];
  total_count: number;
}
```

## 4. Response Details

- **Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "amount_cents": 1250,
      "transaction_type": "expense",
      "description": "Grocery shopping",
      "transaction_date": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "accounts": {
        "name": "Checking Account"
      },
      "categories": {
        "name": "Groceries"
      }
    }
  ],
  "meta": {
    "total_count": 100,
    "limit": 20,
    "offset": 0
  }
}
```

- **Error Responses**:
  - 400 Bad Request: Invalid query parameters
  - 401 Unauthorized: Missing or invalid authentication
  - 500 Internal Server Error: Database or server errors

## 5. Data Flow

1. **Request Reception**: Astro API endpoint receives GET request with optional query parameters
2. **Authentication Check**: Verify user session exists in `context.locals.supabase`
3. **Input Validation**: Parse and validate query parameters using Zod schema
4. **Service Call**: Invoke `listTransactions` service with validated parameters
5. **Database Query**: Execute Supabase query with:
   - User filtering (`user_id` equals authenticated user)
   - Table joins for account and category names
   - Ordering by `created_at DESC`
   - Pagination with limit/offset
   - Total count calculation
6. **Response Formatting**: Structure data with pagination metadata
7. **Response Return**: Send JSON response with appropriate status code

## 6. Security Considerations

### Authentication & Authorization
- **JWT Verification**: Supabase middleware validates authentication token
- **User Isolation**: All queries filtered by `user_id` to prevent data leakage
- **Database Constraints**: Existing DB constraints enforce user ownership validation

### Input Validation
- **Parameter Sanitization**: Zod schema prevents malicious input
- **Bounds Checking**: Limit parameter capped at 50 to prevent resource abuse
- **Type Safety**: Coercion ensures numeric values for pagination parameters

### Data Security
- **No Internal Fields**: Response excludes `user_id` and other internal columns
- **SQL Injection Protection**: Supabase query builder prevents injection attacks
- **Rate Limiting**: Consider implementing rate limiting for production (not in current scope)

## 7. Error Handling

### Client Errors (4xx)
- **400 Bad Request**: 
  - Invalid limit (> 50 or < 1)
  - Invalid offset (< 0)
  - Non-numeric parameter values
  - Malformed query parameters
- **401 Unauthorized**:
  - Missing authentication token
  - Expired or invalid JWT token
  - No user session in context

### Server Errors (5xx)
- **500 Internal Server Error**:
  - Database connection failures
  - Supabase service unavailable
  - Unexpected runtime errors
  - Query execution failures

### Error Response Format
```json
{
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## 8. Performance Considerations

### Database Optimization
- **Indexing**: Ensure indexes exist on:
  - `transactions(user_id, created_at DESC)` for efficient filtering and sorting
  - `accounts(id)` and `categories(id)` for join performance
- **Query Efficiency**: Use Supabase's query builder for optimized SQL generation
- **Pagination**: Limit/offset pagination prevents large result sets

### Response Optimization
- **Selective Fields**: Only query needed columns to reduce payload size
- **Caching Strategy**: Consider implementing caching for frequently accessed data
- **Connection Pooling**: Leverage Supabase's built-in connection pooling

### Potential Bottlenecks
- Large transaction volumes may slow offset-based pagination
- Consider cursor-based pagination for very large datasets in future iterations

## 9. Implementation Steps

1. **Create API Endpoint Structure**
   - Create `src/pages/api/rest/v1/transactions.ts`
   - Add `export const prerender = false` for server-side execution
   - Import required dependencies (Zod, types, services)

2. **Implement Query Parameter Validation**
   - Create Zod schema for limit/offset validation
   - Add parameter parsing with defaults and type coercion
   - Implement validation error handling

3. **Extend Transaction Service**
   - Add `listTransactions` function to `src/lib/services/transaction.service.ts`
   - Implement Supabase query with joins for accounts/categories
   - Add user filtering and ordering logic
   - Implement total count calculation for pagination

4. **Create GET Handler**
   - Implement authentication check using `context.locals`
   - Parse and validate query parameters
   - Call transaction service with validated inputs
   - Format response with data and pagination metadata

5. **Add Error Handling**
   - Implement try-catch blocks for all operations
   - Map different error types to appropriate HTTP status codes
   - Add consistent error response formatting
   - Log errors for debugging while avoiding sensitive data exposure

6. **Response Formatting**
   - Structure response to match API specification
   - Ensure TransactionDTO format matches expected output
   - Add pagination metadata calculation
   - Validate response structure against TypeScript types

7. **Testing & Validation**
   - Test with various query parameter combinations
   - Verify authentication enforcement
   - Test edge cases (empty results, maximum limits)
   - Validate error scenarios return appropriate status codes

8. **Performance Testing**
   - Test with larger datasets to ensure acceptable performance
   - Verify database query efficiency
   - Consider adding database indexes if performance issues identified