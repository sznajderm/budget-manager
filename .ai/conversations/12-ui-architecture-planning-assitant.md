You are an AI assistant whose task is to help plan the user interface architecture for an MVP (Minimum Viable Product) based on the provided information. Your goal is to generate a list of questions and recommendations that will be used in subsequent prompting to create a detailed UI architecture, user journey maps, and navigation structure.

Please carefully review the following information:

<product_requirements>
file .ai/prd.md
</product_requirements>

<tech_stack>
file .ai/tech-stack.md
</tech_stack>

<api_plan>
file .ai/api-plan.md
</api_plan>

Analyze the provided information, focusing on aspects relevant to user interface design. Consider the following issues:

1. Identify key views and screens based on product requirements and available API endpoints.
2. Determine potential user flows and navigation between views, taking into account API capabilities.
3. Consider UI components and interaction patterns that may be necessary for effective API communication.
4. Think about interface responsiveness and accessibility.
5. Assess security and authentication requirements in the context of API integration.
6. Consider any specific UI libraries or frameworks that might be beneficial for the project.
7. Analyze how the API structure impacts UI design and data flows in the application.

Based on your analysis, generate a list of 10 questions and recommendations in a combined form (question + recommendation). These should address any ambiguities, potential issues, or areas where more information is needed to create an effective UI architecture. Consider questions regarding:

1. View hierarchy and organization in relation to API structure
2. User flows and navigation supported by available endpoints
3. Responsiveness and adaptation to different devices
4. Accessibility and inclusiveness
5. Security and authorization at the UI level in connection with API mechanisms
6. Design consistency and user experience
7. Application state management strategy and synchronization with API
8. Handling error states and exceptions returned by API
9. Caching strategies and performance optimization in API communication

The output should have the following structure:

<questions>
List your questions and recommendations here, numbered for clarity:

For example:
1. Should the post card component display the author's name?

Recommendation: Yes, the post card component should display the author's name.
</questions>

Remember that your goal is to provide a comprehensive list of questions and recommendations that will help create a solid UI architecture for the MVP, fully integrated with available API endpoints. Focus on clarity, relevance, and accuracy of your outputs. Do not include any additional comments or explanations beyond the specified output format.

Continue this process, generating new questions and recommendations based on the provided context and user responses, until the user explicitly requests a summary.

Remember to focus on clarity, relevance, and accuracy of outputs. Do not include any additional comments or explanations beyond the specified output format.


---
AI:

Based on my analysis of the PRD, tech stack (Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + Shadcn/ui with Supabase backend), and API plan, here are the questions and recommendations:

<questions>
1. Should the application use a single-page application (SPA) approach or leverage Astro's multi-page architecture with islands of interactivity?

Recommendation: Use Astro's multi-page architecture with React islands for interactive components. This approach will provide better performance and SEO while maintaining interactivity where needed (forms, modals, real-time updates). Core pages (dashboard, accounts, transactions) should be separate Astro pages, with React components for forms, transaction lists, and AI suggestion interfaces.

2. How should the application handle the AI suggestion workflow UI - should it be inline within the transaction creation form, a separate step, or a post-creation action?

Recommendation: Implement a two-step workflow: (1) Transaction creation with immediate save, (2) Display AI suggestion immediately after with approve/reject/modify actions. Show a loading state while the AI processes the suggestion. This approach provides quick transaction entry while leveraging AI without blocking the user.

3. Should the dashboard summary cards display real-time data or use periodic refresh, and what date range should be the default?

Recommendation: Default to current month summary with dropdown to select different periods (This Month, Last Month, Last 3 Months, Custom Range). Use optimistic UI updates after transaction changes and implement automatic refresh every 30 seconds when the page is active. Include clear timestamp of last update.

4. How should the transaction list handle filtering and searching capabilities beyond basic pagination?

Recommendation: Implement filters for: transaction type (expense/income), account, category, date range, and a search field for descriptions. Use URL query parameters to maintain filter state across navigation. Add a "Clear filters" button when any filter is active. Position filters in a collapsible panel above the transaction list.

5. Should category management be a dedicated page or integrated into the transaction flow via modals/dropdowns?

