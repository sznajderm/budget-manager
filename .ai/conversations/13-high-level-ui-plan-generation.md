You are a qualified frontend architect whose task is to create a comprehensive user interface architecture based on the Product Requirements Document (PRD), API plan, and planning session notes. Your goal is to design a user interface structure that effectively meets product requirements, is compatible with API capabilities, and incorporates insights from the planning session.

First, carefully review the following documents:

Product Requirements Document (PRD):
<prd>
file .ai/prd.md
</prd>

API Plan:
<api_plan>
file .ai/api-plan.md
</api_plan>

Session Notes:
<session_notes>
<conversation_summary>

<decisions>
Decisions

1. Architecture Pattern: Use Astro's multi-page architecture with React islands for interactive components rather than a single-page application approach.
2. MVP Scope - Pages: Focus on Dashboard and Transactions pages only. Exclude dedicated pages for Accounts and Categories management.
3. AI Suggestions: Skip AI suggestion workflow entirely for MVP.
4. Dashboard Date Range: Default to current month (one month) without auto-refresh functionality.
5. Transaction Filtering: Implement filters for transaction type (expense/income), account, category, date range, and description search. Use URL query parameters to maintain filter state. Include "Clear filters" button in a collapsible panel above the transaction list.
6. Category Management: No dedicated category management page in MVP.
7. Account Deletion: Skip account deletion pages and logic for MVP.
8. Validation Display: Use inline validation with Shadcn/ui Alert components. Display field-level errors below inputs and form-level errors in dismissible banners. Use Zod schemas for client-side validation.
9. Optimistic UI Updates: Implement optimistic updates for all CRUD operations using React Query or similar state management.
10. Navigation Structure: 
◦  Unauthenticated: Simple landing page with Sign In/Sign Up forms
◦  Authenticated: Persistent sidebar navigation with Dashboard and Transactions only (no Accounts/Categories links)
◦  User menu for profile and logout
◦  Focus on web version only, skip mobile considerations
11. Inline Account/Category Creation: Transaction form should use only pre-existing data. No inline creation of accounts or categories from transaction form.
12. Dashboard Structure: Display two summary cards (total expenses and total income for selected period), recent transactions section (last 10), and prominent "Add Transaction" button.
13. Transaction Editing: Use modal dialog for both creating and editing transactions with identical form layouts.
14. Date Range Independence: Keep date range selectors independent on Dashboard and Transactions pages, each storing filter state in URL parameters separately.
15. Bulk Operations: Skip bulk operations for MVP, focus on single-transaction CRUD only.
16. Empty States: Implement friendly empty states with illustrations and actionable CTAs for no transactions, no accounts, and no categories scenarios.
17. Pagination: Use numbered pagination with page size selector (20/50 items) matching API limits, showing total count and current range.
18. Amount Input: Users enter amounts as currency (e.g., 12.50) with automatic formatting, converted to cents for API calls. Display with proper currency formatting ($1,250.00). Validate max $999,999.99.
19. Transaction Type: Explicit field with radio buttons or segmented control ("Expense"/"Income"), not inferred from amount sign.
20. Authentication Flow: Single authentication page with tabs for "Sign In" and "Sign Up". Redirect to Dashboard after authentication. Protected pages redirect to login with return URL parameter.
21. User Onboarding: Sign Up action should automatically create one "basic account" and several predefined categories for newly created users.

</decisions>
<matched_recommendations>
Matched Recommendations

