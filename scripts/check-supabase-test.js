/* eslint-disable no-console, no-undef */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

// Load envs from .env.test without printing any secret values
 loadEnv({ path: ".env.test" });

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_KEY;

  if (!url) {
    console.error("SUPABASE_URL is not set (from .env.test)");
    process.exit(2);
  }
  if (!serviceKey && !anonKey) {
    console.error("Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_KEY is set (from .env.test)");
    process.exit(2);
  }

  const usingServiceRole = Boolean(serviceKey);
  const key = usingServiceRole ? serviceKey : anonKey;

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Lightweight connectivity check: list 1 transaction row if table exists
    const { data, error } = await supabase.from("accounts").select("id");

    if (error && error.message) {
      throw error;
    }

    console.log("Supabase connection OK using", usingServiceRole ? "SERVICE_ROLE key" : "ANON key");
    console.log("Query succeeded, rows:", Array.isArray(data) ? data.length : 0);
    process.exit(0);
  } catch (err) {
    console.error("Supabase connection/query failed.");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
