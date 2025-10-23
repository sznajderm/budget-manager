# View Implementation Plan — Dashboard

## 1. Overview
The Dashboard view provides a quick summary of a user’s finances for a selected date range. Its primary objective (US-013) is to show totals grouped by type (expense and income) and ensure those values update after adding, editing, or deleting Records. Secondary (optional) UI elements include a Recent Transactions list with Edit/Delete and an Add Transaction button; these are referenced for integration but are out-of-scope for US-013.

Key behaviors and constraints (from PRD and UI plan):
- Desktop-first (≥768px), Astro multi-page with React islands, TypeScript, Tailwind, shadcn/ui.
- React Query for data fetching, caching, and refetch on focus; optimistic updates elsewhere.
- USD currency; backend amounts are cents; UI displays dollars (no negative sign for expense, use color semantics).
- Date/time format for UI inputs: DD/MM/YYYY HH:mm; API requires ISO-8601 strings.
- Default range: current month (local) from 1st day 00:00 to end-of-today 23:59:59.999.
- Accessible components (semantics, ARIA, focus management, screenreader-friendly errors).

## 2. View Routing
- Route path: `/dashboard`
- Astro page file: `src/pages/dashboard.astro`
- Renders a React island component `DashboardSummary`.

Note: If the project already wraps pages with a global `QueryClientProvider`, don’t create a nested provider locally.

## 3. Component Structure
- `src/pages/dashboard.astro`
  - `DashboardSummary` (React island)
    - `DateRangeSelector`
    - `SummaryCardsWrapper` (layout container)
      - `ExpenseSummaryCard` (wraps `SummaryCard`)
      - `IncomeSummaryCard` (wraps `SummaryCard`)
    - Optional: `RecentTransactions` (not required by US-013)
      - Optional: `TransactionModal` (Create/Edit)
      - Optional: `DeleteConfirmModal`

High-level tree:
- DashboardSummary
  - DateRangeSelector
  - div.grid
    - SummaryCard kind="expense"
    - SummaryCard kind="income"
  - Optional RecentTransactions

## 4. Component Details

### DashboardSummary (React)
- Description: Orchestrates the dashboard summary view. Manages the date range via URL query params, fetches expense and income summaries via React Query, renders summary cards, and handles loading/error states.
- Main elements: Header (title), DateRangeSelector (From/To + Apply), grid with two SummaryCards, optional RecentTransactions section below.
- Handled interactions:
  - Change date range (updates URL, refetches summaries)
  - Dismiss error banners
  - Optional: open Add/Edit/Delete (if present) and invalidate summaries on success
- Validation conditions:
  - `start_date` and `end_date` are required ISO strings
  - `start_date <= end_date` (inclusive)
  - Normalize end boundary to include seconds/milliseconds as needed
- Types: Uses `SummaryCommand`, `SummaryDTO` (from `src/types.ts`), plus new view types (see Types section)
- Props: None (state read from URL and internal hooks)

### DateRangeSelector (React)
- Description: Two direct inputs for date-time range: “From” and “To” using DD/MM/YYYY HH:mm format, with Apply and Reset.
- Main elements: Label+Input (From), Label+Input (To), Apply button, Reset to Current Month button, inline validation messages.
- Handled interactions:
  - On input change: update local text state
  - On Apply: parse, validate, normalize, emit ISO strings
  - On Reset: set default current month and emit
- Validation conditions:
  - Format must be parsable as DD/MM/YYYY HH:mm
  - Start <= End (inclusive)
  - Normalize end to HH:mm:59.999 if seconds are not provided by the user
- Types: `DateRangeSelectorProps`; emits `DateRange` (ISO strings)
- Props: `{ value, onChange, onApply?, min?, max?, disabled? }`

Implementation notes:
- Use `date-fns` for parsing/formatting with pattern `"dd/MM/yyyy HH:mm"`.
- Accessibility: labels, aria-live for error messages, keyboard-friendly; Enter can trigger Apply.

### SummaryCard (React)
- Description: Displays a single summary (expense or income): formatted total dollars and transaction count. Handles loading and error states.
- Main elements: shadcn Card (header/title, content: total + count), Skeleton when loading, Alert with Retry on error.
- Handled interactions: Retry refetch for a failing summary.
- Validation: none (relies on parent data and error flags)
- Types: `SummaryCardProps`; ViewModel `SummaryVM`
- Props: `{ title, kind: "expense"|"income", data?, isLoading?, error?, onRetry? }`

