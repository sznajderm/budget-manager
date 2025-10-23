# UI Architecture for BudgetManager

## 1. UI Structure Overview

BudgetManager MVP uses Astro (multi-page) with React islands for interactive parts, TypeScript, Tailwind, and Shadcn/ui. Authenticated routes are protected via Astro middleware with Supabase JWT. React Query handles data fetching, caching, and optimistic CRUD. Currency is USD, amounts input as dollars (converted to cents). Date/time uses DD/MM/YYYY HH:mm with direct date range pickers. Desktop-first (≥768px), accessible components, and URL query params persist filters.

Key routes and layouts
- Public: /login (tabbed Sign In/Sign Up)
- Authenticated: /dashboard, /transactions, /profile
- Root: / → redirects to /dashboard (authed) or /login (unauthed)
- Fallbacks: 404, error boundary
- Layouts: UnauthenticatedLayout (centered), AuthenticatedLayout (sidebar + header + content)

Security & accessibility
- JWT in Authorization header; tokens stored client-side and refreshed automatically
- RLS on all data; client validates ownership via API
- Shadcn/ui semantics, ARIA, focus management, screenreader-friendly error announcements

Performance
- Astro partial hydration; islands for filters, tables, modals
- Pagination (20/50) on transactions; background refetch; optimistic updates

Pain points addressed
- Fast add/edit via modal with optimistic updates
- Clear filtering with URL persistence and one-click Clear
- Friendly empty states and inline validation with Zod

## 2. View List

1) Authentication
- View name: Authentication (Tabbed Sign In / Sign Up)
- View path: /login
- Main purpose: Authenticate users and, on Sign Up, ensure initial data is created (Main Account + predefined categories) before redirecting
- Key information to display:
  - Tabs: Sign In, Sign Up
  - Inputs: email, password (+ password confirmation on Sign Up)
  - Error banners for auth failures
- Key view components:
  - AuthTabs (SignInForm, SignUpForm)
  - Inline form validation (Zod), Alert banners
  - CTA: Submit, link to switch tab
- UX, accessibility, and security considerations:
  - Keyboard/tab order, visible focus, screen reader labels
  - Do not expose auth errors verbosely; generic messaging
  - After Sign Up, show short “setting up your account” state; redirect to /dashboard
  - Maps to PRD: US-001, US-002

2) Dashboard
- View name: Dashboard
- View path: /dashboard
- Main purpose: High-level overview for current period; quick access to recent items and add-transaction
- Key information to display:
  - Date range selector (defaults to current month; independent from /transactions)
  - Two summary cards: total expenses, total income (for selected range)
  - Recent transactions (last 10): date+time, description, amount, category, account; actions: Edit/Delete
  - Primary CTA: Add Transaction
- Key view components:
  - DashboardSummary (date range + cards)
  - RecentTransactions list
  - TransactionModal (Create/Edit), DeleteConfirmModal
- UX, accessibility, and security considerations:
  - Empty state with illustration and Add CTA when no data
  - Optimistic updates for create/edit/delete; errors revert and notify
  - Skeletons for summary cards and recent list on first load
  - API usage: POST /rpc/get_expense_summary, POST /rpc/get_income_summary, GET /transactions?limit=10&select=*,accounts(name),categories(name)
  - Maps to PRD: US-013, US-014 (recent), US-010 (delete flow), US-015

3) Transactions
- View name: Transactions
- View path: /transactions
- Main purpose: Browse and manage transactions with robust filtering and pagination
- Key information to display:
  - Collapsible filter panel: Type (All/Expense/Income), Account, Category, Date range, Description search
  - URL query parameters reflect filters; “Clear filters” visible when active
  - Paginated list with page size selector (20/50), total count, and range label
  - Row actions: Edit/Delete; Add Transaction button above list
- Key view components:
  - FilterPanel (syncs with URL), DateRangeSelector (direct picker)
  - TransactionList (table or responsive cards for tablets)
  - Pagination (top and bottom), PageSizeSelect (20/50)
  - TransactionModal (Create/Edit), DeleteConfirmModal
- UX, accessibility, and security considerations:
  - Keyboard-accessible filters and table; visible focus
  - Inline field errors; banners for API failures
  - Empty state with Add CTA when no results
  - API usage: 
    - GET /transactions?select=*,accounts(name),categories(name)&order=created_at.desc&limit={20|50}&offset
    - Filters via Supabase query params (e.g., transaction_type=eq.expense, transaction_date=gte/lte, description=ilike)
    - GET /accounts (for selectors), GET /categories (for selectors)
    - POST /transactions, PATCH /transactions?id=eq.{id}, DELETE /transactions?id=eq.{id}
  - Maps to PRD: US-006, US-009, US-010, US-014, US-015

4) Profile
- View name: Profile
- View path: /profile
- Main purpose: View email (read-only) and change password
- Key information to display:
  - Email (non-editable), password change form (current, new, confirm)
- Key view components:
  - ProfileCard, PasswordUpdateForm, Alerts
- UX, accessibility, and security considerations:
  - Require recent auth or token validity; show success/failed alerts
  - API usage: Supabase Auth user update (password)
  - Maps to PRD: Supports “User Authentication” maintenance

5) Global Modals (not standalone routes)
- View name: Transaction Modal (Create/Edit)
- View path: Invoked from /dashboard and /transactions
- Main purpose: Create or edit a transaction without leaving context
- Key information to display:
  - Fields: Amount ($), Type (Expense/Income), Description, Date+time, Account, Category
  - Header: “Add Transaction” or “Edit Transaction”; buttons: Cancel/Save
