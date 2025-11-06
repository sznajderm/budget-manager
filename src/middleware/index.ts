import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../lib/supabase.server";
import { getUserFromRequest } from "../lib/auth/session.server";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/callback",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/recover",
];

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { locals, cookies, url, request, redirect } = ctx;

  // Attempt to capture Cloudflare waitUntil from platform and expose via locals.runtime
  try {
    const platformAny = (ctx as unknown as Record<string, unknown>)?.platform;
    const cfWaitUntil: ((p: Promise<unknown>) => void) | undefined =
      platformAny?.context?.waitUntil || platformAny?.waitUntil;
    if (cfWaitUntil) {
      locals.runtime = {
        ...(locals.runtime as Record<string, unknown>),
        waitUntil: cfWaitUntil,
      } as typeof locals.runtime;
    }
  } catch {
    // ignore
  }

  // Create per-request Supabase instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store Supabase instance in locals for use in pages/endpoints
  locals.supabase = supabase;

  // Get authenticated user
  const user = await getUserFromRequest(supabase);

  if (user) {
    locals.user = user;
  }

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname.startsWith(path));

  // Redirect unauthenticated users to login for protected routes
  if (!user && !isPublicPath) {
    return redirect("/login");
  }

  // Redirect authenticated users away from auth pages
  if (user && (url.pathname === "/login" || url.pathname === "/signup")) {
    return redirect("/dashboard");
  }

  return next();
});
