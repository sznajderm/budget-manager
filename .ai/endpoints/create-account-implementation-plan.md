# API Endpoint Implementation Plan: Create Account

## 1. Endpoint Overview
This endpoint creates a new financial account for the authenticated user. It's a POST request that accepts a JSON payload with account details and returns the newly created account information with a 201 Created status code.

## 2. Request Details
- **HTTP Method**: POST
- **URL Structure**: `/rest/v1/accounts`
- **Parameters**: None
- **Request Body**:
  ```json
  {
    "name": "Savings Account",
    "account_type": "savings"
  }
  ```
  - **name** (required): The display name for the account
  - **account_type** (required): One of the predefined account types (checking, savings, credit_card, cash, investment)

## 3. Used Types
```typescript
// Existing types from src/types.ts
export type AccountType = Enums<'account_type_enum'>
// checking, savings, credit_card, cash, investment

export type AccountCreateCommand = Pick<
  TablesInsert<'accounts'>,
  'name' | 'account_type'
>

export type AccountDTO = Omit<
  Tables<'accounts'>,
  'user_id' | 'deleted_at'
>
```

## 4. Response Details
- **Success Status Code**: 201 Created
- **Response Body**:
  ```json
  {
    "id": "uuid",
    "name": "Savings Account", 
    "account_type": "savings",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
  ```
- **Error Status Codes**:
  - 400 Bad Request: Invalid input format
  - 401 Unauthorized: Missing or invalid authentication
  - 422 Unprocessable Entity: Validation errors (name is empty, invalid account type)

## 5. Data Flow
1. Client sends POST request with account creation payload
2. Supabase API validates the JWT token and extracts user ID
3. Input validation checks request body format and content
4. The account_service creates a new account record:
   - Adds user_id from authenticated session
   - Validates and sanitizes the input name
   - Validates the account_type against allowed enum values
   - Assigns default timestamps (created_at, updated_at)
5. The new account is inserted into the database
6. The response omits internal fields (user_id, deleted_at) and returns AccountDTO
7. Success response with 201 Created status code is sent

## 6. Security Considerations
- **Authentication**: JWT-based authentication via Supabase Auth
- **Authorization**: Row Level Security (RLS) policy on accounts table 
- **Input Validation**:
  - Sanitize name input to prevent XSS
  - Validate account_type against predefined enum values
  - Check for empty name (honors the CHECK constraint)
- **User Data Isolation**:
  - RLS policy ensures users only access their own accounts
  - user_id is set from authenticated session, never from client input
- **Sensitive Data Exposure**:
  - user_id is never exposed in API responses
  - Internal fields are omitted from the response

## 7. Error Handling
| Error Scenario | Status Code | Response |
|----------------|-------------|----------|
| Missing/Invalid authentication | 401 Unauthorized | `{"error": "Unauthorized"}` |
| Missing required fields | 400 Bad Request | `{"error": "Missing required fields: name, account_type"}` |
| Invalid account_type | 422 Unprocessable Entity | `{"error": "Invalid account_type. Must be one of: checking, savings, credit_card, cash, investment"}` |
| Empty account name | 422 Unprocessable Entity | `{"error": "Account name cannot be empty"}` |
| Database constraint violation | 422 Unprocessable Entity | `{"error": "Failed to create account due to constraint violation"}` |
| Server error | 500 Internal Server Error | `{"error": "An unexpected error occurred"}` |

## 8. Performance Considerations
- **Database Indexing**: The accounts table should have an index on user_id for efficient querying
- **Payload Size**: Keep response payload minimal by excluding unnecessary fields

## 9. Implementation Steps
1. Verify existing AccountCreateCommand and AccountDTO types match the requirements
2. Create a function in account_service.ts to handle account creation:
   ```typescript
   async function createAccount(
     user_id: string,
     accountData: AccountCreateCommand
   ): Promise<AccountDTO> {
     // Validate input
     // Create account
     // Return formatted response
   }
   ```
3. Add input validation for the request payload:
   - Validate required fields (name, account_type)
   - Validate account_type is a valid enum value
   - Validate name is not empty after trimming
4. Implement the API route handler to:
   - Extract user_id from authenticated session
   - Pass validated data to the account service
   - Handle errors and return appropriate status codes
   - Return the created account as AccountDTO with 201 status
5. Add appropriate error logging for failed account creation
6. Test the endpoint with various inputs:
   - Valid data
   - Missing fields
   - Invalid account types
   - Empty name
   - Unauthenticated requests
7. Implement RLS policy for accounts table if not already present:
   ```sql
   CREATE POLICY account_user_isolation ON accounts
     FOR ALL
     USING (auth.uid() = user_id);
   ```
8. Document the endpoint in API documentation