import SummaryCard from "./SummaryCard";
import { useDashboardDateRange } from "@/hooks/useDashboardDateRange";
import { useSummaries } from "@/hooks/useSummaries";

export default function DashboardSummary() {
  const { range, display, setStartText, setEndText, applyFromText, resetToCurrentMonth, error } =
    useDashboardDateRange();
  const { expense, income } = useSummaries(range);

  return (
    <main className="container mx-auto py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </header>

      <section className="space-y-3 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label htmlFor="start-date" className="text-sm font-medium">
              From (DD/MM/YYYY HH:mm)
            </label>
            <input
              id="start-date"
              type="text"
              className="border rounded px-3 py-2"
              value={display.startText}
              onChange={(e) => setStartText(e.target.value)}
              placeholder="DD/MM/YYYY HH:mm"
              aria-invalid={!!error}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="end-date" className="text-sm font-medium">
              To (DD/MM/YYYY HH:mm)
            </label>
            <input
              id="end-date"
              type="text"
              className="border rounded px-3 py-2"
              value={display.endText}
              onChange={(e) => setEndText(e.target.value)}
              placeholder="DD/MM/YYYY HH:mm"
              aria-invalid={!!error}
            />
          </div>
          <button
            className="h-10 px-4 rounded bg-primary text-primary-foreground hover:bg-primary/90"
            type="button"
            onClick={applyFromText}
          >
            Apply
          </button>
          <button
            className="h-10 px-4 rounded border hover:bg-accent hover:text-accent-foreground"
            type="button"
            onClick={resetToCurrentMonth}
          >
            Reset to Current Month
          </button>
        </div>
        {error && (
          <div role="alert" className="text-red-600 text-sm" aria-live="polite">
            {error}
          </div>
        )}
      </section>

      <section aria-label="Summary cards" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard
          title="Total Expenses"
          kind="expense"
          data={expense.data}
          isLoading={expense.isLoading || expense.isFetching}
          error={expense.isError ? (expense.error as Error).message : undefined}
          onRetry={() => expense.refetch()}
        />
        <SummaryCard
          title="Total Income"
          kind="income"
          data={income.data}
          isLoading={income.isLoading || income.isFetching}
          error={income.isError ? (income.error as Error).message : undefined}
          onRetry={() => income.refetch()}
        />
      </section>
      {/* Optional RecentTransactions here; call invalidateAll() on mutation success */}
    </main>
  );
}
