# API Endpoint Implementation Plan: List Accounts

## 1. Endpoint Overview

The List Accounts endpoint retrieves all active (non-deleted) accounts belonging to the authenticated user. It supports pagination through `limit` and `offset` query parameters and returns accounts ordered by creation date in descending order (newest first).

**Purpose**: Enable users to retrieve their active financial accounts with pagination support for efficient data loading.

**Key Features**:
- Returns only active accounts (soft-deleted accounts excluded)
- User-isolated data (users can only see their own accounts)
- Paginated results with metadata
- Ordered by creation date (newest first)

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/rest/v1/accounts`
- **Authentication**: Required (JWT token via Supabase Auth)

### Parameters

**Query Parameters**:
- `limit` (optional, integer)
  - Default: 20
  - Min: 1
  - Max: 50
  - Description: Maximum number of accounts to return
  
- `offset` (optional, integer)
  - Default: 0
  - Min: 0
  - Description: Number of accounts to skip for pagination

**Headers**:
- `Authorization: Bearer <token>` (handled by Supabase middleware)

**Request Body**: None (GET request)

### Validation Rules

Using Zod schema:
```typescript
{
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
}
```

## 3. Used Types

### Existing Types (from `src/types.ts`)

```typescript
// Account DTO - already defined
export type AccountDTO = Omit<
  Tables<'accounts'>,
  'user_id' | 'deleted_at'
>

// Pagination metadata - already defined
export interface PaginationMeta {
  total_count: number
  limit: number
  offset: number
}
```

### New Types to Define (add to `src/types.ts`)

```typescript
/** Response type for account list endpoint */
export interface AccountListResponse {
  data: AccountDTO[]
  meta: PaginationMeta
}
```

### Validation Schema (in API endpoint file)

```typescript
const QueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
})
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Checking Account",
      "account_type": "checking",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Savings Account",
      "account_type": "savings",
      "created_at": "2024-01-10T08:20:00.000Z",
      "updated_at": "2024-01-10T08:20:00.000Z"
    }
  ],
  "meta": {
    "total_count": 5,
    "limit": 20,
    "offset": 0
  }
}
```

### Error Responses

**400 Bad Request** - Invalid query parameters
```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "field": "limit",
      "message": "Must be between 1 and 50"
    }
  ]
}
```

**401 Unauthorized** - Missing or invalid authentication
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error** - Server-side error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### Request Flow
1. **Request Reception**: GET request arrives at `/rest/v1/accounts` endpoint
2. **Authentication**: Astro middleware validates session via `context.locals.supabase`
3. **Parameter Validation**: Parse and validate `limit` and `offset` using Zod schema
4. **Service Invocation**: Call `AccountsService.listAccounts()` with validated parameters and user_id
5. **Database Query**: Service queries Supabase:
   - Filter: `user_id = <authenticated_user_id>`
   - Filter: `deleted_at IS NULL`
   - Order: `created_at DESC`
   - Pagination: `LIMIT <limit> OFFSET <offset>`
   - Count query: Get total count of matching records
6. **Response Formatting**: Transform database records to AccountDTO format
7. **Response Return**: Send 200 OK with AccountListResponse

### Database Interactions

**Primary Query**:
```typescript
const { data, error } = await supabase
  .from('accounts')
  .select('id, name, account_type, created_at, updated_at')
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

**Count Query**:
```typescript
const { count, error } = await supabase
  .from('accounts')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .is('deleted_at', null)
```

### Service Layer

Create `src/lib/services/accounts.service.ts`:
- `listAccounts(userId: string, limit: number, offset: number): Promise<AccountListResponse>`
- Handles database queries
- Formats response with pagination metadata
- Throws typed errors for error handling

## 6. Security Considerations

### Authentication
- **Requirement**: Valid JWT token required
- **Implementation**: Verified by Astro middleware before endpoint execution
- **Check**: Access `context.locals.supabase.auth.getUser()` to ensure authenticated user

### Authorization
- **User Isolation**: Enforce user_id filter in all queries
- **Implementation**: Always filter by `user_id = <authenticated_user_id>`
- **Protection**: Never allow client to specify user_id parameter

### Data Protection
- **Sensitive Fields**: `user_id` and `deleted_at` excluded from AccountDTO
- **SQL Injection**: Prevented by Supabase client's parameterized queries
- **Query Parameters**: Validated and coerced to correct types via Zod

### Rate Limiting
- **Consideration**: Implement rate limiting for list endpoints to prevent abuse
- **Recommendation**: Use Astro middleware or edge functions to limit requests per user

