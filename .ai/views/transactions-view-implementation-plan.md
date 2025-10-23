# View Implementation Plan — Transactions

## 1. Overview
The Transactions view enables users to browse, add, edit, and delete transactions. This iteration delivers a paginated list ordered by created_at (desc), numbered pagination with page size 20/50 and controls at both top and bottom, row actions (Edit/Delete), and an Add Transaction modal. Filters and AI suggestions are explicitly omitted for this iteration. Category is nullable and can default to an “Uncategorized” category (to be created/seeded). Amounts are in USD (input in dollars, stored as cents). Income amounts are shown in green; expenses in red.

## 2. View Routing
- Path: `/transactions`
- Astro page: `src/pages/transactions.astro`
- React island: `TransactionsIsland` mounted on the page (Astro MPA with React islands)

## 3. Component Structure
- TransactionsIsland (React)
  - TransactionsHeader
    - Title and AddTransactionButton
  - PaginationControls (top)
  - TransactionsTable
    - TableHeader
    - TableBody
      - TransactionRow (× N)
      - SkeletonRows (loading state)
    - EmptyState (no data)
  - PaginationControls (bottom)
  - AddEditTransactionModal
    - TransactionForm
      - MoneyInput
      - SelectType (expense/income)
      - DateTimeInput (DD/MM/YYYY HH:mm)
      - SelectAccount
      - SelectCategory (nullable)
      - DescriptionInput
  - DeleteConfirmDialog
  - InlineErrorBanner / toasts

## 4. Component Details

### TransactionsIsland
- Description: Orchestrates data fetching, pagination state, modal visibility, and CRUD actions. Syncs `?page` and `?limit` to URL.
- Main elements: Header, top/bottom pagination controls, table, add/edit modal, delete dialog, error banner.
- Handled interactions:
  - Change page/page size (updates URL, refetches)
  - Open Add/Edit, submit create/update
  - Delete with confirm
- Validation conditions: Delegates to TransactionForm for field validation; ensures page boundaries and page size (20/50).
- Types: Uses DTOs and VMs described in section 5.
- Props: none (top-level page island).

### TransactionsHeader
- Description: Displays page title and Add button.
- Main elements: `h1`, primary button.
- Handled interactions: `onAdd()` to open modal in create mode.
- Validation: n/a.
- Types: none.
- Props:
  - `onAdd: () => void`

### PaginationControls
- Description: Numbered pagination with page size select (20/50). Shown above and below the table.
- Main elements: Page size Select, First/Prev/number buttons/Next/Last, total count label.
- Handled interactions:
  - `onPageChange(page: number)`
  - `onPageSizeChange(size: 20 | 50)` (resets page to 1)
- Validation conditions:
  - Clamp page to `[1, totalPages]`
  - Disable navigation at bounds
- Types: Props typed with page, pageSize, totalCount.
- Props:
  - `page: number`
  - `pageSize: 20 | 50`
  - `totalCount: number`
  - `onPageChange(page: number): void`
  - `onPageSizeChange(size: 20 | 50): void`

### TransactionsTable
- Description: Renders table with headers and rows; shows skeletons while loading and empty state when no results.
- Main elements: Table (shadcn/ui), header row, body rows, action buttons.
- Handled interactions: row Edit/Delete callbacks.
- Validation: n/a.
- Types: Accepts `TransactionVM[]`.
- Props:
  - `items: TransactionVM[]`
  - `loading: boolean`
  - `onEdit(tx: TransactionVM): void`
  - `onDelete(tx: TransactionVM): void`

### TransactionRow
- Description: A row showing date, description, account, category (or “Uncategorized”), type, amount (color-coded), and actions.
- Main elements: Cells per column, icon/text buttons for actions.
- Handled interactions: Edit/Delete triggers.
- Validation: n/a.
- Types: `TransactionVM`.
- Props:
  - `item: TransactionVM`
  - `onEdit(item: TransactionVM): void`
  - `onDelete(item: TransactionVM): void`

### AddEditTransactionModal
- Description: Modal containing `TransactionForm`. Supports create/edit modes and shows submit progress.
- Main elements: Dialog, form, buttons.
- Handled interactions: submit create or update, cancel/close.
- Validation: Uses `TransactionFormSchema` (Zod) client-side; maps backend 422 errors to fields.
- Types: form values, create/update payloads.
- Props:
  - `open: boolean`
  - `mode: "create" | "edit"`
  - `initialValues?: TransactionFormValues`
  - `accounts: AccountOption[]`
  - `categories: CategoryOption[]`
  - `defaultUncategorizedId?: string | null`
  - `onClose(): void`
  - `onSubmitCreate(payload: TransactionCreatePayload): Promise<void>`
  - `onSubmitUpdate(id: string, payload: TransactionUpdatePayload): Promise<void>`