Styling guidance:
- Expenses: red accents (e.g., `text-red-600`)
- Income: green accents (e.g., `text-emerald-600`)

### ExpenseSummaryCard / IncomeSummaryCard (wrappers)
- Description: Thin wrappers around `SummaryCard` with fixed title/kind per card.

### Optional: RecentTransactions
- Description: Last 10 transactions, either for the selected range or globally (per UI plan). Edit/Delete actions open modals.
- Props: `{ range: DateRange, onMutated: () => void }` to invalidate summaries on mutation success.

### Optional: TransactionModal / DeleteConfirmModal
- Description: Create/Edit modal and Delete confirmation modal. On success, call `onMutated` to invalidate summaries.

## 5. Types

Existing (from `src/types.ts`):
```ts
export interface SummaryCommand {
  start_date: string; // ISO timestamp
  end_date: string;   // ISO timestamp
}

export interface SummaryDTO {
  total_cents: number;
  transaction_count: number;
  period_start: string;
  period_end: string;
}
```

New view types (place in `src/components/dashboard/types.ts`):
```ts
export type SummaryKind = "expense" | "income";

export interface DateRange {
  startISO: string; // ISO string (UTC)
  endISO: string;   // ISO string (UTC), inclusive boundary ensured
}

export interface DashboardQueryParams {
  start?: string; // ISO
  end?: string;   // ISO
}

export interface SummaryVM {
  kind: SummaryKind;
  totalCents: number;
  totalFormatted: string; // "$1,234.56"
  transactionCount: number;
  periodStartISO: string;
  periodEndISO: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  cause?: unknown;
}

export interface SummaryCardProps {
  title: string;
  kind: SummaryKind;
  data?: SummaryVM;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (next: DateRange) => void;
  onApply?: () => void;
  min?: Date;
  max?: Date;
  disabled?: boolean;
}
```

Client zod schemas (for validation):
```ts
import { z } from "zod";

export const isoStringSchema = z.string().refine(
  (s) => !Number.isNaN(Date.parse(s)),
  { message: "Invalid ISO date-time." }
);

export const summaryCommandSchema = z
  .object({ start_date: isoStringSchema, end_date: isoStringSchema })
  .refine(
    ({ start_date, end_date }) => new Date(start_date).getTime() <= new Date(end_date).getTime(),
    { message: "Start must be before or equal to end." }
  );

export const dateRangeSchema = z
  .object({ startISO: isoStringSchema, endISO: isoStringSchema })
  .refine(
    ({ startISO, endISO }) => new Date(startISO).getTime() <= new Date(endISO).getTime(),
    { message: "Start must be before or equal to end." }
  );
```

## 6. State Management

Custom hooks:

1) `useDashboardDateRange`
- Purpose: Manage dashboard date range via URL (?start=…&end=…), provide defaults (current month), normalize inclusive end boundary, expose validity and errors.
- Behavior: On mount, parse URL; if invalid, set defaults. Keep internal `DateRange` (ISO) state; update URL via `history.replaceState`. Provide display strings in DD/MM/YYYY HH:mm.
- Returns: `{ range, display: { startText, endText }, setStartText, setEndText, applyFromText, resetToCurrentMonth, isValid, error, setRange }`

2) `useSummaries`
- Purpose: Wrap two React Query calls (expense and income summaries) based on `DateRange`. Provide `invalidateAll()`.
- Behavior: Two `useQuery` instances keyed with `["summary","expense",startISO,endISO]` and `["summary","income",startISO,endISO]`, `enabled` when date range valid, map DTO → VM with currency formatting.
- Returns: `{ expense, income, invalidateAll }`

Caching defaults:
- `staleTime: 30_000`, cacheTime default, refetchOnWindowFocus default `true`.

## 7. API Integration

Endpoints:
- POST `/rest/v1/rpc/get_expense_summary`
- POST `/rest/v1/rpc/get_income_summary`

Request payload (SummaryCommand):
```json
{
  "start_date": "2024-01-01T00:00:00.000Z",
  "end_date": "2024-01-31T23:59:59.999Z"
}
```

