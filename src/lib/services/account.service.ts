import { z } from "zod";
import type { SupabaseClient } from "../../db/supabase.client";
import type { AccountDTO, AccountType } from "../../types";

// Validation schema for account creation
export const AccountCreateSchema = z.object({
  name: z.string().trim().min(1, "Account name cannot be empty"),
  account_type: z.enum(["checking", "savings", "credit_card", "cash", "investment"], {
    errorMap: () => ({
      message: "Invalid account_type. Must be one of: checking, savings, credit_card, cash, investment",
    }),
  }),
});

export type ValidatedAccountCreateCommand = z.infer<typeof AccountCreateSchema>;

/**
 * Creates a new account for the authenticated user
 * @param supabase - Supabase client with user session
 * @param userId - User ID from authenticated session
 * @param accountData - Validated account creation data
 * @returns Promise<AccountDTO> - The created account without internal fields
 */
export async function createAccount(
  supabase: SupabaseClient,
  userId: string,
  accountData: ValidatedAccountCreateCommand
): Promise<AccountDTO> {
  // Validate input data
  const validatedData = AccountCreateSchema.parse(accountData);

  try {
    // Insert account into database
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        name: validatedData.name,
        account_type: validatedData.account_type,
        user_id: userId,
      })
      .select("id, name, account_type, created_at, updated_at")
      .single();

    if (error) {
      console.error("Database error creating account:", error);

      // Handle specific database constraint violations
      if (error.code === "23505") {
        // unique violation
        throw new Error("Account with this name already exists");
      }
      if (error.code === "23503") {
        // foreign key violation
        throw new Error("Invalid user ID");
      }
      if (error.code === "23514") {
        // check constraint violation
        throw new Error("Account name cannot be empty");
      }

      throw new Error("Failed to create account due to database error");
    }

    if (!data) {
      throw new Error("Account creation failed - no data returned");
    }

    // Return AccountDTO (excludes user_id and deleted_at)
    return {
      id: data.id,
      name: data.name,
      account_type: data.account_type as AccountType,
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
    console.error("Unexpected error in createAccount:", error);
    throw new Error("An unexpected error occurred while creating the account");
  }
}
