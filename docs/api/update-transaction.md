# Update Transaction API Documentation

## Overview

The Update Transaction API endpoint allows you to modify an existing financial transaction record in the budget manager system. This is a REST API endpoint that accepts JSON input and returns the updated transaction information with comprehensive validation and security features.

## Endpoint Details

- **HTTP Method**: `PATCH`
- **URL**: `/api/rest/v1/transactions?id=eq.{transaction_id}`
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

### URL Parameters

The transaction ID must be specified using PostgREST query syntax:
- **Format**: `?id=eq.{transaction_id}`
- **Example**: `?id=eq.f47ac10b-58cc-4372-a567-0e02b2c3d479`

### Request Body

The request body must be a valid JSON object with at least one of the following optional fields:

```json
{
  "amount_cents": 1500,
  "description": "Updated coffee shop purchase",
  "category_id": "a8b9c0d1-e2f3-4567-8901-234567890abc"
}
```

### Field Descriptions

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `amount_cents` | integer | No | New transaction amount in cents (positive integer) | Must be a positive integer if provided |
| `description` | string | No | New description of the transaction | Must be non-empty after trimming whitespace if provided |
| `category_id` | string | No | UUID of the new category for this transaction | Must be a valid UUID that belongs to the authenticated user, or null to uncategorize |

**Note**: At least one field must be provided for the update to proceed.

## Response Format

### Success Response (200 OK)

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "amount_cents": 1500,
  "transaction_type": "expense",
  "description": "Updated coffee shop purchase",
  "transaction_date": "2024-01-15T10:30:00.000Z",
  "account_id": "b8c9d0e1-f2a3-4567-8901-234567890def",
  "category_id": "a8b9c0d1-e2f3-4567-8901-234567890abc",
  "created_at": "2024-01-15T10:30:15.123Z",
  "updated_at": "2024-01-15T11:45:22.789Z",
  "accounts": {
    "name": "Checking Account"
  },
  "categories": {
    "name": "Food & Dining"
  }
}
```

### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (UUID) for the transaction |
| `amount_cents` | integer | Transaction amount in cents |
| `transaction_type` | string | Type of transaction (`"expense"` or `"income"`) |
| `description` | string | Description of the transaction |
| `transaction_date` | string | ISO 8601 timestamp of the transaction |
| `account_id` | string | UUID of the associated account |
| `category_id` | string \| null | UUID of the associated category (null if uncategorized) |
| `created_at` | string | ISO 8601 timestamp when the transaction was created |
| `updated_at` | string | ISO 8601 timestamp when the transaction was last updated |
| `accounts` | object | Embedded account information with name |
| `categories` | object \| null | Embedded category information with name (null if uncategorized) |

## Example Usage

### Example 1: Update Transaction Amount and Description

**Request:**
```bash
curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "amount_cents": 1500,
    "description": "Updated coffee shop purchase with tip"
  }'
```

**Response:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "amount_cents": 1500,
  "transaction_type": "expense",
  "description": "Updated coffee shop purchase with tip",
  "transaction_date": "2024-01-15T10:30:00.000Z",
  "account_id": "b8c9d0e1-f2a3-4567-8901-234567890def",
  "category_id": "a8b9c0d1-e2f3-4567-8901-234567890abc",
  "created_at": "2024-01-15T10:30:15.123Z",
  "updated_at": "2024-01-15T11:45:22.789Z",
  "accounts": {
    "name": "Checking Account"
  },
  "categories": {
    "name": "Food & Dining"
  }
}
```

### Example 2: Change Transaction Category

**Request:**
```bash
curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "category_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f"
  }'
```

**Response:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "amount_cents": 1250,
  "transaction_type": "expense",
  "description": "Coffee shop",
  "transaction_date": "2024-01-15T10:30:00.000Z",
  "account_id": "b8c9d0e1-f2a3-4567-8901-234567890def",
  "category_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  "created_at": "2024-01-15T10:30:15.123Z",
  "updated_at": "2024-01-15T12:15:45.456Z",
  "accounts": {
    "name": "Checking Account"
  },
  "categories": {
    "name": "Entertainment"
  }
}
```

### Example 3: Remove Category from Transaction

**Request:**
```bash
curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "category_id": null
  }'
```

**Response:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "amount_cents": 1250,
  "transaction_type": "expense",
  "description": "Coffee shop",
  "transaction_date": "2024-01-15T10:30:00.000Z",
  "account_id": "b8c9d0e1-f2a3-4567-8901-234567890def",
  "category_id": null,
  "created_at": "2024-01-15T10:30:15.123Z",
  "updated_at": "2024-01-15T12:30:10.123Z",
  "accounts": {
    "name": "Checking Account"
  },
  "categories": null
}
```