Response payload (SummaryDTO):
```json
{
  "total_cents": 125000,
  "transaction_count": 45,
  "period_start": "2024-01-01T00:00:00.000Z",
  "period_end": "2024-01-31T23:59:59.999Z"
}
```

Expected status codes:
- 200 OK
- 401 Unauthorized (redirect to /login)
- Also handle 400 (malformed), 422 (validation), 500 (server)

Fetcher outline (`src/lib/api.ts`):
```ts
import { summaryCommandSchema } from "@/components/dashboard/types"; // adjust alias if needed
import type { SummaryCommand, SummaryDTO } from "@/types";

const BASE = "/rest/v1/rpc";

function handle401(res: Response) {
  if (res.status === 401) {
    window.location.assign("/login");
    return true;
  }
  return false;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (handle401(res)) throw new Error("Unauthorized");
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    const err = new Error(msg) as Error & { status?: number };
    (err as any).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export async function fetchExpenseSummary(cmd: SummaryCommand): Promise<SummaryDTO> {
  summaryCommandSchema.parse(cmd);
  return postJSON<SummaryDTO>(`${BASE}/get_expense_summary`, cmd);
}

export async function fetchIncomeSummary(cmd: SummaryCommand): Promise<SummaryDTO> {
  summaryCommandSchema.parse(cmd);
  return postJSON<SummaryDTO>(`${BASE}/get_income_summary`, cmd);
}
```

React Query hook (`src/hooks/useSummaries.ts`):
```ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchExpenseSummary, fetchIncomeSummary } from "@/lib/api";
import type { DateRange, SummaryVM } from "@/components/dashboard/types";
import type { SummaryCommand, SummaryDTO } from "@/types";

const fmtUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function dtoToVM(kind: "expense"|"income", dto: SummaryDTO): SummaryVM {
  const dollars = dto.total_cents / 100;
  return {
    kind,
    totalCents: dto.total_cents,
    totalFormatted: fmtUSD.format(Math.abs(dollars)),
    transactionCount: dto.transaction_count,
    periodStartISO: dto.period_start,
    periodEndISO: dto.period_end,
  };
}

export function useSummaries(range: DateRange | null) {
  const qc = useQueryClient();
  const enabled = !!range;

  const cmd: SummaryCommand | null = range ? {
    start_date: range.startISO,
    end_date: range.endISO,
  } : null;

  const expense = useQuery({
    queryKey: ["summary", "expense", cmd?.start_date, cmd?.end_date],
    queryFn: () => fetchExpenseSummary(cmd!),
    enabled,
    staleTime: 30_000,
    select: (dto: SummaryDTO) => dtoToVM("expense", dto),
  });

  const income = useQuery({
    queryKey: ["summary", "income", cmd?.start_date, cmd?.end_date],
    queryFn: () => fetchIncomeSummary(cmd!),
    enabled,
    staleTime: 30_000,
    select: (dto: SummaryDTO) => dtoToVM("income", dto),
  });

  const invalidateAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["summary", "expense"] }),
      qc.invalidateQueries({ queryKey: ["summary", "income"] }),
    ]);
  };

  return { expense, income, invalidateAll };
}
```

## 8. User Interactions
- Change date range: user edits From/To, clicks Apply. If valid → URL updates (?start=&end=), queries refetch, cards update. If invalid → inline error shown; no refetch.
- Retry on error: click Retry on a SummaryCard to refetch that query.
- Dismiss error banner: close/dismiss (error state remains until a successful refetch).
- Optional RecentTransactions: Add/Edit/Delete triggers `invalidateAll()` so SummaryCards update (satisfying US-013).

## 9. Conditions and Validation
- API requires `start_date` and `end_date` as ISO strings; verify with zod before calling.
- Enforce `start_date <= end_date` (inclusive) at the selector level and via zod refinement.
- Inclusive end boundary: when the UI lacks seconds, normalize end to seconds=59, ms=999 before converting to ISO.
- Only fire queries when the range is valid; otherwise show validation error.
- Currency formatting: display absolute amounts; use color to differentiate expense vs income.

