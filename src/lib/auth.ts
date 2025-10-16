import type { SupabaseClient } from "../db/supabase.client";

/**
 * Authentication error types
 */
export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Authenticated user information
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Extracts and validates user from Supabase session
 * @param request - Request object containing Authorization header
 * @param supabase - Supabase client from context.locals
 * @returns Promise<AuthenticatedUser> - Authenticated user information
 * @throws AuthenticationError - When authentication fails
 */
export async function getAuthenticatedUser(
  request: Request,
  supabase: SupabaseClient
): Promise<AuthenticatedUser> {
  // Extract Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthenticationError("Missing Authorization header");
  }

  // Check if it's a Bearer token
  if (!authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("Invalid Authorization header format. Expected: Bearer <token>");
  }

  // Extract the JWT token
  const token = authHeader.substring(7);
  if (!token) {
    throw new AuthenticationError("Missing JWT token in Authorization header");
  }

  try {
    // Set the session with the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Supabase auth error:", error);
      throw new AuthenticationError("Invalid or expired token");
    }

    if (!user) {
      throw new AuthenticationError("No user found for provided token");
    }

    // Return authenticated user information
    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    // Log unexpected errors
    console.error("Unexpected error during authentication:", error);
    throw new AuthenticationError("Authentication failed due to server error", 500);
  }
}

/**
 * Creates an error response for authentication failures
 * @param error - AuthenticationError instance
 * @returns Response object with appropriate status and error message
 */
export function createAuthErrorResponse(error: AuthenticationError): Response {
  return new Response(
    JSON.stringify({ 
      error: error.message,
      ...(error.statusCode >= 500 ? { details: "Please try again later" } : {})
    }),
    {
      status: error.statusCode,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Validates that an account belongs to the specified user
 * @param supabase - Supabase client
 * @param accountId - Account ID to validate
 * @param userId - User ID to check ownership against
 * @returns Promise<boolean> - True if account belongs to user
 */
export async function validateAccountOwnership(
  supabase: SupabaseClient,
  accountId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  return !error && !!data;
}

/**
 * Validates that a category belongs to the specified user
 * @param supabase - Supabase client
 * @param categoryId - Category ID to validate
 * @param userId - User ID to check ownership against
 * @returns Promise<boolean> - True if category belongs to user
 */
export async function validateCategoryOwnership(
  supabase: SupabaseClient,
  categoryId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .single();

  return !error && !!data;
}
