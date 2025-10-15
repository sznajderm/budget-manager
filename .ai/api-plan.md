# REST API Plan

## 1. Resources

The API leverages Supabase's auto-generated REST endpoints with custom RPC functions for complex business logic:

- **accounts** → `accounts` table (user financial accounts)
- **categories** → `categories` table (transaction categories)  
- **transactions** → `transactions` table (expense/income records)
- **ai_suggestions** → `ai_suggestions` table (AI categorization suggestions)
- **auth** → Supabase Auth (user authentication)

## 2. Endpoints

### Authentication (Supabase Auth)

#### Sign Up
- **HTTP Method**: POST
- **URL Path**: `/auth/v1/signup`
- **Description**: Create new user account
- **Request Payload**: 
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response Payload**: 
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "session": {
    "access_token": "jwt_token",
    "expires_in": 3600
  }
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 422 Unprocessable Entity

#### Sign In
- **HTTP Method**: POST
- **URL Path**: `/auth/v1/token?grant_type=password`
- **Description**: Authenticate existing user
- **Request Payload**: 
```json
{
  "email": "user@example.com", 
  "password": "password123"
}
```
- **Response Payload**: Same as Sign Up
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized

### Accounts (Supabase REST)

#### List Accounts
- **HTTP Method**: GET
- **URL Path**: `/rest/v1/accounts?deleted_at=is.null&order=created_at.desc&limit=20&offset=0`
- **Description**: Get user's active accounts with pagination
- **Query Parameters**: 
  - `limit` (integer, default: 20, max: 50)
  - `offset` (integer, default: 0)
- **Response Payload**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Checking Account",
      "account_type": "checking",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total_count": 5,
    "limit": 20,
    "offset": 0
  }
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

