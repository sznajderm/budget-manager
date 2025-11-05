import server from "@astrojs/cloudflare/entrypoints/server";
import type { Env, MessageBatch } from "@cloudflare/workers-types";
import type { Database } from "./db/database.types";
import { createClient } from "@supabase/supabase-js";
import { generateCategorySuggestion } from "./lib/services/ai-suggestion.service";
import type { SupabaseClient as SupabaseClientType } from "./db/supabase.client";

// Re-export Astro handler as default
export default server;

// Message type for AI suggestion jobs
interface AISuggestionJob {
  type: "ai-suggestion";
  userId: string;
  transaction: {
    id: string;
    description: string;
    amount_cents: number;
    transaction_type: "debit" | "credit" | "income" | "expense" | string;
  };
}

// Create Supabase service client (service role) for background processing
function createServiceSupabase(env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }) {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Cloudflare Queues consumer handler
export async function queue(
  batch: MessageBatch<string>,
  env: Env & { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
) {
  const supabase: SupabaseClientType = createServiceSupabase(env) as unknown as SupabaseClientType;

  for (const msg of batch.messages) {
    try {
      const job = JSON.parse(msg.body) as AISuggestionJob;
      if (job.type !== "ai-suggestion") {
        msg.ack();
        continue;
      }

      await generateCategorySuggestion(supabase, job.transaction, job.userId);

      msg.ack();
    } catch (err) {
      // Let the queue retry by not acking; you can also use msg.retry() for explicit control
      // For non-retryable errors, ack to drop the message or route to DLQ when configured
      // Here we rely on built-in retry/backoff
      // eslint-disable-next-line no-console
      console.error("Queue job failed:", err);
    }
  }
}
