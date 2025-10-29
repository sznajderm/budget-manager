import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardSummary from './DashboardSummary';
import { useDashboardDateRange } from '@/hooks/useDashboardDateRange';
import { useSummaries } from '@/hooks/useSummaries';
import type { SummaryVM } from './types';

vi.mock('@/hooks/useDashboardDateRange');
vi.mock('@/hooks/useSummaries');
vi.mock('./SummaryCard', () => ({
  default: ({ title, kind, data, isLoading, error, onRetry }: any) => (
    <div data-testid={`summary-card-${kind}`}>
      <h2>{title}</h2>
      {isLoading && <div>Loading...</div>}
      {error && (
        <div>
          <div role="alert">{error}</div>
          <button onClick={onRetry}>Retry</button>
        </div>
      )}
      {data && (
        <div>
          <div>{data.totalFormatted}</div>
          <div>{data.transactionCount} transactions</div>
        </div>
      )}
    </div>
  ),
}));

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('DashboardSummary', () => {
  const mockSetStartText = vi.fn();
  const mockSetEndText = vi.fn();
  const mockApplyFromText = vi.fn();
  const mockResetToCurrentMonth = vi.fn();
  const mockRefetch = vi.fn();

  const defaultDateRangeMock = {
    range: { startISO: '2025-01-01T00:00:00Z', endISO: '2025-01-31T23:59:59Z' },
    display: { startText: '01/01/2025 00:00', endText: '31/01/2025 23:59' },
    setStartText: mockSetStartText,
    setEndText: mockSetEndText,
    applyFromText: mockApplyFromText,
    resetToCurrentMonth: mockResetToCurrentMonth,
    error: undefined,
  };

  const defaultSummariesMock = {
    expense: {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    },
    income: {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboardDateRange).mockReturnValue(defaultDateRangeMock);
    vi.mocked(useSummaries).mockReturnValue(defaultSummariesMock);
  });

  describe('Rendering', () => {
    it('should render dashboard header', () => {
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should render date range inputs with correct labels', () => {
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      expect(screen.getByLabelText(/from \(dd\/mm\/yyyy hh:mm\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to \(dd\/mm\/yyyy hh:mm\)/i)).toBeInTheDocument();
    });

    it('should render apply and reset buttons', () => {
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset to current month/i })).toBeInTheDocument();
    });

    it('should render both summary cards', () => {
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      expect(screen.getByTestId('summary-card-expense')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Total Income')).toBeInTheDocument();
    });
  });

  describe('Date Range Inputs', () => {
    it('should display date values from hook', () => {
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const startInput = screen.getByLabelText(/from \(dd\/mm\/yyyy hh:mm\)/i);
      const endInput = screen.getByLabelText(/to \(dd\/mm\/yyyy hh:mm\)/i);

      expect(startInput).toHaveValue('01/01/2025 00:00');
      expect(endInput).toHaveValue('31/01/2025 23:59');
    });

    it('should call setStartText when start input changes', async () => {
      const user = userEvent.setup();
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const startInput = screen.getByLabelText(/from \(dd\/mm\/yyyy hh:mm\)/i);
      await user.clear(startInput);
      await user.type(startInput, '15/01/2025 12:00');

      expect(mockSetStartText).toHaveBeenCalled();
    });

    it('should call setEndText when end input changes', async () => {
      const user = userEvent.setup();
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const endInput = screen.getByLabelText(/to \(dd\/mm\/yyyy hh:mm\)/i);
      await user.clear(endInput);
      await user.type(endInput, '20/01/2025 18:00');

      expect(mockSetEndText).toHaveBeenCalled();
    });

    it('should mark inputs as invalid when error exists', () => {
      vi.mocked(useDashboardDateRange).mockReturnValue({
        ...defaultDateRangeMock,
        error: 'Invalid date format',
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const startInput = screen.getByLabelText(/from \(dd\/mm\/yyyy hh:mm\)/i);
      const endInput = screen.getByLabelText(/to \(dd\/mm\/yyyy hh:mm\)/i);

      expect(startInput).toHaveAttribute('aria-invalid', 'true');
      expect(endInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when present', () => {
      vi.mocked(useDashboardDateRange).mockReturnValue({
        ...defaultDateRangeMock,
        error: 'Invalid date format',
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Invalid date format');
    });

    it('should not display error section when no error', () => {
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should have aria-live attribute on error element', () => {
      vi.mocked(useDashboardDateRange).mockReturnValue({
        ...defaultDateRangeMock,
        error: 'Start must be before end',
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Button Actions', () => {
    it('should call applyFromText when Apply button is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      expect(mockApplyFromText).toHaveBeenCalledOnce();
    });

    it('should call resetToCurrentMonth when Reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const resetButton = screen.getByRole('button', { name: /reset to current month/i });
      await user.click(resetButton);

      expect(mockResetToCurrentMonth).toHaveBeenCalledOnce();
    });
  });

  describe('Summary Cards Integration', () => {
    it('should pass loading state to expense card', () => {
      vi.mocked(useSummaries).mockReturnValue({
        ...defaultSummariesMock,
        expense: {
          ...defaultSummariesMock.expense,
          isLoading: true,
        },
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const expenseCard = screen.getByTestId('summary-card-expense');
      expect(expenseCard).toHaveTextContent('Loading...');
    });

    it('should pass fetching state to income card', () => {
      vi.mocked(useSummaries).mockReturnValue({
        ...defaultSummariesMock,
        income: {
          ...defaultSummariesMock.income,
          isFetching: true,
        },
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const incomeCard = screen.getByTestId('summary-card-income');
      expect(incomeCard).toHaveTextContent('Loading...');
    });

    it('should pass expense data to expense card', () => {
      const expenseData: SummaryVM = {
        kind: 'expense',
        totalCents: 150000,
        totalFormatted: '$1,500.00',
        transactionCount: 25,
        periodStartISO: '2025-01-01T00:00:00Z',
        periodEndISO: '2025-01-31T23:59:59Z',
      };

      vi.mocked(useSummaries).mockReturnValue({
        ...defaultSummariesMock,
        expense: {
          ...defaultSummariesMock.expense,
          data: expenseData,
        },
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const expenseCard = screen.getByTestId('summary-card-expense');
      expect(expenseCard).toHaveTextContent('$1,500.00');
      expect(expenseCard).toHaveTextContent('25 transactions');
    });

    it('should pass income data to income card', () => {
      const incomeData: SummaryVM = {
        kind: 'income',
        totalCents: 300000,
        totalFormatted: '$3,000.00',
        transactionCount: 10,
        periodStartISO: '2025-01-01T00:00:00Z',
        periodEndISO: '2025-01-31T23:59:59Z',
      };

      vi.mocked(useSummaries).mockReturnValue({
        ...defaultSummariesMock,
        income: {
          ...defaultSummariesMock.income,
          data: incomeData,
        },
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const incomeCard = screen.getByTestId('summary-card-income');
      expect(incomeCard).toHaveTextContent('$3,000.00');
      expect(incomeCard).toHaveTextContent('10 transactions');
    });

    it('should pass error state to expense card', () => {
      vi.mocked(useSummaries).mockReturnValue({
        ...defaultSummariesMock,
        expense: {
          ...defaultSummariesMock.expense,
          isError: true,
          error: new Error('Failed to fetch expenses'),
        },
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const expenseCard = screen.getByTestId('summary-card-expense');
      expect(expenseCard).toHaveTextContent('Failed to fetch expenses');
    });

    it('should wire up refetch callback for expense card', async () => {
      const user = userEvent.setup();
      vi.mocked(useSummaries).mockReturnValue({
        ...defaultSummariesMock,
        expense: {
          ...defaultSummariesMock.expense,
          isError: true,
          error: new Error('Network error'),
        },
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const retryButton = screen.getAllByRole('button', { name: /retry/i })[0];
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledOnce();
    });
  });

  describe('Hook Integration', () => {
    it('should pass date range to useSummaries', () => {
      const customRange = { startISO: '2024-12-01T00:00:00Z', endISO: '2024-12-31T23:59:59Z' };
      vi.mocked(useDashboardDateRange).mockReturnValue({
        ...defaultDateRangeMock,
        range: customRange,
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      expect(useSummaries).toHaveBeenCalledWith(customRange);
    });

    it('should call hooks in correct order', () => {
      const hookCalls: string[] = [];

      vi.mocked(useDashboardDateRange).mockImplementation(() => {
        hookCalls.push('useDashboardDateRange');
        return defaultDateRangeMock;
      });

      vi.mocked(useSummaries).mockImplementation(() => {
        hookCalls.push('useSummaries');
        return defaultSummariesMock;
      });

      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      expect(hookCalls).toEqual(['useDashboardDateRange', 'useSummaries']);
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have aria-label on summary cards section', () => {
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const section = screen.getByLabelText('Summary cards');
      expect(section).toBeInTheDocument();
      expect(section.tagName).toBe('SECTION');
    });

    it('should associate labels with inputs', () => {
      render(<DashboardSummary />, { wrapper: createTestWrapper() });

      const startInput = screen.getByLabelText(/from \(dd\/mm\/yyyy hh:mm\)/i);
      const endInput = screen.getByLabelText(/to \(dd\/mm\/yyyy hh:mm\)/i);

      expect(startInput).toHaveAttribute('id', 'start-date');
      expect(endInput).toHaveAttribute('id', 'end-date');
    });
  });
});
