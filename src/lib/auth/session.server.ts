import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

export interface User {
  id: string;
  email?: string;
}

export class AuthenticationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Gets authenticated user from Supabase session.
 * Supports both Bearer token (Authorization header) and cookie-based sessions.
 * Returns null if no valid session found.
 */
export async function getUserFromRequest(supabase: SupabaseClient<Database>): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

/**
 * Requires authenticated user or throws AuthenticationError.
 * Use this in API endpoints that must have an authenticated user.
 */
export async function requireUser(supabase: SupabaseClient<Database>): Promise<User> {
  const user = await getUserFromRequest(supabase);

  if (!user) {
    throw new AuthenticationError("Unauthorized");
  }

  return user;
}