### CORS
- **Configuration**: Ensure CORS headers are properly configured for frontend domain
- **Credentials**: Allow credentials if using cookie-based auth

## 7. Error Handling

### Validation Errors (400)
**Scenario**: Invalid query parameters
```typescript
// Example: limit = 100 (exceeds max of 50)
// Example: offset = -5 (negative value)
```
**Handling**:
- Parse Zod validation errors
- Return 400 with descriptive error messages
- Include field-specific error details

### Authentication Errors (401)
**Scenario**: Missing or invalid JWT token
```typescript
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  return new Response(JSON.stringify({
    error: 'Unauthorized',
    message: 'Authentication required'
  }), { status: 401 })
}
```

### Database Errors (500)
**Scenario**: Supabase query fails
**Handling**:
- Log error details for debugging
- Return generic error message to client
- Avoid exposing internal error details

### Empty Results (200)
**Scenario**: User has no accounts
**Handling**:
- Return 200 with empty data array
- Include correct pagination metadata (total_count: 0)

### Error Response Pattern
```typescript
try {
  // Query logic
} catch (error) {
  console.error('Error fetching accounts:', error)
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'Failed to fetch accounts'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}
```

## 8. Performance Considerations

### Database Performance
- **Indexes**: Ensure indexes exist on:
  - `accounts(user_id)` - for user filtering
  - `accounts(created_at)` - for ordering
  - `accounts(deleted_at)` - for soft delete filtering
- **Query Optimization**: Use `.select()` to fetch only required fields
- **Count Query**: Consider caching total_count for frequently accessed data

### Response Size
- **Pagination**: Max limit of 50 prevents excessive data transfer
- **Field Selection**: AccountDTO excludes unnecessary internal fields

### Caching Strategy
- **Consideration**: Implement HTTP caching headers for read-only data
- **ETag**: Use updated_at timestamp for cache validation
- **Cache-Control**: Set appropriate cache duration

### Potential Bottlenecks
- **Large Datasets**: Users with many accounts (>1000) may experience slow count queries
- **Mitigation**: Consider approximate counts or caching for large datasets
- **Connection Pooling**: Ensure Supabase client uses connection pooling

## 9. Implementation Steps

### Step 1: Add AccountListResponse Type
**File**: `src/types.ts`
```typescript
/** Response type for account list endpoint */
export interface AccountListResponse {
  data: AccountDTO[]
  meta: PaginationMeta
}
```

### Step 2: Create Accounts Service
**File**: `src/lib/services/accounts.service.ts`

Create service with:
- `listAccounts(supabase: SupabaseClient, userId: string, limit: number, offset: number)` method
- Database queries for accounts and count
- Error handling
- Response formatting

### Step 3: Create API Endpoint
**File**: `src/pages/api/rest/v1/accounts.ts`

Implement:
- `export const prerender = false`
- GET handler function
- Zod schema for query parameter validation
- Authentication check using `context.locals.supabase`
- Service invocation
- Error handling with appropriate status codes
- JSON response formatting

### Step 4: Add Query Parameter Validation
In the endpoint file:
```typescript
const QueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
})
```

### Step 5: Implement Authentication Check
```typescript
const { data: { user }, error } = await context.locals.supabase.auth.getUser()
if (error || !user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}
```

### Step 6: Validate Query Parameters
```typescript
const url = new URL(context.request.url)
const queryParams = {
  limit: url.searchParams.get('limit'),
  offset: url.searchParams.get('offset')
}

const validationResult = QueryParamsSchema.safeParse(queryParams)
if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      error: 'Invalid query parameters',
      details: validationResult.error.errors
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  )
}
```

### Step 7: Invoke Service and Return Response
```typescript
const { limit, offset } = validationResult.data

try {
  const response = await listAccounts(
    context.locals.supabase,
    user.id,
    limit,
    offset
  )
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
} catch (error) {
  console.error('Error fetching accounts:', error)
  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      message: 'Failed to fetch accounts'
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}
```

### Step 8: Test the Endpoint
- Test with valid authentication and various pagination parameters
- Test without authentication (expect 401)
- Test with invalid parameters (expect 400)
- Test with user who has no accounts (expect empty array with 200)
- Test pagination with large datasets
- Verify user isolation (users can't see other users' accounts)

### Step 9: Add Integration Tests
Create test file to verify:
- Authentication requirement
- Parameter validation
- Pagination logic
- User isolation
- Response format
- Error scenarios

### Step 10: Update API Documentation
Document the endpoint with:
- Request/response examples
- Query parameter specifications
- Error codes and messages
- Authentication requirements
