# Create Account API Documentation

## Overview

The Create Account API endpoint allows you to create a new financial account in the budget manager system. This is a REST API endpoint that accepts JSON input and returns the created account information.

## Endpoint Details

- **HTTP Method**: `POST`
- **URL**: `/api/rest/v1/accounts`
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
  "name": "string",
  "account_type": "string"
}
```

### Field Descriptions

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `name` | string | Yes | The display name for the account | Must be non-empty after trimming whitespace |
| `account_type` | string | Yes | The type of account | Must be one of: `checking`, `savings`, `credit_card`, `cash`, `investment` |

## Response Format

### Success Response (201 Created)

```json
{
  "id": "uuid",
  "name": "string",
  "account_type": "string",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (UUID) for the created account |
| `name` | string | The account display name |
| `account_type` | string | The account type |
| `created_at` | string | ISO 8601 timestamp when the account was created |
| `updated_at` | string | ISO 8601 timestamp when the account was last updated |

## Example Usage

### Example 1: Create a Savings Account

**Request:**
```bash
curl -X POST http://localhost:4321/api/rest/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "Emergency Savings",
    "account_type": "savings"
  }'
```

**Response:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Emergency Savings",
  "account_type": "savings",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Example 2: Create a Checking Account

**Request:**
```bash
curl -X POST http://localhost:4321/api/rest/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "Main Checking",
    "account_type": "checking"
  }'
```

**Response:**
```json
{
  "id": "a8b9c0d1-e2f3-4567-8901-234567890abc",
  "name": "Main Checking",
  "account_type": "checking",
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
  "error": "Missing required fields: name, account_type"
}
```

### 422 Unprocessable Entity

**Causes:**
- Invalid account type
- Empty account name
- Validation errors

**Example Responses:**
```json
{
  "error": "Invalid account_type. Must be one of: checking, savings, credit_card, cash, investment"
}
```

```json
{
  "error": "Account name cannot be empty"
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

## JavaScript/TypeScript Examples

### Using Fetch API

```javascript
async function createAccount(name, accountType, authToken) {
  try {
    const response = await fetch('/api/rest/v1/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: name,
        account_type: accountType
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create account');
    }
    
    return result;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

// Usage with Supabase Auth
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  createAccount('Vacation Fund', 'savings', session.access_token)
    .then(account => console.log('Created account:', account))
    .catch(error => console.error('Failed:', error));
}
```

### Using Axios

```javascript
import axios from 'axios';

async function createAccount(name, accountType, authToken) {
  try {
    const response = await axios.post('/api/rest/v1/accounts', {
      name: name,
      account_type: accountType
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to create account');
    } else {
      throw new Error('Network error');
    }
  }
}
```

### TypeScript Interface

```typescript
interface AccountCreateRequest {
  name: string;
  account_type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment';
}

interface AccountResponse {
  id: string;
  name: string;
  account_type: string;
  created_at: string;
  updated_at: string;
}

interface ErrorResponse {
  error: string;
}
```

## Validation Rules

1. **Account Name:**
   - Must be provided (required field)
   - Cannot be empty or contain only whitespace
   - Leading and trailing whitespace is automatically trimmed

2. **Account Type:**
   - Must be provided (required field)
   - Must be exactly one of the following values:
     - `checking`
     - `savings`
     - `credit_card`
     - `cash`
     - `investment`

## Notes

- **Authentication Required**: This endpoint requires valid Supabase Auth JWT token
- **User Assignment**: Accounts are automatically assigned to the authenticated user
- **Database Constraints**: The system enforces database-level constraints for data integrity
- **Error Logging**: Failed requests are logged on the server for debugging purposes
- **Response Time**: Typical response time is under 100ms for successful requests
- **Token Expiry**: JWT tokens have expiration times - you may need to refresh them periodically

## Testing the Endpoint

### Valid Test Cases

1. **All Account Types:**
   ```bash
   # Set your JWT token first
   export JWT_TOKEN="your_jwt_token_here"
   
   # Test each account type
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Test Checking", "account_type": "checking"}'
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Test Savings", "account_type": "savings"}'
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Test Credit Card", "account_type": "credit_card"}'
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Test Cash", "account_type": "cash"}'
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Test Investment", "account_type": "investment"}'
   ```

2. **Edge Cases:**
   ```bash
   # Test with spaces in name (should be trimmed)
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "  Spaced Name  ", "account_type": "savings"}'
   ```

### Error Test Cases

1. **Missing Fields:**
   ```bash
   # Missing name
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"account_type": "savings"}'
   
   # Missing account_type
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Test Account"}'
   
   # Empty request body
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{}'
   ```

2. **Invalid Values:**
   ```bash
   # Invalid account type
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Test", "account_type": "invalid"}'
   
   # Empty name
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "", "account_type": "savings"}'
   
   # Whitespace-only name
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "   ", "account_type": "savings"}'
   ```

3. **Invalid JSON:**
   ```bash
   # Malformed JSON
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name": "Test", invalid json}'
   ```

4. **Authentication Errors:**
   ```bash
   # Missing authorization header
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -d '{"name": "Test", "account_type": "savings"}'
   
   # Invalid token
   curl -X POST http://localhost:4321/api/rest/v1/accounts -H "Content-Type: application/json" -H "Authorization: Bearer invalid_token" -d '{"name": "Test", "account_type": "savings"}'
   ```
