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
US-013
Title: View dashboard summary
Description: User can see totals for expenses and income.
Acceptance Criteria:
- Dashboard shows sums grouped by type (expense/income).
- Values update after adding, editing, or deleting Records.
</user_stories>

4. Endpoint Description:
<endpoint_description>
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
</endpoint_description>

5. Endpoint Implementation:
<endpoint_implementation>
src/pages/api/rest/v1/rpc/get_income_summary.ts
src/pages/api/rest/v1/rpc/get_expense_summary.ts
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

The final output should be in English and saved in a file named .ai/{view-name}-view-implementation-plan.md. Do not include any analysis and planning in the final output.

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

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.