1. Multi-page Architecture with React Islands: Leverage Astro's strength for performance while maintaining interactivity through React components for forms, modals, transaction lists, and real-time updates.
2. Dashboard Layout: Two summary cards at top (expenses/income for selected period), recent transactions section below (last 10 with edit/delete actions), and prominent "Add Transaction" button.
3. Modal-based Transaction Forms: Use modal dialogs for creating and editing transactions to maintain context and prevent navigation disruption. Pre-fill values when editing with clear headers ("Add Transaction" vs "Edit Transaction").
4. Independent Date Filters: Dashboard and Transactions pages maintain separate date range states via URL parameters, both defaulting to current month.
5. Single-transaction Focus: Skip bulk operations to reduce UI complexity for MVP. Focus on robust single-transaction CRUD operations.
6. Educational Empty States: Implement friendly empty states with illustrations, clear messaging, and prominent CTAs for each scenario (no transactions, accounts, or categories).
7. Numbered Pagination: Use traditional numbered pagination with page size selector matching API limits (20/50), displaying total count and current range at top and bottom of lists.
8. Currency Input UX: Accept currency format input (12.50) with automatic formatting, convert to cents for API, display with proper currency symbols and formatting throughout UI.
9. Explicit Transaction Type: Use radio buttons or segmented control for "Expense"/"Income" selection rather than relying on amount sign notation.
10. Tabbed Authentication: Single auth page with Sign In/Sign Up tabs, simple centered layout, redirect to Dashboard on success, return URL support for protected route redirects.
11. Inline Validation with Zod: Implement consistent field-level validation below inputs using Shadcn/ui components, with dismissible banners for form-level errors. Use Zod schemas for type-safe validation matching API expectations.
12. Optimistic Updates with React Query: Implement immediate UI feedback for all CRUD operations, with automatic revert on API failure and error notifications.
13. Transaction List Filters: Collapsible filter panel with transaction type, account, category, date range, and description search. URL-based state persistence with visible "Clear filters" action.
14. Supabase Auth Integration: Use Astro middleware to protect authenticated routes, implement JWT bearer token authentication for all API calls.
15. Automated User Setup: Sign Up process creates initial "basic account" and predefined category set, ensuring users can immediately start adding transactions without setup friction.
</matched_recommendations>
<ui_architecture_planning_summary>
UI Architecture Planning Summary

Overview
The BudgetManager MVP will be built using Astro 5 with React 19 islands for interactivity, TypeScript 5, Tailwind 4, and Shadcn/ui components. The backend leverages Supabase (PostgreSQL + Auth + REST API) with OpenRouter.ai integration for future AI features. The MVP focuses on core transaction management functionality with a streamlined scope.

Key Views and Screens

1. Authentication Page (/auth or /login)
•  Single page with tabbed interface for Sign In and Sign Up
•  Centered, minimal branding layout
•  Sign Up automatically creates:
◦  One "basic account" for the user
◦  Predefined set of categories (15-20 standard categories)
•  Successful authentication redirects to Dashboard
•  Protected route redirects include return URL parameter

2. Dashboard Page (Home - / or /dashboard)
•  Top Section: Two summary cards displaying:
◦  Total Expenses for selected period
◦  Total Income for selected period
◦  Date range selector (default: current month) independent from Transactions page
•  Recent Transactions Section: 
◦  Display last 10 transactions
◦  Show: date, description, amount (formatted currency), category, account
◦  Quick actions: Edit and Delete buttons for each transaction
•  Primary CTA: Prominent "Add Transaction" button
•  Empty State: If no transactions exist, show illustration with "Add your first transaction" message and CTA

3. Transactions Page (/transactions)
•  Filter Panel (collapsible):
◦  Transaction type filter (Expense/Income/All)
◦  Account dropdown selector
◦  Category dropdown selector
◦  Date range picker (default: current month)
◦  Description search field
◦  "Clear filters" button (visible when filters active)
◦  Filter state persisted in URL query parameters
•  Transaction List:
◦  Display: date, description, amount (formatted currency), category name, account name
◦  Actions: Edit and Delete buttons per row
◦  Numbered pagination (top and bottom)
◦  Page size selector: 20 or 50 items (matching API limits)
◦  Total count display: "Showing 1-20 of 157 transactions"
•  Add Transaction: Prominent button above list

4. Transaction Modal (Create/Edit)
•  Reusable modal component for both create and edit operations
•  Form Fields:
◦  Amount: Currency input (e.g., "12.50") with $ prefix, step=0.01, max $999,999.99
◦  Transaction Type: Radio buttons or segmented control ("Expense" / "Income")
◦  Description: Text input (required, non-empty after trim)
◦  Date: Date picker (defaults to today for new transactions)
◦  Account: Dropdown selector (pre-existing accounts only)
◦  Category: Dropdown selector (pre-existing categories only)
•  Actions: Cancel and Save buttons
•  Header: "Add Transaction" for new, "Edit Transaction" for existing
•  Validation: Inline field-level errors below inputs, form-level errors in dismissible banner at top

Navigation Structure
•  Persistent Sidebar (authenticated users):
◦  Dashboard (home icon)
◦  Transactions (list icon)
◦  User menu: Profile, Logout
•  Route Protection: Astro middleware redirects unauthenticated users to /login with return URL
•  Web-only: No mobile-specific navigation or responsive bottom bars for MVP

API Integration Strategy

Authentication
•  Supabase Auth endpoints: /auth/v1/signup, /auth/v1/token
•  JWT bearer tokens in Authorization header
•  Token stored in client (localStorage/sessionStorage)
•  Automatic refresh on expiration (1 hour TTL)