### TransactionForm
- Description: Controlled form for transaction fields. Converts dollars→cents and DD/MM/YYYY HH:mm→ISO on submit.
- Main elements: MoneyInput, SelectType, DateTimeInput, SelectAccount, SelectCategory (nullable), DescriptionInput.
- Handled interactions: Field edits, submit.
- Validation conditions (UI):
  - amount_dollars: required, > 0, max 2 decimals
  - transaction_type: required (expense|income)
  - transaction_date_input: required, valid DD/MM/YYYY HH:mm
  - account_id: required UUID
  - category_id: optional UUID or null
  - description: optional (trim, <= 255 chars)
- Types: `TransactionFormValues`, `FieldErrorMap`.
- Props:
  - `mode: "create" | "edit"`
  - `initialValues?: TransactionFormValues`
  - `accounts: AccountOption[]`
  - `categories: CategoryOption[]`
  - `defaultUncategorizedId?: string | null`
  - `submitting: boolean`
  - `fieldErrors?: FieldErrorMap`
  - `onSubmit(values: TransactionFormValues): void`

### DeleteConfirmDialog
- Description: Confirmation dialog for deletion.
- Main elements: Dialog content, summary text, Cancel/Confirm buttons.
- Handled interactions: Confirm (DELETE), Cancel (close).
- Validation: n/a.
- Props:
  - `open: boolean`
  - `tx?: { id: string; description?: string; amount_cents: number; transaction_type: "income" | "expense" }`
  - `onCancel(): void`
  - `onConfirm(): Promise<void>`

### InlineErrorBanner
- Description: Page-level error banner for non-field errors with aria-live.
- Props:
  - `message: string`
  - `variant?: "destructive" | "default"`

## 5. Types

DTOs (backend-aligned; category nullable, accounts/categories embeds for list):
```ts path=null start=null
export type UUID = string;

export interface TransactionDTO {
  id: UUID;
  amount_cents: number;
  transaction_type: "income" | "expense";
  description: string | null;
  transaction_date: string; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  account_id: UUID;
  category_id: UUID | null;
  accounts?: { name: string } | null;
  categories?: { name: string } | null;
}

export interface TransactionListResponse {
  data: TransactionDTO[];
  meta: { total_count: number; limit: number; offset: number };
}

export interface TransactionCreatePayload {
  amount_cents: number;
  transaction_type: "income" | "expense";
  description?: string | null;
  transaction_date: string; // ISO
  account_id: UUID;
  category_id?: UUID | null;
}

export interface TransactionUpdatePayload {
  amount_cents?: number;
  description?: string | null;
  category_id?: UUID | null;
  transaction_type?: "income" | "expense";
  transaction_date?: string; // ISO
  account_id?: UUID;
}

export interface AccountOption { id: UUID; name: string }
export interface CategoryOption { id: UUID; name: string }
```

ViewModels (rendering-friendly):
```ts path=null start=null
export interface TransactionVM {
  id: UUID;
  createdAtISO: string;
  transactionDateISO: string;
  description: string;
  accountName: string;
  accountId: UUID;
  categoryName: string; // "Uncategorized" if null
  categoryId: UUID | null;
  type: "income" | "expense";
  amountCents: number;
  amountFormatted: string; // e.g., $1,234.56
  amountClassName: string; // text-green-600 | text-red-600
}
```

Form types and schema:
```ts path=null start=null
export interface TransactionFormValues {
  amount_dollars: string;
  transaction_type: "income" | "expense";
  transaction_date_input: string; // DD/MM/YYYY HH:mm
  account_id: string;
  category_id: string | null;
  description: string;
}

export type FieldErrorMap = Record<string, string | undefined>;
```

Zod (UI) validation:
```ts path=null start=null
import { z } from "zod";

export const amountDollarsRegex = /^\d{1,9}(?:\.\d{1,2})?$/;

export const TransactionFormSchema = z.object({
  amount_dollars: z.string()
    .regex(amountDollarsRegex, "Enter a valid amount (max 2 decimals)")
    .refine(v => parseFloat(v) > 0, "Amount must be greater than 0"),
  transaction_type: z.enum(["income", "expense"]),
  transaction_date_input: z.string().min(1, "Date/time is required"),
  account_id: z.string().uuid("Select an account"),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().max(255, "Max 255 characters").optional().default(""),
});
```

## 6. State Management
- Local state in `TransactionsIsland`:
  - `page: number` (init from URL ?page, default 1)
  - `pageSize: 20 | 50` (init from URL ?limit, default 20)
  - `modalOpen: boolean`, `modalMode: "create" | "edit"`, `selectedTx: TransactionVM | null`
  - `deleteOpen: boolean`
  - `nonFieldError: string | null`
  - URL sync for `?page` and `?limit`
- React Query:
  - `useTransactionsQuery({ limit, offset })` keyed by `["transactions", { limit, offset }]`
  - `useAccountsQuery()` -> GET accounts order by name asc
  - `useCategoriesQuery()` -> GET categories order by name asc
  - Mutations: create/update/delete with invalidation of list on success
- Derived:
  - `totalPages = Math.max(1, Math.ceil(total_count / pageSize))`
  - Adjust page down if current becomes out-of-range after deletion

