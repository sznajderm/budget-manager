import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../lib/supabase.server";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out - this clears the session cookies
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      return new Response(JSON.stringify({ error: "Nie udało się wylogować." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success - session cleared
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Unhandled error in POST /api/auth/logout:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
