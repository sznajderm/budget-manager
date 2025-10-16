<db-plan>
file .ai/db-plan.md
</db-plan>

<prd>
file .ai/prd.md
</prd>

<tech-stack>
file .ai/tech-stack.md
</tech-stack>

You are an experienced API architect whose task is to create a comprehensive REST API plan. Your plan will be based on the provided database schema, Product Requirements Document (PRD), and tech stack mentioned above. Carefully review the inputs and perform the following steps:

1. Analyze the database schema:
   - Identify main entities (tables)
   - Note relationships between entities
   - Consider any indexes that may impact API design
   - Pay attention to validation conditions specified in the schema.

2. Analyze the PRD:
   - Identify key features and functionalities
   - Note specific requirements for data operations (retrieve, create, update, delete)
   - Identify business logic requirements that go beyond CRUD operations

3. Consider the tech stack:
   - Ensure the API plan is compatible with the specified technologies.
   - Consider how these technologies may influence API design

4. Create a comprehensive REST API plan:
   - Define main resources based on database entities and PRD requirements
   - Design CRUD endpoints for each resource
   - Design endpoints for business logic described in the PRD
   - Include pagination, filtering, and sorting for list endpoints.
   - Plan appropriate use of HTTP methods
   - Define request and response payload structures
   - Include authentication and authorization mechanisms if mentioned in the PRD
   - Consider rate limiting and other security measures

Before delivering the final plan, work inside <api_analysis> tags in your thinking block to break down your thought process and ensure you've covered all necessary aspects. In this section:

1. List main entities from the database schema. Number each entity and quote the relevant part of the schema.
2. List key business logic features from the PRD. Number each feature and quote the relevant part of the PRD.
3. Map features from the PRD to potential API endpoints. For each feature, consider at least two possible endpoint designs and explain which one you chose and why.
4. Consider and list any security and performance requirements. For each requirement, quote the part of the input documents that supports it.
5. Explicitly map business logic from the PRD to API endpoints.
6. Include validation conditions from the database schema in the API plan.

This section may be quite long.

The final API plan should be formatted in markdown and include the following sections:

```markdown
# REST API Plan

## 1. Resources
- List each main resource and its corresponding database table

## 2. Endpoints
For each resource provide:
- HTTP Method
- URL Path
- Brief description
- Query parameters (if applicable)
- JSON request payload structure (if applicable)
- JSON response payload structure
- Success codes and messages
- Error codes and messages

## 3. Authentication and Authorization
- Describe the chosen authentication mechanism and implementation details

## 4. Validation and Business Logic
- List validation conditions for each resource
- Describe how business logic is implemented in the API
```

Ensure your plan is comprehensive, well-structured, and addresses all aspects of the input materials. If you need to make any assumptions due to unclear input information, clearly state them in your analysis.

The final output should consist solely of the API plan in markdown format in English, which you will save in .ai/api-plan.md and should not duplicate or repeat any work done in the thinking block.

------------------

AI:

Thanks for the detailed inputs. I’ve reviewed your database schema, PRD, and tech stack. Before I produce the refined task description and hand it off for planning, I have a few clarifying questions to remove ambiguities and ensure the API plan aligns with your intent:

Key confirmations and questions
1) API architecture over Supabase
•  Do you want:
  a) A thin custom REST API layer (e.g., Node/Edge Functions) that fronts Supabase (preferred for business logic, validation, and rate-limiting), or
  b) Rely primarily on Supabase’s auto-generated REST and use Postgres functions/RPC for custom endpoints?
•  If using a custom API, what runtime do you prefer (e.g., Supabase Edge Functions with Deno, or a Node server deployed to DO)? Any preference for framework (e.g., Fastify, Express, Hono)?

2) Authentication and sessions
•  Shall we use Supabase Auth with JWT-based auth in the API (Authorization: Bearer <token>) and rely on RLS for data isolation? Any session cookie requirement for the web app, or token-only flows?
•  Do you want refresh tokens and short-lived access tokens with rotation?

3) Accounts “delete” behavior
•  The DB uses soft delete (deleted_at). The PRD says “Delete account record” and it disappears from the list. Confirm that “delete” = soft delete.
•  Should we allow restoring soft-deleted accounts via an endpoint?

4) Categories deletion and reassignment
•  The DB enforces RESTRICT on deleting categories referenced by transactions. The PRD mentions deletion with reassignment or prompt.
•  Should the API implement a two-step flow:
  a) Request deletion with a required target_category_id to reassign all existing transactions, then delete the category
  b) Or deny delete if referenced, and instruct the client to reassign first via a separate bulk-reassign endpoint?

5) Transactions and currency handling
•  The schema uses integer cents and transaction_type enum. Should the API accept decimal currency in requests (e.g., amount: "123.45") and normalize to cents server-side, or require clients to send integer cents?
•  Any multi-currency or locale considerations, or is it single currency for MVP?

6) AI suggestions workflow
•  Trigger timing: On transaction create, should the API synchronously call OpenRouter for a suggestion and return the suggestion in the response, or create the transaction first and queue/async fetch suggestion, later retrievable via a GET?
•  Approvals: When user approves/rejects, do you want a dedicated endpoint that sets ai_suggestions.approved and updates transactions.category_id when approved?
•  PRD says “Final category stored with original confidence score.” Do you want the confidence duplicated in transactions, or is it sufficient to keep in ai_suggestions with an approved flag? If duplicated, where should it live in transactions?