### Example 4: Update All Modifiable Fields

**Request:**
```bash
curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "amount_cents": 2799,
    "description": "Large grocery shopping trip",
    "category_id": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e"
  }'
```

**Response:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "amount_cents": 2799,
  "transaction_type": "expense",
  "description": "Large grocery shopping trip",
  "transaction_date": "2024-01-15T10:30:00.000Z",
  "account_id": "b8c9d0e1-f2a3-4567-8901-234567890def",
  "category_id": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
  "created_at": "2024-01-15T10:30:15.123Z",
  "updated_at": "2024-01-15T13:00:30.456Z",
  "accounts": {
    "name": "Checking Account"
  },
  "categories": {
    "name": "Groceries"
  }
}
```

## Error Responses

### 400 Bad Request

**Causes:**
- Missing transaction ID in URL query parameter
- Invalid transaction ID format
- Invalid JSON in request body
- Request body is not a JSON object
- No fields provided for update

**Example Responses:**
```json
{
  "error": "Transaction ID is required in format: ?id=eq.{transaction_id}"
}
```

```json
{
  "error": "Invalid transaction ID format: must be a valid UUID"
}
```

```json
{
  "error": "Invalid JSON in request body"
}
```

### 401 Unauthorized

**Causes:**
- Missing Authorization header
- Invalid JWT token
- Expired JWT token

**Example Response:**
```json
{
  "error": "Missing Authorization header"
}
```

### 404 Not Found

**Causes:**
- Transaction does not exist
- Transaction does not belong to authenticated user

**Example Responses:**
```json
{
  "error": "Transaction not found or does not belong to user"
}
```

### 422 Unprocessable Entity

**Causes:**
- Invalid amount (negative or zero)
- Empty description
- Invalid UUID format for category_id
- Category doesn't belong to user
- No fields provided for update
- Validation errors

**Example Responses:**
```json
{
  "error": "Amount must be a positive integer in cents"
}
```

```json
{
  "error": "Description cannot be empty"
}
```

```json
{
  "error": "Category ID must be a valid UUID"
}
```

```json
{
  "error": "Category not found or does not belong to user"
}
```

```json
{
  "error": "At least one field must be provided for update"
}
```

### 500 Internal Server Error

**Causes:**
- Database connection issues
- Unexpected server errors
- Supabase client not available

**Example Response:**
```json
{
  "error": "An unexpected error occurred"
}
```

## JavaScript/TypeScript Examples

### Using Fetch API

```javascript
async function updateTransaction(transactionId, updateData, authToken) {
  try {
    const url = `/api/rest/v1/transactions?id=eq.${transactionId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update transaction');
    }
    
    return result;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

// Usage with Supabase Auth
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const updateData = {
    amount_cents: 1500,
    description: 'Updated description'
  };
  
  updateTransaction('f47ac10b-58cc-4372-a567-0e02b2c3d479', updateData, session.access_token)
    .then(transaction => console.log('Updated transaction:', transaction))
    .catch(error => console.error('Failed:', error));
}
```

### Using Axios

```javascript
import axios from 'axios';

async function updateTransaction(transactionId, updateData, authToken) {
  try {
    const url = `/api/rest/v1/transactions?id=eq.${transactionId}`;
    const response = await axios.patch(url, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to update transaction');
    } else {
      throw new Error('Network error');
    }
  }
}
```

### TypeScript Interfaces

```typescript
interface TransactionUpdateRequest {
  amount_cents?: number;
  description?: string;
  category_id?: string | null;
}

interface TransactionResponse {
  id: string;
  amount_cents: number;
  transaction_type: 'expense' | 'income';
  description: string;
  transaction_date: string;
  account_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  accounts: {
    name: string;
  };
  categories: {
    name: string;
  } | null;
}

interface ErrorResponse {
  error: string;
}

// Usage
async function updateTypedTransaction(
  transactionId: string,
  data: TransactionUpdateRequest,
  token: string
): Promise<TransactionResponse> {
  const url = `/api/rest/v1/transactions?id=eq.${transactionId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
}
```

## Validation Rules

### Required Parameters
- **Transaction ID**: Must be provided in the URL query parameter using PostgREST format
- **At least one update field**: Must provide at least one of `amount_cents`, `description`, or `category_id`

### Field-Specific Validation

1. **Amount (amount_cents) - Optional:**
   - Must be a positive integer if provided
   - Represents amount in cents (e.g., $15.00 = 1500)
   - Cannot be zero or negative

2. **Description - Optional:**
   - Cannot be empty after trimming whitespace if provided
   - Leading and trailing whitespace is automatically trimmed
   - Must contain at least one non-whitespace character

3. **Category ID - Optional:**
   - If provided, must be a valid UUID format or null
   - Must reference a category that belongs to the authenticated user
   - Set to null to remove category assignment
   - Ownership is verified before updating the transaction

4. **Transaction ID (URL Parameter):**
   - Must be a valid UUID format
   - Must reference a transaction that belongs to the authenticated user
   - Specified using PostgREST query syntax: `?id=eq.{transaction_id}`

## Security Features

### Authentication & Authorization
- **JWT Token Validation**: All requests must include a valid Supabase Auth JWT token
- **Transaction Ownership**: Users can only update their own transactions
- **Category Ownership**: System validates that referenced categories belong to the requesting user

### Data Validation
- **Input Sanitization**: Description text is trimmed of leading/trailing whitespace
- **Type Safety**: All fields are validated for correct data types
- **Format Validation**: UUIDs are validated for correct format
- **Business Rules**: Amount must be positive if provided

### Error Handling
- **Detailed Error Messages**: Clear, specific error messages for different failure scenarios
- **Structured Responses**: Consistent error response format
- **Security-Conscious**: No sensitive information leaked in error messages
- **Logging**: Server-side logging for debugging without exposing details to client

## Notes

- **Authentication Required**: This endpoint requires valid Supabase Auth JWT token
- **Ownership Validation**: System ensures users can only update their own transactions and reference their own categories
- **Partial Updates**: Only provided fields are updated; omitted fields remain unchanged
- **Database Constraints**: The system enforces database-level constraints for data integrity
- **Automatic Timestamps**: The `updated_at` field is automatically set to the current timestamp
- **Response Time**: Typical response time is under 200ms for successful requests
- **PostgREST Query Format**: Transaction ID must be specified using the format `?id=eq.{transaction_id}`

## Testing the Endpoint

### Valid Test Cases

1. **Update Amount Only:**
   ```bash
   # Set your JWT token and transaction ID first
   export JWT_TOKEN="your_jwt_token_here"
   export TRANSACTION_ID="your_transaction_id_here"
   
   # Update transaction amount
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.$TRANSACTION_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "amount_cents": 2500
     }'
   ```

2. **Update Description Only:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.$TRANSACTION_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "description": "Updated transaction description"
     }'
   ```

3. **Update Category Only:**
   ```bash
   export CATEGORY_ID="your_category_id_here"
   
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.$TRANSACTION_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "category_id": "'$CATEGORY_ID'"
     }'
   ```

4. **Remove Category Assignment:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.$TRANSACTION_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "category_id": null
     }'
   ```

5. **Update Multiple Fields:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.$TRANSACTION_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "amount_cents": 3500,
       "description": "Large grocery shopping with household items",
       "category_id": "'$CATEGORY_ID'"
     }'
   ```

