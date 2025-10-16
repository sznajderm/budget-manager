# Create Transaction API Documentation

## Overview

The Create Transaction API endpoint allows you to create a new financial transaction record in the budget manager system. This is a REST API endpoint that accepts JSON input and returns the created transaction information with comprehensive validation and security features.

## Endpoint Details

- **HTTP Method**: `POST`
- **URL**: `/api/rest/v1/transactions`
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

The request body must be a valid JSON object with the following required and optional fields:

```json
{
  "amount_cents": 1250,
  "transaction_type": "expense",
  "description": "Coffee shop",
  "transaction_date": "2024-01-15T10:30:00.000Z",
  "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "category_id": "a8b9c0d1-e2f3-4567-8901-234567890abc"
}
```

### Field Descriptions

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `amount_cents` | integer | Yes | Transaction amount in cents (positive integer) | Must be a positive integer |
| `transaction_type` | string | Yes | Type of transaction | Must be either `"expense"` or `"income"` |
| `description` | string | Yes | Description of the transaction | Must be non-empty after trimming whitespace |
| `transaction_date` | string | Yes | Date and time of the transaction | Must be valid ISO 8601 timestamp |
| `account_id` | string | Yes | UUID of the account for this transaction | Must be a valid UUID that belongs to the authenticated user |
| `category_id` | string | No | UUID of the category for this transaction | Must be a valid UUID that belongs to the authenticated user, or null |

## Response Format

### Success Response (201 Created)

```json
{
  "id": "uuid",
  "amount_cents": 1250,
  "transaction_type": "expense",
  "description": "Coffee shop",
  "transaction_date": "2024-01-15T10:30:00.000Z",
  "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "category_id": "a8b9c0d1-e2f3-4567-8901-234567890abc",
  "created_at": "2024-01-15T10:30:15.123Z",
  "updated_at": "2024-01-15T10:30:15.123Z"
}
```

### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (UUID) for the created transaction |
| `amount_cents` | integer | Transaction amount in cents |
| `transaction_type` | string | Type of transaction (`"expense"` or `"income"`) |
| `description` | string | Description of the transaction |
| `transaction_date` | string | ISO 8601 timestamp of the transaction |
| `account_id` | string | UUID of the associated account |
| `category_id` | string \| null | UUID of the associated category (null if not categorized) |
| `created_at` | string | ISO 8601 timestamp when the transaction was created |
| `updated_at` | string | ISO 8601 timestamp when the transaction was last updated |

## Example Usage

### Example 1: Create an Expense Transaction

**Request:**
```bash
curl -X POST http://localhost:4321/api/rest/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "amount_cents": 1250,
    "transaction_type": "expense",
    "description": "Coffee shop",
    "transaction_date": "2024-01-15T10:30:00.000Z",
    "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "category_id": "a8b9c0d1-e2f3-4567-8901-234567890abc"
  }'
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "amount_cents": 1250,
  "transaction_type": "expense",
  "description": "Coffee shop",
  "transaction_date": "2024-01-15T10:30:00.000Z",
  "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "category_id": "a8b9c0d1-e2f3-4567-8901-234567890abc",
  "created_at": "2024-01-15T10:30:15.123Z",
  "updated_at": "2024-01-15T10:30:15.123Z"
}
```

### Example 2: Create an Income Transaction (No Category)

**Request:**
```bash
curl -X POST http://localhost:4321/api/rest/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "amount_cents": 250000,
    "transaction_type": "income",
    "description": "Salary deposit",
    "transaction_date": "2024-01-01T09:00:00.000Z",
    "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }'
```

**Response:**
```json
{
  "id": "987f6543-e21a-43b2-b789-987654321098",
  "amount_cents": 250000,
  "transaction_type": "income",
  "description": "Salary deposit",
  "transaction_date": "2024-01-01T09:00:00.000Z",
  "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "category_id": null,
  "created_at": "2024-01-01T09:00:12.456Z",
  "updated_at": "2024-01-01T09:00:12.456Z"
}
```

### Example 3: Create an Expense with Decimal Amount

**Request:**
```bash
curl -X POST http://localhost:4321/api/rest/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "amount_cents": 2799,
    "transaction_type": "expense",
    "description": "Grocery shopping",
    "transaction_date": "2024-01-15T14:22:00.000Z",
    "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "category_id": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e"
  }'
```

**Response:**
```json
{
  "id": "456a7890-b123-4567-c890-123456789012",
  "amount_cents": 2799,
  "transaction_type": "expense",
  "description": "Grocery shopping",
  "transaction_date": "2024-01-15T14:22:00.000Z",
  "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "category_id": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
  "created_at": "2024-01-15T14:22:30.789Z",
  "updated_at": "2024-01-15T14:22:30.789Z"
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
  "error": "Missing Authorization header"
}
```

### 400 Bad Request

**Causes:**
- Invalid JSON in request body
- Request body is not a JSON object
- Missing required fields

**Example Responses:**
```json
{
  "error": "Invalid JSON in request body"
}
```

