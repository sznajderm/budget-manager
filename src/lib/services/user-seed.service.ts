import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Default categories to be created for new users
 */
const DEFAULT_CATEGORIES = [
  "Salary",
  "Rent",
  "Utilities",
  "Groceries",
  "Transportation",
  "Healthcare",
  "Debt Payments",
  "Savings",
  "Investments",
  "Entertainment",
  "Personal Care",
  "Dining Out",
  "Education",
  "Insurance",
  "Charity",
  "Clothing",
] as const;

/**
 * Seeds initial data for a newly created user:
 * - Creates a default "Basic account" checking account
 * - Creates default expense/income categories
 *
 * @param supabase - Supabase client with user session
 * @param userId - User ID from authenticated session
 * @throws Error if seeding fails
 */
export async function seedNewUser(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    // Create default account
    const { error: accountError } = await supabase.from("accounts").insert({
      user_id: userId,
      name: "Basic account",
      account_type: "checking",
    });

    if (accountError) {
      console.error("Failed to create default account:", accountError);
      throw new Error("Failed to create default account for new user");
    }

    // Create default categories
    const categoriesData = DEFAULT_CATEGORIES.map((name) => ({
      user_id: userId,
      name,
    }));

    const { error: categoriesError } = await supabase.from("categories").insert(categoriesData);

    if (categoriesError) {
      console.error("Failed to create default categories:", categoriesError);
      throw new Error("Failed to create default categories for new user");
    }

    console.log(`Successfully seeded data for user ${userId}`);
  } catch (error) {
    console.error("Error seeding new user data:", error);
    throw error;
  }
}