## 10. Error Handling
- 401 Unauthorized: redirect to `/login` in fetch layer; clear queries if a global logout occurs.
- 400 / 422 Validation: show Alert with message; keep inputs, allow correction and retry.
- 500 Server / network: show Alert with generic message and Retry.
- Partial failures: render success card even if the other failed; each card handles its own error.
- Loading: Skeleton placeholders on initial load and during refetch.
- Accessibility: errors use `role="alert"`, announce via aria-live; move focus to first error when it appears.

## 11. Implementation Steps
1) Create files/directories:
- `src/pages/dashboard.astro`
- `src/components/dashboard/DashboardSummary.tsx`
- `src/components/dashboard/DateRangeSelector.tsx`
- `src/components/dashboard/SummaryCard.tsx`
- `src/components/dashboard/types.ts`
- `src/hooks/useDashboardDateRange.ts`
- `src/hooks/useSummaries.ts`
- `src/lib/api.ts`
- `src/lib/date.ts`
- `src/lib/format.ts`

2) Utilities
- `src/lib/format.ts`
```ts
export const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const formatUSD = (cents: number) => usd.format(Math.abs(cents) / 100);
```
- `src/lib/date.ts`
```ts
import { format, parse } from "date-fns";

export const UI_PATTERN = "dd/MM/yyyy HH:mm";

export function parseUiToDate(value: string): Date | null {
  try {
    const d = parse(value, UI_PATTERN, new Date());
    return Number.isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

export function toInclusiveEnd(d: Date): Date {
  const copy = new Date(d);
  copy.setSeconds(59, 999);
  return copy;
}

export function toISO(d: Date): string {
  return d.toISOString();
}

export function formatDateForUI(d: Date): string {
  return format(d, UI_PATTERN);
}

export function currentMonthDefault(): { startISO: string; endISO: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}
```

3) Hook: `useDashboardDateRange` (`src/hooks/useDashboardDateRange.ts`)
```ts
import { useEffect, useMemo, useState } from "react";
import { dateRangeSchema } from "@/components/dashboard/types";
import { parseUiToDate, toInclusiveEnd, toISO, formatDateForUI, currentMonthDefault } from "@/lib/date";

export function useDashboardDateRange() {
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

  const initial = useMemo(() => {
    const start = search?.get("start");
    const end = search?.get("end");
    if (start && end) {
      try {
        dateRangeSchema.parse({ startISO: start, endISO: end });
        return { startISO: start, endISO: end };
      } catch { /* fallthrough */ }
    }
    return currentMonthDefault();
  }, []);

  const [range, setRange] = useState(initial);
  const [startText, setStartText] = useState(() => formatDateForUI(new Date(range.startISO)));
  const [endText, setEndText] = useState(() => formatDateForUI(new Date(range.endISO)));
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("start", range.startISO);
    params.set("end", range.endISO);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", url);
  }, [range]);

  function applyFromText() {
    const s = parseUiToDate(startText);
    const e0 = parseUiToDate(endText);
    if (!s || !e0) { setError("Please enter valid dates in DD/MM/YYYY HH:mm format."); return false; }
    const e = toInclusiveEnd(e0);
    const next = { startISO: toISO(s), endISO: toISO(e) };
    try { dateRangeSchema.parse(next); setRange(next); setError(undefined); return true; }
    catch { setError("Start must be before or equal to end."); return false; }
  }

  function resetToCurrentMonth() {
    const next = currentMonthDefault();
    setRange(next);
    setStartText(formatDateForUI(new Date(next.startISO)));
    setEndText(formatDateForUI(new Date(next.endISO)));
    setError(undefined);
  }

  const isValid = !error;

  return { range, display: { startText, endText }, setStartText, setEndText, applyFromText, resetToCurrentMonth, isValid, error, setRange };
}
```

4) Components

`SummaryCard` (`src/components/dashboard/SummaryCard.tsx`)
```tsx
import type { SummaryCardProps } from "./types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export default function SummaryCard({ title, kind, data, isLoading, error, onRetry }: SummaryCardProps) {
  const color = kind === "expense" ? "text-red-600" : "text-emerald-600";
  const border = kind === "expense" ? "border-red-200" : "border-emerald-200";

  return (
    <Card className={clsx("border", border)} aria-busy={isLoading}>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-24" /></div>
        ) : error ? (
          <Alert role="alert" className="space-y-2">
            <AlertDescription>{error}</AlertDescription>
            {onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}
          </Alert>
        ) : data ? (
          <div className="space-y-1">
            <div className={clsx("text-3xl font-semibold", color)} aria-live="polite">{data.totalFormatted}</div>
            <div className="text-sm text-muted-foreground">{data.transactionCount} transactions</div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No data</div>
        )}
      </CardContent>
    </Card>
  );
}
```