7) Pagination, filtering, and sorting conventions
•  Pagination style preference: limit/offset vs. cursor-based?
•  Default page size and maximum page size?
•  Sorting defaults for lists (e.g., transactions by transaction_date desc)?
•  Filtering needs: by date range, account_id, category_id, type, search in description?

8) Response shapes and error format
•  Do you have a preferred error envelope (e.g., { error: { code, message, details } }) and success envelope (e.g., { data, meta })?
•  Do you want consistent metadata for list endpoints (total_count, next_cursor/offset, page_size)?

9) API versioning and base path
•  Base path and versioning preference, e.g., /api/v1?
•  Should the API plan define a deprecation policy?

10) Rate limiting and security
•  Do you want IP-based and/or user-based rate limiting (e.g., 100 req/min/user)?
•  Any requirement for audit logging, request/response logging, or PII redaction?
•  Any CORS constraints (domains)?

11) Naming alignment
•  The PRD sometimes calls transactions “records.” Confirm canonical naming as “transactions” in the API.
•  Category names are unique per user (case-insensitive). Should API strictly lowercase name on create/update or preserve casing and enforce uniqueness with LOWER(name)?

12) Dashboard summaries
•  The PRD requires total income vs. expenses. Should the API provide:
  a) A single summary endpoint with totals for a given date range and optional filters, or
  b) Separate endpoints (e.g., /summary/expenses, /summary/income)?
•  Do you also want category-wise summaries for potential future use?

13) Tech integrations
•  OpenRouter model preference and budget limits? Should the API abstract this behind a provider layer so model can be swapped?
•  Secrets management: Will environment variables be provided for OpenRouter keys in the deployment environment?

What I’ve gathered from your documents
•  DB constraints to reflect in validation:
◦  categories: unique (user_id, LOWER(name)), non-empty name
◦  accounts: non-empty name, soft delete via deleted_at
◦  transactions: non-empty description; user must own account and category; amount within money_cents domain (0 to 9,999,999 cents)
◦  ai_suggestions: confidence between 0 and 1; one suggestion per transaction
•  RLS is enabled and enforced via auth.uid(). API must pass user JWT to leverage RLS.
•  Indexes: multiple composite indexes favor queries by user_id, account_id, created_at, transaction_date. We can design list endpoints to utilize these.
•  PRD vs DB mismatch:
◦  PRD mentions “optional balance” on accounts; DB does not have balance column. For MVP, we can compute balances dynamically or add a view/endpoint for computed balances.
◦  PRD category deletion requires reassignment flow that must be implemented at API layer due to RESTRICT.
•  Tech stack: Supabase backend; Astro + React frontend; OpenRouter for AI.

Next step
Once you confirm the above points (especially #1–#6), I’ll produce the refined task description and pass it along to generate the final, comprehensive REST API plan, including resources, endpoints, payloads, auth, validation, business logic, and security.

-----------------------

1. The answer a) Rely primarily on Supabase’s auto-generated REST and use Postgres functions/RPC for custom endpoints
2. Yes, we should use Supabase Auth with JWT-based auth in the API (Authorization: Bearer <token>) and rely on RLS for data isolation. I don't have any requirements for session cookies.
   No, we don't need to refresh tokens very often. We can assume 1 hour expiration for tokens.
3. "delete" means "soft delete". We don't need 'restore' functionality for MVP.
4. After removing the category, we should only display to the user the information that categories should be assigned to specific transactions. So the category removal and category reassignment for transactions should be separate steps. So we should allow transactions.category_id to be null. The db-plan.md and other files need to be updated accordingly.
5. The API should reqire the amount in cents. Without normalization. For MVP we don't handle currencies.
6. The suggestion should be fetched asynchronously. The category assignment will be a separate step.
   There can be a separate endpoint for approvals/rejections
   It is sufficient to keep in ai_suggestions with an approved flag
7. We can use limit pagination for MVP
   Default page size: 20, maximum page size: 50
   Default sorting by transaction created_at DESC
   We don't need filtering at this moment. Treat this as an optional
8. No I don't have preferred error format
   Yes, please add metadata for endpoint response
9. Example versioning: /api/v1
   No, this is not required for MVP
10. We don't need any of those for MVP
11. I confirm that transactions are transactions. I use "records" for more broader naming of any database record
    Preserve casing for category names and enforce uniqueness with LOWER(name)
12. It would be better to get separate endpoints for incomes and expenses
    I don't need a summary for categories in MVP
13. Let's focus on OpenRouter integration for MVP. I don't have specified budget yet
    Yes, I'll provide env variables for OpenRouter in the future


--------------------

AI: 

Perfect! I've successfully created a comprehensive REST API plan for your BudgetManager application. The plan addresses all your requirements and clarifications:

Key Features Implemented

Architecture: Uses Supabase's auto-generated REST endpoints with custom Postgres RPC functions for complex business logic

Authentication: JWT-based auth with 1-hour expiration and RLS for data isolation

Category Deletion: Two-step process with transactions.category_id nullable - delete category first (nullifies transaction references), then users can reassign via separate endpoint

AI Suggestions: Async workflow with separate approval/rejection endpoints

Amounts: Integer cents (no normalization) with proper validation (0-99,999,999 cents)

Pagination: Limit/offset with 20 default, 50 maximum

Validation: All database constraints reflected in API validation rules

The plan includes:
•  Complete endpoint specifications with request/response payloads
•  Custom Postgres functions for complex operations
•  Proper error handling and status codes
•  Security through RLS and user ownership validation
•  Business logic implementation for all PRD requirements

The API plan is now saved at .ai/api-plan.md and ready for implementation!