import { z } from "zod";

export type SummaryKind = "expense" | "income";

export interface DateRange {
  startISO: string; // ISO string (UTC)
  endISO: string; // ISO string (UTC), inclusive boundary ensured
}

export interface DashboardQueryParams {
  start?: string; // ISO
  end?: string; // ISO
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

// Zod schemas for validation
export const isoStringSchema = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: "Invalid ISO date-time.",
});

export const summaryCommandSchema = z
  .object({ start_date: isoStringSchema, end_date: isoStringSchema })
  .refine(({ start_date, end_date }) => new Date(start_date).getTime() <= new Date(end_date).getTime(), {
    message: "Start must be before or equal to end.",
  });

export const dateRangeSchema = z
  .object({ startISO: isoStringSchema, endISO: isoStringSchema })
  .refine(({ startISO, endISO }) => new Date(startISO).getTime() <= new Date(endISO).getTime(), {
    message: "Start must be before or equal to end.",
  });