`DashboardSummary` (`src/components/dashboard/DashboardSummary.tsx`)
```tsx
import SummaryCard from "./SummaryCard";
import { useDashboardDateRange } from "@/hooks/useDashboardDateRange";
import { useSummaries } from "@/hooks/useSummaries";

export default function DashboardSummary() {
  const { range, display, setStartText, setEndText, applyFromText, resetToCurrentMonth, error } = useDashboardDateRange();
  const { expense, income } = useSummaries(range);

  return (
    <main className="container mx-auto py-8">
      <header className="mb-6"><h1 className="text-2xl font-semibold">Dashboard</h1></header>

      <section className="space-y-3 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium">From (DD/MM/YYYY HH:mm)</label>
            <input className="border rounded px-3 py-2" value={display.startText} onChange={(e) => setStartText(e.target.value)} placeholder="DD/MM/YYYY HH:mm" aria-invalid={!!error} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium">To (DD/MM/YYYY HH:mm)</label>
            <input className="border rounded px-3 py-2" value={display.endText} onChange={(e) => setEndText(e.target.value)} placeholder="DD/MM/YYYY HH:mm" aria-invalid={!!error} />
          </div>
          <button className="h-10 px-4 rounded bg-primary text-primary-foreground" type="button" onClick={applyFromText}>Apply</button>
          <button className="h-10 px-4 rounded border" type="button" onClick={resetToCurrentMonth}>Reset to Current Month</button>
        </div>
        {error && <div role="alert" className="text-red-600">{error}</div>}
      </section>

      <section aria-label="Summary cards" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Total Expenses" kind="expense" data={expense.data} isLoading={expense.isLoading || expense.isFetching} error={expense.isError ? (expense.error as Error).message : undefined} onRetry={() => expense.refetch()} />
        <SummaryCard title="Total Income" kind="income" data={income.data} isLoading={income.isLoading || income.isFetching} error={income.isError ? (income.error as Error).message : undefined} onRetry={() => income.refetch()} />
      </section>
      {/* Optional RecentTransactions here; call invalidateAll() on mutation success */}
    </main>
  );
}
```

## 12. Optional Recent Transactions Integration
- Place `RecentTransactions` below the summary grid.
- Pass current `DateRange` if filtering by range, or fetch global last 10 per UI plan.
- On successful transaction mutation (create/edit/delete), invalidate both summary queries so totals update.

## 13. Acceptance Criteria Mapping (US-013)
- “Dashboard shows sums grouped by type (expense/income).” → Implemented by two `SummaryCard` components backed by `/rpc/get_expense_summary` and `/rpc/get_income_summary`.
- “Values update after adding, editing, or deleting Records.” → Ensure mutation success paths call `queryClient.invalidateQueries({ queryKey: ["summary"] })` so both cards refetch with the latest totals; also rely on React Query refetch-on-focus when navigating back.

## 14. Potential Challenges & Mitigations
- Timezone boundaries: ensure we convert UI selections to UTC ISO (`Date.toISOString()`), and normalize end-of-day inclusively. Display dates in local format (DD/MM/YYYY HH:mm) to users.
- Parsing DD/MM/YYYY HH:mm reliably: use `date-fns` for parsing/formatting; provide clear placeholders and inline validation messages.
- Cross-page updates: totals should refresh when transactions are modified elsewhere; rely on React Query’s refetch-on-focus and/or a small event bus (e.g., dispatch a `transactions:mutated` event to trigger `invalidateQueries`).
- Large date ranges: if performance issues arise, consider soft limits (e.g., max 12 months) and show a warning when the range is too large.
- Partial failures: handle each card independently so one failure doesn’t blank the other.
- Styling consistency: use shadcn/ui primitives and Tailwind utility classes; keep a shared `formatUSD` helper to avoid divergence.

Notes:
- Import paths shown with `@/…` assume an alias to `src`; adjust to project conventions if different.
- Ensure `@tanstack/react-query` provider is available for islands that use hooks.
