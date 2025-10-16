# Create Category API Documentation

## Overview

The Create Category API endpoint allows you to create a new transaction category in the budget manager system. This is a REST API endpoint that accepts JSON input and returns the created category information.

## Endpoint Details

- **HTTP Method**: `POST`
- **URL**: `/rest/v1/categories`
- **Content-Type**: `application/json`
- **Authentication**: Required (JWT Bearer token)

## Authentication

This endpoint requires authentication via Supabase Auth. You need to include a valid JWT token in the request headers.

### Required Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Request content type |
| `Authorization` | `Bearer <jwt_token>` | JWT token from Supabase Auth |

### Getting Authentication Token

To get an authentication token, you need to sign in a user through Supabase Auth:

```javascript
// Sign in user and get session
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

if (data.session) {
  const token = data.session.access_token;
  // Use this token in API requests
}
```

## Request Format

### Request Body

The request body must be a valid JSON object with the following required fields:

```json
{
  "name": "string"
}
```

### Field Descriptions

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `name` | string | Yes | The display name for the category | Must be 1-100 characters, non-empty after trimming, unique per user (case-insensitive) |

## Response Format

### Success Response (201 Created)

```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (UUID) for the created category |
| `name` | string | The category display name |
| `created_at` | string | ISO 8601 timestamp when the category was created |
| `updated_at` | string | ISO 8601 timestamp when the category was last updated |

## Example Usage

### Example 1: Create an Entertainment Category

**Request:**
```bash
curl -X POST http://localhost:4321/rest/v1/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "Entertainment"
  }'
```

**Response:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Entertainment",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Example 2: Create a Groceries Category

**Request:**
```bash
curl -X POST http://localhost:4321/rest/v1/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "Groceries"
  }'
```

**Response:**
```json
{
  "id": "a8b9c0d1-e2f3-4567-8901-234567890abc",
  "name": "Groceries",
  "created_at": "2024-01-15T10:35:00.000Z",
  "updated_at": "2024-01-15T10:35:00.000Z"
}
```

## Error Responses

### 401 Unauthorized

**Causes:**
- Missing Authorization header
- Invalid JWT token
- Expired JWT token

**Example Response:**
```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request

**Causes:**
- Invalid JSON in request body
- Request body is not a JSON object
- Missing required fields

**Example Response:**
```json
{
  "error": "Missing required fields: name"
}
```

### 422 Unprocessable Entity

**Causes:**
- Invalid category name
- Empty category name
- Category name too long
- Duplicate category name
- Validation errors

**Example Responses:**
```json
{
  "error": "Category name cannot exceed 100 characters"
}
```

```json
{
  "error": "Category name cannot be empty"
}
```

```json
{
  "error": "Category name already exists for this user"
}
```

### 500 Internal Server Error

**Causes:**
- Database connection issues
- Unexpected server errors

**Example Response:**
```json
{
  "error": "An unexpected error occurred"
}
```
}
```

## JavaScript/TypeScript Examples

### Using Fetch API

```javascript
async function createCategory(name, authToken) {
  try {
    const response = await fetch('/rest/v1/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: name
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create category');
    }
    
    return result;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Usage with Supabase Auth
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  createCategory('Entertainment', session.access_token)
    .then(category => console.log('Created category:', category))
    .catch(error => console.error('Failed:', error));
}
```

### Using Axios

```javascript
import axios from 'axios';

async function createCategory(name, authToken) {
  try {
    const response = await axios.post('/rest/v1/categories', {
      name: name
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to create category');
    } else {
      throw new Error('Network error');
    }
  }
}
```

### TypeScript Interface

```typescript
interface CategoryCreateRequest {
  name: string;
}

interface CategoryResponse {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ErrorResponse {
  error: string;
}
```

## Validation Rules

1. **Category Name:**
   - Must be provided (required field)
   - Must be 1-100 characters long
   - Cannot be empty or contain only whitespace
   - Leading and trailing whitespace is automatically trimmed
   - Must be unique per user (case-insensitive comparison)

## Notes

- **Authentication Required**: This endpoint requires valid Supabase Auth JWT token
- **User Assignment**: Categories are automatically assigned to the authenticated user
- **Database Constraints**: The system enforces database-level constraints for data integrity
- **Error Logging**: Failed requests are logged on the server for debugging purposes
- **Response Time**: Typical response time is under 100ms for successful requests
- **Token Expiry**: JWT tokens have expiration times - you may need to refresh them periodically
- **Case-Insensitive Uniqueness**: Category names are compared case-insensitively for duplicates

## Testing the Endpoint

### Valid Test Cases

1. **Basic Category Creation:**
   ```bash
   # Set your JWT token first
   export JWT_TOKEN="your_jwt_token_here"
   
   # Test category creation
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Entertainment"}'
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Groceries"}'
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Transportation"}'
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Healthcare"}'
   ```

2. **Edge Cases:**
   ```bash
   # Test with spaces in name (should be trimmed)
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "  Dining Out  "}'
   
   # Test maximum length (100 characters)
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "This is a very long category name that is exactly one hundred characters long for testing purposes"}'
   ```

### Error Test Cases

1. **Missing Fields:**
   ```bash
   # Missing name
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{}'
   
   # Empty request body
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d ''
   ```

2. **Invalid Values:**
   ```bash
   # Empty name
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": ""}'
   
   # Whitespace-only name
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "   "}'
   
   # Name too long (over 100 characters)
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "This category name is intentionally way too long and exceeds the maximum allowed length of one hundred characters for testing validation"}'
   
   # Duplicate name (case-insensitive)
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "entertainment"}' # If "Entertainment" already exists
   ```

3. **Invalid JSON:**
   ```bash
   # Malformed JSON
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Test", invalid json}'
   ```

4. **Authentication Errors:**
   ```bash
   # Missing authorization header
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -d '{"name": "Test"}'
   
   # Invalid token
   curl -X POST http://localhost:4321/rest/v1/categories -H "Content-Type: application/json" -H "Authorization: Bearer invalid_token" -d '{"name": "Test"}'
   ```