Recommendation: Provide both approaches - a dedicated Categories page for bulk management (create, edit, delete, view all) and quick "Add Category" action within transaction forms via a dropdown with "+ New Category" option. This balances power users who need bulk operations with casual users who want quick access.

6. How should the application handle the AI suggestion confidence score visualization?

Recommendation: Display confidence score as a percentage with color coding: Green (>75%), Yellow (50-75%), Red (<50%). Use a progress bar or badge next to the suggested category. Include tooltip explaining what confidence means. For low confidence suggestions, emphasize the ability to modify or reject.

7. Should account deletion confirmation display the number of associated transactions and offer bulk reassignment?

Recommendation: Yes. Before account deletion, show a confirmation modal displaying: (1) Number of transactions associated with the account, (2) Warning that transactions will lose account reference, (3) Option to reassign all transactions to another account before deletion, (4) Final confirmation checkbox with explicit text about consequences.

8. How should validation errors be displayed across the application?

Recommendation: Use consistent inline validation with Shadcn/ui Alert components. Display field-level errors immediately below the input field in red text with an error icon. For form-level errors (API failures, network issues), show a dismissible banner at the top of the form. Use Zod schemas for client-side validation to match server-side expectations.

9. Should the application implement optimistic UI updates for create/update/delete operations?

Recommendation: Yes. Implement optimistic updates for all CRUD operations using React Query or similar state management. Show immediate UI feedback, then revert if the API call fails with error notification. This is crucial for good UX given the async nature of the Supabase REST API and AI suggestion processing.

10. How should the navigation structure be organized between authenticated and unauthenticated states?

Recommendation: Unauthenticated: Simple landing page with Sign In/Sign Up forms (can be tabs or separate pages). Authenticated: Persistent sidebar navigation with: Dashboard (home), Transactions, Accounts, Categories, and User menu (profile, logout). Mobile: Bottom navigation bar for primary sections with hamburger menu for secondary options. Use Astro middleware to protect authenticated routes.
</questions>

---

1. I agree with recommendation. At this moment provide only page for transactions. Don't provide page for the accounts and categories.
2. At this moment skip the AI suggestion workflow. 
3. The default date range should be one month. We don't need any auto refreshing for MVP
4. I agree with recommendation
5. Let's skip adding category management page at this moment
6. Let's skip AI suggestion management at this moment. 
7. Let's skip account deletion pages and logic at this moment
8. I agree with recommendation
9. I agree with recommendation
10. I agree with recommendation. But let's skip Accounts, Categories for now. Let's focus on the web version, without Mobile.

---
AI:

Thank you for your feedback! Let me generate the next set of questions and recommendations based on your scoped-down MVP requirements, focusing on Dashboard and Transactions pages only, without AI suggestions, account/category management pages, or mobile considerations.

<questions>
1. Should the transaction form allow creating accounts and categories inline (via "+ New Account" / "+ New Category" dropdown options) or require pre-existing data?

Recommendation: Allow inline creation for both accounts and categories within the transaction form. When selecting an account or category, provide a "+ New Account" / "+ New Category" option that opens a modal with a simple form (name field for category, name + type for account). This enables quick transaction entry without navigating away, essential for MVP usability.

2. How should the Dashboard page be structured - should it show only summary cards or also include a preview of recent transactions?

Recommendation: Dashboard should display: (1) Two summary cards at the top showing total expenses and total income for the selected period, (2) A "Recent Transactions" section below showing the last 10 transactions with quick actions (edit/delete), (3) A prominent "Add Transaction" button. This provides at-a-glance financial status while offering immediate access to detailed data.

3. Should transaction editing happen inline within the transaction list, in a modal, or on a separate page?

Recommendation: Use a modal dialog for both creating and editing transactions. This maintains context and prevents navigation disruption. The modal should be identical for create/edit, pre-filled with existing values when editing. Include a clear header ("Add Transaction" vs "Edit Transaction") and Cancel/Save buttons.

4. How should the date range selector work on both Dashboard and Transactions pages - should they be synchronized or independent?

Recommendation: Keep them independent but with the same default (current month). Dashboard focuses on summary analytics with date filtering, while Transactions page has more granular filters. Store each page's filter state in URL parameters separately. This allows users to view different periods simultaneously in different contexts.

