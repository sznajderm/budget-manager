import { z } from "zod";
import type { SupabaseClient } from "../../db/supabase.client";
import type { CategoryDTO, CategoryCreateCommand, CategoryListResponse } from "../../types";

// Validation schema for list categories query parameters
export const CategoryListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  order: z
    .string()
    .regex(/^(created_at|updated_at|name)\.(asc|desc)$/)
    .default("created_at.desc")
    .optional(),
});

export type ValidatedCategoryListQuery = z.infer<typeof CategoryListQuerySchema>;

/**
 * Creates a new category for the specified user.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param command - Category creation data
 * @returns Created category as CategoryDTO (without user_id)
 * @throws Error if category name already exists for user or database operation fails
 */
export async function createCategory(
  supabase: SupabaseClient,
  userId: string,
  command: CategoryCreateCommand
): Promise<CategoryDTO> {
  // Check for existing category with same name (case-insensitive)
  const { data: existingCategory, error: checkError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", command.name.trim())
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 is "no rows returned" which is expected when no duplicate exists
    console.error("Error checking for existing category:", checkError);
    throw new Error("Failed to validate category uniqueness");
  }

  if (existingCategory) {
    throw new Error("Category name already exists for this user");
  }

  // Insert category into database
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: command.name,
    })
    .select("id, name, created_at, updated_at")
    .single();

  if (error) {
    // Handle unique constraint violation for duplicate category names
    if (error.code === "23505" && error.message.includes("categories_unique_name_per_user")) {
      throw new Error("Category name already exists for this user");
    }

    // Log the actual error for debugging while throwing a generic message
    console.error("Database error creating category:", error);
    throw new Error("Failed to create category");
  }

  if (!data) {
    throw new Error("No data returned from category creation");
  }

  // Return CategoryDTO format (excluding user_id)
  return {
    id: data.id,
    name: data.name,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as CategoryDTO;
}

/**
 * Lists all categories for the authenticated user with pagination and sorting.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param queryParams - Validated query parameters for pagination and sorting
 * @returns List of categories with pagination metadata
 * @throws Error if database operation fails
 */
export async function listCategories(
  supabase: SupabaseClient,
  userId: string,
  queryParams: ValidatedCategoryListQuery
): Promise<CategoryListResponse> {
  const { limit, offset, order } = queryParams;

  // Parse order parameter to extract field and direction
  const orderStr = order || "created_at.desc";
  const [orderField, orderDirection] = orderStr.split(".") as [string, "asc" | "desc"];
  const ascending = orderDirection === "asc";

  try {
    // Query total count
    const { count, error: countError } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error("Database error counting categories:", countError);
      throw new Error("Failed to count categories due to database error");
    }

    // Query categories with pagination and sorting
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, created_at, updated_at")
      .eq("user_id", userId)
      .order(orderField, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Database error fetching categories:", error);
      throw new Error("Failed to retrieve categories due to database error");
    }

    // Format response - map data to CategoryDTO format
    const categories: CategoryDTO[] = (data || []).map((category) => ({
      id: category.id,
      name: category.name,
      created_at: category.created_at,
      updated_at: category.updated_at,
    }));

    return {
      data: categories,
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
    console.error("Unexpected error in listCategories:", error);
    throw new Error("An unexpected error occurred while fetching categories");
  }
}
