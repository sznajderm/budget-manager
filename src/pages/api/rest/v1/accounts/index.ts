import type { APIRoute } from "astro";
import { z } from "zod";
import { createAccount, AccountCreateSchema } from "../../../../../lib/services/account.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Get Supabase client from context
    const supabase = context.locals.supabase;

    // Skip authorization - get first user from database for development
    const { data: users, error: userError } = await supabase.from("accounts").select("user_id").limit(1);

    let userId: string;

    if (userError || !users || users.length === 0) {
      // If no users exist in accounts table, create a dummy UUID for development
      userId = "00000000-0000-0000-0000-000000000000";
    } else {
      userId = users[0].user_id;
    }

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body structure
    if (!requestBody || typeof requestBody !== "object") {
      return new Response(JSON.stringify({ error: "Request body must be a JSON object" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate required fields are present
    const bodyObj = requestBody as Record<string, unknown>;
    const missingFields: string[] = [];

    if (!("name" in bodyObj) || bodyObj.name === undefined) {
      missingFields.push("name");
    }
    if (!("account_type" in bodyObj) || bodyObj.account_type === undefined) {
      missingFields.push("account_type");
    }

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Missing required fields: ${missingFields.join(", ")}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate input using Zod schema
    let validatedData;
    try {
      validatedData = AccountCreateSchema.parse(bodyObj);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((e) => e.message).join(", ");
        return new Response(JSON.stringify({ error: errorMessages }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Fallback for unexpected validation errors
      return new Response(JSON.stringify({ error: "Invalid input data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create account using service
    try {
      const newAccount = await createAccount(supabase, userId, validatedData);

      return new Response(JSON.stringify(newAccount), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Account creation failed:", {
        userId,
        accountData: { name: validatedData.name, account_type: validatedData.account_type },
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof Error) {
        // Check if it's a validation error or constraint violation
        if (
          error.message.includes("Validation error") ||
          error.message.includes("cannot be empty") ||
          error.message.includes("already exists")
        ) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 422,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Database constraint violations
        if (
          error.message.includes("Failed to create account due to constraint violation") ||
          error.message.includes("Failed to create account due to database error")
        ) {
          return new Response(JSON.stringify({ error: "Failed to create account due to constraint violation" }), {
            status: 422,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Generic server error for unexpected issues
      return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    // Catch-all for any unhandled errors in the endpoint
    console.error("Unhandled error in POST /rest/v1/accounts:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
