import type { APIRoute } from "astro";
import { z } from "zod";
import { 
  getExpenseSummary,
  SummaryCommandSchema
} from "../../../../../lib/services/expense-summary.service";

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

    if (!("start_date" in bodyObj) || bodyObj.start_date === undefined) {
      missingFields.push("start_date");
    }
    if (!("end_date" in bodyObj) || bodyObj.end_date === undefined) {
      missingFields.push("end_date");
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
      validatedData = SummaryCommandSchema.parse(bodyObj);
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

    // Get expense summary using service
    try {
      const summary = await getExpenseSummary(supabase, user.id, validatedData);

      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Expense summary retrieval failed:", {
        userId: user.id,
        summaryData: {
          start_date: validatedData.start_date,
          end_date: validatedData.end_date
        },
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof Error) {
        // Check if it's a validation error
        if (error.message.includes("Validation error")) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 422,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Database-related errors
        if (
          error.message.includes("Failed to retrieve expense summary") ||
          error.message.includes("database error")
        ) {
          return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
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
    console.error("Unhandled error in POST /rest/v1/rpc/get_expense_summary:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};