Data Fetching
•  Transactions: GET /rest/v1/transactions?select=*,accounts(name),categories(name)
•  Dashboard Summary: 
◦  POST /rest/v1/rpc/get_expense_summary (start_date, end_date)
◦  POST /rest/v1/rpc/get_income_summary (start_date, end_date)

State Management
•  React Query (or similar) for:
◦  Caching API responses
◦  Optimistic UI updates
◦  Automatic background refetching
◦  Error handling and retry logic
•  Optimistic Updates Pattern:
a. Immediately update UI on user action
b. Send API request in background
c. On success: Keep optimistic update
d. On failure: Revert UI and show error notification

Data Transformation
•  Convert user input ($12.50) to cents (1250) before API calls
•  Convert API cents to currency format for display
•  Parse ISO date strings from API to JavaScript Date objects
•  Transform transaction_type enum to user-friendly labels

Responsiveness and Accessibility

Responsiveness (Web-focused)
•  Desktop-first approach (1024px+ primary target)
•  Tablet support (768px - 1023px) with adjusted sidebar and content layout
•  Minimum supported width: 768px
•  Collapsible filter panel on smaller screens
•  Responsive table/card view for transaction list on tablets

Accessibility
•  Semantic HTML5 structure
•  ARIA labels for interactive elements
•  Keyboard navigation support (Tab, Enter, Escape)
•  Focus visible states on all interactive elements
•  Error messages announced to screen readers
•  Sufficient color contrast (WCAG AA minimum)
•  Shadcn/ui components provide built-in accessibility

Security Considerations

Client-side
•  Supabase JWT authentication for all protected routes
•  No sensitive data in localStorage (only auth tokens)
•  XSS prevention through React's built-in escaping
•  CSRF protection via JWT bearer tokens (not cookies)

Validation
•  Client-side: Zod schemas matching API expectations
•  Field Validation:
◦  Amount: 0 < amount ≤ 999,999.99
◦  Description: Non-empty after trim
◦  Account/Category: Must reference existing user-owned resources
◦  Date: Valid date, not too far in past/future
•  API Relies on: Supabase Row Level Security (RLS) for user data isolation

Error Handling

Validation Errors
•  Inline field-level errors (red text, error icon, below input)
•  Form submission blocked until all fields valid
•  Clear, actionable error messages

API Errors
•  Network Failures: Dismissible banner "Unable to connect. Please check your internet connection."
•  Authentication Failures: Redirect to login with error message
•  Not Found (404): "Transaction not found" notification, remove from list
•  Server Errors (5xx): Generic "Something went wrong. Please try again." with retry option
•  Optimistic Update Failures: Revert UI, show specific error notification

Empty States
•  No transactions: Illustration + "Add your first transaction" CTA
•  No accounts available: Should not occur (created on signup), but show error message if happens
•  No categories available: Should not occur (created on signup), but show error message if happens

Component Architecture

Astro Pages (Server-rendered)
•  /src/pages/auth.astro - Authentication page
•  /src/pages/index.astro or /src/pages/dashboard.astro - Dashboard
•  /src/pages/transactions.astro - Transactions list
•  Layout components for authenticated/unauthenticated states

React Islands (Client-interactive)
•  TransactionModal.tsx - Create/edit transaction form
•  TransactionList.tsx - Filterable, paginated transaction list
•  DashboardSummary.tsx - Summary cards with date range selector
•  RecentTransactions.tsx - Recent transactions widget
•  DateRangeSelector.tsx - Reusable date range picker
•  FilterPanel.tsx - Collapsible transaction filters
•  Pagination.tsx - Reusable numbered pagination component

Shared Components (Shadcn/ui)
•  Button, Input, Select, Modal (Dialog), Alert
•  Form components with validation support
•  DatePicker, RadioGroup, Card

Performance Considerations
•  Astro's partial hydration minimizes JavaScript bundle
•  React components hydrate only when needed
•  Pagination prevents loading excessive data
•  Optimistic updates provide instant feedback
•  Query caching reduces redundant API calls

</ui_architecture_planning_summary>

<unresolved_issues>
Unresolved Issues

1. Predefined Categories: The exact list of 15-20 predefined categories to be created on user signup needs to be defined (e.g., Groceries, Transportation, Entertainment, Salary, etc.).
    Predefined categories: Salary, Rent, Utilities, Groceries, Transportation, Healthcare, Debt Payments, Savings, Investments, Entertainment, Personal Care, Dining Out, Education, Insurance, Charity, Clothing
