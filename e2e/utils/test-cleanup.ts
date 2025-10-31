import { createClient } from "@supabase/supabase-js";

interface CleanupResult {
  deletedUsers: number; // kept for backward compatibility with existing callers
  errors: string[];
}

/**
 * Deletes all transactions for a specific user (by ID).
 * Also deletes dependent AI suggestions to satisfy foreign key constraints.
 * Uses Supabase service role key for admin operations.
 */
export async function cleanupTestUsers(): Promise<CleanupResult> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const TARGET_USER_ID = process.env.E2E_USERNAME_ID;
  if (!TARGET_USER_ID) {
    throw new Error("Missing required environment variable: E2E_USERNAME_ID");
  }

  const result: CleanupResult = {
    deletedUsers: 0, // represents number of deleted transactions
    errors: [],
  };

  try {
    // 1) Find all transactions for the target user
    const { data: transactions, error: listTxError } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", TARGET_USER_ID);

    if (listTxError) {
      result.errors.push(`Failed to list transactions: ${listTxError.message}`);
      return result;
    }

    if (!transactions || transactions.length === 0) {
      return result;
    }

    const transactionIds = transactions.map((t) => t.id);

    // 2) Delete dependent AI suggestions referencing these transactions (if any)
    const { error: delSuggestErr } = await supabase
      .from("ai_suggestions")
      .delete()
      .in("transaction_id", transactionIds);

    if (delSuggestErr) {
      result.errors.push(`Failed to delete ai_suggestions: ${delSuggestErr.message}`);
      // continue to attempt deleting transactions regardless
    }

    // 3) Delete transactions for the target user and count how many were deleted
    const { count, error: delTxError } = await supabase
      .from("transactions")
      .delete({ count: "exact" })
      .in("id", transactionIds)
      .select("id");

    if (delTxError) {
      result.errors.push(`Failed to delete transactions: ${delTxError.message}`);
      return result;
    }

    result.deletedUsers = count ?? 0;
    console.log(`✓ Deleted ${result.deletedUsers} transaction(s) for user ${TARGET_USER_ID}`);
  } catch (error) {
    result.errors.push(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Runs cleanup and logs results.
 * Useful for manual cleanup scripts.
 */
export async function runCleanup() {
  console.log("Starting transactions cleanup for target user...");
  const result = await cleanupTestUsers();

  console.log(`\nCleanup complete:`);
  console.log(`- Deleted transactions: ${result.deletedUsers}`);

  if (result.errors.length > 0) {
    console.error(`\nErrors encountered:`);
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }

  return result;
}