```json
{
  "error": "Missing required fields: amount_cents, transaction_type, description"
}
```

### 422 Unprocessable Entity

**Causes:**
- Invalid transaction type
- Invalid amount (negative or zero)
- Empty description
- Invalid UUID format for account_id or category_id
- Invalid ISO timestamp format
- Account or category doesn't belong to user
- Validation errors

**Example Responses:**
```json
{
  "error": "Transaction type must be either 'expense' or 'income'"
}
```

```json
{
  "error": "Amount must be a positive integer in cents"
}
```

```json
{
  "error": "Account ID must be a valid UUID"
}
```

```json
{
  "error": "Account not found or does not belong to user"
}
```

```json
{
  "error": "Category not found or does not belong to user"
}
```

```json
{
  "error": "Invalid ISO 8601 timestamp format"
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
async function createTransaction(transactionData, authToken) {
  try {
    const response = await fetch('/api/rest/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(transactionData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create transaction');
    }
    
    return result;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

// Usage with Supabase Auth
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const transactionData = {
    amount_cents: 1250,
    transaction_type: 'expense',
    description: 'Coffee shop',
    transaction_date: new Date().toISOString(),
    account_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    category_id: 'a8b9c0d1-e2f3-4567-8901-234567890abc'
  };
  
  createTransaction(transactionData, session.access_token)
    .then(transaction => console.log('Created transaction:', transaction))
    .catch(error => console.error('Failed:', error));
}
```

### Using Axios

```javascript
import axios from 'axios';

async function createTransaction(transactionData, authToken) {
  try {
    const response = await axios.post('/api/rest/v1/transactions', transactionData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to create transaction');
    } else {
      throw new Error('Network error');
    }
  }
}
```

### TypeScript Interfaces

```typescript
interface TransactionCreateRequest {
  amount_cents: number;
  transaction_type: 'expense' | 'income';
  description: string;
  transaction_date: string;
  account_id: string;
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
}

interface ErrorResponse {
  error: string;
}

// Usage
async function createTypedTransaction(
  data: TransactionCreateRequest,
  token: string
): Promise<TransactionResponse> {
  const response = await fetch('/api/rest/v1/transactions', {
    method: 'POST',
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

### Required Fields
All of the following fields are required and must be provided:
- `amount_cents`
- `transaction_type`
- `description`
- `transaction_date`
- `account_id`

### Field-Specific Validation

1. **Amount (amount_cents):**
   - Must be a positive integer
   - Represents amount in cents (e.g., $12.50 = 1250)
   - Cannot be zero or negative

2. **Transaction Type:**
   - Must be exactly one of: `"expense"` or `"income"`
   - Case-sensitive

3. **Description:**
   - Cannot be empty after trimming whitespace
   - Leading and trailing whitespace is automatically trimmed
   - Must contain at least one non-whitespace character

4. **Transaction Date:**
   - Must be a valid ISO 8601 timestamp
   - Examples: `"2024-01-15T10:30:00.000Z"`, `"2024-01-15T10:30:00Z"`

5. **Account ID:**
   - Must be a valid UUID format
   - Must reference an account that belongs to the authenticated user
   - Ownership is verified before creating the transaction

6. **Category ID (Optional):**
   - If provided, must be a valid UUID format
   - Must reference a category that belongs to the authenticated user
   - Can be omitted or set to null for uncategorized transactions
   - Ownership is verified before creating the transaction

## Security Features

### Authentication & Authorization
- **JWT Token Validation**: All requests must include a valid Supabase Auth JWT token
- **User Ownership**: Transactions are automatically assigned to the authenticated user
- **Account Ownership**: System validates that referenced accounts belong to the requesting user
- **Category Ownership**: System validates that referenced categories belong to the requesting user

### Data Validation
- **Input Sanitization**: Description text is trimmed of leading/trailing whitespace
- **Type Safety**: All fields are validated for correct data types
- **Format Validation**: UUIDs and timestamps are validated for correct format
- **Business Rules**: Amount must be positive, transaction type must be valid enum

### Error Handling
- **Detailed Error Messages**: Clear, specific error messages for different failure scenarios
- **Structured Responses**: Consistent error response format
- **Security-Conscious**: No sensitive information leaked in error messages
- **Logging**: Server-side logging for debugging without exposing details to client

## Notes

- **Authentication Required**: This endpoint requires valid Supabase Auth JWT token
- **User Assignment**: Transactions are automatically assigned to the authenticated user
- **Ownership Validation**: System ensures users can only reference their own accounts and categories
- **Database Constraints**: The system enforces database-level constraints for data integrity
- **Error Logging**: Failed requests are logged on the server for debugging purposes
- **Response Time**: Typical response time is under 200ms for successful requests
- **Token Expiry**: JWT tokens have expiration times - you may need to refresh them periodically
- **Amount Format**: Always provide amounts in cents as integers (e.g., $12.50 = 1250 cents)
- **Transaction Dates**: Can be in the past or future - useful for recording historical transactions or scheduled transactions

## Testing the Endpoint

### Valid Test Cases

1. **Basic Transaction Creation:**
   ```bash
   # Set your JWT token first
   export JWT_TOKEN="your_jwt_token_here"
   
   # You'll need valid account and category IDs from your database
   export ACCOUNT_ID="your_account_id_here"
   export CATEGORY_ID="your_category_id_here"
   
   # Create expense transaction with category
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 1250,
       \"transaction_type\": \"expense\",
       \"description\": \"Coffee shop\",
       \"transaction_date\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
       \"account_id\": \"$ACCOUNT_ID\",
       \"category_id\": \"$CATEGORY_ID\"
     }"
   
   # Create income transaction without category
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 250000,
       \"transaction_type\": \"income\",
       \"description\": \"Salary deposit\",
       \"transaction_date\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   ```

