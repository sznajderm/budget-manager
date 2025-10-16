# API Endpoint Implementation Plan: Create Category

## 1. Endpoint Overview

The Create Category endpoint allows authenticated users to create new transaction categories. Each category is user-specific and must have a unique name per user (case-insensitive). The endpoint accepts a simple JSON payload with a category name and returns the created category with metadata.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/rest/v1/categories`
- **Parameters**:
  - Required: None (data in request body)
  - Optional: None
- **Request Body**:
```json
{
  "name": "Entertainment"
}
```
- **Content-Type**: `application/json`
- **Authentication**: Required (JWT token)

## 3. Used Types

### DTOs and Command Models (already defined in `src/types.ts`):
- `CategoryDTO`: Response type excluding user_id
- `CategoryCreateCommand`: Request validation type with only name field

### Zod Schema (to be created):
```typescript
const CreateCategorySchema = z.object({
  name: z.string()
    .min(1, "Category name is required")
    .refine(val => val.trim().length > 0, "Category name cannot be empty")
})
```

## 4. Response Details

- **Success Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Entertainment",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

- **Error Responses**:
  - 400 Bad Request: Invalid input (empty name, malformed JSON)
  - 401 Unauthorized: Missing or invalid authentication
  - 409 Conflict: Category name already exists for this user
  - 500 Internal Server Error: Database or server errors

## 5. Data Flow

1. **Request Reception**: Astro API endpoint receives POST request
2. **Authentication**: Extract user from `context.locals.supabase` auth context
3. **Input Validation**: Parse and validate request body using Zod schema
4. **Service Call**: Invoke category service to create category in database
5. **Database Insertion**: Insert into categories table with user_id and validated data
6. **Error Handling**: Handle unique constraint violations and other database errors
7. **Response Formation**: Return 201 with created category data (excluding user_id)

### Database Interaction:
- Insert into `categories` table with `user_id`, `name`, and auto-generated timestamps
- Handle unique constraint `categories_unique_name_per_user` for duplicate detection

## 6. Security Considerations

### Authentication & Authorization:
- Verify JWT token from request headers
- Extract authenticated user ID from token
- Ensure user can only create categories for themselves

### Input Validation:
- Validate JSON payload structure
- Sanitize category name (trim whitespace)
- Enforce name length constraints
- Prevent SQL injection (handled by Supabase client)

### Data Protection:
- Never expose user_id in API response
- Use parameterized queries through Supabase client
- Implement proper error messages without information leakage

## 7. Error Handling

### Validation Errors (400 Bad Request):
- Empty or missing name field
- Name contains only whitespace
- Malformed JSON payload
- Invalid Content-Type header

### Authentication Errors (401 Unauthorized):
- Missing Authorization header
- Invalid or expired JWT token
- Token verification failures

### Business Logic Errors (409 Conflict):
- Duplicate category name for the same user
- Database unique constraint violations

### System Errors (500 Internal Server Error):
- Database connection failures
- Unexpected Supabase errors
- Service layer exceptions

### Error Response Format:
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

## 8. Performance Considerations

### Database Optimization:
- Unique constraint `categories_unique_name_per_user` provides necessary indexing
- Efficient UUID generation with `gen_random_uuid()`
- Automatic timestamp management

### Potential Bottlenecks:
- Database connection pooling (handled by Supabase)
- Network latency for database queries
- JWT token verification overhead

## 9. Implementation Steps

1. **Create API Route**
   - Create `src/pages/api/rest/v1/categories.ts`
   - Implement POST handler with `export const prerender = false`
   - Extract Supabase client from `context.locals`

2. **Implement Request Validation**
   - Create Zod schema for input validation
   - Parse and validate request body
   - Handle validation errors with 400 status

3. **Implement Authentication Check**
   - Extract user from Supabase auth context
   - Return 401 if user is not authenticated
   - Get user ID for database operations

4. **Create Category Service**
   - Create `src/lib/services/categoryService.ts`
   - Implement `createCategory(supabase, userId, command)` function
   - Handle database insertion and error cases

5. **Handle Database Operations**
   - Insert category with user_id and validated data
   - Handle unique constraint violations (409 Conflict)
   - Return created category data

6. **Format Response**
   - Transform database result to CategoryDTO format
   - Remove user_id from response
   - Return 201 Created with category data

7. **Error Handling Implementation**
   - Catch and handle specific database errors
   - Map errors to appropriate HTTP status codes
   - Implement consistent error response format

8. **Testing**
   - Unit tests for validation logic
   - Integration tests for API endpoint
   - Test error scenarios and edge cases

9. **Documentation**
   - Update API documentation
   - Document service methods
   - Add inline code comments