2. Basic Account Configuration: Specification for the "basic account" created on signup:
◦  Account name (e.g., "Main Account", "Default Account") -> This should be "Main Account"
◦  Account type (checking, savings, cash, etc.) -> Account type: "Checking"
◦  Should it have an initial balance? -> Inital balance: 0
3. Date Range Selector UI: Specific implementation details:
◦  Should it be a dropdown with preset options (This Month, Last Month, etc.) with custom range option?
◦  Or a direct date range picker? -> Direct date range picker
◦  Format for date display (MM/DD/YYYY vs DD/MM/YYYY)? -> Format date: DD/MM/YYYY
4. Profile Management: User menu includes "Profile" but scope is unclear:
◦  What profile information can users view/edit? -> password. Email should be unchangeable
◦  Is this a placeholder for future features or should it include basic info (email, password change)? -> only basic info
5. Delete Confirmation Pattern: While account deletion is skipped for MVP, transaction deletion requires confirmation (per PRD). Specific implementation:
◦  Modal dialog vs inline confirmation? -> Modal dialog confirmation
◦  Undo functionality vs permanent deletion? -> This should be permament deletion
6. Currency Symbol: Application appears to use USD ($) based on examples. Should this be:
◦  Hardcoded to USD for MVP? -> Yes, this can be hardcoded USD for MVP
◦  Configurable per user?
◦  Detected from browser locale?
7. Transaction Date/Time Handling: API uses timestamptz but PRD mentions "date":
◦  Should users specify time of transaction or only date? -> Users should specify time of transaction, not only date
◦  Default time if only date provided (midnight, current time)? -> default should be the current time
◦  Display format in transaction list (date only vs date+time)? -> display date+time
8. Loading States: While optimistic updates are specified, initial page load states need clarification:
◦  Skeleton screens vs spinners? -> TBD (to be decided)
◦  Full-page loading vs component-level? -> TBD
9. Logout Behavior: After logout:
◦  Redirect to landing page or login page? -> login page
◦  Clear all cached data? -> yes
◦  Show logout confirmation? -> no
10. Filter Persistence: Filters use URL parameters, but should they also:
◦  Persist across sessions (localStorage)? -> TBD
◦  Reset when navigating between Dashboard and Transactions? -> TBD
◦  Have a "Save as default" option? -> TBD
</unresolved_issues>
</conversation_summary>
</session_notes>

Your task is to create a detailed user interface architecture that includes necessary views, user journey mapping, navigation structure, and key elements for each view. The design should consider user experience, accessibility, and security.

Execute the following steps to complete the task:

1. Thoroughly analyze the PRD, API plan, and session notes.
2. Extract and list key requirements from the PRD.
3. Identify and list main API endpoints and their purposes.
4. Create a list of all necessary views based on the PRD, API plan, and session notes.
5. Determine the main purpose and key information for each view.
6. Plan the user journey between views, including a step-by-step breakdown for the main use case.
7. Design the navigation structure.
8. Propose key user interface elements for each view, considering UX, accessibility, and security.
9. Consider potential edge cases or error states.
10. Ensure the user interface architecture is compatible with the API plan.
11. Review and map all user stories from the PRD to the user interface architecture.
12. Explicitly map requirements to user interface elements.
13. Consider potential user pain points and how the user interface addresses them.

For each main step, work inside <ui_architecture_planning> tags in your thinking block to break down your thought process before moving to the next step. This section can be quite long. It's okay that this section can be quite long.

Present the final user interface architecture in the following Markdown format:

```markdown
# UI Architecture for [Product Name]

## 1. UI Structure Overview

[Provide a general overview of the UI structure]

## 2. View List

[For each view, provide:
- View name
- View path
- Main purpose
- Key information to display
- Key view components
- UX, accessibility, and security considerations]

## 3. User Journey Map

[Describe the flow between views and key user interactions]

## 4. Layout and Navigation Structure

[Explain how users will navigate between views]

## 5. Key Components

[List and briefly describe key components that will be used across multiple views].
```

Focus exclusively on user interface architecture, user journey, navigation, and key elements for each view. Do not include implementation details, specific visual design, or code examples unless they are crucial to understanding the architecture.

The final result should consist solely of the UI architecture in Markdown format in English, which you will save in the .ai/ui-plan.md file. Do not duplicate or repeat any work done in the thinking block.