2. **Different Transaction Types:**
   ```bash
   # Large expense
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 125000,
       \"transaction_type\": \"expense\",
       \"description\": \"Monthly rent payment\",
       \"transaction_date\": \"2024-01-01T00:00:00.000Z\",
       \"account_id\": \"$ACCOUNT_ID\",
       \"category_id\": \"$CATEGORY_ID\"
     }"
   
   # Small purchase
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 199,
       \"transaction_type\": \"expense\",
       \"description\": \"Bus fare\",
       \"transaction_date\": \"2024-01-15T08:30:00.000Z\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   ```

### Error Test Cases

1. **Missing Required Fields:**
   ```bash
   # Missing amount_cents
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"transaction_type\": \"expense\",
       \"description\": \"Test\",
       \"transaction_date\": \"2024-01-15T10:30:00.000Z\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   
   # Missing transaction_type
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 1000,
       \"description\": \"Test\",
       \"transaction_date\": \"2024-01-15T10:30:00.000Z\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   ```

2. **Invalid Values:**
   ```bash
   # Negative amount
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": -1000,
       \"transaction_type\": \"expense\",
       \"description\": \"Test\",
       \"transaction_date\": \"2024-01-15T10:30:00.000Z\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   
   # Invalid transaction type
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 1000,
       \"transaction_type\": \"invalid\",
       \"description\": \"Test\",
       \"transaction_date\": \"2024-01-15T10:30:00.000Z\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   
   # Empty description
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 1000,
       \"transaction_type\": \"expense\",
       \"description\": \"\",
       \"transaction_date\": \"2024-01-15T10:30:00.000Z\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   
   # Invalid UUID format
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 1000,
       \"transaction_type\": \"expense\",
       \"description\": \"Test\",
       \"transaction_date\": \"2024-01-15T10:30:00.000Z\",
       \"account_id\": \"not-a-uuid\"
     }"
   
   # Invalid timestamp format
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 1000,
       \"transaction_type\": \"expense\",
       \"description\": \"Test\",
       \"transaction_date\": \"2024-01-15 10:30:00\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   ```

3. **Authentication Errors:**
   ```bash
   # Missing authorization header
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -d "{
       \"amount_cents\": 1000,
       \"transaction_type\": \"expense\",
       \"description\": \"Test\",
       \"transaction_date\": \"2024-01-15T10:30:00.000Z\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   
   # Invalid token
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer invalid_token" \
     -d "{
       \"amount_cents\": 1000,
       \"transaction_type\": \"expense\",
       \"description\": \"Test\",
       \"transaction_date\": \"2024-01-15T10:30:00.000Z\",
       \"account_id\": \"$ACCOUNT_ID\"
     }"
   ```

4. **Ownership Validation:**
   ```bash
   # Try to use another user's account (should fail)
   curl -X POST http://localhost:4321/api/rest/v1/transactions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -d "{
       \"amount_cents\": 1000,
       \"transaction_type\": \"expense\",
       \"description\": \"Test\",
       \"transaction_date\": \"2024-01-15T10:30:00.000Z\",
       \"account_id\": \"00000000-0000-0000-0000-000000000000\"
     }"
   ```

## Amount Conversion Helper

Since the API expects amounts in cents, here's a helper for converting dollar amounts:

```javascript
// Helper function to convert dollars to cents
function dollarsToCents(dollars) {
  return Math.round(dollars * 100);
}

// Examples:
dollarsToCents(12.50);  // Returns: 1250
dollarsToCents(0.99);   // Returns: 99
dollarsToCents(100);    // Returns: 10000

// Helper function to convert cents to dollars (for display)
function centsToDollars(cents) {
  return cents / 100;
}

// Examples:
centsToDollars(1250);   // Returns: 12.50
centsToDollars(99);     // Returns: 0.99
centsToDollars(10000);  // Returns: 100
```

## Related Endpoints

Before creating transactions, you'll need to have accounts and optionally categories set up:

- [Create Account](./create-account.md) - Create accounts to associate with transactions
- [Create Category](./create-category.md) - Create categories to organize transactions
- [Authentication Guide](./authentication-guide.md) - How to obtain JWT tokens for API testing