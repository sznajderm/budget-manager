As a senior frontend developer, your task is to create a detailed implementation plan for a new view in a web application. This plan should be comprehensive and clear enough for another frontend developer to implement the view correctly and efficiently.

First, review the following information:

1. Product Requirements Document (PRD):
<prd>
file .ai/prd.md
</prd>

2. View Description:
<view_description>
file .ai/ui-plan.md
</view_description>

3. User Stories:
<user_stories>
US-006
Title: Add transaction
Description: User can create a new expense or income record.
Acceptance Criteria:
- Form captures amount, date, description, account selection.
- Upon submission, AI suggestion displayed with confidence.
- Record saved with provisional category.

US-009
Title: Edit transaction
Description: User can update an existing Record.
Acceptance Criteria:
- Edit form pre-filled with existing values.
- Changes saved and reflected in dashboard.

US-010
Title: Delete transaction
Description: User can remove a Record.
Acceptance Criteria:
- Confirmation requested before deletion.
- Deleted Record removed from list.

US-014
Title: View transaction list
Description: User can browse recent transactions.
Acceptance Criteria:
- List displays date, description, amount, category, and actions (edit/delete).
- Pagination or infinite scroll for long lists.
</user_stories>

4. Endpoint Description:
<endpoint_description>
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
</endpoint_description>

5. Endpoint Implementation:
<endpoint_implementation>
src/pages/api/rest/v1/transactions/index.ts
</endpoint_implementation>

6. Type Definitions:
<type_definitions>
file src/types.ts
</type_definitions>

7. Tech Stack:
<tech_stack>
file .ai/tech-stack.md
</tech_stack>

Before creating the final implementation plan, conduct analysis and planning inside <implementation_breakdown> tags in your thinking block. This section can be quite long, as it's important to be thorough.

In your implementation breakdown, execute the following steps:
1. For each input section (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):
  - Summarize key points
 - List any requirements or constraints
 - Note any potential challenges or important issues
2. Extract and list key requirements from the PRD
3. List all needed main components, along with a brief description of their purpose, needed types, handled events, and validation conditions
4. Create a high-level component tree diagram
5. Identify required DTOs and custom ViewModel types for each view component. Explain these new types in detail, breaking down their fields and associated types.
6. Identify potential state variables and custom hooks, explaining their purpose and how they'll be used
7. List required API calls and corresponding frontend actions
8. Map each user story to specific implementation details, components, or functions
9. List user interactions and their expected outcomes
10. List conditions required by the API and how to verify them at the component level
11. Identify potential error scenarios and suggest how to handle them
12. List potential challenges related to implementing this view and suggest possible solutions

After conducting the analysis, provide an implementation plan in Markdown format with the following sections:

1. Overview: Brief summary of the view and its purpose.
2. View Routing: Specify the path where the view should be accessible.
3. Component Structure: Outline of main components and their hierarchy.
4. Component Details: For each component, describe:
 - Component description, its purpose and what it consists of
 - Main HTML elements and child components that build the component
 - Handled events
 - Validation conditions (detailed conditions, according to API)
 - Types (DTO and ViewModel) required by the component
 - Props that the component accepts from parent (component interface)
5. Types: Detailed description of types required for view implementation, including exact breakdown of any new types or view models by fields and types.
6. State Management: Detailed description of how state is managed in the view, specifying whether a custom hook is required.
7. API Integration: Explanation of how to integrate with the provided endpoint. Precisely indicate request and response types.
8. User Interactions: Detailed description of user interactions and how to handle them.
9. Conditions and Validation: Describe what conditions are verified by the interface, which components they concern, and how they affect the interface state
10. Error Handling: Description of how to handle potential errors or edge cases.
11. Implementation Steps: Step-by-step guide for implementing the view.

Ensure your plan is consistent with the PRD, user stories, and includes the provided tech stack.

The final output should be in English and saved in a file named .ai/views/{view-name}-view-implementation-plan.md. Do not include any analysis and planning in the final output.

Here's an example of what the output file should look like (content is to be replaced):

```markdown
# View Implementation Plan [View Name]

## 1. Overview
[Brief description of the view and its purpose]

## 2. View Routing
[Path where the view should be accessible]

## 3. Component Structure
[Outline of main components and their hierarchy]

## 4. Component Details
### [Component Name 1]
- Component description [description]
- Main elements: [description]
- Handled interactions: [list]
- Handled validation: [list, detailed]
- Types: [list]
- Props: [list]

### [Component Name 2]
[...]

## 5. Types
[Detailed description of required types]

## 6. State Management
[Description of state management in the view]

## 7. API Integration
[Explanation of integration with provided endpoint, indication of request and response types]

## 8. User Interactions
[Detailed description of user interactions]

## 9. Conditions and Validation
[Detailed description of conditions and their validation]

## 10. Error Handling
[Description of handling potential errors]

## 11. Implementation Steps
1. [Step 1]
2. [Step 2]
3. [...]
```

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/views/{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.

---
AI:

Before I generate the implementation plan, I need to clarify a few points where the PRD, UI plan, and current API/DB constraints diverge. This will ensure the plan is consistent, implementable, and aligned with your intent.

Key confirmations and questions

1) View scope and name
•  Confirm the view to implement is the Transactions view (route: /transactions), featuring:
◦  A paginated transaction list (20/50 per page) with total count
◦  Row actions (Edit/Delete)
◦  An Add Transaction button that opens a modal for create
•  Output file name proposal: .ai/views/transactions-view-implementation-plan.md (note: your instructions mention two paths; I will use this one unless you prefer .ai/transactions-view-implementation-plan.md)

