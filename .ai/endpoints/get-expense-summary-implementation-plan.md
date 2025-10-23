# API Endpoint Implementation Plan: Get Expense Summary

## 1. Endpoint Overview
This endpoint retrieves total expense amounts and transaction counts for an authenticated user within a specified date range. It follows the RPC pattern and aggregates expense transactions from the database to provide summary statistics.

**Key Features:**
- Aggregates expense transactions by date range
- Returns total amount in cents and transaction count
- Filters data using Row Level Security (RLS) for user isolation
- Validates date range parameters

## 2. Request Details
- **HTTP Method**: POST
- **URL Structure**: `/rest/v1/rpc/get_expense_summary`
- **Content-Type**: `application/json`
- **Parameters**:
  - **Required**: 
    - `start_date`: ISO 8601 timestamp string (e.g., "2024-01-01T00:00:00.000Z")
    - `end_date`: ISO 8601 timestamp string (e.g., "2024-01-31T23:59:59.000Z")
  - **Optional**: None
- **Request Body**:
```json
{
  "start_date": "2024-01-01T00:00:00.000Z",
  "end_date": "2024-01-31T23:59:59.000Z"
}
```

## 3. Used Types
The following existing types from `src/types.ts` will be used:

**Request Command:**
```typescript
export interface SummaryCommand {
  start_date: string // ISO timestamp
  end_date: string // ISO timestamp
}
```

**Response DTO:**
```typescript
export interface SummaryDTO {
  total_cents: number
  transaction_count: number
  period_start: string
  period_end: string
}
```

**New Validation Types:**
```typescript
export type ValidatedSummaryCommand = z.infer<typeof SummaryCommandSchema>
```

## 4. Response Details
- **Success Status**: 200 OK
- **Response Structure**:
```json
{
  "total_cents": 125000,
  "transaction_count": 45,
  "period_start": "2024-01-01T00:00:00.000Z",
  "period_end": "2024-01-31T23:59:59.000Z"
}
```
- **Content-Type**: `application/json`

## 5. Data Flow
1. **Request Validation**: Validate JSON payload using Zod schema
2. **Authentication**: Verify user session via Supabase client
3. **Authorization**: RLS automatically filters transactions by user_id
4. **Data Aggregation**: Query transactions table with filters:
   - `transaction_type = 'expense'`
   - `transaction_date >= start_date AND transaction_date <= end_date`
   - `user_id = authenticated_user_id` (via RLS)
5. **Response Formation**: Return aggregated data in SummaryDTO format

**Database Query Flow:**
```sql
SELECT 
  COALESCE(SUM(amount_cents), 0) as total_cents,
  COUNT(*) as transaction_count
FROM transactions 
WHERE transaction_type = 'expense'
  AND transaction_date >= $1 
  AND transaction_date <= $2
  AND user_id = $3; -- Handled by RLS
```

## 6. Security Considerations
- **Authentication**: Required Supabase session validation
- **Authorization**: Row Level Security (RLS) ensures user isolation
- **Input Sanitization**: Zod validation prevents injection attacks
- **Data Access**: Users can only access their own transaction data
- **Rate Limiting**: Consider implementing rate limiting for aggregation queries
- **Timestamp Validation**: Prevent malformed date attacks

**Security Validations:**
- Validate ISO 8601 timestamp format
- Ensure date range is reasonable (prevent excessive historical queries)
- Verify user session integrity
- Sanitize all input parameters

## 7. Error Handling
| Error Scenario | Status Code | Response |
|----------------|-------------|----------|
| Invalid JSON payload | 400 | `{"error": "Invalid JSON in request body"}` |
| Missing required fields | 400 | `{"error": "Missing required fields: start_date, end_date"}` |
| Invalid timestamp format | 422 | `{"error": "Invalid ISO 8601 timestamp format"}` |
| start_date after end_date | 422 | `{"error": "Start date must be before end date"}` |
| Unauthenticated user | 401 | `{"error": "Unauthorized"}` |
| Database connection error | 500 | `{"error": "An unexpected error occurred"}` |
| Service unavailable | 500 | `{"error": "Service temporarily unavailable"}` |

**Error Logging:**
- Log all validation errors for debugging
- Log database errors with context
- Do not expose sensitive information in client responses
- Use structured logging for monitoring

## 8. Performance Considerations
- **Query Optimization**: 
  - Index on `(user_id, transaction_type, transaction_date)`
  - Use proper date range queries to leverage indexes
- **Connection Pooling**: Leverage Supabase connection pooling
- **Query Timeout**: Implement reasonable query timeouts
- **Memory Usage**: Aggregation queries are memory-efficient
- **Response Size**: Small response payload, minimal bandwidth usage

**Potential Bottlenecks:**
- Large date ranges with many transactions
- Concurrent requests from same user
- Database query performance on unindexed columns

## 9. Implementation Steps

1. **Create Service Layer**
   - Create `src/lib/services/expense-summary.service.ts`
   - Implement Zod validation schema for SummaryCommand
   - Implement `getExpenseSummary` function with database aggregation
   - Add comprehensive error handling and logging

2. **Create API Endpoint**
   - Create `src/pages/api/rest/v1/rpc/get_expense_summary.ts`
   - Follow existing pattern from transaction endpoints
   - Implement POST handler with authentication middleware
   - Add request validation and error response handling

3. **Input Validation Schema**
   ```typescript
   export const SummaryCommandSchema = z.object({
     start_date: z.string().datetime("Invalid ISO 8601 timestamp format"),
     end_date: z.string().datetime("Invalid ISO 8601 timestamp format")
   }).refine(
     (data) => new Date(data.start_date) <= new Date(data.end_date),
     { message: "Start date must be before end date" }
   );
   ```

4. **Database Query Implementation**
   - Use Supabase client with authenticated session
   - Implement aggregation query for expense transactions
   - Handle edge cases (no transactions, invalid date ranges)
   - Return data in SummaryDTO format

5. **Error Handling Integration**
   - Map service layer errors to appropriate HTTP status codes
   - Implement consistent error response format
   - Add comprehensive logging for debugging

6. **Authentication Integration**
   - Use `context.locals.supabase` from middleware
   - Implement user session validation
   - Handle authentication errors consistently

7. **Testing Preparation**
   - Document test scenarios for validation
   - Prepare test data with various date ranges
   - Test edge cases (empty results, large datasets)
   - Verify RLS enforcement

8. **Documentation**
   - Update API documentation with endpoint details
   - Document request/response examples
   - Add error code reference
   - Include usage examples

**File Structure:**
```
src/
├── pages/api/rest/v1/rpc/
│   └── get_expense_summary.ts          # API endpoint implementation
├── lib/services/
│   └── expense-summary.service.ts       # Business logic and validation
└── types.ts                            # Existing SummaryCommand and SummaryDTO
```

**Dependencies:**
- Existing Supabase client configuration
- Zod validation library
- Existing authentication middleware
- TypeScript type definitions