## 7. API Integration
- List Transactions
  - Method: GET
  - URL: `/api/rest/v1/transactions?limit={20|50}&offset={n}`
  - Behavior: server applies `select=*,accounts(name),categories(name)&order=created_at.desc`
  - Response: `TransactionListResponse`
  - 200 OK, 401 Unauthorized
- Create Transaction
  - Method: POST
  - URL: `/api/rest/v1/transactions`
  - Request: `TransactionCreatePayload`
  - Response: created `TransactionDTO`
  - 201 Created, 400/422 errors, 401 Unauthorized
- Update Transaction
  - Method: PATCH
  - URL: `/api/rest/v1/transactions?id=eq.{transaction_id}`
  - Request: `TransactionUpdatePayload` (expanded to include `transaction_type`, `transaction_date`, `account_id`)
  - Response: updated `TransactionDTO`
  - 200 OK, 404 Not Found, 400/422, 401
- Delete Transaction
  - Method: DELETE
  - URL: `/api/rest/v1/transactions?id=eq.{transaction_id}`
  - Response: empty
  - 204 No Content, 404, 401
- Selectors
  - Accounts: `GET /rest/v1/accounts?select=id,name&order=name.asc`
  - Categories: `GET /rest/v1/categories?select=id,name&order=name.asc`
- Date handling
  - UI converts DD/MM/YYYY HH:mm → ISO; backend standardizes to UTC prior to save (must be ensured/added server-side)

## 8. User Interactions
- Add Transaction (US-006)
  - Click Add → open modal with defaults (type=expense, now as date, category preselected to “Uncategorized” if present)
  - Submit → validate → POST → close on success, toast, refetch list
- Edit Transaction (US-009)
  - Click Edit → open modal with prefilled values
  - Submit → validate → PATCH → close on success, toast, refetch
- Delete Transaction (US-010)
  - Click Delete → confirm dialog → DELETE → close, toast, refetch; adjust page if needed
- View transaction list (US-014)
  - Paginate using top/bottom controls; change page size (20/50) resets to page 1

## 9. Conditions and Validation
- UI validates:
  - Amount: > 0, ≤ 999,999.99; convert to integer cents
  - Type: income|expense
  - Date: DD/MM/YYYY HH:mm valid; convert to ISO
  - Account: required UUID
  - Category: optional/nullable
  - Description: ≤ 255 chars
- Pagination:
  - Page bounds and limit (20/50) enforced in UI
- Display rules:
  - Amount colored by type (green income, red expense)
  - Category null → “Uncategorized” label

## 10. Error Handling
- 401 Unauthorized: Reuse client behavior to redirect to `/login`
- 422 Unprocessable Entity: Map backend messages to `FieldErrorMap` and show beneath fields
- 404 Not Found (edit/delete): Show banner/toast, close modal/dialog as appropriate
- Network/500: Page-level `InlineErrorBanner` with retry; mutation toasts with retry
- Empty state: Friendly message and Add CTA when list is empty on first page
- Page-out-of-range after deletion: Decrement page to last valid and refetch

## 11. Implementation Steps
1) Backend prerequisites
   - Make `transactions.category_id` nullable; ensure list joins tolerate null and return `categories: null`
   - Expand PATCH to accept `transaction_type`, `transaction_date`, `account_id`; update Zod schema and service
   - Standardize `transaction_date` to UTC on backend if not present
   - Seed an “Uncategorized” category per user (setup or on-demand)
2) Page scaffolding
   - Create `src/pages/transactions.astro` and mount `TransactionsIsland`
3) Feature module structure (`src/features/transactions`)
   - `TransactionsIsland.tsx`
   - `components/` (Header, PaginationControls, Table, Row, Modal, Form, DeleteDialog, ErrorBanner, MoneyInput, DateTimeInput)
   - `hooks/` (useTransactionsQuery, useTransactionMutations, useAccountsQuery, useCategoriesQuery, usePagination)
   - `types.ts` (DTOs, VMs, form types, Zod schema)
   - `utils/` (`currency.ts`, `datetime.ts`, `mappers.ts`)
4) Helpers
   - Currency: dollars↔cents, formatUSD, color class by type
   - Datetime: DD/MM/YYYY HH:mm ↔ ISO, now default in UI
   - Mappers: DTO → VM (with “Uncategorized” fallback)
5) API clients and hooks
   - Transactions: GET/POST/PATCH/DELETE to `/api/rest/v1/transactions`
   - Selectors: GET accounts/categories ordered by name asc
   - React Query queries and mutations (invalidate on success)
6) Components
   - Build table, pagination, and modals with shadcn/ui; add accessibility (focus trap, labels, aria-live)
7) Compose island
   - Wire URL sync, queries, handlers, and state; add toasts/banners
8) QA & tests
   - Unit tests: currency/datetime helpers
   - Component tests: form validation, pagination rendering
   - Integration (MSW): list/paginate, create/edit/delete flows, page adjustment on delete
9) Performance & UX polish
   - Add skeletons/spinners; set reasonable cache stale times for selectors
10) Future iterations (out of scope now)
   - Filters with URL state and server-side filtering
   - AI suggestion integration and approval flows
   - Optimistic updates for smoother UX