2) Pagination vs infinite scroll
•  The user story allows “Pagination or infinite scroll.” The UI plan leans toward numbered pagination (20/50) and the current backend supports limit/offset but no cursor-style API.
•  Confirm: Use numbered pagination with page size selector (20/50), and top/bottom pagination controls?

3) Filters scope for this iteration
•  The UI plan includes a filter panel (type, account, category, date range, description) with URL syncing. However, the current GET /rest/v1/transactions implementation (and service) supports only limit and offset, not filtering.
•  Confirm: For this iteration, omit filters and focus on simple pagination with order by created_at.desc, as per backend today?

4) Transaction create: category handling and AI suggestion
•  DB schema enforces category_id NOT NULL on transactions. The service schema currently allows category_id to be nullable, but inserts will fail if category_id is actually null. Therefore, the UI should require a category at creation time or preselect a default category.
•  Confirm:
◦  Should we preselect a default category (e.g., “Uncategorized”) if it exists, and still allow the user to change it?
◦  Do you have an “Uncategorized” category seeded after Sign Up? If not, I will make “category” a required field in the form and not assume a default.
•  AI suggestion on submission (US-006): The PRD requires “AI suggestion displayed with confidence upon submission,” but there are no AI endpoints implemented yet. Types for AISuggestion exist.
•  Confirm:
◦  For now, should we implement the UI placeholder and event flow for showing an AI suggestion (e.g., toast/inline panel with suggested category name and confidence) after create, guarded behind a feature flag and using a mocked/stubbed result until the backend endpoint is available?
◦  Or omit AI suggestion display for now and defer it formally?

5) Edit transaction scope
•  The current PATCH schema allows updating only amount_cents, description, and category_id. It does not support editing transaction_type, transaction_date, or account_id.
•  Confirm: Limit the Edit modal to amount, description, and category only (no editing of type/date/account)?

6) Amount and date format rules
•  The UI plan sets:
◦  Currency: USD. Entry in dollars with conversion to cents.
◦  Max amount: $999,999.99 (aligned with DB money_cents domain).
◦  Date/time: DD/MM/YYYY HH:mm input; API requires ISO 8601 string (UTC or local with timezone?). Current service expects ISO 8601 strings.
•  Confirm:
◦  Use DD/MM/YYYY HH:mm for input and convert to ISO before API. Should we standardize to UTC in the payload?
◦  Display amounts formatted as USD with sign and coloring (red for expense, green for income)?

7) Accounts/categories source
•  We will GET /rest/v1/accounts and /rest/v1/categories to populate selectors. Is there any desired ordering (e.g., by created_at desc or alphabetically)?

8) Error and unauthorized handling
•  I’ll follow your existing client convention:
◦  Parse API 422 errors and show inline messages from backend Zod errors.
◦  Handle 401 by redirecting to /login (consistent with src/lib/api.ts).
•  Confirm: OK to reuse this pattern in the Transactions view hooks?

9) Accessibility and components
•  I’ll assume Tailwind + shadcn/ui components, with focus management, keyboard navigation, aria-live for error banners, and React Query for data operations.
•  Confirm: OK to proceed with shadcn/ui primitives (Dialog, Table, Select, Button, Input, etc.) and Zod for form validation?

10) Final deliverable path and name
•  Confirm: .ai/views/transactions-view-implementation-plan.md

Once you confirm the above (especially items 2–5), I’ll proceed to produce the complete implementation plan that:
•  Adheres to the current backend constraints
•  Details components, hooks, DTOs/ViewModels, validation, API integration, and error handling
•  Maps user stories US-006, US-009, US-010, US-014
•  Notes any deferred items (filters, AI suggestion live integration) and provides a clear forward path

If you prefer, I can assume reasonable defaults now and proceed without waiting:
•  Use numbered pagination (20/50), no filters this iteration
•  Require category selection (preselect “Uncategorized” if present)
•  Defer AI suggestion to a placeholder UI with feature flag
•  Edit modal limited to amount, description, category
•  Use UTC ISO strings for transaction_date
•  Order accounts/categories alphabetically by name
•  Save plan to .ai/views/transactions-view-implementation-plan.md

Let me know your preferences.

---

1. The view to implement is the Transactions view (route: /transactions), featuring:
◦  A paginated transaction list (20/50 per page) with total count
◦  Row actions (Edit/Delete)
◦  An Add Transaction button that opens a modal for create
Save file in .ai/views/transactions-view-implementation-plan.md
2. There should be numbered pagination and top/bottom pagination controls
3. For this iteration, omit filters and focus on simple pagination with order by created_at.desc
4. The category_id should be nullable. This shouldn't cause any errors
The category can be preselected as "Uncategorized". Currently, this category doesn't exist, so it needs to be added
At this moment we don't implement AI suggestion. Omit this requirement
5. The PATCH should be expaned by transaction_type, transaction_date, or account_id fields. All those fields should be editable from modal
6. No the standarization for datetime to UTC should be on the backend. If isn't present, it should be added
Yes, add different colors for income and expenses
7. They can be ordered alphabetically
8. Yes, this can be reused
9. Yes, this is OK
10. Yes, I confirm the path
