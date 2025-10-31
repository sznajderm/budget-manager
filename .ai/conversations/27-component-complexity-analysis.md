Review all files in the @components folder identifying those with the highest number of lines of code.

1) Select and list the paths of the TOP 5 files with the highest LOC, indicating potentially high complexity.

2) Review each file from the TOP 5 suggesting potential refactoring directions (patterns, techniques, and improvements tailored to the technology encountered there) with argumentation.

For reference, base on .ai/tech-stack.md

---

AI:

Top 5 by lines of code (LOC) in components:
•  src/components/auth/LoginForm.test.tsx — 487
•  src/components/dashboard/DashboardSummary.test.tsx — 397
•  src/components/dashboard/SummaryCard.test.tsx — 365
•  src/components/transactions/TransactionsIsland.tsx — 288
•  src/components/transactions/TransactionForm.tsx — 264

Refactoring directions
1) src/components/auth/LoginForm.test.tsx
•  Extract shared setup into test utils: create renderLoginForm({url, fetchMock}) and common helpers (fillEmail, fillPassword, submit). Cuts duplication and clarifies Arrange-Act-Assert.
•  Prefer MSW over vi.mocked global.fetch: aligns with Vitest + MSW from the stack, gives realistic network behavior and simpler assertions.
•  Split into focused files by concern (rendering.spec, validation.spec, submission.spec, url-params.spec, a11y.spec). Reduces file size and improves test discoverability.
•  Use findBy* queries instead of waitFor + getBy where appropriate; avoid overuse of waitFor to reduce flakiness.
•  Table-driven tests for repeated variants (invalid inputs, server errors, button states). Lowers copy-paste and enforces consistency.
•  Reduce DOM styling assertions to user-observable outcomes and roles; keep a11y checks but avoid brittle text-based loading-state assertions where semantics suffice.

2) src/components/dashboard/DashboardSummary.test.tsx
•  Centralize providers: create a custom render with QueryClientProvider in a test-utils file (e.g., renderWithQuery). Removes repeated createTestWrapper.
•  Prefer integration with MSW to mock network instead of mocking hooks (useDashboardDateRange/useSummaries). Reserve hook mocks for narrow unit tests; integration tests become more robust.
•  Split tests by feature area (date-range, buttons, cards integration, a11y). Shorter files, clearer intent.
•  Replace className/style assertions with role/label/state checks; keep component contract tests minimal since SummaryCard is already covered elsewhere.
•  Parameterize card states (loading/error/data) to a single describe.each block for expense/income; deduplicates similar cases.

3) src/components/dashboard/SummaryCard.test.tsx
•  Group states into separate files (loading.spec, error.spec, data.spec, a11y.spec) or use describe.each for kind=[expense,income] and state=[loading,error,data,empty].
•  Avoid brittle Tailwind class assertions; test variant behavior via accessible text, role, or data-attributes. If visual variants must be tested, use a minimal toHaveClass on stable variant markers only.
•  Extract a factory for props/data; keep createMockData in a shared test factory to avoid duplication across dashboard tests.
•  Consider a snapshot for static structure (header/content shell) combined with behavioral tests; keeps coverage while reducing low-value repetition.

4) src/components/transactions/TransactionsIsland.tsx
•  Decompose responsibilities:
◦  URL state: extract to usePaginationParams() (read/write search params, clamp page, sync replaceState). Simplifies effects and improves reuse.
◦  Modal and delete dialog state: consolidate into a reducer or dedicated hooks (useTransactionModal, useDeleteDialog) to avoid many interdependent useState calls.
◦  Mutation handlers: move toast-wrapped mutations to a service layer or hooks (useCreateTransaction, etc., already exist); wrap success/error toasts in a notifier util to DRY.
•  Performance/API clarity:
◦  Type payloads instead of any in handlers; ensure mutateAsync generics are typed, and errors are narrowed.
◦  useCallback for handler props passed down (onEdit/onDelete/onAdd) to prevent unnecessary child renders.
◦  useMemo for derived values (formInitialValues, uncategorizedId) based on deps.
•  UX/state:
◦  Guard against race conditions when page becomes out-of-range after deletes by refetching or optimistic updates; consider invalidating queries on mutations via react-query instead of manual toasts only.
◦  Consider a Suspense + error boundary approach for loading/error if Astro/React 19 setup allows it, aligning with modern patterns.

5) src/components/transactions/TransactionForm.tsx
•  Adopt react-hook-form + @hookform/resolvers/zod: removes manual state, validation, and error-merging boilerplate; improves performance and accessibility out of the box.
•  Controlled shadcn/ui fields via RHF Controller (Select, MoneyInput, DateTimeInput) with consistent error presentation and aria-* wiring handled centrally.
•  Initialization and updates:
◦  Use RHF reset when initialValues change; avoid useEffect + setState churn.
◦  Derive safeAccounts/safeCategories with useMemo; set default account via RHF defaultValues or effect tied to accounts load.
•  Simplify error handling: remove manual “clear field error on change”; let RHF handle touched/dirty validation; keep a lightweight schema-only mapping for Zod errors.
•  Types and unions: use discriminated union on mode to determine labels and submit text; ensure category_id is a nullable string consistently (avoid "null" sentinel by mapping in the Select adapter).
•  Accessibility: centralize field components that set aria-invalid, aria-describedby consistently; add a form-level error summary for keyboard users when submission fails validation.

If you want, I can apply these refactors incrementally starting with extracting hooks from TransactionsIsland and migrating TransactionForm to react-hook-form.