import { z } from "zod";
import type { SupabaseClient } from "../../db/supabase.client";
import type { AccountDTO, AccountType, AccountListResponse } from "../../types";

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

// Validation schema for list accounts query parameters
export const AccountListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ValidatedAccountListQuery = z.infer<typeof AccountListQuerySchema>;

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

/**
 * Lists all active accounts for the authenticated user with pagination
 * @param supabase - Supabase client with user session
 * @param userId - User ID from authenticated session
 * @param queryParams - Validated query parameters for pagination
 * @returns Promise<AccountListResponse> - List of accounts with pagination metadata
 */
export async function listAccounts(
  supabase: SupabaseClient,
  userId: string,
  queryParams: ValidatedAccountListQuery
): Promise<AccountListResponse> {
  const { limit, offset } = queryParams;

  try {
    // Query accounts with pagination
    const { data, error } = await supabase
      .from("accounts")
      .select("id, name, account_type, created_at, updated_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Database error fetching accounts:", error);
      throw new Error("Failed to retrieve accounts due to database error");
    }

    // Query total count
    const { count, error: countError } = await supabase
      .from("accounts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (countError) {
      console.error("Database error counting accounts:", countError);
      throw new Error("Failed to count accounts due to database error");
    }

    // Format response
    const accounts: AccountDTO[] = (data || []).map((account) => ({
      id: account.id,
      name: account.name,
      account_type: account.account_type as AccountType,
      created_at: account.created_at,
      updated_at: account.updated_at,
    }));

    return {
      data: accounts,
      meta: {
        total_count: count || 0,
        limit,
        offset,
      },
    };
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unexpected errors
    console.error("Unexpected error in listAccounts:", error);
    throw new Error("An unexpected error occurred while fetching accounts");
  }
}
