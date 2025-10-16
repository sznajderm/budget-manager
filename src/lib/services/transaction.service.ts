import { z } from "zod";
import type { SupabaseClient } from "../../db/supabase.client";
import type { TransactionType } from "../../types";

// Validation schema for transaction creation
export const TransactionCreateSchema = z.object({
  amount_cents: z.number().int().positive("Amount must be a positive integer in cents"),
  transaction_type: z.enum(["expense", "income"], {
    errorMap: () => ({
      message: "Transaction type must be either 'expense' or 'income'",
    }),
  }),
  description: z.string().trim().min(1, "Description cannot be empty"),
  transaction_date: z.string().datetime("Invalid ISO 8601 timestamp format"),
  account_id: z.string().uuid("Account ID must be a valid UUID"),
  category_id: z.string().uuid("Category ID must be a valid UUID").nullable().optional(),
});

export type ValidatedTransactionCreateCommand = z.infer<typeof TransactionCreateSchema>;

/**
 * Response type for created transaction (without internal user_id field)
 */
export interface TransactionCreateResponse {
  id: string;
  amount_cents: number;
  transaction_type: TransactionType;
  description: string;
  transaction_date: string;
  account_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a new transaction for the authenticated user
 * @param supabase - Supabase client with user session
 * @param userId - User ID from authenticated session
 * @param transactionData - Validated transaction creation data
 * @returns Promise<TransactionCreateResponse> - The created transaction without internal fields
 */
export async function createTransaction(
  supabase: SupabaseClient,
  userId: string,
  transactionData: ValidatedTransactionCreateCommand
): Promise<TransactionCreateResponse> {
  // Validate input data
  const validatedData = TransactionCreateSchema.parse(transactionData);

  try {
    // Validate account ownership
    // const { data: account, error: accountError } = await supabase
    //   .from("accounts")
    //   .select("*")
    //   .eq("id", validatedData.account_id)
    //   .eq("user_id", userId)
    //   .limit(1);

      
    // console.log("userId", userId);
    // console.log("validatedData.account_id", validatedData.account_id);
    // console.log("account", account);
    // console.log("accountError", accountError);

    // if (accountError || !account) {
    //   throw new Error("Account not found or does not belong to user");
    // }

    // // Validate category ownership (if category_id is provided)
    // if (validatedData.category_id) {
    //   const { data: category, error: categoryError } = await supabase
    //     .from("categories")
    //     .select("id")
    //     .eq("id", validatedData.category_id)
    //     .eq("user_id", userId)
    //     .single();

    //   if (categoryError || !category) {
    //     throw new Error("Category not found or does not belong to user");
    //   }
    // }

    // Insert transaction into database
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        amount_cents: validatedData.amount_cents,
        transaction_type: validatedData.transaction_type,
        description: validatedData.description,
        transaction_date: validatedData.transaction_date,
        account_id: validatedData.account_id,
        category_id: validatedData.category_id || null,
        user_id: userId,
      })
      .select("id, amount_cents, transaction_type, description, transaction_date, account_id, category_id, created_at, updated_at")
      .single();

    if (error) {
      console.error("Database error creating transaction:", error);

      // Handle specific database constraint violations
      if (error.code === "23503") {
        // foreign key violation
        if (error.message?.includes("account_id")) {
          throw new Error("Account not found or does not belong to user");
        }
        if (error.message?.includes("category_id")) {
          throw new Error("Category not found or does not belong to user");
        }
        throw new Error("Invalid account or category reference");
      }
      if (error.code === "23514") {
        // check constraint violation
        throw new Error("Transaction data violates database constraints");
      }

      throw new Error("Failed to create transaction due to database error");
    }

    if (!data) {
      throw new Error("Transaction creation failed - no data returned");
    }

    // Return transaction response (excludes user_id)
    return {
      id: data.id,
      amount_cents: data.amount_cents,
      transaction_type: data.transaction_type as TransactionType,
      description: data.description,
      transaction_date: data.transaction_date,
      account_id: data.account_id,
      category_id: data.category_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map((e) => e.message).join(", ")}`);
    }

    // Re-throw our custom errors
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unexpected errors
    console.error("Unexpected error in createTransaction:", error);
    throw new Error("An unexpected error occurred while creating the transaction");
  }
}