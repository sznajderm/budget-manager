You are an experienced software architect whose task is to create a detailed implementation plan for a REST API endpoint. Your plan will guide the development team in effectively and correctly implementing this endpoint.

Before we begin, review the following information:

1. Route API specification:
<route_api_specification>
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
</route_api_specification>

2. Related database resources:
<related_db_resources>
### transactions
Core transaction records with integer amounts in cents.

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount_cents money_cents NOT NULL,
    transaction_type transaction_type_enum NOT NULL,
    description TEXT NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT transactions_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
    CONSTRAINT transactions_user_owns_account CHECK (
        NOT EXISTS (
            SELECT 1 FROM accounts a 
            WHERE a.id = account_id AND a.user_id != transactions.user_id
        )
    ),
    CONSTRAINT transactions_user_owns_category CHECK (
        category_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM categories c 
            WHERE c.id = category_id AND c.user_id != transactions.user_id
        )
    )
);
```
</related_db_resources>

3. Type definitions:
<type_definitions>
file src/types.ts
</type_definitions>

3. Tech stack:
<tech_stack>
file .ai/tech-stack.md
</tech_stack>

4. Implementation rules:
<implementation_rules>
files: .cursor/rules/shared.mdc, .cursor/rules/backend.mdc, .cursor/rules/astro.mdc
</implementation_rules>

Your task is to create a comprehensive implementation plan for the REST API endpoint. Before delivering the final plan, use <analysis> tags to analyze the information and outline your approach. In this analysis, ensure that:

1. Summarize key points of the API specification.
2. List required and optional parameters from the API specification.
3. List necessary DTO types and Command Models.
4. Consider how to extract logic to a service (existing or new, if it doesn't exist).
5. Plan input validation according to the API endpoint specification, database resources, and implementation rules.
6. Determine how to log errors in the error table (if applicable).
7. Identify potential security threats based on the API specification and tech stack.
8. Outline potential error scenarios and corresponding status codes.

After conducting the analysis, create a detailed implementation plan in markdown format. The plan should contain the following sections:

1. Endpoint Overview
2. Request Details
3. Response Details
4. Data Flow
5. Security Considerations
6. Error Handling
7. Performance
8. Implementation Steps

Throughout the plan, ensure that you:
- Use correct API status codes:
  - 200 for successful read
  - 201 for successful creation
  - 400 for invalid input
  - 401 for unauthorized access
  - 404 for not found resources
  - 500 for server-side errors
- Adapt to the provided tech stack
- Follow the provided implementation rules

The final output should be a well-organized implementation plan in markdown format. Here's an example of what the output should look like:

``markdown
# API Endpoint Implementation Plan: [Endpoint Name]

## 1. Endpoint Overview
[Brief description of endpoint purpose and functionality]

## 2. Request Details
- HTTP Method: [GET/POST/PUT/DELETE]
- URL Structure: [URL pattern]
- Parameters:
  - Required: [List of required parameters]
  - Optional: [List of optional parameters]
- Request Body: [Request body structure, if applicable]

## 3. Used Types
[DTOs and Command Models necessary for implementation]

## 3. Response Details
[Expected response structure and status codes]

## 4. Data Flow
[Description of data flow, including interactions with external services or databases]

## 5. Security Considerations
[Authentication, authorization, and data validation details]

## 6. Error Handling
[List of potential errors and how to handle them]

## 7. Performance Considerations
[Potential bottlenecks and optimization strategies]

## 8. Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
...
```

The final output should consist solely of the implementation plan in markdown format and should not duplicate or repeat any work done in the analysis section.

Remember to save your implementation plan as .ai/endpoints/get-transactions-implementation-plan.md. Ensure the plan is detailed, clear, and provides comprehensive guidance for the development team.