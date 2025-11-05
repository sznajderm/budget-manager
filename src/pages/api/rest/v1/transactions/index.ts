import type { APIRoute } from "astro";
import { z } from "zod";
import {
  createTransaction,
  TransactionCreateSchema,
  listTransactions,
  TransactionListQuerySchema,
  getTransactionById,
  updateTransaction,
  TransactionUpdateSchema,
  TransactionIdSchema,
  deleteTransaction,
} from "../../../../../lib/services/transaction.service";
import type { TransactionListResponse } from "../../../../../types";
import { parseTransactionIdFromQuery } from "../../../../../lib/utils/postgrest-parser";
import { generateCategorySuggestion } from "../../../../../lib/services/ai-suggestion.service";

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

    if (!("amount_cents" in bodyObj && bodyObj.amount_cents !== undefined)) {
      missingFields.push("amount_cents");
    }
    if (!("transaction_type" in bodyObj && bodyObj.transaction_type !== undefined)) {
      missingFields.push("transaction_type");
    }
    if (!("description" in bodyObj && bodyObj.description !== undefined)) {
      missingFields.push("description");
    }
    if (!("transaction_date" in bodyObj && bodyObj.transaction_date !== undefined)) {
      missingFields.push("transaction_date");
    }
    if (!("account_id" in bodyObj && bodyObj.account_id !== undefined)) {
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

      // If debug mode is enabled, run suggestion synchronously and return diagnostics
      
      const runtime = context.locals?.runtime;

      if (runtime?.env?.AI_SUGGESTION_SYNC_MODE === "true") {
        const { generateCategorySuggestionDebug } = await import("../../../../../lib/services/ai-suggestion.service");
        const debugResult = await generateCategorySuggestionDebug(
          supabase,
          {
            id: newTransaction.id,
            description: newTransaction.description,
            amount_cents: newTransaction.amount_cents,
            transaction_type: newTransaction.transaction_type,
          },
          user.id,
          { performInsert: true }
        );

        return new Response(JSON.stringify({ transaction: newTransaction, debug: debugResult }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        const bgTask = (async () => {
          try {
            await generateCategorySuggestion(
              supabase,
              {
                id: newTransaction.id,
                description: newTransaction.description,
                amount_cents: newTransaction.amount_cents,
                transaction_type: newTransaction.transaction_type,
              },
              user.id
            );
          } catch (error) {
            console.error("Background AI suggestion generation failed:", {
              transactionId: newTransaction.id,
              userId: user.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })();

        runtime.ctx.waitUntil(bgTask); // Use the actual execution context
      }

      // Return transaction response immediately (don't await AI suggestion)
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
          category_id: validatedData.category_id,
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

    // Parse URL and check if this is a single transaction fetch
    const url = new URL(context.request.url);
    const transactionId = parseTransactionIdFromQuery(url.searchParams);

    // If transaction ID is provided, fetch single transaction
    if (transactionId) {
      try {
        TransactionIdSchema.parse(transactionId);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return new Response(
            JSON.stringify({
              error: "Invalid transaction ID format: must be a valid UUID",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      try {
        const transaction = await getTransactionById(supabase, userId, transactionId);

        if (!transaction) {
          return new Response(JSON.stringify({ error: "Transaction not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(transaction), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Transaction retrieval failed:", {
          userId,
          transactionId,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        return new Response(JSON.stringify({ error: "Failed to retrieve transaction" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Otherwise, fetch paginated list
    const rawParams = {
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
    };

    // Validate query parameters using Zod schema
    let validatedParams;
    try {
      validatedParams = TransactionListQuerySchema.parse(rawParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return new Response(JSON.stringify({ error: `Invalid query parameters: ${errorMessages}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid query parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve transactions using service
    try {
      const result = await listTransactions(supabase, userId, validatedParams);

      // Format response with pagination metadata
      const response: TransactionListResponse = {
        data: result.data,
        meta: {
          total_count: result.total_count,
          limit: validatedParams.limit,
          offset: validatedParams.offset,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Transaction retrieval failed:", {
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
        if (error.message.includes("Failed to retrieve") || error.message.includes("database error")) {
          return new Response(JSON.stringify({ error: "Failed to retrieve transactions" }), {
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
    console.error("Unhandled error in GET /rest/v1/transactions:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async (context) => {
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

    // Extract transaction ID from PostgREST-style query parameter
    const url = new URL(context.request.url);
    const queryParams = url.searchParams;
    const transactionId = parseTransactionIdFromQuery(queryParams);

    if (!transactionId) {
      return new Response(
        JSON.stringify({
          error: "Transaction ID is required in format: ?id=eq.{transaction_id}",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate transaction ID format
    try {
      TransactionIdSchema.parse(transactionId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Invalid transaction ID format: must be a valid UUID",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
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

    // Validate update data using Zod schema
    let validatedData;
    try {
      validatedData = TransactionUpdateSchema.parse(requestBody);
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

    // Update transaction using service
    try {
      const updatedTransaction = await updateTransaction(supabase, user.id, transactionId, validatedData);

      return new Response(JSON.stringify(updatedTransaction), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Transaction update failed:", {
        userId: user.id,
        transactionId,
        updateData: validatedData,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof Error) {
        // Check if it's a not found error
        if (error.message.includes("Transaction not found") || error.message.includes("does not belong to user")) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check if it's a validation error or constraint violation
        if (
          error.message.includes("Validation error") ||
          error.message.includes("cannot be empty") ||
          error.message.includes("Category not found") ||
          error.message.includes("At least one field must be provided")
        ) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 422,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Database constraint violations
        if (
          error.message.includes("Failed to update transaction due to database error") ||
          error.message.includes("Transaction data violates database constraints")
        ) {
          return new Response(JSON.stringify({ error: "Failed to update transaction due to data constraints" }), {
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
    console.error("Unhandled error in PATCH /rest/v1/transactions:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async (context) => {
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

    // Extract transaction ID from PostgREST-style query parameter
    const url = new URL(context.request.url);
    const queryParams = url.searchParams;
    const transactionId = parseTransactionIdFromQuery(queryParams);

    if (!transactionId) {
      return new Response(
        JSON.stringify({
          error: "Transaction ID is required in format: ?id=eq.{transaction_id}",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate transaction ID format
    try {
      TransactionIdSchema.parse(transactionId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Invalid transaction ID format: must be a valid UUID",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Delete transaction using service
    try {
      await deleteTransaction(supabase, user.id, transactionId);

      // Return 204 No Content on successful deletion
      return new Response(null, {
        status: 204,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Transaction deletion failed:", {
        userId: user.id,
        transactionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof Error) {
        // Check if it's a not found error
        if (error.message.includes("Transaction not found") || error.message.includes("does not belong to user")) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check if it's a validation error
        if (error.message.includes("Validation error")) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Database errors
        if (error.message.includes("Failed to delete transaction due to database error")) {
          return new Response(JSON.stringify({ error: "Failed to delete transaction" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Generic server error for unexpected issues
      return new Response(JSON.stringify({ error: "An unexpected error occurred while deleting the transaction" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    // Catch-all for any unhandled errors in the endpoint
    console.error("Unhandled error in DELETE /rest/v1/transactions:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