5. Should the transaction list support bulk operations (select multiple transactions for bulk delete/category reassignment)?

Recommendation: Skip bulk operations for MVP. Focus on single-transaction CRUD operations. Bulk operations add significant UI complexity (checkboxes, selection state, bulk action bar) that isn't critical for initial launch. Can be added in future iterations based on user feedback.

6. How should the application handle empty states (no transactions, no accounts, no categories)?

Recommendation: Implement friendly empty states for each scenario: (1) No transactions: Show illustration with "Add your first transaction" message and prominent CTA button, (2) No accounts when creating transaction: Show inline message "Create your first account to continue" with inline form, (3) No categories: Similar inline creation flow. Empty states should be educational and actionable.

7. Should pagination be implemented as numbered pages, "Load More" button, or infinite scroll for the transaction list?

Recommendation: Use numbered pagination with page size selector (20/50 items per page) matching API limits. Display pagination controls at both top and bottom of the transaction list. Show total count and current range (e.g., "Showing 1-20 of 157 transactions"). This provides clear navigation and predictable behavior for financial data.

8. How should the transaction amount input work - should users enter full currency amounts (e.g., "12.50") or cents, and how should currency formatting be displayed?

Recommendation: Users should enter amounts as currency (12.50) with automatic formatting. Convert to cents for API calls. Display all amounts in transaction list and summaries with proper currency formatting ($1,250.00). Use a number input with step="0.01" and include currency symbol prefix. Validate max amount of $999,999.99 matching API constraints.

9. Should the transaction type (expense/income) be a separate field or inferred from the amount sign (negative/positive)?

Recommendation: Make transaction type an explicit field with radio buttons or segmented control ("Expense" / "Income") in the transaction form. This is more intuitive than requiring users to add negative signs and prevents input errors. Always store amounts as positive cents in the database with separate transaction_type field as defined in the API.

10. How should the authentication flow be structured - separate pages for sign in/sign up, or tabs on a single page?

Recommendation: Create a single authentication page (/auth or /login) with tabs switching between "Sign In" and "Sign Up" forms. After successful authentication, redirect to Dashboard. For unauthenticated users trying to access protected pages, redirect to /login with a return URL parameter to redirect back after authentication. Keep the auth page simple and centered with minimal branding.
</questions>

---

1. The transaction form should use only pre-existing data. 
2. I agree with recommendation.
3. I agree with recommendation.
4. I agree with recommendation.
5. I agree with recommendation.
6. I agree with recommendation.
7. I agree with recommendation.
8. I agree with recommendation.
9. I agree with recommendation.
10. I agree with recommendation. Because I decided to skip account and category creation at this moment, the Sign Up action should create one `basic account` and a few predefined categories for the newly created User.

---

You are an AI assistant whose task is to summarize the conversation about UI architecture planning for MVP and prepare a concise summary for the next stage of development. In the conversation history you will find the following information:
1. Product Requirements Document (PRD)
2. Tech stack information
3. API plan
4. Conversation history containing questions and answers
5. UI architecture recommendations

Your task is to:
1. Summarize the conversation history, focusing on all decisions related to UI architecture planning.
2. Match the model's recommendations to the answers given in the conversation history. Identify which recommendations are relevant based on the discussion.
3. Prepare a detailed conversation summary that includes:
   a. Main UI architecture requirements
   b. Key views, screens, and user flows
   c. API integration and state management strategy
   d. Responsiveness, accessibility, and security considerations
   e. Any unresolved issues or areas requiring further clarification
4. Format the results in the following way:

<conversation_summary>
<decisions>
[List decisions made by the user, numbered].
</decisions>
<matched_recommendations>
[List of the most relevant recommendations matched to the conversation, numbered]
</matched_recommendations>
<ui_architecture_planning_summary>
[Provide a detailed conversation summary, including the elements listed in step 3].
</ui_architecture_planning_summary>
<unresolved_issues>
[List any unresolved issues or areas requiring further clarification, if any exist]
</unresolved_issues>
</conversation_summary>

The final output should contain only content in markdown format. Ensure your summary is clear, concise, and provides valuable information for the next stage of UI architecture planning and API integration.


-------------

AI:

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