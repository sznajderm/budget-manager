import type { APIRoute } from "astro";
import { getOpenRouterService } from "../../lib/services/openrouter.provider";
import { OpenRouterError } from "../../lib/services/openrouter.errors";

/**
 * API endpoint to verify OpenRouter integration.
 *
 * GET /api/verify-openrouter
 *
 * Returns test results for the OpenRouter service.
 */
export const GET: APIRoute = async () => {
  const results: { test: string; status: "pass" | "fail"; message: string; details?: unknown }[] = [];

  try {
    // Test 1: Service initialization
    let service;
    try {
      service = getOpenRouterService();
      results.push({
        test: "Service Initialization",
        status: "pass",
        message: "Service created successfully from environment variables",
      });
    } catch (error) {
      results.push({
        test: "Service Initialization",
        status: "fail",
        message: error instanceof Error ? error.message : "Failed to initialize service",
        details: error,
      });

      return new Response(
        JSON.stringify({
          success: false,
          results,
          summary: "Cannot proceed without service initialization",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Test 2: Response format validation
    try {
      const isValid = service.validateResponseFormat({
        type: "json_schema",
        json_schema: {
          name: "test",
          strict: true,
          schema: {
            type: "object",
            properties: { field: { type: "string" } },
            additionalProperties: false,
          },
        },
      });

      results.push({
        test: "Response Format Validation",
        status: isValid ? "pass" : "fail",
        message: isValid ? "Valid format accepted" : "Valid format rejected",
      });
    } catch (error) {
      results.push({
        test: "Response Format Validation",
        status: "fail",
        message: "Validation threw unexpected error",
        details: error instanceof Error ? error.message : error,
      });
    }

    // Test 3: Basic API call
    try {
      const response = await service.chat({
        messages: [{ role: "user", content: 'Say "OpenRouter integration verified!" and nothing else.' }],
        temperature: 0.3,
        max_tokens: 50,
      });

      results.push({
        test: "Basic Chat Completion",
        status: "pass",
        message: "API call successful",
        details: {
          model: response.model,
          content: response.choices[0].message.content,
          tokens: response.usage.total_tokens,
        },
      });
    } catch (error) {
      results.push({
        test: "Basic Chat Completion",
        status: "fail",
        message:
          error instanceof OpenRouterError
            ? `${error.code}: ${error.message}`
            : error instanceof Error
              ? error.message
              : "Unknown error",
        details:
          error instanceof OpenRouterError
            ? {
                code: error.code,
                statusCode: error.statusCode,
                retryable: error.retryable,
              }
            : error,
      });
    }

    // Test 4: Structured output
    try {
      const response = await service.chat({
        messages: [
          {
            role: "system",
            content: "You categorize transactions.",
          },
          {
            role: "user",
            content: 'Categorize: "Coffee shop purchase - $5.00"',
          },
        ],
        model: "openai/gpt-4o-mini", // Explicitly use a model that supports structured output
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "category",
            strict: true,
            schema: {
              type: "object",
              properties: {
                category: { type: "string" },
                confidence: { type: "number" },
              },
              required: ["category", "confidence"],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.2,
        max_tokens: 100,
      });

      const content = response.choices[0].message.content;

      // Check if content is empty
      if (!content || content.trim() === "") {
        results.push({
          test: "Structured Output (JSON Schema)",
          status: "fail",
          message: "Model returned empty content. This may indicate the model does not support structured output.",
          details: {
            model: response.model,
            content: content,
            note: "Consider using anthropic/claude-3.5-sonnet or openai/gpt-4 for structured output support",
          },
        });
      } else {
        const parsed = JSON.parse(content);

        results.push({
          test: "Structured Output (JSON Schema)",
          status: "pass",
          message: "Structured response parsed successfully",
          details: {
            model: response.model,
            result: parsed,
          },
        });
      }
    } catch (error) {
      results.push({
        test: "Structured Output (JSON Schema)",
        status: "fail",
        message: error instanceof Error ? error.message : "Failed to get structured output",
        details: {
          error: error instanceof Error ? error.message : error,
          note: "Structured output requires compatible models like anthropic/claude-3.5-sonnet or openai/gpt-4",
        },
      });
    }

    // Calculate summary
    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail").length;
    const allPassed = failed === 0;

    return new Response(
      JSON.stringify(
        {
          success: allPassed,
          results,
          summary: {
            total: results.length,
            passed,
            failed,
            message: allPassed
              ? "✅ All tests passed! OpenRouter integration is working correctly."
              : `❌ ${failed} test(s) failed. Check details above.`,
          },
        },
        null,
        2
      ),
      {
        status: allPassed ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          success: false,
          error: "Unexpected error during verification",
          details:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                }
              : error,
        },
        null,
        2
      ),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