#### Create Account
- **HTTP Method**: POST
- **URL Path**: `/rest/v1/accounts`
- **Description**: Create new financial account
- **Request Payload**:
```json
{
  "name": "Savings Account",
  "account_type": "savings"
}
```
- **Response Payload**:
```json
{
  "id": "uuid",
  "name": "Savings Account", 
  "account_type": "savings",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 422 Unprocessable Entity

#### Update Account
- **HTTP Method**: PATCH
- **URL Path**: `/rest/v1/accounts?id=eq.{account_id}`
- **Description**: Update account details
- **Request Payload**:
```json
{
  "name": "Updated Account Name"
}
```
- **Response Payload**: Same as Create Account
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### Delete Account (Soft Delete)
- **HTTP Method**: PATCH
- **URL Path**: `/rest/v1/accounts?id=eq.{account_id}`
- **Description**: Soft delete account by setting deleted_at timestamp
- **Request Payload**:
```json
{
  "deleted_at": "now()"
}
```
- **Response Payload**: Empty
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

### Categories (Supabase REST + Custom RPC)

#### List Categories
- **HTTP Method**: GET
- **URL Path**: `/rest/v1/categories?order=created_at.desc&limit=20&offset=0`
- **Description**: Get user's categories with pagination
- **Query Parameters**: 
  - `limit` (integer, default: 20, max: 50)
  - `offset` (integer, default: 0)
- **Response Payload**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Groceries",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total_count": 15,
    "limit": 20,
    "offset": 0
  }
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

#### Create Category
- **HTTP Method**: POST
- **URL Path**: `/rest/v1/categories`
- **Description**: Create new category
- **Request Payload**:
```json
{
  "name": "Entertainment"
}
```
- **Response Payload**:
```json
{
  "id": "uuid",
  "name": "Entertainment",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 409 Conflict (duplicate name)

#### Update Category
- **HTTP Method**: PATCH
- **URL Path**: `/rest/v1/categories?id=eq.{category_id}`
- **Description**: Update category name
- **Request Payload**:
```json
{
  "name": "Updated Category Name"
}
```
- **Response Payload**: Same as Create Category
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict

#### Delete Category
- **HTTP Method**: POST
- **URL Path**: `/rest/v1/rpc/delete_category`
- **Description**: Delete category (sets transactions.category_id to NULL for referenced transactions)
- **Request Payload**:
```json
{
  "category_id": "uuid"
}
```
- **Response Payload**:
```json
{
  "success": true,
  "affected_transactions": 5
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Bulk Reassign Category
- **HTTP Method**: POST
- **URL Path**: `/rest/v1/rpc/bulk_reassign_category`
- **Description**: Reassign transactions from one category to another
- **Request Payload**:
```json
{
  "from_category_id": "uuid",
  "to_category_id": "uuid"
}
```
- **Response Payload**:
```json
{
  "success": true,
  "updated_count": 3
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

### Transactions (Supabase REST + Custom RPC)

#### List Transactions
- **HTTP Method**: GET
- **URL Path**: `/rest/v1/transactions?select=*,accounts(name),categories(name)&order=created_at.desc&limit=20&offset=0`
- **Description**: Get user's transactions with related account and category names
- **Query Parameters**: 
  - `limit` (integer, default: 20, max: 50)
  - `offset` (integer, default: 0)
- **Response Payload**:
```json
{
  "data": [
    {
      "id": "uuid",
      "amount_cents": 1250,
      "transaction_type": "expense",
      "description": "Grocery shopping",
      "transaction_date": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "accounts": {
        "name": "Checking Account"
      },
      "categories": {
        "name": "Groceries"
      }
    }
  ],
  "meta": {
    "total_count": 100,
    "limit": 20,
    "offset": 0
  }
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

#### Create Transaction
- **HTTP Method**: POST
- **URL Path**: `/rest/v1/transactions`
- **Description**: Create new transaction
- **Request Payload**:
```json
{
  "amount_cents": 1250,
  "transaction_type": "expense",
  "description": "Coffee shop",
  "transaction_date": "2024-01-01T10:30:00.000Z",
  "account_id": "uuid",
  "category_id": "uuid"
}
```
- **Response Payload**:
```json
{
  "id": "uuid",
  "amount_cents": 1250,
  "transaction_type": "expense", 
  "description": "Coffee shop",
  "transaction_date": "2024-01-01T10:30:00.000Z",
  "account_id": "uuid",
  "category_id": "uuid",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 422 Unprocessable Entity

#### Update Transaction
- **HTTP Method**: PATCH
- **URL Path**: `/rest/v1/transactions?id=eq.{transaction_id}`
- **Description**: Update transaction details
- **Request Payload**:
```json
{
  "amount_cents": 1500,
  "description": "Updated description",
  "category_id": "uuid"
}
```
- **Response Payload**: Same as Create Transaction
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### Delete Transaction
- **HTTP Method**: DELETE
- **URL Path**: `/rest/v1/transactions?id=eq.{transaction_id}`
- **Description**: Permanently delete transaction
- **Response Payload**: Empty
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

### AI Suggestions (Supabase REST + Custom RPC)

#### Request AI Suggestion
- **HTTP Method**: POST
- **URL Path**: `/rest/v1/rpc/request_ai_suggestion`
- **Description**: Asynchronously request AI category suggestion for transaction
- **Request Payload**:
```json
{
  "transaction_id": "uuid"
}
```
- **Response Payload**:
```json
{
  "success": true,
  "message": "AI suggestion requested"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Get AI Suggestion
- **HTTP Method**: GET
- **URL Path**: `/rest/v1/ai_suggestions?transaction_id=eq.{transaction_id}&select=*,categories(name)`
- **Description**: Get AI suggestion for specific transaction
- **Response Payload**:
```json
{
  "id": "uuid",
  "transaction_id": "uuid",
  "suggested_category_id": "uuid",
  "confidence_score": 0.875,
  "approved": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "categories": {
    "name": "Groceries"
  }
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### Approve/Reject AI Suggestion
- **HTTP Method**: POST
- **URL Path**: `/rest/v1/rpc/handle_ai_suggestion`
- **Description**: Approve or reject AI suggestion and update transaction category
- **Request Payload**:
```json
{
  "suggestion_id": "uuid",
  "approved": true
}
```
- **Response Payload**:
```json
{
  "success": true,
  "transaction_updated": true
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

### Dashboard Summaries (Custom RPC)

#### Get Expense Summary
- **HTTP Method**: POST
- **URL Path**: `/rest/v1/rpc/get_expense_summary`
- **Description**: Get total expenses for user
- **Request Payload**:
```json
{
  "start_date": "2024-01-01T00:00:00.000Z",
  "end_date": "2024-01-31T23:59:59.000Z"
}
```
- **Response Payload**:
```json
{
  "total_cents": 125000,
  "transaction_count": 45,
  "period_start": "2024-01-01T00:00:00.000Z",
  "period_end": "2024-01-31T23:59:59.000Z"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

#### Get Income Summary
- **HTTP Method**: POST
- **URL Path**: `/rest/v1/rpc/get_income_summary`
- **Description**: Get total income for user
- **Request Payload**: Same as Get Expense Summary
- **Response Payload**: Same structure as Get Expense Summary
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

## 3. Authentication and Authorization

### Authentication Mechanism
- **Supabase JWT Authentication**: Users authenticate via Supabase Auth endpoints (`/auth/v1/signup`, `/auth/v1/token`)
- **Bearer Token**: All API requests require `Authorization: Bearer <jwt_token>` header
- **Token Expiration**: Access tokens expire after 1 hour
- **Base URL**: All Supabase endpoints use base URL format: `https://your-project.supabase.co`

### Authorization Implementation
- **Row Level Security (RLS)**: All data tables have RLS enabled with policies using `auth.uid()`
- **User Scoping**: All resources automatically filtered by authenticated user ID
- **Cross-User Protection**: CHECK constraints prevent accessing other users' data
- **Auto-Generated Policies**: 
  ```sql
  CREATE POLICY user_access ON table_name
  FOR ALL USING (auth.uid() = user_id);
  ```

## 4. Validation and Business Logic

### Validation Conditions

#### Accounts
- **name**: Non-empty string (trimmed length > 0)
- **account_type**: Must be one of: `checking`, `savings`, `credit_card`, `cash`, `investment`
- **Soft Delete**: Use `deleted_at` timestamp, preserve transaction history

#### Categories  
- **name**: Non-empty string (trimmed length > 0)
- **Uniqueness**: Case-insensitive unique per user using `UNIQUE (user_id, LOWER(name))`
- **Deletion**: Cannot delete if referenced by transactions; must use bulk reassignment first

#### Transactions
- **amount_cents**: Integer between 0 and 99,999,999 (represents $0.00 to $999,999.99)
- **transaction_type**: Must be `expense` or `income`
- **description**: Non-empty string (trimmed length > 0)
- **category_id**: Can be NULL (after category deletion)
- **User Ownership**: Must own referenced account and category

#### AI Suggestions
- **confidence_score**: Decimal between 0.000 and 1.000
- **approved**: NULL (pending), TRUE (approved), FALSE (rejected)
- **Uniqueness**: One suggestion per transaction

### Business Logic Implementation

#### Required Postgres Functions

```sql
-- Delete category and nullify transactions
CREATE OR REPLACE FUNCTION delete_category(category_id UUID)
RETURNS JSON AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Nullify category_id in transactions
    UPDATE transactions 
    SET category_id = NULL 
    WHERE category_id = delete_category.category_id 
    AND user_id = auth.uid();
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    -- Delete the category
    DELETE FROM categories 
    WHERE id = delete_category.category_id 
    AND user_id = auth.uid();
    
    RETURN json_build_object(
        'success', true,
        'affected_transactions', affected_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk reassign transactions to new category
CREATE OR REPLACE FUNCTION bulk_reassign_category(from_category_id UUID, to_category_id UUID)
RETURNS JSON AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE transactions 
    SET category_id = bulk_reassign_category.to_category_id
    WHERE category_id = bulk_reassign_category.from_category_id
    AND user_id = auth.uid();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'updated_count', updated_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle AI suggestion approval/rejection
CREATE OR REPLACE FUNCTION handle_ai_suggestion(suggestion_id UUID, approved BOOLEAN)
RETURNS JSON AS $$
DECLARE
    suggestion_record ai_suggestions%ROWTYPE;
    transaction_updated BOOLEAN := false;
BEGIN
    -- Get the suggestion
    SELECT * INTO suggestion_record 
    FROM ai_suggestions 
    WHERE id = handle_ai_suggestion.suggestion_id
    AND EXISTS (
        SELECT 1 FROM transactions t 
        WHERE t.id = ai_suggestions.transaction_id 
        AND t.user_id = auth.uid()
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Suggestion not found';
    END IF;
    
    -- Update suggestion approval status
    UPDATE ai_suggestions 
    SET approved = handle_ai_suggestion.approved
    WHERE id = handle_ai_suggestion.suggestion_id;
    
    -- If approved, update transaction category
    IF approved THEN
        UPDATE transactions 
        SET category_id = suggestion_record.suggested_category_id
        WHERE id = suggestion_record.transaction_id;
        transaction_updated := true;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'transaction_updated', transaction_updated
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get expense summary
CREATE OR REPLACE FUNCTION get_expense_summary(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS JSON AS $$
DECLARE
    total_cents BIGINT;
    transaction_count INTEGER;
BEGIN
    SELECT 
        COALESCE(SUM(amount_cents), 0),
        COUNT(*)
    INTO total_cents, transaction_count
    FROM transactions 
    WHERE user_id = auth.uid()
    AND transaction_type = 'expense'
    AND transaction_date >= start_date
    AND transaction_date <= end_date;
    
    RETURN json_build_object(
        'total_cents', total_cents,
        'transaction_count', transaction_count,
        'period_start', start_date,
        'period_end', end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get income summary  
CREATE OR REPLACE FUNCTION get_income_summary(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS JSON AS $$
DECLARE
    total_cents BIGINT;
    transaction_count INTEGER;
BEGIN
    SELECT 
        COALESCE(SUM(amount_cents), 0),
        COUNT(*)
    INTO total_cents, transaction_count
    FROM transactions 
    WHERE user_id = auth.uid()
    AND transaction_type = 'income'
    AND transaction_date >= start_date
    AND transaction_date <= end_date;
    
    RETURN json_build_object(
        'total_cents', total_cents,
        'transaction_count', transaction_count,
        'period_start', start_date,
        'period_end', end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Request AI suggestion (placeholder for async processing)
CREATE OR REPLACE FUNCTION request_ai_suggestion(transaction_id UUID)
RETURNS JSON AS $$
BEGIN
    -- Verify transaction ownership
    IF NOT EXISTS (
        SELECT 1 FROM transactions 
        WHERE id = request_ai_suggestion.transaction_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;
    
    -- In production, this would trigger an async job
    -- For now, return success message
    RETURN json_build_object(
        'success', true,
        'message', 'AI suggestion requested'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### AI Integration
- **OpenRouter Integration**: Async background jobs call OpenRouter API with transaction description
- **Model Selection**: Configurable via environment variables
- **Error Handling**: Failed AI requests logged but don't block transaction creation
- **Confidence Scoring**: Store raw confidence scores from AI model responses

#### Pagination Standards
- **Default Limit**: 20 records
- **Maximum Limit**: 50 records  
- **Offset-based**: Use `limit` and `offset` parameters
- **Metadata**: Include `total_count`, `limit`, `offset` in list responses