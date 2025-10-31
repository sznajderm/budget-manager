import { z } from "zod";
import type { SupabaseClient } from "../../db/supabase.client";
import type { SummaryDTO } from "../../types";

// Validation schema for summary command with date range validation
export const SummaryCommandSchema = z
  .object({
    start_date: z.string().datetime("Invalid ISO 8601 timestamp format"),
    end_date: z.string().datetime("Invalid ISO 8601 timestamp format"),
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: "Start date must be before or equal to end date",
  });

export type ValidatedSummaryCommand = z.infer<typeof SummaryCommandSchema>;

/**
 * Gets expense summary for the authenticated user within a specified date range
 * @param supabase - Supabase client with user session
 * @param userId - User ID from authenticated session
 * @param summaryData - Validated summary command with date range
 * @returns Promise<SummaryDTO> - Aggregated expense data with totals and counts
 */
export async function getExpenseSummary(
  supabase: SupabaseClient,
  userId: string,
  summaryData: ValidatedSummaryCommand
): Promise<SummaryDTO> {
  // Validate input data
  const validatedData = SummaryCommandSchema.parse(summaryData);

  try {
    // Query database for expense transactions within date range
    // RLS automatically filters by user_id
    const { data, error } = await supabase
      .from("transactions")
      .select("amount_cents")
      .eq("transaction_type", "expense")
      .eq("user_id", userId)
      .gte("transaction_date", validatedData.start_date)
      .lte("transaction_date", validatedData.end_date);

    if (error) {
      console.error("Database error retrieving expense summary:", error);
      throw new Error("Failed to retrieve expense summary from database");
    }

    // Calculate aggregated values
    const transactions = data || [];
    const total_cents = transactions.reduce((sum, transaction) => sum + (transaction.amount_cents || 0), 0);
    const transaction_count = transactions.length;

    // Return formatted summary
    const summary: SummaryDTO = {
      total_cents,
      transaction_count,
      period_start: validatedData.start_date,
      period_end: validatedData.end_date,
    };

    return summary;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map((e) => e.message).join(", ")}`);
    }

    // Re-throw our custom errors
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unexpected errors
    console.error("Unexpected error in getExpenseSummary:", error);
    throw new Error("An unexpected error occurred while retrieving expense summary");
  }
}
