import { z } from "zod";
import type { TransactionDTO, TransactionCreateCommand, TransactionUpdateCommand } from "@/types";
import { parseUIDate } from "@/lib/utils/datetime";

export type UUID = string;

// DTO types (re-exported for convenience)
export type { TransactionDTO } from "@/types";

export interface TransactionListResponse {
  data: TransactionDTO[];
  meta: { total_count: number; limit: number; offset: number };
}

export interface AccountOption {
  id: UUID;
  name: string;
}

export interface CategoryOption {
  id: UUID;
  name: string;
}

// ViewModel for rendering
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

// Form types
export interface TransactionFormValues {
  amount_dollars: string;
  transaction_type: "income" | "expense";
  transaction_date_input: string; // DD/MM/YYYY HH:mm
  account_id: string;
  category_id: string | null;
  description: string;
}

export type FieldErrorMap = Record<string, string | undefined>;

// Zod validation schema for form
export const amountDollarsRegex = /^\d{1,9}(?:\.\d{1,2})?$/;

export const TransactionFormSchema = z.object({
  amount_dollars: z
    .string()
    .regex(amountDollarsRegex, "Enter a valid amount (max 2 decimals)")
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
  transaction_type: z.enum(["income", "expense"]),
  transaction_date_input: z
    .string()
    .min(1, "Date/time is required")
    .refine((v) => parseUIDate(v) !== null, "Invalid date format. Use DD/MM/YYYY HH:mm"),
  account_id: z.string().uuid("Select an account"),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1, "Description is required").max(255, "Max 255 characters"),
});

export type ValidatedTransactionForm = z.infer<typeof TransactionFormSchema>;

// Payload types for API calls
export type TransactionCreatePayload = TransactionCreateCommand;
export type TransactionUpdatePayload = TransactionUpdateCommand;
