# API Endpoint Implementation Plan: List Categories

## 1. Endpoint Overview

The List Categories endpoint retrieves a paginated list of transaction categories for the authenticated user. It supports flexible pagination through `limit` and `offset` parameters, and allows sorting through an `order` parameter. The endpoint returns category data along with pagination metadata to enable efficient client-side pagination controls.

**Purpose**: Provide users with a paginated view of their transaction categories, sorted by specified criteria.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/rest/v1/categories`
- **Authentication**: Required (JWT token via Supabase Auth)
- **Parameters**:
  - **Optional Query Parameters**:
    - `limit` (integer): Number of records to return
      - Default: 20
      - Min: 1
      - Max: 50
      - Prevents excessive data retrieval
    - `offset` (integer): Number of records to skip for pagination
      - Default: 0
      - Min: 0
    - `order` (string): Sorting specification in format `field.direction`
      - Format: `{field}.{direction}`
      - Valid fields: `created_at`, `updated_at`, `name`
      - Valid directions: `asc`, `desc`
      - Example: `created_at.desc`, `name.asc`
      - Default: `created_at.desc`

- **Request Body**: None (GET request)

## 3. Used Types

### Existing Types (from `src/types.ts`)
```typescript
// Already defined
export type CategoryDTO = Omit<Tables<'categories'>, 'user_id'>

