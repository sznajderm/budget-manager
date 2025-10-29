import type { APIRoute } from "astro";
import { z } from "zod";
import { 
  createAccount, 
  AccountCreateSchema,
  listAccounts,
  AccountListQuerySchema
} from "../../../../../lib/services/account.service";
import type { AccountListResponse } from "../../../../../types";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Get Supabase client from context (set by middleware)
    const supabase = context.locals.supabase;
    
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase client not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get authenticated user from context (set by middleware)
    const user = context.locals.user;
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
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
      const newAccount = await createAccount(supabase, user.id, validatedData);

      return new Response(JSON.stringify(newAccount), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Account creation failed:", {
        userId: user.id,
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

export const GET: APIRoute = async (context) => {
  try {
    // Get Supabase client from context (set by middleware)
    const supabase = context.locals.supabase;
    
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase client not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get authenticated user from context (set by middleware)
    const user = context.locals.user;
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    
    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const rawParams = {
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined
    };

    // Validate query parameters using Zod schema
    let validatedParams;
    try {
      validatedParams = AccountListQuerySchema.parse(rawParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ 
          error: "Invalid query parameters",
          details: error.errors
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid query parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve accounts using service
    try {
      const response: AccountListResponse = await listAccounts(supabase, userId, validatedParams);

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Account retrieval failed:", {
        userId,
        queryParams: validatedParams,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof Error) {
        // Check if it's a validation error
        if (error.message.includes("Validation error")) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Database-related errors
        if (
          error.message.includes("Failed to retrieve") ||
          error.message.includes("database error")
        ) {
          return new Response(JSON.stringify({ error: "Failed to retrieve accounts" }), {
            status: 500,
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
    console.error("Unhandled error in GET /rest/v1/accounts:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