### Error Test Cases

1. **Missing Transaction ID:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "amount_cents": 1500
     }'
   ```

2. **Invalid Transaction ID Format:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.not-a-uuid" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "amount_cents": 1500
     }'
   ```

3. **No Update Fields Provided:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.$TRANSACTION_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{}'
   ```

4. **Invalid Values:**
   ```bash
   # Negative amount
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.$TRANSACTION_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "amount_cents": -1000
     }'
   
   # Empty description
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.$TRANSACTION_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "description": ""
     }'
   
   # Invalid category ID format
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.$TRANSACTION_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "category_id": "not-a-uuid"
     }'
   ```

5. **Non-existent Transaction:**
   ```bash
   curl -X PATCH "http://localhost:4321/api/rest/v1/transactions?id=eq.00000000-0000-0000-0000-000000000000" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d '{
       "amount_cents": 1500
     }'
   ```

## Amount Conversion Helper

Since the API expects amounts in cents, here's a helper for converting dollar amounts:

```javascript
// Helper function to convert dollars to cents
function dollarsToCents(dollars) {
  return Math.round(dollars * 100);
}

// Examples:
dollarsToCents(15.00);  // Returns: 1500
dollarsToCents(25.99);  // Returns: 2599
dollarsToCents(100);    // Returns: 10000

// Helper function to convert cents to dollars (for display)
function centsToDollars(cents) {
  return cents / 100;
}

// Examples:
centsToDollars(1500);   // Returns: 15.00
centsToDollars(2599);   // Returns: 25.99
centsToDollars(10000);  // Returns: 100
```

## Related Endpoints

- [Create Transaction](./create-transaction.md) - Create new transactions
- [List Transactions](./list-transactions.md) - Retrieve transaction lists
- [Get Transaction](./get-transaction.md) - Retrieve individual transaction details
- [Delete Transaction](./delete-transaction.md) - Delete transactions
- [Authentication Guide](./authentication-guide.md) - How to obtain JWT tokens for API testing