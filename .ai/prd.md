# Product Requirements Document (PRD) - BudgetManager

## 1. Product Overview
BudgetManager is a web-based application that helps individual users consolidate and categorize expenses and income from multiple bank accounts. Leveraging AI-powered categorization, BudgetManager enables users to quickly record transactions, receive category suggestions, and maintain a clear financial overview without manual sorting.

## 2. User Problem
Many individuals struggle to track expenses and income across multiple bank accounts and credit cards. Manually aggregating transactions and assigning categories is time-consuming and error-prone. BudgetManager addresses this by offering a unified interface for recording transactions and using AI to suggest appropriate categories, reducing manual work and improving accuracy.

## 3. Functional Requirements
1. User Authentication
   - Email/password signup and login
   - Secure session tokens
2. Account Management
   - Create, edit, delete Accounts (name, type, optional balance)
   - List user’s Accounts
3. Transaction Management
   - Create, read, update, delete Records (amount, date, description, account ID, category)
   - Single-form entry interface for quick transactions
4. Category Management
   - Predefined set of 15–20 standard categories
   - Create, edit, delete custom categories
5. AI-Powered Categorization
   - Automatically send new Record to OpenRouter.ai for category suggestion
   - Display suggested category with confidence score
   - Approve, reject, or modify suggested category
6. Dashboard
   - Display total expenses and income summary
   - List recent transactions with edit/delete actions
   - Button to add new transaction
7. Data Persistence
   - Store transaction data, AI suggestions, confidence scores, and final user selections in database

## 4. Product Boundaries
- Out of scope for MVP:
  - Integration with external banking systems (API connections)
  - Importing transactions from files or third-party services
  - Charts or graphical expense/income trends
  - Advanced analytics, scalability planning, and performance tuning
  - Detailed UI/UX workflows beyond core forms and dashboard
  - Technology stack decisions (deferred)
  - Prompt engineering and model tuning strategies

## 5. User Stories

US-001
Title: User signup
Description: A new user can create an account using email and password.
Acceptance Criteria:
- Given valid email and password, when submitting signup form, account is created and user is logged in.
- Error displayed if email already in use or password fails validation.

US-002
Title: User login
Description: An existing user can log in with email and password.
Acceptance Criteria:
- Given correct credentials, user gains access to dashboard.
- Error displayed for invalid credentials.

US-003
Title: Create account record
Description: Logged-in user can add a new bank account.
Acceptance Criteria:
- Form accepts name, type, optional balance and saves new Account.
- New Account appears in account list.

US-004
Title: Edit account record
Description: User can modify an existing Account’s details.
Acceptance Criteria:
- Edited fields update the Account after saving.
- Changes reflected immediately in account list.

US-005
Title: Delete account record
Description: User can remove an Account.
Acceptance Criteria:
- Confirmation dialog appears before deletion.
- Deleted Account no longer appears in list.

US-006
Title: Add transaction
Description: User can create a new expense or income record.
Acceptance Criteria:
- Form captures amount, date, description, account selection.
- Upon submission, AI suggestion displayed with confidence.
- Record saved with provisional category.

US-007
Title: Approve AI suggestion
Description: User can accept suggested category.
Acceptance Criteria:
- Clicking approve assigns suggested category and confidence score stored.

US-008
Title: Modify AI suggestion
Description: User can reject suggestion and choose different category.
Acceptance Criteria:
- User selects alternative category and overrides suggestion.
- Final category stored with original confidence score.

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

US-011
Title: Create custom category
Description: User can add a new category to use for transactions.
Acceptance Criteria:
- Form accepts category name.
- New category appears in category list and selection menus.

US-012
Title: Edit custom category
Description: User can rename or delete a custom category.
Acceptance Criteria:
- Renaming updates category name everywhere.
- Deletion removes category and reassigns or prompts reassign for existing Records.

US-013
Title: View dashboard summary
Description: User can see totals for expenses and income.
Acceptance Criteria:
- Dashboard shows sums grouped by type (expense/income).
- Values update after adding, editing, or deleting Records.

US-014
Title: View transaction list
Description: User can browse recent transactions.
Acceptance Criteria:
- List displays date, description, amount, category, and actions (edit/delete).
- Pagination or infinite scroll for long lists.

US-015
Title: Validation errors handling
Description: User sees meaningful errors when submitting invalid data.
Acceptance Criteria:
- Missing required fields triggers inline validation messages.
- Invalid amounts or dates show appropriate error text.

## 6. Success Metrics
- Primary metric: AI categorization accuracy ≥ 50% for expenses.
- Measurement: Daily comparison of AI-suggested category vs. user’s final category in database.
- Report: Dashboard or log shows percent correctly assigned over total records.
