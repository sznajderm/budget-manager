import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SummaryCard from "./SummaryCard";
import type { SummaryCardProps, SummaryVM } from "./types";

describe("SummaryCard", () => {
  const mockOnRetry = vi.fn();

  const createMockData = (overrides?: Partial<SummaryVM>): SummaryVM => ({
    kind: "expense",
    totalCents: 123456,
    totalFormatted: "$1,234.56",
    transactionCount: 42,
    periodStartISO: "2025-01-01T00:00:00Z",
    periodEndISO: "2025-01-31T23:59:59Z",
    ...overrides,
  });

  const renderSummaryCard = (props: Partial<SummaryCardProps> = {}) => {
    const defaultProps: SummaryCardProps = {
      title: "Test Summary",
      kind: "expense",
      ...props,
    };
    return render(<SummaryCard {...defaultProps} />);
  };

  describe("Visual Styling", () => {
    it("should apply red styling for expense cards", () => {
      const { container } = renderSummaryCard({
        kind: "expense",
        data: createMockData(),
      });

      const card = container.querySelector('[class*="border-red-200"]');
      expect(card).toBeInTheDocument();

      const amount = screen.getByText("$1,234.56");
      expect(amount).toHaveClass("text-red-600");
    });

    it("should apply green styling for income cards", () => {
      const { container } = renderSummaryCard({
        kind: "income",
        data: createMockData({ kind: "income" }),
      });

      const card = container.querySelector('[class*="border-emerald-200"]');
      expect(card).toBeInTheDocument();

      const amount = screen.getByText("$1,234.56");
      expect(amount).toHaveClass("text-emerald-600");
    });
  });

  describe("Loading State", () => {
    it("should render skeleton loaders when isLoading is true", () => {
      const { container } = renderSummaryCard({ isLoading: true });

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should have aria-busy attribute when loading", () => {
      const { container } = renderSummaryCard({ isLoading: true });

      const card = container.querySelector('[aria-busy="true"]');
      expect(card).toBeInTheDocument();
    });

    it("should not show data when loading", () => {
      renderSummaryCard({
        isLoading: true,
        data: createMockData(),
      });

      expect(screen.queryByText("$1,234.56")).not.toBeInTheDocument();
      expect(screen.queryByText(/transactions/)).not.toBeInTheDocument();
    });

    it("should not show error when loading", () => {
      renderSummaryCard({
        isLoading: true,
        error: "Some error",
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should render error message in alert when error is provided", () => {
      renderSummaryCard({ error: "Failed to fetch data" });

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Failed to fetch data");
    });

    it("should render retry button when error and onRetry provided", () => {
      renderSummaryCard({
        error: "Network error",
        onRetry: mockOnRetry,
      });

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it("should not render retry button when error present but onRetry not provided", () => {
      renderSummaryCard({
        error: "Network error",
        onRetry: undefined,
      });

      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    });

    it("should call onRetry when retry button clicked", async () => {
      const user = userEvent.setup();
      renderSummaryCard({
        error: "API timeout",
        onRetry: mockOnRetry,
      });

      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it("should not show data when error is present", () => {
      renderSummaryCard({
        error: "Some error",
        data: createMockData(),
      });

      expect(screen.queryByText("$1,234.56")).not.toBeInTheDocument();
      expect(screen.queryByText(/transactions/)).not.toBeInTheDocument();
    });

    it("should prioritize loading over error state", () => {
      renderSummaryCard({
        isLoading: true,
        error: "Some error",
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Data Display", () => {
    it("should render formatted total amount", () => {
      renderSummaryCard({
        data: createMockData({ totalFormatted: "$9,876.54" }),
      });

      expect(screen.getByText("$9,876.54")).toBeInTheDocument();
    });

    it("should render transaction count with proper label", () => {
      renderSummaryCard({
        data: createMockData({ transactionCount: 15 }),
      });

      expect(screen.getByText("15 transactions")).toBeInTheDocument();
    });

    it("should have aria-live attribute for amount updates", () => {
      renderSummaryCard({
        data: createMockData(),
      });

      const amount = screen.getByText("$1,234.56");
      expect(amount).toHaveAttribute("aria-live", "polite");
    });

    it("should render title in card header", () => {
      renderSummaryCard({
        title: "Monthly Expenses",
        data: createMockData(),
      });

      expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it('should render "No data" when data is undefined', () => {
      renderSummaryCard({ data: undefined });

      expect(screen.getByText("No data")).toBeInTheDocument();
    });

    it("should not render data sections in empty state", () => {
      renderSummaryCard({ data: undefined });

      expect(screen.queryByText(/transactions/)).not.toBeInTheDocument();
    });

    it("should not render error or loading in empty state", () => {
      renderSummaryCard({ data: undefined });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      const { container } = renderSummaryCard({ data: undefined });
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBe(0);
    });
  });

  describe("Edge Cases - Transaction Counts", () => {
    it("should handle zero transactions", () => {
      renderSummaryCard({
        data: createMockData({ transactionCount: 0, totalFormatted: "$0.00" }),
      });

      expect(screen.getByText("0 transactions")).toBeInTheDocument();
      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("should handle single transaction", () => {
      renderSummaryCard({
        data: createMockData({ transactionCount: 1 }),
      });

      expect(screen.getByText("1 transactions")).toBeInTheDocument();
    });

    it("should handle large transaction counts", () => {
      renderSummaryCard({
        data: createMockData({ transactionCount: 99999 }),
      });

      expect(screen.getByText("99999 transactions")).toBeInTheDocument();
    });
  });

  describe("Edge Cases - Amount Formatting", () => {
    it("should handle zero amount", () => {
      renderSummaryCard({
        data: createMockData({ totalFormatted: "$0.00", totalCents: 0 }),
      });

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("should handle negative amounts", () => {
      renderSummaryCard({
        data: createMockData({ totalFormatted: "-$500.00", totalCents: -50000 }),
      });

      expect(screen.getByText("-$500.00")).toBeInTheDocument();
    });

    it("should handle large amounts", () => {
      renderSummaryCard({
        data: createMockData({ totalFormatted: "$1,234,567.89", totalCents: 123456789 }),
      });

      expect(screen.getByText("$1,234,567.89")).toBeInTheDocument();
    });

    it("should handle amounts without decimals", () => {
      renderSummaryCard({
        data: createMockData({ totalFormatted: "$100", totalCents: 10000 }),
      });

      expect(screen.getByText("$100")).toBeInTheDocument();
    });
  });

  describe("State Priority", () => {
    it("should prioritize loading over all other states", () => {
      renderSummaryCard({
        isLoading: true,
        error: "Error message",
        data: createMockData(),
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText("$1,234.56")).not.toBeInTheDocument();
    });

    it("should prioritize error over data state", () => {
      renderSummaryCard({
        error: "Error message",
        data: createMockData(),
      });

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Error message");
      expect(screen.queryByText("$1,234.56")).not.toBeInTheDocument();
    });

    it("should prioritize data over empty state", () => {
      renderSummaryCard({
        data: createMockData(),
      });

      expect(screen.getByText("$1,234.56")).toBeInTheDocument();
      expect(screen.queryByText("No data")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper card structure with header and content", () => {
      renderSummaryCard({
        title: "Test Card",
        data: createMockData(),
      });

      expect(screen.getByText("Test Card")).toBeInTheDocument();
    });

    it('should have role="alert" on error messages', () => {
      renderSummaryCard({ error: "Test error" });

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should have aria-busy when loading", () => {
      const { container } = renderSummaryCard({ isLoading: true });

      const busyElement = container.querySelector('[aria-busy="true"]');
      expect(busyElement).toBeInTheDocument();
    });

    it("should not have aria-busy when not loading", () => {
      const { container } = renderSummaryCard({ isLoading: false });

      const busyElement = container.querySelector('[aria-busy="true"]');
      expect(busyElement).not.toBeInTheDocument();
    });
  });

  describe("Title Customization", () => {
    it("should render custom title for expenses", () => {
      renderSummaryCard({
        title: "Monthly Expenses",
        kind: "expense",
      });

      expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
    });

    it("should render custom title for income", () => {
      renderSummaryCard({
        title: "Total Revenue",
        kind: "income",
      });

      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    });

    it("should handle empty title", () => {
      renderSummaryCard({
        title: "",
        data: createMockData(),
      });

      expect(screen.getByText("$1,234.56")).toBeInTheDocument();
    });
  });
});