export interface PaginationMeta {
  total_count: number
  limit: number
  offset: number
}
```

### New Types to Add
```typescript
/** Response type for category list endpoint */
export interface CategoryListResponse {
  data: CategoryDTO[]
  meta: PaginationMeta
}
```

### Validation Schema (Zod)
```typescript
// To be created in API endpoint file
const ListCategoriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  order: z.string()
    .regex(/^(created_at|updated_at|name)\.(asc|desc)$/)
    .default('created_at.desc')
    .optional()
})
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Groceries",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "name": "Transportation",
      "created_at": "2024-01-02T00:00:00.000Z",
      "updated_at": "2024-01-02T00:00:00.000Z"
    }
  ],
  "meta": {
    "total_count": 15,
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
  "details": {
    "limit": "Must be between 1 and 50",
    "order": "Must match format: field.direction"
  }
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

1. **Request Reception**
   - Astro API endpoint receives GET request
   - Extract query parameters: `limit`, `offset`, `order`

2. **Authentication Check**
   - Retrieve Supabase client from `context.locals.supabase`
   - Verify user authentication via `getUser()`
   - Return 401 if user not authenticated

3. **Input Validation**
   - Parse and validate query parameters using Zod schema
   - Return 400 with validation errors if invalid
   - Apply defaults for missing parameters

4. **Business Logic (Service Layer)**
   - Call `CategoryService.listCategories()` with validated parameters
   - Service executes two Supabase queries:
     - Count query: Get total count of categories for user
     - Data query: Fetch paginated and sorted categories
   - Filter by `user_id` (from authenticated user)
   - Apply sorting based on `order` parameter
   - Apply pagination using `range()` method

5. **Response Construction**
   - Transform database records to `CategoryDTO[]` (exclude `user_id`)
   - Construct `PaginationMeta` object
   - Return `CategoryListResponse` with 200 status

6. **Error Handling**
   - Catch database errors and return 500
   - Log errors for debugging
   - Return user-friendly error messages

## 6. Security Considerations

### Authentication & Authorization
- **Authentication Required**: Verify user authentication before processing request
- **User Isolation**: Always filter categories by authenticated `user_id` to prevent unauthorized access
- **Token Validation**: Rely on Supabase middleware for JWT token validation

### Input Validation & Sanitization
- **Parameter Validation**: Use Zod schema to validate all query parameters
- **Limit Enforcement**: Cap maximum limit at 50 to prevent resource exhaustion
- **Order Validation**: Whitelist allowed fields and directions to prevent SQL injection
- **Type Coercion**: Use `z.coerce` for numeric parameters to handle string inputs safely

### Data Protection
- **DTO Pattern**: Use `CategoryDTO` to exclude internal fields (`user_id`) from response
- **No Sensitive Data**: Categories only contain user-defined names, no sensitive information
- **HTTPS Only**: Ensure endpoint is served over HTTPS in production

### Rate Limiting (Future Consideration)
- Consider implementing rate limiting per user to prevent abuse
- Monitor endpoint usage for suspicious patterns

## 7. Error Handling

### Validation Errors (400 Bad Request)
**Scenario**: Invalid query parameters
- Invalid `limit` (< 1 or > 50)
- Negative `offset`
- Malformed `order` parameter

**Handling**: 
- Parse validation errors from Zod
- Return structured error response with field-specific messages
- Log validation failures for monitoring

### Authentication Errors (401 Unauthorized)
**Scenario**: User not authenticated
- Missing JWT token
- Invalid or expired token
- User session ended

**Handling**:
- Early return with 401 status
- Include generic authentication error message
- Do not expose token validation details

### Database Errors (500 Internal Server Error)
**Scenario**: Supabase query failures
- Database connection issues
- Query timeout
- Unexpected database errors

**Handling**:
- Catch and log detailed error information
- Return generic error message to client
- Consider retry logic for transient failures
- Alert monitoring system for persistent issues

### Edge Cases
**Scenario**: No categories found
- User has no categories yet
- Offset beyond available records

**Handling**:
- Return 200 with empty `data` array
- Set `total_count` to 0 or actual count
- Valid response, not an error

**Scenario**: Offset exceeds total count
- User requests page beyond available data

**Handling**:
- Return 200 with empty `data` array
- Include correct `total_count` in metadata
- Client should handle pagination bounds

## 8. Performance Considerations

### Database Optimization
- **Indexes**: Ensure indexes exist on `categories` table:
  - `user_id` (for filtering)
  - `created_at` (for sorting)
  - `name` (for sorting)
  - Composite index on `(user_id, created_at)` for optimal query performance
  
### Query Efficiency
- **Count Optimization**: Use `count: 'exact'` option judiciously
  - Consider `count: 'estimated'` for large datasets
  - Cache count for better performance if needed

- **Limit Enforcement**: Maximum limit of 50 prevents large result sets
  
- **Single RPC Call**: Consider using Supabase RPC function for combined count + data fetch if performance becomes an issue

### Caching Strategy (Future Enhancement)
- Consider caching category lists per user with short TTL
- Invalidate cache on category mutations
- Use ETags for conditional requests

### Response Size
- Category records are lightweight (UUID, name, timestamps)
- 50 records should be under 10KB
- No additional optimization needed currently

## 9. Implementation Steps

### Step 1: Update Type Definitions
**File**: `src/types.ts`
- Add `CategoryListResponse` interface
- Ensure `CategoryDTO` and `PaginationMeta` are properly exported

### Step 2: Create Category Service
**File**: `src/lib/services/category.service.ts`

Create new service with method:
```typescript
export class CategoryService {
  async listCategories(
    supabase: SupabaseClient,
    userId: string,
    options: {
      limit: number
      offset: number
      order: string
    }
  ): Promise<CategoryListResponse>
}
```

Implementation:
- Parse `order` parameter to extract field and direction
- Execute count query: `select('*', { count: 'exact', head: true })`
- Execute data query with filters and sorting:
  - `.eq('user_id', userId)`
  - `.order(field, { ascending: direction === 'asc' })`
  - `.range(offset, offset + limit - 1)`
- Handle Supabase errors
- Return formatted response

### Step 3: Create API Endpoint
**File**: `src/pages/api/rest/v1/categories.ts`

Structure:
```typescript
export const prerender = false

export async function GET(context: APIContext): Promise<Response> {
  // Implementation
}
```

Implementation:
1. Get Supabase client from `context.locals.supabase`
2. Authenticate user:
   ```typescript
   const { data: { user }, error: authError } = await supabase.auth.getUser()
   if (authError || !user) {
     return new Response(JSON.stringify({ error: 'Unauthorized' }), {
       status: 401,
       headers: { 'Content-Type': 'application/json' }
     })
   }
   ```
3. Extract and validate query parameters:
   ```typescript
   const url = new URL(context.request.url)
   const queryParams = {
     limit: url.searchParams.get('limit'),
     offset: url.searchParams.get('offset'),
     order: url.searchParams.get('order')
   }
   
   const validationResult = ListCategoriesQuerySchema.safeParse(queryParams)
   if (!validationResult.success) {
     return new Response(JSON.stringify({
       error: 'Invalid query parameters',
       details: validationResult.error.flatten()
     }), {
       status: 400,
       headers: { 'Content-Type': 'application/json' }
     })
   }
   ```
4. Call service:
   ```typescript
   const categoryService = new CategoryService()
   const result = await categoryService.listCategories(
     supabase,
     user.id,
     validationResult.data
   )
   ```
5. Return response:
   ```typescript
   return new Response(JSON.stringify(result), {
     status: 200,
     headers: { 'Content-Type': 'application/json' }
   })
   ```
6. Add error handling with try-catch for 500 errors

### Step 4: Add Zod Validation Schema
**File**: `src/pages/api/rest/v1/categories.ts` or separate validation file

Define schema as shown in section 3.

### Step 5: Write Unit Tests
**File**: `src/lib/services/category.service.test.ts`

Test cases:
- List categories with default pagination
- List categories with custom limit and offset
- List categories with different order parameters
- Handle empty result set
- Handle user with no categories
- Validate pagination metadata accuracy

### Step 6: Write Integration Tests
**File**: `tests/api/categories.test.ts`

Test cases:
- Successful category list retrieval (200)
- Authentication failure (401)
- Invalid limit parameter (400)
- Invalid offset parameter (400)
- Invalid order format (400)
- Pagination boundary conditions
- Sorting by different fields

### Step 7: Update API Documentation
**File**: `.ai/api-documentation.md` or relevant docs

Document:
- Endpoint URL and method
- Query parameters with validation rules
- Request/response examples
- Error codes and messages
- Usage examples

### Step 8: Performance Testing
- Test with various dataset sizes (10, 100, 1000+ categories)
- Verify query execution time stays under acceptable threshold
- Check index usage with `EXPLAIN ANALYZE`
- Optimize if needed

### Step 9: Security Review
- Verify authentication is enforced
- Confirm user_id filtering prevents data leakage
- Test with different user accounts
- Validate input sanitization

### Step 10: Code Review & Deployment
- Submit PR with implementation
- Address review comments
- Merge to main branch
- Deploy to staging environment
- Run smoke tests
- Deploy to production

---

## Notes

- Follow early return pattern for error handling
- Use guard clauses at function start
- Place happy path at end of functions
- Ensure proper TypeScript typing throughout
- Use Supabase client from `context.locals`, not direct import
- Follow existing patterns from `AccountListResponse` and `TransactionListResponse`