- Key view components:
  - CurrencyInput (max $999,999.99), RadioGroup (type), TextInput, DateTimePicker, Selects
  - Inline errors; form-level banner; optimistic updates
- UX, accessibility, and security considerations:
  - Focus trap, ESC to close, form submission via Enter
  - Convert display dollars → cents for API; show formatted currency everywhere
  - API usage: POST/PATCH /transactions
  - Maps to PRD: US-006, US-009, US-015

6) Delete Confirmation (Transactions)
- View name: DeleteConfirmModal
- View path: Invoked from /dashboard and /transactions
- Main purpose: Confirm permanent deletion
- Key information to display:
  - Transaction summary (description, amount, date)
- Key view components:
  - Modal with Confirm/Cancel; error banner on failure
- UX, accessibility, and security considerations:
  - Permanent deletion; no undo
  - API usage: DELETE /transactions?id=eq.{id}
  - Maps to PRD: US-010

7) Error & Fallback Views
- View name: NotFound / ErrorBoundary
- View path: 404 / global
- Main purpose: Provide clear messaging and recovery actions
- Key information to display:
  - 404: Link to Dashboard or Login
  - ErrorBoundary: Retry / Back to Dashboard
- Key view components:
  - Friendly illustration, CTA buttons
- UX, accessibility, and security considerations:
  - Do not leak technical details; generic errors; accessible announcements

## 3. User Journey Map

Primary journey: Track and manage transactions
1) Visit / → middleware redirects to /login if unauthenticated
2) Sign Up → brief setup state → redirect to /dashboard (Main Account + predefined categories exist)
3) On /dashboard, review period summary and recent transactions; click “Add Transaction”
4) Modal opens → fill fields → Save → optimistic add shows new item in recent list; summaries refetch
5) Navigate to /transactions via sidebar
6) Adjust filters (type/account/category/date/description) → URL updates; list and counts update
7) Edit a transaction inline via modal → optimistic update and refetch
8) Delete a transaction → confirm in modal → item removed; totals updated
9) Open user menu → Profile to change password; Logout to end session (clear cache) and redirect to /login

Alternate flows and guards
- Deep link to /transactions with filters in URL → list loads with persisted state
- Unauthorized API response → middleware/sign-out → /login with return URL
- Empty data → empty states with CTA to add first transaction

## 4. Layout and Navigation Structure

Layouts
- UnauthenticatedLayout: Centered card container for /login with app logo/brand, minimal footer
- AuthenticatedLayout: Persistent left sidebar (Dashboard, Transactions), top bar with page title, Add Transaction button (contextual), and user menu (Profile, Logout)

Navigation
- Sidebar links: Dashboard, Transactions
- User menu: Profile, Logout
- Route protection: Middleware checks JWT; redirects to /login?returnTo=<path>
- Root redirects: / → /dashboard (authed) or /login (unauthed)

Filter state and URLs
- /transactions uses URL query parameters for all filters, pagination, and page size; “Clear filters” resets URL
- /dashboard date range is independent and stored in its own URL params

## 5. Key Components

Cross-cutting components and behavior
- SidebarNav: Authenticated navigation (icons + labels) with active state
- TopBar: Page title, contextual CTA (Add Transaction), user menu
- UserMenu: Profile, Logout (clears cache and tokens; redirects to /login)
- DateRangeSelector: Direct date range picker; DD/MM/YYYY; includes time; independent per page
- CurrencyInput: Dollar input with formatting, validation, and cents conversion
- TransactionList: Table with responsive fallback; shows date+time, description, amount, category, account, actions
- FilterPanel: Collapsible filters (type/account/category/date/description) synced to URL; Clear button
- Pagination: Numbered pagination with page size 20/50 and total count display (top and bottom)
- TransactionModal: Create/Edit form with Zod schemas, field-level errors, optimistic updates
- DeleteConfirmModal: Permanent deletion confirmation
- DashboardSummary: Two cards (expense/income) for selected period
- RecentTransactions: Last 10 with inline actions
- Alerts/Toasts: Inline field errors, form banners, and transient notifications for API/network issues
- ProtectedRoute/Middleware: Guards authenticated pages and injects returnTo on redirect

API compatibility summary
- Auth: POST /auth/v1/signup; POST /auth/v1/token?grant_type=password; password update via Supabase Auth user update
- Accounts/Categories (selectors only in MVP): GET /rest/v1/accounts; GET /rest/v1/categories
- Transactions: GET/POST/PATCH/DELETE /rest/v1/transactions with related selects and filters
- Summaries: POST /rest/v1/rpc/get_expense_summary; POST /rest/v1/rpc/get_income_summary

PRD mapping highlights
- Implemented in MVP: US-001, US-002, US-006, US-009, US-010, US-013, US-014, US-015
- Deferred per session notes: Accounts/Categories management pages (US-003..US-005, US-011..US-012), AI suggestion workflows (US-006 follow-ups US-007, US-008)

Edge cases & error states
- Network errors → dismissible banner with retry; optimistic revert on failure
- Unauthorized → redirect to /login with returnTo; clear caches on logout
- No accounts/categories (should not occur post-signup) → error banner + guidance
- Validation: amount range, description non-empty, valid date/time, existing account/category

Loading states (MVP recommendation)
- Dashboard: skeleton for cards and recent list
- Transactions: skeleton rows for table, spinner in filters area during fetch
- Buttons: loading spinners on form submits
