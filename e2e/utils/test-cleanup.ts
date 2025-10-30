import { createClient } from '@supabase/supabase-js';

interface CleanupResult {
  deletedUsers: number;
  errors: string[];
}

/**
 * Deletes all users with 'test' in their email and cascades to related records.
 * Uses Supabase service role key for admin operations.
 */
export async function cleanupTestUsers(): Promise<CleanupResult> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const result: CleanupResult = {
    deletedUsers: 0,
    errors: [],
  };

  try {
    // Get all users with 'test' in their email using admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      result.errors.push(`Failed to list users: ${listError.message}`);
      return result;
    }

    if (!users || users.length === 0) {
      return result;
    }

    // Filter test users (case-insensitive)
    const testUsers = users.filter(
      (user) => user.email?.toLowerCase().includes('test')
    );

    // Delete each test user (cascade will handle related records via foreign keys)
    for (const user of testUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(
          user.id
        );

        if (deleteError) {
          result.errors.push(
            `Failed to delete user ${user.email}: ${deleteError.message}`
          );
        } else {
          result.deletedUsers++;
          console.log(`✓ Deleted test user: ${user.email}`);
        }
      } catch (error) {
        result.errors.push(
          `Exception deleting user ${user.email}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * Runs cleanup and logs results.
 * Useful for manual cleanup scripts.
 */
export async function runCleanup() {
  console.log('Starting test user cleanup...');
  const result = await cleanupTestUsers();
  
  console.log(`\nCleanup complete:`);
  console.log(`- Deleted users: ${result.deletedUsers}`);
  
  if (result.errors.length > 0) {
    console.error(`\nErrors encountered:`);
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }
  
  return result;
}
