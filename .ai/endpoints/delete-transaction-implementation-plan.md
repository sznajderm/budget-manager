# API Endpoint Implementation Plan: Delete Transaction

## 1. Endpoint Overview

This endpoint permanently deletes a transaction from the user's account. The transaction is completely removed from the database (hard delete) and cannot be recovered. The endpoint follows PostgREST-style query parameters for specifying the transaction ID.

**Key Features:**
- Permanent transaction deletion
- User ownership validation
- PostgREST-compatible query format
- Empty response on success

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/rest/v1/transactions?id=eq.{transaction_id}`
- **Parameters**:
  - **Required**: `id` (query parameter) - UUID of the transaction to delete, using PostgREST format `id=eq.{uuid}`
- **Request Body**: None
- **Authentication**: Required (JWT Bearer token in Authorization header)

**Example Request:**
```
DELETE /rest/v1/transactions?id=eq.550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

## 3. Used Types

**Command Model:**
```typescript
export interface DeleteTransactionCommand {
  transaction_id: string;
}
```

**Validation Schema:**
```typescript
export const DeleteTransactionSchema = z.object({
  id: z.string().uuid("Transaction ID must be a valid UUID")
});
```

**Service Function Type:**
```typescript
export async function deleteTransaction(
  supabase: SupabaseClient,
  userId: string,
  transactionId: string
): Promise<void>
```

## 4. Response Details

**Success Response:**
- **Status Code**: 204 No Content
- **Body**: Empty
- **Headers**: Standard HTTP headers

**Error Responses:**
- **401 Unauthorized**: Missing or invalid authentication
  ```json
  {
    "error": "Missing Authorization header"
  }
  ```
- **404 Not Found**: Transaction not found or doesn't belong to user
  ```json
  {
    "error": "Transaction not found or does not belong to user"
  }
  ```
- **500 Internal Server Error**: Database or server errors
  ```json
  {
    "error": "An unexpected error occurred while deleting the transaction"
  }
  ```

## 5. Data Flow

1. **Request Reception**: Astro API endpoint receives DELETE request
2. **Authentication**: Extract and validate JWT token from Authorization header
3. **Parameter Extraction**: Parse transaction ID from PostgREST-style query parameter
4. **Input Validation**: Validate transaction ID format using Zod schema
5. **Authorization Check**: Verify transaction belongs to authenticated user
6. **Database Operation**: Delete transaction record from database
7. **Response**: Return 204 No Content on success

**Database Query Flow:**
1. Verify transaction exists and user ownership: `SELECT id FROM transactions WHERE id = ? AND user_id = ?`
2. Delete transaction: `DELETE FROM transactions WHERE id = ? AND user_id = ?`

## 6. Security Considerations

**Authentication & Authorization:**
- JWT Bearer token required in Authorization header
- User ID extracted from validated JWT token
- Transaction ownership verified before deletion

**Data Protection:**
- Cross-user access prevented through user_id filtering
- UUID format validation prevents injection attacks
- Database constraints ensure referential integrity

**Security Threats & Mitigations:**
- **Unauthorized Access**: Mitigated by JWT validation and ownership checks
- **Parameter Injection**: Mitigated by UUID validation and parameterized queries
- **Cross-User Data Access**: Mitigated by user_id filtering in all queries

## 7. Error Handling

**Client Errors (4xx):**
- **400 Bad Request**: Invalid UUID format in transaction ID
- **401 Unauthorized**: Missing, invalid, or expired JWT token
- **404 Not Found**: Transaction doesn't exist or doesn't belong to user

**Server Errors (5xx):**
- **500 Internal Server Error**: Database connection issues, constraint violations, or unexpected errors

**Error Logging Strategy:**
- Log authentication failures with request details
- Log database errors with error codes and context
- Log unexpected errors with full stack traces
- Sanitize error messages sent to client (no sensitive information)

**Database Constraint Handling:**
- Foreign key constraints are handled gracefully
- Transaction deletion should not violate referential integrity (categories use RESTRICT, but deleting transaction is safe)

## 8. Performance Considerations

**Query Optimization:**
- Single database query with compound WHERE clause (id + user_id)
- UUID primary key provides fast lookups
- No joins required for deletion

**Potential Bottlenecks:**
- Minimal performance impact - single record deletion
- Database connection pool limits (handled by Supabase)

**Caching:**
- No caching required for DELETE operations
- Consider invalidating related caches if implemented

## 9. Implementation Steps

1. **Create Validation Schema**
   - Add `DeleteTransactionSchema` to `src/lib/services/transaction.service.ts`
   - Include UUID validation for transaction ID

2. **Implement Service Function**
   - Add `deleteTransaction` function to `src/lib/services/transaction.service.ts`
   - Include ownership verification and error handling
   - Follow existing service patterns from the codebase

3. **Create API Endpoint**
   - Create `src/pages/api/rest/v1/transactions.ts` (if not exists)
   - Implement DELETE handler
   - Add `export const prerender = false`

4. **Parse Query Parameters**
   - Extract transaction ID from PostgREST-style query (`id=eq.{uuid}`)
   - Handle query parameter parsing and validation

5. **Integrate Authentication**
   - Use existing `getAuthenticatedUser` helper from `src/lib/auth.ts`
   - Handle authentication errors with proper response codes

6. **Add Error Handling**
   - Implement comprehensive error handling for all scenarios
   - Use existing error response patterns
   - Add appropriate logging

7. **Testing Validation**
   - Verify authentication requirements
   - Test ownership validation
   - Test error scenarios and response codes
   - Verify transaction is actually deleted from database

8. **Code Quality Checks**
   - Run linting and type checking
   - Ensure compliance with project coding standards
   - Verify proper error logging implementation