import { z } from "zod";
import type { SupabaseClient } from "../../db/supabase.client";
import type { TransactionForSuggestion, AICategorySuggestion, CategoryDTO, ResponseFormat } from "../../types";
import { initOpenRouterService } from "./openrouter.init";
import { listCategories } from "./category.service";
import { OpenRouterError } from "./openrouter.errors";

/**
 * Zod schema for validating AI response structure.
 */
export const CategorySuggestionSchema = z.object({
  suggested_category_id: z.string().uuid("Invalid category ID format"),
  confidence_score: z.number().min(0.0).max(1.0, "Confidence score must be between 0.0 and 1.0"),
  reasoning: z.string(),
});

/**
 * Zod schema for AI suggestion database insert.
 */
export const AISuggestionCreateSchema = z.object({
  transaction_id: z.string().uuid(),
  suggested_category_id: z.string().uuid(),
  confidence_score: z.number().min(0.0).max(1.0),
});

/**
 * Generates an AI-powered category suggestion for a transaction.
 * This function runs asynchronously in the background and does not block.
 *
 * @param supabase - Supabase client instance
 * @param transaction - Transaction details for suggestion
 * @param userId - ID of the user who owns the transaction
 * @returns Promise that resolves when suggestion is created (or fails silently)
 */
export async function generateCategorySuggestion(
  supabase: SupabaseClient,
  transaction: TransactionForSuggestion,
  userId: string
): Promise<void> {
  const startTime = Date.now();

  try {
    // Step 1: Fetch user's categories
    const categoriesResponse = await listCategories(supabase, userId, {
      limit: 50,
      offset: 0,
    });

    // Step 2: Early return if no categories exist
    if (!categoriesResponse.data || categoriesResponse.data.length === 0) {
      console.warn("No categories available for AI suggestion", {
        transactionId: transaction.id,
        userId,
      });
      return;
    }

    const categories = categoriesResponse.data;

    // Step 3: Build AI prompt
    const systemPrompt = buildSystemPrompt(categories);
    const userPrompt = buildUserPrompt(transaction);

    // Step 4: Define response format for structured output
    const responseFormat: ResponseFormat = {
      type: "json_schema",
      json_schema: {
        name: "category_suggestion",
        strict: true,
        schema: {
          type: "object",
          properties: {
            suggested_category_id: {
              type: "string",
              description: "UUID of the suggested category",
            },
            confidence_score: {
              type: "number",
              description: "Confidence score between 0.0 and 1.0",
            },
            reasoning: {
              type: "string",
              description: "Brief explanation of why this category was chosen",
            },
          },
          required: ["suggested_category_id", "confidence_score", "reasoning"],
          additionalProperties: false,
        },
      },
    };

    // Step 5: Call OpenRouter API
    const openRouterService = initOpenRouterService();

    console.log("Calling OpenRouter API for category suggestion", {
      transactionId: transaction.id,
      categoriesCount: categories.length,
      model: import.meta.env.OPENROUTER_DEFAULT_MODEL || "default",
    });

    const model = import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini";

    const aiResponse = await openRouterService.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: responseFormat,
      temperature: 0.3, // Lower temperature for more consistent categorization
      model,
    });

    // Step 6: Parse and validate AI response
    const messageContent = aiResponse.choices[0].message.content;
    let parsedSuggestion: AICategorySuggestion;

    try {
      const rawSuggestion = JSON.parse(messageContent);
      parsedSuggestion = CategorySuggestionSchema.parse(rawSuggestion);
    } catch (error) {
      console.error("Failed to parse AI response", {
        transactionId: transaction.id,
        userId,
        messageContent,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    // Step 7: Validate suggested category exists in user's categories
    const suggestedCategory = categories.find((cat) => cat.id === parsedSuggestion.suggested_category_id);

    if (!suggestedCategory) {
      console.error("AI suggested non-existent category", {
        transactionId: transaction.id,
        userId,
        suggestedCategoryId: parsedSuggestion.suggested_category_id,
        availableCategoryIds: categories.map((c) => c.id),
      });
      return;
    }

    // Step 8: Insert suggestion into database
    const { error: insertError } = await supabase.from("ai_suggestions").insert({
      transaction_id: transaction.id,
      suggested_category_id: parsedSuggestion.suggested_category_id,
      confidence_score: parsedSuggestion.confidence_score,
      approved: null, // Initial state is pending
    });

    if (insertError) {
      // Handle unique constraint violation (duplicate suggestion)
      if (insertError.code === "23505") {
        console.warn("AI suggestion already exists for transaction", {
          transactionId: transaction.id,
          userId,
        });
        return;
      }

      console.error("Failed to insert AI suggestion", {
        transactionId: transaction.id,
        userId,
        error: insertError.message,
        errorCode: insertError.code,
      });
      return;
    }

    // Success logging
    const processingTimeMs = Date.now() - startTime;
    console.log("AI category suggestion generated", {
      transactionId: transaction.id,
      userId,
      suggestedCategoryId: parsedSuggestion.suggested_category_id,
      suggestedCategoryName: suggestedCategory.name,
      confidenceScore: parsedSuggestion.confidence_score,
      processingTimeMs,
    });
  } catch (error) {
    // Catch-all error handler - log but don't throw
    console.error("AI suggestion generation failed", {
      transactionId: transaction.id,
      userId,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorDetails: error,
      stage: "unknown",
    });
  }
}

/**
 * Detailed debug path for AI suggestion generation.
 * Runs the same logic but returns diagnostics (timings, env, request sizes, result) and optionally inserts to DB.
 */
export async function generateCategorySuggestionDebug(
  supabase: SupabaseClient,
  transaction: TransactionForSuggestion,
  userId: string,
  options?: { performInsert?: boolean }
): Promise<{
  env: {
    hasApiKey: boolean;
    apiKeyLength?: number;
    defaultModel?: string;
    baseUrl?: string;
    timeout?: number | string;
    maxRetries?: number | string;
  };
  categories: { count: number };
  request: { model: string; messageCount: number; totalContentLength: number };
  timings: { totalMs: number; categoriesFetchMs: number; chatCallMs?: number };
  chat:
    | { ok: true; model: string; usage: unknown; contentSnippet: string }
    | { ok: false; errorName: string; message: string; code?: string; statusCode?: number; retryable?: boolean };
  dbInsert?: { attempted: boolean; ok?: boolean; error?: string };
}> {
  const t0 = Date.now();
  const env = {
    hasApiKey: !!import.meta.env.OPENROUTER_API_KEY,
    apiKeyLength: import.meta.env.OPENROUTER_API_KEY?.length,
    defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL,
    baseUrl: import.meta.env.OPENROUTER_BASE_URL,
    timeout: import.meta.env.OPENROUTER_TIMEOUT,
    maxRetries: import.meta.env.OPENROUTER_MAX_RETRIES,
  };

  // Fetch categories
  const catStart = Date.now();
  const categoriesResponse = await listCategories(supabase, userId, { limit: 50, offset: 0 });
  const catEnd = Date.now();
  const categories = categoriesResponse.data || [];

  // Build prompts and response format (same as regular path)
  const systemPrompt = buildSystemPrompt(categories);
  const userPrompt = buildUserPrompt(transaction);
  const responseFormat: ResponseFormat = {
    type: "json_schema",
    json_schema: {
      name: "category_suggestion",
      strict: true,
      schema: {
        type: "object",
        properties: {
          suggested_category_id: { type: "string" },
          confidence_score: { type: "number" },
          reasoning: { type: "string" },
        },
        required: ["suggested_category_id", "confidence_score", "reasoning"],
        additionalProperties: false,
      },
    },
  };

  const model = import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini";
  const totalContentLength = (systemPrompt?.length || 0) + (userPrompt?.length || 0);

  // Call OpenRouter
  const openRouterService = initOpenRouterService();
  interface ChatDiagSuccess {
    ok: true;
    model: string;
    usage: unknown;
    contentSnippet: string;
  }
  let chatDiag: ChatDiagSuccess | undefined;
  let chatCallMs: number | undefined;
  try {
    const chatStart = Date.now();
    const aiResponse = await openRouterService.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: responseFormat,
      temperature: 0.3,
      model,
    });
    chatCallMs = Date.now() - chatStart;

    const content = aiResponse.choices?.[0]?.message?.content || "";
    chatDiag = {
      ok: true as const,
      model: aiResponse.model,
      usage: aiResponse.usage,
      contentSnippet: content.slice(0, 200),
    };

    // Optionally insert into DB like regular path
    const performInsert = options?.performInsert !== false;
    if (performInsert) {
      try {
        const parsed = CategorySuggestionSchema.parse(JSON.parse(content));
        const suggestedCategory = categories.find((c) => c.id === parsed.suggested_category_id);
        if (!suggestedCategory) {
          return {
            env,
            categories: { count: categories.length },
            request: { model, messageCount: 2, totalContentLength },
            timings: { totalMs: Date.now() - t0, categoriesFetchMs: catEnd - catStart, chatCallMs },
            chat: {
              ok: false,
              errorName: "ValidationError",
              message: "AI suggested category not found among user's categories",
            },
            dbInsert: { attempted: false },
          };
        }

        const { error: insertError } = await supabase.from("ai_suggestions").insert({
          transaction_id: transaction.id,
          suggested_category_id: parsed.suggested_category_id,
          confidence_score: parsed.confidence_score,
          approved: null,
        });

        if (insertError) {
          return {
            env,
            categories: { count: categories.length },
            request: { model, messageCount: 2, totalContentLength },
            timings: { totalMs: Date.now() - t0, categoriesFetchMs: catEnd - catStart, chatCallMs },
            chat: chatDiag,
            dbInsert: { attempted: true, ok: false, error: insertError.message },
          };
        }

        return {
          env,
          categories: { count: categories.length },
          request: { model, messageCount: 2, totalContentLength },
          timings: { totalMs: Date.now() - t0, categoriesFetchMs: catEnd - catStart, chatCallMs },
          chat: chatDiag,
          dbInsert: { attempted: true, ok: true },
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
          env,
          categories: { count: categories.length },
          request: { model, messageCount: 2, totalContentLength },
          timings: { totalMs: Date.now() - t0, categoriesFetchMs: catEnd - catStart, chatCallMs },
          chat: chatDiag,
          dbInsert: { attempted: true, ok: false, error: msg },
        };
      }
    }

    // If not inserting
    return {
      env,
      categories: { count: categories.length },
      request: { model, messageCount: 2, totalContentLength },
      timings: { totalMs: Date.now() - t0, categoriesFetchMs: catEnd - catStart, chatCallMs },
      chat: chatDiag,
    };
  } catch (error) {
    chatCallMs = chatCallMs ?? 0;
    const isORE = error instanceof OpenRouterError;
    const isErr = error instanceof Error;
    const diag = {
      ok: false as const,
      errorName: isErr ? error.name : isORE ? "OpenRouterError" : typeof error,
      message: isErr ? error.message : String(error),
      code: isORE ? (error as OpenRouterError).code : undefined,
      statusCode: isORE ? (error as OpenRouterError).statusCode : undefined,
      retryable: isORE ? (error as OpenRouterError).retryable : undefined,
    };

    return {
      env,
      categories: { count: categories.length },
      request: { model, messageCount: 2, totalContentLength },
      timings: { totalMs: Date.now() - t0, categoriesFetchMs: catEnd - catStart, chatCallMs },
      chat: diag,
    };
  }
}

/**
 * Builds the system prompt for the AI categorization assistant.
 *
 * @param categories - User's available categories
 * @returns System prompt string
 */
function buildSystemPrompt(categories: CategoryDTO[]): string {
  const categoryList = categories.map((c) => `- ${c.name} (id: ${c.id})`).join("\n");

  return `You are a financial transaction categorization assistant.
Your task is to suggest the most appropriate category for a transaction based on its description, amount, and type.

Available categories:
${categoryList}

Respond with the category ID that best matches the transaction and your confidence score (0.0 to 1.0).`;
}

/**
 * Builds the user prompt containing transaction details.
 *
 * @param transaction - Transaction to categorize
 * @returns User prompt string
 */
function buildUserPrompt(transaction: TransactionForSuggestion): string {
  const amountFormatted = (transaction.amount_cents / 100).toFixed(2);

  return `Transaction Details:
- Description: ${transaction.description}
- Amount: $${amountFormatted}
- Type: ${transaction.transaction_type}

Select the most appropriate category from the list.`;
}
