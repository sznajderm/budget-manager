import type { SupabaseClient } from '../../db/supabase.client'
import type { CategoryDTO, CategoryCreateCommand } from '../../types'

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
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .ilike('name', command.name.trim())
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" which is expected when no duplicate exists
    console.error('Error checking for existing category:', checkError)
    throw new Error('Failed to validate category uniqueness')
  }

  if (existingCategory) {
    throw new Error('Category name already exists for this user')
  }

  // Insert category into database
  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: command.name
    })
    .select('id, name, created_at, updated_at')
    .single()

  if (error) {
    // Handle unique constraint violation for duplicate category names
    if (error.code === '23505' && error.message.includes('categories_unique_name_per_user')) {
      throw new Error('Category name already exists for this user')
    }
    
    // Log the actual error for debugging while throwing a generic message
    console.error('Database error creating category:', error)
    throw new Error('Failed to create category')
  }

  if (!data) {
    throw new Error('No data returned from category creation')
  }

  // Return CategoryDTO format (excluding user_id)
  return {
    id: data.id,
    name: data.name,
    created_at: data.created_at,
    updated_at: data.updated_at
  } as CategoryDTO
}