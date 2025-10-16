import type { APIRoute } from "astro";
import { z } from "zod";
import { createClient } from '@supabase/supabase-js';
import { createTransaction, TransactionCreateSchema } from "../../../../../lib/services/transaction.service";
// import { getAuthenticatedUser, createAuthErrorResponse, AuthenticationError } from "../../../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // For testing purposes, use service role client to bypass RLS
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Create service role client that can bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get Supabase client from context (set by middleware)
    // const supabase = context.locals.supabase;
    
    // if (!supabase) {
    //   return new Response(JSON.stringify({ error: "Supabase client not available" }), {
    //     status: 500,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // // Authenticate user from session
    // let user;
    // try {
    //   user = await getAuthenticatedUser(context.request, supabase);
    // } catch (error) {
    //   if (error instanceof AuthenticationError) {
    //     return createAuthErrorResponse(error);
    //   }
    //   throw error; // Re-throw unexpected errors
    // }

    // For testing, hardcode the user ID from the JWT you were using
    const userId = "59b474a9-8b09-4a80-9046-3bc7c0b482a9";
    const user = { id: userId };

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

    if (!(("amount_cents" in bodyObj) && bodyObj.amount_cents !== undefined)) {
      missingFields.push("amount_cents");
    }
    if (!(("transaction_type" in bodyObj) && bodyObj.transaction_type !== undefined)) {
      missingFields.push("transaction_type");
    }
    if (!(("description" in bodyObj) && bodyObj.description !== undefined)) {
      missingFields.push("description");
    }
    if (!(("transaction_date" in bodyObj) && bodyObj.transaction_date !== undefined)) {
      missingFields.push("transaction_date");
    }
    if (!(("account_id" in bodyObj) && bodyObj.account_id !== undefined)) {
      missingFields.push("account_id");
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
      validatedData = TransactionCreateSchema.parse(bodyObj);
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

    // Create transaction using service
    try {
      const newTransaction = await createTransaction(supabase, user.id, validatedData);

      return new Response(JSON.stringify(newTransaction), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Transaction creation failed:", {
        userId: user.id,
        transactionData: {
          amount_cents: validatedData.amount_cents,
          transaction_type: validatedData.transaction_type,
          description: validatedData.description,
          account_id: validatedData.account_id,
          category_id: validatedData.category_id
        },
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof Error) {
        // Check if it's a validation error or constraint violation
        if (
          error.message.includes("Validation error") ||
          error.message.includes("cannot be empty") ||
          error.message.includes("Account not found") ||
          error.message.includes("Category not found") ||
          error.message.includes("does not belong to user")
        ) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 422,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Database constraint violations
        if (
          error.message.includes("Failed to create transaction due to database error") ||
          error.message.includes("Transaction data violates database constraints")
        ) {
          return new Response(JSON.stringify({ error: "Failed to create transaction due to data constraints" }), {
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
    console.error("Unhandled error in POST /rest/v1/transactions:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};